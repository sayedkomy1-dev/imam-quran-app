import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  setLogLevel,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { TeacherAccessRecord } from '../types';

// Silence internal Firestore WebChannel/token retry console errors
setLogLevel('silent');

// Purge any stale cached Firebase Auth tokens in IndexedDB / Web Storage on startup
// so expired tokens never trigger securetoken.googleapis.com errors on boot
if (typeof window !== 'undefined') {
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('firebase:')) {
        window.localStorage.removeItem(k);
      }
    }
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith('firebase:')) {
        window.sessionStorage.removeItem(k);
      }
    }
    if (window.indexedDB && typeof window.indexedDB.deleteDatabase === 'function') {
      window.indexedDB.deleteDatabase('firebaseLocalStorageDb');
    }
  } catch {
    // ignore storage errors
  }
}

const app = initializeApp(firebaseConfig);

function createCleanAuth() {
  try {
    return initializeAuth(app, {
      persistence: inMemoryPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createCleanAuth();

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Verifies that the current Firebase user can obtain a valid ID token without
 * failing due to a disabled `securetoken.googleapis.com` API in the project.
 * If token fetching fails with `token-service-api-has-not-been-used`, signs out
 * immediately so Firestore's credentials provider is not poisoned.
 */
async function ensureHealthyAuthToken(user: FirebaseUser | null): Promise<boolean> {
  if (!user) return false;
  try {
    await user.getIdToken();
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('token-service-api-has-not-been-used') ||
      msg.includes('securetoken.googleapis.com') ||
      msg.includes('Fetching auth token failed')
    ) {
      try {
        await signOut(auth);
      } catch {
        // ignore signOut error
      }
      return false;
    }
    return false;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: rawMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  const isTransientOrTokenService =
    rawMessage.includes('the client is offline') ||
    rawMessage.includes('Could not reach Cloud Firestore backend') ||
    rawMessage.includes('token-service-api-has-not-been-used') ||
    rawMessage.includes('securetoken.googleapis.com') ||
    rawMessage.includes('Fetching auth token failed') ||
    rawMessage.includes('unavailable');
  if (!isTransientOrTokenService) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  try {
    if (auth.currentUser) {
      await ensureHealthyAuthToken(auth.currentUser);
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Gracefully operate in local/offline-first mode when unauthenticated or offline
  }
}
void testConnection();

export interface ExtendedFamilyFields {
  motherName?: string;
  grandfatherName?: string;
  grandmotherName?: string;
  uncleName?: string;
}

export interface GoogleAuthResult extends ExtendedFamilyFields {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
  isFirstGoogleLogin?: boolean;
}

/**
 * Persists or updates the authenticated user's profile in Firestore (`/user_profiles/{uid}`)
 * on first Google login (and subsequent updates), including extended family fields
 * (`motherName`, `grandfatherName`, `grandmotherName`, `uncleName`) linked to `uid`.
 */
export async function syncUserProfileToFirestore(
  user: FirebaseUser,
  role: 'teacher' | 'supervisor' | 'guardian' | 'student',
  family?: ExtendedFamilyFields
): Promise<ExtendedFamilyFields & { isFirstGoogleLogin: boolean }> {
  const cleanUid = (user.uid || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid) return { isFirstGoogleLogin: false };
  if (!(await ensureHealthyAuthToken(user))) {
    return {
      isFirstGoogleLogin: false,
      motherName: family?.motherName,
      grandfatherName: family?.grandfatherName,
      grandmotherName: family?.grandmotherName,
      uncleName: family?.uncleName,
    };
  }

  const safeDisplayName = (
    user.displayName ||
    user.email?.split('@')[0] ||
    'مستخدم أكاديمية الإمام'
  ).slice(0, 120);

  const path = `user_profiles/${cleanUid}`;
  const ref = doc(db, 'user_profiles', cleanUid);

  try {
    const existingSnap = await getDoc(ref);
    const isFirstGoogleLogin = !existingSnap.exists();
    const existingData = existingSnap.exists()
      ? (existingSnap.data() as Record<string, unknown>)
      : {};

    const mergedMother = (
      family?.motherName !== undefined && family.motherName.trim() !== ''
        ? family.motherName.trim()
        : typeof existingData.motherName === 'string'
        ? existingData.motherName
        : family?.motherName ?? ''
    ).slice(0, 120);
    const mergedGrandfather = (
      family?.grandfatherName !== undefined && family.grandfatherName.trim() !== ''
        ? family.grandfatherName.trim()
        : typeof existingData.grandfatherName === 'string'
        ? existingData.grandfatherName
        : family?.grandfatherName ?? ''
    ).slice(0, 120);
    const mergedGrandmother = (
      family?.grandmotherName !== undefined && family.grandmotherName.trim() !== ''
        ? family.grandmotherName.trim()
        : typeof existingData.grandmotherName === 'string'
        ? existingData.grandmotherName
        : family?.grandmotherName ?? ''
    ).slice(0, 120);
    const mergedUncle = (
      family?.uncleName !== undefined && family.uncleName.trim() !== ''
        ? family.uncleName.trim()
        : typeof existingData.uncleName === 'string'
        ? existingData.uncleName
        : family?.uncleName ?? ''
    ).slice(0, 120);

    if (isFirstGoogleLogin) {
      await setDoc(ref, {
        uid: cleanUid,
        displayName: safeDisplayName,
        role,
        motherName: mergedMother,
        grandfatherName: mergedGrandfather,
        grandmotherName: mergedGrandmother,
        uncleName: mergedUncle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        displayName: safeDisplayName,
        role,
        motherName: mergedMother,
        grandfatherName: mergedGrandfather,
        grandmotherName: mergedGrandmother,
        uncleName: mergedUncle,
        updatedAt: serverTimestamp(),
      });
    }

    return {
      isFirstGoogleLogin,
      motherName: mergedMother,
      grandfatherName: mergedGrandfather,
      grandmotherName: mergedGrandmother,
      uncleName: mergedUncle,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Syncs a Student or Teacher/Supervisor extended family record (`/family_records/{recordId}`)
 * linked to the authenticated user's Google UID (`ownerUid`) in Firestore.
 */
export async function syncExtendedFamilyRecordToFirestore(params: {
  recordId: string;
  entityType: 'student' | 'teacher' | 'supervisor';
  personName: string;
  motherName?: string;
  grandfatherName?: string;
  grandmotherName?: string;
  uncleName?: string;
}): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return false;
  if (!(await ensureHealthyAuthToken(currentUser))) return false;

  const cleanUid = currentUser.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const cleanRecordId = (params.recordId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 128);
  if (!cleanUid || !cleanRecordId) return false;

  const safePersonName = (params.personName || 'عضو الأكاديمية').slice(0, 120);
  const safeMother = (params.motherName || '').trim().slice(0, 120);
  const safeGrandfather = (params.grandfatherName || '').trim().slice(0, 120);
  const safeGrandmother = (params.grandmotherName || '').trim().slice(0, 120);
  const safeUncle = (params.uncleName || '').trim().slice(0, 120);

  const path = `family_records/${cleanRecordId}`;
  const ref = doc(db, 'family_records', cleanRecordId);

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        recordId: cleanRecordId,
        ownerUid: cleanUid,
        entityType: params.entityType,
        personName: safePersonName,
        motherName: safeMother,
        grandfatherName: safeGrandfather,
        grandmotherName: safeGrandmother,
        uncleName: safeUncle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        entityType: params.entityType,
        personName: safePersonName,
        motherName: safeMother,
        grandfatherName: safeGrandfather,
        grandmotherName: safeGrandmother,
        uncleName: safeUncle,
        updatedAt: serverTimestamp(),
      });
    }

    // Also mirror family fields onto the authenticated user's profile document
    await syncUserProfileToFirestore(
      currentUser,
      params.entityType === 'student' ? 'student' : params.entityType,
      {
        motherName: safeMother,
        grandfatherName: safeGrandfather,
        grandmotherName: safeGrandmother,
        uncleName: safeUncle,
      }
    );

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function buildEmailSnapshotId(email?: string): string {
  const clean = (email || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  if (!clean) return '';
  return `staff_${clean}`.slice(0, 120);
}

/**
 * Syncs academy cloud snapshot summary AND full serialized JSON backup payload (`payloadJson`)
 * for the authenticated user in `/academy_snapshots/{uid}` as well as `/academy_snapshots/{emailKey}`
 * and `/academy_snapshots/master_academy_backup` so any device logging in finds the Sheikh's students immediately.
 */
export async function syncAcademySnapshotToFirestore(params: {
  academyName: string;
  studentsCount: number;
  sessionsCount: number;
  teacherEmail?: string;
  backupPayload?: Record<string, unknown>;
}): Promise<boolean> {
  // Always mirror a local cloud-backup cache keyed by email for instant offline-first fallback
  if (typeof window !== 'undefined' && params.backupPayload) {
    try {
      const emailKey = buildEmailSnapshotId(
        params.teacherEmail || auth.currentUser?.email || 'master'
      );
      window.localStorage.setItem(
        `wlq_firestore_cloud_backup_${emailKey}`,
        JSON.stringify({
          syncedAt: new Date().toISOString(),
          payload: params.backupPayload,
        })
      );
      window.localStorage.setItem(
        'wlq_firestore_cloud_backup_master',
        JSON.stringify({
          syncedAt: new Date().toISOString(),
          payload: params.backupPayload,
        })
      );
    } catch {
      // ignore local storage quota
    }
  }

  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return false;
  if (!(await ensureHealthyAuthToken(currentUser))) return false;

  const cleanUid = currentUser.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid) return false;

  const safeAcademyName = (
    params.academyName || 'أكاديمية الإمام لتحفيظ القرآن الكريم'
  ).slice(0, 160);
  const safeStudentsCount = Math.max(
    0,
    Math.min(100000, Math.floor(params.studentsCount || 0))
  );
  const safeSessionsCount = Math.max(
    0,
    Math.min(1000000, Math.floor(params.sessionsCount || 0))
  );
  const safeTeacherEmail = (
    params.teacherEmail ||
    currentUser.email ||
    ''
  )
    .trim()
    .toLowerCase()
    .slice(0, 160);

  let serializedPayload = '';
  if (params.backupPayload) {
    try {
      const rawJson = JSON.stringify(params.backupPayload);
      if (rawJson.length <= 940000) {
        serializedPayload = rawJson;
      } else {
        // Trim heavy audio data URLs if needed to fit within Firestore 1MB document limit
        const slimPayload = {
          ...params.backupPayload,
          sessions: Array.isArray(params.backupPayload.sessions)
            ? (params.backupPayload.sessions as Record<string, unknown>[]).map(
                (ses) => ({
                  ...ses,
                  voiceNoteDataUrl: undefined,
                  memorizationAudioDataUrl: undefined,
                  teacherVoiceNotes: undefined,
                })
              )
            : [],
        };
        const slimJson = JSON.stringify(slimPayload);
        if (slimJson.length <= 940000) {
          serializedPayload = slimJson;
        }
      }
    } catch {
      serializedPayload = '';
    }
  }

  const targetDocIds = Array.from(
    new Set(
      [
        cleanUid,
        buildEmailSnapshotId(safeTeacherEmail),
        'master_academy_backup',
      ].filter(Boolean)
    )
  );

  let wroteAny = false;
  for (const docId of targetDocIds) {
    const path = `academy_snapshots/${docId}`;
    const ref = doc(db, 'academy_snapshots', docId);
    try {
      const existingSnap = await getDoc(ref);
      const baseFields: Record<string, unknown> = {
        ownerUid: cleanUid,
        teacherEmail: safeTeacherEmail,
        academyName: safeAcademyName,
        studentsCount: safeStudentsCount,
        sessionsCount: safeSessionsCount,
        schemaVersion: 12,
        updatedAt: serverTimestamp(),
      };
      if (serializedPayload) {
        baseFields.payloadJson = serializedPayload;
      }
      if (!existingSnap.exists()) {
        await setDoc(ref, {
          ...baseFields,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, baseFields);
      }
      wroteAny = true;
    } catch (error) {
      if (docId === cleanUid) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  }
  return wroteAny;
}

/**
 * Restores the latest academy/teacher backup payload from Firebase Cloud Firestore (`/academy_snapshots/{id}`)
 * when a Sheikh (Teacher), Supervisor, or Owner logs in from any device or triggers manual cloud restore.
 */
export async function fetchAcademyCloudBackupFromFirestore(
  teacherEmail?: string
): Promise<{
  source: 'firestore' | 'local_cloud_cache' | null;
  syncedAt?: string;
  payload: Record<string, unknown> | null;
}> {
  const emailKey = buildEmailSnapshotId(
    teacherEmail || auth.currentUser?.email || ''
  );
  const currentUser = auth.currentUser;

  if (currentUser && currentUser.emailVerified) {
    const healthy = await ensureHealthyAuthToken(currentUser);
    if (healthy) {
      const cleanUid = currentUser.uid
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 128);
      const candidateIds = Array.from(
        new Set(
          [cleanUid, emailKey, 'master_academy_backup'].filter(Boolean)
        )
      );

      for (const docId of candidateIds) {
        try {
          const snap = await getDoc(doc(db, 'academy_snapshots', docId));
          if (snap.exists()) {
            const data = snap.data() as Record<string, unknown>;
            if (
              typeof data.payloadJson === 'string' &&
              data.payloadJson.trim().startsWith('{')
            ) {
              const parsed = JSON.parse(data.payloadJson) as Record<
                string,
                unknown
              >;
              if (parsed && Array.isArray(parsed.students)) {
                return {
                  source: 'firestore',
                  syncedAt: new Date().toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  payload: parsed,
                };
              }
            }
          }
        } catch {
          // try next candidate docId
        }
      }
    }
  }

  // Fallback to local cloud backup cache if offline or Email+PIN login without active Firebase popup token
  if (typeof window !== 'undefined') {
    try {
      const cacheKeys = [
        emailKey ? `wlq_firestore_cloud_backup_${emailKey}` : '',
        'wlq_firestore_cloud_backup_master',
      ].filter(Boolean);
      for (const key of cacheKeys) {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const wrapper = JSON.parse(raw) as {
            syncedAt?: string;
            payload?: Record<string, unknown>;
          };
          if (wrapper?.payload && Array.isArray(wrapper.payload.students)) {
            return {
              source: 'local_cloud_cache',
              syncedAt: wrapper.syncedAt,
              payload: wrapper.payload,
            };
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return { source: null, payload: null };
}

/**
 * Creates or updates a Teacher/Supervisor registration in `/staff_registrations/{staffId}` in Firestore
 * so the Academy Owner can approve (`active`), suspend (`blocked`), or delete (`deleteDoc`) registrations.
 */
export async function syncStaffRegistrationToFirestore(
  record: TeacherAccessRecord
): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return false;
  if (!(await ensureHealthyAuthToken(currentUser))) return false;

  const cleanStaffId = (record.id || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 128);
  if (!cleanStaffId) return false;

  const safeGoogleUid = (record.googleUid || currentUser.uid || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 128);
  const safeName = (record.name || 'محفظ الأكاديمية').slice(0, 120);
  const safeEmail = (record.email || 'teacher@welivequran.com')
    .trim()
    .toLowerCase()
    .slice(0, 160);
  const safeRoleTitle = (record.roleTitle || 'محفظ الحلقات القرآنية').slice(
    0,
    160
  );
  const safeStaffRole: 'owner' | 'supervisor' | 'teacher' =
    record.staffRole === 'owner' || record.staffRole === 'supervisor'
      ? record.staffRole
      : 'teacher';
  const safeStatus: 'active' | 'blocked' | 'pending' =
    record.status === 'blocked' || record.status === 'pending'
      ? record.status
      : 'active';
  const safeCircles = Math.max(
    0,
    Math.min(100, Math.floor(record.assignedCirclesCount ?? 1))
  );
  const safeMother = (record.motherName || '').trim().slice(0, 120);
  const safeGrandfather = (record.grandfatherName || '').trim().slice(0, 120);
  const safeGrandmother = (record.grandmotherName || '').trim().slice(0, 120);
  const safeUncle = (record.uncleName || '').trim().slice(0, 120);
  const customPermissionsJson = JSON.stringify({
    customTeacherPermissions: record.customTeacherPermissions || null,
    customPermissions: record.customPermissions || null,
  }).slice(0, 3900);

  const path = `staff_registrations/${cleanStaffId}`;
  const ref = doc(db, 'staff_registrations', cleanStaffId);

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        staffId: cleanStaffId,
        googleUid: safeGoogleUid,
        name: safeName,
        email: safeEmail,
        roleTitle: safeRoleTitle,
        staffRole: safeStaffRole,
        status: safeStatus,
        assignedCirclesCount: safeCircles,
        motherName: safeMother,
        grandfatherName: safeGrandfather,
        grandmotherName: safeGrandmother,
        uncleName: safeUncle,
        customPermissionsJson,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        googleUid: safeGoogleUid,
        name: safeName,
        email: safeEmail,
        roleTitle: safeRoleTitle,
        staffRole: safeStaffRole,
        status: safeStatus,
        assignedCirclesCount: safeCircles,
        motherName: safeMother,
        grandfatherName: safeGrandfather,
        grandmotherName: safeGrandmother,
        uncleName: safeUncle,
        customPermissionsJson,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a Teacher or Supervisor registration document from `/staff_registrations/{staffId}` in Firestore.
 */
export async function deleteStaffRegistrationFromFirestore(
  staffId: string
): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return false;
  if (!(await ensureHealthyAuthToken(currentUser))) return false;

  const cleanStaffId = (staffId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanStaffId) return false;

  const path = `staff_registrations/${cleanStaffId}`;
  const ref = doc(db, 'staff_registrations', cleanStaffId);
  try {
    await deleteDoc(ref);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Syncs all current Teacher and Supervisor registrations to `/staff_registrations/{staffId}` in Firestore.
 */
export async function syncAllStaffRegistrationsToFirestore(
  records: TeacherAccessRecord[]
): Promise<number> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return 0;

  let syncedCount = 0;
  for (const rec of records) {
    try {
      const ok = await syncStaffRegistrationToFirestore(rec);
      if (ok) syncedCount += 1;
    } catch {
      // continue syncing remaining records
    }
  }
  return syncedCount;
}

/**
 * Real-time subscription to `/staff_registrations` in Firestore so the Owner Dashboard stays synced.
 */
export function subscribeToStaffRegistrationsFromFirestore(
  onUpdate: (records: TeacherAccessRecord[]) => void
): () => void {
  let unsubscribeSnapshot: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.emailVerified) return;
    const healthy = await ensureHealthyAuthToken(currentUser);
    if (!healthy || cancelled) return;

    const colRef = collection(db, 'staff_registrations');
    unsubscribeSnapshot = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) return;
        const list: TeacherAccessRecord[] = snapshot.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          let parsedCustomTeacherPerms: TeacherAccessRecord['customTeacherPermissions'] =
            undefined;
          let parsedCustomSupervisorPerms: TeacherAccessRecord['customPermissions'] =
            undefined;
          if (typeof data.customPermissionsJson === 'string' && data.customPermissionsJson.startsWith('{')) {
            try {
              const parsed = JSON.parse(data.customPermissionsJson) as Record<string, unknown>;
              if (parsed.customTeacherPermissions && typeof parsed.customTeacherPermissions === 'object') {
                parsedCustomTeacherPerms = parsed.customTeacherPermissions as TeacherAccessRecord['customTeacherPermissions'];
              }
              if (parsed.customPermissions && typeof parsed.customPermissions === 'object') {
                parsedCustomSupervisorPerms = parsed.customPermissions as TeacherAccessRecord['customPermissions'];
              }
            } catch {
              // ignore invalid JSON
            }
          }
          return {
            id: typeof data.staffId === 'string' ? data.staffId : d.id,
            googleUid:
              typeof data.googleUid === 'string' && data.googleUid
                ? data.googleUid
                : undefined,
            name: typeof data.name === 'string' ? data.name : 'محفظ الأكاديمية',
            email: typeof data.email === 'string' ? data.email : '',
            roleTitle:
              typeof data.roleTitle === 'string'
                ? data.roleTitle
                : 'محفظ الحلقات القرآنية',
            staffRole:
              data.staffRole === 'owner' || data.staffRole === 'supervisor'
                ? data.staffRole
                : 'teacher',
            status:
              data.status === 'blocked' || data.status === 'pending'
                ? data.status
                : 'active',
            assignedCirclesCount:
              typeof data.assignedCirclesCount === 'number'
                ? data.assignedCirclesCount
                : 1,
            lastSyncAt: new Date().toISOString().slice(0, 10),
            motherName:
              typeof data.motherName === 'string' && data.motherName
                ? data.motherName
                : undefined,
            grandfatherName:
              typeof data.grandfatherName === 'string' && data.grandfatherName
                ? data.grandfatherName
                : undefined,
            grandmotherName:
              typeof data.grandmotherName === 'string' && data.grandmotherName
                ? data.grandmotherName
                : undefined,
            uncleName:
              typeof data.uncleName === 'string' && data.uncleName
                ? data.uncleName
                : undefined,
            customTeacherPermissions: parsedCustomTeacherPerms,
            customPermissions: parsedCustomSupervisorPerms,
          };
        });
        onUpdate(list);
      },
      () => {
        // Ignore permission/offline errors when user is not signed in or token service is disabled
      }
    );
  })();

  return () => {
    cancelled = true;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}

/**
 * Launches the official Google Sign-In popup via Firebase Auth and on first login
 * saves extended family fields (`motherName`, `grandfatherName`, `grandmotherName`, `uncleName`)
 * into `/user_profiles/{uid}` in Firestore linked to the unique Google UID.
 */
export async function signInWithGooglePopup(
  role: 'teacher' | 'supervisor' | 'guardian' | 'student' = 'teacher',
  initialFamily?: ExtendedFamilyFields
): Promise<GoogleAuthResult> {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;
  const uid = user.uid;
  const email = user.email || '';
  const displayName = user.displayName || email.split('@')[0] || 'مستخدم Google';
  const photoURL = user.photoURL;
  const emailVerified = user.emailVerified;

  let loadedFamily: ExtendedFamilyFields & { isFirstGoogleLogin?: boolean } = {
    motherName: initialFamily?.motherName,
    grandfatherName: initialFamily?.grandfatherName,
    grandmotherName: initialFamily?.grandmotherName,
    uncleName: initialFamily?.uncleName,
  };

  if (emailVerified) {
    const tokenHealthy = await ensureHealthyAuthToken(user);
    if (tokenHealthy) {
      try {
        loadedFamily = await syncUserProfileToFirestore(user, role, initialFamily);
      } catch {
        // Non-blocking if rules/network are still warming up
      }
    }
  }

  return {
    uid,
    email,
    displayName,
    photoURL,
    emailVerified,
    isFirstGoogleLogin: loadedFamily.isFirstGoogleLogin ?? true,
    motherName: loadedFamily.motherName,
    grandfatherName: loadedFamily.grandfatherName,
    grandmotherName: loadedFamily.grandmotherName,
    uncleName: loadedFamily.uncleName,
  };
}

export async function signOutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // ignore signout error
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };

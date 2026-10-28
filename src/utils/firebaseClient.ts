import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
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
}

/**
 * Persists or updates the authenticated user's profile in Firestore (`/user_profiles/{uid}`)
 * including extended family fields (`motherName`, `grandfatherName`, `grandmotherName`, `uncleName`),
 * adhering strictly to `firebase-blueprint.json` and `firestore.rules`.
 */
export async function syncUserProfileToFirestore(
  user: FirebaseUser,
  role: 'teacher' | 'supervisor' | 'guardian' | 'student',
  family?: ExtendedFamilyFields
): Promise<ExtendedFamilyFields> {
  const cleanUid = (user.uid || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid) return {};

  const safeDisplayName = (
    user.displayName ||
    user.email?.split('@')[0] ||
    'مستخدم أكاديمية الإمام'
  ).slice(0, 120);

  const path = `user_profiles/${cleanUid}`;
  const ref = doc(db, 'user_profiles', cleanUid);

  try {
    const existingSnap = await getDoc(ref);
    const existingData = existingSnap.exists()
      ? (existingSnap.data() as Record<string, unknown>)
      : {};

    const mergedMother = (
      family?.motherName ??
      (typeof existingData.motherName === 'string' ? existingData.motherName : '')
    ).slice(0, 120);
    const mergedGrandfather = (
      family?.grandfatherName ??
      (typeof existingData.grandfatherName === 'string'
        ? existingData.grandfatherName
        : '')
    ).slice(0, 120);
    const mergedGrandmother = (
      family?.grandmotherName ??
      (typeof existingData.grandmotherName === 'string'
        ? existingData.grandmotherName
        : '')
    ).slice(0, 120);
    const mergedUncle = (
      family?.uncleName ??
      (typeof existingData.uncleName === 'string' ? existingData.uncleName : '')
    ).slice(0, 120);

    if (!existingSnap.exists()) {
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

/**
 * Syncs academy cloud snapshot summary for authenticated user in `/academy_snapshots/{uid}`.
 */
export async function syncAcademySnapshotToFirestore(params: {
  academyName: string;
  studentsCount: number;
  sessionsCount: number;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const cleanUid = currentUser.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!cleanUid) return;

  const safeAcademyName = (params.academyName || 'أكاديمية الإمام لتحفيظ القرآن الكريم').slice(
    0,
    160
  );
  const safeStudentsCount = Math.max(
    0,
    Math.min(100000, Math.floor(params.studentsCount || 0))
  );
  const safeSessionsCount = Math.max(
    0,
    Math.min(1000000, Math.floor(params.sessionsCount || 0))
  );

  const path = `academy_snapshots/${cleanUid}`;
  const ref = doc(db, 'academy_snapshots', cleanUid);

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        ownerUid: cleanUid,
        academyName: safeAcademyName,
        studentsCount: safeStudentsCount,
        sessionsCount: safeSessionsCount,
        schemaVersion: 12,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        academyName: safeAcademyName,
        studentsCount: safeStudentsCount,
        sessionsCount: safeSessionsCount,
        schemaVersion: 12,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Launches the official Google Sign-In popup via Firebase Auth and loads/syncs
 * extended family fields (`motherName`, `grandfatherName`, `grandmotherName`, `uncleName`).
 */
export async function signInWithGooglePopup(
  role: 'teacher' | 'supervisor' | 'guardian' | 'student' = 'teacher',
  initialFamily?: ExtendedFamilyFields
): Promise<GoogleAuthResult> {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;

  let loadedFamily: ExtendedFamilyFields = {};
  if (user.emailVerified) {
    try {
      loadedFamily = await syncUserProfileToFirestore(user, role, initialFamily);
    } catch {
      // Non-blocking if rules/network are still warming up
    }
  }

  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم Google',
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
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

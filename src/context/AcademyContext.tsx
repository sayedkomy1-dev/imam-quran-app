import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AcademySettings,
  AdmissionRequest,
  CircleGroup,
  ExamRecord,
  FiveFortressTaskKey,
  FoundationLevelNumber,
  GradeType,
  HomePracticeSubmission,
  IjazahRecord,
  OwnerAuditLogItem,
  OwnerEncouragementItem,
  PublicBookmarkCategory,
  PublicMushafBookmark,
  PublicVisitorWirdRecord,
  PublishedFamilyGuidanceNote,
  QuranRiwayah,
  SessionRecord,
  SmartBoardStroke,
  Student,
  StudentAccessibilityMode,
  StudentAccountStatus,
  StudentCustomMutashabih,
  StudentLevel,
  StudentPedagogicalProfile,
  TaskItem,
  TeacherAccessRecord,
  TeacherRatingRecord,
  TimestampAudioFeedbackPin,
  UserRole,
  WaqfImpactStats,
} from '../types';
import {
  INITIAL_CIRCLES,
  INITIAL_EXAMS,
  INITIAL_HOME_SUBMISSIONS,
  INITIAL_IJAZAHS,
  INITIAL_SESSIONS,
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_TASKS,
  INITIAL_TEACHER_RATINGS,
  getLocalDateString,
} from '../data/seedData';
import { SURAHS } from '../data/quranData';
import {
  UrgentAlertItem,
  computeTeacherAlerts,
  sendLocalPushNotification,
} from '../utils/notificationService';
import {
  ImamSessionRestore,
  SUPABASE_OFFICIAL_CONFIG,
  WLQSyncCore,
  canonicalJson,
} from '../utils/wlqSyncCore';

export type ActiveTab =
  | 'dashboard'
  | 'students'
  | 'session'
  | 'smartboard'
  | 'foundation'
  | 'tajweed'
  | 'circles'
  | 'exams'
  | 'struggling'
  | 'tasks'
  | 'finance'
  | 'broadcast'
  | 'resources'
  | 'public_mushaf'
  | 'settings';

interface AcademyStore {
  // Auth & Role
  isLoggedIn: boolean;
  userRole: UserRole;
  guardianStudentId: string | null;
  guardianSiblings: Student[];
  loginAsTeacher: () => void;
  loginAsGuardian: (phone: string, pin: string) => { ok: boolean; error?: string };
  loginAsGuardianDirect: (studentId: string) => void;
  loginAsGuest: () => void;
  logout: () => void;

  // Navigation & UI
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  quickSearchOpen: boolean;
  setQuickSearchOpen: (open: boolean) => void;

  // Entities
  students: Student[];
  sessions: SessionRecord[];
  circles: CircleGroup[];
  exams: ExamRecord[];
  ijazahs: IjazahRecord[];
  tasks: TaskItem[];
  settings: AcademySettings;
  boardStrokes: Record<string, SmartBoardStroke[]>;
  teacherRatings: TeacherRatingRecord[];
  homeSubmissions: HomePracticeSubmission[];
  admissionRequests: AdmissionRequest[];
  auditLogs: OwnerAuditLogItem[];
  managedTeachers: TeacherAccessRecord[];
  cloudSyncStatus: 'synced' | 'syncing' | 'local_ready';
  lastSyncTimestamp: string;
  triggerCloudSyncNow: () => void;
  updateTeacherAccessStatus: (
    teacherId: string,
    status: 'active' | 'blocked' | 'pending'
  ) => void;
  sessionReminderPreview: '1hour' | '60min' | 'now' | null;
  setSessionReminderPreview: (mode: '1hour' | '60min' | 'now' | null) => void;

  // Notifications
  teacherAlerts: UrgentAlertItem[];
  triggerPushReminderNow: () => Promise<void>;

  // Mutations
  saveStudent: (student: Omit<Student, 'id'> & { id?: string }) => Student;
  deleteStudent: (id: string) => void;
  setStudentAccountStatus: (
    studentId: string,
    status: StudentAccountStatus,
    reason?: string
  ) => void;
  updateErrorFollowUpStatus: (
    studentId: string,
    errorKeyOrId: string,
    outcome: 'mastered' | 'needs_review' | 'repeated' | 'needs_practice' | 'repeated_error'
  ) => void;
  saveSession: (session: Omit<SessionRecord, 'id' | 'createdAt'> & { id?: string }) => SessionRecord;
  saveCircle: (
    circle: Omit<CircleGroup, 'id'> & { id?: string },
    assignedStudentIds?: string[]
  ) => void;
  deleteCircle: (id: string) => void;
  assignStudentToCircle: (studentId: string, targetCircleName: string) => void;
  saveExam: (exam: Omit<ExamRecord, 'id'> & { id?: string }) => void;
  saveIjazah: (ijazah: Omit<IjazahRecord, 'id'> & { id?: string }) => void;
  saveTask: (task: Omit<TaskItem, 'id'> & { id?: string }) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateStudentFee: (
    studentId: string,
    month: string,
    status: 'مدفوع' | 'متأخر' | 'معفى',
    amount: number,
    method?: string,
    notes?: string
  ) => void;
  addDisciplineWarning: (
    studentId: string,
    level: 'تنبيه' | 'إنذار أول' | 'إنذار نهائي',
    reason: string
  ) => void;
  updateSettings: (partial: Partial<AcademySettings>) => void;
  saveBoardStrokes: (key: string, strokes: SmartBoardStroke[]) => void;
  saveTeacherRating: (rating: Omit<TeacherRatingRecord, 'id' | 'date'> & { date?: string }) => void;
  saveHomeSubmission: (
    submission: Omit<
      HomePracticeSubmission,
      'id' | 'date' | 'createdAt' | 'reviewed' | 'reviewedByTeacher'
    > & {
      date?: string;
      guardianNote?: string;
    }
  ) => void;
  markHomeSubmissionReviewed: (
    id: string,
    feedback?: string,
    grade?: GradeType,
    masteryScore?: number
  ) => void;
  reviewHomeSubmission: (
    id: string,
    feedback?: string,
    grade?: GradeType,
    masteryScore?: number
  ) => void;
  addTimestampPinToHomeSubmission: (
    submissionId: string,
    pin: {
      timestampSec?: number;
      second?: number;
      formattedTime?: string;
      category: TimestampAudioFeedbackPin['category'];
      ayahNumber?: number;
      word?: string;
      comment?: string;
      note?: string;
      linkedErrorId?: string;
      linkedErrorType?: TimestampAudioFeedbackPin['linkedErrorType'];
    }
  ) => void;
  submitAdmissionRequest: (
    req: Partial<AdmissionRequest> & {
      studentName: string;
      age: number;
      guardianName: string;
    }
  ) => AdmissionRequest;
  updateAdmissionRequestStatus: (
    id: string,
    status: AdmissionRequest['status'],
    notes?: string
  ) => void;
  approveAdmissionAsStudent: (id: string, targetCircleName?: string) => Student | null;
  recordAuditLog: (
    actionCategory: OwnerAuditLogItem['actionCategory'],
    summary: string,
    targetName?: string,
    actorRole?: OwnerAuditLogItem['actorRole']
  ) => void;
  updateStudentAccessibilityMode: (
    studentId: string,
    mode: StudentAccessibilityMode
  ) => void;
  addStudentXp: (studentId: string, deltaXp: number, reason?: string) => void;
  awardStudentBadge: (studentId: string, badgeTitle: string) => void;
  toggleStudentGoldenCrown: (studentId: string) => void;
  promoteStudentFoundationLevel: (
    studentId: string,
    passedLevel: FoundationLevelNumber,
    score?: number
  ) => void;
  toggleStudentFortressTask: (
    studentId: string,
    taskId: FiveFortressTaskKey,
    dateStr?: string
  ) => void;
  linkStudentStopToAyah: (studentId: string, surahId: number, ayah: number) => void;
  addStudentCustomMutashabih: (
    studentId: string,
    item: Partial<StudentCustomMutashabih>
  ) => void;
  deleteStudentCustomMutashabih: (studentId: string, mutashabihId: string) => void;
  updateCircleSubstituteAndSeason: (
    circleId: string,
    updates: Partial<CircleGroup>
  ) => void;
  studentAudioBlobs: Record<string, StudentAudioBlobRecord[]>;
  saveStudentAudioBlob: (input: {
    studentId: string;
    studentName: string;
    surahName: string;
    fromAyah: number;
    toAyah: number;
    durationSeconds: number;
    blob: Blob;
    dataUrl: string;
    studentNote: string;
  }) => Promise<StudentAudioBlobRecord>;
  loadStudentAudioBlobs: (studentId: string) => Promise<StudentAudioBlobRecord[]>;
  deleteStudentAudioBlob: (studentId: string, recordId: string) => Promise<void>;
  // Public Mushaf & Waqf Portal
  publicMushafPortalOpen: boolean;
  setPublicMushafPortalOpen: (open: boolean) => void;
  waqfImpactStats: WaqfImpactStats;
  publicVisitors: PublicVisitorWirdRecord[];
  currentPublicVisitorId: string;
  publicBookmarks: PublicMushafBookmark[];
  recordWaqfAmeenPrayer: (visitorId?: string) => void;
  recordPwaInstallEvent: () => void;
  recordOfflineDownloadEvent: () => void;
  savePublicBookmark: (
    bookmark: Omit<PublicMushafBookmark, 'id' | 'updatedAt'> & { id?: string }
  ) => void;
  deletePublicBookmark: (id: string) => void;
  updatePublicVisitorWird: (
    updates: Partial<PublicVisitorWirdRecord> & {
      pagesDelta?: number;
      completedKhatmahDelta?: number;
    }
  ) => void;
  sendOwnerVisitorEncouragement: (
    targetVisitorId: string | 'ALL',
    badgeTitle: string,
    message: string
  ) => void;
  markVisitorEncouragementRead: (visitorId: string, encouragementId: string) => void;
  saveStudentPedagogicalProfile: (
    studentId: string,
    profile: StudentPedagogicalProfile
  ) => void;
  publishFamilyGuidanceToGuardian: (
    studentId: string,
    note: {
      title: string;
      categoryLabel: string;
      bodyText: string;
      targetLetterOrSurah?: string;
    }
  ) => PublishedFamilyGuidanceNote;
  resetToSeedData: () => void;
  importFullBackup: (data: unknown) => boolean;
}

export interface StudentAudioBlobRecord {
  id: string;
  studentId: string;
  studentName: string;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  blob?: Blob;
  dataUrl: string;
  studentNote: string;
  createdAt: string;
  date?: string;
  recitationType?: string;
}

const STUDENT_AUDIO_IDB_NAME = 'wlq_student_audio_idb_v1';
const STUDENT_AUDIO_IDB_STORE = 'student_audio_blobs';

function openStudentAudioIndexedDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(STUDENT_AUDIO_IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STUDENT_AUDIO_IDB_STORE)) {
          const store = db.createObjectStore(STUDENT_AUDIO_IDB_STORE, {
            keyPath: 'id',
          });
          store.createIndex('by_studentId', 'studentId', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function persistAudioBlobToIdbAndLocalStorage(
  record: StudentAudioBlobRecord
): Promise<void> {
  // 1. Save raw Blob + metadata in IndexedDB
  const db = await openStudentAudioIndexedDB();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STUDENT_AUDIO_IDB_STORE, 'readwrite');
        tx.objectStore(STUDENT_AUDIO_IDB_STORE).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  // 2. Mirror serializable record (without raw Blob instance) to student's localStorage key
  try {
    const lsKey = `wlq_student_audio_blobs_${record.studentId}`;
    const raw = localStorage.getItem(lsKey);
    const existing: StudentAudioBlobRecord[] = raw ? JSON.parse(raw) : [];
    const serializable: StudentAudioBlobRecord = {
      ...record,
      blob: undefined,
    };
    const next = [
      serializable,
      ...existing.filter((item) => item.id !== record.id),
    ].slice(0, 15);
    localStorage.setItem(lsKey, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
}

async function fetchAudioBlobsFromIdbAndLocalStorage(
  studentId: string
): Promise<StudentAudioBlobRecord[]> {
  const results: StudentAudioBlobRecord[] = [];
  const seen = new Set<string>();

  const db = await openStudentAudioIndexedDB();
  if (db) {
    const idbItems = await new Promise<StudentAudioBlobRecord[]>((resolve) => {
      try {
        const tx = db.transaction(STUDENT_AUDIO_IDB_STORE, 'readonly');
        const store = tx.objectStore(STUDENT_AUDIO_IDB_STORE);
        const index = store.index('by_studentId');
        const req = index.getAll(IDBKeyRange.only(studentId));
        req.onsuccess = () =>
          resolve((req.result as StudentAudioBlobRecord[]) || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
    for (const item of idbItems) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        results.push(item);
      }
    }
  }

  try {
    const lsKey = `wlq_student_audio_blobs_${studentId}`;
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      const parsed = JSON.parse(raw) as StudentAudioBlobRecord[];
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id);
            results.push(item);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const STORAGE_KEY = 'imam_academy_pwa_store_v1';

const AcademyContext = createContext<AcademyStore | null>(null);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const restoredContext = useMemo(() => ImamSessionRestore.load(), []);
  const hasTrustedBoot = useMemo(() => {
    try {
      return !!localStorage.getItem(SUPABASE_OFFICIAL_CONFIG.trustStorageKey);
    } catch {
      return false;
    }
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => !!(restoredContext?.isLoggedIn || hasTrustedBoot)
  );
  const [userRole, setUserRole] = useState<UserRole>(
    () => (restoredContext?.userRole as UserRole) || 'teacher'
  );
  const [guardianStudentId, setGuardianStudentId] = useState<string | null>(
    () => restoredContext?.guardianStudentId || null
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    () => (restoredContext?.activeTab as ActiveTab) || 'dashboard'
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    () => restoredContext?.selectedStudentId || 'st-1'
  );
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [quickSearchOpen, setQuickSearchOpen] = useState<boolean>(false);

  const [sessionReminderPreview, setSessionReminderPreview] = useState<
    '1hour' | '60min' | 'now' | null
  >(null);

  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'synced' | 'syncing' | 'local_ready'
  >('synced');
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>(() =>
    new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  );

  // Load initial state from localStorage or seed
  const loadInitialState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.students) && parsed.students.length > 0) {
          const backfilledStudents = (parsed.students as Student[]).map((st) => {
            const seedMatch = INITIAL_STUDENTS.find((s) => s.id === st.id);
            return {
              ...st,
              foundationLevel: st.foundationLevel ?? seedMatch?.foundationLevel ?? (st.level === 'مبتدئ' ? 2 : 8),
              completedFoundationLevels:
                st.completedFoundationLevels ??
                seedMatch?.completedFoundationLevels ??
                (st.level === 'مبتدئ' ? [1] : [1, 2, 3, 4, 5, 6, 7, 8]),
              xpPoints: st.xpPoints ?? seedMatch?.xpPoints ?? 250,
              badges: st.badges ?? seedMatch?.badges ?? ['وسام الحضور المبكر'],
              hasGoldenCrown: st.hasGoldenCrown ?? seedMatch?.hasGoldenCrown ?? false,
              permanentMeetingUrl:
                st.permanentMeetingUrl ??
                seedMatch?.permanentMeetingUrl ??
                'https://meet.google.com/imam-academy-live',
              fiveFortressesLog: st.fiveFortressesLog ?? seedMatch?.fiveFortressesLog ?? {},
            };
          });
          return {
            students: backfilledStudents,
            sessions: (parsed.sessions || INITIAL_SESSIONS) as SessionRecord[],
            circles: (parsed.circles || INITIAL_CIRCLES) as CircleGroup[],
            exams: (parsed.exams || INITIAL_EXAMS) as ExamRecord[],
            ijazahs: (parsed.ijazahs || INITIAL_IJAZAHS) as IjazahRecord[],
            tasks: (parsed.tasks || INITIAL_TASKS) as TaskItem[],
            settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) } as AcademySettings,
            boardStrokes: (parsed.boardStrokes || {}) as Record<string, SmartBoardStroke[]>,
            teacherRatings: (parsed.teacherRatings || INITIAL_TEACHER_RATINGS) as TeacherRatingRecord[],
            homeSubmissions: (parsed.homeSubmissions || INITIAL_HOME_SUBMISSIONS) as HomePracticeSubmission[],
          };
        }
      }
    } catch {
      // fallback to seed
    }
    return {
      students: INITIAL_STUDENTS,
      sessions: INITIAL_SESSIONS,
      circles: INITIAL_CIRCLES,
      exams: INITIAL_EXAMS,
      ijazahs: INITIAL_IJAZAHS,
      tasks: INITIAL_TASKS,
      settings: INITIAL_SETTINGS,
      boardStrokes: {} as Record<string, SmartBoardStroke[]>,
      teacherRatings: INITIAL_TEACHER_RATINGS,
      homeSubmissions: INITIAL_HOME_SUBMISSIONS,
    };
  };

  const initial = loadInitialState();
  const [students, setStudents] = useState<Student[]>(
    initial.students.map((st, idx) => ({
      ...st,
      riwayah:
        st.riwayah ||
        (idx === 2
          ? 'ورش عن نافع'
          : idx === 4
          ? 'قالون عن نافع'
          : 'حفص عن عاصم'),
      accessibilityMode: st.accessibilityMode || 'standard',
    }))
  );
  const [sessions, setSessions] = useState<SessionRecord[]>(initial.sessions);
  const [circles, setCircles] = useState<CircleGroup[]>(initial.circles);
  const [exams, setExams] = useState<ExamRecord[]>(
    initial.exams.map((ex, i) => ({
      ...ex,
      verificationCode:
        ex.verificationCode || `IMAM-VER-${202600 + i + 1}`,
      riwayah: ex.riwayah || 'حفص عن عاصم',
    }))
  );
  const [ijazahs, setIjazahs] = useState<IjazahRecord[]>(
    initial.ijazahs.map((ij, i) => ({
      ...ij,
      verificationCode:
        ij.verificationCode || `IMAM-SANAD-${9000 + i + 1}`,
    }))
  );
  const [tasks, setTasks] = useState<TaskItem[]>(initial.tasks);
  const [settings, setSettings] = useState<AcademySettings>(initial.settings);
  const [boardStrokes, setBoardStrokes] = useState<Record<string, SmartBoardStroke[]>>(
    initial.boardStrokes
  );
  const [teacherRatings, setTeacherRatings] = useState<TeacherRatingRecord[]>(
    initial.teacherRatings
  );
  const [homeSubmissions, setHomeSubmissions] = useState<HomePracticeSubmission[]>(
    initial.homeSubmissions.map((sub, idx) => ({
      ...sub,
      timestampPins:
        sub.timestampPins && sub.timestampPins.length > 0
          ? sub.timestampPins
          : idx === 0
          ? [
              {
                id: 'pin-seed-1',
                timestampSec: 12,
                formattedTime: '00:12',
                category: 'تجويد',
                ayahNumber: sub.fromAyah,
                word: 'مِن شَرِّ',
                comment: 'أحسنت في الغنة، ولكن أتمّ زمن الإخفاء الحقيقي حركتين كاملتين.',
                createdAt: getLocalDateString(0),
              },
              {
                id: 'pin-seed-2',
                timestampSec: 28,
                formattedTime: '00:28',
                category: 'تشجيع',
                ayahNumber: sub.toAyah,
                comment: 'ما شاء الله! وقف معنوي متقن وأداء خاشع ومتميز.',
                createdAt: getLocalDateString(0),
              },
            ]
          : [],
    }))
  );

  const [admissionRequests, setAdmissionRequests] = useState<AdmissionRequest[]>([
    {
      id: 'adm-101',
      studentName: 'عمر عبد العزيز المغربي',
      age: 11,
      guardianName: 'أ. عبد العزيز المغربي',
      whatsappPhone: '201098765432',
      guardianPhone: '201098765432',
      countryAndTimezone: 'برلين / أوروبا الوسطى (GMT+1)',
      countryOrTimezone: 'برلين / أوروبا الوسطى (GMT+1)',
      preferredRiwayah: 'ورش عن نافع',
      requestedRiwayah: 'ورش عن نافع',
      currentLevel: 'متوسط',
      memorizedPartsSummary: 'يحفظ ثلاثة أجزاء (28، 29، 30)',
      preferredDaysAndTime: 'الأحد والثلاثاء والخميس — 18:00 بتوقيت الأكاديمية',
      preferredDays: 'الأحد - الثلاثاء - الخميس',
      preferredTime: '18:00',
      status: 'جديد',
      createdAt: getLocalDateString(0),
      notes: 'يرغب في الالتحاق بحلقة رواية ورش عن نافع مع تحديد مستوى.',
    },
    {
      id: 'adm-102',
      studentName: 'مريم طارق الأنصاري',
      age: 7,
      guardianName: 'د. طارق الأنصاري',
      whatsappPhone: '966501122334',
      guardianPhone: '966501122334',
      countryAndTimezone: 'مكة المكرمة / الرياض (GMT+3)',
      countryOrTimezone: 'مكة المكرمة / الرياض (GMT+3)',
      preferredRiwayah: 'حفص عن عاصم',
      requestedRiwayah: 'حفص عن عاصم',
      currentLevel: 'مبتدئ',
      memorizedPartsSummary: 'قصار السور وتحتاج منهج الإمام للتأسيس الهجين',
      preferredDaysAndTime: 'السبت والاثنين والأربعاء — 16:30 بتوقيت الأكاديمية',
      preferredDays: 'السبت - الاثنين - الأربعاء',
      preferredTime: '16:30',
      status: 'تم تحديد المستوى',
      createdAt: getLocalDateString(-1),
      notes: 'تم التواصل عبر واتساب الأكاديمية وجاهزة للقبول في حلقة الناشئة.',
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<OwnerAuditLogItem[]>([
    {
      id: 'aud-1',
      timestamp: `${getLocalDateString(0)} 09:30`,
      actorName: initial.settings.teacherName,
      actor: initial.settings.teacherName,
      actorRole: 'المالك / المشرف',
      actionCategory: 'شهادة وإجازة',
      category: 'إصدار شهادة أو إجازة',
      summary: 'توثيق إجازة قرآنية بالسند المتصل برواية حفص عن عاصم وإصدار كود التحقق الرقمي',
      details: 'توثيق إجازة قرآنية بالسند المتصل برواية حفص عن عاصم وإصدار كود التحقق الرقمي',
      targetName: initial.students[0]?.name || 'طالب بالأكاديمية',
    },
    {
      id: 'aud-2',
      timestamp: `${getLocalDateString(0)} 10:15`,
      actorName: initial.settings.teacherName,
      actor: initial.settings.teacherName,
      actorRole: 'المعلم',
      actionCategory: 'دفعة مالية وإيصال',
      category: 'سداد رسوم مالية',
      summary: 'تسجيل سداد اشتراك شهري وإصدار إيصال رقمي معتمد بختم الأكاديمية',
      details: 'تسجيل سداد اشتراك شهري وإصدار إيصال رقمي معتمد بختم الأكاديمية',
      targetName: initial.students[1]?.name || 'طالب بالأكاديمية',
    },
    {
      id: 'aud-3',
      timestamp: `${getLocalDateString(-1)} 19:40`,
      actorName: initial.settings.teacherName,
      actor: initial.settings.teacherName,
      actorRole: 'المالك / المشرف',
      actionCategory: 'تعديل طالب',
      category: 'تعديل بيانات طالب',
      summary: 'تحديث بيانات الرواية القرآنية وخطة الحفظ والربط في ملف الطالب',
      details: 'تحديث بيانات الرواية القرآنية وخطة الحفظ والربط في ملف الطالب',
      targetName: initial.students[2]?.name || 'طالب بالأكاديمية',
    },
  ]);

  const [managedTeachers, setManagedTeachers] = useState<TeacherAccessRecord[]>([
    {
      id: 'tch-owner-1',
      name: initial.settings.teacherName || 'الشيخ المقرئ المشرف العام',
      email: SUPABASE_OFFICIAL_CONFIG.ownerEmail,
      roleTitle: 'المالك والمشرف العام (Owner)',
      status: 'active',
      lastSyncAt: getLocalDateString(0),
      assignedCirclesCount: 3,
    },
    {
      id: 'tch-2',
      name: 'الشيخ عبد الرحمن القارئ (محفظ الإتقان)',
      email: 'abdulrahman.teacher@welivequran.com',
      roleTitle: 'معلم حلقات الحفظ والمراجعة',
      status: 'active',
      lastSyncAt: getLocalDateString(0),
      assignedCirclesCount: 2,
    },
    {
      id: 'tch-3',
      name: 'الشيخ محمود الشافعي (معلم التأسيس)',
      email: 'mahmoud.foundation@welivequran.com',
      roleTitle: 'معلم منهج الإمام للتأسيس الهجين',
      status: 'pending',
      lastSyncAt: getLocalDateString(-1),
      assignedCirclesCount: 1,
    },
  ]);

  const recordAuditLog = (
    actionCategory: OwnerAuditLogItem['actionCategory'],
    summary: string,
    targetName?: string,
    actorRole: OwnerAuditLogItem['actorRole'] = 'المالك / المشرف'
  ) => {
    const now = new Date();
    const timeStr = `${getLocalDateString(0)} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const entry: OwnerAuditLogItem = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeStr,
      actorName: settings.teacherName,
      actor: settings.teacherName,
      actorRole,
      actionCategory,
      category: actionCategory,
      summary,
      details: summary,
      targetName,
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 99)]);
  };

  const updateTeacherAccessStatus = (
    teacherId: string,
    status: 'active' | 'blocked' | 'pending'
  ) => {
    setManagedTeachers((prev) =>
      prev.map((t) =>
        t.id === teacherId
          ? { ...t, status, lastSyncAt: getLocalDateString(0) }
          : t
      )
    );
    const target = managedTeachers.find((t) => t.id === teacherId);
    recordAuditLog(
      'صلاحيات وأمان',
      `تحديث حالة صلاحية المعلم (${target?.name || teacherId}) إلى (${status})`,
      target?.name || teacherId
    );
    showToast(
      `تم تحديث صلاحية المعلم (${target?.name || ''}) إلى (${
        status === 'active'
          ? 'نشط ✓'
          : status === 'blocked'
          ? 'محظور ⛔'
          : 'قيد المراجعة ⏳'
      })`,
      status === 'blocked' ? 'error' : 'success'
    );
  };

  // Instant Session Restore (150ms debounced + visibilitychange)
  useEffect(() => {
    ImamSessionRestore.saveDebounced({
      activeTab,
      selectedStudentId,
      userRole,
      guardianStudentId,
      isLoggedIn,
      updatedAt: Date.now(),
    });
  }, [activeTab, selectedStudentId, userRole, guardianStudentId, isLoggedIn]);

  useEffect(() => {
    const saveNow = () => {
      ImamSessionRestore.saveImmediate({
        activeTab,
        selectedStudentId,
        userRole,
        guardianStudentId,
        isLoggedIn,
        updatedAt: Date.now(),
      });
    };
    const handleVis = () => {
      if (document.visibilityState === 'hidden') {
        saveNow();
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('pagehide', saveNow);
    return () => {
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('pagehide', saveNow);
    };
  }, [activeTab, selectedStudentId, userRole, guardianStudentId, isLoggedIn]);

  // 25s Debounced Auto-Roster Sync via WLQSyncCore + canonicalJson
  const lastRosterHashRef = useRef<string>('');
  const triggerCloudSyncNow = () => {
    setCloudSyncStatus('syncing');
    const safeRoster = WLQSyncCore.buildSafeSupervisorRoster(students, circles);
    const currentHash = canonicalJson(safeRoster);
    lastRosterHashRef.current = currentHash;
    try {
      localStorage.setItem(
        'wlq_supervisor_safe_roster_v12',
        JSON.stringify({
          schemaVersion: SUPABASE_OFFICIAL_CONFIG.schemaVersion,
          appVersion: SUPABASE_OFFICIAL_CONFIG.appVersion,
          ownerEmail: SUPABASE_OFFICIAL_CONFIG.ownerEmail,
          syncedAt: new Date().toISOString(),
          roster: safeRoster,
        })
      );
    } catch {
      // ignore storage quota
    }
    setTimeout(() => {
      setCloudSyncStatus('synced');
      setLastSyncTimestamp(
        new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }, 300);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const safeRoster = WLQSyncCore.buildSafeSupervisorRoster(students, circles);
      const nextHash = canonicalJson(safeRoster);
      if (nextHash !== lastRosterHashRef.current) {
        triggerCloudSyncNow();
      }
    }, 25000);
    return () => window.clearTimeout(timer);
  }, [students, circles, sessions, tasks]);

  // Sync to localStorage & IndexedDB on change
  useEffect(() => {
    const payload = {
      students,
      sessions,
      circles,
      exams,
      ijazahs,
      tasks,
      settings,
      boardStrokes,
      teacherRatings,
      homeSubmissions,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }

    // Also mirror to IndexedDB for durable Offline-First persistence
    if (typeof indexedDB !== 'undefined') {
      try {
        const req = indexedDB.open('ImamAcademyDB', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('state')) {
            db.createObjectStore('state', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          if (db.objectStoreNames.contains('state')) {
            const tx = db.transaction('state', 'readwrite');
            tx.objectStore('state').put({ id: 'root', ...payload });
          }
        };
      } catch {
        // ignore IDB errors
      }
    }
  }, [students, sessions, circles, exams, ijazahs, tasks, settings, boardStrokes, teacherRatings, homeSubmissions]);

  // Apply Dark / Light / Sepia Mode & Font Size to HTML document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-theme', settings.theme || 'light');
    root.setAttribute('data-font-size', settings.fontSize || 'md');
  }, [settings.theme, settings.fontSize]);

  // Global Ctrl+K shortcut for Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  // Compute active teacher alerts (overdue tasks + urgent follow-up students)
  const teacherAlerts = useMemo(
    () =>
      computeTeacherAlerts(students, sessions, tasks, {
        notifyOverdueTasks: settings.notifyOverdueTasks ?? true,
        notifyUrgentStudents: settings.notifyUrgentStudents ?? true,
      }),
    [
      students,
      sessions,
      tasks,
      settings.notifyOverdueTasks,
      settings.notifyUrgentStudents,
    ]
  );

  // Register push service worker and listen for notification click events from SW
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'NOTIFICATION_CLICKED') {
        if (data.studentId) {
          setSelectedStudentId(data.studentId);
        }
        if (data.targetTab) {
          setActiveTab(data.targetTab as ActiveTab);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const triggerPushReminderNow = async () => {
    if (!settings.notificationsEnabled) {
      showToast('التنبيهات المحلية متوقفة حالياً من الإعدادات', 'info');
      return;
    }

    const overdueCount = teacherAlerts.filter(
      (a) => a.category === 'overdue_task'
    ).length;
    const urgentStudentCount = teacherAlerts.filter(
      (a) => a.category === 'urgent_student'
    ).length;

    if (overdueCount === 0 && urgentStudentCount === 0) {
      await sendLocalPushNotification({
        title: 'أكاديمية الإمام لتحفيظ القرآن الكريم',
        body: 'جميع المهام والمتابعات مكتملة بحمد الله! لا توجد مهام متأخرة حالياً.',
        tag: 'imam-academy-all-clear',
        targetTab: 'dashboard',
        notificationsEnabled: settings.notificationsEnabled,
      });
      showToast('جميع المهام والمتابعات مكتملة ولا توجد تنبيهات متأخرة', 'success');
      return;
    }

    const parts: string[] = [];
    if (overdueCount > 0) {
      parts.push(`${overdueCount} مهام متأخرة أو مستحقة اليوم`);
    }
    if (urgentStudentCount > 0) {
      parts.push(`${urgentStudentCount} طلاب يحتاجون متابعة عاجلة`);
    }

    const topItem = teacherAlerts[0];
    const targetTab: ActiveTab =
      topItem?.category === 'overdue_task' ? 'tasks' : 'struggling';
    const title = `تنبيه المتابعة — ${parts.join(' و ')}`;
    const body = topItem
      ? `${topItem.title}\n${topItem.body}`
      : 'يرجى مراجعة قسم المهام والطلاب المتعثرين.';

    const sentBrowserNotif = await sendLocalPushNotification({
      title,
      body,
      tag: 'imam-academy-reminder',
      targetTab,
      studentId: topItem?.studentId || null,
      notificationsEnabled: settings.notificationsEnabled,
      onClick: () => {
        if (topItem?.studentId) {
          setSelectedStudentId(topItem.studentId);
        }
        setActiveTab(targetTab);
      },
    });

    if (sentBrowserNotif) {
      showToast(`تم إرسال إشعار المتصفح: ${parts.join(' + ')}`, 'info');
    } else {
      showToast(`تنبيه محلي: لديك ${parts.join(' و ')}`, 'info');
    }
  };

  // Automatic local push notification on teacher login and periodic interval
  const hasNotifiedOnSessionRef = useRef(false);
  useEffect(() => {
    if (!isLoggedIn || userRole !== 'teacher' || !settings.notificationsEnabled) {
      return;
    }

    if (!hasNotifiedOnSessionRef.current && teacherAlerts.length > 0) {
      hasNotifiedOnSessionRef.current = true;
      const timer = setTimeout(() => {
        void triggerPushReminderNow();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, userRole, settings.notificationsEnabled, teacherAlerts.length]);

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'teacher' || !settings.notificationsEnabled) {
      return;
    }
    const intervalMs = Math.max(5, settings.reminderIntervalMinutes || 30) * 60 * 1000;
    const id = setInterval(() => {
      if (teacherAlerts.length > 0) {
        void triggerPushReminderNow();
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [
    isLoggedIn,
    userRole,
    settings.notificationsEnabled,
    settings.reminderIntervalMinutes,
    teacherAlerts.length,
  ]);

  const loginAsTeacher = () => {
    hasNotifiedOnSessionRef.current = false;
    setUserRole('teacher');
    setIsLoggedIn(true);
    setActiveTab('dashboard');
    try {
      localStorage.setItem(
        SUPABASE_OFFICIAL_CONFIG.trustStorageKey,
        JSON.stringify({
          role: 'teacher',
          email: SUPABASE_OFFICIAL_CONFIG.ownerEmail,
          trustedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore storage errors
    }
    showToast('مرحباً بك في منصة المعلم والمشرف — أكاديمية الإمام', 'success');
  };

  const loginAsGuardian = (phone: string, pin: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    const matched = students.find(
      (s) =>
        (s.accountStatus ?? 'نشط') !== 'مؤرشف' &&
        (s.whatsappPhone.endsWith(cleanDigits.slice(-9)) || s.whatsappPhone === cleanDigits) &&
        s.guardianPin === pin.trim()
    );
    if (!matched) {
      return { ok: false, error: 'رقم الهاتف أو رمز الدخول (PIN) غير صحيح، أو الحساب مؤرشف.' };
    }
    setGuardianStudentId(matched.id);
    setSelectedStudentId(matched.id);
    setUserRole('guardian');
    setIsLoggedIn(true);
    showToast(`مرحباً بولي أمر الطالب: ${matched.name}`, 'success');
    return { ok: true };
  };

  // All active siblings linked to the guardian's phone number (hiding archived siblings automatically)
  const guardianSiblings = useMemo(() => {
    const primary =
      students.find((s) => s.id === guardianStudentId) ||
      students.find((s) => s.id === selectedStudentId);
    if (!primary) return students.filter((s) => (s.accountStatus ?? 'نشط') !== 'مؤرشف');
    const tail = primary.whatsappPhone.replace(/\D/g, '').slice(-9);
    const siblings = students.filter(
      (s) =>
        (s.accountStatus ?? 'نشط') !== 'مؤرشف' &&
        (s.whatsappPhone === primary.whatsappPhone ||
          (tail.length >= 8 && s.whatsappPhone.endsWith(tail)))
    );
    return siblings.length > 0 ? siblings : [primary];
  }, [students, guardianStudentId, selectedStudentId]);

  const loginAsGuardianDirect = (studentId: string) => {
    const found = students.find((s) => s.id === studentId) || students[0];
    if (found) {
      setGuardianStudentId(found.id);
      setSelectedStudentId(found.id);
      setUserRole('guardian');
      setIsLoggedIn(true);
      showToast(`تم فتح بوابة ولي الأمر للطالب: ${found.name}`, 'info');
    }
  };

  const loginAsGuest = () => {
    setUserRole('guest');
    setIsLoggedIn(true);
    showToast('مرحباً بك في مركز التحفيظ الحر والتلاوة', 'info');
  };

  const logout = () => {
    setIsLoggedIn(false);
    setGuardianStudentId(null);
    ImamSessionRestore.clear();
    try {
      localStorage.removeItem(SUPABASE_OFFICIAL_CONFIG.trustStorageKey);
    } catch {
      // ignore
    }
  };

  const saveStudent = (studentInput: Omit<Student, 'id'> & { id?: string }): Student => {
    if (studentInput.id) {
      let updated!: Student;
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === studentInput.id) {
            updated = {
              ...s,
              ...studentInput,
              accountStatus: studentInput.accountStatus ?? s.accountStatus ?? 'نشط',
              id: s.id,
            };
            return updated;
          }
          return s;
        })
      );
      showToast('تم تحديث بيانات الطالب بنجاح', 'success');
      recordAuditLog(
        'تعديل طالب',
        `تعديل بيانات الطالب (${studentInput.name}) — المستوى: ${studentInput.level} — الرواية: ${studentInput.riwayah || 'حفص عن عاصم'}`,
        studentInput.name
      );
      return updated;
    } else {
      const newStudent: Student = {
        ...studentInput,
        riwayah: studentInput.riwayah || 'حفص عن عاصم',
        accountStatus: studentInput.accountStatus ?? 'نشط',
        id: `st-${Date.now()}`,
      };
      setStudents((prev) => [newStudent, ...prev]);
      showToast('تمت إضافة الطالب الجديد بنجاح', 'success');
      recordAuditLog(
        'تعديل طالب',
        `إضافة ملف طالب جديد (${newStudent.name}) في ${newStudent.circle}`,
        newStudent.name
      );
      return newStudent;
    }
  };

  const setStudentAccountStatus = (
    studentId: string,
    status: StudentAccountStatus,
    reason?: string
  ) => {
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? {
              ...st,
              accountStatus: status,
              archivedAt: status === 'مؤرشف' ? getLocalDateString(0) : undefined,
              archiveReason: status === 'مؤرشف' ? reason || 'أرشفة آمنة مع حفظ السجل الكامل' : undefined,
            }
          : st
      )
    );
    const stName = students.find((s) => s.id === studentId)?.name || 'الطالب';
    recordAuditLog(
      'أرشفة وحالة ملف',
      `تغيير حالة ملف الطالب (${stName}) إلى (${status}) — ${reason || 'إجراء إداري'}`,
      stName
    );
    if (status === 'مؤرشف') {
      showToast(
        `تمت أرشفة الطالب (${stName}) بأمان وإخفاؤه من القوائم النشطة مع الاحتفاظ بكامل سجل حصصه وأخطائه`,
        'info'
      );
    } else if (status === 'متوقف') {
      showToast(`تم تحويل حالة الطالب (${stName}) إلى متوقف مؤقتاً`, 'info');
    } else {
      showToast(`تمت إعادة تفعيل الطالب (${stName}) واستعادة كامل سجله التاريخي وربطه العائلي`, 'success');
    }
  };

  const updateErrorFollowUpStatus = (
    studentId: string,
    errorKeyOrId: string,
    outcome: 'mastered' | 'needs_review' | 'repeated' | 'needs_practice' | 'repeated_error'
  ) => {
    const normalizedOutcome =
      outcome === 'needs_practice'
        ? 'needs_review'
        : outcome === 'repeated_error'
        ? 'repeated'
        : outcome;
    const todayStr = getLocalDateString(0);
    setSessions((prev) =>
      prev.map((ses) => {
        if (ses.studentId !== studentId) return ses;
        const hasMatch = (ses.errors || []).some(
          (e) => e.id === errorKeyOrId || (e.compositeKey && e.compositeKey === errorKeyOrId)
        );
        if (!hasMatch) return ses;
        return {
          ...ses,
          errors: ses.errors.map((e) => {
            if (e.id !== errorKeyOrId && (!e.compositeKey || e.compositeKey !== errorKeyOrId)) {
              return e;
            }
            if (normalizedOutcome === 'mastered') {
              return { ...e, followUpStatus: 'mastered', lastReviewedDate: todayStr };
            }
            if (normalizedOutcome === 'needs_review') {
              return { ...e, followUpStatus: 'needs_review', lastReviewedDate: todayStr };
            }
            return {
              ...e,
              followUpStatus: 'open',
              repeatCount: (e.repeatCount || 1) + 1,
              lastReviewedDate: todayStr,
            };
          }),
        };
      })
    );
    showToast(
      normalizedOutcome === 'mastered'
        ? 'تم اعتماد إتقان الموضع وإغلاق متابعة الخطأ مع حفظه في السجل التاريخي ✓'
        : normalizedOutcome === 'needs_review'
        ? 'تم إبقاء الخطأ مفتوحاً للمتابعة والتثبيت في الحصة القادمة'
        : 'تم تسجيل تكرار الخطأ (+1) وإبقاؤه في قائمة المتابعة العاجلة',
      normalizedOutcome === 'mastered' ? 'success' : 'info'
    );
  };

  // Safe default behavior: deleteStudent archives the student unless already archived, then records Tombstone
  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    if (target && (target.accountStatus ?? 'نشط') !== 'مؤرشف') {
      setStudentAccountStatus(id, 'مؤرشف', 'أرشفة آمنة لحماية السجل التاريخي من الحذف العشوائي');
      return;
    }
    WLQSyncCore.markTombstone(id, 'student');
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setSessions((prev) => prev.filter((ses) => ses.studentId !== id));
    showToast('تم حذف ملف الطالب المؤرشف نهائياً وتسجيل Tombstone لمنع عودته في المزامنة', 'info');
  };

  const saveSession = (
    sessionInput: Omit<SessionRecord, 'id' | 'createdAt'> & { id?: string }
  ): SessionRecord => {
    const existingIndex = sessions.findIndex(
      (s) =>
        (sessionInput.id && s.id === sessionInput.id) ||
        (s.studentId === sessionInput.studentId && s.date === sessionInput.date)
    );

    const record: SessionRecord = {
      ...sessionInput,
      id:
        existingIndex >= 0
          ? sessions[existingIndex].id
          : sessionInput.id || `ses-${Date.now()}`,
      createdAt:
        existingIndex >= 0 ? sessions[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      setSessions((prev) => prev.map((s, idx) => (idx === existingIndex ? record : s)));
    } else {
      setSessions((prev) => [record, ...prev]);
    }

    // Update student's currentStop, memorizedSurahs, and memorizedJuz if present
    if (record.status === 'حضر') {
      const surahMeta = record.newMemorization?.enabled
        ? SURAHS.find((s) => s.id === record.newMemorization!.surahId)
        : undefined;
      const completedJuzFromSession = record.juzReview?.enabled
        ? record.juzReview.items
            .filter((item) => item.scope === 'full')
            .map((item) => item.juzNumber)
        : [];

      if (surahMeta || completedJuzFromSession.length > 0) {
        setStudents((prev) =>
          prev.map((st) => {
            if (st.id !== record.studentId) return st;

            let newMemorizedSurahs = st.memorizedSurahs;
            let newCurrentStop = st.currentStop;

            if (surahMeta && record.newMemorization) {
              const isCompleted =
                record.newMemorization.isFullSurah ||
                record.newMemorization.toAyah >= surahMeta.ayahs;
              if (isCompleted) {
                newMemorizedSurahs = Array.from(
                  new Set([...st.memorizedSurahs, surahMeta.id])
                );
              }
              newCurrentStop = {
                surahId: surahMeta.id,
                surahName: surahMeta.name,
                ayah: record.newMemorization.toAyah,
                juzNumber: surahMeta.juz,
              };
            }

            const newMemorizedJuz =
              completedJuzFromSession.length > 0
                ? Array.from(
                    new Set([...st.memorizedJuz, ...completedJuzFromSession])
                  ).sort((a, b) => a - b)
                : st.memorizedJuz;

            return {
              ...st,
              memorizedSurahs: newMemorizedSurahs,
              memorizedJuz: newMemorizedJuz,
              currentStop: newCurrentStop,
            };
          })
        );
      }
    }

    showToast('تم حفظ الحصة وتحديث سجل الطالب بنجاح', 'success');
    return record;
  };

  const saveCircle = (
    circleInput: Omit<CircleGroup, 'id'> & { id?: string },
    assignedStudentIds?: string[]
  ) => {
    const existingCircle = circleInput.id
      ? circles.find((c) => c.id === circleInput.id)
      : undefined;
    const oldName = existingCircle?.name;
    const newName = circleInput.name.trim();

    if (circleInput.id) {
      setCircles((prev) =>
        prev.map((c) =>
          c.id === circleInput.id ? { ...circleInput, name: newName, id: c.id } : c
        )
      );
    } else {
      setCircles((prev) => [
        ...prev,
        { ...circleInput, name: newName, id: `cir-${Date.now()}` },
      ]);
    }

    if (assignedStudentIds) {
      const assignedSet = new Set(assignedStudentIds);
      const fallbackCircle =
        circles.find((c) => c.id !== circleInput.id && c.name !== newName)?.name ||
        newName;
      setStudents((prev) =>
        prev.map((st) => {
          if (assignedSet.has(st.id)) {
            return { ...st, circle: newName };
          }
          if (oldName && st.circle === oldName) {
            return { ...st, circle: fallbackCircle };
          }
          return st;
        })
      );
    } else if (oldName && oldName !== newName) {
      setStudents((prev) =>
        prev.map((st) => (st.circle === oldName ? { ...st, circle: newName } : st))
      );
    }

    showToast(
      circleInput.id
        ? `تم تحديث بيانات "${newName}" وتوزيع الطلاب بنجاح`
        : `تم إنشاء "${newName}" وتوزيع الطلاب بنجاح`,
      'success'
    );
  };

  const deleteCircle = (id: string) => {
    const target = circles.find((c) => c.id === id);
    if (!target) return;
    if (circles.length <= 1) {
      showToast('لا يمكن حذف الحلقة الوحيدة المتبقية في الأكاديمية', 'error');
      return;
    }
    const fallbackCircleName =
      circles.find((c) => c.id !== id)?.name || circles[0].name;

    setCircles((prev) => prev.filter((c) => c.id !== id));
    setStudents((prev) =>
      prev.map((st) =>
        st.circle === target.name ? { ...st, circle: fallbackCircleName } : st
      )
    );
    showToast(
      `تم حذف "${target.name}" ونقل طلابها إلى "${fallbackCircleName}"`,
      'info'
    );
  };

  const assignStudentToCircle = (studentId: string, targetCircleName: string) => {
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId ? { ...st, circle: targetCircleName } : st
      )
    );
    const stName = students.find((s) => s.id === studentId)?.name || 'الطالب';
    showToast(`تم نقل ${stName} إلى ${targetCircleName}`, 'success');
  };

  const saveExam = (examInput: Omit<ExamRecord, 'id'> & { id?: string }) => {
    const verificationCode =
      examInput.verificationCode ||
      `IMAM-VER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (examInput.id) {
      setExams((prev) =>
        prev.map((ex) =>
          ex.id === examInput.id
            ? { ...examInput, verificationCode, id: ex.id }
            : ex
        )
      );
    } else {
      setExams((prev) => [
        { ...examInput, verificationCode, id: `ex-${Date.now()}` },
        ...prev,
      ]);
    }
    const stName =
      students.find((s) => s.id === examInput.studentId)?.name || 'الطالب';
    recordAuditLog(
      'شهادة وإجازة',
      `اعتماد اختبار (${examInput.targetTitle}) بدرجة ${examInput.score}% وكود تحقق ${verificationCode}`,
      stName
    );
    showToast('تم حفظ سجل الاختبار القرآني وتوليد كود التحقق الرقمي', 'success');
  };

  const saveIjazah = (ijazahInput: Omit<IjazahRecord, 'id'> & { id?: string }) => {
    const verificationCode =
      ijazahInput.verificationCode ||
      `IMAM-SANAD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (ijazahInput.id) {
      setIjazahs((prev) =>
        prev.map((ij) =>
          ij.id === ijazahInput.id
            ? { ...ijazahInput, verificationCode, id: ij.id }
            : ij
        )
      );
    } else {
      setIjazahs((prev) => [
        { ...ijazahInput, verificationCode, id: `ij-${Date.now()}` },
        ...prev,
      ]);
    }
    const stName =
      students.find((s) => s.id === ijazahInput.studentId)?.name || 'الطالب';
    recordAuditLog(
      'شهادة وإجازة',
      `توثيق إجازة وسند (${ijazahInput.riwayah}) برقم ${ijazahInput.certificateNumber} وكود تحقق ${verificationCode}`,
      stName
    );
    showToast('تم توثيق الإجازة والسند وكود التحقق الرقمي بنجاح', 'success');
  };

  const saveTask = (taskInput: Omit<TaskItem, 'id'> & { id?: string }) => {
    if (taskInput.id) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskInput.id ? { ...taskInput, id: t.id } : t))
      );
      showToast('تم تحديث المهمة', 'success');
    } else {
      setTasks((prev) => [{ ...taskInput, id: `tsk-${Date.now()}` }, ...prev]);
      showToast('تمت إضافة المهمة الجديدة', 'success');
    }
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('تم حذف المهمة', 'info');
  };

  const updateStudentFee = (
    studentId: string,
    month: string,
    status: 'مدفوع' | 'متأخر' | 'معفى',
    amount: number,
    method?: string,
    notes?: string
  ) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;
        const existingIdx = st.fees.findIndex((f) => f.month === month);
        const updatedRecord = {
          month,
          amount,
          status,
          paidAt: status === 'مدفوع' ? new Date().toISOString().slice(0, 10) : undefined,
          method,
          notes,
          receiptNumber:
            status === 'مدفوع'
              ? `REC-${month.replace('-', '')}-${st.id.replace(/\D/g, '') || '100'}`
              : undefined,
        };
        const nextFees =
          existingIdx >= 0
            ? st.fees.map((f, i) => (i === existingIdx ? updatedRecord : f))
            : [...st.fees, updatedRecord];
        return { ...st, fees: nextFees };
      })
    );
    const stName = students.find((s) => s.id === studentId)?.name || 'الطالب';
    recordAuditLog(
      'دفعة مالية وإيصال',
      `تحديث دفعة شهر (${month}) إلى (${status}) بمبلغ ${amount} ج.م للطالب (${stName})`,
      stName
    );
    showToast('تم تحديث الحالة المالية للطالب وتوليد إيصال السداد', 'success');
  };

  const addDisciplineWarning = (
    studentId: string,
    level: 'تنبيه' | 'إنذار أول' | 'إنذار نهائي',
    reason: string
  ) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;
        return {
          ...st,
          disciplineWarnings: [
            {
              id: `warn-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              level,
              reason,
            },
            ...st.disciplineWarnings,
          ],
        };
      })
    );
    showToast('تم تسجيل ملاحظة الانضباط في ملف الطالب', 'info');
  };

  const updateSettings = (partial: Partial<AcademySettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    showToast('تم حفظ الإعدادات', 'success');
  };

  const saveBoardStrokes = (key: string, strokes: SmartBoardStroke[]) => {
    setBoardStrokes((prev) => ({ ...prev, [key]: strokes }));
  };

  const saveTeacherRating = (
    ratingInput: Omit<TeacherRatingRecord, 'id' | 'date'> & { date?: string }
  ) => {
    const newRecord: TeacherRatingRecord = {
      ...ratingInput,
      id: `tr-${Date.now()}`,
      date: ratingInput.date || getLocalDateString(0),
    };
    setTeacherRatings((prev) => [newRecord, ...prev]);
    showToast('تم إرسال تقييم المحفظ ورسالة الشكر بنجاح — جزاكم الله خيراً', 'success');
  };

  const saveHomeSubmission = (
    submissionInput: Omit<
      HomePracticeSubmission,
      'id' | 'date' | 'createdAt' | 'reviewed' | 'reviewedByTeacher'
    > & {
      date?: string;
      guardianNote?: string;
    }
  ) => {
    const todayStr = submissionInput.date || getLocalDateString(0);
    const newSub: HomePracticeSubmission = {
      ...submissionInput,
      id: `hp-${Date.now()}`,
      date: todayStr,
      createdAt: todayStr,
      guardianNote: submissionInput.guardianNote || submissionInput.studentNote,
      reviewed: false,
      reviewedByTeacher: false,
    };
    setHomeSubmissions((prev) => [newSub, ...prev]);
    setStudents((prev) =>
      prev.map((st) =>
        st.id === submissionInput.studentId
          ? {
              ...st,
              dailyAudioRecordings: [
                newSub,
                ...(st.dailyAudioRecordings || []),
              ],
              xpPoints: Math.max(0, (st.xpPoints || 0) + 25),
            }
          : st
      )
    );
    showToast(
      'تم حفظ المقطع الصوتي للورد اليومي في حالة الطالب وإرساله لصندوق وارد المحفظ (+25 XP)',
      'success'
    );
  };

  const markHomeSubmissionReviewed = (
    id: string,
    feedback?: string,
    grade: GradeType = 'ممتاز',
    masteryScore = 95
  ) => {
    setHomeSubmissions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              reviewed: true,
              reviewedByTeacher: true,
              grade,
              masteryScore,
              teacherFeedback:
                feedback || 'أحسنت يا بطل، استمر على هذا الإتقان المبارك!',
            }
          : item
      )
    );
    setStudents((prev) =>
      prev.map((st) => ({
        ...st,
        dailyAudioRecordings: (st.dailyAudioRecordings || []).map((rec) =>
          rec.id === id
            ? {
                ...rec,
                reviewed: true,
                reviewedByTeacher: true,
                grade,
                masteryScore,
                teacherFeedback:
                  feedback || 'أحسنت يا بطل، استمر على هذا الإتقان المبارك!',
              }
            : rec
        ),
      }))
    );
    showToast('تم اعتماد مراجعة التسميع غير المتزامن وإرسال التعليقات للطالب', 'success');
  };

  const addTimestampPinToHomeSubmission = (
    submissionId: string,
    pin: {
      timestampSec?: number;
      second?: number;
      formattedTime?: string;
      category: TimestampAudioFeedbackPin['category'];
      ayahNumber?: number;
      word?: string;
      comment?: string;
      note?: string;
      linkedErrorId?: string;
      linkedErrorType?: TimestampAudioFeedbackPin['linkedErrorType'];
    }
  ) => {
    const sec = Math.max(0, Math.round(pin.timestampSec ?? pin.second ?? 0));
    const fmt =
      pin.formattedTime ||
      `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(
        2,
        '0'
      )}`;
    const text = pin.comment || pin.note || 'ملاحظة صوتية على التلاوة';
    const newPin: TimestampAudioFeedbackPin = {
      id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestampSec: sec,
      second: sec,
      formattedTime: fmt,
      category: pin.category,
      ayahNumber: pin.ayahNumber,
      word: pin.word,
      comment: text,
      note: text,
      linkedErrorId: pin.linkedErrorId,
      linkedErrorType: pin.linkedErrorType,
      createdAt: getLocalDateString(0),
    };
    setHomeSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId
          ? {
              ...sub,
              timestampPins: [...(sub.timestampPins || []), newPin].sort(
                (a, b) => a.timestampSec - b.timestampSec
              ),
            }
          : sub
      )
    );
    setStudents((prev) =>
      prev.map((st) => ({
        ...st,
        dailyAudioRecordings: (st.dailyAudioRecordings || []).map((sub) =>
          sub.id === submissionId
            ? {
                ...sub,
                timestampPins: [...(sub.timestampPins || []), newPin].sort(
                  (a, b) => a.timestampSec - b.timestampSec
                ),
              }
            : sub
        ),
      }))
    );
    showToast(
      `📌 تم تثبيت تعليق زمني (${pin.category}) عند الدقيقة (${fmt})`,
      'success'
    );
  };

  const submitAdmissionRequest = (
    req: Partial<AdmissionRequest> & {
      studentName: string;
      age: number;
      guardianName: string;
    }
  ): AdmissionRequest => {
    const phone = req.whatsappPhone || req.guardianPhone || '201068631966';
    const tz =
      req.countryAndTimezone || req.countryOrTimezone || 'القاهرة (GMT+2)';
    const riwayah: QuranRiwayah =
      req.preferredRiwayah || req.requestedRiwayah || 'حفص عن عاصم';
    const days = req.preferredDays || 'السبت - الإثنين - الأربعاء';
    const time = req.preferredTime || '17:00';
    const daysAndTime = req.preferredDaysAndTime || `${days} — ${time}`;
    const level: StudentLevel =
      req.currentLevel === 'متقدم' || req.currentLevel === 'متوسط'
        ? req.currentLevel
        : 'مبتدئ';

    const newReq: AdmissionRequest = {
      id: `adm-${Date.now()}`,
      studentName: req.studentName,
      age: req.age,
      guardianName: req.guardianName,
      whatsappPhone: phone,
      guardianPhone: phone,
      countryAndTimezone: tz,
      countryOrTimezone: tz,
      preferredRiwayah: riwayah,
      requestedRiwayah: riwayah,
      currentLevel: level,
      memorizedPartsSummary:
        req.memorizedPartsSummary || String(req.currentLevel || 'جزء عم'),
      preferredDaysAndTime: daysAndTime,
      preferredDays: days,
      preferredTime: time,
      status: 'جديد',
      createdAt: getLocalDateString(0),
      notes: req.notes,
    };
    setAdmissionRequests((prev) => [newReq, ...prev]);
    recordAuditLog(
      'قبول طالب جديد',
      `استلام طلب التحاق جديد للطالب (${newReq.studentName}) — الرواية: ${newReq.preferredRiwayah}`,
      newReq.studentName,
      'النظام'
    );
    showToast('تم تسجيل طلب الالتحاق وحجز تحديد المستوى بنجاح', 'success');
    return newReq;
  };

  const updateAdmissionRequestStatus = (
    id: string,
    status: AdmissionRequest['status'],
    notes?: string
  ) => {
    setAdmissionRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, notes: notes ?? r.notes } : r
      )
    );
    showToast(`تم تحديث حالة طلب الالتحاق إلى (${status})`, 'info');
  };

  const approveAdmissionAsStudent = (
    id: string,
    targetCircleName?: string
  ): Student | null => {
    const req = admissionRequests.find((r) => r.id === id);
    if (!req) return null;
    const levelNorm: StudentLevel =
      req.currentLevel === 'متقدم' || req.currentLevel === 'متوسط'
        ? req.currentLevel
        : 'مبتدئ';
    const assignedCircle =
      targetCircleName ||
      circles.find((c) => c.level === levelNorm)?.name ||
      circles[0]?.name ||
      'حلقة النور والبيان (الناشئة)';

    const created = saveStudent({
      name: req.studentName,
      guardianName: req.guardianName,
      whatsappPhone: req.whatsappPhone || req.guardianPhone || '201068631966',
      guardianPin: '123456',
      level: levelNorm,
      riwayah: req.preferredRiwayah || req.requestedRiwayah || 'حفص عن عاصم',
      timezoneLabel: req.countryAndTimezone || req.countryOrTimezone,
      circle: assignedCircle,
      plan: 'متوازنة',
      linkLogic: 'الآية التالية',
      scheduleDays: [0, 2, 4],
      scheduleTime: req.preferredTime || '17:00',
      sessionDuration: 30,
      startDate: getLocalDateString(0),
      notes: `طالب مقبول من بوابة التسجيل — ${req.memorizedPartsSummary}. ${req.notes || ''}`,
      memorizedSurahs: [1, 112, 113, 114],
      inProgressSurahs: [78],
      memorizedJuz: levelNorm === 'متوسط' ? [30] : [],
      currentStop: {
        surahId: 78,
        surahName: 'النبأ',
        ayah: 1,
        juzNumber: 30,
      },
      monthlyFee: 350,
      fees: [],
      disciplineWarnings: [],
    });

    setAdmissionRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'مقبول بالحلقة' } : r))
    );
    recordAuditLog(
      'قبول طالب جديد',
      `اعتماد قبول الطالب (${req.studentName}) وتحويله رسمياً إلى (${assignedCircle})`,
      req.studentName
    );
    return created;
  };

  const updateStudentAccessibilityMode = (
    studentId: string,
    mode: StudentAccessibilityMode
  ) => {
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId ? { ...st, accessibilityMode: mode } : st
      )
    );
    const label =
      mode === 'kids'
        ? 'وضع الطفل الصغير بالأيقونات الكبيرة'
        : mode === 'seniors'
        ? 'وضع الخط الفائق لحلقات الكبار'
        : 'الوضع القياسي';
    showToast(`تم تفعيل (${label}) في بوابة الطالب`, 'info');
  };

  const addStudentXp = (studentId: string, deltaXp: number, reason?: string) => {
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? { ...st, xpPoints: Math.max(0, (st.xpPoints || 0) + deltaXp) }
          : st
      )
    );
    if (reason) {
      showToast(`🌟 +${deltaXp} نقطة همة: ${reason}`, 'success');
    }
  };

  const awardStudentBadge = (studentId: string, badgeTitle: string) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;
        const current = st.badges || [];
        const nextBadges = current.includes(badgeTitle)
          ? current
          : [...current, badgeTitle];
        return {
          ...st,
          badges: nextBadges,
          xpPoints: (st.xpPoints || 0) + 30,
        };
      })
    );
    showToast(`🏅 تم منح الطالب "${badgeTitle}" (+30 نقطة همة)!`, 'success');
  };

  const toggleStudentGoldenCrown = (studentId: string) => {
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? {
              ...st,
              hasGoldenCrown: !st.hasGoldenCrown,
              xpPoints: !st.hasGoldenCrown ? (st.xpPoints || 0) + 50 : st.xpPoints,
            }
          : st
      )
    );
  };

  const promoteStudentFoundationLevel = (
    studentId: string,
    passedLevel: FoundationLevelNumber,
    score = 96
  ) => {
    const nextLevel = Math.min(8, passedLevel + 1) as FoundationLevelNumber;
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;
        const completed = Array.from(
          new Set([...(st.completedFoundationLevels || []), passedLevel])
        ).sort((a, b) => a - b);
        const badges = Array.from(
          new Set([...(st.badges || []), 'وسام بطل التأسيس'])
        );
        return {
          ...st,
          foundationLevel: nextLevel,
          completedFoundationLevels: completed,
          xpPoints: (st.xpPoints || 0) + 100,
          badges,
        };
      })
    );

    const st = students.find((s) => s.id === studentId);
    saveExam({
      studentId,
      date: getLocalDateString(0),
      type: 'اختبار مرحلة تأسيسية',
      targetTitle: `اجتياز المستوى (${passedLevel}) من منهج الإمام للتأسيس القرآني`,
      committee: [settings.teacherName],
      score,
      grade: score >= 90 ? 'ممتاز' : 'جيد جداً',
      passed: true,
      notes: `اجتاز الطالب ${st?.name || ''} اختبار المستوى ${passedLevel} بنجاح وانتقل للمستوى ${nextLevel}.`,
      certificateIssued: true,
    });
  };

  const toggleStudentFortressTask = (
    studentId: string,
    taskId: FiveFortressTaskKey,
    dateStr = getLocalDateString(0)
  ) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;
        const log = { ...(st.fiveFortressesLog || {}) };
        const dayTasks = log[dateStr] || {
          listened3Times: false,
          readPreparation: false,
          reviewedLink: false,
          reviewedFar: false,
        };
        const exists = !!dayTasks[taskId];
        log[dateStr] = {
          ...dayTasks,
          [taskId]: !exists,
        };
        return {
          ...st,
          fiveFortressesLog: log,
          xpPoints: Math.max(0, (st.xpPoints || 0) + (exists ? -10 : 15)),
        };
      })
    );
  };

  const linkStudentStopToAyah = (
    studentId: string,
    surahId: number,
    ayah: number
  ) => {
    const surahMeta = SURAHS.find((s) => s.id === surahId) || SURAHS[0];
    const validAyah = Math.max(1, Math.min(surahMeta.ayahs, ayah));
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? {
              ...st,
              currentStop: {
                surahId: surahMeta.id,
                surahName: surahMeta.name,
                ayah: validAyah,
                juzNumber: surahMeta.juz,
              },
            }
          : st
      )
    );
    const stName = students.find((s) => s.id === studentId)?.name || 'الطالب';
    showToast(
      `📌 تم ربط موضع توقف الطالب (${stName}) بسورة ${surahMeta.name} — الآية (${validAyah})`,
      'success'
    );
  };

  const addStudentCustomMutashabih = (
    studentId: string,
    item: Partial<StudentCustomMutashabih>
  ) => {
    const sAName = item.surahAName || item.primarySurahName || 'النبأ';
    const aANum = item.ayahANumber ?? item.primaryAyah ?? 1;
    const aAText =
      item.ayahAText || item.primaryText || `سورة ${sAName} — الآية ${aANum}`;
    const sBName = item.surahBName || item.similarSurahName || 'النازعات';
    const aBNum = item.ayahBNumber ?? item.similarAyah ?? 1;
    const aBText =
      item.ayahBText || item.similarText || `سورة ${sBName} — الآية ${aBNum}`;
    const diffWord =
      item.diffHighlightWord || item.differenceWord1 || 'موضع الاختلاف';
    const rule =
      item.dabitRule ||
      item.ruleNote ||
      'الانتباه لسياق السورة وضبط الكلمة المميزة عند التسميع.';

    const newItem: StudentCustomMutashabih = {
      id: `cmut-${Date.now()}`,
      createdAt: getLocalDateString(0),
      surahAName: sAName,
      ayahANumber: aANum,
      ayahAText: aAText,
      surahBName: sBName,
      ayahBNumber: aBNum,
      ayahBText: aBText,
      diffHighlightWord: diffWord,
      dabitRule: rule,
      primarySurahId: item.primarySurahId,
      primarySurahName: sAName,
      primaryAyah: aANum,
      primaryText: aAText,
      similarSurahId: item.similarSurahId,
      similarSurahName: sBName,
      similarAyah: aBNum,
      similarText: aBText,
      differenceWord1: item.differenceWord1 || diffWord,
      differenceWord2: item.differenceWord2 || diffWord,
      ruleNote: rule,
    };
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? {
              ...st,
              customMutashabihat: [newItem, ...(st.customMutashabihat || [])],
              xpPoints: (st.xpPoints || 0) + 20,
            }
          : st
      )
    );
    showToast(
      `تمت إضافة بطاقة «متشابهاتي الخاصة» لسورة ${sAName} مع سورة ${sBName} بملف الطالب`,
      'success'
    );
  };

  const deleteStudentCustomMutashabih = (
    studentId: string,
    mutashabihId: string
  ) => {
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? {
              ...st,
              customMutashabihat: (st.customMutashabihat || []).filter(
                (m) => m.id !== mutashabihId
              ),
            }
          : st
      )
    );
    showToast('تم حذف بطاقة المتشابهات من ملف الطالب', 'info');
  };

  const updateCircleSubstituteAndSeason = (
    circleId: string,
    updates: Partial<CircleGroup>
  ) => {
    setCircles((prev) =>
      prev.map((c) => (c.id === circleId ? { ...c, ...updates } : c))
    );
    showToast('تم حفظ إعدادات الحلقة (المعلم البديل / الموسم المكثف) بنجاح', 'success');
  };

  const [studentAudioBlobs, setStudentAudioBlobs] = useState<
    Record<string, StudentAudioBlobRecord[]>
  >({});

  const loadStudentAudioBlobs = async (
    studentId: string
  ): Promise<StudentAudioBlobRecord[]> => {
    if (!studentId) return [];
    const items = await fetchAudioBlobsFromIdbAndLocalStorage(studentId);
    setStudentAudioBlobs((prev) => ({
      ...prev,
      [studentId]: items,
    }));
    return items;
  };

  const saveStudentAudioBlob = async (input: {
    studentId: string;
    studentName: string;
    surahName: string;
    fromAyah: number;
    toAyah: number;
    durationSeconds: number;
    blob: Blob;
    dataUrl: string;
    studentNote: string;
  }): Promise<StudentAudioBlobRecord> => {
    const nowIso = new Date().toISOString();
    const record: StudentAudioBlobRecord = {
      id: `blob-${input.studentId}-${Date.now()}`,
      studentId: input.studentId,
      studentName: input.studentName,
      surahName: input.surahName,
      fromAyah: input.fromAyah,
      toAyah: input.toAyah,
      durationSeconds: input.durationSeconds,
      mimeType: input.blob.type || 'audio/webm',
      sizeBytes: input.blob.size || 0,
      blob: input.blob,
      dataUrl: input.dataUrl,
      studentNote: input.studentNote,
      createdAt: nowIso,
    };

    await persistAudioBlobToIdbAndLocalStorage(record);

    setStudentAudioBlobs((prev) => ({
      ...prev,
      [input.studentId]: [record, ...(prev[input.studentId] || [])],
    }));

    saveHomeSubmission({
      studentId: input.studentId,
      studentName: input.studentName,
      date: getLocalDateString(0),
      surahName: input.surahName,
      fromAyah: input.fromAyah,
      toAyah: input.toAyah,
      durationSeconds: input.durationSeconds,
      audioDataUrl: input.dataUrl,
      studentNote: input.studentNote,
    });

    return record;
  };

  const deleteStudentAudioBlob = async (
    studentId: string,
    recordId: string
  ): Promise<void> => {
    const db = await openStudentAudioIndexedDB();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STUDENT_AUDIO_IDB_STORE, 'readwrite');
          tx.objectStore(STUDENT_AUDIO_IDB_STORE).delete(recordId);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
    try {
      const lsKey = `wlq_student_audio_blobs_${studentId}`;
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const existing: StudentAudioBlobRecord[] = JSON.parse(raw);
        localStorage.setItem(
          lsKey,
          JSON.stringify(existing.filter((item) => item.id !== recordId))
        );
      }
    } catch {
      // ignore
    }
    setStudentAudioBlobs((prev) => ({
      ...prev,
      [studentId]: (prev[studentId] || []).filter((item) => item.id !== recordId),
    }));
    showToast('تم حذف المقطع الصوتي من تخزين الطالب المحلي', 'info');
  };

  // --- Public Mushaf, Waqf Dedication & Visitor Impact State ---
  const [publicMushafPortalOpen, setPublicMushafPortalOpen] = useState<boolean>(false);

  const [currentPublicVisitorId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem('imam_public_visitor_id_v1');
      if (existing) return existing;
      const created = 'vis-local-current';
      localStorage.setItem('imam_public_visitor_id_v1', created);
      return created;
    } catch {
      return 'vis-local-current';
    }
  });

  const [waqfImpactStats, setWaqfImpactStats] = useState<WaqfImpactStats>(() => {
    try {
      const raw = localStorage.getItem('imam_waqf_impact_stats_v1');
      if (raw) return JSON.parse(raw) as WaqfImpactStats;
    } catch {
      // ignore
    }
    return {
      totalVisitors: 1482,
      pwaInstallsCount: 419,
      totalPagesRead: 28640,
      totalJuzRead: 1432,
      completedKhatmahsCount: 47,
      ameenPrayersCount: 3925,
      offlineDownloadsCount: 312,
    };
  });

  const [publicBookmarks, setPublicBookmarks] = useState<PublicMushafBookmark[]>(() => {
    try {
      const raw = localStorage.getItem('imam_public_mushaf_bookmarks_v1');
      if (raw) return JSON.parse(raw) as PublicMushafBookmark[];
    } catch {
      // ignore
    }
    return [
      {
        id: 'bm-khatmah',
        category: 'khatmah',
        label: '🔖 فاصل الختمة اليومية',
        pageNumber: 293,
        surahId: 18,
        surahName: 'الكهف',
        ayahNumber: 1,
        juzNumber: 15,
        updatedAt: getLocalDateString(0),
        note: 'موضع الورد اليومي الحالي',
      },
      {
        id: 'bm-memorization',
        category: 'memorization',
        label: '📌 فاصل الحفظ والمراجعة',
        pageNumber: 562,
        surahId: 67,
        surahName: 'الملك',
        ayahNumber: 1,
        juzNumber: 29,
        updatedAt: getLocalDateString(-1),
        note: 'تثبيت ومراجعة تبارك',
      },
      {
        id: 'bm-tadabbur',
        category: 'tadabbur',
        label: '⭐ آية للتدبر',
        pageNumber: 596,
        surahId: 93,
        surahName: 'الضحى',
        ayahNumber: 5,
        juzNumber: 30,
        updatedAt: getLocalDateString(-2),
        note: '﴿ وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ ﴾',
      },
    ];
  });

  const [publicVisitors, setPublicVisitors] = useState<PublicVisitorWirdRecord[]>(() => {
    try {
      const raw = localStorage.getItem('imam_public_visitors_wird_v1');
      if (raw) return JSON.parse(raw) as PublicVisitorWirdRecord[];
    } catch {
      // ignore
    }
    return [
      {
        id: 'vis-local-current',
        visitorName: 'زائر المصحف الوقفي (أنت)',
        planType: 'monthly_30',
        planLabel: 'ختمة شهرية (جزء يومياً - 20 صفحة)',
        dailyTargetPages: 20,
        currentPage: 293,
        currentSurahName: 'الكهف',
        currentJuz: 15,
        pagesReadToday: 12,
        totalPagesRead: 293,
        completedKhatmahs: 1,
        streakDays: 15,
        completionPercentage: 49,
        ameenCount: 7,
        badges: ['فارس الورد اليومي', 'المواظب على تلاوة القرآن'],
        lastActiveAt: getLocalDateString(0),
        encouragements: [
          {
            id: 'enc-seed-1',
            badgeTitle: '🌟 وسام تميز ورسالة تشجيع وإهداء خاص من إدارة أكاديمية الإمام',
            message:
              'بارك الله في همتكم العالية ومواظبتكم المباركة على الورد القرآني؛ جعل الله القرآن العظيم ربيع قلوبكم ونوراً في الدنيا والآخرة.',
            sentAt: getLocalDateString(0),
            senderName: 'إدارة أكاديمية الإمام للقرآن الكريم',
            isRead: false,
          },
        ],
      },
      {
        id: 'vis-101',
        visitorName: 'أبو عبد الرحمن المصري',
        planType: 'monthly_30',
        planLabel: 'ختمة شهرية (جزء يومياً - 20 صفحة)',
        dailyTargetPages: 20,
        currentPage: 562,
        currentSurahName: 'الملك',
        currentJuz: 29,
        pagesReadToday: 20,
        totalPagesRead: 1166,
        completedKhatmahs: 2,
        streakDays: 42,
        completionPercentage: 93,
        ameenCount: 28,
        badges: ['تاج الختمة المباركة', 'بطل الـ 40 يوماً المتواصلة', 'فارس الورد اليومي'],
        lastActiveAt: getLocalDateString(0),
        encouragements: [],
      },
      {
        id: 'vis-102',
        visitorName: 'أم سلمة القرآنية',
        planType: 'monthly_30',
        planLabel: 'ختمة شهرية (جزء يومياً - 20 صفحة)',
        dailyTargetPages: 20,
        currentPage: 440,
        currentSurahName: 'يس',
        currentJuz: 22,
        pagesReadToday: 18,
        totalPagesRead: 1044,
        completedKhatmahs: 1,
        streakDays: 31,
        completionPercentage: 73,
        ameenCount: 35,
        badges: ['تاج الختمة المباركة', 'المواظب على تلاوة القرآن'],
        lastActiveAt: getLocalDateString(0),
        encouragements: [],
      },
      {
        id: 'vis-103',
        visitorName: 'عمر بن الخطاب (قارئ زائر)',
        planType: 'bimonthly_60',
        planLabel: 'ختمة في شهرين (نصف جزء يومياً - 10 صفحات)',
        dailyTargetPages: 10,
        currentPage: 350,
        currentSurahName: 'النور',
        currentJuz: 18,
        pagesReadToday: 10,
        totalPagesRead: 350,
        completedKhatmahs: 0,
        streakDays: 24,
        completionPercentage: 58,
        ameenCount: 19,
        badges: ['فارس الورد اليومي'],
        lastActiveAt: getLocalDateString(0),
        encouragements: [],
      },
      {
        id: 'vis-104',
        visitorName: 'مريم بنت عمران (قارئة مواظبة)',
        planType: 'custom_pages',
        planLabel: 'ورد مخصص (5 صفحات يومياً)',
        dailyTargetPages: 5,
        currentPage: 511,
        currentSurahName: 'الفتح',
        currentJuz: 26,
        pagesReadToday: 5,
        totalPagesRead: 511,
        completedKhatmahs: 1,
        streakDays: 19,
        completionPercentage: 85,
        ameenCount: 22,
        badges: ['تاج الختمة المباركة'],
        lastActiveAt: getLocalDateString(-1),
        encouragements: [],
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('imam_waqf_impact_stats_v1', JSON.stringify(waqfImpactStats));
    } catch {
      // ignore
    }
  }, [waqfImpactStats]);

  useEffect(() => {
    try {
      localStorage.setItem('imam_public_mushaf_bookmarks_v1', JSON.stringify(publicBookmarks));
    } catch {
      // ignore
    }
  }, [publicBookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('imam_public_visitors_wird_v1', JSON.stringify(publicVisitors));
    } catch {
      // ignore
    }
  }, [publicVisitors]);

  const recordWaqfAmeenPrayer = (visitorId?: string) => {
    const targetId = visitorId || currentPublicVisitorId;
    setWaqfImpactStats((prev) => ({
      ...prev,
      ameenPrayersCount: prev.ameenPrayersCount + 1,
      completedKhatmahsCount: prev.completedKhatmahsCount + 1,
    }));
    setPublicVisitors((prev) =>
      prev.map((v) =>
        v.id === targetId
          ? {
              ...v,
              ameenCount: (v.ameenCount || 0) + 1,
              lastActiveAt: getLocalDateString(0),
            }
          : v
      )
    );
    showToast('تقبل الله طاعتكم ودعاءكم، ولكم بمثل ما دعوتم', 'success');
  };

  const recordPwaInstallEvent = () => {
    setWaqfImpactStats((prev) => ({
      ...prev,
      pwaInstallsCount: prev.pwaInstallsCount + 1,
    }));
  };

  const recordOfflineDownloadEvent = () => {
    setWaqfImpactStats((prev) => ({
      ...prev,
      offlineDownloadsCount: prev.offlineDownloadsCount + 1,
    }));
  };

  const savePublicBookmark = (
    input: Omit<PublicMushafBookmark, 'id' | 'updatedAt'> & { id?: string }
  ) => {
    const nowStr = getLocalDateString(0);
    setPublicBookmarks((prev) => {
      const existingByCategory = prev.find(
        (b) => b.id === input.id || b.category === input.category
      );
      if (existingByCategory) {
        return prev.map((b) =>
          b.id === existingByCategory.id
            ? { ...b, ...input, id: b.id, updatedAt: nowStr }
            : b
        );
      }
      return [
        {
          ...input,
          id: input.id || `bm-${Date.now()}`,
          updatedAt: nowStr,
        },
        ...prev,
      ];
    });
    showToast(`تم حفظ (${input.label}) عند صفحة ${input.pageNumber} — سورة ${input.surahName}`, 'success');
  };

  const deletePublicBookmark = (id: string) => {
    setPublicBookmarks((prev) => prev.filter((b) => b.id !== id));
    showToast('تم إزالة الفاصل المرجعي', 'info');
  };

  const updatePublicVisitorWird = (
    updates: Partial<PublicVisitorWirdRecord> & {
      pagesDelta?: number;
      completedKhatmahDelta?: number;
    }
  ) => {
    const pagesDelta = updates.pagesDelta || 0;
    const khatmahDelta = updates.completedKhatmahDelta || 0;

    if (pagesDelta > 0 || khatmahDelta > 0) {
      setWaqfImpactStats((prev) => ({
        ...prev,
        totalPagesRead: prev.totalPagesRead + Math.max(0, pagesDelta),
        totalJuzRead: Math.floor((prev.totalPagesRead + Math.max(0, pagesDelta)) / 20),
        completedKhatmahsCount: prev.completedKhatmahsCount + Math.max(0, khatmahDelta),
      }));
    }

    setPublicVisitors((prev) =>
      prev.map((v) => {
        if (v.id !== currentPublicVisitorId) return v;
        const nextPage = updates.currentPage ?? v.currentPage;
        const nextPagesToday = Math.max(0, (updates.pagesReadToday ?? v.pagesReadToday) + pagesDelta);
        const nextTotalPages = Math.max(0, (updates.totalPagesRead ?? v.totalPagesRead) + pagesDelta);
        const nextKhatmahs = Math.max(
          0,
          (updates.completedKhatmahs ?? v.completedKhatmahs) + khatmahDelta
        );
        const nextCompletion = Math.min(100, Math.round((nextPage / 604) * 100));
        return {
          ...v,
          ...updates,
          currentPage: nextPage,
          pagesReadToday: nextPagesToday,
          totalPagesRead: nextTotalPages,
          completedKhatmahs: nextKhatmahs,
          completionPercentage: updates.completionPercentage ?? nextCompletion,
          lastActiveAt: getLocalDateString(0),
        };
      })
    );
  };

  const sendOwnerVisitorEncouragement = (
    targetVisitorId: string | 'ALL',
    badgeTitle: string,
    message: string
  ) => {
    const newEnc: OwnerEncouragementItem = {
      id: `enc-${Date.now()}`,
      badgeTitle:
        badgeTitle.trim() ||
        '🌟 وسام تميز ورسالة تشجيع وإهداء خاص من إدارة أكاديمية الإمام',
      message:
        message.trim() ||
        'تقبل الله تلاوتكم، وجعل القرآن العظيم شفيعاً لكم ونوراً في الدنيا والآخرة.',
      sentAt: getLocalDateString(0),
      senderName: settings.academyName || 'إدارة أكاديمية الإمام للقرآن الكريم',
      isRead: false,
    };

    setPublicVisitors((prev) =>
      prev.map((v) => {
        if (targetVisitorId !== 'ALL' && v.id !== targetVisitorId) return v;
        const nextBadges = v.badges.includes(newEnc.badgeTitle)
          ? v.badges
          : [newEnc.badgeTitle, ...v.badges];
        return {
          ...v,
          badges: nextBadges,
          encouragements: [newEnc, ...(v.encouragements || [])],
        };
      })
    );

    const targetName =
      targetVisitorId === 'ALL'
        ? 'جميع زوار وقراء المصحف العام'
        : publicVisitors.find((v) => v.id === targetVisitorId)?.visitorName || 'القارئ المتميز';

    recordAuditLog(
      'إعدادات عامة',
      `إرسال (${newEnc.badgeTitle}) ورسالة تشجيع إلى (${targetName}) عبر بوابة المصحف العام والوقف`,
      targetName
    );
    showToast(`🌟 تم إرسال وسام التميز ورسالة التشجيع إلى (${targetName}) بنجاح`, 'success');
  };

  const markVisitorEncouragementRead = (visitorId: string, encouragementId: string) => {
    setPublicVisitors((prev) =>
      prev.map((v) =>
        v.id === visitorId
          ? {
              ...v,
              encouragements: (v.encouragements || []).map((e) =>
                e.id === encouragementId ? { ...e, isRead: true } : e
              ),
            }
          : v
      )
    );
  };

  const resetToSeedData = () => {
    setStudents(INITIAL_STUDENTS);
    setSessions(INITIAL_SESSIONS);
    setCircles(INITIAL_CIRCLES);
    setExams(INITIAL_EXAMS);
    setIjazahs(INITIAL_IJAZAHS);
    setTasks(INITIAL_TASKS);
    setSettings(INITIAL_SETTINGS);
    setBoardStrokes({});
    setTeacherRatings(INITIAL_TEACHER_RATINGS);
    setHomeSubmissions(INITIAL_HOME_SUBMISSIONS);
    showToast('تمت استعادة البيانات التجريبية النموذجية بنجاح', 'success');
  };

  const importFullBackup = (data: unknown): boolean => {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    if (!Array.isArray(obj.students)) return false;
    setStudents(obj.students as Student[]);
    if (Array.isArray(obj.sessions)) setSessions(obj.sessions as SessionRecord[]);
    if (Array.isArray(obj.circles)) setCircles(obj.circles as CircleGroup[]);
    if (Array.isArray(obj.exams)) setExams(obj.exams as ExamRecord[]);
    if (Array.isArray(obj.ijazahs)) setIjazahs(obj.ijazahs as IjazahRecord[]);
    if (Array.isArray(obj.tasks)) setTasks(obj.tasks as TaskItem[]);
    if (Array.isArray(obj.teacherRatings)) {
      setTeacherRatings(obj.teacherRatings as TeacherRatingRecord[]);
    }
    if (Array.isArray(obj.homeSubmissions)) {
      setHomeSubmissions(obj.homeSubmissions as HomePracticeSubmission[]);
    }
    if (obj.settings && typeof obj.settings === 'object') {
      setSettings((prev) => ({ ...prev, ...(obj.settings as Partial<AcademySettings>) }));
    }
    showToast('تم استيراد النسخة الاحتياطية بنجاح', 'success');
    return true;
  };

  const saveStudentPedagogicalProfile = (
    studentId: string,
    profile: StudentPedagogicalProfile
  ) => {
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? {
              ...st,
              pedagogicalProfile: profile,
            }
          : st
      )
    );
    const targetName = students.find((s) => s.id === studentId)?.name || 'طالب';
    recordAuditLog(
      'تعديل بيانات طالب',
      `تحديث بطاقة التشخيص التربوي ونمط التعلم (${profile.learningStyle} — ${profile.suggestedTrack})`,
      targetName,
      'المعلم'
    );
    showToast(
      `🧠 تم حفظ بطاقة التشخيص التربوي للطالب (${targetName}): نمط ${profile.learningStyle} • المسار المقترح: ${profile.suggestedTrack}`,
      'success'
    );
  };

  const publishFamilyGuidanceToGuardian = (
    studentId: string,
    note: {
      title: string;
      categoryLabel: string;
      bodyText: string;
      targetLetterOrSurah?: string;
    }
  ): PublishedFamilyGuidanceNote => {
    const created: PublishedFamilyGuidanceNote = {
      id: `fgn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: note.title,
      categoryLabel: note.categoryLabel,
      bodyText: note.bodyText,
      createdAt: getLocalDateString(0),
      teacherName: settings.teacherName,
      targetLetterOrSurah: note.targetLetterOrSurah,
    };
    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? {
              ...st,
              publishedFamilyGuidance: [
                created,
                ...(st.publishedFamilyGuidance || []),
              ].slice(0, 12),
            }
          : st
      )
    );
    const targetName = students.find((s) => s.id === studentId)?.name || 'طالب';
    showToast(
      `👨‍👩‍👧 تم نشر بطاقة «توجيه تربوي للأسرة» في بوابة ولي أمر الطالب (${targetName}) بنجاح`,
      'success'
    );
    return created;
  };

  return (
    <AcademyContext.Provider
      value={{
        isLoggedIn,
        userRole,
        guardianStudentId,
        guardianSiblings,
        loginAsTeacher,
        loginAsGuardian,
        loginAsGuardianDirect,
        loginAsGuest,
        logout,
        activeTab,
        setActiveTab,
        selectedStudentId,
        setSelectedStudentId,
        toastMessage,
        showToast,
        quickSearchOpen,
        setQuickSearchOpen,
        students,
        sessions,
        circles,
        exams,
        ijazahs,
        tasks,
        settings,
        boardStrokes,
        teacherRatings,
        homeSubmissions,
        admissionRequests,
        auditLogs,
        managedTeachers,
        cloudSyncStatus,
        lastSyncTimestamp,
        triggerCloudSyncNow,
        updateTeacherAccessStatus,
        sessionReminderPreview,
        setSessionReminderPreview,
        teacherAlerts,
        triggerPushReminderNow,
        saveStudent,
        deleteStudent,
        setStudentAccountStatus,
        updateErrorFollowUpStatus,
        saveSession,
        saveCircle,
        deleteCircle,
        assignStudentToCircle,
        saveExam,
        saveIjazah,
        saveTask,
        toggleTask,
        deleteTask,
        updateStudentFee,
        addDisciplineWarning,
        updateSettings,
        saveBoardStrokes,
        saveTeacherRating,
        saveHomeSubmission,
        markHomeSubmissionReviewed,
        reviewHomeSubmission: markHomeSubmissionReviewed,
        addTimestampPinToHomeSubmission,
        submitAdmissionRequest,
        updateAdmissionRequestStatus,
        approveAdmissionAsStudent,
        recordAuditLog,
        updateStudentAccessibilityMode,
        addStudentXp,
        awardStudentBadge,
        toggleStudentGoldenCrown,
        promoteStudentFoundationLevel,
        toggleStudentFortressTask,
        linkStudentStopToAyah,
        addStudentCustomMutashabih,
        deleteStudentCustomMutashabih,
        updateCircleSubstituteAndSeason,
        studentAudioBlobs,
        saveStudentAudioBlob,
        loadStudentAudioBlobs,
        deleteStudentAudioBlob,
        publicMushafPortalOpen,
        setPublicMushafPortalOpen,
        waqfImpactStats,
        publicVisitors,
        currentPublicVisitorId,
        publicBookmarks,
        recordWaqfAmeenPrayer,
        recordPwaInstallEvent,
        recordOfflineDownloadEvent,
        savePublicBookmark,
        deletePublicBookmark,
        updatePublicVisitorWird,
        sendOwnerVisitorEncouragement,
        markVisitorEncouragementRead,
        saveStudentPedagogicalProfile,
        publishFamilyGuidanceToGuardian,
        resetToSeedData,
        importFullBackup,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
};

export const useAcademy = () => {
  const ctx = useContext(AcademyContext);
  if (!ctx) throw new Error('useAcademy must be used inside AcademyProvider');
  return ctx;
};

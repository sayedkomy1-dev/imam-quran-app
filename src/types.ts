export type UserRole = 'teacher' | 'guardian' | 'guest';

export type StudentLevel = 'مبتدئ' | 'متوسط' | 'متقدم';

export type FoundationLevelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type FiveFortressTaskKey =
  | 'listened3Times'
  | 'readPreparation'
  | 'reviewedLink'
  | 'reviewedFar';

export type StudentPlan =
  | 'متوازنة'
  | 'مكثفة'
  | 'مراجعة فقط'
  | 'تثبيت'
  | 'قصار السور';

export type LinkLogic = 'آخر آية' | 'الآية التالية';

export type AttendanceStatus = 'حضر' | 'غاب' | 'إجازة';

export type ErrorType =
  | 'حفظ'
  | 'تردد'
  | 'تلقين'
  | 'تجويد'
  | 'تشكيل'
  | 'نسيان آية';

export type ErrorContext =
  | 'التسميع'
  | 'الحفظ الجديد'
  | 'المراجعة القريبة'
  | 'المراجعة البعيدة'
  | 'الأجزاء';

export type GradeType = 'ممتاز' | 'جيد جداً' | 'جيد' | 'ضعيف' | 'إعادة';

export type ReciterId =
  | 'Husary_128kbps'
  | 'Husary_Muallim_128kbps'
  | 'Minshawy_Murattal_128kbps'
  | 'Minshawy_Teacher_128kbps'
  | 'Alafasy_128kbps'
  | 'MaherAlMuaiqly128kbps';

export type StudentAccountStatus = 'نشط' | 'متوقف' | 'مؤرشف';

export type ErrorCategoryGroup = 'حفظ' | 'حروف' | 'ضبط' | 'تجويد' | 'تشكيل';

export type ErrorFollowUpStatus = 'open' | 'mastered' | 'needs_review' | 'تم الإتقان';

export type SessionSyncStatus =
  | 'مسودة محلية'
  | 'حصة محفوظة'
  | 'تمت المزامنة'
  | 'منشور ببوابة ولي الأمر'
  | 'تم فتح محادثة واتساب للمراجعة';

export interface RecitationError {
  id: string;
  type: ErrorType;
  context: ErrorContext;
  surah?: string;
  ayah?: number;
  word?: string;
  wordIndex?: number;
  letter?: string;
  category?: ErrorCategoryGroup;
  subType?: string;
  tajweedRule?: string;
  correctedInSession?: boolean;
  followUpStatus?: ErrorFollowUpStatus;
  repeatCount?: number;
  compositeKey?: string;
  lastReviewedDate?: string;
  timestamp: string;
}

export interface SurahRangeAssignment {
  enabled: boolean;
  surahId: number;
  surahName: string;
  toSurahId?: number;
  toSurahName?: string;
  isFullSurah: boolean;
  fromAyah: number;
  toAyah: number;
  direction: 'asc' | 'desc';
  grade?: GradeType;
  percentage?: number;
}

export interface JuzAssignmentItem {
  id: string;
  juzNumber: number;
  juzName: string;
  scope: 'full' | 'hizb1' | 'hizb2' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8';
  label: string;
  grade?: GradeType;
  percentage?: number;
}

export interface SessionRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  masteryScore: number; // 0-100
  previousEvaluation: {
    newGrade?: GradeType;
    nearGrade?: GradeType;
    farGrade?: GradeType;
    juzGrade?: GradeType;
    surahGrade?: GradeType;
    hizbGrade?: GradeType;
    actualGrade?: GradeType;
  };
  sectionPercentages?: {
    actual?: number;
    newMem?: number;
    nearRev?: number;
    farRev?: number;
    juzRev?: number;
    hizbRev?: number;
    surahRev?: number;
    actualRecitation?: number;
    previousEvaluation?: number;
    newMemorization?: number;
    nearReview?: number;
    farReview?: number;
    surahReview?: number;
    juzReview?: number;
    hizbQuarterReview?: number;
    extraRecitation?: number;
  };
  actualRecitation?: SurahRangeAssignment & {
    stopAyah?: number;
    completedStatus?: 'كامل' | 'جزئي' | 'إضافي';
    notes?: string;
  };
  extraRecitation?: SurahRangeAssignment & {
    notes?: string;
  };
  errors: RecitationError[];
  newMemorization?: SurahRangeAssignment;
  nearReview?: SurahRangeAssignment;
  farReview?: SurahRangeAssignment;
  juzReview: {
    enabled: boolean;
    items: JuzAssignmentItem[];
    direction: 'asc' | 'desc';
  };
  hizbQuarterReview?: {
    enabled: boolean;
    mode?: 'juz_quarters' | 'hizb_quarters';
    items: JuzAssignmentItem[];
    direction: 'asc' | 'desc';
    grade?: GradeType;
    percentage?: number;
  };
  surahReview: {
    enabled: boolean;
    surahNames: string[];
    direction: 'asc' | 'desc';
  };
  parentNotes: string;
  tarbiyahCardId?: string;
  tarbiyahCardTitle?: string;
  tarbiyahCardSummary?: string;
  voiceNoteDataUrl?: string;
  voiceNoteDuration?: number;
  memorizationAudioDataUrl?: string;
  memorizationAudioName?: string;
  syncStatus?: SessionSyncStatus;
  durationMinutes?: number;
  carriedOverFromDate?: string;
  createdAt: string;
}

export interface StudentCustomMutashabih {
  id: string;
  createdAt: string;
  surahAName: string;
  ayahANumber: number;
  ayahAText: string;
  surahBName: string;
  ayahBNumber: number;
  ayahBText: string;
  diffHighlightWord: string;
  dabitRule: string;
  mastered?: boolean;
  // Optional compatibility aliases
  primarySurahId?: number;
  primarySurahName?: string;
  primaryAyah?: number;
  primaryText?: string;
  similarSurahId?: number;
  similarSurahName?: string;
  similarAyah?: number;
  similarText?: string;
  differenceWord1?: string;
  differenceWord2?: string;
  ruleNote?: string;
}

export type QuranRiwayah =
  | 'حفص عن عاصم'
  | 'ورش عن نافع'
  | 'قالون عن نافع'
  | 'شعبة عن عاصم'
  | 'الدوري عن أبي عمرو';

export type StudentAccessibilityMode = 'standard' | 'kids' | 'seniors';

export type SeasonalModeType =
  | 'normal'
  | 'ramadan'
  | 'summer_intensive'
  | 'khatmah_camp'
  | 'mutashabihat_camp'
  | 'عادي'
  | 'ختمة رمضان'
  | 'مكثف الصيف'
  | 'مراجعة عشر ذي الحجة'
  | 'معسكر تثبيت';

export interface TimestampAudioFeedbackPin {
  id: string;
  timestampSec: number; // e.g., 14 for 00:14
  second?: number; // compatibility alias
  formattedTime: string; // "00:14"
  category: 'تجويد' | 'حفظ' | 'تشكيل' | 'مخارج' | 'وقف وابتداء' | 'تشجيع';
  ayahNumber?: number;
  word?: string;
  comment: string;
  note?: string; // compatibility alias
  linkedErrorId?: string;
  linkedErrorType?: ErrorType;
  createdAt: string;
}

export interface AdmissionRequest {
  id: string;
  studentName: string;
  age: number;
  guardianName: string;
  whatsappPhone: string;
  guardianPhone?: string;
  countryAndTimezone: string;
  countryOrTimezone?: string;
  preferredRiwayah: QuranRiwayah;
  requestedRiwayah?: QuranRiwayah;
  currentLevel: StudentLevel | string;
  memorizedPartsSummary: string;
  preferredDaysAndTime: string;
  preferredDays?: string;
  preferredTime?: string;
  status: 'جديد' | 'تم تحديد المستوى' | 'تم تحديد الموعد' | 'مقبول بالحلقة' | 'تم القبول' | 'مؤجل';
  createdAt: string;
  notes?: string;
}

export interface OwnerAuditLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actor?: string;
  actorRole: 'المالك / المشرف' | 'المعلم' | 'النظام';
  actionCategory:
    | 'تعديل طالب'
    | 'تعديل بيانات طالب'
    | 'أرشفة وحالة ملف'
    | 'أرشفة أو حالة حساب'
    | 'دفعة مالية وإيصال'
    | 'سداد رسوم مالية'
    | 'شهادة وإجازة'
    | 'إصدار شهادة أو إجازة'
    | 'قبول طالب جديد'
    | 'إعدادات وحلقات'
    | 'إعدادات عامة'
    | 'صلاحيات وأمان';
  category?: string;
  summary: string;
  details?: string;
  targetName?: string;
}

export interface TeacherAccessRecord {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  status: 'active' | 'blocked' | 'pending';
  lastSyncAt: string;
  assignedCirclesCount: number;
}

export type FeeStatus = 'مدفوع' | 'متأخر' | 'معفى';

export interface FeeRecord {
  month: string; // YYYY-MM
  amount: number;
  status: FeeStatus;
  paidAt?: string;
  method?: string;
  notes?: string;
  receiptNumber?: string;
}

export interface Student {
  id: string;
  name: string;
  guardianName: string;
  whatsappPhone: string; // Normalized e.g., 201012345678
  guardianPin: string; // 6-digit PIN for Guardian Portal
  accountStatus?: StudentAccountStatus; // نشط | متوقف | مؤرشف
  archivedAt?: string;
  archiveReason?: string;
  level: StudentLevel;
  circle: string;
  plan: StudentPlan;
  linkLogic: LinkLogic;
  scheduleDays: number[]; // 0 = Sunday ... 6 = Saturday
  scheduleTime: string; // HH:mm
  sessionDuration: number; // minutes
  startDate: string;
  notes: string;
  memorizedSurahs: number[]; // 1..114
  inProgressSurahs: number[];
  memorizedJuz: number[]; // 1..30
  currentStop: {
    surahId: number;
    surahName: string;
    ayah: number;
    juzNumber: number;
  };
  monthlyFee: number;
  fees: FeeRecord[];
  disciplineWarnings: {
    id: string;
    date: string;
    level: 'تنبيه' | 'إنذار أول' | 'إنذار نهائي';
    reason: string;
  }[];
  // v13 Enterprise Extensions
  riwayah?: QuranRiwayah;
  timezoneLabel?: string;
  timezoneOffsetDiff?: number;
  accessibilityMode?: StudentAccessibilityMode;
  foundationLevel?: FoundationLevelNumber; // 1..8 in Al-Imam Hybrid Foundation System
  completedFoundationLevels?: number[]; // e.g. [1, 2, 3]
  xpPoints?: number;
  badges?: string[];
  hasGoldenCrown?: boolean;
  permanentMeetingUrl?: string;
  customMutashabihat?: StudentCustomMutashabih[];
  dailyAudioRecordings?: HomePracticeSubmission[];
  fiveFortressesLog?: Record<
    string,
    {
      listened3Times: boolean;
      readPreparation: boolean;
      reviewedLink: boolean;
      reviewedFar: boolean;
    }
  >;
  // Additive Pedagogical Advisor & Learning Challenges Profile (Schema = 12 compatible)
  pedagogicalProfile?: StudentPedagogicalProfile;
  publishedFamilyGuidance?: PublishedFamilyGuidanceNote[];
  filialGratitudeLog?: {
    id: string;
    date: string;
    message: string;
    surahName?: string;
  }[];
  characterHabitCompletedDates?: string[];
}

export interface CircleGroup {
  id: string;
  name: string;
  teacherName: string;
  level: string;
  scheduleDays: number[];
  scheduleTime: string;
  duration: number;
  description: string;
  permanentMeetingUrl?: string;
  // Substitute Teacher & Handover (نظام المعلم البديل وبطاقة تسليم الحلقة)
  substituteTeacherName?: string;
  substituteActive?: boolean;
  substituteUntilDate?: string;
  substituteHandoverNotes?: string;
  // Seasonal & Intensive Mode (أوضاع المواسم والدورات المكثفة)
  seasonalMode?: SeasonalModeType;
  seasonalTitle?: string;
  seasonalTargetLabel?: string;
  seasonalDailyGoal?: string;
  seasonalChallengeReward?: string;
}

export interface ExamRecord {
  id: string;
  studentId: string;
  date: string;
  type:
    | 'تحديد مستوى'
    | 'اختبار سورة'
    | 'اختبار جزء'
    | 'اختبار خمسة أجزاء'
    | 'اختبار ختمة وتجويد'
    | 'اختبار مرحلة تأسيسية';
  targetTitle: string;
  committee: string[];
  score: number;
  grade: GradeType;
  passed: boolean;
  notes: string;
  certificateIssued: boolean;
  riwayah?: QuranRiwayah | string;
  verificationCode?: string;
}

export interface IjazahRecord {
  id: string;
  studentId: string;
  riwayah: string;
  sheikhName: string;
  sanadChain: string;
  issueDate: string;
  examId?: string;
  certificateNumber: string;
  verificationCode?: string;
  notes: string;
}

export interface TaskItem {
  id: string;
  title: string;
  studentId?: string;
  dueDate: string; // YYYY-MM-DD
  priority: 'عادي' | 'مرتفع';
  completed: boolean;
  notes: string;
}

export interface SmartBoardStroke {
  id: string;
  tool: 'pen' | 'highlighter' | 'circle' | 'arrow' | 'calligraphy' | 'stamp';
  color: string;
  width: number;
  points: { x: number; y: number }[];
  stampText?: string;
}

export interface TeacherRatingRecord {
  id: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  date: string;
  punctuality: number; // 1..5 الانضباط بالموعد ووقت الحصة
  explanationAndFoundation: number; // 1..5 الشرح والتأسيس
  encouragementAndPatience: number; // 1..5 التشجيع والصبر
  audioAndBoardQuality: number; // 1..5 جودة الصوت والسبورة
  guardianFollowUp: number; // 1..5 المتابعة مع ولي الأمر
  gratitudeMessage: string;
  criteria?: {
    punctuality: number;
    encouragement: number;
    tajweedPrecision: number;
    assignmentClarity: number;
    smartBoardQuality: number;
  };
  averageScore?: number;
  thankYouMessage?: string;
}

export interface HomePracticeSubmission {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  createdAt?: string;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  durationSeconds: number;
  audioDataUrl?: string;
  studentNote: string;
  guardianNote?: string;
  reviewed: boolean;
  reviewedByTeacher?: boolean;
  teacherFeedback?: string;
  grade?: GradeType;
  masteryScore?: number;
  timestampPins?: TimestampAudioFeedbackPin[];
}

export type HomeRecitationSubmission = HomePracticeSubmission;

export interface WeeklyGoals {
  newAyatTarget: number;
  reviewsTarget: number;
  sessionsTarget: number;
  attendanceTarget: number;
}

export interface AcademySettings {
  teacherName: string;
  academyName: string;
  tagline: string;
  Slogan?: string;
  officialWhatsappPhone?: string;
  referenceTimezone?: string;
  theme: 'light' | 'dark' | 'sepia';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  fontScale?: 'sm' | 'md' | 'lg';
  defaultReciter: ReciterId;
  weeklyGoals: WeeklyGoals;
  whatsappHeader: string;
  whatsappFooter: string;
  notificationsEnabled: boolean;
  notifyOverdueTasks: boolean;
  notifyUrgentStudents: boolean;
  reminderIntervalMinutes: number;
  showHijriDates: boolean;
}

export type PublicBookmarkCategory = 'khatmah' | 'memorization' | 'tadabbur';

export interface PublicMushafBookmark {
  id: string;
  category: PublicBookmarkCategory;
  label: string;
  pageNumber: number;
  surahId: number;
  surahName: string;
  ayahNumber: number;
  juzNumber: number;
  updatedAt: string;
  note?: string;
}

export interface OwnerEncouragementItem {
  id: string;
  badgeTitle: string;
  message: string;
  sentAt: string;
  senderName: string;
  isRead: boolean;
}

export interface PublicVisitorWirdRecord {
  id: string;
  visitorName: string;
  planType: 'monthly_30' | 'bimonthly_60' | 'custom_pages';
  planLabel: string;
  dailyTargetPages: number;
  currentPage: number;
  currentSurahName: string;
  currentJuz: number;
  pagesReadToday: number;
  totalPagesRead: number;
  completedKhatmahs: number;
  streakDays: number;
  completionPercentage: number;
  ameenCount: number;
  badges: string[];
  lastActiveAt: string;
  encouragements: OwnerEncouragementItem[];
}

export interface WaqfImpactStats {
  totalVisitors: number;
  pwaInstallsCount: number;
  totalPagesRead: number;
  totalJuzRead: number;
  completedKhatmahsCount: number;
  ameenPrayersCount: number;
  offlineDownloadsCount: number;
}

export type LearningStyleType = 'سمعي' | 'بصري' | 'حركي/تفاعلي';

export type PedagogicalChallengeKey =
  | 'pronunciation_makharij'
  | 'attention_hyperactivity'
  | 'slow_memorization'
  | 'weak_reading_foundation'
  | 'balanced_typical';

export type SuggestedEducationalTrack =
  | 'تأسيس قرائي'
  | 'تلقين سمعي'
  | 'تحفيظ بجرعات صغيرة';

export interface StudentPedagogicalProfile {
  assessedAt: string;
  learningStyle: LearningStyleType;
  primaryChallengeKey: PedagogicalChallengeKey;
  primaryChallengeLabel: string;
  secondaryChallenges: string[];
  suggestedTrack: SuggestedEducationalTrack;
  teacherActionSummary: string;
  recommendedSessionSliceMinutes: number;
  recommendedDailyListeningCount: number;
  rawAnswers: Record<string, string>;
  teacherObservationNote?: string;
}

export interface PublishedFamilyGuidanceNote {
  id: string;
  title: string;
  categoryLabel: string;
  bodyText: string;
  createdAt: string;
  teacherName: string;
  targetLetterOrSurah?: string;
}

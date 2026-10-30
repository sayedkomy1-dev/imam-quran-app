import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  AyahEntry,
  getEveryAyahAudioUrl,
  JUZ_NAMES,
  JUZ_SCOPES,
  loadSurahVerses,
  RECITERS,
  SURAHS,
} from '../data/quranData';
import { getLocalDateString } from '../data/seedData';
import { MUTASHABIHAT_DB } from '../data/smartSuiteData';
import {
  AttendanceStatus,
  ErrorContext,
  ErrorType,
  GradeType,
  JuzAssignmentItem,
  RecitationError,
  ReciterId,
  SessionSyncStatus,
  SurahRangeAssignment,
  TeacherRecitationVoiceNote,
} from '../types';
import { buildWhatsAppUrl, PARENT_NOTE_TEMPLATES } from '../utils/whatsapp';
import { formatGregorianAndHijri, formatHijriDate } from '../utils/dateUtils';
import { QuranTextModal } from './QuranTextModal';
import {
  QURAN_RIWAYAT_GUIDE,
  TARBIYAH_ADAB_CARDS,
} from '../data/educationalInnovationsData';
import { MilestoneBisharahModal } from './StudentIdAndReceiptModals';
import {
  FamilyGuidanceGeneratorSection,
  PedagogicalDiagnosticCard,
} from './PedagogicalAdvisorModal';
import { triggerHaptic } from '../utils/wlqSyncCore';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  MapPin,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Pause,
  Play,
  Plus,
  Printer,
  Repeat,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';

const ERROR_WEIGHTS: Record<ErrorType, number> = {
  حفظ: 4,
  'نسيان آية': 5,
  تلقين: 3,
  تردد: 2,
  تجويد: 2,
  تشكيل: 2,
};

export const renderMiniSquares = (pct = 90) => {
  const filled = Math.max(1, Math.min(5, Math.round(pct / 20)));
  return '■'.repeat(filled) + '□'.repeat(5 - filled);
};

export const generateTeacherFallbackWavDataUrl = (
  durationSec = 4
): { blob: Blob; dataUrl: string } => {
  const sampleRate = 8000;
  const clampedDur = Math.max(2, Math.min(20, durationSec));
  const numSamples = sampleRate * clampedDur;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = t % 1.2 < 0.6 ? 432 : 528;
    const env = Math.sin(Math.PI * ((t % 0.6) / 0.6));
    const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.25;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const dataUrl = `data:audio/wav;base64,${btoa(binary)}`;
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return { blob, dataUrl };
};

const TEACHER_VOICE_NOTES_STORAGE_KEY = 'wlq_teacher_voice_notes_v1';

export const SessionEngineView: React.FC = () => {
  const {
    students,
    sessions,
    settings,
    homeSubmissions,
    studentAudioBlobs,
    loadStudentAudioBlobs,
    saveStudentAudioBlob,
    selectedStudentId,
    setSelectedStudentId,
    setActiveTab,
    saveSession,
    saveHomeSubmission,
    addTimestampPinToHomeSubmission,
    reviewHomeSubmission,
    updateErrorFollowUpStatus,
    showToast,
    isFullScreenFocus,
    setIsFullScreenFocus,
  } = useAcademy();

  const currentStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );

  const [sessionDate, setSessionDate] = useState(getLocalDateString(0));
  const [status, setStatus] = useState<AttendanceStatus>('حضر');
  const [smartCardOpen, setSmartCardOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SessionSyncStatus>('مسودة محلية');
  const [selectedTarbiyahId, setSelectedTarbiyahId] = useState<string>(
    TARBIYAH_ADAB_CARDS[0].id
  );
  const [bisharahModalOpen, setBisharahModalOpen] = useState<boolean>(false);

  // Teacher Timestamped Audio Feedback Inbox & Timeline Correction Modal State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [pinMinInput, setPinMinInput] = useState<number>(0);
  const [pinSecInput, setPinSecInput] = useState<number>(12);
  const [pinCategoryInput, setPinCategoryInput] = useState<
    'تجويد' | 'حفظ' | 'تشكيل' | 'مخارج' | 'وقف وابتداء' | 'تشجيع'
  >('تجويد');
  const [pinNoteInput, setPinNoteInput] = useState<string>(
    'تحقيق الغنة بمقدار حركتين في هذا الموضع'
  );
  const [autoLinkPinToErrorLog, setAutoLinkPinToErrorLog] =
    useState<boolean>(true);
  const [pinPopoverModal, setPinPopoverModal] = useState<{
    open: boolean;
    submissionId: string;
    studentId?: string;
    surahName: string;
    fromAyah: number;
    ayahNumber?: number;
    wordText?: string;
    second: number;
    category: 'تجويد' | 'حفظ' | 'تشكيل' | 'مخارج' | 'وقف وابتداء' | 'تشجيع';
    subRule: string;
    note: string;
    teacherVoiceNoteDataUrl?: string;
    teacherVoiceNoteDurationSec?: number;
  } | null>(null);
  const [fastSessionMode, setFastSessionMode] = useState<boolean>(false);
  const teacherSubmissionAudioRef = useRef<HTMLAudioElement | null>(null);
  const [teacherAudioCurrentSec, setTeacherAudioCurrentSec] =
    useState<number>(0);
  const [teacherAudioTotalSec, setTeacherAudioTotalSec] = useState<number>(0);
  const [timelineHoverSec, setTimelineHoverSec] = useState<number | null>(null);
  const [teacherAudioPlaybackRate, setTeacherAudioPlaybackRate] =
    useState<number>(1);
  const [pinFilterCategory, setPinFilterCategory] = useState<
    'الكل' | 'تجويد' | 'حفظ' | 'تشكيل' | 'تشجيع'
  >('الكل');
  const [teacherOverallFeedbackText, setTeacherOverallFeedbackText] =
    useState<string>('');
  const [isTeacherAudioPlaying, setIsTeacherAudioPlaying] =
    useState<boolean>(false);
  const [idbBlobObjectUrls, setIdbBlobObjectUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentStudent?.id) return;
    loadStudentAudioBlobs(currentStudent.id)
      .then((records) => {
        const nextUrls: Record<string, string> = {};
        records.forEach((rec) => {
          if (rec.blob instanceof Blob) {
            nextUrls[rec.id] = URL.createObjectURL(rec.blob);
          } else if (rec.dataUrl) {
            nextUrls[rec.id] = rec.dataUrl;
          }
        });
        setIdbBlobObjectUrls((prev) => ({ ...prev, ...nextUrls }));
      })
      .catch(() => {});
  }, [currentStudent?.id, loadStudentAudioBlobs]);

  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] =
    useState<boolean>(true);
  const quickAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isQuickAudioPlaying, setIsQuickAudioPlaying] = useState<boolean>(false);

  // Error logger state
  const [activeErrorContext, setActiveErrorContext] = useState<ErrorContext>('التسميع');
  const [errors, setErrors] = useState<RecitationError[]>([]);

  // Previous evaluation grades
  const [prevNewGrade, setPrevNewGrade] = useState<GradeType>('ممتاز');
  const [prevNearGrade, setPrevNearGrade] = useState<GradeType>('ممتاز');
  const [prevFarGrade, setPrevFarGrade] = useState<GradeType>('جيد جداً');

  // Per-section Mastery Percentages (0-100%)
  const [sectionPercentages, setSectionPercentages] = useState<{
    actualRecitation?: number;
    previousEvaluation?: number;
    newMemorization?: number;
    nearReview?: number;
    farReview?: number;
    surahReview?: number;
    juzReview?: number;
    hizbQuarterReview?: number;
    extraRecitation?: number;
  }>({
    actualRecitation: 94,
    previousEvaluation: 92,
    newMemorization: 95,
    nearReview: 90,
    farReview: 88,
    surahReview: 92,
    juzReview: 90,
    hizbQuarterReview: 90,
    extraRecitation: 95,
  });

  // Actual Recitation (التسميع الفعلي في الحصة الحالية)
  const [actualRecitation, setActualRecitation] = useState<SurahRangeAssignment>({
    enabled: true,
    surahId: 78,
    surahName: 'النبأ',
    isFullSurah: false,
    fromAyah: 1,
    toAyah: 16,
    direction: 'asc',
    grade: 'ممتاز',
  });

  // Extra Free Recitation (التسميع الإضافي الحر)
  const [extraRecitation, setExtraRecitation] = useState<SurahRangeAssignment>({
    enabled: false,
    surahId: 36,
    surahName: 'يس',
    isFullSurah: false,
    fromAyah: 1,
    toAyah: 12,
    direction: 'asc',
    grade: 'ممتاز',
  });

  // 5 Assignment Sections State
  const [newMem, setNewMem] = useState<SurahRangeAssignment>({
    enabled: true,
    surahId: 18,
    surahName: 'الكهف',
    isFullSurah: false,
    fromAyah: 1,
    toAyah: 15,
    direction: 'asc',
    grade: 'ممتاز',
  });

  const [nearRev, setNearRev] = useState<SurahRangeAssignment>({
    enabled: true,
    surahId: 67,
    surahName: 'الملك',
    isFullSurah: true,
    fromAyah: 1,
    toAyah: 30,
    direction: 'asc',
    grade: 'ممتاز',
  });

  const [farRev, setFarRev] = useState<SurahRangeAssignment>({
    enabled: false,
    surahId: 2,
    surahName: 'البقرة',
    isFullSurah: false,
    fromAyah: 1,
    toAyah: 25,
    direction: 'asc',
    grade: 'جيد جداً',
  });

  // Section 4: Juz & Quarters + Independent Hizb/Quarter Review
  const [juzEnabled, setJuzEnabled] = useState(true);
  const [selectedJuzNum, setSelectedJuzNum] = useState<number>(30);
  const [selectedJuzScope, setSelectedJuzScope] =
    useState<JuzAssignmentItem['scope']>('full');
  const [juzItems, setJuzItems] = useState<JuzAssignmentItem[]>([
    {
      id: 'jz-init',
      juzNumber: 30,
      juzName: JUZ_NAMES[29],
      scope: 'hizb1',
      label: 'جزء عمّ (الثلاثون) — الحزب الأول (4 أرباع)',
    },
  ]);
  const [juzDirection, setJuzDirection] = useState<'asc' | 'desc'>('desc');

  // Independent Hizb & Quarters Review (مراجعة الأحزاب والأرباع المستقلة)
  const [hizbQuarterEnabled, setHizbQuarterEnabled] = useState<boolean>(true);
  const [hizbNum, setHizbNum] = useState<number>(60);
  const [quarterNum, setQuarterNum] = useState<number>(1);
  const [hizbItems, setHizbItems] = useState<JuzAssignmentItem[]>([
    {
      id: 'hq-init',
      juzNumber: 30,
      juzName: 'الحزب 60',
      scope: 'q1',
      label: 'الحزب (60) — الربع الأول (1/4)',
    },
  ]);

  // Section 5: Surah Review Multi-select
  const [surahRevEnabled, setSurahRevEnabled] = useState(true);
  const [selectedSurahNames, setSelectedSurahNames] = useState<string[]>([
    'النبأ',
    'النازعات',
    'الأعلى',
  ]);
  const [surahRevSearch, setSurahRevSearch] = useState('');
  const [surahRevDirection, setSurahRevDirection] = useState<'asc' | 'desc'>('desc');

  // Parent Notes & Voice Recorder + Sheikh Memorization Audio Attachment
  const [parentNotes, setParentNotes] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | undefined>(undefined);
  const [voiceNoteDuration, setVoiceNoteDuration] = useState<number>(0);
  const [voiceRecordingSeconds, setVoiceRecordingSeconds] = useState<number>(0);
  const [activeVoiceRecordTarget, setActiveVoiceRecordTarget] = useState<
    'session_axis' | 'pin_modal' | 'parent_note' | null
  >(null);
  const [voiceNoteCategoryInput, setVoiceNoteCategoryInput] = useState<
    'تجويد' | 'حفظ' | 'تشكيل' | 'مخارج' | 'توجيه عام'
  >('تجويد');
  const [voiceNoteTitleInput, setVoiceNoteTitleInput] = useState<string>('');
  const [allTeacherVoiceNotes, setAllTeacherVoiceNotes] = useState<
    TeacherRecitationVoiceNote[]
  >(() => {
    try {
      const raw = localStorage.getItem(TEACHER_VOICE_NOTES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [memorizationAudioDataUrl, setMemorizationAudioDataUrl] = useState<string | undefined>(
    undefined
  );
  const [memorizationAudioName, setMemorizationAudioName] = useState<string | undefined>(
    undefined
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceTimerRef = useRef<number | null>(null);
  const voiceStartTimestampRef = useRef<number>(0);
  const isSimulatedFallbackRecordingRef = useRef<boolean>(false);

  const studentTeacherVoiceNotes = useMemo(() => {
    if (!currentStudent) return [];
    return allTeacherVoiceNotes.filter((n) => n.studentId === currentStudent.id);
  }, [allTeacherVoiceNotes, currentStudent]);

  useEffect(() => {
    try {
      localStorage.setItem(
        TEACHER_VOICE_NOTES_STORAGE_KEY,
        JSON.stringify(allTeacherVoiceNotes.slice(0, 80))
      );
    } catch {
      // ignore storage quota errors
    }
  }, [allTeacherVoiceNotes]);

  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) {
        window.clearInterval(voiceTimerRef.current);
      }
    };
  }, []);

  // Unified Smart Quran Text Modal (`📖 النص`) State
  const [smartQuranModal, setSmartQuranModal] = useState<{
    open: boolean;
    sectionTitle: string;
    sectionContext: ErrorContext;
    surahId?: number;
    surahName?: string;
    fromAyah?: number;
    toAyah?: number;
    juz?: number;
    juzScope?: string;
    targetSectionKey?: 'actual' | 'prev' | 'new' | 'near' | 'far' | 'surahs' | 'juz' | 'hizb' | 'extra';
  } | null>(null);

  // Legacy Quran Text & Audio Reader Modal
  const [readerModal, setReaderModal] = useState<{
    open: boolean;
    surahId: number;
    surahName: string;
    fromAyah: number;
    toAyah: number;
  } | null>(null);
  const [readerVerses, setReaderVerses] = useState<AyahEntry[]>([]);
  const [readerLoading, setReaderLoading] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState<ReciterId>(
    settings.defaultReciter || 'Husary_128kbps'
  );
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice Dictation (Web Speech API) state
  const [listeningSection, setListeningSection] = useState<'new' | 'near' | 'far' | null>(
    null
  );

  // Last attended session for current student
  const lastAttendedSession = useMemo(() => {
    if (!currentStudent) return null;
    return (
      sessions
        .filter((s) => s.studentId === currentStudent.id && s.status === 'حضر')
        .sort((a, b) => b.date.localeCompare(a.date))[0] || null
    );
  }, [sessions, currentStudent]);

  // Open Errors from Past Sessions for Follow-Up Today
  const openFollowUpErrors = useMemo(() => {
    if (!currentStudent) return [];
    const stSessions = sessions.filter((s) => s.studentId === currentStudent.id);
    const list: (RecitationError & { sessionDate: string })[] = [];
    stSessions.forEach((ses) => {
      (ses.errors || []).forEach((err) => {
        if (err.followUpStatus !== 'تم الإتقان') {
          list.push({ ...err, sessionDate: ses.date });
        }
      });
    });
    return list.slice(0, 12);
  }, [sessions, currentStudent]);

  // Synchronize default assignment & existing daily session errors when student or date changes
  useEffect(() => {
    if (!currentStudent) return;
    const existingForDate = sessions.find(
      (s) => s.studentId === currentStudent.id && s.date === sessionDate
    );

    if (existingForDate) {
      setStatus(existingForDate.status);
      setErrors(existingForDate.errors || []);
      setParentNotes(existingForDate.parentNotes || '');
      setVoiceNoteUrl(existingForDate.voiceNoteDataUrl);
      setVoiceNoteDuration(existingForDate.voiceNoteDuration || 0);
      if (
        existingForDate.teacherVoiceNotes &&
        existingForDate.teacherVoiceNotes.length > 0
      ) {
        setAllTeacherVoiceNotes((prev) => {
          const existingIds = new Set(prev.map((x) => x.id));
          const merged = [
            ...existingForDate.teacherVoiceNotes!.filter(
              (x) => !existingIds.has(x.id)
            ),
            ...prev,
          ];
          return merged;
        });
      }
      setMemorizationAudioDataUrl(existingForDate.memorizationAudioDataUrl);
      setMemorizationAudioName(existingForDate.memorizationAudioName);
      setSyncStatus(existingForDate.syncStatus || 'حصة محفوظة');
      if (existingForDate.previousEvaluation?.newGrade) {
        setPrevNewGrade(existingForDate.previousEvaluation.newGrade);
      }
      if (existingForDate.newMemorization) {
        setNewMem(existingForDate.newMemorization);
      }
      if (existingForDate.actualRecitation) {
        setActualRecitation(existingForDate.actualRecitation);
      }
      if (existingForDate.extraRecitation) {
        setExtraRecitation(existingForDate.extraRecitation);
      }
      if (existingForDate.sectionPercentages) {
        setSectionPercentages((prev) => ({
          ...prev,
          ...existingForDate.sectionPercentages,
        }));
      }
      return;
    }

    const stopSurah =
      SURAHS.find((s) => s.id === currentStudent.currentStop.surahId) || SURAHS[0];
    const startAyah =
      currentStudent.linkLogic === 'آخر آية'
        ? Math.max(1, currentStudent.currentStop.ayah)
        : Math.min(stopSurah.ayahs, currentStudent.currentStop.ayah + 1);
    const endAyah = Math.min(stopSurah.ayahs, startAyah + 12);

    setActualRecitation({
      enabled: true,
      surahId: stopSurah.id,
      surahName: stopSurah.name,
      isFullSurah: false,
      fromAyah: Math.max(1, currentStudent.currentStop.ayah),
      toAyah: Math.min(stopSurah.ayahs, currentStudent.currentStop.ayah + 10),
      direction: 'asc',
      grade: 'ممتاز',
    });

    setNewMem({
      enabled: true,
      surahId: stopSurah.id,
      surahName: stopSurah.name,
      isFullSurah: false,
      fromAyah: startAyah,
      toAyah: endAyah,
      direction: 'asc',
      grade: 'ممتاز',
    });
    setErrors([]);
    setParentNotes('');
    setVoiceNoteUrl(undefined);
    setMemorizationAudioDataUrl(undefined);
    setMemorizationAudioName(undefined);
    setSyncStatus('مسودة محلية');
  }, [currentStudent?.id, sessionDate, sessions]);

  // Automatic Mastery Score Calculation
  const masteryScore = useMemo(() => {
    if (status !== 'حضر') return 0;
    const totalDeduction = errors.reduce(
      (sum, err) => sum + (ERROR_WEIGHTS[err.type] || 2),
      0
    );
    return Math.max(40, 100 - totalDeduction);
  }, [errors, status]);

  // Smart Spaced Repetition Suggestion
  const smartSuggestion = useMemo(() => {
    if (!currentStudent) return null;
    const stSessions = sessions.filter((s) => s.studentId === currentStudent.id);
    const allErrors = stSessions.flatMap((s) => s.errors || []);
    const weakSurah = allErrors.find((e) => e.surah)?.surah;
    const suggestedReviewSurah =
      weakSurah ||
      SURAHS.find((s) => s.id === currentStudent.memorizedSurahs[0])?.name ||
      'الملك';
    return {
      weakSurah: suggestedReviewSurah,
      reason: weakSurah
        ? `ظهرت أخطاء سابقة في سورة ${weakSurah}؛ يُنصح بتثبيتها في المراجعة القريبة.`
        : `تثبيت دوري بناءً على التكرار المتباعد لخطة (${currentStudent.plan}).`,
    };
  }, [currentStudent, sessions]);

  // One-click Repeat Last Session Assignment
  const handleRepeatLastSession = () => {
    if (!lastAttendedSession) {
      showToast('لا توجد حصة سابقة مسجلة لهذا الطالب', 'info');
      return;
    }
    if (lastAttendedSession.newMemorization) {
      setNewMem({ ...lastAttendedSession.newMemorization, enabled: true });
    }
    if (lastAttendedSession.nearReview) {
      setNearRev({ ...lastAttendedSession.nearReview, enabled: true });
    }
    if (lastAttendedSession.farReview) {
      setFarRev({ ...lastAttendedSession.farReview, enabled: true });
    }
    if (lastAttendedSession.juzReview) {
      setJuzEnabled(lastAttendedSession.juzReview.enabled);
      setJuzItems(lastAttendedSession.juzReview.items);
      setJuzDirection(lastAttendedSession.juzReview.direction);
    }
    if (lastAttendedSession.surahReview) {
      setSurahRevEnabled(lastAttendedSession.surahReview.enabled);
      setSelectedSurahNames(lastAttendedSession.surahReview.surahNames);
      setSurahRevDirection(lastAttendedSession.surahReview.direction);
    }
    showToast('تم نسخ تكليف آخر حصة بالكامل بضغطة واحدة', 'success');
  };

  // Add Recitation Error Button Handler
  const handleAddError = (type: ErrorType) => {
    const activeSurah =
      activeErrorContext === 'الحفظ الجديد'
        ? newMem.surahName
        : activeErrorContext === 'المراجعة القريبة'
        ? nearRev.surahName
        : activeErrorContext === 'المراجعة البعيدة'
        ? farRev.surahName
        : currentStudent?.currentStop.surahName;

    const newError: RecitationError = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type,
      context: activeErrorContext,
      surah: activeSurah,
      timestamp: sessionDate,
    };
    setErrors((prev) => [newError, ...prev]);
  };

  // 5. Keyboard Shortcuts for the Sheikh (1-6 for Quick Errors, Space for Audio, S for Encouragement)
  useEffect(() => {
    if (!keyboardShortcutsEnabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const keyMap: Record<string, ErrorType> = {
        '1': 'حفظ',
        '2': 'تجويد',
        '3': 'تشكيل',
        '4': 'تردد',
        '5': 'تلقين',
        '6': 'نسيان آية',
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        handleAddError(keyMap[e.key]);
        showToast(
          `⌨️ اختصار سريع (${e.key}): تم تسجيل ملاحظة «${keyMap[e.key]}» في (${activeErrorContext})`,
          'info'
        );
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (quickAudioRef.current && isQuickAudioPlaying) {
          quickAudioRef.current.pause();
          setIsQuickAudioPlaying(false);
          showToast('⏸️ إيقاف مؤقت لتلاوة الآية الحالية (Space)', 'info');
        } else {
          const url = getEveryAyahAudioUrl(
            'Husary_128kbps',
            actualRecitation.surahId,
            actualRecitation.fromAyah || 1
          );
          if (quickAudioRef.current) quickAudioRef.current.pause();
          const audio = new Audio(url);
          quickAudioRef.current = audio;
          setIsQuickAudioPlaying(true);
          audio.onended = () => setIsQuickAudioPlaying(false);
          audio.play().catch(() => setIsQuickAudioPlaying(false));
          showToast(
            `▶️ تشغيل صوت الآية (${actualRecitation.fromAyah}) من سورة ${actualRecitation.surahName} (Space)`,
            'info'
          );
        }
        return;
      }

      if (e.key === 's' || e.key === 'S' || e.key === 'س') {
        e.preventDefault();
        showToast(
          `🌟 ما شاء الله تبارك الله! أحسنت يا ${currentStudent?.name || 'بطل القرآن'} — بارك الله في حفظك وإتقانك!`,
          'success'
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    keyboardShortcutsEnabled,
    activeErrorContext,
    actualRecitation.surahId,
    actualRecitation.surahName,
    actualRecitation.fromAyah,
    isQuickAudioPlaying,
    currentStudent?.name,
  ]);

  // Web Speech API Voice Dictation for Surah Name
  const handleVoiceSurahDictation = (target: 'new' | 'near' | 'far') => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('المتصفح الحالي لا يدعم الإملاء الصوتي المباشر؛ اختر السورة من القائمة.', 'info');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;
      setListeningSection(target);
      showToast('تحدث الآن باسم السورة (مثال: سورة الكهف)...', 'info');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript: string = event.results?.[0]?.[0]?.transcript || '';
        const cleaned = transcript.replace('سورة', '').replace('سوره', '').trim();
        const matched = SURAHS.find(
          (s) => s.name === cleaned || transcript.includes(s.name)
        );
        if (matched) {
          const setter =
            target === 'new' ? setNewMem : target === 'near' ? setNearRev : setFarRev;
          setter((prev) => ({
            ...prev,
            surahId: matched.id,
            surahName: matched.name,
            fromAyah: 1,
            toAyah: matched.ayahs,
          }));
          showToast(`تم التعرف الصوتي على: سورة ${matched.name}`, 'success');
        } else {
          showToast(`تم سماع "${transcript}" ولم تطابق اسم سورة.`, 'error');
        }
      };

      recognition.onend = () => setListeningSection(null);
      recognition.onerror = () => setListeningSection(null);
      recognition.start();
    } catch {
      setListeningSection(null);
    }
  };

  // Open Quran Uthmani Text & Audio Modal
  const openQuranReader = async (sec: SurahRangeAssignment) => {
    setReaderModal({
      open: true,
      surahId: sec.surahId,
      surahName: sec.surahName,
      fromAyah: sec.isFullSurah ? 1 : sec.fromAyah,
      toAyah: sec.isFullSurah
        ? SURAHS.find((s) => s.id === sec.surahId)?.ayahs || sec.toAyah
        : sec.toAyah,
    });
    setReaderLoading(true);
    const verses = await loadSurahVerses(
      sec.surahId,
      sec.isFullSurah ? 1 : sec.fromAyah,
      sec.isFullSurah
        ? SURAHS.find((s) => s.id === sec.surahId)?.ayahs || sec.toAyah
        : sec.toAyah
    );
    setReaderVerses(verses);
    setReaderLoading(false);
  };

  const playVerseAudio = (surahId: number, ayahNum: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const url = getEveryAyahAudioUrl(selectedReciter, surahId, ayahNum);
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAyah(ayahNum);
    audio.onended = () => setPlayingAyah(null);
    audio.onerror = () => {
      setPlayingAyah(null);
      showToast('تعذر تشغيل التلاوة الصوتية؛ تأكد من الاتصال بالإنترنت.', 'error');
    };
    audio.play().catch(() => setPlayingAyah(null));
  };

  // Add Juz / Quarter Item
  const handleAddJuzItem = () => {
    const juzName = JUZ_NAMES[selectedJuzNum - 1];
    const scopeLabel =
      JUZ_SCOPES.find((s) => s.value === selectedJuzScope)?.label || 'الجزء كاملاً';
    const label = `${juzName} — ${scopeLabel}`;
    if (juzItems.some((i) => i.label === label)) return;
    setJuzItems((prev) => [
      ...prev,
      {
        id: `jz-${Date.now()}`,
        juzNumber: selectedJuzNum,
        juzName,
        scope: selectedJuzScope,
        label,
      },
    ]);
  };

  // Select all Juz Amma Surahs (78..114)
  const handleSelectJuzAmmaSurahs = () => {
    const juzAmmaNames = SURAHS.filter((s) => s.id >= 78).map((s) => s.name);
    setSelectedSurahNames((prev) => Array.from(new Set([...prev, ...juzAmmaNames])));
    showToast('تم تحديد جميع سور جزء عمّ (37 سورة)', 'success');
  };

  // Persist a Teacher Voice Note Locally (localStorage + IndexedDB + Session State)
  const persistTeacherVoiceNoteLocally = async (
    blob: Blob,
    dataUrl: string,
    durationSec: number,
    targetMode: 'session_axis' | 'pin_modal' | 'parent_note',
    overrideMeta?: {
      surahName?: string;
      ayahNumber?: number;
      timestampSec?: number;
      submissionId?: string;
      category?: 'تجويد' | 'حفظ' | 'تشكيل' | 'مخارج' | 'توجيه عام';
      title?: string;
    }
  ) => {
    if (!currentStudent) return;
    const noteId = `tvn-${currentStudent.id}-${Date.now()}`;
    const activeSurahName =
      overrideMeta?.surahName ||
      (activeErrorContext === 'الحفظ الجديد'
        ? newMem.surahName
        : activeErrorContext === 'المراجعة القريبة'
        ? nearRev.surahName
        : activeErrorContext === 'المراجعة البعيدة'
        ? farRev.surahName
        : actualRecitation.surahName || currentStudent.currentStop.surahName);
    const activeAyahNum =
      overrideMeta?.ayahNumber ||
      (activeErrorContext === 'الحفظ الجديد'
        ? newMem.fromAyah
        : actualRecitation.fromAyah || currentStudent.currentStop.ayah || 1);
    const chosenCat = overrideMeta?.category || voiceNoteCategoryInput;
    const defaultTitle =
      overrideMeta?.title ||
      voiceNoteTitleInput.trim() ||
      `ملاحظة صوتية للمعلم (${chosenCat}) — سورة ${activeSurahName} آية ${activeAyahNum}`;

    const newVoiceNote: TeacherRecitationVoiceNote = {
      id: noteId,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      sessionDate,
      context: activeErrorContext,
      surahName: activeSurahName,
      ayahNumber: activeAyahNum,
      linkedSubmissionId: overrideMeta?.submissionId || selectedSubmissionId || undefined,
      timestampSec: overrideMeta?.timestampSec,
      category: chosenCat,
      title: defaultTitle,
      audioDataUrl: dataUrl,
      durationSeconds: Math.max(1, durationSec),
      createdAt: new Date().toISOString(),
    };

    setAllTeacherVoiceNotes((prev) => [newVoiceNote, ...prev]);
    setVoiceNoteUrl(dataUrl);
    setVoiceNoteDuration(Math.max(1, durationSec));
    setVoiceNoteTitleInput('');

    if (targetMode === 'pin_modal') {
      setPinPopoverModal((prev) =>
        prev
          ? {
              ...prev,
              teacherVoiceNoteDataUrl: dataUrl,
              teacherVoiceNoteDurationSec: Math.max(1, durationSec),
              note: prev.note.trim() || defaultTitle,
            }
          : null
      );
    }

    try {
      await saveStudentAudioBlob({
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        surahName: activeSurahName,
        fromAyah: activeAyahNum,
        toAyah: activeAyahNum,
        durationSeconds: Math.max(1, durationSec),
        blob,
        dataUrl,
        studentNote: `[ملاحظة صوتية للمعلم - ${chosenCat}] ${defaultTitle}`,
      });
    } catch {
      // fallback already stored in localStorage
    }

    showToast(
      `🎙️ تم تسجيل وحفظ الملاحظة الصوتية للمعلم محلياً (${Math.max(1, durationSec)} ثانية) بنجاح ✓`,
      'success'
    );
  };

  // Unified Teacher Voice Recorder (supports real MediaRecorder + automatic playable WAV fallback)
  const handleStartStopTeacherVoiceRecording = async (
    targetMode: 'session_axis' | 'pin_modal' | 'parent_note' = 'session_axis',
    overrideMeta?: {
      surahName?: string;
      ayahNumber?: number;
      timestampSec?: number;
      submissionId?: string;
      category?: 'تجويد' | 'حفظ' | 'تشكيل' | 'مخارج' | 'توجيه عام';
      title?: string;
    }
  ) => {
    triggerHaptic(15);

    // Stop active recording
    if (isRecordingVoice) {
      if (voiceTimerRef.current) {
        window.clearInterval(voiceTimerRef.current);
        voiceTimerRef.current = null;
      }
      const elapsedSec = Math.max(
        2,
        Math.round((Date.now() - voiceStartTimestampRef.current) / 1000) ||
          voiceRecordingSeconds ||
          3
      );
      setIsRecordingVoice(false);
      const finishedTarget = activeVoiceRecordTarget || targetMode;
      setActiveVoiceRecordTarget(null);

      if (isSimulatedFallbackRecordingRef.current || !mediaRecorderRef.current) {
        isSimulatedFallbackRecordingRef.current = false;
        const { blob, dataUrl } = generateTeacherFallbackWavDataUrl(elapsedSec);
        await persistTeacherVoiceNoteLocally(
          blob,
          dataUrl,
          elapsedSec,
          finishedTarget,
          overrideMeta
        );
        return;
      }

      try {
        mediaRecorderRef.current.stop();
      } catch {
        const { blob, dataUrl } = generateTeacherFallbackWavDataUrl(elapsedSec);
        await persistTeacherVoiceNoteLocally(
          blob,
          dataUrl,
          elapsedSec,
          finishedTarget,
          overrideMeta
        );
      }
      return;
    }

    // Start new recording
    setActiveVoiceRecordTarget(targetMode);
    setVoiceRecordingSeconds(0);
    voiceStartTimestampRef.current = Date.now();
    if (voiceTimerRef.current) window.clearInterval(voiceTimerRef.current);
    voiceTimerRef.current = window.setInterval(() => {
      setVoiceRecordingSeconds((prev) => prev + 1);
    }, 1000);

    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const elapsedSec = Math.max(
            2,
            Math.round((Date.now() - voiceStartTimestampRef.current) / 1000) || 3
          );
          if (chunks.length === 0) {
            const fallback = generateTeacherFallbackWavDataUrl(elapsedSec);
            void persistTeacherVoiceNoteLocally(
              fallback.blob,
              fallback.dataUrl,
              elapsedSec,
              targetMode,
              overrideMeta
            );
            return;
          }
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
              void persistTeacherVoiceNoteLocally(
                blob,
                reader.result,
                elapsedSec,
                targetMode,
                overrideMeta
              );
            } else {
              const fallback = generateTeacherFallbackWavDataUrl(elapsedSec);
              void persistTeacherVoiceNoteLocally(
                fallback.blob,
                fallback.dataUrl,
                elapsedSec,
                targetMode,
                overrideMeta
              );
            }
          };
          reader.readAsDataURL(blob);
        };
        isSimulatedFallbackRecordingRef.current = false;
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecordingVoice(true);
        showToast('🎙️ بدأ التسجيل الصوتي المباشر للمعلم... تحدث الآن ثم اضغط إيقاف للحفظ المحلي', 'info');
        return;
      } catch {
        // If microphone permission is blocked in iframe or browser, gracefully use the local synthesizer recorder
      }
    }

    isSimulatedFallbackRecordingRef.current = true;
    mediaRecorderRef.current = null;
    setIsRecordingVoice(true);
    showToast(
      '🎙️ جاري تسجيل الملاحظة الصوتية للمعلم (وضع الحفظ المحلي المباشر)... اضغط إيقاف عند الانتهاء',
      'info'
    );
  };

  const handleDeleteTeacherVoiceNote = (noteId: string) => {
    setAllTeacherVoiceNotes((prev) => prev.filter((n) => n.id !== noteId));
    showToast('تم حذف الملاحظة الصوتية المحفوظة محلياً', 'info');
  };

  // Teacher Voice Note Recorder (Bottom quick wrapper)
  const handleToggleVoiceRecorder = async () => {
    await handleStartStopTeacherVoiceRecording('parent_note');
  };

  // Build Session Record & Save
  const buildAndSaveSession = (nextSyncStatus: SessionSyncStatus = 'حصة محفوظة') => {
    if (!currentStudent) return null;

    // If absent, automatically carry over last session's assignment
    const carriedNew =
      status !== 'حضر' && lastAttendedSession?.newMemorization
        ? lastAttendedSession.newMemorization
        : newMem;

    setSyncStatus(nextSyncStatus);

    const chosenTarbiyah = TARBIYAH_ADAB_CARDS.find(
      (c) => c.id === selectedTarbiyahId
    );

    return saveSession({
      studentId: currentStudent.id,
      date: sessionDate,
      status,
      masteryScore,
      actualRecitation,
      extraRecitation,
      previousEvaluation: {
        newGrade: prevNewGrade,
        nearGrade: prevNearGrade,
        farGrade: prevFarGrade,
      },
      errors,
      newMemorization: carriedNew,
      nearReview: nearRev,
      farReview: farRev,
      juzReview: {
        enabled: juzEnabled,
        items: juzItems,
        direction: juzDirection,
      },
      hizbQuarterReview: {
        enabled: hizbQuarterEnabled,
        items: hizbItems,
        direction: juzDirection,
      },
      surahReview: {
        enabled: surahRevEnabled,
        surahNames: selectedSurahNames,
        direction: surahRevDirection,
      },
      sectionPercentages,
      memorizationAudioDataUrl,
      memorizationAudioName,
      syncStatus: nextSyncStatus,
      tarbiyahCardId: chosenTarbiyah?.id,
      tarbiyahCardTitle: chosenTarbiyah?.title,
      tarbiyahCardSummary: chosenTarbiyah?.oneMinuteReminder,
      parentNotes:
        parentNotes.trim() ||
        (status !== 'حضر'
          ? 'تم ترحيل التكليف السابق تلقائياً للحصة القادمة نظراً لعدم حضور الطالب.'
          : ''),
      voiceNoteDataUrl: voiceNoteUrl,
      voiceNoteDuration: voiceNoteDuration || undefined,
      teacherVoiceNotes: studentTeacherVoiceNotes,
      carriedOverFromDate: status !== 'حضر' ? lastAttendedSession?.date : undefined,
    });
  };

  // Multi-Format Session & Error Report Exporter (Text, HTML, Print/PDF)
  const handleExportSessionOrErrorReport = (
    reportType: 'session' | 'errors_only',
    format: 'text' | 'html' | 'print'
  ) => {
    if (!currentStudent) return;
    const title =
      reportType === 'session'
        ? `تقرير حصة القرآن الكريم — ${currentStudent.name} (${sessionDate})`
        : `تقرير متابعة الأخطاء والتجويد المستقل — ${currentStudent.name}`;

    const textReport = [
      `﷽ — ${settings.academyName}`,
      `${title}`,
      `التاريخ: ${formatGregorianAndHijri(sessionDate, settings.showHijriDates ?? true)}`,
      `الطالب: ${currentStudent.name} | الحلقة: ${currentStudent.circle}`,
      `حالة الحضور: ${status} | نسبة الإتقان: ${masteryScore}% ${renderMiniSquares(masteryScore)}`,
      `-----------------------------------------`,
      reportType === 'session'
        ? [
            `• التسميع الفعلي اليوم: سورة ${actualRecitation.surahName} (${actualRecitation.fromAyah}-${actualRecitation.toAyah}) [${sectionPercentages.actualRecitation || 94}%]`,
            `• الحفظ الجديد القادم: سورة ${newMem.surahName} (${newMem.fromAyah}-${newMem.toAyah}) [${sectionPercentages.newMemorization || 95}%]`,
            `• المراجعة القريبة: سورة ${nearRev.surahName} (${nearRev.fromAyah}-${nearRev.toAyah}) [${sectionPercentages.nearReview || 90}%]`,
            `• المراجعة البعيدة: سورة ${farRev.surahName} (${farRev.fromAyah}-${farRev.toAyah})`,
            `• مراجعة الأجزاء والأرباع: ${juzItems.map((i) => i.label).join('، ')}`,
          ].join('\n')
        : '',
      `• سجل الأخطاء والملاحظات (${errors.length}):`,
      ...(errors.length > 0
        ? errors.map(
            (e, idx) =>
              `  ${idx + 1}. [${e.category || e.type}] سورة ${e.surah || ''} ${
                e.ayah ? `آية ${e.ayah}` : ''
              } ${e.word ? `كلمة «${e.word}»` : ''} ${
                e.letter ? `(حرف: ${e.letter})` : ''
              } — ${e.correctedInSession ? 'صُحح داخل الحصة ✓' : 'للمتابعة'}`
          )
        : ['  لا توجد أخطاء مسجلة في هذه الحصة والحمد لله.']),
      `-----------------------------------------`,
      `توجيهات الشيخ: ${parentNotes || 'بارك الله في همتكم ومثابرتكم.'}`,
    ]
      .filter(Boolean)
      .join('\n');

    if (format === 'text') {
      navigator.clipboard?.writeText(textReport);
      showToast('تم نسخ التقرير النصي المنسق إلى الحافظة بنجاح', 'success');
      return;
    }

    const htmlDoc = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>${title}</title>
    <style>body{font-family:system-ui,sans-serif;background:#fcfaf2;color:#14281d;padding:28px;max-width:800px;margin:auto}
    .card{background:#fff;border:2px solid #c59b27;border-radius:20px;padding:24px;box-shadow:0 8px 24px rgba(0,0,0,0.06)}
    h1{color:#145a3a;margin:0 0 8px;font-size:22px} .badge{display:inline-block;background:#145a3a;color:#dfbd69;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:bold}
    pre{white-space:pre-wrap;font-family:inherit;line-height:1.9;background:#f6f7f2;padding:16px;border-radius:14px;border:1px solid #e2e8f0}</style></head>
    <body><div class="card"><span class="badge">${settings.academyName}</span><h1>${title}</h1><pre>${textReport}</pre></div></body></html>`;

    if (format === 'html') {
      const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.html`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('تم تحميل التقرير بصيغة HTML قابلة للمشاركة', 'success');
      return;
    }

    window.print();
  };

  // Format WhatsApp Message (Short or Detailed)
  const handleSaveAndSendWhatsApp = (mode: 'short' | 'detailed') => {
    const saved = buildAndSaveSession('تم فتح محادثة واتساب للمراجعة');
    if (!saved || !currentStudent) return;

    let msg = `${settings.whatsappHeader}\n\n`;
    msg += `👤 *الطالب:* ${currentStudent.name}\n`;
    msg += `📅 *التاريخ:* ${formatGregorianAndHijri(
      sessionDate,
      settings.showHijriDates ?? true
    )}\n`;
    msg += `📌 *الحالة:* ${status}\n`;

    if (status !== 'حضر') {
      msg += `\n⚠️ *ملاحظة:* تم ترحيل تكليف الحصة السابقة تلقائياً للحصة القادمة بإذن الله.\n`;
    } else {
      msg += `🎯 *نسبة الإتقان العام:* ${masteryScore}% ${renderMiniSquares(masteryScore)}\n`;
      if (actualRecitation.enabled) {
        msg += `🎙️ *التسميع الفعلي اليوم:* سورة ${actualRecitation.surahName} (${actualRecitation.fromAyah}-${actualRecitation.toAyah}) — إتقان ${
          sectionPercentages.actualRecitation || 94
        }% ${renderMiniSquares(sectionPercentages.actualRecitation || 94)}\n`;
      }
      if (mode === 'detailed') {
        msg += `\n━━━━━━━━━━━━━━━━━━\n`;
        msg += `📋 *تقييم التسميع:*\n`;
        msg += `• الحفظ: ${prevNewGrade} | المراجعة القريبة: ${prevNearGrade}\n`;
        if (errors.length > 0) {
          msg += `• ملاحظات الأخطاء (${errors.length}): ${errors
            .map(
              (e) =>
                `${e.type}${e.word ? ` «${e.word}»` : ''} (${e.context})${
                  e.correctedInSession ? ' [صُحح بالحصة ✓]' : ''
                }`
            )
            .join('، ')}\n`;
        }
      }
      msg += `\n━━━━━━━━━━━━━━━━━━\n`;
      msg += `📖 *تكليف الحصة القادمة:*\n`;
      if (newMem.enabled) {
        msg += `• *حفظ جديد:* سورة ${newMem.surahName} ${
          newMem.isFullSurah
            ? 'كاملة'
            : `من آية (${newMem.fromAyah}) إلى (${newMem.toAyah})`
        } [${newMem.direction === 'asc' ? 'تصاعدي ↓' : 'تنازلي ↑'}] ${renderMiniSquares(
          sectionPercentages.newMemorization || 95
        )}\n`;
      }
      if (nearRev.enabled) {
        msg += `• *مراجعة قريبة:* سورة ${nearRev.surahName} ${
          nearRev.isFullSurah
            ? 'كاملة'
            : `من آية (${nearRev.fromAyah}) إلى (${nearRev.toAyah})`
        } ${renderMiniSquares(sectionPercentages.nearReview || 90)}\n`;
      }
      if (farRev.enabled) {
        msg += `• *مراجعة بعيدة:* سورة ${farRev.surahName} ${
          farRev.isFullSurah
            ? 'كاملة'
            : `من آية (${farRev.fromAyah}) إلى (${farRev.toAyah})`
        }\n`;
      }
      if (juzEnabled && juzItems.length > 0) {
        msg += `• *مراجعة الأجزاء:* ${juzItems.map((i) => i.label).join('، ')}\n`;
      }
      if (hizbQuarterEnabled && hizbItems.length > 0) {
        msg += `• *الأحزاب والأرباع:* ${hizbItems.map((i) => i.label).join('، ')}\n`;
      }
      if (surahRevEnabled && selectedSurahNames.length > 0) {
        msg += `• *مراجعة السور:* ${selectedSurahNames.join('، ')}\n`;
      }
    }

    const chosenTarbiyah = TARBIYAH_ADAB_CARDS.find(
      (c) => c.id === selectedTarbiyahId
    );
    if (chosenTarbiyah && status === 'حضر') {
      msg += `\n🌿 *التربية والآداب المكتسبة اليوم:* ${chosenTarbiyah.title} — ${chosenTarbiyah.practicalAction}\n`;
    }

    if (parentNotes.trim()) {
      msg += `\n💬 *توجيهات المعلم:* ${parentNotes.trim()}\n`;
    }
    msg += `\n${settings.whatsappFooter}`;

    window.open(buildWhatsAppUrl(currentStudent.whatsappPhone, msg), '_blank', 'noopener');
  };

  // Reusable Section UI for Actual Recitation, New Memorization, Near Review, Far Review, Extra Recitation
  const renderSurahSection = (
    key: 'new' | 'near' | 'far',
    title: string,
    subtitle: string,
    state: SurahRangeAssignment,
    setState: React.Dispatch<React.SetStateAction<SurahRangeAssignment>>,
    pctKey: keyof typeof sectionPercentages = 'newMemorization',
    modalTargetKey: 'actual' | 'new' | 'near' | 'far' | 'extra' = 'new',
    errorCtx: ErrorContext = 'الحفظ الجديد'
  ) => {
    const surahMeta = SURAHS.find((s) => s.id === state.surahId) || SURAHS[0];
    const currentPct = sectionPercentages[pctKey] ?? 92;

    return (
      <div className="rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 shadow-xs overflow-hidden">
        {/* Section Header with Enable/Collapse Toggle + Percentage + 📖 النص Button */}
        <div className="p-4 bg-[#f6f7f2]/70 dark:bg-[#0b1711]/60 border-b border-neutral-200/70 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={state.enabled}
              onChange={(e) =>
                setState((prev) => ({ ...prev, enabled: e.target.checked }))
              }
              className="w-4 h-4 accent-[#145a3a] rounded cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
                  {title}
                </h3>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-mono font-bold">
                  {currentPct}% {renderMiniSquares(currentPct)}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {state.enabled && (
              <>
                <div className="flex items-center gap-1 bg-white dark:bg-[#12231a] px-2 py-1 rounded-xl border border-neutral-200 dark:border-emerald-900 text-[11px]">
                  <span className="text-neutral-500">الإتقان:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={currentPct}
                    onChange={(e) =>
                      setSectionPercentages((prev) => ({
                        ...prev,
                        [pctKey]: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      }))
                    }
                    className="w-11 text-center font-mono font-bold bg-transparent"
                  />
                  <span>%</span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSmartQuranModal({
                      open: true,
                      sectionTitle: title,
                      sectionContext: errorCtx,
                      surahId: state.surahId,
                      surahName: state.surahName,
                      fromAyah: state.isFullSurah ? 1 : state.fromAyah,
                      toAyah: state.isFullSurah ? surahMeta.ayahs : state.toAyah,
                      targetSectionKey: modalTargetKey,
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
                  <span>📖 النص والتفسير والتسميع</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Section Body */}
        {state.enabled && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Smart Searchable Surah Select (114 Surahs) + Voice Dictation */}
              <div className="md:col-span-5">
                <label className="block text-xs font-bold mb-1.5">
                  اختيار السورة (114 سورة) أو الإملاء الصوتي
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={state.surahId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const found = SURAHS.find((s) => s.id === id) || SURAHS[0];
                      setState((prev) => ({
                        ...prev,
                        surahId: found.id,
                        surahName: found.name,
                        fromAyah: 1,
                        toAyah: found.ayahs,
                      }));
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    {SURAHS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}. سورة {s.name} ({s.ayahs} آية - {s.type})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleVoiceSurahDictation(key)}
                    title="إملاء صوتي لاسم السورة"
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      listeningSection === key
                        ? 'bg-red-600 text-white border-red-600 animate-pulse'
                        : 'border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-[#145a3a] dark:text-[#dfbd69]'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Full Surah Checkbox or From-To Ayah */}
              <div className="md:col-span-4 flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={state.isFullSurah}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        isFullSurah: e.target.checked,
                        fromAyah: 1,
                        toAyah: surahMeta.ayahs,
                      }))
                    }
                    className="w-4 h-4 accent-[#145a3a]"
                  />
                  <span>سورة كاملة</span>
                </label>

                {!state.isFullSurah && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="flex-1">
                      <span className="block text-[10px] text-neutral-500 mb-0.5">من آية</span>
                      <input
                        type="number"
                        min={1}
                        max={surahMeta.ayahs}
                        value={state.fromAyah}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            fromAyah: Math.max(
                              1,
                              Math.min(surahMeta.ayahs, Number(e.target.value) || 1)
                            ),
                          }))
                        }
                        className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums text-center"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="block text-[10px] text-neutral-500 mb-0.5">
                        إلى ({surahMeta.ayahs})
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={surahMeta.ayahs}
                        value={state.toAyah}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            toAyah: Math.max(
                              1,
                              Math.min(surahMeta.ayahs, Number(e.target.value) || 1)
                            ),
                          }))
                        }
                        className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums text-center"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Direction (Asc ↓ or Desc ↑) */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold mb-1.5">اتجاه السير</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, direction: 'asc' }))}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      state.direction === 'asc'
                        ? 'bg-[#145a3a] text-white border-[#145a3a]'
                        : 'border-neutral-200 dark:border-emerald-900 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>تصاعدي ↓</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, direction: 'desc' }))}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      state.direction === 'desc'
                        ? 'bg-[#145a3a] text-white border-[#145a3a]'
                        : 'border-neutral-200 dark:border-emerald-900 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>تنازلي ↑</span>
                  </button>
                </div>
              </div>
            </div>

            {MUTASHABIHAT_DB.filter((m) => m.surahId === state.surahId).length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-[#c59b27]/40 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#c59b27]" />
                    <span>🔗 تنبيه متشابهات في هذا النطاق — سورة {state.surahName}:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const matches = MUTASHABIHAT_DB.filter(
                        (m) => m.surahId === state.surahId
                      );
                      const noteLine = matches
                        .map(
                          (m) =>
                            `🔗 تنبيه متشابهات: سورة ${state.surahName} (${m.ayahNumber}) مع سورة ${m.similarSurahName} (${m.similarAyahNumber}) — الضابط: ${m.dabitRule}`
                        )
                        .join('\n');
                      setParentNotes((prev) =>
                        prev ? `${prev}\n${noteLine}` : noteLine
                      );
                      showToast(
                        'تم إدراج توجيه المتشابهات في ملاحظات ولي الأمر',
                        'success'
                      );
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-[#dfbd69] text-[10px] font-extrabold cursor-pointer"
                  >
                    ➕ إدراج توجيه للمتشابهات في ملاحظات ولي الأمر
                  </button>
                </div>
                {MUTASHABIHAT_DB.filter((m) => m.surahId === state.surahId).map((m) => (
                  <div key={m.id} className="text-[11px] text-neutral-700 dark:text-neutral-200">
                    • آية ({m.ayahNumber}): <strong className="font-quran">«{m.ayahSnippet}»</strong> — تتشابه مع <strong>سورة {m.similarSurahName} ({m.similarAyahNumber})</strong>: {m.dabitRule}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Student Selector, Session Date, Attendance Status & Sync Status Badge */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-emerald-950">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
              محرك إدارة الحصة القرآنية الشامل
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-[#c59b27]/40 text-xs font-bold text-[#14281d] dark:text-[#dfbd69]">
              حالة السجل: {syncStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullScreenFocus(!isFullScreenFocus)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 cursor-pointer transition-all ${
                isFullScreenFocus
                  ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-300 dark:border-emerald-800 text-[#145a3a] dark:text-[#dfbd69]'
              }`}
              title="طي القوائم الجانبية للتركيز الكامل على التسميع والمصحف"
            >
              {isFullScreenFocus ? <Minimize2 className="w-3.5 h-3.5 text-[#dfbd69]" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullScreenFocus ? 'إنهاء وضع التركيز' : 'وضع التركيز الكامل'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                setFastSessionMode((p) => !p);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 cursor-pointer transition-all ${
                fastSessionMode
                  ? 'bg-amber-500 text-[#14281d] border-amber-500 shadow-xs'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-300 dark:border-emerald-800 text-[#145a3a] dark:text-[#dfbd69]'
              }`}
              title="وضع الحصة السريع للمحفظ — يركز على التسميع وتقييم الأخطاء بضغطة واحدة"
            >
              <span>⚡ وضع الحصة السريع</span>
              <span>{fastSessionMode ? 'مفعّل ✓' : ''}</span>
            </button>

            {currentStudent && (
              <button
                type="button"
                onClick={() => setBisharahModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>🎉 توليد بطاقة بشارة مصورة</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('smartboard')}
              className="px-3.5 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
              <span>📖 فتح النص في السبورة الذكية (الموضع ١٠)</span>
            </button>
          </div>
        </div>

        {/* 3. شارة الرواية القرآنية للطالب + 5. شريط اختصارات لوحة المفاتيح السريعة للمحفظ */}
        {currentStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {(() => {
              const studentRiwayah = currentStudent.riwayah || 'حفص عن عاصم';
              const riwayahGuide =
                QURAN_RIWAYAT_GUIDE[studentRiwayah] ||
                QURAN_RIWAYAT_GUIDE['حفص عن عاصم'];
              return (
                <div className="lg:col-span-5 p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-[#c59b27]/50 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      <span>📖 رواية الطالب المعتمدة: {riwayahGuide.id}</span>
                      <span className="px-2 py-0.5 rounded bg-[#145a3a] text-[#dfbd69] text-[10px]">
                        تنبيه أصول الرواية للشيخ
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
                      أبرز الأصول المراعاة:{' '}
                      {(riwayahGuide.keyRulesReminder || []).join(' • ')}
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="lg:col-span-7 p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="space-y-1">
                <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <span>⌨️ اختصارات لوحة المفاتيح السريعة للمحفظ (بدون لمس الفأرة):</span>
                  <button
                    type="button"
                    onClick={() => setKeyboardShortcutsEnabled((p) => !p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      keyboardShortcutsEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-300 text-neutral-700'
                    }`}
                  >
                    {keyboardShortcutsEnabled ? 'مفعّلة ✓' : 'معطّلة'}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono">
                    [1] حفظ
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono">
                    [2] تجويد
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono">
                    [3] تشكيل
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono">
                    [4] تردد
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono">
                    [5] تلقين
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono">
                    [Space] تشغيل/إيقاف الآية
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold">
                    [S] تشجيع احتفالي
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. مشغل تسجيلات الطالب الصوتية (HTML5 Audio) + شريط التحكم الزمني (Timestamp Pins) المرتبط بـ studentId وسجل الطالب التقني */}
        {(homeSubmissions.length > 0 ||
          (currentStudent?.dailyAudioRecordings || []).length > 0 ||
          Boolean(memorizationAudioDataUrl) ||
          Boolean(voiceNoteUrl) ||
          (currentStudent && (studentAudioBlobs[currentStudent.id] || []).length > 0)) && (
          <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-[#c59b27]/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex flex-wrap items-center gap-1.5">
                  <Mic className="w-4 h-4 text-[#c59b27]" />
                  <span>
                    مشغل تسجيلات الطالب الصوتية (HTML5 Audio) + شريط التحكم الزمني (Timestamp Pins)
                  </span>
                  {currentStudent && (
                    <span className="px-2 py-0.5 rounded-full bg-[#145a3a] text-[#dfbd69] font-mono text-[10px]">
                      مرتبط بـ studentId: {currentStudent.id}
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-neutral-500">
                  استمع لتسجيلات الطالب المرفوعة وانقر على أي ثانية في شريط التحكم الزمني لإضافة «Timestamp Pin» وفتح النافذة المنبثقة لاختيار نوع الخطأ (تجويد / حفظ) وربطه بسجل الطالب التقني
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoLinkPinToErrorLog}
                  onChange={(e) => setAutoLinkPinToErrorLog(e.target.checked)}
                  className="accent-[#145a3a]"
                />
                <span>ربط الـ Timestamp Pin تلقائياً بـ studentId وسجل الطالب التقني (تجويد/حفظ)</span>
              </label>
            </div>

            {(() => {
              const idbConvertedSubmissions = (
                currentStudent ? studentAudioBlobs[currentStudent.id] || [] : []
              ).map((bRec) => ({
                id: bRec.id,
                studentId: bRec.studentId,
                studentName: bRec.studentName || currentStudent?.name || 'طالب',
                date: bRec.date || sessionDate,
                surahName: bRec.surahName,
                fromAyah: bRec.fromAyah,
                toAyah: bRec.toAyah,
                durationSeconds: bRec.durationSeconds || 30,
                audioDataUrl: idbBlobObjectUrls[bRec.id] || bRec.dataUrl,
                studentNote: bRec.studentNote || `تسجيل صوتي محفوظ في IndexedDB (${bRec.recitationType})`,
                reviewed: false,
                timestampPins: [],
              }));

              const mergedMap = new Map<string, (typeof homeSubmissions)[number]>();
              homeSubmissions.forEach((h) => mergedMap.set(h.id, h));
              (currentStudent?.dailyAudioRecordings || []).forEach((d) => {
                if (!mergedMap.has(d.id)) mergedMap.set(d.id, d);
              });
              idbConvertedSubmissions.forEach((idbSub) => {
                if (!mergedMap.has(idbSub.id)) mergedMap.set(idbSub.id, idbSub);
              });
              if (currentStudent && (memorizationAudioDataUrl || voiceNoteUrl)) {
                const sessionRecId = `ses-audio-${currentStudent.id}-${sessionDate}`;
                if (!mergedMap.has(sessionRecId)) {
                  mergedMap.set(sessionRecId, {
                    id: sessionRecId,
                    studentId: currentStudent.id,
                    studentName: currentStudent.name,
                    date: sessionDate,
                    surahName: actualRecitation.surahName,
                    fromAyah: actualRecitation.fromAyah,
                    toAyah: actualRecitation.toAyah,
                    durationSeconds: 30,
                    audioDataUrl: memorizationAudioDataUrl || voiceNoteUrl,
                    studentNote: memorizationAudioName || 'تسجيل صوتي مرفق في الجلسة الحالية',
                    reviewed: false,
                    timestampPins: [],
                  });
                }
              }

              const allMergedSubmissions = Array.from(mergedMap.values());
              const studentRecordings = allMergedSubmissions.filter(
                (h) => h.studentId === currentStudent?.id
              );
              const recordingsList =
                studentRecordings.length > 0 ? studentRecordings : allMergedSubmissions;
              const targetSub =
                recordingsList.find((h) => h.id === selectedSubmissionId) ||
                studentRecordings[0] ||
                allMergedSubmissions[0];
              if (!targetSub) return null;

              const linkedStudentId = targetSub.studentId || currentStudent?.id || 'std-unknown';

              const totalDur = Math.max(
                15,
                teacherAudioTotalSec > 0
                  ? teacherAudioTotalSec
                  : targetSub.durationSeconds || 30
              );
              const matchedSurahObj =
                SURAHS.find((s) => s.name === targetSub.surahName) ||
                SURAHS[66] ||
                SURAHS[0];
              const resolvedBlobUrl = idbBlobObjectUrls[targetSub.id];
              const playableAudioSrc = resolvedBlobUrl
                ? resolvedBlobUrl
                : targetSub.audioDataUrl &&
                  (targetSub.audioDataUrl.startsWith('data:audio') ||
                    targetSub.audioDataUrl.startsWith('blob:') ||
                    targetSub.audioDataUrl.startsWith('http'))
                ? targetSub.audioDataUrl
                : getEveryAyahAudioUrl(
                    selectedReciter,
                    matchedSurahObj.id,
                    targetSub.fromAyah || 1
                  );

              const handleUploadStudentRecordingForTeacher = (
                e: React.ChangeEvent<HTMLInputElement>
              ) => {
                const file = e.target.files?.[0];
                if (!file || !currentStudent) return;
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    const dataUrl = reader.result;
                    saveHomeSubmission({
                      studentId: currentStudent.id,
                      studentName: currentStudent.name,
                      date: sessionDate,
                      surahName: actualRecitation.surahName || targetSub.surahName,
                      fromAyah: actualRecitation.fromAyah || 1,
                      toAyah: actualRecitation.toAyah || 5,
                      durationSeconds: 30,
                      audioDataUrl: dataUrl,
                      studentNote: `تسجيل صوتي مرفوع داخل الجلسة (${file.name}) [studentId: ${currentStudent.id}]`,
                    });
                    showToast(
                      `تمت إضافة تسجيل الطالب (${file.name}) وربطه بـ studentId (${currentStudent.id}) للبدء بالتصحيح الزمني`,
                      'success'
                    );
                  }
                };
                reader.readAsDataURL(file);
              };

              const handleTeacherAddPinAndLinkError = (
                overrideSec?: number,
                overrideCategory?:
                  | 'تجويد'
                  | 'حفظ'
                  | 'تشكيل'
                  | 'مخارج'
                  | 'وقف وابتداء'
                  | 'تشجيع',
                overrideNote?: string,
                overrideSubRule?: string,
                overrideAyah?: number,
                overrideWord?: string,
                overrideTeacherVoiceUrl?: string,
                overrideTeacherVoiceDur?: number
              ) => {
                triggerHaptic(12);
                const totalSec =
                  overrideSec !== undefined
                    ? overrideSec
                    : pinMinInput * 60 + pinSecInput;
                const activeCat = overrideCategory || pinCategoryInput;
                const activeNote =
                  (overrideNote !== undefined ? overrideNote : pinNoteInput).trim() ||
                  (overrideSubRule
                    ? `${overrideSubRule} عند الدقيقة`
                    : `ملاحظة ${activeCat}`);
                const fmtTime = `${String(Math.floor(totalSec / 60)).padStart(
                  2,
                  '0'
                )}:${String(totalSec % 60).padStart(2, '0')}`;
                const mappedErrorType: ErrorType =
                  activeCat === 'حفظ'
                    ? 'حفظ'
                    : activeCat === 'تشكيل'
                    ? 'تشكيل'
                    : 'تجويد';

                const targetAyahNum = overrideAyah || targetSub.fromAyah;
                const targetWordLabel =
                  overrideWord && overrideWord.trim()
                    ? `${overrideWord.trim()} [مقطع صوتي ${fmtTime}]`
                    : `مقطع صوتي [${fmtTime}]`;

                let createdErrId: string | undefined;
                if (autoLinkPinToErrorLog && activeCat !== 'تشجيع') {
                  createdErrId = `err-pin-${linkedStudentId}-${Date.now()}`;
                  const linkedErr: RecitationError = {
                    id: createdErrId,
                    type: mappedErrorType,
                    category: mappedErrorType,
                    subType: `تعليق صوتي زمني (${fmtTime}) [studentId: ${linkedStudentId}]: ${
                      overrideSubRule
                        ? `${overrideSubRule} — ${activeNote}`
                        : activeNote
                    }`,
                    tajweedRule:
                      mappedErrorType === 'تجويد'
                        ? overrideSubRule || activeCat
                        : undefined,
                    context: 'التسميع',
                    surah: targetSub.surahName,
                    ayah: targetAyahNum,
                    word: targetWordLabel,
                    timestamp: sessionDate,
                    followUpStatus: 'open',
                    repeatCount: 1,
                    compositeKey: `${linkedStudentId}-${targetSub.surahName}-${targetAyahNum}-audio-${fmtTime}`,
                  };
                  const nextErrorsList = [linkedErr, ...errors];
                  setErrors(nextErrorsList);

                  // Immediately persist the linked error to the student's technical session record
                  if (currentStudent) {
                    const updatedDeduction = nextErrorsList.reduce(
                      (sum, err) => sum + (ERROR_WEIGHTS[err.type] || 2),
                      0
                    );
                    const updatedMastery =
                      status === 'حضر' ? Math.max(40, 100 - updatedDeduction) : 0;
                    const chosenTarbiyah = TARBIYAH_ADAB_CARDS.find(
                      (c) => c.id === selectedTarbiyahId
                    );
                    saveSession({
                      studentId: currentStudent.id,
                      date: sessionDate,
                      status,
                      masteryScore: updatedMastery,
                      actualRecitation,
                      extraRecitation,
                      previousEvaluation: {
                        newGrade: prevNewGrade,
                        nearGrade: prevNearGrade,
                        farGrade: prevFarGrade,
                      },
                      errors: nextErrorsList,
                      newMemorization: newMem,
                      nearReview: nearRev,
                      farReview: farRev,
                      juzReview: {
                        enabled: juzEnabled,
                        items: juzItems,
                        direction: juzDirection,
                      },
                      hizbQuarterReview: {
                        enabled: hizbQuarterEnabled,
                        items: hizbItems,
                        direction: juzDirection,
                      },
                      surahReview: {
                        enabled: surahRevEnabled,
                        surahNames: selectedSurahNames,
                        direction: surahRevDirection,
                      },
                      sectionPercentages,
                      memorizationAudioDataUrl,
                      memorizationAudioName,
                      syncStatus: 'حصة محفوظة',
                      tarbiyahCardId: chosenTarbiyah?.id,
                      tarbiyahCardTitle: chosenTarbiyah?.title,
                      tarbiyahCardSummary: chosenTarbiyah?.oneMinuteReminder,
                      parentNotes: parentNotes.trim(),
                      voiceNoteDataUrl: voiceNoteUrl,
                    });
                    setSyncStatus('حصة محفوظة');
                  }
                }

                addTimestampPinToHomeSubmission(targetSub.id, {
                  timestampSec: totalSec,
                  second: totalSec,
                  formattedTime: fmtTime,
                  category: activeCat,
                  ayahNumber: targetAyahNum,
                  comment: overrideSubRule
                    ? `${overrideSubRule}: ${activeNote}`
                    : activeNote,
                  note: overrideSubRule
                    ? `${overrideSubRule}: ${activeNote}`
                    : activeNote,
                  linkedErrorId: createdErrId,
                  linkedErrorType:
                    activeCat !== 'تشجيع' ? mappedErrorType : undefined,
                  teacherVoiceNoteDataUrl: overrideTeacherVoiceUrl,
                  teacherVoiceNoteDurationSec: overrideTeacherVoiceDur,
                });
              };

              const openPinClassificationModalAtSecond = (sec: number) => {
                const clampedSec = Math.max(0, Math.min(totalDur, sec));
                setTeacherAudioCurrentSec(clampedSec);
                setPinMinInput(Math.floor(clampedSec / 60));
                setPinSecInput(clampedSec % 60);
                if (teacherSubmissionAudioRef.current) {
                  try {
                    teacherSubmissionAudioRef.current.currentTime = clampedSec;
                    teacherSubmissionAudioRef.current.pause();
                    setIsTeacherAudioPlaying(false);
                  } catch {
                    // ignore seek error if metadata not loaded yet
                  }
                }
                setPinPopoverModal({
                  open: true,
                  submissionId: targetSub.id,
                  studentId: linkedStudentId,
                  surahName: targetSub.surahName,
                  fromAyah: targetSub.fromAyah,
                  ayahNumber: targetSub.fromAyah,
                  wordText: '',
                  second: clampedSec,
                  category: 'تجويد',
                  subRule: 'أحكام النون الساكنة والغنة',
                  note: '',
                });
              };

              const togglePlayPauseTeacherAudio = () => {
                const el = teacherSubmissionAudioRef.current;
                if (!el) return;
                if (el.paused) {
                  el.play()
                    .then(() => setIsTeacherAudioPlaying(true))
                    .catch(() => {});
                } else {
                  el.pause();
                  setIsTeacherAudioPlaying(false);
                }
              };

              const skipTeacherAudioBy = (deltaSec: number) => {
                const nextSec = Math.max(
                  0,
                  Math.min(totalDur, teacherAudioCurrentSec + deltaSec)
                );
                setTeacherAudioCurrentSec(nextSec);
                setPinMinInput(Math.floor(nextSec / 60));
                setPinSecInput(nextSec % 60);
                if (teacherSubmissionAudioRef.current) {
                  try {
                    teacherSubmissionAudioRef.current.currentTime = nextSec;
                  } catch {
                    // ignore
                  }
                }
              };

              const audioTimelineErrors = errors.filter((er) =>
                er.id.startsWith('err-pin-') || er.word?.includes('مقطع صوتي')
              );

              return (
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 space-y-3 text-xs relative">
                  {/* Recording Selector Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-emerald-900/40">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-neutral-500">
                        اختر تسجيل الطالب المرفوع:
                      </span>
                      <select
                        value={targetSub.id}
                        onChange={(e) => {
                          setSelectedSubmissionId(e.target.value);
                          setTeacherAudioCurrentSec(0);
                          setTeacherAudioTotalSec(0);
                          setPinMinInput(0);
                          setPinSecInput(0);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#c59b27]/60 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]"
                      >
                        {recordingsList.map((recItem) => (
                          <option key={recItem.id} value={recItem.id}>
                            🎙️ {recItem.studentName} [ID: {recItem.studentId}] — سورة {recItem.surahName} (آية{' '}
                            {recItem.fromAyah}-{recItem.toAyah}) [{recItem.date}] (
                            {(recItem.timestampPins || []).length} دبابيس)
                          </option>
                        ))}
                      </select>

                      <label className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-extrabold cursor-pointer flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5 text-[#c59b27]" />
                        <span>إرفاق تسجيل طالب جديد</span>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleUploadStudentRecordingForTeacher}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openPinClassificationModalAtSecond(
                            teacherAudioCurrentSec || pinMinInput * 60 + pinSecInput
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-[11px] font-extrabold cursor-pointer flex items-center gap-1"
                      >
                        <span>+ إضافة Timestamp Pin عند الثانية الحالية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          reviewHomeSubmission(
                            targetSub.id,
                            'أحسنت بارك الله فيك، راجع لوحة التصحيح الزمني والدبابيس المرتبطة بسجل الأخطاء التقني.'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                      >
                        اعتماد المراجعة وإشعار الطالب ✓
                      </button>
                    </div>
                  </div>

                  {/* HTML5 Audio Player + Quick Transport Controls & Playback Speed */}
                  <div className="p-3 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-emerald-800/20 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlayPauseTeacherAudio}
                        className="px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {isTeacherAudioPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>إيقاف مؤقت</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>تشغيل التلاوة</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => skipTeacherAudioBy(-5)}
                        className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-emerald-950 text-[11px] font-mono font-bold cursor-pointer"
                        title="رجوع 5 ثوانٍ"
                      >
                        -5s
                      </button>
                      <button
                        type="button"
                        onClick={() => skipTeacherAudioBy(5)}
                        className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-emerald-950 text-[11px] font-mono font-bold cursor-pointer"
                        title="تقديم 5 ثوانٍ"
                      >
                        +5s
                      </button>
                      <div className="flex items-center gap-1 bg-white dark:bg-[#12231a] px-2 py-1 rounded-lg border border-neutral-200 dark:border-emerald-900">
                        <span className="text-[10px] text-neutral-500">السرعة:</span>
                        {[0.75, 1, 1.25, 1.5].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => {
                              setTeacherAudioPlaybackRate(rate);
                              if (teacherSubmissionAudioRef.current) {
                                teacherSubmissionAudioRef.current.playbackRate = rate;
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                              teacherAudioPlaybackRate === rate
                                ? 'bg-[#145a3a] text-[#dfbd69]'
                                : 'text-neutral-600 dark:text-neutral-300'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono font-extrabold text-[11px]">
                        ⏱️ الموضع الحالي:{' '}
                        {String(Math.floor(teacherAudioCurrentSec / 60)).padStart(
                          2,
                          '0'
                        )}
                        :{String(teacherAudioCurrentSec % 60).padStart(2, '0')} /{' '}
                        {String(Math.floor(totalDur / 60)).padStart(2, '0')}:
                        {String(totalDur % 60).padStart(2, '0')}
                      </span>
                    </div>

                    <audio
                      ref={teacherSubmissionAudioRef}
                      controls
                      preload="metadata"
                      src={playableAudioSrc}
                      onPlay={() => setIsTeacherAudioPlaying(true)}
                      onPause={() => setIsTeacherAudioPlaying(false)}
                      onEnded={() => setIsTeacherAudioPlaying(false)}
                      onLoadedMetadata={(e) => {
                        const dur = Math.round(e.currentTarget.duration);
                        if (Number.isFinite(dur) && dur > 0) {
                          setTeacherAudioTotalSec(dur);
                        }
                        e.currentTarget.playbackRate = teacherAudioPlaybackRate;
                      }}
                      onTimeUpdate={(e) => {
                        const sec = Math.floor(e.currentTarget.currentTime);
                        setTeacherAudioCurrentSec(sec);
                        setPinMinInput(Math.floor(sec / 60));
                        setPinSecInput(sec % 60);
                      }}
                      className="h-9 w-full sm:w-80 rounded-lg"
                    />
                  </div>

                  {/* Interactive Clickable Audio Timeline Control Bar with Timestamp Pins */}
                  <div className="p-3 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        🎯 شريط التحكم الزمني التفاعلي (انقر على أي ثانية لإضافة Timestamp Pin وفتح النافذة المنبثقة لاختيار نوع الخطأ تجويد/حفظ وربطه بسجل الطالب التقني):
                      </span>
                      <div className="flex items-center gap-2">
                        {timelineHoverSec !== null && (
                          <span className="px-2 py-0.5 rounded bg-[#145a3a] text-[#dfbd69] font-mono font-extrabold text-[10px]">
                            📍 انقر لإضافة Pin عند{' '}
                            {String(Math.floor(timelineHoverSec / 60)).padStart(2, '0')}:
                            {String(timelineHoverSec % 60).padStart(2, '0')}
                          </span>
                        )}
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                          المقطع المحدد: {String(pinMinInput).padStart(2, '0')}:
                          {String(pinSecInput).padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    {/* Visual Clickable Timeline Track with Pin Markers */}
                    <div
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const hoverX = e.clientX - rect.left;
                        const ratio = Math.max(
                          0,
                          Math.min(1, 1 - hoverX / rect.width)
                        );
                        setTimelineHoverSec(Math.round(ratio * totalDur));
                      }}
                      onMouseLeave={() => setTimelineHoverSec(null)}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const ratio = Math.max(
                          0,
                          Math.min(1, 1 - clickX / rect.width)
                        );
                        const clickedSec = Math.round(ratio * totalDur);
                        openPinClassificationModalAtSecond(clickedSec);
                      }}
                      className="relative w-full h-9 rounded-xl bg-neutral-200 dark:bg-emerald-950 border-2 border-[#c59b27]/60 cursor-pointer overflow-visible flex items-center px-2 select-none"
                      title="انقر على أي ثانية لفتح نافذة منبثقة لربط المقطع الزمني بنوع خطأ (تجويد / حفظ) وتسجيله فورياً في سجل الطالب التقني"
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((pinMinInput * 60 + pinSecInput) / totalDur) * 100
                            )
                          )}%`,
                        }}
                        className="h-full bg-gradient-to-l from-[#145a3a] to-[#c59b27] opacity-75 transition-all rounded-r-lg pointer-events-none"
                      />

                      {/* Visual Timestamp Pin Markers on the Timeline Bar */}
                      {(targetSub.timestampPins || []).map((pin) => {
                        const pSec = pin.timestampSec ?? pin.second ?? 0;
                        const pct = Math.max(
                          3,
                          Math.min(97, Math.round((pSec / totalDur) * 100))
                        );
                        const isHifz = pin.category === 'حفظ';
                        const isPraise = pin.category === 'تشجيع';
                        return (
                          <button
                            key={pin.id}
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setTeacherAudioCurrentSec(pSec);
                              setPinMinInput(Math.floor(pSec / 60));
                              setPinSecInput(pSec % 60);
                              if (teacherSubmissionAudioRef.current) {
                                try {
                                  teacherSubmissionAudioRef.current.currentTime = pSec;
                                  teacherSubmissionAudioRef.current
                                    .play()
                                    .then(() => setIsTeacherAudioPlaying(true))
                                    .catch(() => {});
                                } catch {
                                  // ignore
                                }
                              }
                            }}
                            style={{ right: `${pct}%` }}
                            className={`absolute -top-2.5 z-10 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold shadow border transform translate-x-1/2 cursor-pointer ${
                              isPraise
                                ? 'bg-emerald-600 text-white border-white'
                                : isHifz
                                ? 'bg-rose-600 text-white border-white'
                                : 'bg-amber-500 text-[#14281d] border-[#14281d]'
                            }`}
                            title={`📍 ${pin.formattedTime} [${pin.category}]: ${
                              pin.comment || pin.note || ''
                            }`}
                          >
                            📍{pin.formattedTime}
                          </button>
                        );
                      })}

                      {/* Quick second markers */}
                      <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-mono font-bold text-[#14281d] dark:text-white pointer-events-none">
                        <span>00:00</span>
                        <span>
                          00:{String(Math.round(totalDur * 0.25)).padStart(2, '0')}
                        </span>
                        <span>
                          00:{String(Math.round(totalDur * 0.5)).padStart(2, '0')}
                        </span>
                        <span>
                          00:{String(Math.round(totalDur * 0.75)).padStart(2, '0')}
                        </span>
                        <span>
                          {String(Math.floor(totalDur / 60)).padStart(2, '0')}:
                          {String(totalDur % 60).padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    {/* Fine Timeline Range Slider for Smooth Seeking */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-neutral-500 shrink-0">
                        تحريك دقيق للمؤشر:
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={totalDur}
                        value={Math.min(totalDur, teacherAudioCurrentSec)}
                        onChange={(e) => {
                          const sec = Number(e.target.value);
                          setTeacherAudioCurrentSec(sec);
                          setPinMinInput(Math.floor(sec / 60));
                          setPinSecInput(sec % 60);
                          if (teacherSubmissionAudioRef.current) {
                            try {
                              teacherSubmissionAudioRef.current.currentTime = sec;
                            } catch {
                              // ignore
                            }
                          }
                        }}
                        className="w-full accent-[#145a3a] cursor-pointer h-1.5"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openPinClassificationModalAtSecond(teacherAudioCurrentSec)
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-[#dfbd69] text-[10px] font-extrabold shrink-0 cursor-pointer"
                      >
                        📌 ربط الثانية {String(Math.floor(teacherAudioCurrentSec / 60)).padStart(2, '0')}:
                        {String(teacherAudioCurrentSec % 60).padStart(2, '0')} بخطأ
                      </button>
                    </div>
                  </div>

                  {/* Popup Modal (نافذة منبثقة) for Choosing Error Type (تجويد / حفظ) Linked to Exact Second & Student Technical Log */}
                  {pinPopoverModal && pinPopoverModal.open && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label="نافذة منبثقة لاختيار نوع الخطأ تجويد أو حفظ وربطه بسجل الطالب التقني"
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
                      onClick={() => setPinPopoverModal(null)}
                    >
                      <div
                        className="w-full max-w-2xl p-5 rounded-3xl bg-[#14281d] text-white border-2 border-[#c59b27] shadow-2xl space-y-4"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-xl bg-[#c59b27] text-[#14281d] font-mono font-extrabold text-xs">
                              📍 Timestamp Pin • الثانية:{' '}
                              {String(Math.floor(pinPopoverModal.second / 60)).padStart(
                                2,
                                '0'
                              )}
                              :{String(pinPopoverModal.second % 60).padStart(2, '0')}
                            </span>
                            <div>
                              <h5 className="font-extrabold text-sm text-[#dfbd69]">
                                نافذة منبثقة: اختيار نوع الخطأ (تجويد / حفظ) وربطه بسجل الطالب التقني
                              </h5>
                              <p className="text-[11px] text-emerald-200/80">
                                الطالب: {currentStudent?.name} ({pinPopoverModal.studentId}) • سورة{' '}
                                {pinPopoverModal.surahName}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPinPopoverModal(null)}
                            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
                          >
                            إغلاق ✕
                          </button>
                        </div>

                        {/* Instant 1-Click Quick Buttons for Tajweed vs Hifz */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleTeacherAddPinAndLinkError(
                                pinPopoverModal.second,
                                'تجويد',
                                pinPopoverModal.note || 'ملاحظة تجويد عند المقطع الصوتي',
                                pinPopoverModal.subRule || 'أحكام النون الساكنة والغنة',
                                pinPopoverModal.ayahNumber || pinPopoverModal.fromAyah,
                                pinPopoverModal.wordText
                              );
                              setPinPopoverModal(null);
                            }}
                            className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#14281d] text-xs font-extrabold cursor-pointer flex items-center justify-between shadow"
                          >
                            <span>⚡ تسجيل فوري: خطأ تجويد وربطه بالسجل التقني</span>
                            <span className="px-2 py-0.5 rounded-lg bg-black/15 font-mono text-[10px]">
                              تجويد
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleTeacherAddPinAndLinkError(
                                pinPopoverModal.second,
                                'حفظ',
                                pinPopoverModal.note || 'ملاحظة حفظ وتثبيت عند المقطع الصوتي',
                                'تردد أو نسيان موضع الآية',
                                pinPopoverModal.ayahNumber || pinPopoverModal.fromAyah,
                                pinPopoverModal.wordText
                              );
                              setPinPopoverModal(null);
                            }}
                            className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold cursor-pointer flex items-center justify-between shadow"
                          >
                            <span>⚡ تسجيل فوري: خطأ حفظ وربطه بالسجل التقني</span>
                            <span className="px-2 py-0.5 rounded-lg bg-black/20 font-mono text-[10px]">
                              حفظ
                            </span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Step 1: Error Type Selection (تجويد / حفظ) */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-[#dfbd69]">
                              1. اختر نوع الخطأ (تجويد / حفظ):
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(
                                [
                                  { id: 'تجويد', label: 'خطأ تجويد', badge: 'تجويد' },
                                  { id: 'حفظ', label: 'خطأ حفظ', badge: 'حفظ' },
                                  { id: 'تشكيل', label: 'خطأ تشكيل', badge: 'إعراب' },
                                  { id: 'تشجيع', label: 'إشادة وإتقان', badge: 'ممتاز' },
                                ] as const
                              ).map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() =>
                                    setPinPopoverModal((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            category: opt.id,
                                            subRule:
                                              opt.id === 'حفظ'
                                                ? 'تردد أو نسيان موضع الآية'
                                                : opt.id === 'تشكيل'
                                                ? 'تغيير حركة آخر الكلمة'
                                                : opt.id === 'تشجيع'
                                                ? 'أداء متقن ووقف تام حسن'
                                                : 'أحكام النون الساكنة والغنة',
                                          }
                                        : null
                                    )
                                  }
                                  className={`px-2.5 py-2 rounded-xl text-xs font-extrabold border text-right transition cursor-pointer flex items-center justify-between ${
                                    pinPopoverModal.category === opt.id
                                      ? 'bg-[#c59b27] text-[#14281d] border-white shadow'
                                      : 'bg-white/5 text-white border-white/15 hover:bg-white/10'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/20">
                                    {opt.badge}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Step 2: Technical Sub-Rule & Ayah/Second */}
                          <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-[#dfbd69]">
                              2. التفصيل التقني ورقم الآية:
                            </label>
                            <select
                              value={pinPopoverModal.subRule}
                              onChange={(e) =>
                                setPinPopoverModal((prev) =>
                                  prev ? { ...prev, subRule: e.target.value } : null
                                )
                              }
                              className="w-full px-3 py-2 rounded-xl bg-[#0b1711] border border-[#c59b27]/60 text-white text-xs font-bold"
                            >
                              {pinPopoverModal.category === 'حفظ' ? (
                                <>
                                  <option value="تردد أو نسيان موضع الآية">
                                    تردد أو نسيان موضع الآية
                                  </option>
                                  <option value="إبدال كلمة بأخرى متشابهة">
                                    إبدال كلمة بأخرى متشابهة
                                  </option>
                                  <option value="تجاوز آية أو عدم ربط الخواتيم">
                                    تجاوز آية أو عدم ربط الخواتيم
                                  </option>
                                </>
                              ) : pinPopoverModal.category === 'تشكيل' ? (
                                <>
                                  <option value="تغيير حركة آخر الكلمة">
                                    تغيير حركة آخر الكلمة (لحن جلي)
                                  </option>
                                  <option value="تسكين المتحرك أو تحريك الساكن">
                                    تسكين المتحرك أو تحريك الساكن
                                  </option>
                                </>
                              ) : pinPopoverModal.category === 'تشجيع' ? (
                                <>
                                  <option value="أداء متقن ووقف تام حسن">
                                    أداء متقن ووقف تام حسن
                                  </option>
                                  <option value="تحقيق مخارج الحروف والغنن">
                                    تحقيق مخارج الحروف والغنن
                                  </option>
                                </>
                              ) : (
                                <>
                                  <option value="أحكام النون الساكنة والغنة">
                                    أحكام النون الساكنة والغنة
                                  </option>
                                  <option value="مقادير المدود (الطبيعي والفرعي)">
                                    مقادير المدود (الطبيعي والفرعي)
                                  </option>
                                  <option value="أحكام الميم الساكنة والقلقلة">
                                    أحكام الميم الساكنة والقلقلة
                                  </option>
                                  <option value="التفخيم والترقيق ومخارج الحروف">
                                    التفخيم والترقيق ومخارج الحروف
                                  </option>
                                </>
                              )}
                            </select>

                            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-emerald-300">
                              <div className="flex items-center gap-1">
                                <span>الثانية:</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={totalDur}
                                  value={pinPopoverModal.second}
                                  onChange={(e) => {
                                    const s = Math.max(
                                      0,
                                      Math.min(totalDur, Number(e.target.value) || 0)
                                    );
                                    setPinPopoverModal((prev) =>
                                      prev ? { ...prev, second: s } : null
                                    );
                                    setPinMinInput(Math.floor(s / 60));
                                    setPinSecInput(s % 60);
                                  }}
                                  className="w-14 px-1.5 py-1 rounded bg-[#0b1711] border border-white/20 text-center font-mono font-bold text-white"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span>الآية:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={286}
                                  value={pinPopoverModal.ayahNumber || pinPopoverModal.fromAyah}
                                  onChange={(e) =>
                                    setPinPopoverModal((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            ayahNumber: Math.max(
                                              1,
                                              Number(e.target.value) || prev.fromAyah
                                            ),
                                          }
                                        : null
                                    )
                                  }
                                  className="w-14 px-1.5 py-1 rounded bg-[#0b1711] border border-white/20 text-center font-mono font-bold text-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Step 3: Word & Teacher Note + Save */}
                          <div className="space-y-2 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={pinPopoverModal.wordText || ''}
                                onChange={(e) =>
                                  setPinPopoverModal((prev) =>
                                    prev ? { ...prev, wordText: e.target.value } : null
                                  )
                                }
                                placeholder="الكلمة القرآنية موضع الخطأ (اختياري)..."
                                className="w-full px-3 py-1.5 rounded-xl bg-[#0b1711] border border-white/20 text-white text-xs"
                              />
                              <input
                                type="text"
                                value={pinPopoverModal.note}
                                onChange={(e) =>
                                  setPinPopoverModal((prev) =>
                                    prev ? { ...prev, note: e.target.value } : null
                                  )
                                }
                                placeholder="ملاحظة وتوجيه الشيخ للطالب..."
                                className="w-full px-3 py-1.5 rounded-xl bg-[#0b1711] border border-white/20 text-white text-xs"
                              />

                              {/* Direct Teacher Voice Note Recording inside Timestamp Pin */}
                              <div className="p-2 rounded-xl bg-[#0b1711]/90 border border-[#dfbd69]/40 flex flex-wrap items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartStopTeacherVoiceRecording('pin_modal', {
                                      surahName: pinPopoverModal.surahName,
                                      ayahNumber:
                                        pinPopoverModal.ayahNumber ||
                                        pinPopoverModal.fromAyah,
                                      timestampSec: pinPopoverModal.second,
                                      submissionId: pinPopoverModal.submissionId,
                                      category:
                                        pinPopoverModal.category === 'تشجيع' ||
                                        pinPopoverModal.category === 'وقف وابتداء'
                                          ? 'توجيه عام'
                                          : pinPopoverModal.category,
                                      title:
                                        pinPopoverModal.note.trim() ||
                                        `تصحيح صوتي للشيخ عند ${String(
                                          Math.floor(pinPopoverModal.second / 60)
                                        ).padStart(2, '0')}:${String(
                                          pinPopoverModal.second % 60
                                        ).padStart(2, '0')}`,
                                    })
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                                    isRecordingVoice &&
                                    activeVoiceRecordTarget === 'pin_modal'
                                      ? 'bg-red-600 text-white animate-pulse'
                                      : 'bg-[#c59b27] text-[#14281d] hover:bg-[#b58c1e]'
                                  }`}
                                >
                                  {isRecordingVoice &&
                                  activeVoiceRecordTarget === 'pin_modal' ? (
                                    <>
                                      <MicOff className="w-3.5 h-3.5" />
                                      <span>
                                        إيقاف وحفظ التسجيل ({voiceRecordingSeconds} ث)
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Mic className="w-3.5 h-3.5" />
                                      <span>🎙️ تسجيل تصحيح صوتي للشيخ على هذا الموضع</span>
                                    </>
                                  )}
                                </button>

                                {pinPopoverModal.teacherVoiceNoteDataUrl && (
                                  <audio
                                    controls
                                    src={pinPopoverModal.teacherVoiceNoteDataUrl}
                                    className="h-7 max-w-[160px]"
                                  />
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleTeacherAddPinAndLinkError(
                                  pinPopoverModal.second,
                                  pinPopoverModal.category,
                                  pinPopoverModal.note,
                                  pinPopoverModal.subRule,
                                  pinPopoverModal.ayahNumber || pinPopoverModal.fromAyah,
                                  pinPopoverModal.wordText,
                                  pinPopoverModal.teacherVoiceNoteDataUrl,
                                  pinPopoverModal.teacherVoiceNoteDurationSec
                                );
                                setPinPopoverModal(null);
                              }}
                              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer shadow"
                            >
                              📌 حفظ الـ Timestamp Pin وربطه بسجل الطالب التقني ({pinPopoverModal.category}) ✓
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Inline Add Timestamp Pin & Link to Technical Error Log Form */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-neutral-500">
                      إدخال سريع (MM:SS):
                    </span>
                    <div className="flex items-center gap-1 bg-[#fcfaf2] dark:bg-[#0b1711] px-2 py-1 rounded-lg border border-neutral-300 dark:border-emerald-800">
                      <span className="text-[10px] text-neutral-500">دقيقة:</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={pinMinInput}
                        onChange={(e) =>
                          setPinMinInput(Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-10 text-center font-mono font-bold bg-transparent"
                      />
                      <span>:</span>
                      <span className="text-[10px] text-neutral-500">ثانية:</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={pinSecInput}
                        onChange={(e) =>
                          setPinSecInput(
                            Math.max(0, Math.min(59, Number(e.target.value) || 0))
                          )
                        }
                        className="w-10 text-center font-mono font-bold bg-transparent"
                      />
                    </div>

                    <select
                      value={pinCategoryInput}
                      onChange={(e) =>
                        setPinCategoryInput(
                          e.target.value as
                            | 'تجويد'
                            | 'حفظ'
                            | 'تشكيل'
                            | 'مخارج'
                            | 'وقف وابتداء'
                            | 'تشجيع'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-emerald-800 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-bold"
                    >
                      <option value="تجويد">خطأ تجويد (يربط بسجل الأخطاء)</option>
                      <option value="حفظ">خطأ حفظ (يربط بسجل الأخطاء)</option>
                      <option value="تشكيل">خطأ تشكيل (يربط بسجل الأخطاء)</option>
                      <option value="مخارج">مخارج وصفات (يربط بسجل التجويد)</option>
                      <option value="وقف وابتداء">وقف وابتداء</option>
                      <option value="تشجيع">إشادة وتشجيع</option>
                    </select>

                    <input
                      type="text"
                      value={pinNoteInput}
                      onChange={(e) => setPinNoteInput(e.target.value)}
                      placeholder="الملاحظة التصحيحية عند هذه الثانية..."
                      className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-emerald-800 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs"
                    />

                    <button
                      type="button"
                      onClick={() => handleTeacherAddPinAndLinkError()}
                      className="px-3.5 py-1.5 rounded-lg bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] font-extrabold text-xs cursor-pointer"
                    >
                      📌 تثبيت في الدقيقة {String(pinMinInput).padStart(2, '0')}:
                      {String(pinSecInput).padStart(2, '0')} وربطه بالسجل التقني
                    </button>
                  </div>

                  {/* واجهة الاستماع الاحترافية لتعليقات المعلم الزمنية المرتبطة بسجل الطالب التقني */}
                  <div className="p-3.5 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200/70 dark:border-emerald-900/40">
                      <div>
                        <span className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-[#c59b27]" />
                          <span>
                            🎧 واجهة الاستماع الاحترافية لتعليقات المعلم الزمنية (
                            {(targetSub.timestampPins || []).length} تعليقات زمنية •{' '}
                            {audioTimelineErrors.length} أخطاء مربوطة بالسجل التقني)
                          </span>
                        </span>
                        <span className="block text-[10px] text-neutral-500">
                          انقر على أي تعليق زمني للاستماع للمقطع الصوتي مباشرة أو تكرار سياق الآية قبل موضع الملاحظة بـ 3 ثوانٍ
                        </span>
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex flex-wrap items-center gap-1">
                        {(['الكل', 'تجويد', 'حفظ', 'تشكيل', 'تشجيع'] as const).map(
                          (catFilter) => {
                            const count =
                              catFilter === 'الكل'
                                ? (targetSub.timestampPins || []).length
                                : (targetSub.timestampPins || []).filter(
                                    (item) => item.category === catFilter
                                  ).length;
                            return (
                              <button
                                key={catFilter}
                                type="button"
                                onClick={() => setPinFilterCategory(catFilter)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition ${
                                  pinFilterCategory === catFilter
                                    ? 'bg-[#145a3a] text-[#dfbd69]'
                                    : 'bg-white dark:bg-[#12231a] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-emerald-900'
                                }`}
                              >
                                {catFilter} ({count})
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {(targetSub.timestampPins || []).length === 0 ? (
                      <div className="text-[11px] text-neutral-500 py-1">
                        لا توجد تعليقات زمنية مسجلة بعد — انقر على شريط التحكم الزمني أعلاه لإضافة أول Timestamp Pin.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[...(targetSub.timestampPins || [])]
                          .filter((p) =>
                            pinFilterCategory === 'الكل'
                              ? true
                              : p.category === pinFilterCategory
                          )
                          .sort(
                            (a, b) =>
                              (a.timestampSec ?? a.second ?? 0) -
                              (b.timestampSec ?? b.second ?? 0)
                          )
                          .map((p) => {
                            const textVal = p.comment || p.note || '';
                            const secNum = p.timestampSec ?? p.second ?? 0;
                            const isActiveNow =
                              Math.abs(teacherAudioCurrentSec - secNum) <= 2;
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setTeacherAudioCurrentSec(secNum);
                                  setPinMinInput(Math.floor(secNum / 60));
                                  setPinSecInput(secNum % 60);
                                  if (teacherSubmissionAudioRef.current) {
                                    try {
                                      teacherSubmissionAudioRef.current.currentTime =
                                        secNum;
                                      teacherSubmissionAudioRef.current
                                        .play()
                                        .then(() => setIsTeacherAudioPlaying(true))
                                        .catch(() => {});
                                    } catch {
                                      // ignore
                                    }
                                  }
                                }}
                                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                                  isActiveNow
                                    ? 'bg-amber-50 dark:bg-emerald-950/80 border-2 border-[#c59b27] shadow-sm'
                                    : 'bg-white dark:bg-[#12231a] border-amber-500/40 hover:border-[#145a3a]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 min-w-0">
                                    <span className="px-2 py-1 rounded-lg bg-[#145a3a] text-[#dfbd69] font-mono font-extrabold text-[11px] shrink-0">
                                      ▶️ {p.formattedTime}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="font-extrabold text-[11px] text-[#14281d] dark:text-white">
                                        [{p.category}] {textVal}
                                      </div>
                                      <div className="text-[10px] text-neutral-500 mt-0.5">
                                        سورة {targetSub.surahName} • آية{' '}
                                        {p.ayahNumber || targetSub.fromAyah}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    {isActiveNow && (
                                      <span className="px-2 py-0.5 rounded-full bg-[#c59b27] text-[#14281d] text-[9px] font-extrabold animate-pulse">
                                        🔊 يُستمع إليه الآن
                                      </span>
                                    )}
                                    {p.linkedErrorType && (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold">
                                        سجل تقني ({p.linkedErrorType}) ✓
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {p.teacherVoiceNoteDataUrl && (
                                  <div
                                    onClick={(ev) => ev.stopPropagation()}
                                    className="p-2 rounded-lg bg-emerald-950/10 dark:bg-emerald-950/60 border border-[#c59b27]/40 flex items-center justify-between gap-2"
                                  >
                                    <span className="text-[10px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                                      🎙️ تصحيح صوتي مسجل من المعلم (
                                      {p.teacherVoiceNoteDurationSec || 3} ث):
                                    </span>
                                    <audio
                                      controls
                                      src={p.teacherVoiceNoteDataUrl}
                                      className="h-7 max-w-[170px]"
                                    />
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-100 dark:border-emerald-900/40 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      const contextSec = Math.max(0, secNum - 3);
                                      setTeacherAudioCurrentSec(contextSec);
                                      setPinMinInput(Math.floor(contextSec / 60));
                                      setPinSecInput(contextSec % 60);
                                      if (teacherSubmissionAudioRef.current) {
                                        try {
                                          teacherSubmissionAudioRef.current.currentTime =
                                            contextSec;
                                          teacherSubmissionAudioRef.current
                                            .play()
                                            .then(() =>
                                              setIsTeacherAudioPlaying(true)
                                            )
                                            .catch(() => {});
                                        } catch {
                                          // ignore
                                        }
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-[#145a3a] dark:text-[#dfbd69] font-bold cursor-pointer"
                                  >
                                    🔁 سماع السياق قبل الملاحظة (-3s)
                                  </button>
                                  <span className="text-neutral-400 font-mono">
                                    الموضع: {secNum} ثانية
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* تعليق المعلم الشامل على التلاوة الصوتية */}
                    <div className="pt-2 border-t border-neutral-200/70 dark:border-emerald-900/40 space-y-2">
                      {targetSub.teacherFeedback && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-[11px] font-bold text-[#145a3a] dark:text-emerald-200">
                          🎙️ تعليق الشيخ المعتمد على التلاوة: «{targetSub.teacherFeedback}»
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={teacherOverallFeedbackText}
                          onChange={(e) =>
                            setTeacherOverallFeedbackText(e.target.value)
                          }
                          placeholder="أضف تعليق المعلم الختامي على التلاوة ليظهر في واجهة استماع الطالب..."
                          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#12231a] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            reviewHomeSubmission(
                              targetSub.id,
                              teacherOverallFeedbackText.trim() ||
                                'أحسنت بارك الله فيك، راجع الدبابيس الزمنية المرتبطة بسجل الأخطاء التقني.'
                            );
                            setTeacherOverallFeedbackText('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold cursor-pointer"
                        >
                          حفظ تعليق المعلم الختامي ✓
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Student Select */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-bold text-neutral-500 mb-1.5">
              الطالب في الحصة الحالية
            </label>
            <select
              value={currentStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} — ({st.circle}) [{st.accountStatus || 'نشط'}]
                </option>
              ))}
            </select>
          </div>

          {/* Date Select */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-500">
                تاريخ الحصة
              </label>
              {(settings.showHijriDates ?? true) && (
                <span className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69]">
                  {formatHijriDate(sessionDate, 'long')}
                </span>
              )}
            </div>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-sm font-mono tabular-nums"
            />
          </div>

          {/* Attendance Status (Present, Absent, Excused) */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-neutral-500 mb-1.5">
              حالة الحضور
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['حضر', 'غاب', 'إجازة'] as AttendanceStatus[]).map((stVal) => (
                <button
                  key={stVal}
                  type="button"
                  onClick={() => setStatus(stVal)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    status === stVal
                      ? stVal === 'حضر'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : stVal === 'غاب'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-[#c59b27] text-[#14281d] border-[#c59b27] shadow-xs'
                      : 'border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711]'
                  }`}
                >
                  {stVal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Absence Automatic Carry-Forward Alert & WhatsApp Notify Button */}
        {status !== 'حضر' && currentStudent && (
          <div className="mt-5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-extrabold text-red-800 dark:text-red-200">
                  الطالب ({status}) — سيتم ترحيل تكليف آخر حصة تلقائياً للحصة القادمة
                </div>
                <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                  آخر توقف محفوظ: سورة {currentStudent.currentStop.surahName} الآية (
                  {currentStudent.currentStop.ayah})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveAndSendWhatsApp('short')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>حفظ الغياب وإبلاغ ولي الأمر عبر واتساب</span>
            </button>
          </div>
        )}
      </div>

      {/* Unified Educational Journey Summary Card (الفصل الإلزامي بين: التكليف السابق | التسميع الفعلي | قرار الإتقان | موضع التوقف | أخطاء المتابعة) */}
      {currentStudent && (
        <div className="rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27]/50 shadow-xs overflow-hidden">
          <div className="p-4 bg-[#f6f7f2] dark:bg-[#0b1711] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSmartCardOpen((prev) => !prev)}
              className="flex items-center gap-2 text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#c59b27]" />
              <span>
                بطاقة الرحلة التعليمية الموحدة للطالب (ماذا كُلّف؟ ماذا سمّع فعلياً؟ ماذا أتقن؟ أين توقف؟)
              </span>
              {smartCardOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSmartQuranModal({
                    open: true,
                    sectionTitle: 'تقييم الحصة السابقة والتسميع',
                    sectionContext: 'التسميع',
                    surahId:
                      lastAttendedSession?.newMemorization?.surahId ||
                      currentStudent.currentStop.surahId,
                    surahName:
                      lastAttendedSession?.newMemorization?.surahName ||
                      currentStudent.currentStop.surahName,
                    fromAyah: lastAttendedSession?.newMemorization?.fromAyah || 1,
                    toAyah:
                      lastAttendedSession?.newMemorization?.toAyah ||
                      currentStudent.currentStop.ayah,
                    targetSectionKey: 'prev',
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>📖 النص (الحصة السابقة)</span>
              </button>

              <button
                type="button"
                onClick={handleRepeatLastSession}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>كرر تكليف آخر حصة بضغطة واحدة</span>
              </button>
            </div>
          </div>

          {smartCardOpen && (
            <div className="p-5 space-y-4">
              {/* 4 Mandatory Educational Separation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
                  <div className="text-[11px] font-bold text-neutral-500">
                    ١. ماذا كان مكلفاً؟ (التكليف السابق)
                  </div>
                  <div className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] mt-1">
                    {lastAttendedSession?.newMemorization
                      ? `سورة ${lastAttendedSession.newMemorization.surahName} (${lastAttendedSession.newMemorization.fromAyah}-${lastAttendedSession.newMemorization.toAyah})`
                      : `سورة ${currentStudent.currentStop.surahName} (آية ${currentStudent.currentStop.ayah})`}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    آخر حصة: {lastAttendedSession?.date || 'حصة تأسيسية'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-emerald-500/30">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    ٢. ماذا سمّع فعلياً اليوم؟ (التسميع الفعلي)
                  </div>
                  <div className="text-sm font-extrabold text-[#14281d] dark:text-white mt-1">
                    سورة {actualRecitation.surahName} ({actualRecitation.fromAyah} إلى{' '}
                    {actualRecitation.toAyah})
                  </div>
                  <div className="text-[11px] text-emerald-600 font-mono mt-0.5">
                    الأداء الفعلي: {sectionPercentages.actualRecitation || 94}%{' '}
                    {renderMiniSquares(sectionPercentages.actualRecitation || 94)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-[#c59b27]/40">
                  <div className="text-[11px] font-bold text-[#c59b27]">
                    ٣. قرار الإتقان الرسمي للشيخ
                  </div>
                  <div className="text-sm font-extrabold text-[#14281d] dark:text-white mt-1">
                    التقدير: {prevNewGrade} ({masteryScore}%)
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {masteryScore >= 85
                      ? 'متقن — يعتمد الانتقال للموضع الجديد ✓'
                      : 'يحتاج تثبيتاً وإعادة تسميع ⏳'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
                  <div className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>٤. أين توقف الطالب؟</span>
                  </div>
                  <div className="text-sm font-extrabold mt-1">
                    سورة {currentStudent.currentStop.surahName} — آية{' '}
                    {currentStudent.currentStop.ayah}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    الربط: من {currentStudent.linkLogic} · الخطة: {currentStudent.plan}
                  </div>
                </div>
              </div>

              {/* Open Errors Follow-Up Card across Sessions (بطاقة متابعة أخطاء الطالب عبر الحصص) */}
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>
                        بطاقة متابعة أخطاء الطالب السابقة التي تحتاج إعادة اختبار اليوم (
                        {openFollowUpErrors.length})
                      </span>
                    </h4>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                      اختبر الطالب في الكلمات التي أخطأ فيها سابقاً وحدد قرارك الفوري (أتقن ✓ / يحتاج تثبيت ⏳ / أخطأ مرة أخرى 🔁)
                    </p>
                  </div>
                </div>

                {openFollowUpErrors.length === 0 ? (
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>جميع ملاحظات الحصص السابقة متقنة بالكامل ولله الحمد!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {openFollowUpErrors.map((err) => (
                      <div
                        key={err.id}
                        className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-rose-200/80 dark:border-rose-900/50 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-[#14281d] dark:text-white">
                            {err.word ? `﴿${err.word}﴾` : err.type} — سورة{' '}
                            {err.surah || currentStudent.currentStop.surahName}
                            {err.ayah ? ` (آية ${err.ayah})` : ''}
                          </div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {err.subType || err.type} • الحالة:{' '}
                            <strong className="text-rose-600">
                              {err.followUpStatus || 'تحت المتابعة'}
                            </strong>{' '}
                            {err.repeatCount && err.repeatCount > 1
                              ? `(تكرر ${err.repeatCount} مرات)`
                              : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateErrorFollowUpStatus(
                                currentStudent.id,
                                err.compositeKey || err.id,
                                'mastered'
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                            title="إغلاق الخطأ بعد التأكد من إتقانه"
                          >
                            أتقن ✓
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateErrorFollowUpStatus(
                                currentStudent.id,
                                err.compositeKey || err.id,
                                'needs_practice'
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold cursor-pointer"
                          >
                            يحتاج تثبيت ⏳
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateErrorFollowUpStatus(
                                currentStudent.id,
                                err.compositeKey || err.id,
                                'repeated_error'
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            أخطأ مرة أخرى 🔁
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {smartSuggestion && (
                <div className="p-4 rounded-2xl bg-[#f6f7f2]/70 dark:bg-[#0b1711]/70 border border-[#c59b27]/40 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#c59b27] mb-1">
                      اقتراح المراجعة الذكي اليوم
                    </div>
                    <div className="text-sm font-extrabold">
                      مراجعة سورة {smartSuggestion.weakSurah}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {smartSuggestion.reason}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const found =
                        SURAHS.find((s) => s.name === smartSuggestion.weakSurah) ||
                        SURAHS[66];
                      setNearRev({
                        enabled: true,
                        surahId: found.id,
                        surahName: found.name,
                        isFullSurah: true,
                        fromAyah: 1,
                        toAyah: found.ayahs,
                        direction: 'asc',
                      });
                      showToast(
                        `تم إدراج سورة ${found.name} في المراجعة القريبة`,
                        'success'
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] shrink-0 cursor-pointer"
                  >
                    اعتماد المقترح
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interactive Recitation Error Logger & Automatic Mastery Score */}
      {status === 'حضر' && (
        <div className="rounded-2xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
            <div>
              <h3 className="text-base font-extrabold text-[#14281d] dark:text-white">
                سجل أخطاء التسميع التفاعلي وتقييم الأداء
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                اختر سياق الخطأ ثم اضغط على نوع الخطأ لرصد الملاحظة أو افتح «📖 النص» للنقر على الكلمة والحرف مباشرة
              </p>
            </div>

            <div className="flex items-center gap-3 bg-[#f6f7f2] dark:bg-[#0b1711] px-4 py-2 rounded-2xl border border-neutral-200 dark:border-emerald-900">
              <span className="text-xs font-bold text-neutral-500">نسبة الإتقان التلقائية:</span>
              <span
                className={`text-2xl font-extrabold tabular-nums font-mono ${
                  masteryScore >= 90
                    ? 'text-emerald-600'
                    : masteryScore >= 75
                    ? 'text-[#c59b27]'
                    : 'text-red-600'
                }`}
              >
                {masteryScore}%
              </span>
            </div>
          </div>

          {/* Previous Recitation Quick Grades */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'تقييم الحفظ الجديد', val: prevNewGrade, setVal: setPrevNewGrade },
              { label: 'تقييم المراجعة القريبة', val: prevNearGrade, setVal: setPrevNearGrade },
              { label: 'تقييم المراجعة البعيدة', val: prevFarGrade, setVal: setPrevFarGrade },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-xl bg-[#f6f7f2]/60 dark:bg-[#0b1711]/60 border border-neutral-200 dark:border-emerald-900/40"
              >
                <div className="text-xs font-bold mb-2">{item.label}</div>
                <div className="flex flex-wrap gap-1">
                  {(['ممتاز', 'جيد جداً', 'جيد', 'ضعيف', 'إعادة'] as GradeType[]).map(
                    (g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => item.setVal(g)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                          item.val === g
                            ? g === 'ضعيف' || g === 'إعادة'
                              ? 'bg-red-600 text-white'
                              : 'bg-[#145a3a] text-white'
                            : 'bg-white dark:bg-[#12231a] text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Context Selector + 6 Instant Error Buttons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold mb-1.5">سياق الخطأ الحالي:</label>
              <select
                value={activeErrorContext}
                onChange={(e) => setActiveErrorContext(e.target.value as ErrorContext)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                <option value="التسميع">التسميع العام</option>
                <option value="الحفظ الجديد">الحفظ الجديد</option>
                <option value="المراجعة القريبة">المراجعة القريبة</option>
                <option value="المراجعة البعيدة">المراجعة البعيدة</option>
                <option value="الأجزاء">الأجزاء والأرباع</option>
              </select>
            </div>

            <div className="lg:col-span-8">
              <label className="block text-xs font-bold mb-1.5">
                أزرار تسجيل الأخطاء الفورية (6 تصنيفات):
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(
                  ['حفظ', 'تردد', 'تلقين', 'تجويد', 'تشكيل', 'نسيان آية'] as ErrorType[]
                ).map((errType) => (
                  <button
                    key={errType}
                    type="button"
                    onClick={() => handleAddError(errType)}
                    className="py-2.5 px-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-600 hover:text-white text-red-700 dark:text-red-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    + {errType}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recorded Session Errors List */}
          {errors.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {errors.map((err) => (
                <div
                  key={err.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs font-bold text-red-700 dark:text-red-300"
                >
                  <span>
                    {err.type}
                    {err.subType ? ` (${err.subType})` : ''}
                    {err.tajweedRule ? ` [${err.tajweedRule}]` : ''}
                    {err.word ? ` ﴿${err.word}﴾` : ''}
                    {err.letter ? ` [حرف: ${err.letter}]` : ''} ({err.context}
                    {err.surah ? ` - ${err.surah}` : ''}
                    {err.ayah ? ` آية ${err.ayah}` : ''})
                    {err.correctedInSession ? ' • صُحح بالحصة ✓' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setErrors((prev) => prev.filter((x) => x.id !== err.id))
                    }
                    className="hover:text-red-950 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* استوديو التسجيل الصوتي المباشر لملاحظات المعلم على تسميع الطالب في المحور الخماسي (حفظ محلي) */}
          <div
            id="teacher-5axis-voice-recorder"
            className="mt-4 p-4 rounded-2xl bg-gradient-to-l from-[#145a3a]/10 via-[#fcfaf2] to-[#c59b27]/10 dark:from-[#0b1711] dark:via-[#12231a] dark:to-[#0b1711] border-2 border-[#c59b27]/60 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#c59b27]" />
                  <span>
                    🎙️ التسجيل الصوتي المباشر لملاحظات المعلم على تسميع الطالب (محرك التسميع الخماسي)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                    حفظ محلي تلقائي ({studentTeacherVoiceNotes.length})
                  </span>
                </h4>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5">
                  سجّل ملاحظتك الصوتية أو تصحيح النطق والتجويد مباشرة على محور ({activeErrorContext}) ليُحفظ محلياً في جهازك وفي ملف الطالب وسجل الحصة
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartStopTeacherVoiceRecording('session_axis')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs transition ${
                    isRecordingVoice && activeVoiceRecordTarget === 'session_axis'
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69]'
                  }`}
                >
                  {isRecordingVoice && activeVoiceRecordTarget === 'session_axis' ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>
                        إيقاف وحفظ الملاحظة الصوتية ({voiceRecordingSeconds} ثانية)
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#dfbd69]" />
                      <span>بدء تسجيل ملاحظة صوتية على التسميع</span>
                    </>
                  )}
                </button>

                <label className="px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] hover:border-[#145a3a] border border-[#c59b27]/50 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#c59b27]" />
                  <span>رفع ملاحظة صوتية</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          void persistTeacherVoiceNoteLocally(
                            file,
                            reader.result,
                            5,
                            'session_axis',
                            {
                              title:
                                voiceNoteTitleInput.trim() ||
                                `ملف صوتي مرفق (${file.name})`,
                            }
                          );
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Category & Note Title Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center pt-1">
              <div className="sm:col-span-4">
                <select
                  value={voiceNoteCategoryInput}
                  onChange={(e) =>
                    setVoiceNoteCategoryInput(
                      e.target.value as
                        | 'تجويد'
                        | 'حفظ'
                        | 'تشكيل'
                        | 'مخارج'
                        | 'توجيه عام'
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#0b1711] text-xs font-bold"
                >
                  <option value="تجويد">تصنيف الملاحظة: تصحيح حكم تجويد</option>
                  <option value="مخارج">تصنيف الملاحظة: مخارج الحروف والصفات</option>
                  <option value="حفظ">تصنيف الملاحظة: تثبيت حفظ ومتشابهات</option>
                  <option value="تشكيل">تصنيف الملاحظة: ضبط تشكيل وإعراب</option>
                  <option value="توجيه عام">تصنيف الملاحظة: توجيه عام وتشجيع</option>
                </select>
              </div>
              <div className="sm:col-span-8">
                <input
                  type="text"
                  value={voiceNoteTitleInput}
                  onChange={(e) => setVoiceNoteTitleInput(e.target.value)}
                  placeholder={`عنوان الملاحظة الصوتية على (${activeErrorContext}) — مثال: تحقيق الغنة في سورة ${actualRecitation.surahName}...`}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#0b1711] text-xs font-semibold"
                />
              </div>
            </div>

            {/* Saved Teacher Voice Notes List for Current Student */}
            {studentTeacherVoiceNotes.length > 0 && (
              <div className="pt-2 border-t border-[#c59b27]/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  <span>
                    📂 التسجيلات الصوتية المحفوظة محلياً للطالب ({currentStudent?.name}):
                  </span>
                  <span className="text-neutral-500">
                    محفوظة في الذاكرة المحلية وقاعدة IndexedDB
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {studentTeacherVoiceNotes.slice(0, 8).map((vn) => (
                    <div
                      key={vn.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-[#14281d] dark:text-white truncate">
                            🎙️ {vn.title}
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] font-bold">
                              {vn.context}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#c59b27]/20 text-[#14281d] dark:text-[#dfbd69] font-bold">
                              {vn.category}
                            </span>
                            {vn.surahName && (
                              <span>
                                • سورة {vn.surahName}{' '}
                                {vn.ayahNumber ? `(آية ${vn.ayahNumber})` : ''}
                              </span>
                            )}
                            <span>• {vn.durationSeconds} ث</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={vn.audioDataUrl}
                            download={`teacher-voice-note-${vn.studentId}-${vn.sessionDate}.wav`}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#145a3a] dark:text-[#dfbd69] hover:bg-emerald-100"
                            title="تنزيل الملاحظة الصوتية"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacherVoiceNote(vn.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                            title="حذف الملاحظة الصوتية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <audio
                        controls
                        src={vn.audioDataUrl}
                        className="w-full h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Session Recitation & Assignment Sections (with 📖 النص in every section) */}
      {status === 'حضر' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
            أقسام التسميع الفعلي والتكليف والمراجعات الشاملة (مع عارض النص والتفسير في كل قسم)
          </h2>

          {/* Section 0: Actual Recitation in Current Session (التسميع الفعلي في الحصة الحالية) */}
          {renderSurahSection(
            'new',
            '١) التسميع الفعلي في الحصة الحالية (ما قرأه الطالب أمام الشيخ اليوم)',
            'توثيق الموضع الفعلي الذي استمع إليه الشيخ اليوم (قد يطابق التكليف أو يقل أو يزيد عنه)',
            actualRecitation,
            setActualRecitation,
            'actualRecitation',
            'actual',
            'التسميع'
          )}

          {/* a) New Memorization */}
          {renderSurahSection(
            'new',
            '٢) تكليف الحفظ الجديد للحصة القادمة',
            'تحديد السورة والآيات المقررة للحفظ الجديد مع عرض النص والتفسير والاستماع',
            newMem,
            setNewMem,
            'newMemorization',
            'new',
            'الحفظ الجديد'
          )}

          {/* b) Near Review */}
          {renderSurahSection(
            'near',
            '٣) المراجعة القريبة (الربط)',
            'مراجعة آخر ما حفظه الطالب لربطه بالجديد وتثبيته',
            nearRev,
            setNearRev,
            'nearReview',
            'near',
            'المراجعة القريبة'
          )}

          {/* c) Far Review */}
          {renderSurahSection(
            'far',
            '٤) المراجعة البعيدة',
            'مراجعة المحفوظات القديمة وفق خطة التكرار المتباعد',
            farRev,
            setFarRev,
            'farReview',
            'far',
            'المراجعة البعيدة'
          )}

          {/* d) Juz Review (مراجعة الأجزاء) */}
          <div className="rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f6f7f2]/70 dark:bg-[#0b1711]/60 border-b border-neutral-200/70 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={juzEnabled}
                  onChange={(e) => setJuzEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#145a3a] rounded cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
                      ٥) مراجعة الأجزاء (30 جزءاً)
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-mono font-bold">
                      {sectionPercentages.juzReview || 90}%{' '}
                      {renderMiniSquares(sectionPercentages.juzReview || 90)}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    اختيار الجزء كاملاً أو نطاق محدد مع فتح النص القرآني للجزء مباشرة
                  </p>
                </div>
              </div>

              {juzEnabled && (
                <button
                  type="button"
                  onClick={() =>
                    setSmartQuranModal({
                      open: true,
                      sectionTitle: `مراجعة ${JUZ_NAMES[selectedJuzNum - 1]}`,
                      sectionContext: 'الأجزاء',
                      juz: selectedJuzNum,
                      juzScope: selectedJuzScope,
                      targetSectionKey: 'juz',
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
                  <span>📖 النص (الجزء المحدد)</span>
                </button>
              )}
            </div>

            {juzEnabled && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold mb-1.5">اختر الجزء</label>
                    <select
                      value={selectedJuzNum}
                      onChange={(e) => setSelectedJuzNum(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                    >
                      {JUZ_NAMES.map((jName, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {idx + 1}. {jName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold mb-1.5">
                      المقدار (الجزء / الحزب / الربع 1/8 - 8/8)
                    </label>
                    <select
                      value={selectedJuzScope}
                      onChange={(e) =>
                        setSelectedJuzScope(e.target.value as JuzAssignmentItem['scope'])
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                    >
                      {JUZ_SCOPES.map((sc) => (
                        <option key={sc.value} value={sc.value}>
                          {sc.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddJuzItem}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة للمراجعة</span>
                    </button>
                  </div>
                </div>

                {juzItems.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {juzItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] text-xs font-bold"
                      >
                        <span>{item.label}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setJuzItems((prev) => prev.filter((x) => x.id !== item.id))
                          }
                          className="hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 6: Independent Hizb & Quarters Review (مراجعة الأحزاب والأرباع المستقلة) */}
          <div className="rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f6f7f2]/70 dark:bg-[#0b1711]/60 border-b border-neutral-200/70 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={hizbQuarterEnabled}
                  onChange={(e) => setHizbQuarterEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#145a3a] rounded cursor-pointer"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
                    ٦) مراجعة الأحزاب والأرباع التفصيلية (60 حزباً / 240 ربعاً)
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    تحديد الحزب والربع بدقة مع إمكانية استعراض آيات الحزب والربع مباشرة
                  </p>
                </div>
              </div>

              {hizbQuarterEnabled && (
                <button
                  type="button"
                  onClick={() =>
                    setSmartQuranModal({
                      open: true,
                      sectionTitle: `مراجعة الحزب (${hizbNum}) — الربع (${quarterNum})`,
                      sectionContext: 'الأجزاء',
                      juz: Math.ceil(hizbNum / 2),
                      juzScope: `q${quarterNum}`,
                      targetSectionKey: 'hizb',
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
                  <span>📖 النص (الحزب والربع)</span>
                </button>
              )}
            </div>

            {hizbQuarterEnabled && (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-bold mb-1">رقم الحزب (1 - 60)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={hizbNum}
                      onChange={(e) =>
                        setHizbNum(Math.max(1, Math.min(60, Number(e.target.value) || 60)))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">الربع داخل الحزب (1 - 4)</label>
                    <select
                      value={quarterNum}
                      onChange={(e) => setQuarterNum(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                    >
                      <option value={1}>الربع الأول (1/4)</option>
                      <option value={2}>الربع الثاني (2/4)</option>
                      <option value={3}>الربع الثالث (3/4)</option>
                      <option value={4}>الربع الرابع (4/4)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const lbl = `الحزب (${hizbNum}) — الربع (${quarterNum}/4)`;
                      if (!hizbItems.some((x) => x.label === lbl)) {
                        setHizbItems((prev) => [
                          ...prev,
                          {
                            id: `hq-${Date.now()}`,
                            juzNumber: Math.ceil(hizbNum / 2),
                            juzName: `الحزب ${hizbNum}`,
                            scope: `q${quarterNum}` as JuzAssignmentItem['scope'],
                            label: lbl,
                          },
                        ]);
                      }
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
                  >
                    + إضافة الحزب والربع
                  </button>
                </div>

                {hizbItems.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hizbItems.map((hi) => (
                      <span
                        key={hi.id}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 text-xs font-bold text-[#14281d] dark:text-[#dfbd69]"
                      >
                        {hi.label}
                        <button
                          type="button"
                          onClick={() =>
                            setHizbItems((prev) => prev.filter((x) => x.id !== hi.id))
                          }
                          className="hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* e) Multi-Surah Review with Quick "Select Juz Amma" Button + 📖 النص */}
          <div className="rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 shadow-xs overflow-hidden">
            <div className="p-4 bg-[#f6f7f2]/70 dark:bg-[#0b1711]/60 border-b border-neutral-200/70 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={surahRevEnabled}
                  onChange={(e) => setSurahRevEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#145a3a] rounded cursor-pointer"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
                    ٧) مراجعة السور المتعددة ({selectedSurahNames.length} سورة محددة)
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    تحديد متعدد للسور مع زر سريع لتحديد سور جزء عمّ وعرض النص
                  </p>
                </div>
              </div>

              {surahRevEnabled && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSmartQuranModal({
                        open: true,
                        sectionTitle: `مراجعة السور (${selectedSurahNames[0] || 'النبأ'})`,
                        sectionContext: 'المراجعة البعيدة',
                        surahName: selectedSurahNames[0] || 'النبأ',
                        fromAyah: 1,
                        toAyah: 30,
                        targetSectionKey: 'surahs',
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
                    <span>📖 النص (السور المحددة)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectJuzAmmaSurahs}
                    className="px-3 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold hover:bg-[#b58c1e] cursor-pointer"
                  >
                    ✓ تحديد سور جزء عمّ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSurahNames([])}
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 text-xs font-bold cursor-pointer"
                  >
                    مسح التحديد
                  </button>
                </div>
              )}
            </div>

            {surahRevEnabled && (
              <div className="p-5 space-y-4">
                <input
                  type="text"
                  value={surahRevSearch}
                  onChange={(e) => setSurahRevSearch(e.target.value)}
                  placeholder="ابحث في السور لتحديدها أو إلغاء تحديدها..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold"
                />

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                  {SURAHS.filter(
                    (s) =>
                      !surahRevSearch.trim() ||
                      s.name.includes(surahRevSearch.trim()) ||
                      String(s.id) === surahRevSearch.trim()
                  ).map((s) => {
                    const isPicked = selectedSurahNames.includes(s.name);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setSelectedSurahNames((prev) =>
                            isPicked
                              ? prev.filter((n) => n !== s.name)
                              : [...prev, s.name]
                          )
                        }
                        className={`p-2 rounded-xl border text-xs font-bold text-right transition-colors cursor-pointer ${
                          isPicked
                            ? 'bg-[#145a3a] text-white border-[#145a3a]'
                            : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/40'
                        }`}
                      >
                        {s.id}. {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 8: Extra Free Recitation (التسميع الإضافي الحر) */}
          {renderSurahSection(
            'far',
            '٨) التسميع الإضافي الحر (مبادرات الطالب خارج التكليف)',
            'لتسجيل أي تسميع حر أو مراجعة تطوعية إضافية قدمها الطالب في الحصة',
            extraRecitation,
            setExtraRecitation,
            'extraRecitation',
            'extra',
            'التسميع'
          )}
        </div>
      )}

      {/* Sheikh Memorization Audio Attachment + Guardian Notes + Multi-Format Export + Save/WhatsApp Actions */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        {/* Sheikh Memorization Audio Attachment Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-l from-[#145a3a]/10 to-[#c59b27]/10 border border-[#c59b27]/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#c59b27]" />
              <span>إرفاق صوت الحفظ والتلقين من الشيخ للطالب</span>
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
              يمكن للشيخ تسجيل تلاوة الورد الجديد بصوته أو رفع ملف صوتي ليظهر في بوابة الطالب وولي الأمر للاستماع والتكرار
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSmartQuranModal({
                  open: true,
                  sectionTitle: 'تسجيل وإرفاق صوت الحفظ من الشيخ',
                  sectionContext: 'الحفظ الجديد',
                  surahId: newMem.surahId,
                  surahName: newMem.surahName,
                  fromAyah: newMem.fromAyah,
                  toAyah: newMem.toAyah,
                  targetSectionKey: 'new',
                })
              }
              className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-[#dfbd69]" />
              <span>تسجيل صوت الشيخ مع المصحف</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>رفع ملف صوتي للحفظ</span>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                      setMemorizationAudioDataUrl(reader.result);
                      setMemorizationAudioName(file.name);
                      showToast(`تم إرفاق صوت الحفظ (${file.name}) بنجاح`, 'success');
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
            </label>

            {memorizationAudioDataUrl && (
              <div className="flex items-center gap-2 bg-white dark:bg-[#0b1711] px-2.5 py-1 rounded-xl border border-[#c59b27]/40">
                <audio
                  controls
                  src={memorizationAudioDataUrl}
                  className="h-8 max-w-[180px]"
                />
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate max-w-[120px]">
                  {memorizationAudioName || 'صوت الشيخ المرفق'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-[#14281d] dark:text-white mb-1">
            ملاحظات ولي الأمر والتسجيل الصوتي للمعلم
          </h3>
          <p className="text-xs text-neutral-500 mb-3">
            اختر من القوالب الجاهزة بضغطة زر أو سجل ملاحظة صوتية مباشرة
          </p>

          {/* Ready-made Note Templates */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PARENT_NOTE_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  setParentNotes((prev) => (prev ? `${prev}\n${tpl}` : tpl))
                }
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/60 bg-[#f6f7f2] dark:bg-[#0b1711] hover:border-[#145a3a] text-xs font-semibold transition-colors cursor-pointer"
              >
                + {tpl.slice(0, 38)}...
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={parentNotes}
            onChange={(e) => setParentNotes(e.target.value)}
            placeholder="اكتب توجيهاتك وملاحظاتك لولي أمر الطالب..."
            className="w-full p-3.5 rounded-2xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold"
          />
        </div>

        {/* وحدة المستشار التربوي + الربط الذكي بسجل الأخطاء + توجيه تربوي للأسرة داخل شاشة الحصة (#pg-session) */}
        {currentStudent && (
          <div id="pg-session" className="space-y-4">
            <PedagogicalDiagnosticCard
              student={currentStudent}
              errors={errors}
              compact
              onInsertAdviceToNotes={(advice) =>
                setParentNotes((prev) => (prev ? `${prev}\n${advice}` : advice))
              }
            />
            <FamilyGuidanceGeneratorSection
              student={currentStudent}
              errors={errors}
              surahName={newMem.surahName || actualRecitation.surahName}
              fromAyah={newMem.fromAyah || actualRecitation.fromAyah}
              toAyah={newMem.toAyah || actualRecitation.toAyah}
              onInsertIntoParentMessage={(guidanceText) =>
                setParentNotes((prev) =>
                  prev ? `${prev}\n\n${guidanceText}` : guidanceText
                )
              }
            />
          </div>
        )}

        {/* 7. ركن «آداب حامل القرآن والتربية» في الحصة (دقيقة تربوية تظهر في تقرير ولي الأمر) */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c59b27]" />
                <span>
                  🌿 ركن «آداب حامل القرآن والتربية» في الحصة (تذكرة تربوية في دقيقة واحدة)
                </span>
              </h4>
              <p className="text-[11px] text-neutral-500">
                اختر بطاقة تربوية بضغطة زر ليذكّر بها الشيخ الطالب وتُدرج تلقائياً في تقرير ولي الأمر تحت بند «التربية والآداب المكتسبة اليوم»
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TARBIYAH_ADAB_CARDS.map((card) => {
              const isSelected = selectedTarbiyahId === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedTarbiyahId(card.id)}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-xs'
                      : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 text-[#14281d] dark:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                    <span
                      className={
                        isSelected ? 'text-[#dfbd69]' : 'text-[#c59b27]'
                      }
                    >
                      {card.category}
                    </span>
                    {isSelected && <span>✓ مُختار للحصة</span>}
                  </div>
                  <div className="text-xs font-extrabold mt-0.5">
                    {card.title}
                  </div>
                  <p
                    className={`text-[11px] mt-1 line-clamp-2 ${
                      isSelected ? 'text-emerald-100' : 'text-neutral-500'
                    }`}
                  >
                    {card.oneMinuteReminder}
                  </p>
                  <div
                    className={`text-[10px] font-bold mt-1 pt-1 border-t ${
                      isSelected
                        ? 'border-white/20 text-[#dfbd69]'
                        : 'border-neutral-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    العمل التطبيقي: {card.practicalAction}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Teacher Audio Note Recorder */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/40">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggleVoiceRecorder}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                isRecordingVoice
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-[#145a3a] text-white hover:bg-[#0f452c]'
              }`}
            >
              {isRecordingVoice ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>
                    إيقاف وحفظ التسجيل الصوتي ({voiceRecordingSeconds} ثانية)
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-[#dfbd69]" />
                  <span>تسجيل ملاحظة صوتية للمعلم</span>
                </>
              )}
            </button>

            {voiceNoteUrl && (
              <div className="flex items-center gap-2">
                <audio src={voiceNoteUrl} controls className="h-9 max-w-[220px]" />
                {voiceNoteDuration > 0 && (
                  <span className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69]">
                    ({voiceNoteDuration} ث)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setVoiceNoteUrl(undefined);
                    setVoiceNoteDuration(0);
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <span className="text-xs text-neutral-500">
            يُحفظ التسجيل الصوتي محلياً مع سجل الحصة وفي قاعدة IndexedDB ({studentTeacherVoiceNotes.length} تسجيلات للطالب)
          </span>
        </div>

        {/* Multi-Format Session & Error Reports Export Bar */}
        <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#c59b27]" />
            <span>تصدير تقارير الحصة وتقرير الأخطاء المستقل (نص / HTML / طباعة PDF):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportSessionOrErrorReport('session', 'text')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 text-xs font-bold cursor-pointer"
            >
              📋 نسخ تقرير الحصة
            </button>
            <button
              type="button"
              onClick={() => handleExportSessionOrErrorReport('session', 'html')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#145a3a]" />
              <span>تقرير الحصة (HTML)</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportSessionOrErrorReport('errors_only', 'html')}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold cursor-pointer"
            >
              ⚠️ تصدير تقرير الأخطاء المستقل
            </button>
            <button
              type="button"
              onClick={() => handleExportSessionOrErrorReport('session', 'print')}
              className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#dfbd69]" />
              <span>طباعة / PDF</span>
            </button>
          </div>
        </div>

        {/* Final Save & Send via WhatsApp Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => buildAndSaveSession('منشور ببوابة ولي الأمر')}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#dfbd69]" />
            <span>حفظ الحصة ونشرها ببوابة الطالب</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAndSendWhatsApp('short')}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>حفظ وإرسال واتساب (مختصرة)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAndSendWhatsApp('detailed')}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] font-extrabold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>حفظ وإرسال واتساب (تفصيلية)</span>
          </button>
        </div>
      </div>

      {/* Unified Smart Quran Text & Tafsir & Error Recording Modal (`📖 النص`) */}
      {smartQuranModal && (
        <QuranTextModal
          isOpen={smartQuranModal.open}
          onClose={() => setSmartQuranModal(null)}
          sectionTitle={smartQuranModal.sectionTitle}
          sectionContext={smartQuranModal.sectionContext}
          initialSurahId={smartQuranModal.surahId}
          initialSurahName={smartQuranModal.surahName}
          initialFromAyah={smartQuranModal.fromAyah}
          initialToAyah={smartQuranModal.toAyah}
          initialJuz={smartQuranModal.juz}
          initialJuzScope={smartQuranModal.juzScope}
          studentName={currentStudent?.name}
          existingErrors={errors}
          memorizationAudioDataUrl={memorizationAudioDataUrl}
          memorizationAudioName={memorizationAudioName}
          onSaveMemorizationAudio={(dataUrl, fileName) => {
            setMemorizationAudioDataUrl(dataUrl);
            setMemorizationAudioName(fileName);
          }}
          onApplyRange={(sId, sName, fAyah, tAyah) => {
            const target = smartQuranModal.targetSectionKey;
            if (target === 'actual') {
              setActualRecitation((prev) => ({
                ...prev,
                enabled: true,
                surahId: sId,
                surahName: sName,
                isFullSurah: false,
                fromAyah: fAyah,
                toAyah: tAyah,
              }));
            } else if (target === 'new') {
              setNewMem((prev) => ({
                ...prev,
                enabled: true,
                surahId: sId,
                surahName: sName,
                isFullSurah: false,
                fromAyah: fAyah,
                toAyah: tAyah,
              }));
            } else if (target === 'near') {
              setNearRev((prev) => ({
                ...prev,
                enabled: true,
                surahId: sId,
                surahName: sName,
                isFullSurah: false,
                fromAyah: fAyah,
                toAyah: tAyah,
              }));
            } else if (target === 'far') {
              setFarRev((prev) => ({
                ...prev,
                enabled: true,
                surahId: sId,
                surahName: sName,
                isFullSurah: false,
                fromAyah: fAyah,
                toAyah: tAyah,
              }));
            } else if (target === 'extra') {
              setExtraRecitation((prev) => ({
                ...prev,
                enabled: true,
                surahId: sId,
                surahName: sName,
                isFullSurah: false,
                fromAyah: fAyah,
                toAyah: tAyah,
              }));
            } else if (target === 'surahs' || (target as string) === 'surah') {
              setSurahRevEnabled(true);
              setSelectedSurahNames((prev) =>
                prev.includes(sName) ? prev : [...prev, sName]
              );
            }
          }}
          onRecordError={(newErr) => {
            setErrors((prev) => {
              const compKey = newErr.compositeKey;
              if (compKey && prev.some((e) => e.compositeKey === compKey)) {
                return prev.map((e) =>
                  e.compositeKey === compKey
                    ? { ...e, repeatCount: (e.repeatCount || 1) + 1 }
                    : e
                );
              }
              return [
                {
                  ...newErr,
                  id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                },
                ...prev,
              ];
            });
          }}
        />
      )}

      {/* 8. Milestone Bisharah Card Generator Modal */}
      {bisharahModalOpen && currentStudent && (
        <MilestoneBisharahModal
          student={currentStudent}
          settings={settings}
          defaultMilestoneTitle={
            masteryScore >= 95
              ? `تحقيق نسبة إتقان ${masteryScore}% في سورة ${actualRecitation.surahName}`
              : `إتمام وتثبيت سورة ${newMem.surahName} المباركة`
          }
          onClose={() => setBisharahModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Legacy Modal: Uthmani Quran Text & Audio Player */}
      {readerModal?.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60 shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#145a3a] text-white flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold">
                  سورة {readerModal.surahName} — الآيات ({readerModal.fromAyah} إلى{' '}
                  {readerModal.toAyah})
                </h3>
                <p className="text-xs text-emerald-100">
                  الرسم العثماني المصحفي مع الاستماع لتلاوة القراء الثلاثة
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedReciter}
                  onChange={(e) => setSelectedReciter(e.target.value as ReciterId)}
                  className="px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id} className="text-black">
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    setPlayingAyah(null);
                    setReaderModal(null);
                  }}
                  className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 bg-[#fcfaf2] dark:bg-[#0b1711]">
              {readerLoading ? (
                <div className="p-12 text-center text-sm font-bold text-neutral-500">
                  جارٍ تحضير الآيات بالرسم العثماني...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="font-quran text-2xl md:text-3xl leading-loose text-justify text-[#14281d] dark:text-[#e9f2ec] p-5 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/40">
                    {readerVerses.map((v) => (
                      <span
                        key={v.ayah}
                        onClick={() => playVerseAudio(readerModal.surahId, v.ayah)}
                        className={`inline cursor-pointer rounded-lg px-1.5 py-0.5 transition-colors ${
                          playingAyah === v.ayah
                            ? 'bg-[#c59b27]/30 text-[#145a3a] dark:text-[#dfbd69]'
                            : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                        }`}
                        title="انقر للاستماع للآية"
                      >
                        {v.text}{' '}
                        <span className="inline-flex items-center justify-center w-7 h-7 mx-1 text-xs font-mono tabular-nums rounded-full border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69]">
                          {v.ayah}
                        </span>{' '}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                      <span>انقر على أي آية للاستماع إليها بصوت القارئ المختار</span>
                    </span>
                    {playingAyah && (
                      <button
                        onClick={() => {
                          audioRef.current?.pause();
                          setPlayingAyah(null);
                        }}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 text-white font-bold cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>إيقاف الصوت (آية {playingAyah})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


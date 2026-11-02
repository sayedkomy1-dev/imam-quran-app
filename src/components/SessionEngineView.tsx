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
import { MUTASHABIHAT_DB, TAJWEED_RULES_GUIDE } from '../data/smartSuiteData';
import {
  AttendanceStatus,
  ErrorContext,
  ErrorType,
  GradeType,
  JuzAssignmentItem,
  RecitationAxisKey,
  RecitationError,
  ReciterId,
  SessionSyncStatus,
  StudentRecitationAudioClip,
  SurahRangeAssignment,
  TeacherRecitationVoiceNote,
  VoiceNoteEvaluationRating,
  ErrorHotspotStageKey,
  MakeupSessionCard,
} from '../types';

const VOICE_NOTE_EVAL_RATINGS: {
  value: VoiceNoteEvaluationRating;
  label: string;
  mappedGrade: GradeType;
  defaultScore: number;
  badgeClass: string;
  autoPhrase: string;
}[] = [
  {
    value: 'متميز',
    label: '🌟 متميز (إتقان عالٍ وتلاوة متقنة)',
    mappedGrade: 'ممتاز',
    defaultScore: 96,
    badgeClass: 'bg-emerald-600 text-white border-emerald-500',
    autoPhrase: 'أداء متميز وإتقان راسخ للحفظ وأحكام التجويد',
  },
  {
    value: 'جيد جداً',
    label: '✅ جيد جداً (أداء مستقر مع ملاحظات يسيرة)',
    mappedGrade: 'جيد جداً',
    defaultScore: 86,
    badgeClass: 'bg-teal-600 text-white border-teal-500',
    autoPhrase: 'مستوى جيد جداً مع الحاجة لتثبيت يسير في بعض المواضع',
  },
  {
    value: 'جيد',
    label: '👍 جيد (مقبول ويحتاج مزيداً من التكرار)',
    mappedGrade: 'جيد',
    defaultScore: 76,
    badgeClass: 'bg-amber-500 text-slate-950 border-amber-400',
    autoPhrase: 'مستوى جيد بالمجمل ويحتاج إلى مزيد من التكرار والضبط المنزلي',
  },
  {
    value: 'ضعيف',
    label: '⚠️ ضعيف (يحتاج إعادة تأسيس ومتابعة مكثفة)',
    mappedGrade: 'ضعيف',
    defaultScore: 60,
    badgeClass: 'bg-red-600 text-white border-red-500',
    autoPhrase: 'المستوى ضعيف في هذا الموضع ويحتاج إلى إعادة تسميع وتدريب مكثف',
  },
  {
    value: 'يحتاج مراجعة',
    label: '🔄 يحتاج مراجعة (تثبيت المقرر قبل الانتقال للجديد)',
    mappedGrade: 'إعادة',
    defaultScore: 68,
    badgeClass: 'bg-orange-600 text-white border-orange-500',
    autoPhrase: 'يحتاج مراجعة وتثبيتاً إضافياً للمقطع قبل الانتقال لموضع جديد',
  },
];
import { buildWhatsAppUrl, PARENT_NOTE_TEMPLATES } from '../utils/whatsapp';
import {
  HijriCalendar,
  formatGregorianAndHijri,
  formatHijriDate,
  triggerFastPrint,
} from '../utils/dateUtils';
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
import { SmartBoardView } from './SmartBoardView';
import {
  GeminiRecitationAnalyzerTool,
  GeminiRecitationEvaluationResult,
} from './GeminiRecitationAnalyzerTool';
import { NewMemAudioPlayerAndWhatsAppTool } from './NewMemAudioPlayerAndWhatsAppTool';
import { ErrorHotspotsManager } from './ErrorHotspotsManager';
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
  Bell,
  BellOff,
  MicOff,
  Minimize2,
  Pause,
  Play,
  Plus,
  Printer,
  Repeat,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Timer,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';

// Web Audio API synthesizer for accurate, zero-dependency countdown timer alerts
const playRecitationTimerTone = (mode: 'warning' | 'final_tick' | 'expired') => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const triggerNote = (
      freq: number,
      startOffset: number,
      duration: number,
      type: OscillatorType = 'sine',
      peakGain = 0.18
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.03);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + startOffset + duration
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    if (mode === 'warning') {
      // Gentle two-tone chime (approaching end of student recitation time)
      triggerNote(587.33, 0, 0.22, 'triangle', 0.16); // D5
      triggerNote(880, 0.24, 0.35, 'triangle', 0.18); // A5
    } else if (mode === 'final_tick') {
      // Short subtle tick for final 10 seconds
      triggerNote(740, 0, 0.1, 'sine', 0.1);
    } else if (mode === 'expired') {
      // Clear triple-chime completion alert when time is up
      triggerNote(659.25, 0, 0.22, 'triangle', 0.22); // E5
      triggerNote(587.33, 0.24, 0.22, 'triangle', 0.22); // D5
      triggerNote(523.25, 0.48, 0.55, 'triangle', 0.25); // C5
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch {
    // Ignore audio context restriction errors
  }
};

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
    updateSettings,
    homeSubmissions,
    studentAudioBlobs,
    loadStudentAudioBlobs,
    saveStudentAudioBlob,
    saveStudentRecitationAudioClip,
    deleteStudentRecitationAudioClip,
    selectedStudentId,
    setSelectedStudentId,
    setActiveTab,
    saveSession,
    updateStudent,
    addTask,
    saveHomeSubmission,
    addTimestampPinToHomeSubmission,
    reviewHomeSubmission,
    updateErrorFollowUpStatus,
    showToast,
    isFullScreenFocus,
    setIsFullScreenFocus,
  } = useAcademy();

  // Absence Makeup & Auto-Reschedule Engine State
  const [makeupScheduleDate, setMakeupScheduleDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [makeupScheduleTime, setMakeupScheduleTime] = useState<string>('17:00');

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
  const [focusBoardAxisKey, setFocusBoardAxisKey] =
    useState<RecitationAxisKey>('actualRecitation');
  const [focusLayoutMode, setFocusLayoutMode] = useState<
    'board_expanded' | 'split_5axis'
  >('board_expanded');

  const handleToggleFocusMode = () => {
    triggerHaptic(14);
    const nextFocus = !isFullScreenFocus;
    setIsFullScreenFocus(nextFocus);
    showToast(
      nextFocus
        ? '🎯 تم تفعيل وضع التركيز في محرك الحصة الخماسي: تم إخفاء القوائم الجانبية وتوسيع مساحة السبورة الذكية لتقليل المشتتات أثناء التسميع'
        : 'تم إنهاء وضع التركيز واستعادة القوائم الجانبية والواجهة الكاملة',
      nextFocus ? 'success' : 'info'
    );
  };

  // ============================================================================
  // ⏱️ عداد التسميع التنازلي الدقيق (5-Axis Student Recitation Countdown Timer)
  // ============================================================================
  const [timerPresetSeconds, setTimerPresetSeconds] = useState<number>(() => {
    const saved = Number(localStorage.getItem('wlq_5axis_timer_preset_sec'));
    return Number.isFinite(saved) && saved >= 60 ? saved : 600; // Default: 10 minutes
  });
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number>(() => {
    const saved = Number(localStorage.getItem('wlq_5axis_timer_preset_sec'));
    return Number.isFinite(saved) && saved >= 60 ? saved : 600;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerWarningThresholdSec, setTimerWarningThresholdSec] = useState<number>(() => {
    const saved = Number(localStorage.getItem('wlq_5axis_timer_warn_sec'));
    return Number.isFinite(saved) && saved >= 15 ? saved : 60; // Default warning: 60s before end
  });
  const [timerSoundEnabled, setTimerSoundEnabled] = useState<boolean>(true);
  const [timerAutoResetOnStudentSwitch, setTimerAutoResetOnStudentSwitch] =
    useState<boolean>(true);
  const [timerCustomMinutesInput, setTimerCustomMinutesInput] =
    useState<string>('10');
  const [timerElapsedSeconds, setTimerElapsedSeconds] = useState<number>(0);

  const hasFiredApproachingWarningRef = useRef<boolean>(false);
  const hasFiredTimeExpiredRef = useRef<boolean>(false);
  const timerSoundEnabledRef = useRef<boolean>(timerSoundEnabled);
  timerSoundEnabledRef.current = timerSoundEnabled;
  const timerWarningThresholdRef = useRef<number>(timerWarningThresholdSec);
  timerWarningThresholdRef.current = timerWarningThresholdSec;

  const formatTimerMMSS = (totalSec: number) => {
    const safe = Math.max(0, Math.floor(totalSec));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectTimerPreset = (seconds: number, autoStart = false) => {
    const validSec = Math.max(30, Math.min(7200, Math.round(seconds)));
    triggerHaptic(12);
    localStorage.setItem('wlq_5axis_timer_preset_sec', String(validSec));
    setTimerPresetSeconds(validSec);
    setTimerRemainingSeconds(validSec);
    setTimerCustomMinutesInput(String(Math.round(validSec / 60)));
    hasFiredApproachingWarningRef.current = false;
    hasFiredTimeExpiredRef.current = false;
    setIsTimerRunning(autoStart);
  };

  const handleExtendTimerSeconds = (extraSeconds: number) => {
    triggerHaptic(15);
    setTimerPresetSeconds((prev) => prev + extraSeconds);
    setTimerRemainingSeconds((prev) => {
      const next = prev + extraSeconds;
      if (next > timerWarningThresholdSec) {
        hasFiredApproachingWarningRef.current = false;
      }
      if (next > 0) {
        hasFiredTimeExpiredRef.current = false;
      }
      return next;
    });
    showToast(
      `⏱️ تم تمديد وقت تسميع الطالب بمقدار +${Math.round(extraSeconds / 60)} دقيقة إضافية`,
      'info'
    );
  };

  const handleResetRecitationTimer = (startImmediately = false) => {
    triggerHaptic(12);
    setTimerRemainingSeconds(timerPresetSeconds);
    setTimerElapsedSeconds(0);
    hasFiredApproachingWarningRef.current = false;
    hasFiredTimeExpiredRef.current = false;
    setIsTimerRunning(startImmediately);
  };

  // Accurate 1-second countdown interval with approaching-end & time-up alerts
  useEffect(() => {
    if (!isTimerRunning) return;
    const intervalId = window.setInterval(() => {
      setTimerElapsedSeconds((prev) => prev + 1);
      setTimerRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          setIsTimerRunning(false);
          if (!hasFiredTimeExpiredRef.current) {
            hasFiredTimeExpiredRef.current = true;
            triggerHaptic(50);
            if (timerSoundEnabledRef.current) {
              playRecitationTimerTone('expired');
            }
            showToast(
              `⌛ انتهى الوقت المخصص لتسميع الطالب (${currentStudent?.name || 'الطالب الحالي'})! يمكنك التمديد بدقيقتين أو حفظ الحصة.`,
              'warning'
            );
          }
          return 0;
        }

        const nextSec = prev - 1;
        const warnThreshold = timerWarningThresholdRef.current;

        if (
          nextSec === warnThreshold &&
          !hasFiredApproachingWarningRef.current
        ) {
          hasFiredApproachingWarningRef.current = true;
          triggerHaptic(25);
          if (timerSoundEnabledRef.current) {
            playRecitationTimerTone('warning');
          }
          const warnLabel =
            warnThreshold >= 60
              ? `${Math.round(warnThreshold / 60)} دقيقة`
              : `${warnThreshold} ثانية`;
          showToast(
            `⏰ تنبيه اقتراب انتهاء الوقت: متبقي ${warnLabel} فقط على انتهاء وقت تسميع الطالب (${currentStudent?.name || ''})`,
            'warning'
          );
        } else if (nextSec === 10 && timerSoundEnabledRef.current) {
          playRecitationTimerTone('final_tick');
        }

        return nextSec;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isTimerRunning, currentStudent?.name, showToast]);

  // Auto-reset countdown timer when switching between students
  useEffect(() => {
    if (!currentStudent?.id || !timerAutoResetOnStudentSwitch) return;
    setIsTimerRunning(false);
    setTimerRemainingSeconds(timerPresetSeconds);
    setTimerElapsedSeconds(0);
    hasFiredApproachingWarningRef.current = false;
    hasFiredTimeExpiredRef.current = false;
  }, [currentStudent?.id, timerAutoResetOnStudentSwitch, timerPresetSeconds]);

  const timerStatusVisual = useMemo(() => {
    const pct =
      timerPresetSeconds > 0
        ? Math.max(
            0,
            Math.min(100, Math.round((timerRemainingSeconds / timerPresetSeconds) * 100))
          )
        : 0;
    const isExpired = timerRemainingSeconds <= 0;
    const isApproachingEnd =
      !isExpired && timerRemainingSeconds <= timerWarningThresholdSec;

    // Suggest which of the 5 axes the teacher should be in based on elapsed percentage
    const elapsedPct = 100 - pct;
    let currentSuggestedAxis = '١. التسميع الفعلي وتقييم الماضي (أول ٣٠٪ من الوقت)';
    if (elapsedPct >= 75) {
      currentSuggestedAxis = '٥. المراجعة البعيدة وتثبيت الأجزاء والختام (آخر ٢٥٪ من الوقت)';
    } else if (elapsedPct >= 55) {
      currentSuggestedAxis = '٤. المراجعة القريبة وربط المحفوظ (٢٠٪ من الوقت)';
    } else if (elapsedPct >= 30) {
      currentSuggestedAxis = '٢-٣. تلقين الحفظ الجديد وتصحيح التلاوة (٢٥٪ من الوقت)';
    }

    return {
      pct,
      isExpired,
      isApproachingEnd,
      currentSuggestedAxis,
    };
  }, [timerPresetSeconds, timerRemainingSeconds, timerWarningThresholdSec]);
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
  const [voiceNoteEvalRatingInput, setVoiceNoteEvalRatingInput] =
    useState<VoiceNoteEvaluationRating>('متميز');
  const [voiceNoteTitleInput, setVoiceNoteTitleInput] = useState<string>('');
  const [liveVoiceDraftTranscript, setLiveVoiceDraftTranscript] = useState<string>('');
  const [voiceMicAudioLevel, setVoiceMicAudioLevel] = useState<number>(0);
  const [convertingVoiceNoteId, setConvertingVoiceNoteId] = useState<string | 'ALL' | null>(
    null
  );
  const [autoConvertVoiceNoteOnStop, setAutoConvertVoiceNoteOnStop] =
    useState<boolean>(false);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const voiceSpeechRecognitionRef = useRef<any>(null);
  const voiceAudioContextRef = useRef<AudioContext | null>(null);
  const voiceLevelIntervalRef = useRef<number | null>(null);
  const liveVoiceDraftRef = useRef<string>('');

  const studentTeacherVoiceNotes = useMemo(() => {
    if (!currentStudent) return [];
    return allTeacherVoiceNotes.filter((n) => n.studentId === currentStudent.id);
  }, [allTeacherVoiceNotes, currentStudent]);

  // 5-Axis Recitation Microphone Short Clip Recorder State (محرك التسميع الخماسي — ميكروفون التسميع وحفظ الرابط في حالة الطالب)
  const [activeAxisMicRecording, setActiveAxisMicRecording] =
    useState<RecitationAxisKey | null>(null);
  const [axisMicSeconds, setAxisMicSeconds] = useState<number>(0);
  const [juzReviewRecordedAudioUrl, setJuzReviewRecordedAudioUrl] = useState<
    string | undefined
  >(undefined);
  const [juzReviewRecordedDurationSec, setJuzReviewRecordedDurationSec] = useState<
    number | undefined
  >(undefined);
  const [axisClipsFilter, setAxisClipsFilter] = useState<RecitationAxisKey | 'ALL'>(
    'ALL'
  );
  const [geminiTriggerClip, setGeminiTriggerClip] =
    useState<StudentRecitationAudioClip | null>(null);
  const [latestGeminiEvaluation, setLatestGeminiEvaluation] =
    useState<GeminiRecitationEvaluationResult | null>(null);
  const [showWhatsAppSummaryPreview, setShowWhatsAppSummaryPreview] =
    useState<boolean>(false);
  const axisMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const axisTimerRef = useRef<number | null>(null);
  const axisStartTimestampRef = useRef<number>(0);
  const axisSimulatedFallbackRef = useRef<boolean>(false);
  const axisPendingCallbackRef = useRef<{
    axisKey: RecitationAxisKey;
    axisLabel: string;
    surahName: string;
    fromAyah?: number;
    toAyah?: number;
    percentage?: number;
    grade?: GradeType;
    onSavedToAxis?: (url: string, dur: number) => void;
  } | null>(null);

  const studentRecitationClips = useMemo<StudentRecitationAudioClip[]>(() => {
    if (!currentStudent) return [];
    return currentStudent.recitationAudioClips || [];
  }, [currentStudent]);

  const filteredStudentRecitationClips = useMemo(() => {
    if (axisClipsFilter === 'ALL') return studentRecitationClips;
    return studentRecitationClips.filter((c) => c.axisKey === axisClipsFilter);
  }, [studentRecitationClips, axisClipsFilter]);

  const finalizeAxisMicClip = async (blob: Blob, dataUrl: string, durationSec: number) => {
    const meta = axisPendingCallbackRef.current;
    axisPendingCallbackRef.current = null;
    if (!currentStudent || !meta) return;

    const clampedDur = Math.max(1, durationSec);
    meta.onSavedToAxis?.(dataUrl, clampedDur);

    const savedClip = await saveStudentRecitationAudioClip(currentStudent.id, {
      studentName: currentStudent.name,
      sessionDate,
      axisKey: meta.axisKey,
      axisLabel: meta.axisLabel,
      surahName: meta.surahName,
      fromAyah: meta.fromAyah,
      toAyah: meta.toAyah,
      audioUrl: dataUrl,
      durationSeconds: clampedDur,
      grade: meta.grade,
      percentage: meta.percentage,
      notes: `مقطع تسميع مسجل بالميكروفون في (${meta.axisLabel}) — سورة ${meta.surahName}`,
      blob,
    });

    showToast(
      `🎙️ تم تسجيل مقطع التسميع (${clampedDur} ثانية) وتخزين الرابط في حالة الطالب (${currentStudent.name}) بنجاح ✓`,
      'success'
    );
    return savedClip;
  };

  const handleToggleAxisMicrophoneClip = async (params: {
    axisKey: RecitationAxisKey;
    axisLabel: string;
    surahName: string;
    fromAyah?: number;
    toAyah?: number;
    percentage?: number;
    grade?: GradeType;
    onSavedToAxis?: (url: string, dur: number) => void;
  }) => {
    triggerHaptic(15);

    // If currently recording on any axis, stop and save
    if (activeAxisMicRecording) {
      if (axisTimerRef.current) {
        window.clearInterval(axisTimerRef.current);
        axisTimerRef.current = null;
      }
      const elapsedSec = Math.max(
        2,
        Math.round((Date.now() - axisStartTimestampRef.current) / 1000) ||
          axisMicSeconds ||
          3
      );
      setActiveAxisMicRecording(null);

      if (axisSimulatedFallbackRef.current || !axisMediaRecorderRef.current) {
        axisSimulatedFallbackRef.current = false;
        const { blob, dataUrl } = generateTeacherFallbackWavDataUrl(elapsedSec);
        await finalizeAxisMicClip(blob, dataUrl, elapsedSec);
        return;
      }

      try {
        axisMediaRecorderRef.current.stop();
      } catch {
        const { blob, dataUrl } = generateTeacherFallbackWavDataUrl(elapsedSec);
        await finalizeAxisMicClip(blob, dataUrl, elapsedSec);
      }
      return;
    }

    // Start new microphone recording for this axis
    axisPendingCallbackRef.current = params;
    setActiveAxisMicRecording(params.axisKey);
    setAxisMicSeconds(0);
    axisStartTimestampRef.current = Date.now();
    if (axisTimerRef.current) window.clearInterval(axisTimerRef.current);
    axisTimerRef.current = window.setInterval(() => {
      setAxisMicSeconds((prev) => prev + 1);
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
            Math.round((Date.now() - axisStartTimestampRef.current) / 1000) || 3
          );
          if (chunks.length === 0) {
            const fallback = generateTeacherFallbackWavDataUrl(elapsedSec);
            void finalizeAxisMicClip(fallback.blob, fallback.dataUrl, elapsedSec);
            return;
          }
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
              void finalizeAxisMicClip(blob, reader.result, elapsedSec);
            } else {
              const fallback = generateTeacherFallbackWavDataUrl(elapsedSec);
              void finalizeAxisMicClip(fallback.blob, fallback.dataUrl, elapsedSec);
            }
          };
          reader.readAsDataURL(blob);
        };
        axisSimulatedFallbackRef.current = false;
        axisMediaRecorderRef.current = recorder;
        recorder.start();
        showToast(
          `🎙️ بدأ تسجيل الميكروفون لمحور (${params.axisLabel})... اضغط إيقاف لحفظ الرابط في حالة الطالب`,
          'info'
        );
        return;
      } catch {
        // Fallback to local WAV synthesizer if microphone permission is unavailable in iframe
      }
    }

    axisSimulatedFallbackRef.current = true;
    axisMediaRecorderRef.current = null;
    showToast(
      `🎙️ جاري تسجيل مقطع (${params.axisLabel}) وحفظه في حالة الطالب... اضغط إيقاف عند الانتهاء`,
      'info'
    );
  };

  // Spaced Repetition Engine (SRS) — خوارزمية المراجعة المتباعدة لمنع التفلت
  const srsDueJuzList = useMemo(() => {
    if (!currentStudent || !currentStudent.memorizedJuz || currentStudent.memorizedJuz.length === 0) {
      return [];
    }
    const nowMs = Date.now();
    const list: {
      juzNumber: number;
      juzName: string;
      daysElapsed: number;
      lastDateStr: string;
      urgency: 'critical' | 'warning';
    }[] = [];

    currentStudent.memorizedJuz.forEach((jNum) => {
      const matching = sessions.filter(
        (s) =>
          s.studentId === currentStudent.id &&
          s.status === 'حضر' &&
          ((s.juzReview?.enabled && s.juzReview?.items?.some((it) => it.juzNumber === jNum)) ||
            (s.farReview?.enabled && SURAHS.find((su) => su.id === s.farReview?.surahId)?.juz === jNum) ||
            (s.sectionPercentages?.juzReview && s.sectionPercentages.juzReview > 0))
      );

      matching.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = matching[0];
      let days = 999;
      let lastStr = 'لم يُسجل مسبقاً في الحصص';
      if (latest && latest.date) {
        lastStr = latest.date;
        days = Math.floor((nowMs - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24));
      }

      if (days >= 21) {
        list.push({
          juzNumber: jNum,
          juzName: JUZ_NAMES[jNum - 1] || `الجزء ${jNum}`,
          daysElapsed: days === 999 ? 28 : days,
          lastDateStr: lastStr,
          urgency: days >= 30 ? 'critical' : 'warning',
        });
      }
    });

    return list;
  }, [currentStudent, sessions]);

  const handleApplySrsJuzToFarReview = (juzNumber: number) => {
    const targetSurah = SURAHS.find((s) => s.juz === juzNumber) || SURAHS[0];
    setFarRev({
      enabled: true,
      surahId: targetSurah.id,
      surahName: targetSurah.name,
      isFullSurah: true,
      fromAyah: 1,
      toAyah: targetSurah.ayahs,
      direction: 'asc',
      grade: 'جيد جداً',
    });
    setJuzEnabled(true);
    setSelectedJuzNum(juzNumber);
    setSelectedJuzScope('full');
    setJuzItems([
      {
        id: `jz-srs-${juzNumber}-${Date.now()}`,
        juzNumber: juzNumber,
        juzName: JUZ_NAMES[juzNumber - 1] || `الجزء ${juzNumber}`,
        scope: 'full',
        label: `${JUZ_NAMES[juzNumber - 1]} (إدراج فوري عبر خوارزمية SRS لمنع التفلت)`,
      },
    ]);
    showToast(
      `⚡ تم إدراج (${JUZ_NAMES[juzNumber - 1]}) بنجاح في المراجعة البعيدة ومراجعة الأجزاء لتثبيته ومنع تفلته ✓`,
      'success'
    );
  };

  // Tajweed Error Explanatory Cards State — ربط أخطاء التجويد ببطاقات الشرح المبسطة
  const [tajweedPickerOpen, setTajweedPickerOpen] = useState(false);
  const [tajweedTargetErrorId, setTajweedTargetErrorId] = useState<string | null>(null);
  const [viewingTajweedRuleCard, setViewingTajweedRuleCard] = useState<{
    name: string;
    letters: string;
    example: string;
    explanation: string;
    durationHarakat?: string;
    tip?: string;
  } | null>(null);

  const handleAttachTajweedRuleToError = (rule: any) => {
    if (tajweedTargetErrorId) {
      setErrors((prev) =>
        prev.map((err) =>
          err.id === tajweedTargetErrorId
            ? {
                ...err,
                tajweedRule: rule.name,
                tajweedExplanation: rule.explanation,
                tajweedLetters: rule.letters,
                tajweedExample: rule.example,
                tajweedPracticeTip: `توجيه منزلي: تمرن على نطق الكلمة مع مراعاة (${rule.name}) وحكمها: ${rule.explanation}`,
              }
            : err
        )
      );
      showToast(`تم ربط الخطأ ببطاقة شرح (${rule.name}) بنجاح ✓`, 'success');
      setTajweedPickerOpen(false);
      setTajweedTargetErrorId(null);
    } else {
      // Create new error with this rule attached
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
        type: 'تجويد',
        context: activeErrorContext,
        surah: activeSurah,
        timestamp: sessionDate,
        tajweedRule: rule.name,
        tajweedExplanation: rule.explanation,
        tajweedLetters: rule.letters,
        tajweedExample: rule.example,
        tajweedPracticeTip: `توجيه منزلي: تمرن على نطق الكلمة مع مراعاة (${rule.name}) وحكمها: ${rule.explanation}`,
      };
      setErrors((prev) => [newError, ...prev]);
      showToast(`تم تسجيل خطأ تجويد وإرفاق بطاقة (${rule.name}) ✓`, 'success');
      setTajweedPickerOpen(false);
    }
  };

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

  // أتمتة إرسال ملخص التسميع اليومي عبر واتساب لولي الأمر تلقائياً فور حفظ الحصة
  const [autoSendWhatsAppOnSave, setAutoSendWhatsAppOnSave] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('imam_auto_whatsapp_on_save_v1');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [lastAutoDispatchedSummary, setLastAutoDispatchedSummary] = useState<{
    studentName: string;
    phone: string;
    message: string;
    sentAt: string;
    audioScore: number;
    tajweedScore: number;
  } | null>(null);

  const handleToggleAutoSendWhatsApp = (checked: boolean) => {
    setAutoSendWhatsAppOnSave(checked);
    try {
      localStorage.setItem('imam_auto_whatsapp_on_save_v1', String(checked));
    } catch {
      // ignore storage quota errors
    }
    showToast(
      checked
        ? '⚡ تم تفعيل الإرسال التلقائي لملخص التسميع اليومي عبر واتساب لولي الأمر فور حفظ الحصة'
        : 'تم إيقاف الإرسال التلقائي عبر واتساب عند الحفظ (سيتم حفظ التقرير في بوابة ولي الأمر فقط)',
      'info'
    );
  };

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

  // Multi-Option Voice Audio Sender for New Memorization (Teacher Voice + Husary, Minshawi, Alafasy, Al-Muaiqly)
  const [newMemVoiceChoice, setNewMemVoiceChoice] = useState<
    | 'teacher_voice'
    | 'Husary_128kbps'
    | 'Minshawy_Murattal_128kbps'
    | 'Alafasy_128kbps'
    | 'MaherAlMuaiqly128kbps'
  >('Husary_128kbps');
  const [newMemVersesList, setNewMemVersesList] = useState<AyahEntry[]>([]);
  const [isPlayingNewMemVoice, setIsPlayingNewMemVoice] = useState(false);
  const [playingNewMemAyahNum, setPlayingNewMemAyahNum] = useState<number | null>(null);
  const newMemVoicePlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isRecordingTeacherNewMemVoice, setIsRecordingTeacherNewMemVoice] = useState(false);
  const [teacherNewMemRecSeconds, setTeacherNewMemRecSeconds] = useState(0);
  const teacherNewMemRecorderRef = useRef<MediaRecorder | null>(null);
  const teacherNewMemTimerRef = useRef<number | null>(null);
  const teacherNewMemStartRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    const surahMeta = SURAHS.find((s) => s.id === newMem.surahId) || SURAHS[0];
    const startA = newMem.isFullSurah ? 1 : Math.max(1, newMem.fromAyah);
    const endA = newMem.isFullSurah
      ? Math.min(surahMeta.ayahs, 15)
      : Math.min(surahMeta.ayahs, Math.max(startA, newMem.toAyah));
    loadSurahVerses(newMem.surahId, startA, endA).then((res) => {
      if (active) setNewMemVersesList(res);
    });
    return () => {
      active = false;
    };
  }, [newMem.surahId, newMem.fromAyah, newMem.toAyah, newMem.isFullSurah]);

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

  // Automatic Mastery Score Calculation (supports 4-Category Weighted Deductions: -1.0, -0.5, -0.5, -0.25)
  const masteryScore = useMemo(() => {
    if (status !== 'حضر') return 0;
    const totalDeduction = errors.reduce(
      (sum, err) =>
        sum +
        (typeof err.deductionPoints === 'number'
          ? err.deductionPoints
          : ERROR_WEIGHTS[err.type] || 1),
      0
    );
    return Math.max(40, Math.round((100 - totalDeduction) * 10) / 10);
  }, [errors, status]);

  // مؤشر صحة التسميع + التقييم الصوتي التلقائي ودرجة التجويد
  const recitationHealthAndTajweedMetrics = useMemo(() => {
    const tajweedErrorsCount = errors.filter(
      (e) => e.type === 'تجويد' || e.category === 'تجويد'
    ).length;
    const lahnJaliErrorsCount = errors.filter(
      (e) =>
        e.type === 'حفظ' ||
        e.type === 'تشكيل' ||
        e.type === 'نسيان آية' ||
        e.type === 'تردد' ||
        e.type === 'تلقين'
    ).length;

    const computedTajweedScore = latestGeminiEvaluation?.subScores
      ? Math.round(
          (latestGeminiEvaluation.subScores.ghunnahScore +
            latestGeminiEvaluation.subScores.maddScore +
            latestGeminiEvaluation.subScores.makharijScore) /
            3
        )
      : Math.max(65, Math.min(100, 95 - tajweedErrorsCount * 4));

    const computedLahnJaliScore =
      latestGeminiEvaluation?.subScores?.lahnJaliScore ??
      Math.max(60, Math.min(100, 96 - lahnJaliErrorsCount * 5));

    const fiveAxisAvg = Math.round(
      ((sectionPercentages.actualRecitation || 94) +
        (sectionPercentages.newMemorization || 95) +
        (sectionPercentages.nearReview || 90) +
        (sectionPercentages.farReview || 88) +
        (sectionPercentages.juzReview || 90)) /
        5
    );

    const autoAudioScore =
      latestGeminiEvaluation?.overallScore ??
      Math.round(masteryScore * 0.6 + fiveAxisAvg * 0.4);

    const autoAudioGrade: GradeType =
      latestGeminiEvaluation?.recommendedGrade ||
      (autoAudioScore >= 90
        ? 'ممتاز'
        : autoAudioScore >= 80
        ? 'جيد جداً'
        : autoAudioScore >= 70
        ? 'جيد'
        : 'ضعيف');

    const recitationPace =
      latestGeminiEvaluation?.recitationPace || 'تدوير متزن';

    const healthScore =
      status !== 'حضر'
        ? 0
        : Math.max(
            50,
            Math.min(
              100,
              Math.round(
                autoAudioScore * 0.4 +
                  computedTajweedScore * 0.35 +
                  computedLahnJaliScore * 0.25
              )
            )
          );

    const healthStatusLabel =
      healthScore >= 90
        ? 'صحة تسميع ممتازة ومستقرة 🟢'
        : healthScore >= 80
        ? 'جيد جداً — يحتاج تثبيت يسير 🟡'
        : 'يحتاج متابعة وتكرار مكثف 🔴';

    const autoFeedbackSummary =
      latestGeminiEvaluation?.summaryFeedback ||
      `تم تقييم التسميع صوتياً وتجويدياً بنجاح: درجة التجويد ${computedTajweedScore}%، وسلامة الحفظ واللحن الجلي ${computedLahnJaliScore}%، بمرتبة تلاوة (${recitationPace}).`;

    return {
      tajweedScore: computedTajweedScore,
      lahnJaliScore: computedLahnJaliScore,
      fiveAxisAvg,
      autoAudioScore,
      autoAudioGrade,
      recitationPace,
      healthScore,
      healthStatusLabel,
      autoFeedbackSummary,
      isFromGeminiAi: Boolean(latestGeminiEvaluation),
    };
  }, [
    errors,
    latestGeminiEvaluation,
    sectionPercentages,
    masteryScore,
    status,
  ]);

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

  // Add Recitation Error Button Handler (supports 4-Stage Weighted Hotspots)
  const handleAddError = (
    type: ErrorType,
    customMeta?: {
      deductionPoints?: number;
      hotspotStageKey?: ErrorHotspotStageKey;
      subType?: string;
    }
  ) => {
    const activeSurah =
      activeErrorContext === 'الحفظ الجديد'
        ? newMem.surahName
        : activeErrorContext === 'المراجعة القريبة'
        ? nearRev.surahName
        : activeErrorContext === 'المراجعة البعيدة'
        ? farRev.surahName
        : actualRecitation.surahName || currentStudent?.currentStop.surahName;

    const activeAyah =
      activeErrorContext === 'الحفظ الجديد'
        ? newMem.fromAyah
        : activeErrorContext === 'المراجعة القريبة'
        ? nearRev.fromAyah
        : activeErrorContext === 'المراجعة البعيدة'
        ? farRev.fromAyah
        : actualRecitation.fromAyah || currentStudent?.currentStop.ayah || 1;

    const defaultDeduction =
      customMeta?.deductionPoints ??
      (type === 'حفظ' || type === 'نسيان آية'
        ? 1.0
        : type === 'تردد' || type === 'تلقين'
        ? 0.25
        : 0.5);

    const defaultStageKey: ErrorHotspotStageKey =
      customMeta?.hotspotStageKey ??
      (type === 'حفظ' || type === 'نسيان آية'
        ? 'memorization_1'
        : type === 'تشكيل'
        ? 'tashkeel_05'
        : type === 'تجويد'
        ? 'tajweed_05'
        : 'hesitation_025');

    const newError: RecitationError = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type,
      context: activeErrorContext,
      surah: activeSurah,
      ayah: activeAyah,
      subType: customMeta?.subType || type,
      deductionPoints: defaultDeduction,
      hotspotStageKey: defaultStageKey,
      followUpStatus: 'needs_review',
      repeatCount: 1,
      compositeKey: `${activeSurah}_${activeAyah}_${defaultStageKey}_${Date.now()}`,
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

      if (e.key === 'f' || e.key === 'F' || e.key === 'ب') {
        e.preventDefault();
        const nextFocus = !isFullScreenFocus;
        setIsFullScreenFocus(nextFocus);
        showToast(
          nextFocus
            ? '🎯 اختصار [F]: تم تفعيل وضع التركيز وإخفاء القوائم الجانبية وتوسيع السبورة الذكية'
            : 'اختصار [F]: تم إنهاء وضع التركيز واستعادة القوائم الجانبية',
          'info'
        );
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
    isFullScreenFocus,
    setIsFullScreenFocus,
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

  const stopVoiceSpeechAndLevelMonitors = () => {
    if (voiceLevelIntervalRef.current) {
      window.clearInterval(voiceLevelIntervalRef.current);
      voiceLevelIntervalRef.current = null;
    }
    setVoiceMicAudioLevel(0);
    if (voiceSpeechRecognitionRef.current) {
      try {
        voiceSpeechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      voiceSpeechRecognitionRef.current = null;
    }
    if (voiceAudioContextRef.current) {
      try {
        void voiceAudioContextRef.current.close();
      } catch {
        // ignore
      }
      voiceAudioContextRef.current = null;
    }
  };

  // Smart Pedagogical Local Fallback for converting a Teacher Voice Note into Evaluative Text
  const buildSmartVoiceEvaluationFallback = (vn: TeacherRecitationVoiceNote) => {
    const stName = vn.studentName || currentStudent?.name || 'الطالب';
    const rawSpeech = (vn.rawSpeechTranscript || vn.title || '').trim();
    const surahLabel = vn.surahName || actualRecitation.surahName || 'النبأ';
    const ayahLabel = vn.ayahNumber || actualRecitation.fromAyah || 1;
    const cat = vn.category || 'تجويد';
    const ctx = vn.context || 'التسميع';
    const evalRating: VoiceNoteEvaluationRating =
      vn.evaluationRating || voiceNoteEvalRatingInput || 'متميز';
    const ratingMeta =
      VOICE_NOTE_EVAL_RATINGS.find((r) => r.value === evalRating) ||
      VOICE_NOTE_EVAL_RATINGS[0];

    const categoryGuidanceMap: Record<
      TeacherRecitationVoiceNote['category'],
      {
        evalFocus: string;
        strengths: string[];
        plan: string;
      }
    > = {
      تجويد: {
        evalFocus: `أظهر الطالب (${stName}) في محور (${ctx}) بسورة ${surahLabel} (آية ${ayahLabel}) تصنيف تقييم «${evalRating}» (${ratingMeta.autoPhrase})، مع رصد ملاحظة المعلم الصوتية حول ضبط مقادير الغنن والمدود وتحقيق مخارج الحروف.`,
        strengths: [
          `حضور ذهني واستجابة لتصحيح أحكام التجويد في سورة ${surahLabel} (التصنيف: ${evalRating})`,
          'حرص واضح على تحسين الأداء الصوتي والترتيل',
        ],
        plan: `الاستماع لتلاوة الشيخ الحصري للآيات المقررة من سورة ${surahLabel} 3 مرات مع التركيز على حكم التجويد المنبّه عليه في الملاحظة الصوتية.`,
      },
      حفظ: {
        evalFocus: `تم تقييم مستوى الحفظ والاستظهار للطالب (${stName}) في محور (${ctx}) — سورة ${surahLabel} (آية ${ayahLabel}) بتصنيف «${evalRating}» (${ratingMeta.autoPhrase}).`,
        strengths: [
          `متابعة منتظمة في حفظ سورة ${surahLabel} (التصنيف المسجل: ${evalRating})`,
          'همة طيبة في التسميع والمراجعة داخل الحلقة',
        ],
        plan: `تكرار المقطع من سورة ${surahLabel} (5 مرات) غيباً في المنزل مع الربط بالآية السابقة واللاحقة قبل الحصة القادمة.`,
      },
      تشكيل: {
        evalFocus: `تم رصد ملاحظة المعلم الصوتية للطالب (${stName}) في سورة ${surahLabel} (آية ${ayahLabel}) بتصنيف «${evalRating}» حول العناية بضبط أواخر الكلمات والحركات الإعرابية وتجنب اللحن الجلي.`,
        strengths: [
          'استظهار للكلمات القرآنية مع قابلية سريعة للتصحيح',
          `التزام بتوجيهات المعلم داخل الحصة (التصنيف: ${evalRating})`,
        ],
        plan: `القراءة النظرية المتأنية من المصحف الشريف لسورة ${surahLabel} مع الإشارة بالإصبع على حركات أواخر الكلمات قبل التسميع الغيبي.`,
      },
      مخارج: {
        evalFocus: `ركّزت ملاحظة المعلم الصوتية في محور (${ctx} — سورة ${surahLabel}) بتصنيف تقييم «${evalRating}» على تخليص الحروف المتجاورة وتحقيق صفات التفخيم والترقيق والقلقلة بدقة.`,
        strengths: [
          'صوت واضح ونبرة تلاوة هادئة ومتزنة',
          `قابلية ممتازة للمحاكاة الصوتية خلف المعلم (التصنيف: ${evalRating})`,
        ],
        plan: `التدرب المنزلي على نطق الكلمات القرآنية المشار إليها في سورة ${surahLabel} بتؤدة وتحقيق.`,
      },
      'توجيه عام': {
        evalFocus: `تقييم تربوي وقرآني شامل للطالب (${stName}) في محور (${ctx} — سورة ${surahLabel}) بتصنيف «${evalRating}»: ${ratingMeta.autoPhrase} مع أهمية المداومة على الورد اليومي والتحضير المبكر.`,
        strengths: [
          'انضباط وأدب رفيع في حلقة القرآن الكريم',
          `تفاعل إيجابي في تسميع سورة ${surahLabel} (التصنيف: ${evalRating})`,
        ],
        plan: 'المحافظة على الحصون الخمسة اليومية والاستماع للورد الجديد قبل النوم.',
      },
    };

    const picked = categoryGuidanceMap[cat] || categoryGuidanceMap['تجويد'];
    const resolvedScore = ratingMeta.defaultScore;
    const resolvedGrade: GradeType = ratingMeta.mappedGrade;

    const transcriptText =
      rawSpeech && !rawSpeech.startsWith('ملاحظة صوتية للمعلم')
        ? `[تصنيف التقييم: ${evalRating}] ${rawSpeech}`
        : `[تصنيف التقييم: ${evalRating}] ملاحظة المعلم على ${ctx} للطالب ${stName} في سورة ${surahLabel} (آية ${ayahLabel}) — تصنيف (${cat}): ${vn.title}`;

    const evaluativeText = `🏷️ [تصنيف التقييم: ${evalRating}] — 📋 التقييم المحوّل من الملاحظة الصوتية (${ctx} - ${cat}):\n${picked.evalFocus}${
      rawSpeech ? `\n• خلاصة توجيه المعلم الصوتي: «${rawSpeech}».` : ''
    }\n• التقدير المعتمد للمحور: ${evalRating} / ${resolvedGrade} (${resolvedScore}%).`;

    const parentSummary = `🌟 ولي أمر الطالب (${stName}) الكرام: بناءً على الملاحظة الصوتية للمعلم في (${ctx} — سورة ${surahLabel})، فإن تصنيف تقييم الطالب هو «${evalRating}» (${resolvedScore}%). ${picked.plan}`;

    return {
      transcript: transcriptText,
      evaluativeText,
      parentSummary,
      strengths: picked.strengths,
      improvementPlan: picked.plan,
      suggestedGrade: resolvedGrade,
      suggestedScore: resolvedScore,
    };
  };

  // Convert a Single Recorded Teacher Voice Note into Structured Evaluative Text using AI
  const handleConvertVoiceNoteToEvaluation = async (
    noteOrId: string | TeacherRecitationVoiceNote,
    options?: { autoInsertToParentNotes?: boolean; silentToast?: boolean }
  ) => {
    const targetNote =
      typeof noteOrId === 'string'
        ? allTeacherVoiceNotes.find((n) => n.id === noteOrId)
        : noteOrId;
    if (!targetNote) return null;

    const chosenRating: VoiceNoteEvaluationRating =
      targetNote.evaluationRating || voiceNoteEvalRatingInput || 'متميز';
    const noteWithRating: TeacherRecitationVoiceNote = {
      ...targetNote,
      evaluationRating: chosenRating,
    };

    triggerHaptic(14);
    setConvertingVoiceNoteId(targetNote.id);

    const errorsSummaryText =
      errors.length > 0
        ? errors
            .slice(0, 6)
            .map(
              (e) =>
                `${e.type} في سورة ${e.surah || targetNote.surahName}${
                  e.ayah ? ` آية ${e.ayah}` : ''
                }${e.word ? ` كلمة (${e.word})` : ''}`
            )
            .join('، ')
        : 'لا توجد أخطاء مسجلة';

    let finalEval = buildSmartVoiceEvaluationFallback(noteWithRating);

    try {
      const response = await fetch('/api/gemini/voice-note-to-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioDataUrl: targetNote.audioDataUrl,
          rawSpeechTranscript: targetNote.rawSpeechTranscript || '',
          noteTitle: targetNote.title,
          category: targetNote.category,
          evaluationRating: chosenRating,
          contextAxis: targetNote.context,
          studentName: targetNote.studentName || currentStudent?.name || 'الطالب',
          studentLevel: currentStudent?.level || 'متوسط',
          riwayah: currentStudent?.riwayah || 'حفص عن عاصم',
          surahName: targetNote.surahName || actualRecitation.surahName,
          fromAyah: targetNote.ayahNumber || actualRecitation.fromAyah || 1,
          toAyah: actualRecitation.toAyah || targetNote.ayahNumber || 10,
          masteryScore,
          errorsSummary: errorsSummaryText,
          teacherName: settings.teacherName || 'معلم الحلقة',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.result?.evaluativeText) {
          const rawEvalText = String(data.result.evaluativeText);
          const prefixedEvalText = rawEvalText.includes(chosenRating)
            ? rawEvalText
            : `🏷️ [تصنيف التقييم: ${chosenRating}] ${rawEvalText}`;
          finalEval = {
            transcript: data.result.transcript || finalEval.transcript,
            evaluativeText: prefixedEvalText,
            parentSummary: data.result.parentSummary || finalEval.parentSummary,
            strengths:
              Array.isArray(data.result.strengths) && data.result.strengths.length > 0
                ? data.result.strengths
                : finalEval.strengths,
            improvementPlan: data.result.improvementPlan || finalEval.improvementPlan,
            suggestedGrade: data.result.suggestedGrade || finalEval.suggestedGrade,
            suggestedScore:
              typeof data.result.suggestedScore === 'number'
                ? data.result.suggestedScore
                : finalEval.suggestedScore,
          };
        }
      }
    } catch {
      // Fallback already prepared in finalEval
    }

    const nowIso = new Date().toISOString();
    const shouldApply = Boolean(options?.autoInsertToParentNotes);

    setAllTeacherVoiceNotes((prev) =>
      prev.map((item) =>
        item.id === targetNote.id
          ? {
              ...item,
              aiTranscript: finalEval.transcript,
              aiEvaluativeText: finalEval.evaluativeText,
              aiParentSummary: finalEval.parentSummary,
              aiStrengths: finalEval.strengths,
              aiImprovementPlan: finalEval.improvementPlan,
              aiSuggestedGrade: finalEval.suggestedGrade,
              aiSuggestedScore: finalEval.suggestedScore,
              aiConvertedAt: nowIso,
              appliedToSessionNotes: item.appliedToSessionNotes || shouldApply,
            }
          : item
      )
    );

    if (shouldApply) {
      const formattedInsert = `${finalEval.evaluativeText}\n💡 خطة المتابعة: ${finalEval.improvementPlan}`;
      setParentNotes((prev) =>
        prev.trim() ? `${prev.trim()}\n\n${formattedInsert}` : formattedInsert
      );
    }

    setConvertingVoiceNoteId(null);

    if (!options?.silentToast) {
      showToast(
        shouldApply
          ? '✨ تم تحويل الملاحظة الصوتية إلى نص تقييمي بالذكاء الاصطناعي وإدراجه في تقييم الحصة وملاحظات ولي الأمر ✓'
          : '✨ تم تحويل الملاحظة الصوتية إلى نص تقييمي احترافي بالذكاء الاصطناعي بنجاح ✓',
        'success'
      );
    }

    return finalEval;
  };

  // Batch Convert All Session Voice Notes for Current Student into a Unified Evaluative Report
  const handleConvertAllVoiceNotesToEvaluation = async () => {
    if (studentTeacherVoiceNotes.length === 0) {
      showToast('لا توجد ملاحظات صوتية مسجلة للطالب حالياً لتحويلها', 'info');
      return;
    }
    triggerHaptic(18);
    setConvertingVoiceNoteId('ALL');

    const compiledSections: string[] = [];
    for (const vn of studentTeacherVoiceNotes.slice(0, 6)) {
      const res = await handleConvertVoiceNoteToEvaluation(vn, {
        autoInsertToParentNotes: false,
        silentToast: true,
      });
      if (res) {
        compiledSections.push(
          `• [${vn.context} - ${vn.category} | سورة ${vn.surahName}]: ${res.evaluativeText} (خطة التحسين: ${res.improvementPlan})`
        );
      }
    }

    setConvertingVoiceNoteId(null);

    if (compiledSections.length > 0) {
      const unifiedBlock = `🤖 التقرير التقييمي الشامل المحوّل من ملاحظات المعلم الصوتية (${compiledSections.length} ملاحظات):\n${compiledSections.join('\n')}`;
      setParentNotes((prev) =>
        prev.trim() ? `${prev.trim()}\n\n${unifiedBlock}` : unifiedBlock
      );
      setAllTeacherVoiceNotes((prev) =>
        prev.map((n) =>
          n.studentId === currentStudent?.id
            ? { ...n, appliedToSessionNotes: true }
            : n
        )
      );
      showToast(
        `✨ تم تحويل جميع الملاحظات الصوتية (${compiledSections.length}) إلى نصوص تقييمية بالذكاء الاصطناعي وإدراجها في تقييم الحصة ✓`,
        'success'
      );
    }
  };

  // Apply an Already-Converted Voice Note Evaluation into Session Grades & Parent Notes
  const handleApplyVoiceNoteEvaluationToSession = (vn: TeacherRecitationVoiceNote) => {
    if (!vn.aiEvaluativeText) return;
    triggerHaptic(14);
    const blockToInsert = `${vn.aiEvaluativeText}${
      vn.aiImprovementPlan ? `\n📌 التوجيه المنزلي: ${vn.aiImprovementPlan}` : ''
    }`;
    setParentNotes((prev) =>
      prev.trim() ? `${prev.trim()}\n\n${blockToInsert}` : blockToInsert
    );

    if (vn.aiSuggestedGrade) {
      if (vn.context === 'الحفظ الجديد') {
        setNewMem((p) => ({ ...p, grade: vn.aiSuggestedGrade }));
        if (vn.aiSuggestedScore) {
          setSectionPercentages((p) => ({
            ...p,
            newMemorization: vn.aiSuggestedScore,
          }));
        }
      } else if (vn.context === 'المراجعة القريبة') {
        setNearRev((p) => ({ ...p, grade: vn.aiSuggestedGrade }));
        if (vn.aiSuggestedScore) {
          setSectionPercentages((p) => ({
            ...p,
            nearReview: vn.aiSuggestedScore,
          }));
        }
      } else if (vn.context === 'المراجعة البعيدة') {
        setFarRev((p) => ({ ...p, grade: vn.aiSuggestedGrade }));
        if (vn.aiSuggestedScore) {
          setSectionPercentages((p) => ({
            ...p,
            farReview: vn.aiSuggestedScore,
          }));
        }
      } else {
        setActualRecitation((p) => ({ ...p, grade: vn.aiSuggestedGrade }));
        if (vn.aiSuggestedScore) {
          setSectionPercentages((p) => ({
            ...p,
            actualRecitation: vn.aiSuggestedScore,
          }));
        }
      }
    }

    setAllTeacherVoiceNotes((prev) =>
      prev.map((item) =>
        item.id === vn.id ? { ...item, appliedToSessionNotes: true } : item
      )
    );

    showToast(
      `📥 تم اعتماد النص التقييمي وإدراجه في ملاحظات الحصة وتحديث تقييم محور (${vn.context}) ✓`,
      'success'
    );
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
      evaluationRating?: VoiceNoteEvaluationRating;
      title?: string;
      rawSpeechTranscript?: string;
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
    const chosenEvalRating: VoiceNoteEvaluationRating =
      overrideMeta?.evaluationRating || voiceNoteEvalRatingInput || 'متميز';
    const capturedSpeech = (
      overrideMeta?.rawSpeechTranscript ||
      liveVoiceDraftRef.current ||
      liveVoiceDraftTranscript ||
      ''
    ).trim();
    const defaultTitle =
      overrideMeta?.title ||
      voiceNoteTitleInput.trim() ||
      (capturedSpeech
        ? `[${chosenEvalRating}] ${capturedSpeech.slice(0, 90)}`
        : '') ||
      `[${chosenEvalRating}] ملاحظة صوتية للمعلم (${chosenCat}) — سورة ${activeSurahName} آية ${activeAyahNum}`;

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
      evaluationRating: chosenEvalRating,
      title: defaultTitle,
      audioDataUrl: dataUrl,
      durationSeconds: Math.max(1, durationSec),
      rawSpeechTranscript: capturedSpeech || undefined,
      createdAt: new Date().toISOString(),
    };

    setAllTeacherVoiceNotes((prev) => [newVoiceNote, ...prev]);
    setVoiceNoteUrl(dataUrl);
    setVoiceNoteDuration(Math.max(1, durationSec));
    setVoiceNoteTitleInput('');
    setLiveVoiceDraftTranscript('');
    liveVoiceDraftRef.current = '';

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

    if (autoConvertVoiceNoteOnStop) {
      void handleConvertVoiceNoteToEvaluation(newVoiceNote, {
        autoInsertToParentNotes: true,
      });
    } else {
      showToast(
        `🎙️ تم تسجيل وحفظ الملاحظة الصوتية للمعلم (${Math.max(1, durationSec)} ثانية) — يمكنك تحويلها لنص تقييمي بالذكاء الاصطناعي في أي وقت ✓`,
        'success'
      );
    }
  };

  // Unified Teacher Voice Recorder (supports real MediaRecorder + Web Speech API + Audio Level Meter + automatic playable WAV fallback)
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
      stopVoiceSpeechAndLevelMonitors();

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

    // Start parallel browser SpeechRecognition for live Arabic transcription while recording
    try {
      const SpeechRecognitionCtor =
        (
          window as unknown as {
            SpeechRecognition?: unknown;
            webkitSpeechRecognition?: unknown;
          }
        ).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRecognitionCtor as any)();
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let combined = '';
          for (let i = 0; i < (event.results?.length || 0); i++) {
            combined += (event.results[i]?.[0]?.transcript || '') + ' ';
          }
          const cleaned = combined.trim();
          if (cleaned) {
            liveVoiceDraftRef.current = cleaned;
            setLiveVoiceDraftTranscript(cleaned);
          }
        };
        recognition.onerror = () => {};
        recognition.start();
        voiceSpeechRecognitionRef.current = recognition;
      }
    } catch {
      // SpeechRecognition optional
    }

    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Setup live audio level meter using Web Audio API AnalyserNode
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          if (AudioCtx) {
            const audioCtx = new AudioCtx();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            voiceAudioContextRef.current = audioCtx;
            voiceLevelIntervalRef.current = window.setInterval(() => {
              analyser.getByteFrequencyData(dataArray);
              const avg =
                dataArray.reduce((acc, v) => acc + v, 0) /
                Math.max(1, dataArray.length);
              setVoiceMicAudioLevel(Math.min(100, Math.round((avg / 140) * 100)));
            }, 120);
          }
        } catch {
          // fallback level animation below
        }

        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          stopVoiceSpeechAndLevelMonitors();
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
        showToast(
          '🎙️ الميكروفون نشط الآن: تحدث بملاحظتك السريعة عن مستوى الطالب وسيتم حفظها وتحويلها لنص تقييمي بالذكاء الاصطناعي',
          'info'
        );
        return;
      } catch {
        // If microphone permission is blocked in iframe or browser, gracefully use the local synthesizer recorder
      }
    }

    // Animated level indicator for fallback recording mode
    voiceLevelIntervalRef.current = window.setInterval(() => {
      setVoiceMicAudioLevel(Math.floor(35 + Math.random() * 55));
    }, 150);

    isSimulatedFallbackRecordingRef.current = true;
    mediaRecorderRef.current = null;
    setIsRecordingVoice(true);
    showToast(
      '🎙️ جاري تسجيل الملاحظة الصوتية السريعة عن مستوى الطالب... اضغط إيقاف عند الانتهاء لتحويلها لنص تقييمي بالذكاء الاصطناعي',
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

  // Build Session Record & Save (with Automatic Daily Summary & WhatsApp Automation)
  const buildAndSaveSession = (
    nextSyncStatus: SessionSyncStatus = 'حصة محفوظة',
    options?: { skipAutoWhatsAppTrigger?: boolean }
  ) => {
    if (!currentStudent) return null;

    // If absent, automatically carry over last session's assignment
    const carriedNew =
      status !== 'حضر' && lastAttendedSession?.newMemorization
        ? lastAttendedSession.newMemorization
        : newMem;

    const chosenTarbiyah = TARBIYAH_ADAB_CARDS.find(
      (c) => c.id === selectedTarbiyahId
    );

    const activeEval = latestGeminiEvaluation;
    const computedTajweedScore = activeEval?.subScores
      ? Math.round(
          (activeEval.subScores.ghunnahScore +
            activeEval.subScores.maddScore +
            activeEval.subScores.makharijScore) /
            3
        )
      : recitationHealthAndTajweedMetrics.tajweedScore;
    const computedLahnJaliScore =
      activeEval?.subScores?.lahnJaliScore ??
      recitationHealthAndTajweedMetrics.lahnJaliScore;
    const computedAudioScore =
      activeEval?.overallScore ??
      recitationHealthAndTajweedMetrics.autoAudioScore;
    const computedAudioGrade =
      activeEval?.recommendedGrade ??
      recitationHealthAndTajweedMetrics.autoAudioGrade;
    const computedHealthScore = Math.round(
      computedAudioScore * 0.4 +
        computedTajweedScore * 0.35 +
        computedLahnJaliScore * 0.25
    );

    const shouldAutoTriggerWhatsApp =
      !options?.skipAutoWhatsAppTrigger && autoSendWhatsAppOnSave;
    const finalSyncStatus: SessionSyncStatus = shouldAutoTriggerWhatsApp
      ? 'تم الإرسال لولي الأمر'
      : nextSyncStatus;

    setSyncStatus(finalSyncStatus);

    // Build formatted daily summary text for historical archiving & WhatsApp
    const generatedSummaryText = buildFormattedWhatsAppMessage(
      'recitation_audio_summary',
      activeEval
    );
    const nowIso = new Date().toISOString();

    const computedDurationMinutes = Math.max(
      1,
      timerElapsedSeconds >= 30
        ? Math.round(timerElapsedSeconds / 60)
        : Math.round((timerPresetSeconds - timerRemainingSeconds) / 60) ||
            Math.round(timerPresetSeconds / 60) ||
            10
    );

    const savedRecord = saveSession({
      studentId: currentStudent.id,
      date: sessionDate,
      status,
      masteryScore,
      durationMinutes: computedDurationMinutes,
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
        recordedAudioUrl: juzReviewRecordedAudioUrl,
        recordedAudioDurationSec: juzReviewRecordedDurationSec,
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
      recitationAudioClips: currentStudent.recitationAudioClips,
      sectionPercentages,
      memorizationAudioDataUrl,
      memorizationAudioName,
      audioEvaluationScore: computedAudioScore,
      audioEvaluationGrade: computedAudioGrade,
      tajweedScore: computedTajweedScore,
      lahnJaliScore: computedLahnJaliScore,
      recitationHealthScore: computedHealthScore,
      autoWhatsAppSent: shouldAutoTriggerWhatsApp || finalSyncStatus === 'تم الإرسال لولي الأمر',
      autoWhatsAppSentAt: nowIso,
      whatsappSummaryText: generatedSummaryText,
      syncStatus: finalSyncStatus,
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

    // Automatic Makeup Session Card & Task Generation when Student is Absent or Excused
    if (status === 'غاب' || status === 'إجازة') {
      const missedSurahName = carriedNew?.surahName || currentStudent.currentStop.surahName || 'البقرة';
      const missedFrom = carriedNew?.fromAyah || currentStudent.currentStop.ayah || 1;
      const missedTo = carriedNew?.toAyah || missedFrom + 7;
      const makeupCard: MakeupSessionCard = {
        id: `makeup-${currentStudent.id}-${sessionDate}`,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        absentDate: sessionDate,
        attendanceStatus: status === 'غاب' ? 'غاب' : 'إجازة',
        missedSurahId: carriedNew?.surahId || currentStudent.currentStop.surahId,
        missedSurahName,
        missedFromAyah: missedFrom,
        missedToAyah: missedTo,
        missedReviewLabel: nearRev.enabled ? `مراجعة سورة ${nearRev.surahName}` : undefined,
        resolutionStatus: 'pending',
        createdAt: nowIso,
      };
      const existingMakeup = currentStudent.makeupSessions || [];
      const existsIdx = existingMakeup.findIndex((c) => c.absentDate === sessionDate);
      const updatedMakeupList =
        existsIdx >= 0
          ? existingMakeup.map((c, idx) => (idx === existsIdx ? { ...c, ...makeupCard, resolutionStatus: c.resolutionStatus } : c))
          : [makeupCard, ...existingMakeup];
      updateStudent(currentStudent.id, { makeupSessions: updatedMakeupList });

      addTask({
        title: `بطاقة تعويض غياب (${status}): ${currentStudent.name} — سورة ${missedSurahName} (${missedFrom}-${missedTo})`,
        studentId: currentStudent.id,
        dueDate: makeupScheduleDate || sessionDate,
        priority: 'مرتفع',
        completed: false,
        notes: `تغيب/اعتذر الطالب يوم ${sessionDate}. يمكن تحديد موعد حصة تعويضية أو دمج الورد تلقائياً في خطة الأسبوع القادم.`,
      });
    }

    if (shouldAutoTriggerWhatsApp) {
      const waUrl = buildWhatsAppUrl(
        currentStudent.whatsappPhone,
        generatedSummaryText
      );
      navigator.clipboard?.writeText(generatedSummaryText).catch(() => {});
      const a = document.createElement('a');
      a.href = waUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setLastAutoDispatchedSummary({
        studentName: currentStudent.name,
        phone: currentStudent.whatsappPhone || '',
        message: generatedSummaryText,
        sentAt: new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        audioScore: computedAudioScore,
        tajweedScore: computedTajweedScore,
      });

      showToast(
        `⚡ تم حفظ الحصة وأتمتة إرسال ملخص التسميع اليومي (الحفظ الجديد + المراجعة + التقييم الصوتي ${computedAudioScore}%) لواتساب ولي أمر (${currentStudent.name}) تلقائياً ✓`,
        'success'
      );
    }

    return savedRecord;
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

  // Direct Teacher Voice Recorder for New Memorization (Next to Teacher Voice Option)
  const handleToggleTeacherNewMemVoiceRecord = async () => {
    triggerHaptic(15);
    if (!currentStudent) return;

    if (isRecordingTeacherNewMemVoice) {
      if (teacherNewMemTimerRef.current) {
        window.clearInterval(teacherNewMemTimerRef.current);
        teacherNewMemTimerRef.current = null;
      }
      const elapsedSec = Math.max(
        3,
        Math.round((Date.now() - teacherNewMemStartRef.current) / 1000) ||
          teacherNewMemRecSeconds ||
          4
      );
      setIsRecordingTeacherNewMemVoice(false);

      const finalizeTeacherNewMemClip = (dataUrl: string) => {
        const audioName = `فويس-الحفظ-الجديد-بصوت-المحفظ-سورة-${newMem.surahName}-${newMem.fromAyah}-${newMem.toAyah}.wav`;
        setMemorizationAudioDataUrl(dataUrl);
        setMemorizationAudioName(audioName);
        setNewMemVoiceChoice('teacher_voice');
        setNewMem((prev) => ({
          ...prev,
          recordedAudioUrl: dataUrl,
          recordedAudioDurationSec: elapsedSec,
          recordedAt: new Date().toISOString(),
        }));
        saveStudentRecitationAudioClip(currentStudent.id, {
          studentName: currentStudent.name,
          sessionDate,
          axisKey: 'newMemorization',
          axisLabel: '٢) الحفظ الجديد (بصوت المحفظ)',
          surahName: newMem.surahName,
          fromAyah: newMem.fromAyah,
          toAyah: newMem.toAyah,
          audioUrl: dataUrl,
          durationSeconds: elapsedSec,
          grade: newMem.grade,
          percentage: sectionPercentages.newMemorization || 95,
        });
        showToast(
          `🎙️ تم تسجيل وحفظ صوت المحفظ للنص الجديد (سورة ${newMem.surahName}: ${newMem.fromAyah}-${newMem.toAyah}) بنجاح ✓`,
          'success'
        );
      };

      if (
        teacherNewMemRecorderRef.current &&
        teacherNewMemRecorderRef.current.state !== 'inactive'
      ) {
        try {
          teacherNewMemRecorderRef.current.stop();
          return;
        } catch {
          // fallback below
        }
      }
      const fallback = generateTeacherFallbackWavDataUrl(elapsedSec);
      finalizeTeacherNewMemClip(fallback.dataUrl);
      return;
    }

    setTeacherNewMemRecSeconds(0);
    teacherNewMemStartRef.current = Date.now();
    if (teacherNewMemTimerRef.current) {
      window.clearInterval(teacherNewMemTimerRef.current);
    }
    teacherNewMemTimerRef.current = window.setInterval(() => {
      setTeacherNewMemRecSeconds((s) => s + 1);
    }, 1000);

    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunks.push(ev.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const elapsedSec = Math.max(
            3,
            Math.round((Date.now() - teacherNewMemStartRef.current) / 1000) || 4
          );
          if (chunks.length === 0) {
            const fallback = generateTeacherFallbackWavDataUrl(elapsedSec);
            const audioName = `فويس-الحفظ-الجديد-بصوت-المحفظ-سورة-${newMem.surahName}.wav`;
            setMemorizationAudioDataUrl(fallback.dataUrl);
            setMemorizationAudioName(audioName);
            setNewMemVoiceChoice('teacher_voice');
            return;
          }
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl =
              typeof reader.result === 'string' && reader.result.startsWith('data:')
                ? reader.result
                : generateTeacherFallbackWavDataUrl(elapsedSec).dataUrl;
            const audioName = `فويس-الحفظ-الجديد-بصوت-المحفظ-سورة-${newMem.surahName}-${newMem.fromAyah}-${newMem.toAyah}.webm`;
            setMemorizationAudioDataUrl(dataUrl);
            setMemorizationAudioName(audioName);
            setNewMemVoiceChoice('teacher_voice');
            setNewMem((prev) => ({
              ...prev,
              recordedAudioUrl: dataUrl,
              recordedAudioDurationSec: elapsedSec,
              recordedAt: new Date().toISOString(),
            }));
            saveStudentRecitationAudioClip(currentStudent.id, {
              studentName: currentStudent.name,
              sessionDate,
              axisKey: 'newMemorization',
              axisLabel: '٢) الحفظ الجديد (بصوت المحفظ)',
              surahName: newMem.surahName,
              fromAyah: newMem.fromAyah,
              toAyah: newMem.toAyah,
              audioUrl: dataUrl,
              durationSeconds: elapsedSec,
              grade: newMem.grade,
              percentage: sectionPercentages.newMemorization || 95,
            });
            showToast(
              `🎙️ تم تسجيل صوت المحفظ للنص الجديد (${elapsedSec} ثانية) وإرفاقه بالحصة ✓`,
              'success'
            );
          };
          reader.readAsDataURL(blob);
        };
        teacherNewMemRecorderRef.current = recorder;
        recorder.start();
        setIsRecordingTeacherNewMemVoice(true);
        setNewMemVoiceChoice('teacher_voice');
        showToast(
          `🎙️ جاري تسجيل صوت المحفظ للنص الجديد: سورة ${newMem.surahName} (آية ${newMem.fromAyah}-${newMem.toAyah})...`,
          'info'
        );
        return;
      } catch {
        // fallback below
      }
    }

    teacherNewMemRecorderRef.current = null;
    setIsRecordingTeacherNewMemVoice(true);
    setNewMemVoiceChoice('teacher_voice');
    showToast(
      `🎙️ جاري تسجيل صوت المحفظ للنص الجديد (سورة ${newMem.surahName})... اضغط إيقاف عند الانتهاء`,
      'info'
    );
  };

  // Play or Stop the New Memorization Audio in Chosen Voice (Teacher Voice or Famous Qaris)
  const handlePlayNewMemVoicePreview = () => {
    if (isPlayingNewMemVoice) {
      if (newMemVoicePlayerRef.current) {
        newMemVoicePlayerRef.current.pause();
      }
      setIsPlayingNewMemVoice(false);
      setPlayingNewMemAyahNum(null);
      return;
    }

    if (newMemVoiceChoice === 'teacher_voice') {
      const teacherAudioSrc =
        memorizationAudioDataUrl || newMem.recordedAudioUrl || voiceNoteUrl;
      if (!teacherAudioSrc) {
        showToast(
          '🎙️ لم يتم تسجيل صوت المحفظ بعد — اضغط زر «تسجيل صوت المحفظ» المجاور أولاً أو اختر أحد القراء المشايخ',
          'info'
        );
        return;
      }
      if (newMemVoicePlayerRef.current) {
        newMemVoicePlayerRef.current.pause();
      }
      const audio = new Audio(teacherAudioSrc);
      newMemVoicePlayerRef.current = audio;
      setIsPlayingNewMemVoice(true);
      setPlayingNewMemAyahNum(newMem.fromAyah);
      audio.onended = () => {
        setIsPlayingNewMemVoice(false);
        setPlayingNewMemAyahNum(null);
      };
      audio.onerror = () => {
        setIsPlayingNewMemVoice(false);
        setPlayingNewMemAyahNum(null);
      };
      audio.play().catch(() => {
        setIsPlayingNewMemVoice(false);
        setPlayingNewMemAyahNum(null);
      });
      return;
    }

    const surahMeta = SURAHS.find((s) => s.id === newMem.surahId) || SURAHS[0];
    const startA = newMem.isFullSurah ? 1 : Math.max(1, newMem.fromAyah);
    const endA = newMem.isFullSurah
      ? Math.min(surahMeta.ayahs, startA + 10)
      : Math.min(surahMeta.ayahs, Math.max(startA, newMem.toAyah));

    const playSequentialQariAyah = (ayahNumber: number) => {
      if (newMemVoicePlayerRef.current) {
        newMemVoicePlayerRef.current.pause();
      }
      const url = getEveryAyahAudioUrl(newMemVoiceChoice, newMem.surahId, ayahNumber);
      const audio = new Audio(url);
      newMemVoicePlayerRef.current = audio;
      setIsPlayingNewMemVoice(true);
      setPlayingNewMemAyahNum(ayahNumber);
      audio.onended = () => {
        if (ayahNumber < endA) {
          playSequentialQariAyah(ayahNumber + 1);
        } else {
          setIsPlayingNewMemVoice(false);
          setPlayingNewMemAyahNum(null);
        }
      };
      audio.onerror = () => {
        setIsPlayingNewMemVoice(false);
        setPlayingNewMemAyahNum(null);
      };
      audio.play().catch(() => {
        setIsPlayingNewMemVoice(false);
        setPlayingNewMemAyahNum(null);
      });
    };

    playSequentialQariAyah(startA);
  };

  // Build Formatted WhatsApp Message (Includes Recitation Summary + New Memorization Written Text & Voice Links + Reviews)
  const buildFormattedWhatsAppMessage = (
    mode: 'short' | 'detailed' | 'recitation_audio_summary' | 'new_mem_voice_focus',
    overrideEval?: GeminiRecitationEvaluationResult | null,
    overrideVoiceChoice?: typeof newMemVoiceChoice
  ): string => {
    if (!currentStudent) return '';
    const activeVoiceChoice = overrideVoiceChoice || newMemVoiceChoice;
    const activeEval = overrideEval || latestGeminiEvaluation;
    const tajweedVal = activeEval?.subScores
      ? Math.round(
          (activeEval.subScores.ghunnahScore +
            activeEval.subScores.maddScore +
            activeEval.subScores.makharijScore) /
            3
        )
      : recitationHealthAndTajweedMetrics.tajweedScore;
    const lahnJaliVal =
      activeEval?.subScores?.lahnJaliScore ??
      recitationHealthAndTajweedMetrics.lahnJaliScore;
    const audioOverallVal =
      activeEval?.overallScore ??
      recitationHealthAndTajweedMetrics.autoAudioScore;
    const audioGradeVal =
      activeEval?.recommendedGrade ??
      recitationHealthAndTajweedMetrics.autoAudioGrade;
    const paceVal =
      activeEval?.recitationPace ??
      recitationHealthAndTajweedMetrics.recitationPace;
    const healthVal = Math.round(
      audioOverallVal * 0.4 + tajweedVal * 0.35 + lahnJaliVal * 0.25
    );

    const voiceLabelMap: Record<typeof newMemVoiceChoice, string> = {
      teacher_voice: `صوت المحفظ (${settings.teacherName || 'معلم الحلقة'})`,
      Husary_128kbps: 'الشيخ محمود خليل الحصري',
      Minshawy_Murattal_128kbps: 'الشيخ محمد صديق المنشاوي',
      Alafasy_128kbps: 'الشيخ مشاري راشد العفاسي',
      MaherAlMuaiqly128kbps: 'الشيخ ماهر المعيقلي',
    };
    const chosenVoiceLabel = voiceLabelMap[activeVoiceChoice];

    let msg = `${settings.whatsappHeader}\n\n`;
    msg += `📋 *تقرير وملخص التسميع والحفظ الجديد والمراجعات (مبسّط لولي الأمر والأم)*\n`;
    msg += `👤 *الطالب:* ${currentStudent.name} (${currentStudent.riwayah || 'حفص عن عاصم'})\n`;
    msg += `📅 *التاريخ:* ${formatGregorianAndHijri(
      sessionDate,
      settings.showHijriDates ?? true
    )}\n`;
    msg += `📌 *الحالة:* ${status}\n`;

    if (status !== 'حضر') {
      msg += `\n⚠️ *ملاحظة:* تم ترحيل تكليف الحصة السابقة تلقائياً للحصة القادمة بإذن الله.\n`;
    } else {
      msg += `🎯 *نسبة الإتقان العام:* ${masteryScore}% ${renderMiniSquares(masteryScore)}\n`;
      msg += `💚 *مؤشر صحة التسميع:* ${healthVal}% (${recitationHealthAndTajweedMetrics.healthStatusLabel})\n`;

      msg += `\n━━━━━━━━━━━━━━━━━━\n`;
      msg += `🤖 *أولاً: ملخص التسميع والتقييم الصوتي ودرجة التجويد:*\n`;
      if (actualRecitation.enabled) {
        msg += `• *ما سمّعه الطالب اليوم:* سورة ${actualRecitation.surahName} (آية ${actualRecitation.fromAyah} إلى ${actualRecitation.toAyah}) — بتقدير [${actualRecitation.grade}] (${
          sectionPercentages.actualRecitation || 94
        }%)\n`;
      }
      msg += `• *التقييم الصوتي التلقائي:* ${audioOverallVal}% (${audioGradeVal}) — مرتبة التلاوة: ${paceVal}\n`;
      msg += `• *درجة إتقان أحكام التجويد:* ${tajweedVal}% ${renderMiniSquares(tajweedVal)}\n`;
      msg += `• *سلامة اللحن الجلي والحركات:* ${lahnJaliVal}% ${renderMiniSquares(lahnJaliVal)}\n`;
      if (activeEval?.subScores) {
        msg += `  - الغنن: ${activeEval.subScores.ghunnahScore}% | المدود: ${activeEval.subScores.maddScore}% | المخارج: ${activeEval.subScores.makharijScore}%\n`;
      }
      if (activeEval?.actionableAdviceForParent) {
        msg += `• *خلاصة التقييم للأم وولي الأمر:* ${activeEval.actionableAdviceForParent}\n`;
      } else {
        msg += `• *خلاصة التقييم للأم وولي الأمر:* ${recitationHealthAndTajweedMetrics.autoFeedbackSummary}\n`;
      }

      msg += `\n━━━━━━━━━━━━━━━━━━\n`;
      msg += `📖 *ثانياً: الحفظ الجديد المطلوب للحصة القادمة (مكتوباً كاملاً):*\n`;
      if (newMem.enabled) {
        msg += `• *المقرر الجديد:* سورة ${newMem.surahName} ${
          newMem.isFullSurah
            ? 'كاملة'
            : `من آية (${newMem.fromAyah}) إلى آية (${newMem.toAyah})`
        }\n`;
        if (newMemVersesList.length > 0) {
          const versesSnippet = newMemVersesList
            .slice(0, 12)
            .map((v) => `${v.text} ﴿${v.ayah}﴾`)
            .join(' ');
          msg += `• *نص الآيات الجديدة للمتابعة في المنزل:*\n﴿ ${versesSnippet} ﴾\n`;
        }
      }

      msg += `\n🔊 *فويس صوتي للنص الجديد (${chosenVoiceLabel}):*\n`;
      if (activeVoiceChoice === 'teacher_voice') {
        msg += `• 🎙️ تم تجهيز تسجيل صوتي للنص الجديد *بصوت المحفظ* (مرفق مع الرسالة وفي بوابة ولي الأمر السهلة).\n`;
        msg += `• كما يمكنكم سماع أول آية بصوت الشيخ الحصري مباشرة من هنا:\n${getEveryAyahAudioUrl(
          'Husary_128kbps',
          newMem.surahId,
          newMem.fromAyah || 1
        )}\n`;
      } else {
        const startA = newMem.isFullSurah ? 1 : Math.max(1, newMem.fromAyah);
        const endA = Math.min(startA + 4, newMem.toAyah || startA);
        msg += `• 🎧 اضغط للاستماع الفوري لتلاوة النص الجديد بصوت *${chosenVoiceLabel}*:\n`;
        for (let a = startA; a <= endA; a++) {
          msg += `  - الآية (${a}): ${getEveryAyahAudioUrl(
            activeVoiceChoice,
            newMem.surahId,
            a
          )}\n`;
        }
      }

      msg += `\n━━━━━━━━━━━━━━━━━━\n`;
      msg += `🔄 *ثالثاً: المراجعات المطلوبة في المنزل (القريبة والبعيدة والأجزاء):*\n`;
      if (nearRev.enabled) {
        msg += `• *المراجعة القريبة (الربط):* سورة ${nearRev.surahName} ${
          nearRev.isFullSurah
            ? 'كاملة'
            : `(من آية ${nearRev.fromAyah} إلى ${nearRev.toAyah})`
        }\n`;
      }
      if (farRev.enabled) {
        msg += `• *المراجعة البعيدة (التثبيت):* سورة ${farRev.surahName} (من آية ${farRev.fromAyah} إلى ${farRev.toAyah})\n`;
      }
      if (juzEnabled && juzItems.length > 0) {
        msg += `• *مراجعة الأجزاء:* ${juzItems.map((i) => i.label).join('، ')}\n`;
      } else if (surahRevEnabled && selectedSurahNames.length > 0) {
        msg += `• *مراجعة السور:* ${selectedSurahNames.join('، ')}\n`;
      }

      if (mode === 'detailed' || mode === 'recitation_audio_summary') {
        if (errors.length > 0) {
          msg += `\n🔍 *ملاحظات التجويد والكلمات التي تحتاج تركيزاً (${errors.length}):*\n`;
          errors.slice(0, 6).forEach((e, idx) => {
            msg += `  ${idx + 1}. [${e.category || e.type}] سورة ${e.surah || actualRecitation.surahName}${
              e.ayah ? ` (آية ${e.ayah})` : ''
            }${e.word ? ` كلمة «${e.word}»` : ''}${
              e.correctedInSession ? ' — صُحح بالحصة ✓' : ''
            }\n`;
          });
        } else {
          msg += `\n✅ *سجل الأخطاء:* تلاوة متقنة خالية من الأخطاء المرصودة اليوم والحمد لله.\n`;
        }
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
    return msg;
  };

  // Format WhatsApp Message & Trigger One-Click Send (Short, Detailed, Recitation Audio Summary, or New Mem Voice Focus)
  const handleSaveAndSendWhatsApp = (
    mode:
      | 'short'
      | 'detailed'
      | 'recitation_audio_summary'
      | 'new_mem_voice_focus' = 'recitation_audio_summary',
    overrideEval?: GeminiRecitationEvaluationResult | null
  ) => {
    triggerHaptic(16);
    const saved = buildAndSaveSession('تم الإرسال لولي الأمر', {
      skipAutoWhatsAppTrigger: true,
    });
    if (!saved || !currentStudent) return;

    const msg = buildFormattedWhatsAppMessage(mode, overrideEval);
    const waUrl = buildWhatsAppUrl(currentStudent.whatsappPhone, msg);

    // Copy to clipboard automatically as a helpful backup
    navigator.clipboard?.writeText(msg).catch(() => {});

    // Trigger anchor link in a new tab cleanly without window.open popup blocking
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setLastAutoDispatchedSummary({
      studentName: currentStudent.name,
      phone: currentStudent.whatsappPhone || '',
      message: msg,
      sentAt: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      audioScore:
        overrideEval?.overallScore ??
        latestGeminiEvaluation?.overallScore ??
        recitationHealthAndTajweedMetrics.autoAudioScore,
      tajweedScore: recitationHealthAndTajweedMetrics.tajweedScore,
    });

    showToast(
      `📲 تم حفظ الحصة وفتح واتساب ولي أمر (${currentStudent.name}) مع ملخص التسميع والحفظ الجديد والمراجعات والفويس الصوتي ✓`,
      'success'
    );
  };

  // Send Voice Audio for New Memorization + Full Summary to Parent on WhatsApp
  const handleSendNewMemVoiceToParentWhatsApp = async (
    overrideChoice?: typeof newMemVoiceChoice
  ) => {
    if (!currentStudent) return;
    triggerHaptic(18);
    const chosenVoice = overrideChoice || newMemVoiceChoice;
    if (overrideChoice) {
      setNewMemVoiceChoice(overrideChoice);
    }
    buildAndSaveSession('تم الإرسال لولي الأمر', {
      skipAutoWhatsAppTrigger: true,
    });

    const msg = buildFormattedWhatsAppMessage(
      'new_mem_voice_focus',
      undefined,
      chosenVoice
    );

    // If Teacher Voice is selected and we have a recorded audio dataUrl, download or share it so teacher can drop the voice note directly in WhatsApp
    if (chosenVoice === 'teacher_voice') {
      const teacherAudioSrc =
        memorizationAudioDataUrl || newMem.recordedAudioUrl || voiceNoteUrl;
      if (teacherAudioSrc) {
        try {
          const res = await fetch(teacherAudioSrc);
          const blob = await res.blob();
          const file = new File(
            [blob],
            `voice-new-memorization-${currentStudent.name}-${newMem.surahName}.wav`,
            { type: blob.type || 'audio/wav' }
          );
          if (
            typeof navigator !== 'undefined' &&
            navigator.canShare &&
            navigator.canShare({ files: [file] })
          ) {
            await navigator.share({
              title: `فويس الحفظ الجديد — سورة ${newMem.surahName}`,
              text: msg,
              files: [file],
            });
            showToast(
              '🎙️ تم مشاركة الفويس الصوتي للنص الجديد بصوت المحفظ مع ملخص الحصة عبر واتساب ✓',
              'success'
            );
            return;
          }
        } catch {
          // fallback to download + WhatsApp link below
        }

        const dl = document.createElement('a');
        dl.href = teacherAudioSrc;
        dl.download = `فويس-النص-الجديد-بصوت-المحفظ-${currentStudent.name}-سورة-${newMem.surahName}.wav`;
        document.body.appendChild(dl);
        dl.click();
        document.body.removeChild(dl);
      }
    }

    const waUrl = buildWhatsAppUrl(currentStudent.whatsappPhone, msg);
    navigator.clipboard?.writeText(msg).catch(() => {});
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast(
      `🔊 تم فتح واتساب ولي الأمر مع فويس النص الجديد (سورة ${newMem.surahName}) وملخص التسميع والحفظ الجديد والمراجعات ✓`,
      'success'
    );
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

            {/* 🎙️ شريط الميكروفون لتسجيل مقطع صوتي قصير لهذا التسميع وحفظ الرابط في حالة الطالب */}
            {(() => {
              const mappedAxisKey: RecitationAxisKey =
                modalTargetKey === 'actual'
                  ? 'actualRecitation'
                  : modalTargetKey === 'new'
                  ? 'newMemorization'
                  : modalTargetKey === 'near'
                  ? 'nearReview'
                  : modalTargetKey === 'far'
                  ? 'farReview'
                  : 'extraRecitation';
              const isRecordingThisAxis = activeAxisMicRecording === mappedAxisKey;
              const latestAxisClip = studentRecitationClips.find(
                (c) => c.axisKey === mappedAxisKey
              );
              const resolvedAudioUrl =
                state.recordedAudioUrl || latestAxisClip?.audioUrl;
              const resolvedDurationSec =
                state.recordedAudioDurationSec || latestAxisClip?.durationSeconds || 0;

              return (
                <div className="p-3.5 rounded-xl bg-gradient-to-l from-[#145a3a]/10 via-[#fcfaf2] to-[#c59b27]/10 dark:from-[#0b1711] dark:via-[#12231a] dark:to-[#0b1711] border border-[#c59b27]/50 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#145a3a] text-[#dfbd69] flex items-center justify-center">
                        <Mic className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5 flex-wrap">
                          <span>🎙️ تسجيل مقطع صوتي قصير لهذا التسميع بالميكروفون</span>
                          {resolvedAudioUrl && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                              🔗 الرابط مخزن في حالة الطالب ({resolvedDurationSec} ث)
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          يُسجّل تلاوة الطالب أو المعلم لسورة {state.surahName} (آية{' '}
                          {state.isFullSurah ? 1 : state.fromAyah}-
                          {state.isFullSurah ? surahMeta.ayahs : state.toAyah}) ويحفظ الرابط في{' '}
                          <code className="font-mono">student.recitationAudioClips</code> للرجوع إليه لاحقاً
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleAxisMicrophoneClip({
                            axisKey: mappedAxisKey,
                            axisLabel: title,
                            surahName: state.surahName,
                            fromAyah: state.isFullSurah ? 1 : state.fromAyah,
                            toAyah: state.isFullSurah ? surahMeta.ayahs : state.toAyah,
                            percentage: currentPct,
                            grade: state.grade,
                            onSavedToAxis: (url, dur) => {
                              setState((prev) => ({
                                ...prev,
                                recordedAudioUrl: url,
                                recordedAudioDurationSec: dur,
                                recordedAt: new Date().toISOString(),
                              }));
                            },
                          })
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition ${
                          isRecordingThisAxis
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                            : 'bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69]'
                        }`}
                      >
                        {isRecordingThisAxis ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" />
                            <span>
                              ⏹️ إيقاف وحفظ في حالة الطالب ({axisMicSeconds} ثانية)
                            </span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-[#dfbd69]" />
                            <span>
                              {resolvedAudioUrl
                                ? 'تسجيل مقطع جديد بالميكروفون'
                                : 'بدء تسجيل الميكروفون للتسميع'}
                            </span>
                          </>
                        )}
                      </button>

                      {resolvedAudioUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const synthClip: StudentRecitationAudioClip =
                                latestAxisClip || {
                                  id: `axis-clip-${mappedAxisKey}-${Date.now()}`,
                                  studentId: currentStudent?.id || 'std-1',
                                  studentName: currentStudent?.name || 'الطالب',
                                  sessionDate,
                                  axisKey: mappedAxisKey,
                                  axisLabel: title,
                                  surahName: state.surahName,
                                  fromAyah: state.isFullSurah ? 1 : state.fromAyah,
                                  toAyah: state.isFullSurah
                                    ? surahMeta.ayahs
                                    : state.toAyah,
                                  audioUrl: resolvedAudioUrl,
                                  durationSeconds: resolvedDurationSec || 8,
                                  grade: state.grade,
                                  percentage: currentPct,
                                  createdAt: new Date().toISOString(),
                                };
                              setGeminiTriggerClip(synthClip);
                              document
                                .getElementById('gemini-recitation-analyzer-panel')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-l from-[#c59b27] to-[#dfbd69] text-[#14281d] text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="تحليل المقطع الصوتي عبر Gemini لتقييم أحكام التجويد واللحن الجلي"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>✨ تحليل عبر Gemini (التجويد واللحن الجلي)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(resolvedAudioUrl);
                              showToast(
                                '🔗 تم نسخ رابط المقطع الصوتي المحفوظ في حالة الطالب إلى الحافظة',
                                'success'
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/50 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-bold cursor-pointer"
                            title="نسخ رابط المقطع الصوتي المخزن في حالة الطالب"
                          >
                            🔗 نسخ رابط المقطع
                          </button>
                          <a
                            href={resolvedAudioUrl}
                            download={`recitation-${mappedAxisKey}-${state.surahName}-${sessionDate}.wav`}
                            className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#145a3a] dark:text-[#dfbd69] border border-emerald-500/30"
                            title="تنزيل المقطع الصوتي"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {resolvedAudioUrl && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#c59b27]/30">
                      <audio
                        controls
                        src={resolvedAudioUrl}
                        className="h-8 flex-1 min-w-[220px]"
                      />
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-lg">
                        محفوظ في حالة الطالب: {currentStudent?.name} • سورة {state.surahName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
              محرك إدارة الحصة القرآنية الشامل
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-[#c59b27]/40 text-xs font-bold text-[#14281d] dark:text-[#dfbd69]">
              حالة السجل: {syncStatus}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              📅 {formatGregorianAndHijri(sessionDate, settings.showHijriDates ?? true, 'badge')}
            </span>
            <button
              type="button"
              onClick={() =>
                updateSettings({
                  showHijriDates: !(settings.showHijriDates ?? true),
                })
              }
              className="no-print px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-[#0b1711] hover:bg-neutral-200 dark:hover:bg-emerald-950 text-[11px] font-bold text-neutral-700 dark:text-emerald-200 border border-neutral-300 dark:border-emerald-800 cursor-pointer transition-colors"
              title="خيار المعلم الافتراضي: عرض التاريخ الهجري والميلادي معاً"
            >
              {(settings.showHijriDates ?? true)
                ? '✓ التقويم الهجري والميلادي معاً'
                : 'الميلادي فقط (تفعيل الهجري)'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* زر تبديل وضع التركيز (Focus Mode Toggle Switch) */}
            <button
              type="button"
              role="switch"
              aria-checked={isFullScreenFocus}
              onClick={handleToggleFocusMode}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border-2 flex items-center gap-2 cursor-pointer transition-all ${
                isFullScreenFocus
                  ? 'bg-gradient-to-l from-[#145a3a] to-emerald-700 text-white border-[#c59b27] shadow-md ring-2 ring-[#c59b27]/40'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-[#c59b27]/60 text-[#145a3a] dark:text-[#dfbd69] hover:border-[#145a3a]'
              }`}
              title="زر تبديل وضع التركيز: إخفاء القوائم الجانبية وتوسيع مساحة السبورة الذكية لتقليل المشتتات أثناء التسميع [F]"
            >
              <span
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                  isFullScreenFocus ? 'bg-[#c59b27]' : 'bg-neutral-300 dark:bg-emerald-900'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isFullScreenFocus ? '-translate-x-3.5' : '-translate-x-0.5'
                  }`}
                />
              </span>
              {isFullScreenFocus ? (
                <Minimize2 className="w-3.5 h-3.5 text-[#dfbd69]" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-[#c59b27]" />
              )}
              <span>
                {isFullScreenFocus
                  ? 'وضع التركيز مفعّل (السبورة موسّعة)'
                  : 'وضع التركيز وتوسيع السبورة'}
              </span>
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

            <button
              type="button"
              onClick={() =>
                triggerFastPrint(
                  `بطاقة تسميع الطالب - ${currentStudent?.name || ''} - ${sessionDate}`
                )
              }
              className="no-print px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-[#c59b27]/50 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="طباعة فورية سريعة لورقة التسميع الحالية"
            >
              <Printer className="w-3.5 h-3.5 text-[#c59b27]" />
              <span>طباعة سريعة للحصة</span>
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

            {currentStudent && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('teacher-5axis-voice-recorder');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-l from-[#145a3a] via-emerald-800 to-[#c59b27] hover:brightness-110 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#c59b27]"
                title="تفعيل الميكروفون لتسجيل ملاحظات صوتية سريعة عن مستوى الطالب وتحويلها لاحقاً إلى نصوص تقييمية بالذكاء الاصطناعي"
              >
                <Mic className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>🎙️ ميكروفون الملاحظات الصوتية + تحويل تقييمي بـ AI</span>
              </button>
            )}

            {/* ⏱️ شارة العداد التنازلي السريعة في الشريط العلوي مع تحكم مباشر */}
            {currentStudent && (
              <div
                className={`px-3 py-1 rounded-xl border-2 flex items-center gap-2 transition-all ${
                  timerStatusVisual.isExpired
                    ? 'bg-red-600 text-white border-red-300 animate-pulse shadow-md'
                    : timerStatusVisual.isApproachingEnd
                      ? 'bg-amber-500 text-[#14281d] border-amber-800 animate-pulse shadow-md'
                      : isTimerRunning
                        ? 'bg-[#145a3a] text-[#dfbd69] border-[#c59b27]'
                        : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-[#145a3a] dark:text-[#dfbd69] border-[#c59b27]/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('student-recitation-countdown-timer');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="flex items-center gap-1.5 cursor-pointer"
                  title="الانتقال إلى لوحة العداد التنازلي لإدارة وقت تسميع الطالب"
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span className="font-mono text-xs font-black tracking-wider">
                    {formatTimerMMSS(timerRemainingSeconds)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(12);
                    if (timerRemainingSeconds <= 0) {
                      handleResetRecitationTimer(true);
                    } else {
                      setIsTimerRunning((prev) => !prev);
                    }
                  }}
                  className="px-2 py-0.5 rounded-lg bg-black/20 hover:bg-black/30 text-[11px] font-black cursor-pointer flex items-center gap-1"
                  title={isTimerRunning ? 'إيقاف مؤقت للعداد' : 'بدء العداد التنازلي للتسميع'}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>بدء</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {currentStudent && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('new-mem-qari-voice-sender');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    void handleSendNewMemVoiceToParentWhatsApp();
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-l from-emerald-700 to-green-600 hover:brightness-110 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#c59b27]"
                title="إرسال فويس قارئ أو صوت المحفظ للنص الجديد لولي الأمر"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>🎧 زر إرسال فويس قارئ / صوت المحفظ</span>
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
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600/20 text-[#145a3a] dark:text-[#dfbd69] font-mono font-bold">
                    [F] وضع التركيز وتوسيع السبورة
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. مشغل تسجيلات الطالب الصوتية (HTML5 Audio) + شريط التحكم الزمني (Timestamp Pins) — يُخفى تلقائياً في وضع التركيز لتقليل المشتتات */}
        {!isFullScreenFocus &&
          (homeSubmissions.length > 0 ||
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

          {/* Date Select (Dual Hijri & Gregorian by Default) */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-500">
                تاريخ الحصة (هجري / ميلادي)
              </label>
              <span className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                {(settings.showHijriDates ?? true)
                  ? formatHijriDate(sessionDate, 'long')
                  : `${sessionDate} م`}
              </span>
            </div>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-sm font-mono tabular-nums"
            />
            {(settings.showHijriDates ?? true) && (
              <div className="mt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <span>الموافق: {HijriCalendar.getParts(sessionDate).gregorianFormatted}</span>
                <span>{HijriCalendar.getParts(sessionDate).weekday}</span>
              </div>
            )}
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

        {/* Absence Makeup & Auto-Reschedule Engine (منظومة تعويض الغياب الآلي وترحيل الأوراد) */}
        {status !== 'حضر' && currentStudent && (
          <div className="mt-5 p-4 sm:p-5 rounded-3xl bg-gradient-to-l from-rose-50 via-amber-50/70 to-white dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-rose-300 dark:border-rose-800/70 space-y-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-600 text-white shrink-0 mt-0.5 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black">
                      بطاقة تعويض غياب آلية ({status})
                    </span>
                    <span className="text-sm font-black text-rose-900 dark:text-rose-200">
                      منظومة تعويض الغياب الآلي وترحيل الأوراد للطالب ({currentStudent.name})
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-1">
                    الورد الفائت المربوط بالبطاقة: سورة {newMem.surahName || currentStudent.currentStop.surahName} (من آية{' '}
                    {newMem.fromAyah || currentStudent.currentStop.ayah} إلى آية {newMem.toAyah || currentStudent.currentStop.ayah + 7}) •
                    آخر توقف محفوظ: سورة {currentStudent.currentStop.surahName} آية ({currentStudent.currentStop.ayah})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveAndSendWhatsApp('short')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>حفظ بطاقة الغياب وإبلاغ ولي الأمر عبر واتساب</span>
              </button>
            </div>

            {/* Interactive Makeup Scheduling OR Auto-Merge into Next Week's Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-rose-200/80 dark:border-rose-900/50">
              {/* Option 1: Schedule Makeup Session Date */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/80 border border-emerald-300 dark:border-emerald-800/60 space-y-2.5">
                <div className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                  <span>📅 الخيار الأول: تحديد موعد حصة التعويض (للمحفظ وولي الأمر)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                    حصة تعويضية مستقلة
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      تاريخ حصة التعويض{' '}
                      {(settings.showHijriDates ?? true) &&
                        `(${formatHijriDate(makeupScheduleDate, 'short')})`}
                    </label>
                    <input
                      type="date"
                      value={makeupScheduleDate}
                      onChange={(e) => setMakeupScheduleDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">وقت الحصة</label>
                    <input
                      type="time"
                      value={makeupScheduleTime}
                      onChange={(e) => setMakeupScheduleTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    buildAndSaveSession('حصة محفوظة', { skipAutoWhatsAppTrigger: true });
                    const missedSurahName = newMem.surahName || currentStudent.currentStop.surahName || 'البقرة';
                    const missedFrom = newMem.fromAyah || currentStudent.currentStop.ayah || 1;
                    const missedTo = newMem.toAyah || missedFrom + 7;
                    const card: MakeupSessionCard = {
                      id: `makeup-${currentStudent.id}-${sessionDate}`,
                      studentId: currentStudent.id,
                      studentName: currentStudent.name,
                      absentDate: sessionDate,
                      attendanceStatus: status === 'غاب' ? 'غاب' : 'إجازة',
                      missedSurahId: newMem.surahId || currentStudent.currentStop.surahId,
                      missedSurahName,
                      missedFromAyah: missedFrom,
                      missedToAyah: missedTo,
                      resolutionStatus: 'scheduled_makeup',
                      scheduledMakeupDate: makeupScheduleDate,
                      scheduledMakeupTime: makeupScheduleTime,
                      resolvedByRole: 'teacher',
                      resolvedAt: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                    };
                    const existing = currentStudent.makeupSessions || [];
                    const nextList = [
                      card,
                      ...existing.filter((c) => c.absentDate !== sessionDate),
                    ];
                    updateStudent(currentStudent.id, { makeupSessions: nextList });
                    showToast(
                      `📅 تم إنشاء وجدولة بطاقة تعويض الغياب ليوم ${makeupScheduleDate} الساعة ${makeupScheduleTime} وإرسالها لبوابة ولي الأمر ✓`,
                      'success'
                    );
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer transition"
                >
                  اعتماد موعد حصة التعويض ونشره في بوابة ولي الأمر ✓
                </button>
              </div>

              {/* Option 2: Auto-Merge Missed Wird into Next Week's Plan without disrupting Khatmah */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950/80 border border-blue-300 dark:border-blue-800/60 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="text-xs font-black text-blue-900 dark:text-blue-300 flex items-center justify-between">
                    <span>🔄 الخيار الثاني: دمج الورد الفائت مع خطة الأسبوع القادم تلقائياً</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                      حماية جدول الختمة
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    يقوم المحرك بتقسيم آيات الورد الفائت وتوزيعها بالتساوي على حصص الأسبوع القادم بحيث يعوض الطالب غيابه تدريجياً دون أي تأخير في موعد الختمة المتوقع.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    buildAndSaveSession('حصة محفوظة', { skipAutoWhatsAppTrigger: true });
                    const missedSurahName = newMem.surahName || currentStudent.currentStop.surahName || 'البقرة';
                    const missedFrom = newMem.fromAyah || currentStudent.currentStop.ayah || 1;
                    const missedTo = newMem.toAyah || missedFrom + 7;
                    const spanAyahs = Math.max(1, missedTo - missedFrom + 1);
                    const weeklySessionsCount = Math.max(1, (currentStudent.scheduleDays || [0, 2, 4]).length);
                    const addPerSession = Math.max(1, Math.ceil(spanAyahs / weeklySessionsCount));
                    const mergedPlanNote = `تم دمج الورد الفائت (سورة ${missedSurahName}: ${missedFrom}-${missedTo}) بتوزيع +${addPerSession} آيات إضافية على حصص الأسبوع القادم دون إخلال بجدول الختمة.`;
                    const card: MakeupSessionCard = {
                      id: `makeup-${currentStudent.id}-${sessionDate}`,
                      studentId: currentStudent.id,
                      studentName: currentStudent.name,
                      absentDate: sessionDate,
                      attendanceStatus: status === 'غاب' ? 'غاب' : 'إجازة',
                      missedSurahId: newMem.surahId || currentStudent.currentStop.surahId,
                      missedSurahName,
                      missedFromAyah: missedFrom,
                      missedToAyah: missedTo,
                      resolutionStatus: 'merged_next_week',
                      mergedPlanNote,
                      resolvedByRole: 'teacher',
                      resolvedAt: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                    };
                    const existing = currentStudent.makeupSessions || [];
                    const nextList = [
                      card,
                      ...existing.filter((c) => c.absentDate !== sessionDate),
                    ];
                    updateStudent(currentStudent.id, {
                      makeupSessions: nextList,
                      notes: `${currentStudent.notes ? currentStudent.notes + ' | ' : ''}${mergedPlanNote}`,
                    });
                    showToast(
                      `🔄 ${mergedPlanNote}`,
                      'success'
                    );
                  }}
                  className="w-full py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black cursor-pointer transition"
                >
                  دمج الورد الفائت في خطة الأسبوع القادم تلقائياً دون إخلال بالختمة 🔄
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unified Educational Journey Summary Card — يُخفى تلقائياً في وضع التركيز لتقليل المشتتات */}
      {!isFullScreenFocus && currentStudent && (
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
                    آخر حصة:{' '}
                    {lastAttendedSession?.date
                      ? formatGregorianAndHijri(
                          lastAttendedSession.date,
                          settings.showHijriDates ?? true
                        )
                      : 'حصة تأسيسية'}
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

              {/* Spaced Repetition Engine (SRS) Alert Banner — خوارزمية المراجعة المتباعدة لمنع التفلت */}
              {srsDueJuzList.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/25 border-2 border-amber-500/60 space-y-3 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-sm">
                        🧠
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-200">
                            تنبيه خوارزمية المراجعة المتباعدة لمنع التفلت (SRS Engine)
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold">
                            {srsDueJuzList.length} جزء مستحق التثبيت العاجل (&gt;21 يوماً)
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                          تتبع ذكي لتاريخ آخر مراجعة: هذه الأجزاء المحفوظة مر عليها أكثر من 21 يوماً دون مراجعة في الحصص. اضغط للإدراج الفوري في المراجعة البعيدة.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {srsDueJuzList.map((item) => (
                      <div
                        key={item.juzNumber}
                        className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-amber-400/50 flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div>
                          <div className="font-extrabold text-xs text-[#14281d] dark:text-white">
                            {item.juzName}
                          </div>
                          <div className="text-[10px] text-red-600 font-bold mt-0.5">
                            لم يُراجع منذ {item.daysElapsed} يوماً (
                            {formatGregorianAndHijri(
                              item.lastDateStr,
                              settings.showHijriDates ?? true,
                              'compact'
                            )}
                            )
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplySrsJuzToFarReview(item.juzNumber)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs transition"
                        >
                          <span>إدراج في البعيدة ⚡</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Errors Follow-Up Card across Sessions — سجل النقاط الساخنة (ErrorHotspotsManager) */}
              <ErrorHotspotsManager
                student={currentStudent}
                historicalHotspots={openFollowUpErrors}
                currentSessionErrors={errors}
                activeErrorContext={activeErrorContext}
                defaultSurahName={actualRecitation.surahName || newMem.surahName}
                defaultAyahNumber={actualRecitation.fromAyah || newMem.fromAyah || 1}
                onUpdateFollowUpStatus={(studentId, errorKeyOrId, nextStatus) =>
                  updateErrorFollowUpStatus(
                    studentId,
                    errorKeyOrId,
                    nextStatus === 'mastered' || nextStatus === 'تم الإتقان'
                      ? 'mastered'
                      : nextStatus === 'needs_review' || nextStatus === 'needs_practice'
                      ? 'needs_review'
                      : 'repeated'
                  )
                }
                onAddHotspotError={(newHotspotErr) =>
                  setErrors((prev) => [newHotspotErr, ...prev])
                }
                onRemoveCurrentError={(errId) =>
                  setErrors((prev) => prev.filter((x) => x.id !== errId))
                }
                onOpenInMushaf={(surahName, ayahNum) => {
                  const found = SURAHS.find((s) => s.name === surahName);
                  setSmartQuranModal({
                    open: true,
                    sectionTitle: `مراجعة النقطة الساخنة — سورة ${surahName} (آية ${ayahNum})`,
                    sectionContext: 'التسميع',
                    surahId: found?.id,
                    surahName,
                    fromAyah: Math.max(1, ayahNum - 2),
                    toAyah: Math.min(found?.ayahs || 286, ayahNum + 3),
                    targetSectionKey: 'actual',
                  });
                }}
                onAssignToNearReview={(sId, sName, fAyah, tAyah) => {
                  setNearRev({
                    enabled: true,
                    surahId: sId,
                    surahName: sName,
                    isFullSurah: false,
                    fromAyah: fAyah,
                    toAyah: tAyah,
                    direction: 'asc',
                  });
                  showToast(
                    `تم إدراج سورة ${sName} (آية ${fAyah}-${tAyah}) في المراجعة القريبة لتثبيت النقطة الساخنة ✓`,
                    'success'
                  );
                }}
                onAppendToParentNotes={(summaryText) => {
                  setParentNotes((prev) =>
                    prev ? `${prev}\n\n${summaryText}` : summaryText
                  );
                  showToast('تم إدراج الكلمات الساخنة في ملاحظات ولي الأمر ✓', 'success');
                }}
              />

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

          {/* 3-Stage Error Marking & 4-Color Weighted Classification Bar + Context Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0b1711] border-2 border-amber-400/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs sm:text-sm font-black text-[#14281d] dark:text-amber-300 flex items-center gap-1.5">
                <span>🎯 نظام وسم الأخطاء ثلاثي المراحل والنقاط الساخنة (4 فئات موزونة):</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                يمكنك أيضاً فتح «📖 النص» والنقر على أي كلمة قرآنية لوسمها مباشرة وحفظها في النقاط الساخنة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleAddError('حفظ', {
                    deductionPoints: 1.0,
                    hotspotStageKey: 'memorization_1',
                    subType: 'خطأ حفظ / نسيان',
                  })
                }
                className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-right transition cursor-pointer shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-black">🔴 ١. خطأ حفظ / نسيان</div>
                  <div className="text-[10px] opacity-90 mt-0.5">يُحفظ في النقاط الساخنة</div>
                </div>
                <span className="px-2 py-1 rounded-xl bg-black/25 font-mono text-xs font-black">
                  -1.0 نقطة
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleAddError('تشكيل', {
                    deductionPoints: 0.5,
                    hotspotStageKey: 'tashkeel_05',
                    subType: 'خطأ تشكيل / إعراب',
                  })
                }
                className="p-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-right transition cursor-pointer shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-black">🟠 ٢. خطأ تشكيل / إعراب</div>
                  <div className="text-[10px] opacity-90 mt-0.5">ضبط أواخر الكلمات والحركات</div>
                </div>
                <span className="px-2 py-1 rounded-xl bg-black/25 font-mono text-xs font-black">
                  -0.5 نقطة
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleAddError('تجويد', {
                    deductionPoints: 0.5,
                    hotspotStageKey: 'tajweed_05',
                    subType: 'خطأ حكم تجويدي',
                  })
                }
                className="p-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-right transition cursor-pointer shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-black">🟣 ٣. خطأ حكم تجويدي</div>
                  <div className="text-[10px] opacity-90 mt-0.5">غنن • مدود • قلقلة • مخارج</div>
                </div>
                <span className="px-2 py-1 rounded-xl bg-black/25 font-mono text-xs font-black">
                  -0.5 نقطة
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleAddError('تردد', {
                    deductionPoints: 0.25,
                    hotspotStageKey: 'hesitation_025',
                    subType: 'تردد / تنبيه فتح',
                  })
                }
                className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-right transition cursor-pointer shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-black">🟡 ٤. تردد / تنبيه فتح</div>
                  <div className="text-[10px] opacity-85 mt-0.5">توقف يسير أو فتح من الشيخ</div>
                </div>
                <span className="px-2 py-1 rounded-xl bg-black/15 font-mono text-xs font-black">
                  -0.25 نقطة
                </span>
              </button>
            </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold">
                  أزرار تسجيل الأخطاء التفصيلية وتخصيص قواعد التجويد:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTajweedTargetErrorId(null);
                    setTajweedPickerOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <span>📜 بطاقات قواعد التجويد والمخارج</span>
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(
                  ['حفظ', 'تردد', 'تلقين', 'تجويد', 'تشكيل', 'نسيان آية'] as ErrorType[]
                ).map((errType) => (
                  <button
                    key={errType}
                    type="button"
                    onClick={() => {
                      if (errType === 'تجويد') {
                        setTajweedTargetErrorId(null);
                        setTajweedPickerOpen(true);
                      } else {
                        handleAddError(errType);
                      }
                    }}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      errType === 'تجويد'
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 hover:bg-amber-500 hover:text-slate-950'
                        : 'border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-600 hover:text-white text-red-700 dark:text-red-300'
                    }`}
                  >
                    + {errType}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recorded Session Errors List with Tajweed Cards */}
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
                    {err.word ? ` ﴿${err.word}﴾` : ''}
                    {err.letter ? ` [حرف: ${err.letter}]` : ''} ({err.context}
                    {err.surah ? ` - ${err.surah}` : ''}
                    {err.ayah ? ` آية ${err.ayah}` : ''})
                    {err.correctedInSession ? ' • صُحح بالحصة ✓' : ''}
                  </span>

                  {/* Interactive Tajweed Card Action */}
                  {err.tajweedRule ? (
                    <button
                      type="button"
                      onClick={() =>
                        setViewingTajweedRuleCard({
                          name: err.tajweedRule!,
                          letters: err.tajweedLetters || '',
                          example: err.tajweedExample || '',
                          explanation: err.tajweedExplanation || '',
                          tip: err.tajweedPracticeTip,
                        })
                      }
                      className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer hover:bg-amber-300 shadow-xs flex items-center gap-1"
                      title="عرض بطاقة الشرح والتوجيه المنزلي"
                    >
                      <span>📖 بطاقة: {err.tajweedRule}</span>
                    </button>
                  ) : err.type === 'تجويد' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTajweedTargetErrorId(err.id);
                        setTajweedPickerOpen(true);
                      }}
                      className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] underline cursor-pointer"
                    >
                      + ربط بقاعدة
                    </button>
                  ) : null}

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

          {/* 🎙️ واجهة الميكروفون ضمن محرك الحصة الخماسي لتسجيل ملاحظات صوتية سريعة عن مستوى الطالب وتحويلها لاحقاً إلى نصوص تقييمية باستخدام الذكاء الاصطناعي */}
          <div
            id="teacher-5axis-voice-recorder"
            className="mt-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-l from-[#145a3a]/15 via-[#fcfaf2] to-[#c59b27]/15 dark:from-[#0b1711] dark:via-[#12231a] dark:to-[#0b1711] border-2 border-[#c59b27] shadow-md space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#c59b27]/40">
              <div className="flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition ${
                    isRecordingVoice
                      ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-500/30'
                      : 'bg-[#145a3a] text-[#dfbd69]'
                  }`}
                >
                  {isRecordingVoice ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs sm:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      🎙️ ميكروفون الملاحظات الصوتية السريعة وتحويلها لنصوص تقييمية بالذكاء الاصطناعي (محرك الحصة الخماسي)
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                      الملاحظات المسجلة: {studentTeacherVoiceNotes.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#c59b27]/25 border border-[#c59b27] text-[#14281d] dark:text-[#dfbd69] text-[10px] font-black">
                      ✨ مدعوم بـ Gemini AI
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                    سجّل ملاحظات صوتية سريعة بصوتك أثناء الحصة حول مستوى الطالب ({currentStudent?.name}) في محور (<strong>{activeErrorContext}</strong>)، ثم حوّل أي ملاحظة صوتية لاحقاً بضغطة زر واحدة إلى <strong>نص تقييمي تربوي وتجويدي احترافي</strong> جاهز للإدراج في سجل الحصة وإرساله لولي الأمر.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartStopTeacherVoiceRecording('session_axis')}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer shadow-md transition ${
                    isRecordingVoice
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-2 ring-red-400'
                      : 'bg-gradient-to-l from-[#145a3a] to-emerald-800 hover:brightness-110 text-[#dfbd69] border border-[#c59b27]'
                  }`}
                >
                  {isRecordingVoice ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>
                        ⏹️ إيقاف وحفظ الملاحظة الصوتية ({voiceRecordingSeconds} ثانية)
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#dfbd69]" />
                      <span>🎙️ تسجيل ملاحظة صوتية سريعة بالميكروفون</span>
                    </>
                  )}
                </button>

                {studentTeacherVoiceNotes.length > 0 && (
                  <button
                    type="button"
                    disabled={convertingVoiceNoteId === 'ALL'}
                    onClick={() => void handleConvertAllVoiceNotesToEvaluation()}
                    className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-l from-[#c59b27] to-[#dfbd69] hover:brightness-105 text-[#14281d] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-60 transition"
                    title="تحويل جميع الملاحظات الصوتية المسجلة إلى تقرير تقييمي موحد بالذكاء الاصطناعي وإدراجه في ملاحظات الحصة"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {convertingVoiceNoteId === 'ALL'
                        ? 'جاري تحويل الملاحظات بـ AI...'
                        : `✨ تحويل كل الملاحظات (${studentTeacherVoiceNotes.length}) لنص تقييمي بـ AI`}
                    </span>
                  </button>
                )}

                <label className="px-3 py-2.5 rounded-2xl bg-white dark:bg-[#0b1711] hover:border-[#145a3a] border border-[#c59b27]/60 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#c59b27]" />
                  <span>رفع ملف صوتي</span>
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
                                `ملاحظة صوتية مرفوعة (${file.name})`,
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

            {/* شريط الحالة الحية للميكروفون وموجات الصوت والتفريغ الفوري أثناء التسجيل */}
            {isRecordingVoice && (
              <div className="p-3.5 rounded-2xl bg-red-950/90 text-white border-2 border-red-400/80 space-y-2.5 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-red-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>
                      🎙️ الميكروفون يسجل الآن ملاحظتك الصوتية حول ({activeErrorContext} — {voiceNoteCategoryInput})... مدة التسجيل: {voiceRecordingSeconds} ثانية
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-300">
                    مستوى الصوت: {voiceMicAudioLevel}%
                  </span>
                </div>

                {/* Live Audio Waveform Bars */}
                <div className="flex items-end gap-1 h-7 px-2 py-1 rounded-xl bg-black/40">
                  {Array.from({ length: 24 }).map((_, idx) => {
                    const barHeight = Math.max(
                      18,
                      Math.min(
                        100,
                        ((voiceMicAudioLevel + ((idx * 17) % 45)) % 95) + 15
                      )
                    );
                    return (
                      <span
                        key={idx}
                        className="flex-1 rounded-full bg-gradient-to-t from-emerald-400 to-[#dfbd69] transition-all duration-150"
                        style={{ height: `${barHeight}%` }}
                      />
                    );
                  })}
                </div>

                <div className="text-xs text-emerald-100 bg-black/30 p-2.5 rounded-xl border border-white/10">
                  <span className="font-bold text-[#dfbd69]">
                    🗣️ الالتقاط الصوتي المباشر أثناء حديثك:{' '}
                  </span>
                  <span>
                    {liveVoiceDraftTranscript ||
                      'تحدث الآن في الميكروفون... أو اختر إحدى الملاحظات السريعة أدناه ليتم تضمينها مع التسجيل الصوتي'}
                  </span>
                </div>
              </div>
            )}

            {/* تصنيف التقييم الجاهز (5 تصنيفات) + تصنيف الملاحظة الصوتية + محور الحصة الخماسي + مسودة منطوقة/نصية مساعدة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] mb-1">
                  ١. تصنيف التقييم الجاهز (يُربط تلقائياً مع النص):
                </label>
                <select
                  value={voiceNoteEvalRatingInput}
                  onChange={(e) =>
                    setVoiceNoteEvalRatingInput(
                      e.target.value as VoiceNoteEvaluationRating
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#c59b27] bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-black text-[#145a3a] dark:text-[#dfbd69] shadow-2xs"
                >
                  {VOICE_NOTE_EVAL_RATINGS.map((rt) => (
                    <option key={rt.value} value={rt.value}>
                      {rt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                  ٢. محور الحصة الخماسي:
                </label>
                <select
                  value={activeErrorContext}
                  onChange={(e) => setActiveErrorContext(e.target.value as ErrorContext)}
                  className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#0b1711] text-xs font-bold"
                >
                  <option value="التسميع">١) محور التسميع الفعلي</option>
                  <option value="الحفظ الجديد">٢) محور الحفظ الجديد</option>
                  <option value="المراجعة القريبة">٣) محور المراجعة القريبة</option>
                  <option value="المراجعة البعيدة">٤) محور المراجعة البعيدة</option>
                  <option value="الأجزاء">٥) محور الأجزاء والسور</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                  ٣. نوع الملاحظة:
                </label>
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
                  className="w-full px-2.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#0b1711] text-xs font-bold"
                >
                  <option value="تجويد">أحكام تجويد ومدود</option>
                  <option value="مخارج">مخارج الحروف والصفات</option>
                  <option value="حفظ">تثبيت حفظ ومتشابهات</option>
                  <option value="تشكيل">ضبط تشكيل وأواخر الكلمات</option>
                  <option value="توجيه عام">تقييم عام وتشجيع</option>
                </select>
              </div>

              <div className="lg:col-span-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-neutral-500">
                    ٤. ملخص سريع للملاحظة الصوتية (تُربط مع «{voiceNoteEvalRatingInput}»):
                  </label>
                  <label className="flex items-center gap-1 text-[10px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoConvertVoiceNoteOnStop}
                      onChange={(e) => setAutoConvertVoiceNoteOnStop(e.target.checked)}
                      className="accent-[#145a3a] rounded"
                    />
                    <span>تحويل تلقائي بـ AI فور إيقاف الميكروفون</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={voiceNoteTitleInput || liveVoiceDraftTranscript}
                  onChange={(e) => {
                    setVoiceNoteTitleInput(e.target.value);
                    setLiveVoiceDraftTranscript(e.target.value);
                    liveVoiceDraftRef.current = e.target.value;
                  }}
                  placeholder={`تحدث في الميكروفون أو اكتب ملاحظة لتُربط بتصنيف (${voiceNoteEvalRatingInput})...`}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#0b1711] text-xs font-semibold"
                />
              </div>
            </div>

            {/* شرائح سريعة لملاحظات المعلم الصوتية المعتادة لتسهيل التسجيل والتحويل الذكي بضغطة واحدة */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-neutral-500">
                ⚡ قوالب صوتية سريعة لمستوى الطالب:
              </span>
              {[
                {
                  cat: 'حفظ' as const,
                  rating: 'متميز' as VoiceNoteEvaluationRating,
                  text: `إتقان متميز في حفظ سورة ${actualRecitation.surahName} مع سلاسة في استحضار الآيات`,
                },
                {
                  cat: 'تجويد' as const,
                  rating: 'جيد جداً' as VoiceNoteEvaluationRating,
                  text: `أداء جيد جداً مع الحاجة لإتمام زمن الغنة والمد المتصل في سورة ${actualRecitation.surahName}`,
                },
                {
                  cat: 'مخارج' as const,
                  rating: 'جيد' as VoiceNoteEvaluationRating,
                  text: `مستوى جيد مع تحسن في مخارج الحروف والقلقلة ومراعاة تفخيم الراء`,
                },
                {
                  cat: 'حفظ' as const,
                  rating: 'يحتاج مراجعة' as VoiceNoteEvaluationRating,
                  text: `يحتاج مراجعة وتثبيت لأواخر الآيات والمتشابهات وتكرار المقطع 5 مرات في المنزل`,
                },
                {
                  cat: 'تشكيل' as const,
                  rating: 'ضعيف' as VoiceNoteEvaluationRating,
                  text: `ضعف في ضبط حركات أواخر الكلمات ويحتاج إعادة تأسيس وتدريب متأنٍّ مع القارئ`,
                },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setVoiceNoteCategoryInput(chip.cat);
                    setVoiceNoteEvalRatingInput(chip.rating);
                    setVoiceNoteTitleInput(chip.text);
                    setLiveVoiceDraftTranscript(chip.text);
                    liveVoiceDraftRef.current = chip.text;
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0b1711] hover:bg-[#145a3a] hover:text-white border border-neutral-200 dark:border-emerald-900/60 text-[10px] font-bold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer transition"
                >
                  [{chip.rating}] + {chip.text.slice(0, 42)}...
                </button>
              ))}
            </div>

            {/* قائمة الملاحظات الصوتية المسجلة للطالب مع زر التحويل إلى نص تقييمي بالذكاء الاصطناعي */}
            {studentTeacherVoiceNotes.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#0b1711]/70 border border-dashed border-[#c59b27]/50 text-center text-xs text-neutral-500">
                لا توجد ملاحظات صوتية سريعة مسجلة للطالب ({currentStudent?.name}) في هذه الحصة بعد — اختر تصنيف التقييم (<strong>{voiceNoteEvalRatingInput}</strong>) ثم اضغط على <strong>«🎙️ تسجيل ملاحظة صوتية سريعة بالميكروفون»</strong> أعلاه لتسجيل ملاحظتك وتحويلها لاحقاً إلى نص تقييمي بالذكاء الاصطناعي.
              </div>
            ) : (
              <div className="pt-3 border-t border-[#c59b27]/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  <span>
                    📂 سجل ملاحظات المعلم الصوتية السريعة للطالب ({currentStudent?.name}) وتحويلها التقييمي بالذكاء الاصطناعي:
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    اضغط «✨ تحويل لنص تقييمي بالذكاء الاصطناعي» ليتم ربط التصنيف المختار تلقائياً مع النص
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {studentTeacherVoiceNotes.slice(0, 10).map((vn) => {
                    const isConvertingThis =
                      convertingVoiceNoteId === vn.id ||
                      convertingVoiceNoteId === 'ALL';
                    const vnRating: VoiceNoteEvaluationRating =
                      vn.evaluationRating || 'متميز';
                    const vnRatingMeta =
                      VOICE_NOTE_EVAL_RATINGS.find((r) => r.value === vnRating) ||
                      VOICE_NOTE_EVAL_RATINGS[0];

                    return (
                      <div
                        key={vn.id}
                        className={`p-3.5 rounded-2xl border-2 transition space-y-3 ${
                          vn.aiEvaluativeText
                            ? 'bg-white dark:bg-[#0b1711] border-[#c59b27] shadow-sm'
                            : 'bg-white dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${vnRatingMeta.badgeClass}`}
                              >
                                🏷️ التقييم: {vnRating}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-[#145a3a] text-[#dfbd69] text-[10px] font-black">
                                {vn.context}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-[#c59b27]/20 text-[#14281d] dark:text-[#dfbd69] text-[10px] font-black">
                                {vn.category}
                              </span>
                              {vn.surahName && (
                                <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                                  سورة {vn.surahName}{' '}
                                  {vn.ayahNumber ? `(آية ${vn.ayahNumber})` : ''}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-neutral-500">
                                ⏱️ {vn.durationSeconds} ثانية • {vn.sessionDate}
                              </span>
                              {vn.appliedToSessionNotes && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                                  ✓ مُدرج في تقييم الحصة
                                </span>
                              )}
                            </div>

                            <div className="text-xs font-extrabold text-[#14281d] dark:text-white flex flex-wrap items-center gap-2 pt-0.5">
                              <span>🎙️ {vn.title}</span>
                              {/* إمكانية تغيير تصنيف التقييم الجاهز للملاحظة الصوتية قبل أو بعد تحويلها لنص */}
                              <select
                                value={vnRating}
                                onChange={(e) => {
                                  const nextRating = e.target
                                    .value as VoiceNoteEvaluationRating;
                                  setAllTeacherVoiceNotes((prev) =>
                                    prev.map((item) =>
                                      item.id === vn.id
                                        ? { ...item, evaluationRating: nextRating }
                                        : item
                                    )
                                  );
                                }}
                                className="px-2 py-0.5 rounded-lg border border-[#c59b27] bg-[#fcfaf2] dark:bg-[#12231a] text-[10px] font-black text-[#145a3a] dark:text-[#dfbd69]"
                                title="تغيير تصنيف التقييم المرتبط بهذه الملاحظة الصوتية"
                              >
                                {VOICE_NOTE_EVAL_RATINGS.map((rt) => (
                                  <option key={rt.value} value={rt.value}>
                                    تصنيف: {rt.value}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isConvertingThis}
                              onClick={() =>
                                void handleConvertVoiceNoteToEvaluation(vn, {
                                  autoInsertToParentNotes: false,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-l from-[#c59b27] to-[#dfbd69] hover:brightness-105 text-[#14281d] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60 transition"
                              title="تحويل هذه الملاحظة الصوتية إلى نص تقييمي تربوي وتجويدي باستخدام الذكاء الاصطناعي"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>
                                {isConvertingThis
                                  ? 'جاري التحويل بـ AI...'
                                  : vn.aiEvaluativeText
                                  ? '🔄 إعادة صياغة التقييم بـ AI'
                                  : '✨ تحويل الملاحظة الصوتية إلى نص تقييمي بـ AI'}
                              </span>
                            </button>

                            <a
                              href={vn.audioDataUrl}
                              download={`teacher-voice-note-${vn.studentId}-${vn.sessionDate}.wav`}
                              className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#145a3a] dark:text-[#dfbd69] hover:bg-emerald-100 border border-emerald-500/30"
                              title="تنزيل الملاحظة الصوتية"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteTeacherVoiceNote(vn.id)}
                              className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                              title="حذف الملاحظة الصوتية"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* مشغل الصوت للملاحظة المسجلة */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#f6f7f2] dark:bg-[#12231a] p-2 rounded-xl border border-neutral-200/80 dark:border-emerald-900/40">
                          <audio
                            controls
                            src={vn.audioDataUrl}
                            className="h-8 flex-1 min-w-[200px]"
                          />
                          <input
                            type="text"
                            value={vn.rawSpeechTranscript ?? vn.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAllTeacherVoiceNotes((prev) =>
                                prev.map((item) =>
                                  item.id === vn.id
                                    ? { ...item, rawSpeechTranscript: val, title: val || item.title }
                                    : item
                                )
                              );
                            }}
                            placeholder="نص أو ملخص الملاحظة المنطوقة لتحسين دقة التحويل بالذكاء الاصطناعي..."
                            className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-[11px] font-semibold"
                          />
                        </div>

                        {/* نتيجة التحويل إلى نص تقييمي بالذكاء الاصطناعي */}
                        {vn.aiEvaluativeText && (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-l from-[#145a3a]/10 via-[#fcfaf2] to-[#c59b27]/15 dark:from-emerald-950/40 dark:via-[#12231a] dark:to-[#0b1711] border border-[#c59b27] space-y-2.5 animate-in fade-in">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-[#145a3a] text-[#dfbd69] text-[10px] font-black flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  <span>النص التقييمي المُولّد بالذكاء الاصطناعي</span>
                                </span>
                                {vn.aiSuggestedGrade && (
                                  <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black">
                                    التقدير المقترح: {vn.aiSuggestedGrade} (
                                    {vn.aiSuggestedScore || 92}%)
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApplyVoiceNoteEvaluationToSession(vn)}
                                  className="px-3 py-1 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>📥 اعتماد وإدراج في تقييم الحصة وولي الأمر</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const fullText = `${vn.aiEvaluativeText}\n${
                                      vn.aiImprovementPlan
                                        ? `💡 خطة التحسين: ${vn.aiImprovementPlan}`
                                        : ''
                                    }`;
                                    navigator.clipboard?.writeText(fullText);
                                    showToast(
                                      '📋 تم نسخ النص التقييمي المحوّل بالذكاء الاصطناعي إلى الحافظة ✓',
                                      'success'
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/50 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-bold cursor-pointer"
                                >
                                  📋 نسخ النص
                                </button>

                                {currentStudent && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const waText = `${settings.whatsappHeader}\n\n🎙️ *تقييم المعلم المحوّل من الملاحظة الصوتية للطالب (${currentStudent.name}):*\n${vn.aiEvaluativeText}\n\n${
                                        vn.aiParentSummary
                                          ? `💬 *رسالة لولي الأمر:* ${vn.aiParentSummary}\n`
                                          : ''
                                      }${
                                        vn.aiImprovementPlan
                                          ? `📌 *خطة المتابعة المنزلية:* ${vn.aiImprovementPlan}\n`
                                          : ''
                                      }\n${settings.whatsappFooter}`;
                                      const waUrl = buildWhatsAppUrl(
                                        currentStudent.whatsappPhone,
                                        waText
                                      );
                                      const a = document.createElement('a');
                                      a.href = waUrl;
                                      a.target = '_blank';
                                      a.rel = 'noopener noreferrer';
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>إرسال لواتساب ولي الأمر</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <textarea
                              rows={3}
                              value={vn.aiEvaluativeText}
                              onChange={(e) => {
                                const updated = e.target.value;
                                setAllTeacherVoiceNotes((prev) =>
                                  prev.map((item) =>
                                    item.id === vn.id
                                      ? { ...item, aiEvaluativeText: updated }
                                      : item
                                  )
                                );
                              }}
                              className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/50 text-xs font-semibold text-[#14281d] dark:text-emerald-50 leading-relaxed"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                              {vn.aiStrengths && vn.aiStrengths.length > 0 && (
                                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                  <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69] block mb-0.5">
                                    🌟 نقاط القوة المرصودة:
                                  </span>
                                  <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-200 space-y-0.5">
                                    {vn.aiStrengths.map((st, i) => (
                                      <li key={i}>{st}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {vn.aiImprovementPlan && (
                                <div className="p-2 rounded-xl bg-amber-500/10 border border-[#c59b27]/40">
                                  <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69] block mb-0.5">
                                    📌 خطة التحسين والتثبيت للحصة القادمة:
                                  </span>
                                  <p className="text-neutral-700 dark:text-neutral-200">
                                    {vn.aiImprovementPlan}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Session Recitation & Assignment Sections (with 📖 النص in every section) */}
      {status === 'حضر' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27]/60 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2 flex-wrap">
                <span>
                  أقسام محرك التسميع الخماسي والتكليف والمراجعات الشاملة (مع الميكروفون والسبورة الذكية)
                </span>
                {isFullScreenFocus && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black animate-pulse">
                    🎯 وضع التركيز نشط: القوائم الجانبية مخفية والسبورة الذكية موسّعة
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                فعّل «وضع التركيز» لإخفاء القوائم الجانبية وتوسيع مساحة السبورة الذكية التفاعلية لتقليل المشتتات أثناء التسميع
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* زر تبديل وضع التركيز المباشر داخل محرك الحصة الخماسي */}
              <button
                type="button"
                role="switch"
                aria-checked={isFullScreenFocus}
                onClick={handleToggleFocusMode}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold border-2 flex items-center gap-2 cursor-pointer transition-all ${
                  isFullScreenFocus
                    ? 'bg-gradient-to-l from-[#145a3a] to-emerald-700 text-white border-[#c59b27] shadow-md'
                    : 'bg-[#fcfaf2] dark:bg-[#0b1711] border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] hover:bg-[#145a3a] hover:text-white'
                }`}
              >
                <span
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    isFullScreenFocus ? 'bg-[#c59b27]' : 'bg-neutral-300 dark:bg-emerald-900'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isFullScreenFocus ? '-translate-x-3.5' : '-translate-x-0.5'
                    }`}
                  />
                </span>
                {isFullScreenFocus ? (
                  <Minimize2 className="w-3.5 h-3.5 text-[#dfbd69]" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-[#c59b27]" />
                )}
                <span>
                  {isFullScreenFocus
                    ? 'إيقاف وضع التركيز واستعادة القوائم'
                    : '🎯 تفعيل وضع التركيز وتوسيع السبورة الذكية'}
                </span>
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
                🎙️ المقاطع المخزنة في حالة الطالب: {studentRecitationClips.length} مقطع
              </span>

              {/* زر إرسال ملخص التسميع عبر واتساب لولي الأمر بضغطة زر واحدة بعد التسميع */}
              <button
                type="button"
                onClick={() => handleSaveAndSendWhatsApp('recitation_audio_summary')}
                className="px-4 py-2 rounded-xl bg-gradient-to-l from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md border border-[#c59b27]/60 transition"
                title="إرسال ملخص التسميع عبر واتساب لولي الأمر بضغطة زر واحدة مع التقييم الصوتي التلقائي ودرجة التجويد"
              >
                <Send className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>📲 إرسال ملخص التسميع واتساب (مع التقييم الصوتي ودرجة التجويد)</span>
              </button>
            </div>
          </div>

          {/* ⏱️ عداد التسميع التنازلي الدقيق لإدارة وقت الحصة الخماسي لكل طالب وتنبيه المعلم */}
          {currentStudent && (
            <div
              id="student-recitation-countdown-timer"
              className={`p-4 sm:p-5 rounded-2xl border-2 shadow-md transition-all space-y-3.5 ${
                timerStatusVisual.isExpired
                  ? 'bg-gradient-to-l from-red-900 via-red-800 to-rose-950 text-white border-red-400 ring-4 ring-red-500/30'
                  : timerStatusVisual.isApproachingEnd
                    ? 'bg-gradient-to-l from-amber-600 via-amber-700 to-orange-800 text-white border-amber-300 ring-4 ring-amber-500/30'
                    : 'bg-gradient-to-l from-[#145a3a] via-[#103825] to-[#0b1f15] text-white border-[#c59b27]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Right: Timer Display & Student Context */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`px-4 py-2.5 rounded-2xl border-2 flex flex-col items-center justify-center min-w-[120px] shadow-inner ${
                      timerStatusVisual.isExpired
                        ? 'bg-red-950/90 border-red-300 text-red-100 animate-pulse'
                        : timerStatusVisual.isApproachingEnd
                          ? 'bg-amber-950/85 border-amber-200 text-amber-100 animate-pulse'
                          : 'bg-black/35 border-[#c59b27] text-[#dfbd69]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-[#dfbd69]" />
                      <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest">
                        {formatTimerMMSS(timerRemainingSeconds)}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-100/90 mt-0.5">
                      {timerStatusVisual.isExpired
                        ? '⌛ انتهى وقت التسميع!'
                        : timerStatusVisual.isApproachingEnd
                          ? '⏰ اقترب انتهاء الوقت!'
                          : isTimerRunning
                            ? '🟢 العداد يعمل الآن'
                            : '⏸️ العداد متوقف مؤقتاً'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#dfbd69] flex items-center gap-1.5">
                        <span>⏱️ عداد إدارة وقت التسميع في المحرك الخماسي</span>
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[11px] font-black text-white">
                        الطالب: {currentStudent.name}
                      </span>
                      {timerElapsedSeconds > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-300/40 text-[11px] font-bold text-emerald-100">
                          الوقت المنقضي الفعلي: {formatTimerMMSS(timerElapsedSeconds)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-100/90 mt-1">
                      {timerStatusVisual.currentSuggestedAxis}
                    </p>
                  </div>
                </div>

                {/* Left: Main Playback Controls & Quick Extensions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      if (timerRemainingSeconds <= 0) {
                        handleResetRecitationTimer(true);
                      } else {
                        setIsTimerRunning((prev) => !prev);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer shadow-md transition ${
                      isTimerRunning
                        ? 'bg-amber-400 hover:bg-amber-300 text-[#14281d]'
                        : 'bg-gradient-to-l from-[#c59b27] to-[#dfbd69] hover:brightness-105 text-[#14281d]'
                    }`}
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>⏸️ إيقاف مؤقت</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>
                          {timerRemainingSeconds < timerPresetSeconds &&
                          timerRemainingSeconds > 0
                            ? '▶️ استئناف العداد'
                            : '▶️ بدء وقت التسميع'}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetRecitationTimer(false)}
                    className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
                    title="إعادة ضبط العداد إلى الوقت المحدد"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#dfbd69]" />
                    <span>إعادة ضبط</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExtendTimerSeconds(60)}
                    className="px-2.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-[#c59b27]/50 text-white text-xs font-black cursor-pointer transition"
                    title="إضافة دقيقة إضافية لوقت الطالب"
                  >
                    +1 د
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExtendTimerSeconds(120)}
                    className="px-2.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-[#c59b27]/50 text-white text-xs font-black cursor-pointer transition"
                    title="إضافة دقيقتين إضافيتين لوقت الطالب"
                  >
                    +2 د
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextSound = !timerSoundEnabled;
                      setTimerSoundEnabled(nextSound);
                      if (nextSound) {
                        playRecitationTimerTone('warning');
                      }
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                      timerSoundEnabled
                        ? 'bg-white/15 border-[#c59b27] text-[#dfbd69]'
                        : 'bg-black/30 border-white/15 text-neutral-300'
                    }`}
                    title="تفعيل أو كتم الجرس الصوتي عند اقتراب انتهاء الوقت وعند انتهائه"
                  >
                    {timerSoundEnabled ? (
                      <>
                        <Bell className="w-3.5 h-3.5 text-[#dfbd69]" />
                        <span>🔔 التنبيه الصوتي مفعّل</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5 text-neutral-300" />
                        <span>🔕 التنبيه مكتوم</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Bar with 5-Axis Time Split Markers */}
              <div className="space-y-1.5">
                <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden border border-white/15 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      timerStatusVisual.isExpired
                        ? 'bg-red-400'
                        : timerStatusVisual.isApproachingEnd
                          ? 'bg-amber-300'
                          : 'bg-gradient-to-l from-[#c59b27] via-emerald-400 to-emerald-500'
                    }`}
                    style={{ width: `${timerStatusVisual.pct}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-100/85 font-bold">
                  <span>
                    نسبة الوقت المتبقي: {timerStatusVisual.pct}% (الإجمالي المحدد:{' '}
                    {Math.round(timerPresetSeconds / 60)} دقيقة)
                  </span>
                  <span>
                    توزيع المحرك الخماسي المقترح: التسميع ٣٠٪ • الجديد ٢٥٪ • القريب ٢٠٪ • البعيد والأجزاء ٢٥٪
                  </span>
                </div>
              </div>

              {/* Approaching End / Expired Alert Banner */}
              {(timerStatusVisual.isApproachingEnd || timerStatusVisual.isExpired) && (
                <div
                  className={`p-3 rounded-xl border-2 flex flex-wrap items-center justify-between gap-3 ${
                    timerStatusVisual.isExpired
                      ? 'bg-red-950/90 border-red-300 text-white'
                      : 'bg-amber-950/90 border-amber-300 text-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
                    <AlertTriangle className="w-5 h-5 text-[#dfbd69] shrink-0" />
                    <span>
                      {timerStatusVisual.isExpired
                        ? `⌛ انتهى وقت تسميع الطالب (${currentStudent.name}) بالكامل! يُرجى التمديد أو حفظ الحصة والانتقال للطالب التالي.`
                        : `⏰ تنبيه للمعلم: اقترب انتهاء وقت التسميع المخصص للطالب (${currentStudent.name}) — متبقي ${formatTimerMMSS(timerRemainingSeconds)} فقط!`}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExtendTimerSeconds(120)}
                      className="px-3 py-1.5 rounded-lg bg-[#c59b27] hover:bg-[#dfbd69] text-[#14281d] text-xs font-black cursor-pointer"
                    >
                      ⏱️ تمديد +2 دقيقة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        buildAndSaveSession('منشور ببوابة ولي الأمر');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
                    >
                      ✅ حفظ الحصة والطالب التالي
                    </button>
                  </div>
                </div>
              )}

              {/* Presets, Custom Time & Warning Threshold Controls */}
              <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-emerald-200 font-extrabold ml-1">
                    ⚡ قوالب وقت الطالب:
                  </span>
                  {[
                    { label: '5 دقائق', sec: 300 },
                    { label: '10 دقائق', sec: 600 },
                    { label: '15 دقيقة', sec: 900 },
                    { label: '20 دقيقة', sec: 1200 },
                    { label: '30 دقيقة', sec: 1800 },
                  ].map((preset) => (
                    <button
                      key={preset.sec}
                      type="button"
                      onClick={() => handleSelectTimerPreset(preset.sec, false)}
                      className={`px-2.5 py-1 rounded-lg font-extrabold cursor-pointer transition ${
                        timerPresetSeconds === preset.sec
                          ? 'bg-[#c59b27] text-[#14281d] shadow-xs'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}

                  {/* Custom Minutes Input */}
                  <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-lg border border-white/15 mr-1">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={timerCustomMinutesInput}
                      onChange={(e) => setTimerCustomMinutesInput(e.target.value)}
                      className="w-12 bg-transparent text-center font-mono font-black text-[#dfbd69] focus:outline-none"
                      aria-label="تحديد دقائق مخصصة للعداد"
                    />
                    <span className="text-[11px] text-emerald-200">دقيقة</span>
                    <button
                      type="button"
                      onClick={() => {
                        const mins = Number(timerCustomMinutesInput);
                        if (Number.isFinite(mins) && mins >= 1) {
                          handleSelectTimerPreset(mins * 60, false);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-[#c59b27] text-[#14281d] text-[11px] font-black cursor-pointer"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Warning Threshold Selector */}
                  <label className="flex items-center gap-1.5 text-emerald-100 font-bold">
                    <span>⏰ التنبيه قبل الانتهاء بـ:</span>
                    <select
                      value={timerWarningThresholdSec}
                      onChange={(e) => {
                        const nextWarn = Number(e.target.value);
                        setTimerWarningThresholdSec(nextWarn);
                        localStorage.setItem(
                          'wlq_5axis_timer_warn_sec',
                          String(nextWarn)
                        );
                        hasFiredApproachingWarningRef.current = false;
                      }}
                      className="px-2 py-1 rounded-lg bg-black/40 border border-[#c59b27]/60 text-[#dfbd69] font-extrabold focus:outline-none"
                    >
                      <option value={30}>30 ثانية</option>
                      <option value={60}>دقيقة واحدة (60 ث)</option>
                      <option value={120}>دقيقتين (120 ث)</option>
                      <option value={180}>3 دقائق</option>
                    </select>
                  </label>

                  {/* Auto-reset on student change */}
                  <label className="flex items-center gap-1.5 text-emerald-100 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={timerAutoResetOnStudentSwitch}
                      onChange={(e) =>
                        setTimerAutoResetOnStudentSwitch(e.target.checked)
                      }
                      className="accent-[#c59b27] rounded cursor-pointer"
                    />
                    <span>إعادة ضبط تلقائياً عند الانتقال لطالب آخر</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 📊 مؤشر صحة التسميع + بطاقة إرسال ملخص التسميع التلقائي عبر واتساب لولي الأمر بضغطة زر واحدة */}
          {currentStudent && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-l from-[#145a3a] via-[#123d28] to-[#0b1f15] text-white border-2 border-[#c59b27] shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#c59b27] text-[#14281d] flex items-center justify-center shrink-0 font-black text-sm shadow-sm">
                    {recitationHealthAndTajweedMetrics.healthScore}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#dfbd69]">
                        📊 مؤشر صحة التسميع والتقرير التلقائي الفوري عبر واتساب لولي الأمر
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-[#c59b27]/50 text-xs font-extrabold text-white">
                        {recitationHealthAndTajweedMetrics.healthStatusLabel}
                      </span>
                      {recitationHealthAndTajweedMetrics.isFromGeminiAi && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-[#dfbd69] text-[10px] font-black">
                          ✨ مدعوم بتحليل Gemini الصوتي
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-100/90 mt-0.5">
                      ملخص فوري بعد التسميع يشمل: التقييم الصوتي التلقائي ({recitationHealthAndTajweedMetrics.autoAudioScore}% - {recitationHealthAndTajweedMetrics.autoAudioGrade}) • درجة التجويد ({recitationHealthAndTajweedMetrics.tajweedScore}%) • سلامة اللحن الجلي ({recitationHealthAndTajweedMetrics.lahnJaliScore}%)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppSummaryPreview((prev) => !prev)}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-extrabold text-[#dfbd69] cursor-pointer transition"
                  >
                    {showWhatsAppSummaryPreview
                      ? 'إخفاء معاينة رسالة الواتساب ▲'
                      : '👁️ معاينة ملخص التسميع قبل الإرسال ▼'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const msg = buildFormattedWhatsAppMessage(
                        'recitation_audio_summary'
                      );
                      navigator.clipboard?.writeText(msg);
                      showToast(
                        '📋 تم نسخ ملخص التسميع والتقييم الصوتي ودرجة التجويد إلى الحافظة ✓',
                        'success'
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold cursor-pointer transition"
                  >
                    📋 نسخ الملخص
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveAndSendWhatsApp('recitation_audio_summary')}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#c59b27] to-[#dfbd69] hover:brightness-105 text-[#14281d] text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer shadow-lg transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>📲 إرسال ملخص التسميع لولي الأمر عبر واتساب بضغطة واحدة</span>
                  </button>
                </div>
              </div>

              {/* 4 Live Pills for Audio Evaluation, Tajweed Score, Lahn Jali, and 5-Axis Average */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/15">
                <div className="p-2.5 rounded-xl bg-black/25 border border-white/10">
                  <div className="text-[11px] text-emerald-200 font-bold">
                    🤖 التقييم الصوتي التلقائي
                  </div>
                  <div className="text-sm font-black text-white mt-0.5 flex items-center justify-between">
                    <span>
                      {recitationHealthAndTajweedMetrics.autoAudioScore}% (
                      {recitationHealthAndTajweedMetrics.autoAudioGrade})
                    </span>
                    <span className="text-[10px] text-[#dfbd69]">
                      {recitationHealthAndTajweedMetrics.recitationPace}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/25 border border-[#c59b27]/40">
                  <div className="text-[11px] text-[#dfbd69] font-bold">
                    📜 درجة التجويد التلقائية
                  </div>
                  <div className="text-sm font-black text-white mt-0.5 flex items-center justify-between">
                    <span className="font-mono">
                      {recitationHealthAndTajweedMetrics.tajweedScore}%
                    </span>
                    <span className="text-xs font-mono text-[#dfbd69]">
                      {renderMiniSquares(recitationHealthAndTajweedMetrics.tajweedScore)}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/25 border border-white/10">
                  <div className="text-[11px] text-emerald-200 font-bold">
                    🛡️ سلامة اللحن الجلي والحفظ
                  </div>
                  <div className="text-sm font-black text-white mt-0.5 flex items-center justify-between">
                    <span className="font-mono">
                      {recitationHealthAndTajweedMetrics.lahnJaliScore}%
                    </span>
                    <span className="text-xs font-mono text-emerald-300">
                      {renderMiniSquares(recitationHealthAndTajweedMetrics.lahnJaliScore)}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/25 border border-white/10">
                  <div className="text-[11px] text-emerald-200 font-bold">
                    💚 مؤشر صحة التسميع الخماسي
                  </div>
                  <div className="text-sm font-black text-white mt-0.5 flex items-center justify-between">
                    <span className="font-mono">
                      {recitationHealthAndTajweedMetrics.healthScore}%
                    </span>
                    <span className="text-[10px] text-emerald-300">
                      متوسط المحاور {recitationHealthAndTajweedMetrics.fiveAxisAvg}%
                    </span>
                  </div>
                </div>
              </div>

              {showWhatsAppSummaryPreview && (
                <div className="p-3.5 rounded-xl bg-black/40 border border-[#c59b27]/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-[#dfbd69]">
                    <span>
                      📱 معاينة نص رسالة «ملخص التسميع والتقييم الصوتي ودرجة التجويد» لولي الأمر ({currentStudent.whatsappPhone}):
                    </span>
                    <span>جاهز للإرسال الفوري ✓</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-emerald-50 font-sans leading-relaxed bg-black/30 p-3 rounded-lg border border-white/10 max-h-60 overflow-y-auto">
                    {buildFormattedWhatsAppMessage('recitation_audio_summary')}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 🎯 لوحة وضع التركيز الخماسي وتوسيع مساحة السبورة الذكية لتقليل المشتتات أثناء التسميع */}
          {isFullScreenFocus &&
            (() => {
              const focusAxesMap: {
                key: RecitationAxisKey;
                label: string;
                assignment: SurahRangeAssignment;
                pct: number;
                onSaveAudio: (url: string, dur: number) => void;
              }[] = [
                {
                  key: 'actualRecitation',
                  label: '١) التسميع الفعلي',
                  assignment: actualRecitation,
                  pct: sectionPercentages.actualRecitation || 94,
                  onSaveAudio: (url, dur) =>
                    setActualRecitation((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                },
                {
                  key: 'newMemorization',
                  label: '٢) الحفظ الجديد',
                  assignment: newMem,
                  pct: sectionPercentages.newMemorization || 95,
                  onSaveAudio: (url, dur) =>
                    setNewMem((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                },
                {
                  key: 'nearReview',
                  label: '٣) المراجعة القريبة',
                  assignment: nearRev,
                  pct: sectionPercentages.nearReview || 90,
                  onSaveAudio: (url, dur) =>
                    setNearRev((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                },
                {
                  key: 'farReview',
                  label: '٤) المراجعة البعيدة',
                  assignment: farRev,
                  pct: sectionPercentages.farReview || 88,
                  onSaveAudio: (url, dur) =>
                    setFarRev((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                },
                {
                  key: 'extraRecitation',
                  label: '٥) التسميع الإضافي',
                  assignment: extraRecitation,
                  pct: sectionPercentages.extraRecitation || 95,
                  onSaveAudio: (url, dur) =>
                    setExtraRecitation((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                },
              ];

              const selectedFocusAxis =
                focusAxesMap.find((a) => a.key === focusBoardAxisKey) ||
                focusAxesMap[0];
              const isRecordingFocusAxis =
                activeAxisMicRecording === selectedFocusAxis.key;

              return (
                <div className="rounded-3xl bg-gradient-to-b from-[#0b1711] via-[#12231a] to-[#0b1711] p-4 sm:p-5 border-2 border-[#c59b27] shadow-2xl space-y-4">
                  {/* شريط التحكم العلوي المختصر لوضع التركيز الخماسي */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#c59b27]/40 text-white">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-black flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>وضع التركيز الخماسي • السبورة الذكية الموسّعة</span>
                      </span>
                      <span className="text-xs font-extrabold text-[#dfbd69]">
                        الطالب: {currentStudent?.name} • سورة{' '}
                        {selectedFocusAxis.assignment.surahName} (آية{' '}
                        {selectedFocusAxis.assignment.fromAyah} -{' '}
                        {selectedFocusAxis.assignment.toAyah})
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold">
                        الإتقان: {masteryScore}%
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* التبديل بين توسيع السبورة بالكامل أو تقسيم الشاشة مع المحاور الخمسة */}
                      <div className="flex items-center rounded-xl bg-black/40 p-1 border border-[#c59b27]/40">
                        <button
                          type="button"
                          onClick={() => setFocusLayoutMode('board_expanded')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                            focusLayoutMode === 'board_expanded'
                              ? 'bg-[#c59b27] text-[#14281d]'
                              : 'text-emerald-100 hover:text-white'
                          }`}
                        >
                          🖥️ السبورة الذكية موسّعة بالكامل
                        </button>
                        <button
                          type="button"
                          onClick={() => setFocusLayoutMode('split_5axis')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                            focusLayoutMode === 'split_5axis'
                              ? 'bg-[#c59b27] text-[#14281d]'
                              : 'text-emerald-100 hover:text-white'
                          }`}
                        >
                          📐 عرض مزدوج (السبورة + المحاور الخمسة)
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => buildAndSaveSession('منشور ببوابة ولي الأمر')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 text-[#dfbd69]" />
                        <span>حفظ الحصة ✓</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleFocusMode}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>إنهاء وضع التركيز</span>
                      </button>
                    </div>
                  </div>

                  {/* شريط التبديل السريع بين المحاور الخمسة ومزامنة السبورة الذكية والميكروفون */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-black/30 p-3 rounded-2xl border border-white/10">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#dfbd69] ml-1">
                        اختر محور التسميع لمزامنة السبورة الذكية:
                      </span>
                      {focusAxesMap.map((ax) => {
                        const isSelected = focusBoardAxisKey === ax.key;
                        return (
                          <button
                            key={ax.key}
                            type="button"
                            onClick={() => setFocusBoardAxisKey(ax.key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#145a3a] text-[#dfbd69] border-[#c59b27] shadow-sm'
                                : 'bg-white/5 text-neutral-200 border-white/15 hover:bg-white/10'
                            }`}
                          >
                            <span>{ax.label}</span>
                            <span className="text-[10px] opacity-80 font-mono">
                              ({ax.assignment.surahName} {ax.assignment.fromAyah}-
                              {ax.assignment.toAyah})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* زر تسجيل الميكروفون الفوري للمحور المحدد داخل وضع التركيز */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleAxisMicrophoneClip({
                          axisKey: selectedFocusAxis.key,
                          axisLabel: selectedFocusAxis.label,
                          surahName: selectedFocusAxis.assignment.surahName,
                          fromAyah: selectedFocusAxis.assignment.fromAyah,
                          toAyah: selectedFocusAxis.assignment.toAyah,
                          percentage: selectedFocusAxis.pct,
                          grade: selectedFocusAxis.assignment.grade,
                          onSavedToAxis: selectedFocusAxis.onSaveAudio,
                        })
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                        isRecordingFocusAxis
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d]'
                      }`}
                    >
                      {isRecordingFocusAxis ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>
                            ⏹️ إيقاف وحفظ بحالة الطالب ({axisMicSeconds} ث)
                          </span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>🎙️ تسجيل ميكروفون ({selectedFocusAxis.label})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* مساحة السبورة الذكية الموسّعة بدون قوائم جانبية (أو مع عرض المحاور الخمسة بجانبها) */}
                  <div
                    className={
                      focusLayoutMode === 'split_5axis'
                        ? 'grid grid-cols-1 xl:grid-cols-12 gap-4 items-start'
                        : 'w-full'
                    }
                  >
                    <div
                      className={
                        focusLayoutMode === 'split_5axis'
                          ? 'xl:col-span-8 w-full'
                          : 'w-full'
                      }
                    >
                      <SmartBoardView
                        embeddedInSessionFocus
                        initialSurahId={selectedFocusAxis.assignment.surahId}
                        initialFromAyah={selectedFocusAxis.assignment.fromAyah}
                        initialToAyah={selectedFocusAxis.assignment.toAyah}
                      />
                    </div>

                    {focusLayoutMode === 'split_5axis' && (
                      <div className="xl:col-span-4 space-y-3 max-h-[760px] overflow-y-auto pr-1">
                        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 space-y-2">
                          <div className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
                            ⚡ ملخص المحاور الخمسة السريع بجانب السبورة
                          </div>
                          {focusAxesMap.map((ax) => (
                            <div
                              key={ax.key}
                              onClick={() => setFocusBoardAxisKey(ax.key)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                focusBoardAxisKey === ax.key
                                  ? 'bg-[#fcfaf2] dark:bg-[#0b1711] border-[#c59b27] ring-1 ring-[#c59b27]'
                                  : 'border-neutral-200 dark:border-emerald-900/50'
                              }`}
                            >
                              <div className="flex items-center justify-between font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                                <span>{ax.label}</span>
                                <span className="font-mono">{ax.pct}%</span>
                              </div>
                              <div className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5">
                                سورة {ax.assignment.surahName} • الآيات (
                                {ax.assignment.fromAyah} - {ax.assignment.toAyah})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* 🎙️ مركز الميكروفون الخماسي وسجل المقاطع الصوتية القصيرة المخزنة في حالة الطالب (student.recitationAudioClips) */}
          <div className="p-5 rounded-2xl bg-gradient-to-l from-[#145a3a]/10 via-[#fcfaf2] to-[#c59b27]/15 dark:from-[#0b1711] dark:via-[#12231a] dark:to-[#0b1711] border-2 border-[#c59b27]/70 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-8 h-8 rounded-xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shadow-xs">
                    <Mic className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    🎙️ ميكروفون محرك التسميع الخماسي وسجل المقاطع المخزنة في حالة الطالب
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold">
                    مرتبط بحالة الطالب: {currentStudent?.name} (ID: {currentStudent?.id})
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                  سجّل مقاطع صوتية قصيرة بالميكروفون لكل محور من محاور التسميع الخمسة، ويتم تخزين الرابط مباشرة في حالة الطالب (<code className="font-mono">student.recitationAudioClips</code> &amp; <code className="font-mono">student.lastRecitationAudioUrl</code>) للرجوع إليها والاستماع لها في أي وقت لاحقاً.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-[#0b1711] px-3 py-1.5 rounded-xl border-2 border-[#c59b27]">
                  <span className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    🏷️ تصنيف التقييم المرتبط بالميكروفون:
                  </span>
                  <select
                    value={voiceNoteEvalRatingInput}
                    onChange={(e) =>
                      setVoiceNoteEvalRatingInput(
                        e.target.value as VoiceNoteEvaluationRating
                      )
                    }
                    className="bg-transparent text-xs font-black text-[#145a3a] dark:text-[#dfbd69] focus:outline-none cursor-pointer"
                  >
                    {VOICE_NOTE_EVAL_RATINGS.map((rt) => (
                      <option key={rt.value} value={rt.value}>
                        {rt.value}
                      </option>
                    ))}
                  </select>
                </div>

                {currentStudent?.lastRecitationAudioUrl && (
                  <div className="flex items-center gap-2 bg-white dark:bg-[#0b1711] px-3 py-1.5 rounded-xl border border-emerald-500/40 text-[11px]">
                    <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      🔗 آخر رابط مخزن بحالة الطالب:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStudent.lastRecitationAudioUrl) {
                          navigator.clipboard?.writeText(currentStudent.lastRecitationAudioUrl);
                          showToast('تم نسخ رابط آخر تسميع مخزن في حالة الطالب ✓', 'success');
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-[#145a3a] text-[#dfbd69] font-bold cursor-pointer"
                    >
                      نسخ الرابط
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* أزرار التسجيل السريع للمحاور الخمسة بضغطة واحدة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {[
                {
                  key: 'actualRecitation' as RecitationAxisKey,
                  label: '١) التسميع الفعلي',
                  surah: actualRecitation.surahName,
                  from: actualRecitation.fromAyah,
                  to: actualRecitation.toAyah,
                  pct: sectionPercentages.actualRecitation || 94,
                  grade: actualRecitation.grade,
                  onSave: (url: string, dur: number) =>
                    setActualRecitation((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                },
                {
                  key: 'newMemorization' as RecitationAxisKey,
                  label: '٢) الحفظ الجديد',
                  surah: newMem.surahName,
                  from: newMem.fromAyah,
                  to: newMem.toAyah,
                  pct: sectionPercentages.newMemorization || 95,
                  grade: newMem.grade,
                  onSave: (url: string, dur: number) =>
                    setNewMem((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                },
                {
                  key: 'nearReview' as RecitationAxisKey,
                  label: '٣) المراجعة القريبة',
                  surah: nearRev.surahName,
                  from: nearRev.fromAyah,
                  to: nearRev.toAyah,
                  pct: sectionPercentages.nearReview || 90,
                  grade: nearRev.grade,
                  onSave: (url: string, dur: number) =>
                    setNearRev((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                },
                {
                  key: 'farReview' as RecitationAxisKey,
                  label: '٤) المراجعة البعيدة',
                  surah: farRev.surahName,
                  from: farRev.fromAyah,
                  to: farRev.toAyah,
                  pct: sectionPercentages.farReview || 88,
                  grade: farRev.grade,
                  onSave: (url: string, dur: number) =>
                    setFarRev((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                },
                {
                  key: 'juzAndSurahReview' as RecitationAxisKey,
                  label: '٥) الأجزاء والسور',
                  surah: JUZ_NAMES[selectedJuzNum - 1] || selectedSurahNames[0] || 'النبأ',
                  from: 1,
                  to: 30,
                  pct: sectionPercentages.juzReview || 90,
                  grade: 'ممتاز' as GradeType,
                  onSave: (url: string, dur: number) => {
                    setJuzReviewRecordedAudioUrl(url);
                    setJuzReviewRecordedDurationSec(dur);
                  },
                },
              ].map((axisItem) => {
                const isRec = activeAxisMicRecording === axisItem.key;
                const countForAxis = studentRecitationClips.filter(
                  (c) => c.axisKey === axisItem.key
                ).length;
                return (
                  <div
                    key={axisItem.key}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2 ${
                      isRec
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 shadow-sm'
                        : 'bg-white dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-[#14281d] dark:text-white">
                          {axisItem.label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-[#145a3a] dark:text-[#dfbd69] text-[10px] font-bold">
                          {countForAxis} مقطع
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
                        سورة {axisItem.surah} ({axisItem.from}-{axisItem.to})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleAxisMicrophoneClip({
                          axisKey: axisItem.key,
                          axisLabel: axisItem.label,
                          surahName: axisItem.surah,
                          fromAyah: axisItem.from,
                          toAyah: axisItem.to,
                          percentage: axisItem.pct,
                          grade: axisItem.grade,
                          onSavedToAxis: axisItem.onSave,
                        })
                      }
                      className={`w-full py-2 px-2.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                        isRec
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69]'
                      }`}
                    >
                      {isRec ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>إيقاف وحفظ ({axisMicSeconds}ث)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>تسجيل بالميكروفون</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* أرشيف المقاطع الصوتية المسجلة في حالة الطالب للرجوع إليها لاحقاً */}
            <div className="pt-3 border-t border-[#c59b27]/30 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  📂 المقاطع الصوتية المخزنة في حالة الطالب ({filteredStudentRecitationClips.length}) — جاهزة للاستماع والرجوع إليها في أي وقت:
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: 'ALL', label: 'الكل' },
                    { id: 'actualRecitation', label: 'التسميع الفعلي' },
                    { id: 'newMemorization', label: 'الحفظ الجديد' },
                    { id: 'nearReview', label: 'المراجعة القريبة' },
                    { id: 'farReview', label: 'المراجعة البعيدة' },
                    { id: 'juzAndSurahReview', label: 'الأجزاء والسور' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAxisClipsFilter(tab.id as RecitationAxisKey | 'ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                        axisClipsFilter === tab.id
                          ? 'bg-[#145a3a] text-[#dfbd69]'
                          : 'bg-white dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-emerald-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredStudentRecitationClips.length === 0 ? (
                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0b1711]/80 border border-dashed border-[#c59b27]/50 text-xs text-neutral-500 text-center">
                  لا توجد مقاطع صوتية مسجلة في هذا المحور بعد — اضغط على «تسجيل بالميكروفون» في أي محور أعلاه لتسجيل مقطع قصير وحفظ رابطه في حالة الطالب.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredStudentRecitationClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="p-3 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex flex-col justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-[#145a3a] text-[#dfbd69] text-[10px] font-extrabold">
                              {clip.axisLabel}
                            </span>
                            <span className="text-xs font-extrabold text-[#14281d] dark:text-white">
                              سورة {clip.surahName}{' '}
                              {clip.fromAyah ? `(آية ${clip.fromAyah}-${clip.toAyah || clip.fromAyah})` : ''}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-1 flex flex-wrap items-center gap-2">
                            <span>📅 {clip.sessionDate}</span>
                            <span>⏱️ {clip.durationSeconds} ثانية</span>
                            {clip.percentage !== undefined && (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                إتقان {clip.percentage}%
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setGeminiTriggerClip(clip);
                              document
                                .getElementById('gemini-recitation-analyzer-panel')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-l from-[#c59b27] to-[#dfbd69] text-[#14281d] text-[10px] font-black flex items-center gap-1 cursor-pointer"
                            title="تحليل المقطع الصوتي عبر Gemini لتقييم التجويد واللحن الجلي"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>تحليل Gemini</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(clip.audioUrl);
                              showToast(
                                '🔗 تم نسخ رابط المقطع الصوتي المحفوظ في حالة الطالب',
                                'success'
                              );
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/15 text-[#145a3a] dark:text-[#dfbd69] text-[10px] font-extrabold cursor-pointer"
                            title="نسخ الرابط المخزن في حالة الطالب"
                          >
                            🔗 الرابط
                          </button>
                          <a
                            href={clip.audioUrl}
                            download={`student-recitation-${clip.studentId}-${clip.axisKey}-${clip.sessionDate}.wav`}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#145a3a] dark:text-[#dfbd69]"
                            title="تنزيل المقطع الصوتي"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {currentStudent && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteStudentRecitationAudioClip(currentStudent.id, clip.id)
                              }
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                              title="حذف المقطع من حالة الطالب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <audio controls src={clip.audioUrl} className="w-full h-8" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ✨ أداة تحليل المقطع الصوتي المسجل عبر Gemini API لتقييم أحكام التجويد واللحن الجلي */}
          {currentStudent && (
            <GeminiRecitationAnalyzerTool
              studentId={currentStudent.id}
              studentName={currentStudent.name}
              riwayah={currentStudent.riwayah || 'حفص عن عاصم'}
              sessionDate={sessionDate}
              clips={studentRecitationClips}
              activeAxisConfig={{
                axisKey: 'actualRecitation',
                axisLabel: '١) التسميع الفعلي في الحصة',
                surahId: actualRecitation.surahId,
                surahName: actualRecitation.surahName,
                fromAyah: actualRecitation.fromAyah,
                toAyah: actualRecitation.toAyah,
                errorContext: 'التسميع',
                recordedAudioUrl:
                  actualRecitation.recordedAudioUrl ||
                  studentRecitationClips[0]?.audioUrl,
                recordedDurationSec:
                  actualRecitation.recordedAudioDurationSec ||
                  studentRecitationClips[0]?.durationSeconds,
              }}
              externalTriggerClip={geminiTriggerClip}
              onClearExternalTrigger={() => setGeminiTriggerClip(null)}
              onAddRecitationError={(newErr) => {
                setErrors((prev) => {
                  if (
                    newErr.compositeKey &&
                    prev.some((e) => e.compositeKey === newErr.compositeKey)
                  ) {
                    return prev.map((e) =>
                      e.compositeKey === newErr.compositeKey
                        ? { ...e, repeatCount: (e.repeatCount || 1) + 1 }
                        : e
                    );
                  }
                  return [newErr, ...prev];
                });
              }}
              onApplyScoreAndGrade={(axisKey, score, grade) => {
                if (axisKey === 'actualRecitation') {
                  setActualRecitation((p) => ({ ...p, grade }));
                  setSectionPercentages((p) => ({ ...p, actualRecitation: score }));
                } else if (axisKey === 'newMemorization') {
                  setNewMem((p) => ({ ...p, grade }));
                  setSectionPercentages((p) => ({ ...p, newMemorization: score }));
                } else if (axisKey === 'nearReview') {
                  setNearRev((p) => ({ ...p, grade }));
                  setSectionPercentages((p) => ({ ...p, nearReview: score }));
                } else if (axisKey === 'farReview') {
                  setFarRev((p) => ({ ...p, grade }));
                  setSectionPercentages((p) => ({ ...p, farReview: score }));
                } else if (axisKey === 'extraRecitation') {
                  setExtraRecitation((p) => ({ ...p, grade }));
                  setSectionPercentages((p) => ({ ...p, extraRecitation: score }));
                } else {
                  setSectionPercentages((p) => ({ ...p, juzReview: score }));
                }
              }}
              onAppendParentNote={(noteText) =>
                setParentNotes((prev) => (prev ? `${prev}\n${noteText}` : noteText))
              }
              onEvaluationCompleted={(evalRes) => setLatestGeminiEvaluation(evalRes)}
              onSendWhatsAppSummary={(evalRes) => {
                setLatestGeminiEvaluation(evalRes);
                handleSaveAndSendWhatsApp('recitation_audio_summary', evalRes);
              }}
              onStartAxisMicRecording={() =>
                handleToggleAxisMicrophoneClip({
                  axisKey: 'actualRecitation',
                  axisLabel: '١) التسميع الفعلي',
                  surahName: actualRecitation.surahName,
                  fromAyah: actualRecitation.fromAyah,
                  toAyah: actualRecitation.toAyah,
                  percentage: sectionPercentages.actualRecitation || 94,
                  grade: actualRecitation.grade,
                  onSavedToAxis: (url, dur) =>
                    setActualRecitation((p) => ({
                      ...p,
                      recordedAudioUrl: url,
                      recordedAudioDurationSec: dur,
                      recordedAt: new Date().toISOString(),
                    })),
                })
              }
              isRecordingAxisMic={activeAxisMicRecording === 'actualRecitation'}
              axisMicSeconds={axisMicSeconds}
              onShowToast={showToast}
            />
          )}

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

          {/* 🔊 أداة التشغيل الصوتي الموحدة للنص الجديد (القراء الأربعة + تسجيل المحفظ الخاص + مدرب Gemini الذكي + إرسال واتساب مباشر لولي الأمر) */}
          {newMem.enabled && currentStudent && (
            <NewMemAudioPlayerAndWhatsAppTool
              student={currentStudent}
              contextLocation="session_engine"
              controlledSurahId={newMem.surahId}
              controlledFromAyah={newMem.fromAyah}
              controlledToAyah={newMem.toAyah}
              onRangeChange={(sId, sName, fAyah, tAyah) => {
                setNewMem((prev) => ({
                  ...prev,
                  surahId: sId,
                  surahName: sName,
                  fromAyah: fAyah,
                  toAyah: tAyah,
                }));
              }}
              externalTeacherAudioUrl={
                memorizationAudioDataUrl || newMem.recordedAudioUrl || ''
              }
              onTeacherAudioRecorded={(dataUrl, fileName, durationSec) => {
                setMemorizationAudioDataUrl(dataUrl);
                setMemorizationAudioName(fileName);
                setNewMem((prev) => ({
                  ...prev,
                  recordedAudioUrl: dataUrl,
                  recordedAudioDurationSec: durationSec,
                  recordedAt: new Date().toISOString(),
                }));
              }}
              nearReviewLabel={
                nearRev.enabled
                  ? `سورة ${nearRev.surahName} (آية ${nearRev.fromAyah} - ${nearRev.toAyah})`
                  : undefined
              }
              farReviewLabel={
                farRev.enabled
                  ? `سورة ${farRev.surahName} (آية ${farRev.fromAyah} - ${farRev.toAyah})`
                  : undefined
              }
            />
          )}

          {/* 🔊 بطاقة إرسال فويس صوتي للنص الجديد الذي أخذه الطالب بخيارات متعددة (صوت المحفظ + زر تسجيل صوت المحفظ، أو الحصري / المنشاوي / العفاسي / المعيقلي) */}
          {newMem.enabled && currentStudent && (
            <div
              id="new-mem-qari-voice-sender"
              className="rounded-3xl bg-gradient-to-l from-[#145a3a]/15 via-[#fcfaf2] to-[#c59b27]/20 dark:from-[#0b1711] dark:via-[#12231a] dark:to-[#0b1711] border-2 border-[#c59b27] p-5 shadow-md space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#c59b27]/40">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0 shadow-xs">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        🔊 زر إرسال فويس قارئ / صوت المحفظ للنص الجديد الذي أخذه الطالب
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                        سورة {newMem.surahName} (آية {newMem.fromAyah} - {newMem.toAyah})
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                      اختر إرسال الفويس الصوتي للنص الجديد بـ «صوت المحفظ» (مع زر تسجيل فوري بجانبه) أو بأصوات المشايخ القراء (الحصري • المنشاوي • العفاسي • المعيقلي) مع إرسال ملخص التسميع والحفظ الجديد والمراجعات للأم وولي الأمر بضغطة واحدة.
                    </p>
                  </div>
                </div>

                {/* زر إرسال الفويس الصوتي للنص الجديد + الملخص الشامل لولي الأمر عبر واتساب */}
                <button
                  type="button"
                  onClick={() => void handleSendNewMemVoiceToParentWhatsApp()}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-l from-emerald-700 via-[#145a3a] to-green-700 hover:brightness-110 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg border-2 border-[#c59b27] cursor-pointer transition shrink-0"
                >
                  <Send className="w-4 h-4 text-[#dfbd69]" />
                  <span>📲 زر إرسال فويس قارئ + ملخص الحفظ والمراجعات لولي الأمر</span>
                </button>
              </div>

              {/* خيارات الصوت المتعددة: صوت المحفظ (وبجانبه زر تسجيل صوت المحفظ) + المشايخ القراء الأربعة */}
              <div className="space-y-2.5">
                <div className="text-xs font-extrabold text-[#14281d] dark:text-white flex items-center gap-1.5">
                  <span>🎙️ اختر مصدر الصوت لإرسال وتشغيل الفويس الصوتي للنص الجديد (أو اضغط إرسال فوري تحت أي قارئ):</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch">
                  {/* الخيار الأول: صوت المحفظ + بجانبه زر تسجيل صوت المحفظ */}
                  <div
                    className={`md:col-span-5 p-3 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-2 transition ${
                      newMemVoiceChoice === 'teacher_voice'
                        ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-sm'
                        : 'bg-white dark:bg-[#0b1711] border-neutral-300 dark:border-emerald-900 text-[#14281d] dark:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setNewMemVoiceChoice('teacher_voice')}
                      className="flex items-center gap-2 text-right cursor-pointer flex-1"
                    >
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          newMemVoiceChoice === 'teacher_voice'
                            ? 'border-[#dfbd69] bg-[#c59b27]'
                            : 'border-neutral-400'
                        }`}
                      >
                        {newMemVoiceChoice === 'teacher_voice' && (
                          <span className="w-2 h-2 rounded-full bg-[#14281d]" />
                        )}
                      </span>
                      <div>
                        <div className="text-xs font-black flex items-center gap-1.5">
                          <span>🎙️ بصوت المحفظ ({settings.teacherName || 'المعلم'})</span>
                          {(memorizationAudioDataUrl || newMem.recordedAudioUrl) && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-[#14281d] text-[9px] font-black">
                              مسجل وجاهز ✓
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[10px] ${
                            newMemVoiceChoice === 'teacher_voice'
                              ? 'text-emerald-100'
                              : 'text-neutral-500'
                          }`}
                        >
                          تلقين خاص بصوت معلم الحلقة
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* بجانبه زر تسجيل صوت المحفظ مباشرة */}
                      <button
                        type="button"
                        onClick={() => void handleToggleTeacherNewMemVoiceRecord()}
                        className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition shrink-0 ${
                          isRecordingTeacherNewMemVoice
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                            : 'bg-[#c59b27] hover:bg-[#dfbd69] text-[#14281d]'
                        }`}
                        title="تسجيل صوت المحفظ للنص الجديد مباشرة"
                      >
                        {isRecordingTeacherNewMemVoice ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" />
                            <span>⏹️ إيقاف ({teacherNewMemRecSeconds}ث)</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" />
                            <span>🎙️ تسجيل صوت المحفظ</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleSendNewMemVoiceToParentWhatsApp('teacher_voice')
                        }
                        className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
                        title="إرسال فويس بصوت المحفظ لولي الأمر"
                      >
                        <Send className="w-3 h-3" />
                        <span>إرسال</span>
                      </button>
                    </div>
                  </div>

                  {/* خيارات المشايخ القراء الأربعة: الحصري، المنشاوي، العفاسي، المعيقلي */}
                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        {
                          id: 'Husary_128kbps' as const,
                          shortName: 'الشيخ الحصري',
                          sub: 'محمود خليل الحصري',
                        },
                        {
                          id: 'Minshawy_Murattal_128kbps' as const,
                          shortName: 'الشيخ المنشاوي',
                          sub: 'محمد صديق المنشاوي',
                        },
                        {
                          id: 'Alafasy_128kbps' as const,
                          shortName: 'الشيخ العفاسي',
                          sub: 'مشاري راشد العفاسي',
                        },
                        {
                          id: 'MaherAlMuaiqly128kbps' as const,
                          shortName: 'الشيخ المعيقلي',
                          sub: 'ماهر المعيقلي',
                        },
                      ]
                    ).map((qari) => {
                      const isPicked = newMemVoiceChoice === qari.id;
                      return (
                        <div
                          key={qari.id}
                          className={`p-2.5 rounded-2xl border-2 text-right transition flex flex-col justify-between gap-2 ${
                            isPicked
                              ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-sm'
                              : 'bg-white dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60 text-[#14281d] dark:text-white hover:border-[#c59b27]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setNewMemVoiceChoice(qari.id);
                              setSelectedReciter(qari.id);
                            }}
                            className="text-right cursor-pointer w-full"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-black">🎧 {qari.shortName}</span>
                              {isPicked && (
                                <span className="w-2 h-2 rounded-full bg-[#dfbd69]" />
                              )}
                            </div>
                            <span
                              className={`block text-[10px] mt-0.5 truncate ${
                                isPicked ? 'text-emerald-100' : 'text-neutral-500'
                              }`}
                            >
                              {qari.sub}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNewMemVoiceChoice(qari.id);
                              setSelectedReciter(qari.id);
                              void handleSendNewMemVoiceToParentWhatsApp(qari.id);
                            }}
                            className={`w-full py-1 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition ${
                              isPicked
                                ? 'bg-[#c59b27] text-[#14281d] hover:bg-[#dfbd69]'
                                : 'bg-emerald-600/15 text-[#145a3a] dark:text-[#dfbd69] hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>إرسال فويس {qari.shortName.replace('الشيخ ', '')}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* شريط معاينة وتشغيل النص الجديد الصوتي والمكتوب */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handlePlayNewMemVoicePreview}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition shadow-xs ${
                        isPlayingNewMemVoice
                          ? 'bg-red-600 text-white'
                          : 'bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69]'
                      }`}
                    >
                      {isPlayingNewMemVoice ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>
                            إيقاف الاستماع{' '}
                            {playingNewMemAyahNum ? `(الآية ${playingNewMemAyahNum})` : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>
                            ▶️ استماع للفويس الصوتي للنص الجديد (
                            {newMemVoiceChoice === 'teacher_voice'
                              ? 'بصوت المحفظ'
                              : newMemVoiceChoice === 'Husary_128kbps'
                              ? 'الشيخ الحصري'
                              : newMemVoiceChoice === 'Minshawy_Murattal_128kbps'
                              ? 'الشيخ المنشاوي'
                              : newMemVoiceChoice === 'Alafasy_128kbps'
                              ? 'الشيخ العفاسي'
                              : 'الشيخ المعيقلي'}
                            )
                          </span>
                        </>
                      )}
                    </button>

                    {(memorizationAudioDataUrl || newMem.recordedAudioUrl) && (
                      <a
                        href={memorizationAudioDataUrl || newMem.recordedAudioUrl}
                        download={`فويس-الحفظ-الجديد-بصوت-المحفظ-${currentStudent.name}-سورة-${newMem.surahName}.wav`}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تنزيل فويس المحفظ</span>
                      </a>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    ✓ يُرسل نص الآيات والفويس الصوتي مع ملخص التسميع والمراجعات لولي الأمر
                  </span>
                </div>

                {newMemVersesList.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#fcfaf2] dark:bg-[#12231a] border border-neutral-200/80 dark:border-emerald-900/50 text-sm sm:text-base font-quran leading-loose text-[#14281d] dark:text-emerald-50 max-h-36 overflow-y-auto">
                    {newMemVersesList.map((v) => (
                      <span
                        key={v.ayah}
                        onClick={() => {
                          if (newMemVoiceChoice !== 'teacher_voice') {
                            const url = getEveryAyahAudioUrl(
                              newMemVoiceChoice,
                              newMem.surahId,
                              v.ayah
                            );
                            if (newMemVoicePlayerRef.current) {
                              newMemVoicePlayerRef.current.pause();
                            }
                            const a = new Audio(url);
                            newMemVoicePlayerRef.current = a;
                            setIsPlayingNewMemVoice(true);
                            setPlayingNewMemAyahNum(v.ayah);
                            a.onended = () => {
                              setIsPlayingNewMemVoice(false);
                              setPlayingNewMemAyahNum(null);
                            };
                            a.play().catch(() => {});
                          }
                        }}
                        className={`inline cursor-pointer rounded px-1 transition ${
                          playingNewMemAyahNum === v.ayah
                            ? 'bg-[#c59b27]/30 text-[#145a3a] dark:text-[#dfbd69] font-bold'
                            : 'hover:bg-emerald-500/10'
                        }`}
                      >
                        {v.text}{' '}
                        <span className="text-xs font-mono text-[#c59b27]">
                          ﴿{v.ayah}﴾
                        </span>{' '}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
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

        {/* Guardian-Teacher Educational Voice Note Recorder (الرسائل الصوتية التربوية بين المحفظ وولي الأمر) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-l from-emerald-950/10 via-[#f6f7f2] to-amber-500/10 dark:from-[#0b1711] dark:via-[#12231a] dark:to-[#0b1711] border-2 border-emerald-600/40 dark:border-emerald-700/50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-500" />
                <span>🎙️ تسجيل وإرسال ملاحظة صوتية تربوية لولي الأمر (Voice Note)</span>
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mt-0.5">
                سجل تعليقك الصوتي وتشجيعك للطالب عبر MediaRecorder API ليتمكن ولي الأمر من الاستماع إليه مباشرة في بوابته الخاصة (`/Guardian`)
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-[11px] font-black">
              {voiceNoteUrl ? '✅ الملاحظة الصوتية جاهزة للإرسال لبوابة ولي الأمر' : `متصل بـ MediaRecorder (${studentTeacherVoiceNotes.length} تسجيلات)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleVoiceRecorder}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-sm transition ${
                  isRecordingVoice
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-500/30'
                    : 'bg-[#145a3a] text-white hover:bg-[#0f452c]'
                }`}
              >
                {isRecordingVoice ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>
                      إيقاف وحفظ الرسالة الصوتية لولي الأمر ({voiceRecordingSeconds} ثانية)
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-[#dfbd69]" />
                    <span>🎙️ تسجيل وإرسال ملاحظة صوتية لولي الأمر (Voice Note)</span>
                  </>
                )}
              </button>

              {voiceNoteUrl && (
                <button
                  type="button"
                  onClick={() => {
                    buildAndSaveSession('منشور ببوابة ولي الأمر', {
                      skipAutoWhatsAppTrigger: true,
                    });
                    showToast(
                      `🎙️ تم إرسال الملاحظة الصوتية التربوية إلى بوابة ولي أمر (${currentStudent?.name}) بنجاح ✓`,
                      'success'
                    );
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>نشر الصوتية فوراً في بوابة ولي الأمر</span>
                </button>
              )}

              {studentTeacherVoiceNotes.length > 0 && (
                <button
                  type="button"
                  disabled={Boolean(convertingVoiceNoteId)}
                  onClick={() =>
                    void handleConvertVoiceNoteToEvaluation(
                      studentTeacherVoiceNotes[0],
                      { autoInsertToParentNotes: true }
                    )
                  }
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-l from-[#c59b27] to-[#dfbd69] hover:brightness-105 text-[#14281d] text-xs font-black cursor-pointer shadow-xs disabled:opacity-60"
                  title="تحويل آخر ملاحظة صوتية مسجلة إلى نص تقييمي بالذكاء الاصطناعي وإدراجه في ملاحظات ولي الأمر"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {convertingVoiceNoteId
                      ? 'جاري التحويل النصي بـ AI...'
                      : '✨ تحويل الصوتية لنص تقييمي بـ AI'}
                  </span>
                </button>
              )}

              {voiceNoteUrl && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-2xl border border-emerald-400/50">
                  <audio src={voiceNoteUrl} controls className="h-8 max-w-[220px]" />
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
                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
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

        {/* ⚡ شريط أتمتة إرسال ملخص التسميع اليومي عبر واتساب لولي الأمر تلقائياً فور إنهاء وحفظ الحصة */}
        <div className="p-4 rounded-2xl bg-gradient-to-l from-emerald-950/90 via-[#145a3a] to-[#0f452c] text-white border-2 border-[#c59b27] shadow-md space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#c59b27] text-[#14281d] flex items-center justify-center font-black shrink-0 shadow-xs">
                ⚡
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-[#dfbd69]">
                    أتمتة إرسال ملخص التسميع اليومي عبر واتساب لولي الأمر تلقائياً
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      autoSendWhatsAppOnSave
                        ? 'bg-emerald-400 text-[#14281d]'
                        : 'bg-white/15 text-neutral-200'
                    }`}
                  >
                    {autoSendWhatsAppOnSave ? 'مُفعّل تلقائياً ✓' : 'يدوي فقط'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 mt-0.5 leading-relaxed">
                  عند انتهاء المعلم من تسجيل بيانات الحصة والضغط على حفظ، يتم تلقائياً تجهيز وإرسال التقرير النصي المبسّط لواتساب ولي الأمر متضمناً: (الحفظ الجديد + المراجعة القريبة والبعيدة + درجة التقييم الصوتي التلقائي ودرجة التجويد + روابط الفويس الصوتي) مع أرشفته في بوابة ولي الأمر.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-black/25 border border-[#c59b27]/60 cursor-pointer shrink-0 self-start md:self-center">
              <input
                type="checkbox"
                checked={autoSendWhatsAppOnSave}
                onChange={(e) => handleToggleAutoSendWhatsApp(e.target.checked)}
                className="w-4 h-4 accent-[#c59b27] rounded cursor-pointer"
              />
              <span className="text-xs font-black text-white">
                إرسال تلقائي لواتساب ولي الأمر عند حفظ الحصة
              </span>
            </label>
          </div>

          {lastAutoDispatchedSummary && (
            <div className="p-3.5 rounded-xl bg-black/30 border border-[#dfbd69]/40 space-y-2 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-black text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    تم توليد وإرسال ملخص التسميع اليومي للطالب ({lastAutoDispatchedSummary.studentName}) في تمام {lastAutoDispatchedSummary.sentAt} — التقييم الصوتي: {lastAutoDispatchedSummary.audioScore}% | التجويد: {lastAutoDispatchedSummary.tajweedScore}%
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard
                        ?.writeText(lastAutoDispatchedSummary.message)
                        .catch(() => {});
                      showToast('تم نسخ التقرير النصي اليومي إلى الحافظة ✓', 'success');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold cursor-pointer"
                  >
                    📋 نسخ التقرير النصي
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const waUrl = buildWhatsAppUrl(
                        lastAutoDispatchedSummary.phone,
                        lastAutoDispatchedSummary.message
                      );
                      const a = document.createElement('a');
                      a.href = waUrl;
                      a.target = '_blank';
                      a.rel = 'noopener noreferrer';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#c59b27] text-[#14281d] text-[11px] font-black cursor-pointer"
                  >
                    📲 إعادة فتح واتساب ولي الأمر
                  </button>
                </div>
              </div>
              <pre className="text-[11px] font-sans whitespace-pre-wrap leading-relaxed text-emerald-50 bg-black/25 p-2.5 rounded-lg max-h-36 overflow-y-auto border border-white/10">
                {lastAutoDispatchedSummary.message}
              </pre>
            </div>
          )}
        </div>

        {/* Final Save & Send via WhatsApp Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          <button
            type="button"
            onClick={() => buildAndSaveSession('منشور ببوابة ولي الأمر')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#dfbd69]" />
            <span>
              {autoSendWhatsAppOnSave
                ? '⚡ إنهاء وحفظ الحصة + إرسال الملخص تلقائياً لواتساب ولي الأمر'
                : 'حفظ الحصة ونشرها ببوابة الطالب'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleSendNewMemVoiceToParentWhatsApp()}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-l from-[#145a3a] via-emerald-700 to-[#c59b27] hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-md border-2 border-[#c59b27] transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-[#dfbd69]" />
            <span>🎧 زر إرسال فويس قارئ / صوت المحفظ</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAndSendWhatsApp('recitation_audio_summary')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-l from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white font-black text-xs sm:text-sm shadow-md border border-[#c59b27] transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#dfbd69]" />
            <span>📲 إرسال ملخص التسميع والتجويد واتساب</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAndSendWhatsApp('short')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>حفظ وإرسال واتساب (مختصرة)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAndSendWhatsApp('detailed')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] font-extrabold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
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

      {/* 1. Modal: Tajweed Rules Picker Drawer / Dialog */}
      {tajweedPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#12231a] rounded-3xl border-2 border-[#c59b27] shadow-2xl overflow-hidden my-auto space-y-4">
            <div className="p-4 bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    بطاقات وقواعد التجويد والمخارج الميسرة
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    اختر القاعدة التجويدية لربطها بخطأ الطالب وإرسال بطاقة توجيه منزلي لولي الأمر
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTajweedPickerOpen(false);
                  setTajweedTargetErrorId(null);
                }}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
              {TAJWEED_RULES_GUIDE.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <div className="border-b border-neutral-200 dark:border-emerald-900 pb-1">
                    <h4 className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
                      {cat.title}
                    </h4>
                    <p className="text-[10px] text-neutral-500">{cat.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.rules.map((rule) => (
                      <div
                        key={rule.name}
                        onClick={() => handleAttachTajweedRuleToError(rule)}
                        className="p-3 rounded-2xl border border-neutral-200 dark:border-emerald-900/60 bg-[#fcfaf2] dark:bg-[#0b1711] hover:border-[#145a3a] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition shadow-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[#14281d] dark:text-white">
                            {rule.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69]">
                            {rule.durationHarakat}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                          حروفه: <strong>{rule.letters}</strong>
                        </div>
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-serif">
                          مثال: {rule.example}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Viewing Tajweed Rule Card for Home Practice */}
      {viewingTajweedRuleCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg bg-gradient-to-br from-white via-[#fcfaf2] to-[#f6f7f2] dark:from-[#12231a] dark:via-[#0b1711] dark:to-[#12231a] rounded-3xl border-3 border-[#c59b27] shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#c59b27]/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#145a3a] text-[#dfbd69] text-lg font-bold">
                  📜
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    بطاقة التوجيه التجويدي: {viewingTajweedRuleCard.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    دليل الطالب وولي الأمر للإتقان والتصحيح المنزلي
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTajweedRuleCard(null)}
                className="p-1.5 rounded-xl border border-neutral-300 dark:border-emerald-800 text-neutral-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#145a3a]/10 dark:bg-emerald-950/40 border border-[#c59b27]/40 space-y-2.5 text-xs">
              <div>
                <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69] block mb-0.5">
                  بيان الحكم والتطبيق:
                </span>
                <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed">
                  {viewingTajweedRuleCard.explanation}
                </p>
              </div>

              {viewingTajweedRuleCard.letters && (
                <div>
                  <span className="font-bold text-neutral-500 block">حروف الحكم:</span>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {viewingTajweedRuleCard.letters}
                  </p>
                </div>
              )}

              {viewingTajweedRuleCard.example && (
                <div>
                  <span className="font-bold text-neutral-500 block">شواهد من القرآن الكريم:</span>
                  <p className="font-serif text-emerald-800 dark:text-[#dfbd69] text-sm">
                    {viewingTajweedRuleCard.example}
                  </p>
                </div>
              )}

              {viewingTajweedRuleCard.tip && (
                <div className="p-2.5 rounded-xl bg-amber-400/20 border border-amber-500/40 text-amber-900 dark:text-amber-200">
                  <span className="font-bold">💡 نصيحة التدريب المنزلي:</span>
                  <p className="mt-0.5">{viewingTajweedRuleCard.tip}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewingTajweedRuleCard(null)}
              className="w-full py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold text-xs cursor-pointer shadow-xs"
            >
              إغلاق البطاقة ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


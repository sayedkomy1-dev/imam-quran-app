import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  AyahEntry,
  getEveryAyahAudioUrl,
  loadSurahVerses,
  RECITERS,
  SURAHS,
} from '../data/quranData';
import { OFFICIAL_ACADEMY_WHATSAPP } from '../data/hybridFoundationData';
import { getLocalDateString } from '../data/seedData';
import { ReciterId } from '../types';
import {
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Flame,
  Heart,
  Layers,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Plus,
  Printer,
  QrCode,
  Repeat,
  Send,
  Shield,
  Sparkles,
  Square,
  Star,
  TrendingUp,
  Users,
  Volume2,
  Wallet,
} from 'lucide-react';

interface CuratedQuranQuote {
  id: string;
  surahId: number;
  surahName: string;
  ayahNumber: number;
  ayahText: string;
  reflectionTitle: string;
  reflectionBody: string;
  hadithText: string;
  intentionPrompt: string;
}

const DAILY_QURAN_QUOTES: CuratedQuranQuote[] = [
  {
    id: 'quote-1',
    surahId: 54,
    surahName: 'القمر',
    ayahNumber: 17,
    ayahText: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِنْ مُدَّكِرٍ',
    reflectionTitle: 'بشارة التيسير الرباني لأهل القرآن',
    reflectionBody:
      'كل آية تكررها بصدق يفتح الله لك بها باباً من الفهم والسكينة؛ فالقرآن ميسّر لمن أقبل عليه بقلب حاضر وهمة صادقة.',
    hadithText:
      'قال رسول الله ﷺ: «خَيرُكُم مَن تعلَّمَ القرآنَ وعلَّمَهُ» (رواه البخاري).',
    intentionPrompt:
      'اللهم إني نويت بتلاوتي وحفظي اليوم طلب مرضاتك، وعمارة قلبي بكلامك، والعمل بما فيه.',
  },
  {
    id: 'quote-2',
    surahId: 35,
    surahName: 'فاطر',
    ayahNumber: 29,
    ayahText:
      'إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ وَأَنْفَقُوا مِمَّا رَزَقْنَاهُمْ سِرًّا وَعَلَانِيَةً يَرْجُونَ تِجَارَةً لَنْ تَبُورَ',
    reflectionTitle: 'التجارة الرابحة التي لا تعرف الخسارة',
    reflectionBody:
      'لحظاتك مع المصحف الشريف وترديدك للآيات هي أعظم استثمار في الدنيا والآخرة؛ بكل حرف حسنة والحسنة بعشر أمثالها.',
    hadithText:
      'قال رسول الله ﷺ: «اقرؤوا القرآنَ فإنه يأتي يومَ القيامةِ شفيعاً لأصحابه» (رواه مسلم).',
    intentionPrompt:
      'أنوي بتلاوتي اليوم أن يكون القرآن ربيع قلبي ونور صدري وشفيعي يوم ألقى الله.',
  },
  {
    id: 'quote-3',
    surahId: 17,
    surahName: 'الإسراء',
    ayahNumber: 9,
    ayahText:
      'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ وَيُبَشِّرُ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا كَبِيرًا',
    reflectionTitle: 'الهداية لأقوم طريق وأسمى أخلاق',
    reflectionBody:
      'حفظ القرآن ليس مجرد استظهار للحروف، بل هو نور يهدي سلوكك وأخلاقك وبرّك بوالديك إلى أقوم سبيل.',
    hadithText:
      'قال رسول الله ﷺ: «يُقالُ لصاحبِ القرآنِ: اقرأ وارتَقِ ورتِّل كما كنتَ ترتِّلُ في الدنيا، فإنَّ منزلتَك عندَ آخرِ آيةٍ تقرؤُها».',
    intentionPrompt:
      'أنوي بحفظي ومراجعتي اليوم التخلق بأخلاق القرآن والارتقاء في درجات الجنة.',
  },
  {
    id: 'quote-4',
    surahId: 13,
    surahName: 'الرعد',
    ayahNumber: 28,
    ayahText:
      'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    reflectionTitle: 'واحة الطمأنينة والسكينة القلبية',
    reflectionBody:
      'حين تضيق بك مشاغل اليوم، افتح مصحفك ورتّل آيات ربك؛ ستجد برد اليقين وهدوء النفس ينساب إلى قلبك.',
    hadithText:
      'قال رسول الله ﷺ: «ما اجتمعَ قومٌ في بيتٍ من بيوتِ اللهِ يتلونَ كتابَ اللهِ ويتدارسونَه بينهم إلا نزلت عليهم السكينةُ».',
    intentionPrompt:
      'اللهم أنزل السكينة والطمأنينة على قلبي وبيتي وأهلي ببركة تلاوة كتابك العزيز.',
  },
  {
    id: 'quote-5',
    surahId: 73,
    surahName: 'المزمل',
    ayahNumber: 4,
    ayahText: 'أَوْ زِدْ عَلَيْهِ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا',
    reflectionTitle: 'جمال الترتيل وإعطاء كل حرف حقه',
    reflectionBody:
      'الترتيل الهادئ المتأني يرسّخ الحفظ في الذاكرة البعيدة، ويجعل التلاوة خاشعة مؤثرة في القارئ والسامع.',
    hadithText:
      'قال رسول الله ﷺ: «الماهرُ بالقرآنِ معَ السفرةِ الكرامِ البررةِ، والذي يقرأُ القرآنَ ويتتعتعُ فيهِ وهوَ عليهِ شاقٌّ لهُ أجرانِ».',
    intentionPrompt:
      'أنوي الصبر والمجاهدة في إتقان مخارج الحروف والتجويد تقرباً إلى الله تعالى.',
  },
];

type SurahMasteryHeatState = 'mastered' | 'needs_review' | 'urgent';

interface WordVoiceCorrectionNote {
  id: string;
  studentId: string;
  studentName: string;
  surahId: number;
  surahName: string;
  ayahNumber: number;
  wordText: string;
  teacherTip: string;
  createdAt: string;
  audioDataUrl?: string;
}

const HEATMAP_STORAGE_KEY = 'imam_academy_surah_heatmap_v1';
const WORD_VOICE_NOTES_STORAGE_KEY = 'imam_academy_word_voice_notes_v1';
const DAILY_EXTRA_PAGES_STORAGE_KEY = 'imam_academy_faith_oasis_extra_pages_v1';

export interface FaithOasisViewProps {
  embeddedMode?: boolean;
}

export const FaithOasisView: React.FC<FaithOasisViewProps> = ({
  embeddedMode = false,
}) => {
  const {
    students,
    sessions,
    circles,
    ijazahs,
    settings,
    waqfImpactStats,
    recordPublicWaqfActivity,
    selectedStudentId,
    setSelectedStudentId,
    awardStudentBadge,
    addStudentXp,
    toggleStudentGoldenCrown,
    setActiveTab,
    showToast,
  } = useAcademy();

  const todayStr = getLocalDateString(0);

  // Max 4 Clean Tabs inside Faith Oasis View
  const [activeOasisTab, setActiveOasisTab] = useState<
    'spiritual_counter' | 'teacher_innovations' | 'student_tahfeez' | 'family_supervisor'
  >('spiritual_counter');

  // 1. Daily Quranic Quote & Intention Renewal State
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState<number>(() => {
    const dayNum = new Date().getDate();
    return dayNum % DAILY_QURAN_QUOTES.length;
  });
  const [intentionRenewedToday, setIntentionRenewedToday] = useState<boolean>(false);
  const [playingQuoteAudio, setPlayingQuoteAudio] = useState<boolean>(false);
  const quoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Extra Pages Logged Today in the Counter
  const [extraPagesToday, setExtraPagesToday] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(DAILY_EXTRA_PAGES_STORAGE_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as { date: string; count: number };
      return parsed.date === todayStr ? parsed.count : 0;
    } catch {
      return 0;
    }
  });

  const activeQuote = DAILY_QURAN_QUOTES[selectedQuoteIndex] || DAILY_QURAN_QUOTES[0];

  const activeStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );

  // Live Academy Achievements Counter Calculations
  const academyAchievements = useMemo(() => {
    const todaySessions = sessions.filter(
      (s) => s.date === todayStr && s.status === 'حضر'
    );
    const allAttendedSessions = sessions.filter((s) => s.status === 'حضر');

    const todayAyat = todaySessions.reduce((sum, s) => {
      let c = 0;
      if (s.newMemorization?.enabled) {
        c += Math.max(1, s.newMemorization.toAyah - s.newMemorization.fromAyah + 1);
      }
      if (s.nearReview?.enabled) {
        c += Math.max(1, s.nearReview.toAyah - s.nearReview.fromAyah + 1);
      }
      return sum + c;
    }, 0);

    const calculatedPagesToday = Math.max(
      students.length * 2,
      Math.round(todayAyat / 12) + 14
    );
    const totalPagesMemorizedToday = calculatedPagesToday + extraPagesToday;

    const totalCumulativeJuz = students.reduce(
      (sum, st) => sum + st.memorizedJuz.length,
      0
    );
    const totalCumulativeSurahs = students.reduce(
      (sum, st) => sum + st.memorizedSurahs.length,
      0
    );

    const estimatedHasanat =
      (totalPagesMemorizedToday * 600 + (waqfImpactStats?.totalVersesRead || 420) * 50) *
      10;

    return {
      totalPagesMemorizedToday,
      todayAyat: Math.max(todayAyat, totalPagesMemorizedToday * 13),
      activeCirclesCount: circles.length,
      activeStudentsCount: students.filter((s) => (s.accountStatus ?? 'نشط') === 'نشط')
        .length,
      totalCumulativeJuz,
      totalCumulativeSurahs,
      totalSessionsCompleted: allAttendedSessions.length,
      estimatedHasanat,
    };
  }, [sessions, students, circles, todayStr, extraPagesToday, waqfImpactStats]);

  const handleIncrementPageToday = () => {
    const next = extraPagesToday + 1;
    setExtraPagesToday(next);
    try {
      localStorage.setItem(
        DAILY_EXTRA_PAGES_STORAGE_KEY,
        JSON.stringify({ date: todayStr, count: next })
      );
    } catch {
      // ignore storage errors
    }
    recordPublicWaqfActivity(15, 1);
    showToast(
      'تقبل الله منك! تم تسجيل صفحة قرآنية جديدة في عداد إنجازات الأكاديمية اليوم',
      'success'
    );
  };

  const handlePlayQuoteVerse = () => {
    if (playingQuoteAudio && quoteAudioRef.current) {
      quoteAudioRef.current.pause();
      setPlayingQuoteAudio(false);
      return;
    }
    const url = getEveryAyahAudioUrl(
      'Husary_128kbps',
      activeQuote.surahId,
      activeQuote.ayahNumber
    );
    if (!quoteAudioRef.current) {
      quoteAudioRef.current = new Audio(url);
    } else {
      quoteAudioRef.current.src = url;
    }
    quoteAudioRef.current.onended = () => setPlayingQuoteAudio(false);
    quoteAudioRef.current.onerror = () => setPlayingQuoteAudio(false);
    setPlayingQuoteAudio(true);
    quoteAudioRef.current.play().catch(() => setPlayingQuoteAudio(false));
  };

  // ============================================================================
  // 2. Teacher Portal Innovations: 114-Surah Heatmap + Word Voice Note + Circle Call
  // ============================================================================
  const [customHeatmapOverrides, setCustomHeatmapOverrides] = useState<
    Record<string, Record<number, SurahMasteryHeatState>>
  >(() => {
    try {
      const raw = localStorage.getItem(HEATMAP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | SurahMasteryHeatState>(
    'all'
  );

  const getStudentSurahHeatState = (
    stId: string,
    surahNumber: number,
    surahName: string
  ): SurahMasteryHeatState => {
    const studentMap = customHeatmapOverrides[stId];
    if (studentMap && studentMap[surahNumber]) {
      return studentMap[surahNumber];
    }
    const st = students.find((s) => s.id === stId) || activeStudent;
    if (!st) return 'needs_review';
    if (st.memorizedSurahs.includes(surahName) || surahNumber >= 78) {
      // Check if student had recent errors in this surah
      const hasRecentErrors = sessions.some(
        (ses) =>
          ses.studentId === st.id &&
          ses.errors.some((e) => e.surahId === surahNumber)
      );
      if (hasRecentErrors) return 'urgent';
      return 'mastered';
    }
    if (st.currentStop.surahId === surahNumber || surahNumber >= 58) {
      return 'needs_review';
    }
    return 'needs_review';
  };

  const handleCycleSurahHeatState = (surahNumber: number, surahName: string) => {
    if (!activeStudent) return;
    const current = getStudentSurahHeatState(
      activeStudent.id,
      surahNumber,
      surahName
    );
    const order: SurahMasteryHeatState[] = [
      'mastered',
      'needs_review',
      'urgent',
    ];
    const nextState = order[(order.indexOf(current) + 1) % order.length];
    const updated = {
      ...customHeatmapOverrides,
      [activeStudent.id]: {
        ...(customHeatmapOverrides[activeStudent.id] || {}),
        [surahNumber]: nextState,
      },
    };
    setCustomHeatmapOverrides(updated);
    try {
      localStorage.setItem(HEATMAP_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    const stateLabel =
      nextState === 'mastered'
        ? 'أخضر زمردي (محفوظ ومتقن)'
        : nextState === 'needs_review'
        ? 'ذهبي (يحتاج مراجعة قريبة)'
        : 'أحمر (تفلت يحتاج تثبيتاً عاجلاً)';
    showToast(`تم تحديث سورة ${surahName} إلى: ${stateLabel}`, 'info');
  };

  // Word-linked Voice Correction Note
  const [wordVoiceNotes, setWordVoiceNotes] = useState<WordVoiceCorrectionNote[]>(
    () => {
      try {
        const raw = localStorage.getItem(WORD_VOICE_NOTES_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
      return [
        {
          id: 'wv-1',
          studentId: 'st-1',
          studentName: 'عبد الرحمن أحمد',
          surahId: 67,
          surahName: 'الملك',
          ayahNumber: 2,
          wordText: 'لِيَبْلُوَكُمْ',
          teacherTip: 'انتبه لقلقلة الباء الساكنة مع ضم اللام وفتح الواو دون إشباع.',
          createdAt: todayStr,
        },
        {
          id: 'wv-2',
          studentId: 'st-1',
          studentName: 'عبد الرحمن أحمد',
          surahId: 73,
          surahName: 'المزمل',
          ayahNumber: 4,
          wordText: 'وَرَتِّلِ',
          teacherTip: 'تشديد التاء المكسورة مع ترقيق اللام عند الوصل.',
          createdAt: todayStr,
        },
      ];
    }
  );
  const [voiceNoteSurahId, setVoiceNoteSurahId] = useState<number>(
    activeStudent?.currentStop.surahId || 67
  );
  const [voiceNoteAyah, setVoiceNoteAyah] = useState<number>(
    activeStudent?.currentStop.ayah || 1
  );
  const [voiceNoteWord, setVoiceNoteWord] = useState<string>('لِيَبْلُوَكُمْ');
  const [voiceNoteTip, setVoiceNoteTip] = useState<string>(
    'تحقيق قلقلة الحرف الساكن وإتمام الحركة الإعرابية'
  );
  const [isRecording3Sec, setIsRecording3Sec] = useState<boolean>(false);
  const [recordedWordAudioUrl, setRecordedWordAudioUrl] = useState<
    string | undefined
  >(undefined);
  const wordRecorderRef = useRef<MediaRecorder | null>(null);

  const handleRecord3SecWordNote = async () => {
    if (isRecording3Sec && wordRecorderRef.current) {
      wordRecorderRef.current.stop();
      setIsRecording3Sec(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedWordAudioUrl(String(reader.result || ''));
          showToast(
            'تم تسجيل النطق الصحيح للكلمة (3 ثوانٍ)؛ جاهز للحفظ في مصحف الطالب',
            'success'
          );
        };
        reader.readAsDataURL(blob);
      };
      wordRecorderRef.current = recorder;
      recorder.start();
      setIsRecording3Sec(true);
      window.setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording3Sec(false);
        }
      }, 3500);
    } catch {
      showToast(
        'تم ربط النطق الصحيح للكلمة بتلاوة الشيخ الحصري تلقائياً',
        'info'
      );
    }
  };

  const handleSaveWordVoiceNote = () => {
    if (!activeStudent || !voiceNoteWord.trim()) return;
    const surahObj = SURAHS.find((s) => s.id === voiceNoteSurahId) || SURAHS[66];
    const newNote: WordVoiceCorrectionNote = {
      id: `wv-${Date.now()}`,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      surahId: surahObj.id,
      surahName: surahObj.name,
      ayahNumber: voiceNoteAyah,
      wordText: voiceNoteWord.trim(),
      teacherTip: voiceNoteTip.trim() || 'استمع لنطق الشيخ وكرر الكلمة 3 مرات',
      createdAt: todayStr,
      audioDataUrl: recordedWordAudioUrl,
    };
    const nextList = [newNote, ...wordVoiceNotes];
    setWordVoiceNotes(nextList);
    try {
      localStorage.setItem(WORD_VOICE_NOTES_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // ignore
    }
    setRecordedWordAudioUrl(undefined);
    showToast(
      `تم تثبيت التعليق الصوتي فوق كلمة ﴿${newNote.wordText}﴾ في مصحف الطالب ${activeStudent.name}`,
      'success'
    );
  };

  const playWordCorrectionAudio = (note: WordVoiceCorrectionNote) => {
    const src =
      note.audioDataUrl ||
      getEveryAyahAudioUrl('Husary_128kbps', note.surahId, note.ayahNumber);
    const audio = new Audio(src);
    audio.play().catch(() => {
      showToast('تعذر تشغيل الصوت في المتصفح الحالي', 'error');
    });
    showToast(
      `🔊 استماع لتصحيح الشيخ لكلمة ﴿${note.wordText}﴾ — ${note.teacherTip}`,
      'info'
    );
  };

  // One-click WhatsApp Circle Call
  const [selectedCallCircleId, setSelectedCallCircleId] = useState<string>(
    circles[0]?.id || ''
  );
  const [circleRoomUrl, setCircleRoomUrl] = useState<string>(
    'https://meet.google.com/imam-quran-halqa'
  );

  // ============================================================================
  // 3. Student Portal Innovations: Smart Repetition Memorizer & Ghiras Al-Jannah
  // ============================================================================
  const [repSurahId, setRepSurahId] = useState<number>(
    activeStudent?.currentStop.surahId || 67
  );
  const [repFromAyah, setRepFromAyah] = useState<number>(1);
  const [repToAyah, setRepToAyah] = useState<number>(5);
  const [repCountPerAyah, setRepCountPerAyah] = useState<number>(3);
  const [repPauseSeconds, setRepPauseSeconds] = useState<number>(3);
  const [repReciter, setRepReciter] = useState<ReciterId>('Husary_128kbps');
  const [repVerses, setRepVerses] = useState<AyahEntry[]>([]);
  const [repPlayingAyah, setRepPlayingAyah] = useState<number | null>(null);
  const [repCurrentIteration, setRepCurrentIteration] = useState<number>(1);
  const [repIsShadowPause, setRepIsShadowPause] = useState<boolean>(false);
  const repAudioRef = useRef<HTMLAudioElement | null>(null);
  const repTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    loadSurahVerses(repSurahId).then((loaded) => {
      if (!mounted) return;
      setRepVerses(
        loaded.filter((v) => v.ayah >= repFromAyah && v.ayah <= repToAyah)
      );
    });
    return () => {
      mounted = false;
    };
  }, [repSurahId, repFromAyah, repToAyah]);

  const stopSmartMemorizer = () => {
    if (repAudioRef.current) {
      repAudioRef.current.pause();
    }
    if (repTimeoutRef.current) {
      window.clearTimeout(repTimeoutRef.current);
      repTimeoutRef.current = null;
    }
    setRepPlayingAyah(null);
    setRepIsShadowPause(false);
    setRepCurrentIteration(1);
  };

  const startSmartMemorizerAyah = (ayahNum: number, iter = 1) => {
    stopSmartMemorizer();
    setRepPlayingAyah(ayahNum);
    setRepCurrentIteration(iter);
    const url = getEveryAyahAudioUrl(repReciter, repSurahId, ayahNum);
    const audio = new Audio(url);
    repAudioRef.current = audio;

    audio.onended = () => {
      setRepIsShadowPause(true);
      repTimeoutRef.current = window.setTimeout(() => {
        setRepIsShadowPause(false);
        if (iter < repCountPerAyah) {
          startSmartMemorizerAyah(ayahNum, iter + 1);
        } else if (ayahNum < repToAyah) {
          startSmartMemorizerAyah(ayahNum + 1, 1);
        } else {
          stopSmartMemorizer();
          if (activeStudent) {
            addStudentXp(activeStudent.id, 15);
          }
          showToast(
            'ما شاء الله! أتممت دورة التكرار الصوتي الذكي وتمت إضافة +15 نقطة همة لرصيدك',
            'success'
          );
        }
      }, repPauseSeconds * 1000);
    };

    audio.play().catch(() => {
      stopSmartMemorizer();
    });
  };

  useEffect(() => {
    return () => {
      stopSmartMemorizer();
      if (quoteAudioRef.current) {
        quoteAudioRef.current.pause();
      }
    };
  }, []);

  // ============================================================================
  // 4. Guardian & Supervisor Innovations: Friday Summary + Sibling Wallet + Circle Quality + QR Sanad
  // ============================================================================
  const fridaySummary = useMemo(() => {
    const st = activeStudent || students[0];
    if (!st) {
      return {
        masteredThisWeek: 'سورة الملك (الآيات 1 - 15) بتقدير ممتاز',
        wordsToWatch: ['لِيَبْلُوَكُمْ', 'فُطُورٍ', 'تَمَيَّزُ'],
        fridayFamilyWird: 'قراءة سورة الكهف جماعياً + مراجعة سورة الملك والمرسلات',
      };
    }
    const stSessions = sessions.filter((s) => s.studentId === st.id);
    const latestSession = stSessions[0];
    const masteredText = latestSession?.newMemorization?.enabled
      ? `سورة ${latestSession.newMemorization.surahName} (من آية ${latestSession.newMemorization.fromAyah} إلى ${latestSession.newMemorization.toAyah}) بتقدير ${latestSession.grade}`
      : `سورة ${st.currentStop.surahName} (تثبيت حتى الآية ${st.currentStop.ayah}) — إتقان ${st.masteryScore}%`;

    const recentErrorWords = stSessions
      .flatMap((s) => s.errors)
      .map((e) => e.word)
      .filter((w): w is string => Boolean(w))
      .slice(0, 4);

    return {
      masteredThisWeek: masteredText,
      wordsToWatch:
        recentErrorWords.length > 0
          ? recentErrorWords
          : ['لِيَبْلُوَكُمْ (قلقلة الباء)', 'وَرَتِّلِ (ترقيق اللام)', 'الصِّرَاطَ (تفخيم الصاد)'],
      fridayFamilyWird: `تلاوة سورة الكهف + تسميع عائلي لسورة ${st.currentStop.surahName} (15 دقيقة بعد صلاة الجمعة)`,
    };
  }, [activeStudent, students, sessions]);

  // Unified Sibling Family Group for active student's guardian
  const familySiblingsGroup = useMemo(() => {
    if (!activeStudent) return students.slice(0, 2);
    const cleanPhone = (activeStudent.guardianPhone || '').replace(/\D/g, '');
    const matches = students.filter(
      (s) =>
        s.id === activeStudent.id ||
        (cleanPhone.length >= 7 &&
          (s.guardianPhone || '').replace(/\D/g, '').includes(cleanPhone.slice(-7))) ||
        s.guardianName === activeStudent.guardianName
    );
    return matches.length > 1 ? matches : students.slice(0, 2);
  }, [activeStudent, students]);

  // Monthly Circle Quality Indicator
  const circleQualityMetrics = useMemo(() => {
    return circles.map((circle) => {
      const circleStudents = students.filter((s) => s.circle === circle.name);
      const circleStudentIds = new Set(circleStudents.map((s) => s.id));
      const circleSessions = sessions.filter((s) =>
        circleStudentIds.has(s.studentId)
      );
      const attended = circleSessions.filter((s) => s.status === 'حضر');
      const attendanceRate =
        circleSessions.length > 0
          ? Math.round((attended.length / circleSessions.length) * 100)
          : 94;
      const avgMastery =
        circleStudents.length > 0
          ? Math.round(
              circleStudents.reduce((sum, s) => sum + s.masteryScore, 0) /
                circleStudents.length
            )
          : 92;
      const farReviewCount = attended.filter((s) => s.farReview?.enabled).length;
      const farReviewStability =
        attended.length > 0
          ? Math.min(100, Math.max(78, Math.round((farReviewCount / attended.length) * 100) + 15))
          : 89;

      return {
        id: circle.id,
        name: circle.name,
        schedule: `${circle.days} • ${circle.time}`,
        studentsCount: circleStudents.length,
        attendanceRate,
        avgMastery,
        farReviewStability,
        overallQualityScore: Math.round(
          (attendanceRate + avgMastery + farReviewStability) / 3
        ),
      };
    });
  }, [circles, students, sessions]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hero Banner: واحة الإيمان — Calm Emerald Green (#145a3a) & Heritage Gold (#c59b27) */}
      <section className="rounded-3xl bg-gradient-to-l from-[#145a3a] via-[#114b30] to-[#0d3b25] text-white p-6 md:p-8 border-2 border-[#c59b27]/50 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/15 pb-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c59b27]/20 border border-[#dfbd69]/40 text-[#dfbd69] text-xs font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>واحة الإيمان والربط الروحي والتربوي بالقرآن الكريم</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                واحة الإيمان — بالقرآن نحيا ونرتقي
              </h1>
              <p className="text-xs md:text-sm text-emerald-100/90 max-w-3xl leading-relaxed">
                مساحة إيمانية هادئة تجمع بين إشراقة الآيات اليومية، وعداد إنجازات الأكاديمية الحي، وأدوات التطوير الشاملة للبوابات الأربع (المحفظ، الطالب، ولي الأمر، والمشرف العام).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleIncrementPageToday}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>سجّل صفحة حفظتها أو تلوتها اليوم (+1)</span>
              </button>

              {!embeddedMode && (
                <button
                  type="button"
                  onClick={() => setActiveTab('smartboard')}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-2 cursor-pointer transition"
                >
                  <BookOpen className="w-4 h-4 text-[#dfbd69]" />
                  <span>فتح السبورة القرآنية الذكية</span>
                </button>
              )}
            </div>
          </div>

          {/* Daily Curated Quranic Quote Card inside Hero */}
          <div className="rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] text-[#14281d] dark:text-[#e9f2ec] p-5 md:p-6 border-2 border-[#c59b27]/60 shadow-inner space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
                📖 إشراقة الآية اليومية — سورة {activeQuote.surahName} (آية{' '}
                {activeQuote.ayahNumber})
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayQuoteVerse}
                  className="px-3 py-1.5 min-h-[38px] rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  {playingQuoteAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>إيقاف التلاوة</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>استمع للآية بصوت الحصري</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedQuoteIndex(
                      (prev) => (prev + 1) % DAILY_QURAN_QUOTES.length
                    )
                  }
                  className="px-3 py-1.5 min-h-[38px] rounded-xl bg-[#c59b27]/20 hover:bg-[#c59b27]/30 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold cursor-pointer"
                >
                  إشراقة قرآنية أخرى ⬅
                </button>
              </div>
            </div>

            <div className="py-3 px-4 rounded-2xl bg-emerald-950/5 dark:bg-emerald-950/40 border border-[#c59b27]/30 text-center">
              <p className="font-quran text-2xl md:text-3xl leading-loose text-[#145a3a] dark:text-[#dfbd69] font-bold">
                ﴿ {activeQuote.ayahText} ﴾
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/80 dark:border-emerald-900/50 space-y-1">
                <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  💡 {activeQuote.reflectionTitle}
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {activeQuote.reflectionBody}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/80 dark:border-emerald-900/50 space-y-1">
                <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  🌿 من بشائر السنة النبوية لأهل القرآن
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {activeQuote.hadithText}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-900/5 dark:bg-emerald-950/50 border border-[#c59b27]/40 flex flex-col justify-between gap-2">
                <div>
                  <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    🤍 تجديد النية قبل بدء التلاوة والحفظ
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mt-1">
                    {activeQuote.intentionPrompt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIntentionRenewedToday(true);
                    if (activeStudent) {
                      addStudentXp(activeStudent.id, 10);
                    }
                    showToast(
                      'بارك الله في نيتك! تقبل الله تلاوتك وحفظك وجعله خالصاً لوجهه الكريم',
                      'success'
                    );
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    intentionRenewedToday
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69]'
                  }`}
                >
                  {intentionRenewedToday
                    ? '✓ تم تجديد النية اليوم — تقبل الله منك'
                    : 'جدّدت نيتي لله الآن (+10 نقاط همة)'}
                </button>
              </div>
            </div>
          </div>

          {/* Live Academy Achievements Counter (عداد إنجازات الأكاديمية الحي) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl bg-white/10 backdrop-blur-xs p-4 border border-[#dfbd69]/35">
              <div className="flex items-center justify-between text-xs text-emerald-100 font-bold">
                <span>صفحات تم حفظها ومراجعتها اليوم</span>
                <BookOpen className="w-4 h-4 text-[#dfbd69]" />
              </div>
              <div className="text-3xl font-black text-[#dfbd69] font-mono tabular-nums mt-1.5">
                {academyAchievements.totalPagesMemorizedToday}
              </div>
              <div className="text-[11px] text-emerald-100/80 mt-1">
                أي ما يعادل {academyAchievements.todayAyat} آية قرآنية مباركة اليوم
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-xs p-4 border border-[#dfbd69]/35">
              <div className="flex items-center justify-between text-xs text-emerald-100 font-bold">
                <span>إجمالي الأجزاء والسور المتقنة</span>
                <Award className="w-4 h-4 text-[#dfbd69]" />
              </div>
              <div className="text-3xl font-black text-white font-mono tabular-nums mt-1.5">
                {academyAchievements.totalCumulativeJuz} جزءاً
              </div>
              <div className="text-[11px] text-emerald-100/80 mt-1">
                و {academyAchievements.totalCumulativeSurahs} سورة محفوظة لدى الطلاب
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-xs p-4 border border-[#dfbd69]/35">
              <div className="flex items-center justify-between text-xs text-emerald-100 font-bold">
                <span>الحلقات القرآنية والطلاب النشطون</span>
                <Users className="w-4 h-4 text-[#dfbd69]" />
              </div>
              <div className="text-3xl font-black text-white font-mono tabular-nums mt-1.5">
                {academyAchievements.activeCirclesCount} حلقات
              </div>
              <div className="text-[11px] text-emerald-100/80 mt-1">
                يشارك فيها {academyAchievements.activeStudentsCount} طالباً وطالبة بانتظام
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-xs p-4 border border-[#dfbd69]/35">
              <div className="flex items-center justify-between text-xs text-emerald-100 font-bold">
                <span>عداد الحسنات والوقف القرآني</span>
                <Heart className="w-4 h-4 text-[#dfbd69]" />
              </div>
              <div className="text-2xl md:text-3xl font-black text-[#dfbd69] font-mono tabular-nums mt-1.5">
                {academyAchievements.estimatedHasanat.toLocaleString('ar-EG')}+
              </div>
              <div className="text-[11px] text-emerald-100/80 mt-1">
                حرفاً وحسنة مضاعفة في ميزان القراء والواقفين
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean 4-Tab Bar + Active Student Selector */}
      <div className="rounded-2xl bg-[#fcfaf2] dark:bg-[#12231a] p-3 border border-[#c59b27]/40 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              {
                id: 'spiritual_counter' as const,
                label: '١. الأوسمة المعنوية وتاج الوقار',
                icon: Crown,
              },
              {
                id: 'teacher_innovations' as const,
                label: '٢. بوابة المحفظ (خريطة 114 سورة + تصحيح صوتي)',
                icon: Mic,
              },
              {
                id: 'student_tahfeez' as const,
                label: '٣. بوابة الطالب (مُحفّظ التكرار + غراس الجنة)',
                icon: Repeat,
              },
              {
                id: 'family_supervisor' as const,
                label: '٤. ملخص الجمعة العائلي وجودة الحلقات والـ QR',
                icon: Shield,
              },
            ]
          ).map((t) => {
            const Icon = t.icon;
            const active = activeOasisTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveOasisTab(t.id)}
                className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                  active
                    ? 'bg-[#145a3a] text-[#dfbd69] shadow-xs'
                    : 'bg-white dark:bg-[#0b1711] text-neutral-700 dark:text-neutral-200 hover:border-[#145a3a] border border-neutral-200 dark:border-emerald-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Student Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#145a3a] dark:text-[#dfbd69]">
            الطالب المختار:
          </span>
          <select
            value={activeStudent?.id || ''}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-2 min-h-[42px] rounded-xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/50 text-xs font-extrabold text-[#14281d] dark:text-white cursor-pointer"
          >
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.circle})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: الأوسمة المعنوية وبشارة تاج الوقار وربط القلوب بالقرآن
      ===================================================================== */}
      {activeOasisTab === 'spiritual_counter' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Perseverance & Spiritual Badges */}
          <div className="lg:col-span-2 rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-6 border border-[#c59b27]/40 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c59b27]/30 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#c59b27]" />
                  <span>أوسمة المجاهدة والمواظبة والربط النفسي بالقرآن</span>
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  تكريم الطالب على صبره ومواظبته ومجاهدته في تصحيح التلاوة عملاً بحديث «الذي يقرأ القرآن ويتتعتع فيه له أجران».
                </p>
              </div>
              {activeStudent && (
                <span className="px-3 py-1 rounded-full bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
                  أوسمة {activeStudent.name}: {(activeStudent.badges || []).length}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {[
                {
                  badgeName: 'وسام المجتهد الصابر (أجران)',
                  desc: 'يُمنح للطالب الذي يجاهد نفسه في ضبط مخارج الحروف ويكرر الآية حتى يتقنها.',
                  xp: 25,
                },
                {
                  badgeName: 'تاج المواظبة وحسن الأدب',
                  desc: 'يُمنح للطالب المنتظم في حضور الحلقة مبكراً والمحافظ على أذكار وأدب التلاوة.',
                  xp: 30,
                },
                {
                  badgeName: 'فارس المراجعة الثابتة',
                  desc: 'يُمنح للطالب الذي يحافظ على ورده اليومي من المراجعة البعيدة دون انقطاع.',
                  xp: 35,
                },
              ].map((b) => (
                <div
                  key={b.badgeName}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/40 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#c59b27]/20 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-extrabold">
                        +{b.xp} نقطة همة
                      </span>
                      <Star className="w-4 h-4 text-[#c59b27] fill-[#c59b27]" />
                    </div>
                    <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
                      {b.badgeName}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {b.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeStudent) return;
                      awardStudentBadge(activeStudent.id, b.badgeName);
                      addStudentXp(activeStudent.id, b.xp);
                    }}
                    className="w-full py-2 min-h-[42px] rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer transition"
                  >
                    منح الوسام للطالب ({activeStudent?.name})
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Crown of Dignity for Parents (بشارة تاج الكرامة للوالدين) */}
          <div className="rounded-3xl bg-gradient-to-b from-[#145a3a] to-[#0e3f28] text-white p-6 border-2 border-[#c59b27] shadow-md flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c59b27] text-[#14281d] text-xs font-extrabold">
                <Crown className="w-4 h-4" />
                <span>بشارة تاج الوقار والكرامة للوالدين</span>
              </div>
              <h3 className="text-lg font-extrabold text-[#dfbd69]">
                إهداء ثواب الإتقان للوالدين الكريمين
              </h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                عند إتمام الطالب لسورة جديدة أو جزء مبارك، تبعث الأكاديمية بطاقة تهنئة روحية باسم الطالب إلى والديه تذكرهما بحديث تاج الوقار يوم القيامة.
              </p>

              {activeStudent && (
                <div className="p-3.5 rounded-2xl bg-black/25 border border-[#dfbd69]/30 text-xs space-y-1">
                  <div className="font-extrabold text-[#dfbd69]">
                    الطالب: {activeStudent.name}
                  </div>
                  <div className="text-emerald-100">
                    ولي الأمر: {activeStudent.guardianName}
                  </div>
                  <div className="text-emerald-200">
                    المحفوظ الحالي: {activeStudent.memorizedSurahs.length} سورة •{' '}
                    {activeStudent.memorizedJuz.length} أجزاء
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {activeStudent && (
                <button
                  type="button"
                  onClick={() => toggleStudentGoldenCrown(activeStudent.id)}
                  className="w-full py-2.5 min-h-[44px] rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>
                    {activeStudent.hasGoldenCrown
                      ? 'حامل تاج الإتقان الذهبي ✓'
                      : 'تتويج الطالب بتاج الإتقان الذهبي'}
                  </span>
                </button>
              )}

              {activeStudent && (
                <a
                  href={`https://wa.me/${(activeStudent.guardianPhone || OFFICIAL_ACADEMY_WHATSAPP).replace(/\D/g, '')}?text=${encodeURIComponent(
                    `👑 بشارة تاج الكرامة والوقار من «${settings.academyName}»:\nهنيئاً للوالد الكريم (${activeStudent.guardianName}) ما أنجزه ابنكم المبارك (${activeStudent.name}) في حفظ ومراجعة كتاب الله (سورة ${activeStudent.currentStop.surahName}). جعل الله القرآن العظيم تاج نور ووقار لكم يوم القيامة!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال بطاقة البشارة لولي الأمر عبر واتساب</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: تطوير بوابة المحفظ (خريطة 114 سورة + التعليق الصوتي + نداء الحلقة)
      ===================================================================== */}
      {activeOasisTab === 'teacher_innovations' && (
        <div className="space-y-6">
          {/* 1. 114-Surah Memorization Heatmap */}
          <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-6 border border-[#c59b27]/45 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#c59b27]/30 pb-4">
              <div>
                <h2 className="text-base md:text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#c59b27]" />
                  <span>
                    خريطة حرارة الإتقان للمصحف الشريف (114 سورة) — للطالب:{' '}
                    {activeStudent?.name}
                  </span>
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  اضغط على أي سورة لتبديل حالتها اللونية بين: (أخضر زمردي: محفوظ ومتقن • ذهبي: يحتاج مراجعة قريبة • أحمر: تفلت يحتاج تثبيتاً عاجلاً).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all' as const, label: 'كل السور (114)' },
                    {
                      id: 'mastered' as const,
                      label: '🟢 محفوظ ومتقن',
                    },
                    {
                      id: 'needs_review' as const,
                      label: '🟡 يحتاج مراجعة قريبة',
                    },
                    {
                      id: 'urgent' as const,
                      label: '🔴 يحتاج تثبيتاً عاجلاً',
                    },
                  ]
                ).map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setHeatmapFilter(flt.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                      heatmapFilter === flt.id
                        ? 'bg-[#145a3a] text-[#dfbd69]'
                        : 'bg-white dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-emerald-900'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-80 overflow-y-auto p-1">
              {SURAHS.filter((surah) => {
                if (!activeStudent || heatmapFilter === 'all') return true;
                return (
                  getStudentSurahHeatState(
                    activeStudent.id,
                    surah.id,
                    surah.name
                  ) === heatmapFilter
                );
              }).map((surah) => {
                const state = activeStudent
                  ? getStudentSurahHeatState(
                      activeStudent.id,
                      surah.id,
                      surah.name
                    )
                  : 'needs_review';
                const badgeStyle =
                  state === 'mastered'
                    ? 'bg-[#145a3a] text-white border-[#c59b27]/50'
                    : state === 'urgent'
                    ? 'bg-red-600 text-white border-red-300'
                    : 'bg-[#c59b27]/20 text-[#14281d] dark:text-[#dfbd69] border-[#c59b27]/60';
                return (
                  <button
                    key={surah.id}
                    type="button"
                    onClick={() => handleCycleSurahHeatState(surah.id, surah.name)}
                    className={`p-2 rounded-xl border text-center transition hover:scale-105 cursor-pointer ${badgeStyle}`}
                    title={`سورة ${surah.name} — انقر لتغيير درجة الإتقان`}
                  >
                    <div className="text-[10px] font-mono opacity-80">
                      #{surah.id}
                    </div>
                    <div className="text-xs font-extrabold truncate">
                      {surah.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Word-Linked Voice Note + One-Click WhatsApp Circle Call */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Word-Linked Voice Correction */}
            <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-6 border border-[#c59b27]/45 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Mic className="w-5 h-5 text-[#c59b27]" />
                  <span>التعليق الصوتي المربوط بالكلمة القرآنية (3 ثوانٍ)</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  سجّل نطق الكلمة الصحيح ليظهر كعلامة صوتية فوق الكلمة في مصحف الطالب بالمنزل.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block font-bold mb-1">السورة</label>
                  <select
                    value={voiceNoteSurahId}
                    onChange={(e) => setVoiceNoteSurahId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-bold"
                  >
                    {SURAHS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}. سورة {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">رقم الآية</label>
                  <input
                    type="number"
                    min={1}
                    max={286}
                    value={voiceNoteAyah}
                    onChange={(e) =>
                      setVoiceNoteAyah(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">الكلمة القرآنية</label>
                  <input
                    type="text"
                    value={voiceNoteWord}
                    onChange={(e) => setVoiceNoteWord(e.target.value)}
                    placeholder="مثال: لِيَبْلُوَكُمْ"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-quran text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  ملاحظة التجويد المرفقة مع الصوت:
                </label>
                <input
                  type="text"
                  value={voiceNoteTip}
                  onChange={(e) => setVoiceNoteTip(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRecord3SecWordNote()}
                  className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer ${
                    isRecording3Sec
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-[#c59b27] text-[#14281d]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {isRecording3Sec
                      ? 'جارٍ تسجيل النطق (3 ثوانٍ)...'
                      : '🎙️ تسجيل نطق الكلمة (3 ثوانٍ)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveWordVoiceNote}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#dfbd69]" />
                  <span>تثبيت العلامة الصوتية فوق الكلمة</span>
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#c59b27]/30 max-h-48 overflow-y-auto">
                {wordVoiceNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-2xl bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        🔊 ﴿{note.wordText}﴾ — سورة {note.surahName} (آية{' '}
                        {note.ayahNumber})
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-300 text-[11px] mt-0.5">
                        {note.teacherTip}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => playWordCorrectionAudio(note)}
                      className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>سماع النطق</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* One-Click WhatsApp Circle Call */}
            <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-6 border border-[#c59b27]/45 shadow-xs flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#c59b27]" />
                  <span>نداء الحلقة الجماعي بضغطة واحدة (قبل الموعد بـ 15 دقيقة)</span>
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  يرسل تذكيراً موحداً عبر واتساب لطلاب الحلقة المختارة مع رابط الغرفة الصوتية/المرئية المباشر.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block font-bold mb-1">اختر الحلقة القرآنية:</label>
                    <select
                      value={selectedCallCircleId}
                      onChange={(e) => setSelectedCallCircleId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-extrabold"
                    >
                      {circles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.days} — {c.time})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">
                      رابط الغرفة الصوتية / Google Meet / Zoom:
                    </label>
                    <input
                      type="text"
                      value={circleRoomUrl}
                      onChange={(e) => setCircleRoomUrl(e.target.value)}
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const chosenCircle =
                  circles.find((c) => c.id === selectedCallCircleId) || circles[0];
                const circleMembers = students.filter(
                  (s) => s.circle === chosenCircle?.name
                );
                const messageText = `🌿 نداء الحلقة القرآنية من «${settings.academyName}»:\nالسلام عليكم ورحمة الله وبركاته، تذكير لطلاب (${chosenCircle?.name || 'حلقة الإتقان'}) بأن موعد الحلقة يبدأ بعد 15 دقيقة (${chosenCircle?.time || ''}) بإذن الله مع ${settings.teacherName}.\n🔗 رابط الدخول المباشر للغرفة الصوتية:\n${circleRoomUrl}\nنسأل الله لكم فتحاً وتوفيقاً وبركة في الحفظ!`;

                return (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/40 text-xs space-y-1">
                      <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        معاينة رسالة النداء الجماعي ({circleMembers.length} طلاب):
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                        {messageText}
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}?text=${encodeURIComponent(
                        messageText
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        showToast(
                          `تم تجهيز نداء الحلقة الجماعي لـ ${chosenCircle?.name || 'الحلقة'} عبر واتساب`,
                          'success'
                        )
                      }
                      className="w-full py-3 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>إرسال نداء الحلقة الجماعي الآن عبر واتساب</span>
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: تطوير بوابة الطالب (مُحفّظ التكرار الصوتي الذكي + غراس الجنة)
      ===================================================================== */}
      {activeOasisTab === 'student_tahfeez' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Smart Audio Repetition Memorizer */}
          <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-6 border border-[#c59b27]/45 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#c59b27]/30 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-[#c59b27]" />
                  <span>مُحفّظ التكرار الصوتي الذكي (مع سكتة الترديد خلف القارئ)</span>
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  حدّد نطاق الآيات وعدد مرات التكرار وزمن السكتة ليردد الطالب الآية غيباً خلف الشيخ.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="col-span-2">
                <label className="block font-bold mb-1">السورة</label>
                <select
                  value={repSurahId}
                  onChange={(e) => {
                    setRepSurahId(Number(e.target.value));
                    setRepFromAyah(1);
                    setRepToAyah(5);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-bold"
                >
                  {SURAHS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}. سورة {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">من آية</label>
                <input
                  type="number"
                  min={1}
                  value={repFromAyah}
                  onChange={(e) =>
                    setRepFromAyah(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">إلى آية</label>
                <input
                  type="number"
                  min={repFromAyah}
                  value={repToAyah}
                  onChange={(e) =>
                    setRepToAyah(
                      Math.max(repFromAyah, Number(e.target.value) || repFromAyah)
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block font-bold mb-1">القارئ المعلم</label>
                <select
                  value={repReciter}
                  onChange={(e) => setRepReciter(e.target.value as ReciterId)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-bold"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">تكرار كل آية</label>
                <select
                  value={repCountPerAyah}
                  onChange={(e) => setRepCountPerAyah(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-bold"
                >
                  {[2, 3, 5, 7, 10].map((cnt) => (
                    <option key={cnt} value={cnt}>
                      {cnt} مرات لكل آية
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">سكتة الترديد خلف القارئ</label>
                <select
                  value={repPauseSeconds}
                  onChange={(e) => setRepPauseSeconds(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-900 font-bold"
                >
                  {[2, 3, 4, 6, 8].map((sec) => (
                    <option key={sec} value={sec}>
                      {sec} ثوانٍ للترديد
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {repPlayingAyah === null ? (
                <button
                  type="button"
                  onClick={() => startSmartMemorizerAyah(repFromAyah, 1)}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>بدء جلسة التكرار والترديد الصوتي الذكي</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopSmartMemorizer}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>إيقاف التكرار ({repCurrentIteration}/{repCountPerAyah})</span>
                </button>
              )}

              {repIsShadowPause && (
                <span className="px-3 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold animate-pulse">
                  🎙️ دورك الآن: ردّد الآية بصوتك ({repPauseSeconds} ثوانٍ)...
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto p-1">
              {repVerses.map((v) => {
                const isActive = repPlayingAyah === v.ayah;
                return (
                  <div
                    key={v.ayah}
                    onClick={() => startSmartMemorizerAyah(v.ayah, 1)}
                    className={`p-3 rounded-2xl border transition cursor-pointer ${
                      isActive
                        ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-sm'
                        : 'bg-white dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span className={isActive ? 'text-[#dfbd69]' : 'text-[#145a3a] dark:text-[#dfbd69]'}>
                        الآية ({v.ayah})
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded bg-[#c59b27] text-[#14281d] font-extrabold">
                          التكرار {repCurrentIteration} من {repCountPerAyah}
                        </span>
                      )}
                    </div>
                    <p className="font-quran text-lg leading-loose">
                      {v.text} ﴿{v.ayah}﴾
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ghiras Al-Jannah — Lanterns of the 30 Juz */}
          <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-6 border border-[#c59b27]/45 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#c59b27]/30 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#c59b27]" />
                  <span>رحلة «غراس الجنة» — قناديل الأجزاء الثلاثين المضيئة</span>
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  كل جزء يتقنه الطالب يُضيء قنديلاً ذهبياً في شجرة نوره القرآنية.
                </p>
              </div>
              {activeStudent && (
                <span className="px-3 py-1 rounded-full bg-[#c59b27]/25 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold">
                  {activeStudent.memorizedJuz.length} / 30 قنديلاً مضيئاً
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
              {Array.from({ length: 30 }, (_, idx) => 30 - idx).map((juzNum) => {
                const isLit =
                  activeStudent?.memorizedJuz.includes(juzNum) || juzNum === 30;
                return (
                  <div
                    key={juzNum}
                    className={`p-3 rounded-2xl border text-center transition ${
                      isLit
                        ? 'bg-gradient-to-b from-[#145a3a] to-[#0f442b] text-[#dfbd69] border-[#c59b27] shadow-xs'
                        : 'bg-white dark:bg-[#0b1711] text-neutral-400 border-neutral-200 dark:border-emerald-900/40'
                    }`}
                  >
                    <div className="text-base">{isLit ? '🏮' : '🕯️'}</div>
                    <div className="text-xs font-extrabold mt-1">
                      جزء {juzNum}
                    </div>
                    <div className="text-[10px] opacity-85">
                      {isLit ? 'مضيء ومتقن' : 'في الطريق'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: ملخص الجمعة العائلي + الملف العائلي للأشقاء + جودة الحلقات + السند بـ QR
      ===================================================================== */}
      {activeOasisTab === 'family_supervisor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Weekly Friday Family Summary Card */}
            <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/50 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#c59b27]/30 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                    <CalendarCheckIcon />
                    <span>بطاقة «ملخص الجمعة العائلي» لولي الأمر ({activeStudent?.guardianName})</span>
                  </h2>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                    تقرير أسبوعي مبسط في 3 نقاط واضحة يربط الأسرة بمسيرة ابنها القرآنية.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1711] border border-emerald-600/30">
                  <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    ١. ما أتقنه الابن هذا الأسبوع بحمد الله:
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-200 mt-1 font-semibold">
                    {fridaySummary.masteredThisWeek}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/40">
                  <div className="font-extrabold text-amber-800 dark:text-[#dfbd69]">
                    ٢. الكلمات والأحكام التي تحتاج تنبيهاً لطيفاً في البيت:
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {fridaySummary.wordsToWatch.map((w, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-[#c59b27]/20 text-[#14281d] dark:text-[#dfbd69] font-quran text-sm font-bold"
                      >
                        ﴿{w}﴾
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1711] border border-[#145a3a]/30">
                  <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    ٣. ورد المراجعة العائلي المقترح ليوم الجمعة:
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-200 mt-1 font-semibold">
                    {fridaySummary.fridayFamilyWird}
                  </p>
                </div>
              </div>

              <a
                href={`https://wa.me/${(activeStudent?.guardianPhone || OFFICIAL_ACADEMY_WHATSAPP).replace(/\D/g, '')}?text=${encodeURIComponent(
                  `🕌 بطاقة «ملخص الجمعة العائلي» من ${settings.academyName} للطالب (${activeStudent?.name}):\n1️⃣ ما أتقنه هذا الأسبوع: ${fridaySummary.masteredThisWeek}\n2️⃣ كلمات تحتاج تنبيهاً: ${fridaySummary.wordsToWatch.join(' ، ')}\n3️⃣ ورد الجمعة العائلي: ${fridaySummary.fridayFamilyWird}\nجمعة مباركة عامرة بذكر الله وتلاوة كتابه!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 min-h-[44px] rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال بطاقة ملخص الجمعة لولي الأمر عبر واتساب</span>
              </a>
            </div>

            {/* 2. Unified Sibling Family File & QR Verified Sanad */}
            <div className="space-y-4">
              {/* Unified Sibling Switcher & Family Receipt */}
              <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-5 border border-[#c59b27]/45 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#c59b27]" />
                    <span>الملف العائلي الموحد للأشقاء وإيصال السداد الموحد</span>
                  </h3>
                  <span className="text-[11px] font-bold text-neutral-500">
                    {familySiblingsGroup.length} أبناء مرتبطين
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {familySiblingsGroup.map((sib) => (
                    <button
                      key={sib.id}
                      type="button"
                      onClick={() => setSelectedStudentId(sib.id)}
                      className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                        sib.id === activeStudent?.id
                          ? 'bg-[#145a3a] text-white border-[#c59b27]'
                          : 'bg-white dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{sib.name}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        {sib.circle} • {sib.memorizedJuz.length} أجزاء
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Verified Sanad & Ijazah Card */}
              <div className="rounded-3xl bg-gradient-to-l from-[#145a3a] to-[#0e3f28] text-white p-5 border-2 border-[#c59b27] shadow-xs flex items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c59b27] text-[#14281d] text-[11px] font-extrabold">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>نظام السند والإجازات الموثقة بـ QR</span>
                  </div>
                  <h3 className="text-sm md:text-base font-extrabold text-[#dfbd69]">
                    شهادة إتمام الأجزاء والسند الرقمي الموثق
                  </h3>
                  <p className="text-xs text-emerald-100">
                    كود التحقق الرقمي للشهادة:{' '}
                    <span className="font-mono font-bold text-[#dfbd69]">
                      WLQ-SANAD-{activeStudent?.id.toUpperCase() || 'ST1'}-2025
                    </span>{' '}
                    • إجمالي الإجازات الموثقة: {ijazahs.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('exams')}
                    className="mt-1 px-3.5 py-1.5 rounded-xl bg-white text-[#145a3a] text-xs font-extrabold cursor-pointer"
                  >
                    فتح سجل السند والإجازات والطباعة الرسمية
                  </button>
                </div>

                <div className="w-20 h-20 rounded-2xl bg-white p-2 flex flex-col items-center justify-center text-[#14281d] shrink-0 border-2 border-[#c59b27]">
                  <QrCode className="w-12 h-12 text-[#145a3a]" />
                  <span className="text-[8px] font-mono font-black mt-0.5">
                    VERIFIED QR
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Monthly Circle Quality Indicator */}
          <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-6 border border-[#c59b27]/45 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c59b27]/30 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#c59b27]" />
                  <span>مؤشر جودة الحلقات الشهري (لبوابة المشرف العام والمالك)</span>
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  مقارنة هادئة وموضوعية بين الحلقات من حيث: نسبة انتظام الحضور، متوسط الإتقان الأسبوعي، وثبات المراجعة البعيدة.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {circleQualityMetrics.map((cq) => (
                <div
                  key={cq.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        {cq.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {cq.schedule} • {cq.studentsCount} طلاب
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-[#145a3a] text-[#dfbd69] font-mono text-xs font-black">
                      {cq.overallQualityScore}%
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 dark:text-neutral-300">
                        انتظام الحضور:
                      </span>
                      <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                        {cq.attendanceRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 dark:text-neutral-300">
                        متوسط الإنجاز والإتقان:
                      </span>
                      <span className="font-mono font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        {cq.avgMastery}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 dark:text-neutral-300">
                        ثبات المراجعة البعيدة:
                      </span>
                      <span className="font-mono font-extrabold text-amber-700 dark:text-amber-400">
                        {cq.farReviewStability}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CalendarCheckIcon: React.FC = () => (
  <CheckCircle2 className="w-5 h-5 text-[#c59b27]" />
);

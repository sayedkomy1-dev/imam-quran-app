import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  X,
  Volume2,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Mic,
  Square,
  Upload,
  Eye,
  EyeOff,
  ArrowLeftRight,
  MapPin,
  Layers,
  GitCompare,
  ChevronDown,
} from 'lucide-react';
import {
  SURAHS,
  RECITERS,
  loadSurahVerses,
  getEveryAyahAudioUrl,
  getWordMeaningAndTafsir,
  resolveJuzOrHizbToSurahRange,
  AyahEntry,
} from '../data/quranData';
import { getSurahThematicBlocks } from '../data/educationalInnovationsData';
import { useAcademy } from '../context/AcademyContext';
import {
  RecitationError,
  ErrorCategoryGroup,
  ErrorContext,
  ErrorType,
  ReciterId,
} from '../types';

export interface QuranTextModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionContext?: ErrorContext;
  context?: ErrorContext;
  initialSurahId?: number;
  surahId?: number;
  initialSurahName?: string;
  initialFromAyah?: number;
  fromAyah?: number;
  initialToAyah?: number;
  toAyah?: number;
  initialJuz?: number;
  initialJuzScope?: string;
  studentId?: string;
  studentName?: string;
  onApplyRange?: (
    surahId: number,
    surahName: string,
    fromAyah: number,
    toAyah: number
  ) => void;
  onUpdateRange?: (surahId: number, fromAyah: number, toAyah: number) => void;
  onRecordError?: (
    error: Omit<RecitationError, 'id'> & {
      surahId?: number;
      note?: string;
    }
  ) => void;
  existingErrors?: RecitationError[];
  memorizationAudioDataUrl?: string;
  memorizationAudioName?: string;
  onSaveMemorizationAudio?: (dataUrl: string, fileName: string) => void;
}

const ERROR_CATEGORIES: {
  group: ErrorCategoryGroup;
  label: string;
  mappedErrorType: ErrorType;
  subTypes: string[];
}[] = [
  {
    group: 'حفظ',
    label: 'حفظ وتسميع',
    mappedErrorType: 'حفظ',
    subTypes: [
      'نسيان كلمة',
      'تردد وتوقف',
      'إبدال كلمة',
      'زيادة أو نقص',
      'خلط متشابهات',
    ],
  },
  {
    group: 'تجويد',
    label: 'تجويد وأحكام',
    mappedErrorType: 'تجويد',
    subTypes: [
      'ترك غنة',
      'نقص مد',
      'ترك قلقلة',
      'إظهار في موضع إدغام',
      'تفخيم المرقق أو عكسه',
    ],
  },
  {
    group: 'حروف',
    label: 'مخارج وصفات الحروف',
    mappedErrorType: 'تجويد',
    subTypes: [
      'مخرج حرف غير دقيق',
      'ضعف همس أو جهر',
      'إمالة غير صحيحة',
      'خلط حرفين متقاربين',
    ],
  },
  {
    group: 'ضبط',
    label: 'ضبط وتشكيل ووقف',
    mappedErrorType: 'تشكيل',
    subTypes: [
      'لحن جلي في الحركة',
      'تسكين المتحرك',
      'وقف قبيح يغير المعنى',
      'ابتداء غير مناسب',
    ],
  },
];

const PROGRESSIVE_BATCH_SIZE = 25;

export const QuranTextModal: React.FC<QuranTextModalProps> = ({
  isOpen,
  open,
  onClose,
  sectionTitle,
  sectionContext,
  context,
  initialSurahId,
  surahId,
  initialSurahName,
  initialFromAyah,
  fromAyah: propFromAyah,
  initialToAyah,
  toAyah: propToAyah,
  initialJuz,
  initialJuzScope = 'full',
  studentId,
  studentName,
  onApplyRange,
  onUpdateRange,
  onRecordError,
  existingErrors = [],
  memorizationAudioDataUrl,
  memorizationAudioName,
  onSaveMemorizationAudio,
}) => {
  const {
    students,
    selectedStudentId,
    linkStudentStopToAyah,
    addStudentCustomMutashabih,
  } = useAcademy();

  const modalOpen = Boolean(isOpen ?? open);
  const effectiveContext: ErrorContext = sectionContext || context || 'التسميع';
  const activeStudent =
    students.find((s) => s.id === (studentId || selectedStudentId)) ||
    students.find((s) => s.name === studentName) ||
    students[0];

  const resolveDefaultRange = () => {
    const effSurahId = initialSurahId ?? surahId;
    const effFrom = initialFromAyah ?? propFromAyah;
    const effTo = initialToAyah ?? propToAyah;

    if (effSurahId && SURAHS.some((s) => s.id === effSurahId)) {
      const s = SURAHS.find((x) => x.id === effSurahId)!;
      const f = effFrom && effFrom > 0 ? effFrom : 1;
      const t =
        effTo && effTo >= f
          ? Math.min(s.ayahs, effTo)
          : Math.min(s.ayahs, f + 9);
      return { surahId: s.id, from: f, to: t };
    }
    if (initialSurahName && SURAHS.some((s) => s.name === initialSurahName)) {
      const s = SURAHS.find((x) => x.name === initialSurahName)!;
      const f = effFrom && effFrom > 0 ? effFrom : 1;
      const t =
        effTo && effTo >= f
          ? Math.min(s.ayahs, effTo)
          : Math.min(s.ayahs, f + 9);
      return { surahId: s.id, from: f, to: t };
    }
    if (initialJuz && initialJuz >= 1 && initialJuz <= 30) {
      const resolved = resolveJuzOrHizbToSurahRange(initialJuz, initialJuzScope);
      return {
        surahId: resolved.surahId,
        from: resolved.fromAyah,
        to: resolved.toAyah,
      };
    }
    return { surahId: 1, from: 1, to: 7 };
  };

  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(7);
  const [showContextAyahs, setShowContextAyahs] = useState<boolean>(true);
  const [hideWordsMode, setHideWordsMode] = useState<boolean>(false);
  const [showThematicMap, setShowThematicMap] = useState<boolean>(true);
  const [selectionClickMode, setSelectionClickMode] = useState<
    'none' | 'start' | 'end'
  >('none');

  // Progressive Loading State for Long Surahs
  const [visibleAyahLimit, setVisibleAyahLimit] = useState<number>(
    PROGRESSIVE_BATCH_SIZE
  );
  const [browseFullSurahMode, setBrowseFullSurahMode] =
    useState<boolean>(false);

  const [verses, setVerses] = useState<AyahEntry[]>([]);
  const [loadingVerses, setLoadingVerses] = useState<boolean>(false);

  // Audio playback state
  const [selectedReciterId, setSelectedReciterId] =
    useState<ReciterId>('Husary_128kbps');
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sheikh voice recording state
  const [isRecordingSheikh, setIsRecordingSheikh] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Active Word Inspection & Error Recording State
  const [inspectedWord, setInspectedWord] = useState<{
    word: string;
    wordIndex: number;
    ayahEntry: AyahEntry;
  } | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<ErrorCategoryGroup>('حفظ');
  const [selectedSubType, setSelectedSubType] = useState<string>('نسيان كلمة');
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [correctedInSession, setCorrectedInSession] = useState<boolean>(true);
  const [errorNote, setErrorNote] = useState<string>('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Custom Student Mutashabihat Builder State (بطاقات متشابهاتي الخاصة للطالب)
  const [mutashabihBuilderOpen, setMutashabihBuilderOpen] = useState(false);
  const [similarSurahId, setSimilarSurahId] = useState<number>(2);
  const [similarAyahNum, setSimilarAyahNum] = useState<number>(1);
  const [similarAyahText, setSimilarAyahText] = useState<string>('');
  const [diffHighlightWord, setDiffHighlightWord] = useState<string>('');
  const [dabitRule, setDabitRule] = useState<string>('');

  useEffect(() => {
    if (modalOpen) {
      const def = resolveDefaultRange();
      setSelectedSurahId(def.surahId);
      setFromAyah(def.from);
      setToAyah(def.to);
      setVisibleAyahLimit(PROGRESSIVE_BATCH_SIZE);
      setBrowseFullSurahMode(false);
      setInspectedWord(null);
      setSelectionClickMode('none');
    }
  }, [
    modalOpen,
    initialSurahId,
    surahId,
    initialSurahName,
    initialFromAyah,
    propFromAyah,
    initialToAyah,
    propToAyah,
    initialJuz,
    initialJuzScope,
  ]);

  const currentSurah =
    SURAHS.find((s) => s.id === selectedSurahId) || SURAHS[0];
  const thematicBlocks = getSurahThematicBlocks(selectedSurahId);

  const minDisplayAyah = browseFullSurahMode
    ? 1
    : showContextAyahs
    ? Math.max(1, fromAyah - 1)
    : fromAyah;
  const maxDisplayAyah = browseFullSurahMode
    ? currentSurah.ayahs
    : showContextAyahs
    ? Math.min(currentSurah.ayahs, toAyah + 1)
    : toAyah;

  // Progressive effective end Ayah so long Surahs (e.g. Al-Baqarah 286) load progressively
  const progressiveMaxAyah = Math.min(
    maxDisplayAyah,
    minDisplayAyah + visibleAyahLimit - 1
  );
  const hasMoreAyahsToLoad = progressiveMaxAyah < maxDisplayAyah;

  useEffect(() => {
    if (!modalOpen) return;
    let active = true;
    setLoadingVerses(true);
    loadSurahVerses(selectedSurahId, minDisplayAyah, progressiveMaxAyah).then(
      (res) => {
        if (!active) return;
        setVerses(res);
        setLoadingVerses(false);
      }
    );
    return () => {
      active = false;
    };
  }, [modalOpen, selectedSurahId, minDisplayAyah, progressiveMaxAyah]);

  // Load similar Ayah text automatically when building a custom mutashabih card
  useEffect(() => {
    if (!mutashabihBuilderOpen) return;
    let active = true;
    loadSurahVerses(similarSurahId, similarAyahNum, similarAyahNum).then(
      (res) => {
        if (!active) return;
        if (res[0]) {
          setSimilarAyahText(res[0].text);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [mutashabihBuilderOpen, similarSurahId, similarAyahNum]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!modalOpen) return null;

  const notifyParentRangeChange = (
    sId: number,
    sName: string,
    fAyah: number,
    tAyah: number
  ) => {
    if (onApplyRange) {
      onApplyRange(sId, sName, fAyah, tAyah);
    }
    if (onUpdateRange) {
      onUpdateRange(sId, fAyah, tAyah);
    }
  };

  const playAyahAudio = (ayahNum: number) => {
    if (playingAyahNumber === ayahNum && audioRef.current) {
      audioRef.current.pause();
      setPlayingAyahNumber(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const url = getEveryAyahAudioUrl(
      selectedReciterId,
      selectedSurahId,
      ayahNum
    );
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAyahNumber(ayahNum);
    audio.play().catch(() => {
      setPlayingAyahNumber(null);
    });
    audio.onended = () => setPlayingAyahNumber(null);
  };

  const handleStartSheikhRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string' && onSaveMemorizationAudio) {
            onSaveMemorizationAudio(
              reader.result,
              `تلقين_الشيخ_${currentSurah.name}_${fromAyah}_${toAyah}.webm`
            );
            setFeedbackToast(
              'تم حفظ تسجيل صوت الشيخ وإرفاقه بملف الحصة بنجاح'
            );
            setTimeout(() => setFeedbackToast(null), 3000);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingSheikh(true);
    } catch {
      setFeedbackToast('تعذر الوصول للميكروفون، يمكنك رفع ملف صوتي جاهز');
      setTimeout(() => setFeedbackToast(null), 3000);
    }
  };

  const handleStopSheikhRecording = () => {
    if (mediaRecorderRef.current && isRecordingSheikh) {
      mediaRecorderRef.current.stop();
      setIsRecordingSheikh(false);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSaveMemorizationAudio) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onSaveMemorizationAudio(reader.result, file.name);
        setFeedbackToast(`تم إرفاق الملف الصوتي (${file.name}) بنجاح`);
        setTimeout(() => setFeedbackToast(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSetStartDirect = (ayahNum: number) => {
    const nextFrom = ayahNum;
    const nextTo = Math.max(ayahNum, toAyah);
    setFromAyah(nextFrom);
    setToAyah(nextTo);
    setSelectionClickMode('none');
    notifyParentRangeChange(
      currentSurah.id,
      currentSurah.name,
      nextFrom,
      nextTo
    );
    setFeedbackToast(
      `📍 تم تحديد بداية النطاق من الآية (${nextFrom}) وتحديث حقول التكليف تلقائياً`
    );
    setTimeout(() => setFeedbackToast(null), 2200);
  };

  const handleSetEndDirect = (ayahNum: number) => {
    const nextFrom = Math.min(fromAyah, ayahNum);
    const nextTo = Math.max(fromAyah, ayahNum);
    setFromAyah(nextFrom);
    setToAyah(nextTo);
    setSelectionClickMode('none');
    notifyParentRangeChange(
      currentSurah.id,
      currentSurah.name,
      nextFrom,
      nextTo
    );
    setFeedbackToast(
      `🏁 تم تحديد نهاية النطاق إلى الآية (${nextTo}) وتحديث حقول التكليف تلقائياً`
    );
    setTimeout(() => setFeedbackToast(null), 2200);
  };

  const handleAyahBadgeClick = (ayahNum: number) => {
    if (selectionClickMode === 'start') {
      handleSetStartDirect(ayahNum);
    } else if (selectionClickMode === 'end') {
      handleSetEndDirect(ayahNum);
    } else {
      handleSetEndDirect(ayahNum);
    }
  };

  const handleLinkStudentStopHere = (ayahNum: number) => {
    if (!activeStudent) return;
    linkStudentStopToAyah(activeStudent.id, currentSurah.id, ayahNum);
    setFeedbackToast(
      `📌 تم ربط موضع توقف الطالب (${activeStudent.name}) بسورة ${currentSurah.name} — الآية (${ayahNum})`
    );
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleApplyRangeClick = () => {
    notifyParentRangeChange(
      currentSurah.id,
      currentSurah.name,
      fromAyah,
      toAyah
    );
    setFeedbackToast(
      `تم اعتماد النطاق (سورة ${currentSurah.name}: من ${fromAyah} إلى ${toAyah}) في خانات الحصة`
    );
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleSaveCustomMutashabih = () => {
    if (!activeStudent || !inspectedWord) return;
    const simSurah =
      SURAHS.find((s) => s.id === similarSurahId) || SURAHS[0];
    addStudentCustomMutashabih(activeStudent.id, {
      surahAName: currentSurah.name,
      ayahANumber: inspectedWord.ayahEntry.ayah,
      ayahAText: inspectedWord.ayahEntry.text,
      surahBName: simSurah.name,
      ayahBNumber: similarAyahNum,
      ayahBText:
        similarAyahText ||
        `سورة ${simSurah.name} الآية (${similarAyahNum})`,
      diffHighlightWord: diffHighlightWord.trim() || inspectedWord.word,
      dabitRule:
        dabitRule.trim() ||
        `اربط كلمة «${inspectedWord.word}» في سورة ${currentSurah.name} بسياق المقطع.`,
    });
    setMutashabihBuilderOpen(false);
    setFeedbackToast(
      `تم حفظ بطاقة «متشابهاتي الخاصة» في ملف الطالب (${activeStudent.name}) وبوابته`
    );
    setTimeout(() => setFeedbackToast(null), 2800);
  };

  const handleConfirmRecordError = () => {
    if (!inspectedWord || !onRecordError) return;
    const catConfig =
      ERROR_CATEGORIES.find((c) => c.group === selectedCategory) ||
      ERROR_CATEGORIES[0];
    const compositeKey = `${currentSurah.name}_${inspectedWord.ayahEntry.ayah}_${inspectedWord.wordIndex}_${selectedCategory}`;

    onRecordError({
      type: catConfig.mappedErrorType,
      context: effectiveContext,
      surahId: currentSurah.id,
      surah: currentSurah.name,
      ayah: inspectedWord.ayahEntry.ayah,
      word: inspectedWord.word,
      wordIndex: inspectedWord.wordIndex,
      letter: selectedLetter || undefined,
      category: selectedCategory,
      subType: selectedSubType,
      correctedInSession,
      followUpStatus: correctedInSession ? 'needs_review' : 'open',
      repeatCount: 1,
      compositeKey,
      tajweedRule:
        selectedCategory === 'تجويد' || selectedCategory === 'حروف'
          ? selectedSubType
          : undefined,
      note:
        errorNote.trim() ||
        `${selectedSubType}${selectedLetter ? ` (حرف: ${selectedLetter})` : ''}`,
      timestamp: new Date().toISOString().slice(0, 10),
    });

    setFeedbackToast(
      `تم تسجيل الملاحظة على كلمة «${inspectedWord.word}» وربطها بملف الطالب`
    );
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const wordDetails = inspectedWord
    ? getWordMeaningAndTafsir(
        inspectedWord.word,
        inspectedWord.ayahEntry,
        currentSurah.name
      )
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-950 via-slate-900 to-slate-900 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  مكون المصحف الموحد والخرائط الموضوعية والتسميع الذكي
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {sectionTitle}
                </span>
                {activeStudent && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    📌 توقف {activeStudent.name}: سورة{' '}
                    {activeStudent.currentStop.surahName} (آية{' '}
                    {activeStudent.currentStop.ayah})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                اختر البداية والنهاية بالنقر المباشر على الآيات، أو اختر مقطعاً موضوعياً، أو اربط موضع توقف الطالب بأي آية بضغطة واحدة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedbackToast && (
          <div className="bg-emerald-900/90 border-b border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Controls Bar: Two-way Range Sync + Visual Start/End Picker + Link Student Stop + Audio Controls */}
        <div className="bg-slate-950/70 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSurahId}
              onChange={(e) => {
                const id = Number(e.target.value);
                const s = SURAHS.find((x) => x.id === id) || SURAHS[0];
                const nextTo = Math.min(s.ayahs, 15);
                setSelectedSurahId(id);
                setFromAyah(1);
                setToAyah(nextTo);
                setVisibleAyahLimit(PROGRESSIVE_BATCH_SIZE);
                notifyParentRangeChange(id, s.name, 1, nextTo);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
            >
              {SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. سورة {s.name} ({s.ayahs} آية)
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1">
              <span className="text-[11px] text-slate-400">من آية:</span>
              <input
                type="number"
                min={1}
                max={currentSurah.ayahs}
                value={fromAyah}
                onChange={(e) => {
                  const val = Math.max(
                    1,
                    Math.min(currentSurah.ayahs, Number(e.target.value) || 1)
                  );
                  const nextTo = Math.max(val, toAyah);
                  setFromAyah(val);
                  setToAyah(nextTo);
                  notifyParentRangeChange(
                    currentSurah.id,
                    currentSurah.name,
                    val,
                    nextTo
                  );
                }}
                className="w-12 bg-slate-800 text-amber-300 font-bold text-xs text-center rounded py-0.5"
              />
              <span className="text-[11px] text-slate-400">إلى:</span>
              <input
                type="number"
                min={fromAyah}
                max={currentSurah.ayahs}
                value={toAyah}
                onChange={(e) => {
                  const val = Math.max(
                    fromAyah,
                    Math.min(currentSurah.ayahs, Number(e.target.value) || 1)
                  );
                  setToAyah(val);
                  notifyParentRangeChange(
                    currentSurah.id,
                    currentSurah.name,
                    fromAyah,
                    val
                  );
                }}
                className="w-12 bg-slate-800 text-amber-300 font-bold text-xs text-center rounded py-0.5"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectionClickMode(
                  selectionClickMode === 'start' ? 'none' : 'start'
                )
              }
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                selectionClickMode === 'start'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-amber-300 border-slate-700 hover:border-amber-500/50'
              }`}
            >
              📍 تحديد البداية بالنقر
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectionClickMode(
                  selectionClickMode === 'end' ? 'none' : 'end'
                )
              }
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                selectionClickMode === 'end'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-amber-300 border-slate-700 hover:border-amber-500/50'
              }`}
            >
              🏁 تحديد النهاية بالنقر
            </button>

            {activeStudent && (
              <button
                type="button"
                onClick={() => handleLinkStudentStopHere(toAyah)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-pointer"
                title="ربط موضع توقف الطالب الحالي بنهاية هذا النطاق"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>ربط الطالب بالآية ({toAyah})</span>
              </button>
            )}

            {(onApplyRange || onUpdateRange) && (
              <button
                type="button"
                onClick={handleApplyRangeClick}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>اعتماد النطاق للحصة</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowThematicMap((p) => !p)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition cursor-pointer ${
                showThematicMap
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>الخريطة الموضوعية</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBrowseFullSurahMode((p) => !p);
                setVisibleAyahLimit(PROGRESSIVE_BATCH_SIZE);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                browseFullSurahMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="استعراض السورة كاملة مع التحميل التدريجي لاختيار أي آية بصرياً"
            >
              {browseFullSurahMode ? 'عرض النطاق فقط' : 'استعراض السورة كاملة'}
            </button>

            <button
              type="button"
              onClick={() => setShowContextAyahs(!showContextAyahs)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                showContextAyahs
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              سياق الوقف
            </button>

            <button
              type="button"
              onClick={() => setHideWordsMode(!hideWordsMode)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition cursor-pointer ${
                hideWordsMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {hideWordsMode ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              <span>{hideWordsMode ? 'إظهار الكلمات' : 'إخفاء للاختبار'}</span>
            </button>

            <select
              value={selectedReciterId}
              onChange={(e) =>
                setSelectedReciterId(e.target.value as ReciterId)
              }
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-semibold"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  🎧 {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. Surah Thematic Blocks Bar (الخرائط الموضوعية للسور لتحديد مواضع الوقف المعنوي والربط الذهني) */}
        {showThematicMap && thematicBlocks.length > 0 && (
          <div className="bg-slate-900/95 px-4 py-3 border-b border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <span>
                  🗺️ الخرائط الموضوعية لسورة {currentSurah.name} (وفق التفسير الميسر المعتمد):
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px]">
                  يساعد الشيخ في تحديد مواضع الوقف المعنوي والطالب في الحفظ بالربط
                </span>
              </div>
              <span className="text-slate-400 font-semibold">
                ({thematicBlocks.length} مقاطع موضوعية مقترحة — انقر لاعتماد المقطع)
              </span>
            </div>
            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5">
              {thematicBlocks.map((blk, idx) => {
                const isSelectedBlock =
                  fromAyah === blk.fromAyah && toAyah === blk.toAyah;
                return (
                  <button
                    key={blk.id}
                    type="button"
                    onClick={() => {
                      setFromAyah(blk.fromAyah);
                      setToAyah(blk.toAyah);
                      notifyParentRangeChange(
                        currentSurah.id,
                        currentSurah.name,
                        blk.fromAyah,
                        blk.toAyah
                      );
                      setFeedbackToast(
                        `تم اعتماد المقطع الموضوعي «${blk.title}» (الآيات ${blk.fromAyah} إلى ${blk.toAyah}) — موضع وقف معنوي مكتمل`
                      );
                      setTimeout(() => setFeedbackToast(null), 2600);
                    }}
                    className={`shrink-0 p-3 rounded-xl border text-right transition cursor-pointer w-72 flex flex-col justify-between ${
                      isSelectedBlock
                        ? 'bg-emerald-950/80 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50'
                        : 'bg-slate-950/90 border-slate-800 hover:border-amber-500/40 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs font-bold text-amber-300">
                        <span className="truncate">
                          {idx + 1}. {blk.title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] font-mono shrink-0">
                          الآيات ({blk.fromAyah}-{blk.toAyah})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                        📖 {blk.summary}
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-800/80 space-y-1">
                      <div className="text-[10px] text-emerald-300 font-semibold">
                        💡 ربط الحفظ: {blk.mentalLinkTip}
                      </div>
                      {blk.meaningfulStopHint && (
                        <div className="text-[10px] text-amber-300/90 font-semibold">
                          🛑 الوقف المعنوي (آية {blk.toAyah}): {blk.meaningfulStopHint}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Body: Split between Interactive Quran Mushaf & Word Meaning / Tafsir / Error Inspector */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-800">
          {/* Quran Mushaf Area (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950">
            {selectionClickMode !== 'none' && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between">
                <span>
                  {selectionClickMode === 'start'
                    ? 'انقر الآن على أي آية لجعلها بداية النطاق وتحديث التكليف...'
                    : 'انقر الآن على أي آية لجعلها نهاية النطاق وتحديث التكليف...'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectionClickMode('none')}
                  className="text-amber-300 underline text-[11px] cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            )}

            <div className="bg-slate-950/90 border border-amber-500/20 rounded-2xl p-4 sm:p-5 shadow-inner">
              <div className="text-center border-b border-slate-800 pb-3 mb-4">
                <h4 className="font-quran text-xl sm:text-2xl font-bold text-amber-400">
                  سورة {currentSurah.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  النطاق المحدد: الآية ({fromAyah}) إلى الآية ({toAyah}) من أصل (
                  {currentSurah.ayahs}) آية • المعروض حالياً: ({verses.length} آية)
                </p>
              </div>

              {loadingVerses ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">
                  جارٍ تحميل الآيات بالرسم العثماني...
                </div>
              ) : (
                <div className="space-y-3.5 leading-loose">
                  {verses.map((verse) => {
                    const isInSelectedRange =
                      verse.ayah >= fromAyah && verse.ayah <= toAyah;
                    const isStartAyah = verse.ayah === fromAyah;
                    const isEndAyah = verse.ayah === toAyah;
                    const isStudentStop =
                      activeStudent?.currentStop.surahId === currentSurah.id &&
                      activeStudent?.currentStop.ayah === verse.ayah;
                    const words = verse.text.split(/\s+/).filter(Boolean);
                    const startingThematicBlock = thematicBlocks.find(
                      (b) => b.fromAyah === verse.ayah
                    );
                    const endingThematicBlock = thematicBlocks.find(
                      (b) => b.toAyah === verse.ayah
                    );

                    return (
                      <React.Fragment key={verse.ayah}>
                        {showThematicMap && startingThematicBlock && (
                          <div className="px-3.5 py-2 rounded-xl bg-gradient-to-l from-amber-500/15 via-emerald-950/40 to-slate-900 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <span>🧭 محور موضوعي ({startingThematicBlock.fromAyah} - {startingThematicBlock.toAyah}):</span>
                                <span className="text-white">{startingThematicBlock.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 mt-0.5">
                                {startingThematicBlock.summary} — <span className="text-emerald-300">{startingThematicBlock.mentalLinkTip}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFromAyah(startingThematicBlock.fromAyah);
                                setToAyah(startingThematicBlock.toAyah);
                                notifyParentRangeChange(
                                  currentSurah.id,
                                  currentSurah.name,
                                  startingThematicBlock.fromAyah,
                                  startingThematicBlock.toAyah
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-bold cursor-pointer shrink-0"
                            >
                              اعتماد هذا المقطع ({startingThematicBlock.fromAyah}-{startingThematicBlock.toAyah})
                            </button>
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-xl border transition ${
                            !isInSelectedRange
                              ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                              : isStartAyah || isEndAyah
                              ? 'bg-amber-950/20 border-amber-500/60 shadow-sm'
                              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/30'
                          }`}
                        >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAyahBadgeClick(verse.ayah)}
                              className={`px-2.5 py-0.5 rounded-md text-xs font-bold border transition cursor-pointer ${
                                selectionClickMode !== 'none'
                                  ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                                  : isStartAyah || isEndAyah
                                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                                  : isInSelectedRange
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                              title="انقر لتحديد الآية"
                            >
                              آية {verse.ayah}
                              {isStartAyah ? ' (البداية)' : ''}
                              {isEndAyah && !isStartAyah ? ' (النهاية)' : ''}
                            </button>

                            {/* Direct 1-click Start / End / Student Stop Link Pills */}
                            <button
                              type="button"
                              onClick={() => handleSetStartDirect(verse.ayah)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-700 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
                              title="اجعل هذه الآية بداية التكليف"
                            >
                              📍 بداية
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetEndDirect(verse.ayah)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-600 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
                              title="اجعل هذه الآية نهاية التكليف"
                            >
                              🏁 نهاية
                            </button>
                            {activeStudent && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleLinkStudentStopHere(verse.ayah)
                                }
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  isStudentStop
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-800 hover:bg-emerald-800 text-emerald-300'
                                }`}
                                title="ربط موضع توقف الطالب الحالي بهذه الآية"
                              >
                                {isStudentStop
                                  ? '📌 موضع توقف الطالب الحالي ✓'
                                  : '📌 ربط الطالب هنا'}
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => playAyahAudio(verse.ayah)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                              playingAyahNumber === verse.ayah
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300'
                            }`}
                          >
                            {playingAyahNumber === verse.ayah ? (
                              <>
                                <Pause className="w-3.5 h-3.5" />
                                <span>إيقاف</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" />
                                <span>استماع</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Words of the Ayah */}
                        <div className="font-quran text-xl sm:text-2xl text-slate-100 flex flex-wrap items-center gap-x-2 gap-y-2 leading-relaxed">
                          {words.map((word, wIdx) => {
                            const hasRecordedError = existingErrors.some(
                              (err) =>
                                err.surah === currentSurah.name &&
                                err.ayah === verse.ayah &&
                                (err.wordIndex === wIdx || err.word === word)
                            );
                            const isSelected =
                              inspectedWord?.ayahEntry.ayah === verse.ayah &&
                              inspectedWord?.wordIndex === wIdx;

                            return (
                              <button
                                key={`${verse.ayah}-${wIdx}`}
                                type="button"
                                onClick={() => {
                                  setInspectedWord({
                                    word,
                                    wordIndex: wIdx,
                                    ayahEntry: verse,
                                  });
                                  setSelectedLetter('');
                                  setDiffHighlightWord(word);
                                }}
                                className={`px-1.5 py-0.5 rounded-lg transition select-none cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-300'
                                    : hasRecordedError
                                    ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50 underline decoration-rose-400'
                                    : hideWordsMode && isInSelectedRange
                                    ? 'bg-slate-800 text-transparent hover:text-slate-200 border border-slate-700'
                                    : 'hover:bg-amber-500/15 hover:text-amber-300'
                                }`}
                              >
                                {word}
                              </button>
                            );
                          })}
                          <span className="text-amber-400 text-base font-sans mx-1">
                            ﴿{verse.ayah}﴾
                          </span>
                        </div>

                        {showThematicMap && endingThematicBlock && (
                          <div className="mt-2.5 pt-2 border-t border-emerald-500/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-300 font-semibold">
                            <span>
                              🛑 موضع وقف معنوي مقترح للشيخ (نهاية محور «{endingThematicBlock.title}»): {endingThematicBlock.meaningfulStopHint || 'اكتمال المعنى الموضوعي للمقطع.'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSetEndDirect(verse.ayah)}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold cursor-pointer"
                            >
                              🏁 اعتماد الوقف هنا (آية {verse.ayah})
                            </button>
                          </div>
                        )}
                      </div>
                      </React.Fragment>
                    );
                  })}

                  {/* Progressive Loading Trigger for Long Surahs */}
                  {hasMoreAyahsToLoad && (
                    <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleAyahLimit(
                            (prev) => prev + PROGRESSIVE_BATCH_SIZE
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <ChevronDown className="w-4 h-4" />
                        <span>
                          تحميل الدفعة التالية (+{PROGRESSIVE_BATCH_SIZE} آية) — متبقي{' '}
                          {maxDisplayAyah - progressiveMaxAyah} آية
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVisibleAyahLimit(currentSurah.ayahs)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        عرض كامل آيات السورة ({maxDisplayAyah})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sheikh Audio Attachment Bar inside Modal */}
            {onSaveMemorizationAudio && (
              <div className="mt-4 bg-slate-900 border border-emerald-500/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" />
                    <span>إرفاق صوت الحفظ والتلقين من الشيخ للطالب</span>
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    يمكن للشيخ تسجيل صوته مباشرة أو إرفاق ملف صوتي ليسمعه الطالب وولي الأمر في البوابة
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isRecordingSheikh ? (
                    <button
                      type="button"
                      onClick={handleStartSheikhRecording}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>تسجيل صوت الشيخ</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopSheikhRecording}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 animate-pulse cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>إيقاف وحفظ التسجيل</span>
                    </button>
                  )}

                  <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>رفع ملف صوتي</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                  </label>

                  {memorizationAudioDataUrl && (
                    <audio
                      controls
                      src={memorizationAudioDataUrl}
                      className="h-8 max-w-[180px]"
                      title={memorizationAudioName || 'تسجيل الشيخ المرفق'}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Inspector Column: Word Meaning + Ayah Tafsir + Custom Mutashabihat + Error Recording (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-950/90 flex flex-col justify-between gap-4 overflow-y-auto">
            {inspectedWord && wordDetails ? (
              <div className="space-y-4">
                {/* Word Meaning & Ayah Tafsir Card */}
                <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[11px] text-amber-400 font-bold">
                        الكلمة المختارة
                      </span>
                      <h4 className="font-quran text-2xl font-bold text-white mt-0.5">
                        « {inspectedWord.word} »
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-bold">
                        سورة {currentSurah.name} • آية{' '}
                        {inspectedWord.ayahEntry.ayah}
                      </span>
                      {activeStudent && (
                        <button
                          type="button"
                          onClick={() =>
                            setMutashabihBuilderOpen((prev) => !prev)
                          }
                          className="px-2.5 py-1 rounded-md bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="ربط هذه الآية بآية أخرى تشابهت على الطالب في بطاقة خاصة"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          <span>+ متشابهاتي الخاصة</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Direct Word Meaning */}
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3">
                    <div className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>معنى الكلمة وبيانها اللغوي:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {wordDetails.wordMeaning}
                    </p>
                  </div>

                  {/* Full Ayah Tafsir + Source */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-bold text-amber-300">
                        تفسير الآية الكريمة:
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {wordDetails.tafsirSource}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {wordDetails.ayahTafsir}
                    </p>
                    <div className="text-[11px] text-amber-200/80 pt-1 border-t border-slate-800/80">
                      <strong>تنبيه الأداء والتجويد:</strong>{' '}
                      {wordDetails.tajweedNote}
                    </div>
                  </div>
                </div>

                {/* 2. بطاقات «متشابهاتي الخاصة» للطالب (Personal Student Mutashabihat Card Builder) */}
                {mutashabihBuilderOpen && activeStudent && (
                  <div className="bg-purple-950/30 border border-purple-400/40 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-extrabold text-purple-200 flex items-center gap-1.5">
                        <GitCompare className="w-4 h-4 text-purple-300" />
                        <span>
                          ربط آيتين في «متشابهاتي الخاصة» للطالب ({activeStudent.name})
                        </span>
                      </h5>
                      <button
                        type="button"
                        onClick={() => setMutashabihBuilderOpen(false)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-purple-200 mb-1">
                          السورة المشابهة
                        </label>
                        <select
                          value={similarSurahId}
                          onChange={(e) =>
                            setSimilarSurahId(Number(e.target.value))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
                        >
                          {SURAHS.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.id}. سورة {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-purple-200 mb-1">
                          رقم الآية المشابهة
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={similarAyahNum}
                          onChange={(e) =>
                            setSimilarAyahNum(
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-center"
                        />
                      </div>
                    </div>

                    {similarAyahText && (
                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 font-quran text-sm text-amber-200">
                        ﴿{similarAyahText}﴾
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={diffHighlightWord}
                        onChange={(e) => setDiffHighlightWord(e.target.value)}
                        placeholder="موضع الاختلاف المميز (الكلمة الفارقة)..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={dabitRule}
                        onChange={(e) => setDabitRule(e.target.value)}
                        placeholder="ضابط التفرقة الذهني للطالب (مثال: اربط الواو بسورة...)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveCustomMutashabih}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold cursor-pointer"
                    >
                      حفظ في بطاقات «متشابهاتي الخاصة» بملف الطالب وبوابته
                    </button>
                  </div>
                )}

                {/* Detailed Word & Letter Error Recording Form */}
                {onRecordError && (
                  <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs sm:text-sm font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>تسجيل خطأ أو ملاحظة أداء على هذه الكلمة</span>
                      </h5>
                      <span className="text-[11px] text-slate-400">
                        يرتبط تلقائياً بملف الطالب
                      </span>
                    </div>

                    {/* Letter Picker inside the selected word */}
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        تحديد الحرف الدقيق داخل الكلمة (اختياري لمخارج الحروف والمدود):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedLetter('')}
                          className={`px-2 py-1 rounded text-xs font-bold border cursor-pointer ${
                            selectedLetter === ''
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          الكلمة كاملة
                        </button>
                        {Array.from(
                          inspectedWord.word.replace(/[^\u0621-\u064A]/g, '')
                        ).map((char, idx) => (
                          <button
                            key={`${char}-${idx}`}
                            type="button"
                            onClick={() => setSelectedLetter(char)}
                            className={`w-7 h-7 rounded text-sm font-bold border flex items-center justify-center cursor-pointer ${
                              selectedLetter === char
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-rose-400/50'
                            }`}
                          >
                            {char}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4 Main Error Category Groups */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {ERROR_CATEGORIES.map((cat) => (
                        <button
                          key={cat.group}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.group);
                            setSelectedSubType(cat.subTypes[0]);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border text-right transition cursor-pointer ${
                            selectedCategory === cat.group
                              ? 'bg-rose-500/20 text-rose-200 border-rose-500/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Sub-types for the chosen Category */}
                    <div className="flex flex-wrap gap-1.5">
                      {ERROR_CATEGORIES.find(
                        (c) => c.group === selectedCategory
                      )?.subTypes.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSelectedSubType(sub)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                            selectedSubType === sub
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>

                    {/* Corrected inside session toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold cursor-pointer bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        <input
                          type="checkbox"
                          checked={correctedInSession}
                          onChange={(e) =>
                            setCorrectedInSession(e.target.checked)
                          }
                          className="rounded accent-emerald-500"
                        />
                        <span>صُحح داخل الحصة ✓</span>
                      </label>
                    </div>

                    <input
                      type="text"
                      value={errorNote}
                      onChange={(e) => setErrorNote(e.target.value)}
                      placeholder="ملاحظة إضافية للشيخ أو تنبيه للطالب..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />

                    <button
                      type="button"
                      onClick={handleConfirmRecordError}
                      className="w-full py-2 rounded-xl bg-gradient-to-l from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                    >
                      تسجيل الخطأ وربطه بسجل متابعة الطالب
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
                <BookOpen className="w-10 h-10 text-amber-400/60 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">
                  اضغط على أي كلمة قرآنية في المصحف المقابل
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  سيظهر لك هنا فوراً معنى الكلمة الدقيق، وتفسير الآية الكريمة، مع إمكانية ربط الآية بـ «متشابهاتي الخاصة» للطالب أو تسجيل خطأ بالكلمة والحرف.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

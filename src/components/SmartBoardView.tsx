import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  AyahEntry,
  getEveryAyahAudioUrl,
  getWordMeaningAndTafsir,
  loadSurahVerses,
  RECITERS,
  SURAHS,
} from '../data/quranData';
import { QuranTextModal } from './QuranTextModal';
import {
  QURAN_RIWAYAT_GUIDE,
  getSurahThematicBlocks,
} from '../data/educationalInnovationsData';
import {
  findMutashabihatForWordOrAyah,
  MAKHARIJ_GUIDE,
  MUTASHABIHAT_DB,
  MutashabihatEntry,
  TAJWEED_RULES_GUIDE,
  TAJWEED_STANDARD_COLORS,
} from '../data/smartSuiteData';
import { MakharijTajweedView } from './MakharijTajweedView';
import { getLocalDateString } from '../data/seedData';
import {
  HYBRID_FOUNDATION_LEVELS,
} from '../data/hybridFoundationData';
import {
  ErrorContext,
  ErrorType,
  FoundationLevelNumber,
  GradeType,
  RecitationError,
  ReciterId,
  SmartBoardStroke,
} from '../types';
import {
  AlertTriangle,
  ArrowUpLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardCheck,
  Clock,
  Compass,
  Download,
  Eraser,
  EyeOff,
  GitCompare,
  Highlighter,
  ImagePlus,
  Maximize2,
  Mic,
  Minimize2,
  Monitor,
  Pause,
  PenTool,
  PhoneCall,
  Play,
  Redo2,
  Repeat,
  RotateCcw,
  RotateCw,
  Save,
  Search,
  Send,
  Share2,
  Sparkles,
  Square,
  Trash2,
  Undo2,
  Upload,
  UserCheck,
  Video,
  Volume2,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

type DrawToolMode =
  | 'none'
  | 'pen'
  | 'calligraphy'
  | 'highlighter'
  | 'laser'
  | 'circle'
  | 'arrow'
  | 'eraser';

type MemoryMaskMode =
  | 'off'
  | 'all_hidden'
  | 'first_word_only'
  | 'hide_endings'
  | 'blur_hover';

type BoardDisplayMode =
  | 'quran_text'
  | 'imported_image'
  | 'split_view'
  | 'split_foundation';

type BoardPaperPattern = 'plain' | 'ruled' | 'grid';

interface BoardStampAnnotation {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
}

interface ImportedBoardImage {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

interface WordAnnotationItem {
  wordKey: string;
  surahId: number;
  ayah: number;
  wordText: string;
  tagType: 'error' | 'mutashabihat' | 'tajweed';
  errorCategory?: ErrorType;
  tajweedRule?: string;
  context?: ErrorContext;
  color: string;
  note: string;
}

interface LaserTrailPoint {
  x: number;
  y: number;
  createdAt: number;
}

const TAJWEED_EVALUATION_PRESETS: {
  id: string;
  label: string;
  tajweedRule: string;
  errorCategory: ErrorType;
  color: string;
}[] = [
  {
    id: 'madd',
    label: 'أحكام المدود (طبيعي/متصل/منفصل/لازم)',
    tajweedRule: 'أحكام المدود',
    errorCategory: 'تجويد',
    color: '#ea580c',
  },
  {
    id: 'ghunnah',
    label: 'غنة / إخفاء / إدغام / إظهار',
    tajweedRule: 'أحكام النون والميم والغنة',
    errorCategory: 'تجويد',
    color: '#16a34a',
  },
  {
    id: 'qalqalah',
    label: 'قلقلة / تفخيم وترقيق',
    tajweedRule: 'القلقلة والتفخيم والترقيق',
    errorCategory: 'تجويد',
    color: '#2563eb',
  },
  {
    id: 'makhraj',
    label: 'مخرج الحرف وصفته',
    tajweedRule: 'مخارج الحروف والصفات',
    errorCategory: 'تجويد',
    color: '#0d9488',
  },
  {
    id: 'hifz',
    label: 'خطأ حفظ / نسيان الكلمة',
    tajweedRule: 'ضبط الحفظ',
    errorCategory: 'حفظ',
    color: '#dc2626',
  },
  {
    id: 'tashkeel',
    label: 'تنبيه تشكيل / حركة إعرابية',
    tajweedRule: 'ضبط التشكيل وأواخر الكلم',
    errorCategory: 'تشكيل',
    color: '#ca8a04',
  },
];

type ColorCategoryKey =
  | 'all'
  | 'madd'
  | 'ghunnah'
  | 'qalqalah'
  | 'makhraj'
  | 'hifz'
  | 'tashkeel'
  | 'mutashabihat';

const COLOR_CODING_CATEGORIES: {
  id: ColorCategoryKey;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
}[] = [
  {
    id: 'all',
    label: 'جميع التصنيفات اللونية',
    shortLabel: 'الكل',
    color: '#145a3a',
    description: 'عرض كافة الكلمات والتصنيفات اللونية على السبورة',
  },
  {
    id: 'hifz',
    label: 'الأحمر: ضبط الحفظ والنسيان',
    shortLabel: 'حفظ ونسيان',
    color: '#dc2626',
    description: 'الكلمات التي تردد فيها الطالب أو نسيها أثناء التسميع',
  },
  {
    id: 'madd',
    label: 'البرتقالي: أحكام المدود',
    shortLabel: 'المدود',
    color: '#ea580c',
    description: 'المد الطبيعي، المتصل، المنفصل، البدل، والمد اللازم',
  },
  {
    id: 'ghunnah',
    label: 'الأخضر: الغنة وأحكام النون والميم',
    shortLabel: 'غنة وإخفاء',
    color: '#16a34a',
    description: 'مواضع الغنة، الإخفاء الحقيقي والشفوي، والإدغام بغنة',
  },
  {
    id: 'qalqalah',
    label: 'الأزرق: القلقلة والتفخيم',
    shortLabel: 'قلقلة وتفخيم',
    color: '#2563eb',
    description: 'حروف القلقلة (قطب جد) وحروف الاستعلاء والتفخيم',
  },
  {
    id: 'tashkeel',
    label: 'الذهبي: التشكيل وأواخر الكلم',
    shortLabel: 'تشكيل وإعراب',
    color: '#ca8a04',
    description: 'ضبط الحركات الإعرابية وأواخر الكلمات القرآنية',
  },
  {
    id: 'mutashabihat',
    label: 'البنفسجي: المتشابهات القرآنية',
    shortLabel: 'المتشابهات',
    color: '#7c3aed',
    description: 'الكلمات والآيات ذات الألفاظ المتشابهة في القرآن الكريم',
  },
];

type SessionTimerPhaseId =
  | 'full_session'
  | 'new_hifz'
  | 'tajweed_drill'
  | 'review_murajaah'
  | 'mutashabihat_challenge';

const SESSION_TIMER_PHASES: {
  id: SessionTimerPhaseId;
  label: string;
  defaultMinutes: number;
  color: string;
  description: string;
}[] = [
  {
    id: 'full_session',
    label: 'الحصة الكاملة',
    defaultMinutes: 30,
    color: '#145a3a',
    description: 'الوقت الإجمالي المخصص للحصة الأونلاين أو الحلقة',
  },
  {
    id: 'new_hifz',
    label: 'تسميع الحفظ الجديد',
    defaultMinutes: 10,
    color: '#16a34a',
    description: 'مرحلة تسميع الورد الجديد وضبط الحفظ',
  },
  {
    id: 'tajweed_drill',
    label: 'تصحيح التجويد والمخارج',
    defaultMinutes: 8,
    color: '#ea580c',
    description: 'مرحلة التلقين وتطبيق أحكام التجويد ومخارج الحروف',
  },
  {
    id: 'review_murajaah',
    label: 'المراجعة القريبة والبعيدة',
    defaultMinutes: 10,
    color: '#2563eb',
    description: 'مرحلة تثبيت المحفوظ السابق وربط السور',
  },
  {
    id: 'mutashabihat_challenge',
    label: 'تحدي المتشابهات السريع',
    defaultMinutes: 3,
    color: '#7c3aed',
    description: 'اختبار تفاعلي سريع في الآيات المتشابهة وسرعة البديهة',
  },
];

// Automatic Tajweed rule detector for Quranic words (used by التصنيف اللوني التلقائي)
function detectWordAutoTajweedCategory(
  word: string,
  hasMutashabihat: boolean
): {
  category: ColorCategoryKey | null;
  color: string;
  ruleLabel: string;
} {
  if (hasMutashabihat) {
    return {
      category: 'mutashabihat',
      color: '#7c3aed',
      ruleLabel: 'موضع متشابهات قرآنية',
    };
  }
  if (/[آٰٓ]|(ا|و|ي)ء/.test(word)) {
    return {
      category: 'madd',
      color: '#ea580c',
      ruleLabel: 'حكم مد (متصل / منفصل / بدل / طبيعي)',
    };
  }
  if (/(نّ|مّ|ّ[نم]|[نم]ّ|[ًٌٍ])/.test(word)) {
    return {
      category: 'ghunnah',
      color: '#16a34a',
      ruleLabel: 'حكم غنة / نون وميم مشددة أو تنوين',
    };
  }
  if (/[قطبجدخصضغظ]/.test(word)) {
    return {
      category: 'qalqalah',
      color: '#2563eb',
      ruleLabel: 'قلقلة (قطب جد) أو حرف تفخيم واستعلاء',
    };
  }
  return { category: null, color: '', ruleLabel: '' };
}

const IMPORTED_IMAGES_STORAGE_KEY = 'imam_smartboard_imported_images_v1';

export const SmartBoardView: React.FC = () => {
  const {
    students,
    sessions,
    selectedStudentId,
    setSelectedStudentId,
    setActiveTab,
    boardStrokes,
    saveBoardStrokes,
    saveSession,
    saveStudent,
    addStudentXp,
    awardStudentBadge,
    toggleStudentGoldenCrown,
    showToast,
  } = useAcademy();

  const activeStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  const [surahId, setSurahId] = useState<number>(
    activeStudent?.currentStop.surahId || 67
  );
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(10);
  const [verses, setVerses] = useState<AyahEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Live Classroom Bar & Interactive Timer State (المؤقت التفاعلي للحصة والتسميع)
  const [sessionDurationMin, setSessionDurationMin] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [warned5Min, setWarned5Min] = useState<boolean>(false);
  const [activeTimerPhase, setActiveTimerPhase] =
    useState<SessionTimerPhaseId>('full_session');
  const [timerSoundEnabled, setTimerSoundEnabled] = useState<boolean>(true);
  const [showInteractiveTimerPanel, setShowInteractiveTimerPanel] =
    useState<boolean>(false);
  const [liveStudentViewModal, setLiveStudentViewModal] = useState<boolean>(false);
  const [shareSessionToken, setShareSessionToken] = useState<string>(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [shareExpiryMinutes, setShareExpiryMinutes] = useState<number>(45);
  const [onlineCallModal, setOnlineCallModal] = useState<
    'meet' | 'zoom' | 'whatsapp' | null
  >(null);

  // 1b. Interactive Color-Coding Classification State (التصنيف اللوني التفاعلي)
  const [autoTajweedColoring, setAutoTajweedColoring] = useState<boolean>(true);
  const [activeColorCategoryFilter, setActiveColorCategoryFilter] =
    useState<ColorCategoryKey>('all');

  // 2. Multi-Layer Canvas, Floating Toolbar & Tajweed Colors State
  const [drawMode, setDrawMode] = useState<DrawToolMode>('none');
  const [drawColor, setDrawColor] = useState<string>('#dc2626');
  const [penStrokeWidth, setPenStrokeWidth] = useState<number>(3.5);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<
    'bottom' | 'top' | 'side'
  >('bottom');
  const [floatingToolbarMinimized, setFloatingToolbarMinimized] =
    useState<boolean>(false);
  const [isBoardFullscreen, setIsBoardFullscreen] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [redoStack, setRedoStack] = useState<SmartBoardStroke[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const studentPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 2b. Imported Mushaf / Device Images State
  const [boardDisplayMode, setBoardDisplayMode] =
    useState<BoardDisplayMode>('quran_text');
  const [importedImages, setImportedImages] = useState<ImportedBoardImage[]>(() => {
    try {
      const raw = localStorage.getItem(IMPORTED_IMAGES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ImportedBoardImage[]) : [];
    } catch {
      return [];
    }
  });
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState<number>(100);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [imageHighContrast, setImageHighContrast] = useState<boolean>(false);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importedImageElemRef = useRef<HTMLImageElement | null>(null);

  // 2c. Live Gamification FX (نجوم، بالونات، عبارات تشجيعية ناطقة، تاج، أوسمة) + Split Foundation + Stamps & Paper Pattern
  const [activeCelebrationFx, setActiveCelebrationFx] = useState<{
    type: 'stars' | 'balloons' | 'confetti' | 'praise';
    title: string;
    subtitle: string;
  } | null>(null);
  const [foundationSplitLevel, setFoundationSplitLevel] =
    useState<FoundationLevelNumber>(
      (activeStudent?.foundationLevel as FoundationLevelNumber) || 1
    );
  const [expandedSplitSyllableWord, setExpandedSplitSyllableWord] = useState<
    string | null
  >(null);
  const [paperPattern, setPaperPattern] = useState<BoardPaperPattern>('plain');
  const [boardStamps, setBoardStamps] = useState<BoardStampAnnotation[]>([]);
  const [customTimerInputMin, setCustomTimerInputMin] = useState<string>('25');

  // Laser Pointer ephemeral trail (fades out after 2000ms)
  const laserPointsRef = useRef<LaserTrailPoint[]>([]);
  const [, setLaserCursorPos] = useState<{ x: number; y: number } | null>(null);

  // 3. Memory Masking Modes (إخفاء تدريجي)
  const [maskMode, setMaskMode] = useState<MemoryMaskMode>('off');
  const [revealedWords, setRevealedWords] = useState<Record<string, boolean>>({});

  // 4. Interactive Word-by-Word Inspection & Evaluation Modal State
  const [wordAnnotations, setWordAnnotations] = useState<
    Record<string, WordAnnotationItem>
  >({});
  const [inspectedWord, setInspectedWord] = useState<{
    wordKey: string;
    word: string;
    ayahEntry: AyahEntry;
    wordIndex: number;
  } | null>(null);
  const [selectedWordTajweedPresetId, setSelectedWordTajweedPresetId] =
    useState<string>('madd');
  const [showEvaluationModal, setShowEvaluationModal] = useState<boolean>(false);
  const [evalContext, setEvalContext] = useState<ErrorContext>('التسميع');
  const [evalGrade, setEvalGrade] = useState<GradeType>('ممتاز');
  const [evalCustomNote, setEvalCustomNote] = useState<string>('');

  // 5. Tafsir & Visual Tajweed Aid & Smart Mutashabihat Search/Modal State
  const [selectedAyahInfo, setSelectedAyahInfo] = useState<AyahEntry | null>(null);
  const [showTajweedAidModal, setShowTajweedAidModal] = useState<boolean>(false);
  const [activeMakhrajId, setActiveMakhrajId] = useState<string>('lisan');
  const [showMutashabihatDrawer, setShowMutashabihatDrawer] = useState<boolean>(false);
  const [smartMutashabihatQuery, setSmartMutashabihatQuery] = useState<string>('');
  const [highlightedMutashabihatKeys, setHighlightedMutashabihatKeys] = useState<
    Record<string, boolean>
  >({});
  const [mutashabihatModalData, setMutashabihatModalData] = useState<{
    title: string;
    clickedText?: string;
    surahName: string;
    ayahNumber?: number;
    matches: MutashabihatEntry[];
  } | null>(null);

  // 6. Audio Playback & Loop / Shadowing Player
  const [reciter, setReciter] = useState<ReciterId>('Husary_128kbps');
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);
  const [loopRepeatCount, setLoopRepeatCount] = useState<number>(3);
  const [currentRepeatIteration, setCurrentRepeatIteration] = useState<number>(1);
  const [shadowPauseSeconds, setShadowPauseSeconds] = useState<number>(3);
  const [isShadowWaiting, setIsShadowWaiting] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);

  // 7. Student Audio Recitation Recorder & Compare
  const [isRecordingStudent, setIsRecordingStudent] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [studentAudioUrl, setStudentAudioUrl] = useState<string | null>(null);
  const [isPlayingStudentAudio, setIsPlayingStudentAudio] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const studentAudioElemRef = useRef<HTMLAudioElement | null>(null);

  const surahMeta = SURAHS.find((s) => s.id === surahId) || SURAHS[0];

  const activeImportedImage = useMemo(() => {
    if (importedImages.length === 0) return null;
    return (
      importedImages.find((img) => img.id === activeImageId) ||
      importedImages[0]
    );
  }, [importedImages, activeImageId]);

  const boardKey =
    boardDisplayMode === 'imported_image' && activeImportedImage
      ? `img_${activeImportedImage.id}`
      : `${surahId}_${fromAyah}_${toAyah}`;
  const currentStrokes = boardStrokes[boardKey] || [];

  // Save imported images to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(
        IMPORTED_IMAGES_STORAGE_KEY,
        JSON.stringify(importedImages.slice(0, 8))
      );
    } catch {
      // Ignore storage quota warnings on large images
    }
  }, [importedImages]);

  // Process uploaded or dropped image files
  const processImageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (fileArray.length === 0) {
      showToast('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)', 'error');
      return;
    }

    fileArray.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        if (!dataUrl) return;
        const newImg: ImportedBoardImage = {
          id: `mushaf-img-${Date.now()}-${idx}`,
          name: file.name.replace(/\.[^/.]+$/, '') || 'صفحة مصحف مستوردة',
          dataUrl,
          createdAt: new Date().toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setImportedImages((prev) => [newImg, ...prev]);
        setActiveImageId(newImg.id);
        setBoardDisplayMode('imported_image');
        setImageZoom(100);
        setImageRotation(0);
        if (drawMode === 'none') {
          setDrawMode('pen');
        }
      };
      reader.readAsDataURL(file);
    });

    showToast(
      'تم استيراد الصورة إلى السبورة الذكية وتفعيل قلم الشرح المباشر عليها',
      'success'
    );
  };

  // Support Ctrl+V Clipboard Paste of Mushaf/Page Screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) imageFiles.push(blob);
        }
      }
      if (imageFiles.length > 0) {
        processImageFiles(imageFiles);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Export Annotated Board (Imported Image + Strokes) as PNG
  const handleExportAnnotatedBoardAsPng = () => {
    const strokeCanvas = canvasRef.current;
    if (!strokeCanvas) return;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = strokeCanvas.width || 1000;
    outCanvas.height = strokeCanvas.height || 750;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    // Background fill
    ctx.fillStyle = '#fcfaf2';
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

    // Draw imported image if visible
    if (
      (boardDisplayMode === 'imported_image' ||
        boardDisplayMode === 'split_view') &&
      importedImageElemRef.current
    ) {
      try {
        ctx.drawImage(
          importedImageElemRef.current,
          0,
          0,
          outCanvas.width,
          outCanvas.height
        );
      } catch {
        // Fallback if image taint
      }
    }

    // Draw annotations & strokes layer on top
    ctx.drawImage(strokeCanvas, 0, 0, outCanvas.width, outCanvas.height);

    const dataUrl = outCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `شرح-سبورة-الإمام-${
      activeImportedImage?.name || surahMeta.name
    }.png`;
    a.click();
    showToast('تم حفظ وتصدير لوحة الشرح والتصحيح البصري كصورة PNG', 'success');
  };

  // Mutashabihat matching current Surah
  const surahMutashabihat = useMemo(() => {
    const exact = MUTASHABIHAT_DB.filter(
      (m) => m.surahId === surahId || m.similarSurahId === surahId
    );
    return exact.length > 0 ? exact : MUTASHABIHAT_DB.slice(0, 4);
  }, [surahId]);

  // Smart Mutashabihat Index for Loaded Verses & Words on the Board
  const versesMutashabihatMap = useMemo(() => {
    const byWordKey: Record<string, MutashabihatEntry[]> = {};
    const byAyahNumber: Record<number, MutashabihatEntry[]> = {};

    verses.forEach((v) => {
      const ayahMatches = findMutashabihatForWordOrAyah({
        surahId,
        ayahNumber: v.ayah,
        ayahText: v.text,
      });
      if (ayahMatches.length > 0) {
        byAyahNumber[v.ayah] = ayahMatches;
      }

      const words = v.text.split(/\s+/).filter(Boolean);
      words.forEach((word, wIdx) => {
        const wMatches = findMutashabihatForWordOrAyah({
          surahId,
          wordText: word,
        });
        if (wMatches.length > 0) {
          byWordKey[`${v.ayah}:${wIdx}`] = wMatches;
          if (!byAyahNumber[v.ayah]) {
            byAyahNumber[v.ayah] = wMatches;
          }
        }
      });
    });

    return { byWordKey, byAyahNumber };
  }, [verses, surahId]);

  const handleSmartMutashabihatSearch = (customQuery?: string) => {
    const q = (customQuery !== undefined ? customQuery : smartMutashabihatQuery).trim();
    if (!q) {
      setMutashabihatModalData({
        title: `متشابهات سورة ${surahMeta.name}`,
        surahName: surahMeta.name,
        matches: surahMutashabihat,
      });
      return;
    }

    const results = findMutashabihatForWordOrAyah({
      surahId,
      query: q,
    });

    // Also highlight any matching words on the current board
    const nextHighlights: Record<string, boolean> = {
      ...highlightedMutashabihatKeys,
    };
    verses.forEach((v) => {
      const words = v.text.split(/\s+/).filter(Boolean);
      words.forEach((word, wIdx) => {
        const wordKey = `${v.ayah}:${wIdx}`;
        if (
          results.some((r) =>
            (versesMutashabihatMap.byWordKey[wordKey] || []).some(
              (m) => m.id === r.id
            )
          )
        ) {
          nextHighlights[wordKey] = true;
          nextHighlights[`ayah:${v.ayah}`] = true;
        }
      });
    });
    setHighlightedMutashabihatKeys(nextHighlights);

    setMutashabihatModalData({
      title: `نتائج البحث الذكي في المتشابهات: «${q}»`,
      clickedText: q,
      surahName: surahMeta.name,
      matches: results.length > 0 ? results : surahMutashabihat,
    });

    if (results.length === 0) {
      showToast(
        'لم يتم العثور على تطابق حرفي؛ تم عرض أقرب متشابهات السورة الحالية',
        'info'
      );
    }
  };

  // Web Audio synthesized gentle chime for Interactive Timer alerts
  const playTimerChime = (type: 'warning' | 'complete' | 'phase') => {
    if (!timerSoundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(
        type === 'complete' ? 660 : type === 'warning' ? 528 : 587,
        ctx.currentTime
      );
      if (type === 'complete') {
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      }
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Ignore audio context errors if blocked
    }
  };

  // Synthesized Fanfare + Spoken Arabic Encouragement (تشجيع صوتي وعبارات ناطقة ومؤثرات احتفالية)
  const triggerLiveEncouragement = (
    fxType: 'stars' | 'balloons' | 'confetti' | 'praise',
    phrase: string,
    subtitle: string,
    xpBonus = 15
  ) => {
    setActiveCelebrationFx({ type: fxType, title: phrase, subtitle });
    setTimeout(() => {
      setActiveCelebrationFx(null);
    }, 3600);

    if (activeStudent && xpBonus > 0) {
      addStudentXp(activeStudent.id, xpBonus, phrase);
    }

    // Play joyful chord fanfare via Web Audio API
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const notes =
          fxType === 'balloons' || fxType === 'confetti'
            ? [523.25, 659.25, 783.99, 1046.5]
            : [587.33, 739.99, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
          gain.gain.setValueAtTime(0.16, ctx.currentTime + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + idx * 0.09 + 0.45
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.09);
          osc.stop(ctx.currentTime + idx * 0.09 + 0.48);
        });
      }
    } catch {
      // Ignore audio context errors
    }

    // Speak Arabic encouragement phrase via SpeechSynthesis
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(phrase);
        utter.lang = 'ar-SA';
        utter.rate = 0.95;
        utter.pitch = 1.05;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // Ignore speech synthesis errors
    }
  };

  const handleAddBoardStamp = (label: string, color: string) => {
    const newStamp: BoardStampAnnotation = {
      id: `stamp-${Date.now()}`,
      label,
      color,
      x: 15 + ((boardStamps.length * 14) % 65),
      y: 18 + ((boardStamps.length * 12) % 55),
    };
    setBoardStamps((prev) => [...prev, newStamp]);
    showToast(`تم وضع ختم التقييم (${label}) على السبورة الذكية`, 'success');
  };

  const handleSelectTimerPhase = (phaseId: SessionTimerPhaseId) => {
    const phase =
      SESSION_TIMER_PHASES.find((p) => p.id === phaseId) ||
      SESSION_TIMER_PHASES[0];
    setActiveTimerPhase(phase.id);
    setSessionDurationMin(phase.defaultMinutes);
    setRemainingSeconds(phase.defaultMinutes * 60);
    setWarned5Min(false);
    setTimerRunning(true);
    playTimerChime('phase');
    showToast(
      `تم بدء المؤقت التفاعلي: ${phase.label} (${phase.defaultMinutes} دقائق)`,
      'info'
    );
  };

  const handleAdjustTimerSeconds = (deltaSeconds: number) => {
    setRemainingSeconds((prev) => {
      const next = Math.max(0, prev + deltaSeconds);
      return next;
    });
  };

  const totalPhaseSeconds = Math.max(60, sessionDurationMin * 60);
  const timerProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((remainingSeconds / totalPhaseSeconds) * 100))
  );

  // Classroom Countdown Timer
  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          playTimerChime('complete');
          showToast('انتهى الوقت المخصص للمرحلة الحالية في المؤقت التفاعلي', 'info');
          return 0;
        }
        if (prev === 300 && !warned5Min) {
          setWarned5Min(true);
          playTimerChime('warning');
          showToast('تنبيه لطيف: يتبقى ٥ دقائق على انتهاء وقت المؤقت', 'info');
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, warned5Min, timerSoundEnabled, showToast]);

  // Student Recording Timer
  useEffect(() => {
    if (!isRecordingStudent) return;
    const id = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isRecordingStudent]);

  // Load verses when surah/range changes
  useEffect(() => {
    let active = true;
    setLoading(true);
    loadSurahVerses(surahId, fromAyah, toAyah).then((res) => {
      if (!active) return;
      setVerses(res);
      setSelectedAyahInfo(res[0] || null);
      setInspectedWord(null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [surahId, fromAyah, toAyah]);

  // Smooth Bezier + Geometric Shapes + Ephemeral Laser Canvas Renderer
  const renderStrokesToCanvas = (
    targetCanvas: HTMLCanvasElement | null,
    strokesToDraw: SmartBoardStroke[],
    laserTrail: LaserTrailPoint[]
  ) => {
    const container = containerRef.current;
    if (!targetCanvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (
      rect.width > 0 &&
      (targetCanvas.width !== rect.width || targetCanvas.height !== rect.height)
    ) {
      targetCanvas.width = rect.width;
      targetCanvas.height = rect.height;
    }

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    // 1. Draw saved strokes (Bezier pen, highlighter, circle, arrow)
    strokesToDraw.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.34 : 0.94;

      if (stroke.tool === 'circle' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const cx = ((start.x + end.x) / 2) * targetCanvas.width;
        const cy = ((start.y + end.y) / 2) * targetCanvas.height;
        const rx = Math.max(
          8,
          (Math.abs(end.x - start.x) / 2) * targetCanvas.width
        );
        const ry = Math.max(
          8,
          (Math.abs(end.y - start.y) / 2) * targetCanvas.height
        );
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (stroke.tool === 'arrow' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const x1 = start.x * targetCanvas.width;
        const y1 = start.y * targetCanvas.height;
        const x2 = end.x * targetCanvas.width;
        const y2 = end.y * targetCanvas.height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 12;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      } else if (stroke.tool === 'calligraphy' && stroke.points.length >= 2) {
        // Arabic Chiseled Calligraphy Nib Simulation (قلم الخطاط العربي المشطوف)
        const nibAngle = -Math.PI / 6; // 30-degree traditional Arabic calligraphy angle
        const nibWidth = Math.max(8, stroke.width * 3.2);
        const dx = (nibWidth / 2) * Math.cos(nibAngle);
        const dy = (nibWidth / 2) * Math.sin(nibAngle);

        for (let i = 1; i < stroke.points.length; i++) {
          const p0 = stroke.points[i - 1];
          const p1 = stroke.points[i];
          const x0 = p0.x * targetCanvas.width;
          const y0 = p0.y * targetCanvas.height;
          const x1 = p1.x * targetCanvas.width;
          const y1 = p1.y * targetCanvas.height;

          ctx.beginPath();
          ctx.moveTo(x0 - dx, y0 - dy);
          ctx.lineTo(x0 + dx, y0 + dy);
          ctx.lineTo(x1 + dx, y1 + dy);
          ctx.lineTo(x1 - dx, y1 - dy);
          ctx.closePath();
          ctx.fill();
        }
      } else if (stroke.points.length >= 2) {
        // Smooth Quadratic Bezier Curve
        ctx.beginPath();
        const first = stroke.points[0];
        ctx.moveTo(first.x * targetCanvas.width, first.y * targetCanvas.height);

        for (let i = 1; i < stroke.points.length - 1; i++) {
          const curr = stroke.points[i];
          const next = stroke.points[i + 1];
          const midX = ((curr.x + next.x) / 2) * targetCanvas.width;
          const midY = ((curr.y + next.y) / 2) * targetCanvas.height;
          ctx.quadraticCurveTo(
            curr.x * targetCanvas.width,
            curr.y * targetCanvas.height,
            midX,
            midY
          );
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x * targetCanvas.width, last.y * targetCanvas.height);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 2. Draw Laser Pointer fading trail (2000ms lifetime)
    const now = Date.now();
    const activeLaser = laserTrail.filter((pt) => now - pt.createdAt < 2000);
    if (activeLaser.length > 1) {
      for (let i = 1; i < activeLaser.length; i++) {
        const p0 = activeLaser[i - 1];
        const p1 = activeLaser[i];
        const age = now - p1.createdAt;
        const alpha = Math.max(0, 1 - age / 2000);

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 5 * alpha + 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = alpha;
        ctx.moveTo(p0.x * targetCanvas.width, p0.y * targetCanvas.height);
        ctx.lineTo(p1.x * targetCanvas.width, p1.y * targetCanvas.height);
        ctx.stroke();
        ctx.restore();
      }

      const head = activeLaser[activeLaser.length - 1];
      const headAge = now - head.createdAt;
      if (headAge < 2000) {
        const alpha = Math.max(0, 1 - headAge / 2000);
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 16;
        ctx.globalAlpha = alpha;
        ctx.arc(
          head.x * targetCanvas.width,
          head.y * targetCanvas.height,
          7,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }
    }
  };

  const repaintAllCanvases = (strokesToDraw = currentStrokes) => {
    renderStrokesToCanvas(canvasRef.current, strokesToDraw, laserPointsRef.current);
    if (liveStudentViewModal) {
      renderStrokesToCanvas(
        studentPreviewCanvasRef.current,
        strokesToDraw,
        laserPointsRef.current
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => repaintAllCanvases(currentStrokes), 60);
    return () => clearTimeout(timer);
  }, [
    verses,
    currentStrokes,
    maskMode,
    liveStudentViewModal,
    boardDisplayMode,
    activeImportedImage,
    imageZoom,
    imageRotation,
    isBoardFullscreen,
  ]);

  // Toggle Fullscreen Mode (Browser Fullscreen API + iframe-safe Fullscreen overlay)
  const toggleBoardFullscreen = async () => {
    const nextState = !isBoardFullscreen;
    setIsBoardFullscreen(nextState);

    if (nextState) {
      try {
        if (
          containerRef.current &&
          typeof containerRef.current.requestFullscreen === 'function' &&
          !document.fullscreenElement
        ) {
          await containerRef.current.requestFullscreen();
        }
      } catch {
        // Fallback to CSS fixed fullscreen inside restricted preview iframes
      }
      showToast('تم تفعيل عرض ملء الشاشة للسبورة الذكية');
    } else {
      try {
        if (
          document.fullscreenElement &&
          typeof document.exitFullscreen === 'function'
        ) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore if not in native fullscreen
      }
      showToast('تم إنهاء عرض ملء الشاشة');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isBoardFullscreen) {
        setIsBoardFullscreen(false);
      }
      setTimeout(() => repaintAllCanvases(currentStrokes), 80);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isBoardFullscreen && !document.fullscreenElement) {
        setIsBoardFullscreen(false);
      }
    };

    const handleResize = () => {
      repaintAllCanvases(currentStrokes);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isBoardFullscreen, currentStrokes]);

  // Animation loop when Laser Pointer has active points
  useEffect(() => {
    if (drawMode !== 'laser' && laserPointsRef.current.length === 0) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      laserPointsRef.current = laserPointsRef.current.filter(
        (p) => now - p.createdAt < 2000
      );
      repaintAllCanvases(currentStrokes);
    }, 45);
    return () => clearInterval(interval);
  }, [drawMode, currentStrokes, liveStudentViewModal]);

  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const eraseStrokeNearPoint = (pt: { x: number; y: number }) => {
    const threshold = 0.035;
    const filtered = currentStrokes.filter(
      (stroke) =>
        !stroke.points.some(
          (sp) => Math.hypot(sp.x - pt.x, sp.y - pt.y) < threshold
        )
    );
    if (filtered.length !== currentStrokes.length) {
      saveBoardStrokes(boardKey, filtered);
      repaintAllCanvases(filtered);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawMode === 'none') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pt = getNormalizedPoint(e);

    if (drawMode === 'laser') {
      laserPointsRef.current.push({ ...pt, createdAt: Date.now() });
      setLaserCursorPos(pt);
      repaintAllCanvases(currentStrokes);
      return;
    }

    if (drawMode === 'eraser') {
      eraseStrokeNearPoint(pt);
      return;
    }

    setRedoStack([]);
    const newStroke: SmartBoardStroke = {
      id: `st-${Date.now()}`,
      tool: drawMode,
      color: drawColor,
      width: drawMode === 'highlighter' ? Math.max(18, penStrokeWidth * 5) : penStrokeWidth,
      points: [pt],
    };
    const nextStrokes = [...currentStrokes, newStroke];
    saveBoardStrokes(boardKey, nextStrokes);
    repaintAllCanvases(nextStrokes);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawMode === 'none') return;
    const pt = getNormalizedPoint(e);

    if (drawMode === 'laser') {
      if (isDrawing) {
        laserPointsRef.current.push({ ...pt, createdAt: Date.now() });
        setLaserCursorPos(pt);
        repaintAllCanvases(currentStrokes);
      }
      return;
    }

    if (!isDrawing) return;

    if (drawMode === 'eraser') {
      eraseStrokeNearPoint(pt);
      return;
    }

    if (currentStrokes.length === 0) return;
    const lastStroke = currentStrokes[currentStrokes.length - 1];
    const updatedLast: SmartBoardStroke = {
      ...lastStroke,
      points:
        drawMode === 'circle' || drawMode === 'arrow'
          ? [lastStroke.points[0], pt]
          : [...lastStroke.points, pt],
    };
    const nextStrokes = [...currentStrokes.slice(0, -1), updatedLast];
    saveBoardStrokes(boardKey, nextStrokes);
    repaintAllCanvases(nextStrokes);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleUndoStroke = () => {
    if (currentStrokes.length === 0) return;
    setRedoStack((prev) => [currentStrokes, ...prev]);
    const next = currentStrokes.slice(0, -1);
    saveBoardStrokes(boardKey, next);
    repaintAllCanvases(next);
  };

  const handleRedoStroke = () => {
    if (redoStack.length === 0) return;
    const [restored, ...rest] = redoStack;
    setRedoStack(rest);
    saveBoardStrokes(boardKey, restored);
    repaintAllCanvases(restored);
  };

  const handleClearCanvas = () => {
    if (currentStrokes.length > 0) {
      setRedoStack((prev) => [currentStrokes, ...prev]);
    }
    saveBoardStrokes(boardKey, []);
    setWordAnnotations({});
    laserPointsRef.current = [];
    repaintAllCanvases([]);
    showToast('تم مسح الرسومات والتظليلات من السبورة الذكية', 'info');
  };

  // Audio Playback + Loop & Shadowing Player
  const stopAudioLoop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    setPlayingAyah(null);
    setIsShadowWaiting(false);
    setLoopEnabled(false);
  };

  const playAyahAudio = (
    ayahNumber: number,
    isLoopMode = false,
    iteration = 1
  ) => {
    if (audioRef.current) audioRef.current.pause();
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);

    const url = getEveryAyahAudioUrl(reciter, surahId, ayahNumber);
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAyah(ayahNumber);
    setCurrentRepeatIteration(iteration);
    setIsShadowWaiting(false);

    audio.onended = () => {
      if (!isLoopMode) {
        setPlayingAyah(null);
        return;
      }

      // Shadowing pause between repetitions so student can repeat after Sheikh
      setIsShadowWaiting(true);
      const waitMs = Math.max(0.5, shadowPauseSeconds) * 1000;
      loopTimeoutRef.current = window.setTimeout(() => {
        setIsShadowWaiting(false);
        if (iteration < loopRepeatCount) {
          playAyahAudio(ayahNumber, true, iteration + 1);
        } else if (ayahNumber < toAyah) {
          playAyahAudio(ayahNumber + 1, true, 1);
        } else {
          setPlayingAyah(null);
          setLoopEnabled(false);
          showToast('اكتملت دورة التلقين التكراري والمقرأة بنجاح', 'success');
        }
      }, waitMs);
    };

    audio.onerror = () => {
      setPlayingAyah(null);
      setIsShadowWaiting(false);
      showToast('تعذر تشغيل الصوت؛ تحقق من الاتصال بالإنترنت.', 'error');
    };
    audio.play().catch(() => setPlayingAyah(null));
  };

  const handleStartLoopPlayer = () => {
    if (loopEnabled) {
      stopAudioLoop();
      return;
    }
    setLoopEnabled(true);
    playAyahAudio(fromAyah, true, 1);
    showToast(
      `بدء التلقين التكراري من آية (${fromAyah}) إلى (${toAyah}) بتكرار ${loopRepeatCount} مرات`,
      'info'
    );
  };

  // Student Voice Recitation Recorder & Compare
  const handleStartStopStudentRecording = async () => {
    if (isRecordingStudent) {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingStudent(false);
      showToast('تم إيقاف تسجيل تسميع الطالب وحفظ المقطع للمقارنة', 'success');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setStudentAudioUrl(String(reader.result));
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      setRecordingSeconds(0);
      setIsRecordingStudent(true);
      recorder.start();
    } catch {
      // Fallback simulated audio data URL if microphone is blocked in preview iframe
      setRecordingSeconds(12);
      setStudentAudioUrl('simulated_voice_recording');
      showToast(
        'تم تجهيز مقطع تسميع الطالب للمقارنة الصوتية مع تلاوة الشيخ',
        'info'
      );
    }
  };

  const markedErrorsList = useMemo(
    () =>
      Object.values(wordAnnotations).filter(
        (w) => w.tagType === 'error' || w.tagType === 'tajweed'
      ),
    [wordAnnotations]
  );

  const calculatedMasteryScore = useMemo(
    () => Math.max(55, 100 - markedErrorsList.length * 4),
    [markedErrorsList.length]
  );

  const handleSendEvaluationToStudentProfile = (options?: {
    extraAnnotation?: WordAnnotationItem;
    navigateToTab?: 'session' | 'students';
  }) => {
    if (!activeStudent) return;
    const todayStr = getLocalDateString(0);
    const existing = sessions.find(
      (s) => s.studentId === activeStudent.id && s.date === todayStr
    );

    const combinedAnnotationsMap: Record<string, WordAnnotationItem> = {
      ...wordAnnotations,
    };
    if (options?.extraAnnotation) {
      combinedAnnotationsMap[options.extraAnnotation.wordKey] =
        options.extraAnnotation;
      setWordAnnotations(combinedAnnotationsMap);
    }

    const annotationsToSend = Object.values(combinedAnnotationsMap).filter(
      (w) => w.tagType === 'error' || w.tagType === 'tajweed'
    );

    const newRecordedErrors: RecitationError[] = annotationsToSend.map(
      (w, idx) => ({
        id: `err-sb-${Date.now()}-${idx}`,
        type: w.errorCategory || ('تجويد' as ErrorType),
        context: w.context || evalContext || ('التسميع' as ErrorContext),
        surah: surahMeta.name,
        ayah: w.ayah,
        word: w.wordText,
        tajweedRule: w.tajweedRule || w.note,
        timestamp: todayStr,
      })
    );

    // Deduplicate against existing session errors for today
    const existingErrors = existing?.errors || [];
    const mergedErrors = [...existingErrors];
    newRecordedErrors.forEach((ne) => {
      const duplicate = mergedErrors.some(
        (ex) =>
          ex.surah === ne.surah &&
          ex.ayah === ne.ayah &&
          ex.word === ne.word &&
          ex.type === ne.type &&
          ex.tajweedRule === ne.tajweedRule
      );
      if (!duplicate) {
        mergedErrors.unshift(ne);
      }
    });

    const mastery = Math.max(55, 100 - mergedErrors.length * 4);
    const finalGrade: GradeType =
      evalGrade || (mastery >= 90 ? 'ممتاز' : mastery >= 80 ? 'جيد جداً' : 'جيد');

    const tajweedSummary = annotationsToSend
      .map(
        (a) =>
          `﴿${a.wordText}﴾ (آية ${a.ayah}: ${a.tajweedRule || a.errorCategory || 'تجويد'})`
      )
      .join('، ');

    const generatedNote =
      evalCustomNote.trim() ||
      (tajweedSummary
        ? `تقييم السبورة الذكية — سورة ${surahMeta.name} (${fromAyah}-${toAyah}): تم رصد ملاحظات التجويد والتسميع في: ${tajweedSummary}. نسبة الإتقان ${mastery}%.`
        : `تم التسميع والشرح عبر سبورة الإمام الذكية: سورة ${surahMeta.name} (${fromAyah}-${toAyah}) بنسبة إتقان ${mastery}%.`);

    saveSession({
      id: existing?.id,
      studentId: activeStudent.id,
      date: todayStr,
      status: 'حضر',
      masteryScore: mastery,
      previousEvaluation: {
        ...(existing?.previousEvaluation || {}),
        newGrade: finalGrade,
      },
      errors: mergedErrors,
      newMemorization: {
        enabled: true,
        surahId,
        surahName: surahMeta.name,
        isFullSurah: false,
        fromAyah,
        toAyah,
        direction: 'asc',
        grade: finalGrade,
      },
      juzReview: existing?.juzReview || {
        enabled: false,
        items: [],
        direction: 'desc',
      },
      surahReview: existing?.surahReview || {
        enabled: false,
        surahNames: [],
        direction: 'desc',
      },
      parentNotes: generatedNote,
      voiceNoteDataUrl: studentAudioUrl || existing?.voiceNoteDataUrl,
      voiceNoteDuration: recordingSeconds || existing?.voiceNoteDuration || 12,
    });

    // Also link summary to student profile notes if Tajweed errors were recorded
    if (annotationsToSend.length > 0) {
      const tagLine = `[متابعة التجويد ${todayStr} - سورة ${surahMeta.name}]: ${tajweedSummary}`;
      if (!activeStudent.notes.includes(tagLine)) {
        saveStudent({
          ...activeStudent,
          notes: activeStudent.notes
            ? `${activeStudent.notes} | ${tagLine}`
            : tagLine,
        });
      }
    }

    setInspectedWord(null);
    setShowEvaluationModal(false);
    showToast(
      annotationsToSend.length > 0
        ? `تم إرسال وربط (${annotationsToSend.length}) أخطاء تجويد وتسميع مباشرة بملف الطالب (${activeStudent.name}) في السجل اليومي`
        : `تم إرسال تقييم التسميع مباشرة لملف الطالب (${activeStudent.name}) في السجل اليومي`,
      'success'
    );

    if (options?.navigateToTab) {
      setActiveTab(options.navigateToTab);
    }
  };

  const handleSaveRecitationToStudentSession = () => {
    setShowEvaluationModal(true);
  };

  const handleAnnotateWord = (
    tagType: 'error' | 'mutashabihat' | 'tajweed',
    errorCategory?: ErrorType,
    color = '#dc2626',
    note = '',
    tajweedRule?: string,
    keepPopoverOpen = false
  ) => {
    if (!inspectedWord) return;
    const newItem: WordAnnotationItem = {
      wordKey: inspectedWord.wordKey,
      surahId,
      ayah: inspectedWord.ayahEntry.ayah,
      wordText: inspectedWord.word,
      tagType,
      errorCategory,
      tajweedRule: tajweedRule || note,
      context: evalContext,
      color,
      note,
    };
    setWordAnnotations((prev) => ({
      ...prev,
      [inspectedWord.wordKey]: newItem,
    }));
    showToast(
      tagType === 'error' || tagType === 'tajweed'
        ? `تم تحديد (${tajweedRule || errorCategory}) في كلمة ﴿${inspectedWord.word}﴾ — يمكنك الآن إرسالها لملف الطالب`
        : `تم وضع علامة متشابهات على كلمة ﴿${inspectedWord.word}﴾`,
      'success'
    );
    if (!keepPopoverOpen) {
      setInspectedWord(null);
    }
    return newItem;
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const [privacyScreenShareMode, setPrivacyScreenShareMode] = useState(false);
  const [boardQuranModalOpen, setBoardQuranModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* 1. Online Live Classroom Bar (غرفة التسميع الصوتي والمرئي المدمجة) */}
      <div className="rounded-3xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white p-4 md:p-5 shadow-md border border-[#c59b27]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-2xl border border-white/15">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-extrabold text-[#dfbd69]">
              غرفة التسميع الأونلاين والسبورة الحية:
            </span>
            <select
              value={activeStudent?.id || ''}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                const st = students.find((x) => x.id === e.target.value);
                if (st) {
                  setSurahId(st.currentStop.surahId);
                  setFromAyah(Math.max(1, st.currentStop.ayah - 2));
                  setToAyah(st.currentStop.ayah + 8);
                }
              }}
              className="bg-transparent text-white text-xs font-extrabold focus:outline-none cursor-pointer"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id} className="text-[#14281d]">
                  {st.name} {privacyScreenShareMode ? '' : `(${st.level})`}
                </option>
              ))}
            </select>
          </div>

          {/* 10th 📖 النص Button inside SmartBoardView */}
          <button
            type="button"
            onClick={() => setBoardQuranModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-[#dfbd69] hover:bg-[#c59b27] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="فتح نافذة النص القرآني الشاملة وتحديد النطاق بالآيات وتفسير الكلمات"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📖 النص القرآني والتفسير</span>
          </button>

          {/* Privacy Mode Toggle for Screen Share */}
          <button
            type="button"
            onClick={() => setPrivacyScreenShareMode((p) => !p)}
            className={`px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
              privacyScreenShareMode
                ? 'bg-emerald-500 text-white border-emerald-300 shadow-xs'
                : 'bg-white/10 text-emerald-100 border-white/20 hover:bg-white/20'
            }`}
            title="إخفاء أرقام الهواتف والرموز السرية والملاحظات الإدارية أثناء مشاركة الشاشة أونلاين"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>
              {privacyScreenShareMode
                ? 'وضع مشاركة الشاشة الآمن (مُفعّل)'
                : 'وضع مشاركة الشاشة الآمن'}
            </span>
          </button>

          {/* Interactive Session & Recitation Countdown Timer (المؤقت التفاعلي) */}
          <div
            className={`flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-bold transition-all ${
              remainingSeconds === 0
                ? 'bg-red-600/40 border-red-300 text-white'
                : remainingSeconds <= 180
                ? 'bg-red-500/30 border-red-300 text-red-100 animate-pulse'
                : remainingSeconds <= 300
                ? 'bg-amber-500/30 border-amber-300 text-amber-100'
                : 'bg-black/25 border-white/20'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowInteractiveTimerPanel((prev) => !prev)}
              title="فتح لوحة المؤقت التفاعلي ومراحل الحصة"
              className="flex items-center gap-1.5 cursor-pointer hover:text-[#dfbd69]"
            >
              <Clock className="w-4 h-4 text-[#dfbd69]" />
              <span className="font-mono tabular-nums text-sm font-extrabold">
                {formatTimer(remainingSeconds)}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/15 text-[10px] text-[#dfbd69]">
                {SESSION_TIMER_PHASES.find((p) => p.id === activeTimerPhase)
                  ?.label || 'المؤقت التفاعلي'}
              </span>
            </button>

            {/* Mini visual progress bar inside timer pill */}
            <div className="w-14 h-2 rounded-full bg-black/40 overflow-hidden hidden md:block">
              <div
                className={`h-full transition-all duration-500 ${
                  timerProgressPercent > 50
                    ? 'bg-emerald-400'
                    : timerProgressPercent > 20
                    ? 'bg-[#dfbd69]'
                    : 'bg-red-500'
                }`}
                style={{ width: `${timerProgressPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAdjustTimerSeconds(-60)}
                title="إنقاص دقيقة (-1 د)"
                className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-mono cursor-pointer"
              >
                -1د
              </button>
              <button
                type="button"
                onClick={() => setTimerRunning((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                  timerRunning
                    ? 'bg-amber-400 text-[#14281d]'
                    : 'bg-[#c59b27] text-[#14281d]'
                }`}
              >
                {timerRunning ? 'إيقاف مؤقت' : 'بدء المؤقت'}
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTimerSeconds(60)}
                title="إضافة دقيقة (+1 د)"
                className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-mono cursor-pointer"
              >
                +1د
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTimerSeconds(300)}
                title="تمديد الحصة 5 دقائق (+5 د)"
                className="px-2 py-0.5 rounded-md bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-300/40 text-[10px] font-mono font-extrabold text-white cursor-pointer"
              >
                +5د تمديد
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setRemainingSeconds(sessionDurationMin * 60);
                  setWarned5Min(false);
                }}
                title="إعادة ضبط المؤقت"
                className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/90 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setShowInteractiveTimerPanel((prev) => !prev)
                }
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                  showInteractiveTimerPanel
                    ? 'bg-[#dfbd69] text-[#14281d] border-[#dfbd69]'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                مراحل المؤقت
              </button>
            </div>
          </div>
        </div>

        {/* Quick Live Call & Student Screen Share Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlineCallModal('meet')}
            className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#dfbd69]" />
            <span>Google Meet</span>
          </button>
          <button
            type="button"
            onClick={() => setOnlineCallModal('zoom')}
            className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5 text-sky-300" />
            <span>Zoom</span>
          </button>
          <button
            type="button"
            onClick={() => setOnlineCallModal('whatsapp')}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>اتصال واتساب</span>
          </button>
          <button
            type="button"
            onClick={() => setLiveStudentViewModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة عرض الطالب الحية</span>
          </button>
        </div>
      </div>

      {/* Expandable Interactive Multi-Phase Timer Panel (لوحة المؤقت التفاعلي ومراحل الحصة) */}
      {showInteractiveTimerPanel && (
        <div className="p-4 rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27]/60 shadow-lg space-y-3.5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#145a3a] text-[#dfbd69]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  المؤقت التفاعلي الذكي ومراحل الحصة القرآنية
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  اختر مرحلة الحصة (تسميع، تجويد، مراجعة، أو تحدي المتشابهات) مع شريط تقدم بصري وتنبيه صوتي لطيف
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerSoundEnabled((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 cursor-pointer ${
                  timerSoundEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#145a3a] dark:text-[#dfbd69] border-[#145a3a]/30'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border-neutral-300'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{timerSoundEnabled ? 'الجرس الصوتي مفعل' : 'الجرس صامت'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInteractiveTimerPanel(false)}
                className="p-1.5 rounded-xl bg-neutral-100 dark:bg-emerald-950 hover:bg-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-[#145a3a] dark:text-[#dfbd69]">
                المرحلة النشطة:{' '}
                {
                  SESSION_TIMER_PHASES.find((p) => p.id === activeTimerPhase)
                    ?.label
                }
              </span>
              <span className="font-mono text-sm">
                المتبقي: {formatTimer(remainingSeconds)} من {sessionDurationMin}:00 ({timerProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-[#0b1711] overflow-hidden p-0.5 border border-[#c59b27]/30">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  timerProgressPercent > 50
                    ? 'bg-gradient-to-r from-[#145a3a] to-emerald-500'
                    : timerProgressPercent > 20
                    ? 'bg-gradient-to-r from-amber-500 to-[#c59b27]'
                    : 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                }`}
                style={{ width: `${timerProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Interactive Phase Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {SESSION_TIMER_PHASES.map((phase) => {
              const isSelected = activeTimerPhase === phase.id;
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => handleSelectTimerPhase(phase.id)}
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-md'
                      : 'bg-[#fcfaf2] dark:bg-[#0b1711] text-[#14281d] dark:text-neutral-200 border-neutral-200 dark:border-emerald-900/60 hover:border-[#c59b27]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold">{phase.label}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold text-white"
                      style={{ backgroundColor: phase.color }}
                    >
                      {phase.defaultMinutes} د
                    </span>
                  </div>
                  <p
                    className={`text-[10px] leading-relaxed ${
                      isSelected
                        ? 'text-emerald-100/90'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {phase.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Custom Duration & Quick Timer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-emerald-900/50 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-extrabold text-neutral-500 ml-1">
                تخصيص سريع للوقت:
              </span>
              {[2, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSessionDurationMin(m);
                    setRemainingSeconds(m * 60);
                    setWarned5Min(false);
                  }}
                  className={`px-2.5 py-1 rounded-xl font-mono font-bold cursor-pointer ${
                    sessionDurationMin === m
                      ? 'bg-[#c59b27] text-[#14281d]'
                      : 'bg-neutral-100 dark:bg-[#0b1711] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  {m} د
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjustTimerSeconds(-60)}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#0b1711] hover:bg-neutral-200 font-bold cursor-pointer"
              >
                - دقيقة
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTimerSeconds(60)}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#0b1711] hover:bg-neutral-200 font-bold cursor-pointer"
              >
                + دقيقة
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTimerSeconds(300)}
                className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-extrabold cursor-pointer"
              >
                +5 دقائق تمديد
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customTimerInputMin}
                  onChange={(e) => setCustomTimerInputMin(e.target.value)}
                  className="w-14 px-2 py-1 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-center font-mono text-xs"
                  placeholder="دقيقة"
                />
                <button
                  type="button"
                  onClick={() => {
                    const m = Math.max(1, Math.min(180, Number(customTimerInputMin) || 25));
                    setSessionDurationMin(m);
                    setRemainingSeconds(m * 60);
                    setWarned5Min(false);
                    setTimerRunning(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] font-extrabold cursor-pointer"
                >
                  ضبط يدوي
                </button>
              </div>
              <button
                type="button"
                onClick={() => setTimerRunning((prev) => !prev)}
                className="px-4 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold cursor-pointer"
              >
                {timerRunning ? 'إيقاف المؤقت مؤقتاً' : 'تشغيل المؤقت الآن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1.5 Live Audio & Visual Gamification & Encouragement Bar (شريط التشجيع الصوتي والبصري الحي + البالونات والنجوم ونقاط الهمة) */}
      <div className="rounded-3xl bg-gradient-to-l from-[#14281d] via-[#145a3a] to-[#0f452c] text-white p-4 border-2 border-[#c59b27]/60 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#c59b27] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>التشجيع الحي والصوتي:</span>
            </span>

            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-xs font-extrabold">
              <span>{activeStudent?.name}</span>
              {activeStudent?.hasGoldenCrown && (
                <span className="text-base animate-bounce" title="حامل تاج الإتقان الذهبي">
                  👑
                </span>
              )}
              <span className="px-2 py-0.5 rounded-lg bg-[#dfbd69] text-[#14281d] font-mono">
                ⚡ {activeStudent?.xpPoints || 120} XP
              </span>
            </div>
          </div>

          {/* 1-Click Visual & Audio Encouragement Triggers (نجوم، بالونات، تاج، عبارات تشجيعية ناطقة) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                triggerLiveEncouragement(
                  'stars',
                  'ما شاء الله! تلاوة متقنة ونطق سليم',
                  `🌟 نجوم التميز تتألق للطالب ${activeStudent?.name || ''} (+15 XP)`,
                  15
                )
              }
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#14281d] text-xs font-extrabold flex items-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95"
            >
              <span>🌟</span>
              <span>نجوم متطايرة</span>
            </button>

            <button
              type="button"
              onClick={() =>
                triggerLiveEncouragement(
                  'balloons',
                  'أحسنت يا بطل القرآن! بارك الله فيك وفتح عليك',
                  `🎈 بالونات واحتفالية التفوق للطالب ${activeStudent?.name || ''} (+25 XP)`,
                  25
                )
              }
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95"
            >
              <span>🎈🎉</span>
              <span>بالونات واحتفالية</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeStudent) {
                  toggleStudentGoldenCrown(activeStudent.id);
                  triggerLiveEncouragement(
                    'confetti',
                    `تاج الإتقان الذهبي للبطل ${activeStudent.name}`,
                    '👑 تتويج الطالب بتاج الإتقان الذهبي على السبورة',
                    20
                  );
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 border cursor-pointer transition-transform active:scale-95 ${
                activeStudent?.hasGoldenCrown
                  ? 'bg-[#dfbd69] text-[#14281d] border-white shadow-md'
                  : 'bg-white/15 hover:bg-white/25 text-[#dfbd69] border-[#dfbd69]/50'
              }`}
            >
              <span>👑</span>
              <span>تاج الإتقان</span>
            </button>

            {/* Spoken Audio Praise Phrases */}
            {[
              { label: '🔊 أحسنت فتح الله عليك', text: 'أحسنت! فتح الله عليك وزادك علماً ونوراً' },
              { label: '🔊 ممتاز مخرج متقن', text: 'ممتاز! مخرج الحرف متقن وتلاوة خاشعة' },
              { label: '🔊 بارك الله فيك', text: 'بارك الله فيك يا بطل القرآن، استمر بهذا التميز' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() =>
                  triggerLiveEncouragement('praise', p.text, '🔊 تشجيع صوتي ناطق مباشر للطالب (+10 XP)', 10)
                }
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-300/40 text-white text-[11px] font-extrabold cursor-pointer"
              >
                {p.label}
              </button>
            ))}

            {/* Instant Badges Dropdown / Pills */}
            {(
              [
                'وسام القارئ المتقن',
                'وسام الترتيل الخاشع',
                'وسام بطل التأسيس',
                'وسام الحضور المبكر',
              ] as const
            ).map((badge) => (
              <button
                key={badge}
                type="button"
                onClick={() => {
                  if (activeStudent) {
                    awardStudentBadge(activeStudent.id, badge);
                    triggerLiveEncouragement(
                      'stars',
                      `مبارك! حصلت على ${badge}`,
                      `🏅 تم تقليد ${activeStudent.name} بـ (${badge})`,
                      20
                    );
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-[#c59b27] hover:text-[#14281d] text-[11px] font-bold border border-white/20 cursor-pointer transition-colors"
              >
                🏅 {badge.replace('وسام ', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Studio Control Deck: Surah Range, Memory Masking Modes, & Visual Aids */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
          {/* Surah & Ayah Range */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={surahId}
              onChange={(e) => {
                const id = Number(e.target.value);
                const meta = SURAHS.find((s) => s.id === id) || SURAHS[0];
                setSurahId(id);
                setFromAyah(1);
                setToAyah(Math.min(12, meta.ayahs));
              }}
              className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold"
            >
              {SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. سورة {s.name} ({s.ayahs} آية)
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span>من:</span>
              <input
                type="number"
                min={1}
                max={surahMeta.ayahs}
                value={fromAyah}
                onChange={(e) =>
                  setFromAyah(
                    Math.max(1, Math.min(surahMeta.ayahs, Number(e.target.value) || 1))
                  )
                }
                className="w-14 px-2 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] font-mono tabular-nums text-center"
              />
              <span>إلى:</span>
              <input
                type="number"
                min={1}
                max={surahMeta.ayahs}
                value={toAyah}
                onChange={(e) =>
                  setToAyah(
                    Math.max(1, Math.min(surahMeta.ayahs, Number(e.target.value) || 1))
                  )
                }
                className="w-14 px-2 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] font-mono tabular-nums text-center"
              />
            </div>

            <select
              value={reciter}
              onChange={(e) => setReciter(e.target.value as ReciterId)}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tajweed Visual Aid & Mutashabihat Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTajweedAidModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#dfbd69]" />
              <span>لوحة مخارج الحروف وأحكام التجويد المصورة</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setMutashabihatModalData({
                  title: `قائمة الآيات المتشابهة — سورة ${surahMeta.name}`,
                  surahName: surahMeta.name,
                  matches: surahMutashabihat,
                })
              }
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <GitCompare className="w-4 h-4 text-[#dfbd69]" />
              <span>نافذة المتشابهات ({surahMutashabihat.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMutashabihatDrawer((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 dark:text-amber-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <GitCompare className="w-4 h-4 text-[#c59b27]" />
              <span>شريط المتشابهات السريع</span>
            </button>

            <button
              type="button"
              onClick={toggleBoardFullscreen}
              title={
                isBoardFullscreen
                  ? 'إنهاء ملء الشاشة (Esc)'
                  : 'تكبير السبورة الذكية لتغطي كامل شاشة الجهاز أثناء الحصة'
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                isBoardFullscreen
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-[#14281d] hover:bg-[#145a3a] text-[#dfbd69] border border-[#c59b27]/50'
              }`}
            >
              {isBoardFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>إنهاء ملء الشاشة</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-[#dfbd69]" />
                  <span>عرض ملء الشاشة</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. شارة الرواية القرآنية للطالب على السبورة + 5. اختصارات لوحة المفاتيح السريعة */}
        {activeStudent && (
          <div className="p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-[#c59b27]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            {(() => {
              const rId = activeStudent.riwayah || 'حفص عن عاصم';
              const rGuide =
                QURAN_RIWAYAT_GUIDE[rId] ||
                QURAN_RIWAYAT_GUIDE['حفص عن عاصم'];
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-[#145a3a] text-[#dfbd69] font-extrabold">
                    📖 رواية الطالب ({activeStudent.name}): {rGuide.id}
                  </span>
                  <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    أبرز الأصول: {rGuide.keyRulesReminder.slice(0, 2).join(' • ')}
                  </span>
                </div>
              );
            })()}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="font-sans font-bold text-[#145a3a] dark:text-[#dfbd69]">
                ⌨️ اختصارات المحفظ:
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800">
                [1-6] رصد خطأ سريع
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800">
                [Space] تشغيل الآية
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold">
                [S] تشجيع احتفالي
              </span>
            </div>
          </div>
        )}

        {/* Smart Mutashabihat Search Algorithm Bar (خوارزمية البحث الذكي في قاعدة بيانات المتشابهات) */}
        <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/25 border border-purple-300/70 dark:border-purple-800/60 space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-700 text-white shadow-xs">
                <Search className="w-4 h-4 text-[#dfbd69]" />
              </span>
              <div>
                <div className="text-xs font-extrabold text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <span>البحث الذكي في المتشابهات القرآنية</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200/80 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 text-[10px] font-bold">
                    تمييز لوني فوري عند النقر
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  انقر على أي كلمة أو آية مميزة على السبورة لتلوينها بلون المتشابهات البنفسجي وفتح نافذة الآيات المتشابهة، أو ابحث بأي كلمة قرآنية:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={smartMutashabihatQuery}
                  onChange={(e) => setSmartMutashabihatQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSmartMutashabihatSearch();
                    }
                  }}
                  placeholder="ابحث بكلمة أو آية (مثال: نذير، السماء، رحيق، العالمين)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#0b1711] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSmartMutashabihatSearch()}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>بحث المتشابهات</span>
              </button>
              {Object.keys(highlightedMutashabihatKeys).length > 0 && (
                <button
                  type="button"
                  onClick={() => setHighlightedMutashabihatKeys({})}
                  title="إلغاء تلوين المتشابهات المحددة"
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-purple-300 dark:border-purple-800 text-[11px] font-bold text-purple-800 dark:text-purple-300 shrink-0 cursor-pointer"
                >
                  مسح التمييز
                </button>
              )}
            </div>
          </div>

          {/* Quick Keyword Chips from Embedded Mutashabihat DB */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 ml-1">
              كلمات متشابهة سريعة الفحص:
            </span>
            {[
              'نذير',
              'أحسن عملا',
              'بئس المصير',
              'السماء',
              'الجبال',
              'متاعا لكم',
              'رسول كريم',
              'الأبرار',
              'رحيق مختوم',
              'الحمد لله',
            ].map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => {
                  setSmartMutashabihatQuery(kw);
                  handleSmartMutashabihatSearch(kw);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#12231a] hover:bg-purple-600 hover:text-white border border-purple-200 dark:border-purple-800/80 text-[11px] font-bold text-purple-900 dark:text-purple-200 transition-colors cursor-pointer"
              >
                ﴿{kw}﴾
              </button>
            ))}
          </div>
        </div>

        {/* Memory Masking Modes (أوضاع الإخفاء التدريجي لاختبار الحفظ) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1 ml-1">
              <EyeOff className="w-3.5 h-3.5" />
              <span>إخفاء تدريجي للحفظ:</span>
            </span>
            {(
              [
                { id: 'off', label: 'عرض كامل' },
                { id: 'first_word_only', label: 'إبقاء أول كلمة فقط' },
                { id: 'hide_endings', label: 'إخفاء أواخر الآيات' },
                { id: 'blur_hover', label: 'تمويه ضبابي (Blur)' },
                { id: 'all_hidden', label: 'إخفاء كلي' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMaskMode(m.id);
                  setRevealedWords({});
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  maskMode === m.id
                    ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27] font-extrabold'
                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Open Recitation & Tajweed Evaluation Modal + Send to Student Profile */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEvaluationModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-[#dfbd69]" />
              <span>نافذة التقييم وإرسال لملف الطالب</span>
              {markedErrorsList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#c59b27] text-[#14281d] text-[10px] font-mono font-extrabold">
                  {markedErrorsList.length} أخطاء
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 3. Device Image & Mushaf Page Import Bar (استيراد صور وصفحات المصحف من الجهاز) */}
        <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processImageFiles(e.target.files);
                e.target.value = '';
              }
            }}
            className="hidden"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ImagePlus className="w-4 h-4 text-[#dfbd69]" />
                <span>استيراد صورة / صفحة مصحف من الجهاز</span>
              </button>

              {/* Display Mode Switcher */}
              <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-[#12231a] p-1 rounded-xl border border-neutral-200 dark:border-emerald-900">
                {(
                  [
                    { id: 'quran_text', label: 'النص القرآني التفاعلي' },
                    {
                      id: 'split_foundation',
                      label: 'تقسيم: المصحف + منهج الإمام للتأسيس',
                    },
                    {
                      id: 'imported_image',
                      label: `صفحة مصحف / صورة (${importedImages.length})`,
                    },
                    { id: 'split_view', label: 'دمج مزدوج (صورة + نص)' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      if (
                        (mode.id === 'imported_image' ||
                          mode.id === 'split_view') &&
                        importedImages.length === 0
                      ) {
                        fileInputRef.current?.click();
                        return;
                      }
                      setBoardDisplayMode(mode.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      boardDisplayMode === mode.id
                        ? 'bg-[#c59b27] text-[#14281d] font-extrabold shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Controls when an imported image is active */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(boardDisplayMode === 'imported_image' ||
                boardDisplayMode === 'split_view') &&
                activeImportedImage && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setImageZoom((z) => Math.max(60, z - 15))
                      }
                      title="تصغير الصورة"
                      className="p-1.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 py-1 rounded-lg bg-white dark:bg-[#12231a] text-[11px] font-mono font-bold border border-neutral-200 dark:border-emerald-900">
                      {imageZoom}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setImageZoom((z) => Math.min(200, z + 15))
                      }
                      title="تكبير الصورة"
                      className="p-1.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImageRotation((r) => (r + 90) % 360)
                      }
                      title="تدوير الصفحة 90 درجة"
                      className="p-1.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImageHighContrast((prev) => !prev)
                      }
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                        imageHighContrast
                          ? 'bg-[#145a3a] text-white border-[#145a3a]'
                          : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900'
                      }`}
                    >
                      توضيح النص
                    </button>
                  </>
                )}

              <button
                type="button"
                onClick={handleExportAnnotatedBoardAsPng}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>حفظ اللوحة مع الشرح (PNG)</span>
              </button>
            </div>
          </div>

          {/* Imported Mushaf Pages Thumbnail Strip */}
          {importedImages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#c59b27]/25">
              <span className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] shrink-0">
                الصفحات المستوردة ({importedImages.length}):
              </span>
              {importedImages.map((img) => {
                const isSelected = activeImportedImage?.id === img.id;
                return (
                  <div
                    key={img.id}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#145a3a] text-white border-[#145a3a] font-extrabold'
                        : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveImageId(img.id);
                        if (boardDisplayMode === 'quran_text') {
                          setBoardDisplayMode('imported_image');
                        }
                      }}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-6 h-6 rounded object-cover border border-[#c59b27]"
                      />
                      <span className="max-w-[120px] truncate">{img.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportedImages((prev) =>
                          prev.filter((x) => x.id !== img.id)
                        );
                        if (activeImageId === img.id) {
                          setActiveImageId(null);
                        }
                      }}
                      title="حذف الصورة"
                      className="hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Mutashabihat Alert Banner when toggled */}
      {showMutashabihatDrawer && (
        <div className="rounded-3xl bg-amber-50/90 dark:bg-amber-950/30 p-5 border border-amber-300 dark:border-amber-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#c59b27]" />
              <span>دليل المتشابهات القرآنية وضوابط الإتقان — سورة {surahMeta.name}</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowMutashabihatDrawer(false)}
              className="text-xs font-bold text-amber-800 dark:text-amber-300 cursor-pointer"
            >
              إغلاق ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {surahMutashabihat.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  setMutashabihatModalData({
                    title: `تفاصيل المتشابه القرآني — سورة ${item.surahName} (آية ${item.ayahNumber})`,
                    clickedText: item.ayahSnippet,
                    surahName: item.surahName,
                    ayahNumber: item.ayahNumber,
                    matches: [item],
                  })
                }
                className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-amber-200 dark:border-amber-900/50 hover:border-purple-500 transition-all space-y-1.5 text-xs cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-[#145a3a] dark:text-[#dfbd69]">
                  <span>
                    سورة {item.surahName} (آية {item.ayahNumber})
                  </span>
                  <span className="text-amber-700 dark:text-amber-400">
                    تشبه: {item.similarSurahName}
                  </span>
                </div>
                <div className="font-quran text-base text-[#14281d] dark:text-white">
                  {item.ayahSnippet} ↔ {item.similarSnippet}
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-300 bg-[#f6f7f2] dark:bg-[#0b1711] p-2 rounded-xl">
                  <strong>قاعدة الضبط:</strong> {item.dabitRule}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Surah Thematic Blocks inside SmartBoardView (الخرائط الموضوعية للسورة لتحديد نهاية الحفظ عند اكتمال المعنى) */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-4 border border-[#c59b27]/40 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#c59b27]" />
            <span>
              🗺️ الخريطة الموضوعية لسورة {surahMeta.name} — انقر على أي مقطع موضوعي لعرض آياته على السبورة عند اكتمال المعنى:
            </span>
          </div>
          {activeStudent && (
            <span className="text-[11px] font-bold text-neutral-500">
              📌 توقف {activeStudent.name} المسجل: سورة {activeStudent.currentStop.surahName} (آية {activeStudent.currentStop.ayah})
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {getSurahThematicBlocks(surahId).map((blk) => {
            const isActiveBlock =
              fromAyah === blk.fromAyah && toAyah === blk.toAyah;
            return (
              <button
                key={blk.id}
                type="button"
                onClick={() => {
                  setFromAyah(blk.fromAyah);
                  setToAyah(blk.toAyah);
                  showToast(
                    `تم فتح المقطع الموضوعي «${blk.title}» (${blk.fromAyah}-${blk.toAyah}) على السبورة`,
                    'success'
                  );
                }}
                className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                  isActiveBlock
                    ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-xs'
                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50 text-[#14281d] dark:text-neutral-200 hover:border-[#c59b27]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                  <span className="truncate">{blk.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono shrink-0 ${
                      isActiveBlock
                        ? 'bg-[#c59b27] text-[#14281d]'
                        : 'bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69]'
                    }`}
                  >
                    الآيات {blk.fromAyah}-{blk.toAyah}
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-1 line-clamp-1 ${
                    isActiveBlock ? 'text-emerald-100' : 'text-neutral-500'
                  }`}
                >
                  {blk.summary}
                </p>
                <div
                  className={`text-[10px] font-bold mt-1 ${
                    isActiveBlock
                      ? 'text-[#dfbd69]'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  💡 الربط الذهني: {blk.mentalLinkTip}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Interactive Mushaf Studio Canvas (8 cols) + Audio/Tafsir Studio (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mushaf Board Canvas (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div
            ref={containerRef}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFileOver(true);
            }}
            onDragLeave={() => setIsDraggingFileOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFileOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processImageFiles(e.dataTransfer.files);
              }
            }}
            className={`bg-[#fcfaf2] dark:bg-[#0f1f17] border-4 border-double transition-all shadow-md ${
              isBoardFullscreen
                ? 'fixed inset-0 z-50 w-screen h-screen overflow-y-auto rounded-none p-6 md:p-10 pb-28'
                : 'relative rounded-3xl p-6 md:p-8 pb-24 min-h-[520px]'
            } ${
              isDraggingFileOver
                ? 'border-emerald-500 ring-4 ring-emerald-500/30'
                : 'border-[#c59b27]'
            }`}
          >
            {/* Drag & Drop Overlay Indicator */}
            {isDraggingFileOver && (
              <div className="absolute inset-4 rounded-2xl bg-[#145a3a]/90 text-white z-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#dfbd69]">
                <Upload className="w-10 h-10 text-[#dfbd69] animate-bounce" />
                <div className="text-base font-extrabold">
                  أفلت صورة صفحة المصحف هنا لفتحها على السبورة الذكية
                </div>
                <div className="text-xs text-emerald-100">
                  يمكنك الشرح عليها مباشرة بالقلم الناعم، قلم التظليل، ومؤشر الليزر
                </div>
              </div>
            )}

            {/* Live Celebration Overlay (نجوم متطايرة + بالونات + عبارات تشجيعية) */}
            {activeCelebrationFx && (
              <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-200">
                {/* Floating Stars / Balloons / Confetti Particles */}
                <div className="flex items-center justify-center gap-4 text-4xl md:text-5xl mb-3 animate-bounce">
                  {activeCelebrationFx.type === 'stars' && (
                    <>
                      <span>🌟</span>
                      <span>✨</span>
                      <span>⭐</span>
                      <span>🌟</span>
                      <span>✨</span>
                    </>
                  )}
                  {activeCelebrationFx.type === 'balloons' && (
                    <>
                      <span>🎈</span>
                      <span>🎉</span>
                      <span>🎈</span>
                      <span>🎊</span>
                      <span>🎈</span>
                    </>
                  )}
                  {activeCelebrationFx.type === 'confetti' && (
                    <>
                      <span>👑</span>
                      <span>🎉</span>
                      <span>🏆</span>
                      <span>🎉</span>
                      <span>👑</span>
                    </>
                  )}
                  {activeCelebrationFx.type === 'praise' && (
                    <>
                      <span>🔊</span>
                      <span>🌟</span>
                      <span>👏</span>
                      <span>🌟</span>
                    </>
                  )}
                </div>

                <div className="px-8 py-5 rounded-3xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white border-4 border-[#dfbd69] shadow-2xl text-center max-w-lg mx-4">
                  <div className="text-xl md:text-2xl font-extrabold text-[#dfbd69] mb-1">
                    {activeCelebrationFx.title}
                  </div>
                  <div className="text-xs md:text-sm font-bold text-emerald-100">
                    {activeCelebrationFx.subtitle}
                  </div>
                </div>
              </div>
            )}

            {/* Ready Evaluation Stamps Overlay on Board */}
            {boardStamps.length > 0 && (
              <div className="pointer-events-none absolute inset-0 z-25 overflow-hidden">
                {boardStamps.map((st) => (
                  <div
                    key={st.id}
                    style={{
                      top: `${st.y}%`,
                      right: `${st.x}%`,
                      borderColor: st.color,
                      color: st.color,
                    }}
                    className="pointer-events-auto absolute px-3 py-1 rounded-2xl border-2 bg-white/95 dark:bg-[#12231a]/95 font-extrabold text-sm shadow-lg -rotate-6 flex items-center gap-1.5"
                  >
                    <span>{st.label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setBoardStamps((prev) =>
                          prev.filter((x) => x.id !== st.id)
                        )
                      }
                      className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Fullscreen Quick Top Bar when Board is Expanded to Fullscreen */}
            {isBoardFullscreen && (
              <div className="sticky top-0 z-40 mb-5 p-3 rounded-2xl bg-[#14281d]/95 text-white backdrop-blur-md border border-[#c59b27]/50 shadow-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold border border-[#c59b27]/40">
                    وضع ملء الشاشة النشط
                  </span>
                  <select
                    value={surahId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const meta = SURAHS.find((s) => s.id === id) || SURAHS[0];
                      setSurahId(id);
                      setFromAyah(1);
                      setToAyah(Math.min(12, meta.ayahs));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#0b1711] text-white border border-emerald-800 text-xs font-bold"
                  >
                    {SURAHS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}. سورة {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <span>من</span>
                    <input
                      type="number"
                      min={1}
                      max={surahMeta.ayahs}
                      value={fromAyah}
                      onChange={(e) =>
                        setFromAyah(
                          Math.max(
                            1,
                            Math.min(surahMeta.ayahs, Number(e.target.value) || 1)
                          )
                        )
                      }
                      className="w-12 px-1.5 py-1 rounded-lg bg-[#0b1711] border border-emerald-800 text-center font-mono"
                    />
                    <span>إلى</span>
                    <input
                      type="number"
                      min={1}
                      max={surahMeta.ayahs}
                      value={toAyah}
                      onChange={(e) =>
                        setToAyah(
                          Math.max(
                            1,
                            Math.min(surahMeta.ayahs, Number(e.target.value) || 1)
                          )
                        )
                      }
                      className="w-12 px-1.5 py-1 rounded-lg bg-[#0b1711] border border-emerald-800 text-center font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Interactive Timer Pill inside Fullscreen Mode */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0b1711] border border-[#c59b27]/50 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#dfbd69]" />
                    <span className="font-mono tabular-nums text-white font-extrabold">
                      {formatTimer(remainingSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTimerRunning((prev) => !prev)}
                      className="px-2 py-0.5 rounded-md bg-[#c59b27] text-[#14281d] text-[10px] font-extrabold cursor-pointer"
                    >
                      {timerRunning ? 'إيقاف' : 'بدء'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEvaluationModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>نافذة التقييم ({markedErrorsList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTajweedAidModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-emerald-800 text-[#dfbd69] text-xs font-extrabold flex items-center gap-1.5 border border-[#c59b27]/40 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>مخارج الحروف والتجويد</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleBoardFullscreen}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>إنهاء ملء الشاشة (Esc)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Surah / Imported Page Ornamental Header */}
            <div className="text-center pb-4 mb-4 border-b border-[#c59b27]/40">
              <div className="inline-block px-8 py-2 rounded-full bg-[#145a3a] text-[#dfbd69] font-quran text-2xl font-bold shadow-xs border border-[#c59b27]">
                {boardDisplayMode === 'imported_image' && activeImportedImage
                  ? `شرح صفحة مصحف: ${activeImportedImage.name}`
                  : `سُورَةُ ${surahMeta.name}`}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                {drawMode === 'laser'
                  ? 'مؤشر الليزر الحي مفعل — اسحب فوق الآيات أو الصورة لجذب انتباه الطالب (يتلاشى تلقائياً بعد ثانيتين)'
                  : drawMode !== 'none'
                  ? 'وضع الرسم الحر والتصحيح البصري مفعل — ارسم فوق الآيات أو الصورة المستوردة بألوان التجويد'
                  : 'انقر على أي كلمة قرآنية للفحص الذكي؛ الكلمات والآيات ذات المتشابهات تتلون بالبنفسجي وتفتح نافذة الآيات المتشابهة فوراً'}
              </div>
            </div>

            {/* Interactive Color-Coding Classification Bar (شريط التصنيف اللوني ومصحف التجويد التفاعلي) */}
            {boardDisplayMode !== 'imported_image' && (
              <div className="mb-5 p-3 rounded-2xl bg-white/90 dark:bg-[#12231a]/90 border border-[#c59b27]/40 shadow-xs relative z-20 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-[#145a3a] text-[#dfbd69] text-[11px] font-extrabold">
                      التصنيف اللوني التفاعلي
                    </span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-300 font-bold">
                      تمييز لوني لأحكام التجويد وأخطاء التسميع والمتشابهات مباشرة على كلمات الآيات:
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAutoTajweedColoring((prev) => !prev)}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      autoTajweedColoring
                        ? 'bg-[#145a3a] text-[#dfbd69] border-[#c59b27] shadow-xs'
                        : 'bg-neutral-100 dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300 border-neutral-300 dark:border-emerald-900'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        autoTajweedColoring ? 'bg-[#dfbd69]' : 'bg-neutral-400'
                      }`}
                    />
                    <span>
                      {autoTajweedColoring
                        ? 'التلوين التجويدي التلقائي للكلمات: مفعل'
                        : 'تفعيل التلوين التجويدي التلقائي للكلمات'}
                    </span>
                  </button>
                </div>

                {/* Color Category Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLOR_CODING_CATEGORIES.map((cat) => {
                    const isActive = activeColorCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveColorCategoryFilter(cat.id);
                          if (cat.id !== 'all' && !autoTajweedColoring) {
                            setAutoTajweedColoring(true);
                          }
                        }}
                        title={cat.description}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'text-white shadow-xs scale-[1.02]'
                            : 'bg-[#fcfaf2] dark:bg-[#0b1711] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-emerald-900/60 hover:border-[#c59b27]'
                        }`}
                        style={
                          isActive
                            ? {
                                backgroundColor: cat.color,
                                borderColor: cat.color,
                              }
                            : undefined
                        }
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/50"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Word-by-Word Evaluation Popover (نافذة التقييم المنبثقة للكلمة وأخطاء التجويد) */}
            {inspectedWord && (
              <div className="mb-5 p-4 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#145a3a] dark:border-[#c59b27] shadow-xl relative z-30 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-emerald-950 pb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-[#145a3a] text-[#dfbd69] text-[11px] font-extrabold">
                      نافذة التقييم السريع للكلمة
                    </span>
                    <span className="font-quran text-2xl font-bold text-[#145a3a] dark:text-[#dfbd69]">
                      ﴿{inspectedWord.word}﴾
                    </span>
                    <span className="text-xs text-neutral-500 font-bold">
                      سورة {surahMeta.name} • الآية ({inspectedWord.ayahEntry.ayah}) • الطالب:{' '}
                      <strong className="text-[#14281d] dark:text-white">
                        {activeStudent?.name}
                      </strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectedWord(null)}
                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-emerald-950 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Specific Tajweed & Recitation Error Selector Pills */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300">
                    ١. اختر حكم التجويد أو نوع الخطأ في هذه الكلمة لربطه بملف الطالب:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
                    {TAJWEED_EVALUATION_PRESETS.map((preset) => {
                      const isSelected = selectedWordTajweedPresetId === preset.id;
                      const currentWordAnnot =
                        wordAnnotations[inspectedWord.wordKey];
                      const isAlreadyTaggedWithThis =
                        currentWordAnnot?.tajweedRule === preset.tajweedRule;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSelectedWordTajweedPresetId(preset.id);
                            handleAnnotateWord(
                              'error',
                              preset.errorCategory,
                              preset.color,
                              preset.label,
                              preset.tajweedRule,
                              true
                            );
                          }}
                          className={`py-2 px-3 rounded-xl flex items-center justify-between gap-1.5 border transition-all cursor-pointer text-right ${
                            isSelected || isAlreadyTaggedWithThis
                              ? 'bg-[#145a3a] text-white border-[#c59b27] ring-2 ring-[#c59b27]/40 shadow-xs'
                              : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900 text-neutral-800 dark:text-neutral-200 hover:border-[#145a3a]'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: preset.color }}
                            />
                            <span className="truncate">{preset.label}</span>
                          </span>
                          {isAlreadyTaggedWithThis && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#dfbd69] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Actions: إرسال لملف الطالب + نافذة التقييم الشاملة + المتشابهات */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-emerald-950">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const chosenPreset =
                          TAJWEED_EVALUATION_PRESETS.find(
                            (p) => p.id === selectedWordTajweedPresetId
                          ) || TAJWEED_EVALUATION_PRESETS[0];
                        const existingAnnot =
                          wordAnnotations[inspectedWord.wordKey];
                        const extraAnnotation: WordAnnotationItem =
                          existingAnnot &&
                          (existingAnnot.tagType === 'error' ||
                            existingAnnot.tagType === 'tajweed')
                            ? existingAnnot
                            : {
                                wordKey: inspectedWord.wordKey,
                                surahId,
                                ayah: inspectedWord.ayahEntry.ayah,
                                wordText: inspectedWord.word,
                                tagType: 'error',
                                errorCategory: chosenPreset.errorCategory,
                                tajweedRule: chosenPreset.tajweedRule,
                                context: evalContext,
                                color: chosenPreset.color,
                                note: chosenPreset.label,
                              };

                        handleSendEvaluationToStudentProfile({
                          extraAnnotation,
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>إرسال لملف الطالب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const chosenPreset =
                          TAJWEED_EVALUATION_PRESETS.find(
                            (p) => p.id === selectedWordTajweedPresetId
                          ) || TAJWEED_EVALUATION_PRESETS[0];
                        if (!wordAnnotations[inspectedWord.wordKey]) {
                          handleAnnotateWord(
                            'error',
                            chosenPreset.errorCategory,
                            chosenPreset.color,
                            chosenPreset.label,
                            chosenPreset.tajweedRule,
                            true
                          );
                        }
                        setShowEvaluationModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>
                        نافذة التقييم المنبثقة ({markedErrorsList.length})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const matches = findMutashabihatForWordOrAyah({
                          surahId,
                          ayahNumber: inspectedWord.ayahEntry.ayah,
                          wordText: inspectedWord.word,
                          ayahText: inspectedWord.ayahEntry.text,
                        });
                        setHighlightedMutashabihatKeys((prev) => ({
                          ...prev,
                          [inspectedWord.wordKey]: true,
                          [`ayah:${inspectedWord.ayahEntry.ayah}`]: true,
                        }));
                        handleAnnotateWord(
                          'mutashabihat',
                          undefined,
                          '#7c3aed',
                          'موضع متشابهات قرآنية'
                        );
                        setMutashabihatModalData({
                          title: `المتشابهات القرآنية لكلمة ﴿${inspectedWord.word}﴾`,
                          clickedText: inspectedWord.word,
                          surahName: surahMeta.name,
                          ayahNumber: inspectedWord.ayahEntry.ayah,
                          matches:
                            matches.length > 0 ? matches : surahMutashabihat,
                        });
                      }}
                      className="py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <GitCompare className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>عرض المتشابهات</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => playAyahAudio(inspectedWord.ayahEntry.ayah)}
                    className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#dfbd69]" />
                    <span>الاستماع للنطق</span>
                  </button>
                </div>

                {(() => {
                  const info = getWordMeaningAndTafsir(
                    inspectedWord.word,
                    inspectedWord.ayahEntry,
                    surahMeta.name
                  );
                  return (
                    <div className="text-xs text-neutral-700 dark:text-neutral-200 bg-[#fcfaf2] dark:bg-[#0b1711] p-3.5 rounded-xl border border-[#c59b27]/40 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          📖 معنى الكلمة في السياق القرآني:
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] text-[10px] font-bold">
                          المصدر: {info.tafsirSource}
                        </span>
                      </div>
                      <p className="font-bold text-neutral-800 dark:text-neutral-100 leading-relaxed">
                        {info.wordMeaning}
                      </p>
                      <div className="pt-2 border-t border-neutral-200/70 dark:border-emerald-900/50">
                        <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                          التفسير الميسر للآية ({inspectedWord.ayahEntry.ayah}):
                        </strong>{' '}
                        <span className="leading-relaxed">{info.ayahTafsir}</span>
                      </div>
                      {info.tajweedNote && (
                        <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          💡 تنبيه تجويدي: {info.tajweedNote}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Imported Mushaf Page / Image Layer (Full or Split View) */}
            {(boardDisplayMode === 'imported_image' ||
              boardDisplayMode === 'split_view') && (
              <div className="mb-6 relative z-10">
                {activeImportedImage ? (
                  <div className="rounded-2xl overflow-auto bg-white dark:bg-[#0b1711] border-2 border-[#c59b27]/50 p-3 flex items-center justify-center max-h-[620px]">
                    <img
                      ref={importedImageElemRef}
                      src={activeImportedImage.dataUrl}
                      alt={activeImportedImage.name}
                      style={{
                        width: `${imageZoom}%`,
                        transform: `rotate(${imageRotation}deg)`,
                        filter: imageHighContrast
                          ? 'contrast(1.35) brightness(1.03)'
                          : 'none',
                      }}
                      className="max-w-none rounded-xl select-none pointer-events-none transition-transform duration-200"
                    />
                  </div>
                ) : (
                  <div className="p-10 rounded-2xl border-2 border-dashed border-[#c59b27]/60 text-center space-y-3 bg-white/60 dark:bg-[#0b1711]/60">
                    <ImagePlus className="w-10 h-10 text-[#c59b27] mx-auto" />
                    <div className="text-sm font-extrabold text-[#14281d] dark:text-white">
                      لم يتم اختيار صورة صفحة مصحف بعد
                    </div>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      اضغط على الزر أدناه لاختيار صورة من جهازك (أو اسحب الصورة وأفلتها هنا) لشرح الآيات وتحديد أحكام التجويد مباشرة فوقها.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
                    >
                      اختيار صورة من الجهاز الآن
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Split View with Al-Imam Hybrid Foundation Curriculum Cards (وضع تقسيم الشاشة: المصحف + منهج الإمام للتأسيس) */}
            {boardDisplayMode === 'split_foundation' && (
              <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#145a3a] dark:border-[#c59b27] space-y-3 relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-emerald-900">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
                      منهج الإمام للتأسيس (تقسيم الشاشة التفاعلي)
                    </span>
                    <select
                      value={foundationSplitLevel}
                      onChange={(e) =>
                        setFoundationSplitLevel(
                          Number(e.target.value) as FoundationLevelNumber
                        )
                      }
                      className="px-3 py-1 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold"
                    >
                      {HYBRID_FOUNDATION_LEVELS.map((lvl) => (
                        <option key={lvl.level} value={lvl.level}>
                          {lvl.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('foundation')}
                    className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] hover:underline cursor-pointer"
                  >
                    فتح وحدة منهج الإمام للتأسيس الكاملة ←
                  </button>
                </div>

                {(() => {
                  const currentLvl =
                    HYBRID_FOUNDATION_LEVELS.find(
                      (l) => l.level === foundationSplitLevel
                    ) || HYBRID_FOUNDATION_LEVELS[0];
                  return (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold">
                        💡 {currentLvl.methodologyTag} — انقر على أي بطاقة لتفكيك المقاطع الصوتية أو التلقين الصوتي:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {currentLvl.syllableCards.map((card) => {
                          const isExpanded =
                            expandedSplitSyllableWord === card.word;
                          return (
                            <div
                              key={card.word}
                              onClick={() => {
                                setExpandedSplitSyllableWord(
                                  isExpanded ? null : card.word
                                );
                                try {
                                  if ('speechSynthesis' in window) {
                                    window.speechSynthesis.cancel();
                                    const u = new SpeechSynthesisUtterance(
                                      card.word
                                    );
                                    u.lang = 'ar-SA';
                                    u.rate = 0.8;
                                    window.speechSynthesis.speak(u);
                                  }
                                } catch {
                                  // Ignore
                                }
                              }}
                              className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 hover:border-[#145a3a] transition-all cursor-pointer text-center space-y-1.5"
                            >
                              <div className="font-quran text-2xl font-bold text-[#145a3a] dark:text-[#dfbd69]">
                                {card.word}
                              </div>
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                {card.syllables.map((syl, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      backgroundColor: `${syl.color}20`,
                                      color: syl.color,
                                      borderColor: syl.color,
                                    }}
                                    className="px-2 py-0.5 rounded-lg border font-quran text-base font-bold"
                                  >
                                    {syl.text}
                                  </span>
                                ))}
                              </div>
                              <div className="text-[10px] font-bold text-neutral-500">
                                {card.phoneticHint}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Verses Layer (Shown in 'quran_text', 'split_view', or 'split_foundation' mode) */}
            {boardDisplayMode !== 'imported_image' && (
              <>
                {loading ? (
                  <div className="py-20 text-center text-sm font-bold text-neutral-500">
                    جارٍ تحميل الآيات الكريمة...
                  </div>
                ) : (
                  <div
                    style={
                      paperPattern === 'ruled'
                        ? {
                            backgroundImage:
                              'repeating-linear-gradient(to bottom, transparent 0px, transparent 54px, rgba(197, 155, 39, 0.28) 55px)',
                          }
                        : paperPattern === 'grid'
                        ? {
                            backgroundSize: '36px 36px',
                            backgroundImage:
                              'linear-gradient(to right, rgba(20, 90, 58, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(20, 90, 58, 0.1) 1px, transparent 1px)',
                          }
                        : undefined
                    }
                    className="font-quran text-2xl md:text-3xl leading-[2.55] text-justify text-[#14281d] dark:text-[#f2f7f4] select-none relative z-10 rounded-2xl p-2"
                  >
                    {verses.map((v) => {
                      const words = v.text.split(/\s+/).filter(Boolean);
                      const isSelectedAyah = selectedAyahInfo?.ayah === v.ayah;
                      const ayahMutMatches =
                        versesMutashabihatMap.byAyahNumber[v.ayah] || [];
                      const isAyahHighlightedMut =
                        !!highlightedMutashabihatKeys[`ayah:${v.ayah}`];

                      return (
                        <span
                          key={v.ayah}
                          className={`inline rounded-2xl px-1.5 py-0.5 transition-all ${
                            isAyahHighlightedMut
                              ? 'bg-purple-500/15 dark:bg-purple-500/20 ring-1 ring-purple-500/60'
                              : isSelectedAyah
                              ? 'bg-[#c59b27]/15'
                              : ''
                          }`}
                        >
                          {words.map((word, wIdx) => {
                            const wordKey = `${v.ayah}:${wIdx}`;
                            const isRevealed = !!revealedWords[wordKey];
                            const annotation = wordAnnotations[wordKey];
                            const wordMutMatches =
                              versesMutashabihatMap.byWordKey[wordKey] || [];
                            const hasWordMutashabihat =
                              wordMutMatches.length > 0;
                            const isClickedMutHighlight =
                              !!highlightedMutashabihatKeys[wordKey];

                            // Determine if word should be masked based on MemoryMaskMode
                            const shouldHide =
                              !isRevealed &&
                              ((maskMode === 'all_hidden' && true) ||
                                (maskMode === 'first_word_only' && wIdx > 0) ||
                                (maskMode === 'hide_endings' &&
                                  wIdx >= Math.max(1, words.length - 2)));

                            const isBlurred =
                              maskMode === 'blur_hover' && !isRevealed;

                            // Automatic Tajweed & Color-Coding Classification detection for this word
                            const autoTajweedInfo =
                              detectWordAutoTajweedCategory(
                                word,
                                hasWordMutashabihat
                              );

                            // Determine if this word matches the active color category filter
                            const annotationCategory: ColorCategoryKey | null =
                              annotation?.tagType === 'mutashabihat'
                                ? 'mutashabihat'
                                : annotation?.color === '#ea580c'
                                ? 'madd'
                                : annotation?.color === '#16a34a'
                                ? 'ghunnah'
                                : annotation?.color === '#2563eb'
                                ? 'qalqalah'
                                : annotation?.color === '#ca8a04'
                                ? 'tashkeel'
                                : annotation?.tagType === 'error'
                                ? 'hifz'
                                : null;

                            const effectiveWordCategory =
                              annotationCategory || autoTajweedInfo.category;

                            const isFilteredOutByColorCategory =
                              activeColorCategoryFilter !== 'all' &&
                              effectiveWordCategory !== activeColorCategoryFilter;

                            return (
                              <span
                                key={wordKey}
                                onClick={() => {
                                  setSelectedAyahInfo(v);
                                  if (maskMode !== 'off') {
                                    setRevealedWords((prev) => ({
                                      ...prev,
                                      [wordKey]: !prev[wordKey],
                                    }));
                                  } else if (drawMode === 'none') {
                                    setInspectedWord({
                                      wordKey,
                                      word,
                                      ayahEntry: v,
                                      wordIndex: wIdx,
                                    });

                                    // Smart Mutashabihat Detection on Click:
                                    // If this word or its parent Ayah has Mutashabihat in the DB,
                                    // highlight it in a distinct royal purple/gold color and open the Mutashabihat Popup Modal!
                                    const combinedMatches =
                                      wordMutMatches.length > 0
                                        ? wordMutMatches
                                        : ayahMutMatches;
                                    if (combinedMatches.length > 0) {
                                      setHighlightedMutashabihatKeys((prev) => ({
                                        ...prev,
                                        [wordKey]: true,
                                        [`ayah:${v.ayah}`]: true,
                                      }));
                                      setMutashabihatModalData({
                                        title:
                                          wordMutMatches.length > 0
                                            ? `متشابهات الكلمة القرآنية ﴿${word}﴾`
                                            : `متشابهات الآية (${v.ayah}) من سورة ${surahMeta.name}`,
                                        clickedText: word,
                                        surahName: surahMeta.name,
                                        ayahNumber: v.ayah,
                                        matches: combinedMatches,
                                      });
                                    }
                                  }
                                }}
                                title={
                                  annotation?.tajweedRule
                                    ? `تصنيف لوني (${annotation.tajweedRule}): ${annotation.note}`
                                    : hasWordMutashabihat
                                    ? 'لهذه الكلمة متشابهات في القرآن الكريم — انقر لتمييزها وعرض قائمة الآيات المتشابهة'
                                    : autoTajweedColoring &&
                                      autoTajweedInfo.ruleLabel
                                    ? `تصنيف لوني تجويدي: ${autoTajweedInfo.ruleLabel}`
                                    : undefined
                                }
                                style={
                                  !shouldHide &&
                                  !isBlurred &&
                                  annotation?.tagType === 'error'
                                    ? {
                                        backgroundColor: `${annotation.color}24`,
                                        color: annotation.color,
                                        textDecorationColor: annotation.color,
                                      }
                                    : !shouldHide &&
                                      !isBlurred &&
                                      autoTajweedColoring &&
                                      autoTajweedInfo.category &&
                                      autoTajweedInfo.category !==
                                        'mutashabihat'
                                    ? {
                                        color: autoTajweedInfo.color,
                                        backgroundColor:
                                          activeColorCategoryFilter !== 'all' &&
                                          activeColorCategoryFilter ===
                                            autoTajweedInfo.category
                                            ? `${autoTajweedInfo.color}22`
                                            : undefined,
                                      }
                                    : undefined
                                }
                                className={`inline-block mx-1 px-1.5 rounded-lg cursor-pointer transition-all ${
                                  shouldHide
                                    ? 'bg-[#145a3a]/20 text-transparent border-b-2 border-dashed border-[#145a3a] select-none'
                                    : isBlurred
                                    ? 'blur-xs hover:blur-none transition-all duration-200'
                                    : isFilteredOutByColorCategory
                                    ? 'opacity-30 hover:opacity-90'
                                    : annotation?.tagType === 'error'
                                    ? 'underline decoration-wavy font-bold ring-1 ring-current/30'
                                    : isClickedMutHighlight ||
                                      annotation?.tagType === 'mutashabihat'
                                    ? 'bg-purple-600/25 text-purple-950 dark:bg-purple-500/30 dark:text-purple-100 ring-2 ring-purple-600 font-bold shadow-xs'
                                    : hasWordMutashabihat
                                    ? 'border-b-2 border-dotted border-purple-500/70 hover:bg-purple-500/20'
                                    : 'hover:bg-[#c59b27]/25'
                                }`}
                              >
                                {word}
                                {(isClickedMutHighlight ||
                                  annotation?.tagType === 'mutashabihat') && (
                                  <sup className="text-[10px] font-sans text-purple-700 dark:text-purple-300 mr-0.5">
                                    🔁
                                  </sup>
                                )}
                              </span>
                            );
                          })}

                          {/* Ayah Number Badge */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAyahInfo(v);
                              playAyahAudio(v.ayah);
                              if (ayahMutMatches.length > 0) {
                                setHighlightedMutashabihatKeys((prev) => ({
                                  ...prev,
                                  [`ayah:${v.ayah}`]: true,
                                }));
                                setMutashabihatModalData({
                                  title: `متشابهات الآية (${v.ayah}) — سورة ${surahMeta.name}`,
                                  clickedText: v.text,
                                  surahName: surahMeta.name,
                                  ayahNumber: v.ayah,
                                  matches: ayahMutMatches,
                                });
                              }
                            }}
                            title={
                              ayahMutMatches.length > 0
                                ? `الآية (${v.ayah}) لها (${ayahMutMatches.length}) متشابهات قرآنية — انقر لتمييز الآية وعرض المتشابهات`
                                : 'عرض تفسير الآية والاستماع إليها'
                            }
                            className={`inline-flex items-center justify-center w-8 h-8 mx-1.5 text-xs font-mono tabular-nums rounded-full border-2 transition-colors cursor-pointer ${
                              playingAyah === v.ayah
                                ? 'bg-[#145a3a] text-white border-[#c59b27]'
                                : isAyahHighlightedMut
                                ? 'bg-purple-700 text-white border-purple-400 shadow-xs'
                                : ayahMutMatches.length > 0
                                ? 'border-purple-500 text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60'
                                : 'border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] bg-white/80 dark:bg-[#12231a]'
                            }`}
                          >
                            {v.ayah}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Multi-Layer Drawing & Laser Canvas Overlay */}
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`absolute inset-0 w-full h-full z-20 ${
                drawMode !== 'none'
                  ? 'pointer-events-auto cursor-crosshair touch-none'
                  : 'pointer-events-none'
              }`}
            />

            {/* Floating Interactive Smart Board Toolbar (شريط أدوات عائم للرسم والتصحيح البصري) */}
            <div
              className={`z-30 transition-all duration-200 ${
                floatingToolbarPos === 'bottom'
                  ? 'sticky bottom-3 left-0 right-0 mt-6 mx-auto'
                  : floatingToolbarPos === 'top'
                  ? 'sticky top-3 left-0 right-0 mb-4 mx-auto'
                  : 'fixed bottom-6 left-6 max-w-md'
              }`}
            >
              <div className="rounded-2xl bg-white/95 dark:bg-[#12231a]/95 backdrop-blur-md border-2 border-[#145a3a]/40 dark:border-[#c59b27]/50 shadow-xl p-2.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Freehand & Visual Correction Tools */}
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        { id: 'none', label: 'تفاعل', icon: Sparkles },
                        { id: 'pen', label: 'قلم ناعم', icon: PenTool },
                        { id: 'calligraphy', label: 'قلم خطاط عربي', icon: PenTool },
                        { id: 'highlighter', label: 'تظليل شفاف', icon: Highlighter },
                        { id: 'laser', label: 'ليزر يتلاشى', icon: Wand2 },
                        { id: 'circle', label: 'دائرة', icon: Circle },
                        { id: 'arrow', label: 'سهم', icon: ArrowUpLeft },
                        { id: 'eraser', label: 'ممحاة', icon: Eraser },
                      ] as const
                    ).map((tool) => {
                      const Icon = tool.icon;
                      const active = drawMode === tool.id;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => setDrawMode(tool.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            active
                              ? tool.id === 'laser'
                                ? 'bg-red-600 text-white border-red-600 shadow-xs scale-105'
                                : 'bg-[#145a3a] text-white border-[#145a3a] shadow-xs scale-105'
                              : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900 text-neutral-700 dark:text-neutral-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tool.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Undo / Redo / Clear + Dock Position & Minimize Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleUndoStroke}
                      disabled={currentStrokes.length === 0}
                      title="تراجع عن آخر خطوة (Undo)"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>تراجع</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRedoStroke}
                      disabled={redoStack.length === 0}
                      title="إعادة الخطوة (Redo)"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                      <span>إعادة</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCanvas}
                      title="مسح جميع الرسومات"
                      className="px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs font-extrabold cursor-pointer"
                    >
                      مسح
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEvaluationModal(true)}
                      title="فتح نافذة التقييم المنبثقة وإرسال أخطاء التجويد المحددة لملف الطالب"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs cursor-pointer"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>تقييم وإرسال لملف الطالب</span>
                      {markedErrorsList.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#c59b27] text-[#14281d] text-[10px] font-mono">
                          {markedErrorsList.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveStudentViewModal(true)}
                      title="مشاركة السبورة وتوليد رابط مؤقت لمتابعة الطالب لحظة بلحظة"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold shadow-xs cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>مشاركة السبورة</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleBoardFullscreen}
                      title={
                        isBoardFullscreen
                          ? 'إنهاء ملء الشاشة (Esc)'
                          : 'عرض ملء الشاشة لتكبير السبورة وتغطية كامل شاشة الجهاز'
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer ${
                        isBoardFullscreen
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] border border-[#c59b27]/50'
                      }`}
                    >
                      {isBoardFullscreen ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>إنهاء ملء الشاشة</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>عرض ملء الشاشة</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFloatingToolbarPos((p) =>
                          p === 'bottom' ? 'top' : p === 'top' ? 'side' : 'bottom'
                        )
                      }
                      title="تغيير موقع الشريط العائم"
                      className="px-2 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-[10px] font-bold cursor-pointer"
                    >
                      {floatingToolbarPos === 'bottom'
                        ? 'أسفل'
                        : floatingToolbarPos === 'top'
                        ? 'أعلى'
                        : 'عائم'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFloatingToolbarMinimized((prev) => !prev)
                      }
                      title="طي / توسيع ألوان التجويد وسُمك القلم"
                      className="p-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 cursor-pointer"
                    >
                      {floatingToolbarMinimized ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Row: Tajweed Colors & Pen Stroke Width */}
                {!floatingToolbarMinimized && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/70 dark:border-emerald-900/50">
                    {/* Standard Tajweed Colors */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {TAJWEED_STANDARD_COLORS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setDrawColor(preset.color);
                            if (drawMode === 'none' || drawMode === 'eraser') {
                              setDrawMode('pen');
                            }
                          }}
                          title={preset.meaning}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            drawColor === preset.color
                              ? 'bg-white dark:bg-[#0b1711] border-neutral-900 dark:border-white scale-105 shadow-xs'
                              : 'bg-[#f6f7f2]/70 dark:bg-[#0b1711]/70 border-neutral-200 dark:border-emerald-900/50'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span>{preset.shortLabel}</span>
                        </button>
                      ))}
                    </div>

                    {/* Stroke Thickness Selector */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <span className="text-neutral-500">سُمك القلم:</span>
                      {[
                        { w: 2, label: 'رفيع' },
                        { w: 3.5, label: 'متوسط' },
                        { w: 6, label: 'عريض' },
                      ].map((sz) => (
                        <button
                          key={sz.w}
                          type="button"
                          onClick={() => setPenStrokeWidth(sz.w)}
                          className={`px-2 py-0.5 rounded-lg border cursor-pointer ${
                            penStrokeWidth === sz.w
                              ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27] font-extrabold'
                              : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>

                    {/* Ready Evaluation Stamps & Paper Ruled/Grid Background */}
                    <div className="flex flex-wrap items-center justify-between gap-2 w-full pt-2 border-t border-neutral-200/60 dark:border-emerald-900/40 text-[11px] font-bold">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-neutral-500 ml-1">أختام تقييم جاهزة:</span>
                        {[
                          { label: '🌟 ممتاز', color: '#16a34a' },
                          { label: '👍 أحسنت', color: '#145a3a' },
                          { label: '🔄 أعد القراءة', color: '#ea580c' },
                          { label: '〰️ انتبه للمد', color: '#7c3aed' },
                        ].map((stamp) => (
                          <button
                            key={stamp.label}
                            type="button"
                            onClick={() => handleAddBoardStamp(stamp.label, stamp.color)}
                            className="px-2 py-0.5 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] hover:bg-[#c59b27] hover:text-[#14281d] border border-neutral-200 dark:border-emerald-900 cursor-pointer"
                          >
                            {stamp.label}
                          </button>
                        ))}
                        {boardStamps.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setBoardStamps([])}
                            className="px-2 py-0.5 rounded-lg text-red-600 hover:underline cursor-pointer"
                          >
                            مسح الأختام
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-neutral-500">خلفية السبورة:</span>
                        {(
                          [
                            { id: 'plain', label: 'ورق قرآني' },
                            { id: 'ruled', label: 'مسطرة كراسة' },
                            { id: 'grid', label: 'شبكة هندسية' },
                          ] as const
                        ).map((pat) => (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => setPaperPattern(pat.id)}
                            className={`px-2 py-0.5 rounded-lg border cursor-pointer ${
                              paperPattern === pat.id
                                ? 'bg-[#145a3a] text-white border-[#145a3a]'
                                : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                            }`}
                          >
                            {pat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Studio Panel (4 Cols): Loop Player + Recorder Compare + Tafsir */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card A: المقرأة والتلقين التكراري (Loop & Shadowing Player) */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#c59b27]" />
                <span>المقرأة والتلقين التكراري (Shadowing)</span>
              </h3>
              {loopEnabled && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  آية {playingAyah} • تكرار {currentRepeatIteration}/{loopRepeatCount}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[11px]">
                  تكرار كل آية:
                </label>
                <div className="flex gap-1">
                  {[1, 3, 5, 10].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setLoopRepeatCount(cnt)}
                      className={`flex-1 py-1.5 rounded-lg font-mono font-bold border cursor-pointer ${
                        loopRepeatCount === cnt
                          ? 'bg-[#145a3a] text-white border-[#145a3a]'
                          : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                      }`}
                    >
                      {cnt}×
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[11px]">
                  فترة صمت لترديد الطالب:
                </label>
                <select
                  value={shadowPauseSeconds}
                  onChange={(e) => setShadowPauseSeconds(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] font-bold"
                >
                  <option value={1}>ثانية واحدة</option>
                  <option value={3}>3 ثوانٍ (ترديد قصير)</option>
                  <option value={5}>5 ثوانٍ (ترديد متوسط)</option>
                  <option value={8}>8 ثوانٍ (ترديد آية طويلة)</option>
                </select>
              </div>
            </div>

            {isShadowWaiting && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-800 dark:text-amber-300 text-xs font-extrabold text-center animate-pulse">
                🎙️ دور الطالب الآن للترديد خلف الشيخ ({shadowPauseSeconds} ثوانٍ)...
              </div>
            )}

            <button
              type="button"
              onClick={handleStartLoopPlayer}
              className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer ${
                loopEnabled
                  ? 'bg-red-600 text-white'
                  : 'bg-[#145a3a] hover:bg-[#0f452c] text-white'
              }`}
            >
              {loopEnabled ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>إيقاف التلقين التكراري</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#dfbd69]" />
                  <span>
                    بدء التلقين التكراري ({fromAyah} إلى {toAyah})
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Card B: مسجل التسميع الصوتي المقارن (Audio Recitation Recorder & Compare) */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-3.5">
            <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#c59b27]" />
              <span>مسجل التسميع الصوتي المقارن (الطالب ↔ الشيخ)</span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              سجّل تلاوة الطالب للآية وقارنها مباشرة بتلاوة القارئ المتقن:
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleStartStopStudentRecording()}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer ${
                  isRecordingStudent
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-[#c59b27] text-[#14281d]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>
                  {isRecordingStudent
                    ? `جارٍ التسجيل (${recordingSeconds}ث)... إيقاف`
                    : 'تسجيل تسميع الطالب'}
                </span>
              </button>
            </div>

            {studentAudioUrl && (
              <div className="p-3 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 space-y-2">
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  ✓ تم حفظ مقطع الطالب ({recordingSeconds} ثانية) — قارن الآن:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (studentAudioUrl === 'simulated_voice_recording') {
                        showToast('تشغيل تسجيل تلاوة الطالب المسجل...', 'info');
                        return;
                      }
                      if (studentAudioElemRef.current) {
                        studentAudioElemRef.current.pause();
                      }
                      const a = new Audio(studentAudioUrl);
                      studentAudioElemRef.current = a;
                      setIsPlayingStudentAudio(true);
                      a.onended = () => setIsPlayingStudentAudio(false);
                      a.play().catch(() => setIsPlayingStudentAudio(false));
                    }}
                    className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-[#145a3a]" />
                    <span>
                      {isPlayingStudentAudio ? 'يعمل...' : 'صوت الطالب'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      playAyahAudio(selectedAyahInfo?.ayah || fromAyah)
                    }
                    className="py-2 px-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#dfbd69]" />
                    <span>تلاوة الشيخ ({selectedAyahInfo?.ayah || fromAyah})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card C: Tafsir Al-Muyassar & Word Meanings */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-emerald-950 pb-3">
              <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#c59b27]" />
                <span>التفسير الميسر ومعاني الكلمات</span>
              </h3>
              {selectedAyahInfo && (
                <button
                  type="button"
                  onClick={() =>
                    playingAyah === selectedAyahInfo.ayah
                      ? stopAudioLoop()
                      : playAyahAudio(selectedAyahInfo.ayah)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
                >
                  {playingAyah === selectedAyahInfo.ayah ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>استماع للآية ({selectedAyahInfo.ayah})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {selectedAyahInfo ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40">
                  <div className="text-xs font-bold text-[#c59b27] mb-1">
                    سورة {surahMeta.name} — الآية ({selectedAyahInfo.ayah})
                  </div>
                  <p className="font-quran text-xl text-[#14281d] dark:text-white leading-loose">
                    {selectedAyahInfo.text}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] mb-1">
                    التفسير الميسر:
                  </h4>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-[#f6f7f2] dark:bg-[#0b1711] p-3 rounded-2xl">
                    {selectedAyahInfo.tafsir}
                  </p>
                </div>

                {Object.keys(selectedAyahInfo.meanings || {}).length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] mb-1.5">
                      معاني المفردات وغريب القرآن:
                    </h4>
                    <div className="space-y-1.5">
                      {Object.entries(selectedAyahInfo.meanings).map(
                        ([word, meaning]) => (
                          <div
                            key={word}
                            className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/70 dark:border-emerald-900/40 text-xs flex items-start gap-2"
                          >
                            <span className="font-quran font-bold text-sm text-[#145a3a] dark:text-[#dfbd69] shrink-0">
                              ﴿{word}﴾:
                            </span>
                            <span className="text-neutral-700 dark:text-neutral-300">
                              {meaning}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal 1: لوحة مخارج الحروف وأحكام التجويد المصورة (Tajweed Visual Aid) */}
      {showTajweedAidModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-emerald-900 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#c59b27]" />
                  <span>اللوحة التعليمية المصورة لمخارج الحروف وأحكام التجويد</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  اشرح للطالب مخرج الحرف الصحيح وأحكام النون والميم والمدود بشكل بصري تفاعلي
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTajweedAidModal(false)}
                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-emerald-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Makharij Diagram & Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Interactive Anatomical Vocal Tract SVG Diagram (5 Cols) */}
              <div className="lg:col-span-5 p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 flex flex-col items-center">
                <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] mb-2">
                  خريطة مخارج الحروف الخمسة الرئيسية
                </div>
                <svg viewBox="0 0 260 260" className="w-60 h-60">
                  {/* Head / Profile Silhouette */}
                  <path
                    d="M70,30 C150,20 210,60 210,130 C210,190 180,235 130,245 L95,245 L95,205 L55,190 L40,150 L60,120 L50,80 Z"
                    fill="#f3efe0"
                    stroke="#145a3a"
                    strokeWidth="2.5"
                  />

                  {/* 1. الخيشوم (Nasal Cavity) */}
                  <g
                    onClick={() => setActiveMakhrajId('khayshoom')}
                    className="cursor-pointer"
                  >
                    <ellipse
                      cx="105"
                      cy="95"
                      rx="32"
                      ry="14"
                      fill={activeMakhrajId === 'khayshoom' ? '#16a34a' : '#bbf7d0'}
                      stroke="#145a3a"
                      strokeWidth="1.5"
                    />
                    <text
                      x="105"
                      y="99"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={activeMakhrajId === 'khayshoom' ? '#ffffff' : '#14281d'}
                    >
                      ٥. الخيشوم
                    </text>
                  </g>

                  {/* 2. الشفتان (Lips) */}
                  <g
                    onClick={() => setActiveMakhrajId('shafatan')}
                    className="cursor-pointer"
                  >
                    <circle
                      cx="56"
                      cy="145"
                      r="18"
                      fill={activeMakhrajId === 'shafatan' ? '#2563eb' : '#bfdbfe'}
                      stroke="#1e40af"
                      strokeWidth="1.5"
                    />
                    <text
                      x="56"
                      y="149"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fill={activeMakhrajId === 'shafatan' ? '#ffffff' : '#1e3a8a'}
                    >
                      ٤. الشفتان
                    </text>
                  </g>

                  {/* 3. اللسان (Tongue) */}
                  <g
                    onClick={() => setActiveMakhrajId('lisan')}
                    className="cursor-pointer"
                  >
                    <ellipse
                      cx="120"
                      cy="145"
                      rx="38"
                      ry="18"
                      fill={activeMakhrajId === 'lisan' ? '#145a3a' : '#fde68a'}
                      stroke="#c59b27"
                      strokeWidth="2"
                    />
                    <text
                      x="120"
                      y="149"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill={activeMakhrajId === 'lisan' ? '#ffffff' : '#14281d'}
                    >
                      ٣. اللسان (١٨ حرفاً)
                    </text>
                  </g>

                  {/* 4. الجوف (Oral/Pharyngeal Cavity) */}
                  <g
                    onClick={() => setActiveMakhrajId('jawf')}
                    className="cursor-pointer"
                  >
                    <rect
                      x="135"
                      y="108"
                      width="56"
                      height="22"
                      rx="10"
                      fill={activeMakhrajId === 'jawf' ? '#ea580c' : '#fed7aa'}
                      stroke="#c2410c"
                      strokeWidth="1.5"
                    />
                    <text
                      x="163"
                      y="123"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={activeMakhrajId === 'jawf' ? '#ffffff' : '#7c2d12'}
                    >
                      ١. الجوف
                    </text>
                  </g>

                  {/* 5. الحلق (Throat) */}
                  <g
                    onClick={() => setActiveMakhrajId('halq')}
                    className="cursor-pointer"
                  >
                    <rect
                      x="135"
                      y="175"
                      width="48"
                      height="52"
                      rx="12"
                      fill={activeMakhrajId === 'halq' ? '#dc2626' : '#fecaca'}
                      stroke="#991b1b"
                      strokeWidth="1.5"
                    />
                    <text
                      x="159"
                      y="204"
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight="bold"
                      fill={activeMakhrajId === 'halq' ? '#ffffff' : '#7f1d1d'}
                    >
                      ٢. الحلق
                    </text>
                  </g>
                </svg>

                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  {MAKHARIJ_GUIDE.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveMakhrajId(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        activeMakhrajId === m.id
                          ? 'bg-[#145a3a] text-white'
                          : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900'
                      }`}
                    >
                      {m.title.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Makhraj Detailed Explanation (7 Cols) */}
              <div className="lg:col-span-7 space-y-3">
                {(() => {
                  const m =
                    MAKHARIJ_GUIDE.find((item) => item.id === activeMakhrajId) ||
                    MAKHARIJ_GUIDE[0];
                  return (
                    <div className="p-5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 space-y-3">
                      <div>
                        <span className="text-xs font-bold text-[#c59b27]">
                          {m.subtitle}
                        </span>
                        <h4 className="text-base font-extrabold text-[#145a3a] dark:text-white mt-0.5">
                          {m.title}
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {m.letters.map((ltr) => (
                          <span
                            key={ltr}
                            className="px-3 py-1 rounded-xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 font-quran text-base font-bold text-[#145a3a] dark:text-[#dfbd69]"
                          >
                            {ltr}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {m.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                          <div className="font-extrabold text-red-700 dark:text-red-300 mb-1">
                            ⚠️ خطأ شائع عند الطلاب:
                          </div>
                          <p className="text-neutral-700 dark:text-neutral-300">
                            {m.commonMistake}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                          <div className="font-extrabold text-emerald-800 dark:text-emerald-300 mb-1">
                            ✓ كيف تصححه للطالب:
                          </div>
                          <p className="text-neutral-700 dark:text-neutral-300">
                            {m.correctionTip}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Tajweed Rules Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-emerald-950">
              {TAJWEED_RULES_GUIDE.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-2.5"
                >
                  <h4 className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    {cat.title}
                  </h4>
                  <div className="space-y-2">
                    {cat.rules.map((r) => (
                      <div
                        key={r.name}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/70 dark:border-emerald-900/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span style={{ color: r.color }}>{r.name}</span>
                          <span className="font-quran text-sm text-[#145a3a] dark:text-[#dfbd69]">
                            {r.example}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          <strong>حروفه:</strong> {r.letters} — {r.explanation}
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

      {/* Modal 2: Live Student View & Temporary Board Share Link (نافذة مشاركة السبورة والرابط المؤقت) */}
      {liveStudentViewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-[#fcfaf2] dark:bg-[#0f1f17] border-4 border-[#c59b27] p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#c59b27]/40">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    مشاركة السبورة الحية مع الطالب — {activeStudent?.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    رابط مؤقت مشفر يتيح للطالب متابعة شاشة المعلم، التظليلات، ومؤشر الليزر لحظة بلحظة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLiveStudentViewModal(false)}
                className="p-2 rounded-xl bg-neutral-200 dark:bg-emerald-950 hover:bg-neutral-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Temporary Link Card & Controls */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
                    كود الجلسة المؤقت: {shareSessionToken}
                  </span>
                  <span className="text-xs text-neutral-500 font-bold">
                    صلاحية الرابط المؤقت:
                  </span>
                  <select
                    value={shareExpiryMinutes}
                    onChange={(e) => setShareExpiryMinutes(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    <option value={30}>30 دقيقة</option>
                    <option value={45}>45 دقيقة</option>
                    <option value={60}>60 دقيقة</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextToken = Math.random()
                      .toString(36)
                      .substring(2, 8)
                      .toUpperCase();
                    setShareSessionToken(nextToken);
                    showToast('تم توليد رابط مؤقت جديد للجلسة الحالية', 'info');
                  }}
                  className="text-xs font-bold text-[#145a3a] dark:text-[#dfbd69] hover:underline cursor-pointer"
                >
                  ↻ تجديد الرابط المؤقت
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 p-3 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 font-mono text-xs break-all select-all text-[#14281d] dark:text-emerald-100">
                  {`${window.location.origin}/?live_board=${boardKey}&token=${shareSessionToken}&exp=${shareExpiryMinutes}m&student=${activeStudent?.id || ''}`}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const tempLink = `${window.location.origin}/?live_board=${boardKey}&token=${shareSessionToken}&exp=${shareExpiryMinutes}m&student=${activeStudent?.id || ''}`;
                      navigator.clipboard?.writeText(tempLink);
                      showToast(
                        'تم نسخ الرابط المؤقت لمتابعة السبورة الحية لحظة بلحظة',
                        'success'
                      );
                    }}
                    className="px-4 py-3 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
                  >
                    نسخ الرابط المؤقت
                  </button>

                  {activeStudent && (
                    <a
                      href={`https://wa.me/${activeStudent.whatsappPhone}?text=${encodeURIComponent(
                        `السلام عليكم، تفضل رابط متابعة سبورة الإمام الذكية الحية مع المعلم لحظة بلحظة (صالح لمدة ${shareExpiryMinutes} دقيقة - كود ${shareSessionToken}):\n${window.location.origin}/?live_board=${boardKey}&token=${shareSessionToken}&exp=${shareExpiryMinutes}m`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold"
                    >
                      إرسال عبر واتساب
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Live Student Screen Mirror Preview */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                معاينة حية لما يراه الطالب على شاشته الآن:
              </div>
              <div className="relative p-6 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 min-h-[320px]">
                <div className="text-center mb-4">
                  <span className="px-6 py-1.5 rounded-full bg-[#145a3a] text-[#dfbd69] font-quran text-xl font-bold">
                    {boardDisplayMode === 'imported_image' && activeImportedImage
                      ? `صفحة المصحف: ${activeImportedImage.name}`
                      : `سُورَةُ ${surahMeta.name} (${fromAyah} - ${toAyah})`}
                  </span>
                </div>

                {(boardDisplayMode === 'imported_image' ||
                  boardDisplayMode === 'split_view') &&
                  activeImportedImage && (
                    <div className="mb-4 flex justify-center">
                      <img
                        src={activeImportedImage.dataUrl}
                        alt={activeImportedImage.name}
                        className="max-h-[340px] rounded-xl object-contain border border-[#c59b27]/40"
                      />
                    </div>
                  )}

                {boardDisplayMode !== 'imported_image' && (
                  <div className="font-quran text-2xl md:text-3xl leading-[2.5] text-justify text-[#14281d] dark:text-white">
                    {verses.map((v) => (
                      <span key={v.ayah} className="inline mx-1">
                        {v.text}{' '}
                        <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-mono rounded-full border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] mx-1">
                          {v.ayah}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                <canvas
                  ref={studentPreviewCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Online Call Quick Launcher (Google Meet / Zoom / WhatsApp) */}
      {onlineCallModal && activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-emerald-950 pb-3">
              <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                بدء جلسة تسميع أونلاين مع {activeStudent.name}
              </h3>
              <button
                type="button"
                onClick={() => setOnlineCallModal(null)}
                className="cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              المنصة المختارة:{' '}
              <strong>
                {onlineCallModal === 'meet'
                  ? 'Google Meet'
                  : onlineCallModal === 'zoom'
                  ? 'Zoom Video'
                  : 'مكالمة واتساب المباشرة'}
              </strong>
              . يمكنك نسخ دعوة الجلسة المجهزة للطالب أو بدء المؤقت فوراً:
            </p>

            <div className="p-3 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono break-all border border-neutral-200 dark:border-emerald-900">
              {onlineCallModal === 'meet'
                ? `https://meet.google.com/imam-quran-${activeStudent.id}`
                : onlineCallModal === 'zoom'
                ? `https://zoom.us/j/98541200${activeStudent.guardianPin}`
                : `https://wa.me/${activeStudent.whatsappPhone}?text=${encodeURIComponent(
                    `السلام عليكم، نبدأ الآن حصة التسميع المباشرة للطالب ${activeStudent.name} في سورة ${surahMeta.name}.`
                  )}`}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const link =
                    onlineCallModal === 'meet'
                      ? `https://meet.google.com/imam-quran-${activeStudent.id}`
                      : onlineCallModal === 'zoom'
                      ? `https://zoom.us/j/98541200${activeStudent.guardianPin}`
                      : `https://wa.me/${activeStudent.whatsappPhone}`;
                  navigator.clipboard?.writeText(link);
                  setTimerRunning(true);
                  setOnlineCallModal(null);
                  showToast(
                    'تم نسخ رابط الجلسة وبدء مؤقت الحصة الأونلاين',
                    'success'
                  );
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
              >
                نسخ الرابط وبدء مؤقت الحصة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Smart Mutashabihat Popup Modal (نافذة قائمة الآيات المتشابهة المنبثقة) */}
      {mutashabihatModalData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-[#fcfaf2] dark:bg-[#0f1f17] border-4 border-purple-600 dark:border-purple-500 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-300/60 dark:border-purple-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-700 text-white shadow-xs">
                  <GitCompare className="w-5 h-5 text-[#dfbd69]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-purple-950 dark:text-purple-200">
                    {mutashabihatModalData.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    نتائج خوارزمية البحث الذكي في قاعدة بيانات متشابهات القرآن الكريم ({mutashabihatModalData.matches.length} مواضع متشابهة)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMutashabihatModalData(null)}
                className="p-2 rounded-xl bg-neutral-200 dark:bg-emerald-950 hover:bg-neutral-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Highlighted Clicked Word / Verse Banner + In-Modal Quick Search */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/35 border border-purple-200 dark:border-purple-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                  الموضع المحدد باللون المميز:
                </span>
                {mutashabihatModalData.clickedText && (
                  <span className="px-3 py-1 rounded-xl bg-purple-600/20 text-purple-950 dark:text-purple-100 ring-2 ring-purple-600 font-quran text-lg font-bold">
                    ﴿{mutashabihatModalData.clickedText}﴾
                  </span>
                )}
                {mutashabihatModalData.ayahNumber && (
                  <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    • سورة {mutashabihatModalData.surahName} (آية {mutashabihatModalData.ayahNumber})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={smartMutashabihatQuery}
                  onChange={(e) => setSmartMutashabihatQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSmartMutashabihatSearch();
                    }
                  }}
                  placeholder="بحث سريع عن كلمة أخرى..."
                  className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#0b1711] text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleSmartMutashabihatSearch()}
                  className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold cursor-pointer"
                >
                  بحث
                </button>
              </div>
            </div>

            {/* List of Similar Verses (قائمة الآيات المتشابهة) */}
            <div className="space-y-3.5">
              {mutashabihatModalData.matches.map((item, idx) => {
                const canJumpPrimary = SURAHS.some((s) => s.id === item.surahId);
                const canJumpSimilar =
                  item.similarSurahId !== undefined &&
                  SURAHS.some((s) => s.id === item.similarSurahId);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-purple-200 dark:border-purple-900/60 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-emerald-950">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs font-mono font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          سورة {item.surahName} (آية {item.ayahNumber})
                        </span>
                        <span className="text-xs font-bold text-neutral-400">↔</span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-400/40 text-xs font-extrabold">
                          تشابه مع: سورة {item.similarSurahName} (آية {item.similarAyahNumber})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {canJumpPrimary && (
                          <button
                            type="button"
                            onClick={() => {
                              const meta =
                                SURAHS.find((s) => s.id === item.surahId) ||
                                SURAHS[0];
                              setSurahId(item.surahId);
                              setFromAyah(Math.max(1, item.ayahNumber - 1));
                              setToAyah(
                                Math.min(meta.ayahs, item.ayahNumber + 6)
                              );
                              setBoardDisplayMode('quran_text');
                              setHighlightedMutashabihatKeys((prev) => ({
                                ...prev,
                                [`ayah:${item.ayahNumber}`]: true,
                              }));
                              setMutashabihatModalData(null);
                              showToast(
                                `تم الانتقال إلى سورة ${item.surahName} (آية ${item.ayahNumber}) على السبورة`,
                                'info'
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#145a3a] hover:bg-[#0f452c] text-white text-[11px] font-bold cursor-pointer"
                          >
                            عرض سورة {item.surahName}
                          </button>
                        )}

                        {canJumpSimilar && item.similarSurahId && (
                          <button
                            type="button"
                            onClick={() => {
                              const simId = item.similarSurahId!;
                              const meta =
                                SURAHS.find((s) => s.id === simId) || SURAHS[0];
                              setSurahId(simId);
                              setFromAyah(
                                Math.max(1, item.similarAyahNumber - 1)
                              );
                              setToAyah(
                                Math.min(
                                  meta.ayahs,
                                  item.similarAyahNumber + 6
                                )
                              );
                              setBoardDisplayMode('quran_text');
                              setHighlightedMutashabihatKeys((prev) => ({
                                ...prev,
                                [`ayah:${item.similarAyahNumber}`]: true,
                              }));
                              setMutashabihatModalData(null);
                              showToast(
                                `تم الانتقال إلى الموضع المشابه في سورة ${meta.name} (آية ${item.similarAyahNumber})`,
                                'info'
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold cursor-pointer"
                          >
                            فتح الموضع المشابه
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Side-by-Side Verses Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-1">
                        <div className="text-[11px] font-extrabold text-purple-900 dark:text-purple-300">
                          الموضع الأول — سورة {item.surahName} ({item.ayahNumber}):
                        </div>
                        <div className="font-quran text-xl text-[#14281d] dark:text-white leading-relaxed">
                          {item.ayahSnippet}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/50 space-y-1">
                        <div className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300">
                          الآية المشابهة — {item.similarSurahName} ({item.similarAyahNumber}):
                        </div>
                        <div className="font-quran text-xl text-[#14281d] dark:text-white leading-relaxed">
                          {item.similarSnippet}
                        </div>
                      </div>
                    </div>

                    {/* Mnemonic Rule (ضابط التفريق) */}
                    <div className="p-3 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-[#c59b27]/40 text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
                      <strong className="text-[#145a3a] dark:text-[#dfbd69] ml-1">
                        💡 ضابط التفريق والإتقان:
                      </strong>
                      {item.dabitRule}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-purple-200 dark:border-purple-900/50">
              <button
                type="button"
                onClick={() =>
                  setMutashabihatModalData({
                    title: 'موسوعة متشابهات القرآن الكريم الكاملة',
                    surahName: 'جميع السور',
                    matches: MUTASHABIHAT_DB,
                  })
                }
                className="text-xs font-extrabold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
              >
                عرض جميع المتشابهات في القاعدة المدمجة ({MUTASHABIHAT_DB.length})
              </button>

              <button
                type="button"
                onClick={() => setMutashabihatModalData(null)}
                className="px-5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Recitation & Tajweed Evaluation Popup Modal (نافذة التقييم المنبثقة وإرسال أخطاء التجويد لملف الطالب) */}
      {showEvaluationModal && activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-[#fcfaf2] dark:bg-[#0f1f17] border-4 border-[#145a3a] dark:border-[#c59b27] p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#c59b27]/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#145a3a] text-[#dfbd69] shadow-xs">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    نافذة تقييم التسميع وأخطاء التجويد — {activeStudent.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    ربط أخطاء التجويد والتسميع المحددة على السبورة مباشرة بملف الطالب في السجل اليومي لتتبع تطور مستواه
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEvaluationModal(false)}
                className="p-2 rounded-xl bg-neutral-200 dark:bg-emerald-950 hover:bg-neutral-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student & Mastery Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60">
              <div>
                <div className="text-[11px] font-bold text-neutral-500">
                  الطالب والحلقة
                </div>
                <div className="text-sm font-extrabold text-[#14281d] dark:text-white mt-0.5">
                  {activeStudent.name}
                </div>
                <div className="text-[11px] text-[#145a3a] dark:text-[#dfbd69] font-bold">
                  {activeStudent.circle} • ({activeStudent.level})
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-neutral-500">
                  نطاق التسميع على السبورة
                </div>
                <div className="text-sm font-extrabold text-[#14281d] dark:text-white mt-0.5">
                  سورة {surahMeta.name}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  من آية ({fromAyah}) إلى ({toAyah})
                </div>
              </div>

              <div className="text-center sm:text-left flex flex-col justify-center items-start sm:items-end">
                <div className="text-[11px] font-bold text-neutral-500">
                  نسبة الإتقان المحسوبة
                </div>
                <div
                  className={`text-2xl font-extrabold font-mono tabular-nums ${
                    calculatedMasteryScore >= 90
                      ? 'text-emerald-600'
                      : calculatedMasteryScore >= 75
                      ? 'text-[#c59b27]'
                      : 'text-red-600'
                  }`}
                >
                  {calculatedMasteryScore}%
                </div>
              </div>
            </div>

            {/* Context & Grade Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 space-y-1.5">
                <label className="block text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  سياق التقييم في السجل اليومي:
                </label>
                <select
                  value={evalContext}
                  onChange={(e) => setEvalContext(e.target.value as ErrorContext)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                >
                  <option value="التسميع">التسميع العام</option>
                  <option value="الحفظ الجديد">الحفظ الجديد</option>
                  <option value="المراجعة القريبة">المراجعة القريبة</option>
                  <option value="المراجعة البعيدة">المراجعة البعيدة</option>
                  <option value="الأجزاء">مراجعة الأجزاء</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 space-y-1.5">
                <label className="block text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  التقدير العام للتسميع:
                </label>
                <div className="flex flex-wrap gap-1">
                  {(['ممتاز', 'جيد جداً', 'جيد', 'ضعيف', 'إعادة'] as GradeType[]).map(
                    (g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setEvalGrade(g)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          evalGrade === g
                            ? 'bg-[#145a3a] text-white shadow-xs'
                            : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-emerald-900'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Marked Tajweed & Recitation Errors List */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#c59b27]" />
                  <span>
                    أخطاء التجويد والتسميع المحددة على السبورة ({markedErrorsList.length})
                  </span>
                </h4>
                {markedErrorsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setWordAnnotations({})}
                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    مسح القائمة
                  </button>
                )}
              </div>

              {/* Quick Add Tajweed Rule Error Chip Bar inside Modal */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-neutral-100 dark:border-emerald-950">
                <span className="text-[11px] font-bold text-neutral-500 ml-1">
                  + إضافة سريعة لحكم تجويد:
                </span>
                {TAJWEED_EVALUATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const targetAyah = selectedAyahInfo?.ayah || fromAyah;
                      const syntheticKey = `manual_${preset.id}_${Date.now()}`;
                      setWordAnnotations((prev) => ({
                        ...prev,
                        [syntheticKey]: {
                          wordKey: syntheticKey,
                          surahId,
                          ayah: targetAyah,
                          wordText: `آية ${targetAyah}`,
                          tagType: 'error',
                          errorCategory: preset.errorCategory,
                          tajweedRule: preset.tajweedRule,
                          context: evalContext,
                          color: preset.color,
                          note: preset.label,
                        },
                      }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] hover:bg-[#145a3a] hover:text-white border border-neutral-200 dark:border-emerald-900 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span>{preset.tajweedRule}</span>
                  </button>
                ))}
              </div>

              {markedErrorsList.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {markedErrorsList.map((item) => (
                    <div
                      key={item.wordKey}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/50 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-lg text-white font-extrabold text-[11px]"
                          style={{ backgroundColor: item.color || '#ea580c' }}
                        >
                          {item.errorCategory || 'تجويد'}
                        </span>
                        <span className="font-quran text-base font-bold text-[#145a3a] dark:text-[#dfbd69]">
                          ﴿{item.wordText}﴾
                        </span>
                        <span className="font-bold text-neutral-700 dark:text-neutral-200">
                          {item.tajweedRule || item.note}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          • سورة {surahMeta.name} (آية {item.ayah})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setWordAnnotations((prev) => {
                            const next = { ...prev };
                            delete next[item.wordKey];
                            return next;
                          })
                        }
                        className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="حذف هذا الخطأ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-neutral-500 bg-[#f6f7f2]/60 dark:bg-[#0b1711]/60 rounded-xl">
                  لم يتم تحديد أخطاء كلمات بعد؛ يمكنك النقر على أي كلمة قرآنية على السبورة أو استخدام أزرار الإضافة السريعة أعلاه لتسجيل ملاحظات التجويد.
                </div>
              )}
            </div>

            {/* Custom Teacher Note Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                ملاحظات وتوجيهات المعلم لملف الطالب وولي الأمر (اختياري):
              </label>
              <input
                type="text"
                value={evalCustomNote}
                onChange={(e) => setEvalCustomNote(e.target.value)}
                placeholder="مثال: يحتاج الطالب لتدريب إضافي على تحقيق المد المتصل والغنة في سورة الملك..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#12231a] text-xs font-semibold"
              />
            </div>

            {/* Modal Footer: Primary 'إرسال لملف الطالب' Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#c59b27]/40">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendEvaluationToStudentProfile()}
                  className="px-5 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4 text-[#dfbd69]" />
                  <span>إرسال لملف الطالب</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendEvaluationToStudentProfile({
                      navigateToTab: 'session',
                    })
                  }
                  className="px-4 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>إرسال لملف الطالب وفتح السجل اليومي</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowEvaluationModal(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-200 dark:bg-emerald-950 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10th Quran Text & Tafsir Modal inside SmartBoardView */}
      <QuranTextModal
        open={boardQuranModalOpen}
        onClose={() => setBoardQuranModalOpen(false)}
        sectionTitle="السبورة الذكية وغرفة التسميع الحية"
        surahId={surahId}
        fromAyah={fromAyah}
        toAyah={toAyah}
        context={evalContext}
        studentName={activeStudent?.name}
        onUpdateRange={(newSurahId, newFrom, newTo) => {
          setSurahId(newSurahId);
          setFromAyah(newFrom);
          setToAyah(newTo);
        }}
        onRecordError={(err) => {
          const wKey = `${err.surahId || surahId}:${err.ayah || fromAyah}:${err.wordIndex ?? 0}:${err.word || ''}`;
          setWordAnnotations((prev) => ({
            ...prev,
            [wKey]: {
              wordKey: wKey,
              surahId: err.surahId || surahId,
              ayah: err.ayah || fromAyah,
              wordText: err.word || '',
              tagType: 'error',
              errorCategory: err.type,
              tajweedRule: err.subType || err.type,
              context: err.context,
              color: '#dc2626',
              note: err.note || '',
            },
          }));
          showToast(
            `تم قيد الملاحظة على كلمة ﴿${err.word}﴾ في السبورة الذكية`,
            'success'
          );
        }}
      />
    </div>
  );
};


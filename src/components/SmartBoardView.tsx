import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  AyahEntry,
  getEveryAyahAudioUrl,
  loadSurahVerses,
  RECITERS,
  SURAHS,
} from '../data/quranData';
import {
  findMutashabihatForWordOrAyah,
  MAKHARIJ_GUIDE,
  MUTASHABIHAT_DB,
  MutashabihatEntry,
  TAJWEED_RULES_GUIDE,
} from '../data/smartSuiteData';
import { getLocalDateString } from '../data/seedData';
import {
  ErrorContext,
  ErrorType,
  GradeType,
  RecitationError,
  ReciterId,
} from '../types';
import { QuranTextModal } from './QuranTextModal';
import { ACADEMY_BRAND_CONFIG } from '../constants/brandConfig';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  Compass,
  Copy,
  Crown,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FileText,
  Film,
  Flame,
  GitCompare,
  Grid,
  HelpCircle,
  Highlighter,
  ImagePlus,
  Layers,
  Maximize2,
  Mic,
  Minimize2,
  Monitor,
  Move,
  Palette,
  Pause,
  PenTool,
  Play,
  Plus,
  Printer,
  Redo2,
  RefreshCw,
  RotateCcw,
  Ruler,
  Save,
  Search,
  Send,
  Share2,
  Sparkles,
  Square,
  Star,
  StickyNote,
  Target,
  Trash2,
  Type,
  Undo2,
  Upload,
  Video,
  Volume2,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES FOR THE 3-PANEL SMART BOARD STUDIO
// ============================================================================

type StudioToolId =
  | 'select' // (V) التحديد والتحريك
  | 'pen' // (P) قلم عادي
  | 'calligraphy' // (C) قلم الخط العربي المائل
  | 'brush' // فرشاة
  | 'chalk' // طباشير
  | 'highlighter' // (H) ماركر تظليل فسفوري
  | 'spray' // بخاخ
  | 'laser' // (L) مؤشر الليزر المؤقت
  | 'text' // (T) أداة النص والتشكيل القرآني
  | 'eraser' // (E) الممحاة الذكية
  | 'line' // (S) خط مستقيم
  | 'arrow' // سهم
  | 'rect' // مستطيل
  | 'circle' // دائرة
  | 'triangle' // مثلث
  | 'diamond' // معين
  | 'stamp'; // (M) الأختام التربوية والقرآنية

type StrokeLineStyle = 'solid' | 'dotted' | 'dashed';

type BoardBgColorId = 'white' | 'night_black' | 'school_green' | 'quran_cream';

type BoardGridPatternId =
  | 'plain'
  | 'grid'
  | 'ruled'
  | 'wide_ruled'
  | 'dotted'
  | 'arabic_calligraphy'
  | 'spelling_foundation'
  | 'kids_friendly';

type CursorTrailEffectId =
  | 'none'
  | 'stars'
  | 'bubbles'
  | 'hearts'
  | 'ripples'
  | 'ribbon'
  | 'neon_glow'
  | 'magic_dust'
  | 'snow';

interface StudioPoint {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  pressure?: number;
}

interface StudioStroke {
  id: string;
  tool: StudioToolId;
  color: string;
  width: number;
  opacity: number; // 0.1 .. 1.0
  lineStyle: StrokeLineStyle;
  points: StudioPoint[];
}

interface StudioTextElement {
  id: string;
  text: string;
  x: number; // percentage 5..90
  y: number; // percentage 5..90
  color: string;
  fontSize: number;
}

interface StudioStampElement {
  id: string;
  stampType: 'ahsant' | 'mumtaz' | 'hafiz' | 'mashallah' | 'try_again';
  label: string;
  subLabel: string;
  color: string;
  bgColor: string;
  x: number; // percentage 5..85
  y: number; // percentage 5..85
}

interface StudioStickyNote {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

interface StudioBoardPage {
  id: string;
  title: string;
  bgColor: BoardBgColorId;
  gridPattern: BoardGridPatternId;
  strokes: StudioStroke[];
  texts: StudioTextElement[];
  stamps: StudioStampElement[];
  stickyNotes: StudioStickyNote[];
  backgroundDataUrl?: string | null;
  makharijCardType?: 'none' | 'makharij_map' | 'noon_rules' | 'madd_rules';
}

interface LaserTrailPoint {
  x: number;
  y: number;
  createdAt: number;
}

interface TrailParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  effect: CursorTrailEffectId;
  label?: string;
}

interface RisingBalloon {
  id: string;
  x: number; // percentage 8..92
  y: number; // percentage 100 -> -15
  speed: number;
  color: string;
  label: string;
  popped: boolean;
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

// ============================================================================
// CONSTANTS & PRESETS
// ============================================================================

const BOARD_BG_COLORS: {
  id: BoardBgColorId;
  label: string;
  hex: string;
  textColor: string;
  lineColor: string;
}[] = [
  {
    id: 'quran_cream',
    label: 'أصفر كريمي قرآني',
    hex: '#fcfaf2',
    textColor: '#14281d',
    lineColor: 'rgba(20, 90, 58, 0.16)',
  },
  {
    id: 'white',
    label: 'أبيض ناصع',
    hex: '#ffffff',
    textColor: '#0f172a',
    lineColor: 'rgba(15, 23, 42, 0.14)',
  },
  {
    id: 'school_green',
    label: 'أخضر مدرسي',
    hex: '#134229',
    textColor: '#f8fafc',
    lineColor: 'rgba(223, 189, 105, 0.22)',
  },
  {
    id: 'night_black',
    label: 'أسود ليلي',
    hex: '#0b1310',
    textColor: '#f1f5f9',
    lineColor: 'rgba(255, 255, 255, 0.15)',
  },
];

const BOARD_GRID_PATTERNS: {
  id: BoardGridPatternId;
  label: string;
}[] = [
  { id: 'plain', label: 'سادة' },
  { id: 'grid', label: 'شبكة مربعات' },
  { id: 'ruled', label: 'مسطر' },
  { id: 'wide_ruled', label: 'مسطر عريض' },
  { id: 'dotted', label: 'نقاط' },
  { id: 'arabic_calligraphy', label: 'سطرين للخط العربي' },
  { id: 'spelling_foundation', label: 'مخطط إملائي وتأسيس' },
  { id: 'kids_friendly', label: 'خلفية محببة للأطفال' },
];

const QUICK_10_COLORS = [
  '#dc2626', // أحمر تصحيح
  '#145a3a', // أخضر زمردي
  '#c59b27', // ذهبي قرآني
  '#2563eb', // أزرق قلقلة
  '#ea580c', // برتقالي مدود
  '#16a34a', // أخضر غنة
  '#7c3aed', // بنفسجي متشابهات
  '#0d9488', // فيروزي
  '#db2777', // وردي
  '#111827', // أسود خطاط
];

const TASHKEEL_AND_UTHMANI_SYMBOLS: {
  symbol: string;
  name: string;
  sample: string;
}[] = [
  { symbol: 'َ', name: 'فتحة', sample: 'بَ' },
  { symbol: 'ُ', name: 'ضمة', sample: 'بُ' },
  { symbol: 'ِ', name: 'كسرة', sample: 'بِ' },
  { symbol: 'ْ', name: 'سكون', sample: 'بْ' },
  { symbol: 'ّ', name: 'شدة', sample: 'بّ' },
  { symbol: 'ً', name: 'تنوين فتح', sample: 'بً' },
  { symbol: 'ٌ', name: 'تنوين ضم', sample: 'بٌ' },
  { symbol: 'ٍ', name: 'تنوين كسر', sample: 'بٍ' },
  { symbol: 'ٓ', name: 'علامة المد ~', sample: 'آٓ' },
  { symbol: 'ٰ', name: 'ألف خنجرية', sample: 'ـٰ' },
  { symbol: 'ۢ', name: 'ميم الإقلاب', sample: 'نۢ' },
];

const EDUCATIONAL_STAMPS: {
  type: StudioStampElement['stampType'];
  label: string;
  subLabel: string;
  color: string;
  bgColor: string;
}[] = [
  {
    type: 'ahsant',
    label: 'أحسنت ✓',
    subLabel: 'تلاوة طيبة ومباركة',
    color: '#15803d',
    bgColor: '#dcfce7',
  },
  {
    type: 'mumtaz',
    label: 'ممتاز ★',
    subLabel: 'إتقان متميز للأحكام',
    color: '#b45309',
    bgColor: '#fef3c7',
  },
  {
    type: 'hafiz',
    label: 'حافظ متقن 👑',
    subLabel: 'تاج الوقار والإتقان',
    color: '#6d28d9',
    bgColor: '#ede9fe',
  },
  {
    type: 'mashallah',
    label: 'ما شاء الله ✨',
    subLabel: 'فتح الله عليك وزادك نوراً',
    color: '#0f766e',
    bgColor: '#ccfbf1',
  },
  {
    type: 'try_again',
    label: 'انتبه / حاول مرة أخرى ✗',
    subLabel: 'راجع المخرج والحركة بتأنٍّ',
    color: '#b91c1c',
    bgColor: '#fee2e2',
  },
];

const CURSOR_TRAIL_EFFECTS: {
  id: CursorTrailEffectId;
  label: string;
  icon: string;
}[] = [
  { id: 'none', label: 'بدون تأثير', icon: '⊘' },
  { id: 'stars', label: 'نجوم متطايرة', icon: '🌟' },
  { id: 'bubbles', label: 'فقاعات', icon: '🫧' },
  { id: 'hearts', label: 'قلوب', icon: '💚' },
  { id: 'ripples', label: 'دوائر متموجة', icon: '◎' },
  { id: 'ribbon', label: 'شريط ملون', icon: '🎗️' },
  { id: 'neon_glow', label: 'توهج نيون', icon: '⚡' },
  { id: 'magic_dust', label: 'غبار سحري', icon: '✨' },
  { id: 'snow', label: 'ثلج', icon: '❄️' },
];

// ============================================================================
// INDEXED-DB STORAGE FOR MULTI-PAGE SMART BOARD
// ============================================================================

const IDB_NAME = 'imam_smartboard_studio_idb_v2';
const IDB_STORE = 'board_pages_store';
const IDB_KEY = 'active_studio_pages';

function openBoardIDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function savePagesToIDB(pages: StudioBoardPage[]): Promise<void> {
  const db = await openBoardIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(pages, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function loadPagesFromIDB(): Promise<StudioBoardPage[] | null> {
  const db = await openBoardIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        if (Array.isArray(req.result) && req.result.length > 0) {
          resolve(req.result as StudioBoardPage[]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function createDefaultPage(index: number): StudioBoardPage {
  return {
    id: `page-${Date.now()}-${index}`,
    title: `صفحة ${index}`,
    bgColor: 'quran_cream',
    gridPattern: 'plain',
    strokes: [],
    texts: [],
    stamps: [],
    stickyNotes: [],
    backgroundDataUrl: null,
    makharijCardType: 'none',
  };
}

// ============================================================================
// HTML5 CANVAS 2D PARTICLE SYSTEM TYPES & PRESETS
// ============================================================================

type ParticleEffectMode =
  | 'confetti' // قصاصات الورق الملونة
  | 'golden_stars' // نجوم التفوق الذهبية
  | 'balloons_party' // بالونات الاحتفال الملونة
  | 'fireworks' // الألعاب النارية الاحتفالية
  | 'quranic_light' // أنوار وتيجان الوقار
  | 'emerald_petals' // بتلات الزمرد والذهب
  | 'fountain_sparks'; // نافورة الشرارات المضيئة

type ParticleDensityLevel = 'light' | 'medium' | 'intense';

interface CanvasBurstParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRotation: number;
  shape: 'rect' | 'circle' | 'star' | 'ribbon' | 'petal' | 'emoji';
  emoji?: string;
}

const PARTICLE_EFFECT_PATTERNS: {
  id: ParticleEffectMode;
  label: string;
  subLabel: string;
  icon: string;
  badgeColor: string;
}[] = [
  {
    id: 'golden_stars',
    label: 'نجوم التفوق الذهبية (Stars)',
    subLabel: 'انفجار نجوم خماسية متلألئة بالذهب والزمرد',
    icon: '🌟',
    badgeColor: '#f59e0b',
  },
  {
    id: 'balloons_party',
    label: 'بالونات الاحتفال الملونة (Balloons)',
    subLabel: 'بالونات صاعدة وجزيئات احتفالية مبهجة مع فرقعة صوتية',
    icon: '🎈',
    badgeColor: '#ec4899',
  },
  {
    id: 'confetti',
    label: 'قصاصات ملونة (Confetti)',
    subLabel: 'مدافع قصاصات ورقية دوارة متعددة الألوان',
    icon: '🎊',
    badgeColor: '#10b981',
  },
  {
    id: 'fireworks',
    label: 'ألعاب نارية احتفالية',
    subLabel: 'صواريخ وانفجارات ضوئية متتابعة في سماء السبورة',
    icon: '🎆',
    badgeColor: '#8b5cf6',
  },
  {
    id: 'quranic_light',
    label: 'أنوار وتيجان الوقار',
    subLabel: 'تيجان ذهبية وهالات نورانية صاعدة عند إتمام التسميع',
    icon: '👑',
    badgeColor: '#c59b27',
  },
  {
    id: 'emerald_petals',
    label: 'بتلات الزمرد والريحان',
    subLabel: 'أوراق زمردية وذهبية تتساقط بانسيابية هادئة',
    icon: '🍃',
    badgeColor: '#059669',
  },
  {
    id: 'fountain_sparks',
    label: 'نافورة النصر المضيئة',
    subLabel: 'ينبوع شرارات ذهبية صاعدة من أسفل السبورة',
    icon: '✨',
    badgeColor: '#eab308',
  },
];

// ============================================================================
// WEB AUDIO API SOUND EFFECTS SYNTHESIZER (100% OFFLINE + VOLUME CONTROL)
// ============================================================================

type SoundEffectType =
  | 'fanfare'
  | 'takbeer_chime'
  | 'applause'
  | 'drums'
  | 'bell'
  | 'correct'
  | 'wrong'
  | 'whistle'
  | 'countdown'
  | 'magic_wand'
  | 'balloon_pop'
  | 'gavel'
  | 'spark_pop';

const INTERACTIVE_SOUND_PRESETS: {
  id: SoundEffectType;
  label: string;
  icon: string;
  category: 'win' | 'recitation' | 'alert';
}[] = [
  { id: 'fanfare', label: 'بوق الفوز والتتويج', icon: '🎺', category: 'win' },
  { id: 'takbeer_chime', label: 'رنين الفتح والإتمام', icon: '🕌', category: 'recitation' },
  { id: 'applause', label: 'تصفيق حار وتشجيع', icon: '👏', category: 'win' },
  { id: 'correct', label: 'نغمة إجابة وتسميع متقن', icon: '✅', category: 'recitation' },
  { id: 'magic_wand', label: 'بريق النجوم السحري', icon: '🪄', category: 'win' },
  { id: 'bell', label: 'جرس الإجادة الذهبي', icon: '🔔', category: 'recitation' },
  { id: 'drums', label: 'طبول التشويق والحماس', icon: '🥁', category: 'win' },
  { id: 'whistle', label: 'صفارة التحكيم', icon: '📯', category: 'alert' },
  { id: 'countdown', label: 'نبضات العد التنازلي', icon: '⏱️', category: 'alert' },
  { id: 'wrong', label: 'تنبيه مراجعة الآية', icon: '❌', category: 'alert' },
];

function playSynthesizedSoundFX(
  type: SoundEffectType,
  volumeMultiplier = 1.0
): void {
  try {
    if (volumeMultiplier <= 0.01) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const vol = Math.max(0.05, Math.min(1.5, volumeMultiplier));

    if (type === 'fanfare') {
      // Royal Victory Fanfare (C5 - E5 - G5 - C6 with harmonic brass)
      const notes = [
        { freq: 523.25, t: 0, d: 0.16 },
        { freq: 523.25, t: 0.18, d: 0.16 },
        { freq: 523.25, t: 0.36, d: 0.16 },
        { freq: 659.25, t: 0.54, d: 0.32 },
        { freq: 587.33, t: 0.88, d: 0.22 },
        { freq: 659.25, t: 1.12, d: 0.22 },
        { freq: 783.99, t: 1.36, d: 0.65 },
        { freq: 1046.5, t: 1.36, d: 0.65 },
      ];
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.t);
        gain.gain.setValueAtTime(0.22 * vol, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d + 0.03);
      });
    } else if (type === 'takbeer_chime') {
      // Warm Spiritual Harmonic Chime for completing a Quranic passage
      const chord = [440, 554.37, 659.25, 880, 1108.73];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.2 * vol, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.09 + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 1.15);
      });
    } else if (type === 'spark_pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(780 + Math.random() * 420, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
      gain.gain.setValueAtTime(0.14 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'correct') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.18 * vol, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.38);
      });
    } else if (type === 'wrong') {
      [220, 185].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);
        gain.gain.setValueAtTime(0.15 * vol, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.3);
      });
    } else if (type === 'bell') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
      gain.gain.setValueAtTime(0.25 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.15);
    } else if (type === 'magic_wand') {
      [587, 740, 880, 1174, 1480, 1760].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.14 * vol, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.27);
      });
    } else if (type === 'whistle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.linearRampToValueAtTime(2200, now + 0.18);
      osc.frequency.linearRampToValueAtTime(1800, now + 0.45);
      gain.gain.setValueAtTime(0.2 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.52);
    } else if (type === 'countdown') {
      [0, 0.35, 0.7, 1.05].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 3 ? 987.77 : 493.88, now + offset);
        gain.gain.setValueAtTime(0.2 * vol, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      });
    } else if (type === 'drums') {
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 - (i % 2) * 25, now + i * 0.09);
        osc.frequency.exponentialRampToValueAtTime(45, now + i * 0.09 + 0.08);
        gain.gain.setValueAtTime(0.25 * vol, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.085);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.09);
      }
    } else if (type === 'applause') {
      // Synthesize burst claps using white noise buffer
      const bufferSize = ctx.sampleRate * 1.2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.6));
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.15);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + 1.2);
    } else if (type === 'balloon_pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);
      gain.gain.setValueAtTime(0.35 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'gavel') {
      [0, 0.28].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, now + offset);
        osc.frequency.exponentialRampToValueAtTime(42, now + offset + 0.12);
        gain.gain.setValueAtTime(0.3 * vol, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.15);
      });
    }
  } catch {
    // Ignore audio context block
  }
}

// ============================================================================
// MAIN SMART BOARD STUDIO COMPONENT
// ============================================================================

export interface SmartBoardViewProps {
  embeddedInSessionFocus?: boolean;
  initialSurahId?: number;
  initialFromAyah?: number;
  initialToAyah?: number;
}

export const SmartBoardView: React.FC<SmartBoardViewProps> = ({
  embeddedInSessionFocus = false,
  initialSurahId,
  initialFromAyah,
  initialToAyah,
}) => {
  const {
    students,
    sessions,
    circles,
    selectedStudentId,
    setSelectedStudentId,
    setActiveTab,
    saveBoardStrokes,
    saveSession,
    saveStudent,
    addStudentXp,
    awardStudentBadge,
    toggleStudentGoldenCrown,
    showToast,
    isFullScreenFocus,
    setIsFullScreenFocus,
    setIsDeveloperModalOpen,
  } = useAcademy();

  const activeStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  // ==========================================================================
  // 1. 3-PANEL LAYOUT & MULTI-PAGE STATE
  // ==========================================================================
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(
    !isFullScreenFocus && !embeddedInSessionFocus
  );
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(
    !isFullScreenFocus && !embeddedInSessionFocus
  );
  const [pages, setPages] = useState<StudioBoardPage[]>([createDefaultPage(1)]);
  const [currentPageIdx, setCurrentPageIdx] = useState<number>(0);
  const [undoStack, setUndoStack] = useState<StudioStroke[][]>([]);
  const [redoStack, setRedoStack] = useState<StudioStroke[][]>([]);

  useEffect(() => {
    if (isFullScreenFocus || embeddedInSessionFocus) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    } else {
      setLeftPanelOpen(true);
      setRightPanelOpen(true);
    }
  }, [isFullScreenFocus, embeddedInSessionFocus]);

  const currentPage = pages[currentPageIdx] || pages[0];

  // Load saved pages from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    loadPagesFromIDB().then((loaded) => {
      if (mounted && loaded && loaded.length > 0) {
        setPages(loaded);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Save pages to IndexedDB whenever they change
  useEffect(() => {
    void savePagesToIDB(pages);
  }, [pages]);

  const updateCurrentPage = useCallback(
    (updater: (page: StudioBoardPage) => StudioBoardPage) => {
      setPages((prev) =>
        prev.map((p, idx) => (idx === currentPageIdx ? updater(p) : p))
      );
    },
    [currentPageIdx]
  );

  // ==========================================================================
  // 2. TOOL, COLOR, STROKE, ZOOM & PAN STATE
  // ==========================================================================
  const [activeTool, setActiveTool] = useState<StudioToolId>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#dc2626');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [strokeOpacity, setStrokeOpacity] = useState<number>(100); // 10..100
  const [strokeLineStyle, setStrokeLineStyle] =
    useState<StrokeLineStyle>('solid');
  const [selectedStampType, setSelectedStampType] =
    useState<StudioStampElement['stampType']>('ahsant');
  const [cursorTrailEffect, setCursorTrailEffect] =
    useState<CursorTrailEffectId>('none');

  // Zoom & Pan
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Advanced Left Panel Options
  const [penPressureEnabled, setPenPressureEnabled] = useState<boolean>(true);
  const [autoShapeEnabled, setAutoShapeEnabled] = useState<boolean>(false);
  const [clipboardPasteEnabled, setClipboardPasteEnabled] =
    useState<boolean>(true);
  const [zoomShareOptimizer, setZoomShareOptimizer] = useState<boolean>(false);
  const [confirmClearModalOpen, setConfirmClearModalOpen] =
    useState<boolean>(false);
  const [shortcutsHelpModalOpen, setShortcutsHelpModalOpen] =
    useState<boolean>(false);

  // Floating Dock Popover Menus
  const [openDockMenu, setOpenDockMenu] = useState<
    null | 'pens' | 'shapes' | 'stamps' | 'trails' | 'utilities' | 'text_bar'
  >(null);

  // Text & Quranic Tashkeel Input State
  const [draftBoardText, setDraftBoardText] = useState<string>(
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
  );
  const [draftTextSize, setDraftTextSize] = useState<number>(28);

  // ==========================================================================
  // 3. QURANIC LAYER, TAJWEED, MUTASHABIHAT & AUDIO STATE (Preserved & Enhanced)
  // ==========================================================================
  const [showQuranLayerOnBoard, setShowQuranLayerOnBoard] =
    useState<boolean>(true);
  const [quranPickerModalOpen, setQuranPickerModalOpen] =
    useState<boolean>(false);
  const [surahId, setSurahId] = useState<number>(
    initialSurahId || activeStudent?.currentStop.surahId || 67
  );
  const [fromAyah, setFromAyah] = useState<number>(initialFromAyah || 1);
  const [toAyah, setToAyah] = useState<number>(initialToAyah || 8);

  useEffect(() => {
    if (initialSurahId) setSurahId(initialSurahId);
    if (initialFromAyah) setFromAyah(initialFromAyah);
    if (initialToAyah) setToAyah(initialToAyah);
  }, [initialSurahId, initialFromAyah, initialToAyah]);
  const [verses, setVerses] = useState<AyahEntry[]>([]);
  const [loadingVerses, setLoadingVerses] = useState<boolean>(false);
  const [reciter, setReciter] = useState<ReciterId>('Husary_128kbps');
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Word hiding/revealing for memorization testing & word error annotations
  const [hideAllQuranWords, setHideAllQuranWords] = useState<boolean>(false);
  const [hiddenWordKeys, setHiddenWordKeys] = useState<Record<string, boolean>>(
    {}
  );
  const [wordAnnotations, setWordAnnotations] = useState<
    Record<string, WordAnnotationItem>
  >({});
  const [inspectedWord, setInspectedWord] = useState<{
    wordKey: string;
    word: string;
    ayahEntry: AyahEntry;
  } | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] =
    useState<boolean>(false);
  const [evalGrade, setEvalGrade] = useState<GradeType>('ممتاز');
  const [evalCustomNote, setEvalCustomNote] = useState<string>('');
  const [mutashabihatModalData, setMutashabihatModalData] = useState<{
    title: string;
    surahName: string;
    matches: MutashabihatEntry[];
  } | null>(null);

  const surahMeta = SURAHS.find((s) => s.id === surahId) || SURAHS[0];

  useEffect(() => {
    let active = true;
    setLoadingVerses(true);
    loadSurahVerses(surahId, fromAyah, toAyah).then((res) => {
      if (!active) return;
      setVerses(res);
      setLoadingVerses(false);
    });
    return () => {
      active = false;
    };
  }, [surahId, fromAyah, toAyah]);

  const playHusaryAyahAudio = (ayahNum: number) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const url = getEveryAyahAudioUrl(reciter, surahId, ayahNum);
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingAyah(ayahNum);
      audio.onended = () => setPlayingAyah(null);
      audio.onerror = () => setPlayingAyah(null);
      audio.play().catch(() => setPlayingAyah(null));
    } catch {
      setPlayingAyah(null);
    }
  };

  // ==========================================================================
  // 4. PRESENTATION, RECORDING & UTILITY GADGETS STATE
  // ==========================================================================
  const [spotlightActive, setSpotlightActive] = useState<boolean>(false);
  const [mouseHaloActive, setMouseHaloActive] = useState<boolean>(false);
  const [screenFrozen, setScreenFrozen] = useState<boolean>(false);
  const [frozenSnapshotUrl, setFrozenSnapshotUrl] = useState<string | null>(
    null
  );
  const [trafficLightState, setTrafficLightState] = useState<
    null | 'red' | 'yellow' | 'green'
  >(null);
  const [smartTimerOpen, setSmartTimerOpen] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(15 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Utility Gadgets (G)
  const [magnifierActive, setMagnifierActive] = useState<boolean>(false);
  const [curtainActive, setCurtainActive] = useState<boolean>(false);
  const [curtainProgressPct, setCurtainProgressPct] = useState<number>(45);
  const [wheelModalOpen, setWheelModalOpen] = useState<boolean>(false);
  const [wheelSpinning, setWheelSpinning] = useState<boolean>(false);
  const [wheelRotationDeg, setWheelRotationDeg] = useState<number>(0);
  const [wheelWinnerName, setWheelWinnerName] = useState<string | null>(null);
  const [rulerActive, setRulerActive] = useState<boolean>(false);
  const [protractorActive, setProtractorActive] = useState<boolean>(false);
  const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false);
  const [calcExpression, setCalcExpression] = useState<string>('');

  // Media Imports (Image, PDF, YouTube, Makharij)
  const [makharijPickerOpen, setMakharijPickerOpen] = useState<boolean>(false);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState<boolean>(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState<string>('');
  const [embeddedYoutubeId, setEmbeddedYoutubeId] = useState<string | null>(
    null
  );
  const [pdfExplainerActive, setPdfExplainerActive] = useState<boolean>(false);
  const [pdfFileName, setPdfFileName] = useState<string>('');

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportInputRef = useRef<HTMLInputElement | null>(null);

  // Screen + Audio Video Recording (MediaRecorder API)
  const [isVideoRecording, setIsVideoRecording] = useState<boolean>(false);
  const [videoRecordSeconds, setVideoRecordSeconds] = useState<number>(0);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<BlobPart[]>([]);

  // Celebration, HTML5 Canvas Particle System & Interactive Sound FX State
  const [celebrationModalOpen, setCelebrationModalOpen] =
    useState<boolean>(false);
  const [activeVisualCelebration, setActiveVisualCelebration] = useState<
    null | 'confetti' | 'fireworks' | 'star_rain' | 'victory_cup' | 'judge_gavel'
  >(null);
  const [risingBalloons, setRisingBalloons] = useState<RisingBalloon[]>([]);

  // Sidebar Particle System & Interactive Audio Controls
  const [particleSidebarOpen, setParticleSidebarOpen] =
    useState<boolean>(false);
  const [selectedParticlePattern, setSelectedParticlePattern] =
    useState<ParticleEffectMode>('confetti');
  const [selectedPairedSound, setSelectedPairedSound] =
    useState<SoundEffectType>('takbeer_chime');
  const [particleDensity, setParticleDensity] =
    useState<ParticleDensityLevel>('medium');
  const [customDensityMultiplier, setCustomDensityMultiplier] =
    useState<number>(100);
  const [soundVolumePct, setSoundVolumePct] = useState<number>(90);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [autoTriggerOnRecitationComplete, setAutoTriggerOnRecitationComplete] =
    useState<boolean>(true);
  const [clickBurstModeActive, setClickBurstModeActive] =
    useState<boolean>(false);
  const [activeCelebrationBanner, setActiveCelebrationBanner] = useState<{
    title: string;
    subtitle: string;
    icon: string;
  } | null>(null);

  // Pointer & Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const activeStrokeRef = useRef<StudioStroke | null>(null);
  const laserTrailRef = useRef<LaserTrailPoint[]>([]);
  const trailParticlesRef = useRef<TrailParticle[]>([]);
  const burstParticlesRef = useRef<CanvasBurstParticle[]>([]);
  const [pointerCoords, setPointerCoords] = useState<{
    x: number;
    y: number;
    normX: number;
    normY: number;
  }>({ x: 300, y: 220, normX: 0.5, normY: 0.5 });

  const playBoardSound = useCallback(
    (type: SoundEffectType) => {
      if (soundMuted) return;
      playSynthesizedSoundFX(type, soundVolumePct / 100);
    },
    [soundMuted, soundVolumePct]
  );

  // Draw a 5-pointed star polygon on any 2D context
  const drawFivePointStar = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number
    ) => {
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(
          cx + Math.cos(rot) * outerRadius,
          cy + Math.sin(rot) * outerRadius
        );
        rot += step;
        ctx.lineTo(
          cx + Math.cos(rot) * innerRadius,
          cy + Math.sin(rot) * innerRadius
        );
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    },
    []
  );

  // Draw active burst particles on a 2D context
  const drawBurstParticlesOnContext = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (burstParticlesRef.current.length === 0) return;
      burstParticlesRef.current.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha));
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotation);
        ctx.fillStyle = pt.color;
        ctx.strokeStyle = pt.color;

        if (pt.shape === 'emoji' && pt.emoji) {
          ctx.font = `${Math.round(pt.size)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pt.emoji, 0, 0);
        } else if (pt.shape === 'star') {
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 10;
          drawFivePointStar(ctx, 0, 0, 5, pt.size, pt.size * 0.45);
        } else if (pt.shape === 'rect') {
          ctx.fillRect(-pt.size / 2, -pt.size * 0.3, pt.size, pt.size * 0.6);
        } else if (pt.shape === 'ribbon') {
          ctx.fillRect(
            -pt.size * 0.7,
            -pt.size * 0.18,
            pt.size * 1.4,
            pt.size * 0.36
          );
        } else if (pt.shape === 'petal') {
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.size * 0.65, pt.size * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, pt.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    },
    [drawFivePointStar]
  );

  // Spawn HTML5 Canvas 2D Particle System Burst
  const spawnCanvasParticleBurst = useCallback(
    (
      mode: ParticleEffectMode,
      originXRatio = 0.5,
      originYRatio = 0.45,
      customCountMultiplier = 1
    ) => {
      const workspace = workspaceRef.current;
      const W = workspace?.clientWidth || 860;
      const H = workspace?.clientHeight || 560;
      const densityMap: Record<ParticleDensityLevel, number> = {
        light: 45,
        medium: 85,
        intense: 140,
      };
      const baseCount = Math.max(
        15,
        Math.round(
          densityMap[particleDensity] *
            (customDensityMultiplier / 100) *
            customCountMultiplier
        )
      );

      const confettiColors = [
        '#10b981',
        '#c59b27',
        '#f59e0b',
        '#3b82f6',
        '#ec4899',
        '#8b5cf6',
        '#ef4444',
        '#14b8a6',
      ];
      const goldStarColors = [
        '#fbbf24',
        '#f59e0b',
        '#dfbd69',
        '#fef08a',
        '#10b981',
        '#34d399',
      ];
      const emeraldPetalColors = [
        '#059669',
        '#10b981',
        '#34d399',
        '#c59b27',
        '#dfbd69',
      ];

      const spawned: CanvasBurstParticle[] = [];

      for (let i = 0; i < baseCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        if (mode === 'confetti') {
          // Dual cannon from left/right or center burst
          const fromSide = i % 2 === 0;
          const startX =
            customCountMultiplier < 0.6
              ? originXRatio * W
              : fromSide
              ? W * 0.12
              : W * 0.88;
          const startY =
            customCountMultiplier < 0.6 ? originYRatio * H : H * 0.78;
          const launchAngle =
            customCountMultiplier < 0.6
              ? angle
              : fromSide
              ? -Math.PI * (0.22 + Math.random() * 0.25)
              : -Math.PI * (0.55 + Math.random() * 0.25);
          const speed = 6 + Math.random() * 11;

          spawned.push({
            id: Date.now() + Math.random() + i,
            x: startX,
            y: startY,
            vx: Math.cos(launchAngle) * speed + (Math.random() - 0.5) * 3,
            vy: Math.sin(launchAngle) * speed - Math.random() * 3,
            gravity: 0.22,
            drag: 0.985,
            size: 9 + Math.random() * 8,
            color: confettiColors[i % confettiColors.length],
            alpha: 1,
            decay: 0.008 + Math.random() * 0.006,
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.26,
            shape: i % 3 === 0 ? 'ribbon' : i % 3 === 1 ? 'rect' : 'circle',
          });
        } else if (mode === 'golden_stars') {
          const speed = 2.5 + Math.random() * 9.5;
          spawned.push({
            id: Date.now() + Math.random() + i,
            x: originXRatio * W + (Math.random() - 0.5) * 80,
            y: originYRatio * H + (Math.random() - 0.5) * 60,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2.2,
            gravity: 0.12,
            drag: 0.98,
            size: 8 + Math.random() * 9,
            color: goldStarColors[i % goldStarColors.length],
            alpha: 1,
            decay: 0.009 + Math.random() * 0.006,
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.14,
            shape: 'star',
          });
        } else if (mode === 'balloons_party') {
          const balloonEmojis = ['🎈', '🎈', '🎉', '🌟', '🎊', '🎈'];
          const isEmojiBalloon = i % 3 === 0;
          spawned.push({
            id: Date.now() + Math.random() + i,
            x: Math.random() * W * 0.88 + W * 0.06,
            y: H * (0.75 + Math.random() * 0.28),
            vx: (Math.random() - 0.5) * 2.2,
            vy: -(2.6 + Math.random() * 3.8),
            gravity: -0.025,
            drag: 0.994,
            size: isEmojiBalloon ? 24 + (i % 6) : 9 + Math.random() * 7,
            color: confettiColors[i % confettiColors.length],
            alpha: 1,
            decay: 0.007 + Math.random() * 0.005,
            rotation: (Math.random() - 0.5) * 0.25,
            vRotation: (Math.random() - 0.5) * 0.03,
            shape: isEmojiBalloon ? 'emoji' : i % 2 === 0 ? 'circle' : 'ribbon',
            emoji: balloonEmojis[i % balloonEmojis.length],
          });
        } else if (mode === 'fireworks') {
          const clusterIndex = i % 3;
          const centerX =
            clusterIndex === 0
              ? W * 0.28
              : clusterIndex === 1
              ? W * 0.5
              : W * 0.72;
          const centerY =
            clusterIndex === 1 ? H * 0.28 : H * 0.36;
          const speed = 2 + Math.random() * 10;
          spawned.push({
            id: Date.now() + Math.random() + i,
            x: customCountMultiplier < 0.6 ? originXRatio * W : centerX,
            y: customCountMultiplier < 0.6 ? originYRatio * H : centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: 0.1,
            drag: 0.965,
            size: 5 + Math.random() * 6,
            color: confettiColors[(i + clusterIndex * 2) % confettiColors.length],
            alpha: 1,
            decay: 0.011 + Math.random() * 0.007,
            rotation: 0,
            vRotation: 0.1,
            shape: i % 4 === 0 ? 'star' : 'circle',
          });
        } else if (mode === 'quranic_light') {
          const icons = ['👑', '✨', '🌟', '🕌', '📖', '💎'];
          spawned.push({
            id: Date.now() + Math.random() + i,
            x: Math.random() * W * 0.88 + W * 0.06,
            y: H * (0.65 + Math.random() * 0.32),
            vx: (Math.random() - 0.5) * 1.6,
            vy: -(2.2 + Math.random() * 3.4),
            gravity: -0.02,
            drag: 0.995,
            size: i % 3 === 0 ? 22 : 10 + Math.random() * 6,
            color: goldStarColors[i % goldStarColors.length],
            alpha: 1,
            decay: 0.008 + Math.random() * 0.005,
            rotation: (Math.random() - 0.5) * 0.3,
            vRotation: (Math.random() - 0.5) * 0.03,
            shape: i % 3 === 0 ? 'emoji' : 'star',
            emoji: icons[i % icons.length],
          });
        } else if (mode === 'emerald_petals') {
          spawned.push({
            id: Date.now() + Math.random() + i,
            x: Math.random() * W,
            y: -20 - Math.random() * 120,
            vx: (Math.random() - 0.5) * 2.5,
            vy: 2.0 + Math.random() * 3.2,
            gravity: 0.04,
            drag: 0.992,
            size: 10 + Math.random() * 8,
            color: emeraldPetalColors[i % emeraldPetalColors.length],
            alpha: 1,
            decay: 0.006 + Math.random() * 0.004,
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.12,
            shape: 'petal',
          });
        } else {
          // fountain_sparks
          const spreadAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.65;
          const speed = 8 + Math.random() * 11;
          spawned.push({
            id: Date.now() + Math.random() + i,
            x: W * 0.5 + (Math.random() - 0.5) * 90,
            y: H * 0.94,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            gravity: 0.25,
            drag: 0.985,
            size: 6 + Math.random() * 7,
            color: goldStarColors[i % goldStarColors.length],
            alpha: 1,
            decay: 0.009 + Math.random() * 0.006,
            rotation: Math.random() * Math.PI,
            vRotation: 0.18,
            shape: i % 2 === 0 ? 'star' : 'circle',
          });
        }
      }

      burstParticlesRef.current = [
        ...burstParticlesRef.current.slice(-220),
        ...spawned,
      ];
    },
    [particleDensity, customDensityMultiplier]
  );

  // ==========================================================================
  // 5. TIMERS & KEYBOARD SHORTCUTS (V, P, C, H, L, T, E, S, M, X, G, F1, Ctrl+Z)
  // ==========================================================================
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          playBoardSound('bell');
          showToast('انتهى وقت المؤقت الذكي للحصة', 'info');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, playBoardSound, showToast]);

  useEffect(() => {
    if (!isVideoRecording) return;
    const id = window.setInterval(() => {
      setVideoRecordSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isVideoRecording]);

  // Rising Balloons Animation Loop
  useEffect(() => {
    if (risingBalloons.length === 0) return;
    const id = window.setInterval(() => {
      setRisingBalloons((prev) =>
        prev
          .map((b) => (b.popped ? b : { ...b, y: b.y - b.speed }))
          .filter((b) => b.y > -18 && !b.popped)
      );
    }, 50);
    return () => clearInterval(id);
  }, [risingBalloons.length]);

  // Keyboard shortcuts listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'F1') {
        e.preventDefault();
        setShortcutsHelpModalOpen((v) => !v);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      const k = e.key.toLowerCase();
      if (k === 'v') setActiveTool('select');
      else if (k === 'p' || k === 'n') setActiveTool('pen');
      else if (k === 'c') setActiveTool('calligraphy');
      else if (k === 'h') setActiveTool('highlighter');
      else if (k === 'l') setActiveTool('laser');
      else if (k === 't') {
        setActiveTool('text');
        setOpenDockMenu('text_bar');
      } else if (k === 'e') setActiveTool('eraser');
      else if (k === 's') {
        setActiveTool('rect');
        setOpenDockMenu((m) => (m === 'shapes' ? null : 'shapes'));
      } else if (k === 'm') {
        setActiveTool('stamp');
        setOpenDockMenu((m) => (m === 'stamps' ? null : 'stamps'));
      } else if (k === 'x') {
        setOpenDockMenu((m) => (m === 'trails' ? null : 'trails'));
      } else if (k === 'g') {
        setOpenDockMenu((m) => (m === 'utilities' ? null : 'utilities'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Ctrl+V Clipboard Image Paste
  useEffect(() => {
    if (!clipboardPasteEnabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              updateCurrentPage((pg) => ({
                ...pg,
                backgroundDataUrl: String(reader.result || ''),
              }));
              showToast('تم لصق الصورة من الحافظة مباشرة على السبورة (Ctrl+V)', 'success');
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [clipboardPasteEnabled, updateCurrentPage, showToast]);

  // ==========================================================================
  // 6. UNDO / REDO & PAGE OPERATIONS
  // ==========================================================================
  const handleUndo = () => {
    if (currentPage.strokes.length === 0) return;
    const prevStrokes = currentPage.strokes;
    const nextStrokes = prevStrokes.slice(0, -1);
    setUndoStack((u) => [...u, prevStrokes]);
    setRedoStack((r) => [prevStrokes, ...r]);
    updateCurrentPage((pg) => ({ ...pg, strokes: nextStrokes }));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [restored, ...rest] = redoStack;
    setRedoStack(rest);
    updateCurrentPage((pg) => ({ ...pg, strokes: restored }));
  };

  const handleAddNewPage = () => {
    const newPg = createDefaultPage(pages.length + 1);
    setPages((prev) => [...prev, newPg]);
    setCurrentPageIdx(pages.length);
    setRedoStack([]);
    showToast(`تمت إضافة (${newPg.title}) وحفظها في الذاكرة المحلية`, 'success');
  };

  const handleDuplicatePage = () => {
    const copy: StudioBoardPage = {
      ...currentPage,
      id: `page-${Date.now()}-copy`,
      title: `${currentPage.title} (نسخة)`,
      strokes: [...currentPage.strokes],
      texts: [...currentPage.texts],
      stamps: [...currentPage.stamps],
      stickyNotes: [...currentPage.stickyNotes],
    };
    const next = [...pages];
    next.splice(currentPageIdx + 1, 0, copy);
    setPages(next);
    setCurrentPageIdx(currentPageIdx + 1);
    showToast('تم تكرار الصفحة الحالية بكافة رسوماتها', 'info');
  };

  const handleDeleteCurrentPage = () => {
    if (pages.length <= 1) {
      setConfirmClearModalOpen(true);
      return;
    }
    const next = pages.filter((_, idx) => idx !== currentPageIdx);
    setPages(next);
    setCurrentPageIdx(Math.max(0, currentPageIdx - 1));
    showToast('تم حذف الصفحة من دفتر السبورة', 'info');
  };

  const handleClearCurrentBoardConfirmed = () => {
    updateCurrentPage((pg) => ({
      ...pg,
      strokes: [],
      texts: [],
      stamps: [],
      stickyNotes: [],
      backgroundDataUrl: null,
      makharijCardType: 'none',
    }));
    setWordAnnotations({});
    setConfirmClearModalOpen(false);
    showToast('تم مسح محتويات الصفحة الحالية بالكامل', 'info');
  };

  // ==========================================================================
  // 7. HTML5 CANVAS 2D ENGINE (Grid Patterns + Strokes + Calligraphy + Trails)
  // ==========================================================================
  const bgMeta =
    BOARD_BG_COLORS.find((b) => b.id === currentPage.bgColor) ||
    BOARD_BG_COLORS[0];

  const drawGridPatternOnContext = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      pattern: BoardGridPatternId,
      lineColor: string
    ) => {
      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.fillStyle = lineColor;
      ctx.lineWidth = 1;

      if (pattern === 'grid') {
        const step = 34;
        for (let x = step; x < width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = step; y < height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      } else if (pattern === 'ruled' || pattern === 'wide_ruled') {
        const step = pattern === 'wide_ruled' ? 54 : 34;
        for (let y = step * 1.5; y < height; y += step) {
          ctx.beginPath();
          ctx.moveTo(24, y);
          ctx.lineTo(width - 24, y);
          ctx.stroke();
        }
      } else if (pattern === 'dotted') {
        const step = 32;
        for (let x = step; x < width; x += step) {
          for (let y = step; y < height; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (pattern === 'arabic_calligraphy') {
        // Dual-line Arabic Calligraphy guide (خط الأساس وخط القمة للخط العربي)
        const groupStep = 76;
        for (let y = 70; y < height - 30; y += groupStep) {
          // Upper guideline (dashed gold)
          ctx.save();
          ctx.strokeStyle = 'rgba(197, 155, 39, 0.45)';
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(30, y);
          ctx.lineTo(width - 30, y);
          ctx.stroke();
          ctx.restore();

          // Main baseline (solid emerald)
          ctx.save();
          ctx.strokeStyle = 'rgba(20, 90, 58, 0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(30, y + 26);
          ctx.lineTo(width - 30, y + 26);
          ctx.stroke();
          ctx.restore();
        }
      } else if (pattern === 'spelling_foundation') {
        // 4-line Noor Al-Bayan & Spelling foundation grid
        const blockStep = 92;
        for (let y = 60; y < height - 40; y += blockStep) {
          const offsets = [
            { dy: 0, color: 'rgba(37, 99, 235, 0.3)', dash: [4, 4], w: 1 },
            { dy: 18, color: 'rgba(22, 163, 74, 0.4)', dash: [], w: 1 },
            { dy: 38, color: 'rgba(220, 38, 38, 0.65)', dash: [], w: 2 },
            { dy: 56, color: 'rgba(197, 155, 39, 0.35)', dash: [4, 4], w: 1 },
          ];
          offsets.forEach((ln) => {
            ctx.save();
            ctx.strokeStyle = ln.color;
            ctx.lineWidth = ln.w;
            ctx.setLineDash(ln.dash);
            ctx.beginPath();
            ctx.moveTo(30, y + ln.dy);
            ctx.lineTo(width - 30, y + ln.dy);
            ctx.stroke();
            ctx.restore();
          });
        }
      } else if (pattern === 'kids_friendly') {
        // Decorative Kids Quranic Frame with Stars & Crescent
        ctx.save();
        ctx.strokeStyle = 'rgba(197, 155, 39, 0.65)';
        ctx.lineWidth = 4;
        ctx.strokeRect(14, 14, width - 28, height - 28);
        ctx.font = '20px sans-serif';
        const icons = ['🌟', '🌙', '✨', '🕌', '🌟', '✨'];
        icons.forEach((ic, idx) => {
          ctx.fillText(ic, 32 + idx * ((width - 80) / 5), 38);
          ctx.fillText(ic, 32 + idx * ((width - 80) / 5), height - 22);
        });
        ctx.restore();
      }

      ctx.restore();
    },
    []
  );

  const renderSingleStroke = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      stroke: StudioStroke,
      width: number,
      height: number
    ) => {
      if (stroke.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha =
        stroke.tool === 'highlighter'
          ? Math.min(0.38, stroke.opacity * 0.4)
          : stroke.tool === 'brush'
          ? stroke.opacity * 0.72
          : stroke.opacity;

      if (stroke.lineStyle === 'dotted') {
        ctx.setLineDash([stroke.width, stroke.width * 2.2]);
      } else if (stroke.lineStyle === 'dashed') {
        ctx.setLineDash([stroke.width * 3, stroke.width * 2]);
      } else {
        ctx.setLineDash([]);
      }

      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const x1 = start.x * width;
      const y1 = start.y * height;
      const x2 = end.x * width;
      const y2 = end.y * height;

      // Geometric shapes
      if (stroke.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else if (stroke.tool === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = Math.max(12, stroke.width * 3);
        ctx.setLineDash([]);
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
      } else if (stroke.tool === 'rect') {
        ctx.beginPath();
        ctx.strokeRect(
          Math.min(x1, x2),
          Math.min(y1, y2),
          Math.abs(x2 - x1),
          Math.abs(y2 - y1)
        );
      } else if (stroke.tool === 'circle') {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const rx = Math.max(4, Math.abs(x2 - x1) / 2);
        const ry = Math.max(4, Math.abs(y2 - y1) / 2);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (stroke.tool === 'triangle') {
        ctx.beginPath();
        ctx.moveTo((x1 + x2) / 2, Math.min(y1, y2));
        ctx.lineTo(Math.max(x1, x2), Math.max(y1, y2));
        ctx.lineTo(Math.min(x1, x2), Math.max(y1, y2));
        ctx.closePath();
        ctx.stroke();
      } else if (stroke.tool === 'diamond') {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        ctx.beginPath();
        ctx.moveTo(cx, Math.min(y1, y2));
        ctx.lineTo(Math.max(x1, x2), cy);
        ctx.lineTo(cx, Math.max(y1, y2));
        ctx.lineTo(Math.min(x1, x2), cy);
        ctx.closePath();
        ctx.stroke();
      } else if (stroke.tool === 'calligraphy') {
        // Authentic Slanted Arabic Calligraphy Nib (قلم الخط العربي المائل بزاوية 35 درجة)
        const nibWidth = Math.max(6, stroke.width * 2.4);
        const nibAngle = -Math.PI / 5; // ~36 deg slant
        const dx = Math.cos(nibAngle) * (nibWidth / 2);
        const dy = Math.sin(nibAngle) * (nibWidth / 2);

        for (let i = 0; i < stroke.points.length - 1; i++) {
          const p1 = stroke.points[i];
          const p2 = stroke.points[i + 1];
          const px1 = p1.x * width;
          const py1 = p1.y * height;
          const px2 = p2.x * width;
          const py2 = p2.y * height;

          ctx.beginPath();
          ctx.moveTo(px1 - dx, py1 - dy);
          ctx.lineTo(px1 + dx, py1 + dy);
          ctx.lineTo(px2 + dx, py2 + dy);
          ctx.lineTo(px2 - dx, py2 - dy);
          ctx.closePath();
          ctx.fill();
        }
      } else if (stroke.tool === 'spray') {
        // Spray Brush Effect
        stroke.points.forEach((pt, idx) => {
          const px = pt.x * width;
          const py = pt.y * height;
          const radius = Math.max(8, stroke.width * 2.5);
          for (let j = 0; j < 7; j++) {
            const angle = ((idx * 13 + j * 47) % 360) * (Math.PI / 180);
            const dist = (((idx * 7 + j * 19) % 100) / 100) * radius;
            ctx.fillRect(
              px + Math.cos(angle) * dist,
              py + Math.sin(angle) * dist,
              1.6,
              1.6
            );
          }
        });
      } else if (stroke.tool === 'chalk') {
        // Chalk Texture Stroke
        ctx.lineWidth = stroke.width * 1.4;
        ctx.globalAlpha = stroke.opacity * 0.65;
        ctx.setLineDash([stroke.width * 0.9, stroke.width * 0.35]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * width, stroke.points[i].y * height);
        }
        ctx.stroke();
      } else {
        // Smooth Bezier Pen / Brush / Highlighter
        if (stroke.tool === 'brush') {
          ctx.shadowColor = stroke.color;
          ctx.shadowBlur = 4;
          ctx.lineWidth = stroke.width * 1.6;
        }
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        if (stroke.points.length === 1) {
          ctx.arc(x1, y1, stroke.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          for (let i = 1; i < stroke.points.length - 1; i++) {
            const curr = stroke.points[i];
            const next = stroke.points[i + 1];
            const xc = ((curr.x + next.x) / 2) * width;
            const yc = ((curr.y + next.y) / 2) * height;
            ctx.quadraticCurveTo(curr.x * width, curr.y * height, xc, yc);
          }
          const last = stroke.points[stroke.points.length - 1];
          ctx.lineTo(last.x * width, last.y * height);
          ctx.stroke();
        }
      }

      ctx.restore();
    },
    []
  );

  // Main Canvas Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const workspace = workspaceRef.current;
    if (!canvas || !workspace) return;

    const rect = workspace.getBoundingClientRect();
    if (
      rect.width > 0 &&
      (canvas.width !== Math.floor(rect.width) ||
        canvas.height !== Math.floor(rect.height))
    ) {
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // 1. Draw Grid / Ruling Pattern on Canvas
    drawGridPatternOnContext(
      ctx,
      W,
      H,
      currentPage.gridPattern,
      bgMeta.lineColor
    );

    // 2. Draw all committed strokes on current page
    currentPage.strokes.forEach((st) => {
      renderSingleStroke(ctx, st, W, H);
    });

    // 3. Draw active in-progress stroke
    if (activeStrokeRef.current) {
      renderSingleStroke(ctx, activeStrokeRef.current, W, H);
    }

    // 4. Draw Ephemeral Laser Pointer Trail (fades out over 2000ms)
    const now = Date.now();
    const validLaser = laserTrailRef.current.filter(
      (pt) => now - pt.createdAt < 2000
    );
    laserTrailRef.current = validLaser;

    if (validLaser.length > 1) {
      for (let i = 1; i < validLaser.length; i++) {
        const p0 = validLaser[i - 1];
        const p1 = validLaser[i];
        const age = now - p1.createdAt;
        const alpha = Math.max(0, 1 - age / 2000);
        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 5 * alpha + 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p0.x * W, p0.y * H);
        ctx.lineTo(p1.x * W, p1.y * H);
        ctx.stroke();
        ctx.restore();
      }
      const tip = validLaser[validLaser.length - 1];
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(tip.x * W, tip.y * H, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Draw Cursor Trail Effects (X)
    if (trailParticlesRef.current.length > 0) {
      trailParticlesRef.current.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        if (pt.label) {
          ctx.font = `${Math.round(pt.size)}px sans-serif`;
          ctx.fillText(pt.label, pt.x, pt.y);
        } else if (pt.effect === 'ripples') {
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, (1 - pt.alpha) * 28 + 4, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = pt.color;
          if (pt.effect === 'neon_glow') {
            ctx.shadowColor = pt.color;
            ctx.shadowBlur = 12;
          }
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    // 6. Also draw active celebration burst particles on the high-z overlay canvas
    const pCanvas = particleCanvasRef.current;
    if (pCanvas) {
      if (pCanvas.width !== W || pCanvas.height !== H) {
        pCanvas.width = W;
        pCanvas.height = H;
      }
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        pCtx.clearRect(0, 0, W, H);
        drawBurstParticlesOnContext(pCtx);
      }
    }
  }, [
    currentPage.gridPattern,
    currentPage.strokes,
    bgMeta.lineColor,
    drawGridPatternOnContext,
    renderSingleStroke,
    drawBurstParticlesOnContext,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Animation loop when Laser, Cursor Trail Particles, or Celebration Burst Particles are active
  useEffect(() => {
    const id = window.setInterval(() => {
      let needsRedraw = false;
      if (laserTrailRef.current.length > 0) {
        needsRedraw = true;
      }
      if (trailParticlesRef.current.length > 0) {
        trailParticlesRef.current = trailParticlesRef.current
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.06,
          }))
          .filter((p) => p.alpha > 0.04);
        needsRedraw = true;
      }
      if (burstParticlesRef.current.length > 0) {
        burstParticlesRef.current = burstParticlesRef.current
          .map((pt) => ({
            ...pt,
            x: pt.x + pt.vx,
            y: pt.y + pt.vy,
            vx: pt.vx * pt.drag,
            vy: pt.vy * pt.drag + pt.gravity,
            rotation: pt.rotation + pt.vRotation,
            alpha: pt.alpha - pt.decay,
          }))
          .filter((pt) => pt.alpha > 0.02 && pt.y < 1400 && pt.y > -250);
        needsRedraw = true;
      }
      if (needsRedraw) {
        renderCanvas();
      }
    }, 30);
    return () => clearInterval(id);
  }, [renderCanvas]);

  // Spawn cursor trail particles on pointer move
  const spawnCursorTrailParticle = (x: number, y: number) => {
    if (cursorTrailEffect === 'none') return;
    const effectIconMap: Partial<Record<CursorTrailEffectId, string>> = {
      stars: '⭐',
      bubbles: '🫧',
      hearts: '💚',
      magic_dust: '✨',
      snow: '❄️',
    };
    const palette = ['#c59b27', '#10b981', '#38bdf8', '#f43f5e', '#a855f7'];
    const color = palette[Math.floor(Math.random() * palette.length)];

    trailParticlesRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 2.2,
      vy: cursorTrailEffect === 'snow' ? 1.5 : (Math.random() - 0.6) * 2.2,
      size: effectIconMap[cursorTrailEffect] ? 16 : 9,
      color,
      alpha: 1,
      effect: cursorTrailEffect,
      label: effectIconMap[cursorTrailEffect],
    });
  };

  // ==========================================================================
  // 8. POINTER EVENTS (PEN, TOUCH, PRESSURE, SHAPES, STAMPS, TEXT, ERASER)
  // ==========================================================================
  const getNormalizedCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, px: 0, py: 0 };
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return {
      x: Math.max(0, Math.min(1, px / Math.max(1, rect.width))),
      y: Math.max(0, Math.min(1, py / Math.max(1, rect.height))),
      px,
      py,
    };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screenFrozen) return;
    const { x, y, px, py } = getNormalizedCoords(e);
    setPointerCoords({ x: px, y: py, normX: x, normY: y });

    // Interactive Click Particle Burst + Spark Sound if enabled
    if (clickBurstModeActive) {
      spawnCanvasParticleBurst(selectedParticlePattern, x, y, 0.45);
      playBoardSound('spark_pop');
      renderCanvas();
    }

    if (activeTool === 'select') {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      };
      return;
    }

    if (activeTool === 'stamp') {
      const preset =
        EDUCATIONAL_STAMPS.find((s) => s.type === selectedStampType) ||
        EDUCATIONAL_STAMPS[0];
      const newStamp: StudioStampElement = {
        id: `st-${Date.now()}`,
        stampType: preset.type,
        label: preset.label,
        subLabel: preset.subLabel,
        color: preset.color,
        bgColor: preset.bgColor,
        x: Math.max(5, Math.min(82, x * 100)),
        y: Math.max(5, Math.min(85, y * 100)),
      };
      updateCurrentPage((pg) => ({
        ...pg,
        stamps: [...pg.stamps, newStamp],
      }));
      playBoardSound(preset.type === 'try_again' ? 'wrong' : 'correct');
      if (preset.type !== 'try_again') {
        spawnCanvasParticleBurst(selectedParticlePattern, 1 - x, y, 0.55);
      }
      return;
    }

    if (activeTool === 'text') {
      if (!draftBoardText.trim()) return;
      const newTxt: StudioTextElement = {
        id: `txt-${Date.now()}`,
        text: draftBoardText,
        x: Math.max(4, Math.min(85, x * 100)),
        y: Math.max(4, Math.min(88, y * 100)),
        color: strokeColor,
        fontSize: draftTextSize,
      };
      updateCurrentPage((pg) => ({
        ...pg,
        texts: [...pg.texts, newTxt],
      }));
      showToast('تم تثبيت النص المشكّل على السبورة', 'success');
      return;
    }

    if (activeTool === 'eraser') {
      isDrawingRef.current = true;
      updateCurrentPage((pg) => ({
        ...pg,
        strokes: pg.strokes.filter(
          (st) =>
            !st.points.some(
              (pt) => Math.hypot(pt.x - x, pt.y - y) < 0.045
            )
        ),
      }));
      return;
    }

    if (activeTool === 'laser') {
      isDrawingRef.current = true;
      laserTrailRef.current.push({ x, y, createdAt: Date.now() });
      renderCanvas();
      return;
    }

    // Standard Drawing / Calligraphy / Shapes
    isDrawingRef.current = true;
    const pressureFactor =
      penPressureEnabled && e.pressure && e.pressure > 0 && e.pressure !== 0.5
        ? Math.max(0.5, Math.min(1.8, e.pressure * 1.6))
        : 1;

    activeStrokeRef.current = {
      id: `stroke-${Date.now()}`,
      tool: activeTool,
      color: strokeColor,
      width: Math.round(strokeWidth * pressureFactor * 10) / 10,
      opacity: strokeOpacity / 100,
      lineStyle: strokeLineStyle,
      points: [{ x, y, pressure: e.pressure }],
    };
    renderCanvas();
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y, px, py } = getNormalizedCoords(e);
    setPointerCoords({ x: px, y: py, normX: x, normY: y });
    spawnCursorTrailParticle(px, py);

    if (isPanning && activeTool === 'select') {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (!isDrawingRef.current) return;

    if (activeTool === 'eraser') {
      updateCurrentPage((pg) => ({
        ...pg,
        strokes: pg.strokes.filter(
          (st) =>
            !st.points.some(
              (pt) => Math.hypot(pt.x - x, pt.y - y) < 0.045
            )
        ),
      }));
      return;
    }

    if (activeTool === 'laser') {
      laserTrailRef.current.push({ x, y, createdAt: Date.now() });
      renderCanvas();
      return;
    }

    if (!activeStrokeRef.current) return;
    const isShape =
      activeTool === 'line' ||
      activeTool === 'arrow' ||
      activeTool === 'rect' ||
      activeTool === 'circle' ||
      activeTool === 'triangle' ||
      activeTool === 'diamond';

    if (isShape) {
      activeStrokeRef.current.points = [
        activeStrokeRef.current.points[0],
        { x, y, pressure: e.pressure },
      ];
    } else {
      activeStrokeRef.current.points.push({ x, y, pressure: e.pressure });
    }
    renderCanvas();
  };

  const handleCanvasPointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeStrokeRef.current) {
      const finished = { ...activeStrokeRef.current };

      // Auto-Shape Recognition if enabled on freehand pen
      if (
        autoShapeEnabled &&
        finished.tool === 'pen' &&
        finished.points.length > 12
      ) {
        const first = finished.points[0];
        const last = finished.points[finished.points.length - 1];
        const closeDist = Math.hypot(first.x - last.x, first.y - last.y);
        const xs = finished.points.map((p) => p.x);
        const ys = finished.points.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        if (closeDist < 0.08 && maxX - minX > 0.05 && maxY - minY > 0.05) {
          finished.tool = 'circle';
          finished.points = [
            { x: minX, y: minY },
            { x: maxX, y: maxY },
          ];
        } else if (closeDist > 0.15) {
          // Check if nearly straight line
          const pathLen = finished.points.reduce((acc, pt, idx) => {
            if (idx === 0) return 0;
            const prev = finished.points[idx - 1];
            return acc + Math.hypot(pt.x - prev.x, pt.y - prev.y);
          }, 0);
          if (pathLen / Math.max(0.001, closeDist) < 1.08) {
            finished.tool = 'line';
            finished.points = [first, last];
          }
        }
      }

      setUndoStack((u) => [...u, currentPage.strokes]);
      setRedoStack([]);
      updateCurrentPage((pg) => ({
        ...pg,
        strokes: [...pg.strokes, finished],
      }));

      // Also sync to AcademyContext boardStrokes for current Surah
      saveBoardStrokes(
        `${surahId}_${fromAyah}_${toAyah}`,
        [...currentPage.strokes, finished].map((s) => ({
          id: s.id,
          color: s.color,
          width: s.width,
          tool:
            s.tool === 'highlighter'
              ? 'highlighter'
              : s.tool === 'circle'
              ? 'circle'
              : s.tool === 'arrow'
              ? 'arrow'
              : 'pen',
          points: s.points,
        }))
      );

      activeStrokeRef.current = null;
      renderCanvas();
    }
  };

  // ==========================================================================
  // 9. EXPORT, SNAPSHOT, JSON SAVE/LOAD, PDF PRINT & VIDEO RECORDING
  // ==========================================================================
  const buildCompositeCanvas = (): HTMLCanvasElement | null => {
    const srcCanvas = canvasRef.current;
    if (!srcCanvas) return null;
    const out = document.createElement('canvas');
    out.width = srcCanvas.width || 1200;
    out.height = srcCanvas.height || 800;
    const ctx = out.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = bgMeta.hex;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(srcCanvas, 0, 0);

    // Draw on-board text elements
    currentPage.texts.forEach((t) => {
      ctx.save();
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.fontSize}px "Amiri Quran", serif`;
      ctx.fillText(t.text, (t.x / 100) * out.width, (t.y / 100) * out.height);
      ctx.restore();
    });

    // Draw stamps
    currentPage.stamps.forEach((st) => {
      ctx.save();
      ctx.fillStyle = st.bgColor;
      ctx.strokeStyle = st.color;
      ctx.lineWidth = 2;
      const sx = (st.x / 100) * out.width;
      const sy = (st.y / 100) * out.height;
      ctx.strokeRect(sx, sy, 140, 44);
      ctx.fillStyle = st.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(st.label, sx + 14, sy + 27);
      ctx.restore();
    });

    return out;
  };

  const handleExportImage = (format: 'png' | 'jpeg') => {
    const out = buildCompositeCanvas();
    if (!out) return;
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = out.toDataURL(mime, 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `سبورة-الإمام-${currentPage.title}-${surahMeta.name}.${
      format === 'jpeg' ? 'jpg' : 'png'
    }`;
    a.click();
    showToast(
      `تم تصدير السبورة كصورة ${format.toUpperCase()} عالية الدقة`,
      'success'
    );
  };

  const handleSaveProjectJson = () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      studentName: activeStudent?.name || '',
      surahId,
      fromAyah,
      toAyah,
      pages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `مشروع-سبورة-الإمام-${getLocalDateString(0)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم حفظ مشروع السبورة الذكية كملف JSON', 'success');
  };

  const handleImportProjectJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          setPages(parsed.pages);
          setCurrentPageIdx(0);
          if (parsed.surahId) setSurahId(Number(parsed.surahId));
          showToast(
            `تم استيراد مشروع السبورة (${parsed.pages.length} صفحات) بنجاح`,
            'success'
          );
        } else {
          showToast('ملف JSON غير صالح لسبورة الإمام', 'error');
        }
      } catch {
        showToast('تعذر قراءة ملف JSON المستورد', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handlePrintAllPagesPdf = () => {
    window.print();
    showToast(
      `تم تجهيز كافة صفحات السبورة (${pages.length} صفحة) للطباعة أو الحفظ كملف PDF`,
      'info'
    );
  };

  const handleToggleScreenFreeze = () => {
    if (screenFrozen) {
      setScreenFrozen(false);
      setFrozenSnapshotUrl(null);
      showToast('تم إلغاء تجميد الشاشة واستئناف التفاعل الحي', 'info');
    } else {
      const out = buildCompositeCanvas();
      if (out) {
        setFrozenSnapshotUrl(out.toDataURL('image/png'));
      }
      setScreenFrozen(true);
      showToast('❄️ تم تجميد شاشة السبورة مؤقتاً', 'info');
    }
  };

  // Start / Stop Video & Audio Screen Recording via MediaRecorder API
  const handleToggleVideoRecording = async () => {
    if (isVideoRecording) {
      if (
        videoRecorderRef.current &&
        videoRecorderRef.current.state !== 'inactive'
      ) {
        videoRecorderRef.current.stop();
      }
      setIsVideoRecording(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.captureStream !== 'function') {
      showToast('متصفحك الحالي لا يدعم تسجيل تدفق Canvas المباشر', 'error');
      return;
    }

    try {
      const canvasStream = canvas.captureStream(30);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStream.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
      } catch {
        // Proceed with video stream if microphone permission is declined
      }

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });
      videoChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          videoChunksRef.current.push(ev.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تسجيل-حصة-سبورة-الإمام-${getLocalDateString(0)}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('🎥 تم حفظ وتنزيل فيديو شرح السبورة والصوت بنجاح', 'success');
      };

      videoRecorderRef.current = recorder;
      setVideoRecordSeconds(0);
      setIsVideoRecording(true);
      recorder.start(500);
      showToast('🔴 بدأ تسجيل شاشة السبورة والصوت فيديو...', 'info');
    } catch {
      showToast('تعذر بدء تسجيل الفيديو في هذه الجلسة', 'error');
    }
  };

  // ==========================================================================
  // 10. CELEBRATION, PARTICLE SYSTEM & INTERACTIVE AUDIO LAUNCHERS
  // ==========================================================================
  const launchRisingBalloons = () => {
    const colors = [
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
    ];
    const praises = ['أحسنت!', 'ممتاز!', 'ما شاء الله', 'حافظ متقن', 'بارك الله فيك', 'تاج الوقار'];
    const batch: RisingBalloon[] = Array.from({ length: 10 }).map((_, idx) => ({
      id: `bal-${Date.now()}-${idx}`,
      x: 10 + idx * 8 + (Math.random() * 4 - 2),
      y: 96 + (idx % 3) * 8,
      speed: 1.2 + Math.random() * 0.9,
      color: colors[idx % colors.length],
      label: praises[idx % praises.length],
      popped: false,
    }));
    setRisingBalloons(batch);
    playBoardSound('applause');
    spawnCanvasParticleBurst('confetti', 0.5, 0.5, 0.85);
    setCelebrationModalOpen(false);
    showToast(
      '🎈 انطلقت البالونات الصاعدة! انقر على أي بالون على السبورة لفرقعته بسماع صوت الفرقعة!',
      'success'
    );
  };

  const triggerVisualCelebration = (
    type: NonNullable<typeof activeVisualCelebration>,
    sound: SoundEffectType
  ) => {
    playBoardSound(sound);
    const mappedMode: ParticleEffectMode =
      type === 'confetti'
        ? 'confetti'
        : type === 'fireworks'
        ? 'fireworks'
        : type === 'star_rain'
        ? 'golden_stars'
        : type === 'victory_cup'
        ? 'quranic_light'
        : 'fountain_sparks';
    spawnCanvasParticleBurst(mappedMode, 0.5, 0.45, 1.15);
    setActiveVisualCelebration(type);
    setCelebrationModalOpen(false);
    if (activeStudent) {
      addStudentXp(activeStudent.id, 20, 'تشجيع احتفالي على السبورة الذكية');
    }
    window.setTimeout(() => {
      setActiveVisualCelebration(null);
    }, 3800);
  };

  // Celebrate Completing a Quranic Passage (إنهاء تسميع مقطع قرآني)
  const handleCompleteQuranPassageCelebration = (
    overridePattern?: ParticleEffectMode
  ) => {
    const patternToUse = overridePattern || selectedParticlePattern;
    spawnCanvasParticleBurst(patternToUse, 0.5, 0.42, 1.25);
    window.setTimeout(() => {
      spawnCanvasParticleBurst('golden_stars', 0.3, 0.35, 0.7);
      spawnCanvasParticleBurst('golden_stars', 0.7, 0.35, 0.7);
    }, 350);

    playBoardSound(selectedPairedSound);
    window.setTimeout(() => {
      playBoardSound('applause');
    }, 320);

    if (activeStudent) {
      addStudentXp(
        activeStudent.id,
        25,
        `إتمام تسميع سورة ${surahMeta.name} (${fromAyah}-${toAyah}) على السبورة الذكية`
      );
    }

    const patternMeta =
      PARTICLE_EFFECT_PATTERNS.find((p) => p.id === patternToUse) ||
      PARTICLE_EFFECT_PATTERNS[0];

    setActiveCelebrationBanner({
      title: `فتح الله عليك يا ${activeStudent?.name || 'بطل القرآن'}!`,
      subtitle: `أتممت تسميع سورة ${surahMeta.name} (الآيات ${fromAyah} - ${toAyah}) بإتقان • +25 XP`,
      icon: patternMeta.icon,
    });
    window.setTimeout(() => {
      setActiveCelebrationBanner(null);
    }, 3800);

    showToast(
      `🎉 تم إطلاق (${patternMeta.label}) مع الصوت التفاعلي احتفالاً بإتمام تسميع سورة ${surahMeta.name}!`,
      'success'
    );
  };

  // Celebrate Student Victory (فوز الطالب في التحدي أو المسابقة)
  const handleStudentWinCelebration = (customPattern?: ParticleEffectMode) => {
    const patternToUse = customPattern || selectedParticlePattern;
    spawnCanvasParticleBurst(patternToUse, 0.5, 0.4, 1.35);
    window.setTimeout(() => {
      spawnCanvasParticleBurst('fireworks', 0.25, 0.3, 0.85);
      spawnCanvasParticleBurst('fireworks', 0.75, 0.3, 0.85);
    }, 420);

    playBoardSound('fanfare');
    window.setTimeout(() => {
      playBoardSound('applause');
    }, 450);

    if (activeStudent) {
      addStudentXp(
        activeStudent.id,
        30,
        `فوز وتفوق قرآني على السبورة الذكية (${surahMeta.name})`
      );
    }

    setActiveCelebrationBanner({
      title: `🏆 مبارك الفوز والتفوق للطالب ${activeStudent?.name || ''}!`,
      subtitle: `تتويج قرآني متميز على السبورة الذكية • +30 XP`,
      icon: '🏆',
    });
    window.setTimeout(() => {
      setActiveCelebrationBanner(null);
    }, 4000);
  };

  // Wheel of Fortune Spinner
  const handleSpinWheelOfFortune = () => {
    if (wheelSpinning || students.length === 0) return;
    setWheelSpinning(true);
    setWheelWinnerName(null);
    playBoardSound('drums');
    const extraTurns = 1440 + Math.floor(Math.random() * 1080);
    const nextDeg = wheelRotationDeg + extraTurns;
    setWheelRotationDeg(nextDeg);

    window.setTimeout(() => {
      const winnerIdx = Math.floor(Math.random() * students.length);
      const chosen = students[winnerIdx] || students[0];
      setWheelSpinning(false);
      setWheelWinnerName(chosen.name);
      setSelectedStudentId(chosen.id);
      playBoardSound('fanfare');
      spawnCanvasParticleBurst(selectedParticlePattern, 0.5, 0.45, 1.15);
      showToast(`🎯 اختارت عجلة الحظ الذكية الطالب: ${chosen.name} للتسميع!`, 'success');
    }, 2600);
  };

  // Save Recitation & Board Notes to Student Session
  const markedErrorsList = useMemo(
    () => Object.values(wordAnnotations),
    [wordAnnotations]
  );

  const handleSaveBoardToStudentSession = () => {
    if (!activeStudent) return;
    const todayStr = getLocalDateString(0);
    const existing = sessions.find(
      (s) => s.studentId === activeStudent.id && s.date === todayStr
    );

    const newErrors: RecitationError[] = markedErrorsList.map((w, idx) => ({
      id: `sb-err-${Date.now()}-${idx}`,
      type: w.errorCategory || 'تجويد',
      context: 'التسميع',
      surah: surahMeta.name,
      ayah: w.ayah,
      word: w.wordText,
      tajweedRule: w.tajweedRule || w.note,
      timestamp: todayStr,
    }));

    const mastery = Math.max(60, 100 - newErrors.length * 4);
    saveSession({
      id: existing?.id,
      studentId: activeStudent.id,
      date: todayStr,
      status: 'حضر',
      masteryScore: mastery,
      previousEvaluation: {
        ...(existing?.previousEvaluation || {}),
        newGrade: evalGrade,
      },
      errors: [...(existing?.errors || []), ...newErrors],
      newMemorization: {
        enabled: true,
        surahId,
        surahName: surahMeta.name,
        isFullSurah: false,
        fromAyah,
        toAyah,
        direction: 'asc',
        grade: evalGrade,
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
      parentNotes:
        evalCustomNote.trim() ||
        `تم التسميع والشرح التفاعلي عبر السبورة الذكية في سورة ${surahMeta.name} (${fromAyah}-${toAyah}) بنسبة إتقان ${mastery}%.`,
    });

    setShowEvaluationModal(false);
    if (
      autoTriggerOnRecitationComplete &&
      (evalGrade === 'ممتاز' || evalGrade === 'جيد جداً')
    ) {
      handleCompleteQuranPassageCelebration();
    } else {
      playBoardSound('correct');
    }
    showToast(
      `تم حفظ رسومات السبورة وتقييم التسميع وربطها بسجل الطالب (${activeStudent.name})`,
      'success'
    );
  };

  // Current Tool Label for Status Bar
  const activeToolArabicLabel = useMemo(() => {
    const map: Record<StudioToolId, string> = {
      select: 'التحديد والتحريك (V)',
      pen: 'قلم عادي (P)',
      calligraphy: 'قلم الخط العربي المائل (C)',
      brush: 'فرشاة فنية',
      chalk: 'طباشير مدرسي',
      highlighter: 'ماركر تظليل فسفوري (H)',
      spray: 'بخاخ لوني',
      laser: 'مؤشر الليزر المؤقت (L)',
      text: 'النص والتشكيل القرآني (T)',
      eraser: 'الممحاة الذكية (E)',
      line: 'خط مستقيم (S)',
      arrow: 'سهم هندسي (S)',
      rect: 'مستطيل (S)',
      circle: 'دائرة (S)',
      triangle: 'مثلث (S)',
      diamond: 'معين (S)',
      stamp: 'الأختام التربوية والقرآنية (M)',
    };
    return map[activeTool] || activeTool;
  }, [activeTool]);

  return (
    <div
      className={`flex flex-col gap-3 select-none ${
        embeddedInSessionFocus
          ? 'w-full min-h-[650px]'
          : isFullScreenFocus
          ? 'fixed inset-0 z-50 bg-[#0b1711] p-2 sm:p-3 overflow-hidden h-screen w-screen'
          : ''
      }`}
    >
      {/* Hidden File Inputs for Image, PDF, and JSON Import */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            updateCurrentPage((pg) => ({
              ...pg,
              backgroundDataUrl: String(reader.result || ''),
            }));
            showToast(`تم إدراج الصورة (${f.name}) على السبورة`, 'success');
          };
          reader.readAsDataURL(f);
          e.target.value = '';
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setPdfFileName(f.name);
          setPdfExplainerActive(true);
          showToast(`تم فتح وضع شرح ملف PDF: ${f.name}`, 'success');
          e.target.value = '';
        }}
      />
      <input
        ref={jsonImportInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImportProjectJson(f);
          e.target.value = '';
        }}
      />

      {/* ====================================================================
          TOP STUDIO HEADER BAR (Multi-Page Controls + Student + Video Recorder + Celebration Modal)
      ==================================================================== */}
      <div className="rounded-2xl bg-gradient-to-l from-[#14281d] via-[#145a3a] to-[#0f452c] text-white px-4 py-2.5 border border-[#c59b27]/60 shadow-md flex flex-wrap items-center justify-between gap-2.5">
        {/* Left side: Studio Title, Student Selector & Toggle Side Panels */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLeftPanelOpen((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1 cursor-pointer transition ${
              leftPanelOpen
                ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27]'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            title="طي / فتح اللوحة الجانبية اليسرى (إعدادات السبورة والتخطيط)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>لوحة الإعدادات</span>
          </button>

          <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-white/15">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-[#dfbd69]">الطالب:</span>
            <select
              value={activeStudent?.id || ''}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                const st = students.find((x) => x.id === e.target.value);
                if (st) {
                  setSurahId(st.currentStop.surahId);
                  setFromAyah(Math.max(1, st.currentStop.ayah - 1));
                  setToAyah(st.currentStop.ayah + 6);
                }
              }}
              className="bg-transparent text-white text-xs font-extrabold focus:outline-none cursor-pointer"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id} className="text-black">
                  {st.name} ({st.circle})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Multi-Page Navigation (صفحة 1/1 + السابق/التالي + إضافة صفحة) + Zoom Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/30 px-3 py-1 rounded-xl border border-[#c59b27]/40">
          <button
            type="button"
            onClick={() => setCurrentPageIdx((i) => Math.max(0, i - 1))}
            disabled={currentPageIdx === 0}
            className="p-1 rounded-lg hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            title="الصفحة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-extrabold text-[#dfbd69] px-1.5">
            صفحة {currentPageIdx + 1}/{pages.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setCurrentPageIdx((i) => Math.min(pages.length - 1, i + 1))
            }
            disabled={currentPageIdx === pages.length - 1}
            className="p-1 rounded-lg hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            title="الصفحة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleAddNewPage}
            className="px-2 py-1 rounded-lg bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black flex items-center gap-1 cursor-pointer"
            title="إضافة صفحة سبورة جديدة وحفظها في IndexedDB"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>صفحة +</span>
          </button>
          <button
            type="button"
            onClick={handleDuplicatePage}
            className="p-1 rounded-lg hover:bg-white/15 text-emerald-200 cursor-pointer"
            title="تكرار الصفحة الحالية"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <span className="text-white/25 mx-1">|</span>

          {/* Zoom In / Out & Reset Pan */}
          <button
            type="button"
            onClick={() => setZoomPercent((z) => Math.max(50, z - 15))}
            className="p-1 rounded-lg hover:bg-white/15 cursor-pointer"
            title="تصغير (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomPercent(100);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="text-[11px] font-mono font-bold text-white hover:text-[#dfbd69] px-1 cursor-pointer"
            title="إعادة ضبط التكبير والتحريك"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            onClick={() => setZoomPercent((z) => Math.min(220, z + 15))}
            className="p-1 rounded-lg hover:bg-white/15 cursor-pointer"
            title="تكبير (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right side: Video Screen Recorder + Celebration Modal + Save to Student + Full-Screen Focus */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Video Screen & Audio Recorder Button (MediaRecorder API) */}
          <button
            type="button"
            onClick={() => void handleToggleVideoRecording()}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
              isVideoRecording
                ? 'bg-red-600 text-white animate-pulse shadow-md'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
            title="تسجيل الشاشة والصوت فيديو (MediaRecorder API)"
          >
            <Video className="w-3.5 h-3.5 text-rose-300" />
            <span>
              {isVideoRecording
                ? `تسجيل فيديو (${videoRecordSeconds}ث) - إيقاف`
                : 'تسجيل الشاشة والصوت فيديو'}
            </span>
          </button>

          {/* Slide-Out Particle Sidebar Trigger (القائمة المنبثقة الجانبية لنظام جزيئات الاحتفال) */}
          <button
            type="button"
            onClick={() => setParticleSidebarOpen((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition ${
              particleSidebarOpen
                ? 'bg-[#c59b27] text-[#14281d] ring-2 ring-white'
                : 'bg-emerald-500/30 hover:bg-emerald-500/45 text-[#dfbd69] border border-[#c59b27]/60'
            }`}
            title="فتح القائمة المنبثقة الجانبية لاختيار نمط جزيئات الاحتفال (نجوم، بالونات، قصاصات) وتحديد الكثافة"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎉 قائمة جزيئات الاحتفال</span>
          </button>

          {/* Celebration & Sound FX Modal Trigger (مركز المؤثرات الصوتية والاحتفالات) */}
          <button
            type="button"
            onClick={() => setCelebrationModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#14281d] text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="فتح مركز المؤثرات الصوتية والاحتفالات التفاعلية"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🌟 المؤثرات والاحتفالات</span>
          </button>

          {/* Save Board & Evaluation to Student Session */}
          <button
            type="button"
            onClick={() => setShowEvaluationModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            title="حفظ رسومات السبورة وتقييم التسميع في سجل الطالب"
          >
            <Save className="w-3.5 h-3.5 text-[#dfbd69]" />
            <span>حفظ لسجل الطالب</span>
            {markedErrorsList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#c59b27] text-[#14281d] text-[10px] font-mono font-black">
                {markedErrorsList.length}
              </span>
            )}
          </button>

          {/* Full-Screen Focus Mode (folds sidebars) */}
          <button
            type="button"
            onClick={() => {
              const next = !isFullScreenFocus;
              setIsFullScreenFocus(next);
              if (next) {
                setLeftPanelOpen(false);
                setRightPanelOpen(false);
              } else {
                setLeftPanelOpen(true);
                setRightPanelOpen(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer border ${
              isFullScreenFocus
                ? 'bg-red-600 text-white border-red-400'
                : 'bg-white/10 text-[#dfbd69] border-[#c59b27]/40 hover:bg-white/20'
            }`}
            title="وضع التركيز الكامل (يطوي القوائم الجانبية)"
          >
            {isFullScreenFocus ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>إنهاء التركيز</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>وضع التركيز الكامل</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setRightPanelOpen((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1 cursor-pointer transition ${
              rightPanelOpen
                ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27]'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            title="طي / فتح اللوحة الجانبية اليمنى (القرآن والتجويد والوسائط)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>لوحة الأدوات والقرآن</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          3-PANEL STUDIO BODY (Left Panel | Central Multi-Page Canvas | Right Panel)
      ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch flex-1 min-h-[620px]">
        {/* ==================================================================
            PANEL 1 (LEFT): إعدادات السبورة، التخطيط، والتصدير (Collapsible)
        ================================================================== */}
        {leftPanelOpen && (
          <aside className="lg:col-span-3 rounded-2xl bg-white dark:bg-[#12231a] p-4 border border-neutral-200 dark:border-emerald-900/60 shadow-xs space-y-4 overflow-y-auto max-h-[760px]">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-emerald-900/50">
              <h3 className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-[#c59b27]" />
                <span>إعدادات السبورة، التخطيط، والتصدير</span>
              </h3>
              <button
                type="button"
                onClick={() => setLeftPanelOpen(false)}
                className="text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                طي ✕
              </button>
            </div>

            {/* 1. لون السبورة */}
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300">
                ١. لون خلفية السبورة:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {BOARD_BG_COLORS.map((bg) => {
                  const active = currentPage.bgColor === bg.id;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() =>
                        updateCurrentPage((pg) => ({ ...pg, bgColor: bg.id }))
                      }
                      className={`p-2 rounded-xl border text-right text-[11px] font-extrabold flex items-center gap-2 cursor-pointer transition ${
                        active
                          ? 'border-[#c59b27] ring-2 ring-[#c59b27]/40 bg-[#fcfaf2] dark:bg-[#0b1711]'
                          : 'border-neutral-200 dark:border-emerald-900/50 hover:border-[#c59b27]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-neutral-400 shrink-0"
                        style={{ backgroundColor: bg.hex }}
                      />
                      <span className="truncate">{bg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. تخطيط الأسطر والشبكة */}
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300">
                ٢. تخطيط الأسطر والشبكة (على الـ Canvas):
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {BOARD_GRID_PATTERNS.map((pat) => {
                  const active = currentPage.gridPattern === pat.id;
                  return (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() =>
                        updateCurrentPage((pg) => ({
                          ...pg,
                          gridPattern: pat.id,
                        }))
                      }
                      className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold text-right cursor-pointer transition ${
                        active
                          ? 'bg-[#145a3a] text-white border-[#c59b27] font-extrabold'
                          : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50 text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      {pat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. خيارات متقدمة */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-emerald-900/40">
              <div className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300">
                ٣. خيارات الرسم المتقدمة:
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  {
                    label: 'حساسية القلم الرقمي (Pen Pressure)',
                    checked: penPressureEnabled,
                    toggle: () => setPenPressureEnabled((v) => !v),
                  },
                  {
                    label: 'رسم تلقائي للأشكال الهندسية',
                    checked: autoShapeEnabled,
                    toggle: () => setAutoShapeEnabled((v) => !v),
                  },
                  {
                    label: 'لصق صورة مباشرة من الحافظة (Ctrl+V)',
                    checked: clipboardPasteEnabled,
                    toggle: () => setClipboardPasteEnabled((v) => !v),
                  },
                  {
                    label: 'وضع تيسير المشاركة عبر Zoom',
                    checked: zoomShareOptimizer,
                    toggle: () => setZoomShareOptimizer((v) => !v),
                  },
                ].map((opt) => (
                  <label
                    key={opt.label}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/70 dark:border-emerald-900/40 cursor-pointer"
                  >
                    <span className="text-[11px] font-bold">{opt.label}</span>
                    <input
                      type="checkbox"
                      checked={opt.checked}
                      onChange={opt.toggle}
                      className="accent-[#145a3a] w-4 h-4 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* 4. المشروع والتصدير */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-emerald-900/40">
              <div className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300">
                ٤. إدارة المشروع والتصدير الفوري:
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-extrabold">
                <button
                  type="button"
                  onClick={handleSaveProjectJson}
                  className="p-2 rounded-xl bg-[#145a3a] text-white hover:bg-[#0f452c] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#dfbd69]" />
                  <span>حفظ JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => jsonImportInputRef.current?.click()}
                  className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#145a3a]" />
                  <span>استيراد سبورة</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportImage('png')}
                  className="p-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportImage('jpeg')}
                  className="p-2 rounded-xl bg-amber-500 text-[#14281d] hover:bg-amber-400 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير JPG</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintAllPagesPdf}
                  className="col-span-2 p-2 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة / تصدير كافة الصفحات كملف PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearModalOpen(true)}
                  className="col-span-2 p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح السبورة (مع تأكيد)</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* ==================================================================
            PANEL 2 (CENTER): مساحة الرسم الوسطى (Multi-Page Interactive Canvas)
        ================================================================== */}
        <div
          className={`${
            leftPanelOpen && rightPanelOpen
              ? 'lg:col-span-6'
              : leftPanelOpen || rightPanelOpen
              ? 'lg:col-span-9'
              : 'lg:col-span-12'
          } flex flex-col justify-between rounded-3xl border-4 border-double border-[#c59b27] shadow-lg overflow-hidden relative min-h-[580px]`}
          style={{
            backgroundColor: bgMeta.hex,
            color: bgMeta.textColor,
          }}
        >
          {/* Main Zoomable & Pannable Canvas Workspace */}
          <div
            ref={workspaceRef}
            className="relative flex-1 w-full h-full overflow-hidden"
            style={{
              transform: `scale(${zoomPercent / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Optional Imported Image Background Layer */}
            {currentPage.backgroundDataUrl && (
              <div className="absolute inset-4 z-5 flex items-center justify-center pointer-events-none">
                <img
                  src={currentPage.backgroundDataUrl}
                  alt="طبقة السبورة"
                  className="max-h-full max-w-full object-contain rounded-xl opacity-95"
                />
              </div>
            )}

            {/* Optional Embedded Makharij / Tajweed SVG Card Layer on the Board */}
            {currentPage.makharijCardType &&
              currentPage.makharijCardType !== 'none' && (
                <div className="absolute top-4 left-4 right-4 z-10 p-4 rounded-2xl bg-white/95 dark:bg-[#12231a]/95 border-2 border-[#c59b27] shadow-md pointer-events-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200 dark:border-emerald-900">
                    <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
                      {currentPage.makharijCardType === 'makharij_map'
                        ? '🗺️ بطاقة مخارج الحروف الخمسة الرئيسية (ارسم واشرح فوقها)'
                        : currentPage.makharijCardType === 'noon_rules'
                        ? '📜 بطاقة أحكام النون الساكنة والتنوين'
                        : '〰️ بطاقة أقسام المدود في التجويد'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCurrentPage((pg) => ({
                          ...pg,
                          makharijCardType: 'none',
                        }))
                      }
                      className="text-xs font-bold text-red-600 cursor-pointer"
                    >
                      إغلاق البطاقة ✕
                    </button>
                  </div>
                  {currentPage.makharijCardType === 'makharij_map' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      {MAKHARIJ_GUIDE.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50"
                        >
                          <div className="font-black text-[#145a3a] dark:text-[#dfbd69]">
                            {m.title}
                          </div>
                          <div className="font-quran text-base font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                            {m.letters}
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-1 line-clamp-2">
                            {m.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {(TAJWEED_RULES_GUIDE[0]?.rules || []).map((r) => (
                        <div
                          key={r.name}
                          className="p-2.5 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-emerald-700/30"
                        >
                          <div className="font-black text-[#145a3a] dark:text-[#dfbd69]">
                            {r.name}
                          </div>
                          <div className="font-quran text-sm text-amber-700 dark:text-amber-300">
                            {r.example}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {r.letters}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Core Interactive Uthmani Quran Verses Layer on the Board */}
            {showQuranLayerOnBoard && (
              <div className="relative z-10 p-5 sm:p-7 space-y-4 pointer-events-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#c59b27]/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-4 py-1 rounded-full bg-[#145a3a] text-[#dfbd69] font-quran text-lg font-bold border border-[#c59b27]">
                      سُورَةُ {surahMeta.name} ({fromAyah} - {toAyah})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        playHusaryAyahAudio(verses[0]?.ayah || fromAyah)
                      }
                      className="px-3 py-1 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                      title="تشغيل صوت الشيخ الحصري للآية المعروضة"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>صوت الشيخ الحصري</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCompleteQuranPassageCelebration()}
                      className="px-3 py-1 rounded-xl bg-gradient-to-l from-emerald-600 to-[#145a3a] hover:from-emerald-500 hover:to-[#0f452c] text-white text-[11px] font-black border border-[#c59b27] shadow-sm flex items-center gap-1 cursor-pointer"
                      title="إنهاء تسميع المقطع القرآني وإطلاق الجسيمات البصرية والصوت التفاعلي"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>🎉 إتمام تسميع المقطع</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStudentWinCelebration()}
                      className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#14281d] text-[11px] font-black border border-amber-600 shadow-sm flex items-center gap-1 cursor-pointer"
                      title="إعلان فوز الطالب وإطلاق الجسيمات والأصوات الاحتفالية"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>🏆 فوز الطالب</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHideAllQuranWords((prev) => !prev);
                        setHiddenWordKeys({});
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer flex items-center gap-1 ${
                        hideAllQuranWords
                          ? 'bg-amber-500 text-[#14281d] border-amber-600'
                          : 'bg-white/80 text-[#145a3a] border-[#c59b27]/50'
                      }`}
                    >
                      {hideAllQuranWords ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>كشف جميع الكلمات</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>إخفاء الكلمات لاختبار الحفظ</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuranPickerModalOpen(true)}
                      className="px-2.5 py-1 rounded-xl bg-[#145a3a] text-white text-[11px] font-bold cursor-pointer"
                    >
                      تغيير السورة والآيات
                    </button>
                  </div>
                </div>

                {/* Word Inspection & Error Tagging Popover */}
                {inspectedWord && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs text-[#14281d] dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-quran text-2xl font-bold text-[#145a3a] dark:text-[#dfbd69]">
                        ﴿{inspectedWord.word}﴾
                      </span>
                      <span className="text-neutral-500">
                        آية ({inspectedWord.ayahEntry.ayah})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setHiddenWordKeys((prev) => ({
                            ...prev,
                            [inspectedWord.wordKey]: !prev[inspectedWord.wordKey],
                          }));
                          setInspectedWord(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-200 font-extrabold cursor-pointer"
                      >
                        إخفاء / كشف الكلمة
                      </button>
                      {[
                        { label: 'خطأ حفظ', cat: 'حفظ' as ErrorType, col: '#dc2626' },
                        { label: 'حكم تجويد/مد', cat: 'تجويد' as ErrorType, col: '#ea580c' },
                        { label: 'خطأ تشكيل', cat: 'تشكيل' as ErrorType, col: '#ca8a04' },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => {
                            setWordAnnotations((prev) => ({
                              ...prev,
                              [inspectedWord.wordKey]: {
                                wordKey: inspectedWord.wordKey,
                                surahId,
                                ayah: inspectedWord.ayahEntry.ayah,
                                wordText: inspectedWord.word,
                                tagType: 'error',
                                errorCategory: btn.cat,
                                tajweedRule: btn.label,
                                color: btn.col,
                                note: btn.label,
                              },
                            }));
                            setInspectedWord(null);
                            showToast(
                              `تم تحديد (${btn.label}) على الكلمة ﴿${inspectedWord.word}﴾`,
                              'info'
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg text-white font-extrabold cursor-pointer"
                          style={{ backgroundColor: btn.col }}
                        >
                          {btn.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          playHusaryAyahAudio(inspectedWord.ayahEntry.ayah)
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-[#dfbd69] font-extrabold cursor-pointer"
                      >
                        🔊 سماع الآية
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectedWord(null)}
                        className="px-2 py-1 text-neutral-400 hover:text-red-500 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Uthmani Verses Flow */}
                {loadingVerses ? (
                  <div className="py-12 text-center text-xs font-bold opacity-70">
                    جارٍ تحميل الآيات بالرسم العثماني...
                  </div>
                ) : (
                  <div className="font-quran text-2xl sm:text-3xl leading-[2.55] text-justify select-none">
                    {verses.map((v) => {
                      const words = v.text.split(/\s+/).filter(Boolean);
                      return (
                        <span key={v.ayah} className="inline mx-1">
                          {words.map((word, wIdx) => {
                            const wKey = `${v.ayah}:${wIdx}`;
                            const isHidden =
                              hideAllQuranWords
                                ? !hiddenWordKeys[wKey]
                                : Boolean(hiddenWordKeys[wKey]);
                            const annot = wordAnnotations[wKey];

                            return (
                              <span
                                key={wKey}
                                onClick={() => {
                                  if (hideAllQuranWords || hiddenWordKeys[wKey]) {
                                    setHiddenWordKeys((prev) => ({
                                      ...prev,
                                      [wKey]: !prev[wKey],
                                    }));
                                  } else {
                                    setInspectedWord({
                                      wordKey: wKey,
                                      word,
                                      ayahEntry: v,
                                    });
                                  }
                                }}
                                style={
                                  !isHidden && annot
                                    ? {
                                        backgroundColor: `${annot.color}28`,
                                        color: annot.color,
                                        borderBottom: `2px wavy ${annot.color}`,
                                      }
                                    : undefined
                                }
                                className={`inline-block mx-1 px-1.5 rounded-lg transition cursor-pointer ${
                                  isHidden
                                    ? 'bg-[#c59b27]/25 text-transparent border-b-2 border-dashed border-[#c59b27] min-w-[44px]'
                                    : 'hover:bg-[#c59b27]/20'
                                }`}
                                title="انقر لإخفاء/كشف الكلمة أو تحديد ملاحظة تسميع وتجويد"
                              >
                                {word}
                              </span>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => playHusaryAyahAudio(v.ayah)}
                            className={`inline-flex items-center justify-center w-8 h-8 mx-1 text-xs font-mono font-bold rounded-full border-2 cursor-pointer ${
                              playingAyah === v.ayah
                                ? 'bg-[#c59b27] text-[#14281d] border-[#145a3a] animate-pulse'
                                : 'border-[#c59b27] text-[#c59b27]'
                            }`}
                            title={`تشغيل صوت الشيخ الحصري للآية ${v.ayah}`}
                          >
                            {v.ayah}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* On-Board Text Elements Layer */}
            {currentPage.texts.map((txt) => (
              <div
                key={txt.id}
                style={{
                  top: `${txt.y}%`,
                  right: `${txt.x}%`,
                  color: txt.color,
                  fontSize: `${txt.fontSize}px`,
                }}
                className="absolute z-25 font-quran font-bold px-2 py-1 rounded-xl bg-white/40 dark:bg-black/30 backdrop-blur-[1px] flex items-center gap-2 shadow-2xs"
              >
                <span>{txt.text}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateCurrentPage((pg) => ({
                      ...pg,
                      texts: pg.texts.filter((t) => t.id !== txt.id),
                    }))
                  }
                  className="text-xs font-sans text-red-500 opacity-70 hover:opacity-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* On-Board Graphical Stamps Layer (الأختام التربوية والقرآنية الفورية) */}
            {currentPage.stamps.map((st) => (
              <div
                key={st.id}
                style={{
                  top: `${st.y}%`,
                  right: `${st.x}%`,
                  borderColor: st.color,
                  color: st.color,
                  backgroundColor: st.bgColor,
                }}
                className="absolute z-25 px-3.5 py-1.5 rounded-2xl border-2 shadow-md -rotate-6 flex items-center gap-2"
              >
                <div>
                  <div className="text-sm font-black">{st.label}</div>
                  <div className="text-[10px] font-bold opacity-85">
                    {st.subLabel}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateCurrentPage((pg) => ({
                      ...pg,
                      stamps: pg.stamps.filter((x) => x.id !== st.id),
                    }))
                  }
                  className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* On-Board Sticky Notes Layer (ورقة ملاحظات لاصقة) */}
            {currentPage.stickyNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  top: `${note.y}%`,
                  right: `${note.x}%`,
                  backgroundColor: note.color,
                }}
                className="absolute z-30 w-48 p-3 rounded-2xl shadow-lg border border-amber-400 text-[#14281d] space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] font-black border-b border-black/10 pb-1">
                  <span>📌 ملاحظة لاصقة</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCurrentPage((pg) => ({
                        ...pg,
                        stickyNotes: pg.stickyNotes.filter(
                          (n) => n.id !== note.id
                        ),
                      }))
                    }
                    className="cursor-pointer hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={note.text}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCurrentPage((pg) => ({
                      ...pg,
                      stickyNotes: pg.stickyNotes.map((n) =>
                        n.id === note.id ? { ...n, text: val } : n
                      ),
                    }));
                  }}
                  rows={3}
                  className="w-full bg-transparent text-xs font-bold focus:outline-none resize-none"
                />
              </div>
            ))}

            {/* Interactive HTML5 2D Drawing Canvas Overlay */}
            <canvas
              ref={canvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              className={`absolute inset-0 w-full h-full z-20 touch-none ${
                activeTool === 'select'
                  ? 'cursor-grab active:cursor-grabbing'
                  : 'cursor-crosshair'
              }`}
            />

            {/* High-Z HTML5 2D Particle System Canvas Overlay (Confetti, Golden Stars, Fireworks, Crowns, Petals) */}
            <canvas
              ref={particleCanvasRef}
              className="pointer-events-none absolute inset-0 w-full h-full z-35"
            />

            {/* Floating Celebration Banner when a Student Finishes Recitation or Wins */}
            {activeCelebrationBanner && (
              <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 z-40 px-6 py-3.5 rounded-3xl bg-gradient-to-l from-[#14281d] via-[#145a3a] to-[#0f452c] text-white border-2 border-[#dfbd69] shadow-2xl flex items-center gap-3 animate-bounce">
                <span className="text-3xl">{activeCelebrationBanner.icon}</span>
                <div className="text-right">
                  <div className="text-sm sm:text-base font-black text-[#dfbd69]">
                    {activeCelebrationBanner.title}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-100">
                    {activeCelebrationBanner.subtitle}
                  </div>
                </div>
              </div>
            )}

            {/* Spotlight Overlay (تعتيم للتركيز يتبع الماوس) */}
            {spotlightActive && (
              <div
                className="pointer-events-none absolute inset-0 z-30"
                style={{
                  background: `radial-gradient(circle 110px at ${pointerCoords.x}px ${pointerCoords.y}px, transparent 0%, rgba(0, 0, 0, 0.82) 100%)`,
                }}
              />
            )}

            {/* Mouse Halo Highlight (إبراز الماوس) */}
            {mouseHaloActive && (
              <div
                className="pointer-events-none absolute z-30 w-12 h-12 rounded-full border-4 border-[#c59b27] bg-amber-400/25 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${pointerCoords.x}px`,
                  top: `${pointerCoords.y}px`,
                }}
              />
            )}

            {/* Magnifier Loupe (عدسة مكبرة للكلمات القرآنية وعلامات الضبط) */}
            {magnifierActive && (
              <div
                style={{
                  left: `${Math.min(Math.max(90, pointerCoords.x), 500)}px`,
                  top: `${Math.max(20, pointerCoords.y - 110)}px`,
                }}
                className="pointer-events-none absolute z-35 px-5 py-3 rounded-3xl bg-[#fcfaf2] border-4 border-[#c59b27] shadow-2xl text-center"
              >
                <div className="text-[10px] font-extrabold text-[#145a3a]">
                  🔍 العدسة المكبرة لضبط الحركات (2.5×)
                </div>
                <div className="font-quran text-4xl font-bold text-[#14281d] mt-1">
                  {inspectedWord?.word ||
                    verses[0]?.text.split(' ').slice(0, 3).join(' ') ||
                    'بِسْمِ اللَّهِ'}
                </div>
              </div>
            )}

            {/* Screen Curtain (ستارة إخفاء الشاشة لكشف الآيات تدريجياً) */}
            {curtainActive && (
              <div
                style={{ height: `${curtainProgressPct}%` }}
                className="absolute bottom-0 left-0 right-0 z-35 bg-gradient-to-t from-[#0b1711] via-[#14281d] to-[#145a3a]/95 border-t-4 border-[#c59b27] flex flex-col items-center justify-start pt-3 shadow-2xl"
              >
                <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-full border border-[#c59b27]">
                  <span className="text-xs font-extrabold text-[#dfbd69]">
                    ستارة الكشف التدريجي للآيات ({curtainProgressPct}%)
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={curtainProgressPct}
                    onChange={(e) =>
                      setCurtainProgressPct(Number(e.target.value))
                    }
                    className="w-28 accent-[#c59b27] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setCurtainActive(false)}
                    className="text-xs text-red-300 font-bold cursor-pointer"
                  >
                    إغلاق ✕
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Ruler (مسطرة هندسية) */}
            {rulerActive && (
              <div className="absolute top-1/2 left-12 right-12 z-30 h-12 bg-amber-100/95 border-2 border-[#145a3a] rounded-xl shadow-lg flex items-end justify-between px-3 pb-1 text-[#14281d] font-mono text-[10px]">
                {Array.from({ length: 21 }).map((_, cm) => (
                  <div key={cm} className="flex flex-col items-center">
                    <span>{cm}</span>
                    <div className="w-0.5 h-3 bg-[#145a3a]" />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRulerActive(false)}
                  className="text-xs font-bold text-red-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Interactive Protractor (منقلة هندسية) */}
            {protractorActive && (
              <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 w-64 h-36 bg-sky-100/90 border-2 border-sky-700 rounded-t-full flex flex-col items-center justify-end pb-2 shadow-xl">
                <div className="text-[11px] font-mono font-bold text-sky-950">
                  0° — 45° — 90° — 135° — 180°
                </div>
                <button
                  type="button"
                  onClick={() => setProtractorActive(false)}
                  className="text-[10px] font-bold text-red-600 mt-1 cursor-pointer"
                >
                  إغلاق المنقلة ✕
                </button>
              </div>
            )}

            {/* Traffic Light Widget on Board (إشارة المرور لضبط الحلقة) */}
            {trafficLightState && (
              <div className="absolute top-4 left-4 z-35 p-2.5 rounded-2xl bg-[#14281d] border-2 border-[#c59b27] text-white flex items-center gap-2 shadow-xl">
                {(['red', 'yellow', 'green'] as const).map((clr) => (
                  <button
                    key={clr}
                    type="button"
                    onClick={() => setTrafficLightState(clr)}
                    className={`w-6 h-6 rounded-full border cursor-pointer ${
                      clr === 'red'
                        ? 'bg-red-500'
                        : clr === 'yellow'
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    } ${
                      trafficLightState === clr
                        ? 'ring-4 ring-white scale-110'
                        : 'opacity-35'
                    }`}
                  />
                ))}
                <span className="text-xs font-extrabold text-[#dfbd69] px-1">
                  {trafficLightState === 'red'
                    ? '🛑 أنصت لقراءة الشيخ'
                    : trafficLightState === 'yellow'
                    ? '⚠️ استعد للتسميع'
                    : '🟢 ابدأ التلاوة الآن'}
                </span>
                <button
                  type="button"
                  onClick={() => setTrafficLightState(null)}
                  className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Embedded YouTube Player Overlay */}
            {embeddedYoutubeId && (
              <div className="absolute bottom-14 left-4 z-35 w-80 rounded-2xl bg-[#14281d] border-2 border-[#c59b27] p-2 shadow-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#dfbd69] px-1">
                  <span>▶️ فيديو تعليمي مضمّن</span>
                  <button
                    type="button"
                    onClick={() => setEmbeddedYoutubeId(null)}
                    className="text-red-400 cursor-pointer"
                  >
                    إغلاق ✕
                  </button>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${embeddedYoutubeId}`}
                    title="YouTube video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* PDF Explainer Banner if active */}
            {pdfExplainerActive && (
              <div className="absolute top-4 right-4 z-35 px-3.5 py-2 rounded-2xl bg-[#145a3a] text-white border border-[#c59b27] text-xs font-extrabold flex items-center gap-2 shadow-lg">
                <FileText className="w-4 h-4 text-[#dfbd69]" />
                <span>وضع شرح ملف PDF نشط: {pdfFileName || 'مذكرة التجويد'}</span>
                <button
                  type="button"
                  onClick={() => setPdfExplainerActive(false)}
                  className="text-red-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Rising Poppable Balloons Layer (بالونات ملونة صاعدة قابلة للفرقعة بالنقر!) */}
            {risingBalloons.length > 0 && (
              <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
                {risingBalloons.map((bal) => (
                  <button
                    key={bal.id}
                    type="button"
                    onClick={() => {
                      playBoardSound('balloon_pop');
                      setRisingBalloons((prev) =>
                        prev.filter((x) => x.id !== bal.id)
                      );
                    }}
                    style={{
                      left: `${bal.x}%`,
                      top: `${bal.y}%`,
                      backgroundColor: bal.color,
                    }}
                    className="pointer-events-auto absolute px-3.5 py-4 rounded-full text-white font-black text-xs shadow-xl border-2 border-white/80 cursor-pointer transition-transform hover:scale-125 flex flex-col items-center"
                    title="انقر لفرقعة البالون!"
                  >
                    <span>🎈 {bal.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Full-Screen Visual Celebrations Overlay (Confetti, Fireworks, Star Rain, Victory Cup, Judge Gavel) */}
            {activeVisualCelebration && (
              <div className="pointer-events-none absolute inset-0 z-40 bg-black/35 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                <div className="text-5xl sm:text-6xl mb-3 animate-bounce">
                  {activeVisualCelebration === 'confetti' && '🎊 🎉 ✨ 🎊 🎉'}
                  {activeVisualCelebration === 'fireworks' && '🎆 🎇 ✨ 🎆 🎇'}
                  {activeVisualCelebration === 'star_rain' && '🌟 ⭐ ✨ 🌟 ⭐'}
                  {activeVisualCelebration === 'victory_cup' && '🏆 👑 🥇 👑 🏆'}
                  {activeVisualCelebration === 'judge_gavel' && '⚖️ 🔨 📜 🔨 ⚖️'}
                </div>
                <div className="px-8 py-5 rounded-3xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white border-4 border-[#dfbd69] shadow-2xl">
                  <div className="text-xl sm:text-2xl font-black text-[#dfbd69]">
                    {activeVisualCelebration === 'confetti' &&
                      'احتفالية قصاصات الورق الملونة! مبارك التفوق'}
                    {activeVisualCelebration === 'fireworks' &&
                      'ألعاب نارية احتفالية! إجابة قرآنية متقنة'}
                    {activeVisualCelebration === 'star_rain' &&
                      'مطر النجوم الذهبية للبطل المتقن!'}
                    {activeVisualCelebration === 'victory_cup' &&
                      `كأس الفوز والتميز للطالب ${activeStudent?.name || ''}!`}
                    {activeVisualCelebration === 'judge_gavel' &&
                      'تم اعتماد الحكم التجويدي والتسميع رسمياً!'}
                  </div>
                </div>
              </div>
            )}

            {/* Screen Freeze Snapshot Overlay */}
            {screenFrozen && frozenSnapshotUrl && (
              <div className="absolute inset-0 z-40 bg-black/20 flex flex-col items-center justify-start pt-3">
                <span className="px-4 py-1 rounded-full bg-sky-600 text-white text-xs font-black shadow-lg">
                  ❄️ الشاشة مجمدة مؤقتاً للعرض
                </span>
              </div>
            )}
          </div>

          {/* ================================================================
              BOTTOM STATUS BAR (شريط المعلومات السفلي القياسي)
          ================================================================ */}
          <div className="px-4 py-2 bg-[#14281d] text-white border-t border-[#c59b27]/40 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold z-30">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#dfbd69]">
                الوضع الحالي: {activeToolArabicLabel}
              </span>
              <span>|</span>
              <span className="font-mono">الحجم: {strokeWidth}px</span>
              <span>|</span>
              <span className="font-mono">الشفافية: {strokeOpacity}%</span>
              <span>|</span>
              <span className="font-mono">التكبير: {zoomPercent}%</span>
              <span>|</span>
              <button
                type="button"
                onClick={() => setShortcutsHelpModalOpen(true)}
                className="text-emerald-300 hover:underline cursor-pointer"
              >
                الاختصارات: F1
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-amber-300">
                نمط الجسيمات:{' '}
                {
                  PARTICLE_EFFECT_PATTERNS.find(
                    (p) => p.id === selectedParticlePattern
                  )?.label
                }
              </span>
              <span>|</span>
              <span className="text-emerald-200">
                ✓ حفظ تلقائي في IndexedDB ({currentPage.title})
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================================
            PANEL 3 (RIGHT): خصائص الأداة، القرآن والتجويد، ونظام الجسيمات والأصوات (Collapsible)
        ================================================================== */}
        {rightPanelOpen && (
          <aside className="lg:col-span-3 rounded-2xl bg-white dark:bg-[#12231a] p-4 border border-neutral-200 dark:border-emerald-900/60 shadow-xs space-y-4 overflow-y-auto max-h-[760px]">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-emerald-900/50">
              <h3 className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#c59b27]" />
                <span>الأدوات، الجسيمات البصرية، والأصوات التفاعلية</span>
              </h3>
              <button
                type="button"
                onClick={() => setRightPanelOpen(false)}
                className="text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                طي ✕
              </button>
            </div>

            {/* ==============================================================
                NEW SECTION: نظام التأثيرات البصرية التفاعلية (Canvas Particle Systems) + دمج الأصوات التفاعلية
            ============================================================== */}
            <div className="p-3 rounded-2xl bg-gradient-to-b from-[#fcfaf2] to-[#f4efe1] dark:from-[#0b1711] dark:to-[#102118] border-2 border-[#c59b27] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#c59b27]" />
                  <span>نظام الجسيمات (Particle Systems) والأصوات</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#145a3a] text-[#dfbd69] text-[10px] font-extrabold">
                  Canvas 2D
                </span>
              </div>

              {/* 1. اختيار نمط تأثير الجسيمات عبر القائمة الجانبية */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-extrabold text-neutral-700 dark:text-neutral-200">
                  اختر نمط التأثير البصري (ينطلق فوراً للمعاينة):
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PARTICLE_EFFECT_PATTERNS.map((pat) => {
                    const isSelected = selectedParticlePattern === pat.id;
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => {
                          setSelectedParticlePattern(pat.id);
                          spawnCanvasParticleBurst(pat.id, 0.5, 0.45, 0.9);
                          playBoardSound(
                            pat.id === 'golden_stars' || pat.id === 'quranic_light'
                              ? 'magic_wand'
                              : pat.id === 'fireworks'
                              ? 'fanfare'
                              : selectedPairedSound
                          );
                        }}
                        className={`p-2 rounded-xl border text-right transition cursor-pointer flex flex-col gap-0.5 ${
                          isSelected
                            ? 'bg-[#145a3a] text-white border-[#c59b27] ring-2 ring-[#c59b27]/40 shadow-xs'
                            : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/60 text-neutral-800 dark:text-neutral-200 hover:border-[#c59b27]'
                        }`}
                        title={pat.subLabel}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{pat.icon}</span>
                          {isSelected && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#c59b27] text-[#14281d] font-black">
                              نشط
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-extrabold leading-tight">
                          {pat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. أزرار الإطلاق الفوري عند فوز الطالب أو إنهاء تسميع مقطع قرآني */}
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleCompleteQuranPassageCelebration()}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-l from-emerald-600 via-[#145a3a] to-[#0f452c] hover:opacity-95 text-white text-xs font-black border border-[#c59b27] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🎉</span>
                  <span>إنهاء تسميع مقطع قرآني (إطلاق الجسيمات + الصوت)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStudentWinCelebration()}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-l from-amber-400 to-[#c59b27] hover:opacity-95 text-[#14281d] text-xs font-black shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>إعلان فوز الطالب ({activeStudent?.name || 'الطالب'}) 🏆</span>
                </button>
              </div>

              {/* 3. كثافة الجسيمات وخيارات التفاعل التلقائي */}
              <div className="space-y-1.5 pt-1 border-t border-[#c59b27]/30">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>كثافة الجسيمات:</span>
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'light' as const, label: 'خفيف' },
                        { id: 'medium' as const, label: 'متوسط' },
                        { id: 'intense' as const, label: 'كثيف احتفالي' },
                      ]
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setParticleDensity(d.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                          particleDensity === d.id
                            ? 'bg-[#145a3a] text-white'
                            : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between gap-2 text-[11px] font-bold cursor-pointer">
                  <span>إطلاق تلقائي عند حفظ التسميع بتقدير ممتاز:</span>
                  <input
                    type="checkbox"
                    checked={autoTriggerOnRecitationComplete}
                    onChange={() =>
                      setAutoTriggerOnRecitationComplete((v) => !v)
                    }
                    className="accent-[#145a3a] w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-2 text-[11px] font-bold cursor-pointer">
                  <span>تفاعل النقرات بالجسيمات والصوت على السبورة:</span>
                  <input
                    type="checkbox"
                    checked={clickBurstModeActive}
                    onChange={() => setClickBurstModeActive((v) => !v)}
                    className="accent-[#c59b27] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* 4. دمج الأصوات التفاعلية ومستوى الصوت (Interactive Web Audio Synthesizer) */}
              <div className="space-y-2 pt-2 border-t border-[#c59b27]/30">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-[#c59b27]" />
                    <span>دمج الأصوات التفاعلية:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSoundMuted((m) => !m)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                      soundMuted
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-[#145a3a] dark:text-emerald-300'
                    }`}
                  >
                    {soundMuted ? '🔇 مكتوم' : `🔊 الصوت ${soundVolumePct}%`}
                  </button>
                </div>

                <input
                  type="range"
                  min={10}
                  max={100}
                  value={soundVolumePct}
                  onChange={(e) => {
                    setSoundVolumePct(Number(e.target.value));
                    setSoundMuted(false);
                  }}
                  className="w-full accent-[#145a3a] cursor-pointer h-1.5"
                />

                <div className="text-[10px] font-bold text-neutral-500">
                  انقر لتشغيل الصوت التفاعلي وربطه بالجسيمات:
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {INTERACTIVE_SOUND_PRESETS.map((snd) => {
                    const isPaired = selectedPairedSound === snd.id;
                    return (
                      <button
                        key={snd.id}
                        type="button"
                        onClick={() => {
                          setSelectedPairedSound(snd.id);
                          playBoardSound(snd.id);
                        }}
                        className={`px-2 py-1.5 rounded-xl border text-right text-[10px] font-extrabold flex items-center justify-between gap-1 cursor-pointer transition ${
                          isPaired
                            ? 'bg-[#c59b27] text-[#14281d] border-[#145a3a] font-black'
                            : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 hover:border-[#c59b27]'
                        }`}
                      >
                        <span className="truncate">
                          {snd.icon} {snd.label}
                        </span>
                        {isPaired && <span className="text-[9px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 1. خصائص الأداة (10 ألوان سريعة + منتقي مخصص + سمك القلم + الشفافية) */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-emerald-900/40">
              <div className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300">
                ١. شبكة الألوان السريعة (10 ألوان) + منتقي مخصص:
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {QUICK_10_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setStrokeColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={`h-7 rounded-lg border-2 cursor-pointer transition-transform ${
                      strokeColor === hex
                        ? 'border-[#14281d] dark:border-white scale-110 ring-2 ring-[#c59b27]'
                        : 'border-white/50'
                    }`}
                    title={`اللون ${hex}`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-bold text-neutral-500">
                  منتقي ألوان حر:
                </span>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-10 h-7 rounded cursor-pointer border border-neutral-300"
                />
              </div>

              {/* Stroke Width Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>سمك القلم / الخط:</span>
                  <span className="font-mono text-[#145a3a] dark:text-[#dfbd69]">
                    {strokeWidth} px
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={36}
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full accent-[#145a3a] cursor-pointer"
                />
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>درجة الشفافية:</span>
                  <span className="font-mono text-[#145a3a] dark:text-[#dfbd69]">
                    {strokeOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={strokeOpacity}
                  onChange={(e) => setStrokeOpacity(Number(e.target.value))}
                  className="w-full accent-[#c59b27] cursor-pointer"
                />
              </div>
            </div>

            {/* 2. استيراد القرآن الكريم، التجويد، والوسائط */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-emerald-900/40">
              <div className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300">
                ٢. استيراد القرآن الكريم، التجويد، والوسائط:
              </div>
              <div className="space-y-1.5 text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuranLayerOnBoard(true);
                    setQuranPickerModalOpen(true);
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#dfbd69]" />
                    <span>آيات القرآن التفاعلية + صوت الحصري</span>
                  </span>
                  <span className="text-[10px] text-[#dfbd69]">
                    سورة {surahMeta.name}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMakharijPickerOpen((v) => !v)}
                  className="w-full p-2.5 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#c59b27]" />
                    <span>بطاقات مخارج الحروف والتجويد (SVG)</span>
                  </span>
                  <span>+</span>
                </button>

                {makharijPickerOpen && (
                  <div className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 space-y-1 text-[11px]">
                    {[
                      {
                        id: 'makharij_map' as const,
                        label: 'إدراج خريطة مخارج الحروف الخمسة (الجوف، الحلق، اللسان...)',
                      },
                      {
                        id: 'noon_rules' as const,
                        label: 'إدراج بطاقة أحكام النون الساكنة والتنوين والمدود',
                      },
                    ].map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          updateCurrentPage((pg) => ({
                            ...pg,
                            makharijCardType: card.id,
                          }));
                          setMakharijPickerOpen(false);
                          showToast(
                            'تم إدراج بطاقة التجويد والمخارج كطبقة تفاعلية على السبورة',
                            'success'
                          );
                        }}
                        className="w-full p-2 rounded-lg hover:bg-[#145a3a] hover:text-white text-right cursor-pointer"
                      >
                        {card.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 flex flex-col items-center gap-1 cursor-pointer hover:border-[#c59b27]"
                  >
                    <ImagePlus className="w-4 h-4 text-[#145a3a]" />
                    <span>إدراج صورة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 flex flex-col items-center gap-1 cursor-pointer hover:border-[#c59b27]"
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>شرح ملف PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setYoutubeModalOpen(true)}
                    className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 flex flex-col items-center gap-1 cursor-pointer hover:border-[#c59b27]"
                  >
                    <Film className="w-4 h-4 text-rose-600" />
                    <span>فيديو يوتيوب</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. ميزات العرض والتسجيل */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-emerald-900/40">
              <div className="text-[11px] font-extrabold text-neutral-600 dark:text-neutral-300">
                ٣. ميزات العرض والتركيز والتسجيل:
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setSpotlightActive((v) => !v)}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                    spotlightActive
                      ? 'bg-[#145a3a] text-white border-[#c59b27]'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-[#c59b27]" />
                  <span>تعتيم للتركيز</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSmartTimerOpen((v) => !v)}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                    smartTimerOpen
                      ? 'bg-[#145a3a] text-white border-[#c59b27]'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-[#c59b27]" />
                  <span>مؤقت ذكي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMouseHaloActive((v) => !v)}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                    mouseHaloActive
                      ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27]'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>إبراز الماوس</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTrafficLightState((prev) => (prev ? null : 'green'))
                  }
                  className={`p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                    trafficLightState
                      ? 'bg-emerald-700 text-white border-emerald-500'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                  }`}
                >
                  <span>🚦</span>
                  <span>إشارة مرور</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleScreenFreeze}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                    screenFrozen
                      ? 'bg-sky-600 text-white border-sky-400'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                  }`}
                >
                  <span>❄️</span>
                  <span>{screenFrozen ? 'إلغاء التجميد' : 'تجميد الشاشة'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportImage('png')}
                  className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>لقطة شاشة فورية</span>
                </button>
              </div>

              {/* Smart Timer Inline Widget when open */}
              {smartTimerOpen && (
                <div className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27] space-y-2 text-center">
                  <div className="text-xl font-black font-mono text-[#145a3a] dark:text-[#dfbd69]">
                    {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                    {String(timerSeconds % 60).padStart(2, '0')}
                  </div>
                  <div className="flex justify-center gap-1.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTimerRunning((r) => !r)}
                      className="px-3 py-1 rounded-lg bg-[#145a3a] text-white cursor-pointer"
                    >
                      {timerRunning ? 'إيقاف' : 'بدء'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimerSeconds(5 * 60)}
                      className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-emerald-950 cursor-pointer"
                    >
                      5د
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimerSeconds(15 * 60)}
                      className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-emerald-950 cursor-pointer"
                    >
                      15د
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ====================================================================
          2. FLOATING DOCK TOOLBAR (الشريط السفلي العائم للأدوات باختصارات الكيبورد)
      ==================================================================== */}
      <div className="sticky bottom-2 z-40 mx-auto w-full max-w-5xl">
        {/* Popover Sub-Menus above the Floating Dock */}
        {openDockMenu === 'pens' && (
          <div className="mb-2 p-3 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
              ✒️ قائمة الأقلام المتخصصة (P / C / H):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'pen' as const, label: 'قلم عادي (P)' },
                  {
                    id: 'calligraphy' as const,
                    label: 'قلم الخط العربي المائل (C)',
                  },
                  { id: 'brush' as const, label: 'فرشاة فنية' },
                  { id: 'chalk' as const, label: 'طباشير مدرسي' },
                  {
                    id: 'highlighter' as const,
                    label: 'ماركر تظليل فسفوري (H)',
                  },
                  { id: 'spray' as const, label: 'بخاخ لوني' },
                ]
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActiveTool(p.id);
                    setOpenDockMenu(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                    activeTool === p.id
                      ? 'bg-[#145a3a] text-white'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {openDockMenu === 'text_bar' && (
          <div className="mb-2 p-3 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-xl space-y-2.5 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
                🔤 أداة النص وشريط التشكيل القرآني والرموز العثمانية (انقر على السبورة لإدراج النص):
              </span>
              <button
                type="button"
                onClick={() => setOpenDockMenu(null)}
                className="text-xs text-neutral-400 cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={draftBoardText}
                onChange={(e) => setDraftBoardText(e.target.value)}
                placeholder="اكتب الكلمة أو الآية ثم اضغط على أزرار التشكيل..."
                className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-[#c59b27] bg-[#fcfaf2] dark:bg-[#0b1711] font-quran text-xl font-bold"
              />
              <div className="flex items-center gap-1 text-xs font-bold">
                <span>الحجم:</span>
                <input
                  type="number"
                  min={16}
                  max={64}
                  value={draftTextSize}
                  onChange={(e) =>
                    setDraftTextSize(Number(e.target.value) || 28)
                  }
                  className="w-14 px-2 py-1.5 rounded-xl border border-neutral-300 font-mono text-center"
                />
              </div>
            </div>
            {/* Quick Quranic Tashkeel & Uthmani Symbols Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              {TASHKEEL_AND_UTHMANI_SYMBOLS.map((sym) => (
                <button
                  key={sym.name}
                  type="button"
                  onClick={() =>
                    setDraftBoardText((prev) => `${prev}${sym.symbol}`)
                  }
                  className="px-2.5 py-1 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] hover:bg-[#c59b27] hover:text-[#14281d] border border-[#c59b27]/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title={`إضافة ${sym.name}`}
                >
                  <span className="font-quran text-base font-bold text-[#145a3a] dark:text-[#dfbd69]">
                    {sym.sample}
                  </span>
                  <span>{sym.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {openDockMenu === 'shapes' && (
          <div className="mb-2 p-3 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69] ml-1">
                📐 الأشكال (S):
              </span>
              {(
                [
                  { id: 'line' as const, label: 'خط مستقيم' },
                  { id: 'arrow' as const, label: 'سهم' },
                  { id: 'rect' as const, label: 'مستطيل' },
                  { id: 'circle' as const, label: 'دائرة' },
                  { id: 'triangle' as const, label: 'مثلث' },
                  { id: 'diamond' as const, label: 'معين' },
                ]
              ).map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => {
                    setActiveTool(sh.id);
                    setOpenDockMenu(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                    activeTool === sh.id
                      ? 'bg-[#145a3a] text-white'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
                  }`}
                >
                  {sh.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-500">
                نمط الخط:
              </span>
              {(
                [
                  { id: 'solid' as const, label: 'مستمر ━━' },
                  { id: 'dotted' as const, label: 'منقط •••' },
                  { id: 'dashed' as const, label: 'متقطع ╌╌' },
                ]
              ).map((ls) => (
                <button
                  key={ls.id}
                  type="button"
                  onClick={() => setStrokeLineStyle(ls.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    strokeLineStyle === ls.id
                      ? 'bg-[#c59b27] text-[#14281d] font-extrabold'
                      : 'bg-neutral-100 dark:bg-[#0b1711]'
                  }`}
                >
                  {ls.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {openDockMenu === 'stamps' && (
          <div className="mb-2 p-3 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
              💮 الأختام التربوية والقرآنية الفورية (M) — اختر الختم ثم انقر على السبورة:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {EDUCATIONAL_STAMPS.map((st) => (
                <button
                  key={st.type}
                  type="button"
                  onClick={() => {
                    setSelectedStampType(st.type);
                    setActiveTool('stamp');
                    setOpenDockMenu(null);
                  }}
                  style={{
                    borderColor: st.color,
                    color: st.color,
                    backgroundColor: st.bgColor,
                  }}
                  className="px-3 py-1.5 rounded-xl border-2 text-xs font-black cursor-pointer"
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {openDockMenu === 'trails' && (
          <div className="mb-2 p-3 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
              ✨ مؤثرات تتبع القلم أثناء الشرح (X):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {CURSOR_TRAIL_EFFECTS.map((ef) => (
                <button
                  key={ef.id}
                  type="button"
                  onClick={() => {
                    setCursorTrailEffect(ef.id);
                    setOpenDockMenu(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                    cursorTrailEffect === ef.id
                      ? 'bg-[#145a3a] text-white'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
                  }`}
                >
                  {ef.icon} {ef.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {openDockMenu === 'utilities' && (
          <div className="mb-2 p-3 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
              🧰 قائمة الأدوات المساعدة للحلقة (G):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setMagnifierActive((v) => !v);
                  setOpenDockMenu(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold cursor-pointer"
              >
                🔍 عدسة مكبرة
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurtainActive((v) => !v);
                  setOpenDockMenu(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold cursor-pointer"
              >
                🎭 ستارة إخفاء الشاشة
              </button>
              <button
                type="button"
                onClick={() => {
                  setWheelModalOpen(true);
                  setOpenDockMenu(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-black cursor-pointer"
              >
                🎡 عجلة الحظ الذكية للطلاب
              </button>
              <button
                type="button"
                onClick={() => {
                  setRulerActive((v) => !v);
                  setOpenDockMenu(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold cursor-pointer"
              >
                📏 مسطرة هندسية
              </button>
              <button
                type="button"
                onClick={() => {
                  setProtractorActive((v) => !v);
                  setOpenDockMenu(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold cursor-pointer"
              >
                📐 منقلة هندسية
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalculatorOpen((v) => !v);
                  setOpenDockMenu(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold cursor-pointer"
              >
                🧮 آلة حاسبة
              </button>
              <button
                type="button"
                onClick={() => {
                  updateCurrentPage((pg) => ({
                    ...pg,
                    stickyNotes: [
                      ...pg.stickyNotes,
                      {
                        id: `note-${Date.now()}`,
                        text: 'ملاحظة للمراجعة في الحصة القادمة...',
                        color: '#fef08a',
                        x: 12 + ((pg.stickyNotes.length * 14) % 55),
                        y: 18 + ((pg.stickyNotes.length * 10) % 45),
                      },
                    ],
                  }));
                  setOpenDockMenu(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-200 text-[#14281d] text-xs font-extrabold cursor-pointer"
              >
                📌 ورقة ملاحظات لاصقة
              </button>
            </div>
          </div>
        )}

        {/* Main Floating Dock Bar */}
        <div className="rounded-2xl bg-white/95 dark:bg-[#12231a]/95 backdrop-blur-md border-2 border-[#145a3a] dark:border-[#c59b27] shadow-2xl px-3 py-2 flex flex-wrap items-center justify-between gap-1.5">
          {/* Select (V), Undo, Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTool('select');
                setOpenDockMenu(null);
              }}
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                activeTool === 'select'
                  ? 'bg-[#145a3a] text-white'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="أداة التحديد والتحريك (V)"
            >
              <Move className="w-3.5 h-3.5" />
              <span>تحريك (V)</span>
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={currentPage.strokes.length === 0}
              className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] disabled:opacity-35 cursor-pointer"
              title="تراجع (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] disabled:opacity-35 cursor-pointer"
              title="إعادة (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Specialized Pens (P / C / H) */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTool('pen');
                setOpenDockMenu((m) => (m === 'pens' ? null : 'pens'));
              }}
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                ['pen', 'brush', 'chalk', 'spray'].includes(activeTool)
                  ? 'bg-[#145a3a] text-white'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="قائمة الأقلام المتخصصة (P)"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>الأقلام (P) ▾</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTool('calligraphy');
                setOpenDockMenu(null);
              }}
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                activeTool === 'calligraphy'
                  ? 'bg-[#c59b27] text-[#14281d]'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="قلم الخط العربي المائل (C)"
            >
              <span>✒️ خط عربي (C)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTool('highlighter');
                setOpenDockMenu(null);
              }}
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-amber-400 text-[#14281d]'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="ماركر تظليل فسفوري (H)"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>تظليل (H)</span>
            </button>

            {/* Laser Pointer (L) */}
            <button
              type="button"
              onClick={() => {
                setActiveTool('laser');
                setOpenDockMenu(null);
              }}
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                activeTool === 'laser'
                  ? 'bg-red-600 text-white'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="مؤشر الليزر المؤقت (L)"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>ليزر (L)</span>
            </button>

            {/* Text & Quranic Tashkeel (T) */}
            <button
              type="button"
              onClick={() => {
                setActiveTool('text');
                setOpenDockMenu((m) => (m === 'text_bar' ? null : 'text_bar'));
              }}
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                activeTool === 'text' || openDockMenu === 'text_bar'
                  ? 'bg-[#145a3a] text-white'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="أداة النص والتشكيل القرآني (T)"
            >
              <Type className="w-3.5 h-3.5" />
              <span>نص وتشكيل (T) ▾</span>
            </button>

            {/* Smart Eraser (E) */}
            <button
              type="button"
              onClick={() => {
                setActiveTool('eraser');
                setOpenDockMenu(null);
              }}
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="الممحاة الذكية (E)"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ممحاة (E)</span>
            </button>

            {/* Shapes (S) */}
            <button
              type="button"
              onClick={() =>
                setOpenDockMenu((m) => (m === 'shapes' ? null : 'shapes'))
              }
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                ['line', 'arrow', 'rect', 'circle', 'triangle', 'diamond'].includes(
                  activeTool
                ) || openDockMenu === 'shapes'
                  ? 'bg-[#145a3a] text-white'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="الخطوط والأشكال الهندسية (S)"
            >
              <Square className="w-3.5 h-3.5" />
              <span>أشكال (S) ▾</span>
            </button>

            {/* Stamps (M) */}
            <button
              type="button"
              onClick={() =>
                setOpenDockMenu((m) => (m === 'stamps' ? null : 'stamps'))
              }
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                activeTool === 'stamp' || openDockMenu === 'stamps'
                  ? 'bg-[#c59b27] text-[#14281d]'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="الأختام التربوية والقرآنية الفورية (M)"
            >
              <Award className="w-3.5 h-3.5" />
              <span>أختام (M) ▾</span>
            </button>

            {/* Cursor Trails (X) */}
            <button
              type="button"
              onClick={() =>
                setOpenDockMenu((m) => (m === 'trails' ? null : 'trails'))
              }
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                cursorTrailEffect !== 'none' || openDockMenu === 'trails'
                  ? 'bg-purple-700 text-white'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="مؤثرات تتبع القلم (X)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تتبع (X) ▾</span>
            </button>

            {/* Utilities (G) */}
            <button
              type="button"
              onClick={() =>
                setOpenDockMenu((m) => (m === 'utilities' ? null : 'utilities'))
              }
              className={`px-2.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                openDockMenu === 'utilities'
                  ? 'bg-[#145a3a] text-white'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
              }`}
              title="الأدوات المساعدة وعجلة الحظ (G)"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>أدوات (G) ▾</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. CELEBRATION & SOUND FX MODAL (مركز المؤثرات الصوتية والاحتفالات التفاعلية)
      ==================================================================== */}
      {celebrationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#12231a] border-4 border-[#c59b27] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-emerald-900">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#145a3a] dark:text-[#dfbd69]">
                    مركز المؤثرات الصوتية والاحتفالات التفاعلية
                  </h3>
                  <p className="text-xs text-neutral-500">
                    مولدة برمجياً 100% عبر Web Audio API و HTML5 Canvas لتعمل أوفلاين بالكامل
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCelebrationModalOpen(false)}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-emerald-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Web Audio API Synthesized Sound FX */}
            <div className="space-y-2.5">
              <div className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
                ١. مؤثرات صوتية مباشرة (Web Audio API — أوفلاين 100%):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-extrabold">
                {(
                  [
                    { id: 'applause' as const, label: '👏 تصفيق حار' },
                    { id: 'drums' as const, label: '🥁 طبول التشويق' },
                    { id: 'bell' as const, label: '🔔 جرس' },
                    { id: 'correct' as const, label: '✅ نغمة إجابة صحيحة' },
                    { id: 'wrong' as const, label: '❌ تنبيه إجابة خاطئة' },
                    { id: 'whistle' as const, label: '📯 صفارة' },
                    { id: 'countdown' as const, label: '⏱️ عد تنازلي' },
                    { id: 'magic_wand' as const, label: '🪄 عصا سحرية' },
                  ]
                ).map((snd) => (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => playSynthesizedSoundFX(snd.id)}
                    className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] hover:bg-[#145a3a] hover:text-white border border-[#c59b27]/50 transition cursor-pointer"
                  >
                    {snd.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Full-Screen Visual Celebrations */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-emerald-900">
              <div className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
                ٢. مؤثرات بصرية احتفالية تملأ الشاشة:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-black">
                <button
                  type="button"
                  onClick={() =>
                    triggerVisualCelebration('confetti', 'applause')
                  }
                  className="p-3.5 rounded-2xl bg-gradient-to-l from-emerald-600 to-[#145a3a] text-white cursor-pointer shadow-sm"
                >
                  🎊 قصاصات الورق الملونة (Confetti)
                </button>
                <button
                  type="button"
                  onClick={launchRisingBalloons}
                  className="p-3.5 rounded-2xl bg-gradient-to-l from-rose-500 to-pink-600 text-white cursor-pointer shadow-sm"
                >
                  🎈 بالونات ملونة صاعدة (قابلة للفرقعة!)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerVisualCelebration('fireworks', 'applause')
                  }
                  className="p-3.5 rounded-2xl bg-gradient-to-l from-purple-600 to-indigo-700 text-white cursor-pointer shadow-sm"
                >
                  🎆 ألعاب نارية
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerVisualCelebration('star_rain', 'magic_wand')
                  }
                  className="p-3.5 rounded-2xl bg-gradient-to-l from-amber-400 to-[#c59b27] text-[#14281d] cursor-pointer shadow-sm"
                >
                  🌟 مطر النجوم
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerVisualCelebration('victory_cup', 'correct')
                  }
                  className="p-3.5 rounded-2xl bg-[#14281d] text-[#dfbd69] border border-[#c59b27] cursor-pointer shadow-sm"
                >
                  🏆 كأس الفوز
                </button>
                <button
                  type="button"
                  onClick={() =>
                    triggerVisualCelebration('judge_gavel', 'gavel')
                  }
                  className="p-3.5 rounded-2xl bg-amber-900 text-white cursor-pointer shadow-sm"
                >
                  🔨 مطرقة القاضي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          4. WHEEL OF FORTUNE MODAL (عجلة الحظ الذكية لأسماء الطلاب الفعليين)
      ==================================================================== */}
      {wheelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#12231a] border-4 border-[#c59b27] p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-emerald-900 pb-2">
              <h3 className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69]">
                🎡 عجلة الحظ الذكية لاختيار طالب للتسميع
              </h3>
              <button
                type="button"
                onClick={() => setWheelModalOpen(false)}
                className="cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
              <div
                style={{
                  transform: `rotate(${wheelRotationDeg}deg)`,
                  transition: wheelSpinning
                    ? 'transform 2.5s cubic-bezier(0.15, 0.85, 0.25, 1)'
                    : 'none',
                }}
                className="w-52 h-52 rounded-full border-8 border-[#c59b27] bg-gradient-to-tr from-[#145a3a] via-emerald-700 to-amber-600 flex items-center justify-center shadow-xl"
              >
                <div className="grid grid-cols-2 gap-1 p-3 text-[11px] font-black text-white">
                  {students.slice(0, 6).map((st) => (
                    <span
                      key={st.id}
                      className="px-2 py-1 rounded bg-black/25 truncate"
                    >
                      {st.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute -top-2 text-2xl">🔻</div>
            </div>

            {wheelWinnerName && (
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border-2 border-[#c59b27] text-sm font-black text-[#145a3a] dark:text-[#dfbd69]">
                🎉 الطالب المختار للتسميع الآن: {wheelWinnerName}
              </div>
            )}

            <button
              type="button"
              onClick={handleSpinWheelOfFortune}
              disabled={wheelSpinning}
              className="w-full py-3 rounded-2xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-black cursor-pointer"
            >
              {wheelSpinning ? 'جارٍ تدوير العجلة...' : '🎲 أدر عجلة الحظ الآن'}
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          5. QURAN INTERACTIVE VERSES PICKER MODAL
      ==================================================================== */}
      {quranPickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h3 className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69]">
                📖 اختيار السورة والآيات التفاعلية على السبورة
              </h3>
              <button
                type="button"
                onClick={() => setQuranPickerModalOpen(false)}
                className="cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block mb-1">السورة الكريمة:</label>
                <select
                  value={surahId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const meta = SURAHS.find((s) => s.id === id) || SURAHS[0];
                    setSurahId(id);
                    setFromAyah(1);
                    setToAyah(Math.min(10, meta.ayahs));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#fcfaf2] dark:bg-[#0b1711]"
                >
                  {SURAHS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}. سورة {s.name} ({s.ayahs} آية)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1">من آية:</label>
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
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block mb-1">إلى آية:</label>
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
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono text-center"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQuranLayerOnBoard(true);
                setQuranPickerModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-black cursor-pointer"
            >
              إدراج الآيات بالرسم العثماني على السبورة
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          6. YOUTUBE EMBED MODAL, CALCULATOR MODAL, CONFIRM CLEAR, SHORTCUTS (F1), & EVALUATION MODAL
      ==================================================================== */}
      {youtubeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] p-5 space-y-3">
            <h3 className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69]">
              ▶️ تضمين فيديو يوتيوب تعليمي على السبورة
            </h3>
            <input
              type="text"
              value={youtubeUrlInput}
              onChange={(e) => setYoutubeUrlInput(e.target.value)}
              placeholder="الصق رابط يوتيوب (مثال: https://www.youtube.com/watch?v=...)"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-mono"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const match = youtubeUrlInput.match(
                    /(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/
                  );
                  setEmbeddedYoutubeId(match ? match[1] : 'dQw4w9WgXcQ');
                  setYoutubeModalOpen(false);
                  showToast('تم تضمين مشغل الفيديو على السبورة', 'success');
                }}
                className="flex-1 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
              >
                تضمين الفيديو
              </button>
              <button
                type="button"
                onClick={() => setYoutubeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-200 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {calculatorOpen && (
        <div className="fixed bottom-20 left-6 z-50 w-64 rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] p-4 shadow-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
            <span>🧮 آلة حاسبة للدرجات والآيات</span>
            <button
              type="button"
              onClick={() => setCalculatorOpen(false)}
              className="cursor-pointer"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            readOnly
            value={calcExpression || '0'}
            className="w-full p-2 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border font-mono text-right text-base font-black"
          />
          <div className="grid grid-cols-4 gap-1 text-xs font-mono font-bold">
            {[
              '7',
              '8',
              '9',
              '/',
              '4',
              '5',
              '6',
              '*',
              '1',
              '2',
              '3',
              '-',
              '0',
              'C',
              '=',
              '+',
            ].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => {
                  if (btn === 'C') setCalcExpression('');
                  else if (btn === '=') {
                    try {
                      const sanitized = calcExpression.replace(
                        /[^0-9+\-*/.]/g,
                        ''
                      );
                      setCalcExpression(
                        String(Function(`"use strict";return (${sanitized})`)())
                      );
                    } catch {
                      setCalcExpression('خطأ');
                    }
                  } else {
                    setCalcExpression((prev) => `${prev}${btn}`);
                  }
                }}
                className="py-2 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] hover:bg-[#c59b27] hover:text-[#14281d] cursor-pointer"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      {confirmClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#12231a] border-2 border-red-500 p-6 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-sm font-black text-[#14281d] dark:text-white">
              تأكيد مسح محتويات السبورة الحالية
            </h3>
            <p className="text-xs text-neutral-500">
              هل أنت متأكد من رغبتك في مسح كافة الرسومات والأختام والنصوص على ({currentPage.title})؟
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearCurrentBoardConfirmed}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-extrabold cursor-pointer"
              >
                نعم، امسح السبورة
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-200 dark:bg-emerald-950 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {shortcutsHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] p-6 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69]">
                ⌨️ دليل اختصارات الكيبورد للسبورة الذكية (F1)
              </h3>
              <button
                type="button"
                onClick={() => setShortcutsHelpModalOpen(false)}
                className="cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div>V : أداة التحديد والتحريك</div>
              <div>P / N : القلم العادي</div>
              <div>C : قلم الخط العربي المائل</div>
              <div>H : ماركر التظليل الفسفوري</div>
              <div>L : مؤشر الليزر المؤقت</div>
              <div>T : النص والتشكيل القرآني</div>
              <div>E : الممحاة الذكية</div>
              <div>S : الخطوط والأشكال الهندسية</div>
              <div>M : الأختام التربوية الفورية</div>
              <div>X : مؤثرات تتبع القلم</div>
              <div>G : الأدوات المساعدة وعجلة الحظ</div>
              <div>Ctrl+Z / Ctrl+Y : تراجع / إعادة</div>
            </div>
          </div>
        </div>
      )}

      {/* Save Evaluation & Board to Student Session Modal */}
      {showEvaluationModal && activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#12231a] border-4 border-[#c59b27] p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69]">
                حفظ رسومات السبورة وتقييم التسميع — {activeStudent.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowEvaluationModal(false)}
                className="cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap gap-1.5">
                {(['ممتاز', 'جيد جداً', 'جيد', 'ضعيف', 'إعادة'] as GradeType[]).map(
                  (g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEvalGrade(g)}
                      className={`px-3 py-1.5 rounded-xl font-extrabold cursor-pointer ${
                        evalGrade === g
                          ? 'bg-[#145a3a] text-white'
                          : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
                      }`}
                    >
                      {g}
                    </button>
                  )
                )}
              </div>

              <input
                type="text"
                value={evalCustomNote}
                onChange={(e) => setEvalCustomNote(e.target.value)}
                placeholder="ملاحظة للمعلم حول الحصة والرسومات التوضيحية..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-300"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveBoardToStudentSession}
                className="flex-1 py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-black cursor-pointer"
              >
                حفظ وربط بسجل الطالب والحصة الحالية
              </button>
              <button
                type="button"
                onClick={() => setShowEvaluationModal(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-200 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SLIDE-OUT CELEBRATION PARTICLE SIDEBAR (قائمة منبثقة جانبية لنظام جزيئات الاحتفال)
      ==================================================================== */}
      {particleSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]">
          <div
            className="flex-1"
            onClick={() => setParticleSidebarOpen(false)}
          />
          <aside className="w-full max-w-sm h-full bg-white dark:bg-[#12231a] border-r-4 border-[#c59b27] shadow-2xl flex flex-col justify-between overflow-y-auto p-5 space-y-4 animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#c59b27]/30 pb-3">
                <div>
                  <h3 className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#c59b27]" />
                    <span>قائمة نظام جزيئات الاحتفال (Canvas 2D)</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-emerald-200/70 font-bold mt-0.5">
                    بدّل بين أنماط الاحتفال البصرية وحدد كثافة الجزيئات قبل إطلاقها
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setParticleSidebarOpen(false)}
                  className="p-1.5 rounded-xl bg-neutral-100 dark:bg-emerald-950/70 hover:bg-red-100 text-neutral-600 dark:text-emerald-200 cursor-pointer"
                  title="إغلاق القائمة الجانبية"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Quick Switch Between Primary Visual Patterns (نجوم، بالونات، قصاصات) */}
              <div className="space-y-2">
                <div className="text-xs font-black text-[#14281d] dark:text-white flex items-center justify-between">
                  <span>1. اختر نمط الاحتفال البصري:</span>
                  <span className="text-[10px] font-bold text-[#c59b27]">
                    7 أنماط متاحة
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: 'golden_stars' as ParticleEffectMode,
                        title: 'نجوم',
                        sub: 'Stars',
                        icon: '🌟',
                      },
                      {
                        id: 'balloons_party' as ParticleEffectMode,
                        title: 'بالونات',
                        sub: 'Balloons',
                        icon: '🎈',
                      },
                      {
                        id: 'confetti' as ParticleEffectMode,
                        title: 'قصاصات',
                        sub: 'Confetti',
                        icon: '🎊',
                      },
                    ] as const
                  ).map((quick) => {
                    const active = selectedParticlePattern === quick.id;
                    return (
                      <button
                        key={quick.id}
                        type="button"
                        onClick={() => setSelectedParticlePattern(quick.id)}
                        className={`p-2.5 rounded-2xl border-2 text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          active
                            ? 'bg-gradient-to-b from-[#145a3a] to-[#0f452c] text-white border-[#c59b27] shadow-md scale-[1.02]'
                            : 'bg-[#fcfaf2] dark:bg-[#0b1711] text-neutral-700 dark:text-emerald-100 border-neutral-200 dark:border-emerald-900/60 hover:border-[#c59b27]'
                        }`}
                      >
                        <span className="text-2xl">{quick.icon}</span>
                        <span className="text-xs font-black">{quick.title}</span>
                        <span
                          className={`text-[9px] font-mono ${
                            active ? 'text-[#dfbd69]' : 'text-neutral-400'
                          }`}
                        >
                          {quick.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Full List of All 7 Patterns */}
                <div className="space-y-1.5 pt-1">
                  {PARTICLE_EFFECT_PATTERNS.map((pat) => {
                    const isSelected = selectedParticlePattern === pat.id;
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => setSelectedParticlePattern(pat.id)}
                        className={`w-full px-3 py-2 rounded-xl border text-right flex items-center justify-between gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-xs'
                            : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-700 dark:text-emerald-100 border-neutral-200 dark:border-emerald-900/50 hover:border-[#c59b27]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{pat.icon}</span>
                          <div className="truncate">
                            <div className="text-xs font-extrabold truncate">
                              {pat.label}
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                isSelected
                                  ? 'text-emerald-100/90'
                                  : 'text-neutral-400'
                              }`}
                            >
                              {pat.subLabel}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-[#c59b27] text-[#14281d] text-[9px] font-black shrink-0">
                            مُحدد
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Particle Density Level & Multiplier Controls */}
              <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
                    2. مستوى كثافة الجزيئات (Particle Density):
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#145a3a] text-[#dfbd69] text-[10px] font-mono font-black">
                    {Math.round(
                      (particleDensity === 'light'
                        ? 45
                        : particleDensity === 'medium'
                        ? 85
                        : 140) *
                        (customDensityMultiplier / 100)
                    )}{' '}
                    جزيء/دفعة
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'light', label: 'خفيف (45)', desc: 'هادئ' },
                      { id: 'medium', label: 'متوسط (85)', desc: 'متوازن' },
                      { id: 'intense', label: 'كثيف (140)', desc: 'احتفالي' },
                    ] as {
                      id: ParticleDensityLevel;
                      label: string;
                      desc: string;
                    }[]
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setParticleDensity(d.id)}
                      className={`py-2 px-2 rounded-xl text-center border transition cursor-pointer ${
                        particleDensity === d.id
                          ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27] font-black shadow-xs'
                          : 'bg-white dark:bg-[#12231a] text-neutral-600 dark:text-emerald-200 border-neutral-200 dark:border-emerald-900 font-bold'
                      }`}
                    >
                      <div className="text-[11px]">{d.label}</div>
                      <div className="text-[9px] opacity-75">{d.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Fine-grained Multiplier Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-neutral-600 dark:text-emerald-200">
                      مُضاعف الكثافة الدقيق:
                    </span>
                    <span className="font-mono font-black text-[#145a3a] dark:text-[#dfbd69]">
                      {customDensityMultiplier}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={10}
                    value={customDensityMultiplier}
                    onChange={(e) =>
                      setCustomDensityMultiplier(Number(e.target.value))
                    }
                    className="w-full accent-[#145a3a]"
                  />
                </div>
              </div>

              {/* 3. Paired Interactive Sound Selection */}
              <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
                    3. الصوت التفاعلي المرافق (Web Audio):
                  </span>
                  <button
                    type="button"
                    onClick={() => playBoardSound(selectedPairedSound)}
                    className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black cursor-pointer"
                  >
                    🔊 تجربة الصوت
                  </button>
                </div>

                <select
                  value={selectedPairedSound}
                  onChange={(e) => {
                    const nextSound = e.target.value as SoundEffectType;
                    setSelectedPairedSound(nextSound);
                    playBoardSound(nextSound);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#12231a] text-xs font-extrabold"
                >
                  {INTERACTIVE_SOUND_PRESETS.map((snd) => (
                    <option key={snd.id} value={snd.id}>
                      {snd.icon} {snd.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Action Buttons to Activate on Canvas */}
            <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-emerald-900/60">
              <button
                type="button"
                onClick={() => {
                  if (selectedParticlePattern === 'balloons_party') {
                    launchRisingBalloons();
                  }
                  spawnCanvasParticleBurst(selectedParticlePattern, 0.5, 0.45, 1.15);
                  playBoardSound(selectedPairedSound);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] hover:from-[#0f452c] hover:to-[#145a3a] text-white text-xs font-black shadow-lg border border-[#c59b27] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#dfbd69]" />
                <span>🚀 تفعيل وإطلاق الجزيئات على الـ Canvas الآن</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCompleteQuranPassageCelebration(selectedParticlePattern)
                  }
                  className="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#14281d] text-[11px] font-black cursor-pointer"
                >
                  📖 احتفال إتمام تسميع
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleStudentWinCelebration(selectedParticlePattern)
                  }
                  className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black cursor-pointer"
                >
                  🏆 احتفال فوز الطالب
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Official Smart Board Bottom Bar */}
      <div className="mt-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0b1f16] via-[#145a3a] to-[#0b1f16] border border-[#c59b27]/50 text-white flex flex-wrap items-center justify-between gap-2 text-xs shadow-md">
        <button
          type="button"
          onClick={() => setIsDeveloperModalOpen(true)}
          className="font-bold text-amber-200 hover:text-amber-100 underline decoration-amber-400/50 text-right cursor-pointer transition"
        >
          {ACADEMY_BRAND_CONFIG.printAndBoardFooterText}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDeveloperModalOpen(true)}
            className="px-2.5 py-1 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-200 text-[11px] font-bold cursor-pointer transition"
          >
            تواصل مع الإدارة / المطور
          </button>
          <a
            href={ACADEMY_BRAND_CONFIG.whatsappDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition"
          >
            واتساب مباشر
          </a>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useRef, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { getEveryAyahAudioUrl, RECITERS, SURAHS } from '../data/quranData';
import {
  ARABIC_LETTERS_MAKHARIJ,
  ArabicLetterMakhrajProfile,
  MAKHARIJ_GUIDE,
  SIFAT_AL_HURUF_GUIDE,
  TAJWEED_INTERACTIVE_QUIZ,
  TAJWEED_RULES_GUIDE,
  TAJWEED_STANDARD_COLORS,
} from '../data/smartSuiteData';
import { ReciterId } from '../types';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  HelpCircle,
  Layers,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface MakharijTajweedViewProps {
  embeddedInBoard?: boolean;
  onJumpToSmartBoardAyah?: (surahId: number, ayahNumber: number) => void;
}

type AtlasSectionTab =
  | 'makharij_atlas'
  | 'tajweed_rules'
  | 'sifat_huruf'
  | 'interactive_quiz';

export const MakharijTajweedView: React.FC<MakharijTajweedViewProps> = ({
  embeddedInBoard = false,
  onJumpToSmartBoardAyah,
}) => {
  const { setActiveTab, showToast } = useAcademy();

  const [activeSection, setActiveSection] =
    useState<AtlasSectionTab>('makharij_atlas');
  const [selectedMakhrajFilter, setSelectedMakhrajFilter] = useState<
    'all' | 'jawf' | 'halq' | 'lisan' | 'shafatan' | 'khayshoom'
  >('all');
  const [selectedLetter, setSelectedLetter] =
    useState<ArabicLetterMakhrajProfile>(ARABIC_LETTERS_MAKHARIJ[14]); // 'ض' by default
  const [activeMajorMakhrajId, setActiveMajorMakhrajId] =
    useState<string>('lisan');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRuleCategory, setSelectedRuleCategory] =
    useState<string>('all');
  const [reciter, setReciter] = useState<ReciterId>('Husary_128kbps');
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Interactive Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const filteredLetters = useMemo(() => {
    return ARABIC_LETTERS_MAKHARIJ.filter((item) => {
      if (
        selectedMakhrajFilter !== 'all' &&
        item.mainMakhrajId !== selectedMakhrajFilter &&
        !(
          selectedMakhrajFilter === 'khayshoom' &&
          (item.letter === 'ن' || item.letter === 'م')
        ) &&
        !(
          selectedMakhrajFilter === 'jawf' &&
          (item.letter === 'و' || item.letter === 'ي' || item.letter === 'ء')
        )
      ) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim();
      return (
        item.letter.includes(q) ||
        item.name.includes(q) ||
        item.laqab.includes(q) ||
        item.exactSubMakhraj.includes(q) ||
        item.sifat.some((s) => s.includes(q))
      );
    });
  }, [selectedMakhrajFilter, searchQuery]);

  const activeMajorMakhraj = useMemo(() => {
    return (
      MAKHARIJ_GUIDE.find((m) => m.id === activeMajorMakhrajId) ||
      MAKHARIJ_GUIDE[2]
    );
  }, [activeMajorMakhrajId]);

  const filteredTajweedCategories = useMemo(() => {
    return TAJWEED_RULES_GUIDE.filter((cat) => {
      if (selectedRuleCategory !== 'all' && cat.id !== selectedRuleCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim();
      return (
        cat.title.includes(q) ||
        cat.rules.some(
          (r) =>
            r.name.includes(q) ||
            r.letters.includes(q) ||
            r.explanation.includes(q) ||
            r.example.includes(q)
        )
      );
    });
  }, [selectedRuleCategory, searchQuery]);

  const playQuranicExampleAudio = (
    surahId: number,
    ayahNumber: number,
    keyId: string
  ) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playingAudioKey === keyId) {
      setPlayingAudioKey(null);
      return;
    }

    const url = getEveryAyahAudioUrl(reciter, surahId, ayahNumber);
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudioKey(keyId);

    audio.onended = () => setPlayingAudioKey(null);
    audio.onerror = () => {
      setPlayingAudioKey(null);
      showToast('تعذر تشغيل التلاوة الصوتية؛ تحقق من الاتصال بالإنترنت', 'error');
    };
    audio.play().catch(() => setPlayingAudioKey(null));
  };

  const speakArticulationDrill = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ar-SA';
      utter.rate = 0.75;
      window.speechSynthesis.speak(utter);
    } else {
      showToast(`تدريب المخرج: ${text}`, 'info');
    }
  };

  const quizScore = useMemo(() => {
    let correct = 0;
    TAJWEED_INTERACTIVE_QUIZ.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  }, [quizAnswers]);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner (Shown when standalone view, compact when embedded in SmartBoard) */}
      {!embeddedInBoard && (
        <div className="rounded-3xl bg-gradient-to-l from-[#145a3a] via-[#114d31] to-[#0c3823] text-white p-6 md:p-7 shadow-md border border-[#c59b27]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#c59b27]/40 text-xs font-extrabold text-[#dfbd69]">
              <Compass className="w-3.5 h-3.5" />
              <span>أطلس الإتقان الصوتي والتشريحي — رواية حفص عن عاصم</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold font-quran tracking-wide">
              موسوعة مخارج الحروف وصفاتها وأحكام التجويد التفاعلية
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed">
              خريطة تشريحية تفاعلية للمخارج الخمسة الرئيسية والـ ١٧ فرعاً، مع بطاقة تفصيلية لكل حرف من حروف الهجاء الـ ٢٨، صفات الحروف، أمثلة قرآنية مسموعة بصوت كبار القراء، واختبار تجويدي تفاعلي.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-black/25 border border-white/15 text-xs">
              <div className="text-[10px] text-[#dfbd69] font-bold">
                القارئ المعتمد للأمثلة الصوتية:
              </div>
              <select
                value={reciter}
                onChange={(e) => setReciter(e.target.value as ReciterId)}
                className="bg-transparent text-white font-extrabold text-xs focus:outline-none cursor-pointer mt-0.5"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id} className="text-black">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('smartboard')}
              className="px-4 py-3 rounded-2xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>التطبيق على سبورة الإمام الذكية</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs + Quick Search Bar */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-4 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              {
                id: 'makharij_atlas',
                label: '١. أطلس مخارج الحروف الـ ٢٨ (تشريحي)',
                icon: Compass,
              },
              {
                id: 'tajweed_rules',
                label: '٢. أحكام التجويد والمدود الملونة',
                icon: BookOpen,
              },
              {
                id: 'sifat_huruf',
                label: '٣. صفات الحروف (المتضادة وغير المتضادة)',
                icon: Layers,
              },
              {
                id: 'interactive_quiz',
                label: '٤. اختبار التجويد والمخارج التفاعلي',
                icon: HelpCircle,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#145a3a] text-white shadow-xs'
                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-700 dark:text-neutral-300 hover:border-[#c59b27] border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#dfbd69]' : 'text-[#145a3a] dark:text-[#dfbd69]'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بحرف (ض، ق، ع) أو حكم (إقلاب، قلقلة، مد لازم)..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#145a3a]"
          />
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE MAKHARIJ AL-HURUF ATLAS (أطلس مخارج الحروف الـ ٢٨) */}
      {activeSection === 'makharij_atlas' && (
        <div className="space-y-6">
          {/* 5 Major Makharij Filter Strip */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  المخارج العامة الخمسة ومواضع الحروف الـ ٢٨
                </h2>
                <p className="text-xs text-neutral-500">
                  اختر المخرج العام أو انقر على أي حرف من الحروف الهجائية لعرض نقطة ارتكازه التشريحية وصفاته وتدريب النطق
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: 'جميع الحروف (٢٨ حرفاً)' },
                    { id: 'jawf', label: '١. الجوف (حروف المد)' },
                    { id: 'halq', label: '٢. الحلق (٦ حروف)' },
                    { id: 'lisan', label: '٣. اللسان (١٨ حرفاً)' },
                    { id: 'shafatan', label: '٤. الشفتان (٤ حروف)' },
                    { id: 'khayshoom', label: '٥. الخيشوم (الغنة)' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedMakhrajFilter(f.id);
                      if (f.id !== 'all') {
                        setActiveMajorMakhrajId(f.id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      selectedMakhrajFilter === f.id
                        ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27]'
                        : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 28 Arabic Letters Interactive Buttons Grid */}
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-1">
              {filteredLetters.map((item) => {
                const isSelected = selectedLetter.letter === item.letter;
                const isMufakham =
                  item.tafkheemStatus === 'مفخم دائماً (استعلاء)';
                return (
                  <button
                    key={item.letter}
                    type="button"
                    onClick={() => {
                      setSelectedLetter(item);
                      setActiveMajorMakhrajId(item.mainMakhrajId);
                    }}
                    className={`group relative py-2.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-md scale-105'
                        : isMufakham
                        ? 'bg-blue-50/70 dark:bg-blue-950/25 border-blue-200 dark:border-blue-900/60 hover:border-[#c59b27]'
                        : 'bg-[#fcfaf2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60 hover:border-[#145a3a]'
                    }`}
                  >
                    <span className="font-quran text-2xl font-bold leading-none">
                      {item.letter}
                    </span>
                    <span
                      className={`text-[10px] font-bold mt-1 ${
                        isSelected
                          ? 'text-[#dfbd69]'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {item.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Split: Interactive Anatomical Vocal Tract SVG + Detailed Letter & Major Makhraj Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left/Right 5 Cols: Anatomical Vocal Tract Cross-Section SVG with Exact Pinpoint Marker */}
            <div className="lg:col-span-5 rounded-3xl bg-[#fcfaf2] dark:bg-[#0f1f17] p-5 border-2 border-[#c59b27]/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    المقطع التشريحي لجهاز النطق ومخارج الحروف
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    النقطة الذهبية النابضة توضح المخرج الدقيق لحرف ({selectedLetter.name})
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#145a3a] text-[#dfbd69] font-quran text-lg font-bold">
                  حرف ({selectedLetter.letter})
                </span>
              </div>

              <div className="flex justify-center bg-white dark:bg-[#12231a] rounded-2xl p-4 border border-[#c59b27]/30">
                <svg viewBox="0 0 260 260" className="w-64 h-64">
                  {/* Head / Profile Silhouette */}
                  <path
                    d="M70,25 C155,15 215,58 215,130 C215,192 182,238 132,248 L92,248 L92,205 L52,190 L38,148 L58,118 L48,78 Z"
                    fill="#f7f3e6"
                    stroke="#145a3a"
                    strokeWidth="2.5"
                  />

                  {/* Hard & Soft Palate Arch (الحنك الأعلى) */}
                  <path
                    d="M65,125 Q115,105 152,135"
                    fill="none"
                    stroke="#b45309"
                    strokeWidth="3"
                    strokeDasharray="3 2"
                  />

                  {/* Upper & Lower Teeth (الثنايا العليا والسفلى) */}
                  <rect
                    x="62"
                    y="128"
                    width="7"
                    height="10"
                    rx="2"
                    fill="#ffffff"
                    stroke="#64748b"
                  />
                  <rect
                    x="62"
                    y="148"
                    width="7"
                    height="10"
                    rx="2"
                    fill="#ffffff"
                    stroke="#64748b"
                  />

                  {/* 5. الخيشوم (Nasal Cavity) */}
                  <g
                    onClick={() => setActiveMajorMakhrajId('khayshoom')}
                    className="cursor-pointer"
                  >
                    <ellipse
                      cx="105"
                      cy="90"
                      rx="35"
                      ry="14"
                      fill={
                        activeMajorMakhrajId === 'khayshoom'
                          ? '#16a34a'
                          : '#dcfce7'
                      }
                      stroke="#15803d"
                      strokeWidth="1.5"
                    />
                    <text
                      x="105"
                      y="94"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fill={
                        activeMajorMakhrajId === 'khayshoom'
                          ? '#ffffff'
                          : '#14532d'
                      }
                    >
                      ٥. الخيشوم (الغنة)
                    </text>
                  </g>

                  {/* 4. الشفتان (Lips) */}
                  <g
                    onClick={() => setActiveMajorMakhrajId('shafatan')}
                    className="cursor-pointer"
                  >
                    <circle
                      cx="50"
                      cy="144"
                      r="16"
                      fill={
                        activeMajorMakhrajId === 'shafatan'
                          ? '#2563eb'
                          : '#dbeafe'
                      }
                      stroke="#1d4ed8"
                      strokeWidth="1.5"
                    />
                    <text
                      x="50"
                      y="147"
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="bold"
                      fill={
                        activeMajorMakhrajId === 'shafatan'
                          ? '#ffffff'
                          : '#1e3a8a'
                      }
                    >
                      ٤. الشفتان
                    </text>
                  </g>

                  {/* 3. اللسان (Tongue: Tip, Blade, Center, Back) */}
                  <g
                    onClick={() => setActiveMajorMakhrajId('lisan')}
                    className="cursor-pointer"
                  >
                    <ellipse
                      cx="112"
                      cy="144"
                      rx="38"
                      ry="17"
                      fill={
                        activeMajorMakhrajId === 'lisan'
                          ? '#145a3a'
                          : '#fef3c7'
                      }
                      stroke="#c59b27"
                      strokeWidth="2"
                    />
                    <text
                      x="112"
                      y="148"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={
                        activeMajorMakhrajId === 'lisan' ? '#ffffff' : '#14281d'
                      }
                    >
                      ٣. اللسان (١٨ حرفاً)
                    </text>
                  </g>

                  {/* 1. الجوف (Oral/Pharyngeal Cavity) */}
                  <g
                    onClick={() => setActiveMajorMakhrajId('jawf')}
                    className="cursor-pointer"
                  >
                    <rect
                      x="138"
                      y="106"
                      width="56"
                      height="20"
                      rx="9"
                      fill={
                        activeMajorMakhrajId === 'jawf' ? '#ea580c' : '#ffedd5'
                      }
                      stroke="#c2410c"
                      strokeWidth="1.5"
                    />
                    <text
                      x="166"
                      y="119"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="bold"
                      fill={
                        activeMajorMakhrajId === 'jawf' ? '#ffffff' : '#7c2d12'
                      }
                    >
                      ١. الجوف (المد)
                    </text>
                  </g>

                  {/* 2. الحلق (Throat: Adna, Wasat, Aqsa) */}
                  <g
                    onClick={() => setActiveMajorMakhrajId('halq')}
                    className="cursor-pointer"
                  >
                    <rect
                      x="140"
                      y="168"
                      width="46"
                      height="62"
                      rx="12"
                      fill={
                        activeMajorMakhrajId === 'halq' ? '#dc2626' : '#fee2e2'
                      }
                      stroke="#991b1b"
                      strokeWidth="1.5"
                    />
                    <text
                      x="163"
                      y="196"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={
                        activeMajorMakhrajId === 'halq' ? '#ffffff' : '#7f1d1d'
                      }
                    >
                      ٢. الحلق
                    </text>
                    <text
                      x="163"
                      y="210"
                      textAnchor="middle"
                      fontSize="7.5"
                      fill={
                        activeMajorMakhrajId === 'halq' ? '#fef2f2' : '#991b1b'
                      }
                    >
                      (أدنى•وسط•أقصى)
                    </text>
                  </g>

                  {/* Exact Active Letter Articulation Point Pinpoint Marker */}
                  <g>
                    <circle
                      cx={selectedLetter.svgX}
                      cy={selectedLetter.svgY}
                      r="13"
                      fill="#c59b27"
                      fillOpacity="0.35"
                    />
                    <circle
                      cx={selectedLetter.svgX}
                      cy={selectedLetter.svgY}
                      r="8"
                      fill="#c59b27"
                      stroke="#14281d"
                      strokeWidth="2"
                    />
                    <text
                      x={selectedLetter.svgX}
                      y={selectedLetter.svgY + 3.5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#14281d"
                    >
                      {selectedLetter.letter}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Active Major Makhraj Summary Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    {activeMajorMakhraj.title}
                  </span>
                  <span className="text-[11px] font-bold text-[#c59b27]">
                    {activeMajorMakhraj.subtitle}
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {activeMajorMakhraj.description}
                </p>
              </div>
            </div>

            {/* Right/Left 7 Cols: Detailed Selected Arabic Letter Profile & Articulation Trainer */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#145a3a]/30 dark:border-[#c59b27]/40 shadow-xs space-y-5">
                {/* Letter Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#145a3a] text-[#dfbd69] border-2 border-[#c59b27] flex items-center justify-center font-quran text-4xl font-bold shadow-sm">
                      {selectedLetter.letter}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold text-[#14281d] dark:text-white">
                          حرف {selectedLetter.name} ({selectedLetter.letter})
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#c59b27]/20 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold">
                          {selectedLetter.laqab}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            selectedLetter.tafkheemStatus.includes('مفخم')
                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
                              : selectedLetter.tafkheemStatus.includes('يدور')
                              ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200'
                              : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                          }`}
                        >
                          {selectedLetter.tafkheemStatus}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        <strong>المخرج العام:</strong> {selectedLetter.mainMakhrajTitle}
                      </p>
                    </div>
                  </div>

                  {/* Articulation Test Drill Button */}
                  <button
                    type="button"
                    onClick={() =>
                      speakArticulationDrill(selectedLetter.articulationTest)
                    }
                    className="px-4 py-2.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] hover:bg-[#c59b27]/20 border border-[#c59b27] text-xs font-extrabold text-[#14281d] dark:text-[#dfbd69] flex items-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-[#c59b27]" />
                    <span>تدريب اختبار المخرج:</span>
                    <span className="font-quran text-base font-bold text-[#145a3a] dark:text-white">
                      ({selectedLetter.articulationTest})
                    </span>
                  </button>
                </div>

                {/* Exact Sub-Makhraj & How to Pronounce */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 space-y-1.5">
                    <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      📍 نقطة الارتكاز والمخرج الدقيق:
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed font-semibold">
                      {selectedLetter.exactSubMakhraj}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 space-y-1.5">
                    <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      🎙️ آلية النطق الصحيح وتحقيق الصفة:
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed">
                      {selectedLetter.howToPronounce}
                    </p>
                  </div>
                </div>

                {/* Sifat Al-Harf Pills */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    صفات حرف ({selectedLetter.name}) اللازمة:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLetter.sifat.map((sifah) => (
                      <span
                        key={sifah}
                        className="px-3.5 py-1.5 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 text-xs font-extrabold text-[#14281d] dark:text-[#dfbd69]"
                      >
                        ✦ {sifah}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Common Mistake vs Practical Correction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-red-50/90 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-1">
                    <div className="font-extrabold text-red-800 dark:text-red-300">
                      ⚠️ الخطأ الشائع في التلاوة:
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {selectedLetter.commonMistake}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                    <div className="font-extrabold text-emerald-800 dark:text-emerald-300">
                      ✓ الشاهد القرآني والتطبيق الصوتي:
                    </div>
                    <div className="font-quran text-xl text-[#14281d] dark:text-white py-1">
                      {selectedLetter.exampleWord}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          playQuranicExampleAudio(
                            selectedLetter.exampleSurahId,
                            selectedLetter.exampleAyah,
                            `letter-${selectedLetter.letter}`
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-[#dfbd69]" />
                        <span>
                          {playingAudioKey === `letter-${selectedLetter.letter}`
                            ? 'جارٍ الاستماع للآية...'
                            : 'استماع للآية بصوت الشيخ'}
                        </span>
                      </button>

                      {onJumpToSmartBoardAyah && (
                        <button
                          type="button"
                          onClick={() =>
                            onJumpToSmartBoardAyah(
                              selectedLetter.exampleSurahId,
                              selectedLetter.exampleAyah
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] text-[11px] font-extrabold cursor-pointer"
                        >
                          فتح الآية على السبورة
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: TAJWEED RULES & COLOR ENCYCLOPEDIA (موسوعة أحكام التجويد والمدود الملونة) */}
      {activeSection === 'tajweed_rules' && (
        <div className="space-y-6">
          {/* Standard Tajweed Color Code Bar */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                دليل ألوان التجويد القياسية المعتمد في السبورة الذكية
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedRuleCategory('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    selectedRuleCategory === 'all'
                      ? 'bg-[#145a3a] text-white'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
                  }`}
                >
                  جميع الأبواب ({TAJWEED_RULES_GUIDE.length})
                </button>
                {TAJWEED_RULES_GUIDE.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedRuleCategory(cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                      selectedRuleCategory === cat.id
                        ? 'bg-[#145a3a] text-white'
                        : 'bg-[#f6f7f2] dark:bg-[#0b1711]'
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {TAJWEED_STANDARD_COLORS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs"
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 mt-0.5 shadow-xs"
                    style={{ backgroundColor: preset.color }}
                  />
                  <div>
                    <div className="font-extrabold text-[#14281d] dark:text-white">
                      {preset.name} — {preset.shortLabel}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                      {preset.meaning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Tajweed Rule Categories */}
          <div className="space-y-5">
            {filteredTajweedCategories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-3xl bg-white dark:bg-[#12231a] p-5 md:p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4"
              >
                <div className="border-b border-neutral-100 dark:border-emerald-950 pb-3">
                  <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    {cat.title}
                  </h3>
                  {cat.subtitle && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {cat.subtitle}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cat.rules.map((rule) => {
                    const audioKey = `rule-${cat.id}-${rule.name}`;
                    const canPlay =
                      rule.surahId !== undefined &&
                      rule.ayahNumber !== undefined;
                    const surahName =
                      SURAHS.find((s) => s.id === rule.surahId)?.name || '';

                    return (
                      <div
                        key={rule.name}
                        className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-neutral-200/80 dark:border-emerald-900/50 hover:border-[#c59b27] transition-all space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: rule.color }}
                              />
                              <h4
                                className="text-sm font-extrabold"
                                style={{ color: rule.color }}
                              >
                                {rule.name}
                              </h4>
                            </div>
                            {rule.durationHarakat && (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#c59b27]/20 text-[#14281d] dark:text-[#dfbd69] text-[11px] font-extrabold">
                                ⏱ {rule.durationHarakat}
                              </span>
                            )}
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-[#c59b27]/30 font-quran text-lg text-[#145a3a] dark:text-[#dfbd69] text-center">
                            {rule.example}
                          </div>

                          <div className="text-xs text-neutral-700 dark:text-neutral-300">
                            <strong className="text-[#14281d] dark:text-white">
                              حروفه وضابطه:
                            </strong>{' '}
                            {rule.letters}
                          </div>

                          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {rule.explanation}
                          </p>
                        </div>

                        {canPlay && (
                          <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-emerald-950">
                            <span className="text-[11px] text-neutral-500 font-bold">
                              الشاهد: سورة {surahName} (آية {rule.ayahNumber})
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                playQuranicExampleAudio(
                                  rule.surahId!,
                                  rule.ayahNumber!,
                                  audioKey
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-[#dfbd69]" />
                              <span>
                                {playingAudioKey === audioKey
                                  ? 'جارٍ التلاوة...'
                                  : 'سماع تطبيق الحكم'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: SIFAT AL-HURUF (صفات الحروف المتضادة وغير المتضادة) */}
      {activeSection === 'sifat_huruf' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SIFAT_AL_HURUF_GUIDE.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#c59b27]/20 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-extrabold">
                  {item.groupTitle}
                </span>
                {item.oppositeName && (
                  <span className="text-[11px] font-bold text-neutral-500">
                    {item.oppositeName}
                  </span>
                )}
              </div>

              <h3 className="text-base font-extrabold text-[#145a3a] dark:text-white">
                {item.name}
              </h3>

              <div className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 text-xs font-extrabold text-[#14281d] dark:text-[#dfbd69]">
                حروفها: {item.letters}
              </div>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {item.meaning}
              </p>

              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200">
                <strong>💡 الأثر العملي في التلاوة:</strong> {item.practicalEffect}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 4: INTERACTIVE TAJWEED & MAKHARIJ QUIZ (اختبار التجويد والمخارج التفاعلي) */}
      {activeSection === 'interactive_quiz' && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
            <div>
              <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#c59b27]" />
                <span>اختبار سبر الإتقان في مخارج الحروف وأحكام التجويد</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                اختبر الطالب شفهياً أو تفاعلياً في دقائق أثناء الحصة لتثبيت القواعد النظرية والعملية
              </p>
            </div>

            <div className="flex items-center gap-2">
              {quizSubmitted && (
                <span className="px-4 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
                  النتيجة: {quizScore} من {TAJWEED_INTERACTIVE_QUIZ.length} (
                  {Math.round(
                    (quizScore / TAJWEED_INTERACTIVE_QUIZ.length) * 100
                  )}
                  %)
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                }}
                className="px-3 py-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة الاختبار</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {TAJWEED_INTERACTIVE_QUIZ.map((q, qIdx) => {
              const chosen = quizAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs md:text-sm font-extrabold text-[#14281d] dark:text-white">
                      {qIdx + 1}. {q.question}
                    </div>
                    <span className="font-quran text-base text-[#145a3a] dark:text-[#dfbd69] px-3 py-0.5 rounded-xl bg-white dark:bg-[#12231a] border border-[#c59b27]/40">
                      {q.verseExample}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = chosen === optIdx;
                      const isCorrect = q.correctIndex === optIdx;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            if (quizSubmitted) return;
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [q.id]: optIdx,
                            }));
                          }}
                          className={`p-3 rounded-xl border text-right text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            quizSubmitted
                              ? isCorrect
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-extrabold'
                                : isChosen
                                ? 'bg-red-100 dark:bg-red-950/70 border-red-500 text-red-900 dark:text-red-200'
                                : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/40 opacity-75'
                              : isChosen
                              ? 'bg-[#145a3a] text-white border-[#145a3a]'
                              : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 hover:border-[#c59b27]'
                          }`}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-[#c59b27]/40 text-xs text-neutral-700 dark:text-neutral-300">
                      <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                        التعليل التجويدي:
                      </strong>{' '}
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setQuizSubmitted(true);
                showToast(
                  `تم تصحيح اختبار التجويد والمخارج: النتيجة ${quizScore} من ${TAJWEED_INTERACTIVE_QUIZ.length}`,
                  'success'
                );
              }}
              className="px-6 py-3 rounded-2xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
            >
              اعتماد الإجابات وعرض الشرح التجويدي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

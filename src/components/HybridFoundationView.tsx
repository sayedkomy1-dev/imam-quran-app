import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  HYBRID_FOUNDATION_LEVELS,
  HybridFoundationWord,
  OFFICIAL_ACADEMY_WHATSAPP_URL,
  SPEECH_DEFECT_REMEDIES,
} from '../data/hybridFoundationData';
import { formatGregorianAndHijri } from '../utils/dateUtils';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  Layers,
  Phone,
  Play,
  Printer,
  Sparkles,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';

export const HybridFoundationView: React.FC = () => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    settings,
    setActiveTab,
    promoteStudentFoundationLevel,
    addStudentXp,
    showToast,
  } = useAcademy();

  const activeStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );

  const [selectedLevelNum, setSelectedLevelNum] = useState<number>(
    activeStudent?.foundationLevel || 1
  );
  const [activeSubView, setActiveSubView] = useState<
    'curriculum' | 'syllable_lab' | 'speech_remedy'
  >('curriculum');

  const currentLevel = useMemo(
    () =>
      HYBRID_FOUNDATION_LEVELS.find((l) => l.level === selectedLevelNum) ||
      HYBRID_FOUNDATION_LEVELS[0],
    [selectedLevelNum]
  );

  const [selectedWord, setSelectedWord] = useState<HybridFoundationWord>(
    currentLevel.words[0]
  );
  const [activeTahajjiStepIndex, setActiveTahajjiStepIndex] = useState<number>(-1);
  const [maddMeterLength, setMaddMeterLength] = useState<2 | 4 | 6>(2);

  // Stage Mastery Exam Modal State
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false);

  const speakArabicText = (text: string, rate = 0.8) => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ar-SA';
        utter.rate = rate;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // ignore if speech synthesis is unavailable
    }

    // Also play a gentle pleasant Web Audio chime so there is always audible feedback
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // ignore audio errors
    }
  };

  const handleSelectLevel = (lvl: number) => {
    setSelectedLevelNum(lvl);
    const found =
      HYBRID_FOUNDATION_LEVELS.find((l) => l.level === lvl) ||
      HYBRID_FOUNDATION_LEVELS[0];
    setSelectedWord(found.words[0]);
    setActiveTahajjiStepIndex(-1);
  };

  const handlePlayAllTahajjiSteps = (word: HybridFoundationWord) => {
    setSelectedWord(word);
    word.tahajjiSteps.forEach((stepText, idx) => {
      setTimeout(() => {
        setActiveTahajjiStepIndex(idx);
        speakArabicText(stepText, 0.78);
      }, idx * 1400);
    });
  };

  const examScore = useMemo(() => {
    const questions = currentLevel.examQuestions;
    if (questions.length === 0) return 100;
    let correct = 0;
    questions.forEach((q) => {
      if (examAnswers[q.id] === q.correctIndex) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  }, [currentLevel, examAnswers]);

  const handleOpenStageExam = () => {
    setExamAnswers({});
    setExamSubmitted(false);
    setExamModalOpen(true);
  };

  const handleSubmitStageExam = () => {
    setExamSubmitted(true);
    if (examScore >= 65 && activeStudent) {
      promoteStudentFoundationLevel(
        activeStudent.id,
        currentLevel.level,
        examScore
      );
      showToast(
        `🎉 مبارك! اجتاز ${activeStudent.name} اختبار المستوى (${currentLevel.level}) بنجاح وتمت ترقيته (+100 نقطة همة)`,
        'success'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner: منهج الإمام للتأسيس */}
      <div className="rounded-3xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white p-6 border border-[#c59b27]/40 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-[#c59b27]/40 text-xs font-extrabold text-[#dfbd69]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                منظومة الإمام الهجينة للتأسيس القرائي والتجويدي (8 مستويات تفاعلية)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              منهج الإمام للتأسيس — (نور البيان + النورانية + البغدادية + التلقين البصري)
            </h1>
            <p className="text-xs md:text-sm text-emerald-100 max-w-3xl leading-relaxed">
              تأهيل المبتدئين والأطفال والأعاجم للقراءة القرآنية المتقنة عبر التفكيك المقطعي الصوتي الملون، مختبر علاج اللثغات، وامتحانات اجتياز المراحل التأسيسية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="bg-white/10 border border-white/20 rounded-2xl px-3.5 py-2">
              <label className="block text-[10px] text-[#dfbd69] font-bold">
                الطالب المتدرب حالياً:
              </label>
              <select
                value={activeStudent?.id || ''}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  const st = students.find((s) => s.id === e.target.value);
                  if (st?.foundationLevel) {
                    handleSelectLevel(st.foundationLevel);
                  }
                }}
                className="bg-transparent text-white text-xs font-extrabold focus:outline-none cursor-pointer"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id} className="text-[#14281d]">
                    {st.name} (المستوى التأسيسي {st.foundationLevel || 1}/8)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('smartboard')}
              className="px-4 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>فتح بطاقات التأسيس على السبورة الذكية</span>
            </button>

            <a
              href={OFFICIAL_ACADEMY_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>واتساب الأكاديمية</span>
            </a>
          </div>
        </div>

        {/* Student Foundation Progress Strip */}
        {activeStudent && (
          <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-[#dfbd69]">
                مسار إتقان الطالب ({activeStudent.name}):
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/15 font-mono font-bold">
                المستوى الحالي: {activeStudent.foundationLevel || 1} من 8
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/25 font-mono font-bold">
                المستويات المجتازة:{' '}
                {(activeStudent.completedFoundationLevels || []).length} / 8
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#c59b27]/30 text-[#dfbd69] font-mono font-extrabold">
                🌟 نقاط الهمة: {activeStudent.xpPoints || 0} XP
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenStageExam}
              className="px-4 py-2 rounded-xl bg-white text-[#145a3a] font-extrabold text-xs hover:bg-[#fcfaf2] flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#c59b27]" />
              <span>اختبار انتقال للمستوى التالي (المستوى {currentLevel.level})</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            id: 'curriculum',
            label: '١. المسار التأسيسي المتدرج (8 مستويات)',
            icon: Layers,
          },
          {
            id: 'syllable_lab',
            label: '٢. بطاقات التهجي التفكيكي الذكي والمقاطع الصوتية',
            icon: BookOpen,
          },
          {
            id: 'speech_remedy',
            label: '٣. مختبر مخارج الحروف وعلاج اللثغات وأخطاء النطق',
            icon: Compass,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubView(tab.id as typeof activeSubView)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer ${
                active
                  ? 'bg-[#145a3a] text-white border-[#145a3a] shadow-xs'
                  : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 text-neutral-700 dark:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4 text-[#dfbd69]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 8-Level Horizontal Selector Bar */}
      {activeSubView !== 'speech_remedy' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {HYBRID_FOUNDATION_LEVELS.map((lvl) => {
            const isSelected = selectedLevelNum === lvl.level;
            const isCompleted = (
              activeStudent?.completedFoundationLevels || []
            ).includes(lvl.level);
            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => handleSelectLevel(lvl.level)}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#145a3a] text-white border-[#c59b27] ring-2 ring-[#c59b27]/40 shadow-md'
                    : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 hover:border-[#145a3a]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-extrabold mb-1">
                  <span
                    className={
                      isSelected ? 'text-[#dfbd69]' : 'text-neutral-400'
                    }
                  >
                    مستوى {lvl.level}
                  </span>
                  {isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <div className="text-xs font-extrabold leading-snug line-clamp-2">
                  {lvl.shortTitle}
                </div>
                <div
                  className={`text-[10px] mt-1 truncate ${
                    isSelected ? 'text-emerald-100' : 'text-neutral-400'
                  }`}
                >
                  {lvl.methodologyTag.split('+')[0]}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW 1 & 2: Curriculum Level Details + Interactive Syllable Breakdown Cards */}
      {activeSubView !== 'speech_remedy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Right 5 Cols: Level Rules, Visual Comparisons & Madd/Haraka Meter */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="px-3 py-1 rounded-xl text-white text-xs font-extrabold"
                  style={{ backgroundColor: currentLevel.badgeColor }}
                >
                  {currentLevel.methodologyTag}
                </span>
                <span className="text-xs font-mono font-bold text-neutral-400">
                  المستوى {currentLevel.level} / 8
                </span>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  {currentLevel.title}
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                  {currentLevel.subtitle}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-2">
                <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  🎯 الهدف التأسيسي والمهاري:
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {currentLevel.objective}
                </p>
              </div>

              {/* Key Rules Checklist */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-neutral-500">
                  القواعد الضابطة في هذا المستوى:
                </div>
                {currentLevel.keyRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>

              {/* Visual Pairs Comparison (الحروف المتشابهة رسماً ونطقاً / المقارنات البصرية) */}
              {currentLevel.visualPairs && (
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-emerald-950">
                  <div className="text-xs font-extrabold text-[#c59b27]">
                    🔍 الميزان البصري والصوتي للمتشابهات والضوابط:
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {currentLevel.visualPairs.map((vp, i) => (
                      <div
                        key={i}
                        onClick={() => speakArabicText(vp.items.join(' ، '), 0.75)}
                        className="p-3 rounded-2xl border border-neutral-200 dark:border-emerald-900/60 hover:border-[#c59b27] cursor-pointer transition-all bg-white dark:bg-[#0b1711]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                            {vp.groupTitle}
                          </span>
                          <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> انقر للنطق
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 my-1.5">
                          {vp.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-xl bg-[#145a3a]/10 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] font-quran text-lg font-bold"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-neutral-500">{vp.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Madd & Haraka Duration Meter (ميزان زمن الحركة ومؤشر طول المد 2 / 4 / 6) */}
              <div className="p-4 rounded-2xl bg-[#145a3a]/5 dark:bg-[#0b1711] border border-[#145a3a]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    ⏱️ مؤشر ميزان المدود والحركات البصري:
                  </span>
                  <div className="flex gap-1">
                    {([2, 4, 6] as const).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setMaddMeterLength(h)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-extrabold cursor-pointer ${
                          maddMeterLength === h
                            ? 'bg-[#145a3a] text-white'
                            : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900'
                        }`}
                      >
                        {h} حركات
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const activeBeat = idx < maddMeterLength;
                    return (
                      <div
                        key={idx}
                        className={`h-4 flex-1 rounded-lg transition-all ${
                          activeBeat
                            ? maddMeterLength === 2
                              ? 'bg-emerald-600'
                              : maddMeterLength === 4
                              ? 'bg-amber-500'
                              : 'bg-red-600'
                            : 'bg-neutral-200 dark:bg-emerald-950'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  {maddMeterLength === 2 &&
                    'حركتان (مد طبيعي / مد بدل / مد عوض / مد صلة صغرى)'}
                  {maddMeterLength === 4 &&
                    '4 حركات (مد واجب متصل / مد جائز منفصل بالتوسط)'}
                  {maddMeterLength === 6 &&
                    '6 حركات (مد لازم كلمي أو حرفي مثقل ومخفف — لزوم المد المشبع)'}
                </div>
              </div>
            </div>
          </div>

          {/* Left 7 Cols: Interactive Syllable Breakdown Cards (بطاقات التهجي التفكيكي الذكي) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
                <div>
                  <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#c59b27]" />
                    <span>
                      بطاقات التهجي التفكيكي الذكي (Syllable Breakdown Cards)
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500">
                    انقر على أي كلمة تدريبية لتفكيكها بصرياً إلى مقاطع صوتية ملونة والاستماع لخطوات التهجي
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeStudent) {
                      addStudentXp(
                        activeStudent.id,
                        15,
                        `إتقان تهجي كلمة (${selectedWord.word})`
                      );
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer"
                >
                  🌟 منح الطالب +15 XP لإتقان الكلمة
                </button>
              </div>

              {/* Word Selector Grid for Current Level */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentLevel.words.map((w) => {
                  const isSelected = selectedWord.id === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setSelectedWord(w);
                        setActiveTahajjiStepIndex(-1);
                        speakArabicText(w.word, 0.8);
                      }}
                      className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-md scale-[1.02]'
                          : 'bg-[#fcfaf2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50 hover:border-[#c59b27]'
                      }`}
                    >
                      <div className="font-quran text-3xl font-bold mb-1">
                        {w.word}
                      </div>
                      <div
                        className={`text-[11px] font-bold truncate ${
                          isSelected ? 'text-[#dfbd69]' : 'text-neutral-500'
                        }`}
                      >
                        {w.meaningOrContext}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Word Syllable Breakdown Stage */}
              <div className="p-6 rounded-3xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-[#c59b27]/60 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#c59b27] block">
                      الكلمة القرآنية المختارة للتفكيك المقطعي:
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-quran text-5xl font-bold text-[#145a3a] dark:text-[#dfbd69]">
                        {selectedWord.word}
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold">
                        {selectedWord.meaningOrContext}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakArabicText(selectedWord.word, 0.75)}
                      className="px-3.5 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 text-[#dfbd69]" />
                      <span>نطق الكلمة كاملة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlayAllTahajjiSteps(selectedWord)}
                      className="px-3.5 py-2 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>تشغيل التهجي خطوة بخطوة</span>
                    </button>
                  </div>
                </div>

                {/* Colored Phonetic Syllables (المقاطع الصوتية الملونة) */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-neutral-600 dark:text-neutral-300">
                    ١. التفكيك البصري إلى مقاطع صوتية (حرف متحرك لوحده • ساكن مع ما قبله • مد مع الممدود):
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 py-4 px-3 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50">
                    {selectedWord.syllables.map((syl, idx) => (
                      <React.Fragment key={idx}>
                        <button
                          type="button"
                          onClick={() => speakArabicText(syl.text, 0.7)}
                          className="group p-4 rounded-2xl border-2 text-center transition-transform hover:scale-105 cursor-pointer min-w-[110px]"
                          style={{
                            borderColor: syl.color,
                            backgroundColor: `${syl.color}14`,
                          }}
                        >
                          <div
                            className="font-quran text-4xl font-bold mb-1.5"
                            style={{ color: syl.color }}
                          >
                            {syl.text}
                          </div>
                          <div
                            className="text-[11px] font-extrabold px-2 py-0.5 rounded-full text-white inline-block"
                            style={{ backgroundColor: syl.color }}
                          >
                            {syl.ruleLabel}
                          </div>
                        </button>
                        {idx < selectedWord.syllables.length - 1 && (
                          <span className="text-xl font-extrabold text-neutral-300 dark:text-neutral-600">
                            +
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Step-by-Step Nooraniyyah / Noor Al-Bayan Spelling */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-neutral-600 dark:text-neutral-300">
                    ٢. خطوات التهجي الصوتي المتدرج (انقر على أي خطوة للاستماع وتلقين الطالب):
                  </div>
                  <div className="space-y-2">
                    {selectedWord.tahajjiSteps.map((step, idx) => {
                      const isStepActive = activeTahajjiStepIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveTahajjiStepIndex(idx);
                            speakArabicText(step, 0.78);
                          }}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isStepActive
                              ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-sm'
                              : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 hover:border-[#145a3a]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-full text-xs font-mono font-extrabold flex items-center justify-center ${
                                isStepActive
                                  ? 'bg-[#c59b27] text-[#14281d]'
                                  : 'bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69]'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold">{step}</span>
                          </div>
                          <Volume2
                            className={`w-4 h-4 shrink-0 ${
                              isStepActive ? 'text-[#dfbd69]' : 'text-neutral-400'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Speech Defect & Articulation Remedy Lab (مختبر مخارج الحروف وعلاج اللثغات) */}
      {activeSubView === 'speech_remedy' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
              <div>
                <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#c59b27]" />
                  <span>
                    مختبر مخارج الحروف التفاعلي ودليل المعلم لعلاج اللثغات وأخطاء النطق
                  </span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  توجيهات عملية للمعلم لتصحيح مخارج الحروف الخمسة وعلاج اللثغات الشائعة عند الأطفال والأعاجم
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('tajweed')}
                className="px-4 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer shrink-0"
              >
                فتح أطلس مخارج الحروف الخمسة المفصل ←
              </button>
            </div>

            {/* 5 Major Makharij Visual Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                {
                  name: '١. الجوف',
                  letters: 'حروف المد الثلاثة (ا، و، ي)',
                  color: '#059669',
                },
                {
                  name: '٢. الحلق',
                  letters: 'ء هـ / ع ح / غ خ',
                  color: '#0284c7',
                },
                {
                  name: '٣. اللسان',
                  letters: '١٨ حرفاً في ١٠ مخارج',
                  color: '#7c3aed',
                },
                {
                  name: '٤. الشفتان',
                  letters: 'ف / ب م و (غير مدية)',
                  color: '#d97706',
                },
                {
                  name: '٥. الخيشوم',
                  letters: 'مركب الغنة في النون والميم',
                  color: '#dc2626',
                },
              ].map((m) => (
                <div
                  key={m.name}
                  className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 text-center space-y-1"
                >
                  <div
                    className="text-sm font-extrabold"
                    style={{ color: m.color }}
                  >
                    {m.name}
                  </div>
                  <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {m.letters}
                  </div>
                </div>
              ))}
            </div>

            {/* Practical Speech Therapy Remedies Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SPEECH_DEFECT_REMEDIES.map((rem) => (
                <div
                  key={rem.id}
                  className="p-5 rounded-3xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
                      الحروف: {rem.targetLetters}
                    </span>
                    <span className="text-[11px] font-bold text-neutral-500">
                      المخرج: {rem.makhrajRegion}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#14281d] dark:text-white">
                    {rem.title}
                  </h3>
                  <div className="p-3 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-800 dark:text-red-300">
                    <strong>الخطأ الشائع عند الطالب:</strong> {rem.commonError}
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    <strong>💡 خطة المعلم العلاجية:</strong>{' '}
                    {rem.practicalRemedy}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-neutral-500">
                      كلمات التدريب الصوتي:
                    </span>
                    {rem.drillWords.map((dw) => (
                      <button
                        key={dw}
                        type="button"
                        onClick={() => speakArabicText(dw, 0.75)}
                        className="px-3 py-1 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 font-quran text-base font-bold text-[#145a3a] dark:text-[#dfbd69] hover:border-[#c59b27] cursor-pointer flex items-center gap-1"
                      >
                        <span>{dw}</span>
                        <Volume2 className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Stage Mastery Exam (اختبار انتقال للمستوى التالي) */}
      {examModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-emerald-900">
              <div>
                <span className="text-xs font-bold text-[#c59b27] block">
                  امتحان اجتياز المرحلة التأسيسية — {activeStudent?.name}
                </span>
                <h3 className="text-base font-extrabold text-[#145a3a] dark:text-white">
                  اختبار {currentLevel.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExamModalOpen(false)}
                className="p-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {currentLevel.examQuestions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold">
                      س{qIdx + 1}: {q.prompt}
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-[#145a3a] text-[#dfbd69] font-quran text-xl font-bold">
                      {q.word}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const chosen = examAnswers[q.id] === optIdx;
                      const isCorrect = q.correctIndex === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={examSubmitted}
                          onClick={() =>
                            setExamAnswers((prev) => ({
                              ...prev,
                              [q.id]: optIdx,
                            }))
                          }
                          className={`p-2.5 rounded-xl text-xs font-bold border text-right cursor-pointer transition-all ${
                            examSubmitted
                              ? isCorrect
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : chosen
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-white dark:bg-[#12231a] opacity-60'
                              : chosen
                              ? 'bg-[#145a3a] text-white border-[#c59b27]'
                              : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {examSubmitted && (
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      💡 التوضيح: {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!examSubmitted ? (
              <button
                type="button"
                onClick={handleSubmitStageExam}
                className="w-full py-3 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
              >
                اعتماد الإجابات وإصدار النتيجة والشهادة التأسيسية
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                    نتيجة الاختبار: {examScore}% —{' '}
                    {examScore >= 65
                      ? 'اجتاز المرحلة بنجاح وتمت الترقية للمستوى التالي 🎉'
                      : 'يحتاج لمراجعة البطاقات وإعادة المحاولة'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExamModalOpen(false);
                      setCertificatePreviewOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>طباعة شهادة اجتياز مرحلة تأسيسية</span>
                  </button>
                  {selectedLevelNum < 8 && (
                    <button
                      type="button"
                      onClick={() => {
                        setExamModalOpen(false);
                        handleSelectLevel(selectedLevelNum + 1);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
                    >
                      الانتقال للمستوى {selectedLevelNum + 1} ←
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Foundation Stage Certificate Modal */}
      {certificatePreviewOpen && activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white text-[#14281d] p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 no-print">
              <span className="text-xs font-extrabold text-[#145a3a]">
                شهادة اجتياز مرحلة تأسيسية — منهج الإمام للتأسيس
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة / حفظ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCertificatePreviewOpen(false)}
                  className="p-2 rounded-xl border border-neutral-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="border-8 border-double border-[#c59b27] rounded-2xl p-8 bg-[#fcfaf2] text-center space-y-4">
              <div className="text-xs font-extrabold text-[#145a3a]">
                {settings.academyName} — {settings.tagline}
              </div>
              <h2 className="font-quran text-3xl font-bold text-[#145a3a]">
                شهادة اجتياز مرحلة تأسيسية في منهج الإمام الهجين
              </h2>
              <p className="text-sm text-neutral-700">
                تشهد إدارة الأكاديمية بأن البطل/ـة القارئ المتقن:
              </p>
              <div className="font-quran text-3xl font-bold text-[#c59b27] py-2 border-y border-[#c59b27]/40 max-w-md mx-auto">
                {activeStudent.name}
              </div>
              <p className="text-sm font-bold text-neutral-800 max-w-xl mx-auto leading-relaxed">
                قد أتم واجتاز بنجاح <strong>({currentLevel.title})</strong> ضمن منظومة الإمام الهجينة للتأسيس القرائي والتجويدي بتقدير ممتاز ({examScore}%)، وتأهل للمرحلة التالية.
              </p>
              <div className="pt-6 border-t border-[#c59b27]/40 flex items-center justify-between text-xs font-bold text-neutral-600">
                <span>المعلم المشرف: {settings.teacherName}</span>
                <span>
                  التاريخ:{' '}
                  {formatGregorianAndHijri(
                    new Date().toISOString().slice(0, 10),
                    settings.showHijriDates ?? true
                  )}
                </span>
                <span>واتساب الأكاديمية: 201068631966</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

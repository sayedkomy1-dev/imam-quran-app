import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  SMART_QUIZ_CATEGORY_LABELS,
  generateSmartQuizQuestions,
} from '../data/smartQuizEngineData';
import { getLocalDateString } from '../data/seedData';
import {
  GradeType,
  PeerCompetitionPack,
  SmartQuizQuestion,
  SmartQuizQuestionCategory,
  StudentLevel,
} from '../types';
import {
  Award,
  CheckCircle2,
  Clock,
  Crown,
  Dices,
  Flame,
  HelpCircle,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { GamificationDashboard } from './GamificationDashboard';

interface SmartQuizAndCompetitionsSectionProps {
  mode: 'teacher' | 'student';
  activeStudentId?: string;
}

export const SmartQuizAndCompetitionsSection: React.FC<
  SmartQuizAndCompetitionsSectionProps
> = ({ mode, activeStudentId }) => {
  const {
    students,
    settings,
    saveExam,
    peerCompetitions,
    createPeerCompetitionPack,
    submitPeerCompetitionResult,
    deletePeerCompetitionPack,
    showToast,
  } = useAcademy();

  const [subView, setSubView] = useState<'ai_quiz_generator' | 'competitions_leaderboard'>(
    mode === 'student' ? 'competitions_leaderboard' : 'ai_quiz_generator'
  );

  // ================= 1. AI QURANIC QUIZ GENERATOR STATE =================
  const [quizStudentId, setQuizStudentId] = useState<string>(
    activeStudentId || students[0]?.id || ''
  );
  const [quizScope, setQuizScope] = useState<
    'juz30' | 'juz29' | 'juz28' | 'student_memorized' | 'all'
  >('juz30');
  const [selectedCategories, setSelectedCategories] = useState<
    SmartQuizQuestionCategory[]
  >([
    'complete_ayah',
    'identify_surah',
    'continue_after_ayah',
    'tajweed_and_madd',
  ]);
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [quizQuestions, setQuizQuestions] = useState<SmartQuizQuestion[]>(() =>
    generateSmartQuizQuestions({
      scope: 'juz30',
      categories: [
        'complete_ayah',
        'identify_surah',
        'continue_after_ayah',
        'tajweed_and_madd',
      ],
      count: 4,
      student: students[0],
    })
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [writtenContinuations, setWrittenContinuations] = useState<
    Record<string, string>
  >({});
  const [revealedQuestions, setRevealedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const selectedStudent = useMemo(
    () =>
      students.find((s) => s.id === (activeStudentId || quizStudentId)) ||
      students[0],
    [students, activeStudentId, quizStudentId]
  );

  const handleToggleCategory = (cat: SmartQuizQuestionCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev; // Keep at least 1 category
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const handleGenerateNewQuiz = () => {
    const generated = generateSmartQuizQuestions({
      scope: quizScope,
      categories: selectedCategories,
      count: questionCount,
      student: selectedStudent,
    });
    setQuizQuestions(generated);
    setSelectedAnswers({});
    setWrittenContinuations({});
    setRevealedQuestions({});
    setQuizSubmitted(false);
    showToast(
      `🧠 تم توليد اختبار قرآني ذكي (${generated.length} أسئلة) يشمل الأنواع المحددة بنجاح`,
      'info'
    );
  };

  const quizScoreStats = useMemo(() => {
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        correct += 1;
      }
    });
    const total = Math.max(1, quizQuestions.length);
    const percentage = Math.round((correct / total) * 100);
    return { correct, total, percentage };
  }, [quizQuestions, selectedAnswers]);

  const handleSaveQuizToStudentExams = () => {
    if (!selectedStudent) return;
    const score = quizScoreStats.percentage;
    const grade: GradeType =
      score >= 90
        ? 'ممتاز'
        : score >= 80
        ? 'جيد جداً'
        : score >= 70
        ? 'جيد'
        : 'إعادة';

    const scopeNames: Record<typeof quizScope, string> = {
      juz30: 'اختبار ذكي في جزء عمّ والتجويد',
      juz29: 'اختبار ذكي في جزءي تبارك وعمّ',
      juz28: 'اختبار ذكي في الأجزاء (28 - 30)',
      student_memorized: 'اختبار ذكي في محفوظات الطالب',
      all: 'اختبار قرآني وتجويدي شامل',
    };

    saveExam({
      studentId: selectedStudent.id,
      date: getLocalDateString(0),
      type: 'اختبار جزء',
      targetTitle: scopeNames[quizScope],
      committee: [settings.teacherName, 'محرك الاختبارات الذكية الآلي (AI Quiz)'],
      score,
      grade,
      passed: score >= 75,
      notes: `أجاب الطالب بشكل صحيح على (${quizScoreStats.correct} من ${quizScoreStats.total}) في محاور: إكمال الآية، تحديد السورة، إكمال الآيات التالية، وأحكام التجويد والمدود.`,
      certificateIssued: score >= 75,
    });
    setQuizSubmitted(true);
  };

  // ================= 2. PEER-TO-PEER COMPETITIONS & LIVE LEADERBOARD STATE =================
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(
    peerCompetitions[0]?.id || ''
  );
  const [levelFilter, setLevelFilter] = useState<StudentLevel | 'الكل'>('الكل');
  const [createPackModalOpen, setCreatePackModalOpen] = useState(false);

  // Create Competition Pack Form
  const [newPackTitle, setNewPackTitle] = useState(
    '🏆 مسابقة فرسان الإتقان والبديهة القرآنية'
  );
  const [newPackDesc, setNewPackDesc] = useState(
    'تحدٍ جماعي لقياس سرعة استحضار الآيات، تمييز السور، واستخراج أحكام التجويد والمدود.'
  );
  const [newPackLevel, setNewPackLevel] = useState<StudentLevel | 'الكل'>('الكل');
  const [newPackScope, setNewPackScope] = useState<
    'juz30' | 'juz29' | 'juz28' | 'all'
  >('juz30');
  const [newPackTimeLimit, setNewPackTimeLimit] = useState(90);
  const [newPackBadge, setNewPackBadge] = useState('🏆 كأس فرسان الإتقان');

  // Live Interactive Challenge Runner Modal State
  const [activeChallengePack, setActiveChallengePack] =
    useState<PeerCompetitionPack | null>(null);
  const [challengerStudentId, setChallengerStudentId] = useState<string>(
    activeStudentId || students[0]?.id || ''
  );
  const [challengeQuestionIndex, setChallengeQuestionIndex] = useState(0);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<string, number>>(
    {}
  );
  const [challengeElapsedSeconds, setChallengeElapsedSeconds] = useState(0);
  const [challengeFinishedResult, setChallengeFinishedResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeSeconds: number;
    awardedCup?: string;
  } | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeChallengePack && !challengeFinishedResult) {
      timerIntervalRef.current = window.setInterval(() => {
        setChallengeElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeChallengePack, challengeFinishedResult]);

  const startLiveChallenge = (pack: PeerCompetitionPack, stId?: string) => {
    const targetStId = stId || activeStudentId || challengerStudentId || students[0]?.id || '';
    setChallengerStudentId(targetStId);
    setActiveChallengePack(pack);
    setChallengeQuestionIndex(0);
    setChallengeAnswers({});
    setChallengeElapsedSeconds(1);
    setChallengeFinishedResult(null);
  };

  const handleFinishLiveChallenge = () => {
    if (!activeChallengePack) return;
    let correct = 0;
    activeChallengePack.questions.forEach((q) => {
      if (challengeAnswers[q.id] === q.correctOptionIndex) {
        correct += 1;
      }
    });
    const total = activeChallengePack.questions.length;
    const sub = submitPeerCompetitionResult({
      competitionId: activeChallengePack.id,
      studentId: challengerStudentId,
      correctCount: correct,
      totalQuestions: total,
      timeSeconds: challengeElapsedSeconds,
    });
    setChallengeFinishedResult({
      score: Math.round((correct / Math.max(1, total)) * 100),
      correctCount: correct,
      totalQuestions: total,
      timeSeconds: challengeElapsedSeconds,
      awardedCup: sub?.awardedCup || '🎖️ وسام التميز',
    });
  };

  const handleCreateNewCompetitionPack = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = generateSmartQuizQuestions({
      scope: newPackScope,
      categories: [
        'complete_ayah',
        'identify_surah',
        'continue_after_ayah',
        'tajweed_and_madd',
      ],
      count: 4,
    });
    const scopeLabels: Record<typeof newPackScope, string> = {
      juz30: 'جزء عمّ (الثلاثون) + التجويد',
      juz29: 'جزء تبارك وعمّ (29 - 30)',
      juz28: 'الأجزاء (28 - 30)',
      all: 'القرآن الكريم كاملاً والتجويد',
    };
    const created = createPeerCompetitionPack({
      title: newPackTitle,
      description: newPackDesc,
      targetLevel: newPackLevel,
      scopeLabel: scopeLabels[newPackScope],
      questions: qs,
      timeLimitSeconds: newPackTimeLimit,
      xpRewardFirst: 150,
      xpRewardParticipant: 60,
      badgeTitle: newPackBadge,
    });
    setSelectedCompetitionId(created.id);
    setCreatePackModalOpen(false);
  };

  // Global & Per-Competition Live Leaderboard
  const filteredCompetitions = useMemo(() => {
    if (levelFilter === 'الكل') return peerCompetitions;
    return peerCompetitions.filter(
      (c) => c.targetLevel === 'الكل' || c.targetLevel === levelFilter
    );
  }, [peerCompetitions, levelFilter]);

  const activeCompetition = useMemo(
    () =>
      filteredCompetitions.find((c) => c.id === selectedCompetitionId) ||
      filteredCompetitions[0] ||
      peerCompetitions[0],
    [filteredCompetitions, selectedCompetitionId, peerCompetitions]
  );

  // Aggregate Academy-wide Honor Roll Leaderboard combining accuracy, speed, XP, and cups
  const globalHonorLeaderboard = useMemo(() => {
    const map = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        circleName: string;
        level: StudentLevel;
        bestScore: number;
        fastestSeconds: number;
        totalPoints: number;
        cups: string[];
        badges: string[];
        xpPoints: number;
      }
    >();

    students.forEach((st) => {
      if (levelFilter !== 'الكل' && st.level !== levelFilter) return;
      map.set(st.id, {
        studentId: st.id,
        studentName: st.name,
        circleName: st.circle,
        level: st.level,
        bestScore: 0,
        fastestSeconds: 999,
        totalPoints: (st.xpPoints || 120),
        cups: [],
        badges: st.badges || [],
        xpPoints: st.xpPoints || 120,
      });
    });

    peerCompetitions.forEach((comp) => {
      comp.submissions.forEach((sub) => {
        if (levelFilter !== 'الكل' && sub.level !== levelFilter) return;
        const entry = map.get(sub.studentId);
        if (entry) {
          entry.bestScore = Math.max(entry.bestScore, sub.score);
          entry.fastestSeconds = Math.min(entry.fastestSeconds, sub.timeSeconds);
          entry.totalPoints += sub.compositeRankPoints;
          if (sub.awardedCup && !entry.cups.includes(sub.awardedCup)) {
            entry.cups.push(sub.awardedCup);
          }
        }
      });
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.bestScore - a.bestScore ||
        a.fastestSeconds - b.fastestSeconds
    );
  }, [students, peerCompetitions, levelFilter]);

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Switcher between AI Quiz Generator & Peer Competitions */}
      <div className="rounded-3xl bg-gradient-to-l from-[#145a3a] via-[#0f452c] to-[#0b2e1e] text-white p-5 border-2 border-[#c59b27]/60 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-[#dfbd69]/40 text-xs font-extrabold text-[#dfbd69]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>محرك الاختبارات الذكية الآلية ومسابقات التنافس الحية</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            توليد الاختبارات القرآنية التفاعلية (٤ محاور) ولوحة الشرف للمسابقات التنافسية
          </h3>
          <p className="text-xs text-emerald-100/90">
            إكمال الآيات • معرفة السورة • سرد الآيات التالية • استخراج أحكام التجويد والمدود • مع كؤوس وأوسمة تظهر فوراً في ملف الطالب
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSubView('ai_quiz_generator')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subView === 'ai_quiz_generator'
                ? 'bg-[#c59b27] text-[#14281d] shadow-md'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>🧠 مولد الاختبارات الذكية (٤ أنواع)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('competitions_leaderboard')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subView === 'competitions_leaderboard'
                ? 'bg-[#c59b27] text-[#14281d] shadow-md'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 المسابقات التنافسية ولوحة الشرف ({peerCompetitions.length})</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: AI QURANIC QUIZ GENERATOR ================= */}
      {subView === 'ai_quiz_generator' && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/60 shadow-xs space-y-5">
          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#f6f7f2] dark:bg-[#0b1711] p-4 rounded-2xl border border-[#c59b27]/40">
            {mode === 'teacher' && (
              <div className="md:col-span-3">
                <label className="block text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] mb-1">
                  الطالب المختبَر:
                </label>
                <select
                  value={quizStudentId}
                  onChange={(e) => setQuizStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#12231a] text-xs font-bold"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.level})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={mode === 'teacher' ? 'md:col-span-4' : 'md:col-span-5'}>
              <label className="block text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] mb-1">
                نطاق الاختبار القرآني:
              </label>
              <select
                value={quizScope}
                onChange={(e) =>
                  setQuizScope(
                    e.target.value as
                      | 'juz30'
                      | 'juz29'
                      | 'juz28'
                      | 'student_memorized'
                      | 'all'
                  )
                }
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#12231a] text-xs font-bold"
              >
                <option value="juz30">جزء عمّ (الجزء الثلاثون)</option>
                <option value="juz29">جزء تبارك وعمّ (29 - 30)</option>
                <option value="juz28">الأجزاء الثلاثة الأخيرة (قد سمع - تبارك - عمّ)</option>
                <option value="student_memorized">السور المحفوظة في ملف الطالب فقط</option>
                <option value="all">شامل (القرآن الكريم وأحكام التجويد)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] mb-1">
                عدد الأسئلة:
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#12231a] text-xs font-bold"
              >
                <option value={4}>4 أسئلة شاملة</option>
                <option value={6}>6 أسئلة متدرجة</option>
                <option value={8}>8 أسئلة مكثفة</option>
              </select>
            </div>

            <div className={mode === 'teacher' ? 'md:col-span-3' : 'md:col-span-5'}>
              <button
                type="button"
                onClick={handleGenerateNewQuiz}
                className="w-full py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
              >
                <RefreshCw className="w-4 h-4 text-[#dfbd69]" />
                <span>توليد اختبار ذكي جديد الآن ⚡</span>
              </button>
            </div>
          </div>

          {/* 4 Question Categories Toggle Chips */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-neutral-600 dark:text-neutral-300">
              أنواع الأسئلة المضمنة في المولد الذكي (اضغط لتفعيل أو تخصيص الأنواع):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(
                Object.keys(
                  SMART_QUIZ_CATEGORY_LABELS
                ) as SmartQuizQuestionCategory[]
              ).map((catKey) => {
                const active = selectedCategories.includes(catKey);
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleToggleCategory(catKey)}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-[#145a3a]/10 dark:bg-emerald-950/60 border-[#145a3a] dark:border-[#c59b27] text-[#14281d] dark:text-white font-extrabold'
                        : 'bg-neutral-50 dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-950 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs">{SMART_QUIZ_CATEGORY_LABELS[catKey]}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                        active
                          ? 'bg-[#145a3a] text-[#dfbd69]'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {active ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {quizQuestions.map((q, idx) => {
              const chosenIdx = selectedAnswers[q.id];
              const isAnswered = chosenIdx !== undefined;
              const isCorrect = chosenIdx === q.correctOptionIndex;
              const isRevealed = revealedQuestions[q.id] || quizSubmitted;

              const badgeColors: Record<SmartQuizQuestionCategory, string> = {
                complete_ayah:
                  'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-400/50',
                identify_surah:
                  'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-400/50',
                continue_after_ayah:
                  'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border-purple-400/50',
                tajweed_and_madd:
                  'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-200 border-sky-400/50',
              };

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-3xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-neutral-200/90 dark:border-emerald-900/60 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    {/* Question Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`px-3 py-1 rounded-xl border text-xs font-extrabold ${badgeColors[q.category]}`}
                      >
                        سؤال {idx + 1}: {q.categoryLabel}
                      </span>
                      <span className="text-xs font-bold text-neutral-500 font-mono">
                        الجزء {q.juz} • {q.points} درجة
                      </span>
                    </div>

                    {/* Quranic Verse Snippet */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/40 text-center">
                      <p className="font-quran text-xl sm:text-2xl text-[#14281d] dark:text-[#e9f2ec] leading-loose">
                        {q.verseSnippet}
                      </p>
                    </div>

                    {/* Question Prompt */}
                    <p className="text-xs sm:text-sm font-extrabold text-[#14281d] dark:text-white">
                      {q.questionPrompt}
                    </p>

                    {/* Optional Written Continuation Box for "continue_after_ayah" or "complete_ayah" */}
                    {(q.category === 'continue_after_ayah' ||
                      q.category === 'complete_ayah') && (
                      <div>
                        <input
                          type="text"
                          value={writtenContinuations[q.id] || ''}
                          onChange={(e) =>
                            setWrittenContinuations((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          placeholder="✍️ اكتب تكملة الآيات هنا للتدرب الكتابي أو اختر الإجابة الصحيحة أدناه..."
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#12231a] text-xs font-quran"
                        />
                      </div>
                    )}

                    {/* Interactive Multiple Choice Options */}
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isThisSelected = chosenIdx === optIdx;
                        const isThisCorrect = optIdx === q.correctOptionIndex;

                        let btnStyle =
                          'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/60 hover:border-[#145a3a]';
                        if (isAnswered) {
                          if (isThisCorrect) {
                            btnStyle =
                              'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-xs';
                          } else if (isThisSelected && !isThisCorrect) {
                            btnStyle =
                              'bg-rose-600 text-white border-rose-600 font-extrabold';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [q.id]: optIdx,
                              }))
                            }
                            className={`w-full text-right p-3 rounded-xl border text-xs sm:text-sm transition cursor-pointer flex items-center justify-between gap-2 ${btnStyle}`}
                          >
                            <span className="font-quran leading-relaxed">{opt}</span>
                            {isAnswered && isThisCorrect && (
                              <span className="text-xs font-extrabold shrink-0">
                                ✓ صحيح
                              </span>
                            )}
                            {isAnswered && isThisSelected && !isThisCorrect && (
                              <span className="text-xs font-extrabold shrink-0">
                                ✗ خطأ
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Model Answer & Tajweed Explanation Footer */}
                  <div className="pt-3 border-t border-neutral-200/80 dark:border-emerald-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedQuestions((prev) => ({
                            ...prev,
                            [q.id]: !prev[q.id],
                          }))
                        }
                        className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] underline cursor-pointer flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>
                          {isRevealed
                            ? 'إخفاء الإجابة النموذجية والتجويد'
                            : 'عرض الإجابة النموذجية وشرح التجويد'}
                        </span>
                      </button>

                      {isAnswered && (
                        <span
                          className={`text-xs font-extrabold ${
                            isCorrect ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isCorrect ? `+${q.points} درجة ✓` : '0 درجة'}
                        </span>
                      )}
                    </div>

                    {(isRevealed || isAnswered) && (
                      <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1">
                        <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          📖 الإجابة النموذجية ({q.surahName} — آية {q.ayahNumber}):
                        </div>
                        <div className="font-quran text-sm text-[#14281d] dark:text-white">
                          {q.modelAnswerText}
                        </div>
                        {q.tajweedExplanation && (
                          <div className="text-[11px] text-neutral-700 dark:text-neutral-300 pt-1">
                            <strong>📜 الفائدة التجويدية:</strong> {q.tajweedExplanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quiz Summary & Save to Student Exam Record Bar */}
          <div className="p-5 rounded-2xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-[#dfbd69]/40 flex items-center justify-center text-xl font-extrabold text-[#dfbd69] font-mono">
                {quizScoreStats.percentage}%
              </div>
              <div>
                <div className="text-xs text-emerald-100">
                  نتيجة الاختبار الذكي الحالية للطالب ({selectedStudent?.name}):
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white">
                  إجابات صحيحة: {quizScoreStats.correct} من {quizScoreStats.total} — التقدير:{' '}
                  <span className="text-[#dfbd69]">
                    {quizScoreStats.percentage >= 90
                      ? 'ممتاز 🏆'
                      : quizScoreStats.percentage >= 80
                      ? 'جيد جداً 🌟'
                      : quizScoreStats.percentage >= 70
                      ? 'جيد ✓'
                      : 'يحتاج مراجعة وتثبيت'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {mode === 'teacher' && (
                <button
                  type="button"
                  onClick={handleSaveQuizToStudentExams}
                  className="px-5 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد النتيجة وإصدار شهادة في سجل الطالب</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateNewQuiz}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
              >
                توليد نموذج آخر 🎲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: PEER-TO-PEER COMPETITIONS & LIVE LEADERBOARD ================= */}
      {subView === 'competitions_leaderboard' && (
        <div className="space-y-6">
          {/* Top Bar: Filter by Level & Launch New Competition Pack (for Teacher) */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/60 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-neutral-600 dark:text-neutral-300">
                تصفية المسابقات ولوحة الشرف حسب المستوى:
              </span>
              {(['الكل', 'مبتدئ', 'متوسط', 'متقدم'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    levelFilter === lvl
                      ? 'bg-[#145a3a] text-white shadow-xs'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-emerald-900/50'
                  }`}
                >
                  {lvl === 'الكل' ? 'جميع المستويات' : `مستوى ${lvl}`}
                </button>
              ))}
            </div>

            {mode === 'teacher' && (
              <button
                type="button"
                onClick={() => setCreatePackModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>🚀 إطلاق تحدٍ وحقيبة مسابقة جماعية جديدة</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Right 7 Cols: Active Competition Packs */}
            <div className="lg:col-span-7 space-y-4">
              <h4 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2 px-1">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>الحقائب الاختبارية والتحديات الجماعية المتاحة ({filteredCompetitions.length})</span>
              </h4>

              {filteredCompetitions.map((pack) => {
                const isSelected = activeCompetition?.id === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedCompetitionId(pack.id)}
                    className={`p-5 rounded-3xl border-2 transition cursor-pointer space-y-4 ${
                      isSelected
                        ? 'bg-[#fcfaf2] dark:bg-[#0b1711] border-[#c59b27] shadow-md'
                        : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 hover:border-[#145a3a]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="text-base font-extrabold text-[#14281d] dark:text-white">
                            {pack.title}
                          </h5>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                            {pack.targetLevel === 'الكل'
                              ? 'لجميع المستويات'
                              : `خاص بمستوى: ${pack.targetLevel}`}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                          {pack.description}
                        </p>
                      </div>

                      {mode === 'teacher' && peerCompetitions.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePeerCompetitionPack(pack.id);
                          }}
                          className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 cursor-pointer"
                          title="حذف الحقيبة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Pack Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                      <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-[#145a3a] dark:text-[#dfbd69]">
                        📖 النطاق: {pack.scopeLabel}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-neutral-700 dark:text-neutral-300">
                        ⏱️ الزمن المعياري: {pack.timeLimitSeconds} ثانية ({pack.questions.length} أسئلة)
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-900 dark:text-amber-200">
                        🎁 الجائزة: {pack.badgeTitle} (+{pack.xpRewardFirst} XP)
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        👥 المشاركون: {pack.submissions.length} طالب
                      </span>
                    </div>

                    {/* Action Bar to Start Live Timed Challenge */}
                    <div className="pt-3 border-t border-neutral-200/70 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-2">
                      {mode === 'teacher' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-500">
                            بدء التحدي للطالب:
                          </span>
                          <select
                            value={challengerStudentId}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setChallengerStudentId(e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-white dark:bg-[#12231a] text-xs font-bold"
                          >
                            {students.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name} ({st.level})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          نافس زملاءك في السرعة والدقة واحصل على الكأس الذهبي!
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startLiveChallenge(
                            pack,
                            mode === 'student' ? activeStudentId : challengerStudentId
                          );
                        }}
                        className="px-4 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-[#dfbd69] text-[#dfbd69]" />
                        <span>خوض التحدي التنافسي بالعداد الزمني ⚡</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Left 5 Cols: Live Leaderboard (لوحة الشرف الحية بالسرعة والدقة والأوسمة) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl bg-gradient-to-b from-[#14281d] via-[#12231a] to-[#0b1711] text-white p-5 border-2 border-[#c59b27] shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#c59b27] text-[#14281d] flex items-center justify-center shadow-md">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold text-[#dfbd69]">
                        لوحة الشرف الحية (Live Leaderboard)
                      </h4>
                      <p className="text-[11px] text-emerald-100/80">
                        ترتيب الفائزين وفق الدقة والسرعة الزمنية وكؤوس التميز
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold animate-pulse">
                    ● مباشر
                  </span>
                </div>

                {/* Competition-Specific Top Winners */}
                {activeCompetition && activeCompetition.submissions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-extrabold text-amber-300">
                      🥇 أوائل مسابقة: ({activeCompetition.title})
                    </div>
                    {activeCompetition.submissions.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                          idx === 0
                            ? 'bg-gradient-to-l from-amber-500/25 to-emerald-950/60 border-[#dfbd69]'
                            : idx === 1
                            ? 'bg-white/10 border-white/20'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                              idx === 0
                                ? 'bg-[#c59b27] text-[#14281d]'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-900'
                                : 'bg-amber-700 text-white'
                            }`}
                          >
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              <span>{sub.studentName}</span>
                              <span className="text-[10px] text-[#dfbd69]">
                                {sub.awardedCup}
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-200/80">
                              {sub.circleName} • المستوى: {sub.level}
                            </div>
                          </div>
                        </div>

                        <div className="text-left font-mono">
                          <div className="text-xs font-extrabold text-[#dfbd69]">
                            دقة {sub.score}% • ⏱️ {sub.timeSeconds}ث
                          </div>
                          <div className="text-[10px] text-emerald-300">
                            {sub.compositeRankPoints} نقطة تنافسية
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Overall Academy Honor Roll */}
                <div className="pt-3 border-t border-white/15 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-[#dfbd69]" />
                      <span>الترتيب العام لفرسان الأكاديمية والكؤوس المحققة</span>
                    </span>
                    <span className="text-[10px] text-emerald-300">نقاط الهمة + السرعة</span>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {globalHonorLeaderboard.slice(0, 8).map((entry, idx) => (
                      <div
                        key={entry.studentId}
                        className="p-3 rounded-2xl bg-black/25 border border-white/10 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-white flex items-center gap-1.5">
                            <span className="text-[#dfbd69] font-mono">
                              {idx + 1}.
                            </span>
                            <span>{entry.studentName}</span>
                            {idx === 0 && <span>👑</span>}
                          </div>
                          <div className="text-[10px] text-emerald-200/75">
                            {entry.circleName} ({entry.level})
                          </div>
                          {(entry.cups.length > 0 || entry.badges.length > 0) && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {entry.cups.map((c, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-400/40 text-[9px] text-amber-200 font-bold"
                                >
                                  {c}
                                </span>
                              ))}
                              {entry.badges.slice(0, 2).map((b, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[9px] text-emerald-200"
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-left font-mono shrink-0">
                          <div className="text-xs font-extrabold text-[#dfbd69]">
                            ⚡ {entry.totalPoints} نقطة
                          </div>
                          {entry.fastestSeconds < 999 && (
                            <div className="text-[10px] text-emerald-300">
                              أسرع زمن: {entry.fastestSeconds}ث
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* D3 Gamification Dashboard: Rank Shifts & Earned Badges */}
          <GamificationDashboard
            mode={mode}
            student={
              activeStudentId
                ? students.find((s) => s.id === activeStudentId)
                : undefined
            }
          />
        </div>
      )}

      {/* ================= MODAL 1: LIVE TIMED CHALLENGE RUNNER ================= */}
      {activeChallengePack && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#12231a] border-3 border-[#c59b27] shadow-2xl overflow-hidden my-auto">
            {/* Top Challenge Header with Live Stopwatch */}
            <div className="p-5 bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold text-[#dfbd69] block">
                  ⚡ سباق التنافس القرآني الحي (السرعة + الدقة)
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  {activeChallengePack.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-2xl bg-black/30 border border-[#dfbd69]/50 flex items-center gap-1.5 font-mono text-sm font-black text-[#dfbd69]">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>{challengeElapsedSeconds} ثانية</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveChallengePack(null)}
                  className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {challengeFinishedResult ? (
              <div className="p-8 text-center space-y-5 bg-[#fcfaf2] dark:bg-[#0b1711]">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#c59b27] to-amber-300 text-[#14281d] flex items-center justify-center text-4xl mx-auto shadow-lg">
                  🏆
                </div>
                <div className="space-y-1">
                  <div className="inline-block px-4 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold">
                    {challengeFinishedResult.awardedCup}
                  </div>
                  <h4 className="text-2xl font-black text-[#14281d] dark:text-white pt-1">
                    مبارك! اكتمل التحدي التنافسي بنجاح
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    تم تسجيل النتيجة في لوحة الشرف الحية وإضافة الكأس والوسام إلى ملف الطالب
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900">
                    <div className="text-[11px] text-neutral-500">نسبة الدقة</div>
                    <div className="text-xl font-black text-emerald-600 font-mono">
                      {challengeFinishedResult.score}%
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900">
                    <div className="text-[11px] text-neutral-500">زمن الإنجاز</div>
                    <div className="text-xl font-black text-[#c59b27] font-mono">
                      {challengeFinishedResult.timeSeconds}ث
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900">
                    <div className="text-[11px] text-neutral-500">الإجابات الصحيحة</div>
                    <div className="text-xl font-black text-[#145a3a] dark:text-[#dfbd69] font-mono">
                      {challengeFinishedResult.correctCount}/{challengeFinishedResult.totalQuestions}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveChallengePack(null)}
                  className="px-8 py-3 rounded-2xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer shadow-md"
                >
                  العودة إلى لوحة الشرف الحية ✓
                </button>
              </div>
            ) : (
              (() => {
                const currentQ =
                  activeChallengePack.questions[challengeQuestionIndex] ||
                  activeChallengePack.questions[0];
                const totalQs = activeChallengePack.questions.length;
                const chosen = challengeAnswers[currentQ.id];

                return (
                  <div className="p-6 space-y-5 bg-[#fcfaf2] dark:bg-[#0b1711]">
                    <div className="flex items-center justify-between text-xs font-extrabold text-neutral-500">
                      <span>
                        السؤال {challengeQuestionIndex + 1} من {totalQs} ({currentQ.categoryLabel})
                      </span>
                      <span>سورة {currentQ.surahName}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 text-center">
                      <p className="font-quran text-2xl text-[#14281d] dark:text-white leading-loose">
                        {currentQ.verseSnippet}
                      </p>
                    </div>

                    <p className="text-sm font-extrabold text-[#14281d] dark:text-white">
                      {currentQ.questionPrompt}
                    </p>

                    <div className="space-y-2.5">
                      {currentQ.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() =>
                            setChallengeAnswers((prev) => ({
                              ...prev,
                              [currentQ.id]: oIdx,
                            }))
                          }
                          className={`w-full text-right p-3.5 rounded-2xl border-2 text-xs sm:text-sm font-quran transition cursor-pointer ${
                            chosen === oIdx
                              ? 'bg-[#145a3a] text-white border-[#c59b27] font-bold shadow-sm'
                              : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/60 hover:border-[#145a3a]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-emerald-900">
                      <button
                        type="button"
                        disabled={challengeQuestionIndex === 0}
                        onClick={() =>
                          setChallengeQuestionIndex((i) => Math.max(0, i - 1))
                        }
                        className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        السؤال السابق
                      </button>

                      {challengeQuestionIndex < totalQs - 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setChallengeQuestionIndex((i) =>
                              Math.min(totalQs - 1, i + 1)
                            )
                          }
                          className="px-6 py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
                        >
                          السؤال التالي ←
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFinishLiveChallenge}
                          className="px-6 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black cursor-pointer shadow-md"
                        >
                          إنهاء السباق واعتماد النتيجة والوسام 🏆
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CREATE NEW COMPETITION PACK ================= */}
      {createPackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-emerald-900">
              <h3 className="text-sm sm:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                🚀 إطلاق تحدٍ وحقيبة مسابقة تنافسية جماعية
              </h3>
              <button
                type="button"
                onClick={() => setCreatePackModalOpen(false)}
                className="p-1.5 rounded-xl border border-neutral-200 dark:border-emerald-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCompetitionPack} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">عنوان المسابقة التنافسية</label>
                <input
                  type="text"
                  required
                  value={newPackTitle}
                  onChange={(e) => setNewPackTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#f6f7f2] dark:bg-[#0b1711] font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">وصف التحدي وأهدافه</label>
                <textarea
                  rows={2}
                  value={newPackDesc}
                  onChange={(e) => setNewPackDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#f6f7f2] dark:bg-[#0b1711]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">المستوى المستهدف</label>
                  <select
                    value={newPackLevel}
                    onChange={(e) =>
                      setNewPackLevel(e.target.value as StudentLevel | 'الكل')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#f6f7f2] dark:bg-[#0b1711] font-bold"
                  >
                    <option value="الكل">جميع المستويات</option>
                    <option value="مبتدئ">مستوى مبتدئ</option>
                    <option value="متوسط">مستوى متوسط</option>
                    <option value="متقدم">مستوى متقدم</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">نطاق الأسئلة الآلية</label>
                  <select
                    value={newPackScope}
                    onChange={(e) =>
                      setNewPackScope(
                        e.target.value as 'juz30' | 'juz29' | 'juz28' | 'all'
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#f6f7f2] dark:bg-[#0b1711] font-bold"
                  >
                    <option value="juz30">جزء عمّ (الثلاثون)</option>
                    <option value="juz29">جزء تبارك وعمّ (29 - 30)</option>
                    <option value="juz28">الأجزاء (28 - 30)</option>
                    <option value="all">شامل (القرآن والتجويد)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">الزمن المعياري (ثانية)</label>
                  <input
                    type="number"
                    min={30}
                    max={600}
                    value={newPackTimeLimit}
                    onChange={(e) => setNewPackTimeLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#f6f7f2] dark:bg-[#0b1711] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">اسم الكأس / الوسام الممنوح</label>
                  <input
                    type="text"
                    required
                    value={newPackBadge}
                    onChange={(e) => setNewPackBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#f6f7f2] dark:bg-[#0b1711] font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold cursor-pointer shadow-md"
              >
                إطلاق المسابقة وتوليد الأسئلة آلياً ✓
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

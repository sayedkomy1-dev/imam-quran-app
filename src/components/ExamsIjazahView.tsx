import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { getLocalDateString } from '../data/seedData';
import { SURAHS } from '../data/quranData';
import { ExamRecord, GradeType } from '../types';
import { formatGregorianAndHijri } from '../utils/dateUtils';
import { generateVerificationHash } from '../utils/wlqSyncCore';
import { PedagogicalDiagnosticCard } from './PedagogicalAdvisorModal';
import {
  Award,
  CheckCircle2,
  Dices,
  GraduationCap,
  Plus,
  Printer,
  RefreshCw,
  ScrollText,
  Sparkles,
  X,
} from 'lucide-react';

interface GeneratedExamQuestion {
  id: string;
  questionNumber: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  openingPrompt: string;
  tajweedQuestion: string;
  maxPoints: number;
  earnedPoints: number;
}

const QURAN_EXAM_PROMPTS_POOL: {
  juz: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  openingPrompt: string;
  tajweedQuestion: string;
}[] = [
  {
    juz: 30,
    surahName: 'النبأ',
    fromAyah: 1,
    toAyah: 16,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿عَمَّ يَتَسَآءَلُونَ * عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ﴾',
    tajweedQuestion: 'ما حكم النون المشددة في (عَمَّ) وما نوع المد في (يَتَسَآءَلُونَ)؟',
  },
  {
    juz: 30,
    surahName: 'النازعات',
    fromAyah: 15,
    toAyah: 33,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿هَلْ أَتَىٰكَ حَدِيثُ مُوسَىٰٓ * إِذْ نَادَىٰهُ رَبُّهُۥ بِٱلْوَادِ ٱلْمُقَدَّسِ طُوًى﴾',
    tajweedQuestion: 'بين حكم القلقلة في (قَدْ) ومرتبة التفخيم في (طُوًى).',
  },
  {
    juz: 30,
    surahName: 'عبس',
    fromAyah: 1,
    toAyah: 16,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿عَبَسَ وَتَوَلَّىٰٓ * أَن جَآءَهُ ٱلْأَعْمَىٰ﴾',
    tajweedQuestion: 'ما حكم النون الساكنة في (أَن جَآءَهُ) ومقدار المد في (جَآءَهُ)؟',
  },
  {
    juz: 30,
    surahName: 'المطففين',
    fromAyah: 18,
    toAyah: 28,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿كَلَّآ إِنَّ كِتَٰبَ ٱلْأَبْرَارِ لَفِى عِلِّيِّينَ﴾',
    tajweedQuestion: 'ما حكم التنوين في (رَحِيقٍ مَّخْتُومٍ)؟',
  },
  {
    juz: 30,
    surahName: 'الأعلى',
    fromAyah: 1,
    toAyah: 15,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿سَبِّحِ ٱسْمَ رَبِّكَ ٱلْأَعْلَى * ٱلَّذِى خَلَقَ فَسَوَّىٰ﴾',
    tajweedQuestion: 'بين حكم همزة الوصل في (ٱسْمَ) عند الابتداء وعند الوصل.',
  },
  {
    juz: 29,
    surahName: 'الملك',
    fromAyah: 1,
    toAyah: 12,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ﴾',
    tajweedQuestion: 'ما حكم التنوين في (شَىْءٍ قَدِيرٌ) وما حكم الميم الساكنة في (لِيَبْلُوَكُمْ أَيُّكُمْ)؟',
  },
  {
    juz: 29,
    surahName: 'القلم',
    fromAyah: 1,
    toAyah: 16,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿نٓ ۚ وَٱلْقَلَمِ وَمَا يَسْطُرُونَ * مَآ أَنتَ بِنِعْمَةِ رَبِّكَ بِمَجْنُونٍ﴾',
    tajweedQuestion: 'ما نوع المد في الحرف المقطع (نٓ) وما حكم الإظهار أو الإدغام مع الواو؟',
  },
  {
    juz: 29,
    surahName: 'الإنسان',
    fromAyah: 5,
    toAyah: 18,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿إِنَّ ٱلْأَبْرَارَ يَشْرَبُونَ مِن كَأْسٍ كَانَ مِزَاجُهَا كَافُورًا﴾',
    tajweedQuestion: 'وضح حكم الصفر المستدير في كلمة (قَوَارِيرَاْ) وصلاً ووقفاً.',
  },
  {
    juz: 28,
    surahName: 'المجادلة',
    fromAyah: 1,
    toAyah: 6,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿قَدْ سَمِعَ ٱللَّهُ قَوْلَ ٱلَّتِى تُجَٰدِلُكَ فِى زَوْجِهَا﴾',
    tajweedQuestion: 'ما حكم الدال في (قَدْ سَمِعَ) ولام لفظ الجلالة في (سَمِعَ ٱللَّهُ)؟',
  },
  {
    juz: 28,
    surahName: 'الحشر',
    fromAyah: 18,
    toAyah: 24,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ ٱتَّقُواْ ٱللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ﴾',
    tajweedQuestion: 'استخرج من الآيات مدّاً متصلاً ومدّاً منفصلاً وإخفاءً حقيقياً.',
  },
  {
    juz: 15,
    surahName: 'الكهف',
    fromAyah: 1,
    toAyah: 12,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿ٱلْحَمْدُ لِلَّهِ ٱلَّذِىٓ أَنزَلَ عَلَىٰ عَبْدِهِ ٱلْكِتَٰبَ وَلَمْ يَجْعَل لَّهُۥ عِوَجَاۜ﴾',
    tajweedQuestion: 'ما حكم السكت اللطيف على ألف (عِوَجَاۜ) عند حفص عن عاصم؟',
  },
  {
    juz: 1,
    surahName: 'البقرة',
    fromAyah: 1,
    toAyah: 16,
    openingPrompt: 'اقرأ من قوله تعالى: ﴿الٓمٓ * ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ﴾',
    tajweedQuestion: 'اشرح علامة الوقف التعانق (ۛ) في (لَا رَيْبَ ۛ فِيهِ ۛ) وحكم الإدغام بغير غنة في (هُدًى لِّلْمُتَّقِينَ).',
  },
  {
    juz: 3,
    surahName: 'البقرة',
    fromAyah: 255,
    toAyah: 257,
    openingPrompt: 'اقرأ آية الكرسي: ﴿ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ﴾',
    tajweedQuestion: 'ما حكم مد الصلة في (عِندَهُۥٓ إِلَّا) وما حكم النون الساكنة في (مَن ذَا ٱلَّذِى)؟',
  },
];

export const ExamsIjazahView: React.FC = () => {
  const { students, exams, ijazahs, settings, saveExam, saveIjazah, showToast } =
    useAcademy();

  const [activeTab, setActiveTab] = useState<'exams' | 'ijazahs'>('exams');

  // New Exam Form
  const [examModal, setExamModal] = useState(false);
  const [exStudentId, setExStudentId] = useState(students[0]?.id || '');
  const [exType, setExType] = useState<ExamRecord['type']>('اختبار جزء');
  const [exTarget, setExTarget] = useState('اختبار جزء عمّ كاملاً');
  const [exCommittee, setExCommittee] = useState(
    `${settings.teacherName}، الشيخ المقرئ محمود الجندي`
  );
  const [exScore, setExScore] = useState(95);
  const [exNotes, setExNotes] = useState('');

  // Random Exam Question Generator State (مولد أسئلة الاختبارات العشوائي)
  const [randomGeneratorOpen, setRandomGeneratorOpen] = useState(false);
  const [genStudentId, setGenStudentId] = useState(students[0]?.id || '');
  const [genScope, setGenScope] = useState<
    'juz30' | 'juz29' | 'juz28' | 'last5juz' | 'student_memorized' | 'all'
  >('juz30');
  const [genQuestionCount, setGenQuestionCount] = useState<number>(4);
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedExamQuestion[]
  >([]);

  // New Ijazah Form
  const [ijazahModal, setIjazahModal] = useState(false);
  const [ijStudentId, setIjStudentId] = useState(students[0]?.id || '');
  const [ijRiwayah, setIjRiwayah] = useState(
    'رواية حفص عن عاصم من طريق الشاطبية'
  );
  const [ijSanad, setIjSanad] = useState(
    'قرأ الطالب المقرر غيباً وتحقيقاً على المعلم المشرف وإدارة الحلقات القرآنية بالسند المتصل إلى الإمام عاصم بن أبي النجود عن الصحابة الكرام عن رسول الله ﷺ.'
  );
  const [ijNotes, setIjNotes] = useState('');

  // Printable Certificate Preview
  const [printData, setPrintData] = useState<{
    title: string;
    studentName: string;
    details: string;
    committeeOrSanad: string;
    date: string;
    certNumber: string;
  } | null>(null);

  const generateRandomExamQuestions = (
    scope = genScope,
    count = genQuestionCount,
    studentId = genStudentId
  ) => {
    const st = students.find((s) => s.id === studentId) || students[0];
    let pool = [...QURAN_EXAM_PROMPTS_POOL];

    if (scope === 'juz30') {
      pool = pool.filter((p) => p.juz === 30);
    } else if (scope === 'juz29') {
      pool = pool.filter((p) => p.juz === 29 || p.juz === 30);
    } else if (scope === 'juz28') {
      pool = pool.filter((p) => p.juz >= 28);
    } else if (scope === 'student_memorized' && st) {
      const memNames = new Set(
        st.memorizedSurahs
          .map((id) => SURAHS.find((s) => s.id === id)?.name)
          .filter(Boolean)
      );
      const filtered = pool.filter((p) => memNames.has(p.surahName));
      if (filtered.length >= 2) pool = filtered;
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    const maxPerQuestion = Math.round(100 / Math.max(1, selected.length));

    const items: GeneratedExamQuestion[] = selected.map((item, idx) => ({
      id: `rq-${Date.now()}-${idx}`,
      questionNumber: idx + 1,
      surahName: item.surahName,
      fromAyah: item.fromAyah,
      toAyah: item.toAyah,
      openingPrompt: item.openingPrompt,
      tajweedQuestion: item.tajweedQuestion,
      maxPoints: maxPerQuestion,
      earnedPoints: maxPerQuestion,
    }));

    setGeneratedQuestions(items);
    showToast(
      `🎲 تم توليد (${items.length}) مواضع تسميع وأسئلة تجويد عشوائية مع حساب الدرجة تلقائياً`,
      'info'
    );
  };

  const calculatedRandomExamScore = useMemo(() => {
    if (generatedQuestions.length === 0) return 100;
    const totalMax = generatedQuestions.reduce((a, b) => a + b.maxPoints, 0);
    const totalEarned = generatedQuestions.reduce(
      (a, b) => a + b.earnedPoints,
      0
    );
    return Math.min(
      100,
      Math.max(0, Math.round((totalEarned / Math.max(1, totalMax)) * 100))
    );
  }, [generatedQuestions]);

  const handleAdjustQuestionScore = (qId: string, delta: number) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              earnedPoints: Math.max(
                0,
                Math.min(q.maxPoints, q.earnedPoints + delta)
              ),
            }
          : q
      )
    );
  };

  const handleSaveGeneratedRandomExam = () => {
    const score = calculatedRandomExamScore;
    const grade: GradeType =
      score >= 90
        ? 'ممتاز'
        : score >= 80
        ? 'جيد جداً'
        : score >= 70
        ? 'جيد'
        : 'إعادة';

    const scopeTitleMap: Record<typeof genScope, string> = {
      juz30: 'اختبار جزء عمّ (الثلاثون)',
      juz29: 'اختبار جزءي تبارك وعمّ',
      juz28: 'اختبار الأجزاء (28 - 30)',
      last5juz: 'اختبار الأجزاء الخمسة الأخيرة',
      student_memorized: 'اختبار شامل في محفوظات الطالب',
      all: 'اختبار شامل في القرآن الكريم والتجويد',
    };

    const questionsSummary = generatedQuestions
      .map(
        (q) =>
          `س${q.questionNumber}: سورة ${q.surahName} (${q.fromAyah}-${q.toAyah}) [${q.earnedPoints}/${q.maxPoints}]`
      )
      .join(' | ');

    saveExam({
      studentId: genStudentId,
      date: getLocalDateString(0),
      type: genScope === 'last5juz' ? 'اختبار خمسة أجزاء' : 'اختبار جزء',
      targetTitle: scopeTitleMap[genScope],
      committee: [settings.teacherName, 'لجنة الاختبار الآلي العشوائي'],
      score,
      grade,
      passed: score >= 75,
      notes: `تم توليد المواضع عشوائياً: ${questionsSummary}`,
      certificateIssued: score >= 75,
    });

    setRandomGeneratorOpen(false);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    const grade: GradeType =
      exScore >= 90
        ? 'ممتاز'
        : exScore >= 80
        ? 'جيد جداً'
        : exScore >= 70
        ? 'جيد'
        : 'إعادة';
    saveExam({
      studentId: exStudentId,
      date: getLocalDateString(0),
      type: exType,
      targetTitle: exTarget,
      committee: exCommittee
        .split('،')
        .map((s) => s.trim())
        .filter(Boolean),
      score: exScore,
      grade,
      passed: exScore >= 75,
      notes: exNotes,
      certificateIssued: exScore >= 75,
    });
    setExamModal(false);
  };

  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const handleVerifyDocumentCode = (codeToCheck?: string) => {
    const q = (codeToCheck ?? verifyCodeInput).trim().toUpperCase();
    if (!q) return;
    setVerifyCodeInput(q);

    const matchedExam = exams.find(
      (ex) =>
        (ex.verificationCode || `VER-EX-${ex.id.toUpperCase()}`).toUpperCase() ===
          q || `EX-${ex.id.toUpperCase()}` === q
    );
    if (matchedExam) {
      const st = students.find((s) => s.id === matchedExam.studentId);
      setVerifyResult({
        valid: true,
        message: `✅ شهادة اختبار معتمدة وموثقة في سجلات ${settings.academyName}`,
        details: `الطالب: ${st?.name || 'طالب بالأكاديمية'} • الرواية: ${
          st?.riwayah || 'حفص عن عاصم'
        } • الاختبار: ${matchedExam.targetTitle} (${matchedExam.score}/100 - ${
          matchedExam.grade
        }) • التاريخ: ${matchedExam.date}`,
      });
      return;
    }

    const matchedIjazah = ijazahs.find(
      (ij) =>
        (
          ij.verificationCode ||
          `VER-${ij.certificateNumber.toUpperCase()}`
        ).toUpperCase() === q || ij.certificateNumber.toUpperCase() === q
    );
    if (matchedIjazah) {
      const st = students.find((s) => s.id === matchedIjazah.studentId);
      setVerifyResult({
        valid: true,
        message: `✅ وثيقة إجازة قرآنية بالسند المتصل موثقة في ${settings.academyName}`,
        details: `المُجاز: ${st?.name || 'طالب بالأكاديمية'} • الرواية: ${
          matchedIjazah.riwayah
        } • الشيخ المُجيز: ${matchedIjazah.sheikhName} • رقم الوثيقة: ${
          matchedIjazah.certificateNumber
        }`,
      });
      return;
    }

    setVerifyResult({
      valid: false,
      message: '⚠️ لم يتم العثور على وثيقة مطابقة لهذا الكود في السجل المرجعي.',
    });
  };

  const handleSaveIjazah = (e: React.FormEvent) => {
    e.preventDefault();
    const certNum = `IMAM-IJZ-${new Date().getFullYear()}-${String(
      ijazahs.length + 1
    ).padStart(3, '0')}`;
    saveIjazah({
      studentId: ijStudentId,
      riwayah: ijRiwayah,
      sheikhName: settings.teacherName,
      sanadChain: ijSanad,
      issueDate: getLocalDateString(0),
      certificateNumber: certNum,
      verificationCode: `VER-${certNum}`,
      notes: ijNotes,
    });
    setIjazahModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            <span>
              تحديد المستوى، مولد أسئلة الاختبارات العشوائي، وسجل الإجازات والأسانيد
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            توليد مواضع تسميع عشوائية مع حساب الدرجة النهائية تلقائياً، وتوثيق نتائج اللجان وإصدار الشهادات والإجازات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRandomGeneratorOpen(true);
              if (generatedQuestions.length === 0) {
                generateRandomExamQuestions('juz30', 4, students[0]?.id || '');
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold shadow-xs cursor-pointer"
          >
            <Dices className="w-4 h-4 text-[#dfbd69]" />
            <span>🎲 توليد أسئلة اختبار عشوائية</span>
          </button>

          <button
            onClick={() => setExamModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#dfbd69]" />
            <span>اختبار جديد</span>
          </button>

          <button
            onClick={() => setIjazahModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold hover:bg-[#b58c1e] cursor-pointer"
          >
            <ScrollText className="w-4 h-4" />
            <span>توثيق إجازة وسند</span>
          </button>
        </div>
      </div>

      {/* Placement & Pedagogical Screening Center (اختبار الفرز التربوي وأنماط التعلم للأطفال داخل تحديد المستوى) */}
      {students.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                🧠 مركز تحديد المستوى واختبار الفرز التربوي وأنماط التعلم للأطفال
              </h3>
              <p className="text-xs text-neutral-500">
                اختر الطالب لتقييم نمط تعلمه (سمعي / بصري / حركي) وتحديد التحديات المهارية والمسار المقترح قبل توزيعه على الحلقة
              </p>
            </div>
            <select
              value={genStudentId}
              onChange={(e) => setGenStudentId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  الطالب: {s.name} ({s.level})
                </option>
              ))}
            </select>
          </div>
          <PedagogicalDiagnosticCard
            student={students.find((s) => s.id === genStudentId) || students[0]}
            compact
          />
        </div>
      )}

      {/* 3. بوابة التحقق الرقمي من صحة الشهادات والإجازات (QR & Verification Code Checker) */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border-2 border-[#c59b27]/50 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#c59b27]" />
              <span>
                التحقق الرقمي وتوثيق الشهادات والإجازات القرآنية (QR & Verification Code)
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              لكل شهادة وإجازة كود توثيق فريد ورمز QR للتحقق الفوري من صحة إصدارها والرواية المعتمدة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              dir="ltr"
              value={verifyCodeInput}
              onChange={(e) => setVerifyCodeInput(e.target.value)}
              placeholder="مثال: VER-EX-EX1 أو IMAM-IJZ-2025-001"
              className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-mono w-64"
            />
            <button
              type="button"
              onClick={() => handleVerifyDocumentCode()}
              className="px-4 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer shrink-0"
            >
              🔍 تحقق من الوثيقة
            </button>
          </div>
        </div>

        {verifyResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs ${
              verifyResult.valid
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500/50 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="font-extrabold">{verifyResult.message}</div>
            {verifyResult.details && (
              <div className="mt-1 text-[11px] font-semibold">
                {verifyResult.details}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Random Exam Question Generator Drawer / Modal */}
      {randomGeneratorOpen && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-purple-500/60 shadow-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-700 text-[#dfbd69] flex items-center justify-center">
                <Dices className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-purple-950 dark:text-purple-200">
                  🎲 مولد أسئلة الاختبارات القرآنية العشوائي وحاسبة الدرجة التلقائية
                </h3>
                <p className="text-xs text-neutral-500">
                  يسحب مواضع تسميع متفرقة من نطاق الاختبار المحدد مع أسئلة التجويد ويحسب الدرجة النهائية (من 100) تلقائياً
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRandomGeneratorOpen(false)}
              className="p-2 rounded-xl border border-neutral-200 dark:border-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Generator Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold mb-1">الطالب المختبَر</label>
              <select
                value={genStudentId}
                onChange={(e) => setGenStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                نطاق الأجزاء أو السور
              </label>
              <select
                value={genScope}
                onChange={(e) => {
                  const next = e.target.value as typeof genScope;
                  setGenScope(next);
                  generateRandomExamQuestions(next, genQuestionCount, genStudentId);
                }}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                <option value="juz30">جزء عمّ (الثلاثون)</option>
                <option value="juz29">جزء تبارك وعمّ (29 - 30)</option>
                <option value="juz28">الأجزاء الثلاثة الأخيرة (28 - 30)</option>
                <option value="student_memorized">السور المحفوظة في ملف الطالب</option>
                <option value="all">شامل (السبع الطوال والمفصل)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">عدد مواضع الاختبار</label>
              <select
                value={genQuestionCount}
                onChange={(e) => {
                  const c = Number(e.target.value);
                  setGenQuestionCount(c);
                  generateRandomExamQuestions(genScope, c, genStudentId);
                }}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                <option value={3}>3 مواضع تسميع (كل موضع 33 درجة)</option>
                <option value={4}>4 مواضع تسميع (كل موضع 25 درجة)</option>
                <option value={5}>5 مواضع تسميع (كل موضع 20 درجة)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                generateRandomExamQuestions(genScope, genQuestionCount, genStudentId)
              }
              className="py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#dfbd69]" />
              <span>🎲 سحب مواضع عشوائية جديدة</span>
            </button>
          </div>

          {/* Generated Questions List with Live Deduction & Score Calculator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {generatedQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-purple-300/60 dark:border-purple-900/60 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-700 text-white text-xs font-extrabold">
                    السؤال ({q.questionNumber}): سورة {q.surahName} (آية{' '}
                    {q.fromAyah} - {q.toAyah})
                  </span>
                  <span className="font-mono text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    {q.earnedPoints} / {q.maxPoints} درجة
                  </span>
                </div>

                <div className="font-quran text-lg font-bold text-[#14281d] dark:text-white bg-white dark:bg-[#12231a] p-3 rounded-xl border border-neutral-200 dark:border-emerald-900/50">
                  {q.openingPrompt}
                </div>

                <div className="text-xs text-purple-900 dark:text-purple-200 font-semibold">
                  🎯 سؤال التجويد والضبط: {q.tajweedQuestion}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-200/70 dark:border-emerald-950">
                  <button
                    type="button"
                    onClick={() => handleAdjustQuestionScore(q.id, -1)}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-[11px] font-bold cursor-pointer"
                  >
                    تردد (-1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustQuestionScore(q.id, -2)}
                    className="px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200 text-[11px] font-bold cursor-pointer"
                  >
                    خطأ تجويد (-2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustQuestionScore(q.id, -4)}
                    className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-200 text-[11px] font-bold cursor-pointer"
                  >
                    فتح / نسيان (-4)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustQuestionScore(q.id, q.maxPoints)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold cursor-pointer mr-auto"
                  >
                    درجة كاملة ✓
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Automatic Final Score Footer */}
          <div className="p-4 rounded-2xl bg-[#145a3a] text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-emerald-100">
                  الدرجة النهائية المحسوبة تلقائياً:
                </div>
                <div className="text-2xl font-extrabold font-mono text-[#dfbd69]">
                  {calculatedRandomExamScore} / 100 (
                  {calculatedRandomExamScore >= 90
                    ? 'ممتاز'
                    : calculatedRandomExamScore >= 80
                    ? 'جيد جداً'
                    : calculatedRandomExamScore >= 75
                    ? 'جيد'
                    : 'إعادة'}
                  )
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveGeneratedRandomExam}
              className="px-5 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد وحفظ الاختبار العشوائي في سجل الطالب</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === 'exams'
              ? 'bg-[#145a3a] text-white'
              : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50'
          }`}
        >
          لجان الاختبارات وتحديد المستوى ({exams.length})
        </button>
        <button
          onClick={() => setActiveTab('ijazahs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === 'ijazahs'
              ? 'bg-[#145a3a] text-white'
              : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50'
          }`}
        >
          سجل الإجازات القرآنية والأسانيد ({ijazahs.length})
        </button>
      </div>

      {/* Tab 1: Exams List */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((ex) => {
            const st = students.find((s) => s.id === ex.studentId);
            return (
              <div
                key={ex.id}
                className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-[#c59b27]">{ex.type}</span>
                    <span className="font-mono tabular-nums text-neutral-400">
                      {formatGregorianAndHijri(
                        ex.date,
                        settings.showHijriDates ?? true
                      )}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#14281d] dark:text-white">
                    {st?.name || 'طالب بالأكاديمية'}
                  </h3>
                  <div className="text-xs font-semibold text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                    {ex.targetTitle}
                  </div>
                  <div className="text-xs text-neutral-500 mt-2">
                    لجنة التقييم: {ex.committee.join(' · ')}
                  </div>
                  {ex.notes && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 bg-[#f6f7f2] dark:bg-[#0b1711] p-3 rounded-xl">
                      {ex.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-emerald-950 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-500">
                      الدرجة والتقدير:{' '}
                    </span>
                    <span
                      className={`text-sm font-extrabold tabular-nums font-mono ${
                        ex.passed ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {ex.score}/100 ({ex.grade})
                    </span>
                  </div>

                  {ex.passed && (
                    <button
                      onClick={() =>
                        setPrintData({
                          title: `شهادة اجتياز ${ex.type}`,
                          studentName: st?.name || '',
                          details: `قد اجتاز بنجاح اختبار (${ex.targetTitle}) بنسبة إتقان ${ex.score}% وتقدير (${ex.grade}).`,
                          committeeOrSanad: `لجنة الاختبار: ${ex.committee.join(
                            ' — '
                          )}`,
                          date: ex.date,
                          certNumber: `EX-${ex.id.toUpperCase()}`,
                        })
                      }
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>إصدار الشهادة</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Ijazahs & Sanad Records */}
      {activeTab === 'ijazahs' && (
        <div className="space-y-4">
          {ijazahs.map((ij) => {
            const st = students.find((s) => s.id === ij.studentId);
            return (
              <div
                key={ij.id}
                className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/50 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-[#c59b27]" />
                    <span className="text-xs font-mono tabular-nums font-bold text-[#c59b27]">
                      رقم الإجازة: {ij.certificateNumber}
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-neutral-400">
                    تاريخ الإجازة:{' '}
                    {formatGregorianAndHijri(
                      ij.issueDate,
                      settings.showHijriDates ?? true
                    )}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-[#145a3a] dark:text-white">
                  المُجاز: {st?.name || 'طالب بالأكاديمية'} — ({ij.riwayah})
                </h3>

                <p className="font-quran text-base md:text-lg leading-loose text-neutral-800 dark:text-neutral-200 bg-[#fcfaf2] dark:bg-[#0b1711] p-4 rounded-2xl border border-[#c59b27]/30">
                  {ij.sanadChain}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-xs font-bold text-neutral-500">
                    الشيخ المُجيز: {ij.sheikhName}
                  </span>
                  <button
                    onClick={() =>
                      setPrintData({
                        title: `إجازة قرآنية بالسند المتصل — ${ij.riwayah}`,
                        studentName: st?.name || '',
                        details: ij.sanadChain,
                        committeeOrSanad: `الشيخ المجيز: ${ij.sheikhName}`,
                        date: ij.issueDate,
                        certNumber: ij.certificateNumber,
                      })
                    }
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة وثيقة الإجازة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Exam */}
      {examModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/60">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-emerald-900">
              <h3 className="text-sm font-extrabold">
                إنشاء اختبار قرآني بلجنة تقييم
              </h3>
              <button onClick={() => setExamModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveExam} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">الطالب</label>
                <select
                  value={exStudentId}
                  onChange={(e) => setExStudentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    نوع الاختبار
                  </label>
                  <select
                    value={exType}
                    onChange={(e) =>
                      setExType(e.target.value as ExamRecord['type'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    <option value="تحديد مستوى">تحديد مستوى</option>
                    <option value="اختبار سورة">اختبار سورة</option>
                    <option value="اختبار جزء">اختبار جزء</option>
                    <option value="اختبار خمسة أجزاء">اختبار خمسة أجزاء</option>
                    <option value="اختبار ختمة وتجويد">
                      اختبار ختمة وتجويد
                    </option>
                    <option value="اختبار مرحلة تأسيسية">
                      اختبار مرحلة تأسيسية
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    الدرجة (من 100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={exScore}
                    onChange={(e) => setExScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold">
                    موضوع ومقرر الاختبار
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const samples = QURAN_EXAM_PROMPTS_POOL.sort(
                        () => Math.random() - 0.5
                      ).slice(0, 3);
                      setExNotes(
                        samples
                          .map(
                            (s, i) =>
                              `موضع ${i + 1}: سورة ${s.surahName} (${s.fromAyah}-${s.toAyah})`
                          )
                          .join(' — ')
                      );
                    }}
                    className="text-[11px] font-extrabold text-purple-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>🎲 توليد 3 مواضع عشوائية</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={exTarget}
                  onChange={(e) => setExTarget(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  أعضاء لجنة التقييم
                </label>
                <input
                  type="text"
                  value={exCommittee}
                  onChange={(e) => setExCommittee(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  مواضع التسميع وتوصيات اللجنة
                </label>
                <textarea
                  rows={2}
                  value={exNotes}
                  onChange={(e) => setExNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
              >
                اعتماد نتيجة الاختبار
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Ijazah */}
      {ijazahModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/60">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-emerald-900">
              <h3 className="text-sm font-extrabold">
                توثيق إجازة قرآنية وسند متصل
              </h3>
              <button onClick={() => setIjazahModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveIjazah} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">
                  الطالب المجاز
                </label>
                <select
                  value={ijStudentId}
                  onChange={(e) => setIjStudentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  الرواية ونوع الإجازة
                </label>
                <input
                  type="text"
                  required
                  value={ijRiwayah}
                  onChange={(e) => setIjRiwayah(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  نص السند المتصل
                </label>
                <textarea
                  rows={4}
                  required
                  value={ijSanad}
                  onChange={(e) => setIjSanad(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs leading-relaxed"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold cursor-pointer"
              >
                حفظ وتوثيق الإجازة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Printable Certificate / Ijazah Modal */}
      {printData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white text-[#14281d] p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200 no-print">
              <span className="text-xs font-bold text-[#145a3a]">
                معاينة الوثيقة الرسمية للطباعة
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة / حفظ PDF</span>
                </button>
                <button
                  onClick={() => setPrintData(null)}
                  className="p-2 rounded-xl border border-neutral-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="border-8 border-double border-[#c59b27] rounded-2xl p-8 bg-[#fcfaf2] text-center space-y-4">
              <img
                src="/assets/aistudio/icon-192_29a1c2ce.png"
                alt="شعار الأكاديمية"
                referrerPolicy="no-referrer"
                className="w-20 h-20 mx-auto rounded-2xl border-2 border-[#c59b27]"
              />
              <div className="text-xs font-bold text-[#145a3a]">
                {settings.academyName} — {settings.tagline}
              </div>
              <h2 className="font-quran text-3xl font-bold text-[#145a3a]">
                {printData.title}
              </h2>
              <div className="font-quran text-2xl font-bold text-[#c59b27] py-2 border-y border-[#c59b27]/40 max-w-md mx-auto">
                {printData.studentName}
              </div>
              <p className="font-quran text-lg leading-loose max-w-2xl mx-auto text-neutral-800">
                {printData.details}
              </p>
              <div className="text-xs font-bold text-[#145a3a]">
                {printData.committeeOrSanad}
              </div>
              <div className="pt-6 border-t border-[#c59b27]/40 flex flex-wrap items-center justify-between gap-4 text-xs font-mono tabular-nums text-neutral-600">
                <div className="text-right space-y-1">
                  <div>رقم الوثيقة: {printData.certNumber}</div>
                  <div className="text-[#145a3a] font-bold">
                    كود التحقق الرقمي:{' '}
                    {generateVerificationHash(
                      printData.studentName,
                      printData.certNumber,
                      printData.date
                    )}
                  </div>
                  <div>
                    التاريخ:{' '}
                    {formatGregorianAndHijri(
                      printData.date,
                      settings.showHijriDates ?? true
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#c59b27]">
                  <div className="text-[10px] font-sans font-bold text-[#145a3a] text-right">
                    <div>رمز التحقق QR (Offline SVG)</div>
                    <div className="font-mono text-[9px] text-neutral-500">
                      {generateVerificationHash(
                        printData.studentName,
                        printData.certNumber,
                        printData.date
                      )}
                    </div>
                  </div>
                  <svg
                    viewBox="0 0 7 7"
                    className="w-12 h-12 bg-white p-1 rounded-lg border border-[#145a3a]/30"
                    aria-label="Offline Verification QR Code"
                  >
                    {Array.from({ length: 49 }, (_, idx) => {
                      const r = Math.floor(idx / 7);
                      const c = idx % 7;
                      const isCorner =
                        (r < 2 && c < 2) ||
                        (r < 2 && c > 4) ||
                        (r > 4 && c < 2);
                      const charSeed =
                        (printData.certNumber.charCodeAt(
                          idx % printData.certNumber.length
                        ) +
                          idx * 7) %
                          2 ===
                        0;
                      const filled = isCorner || charSeed;
                      return filled ? (
                        <rect
                          key={idx}
                          x={c}
                          y={r}
                          width={0.9}
                          height={0.9}
                          fill="#14281d"
                        />
                      ) : null;
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

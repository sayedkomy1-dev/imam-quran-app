import React, { useEffect, useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  CHALLENGE_METADATA,
  ERROR_PEDAGOGICAL_COACHING_MAP,
  KIDS_TAJWEED_SIMPLIFIED,
  LEARNING_DIFFICULTIES_PLANS,
  PEDAGOGICAL_SCREENING_QUESTIONS,
  READING_FOUNDATION_STRATEGIES,
  SMART_FAMILY_GUIDANCE_TEMPLATES,
  evaluatePedagogicalScreening,
  generateRecommendedFamilyGuidance,
  getRepeatedErrorsPedagogicalTips,
} from '../data/pedagogicalAdvisorData';
import { RecitationError, Student, StudentPedagogicalProfile } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Copy,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  UserCheck,
  Volume2,
  X,
} from 'lucide-react';

// ============================================================================
// 1. بطاقة التشخيص التربوي المختصرة + أزرار فتح اختبار الفرز ودليل المحفظ الذكي
// ============================================================================

export const PedagogicalDiagnosticCard: React.FC<{
  student: Student;
  errors?: RecitationError[];
  compact?: boolean;
  onInsertAdviceToNotes?: (adviceText: string) => void;
}> = ({ student, errors = [], compact = false, onInsertAdviceToNotes }) => {
  const { saveStudentPedagogicalProfile, showToast } = useAcademy();

  const [screeningModalOpen, setScreeningModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [guideInitialTab, setGuideInitialTab] = useState<
    'foundation' | 'tajweed' | 'challenges' | 'error_coaching'
  >('foundation');

  // Default synthesized profile if not yet assessed
  const effectiveProfile: StudentPedagogicalProfile = useMemo(() => {
    if (student.pedagogicalProfile) return student.pedagogicalProfile;
    const isBeginner = student.level === 'مبتدئ' || (student.foundationLevel || 8) <= 4;
    return {
      assessedAt: student.startDate || '2026-03-01',
      learningStyle: isBeginner ? 'سمعي' : 'بصري',
      primaryChallengeKey: isBeginner ? 'weak_reading_foundation' : 'balanced_typical',
      primaryChallengeLabel: isBeginner
        ? CHALLENGE_METADATA.weak_reading_foundation.label
        : CHALLENGE_METADATA.balanced_typical.label,
      secondaryChallenges: [],
      suggestedTrack: isBeginner ? 'تأسيس قرائي' : 'تلقين سمعي',
      teacherActionSummary: isBeginner
        ? CHALLENGE_METADATA.weak_reading_foundation.teacherActionSummary
        : CHALLENGE_METADATA.balanced_typical.teacherActionSummary,
      recommendedSessionSliceMinutes: isBeginner ? 8 : 15,
      recommendedDailyListeningCount: 5,
      rawAnswers: {},
    };
  }, [student]);

  const repeatedTips = useMemo(
    () => getRepeatedErrorsPedagogicalTips(errors),
    [errors]
  );

  return (
    <>
      <div
        className={`rounded-2xl bg-gradient-to-l from-[#145a3a]/10 via-[#fcfaf2] to-amber-50/70 dark:from-[#12231a] dark:via-[#0b1711] dark:to-[#12231a] border-2 border-[#c59b27]/50 ${
          compact ? 'p-4 space-y-3' : 'p-5 space-y-4'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#c59b27] font-bold">
                <span>المستشار التربوي والتأسيس القرآني وصعوبات التعلم</span>
                <span aria-hidden="true">·</span>
                <span>توصيف تربوي ومهاري</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#14281d] dark:text-white">
                بطاقة التشخيص التربوي ونمط التعلم — {student.name}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setScreeningModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ClipboardCheck className="w-4 h-4 text-[#dfbd69]" />
              <span>
                {student.pedagogicalProfile
                  ? 'تحديث اختبار الفرز التربوي'
                  : 'إجراء اختبار الفرز التربوي (7 أسئلة)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGuideInitialTab('foundation');
                setGuideModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>دليل المحفظ الذكي (4 مسارات)</span>
            </button>
          </div>
        </div>

        {/* 3 Core Diagnostic Pillars: النمط + التحدي الأساسي + المسار المقترح */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50">
            <div className="text-[11px] text-neutral-500 font-bold">
              ١. نمط تعلم الطفل (القناة الحسية الأسرع)
            </div>
            <div className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] mt-1">
              نمط {effectiveProfile.learningStyle}
            </div>
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              {effectiveProfile.learningStyle === 'سمعي'
                ? 'يستوعب بالتلقين النغمي والاستماع المتكرر للمقرئ المعلم'
                : effectiveProfile.learningStyle === 'بصري'
                ? 'يستوعب برؤية الرسم العثماني وتلوين الحروف وموضع الآية'
                : 'يستوعب بالتسميع التفاعلي وتقسيم الفقرات والإشارات الحركية'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50">
            <div className="text-[11px] text-neutral-500 font-bold">
              ٢. التحدي التعليمي الأساسي المرصود
            </div>
            <div className="text-sm font-extrabold text-amber-800 dark:text-amber-300 mt-1">
              {CHALLENGE_METADATA[effectiveProfile.primaryChallengeKey]?.shortBadge ||
                effectiveProfile.primaryChallengeLabel}
            </div>
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2">
              {effectiveProfile.primaryChallengeLabel}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50">
            <div className="text-[11px] text-neutral-500 font-bold">
              ٣. المسار التعليمي المقترح في الحلقة
            </div>
            <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
              مسار: {effectiveProfile.suggestedTrack}
            </div>
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              فقرة التركيز المثالية: {effectiveProfile.recommendedSessionSliceMinutes} د · استماع يومي:{' '}
              {effectiveProfile.recommendedDailyListeningCount} مرات
            </div>
          </div>
        </div>

        {/* Teacher Action Plan Summary */}
        <div className="p-3.5 rounded-xl bg-white/90 dark:bg-[#12231a]/90 border border-[#c59b27]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              🧭 التوصية التربوية للمحفظ داخل الحصة:
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {effectiveProfile.teacherActionSummary}
            </p>
          </div>
          {onInsertAdviceToNotes && (
            <button
              type="button"
              onClick={() => {
                onInsertAdviceToNotes(effectiveProfile.teacherActionSummary);
                showToast('تم إدراج التوصية التربوية في ملاحظات الحصة', 'success');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-[#145a3a] dark:text-[#dfbd69] font-extrabold shrink-0 cursor-pointer"
            >
              + إدراج في ملاحظات الحصة
            </button>
          )}
        </div>

        {/* Smart Error Coaching Strip (الربط الذكي بسجل الأخطاء) */}
        {repeatedTips.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#c59b27]" />
                <span>
                  الربط الذكي بسجل الأخطاء: نصيحة تربوية سريعة لمعالجة أخطاء الطالب المتكررة
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setGuideInitialTab(repeatedTips[0].tip.recommendedStrategyTab);
                  setGuideModalOpen(true);
                }}
                className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] underline cursor-pointer"
              >
                عرض خطة المعالجة التفصيلية ←
              </button>
            </div>

            <div className="space-y-1.5">
              {repeatedTips.slice(0, 3).map((item) => (
                <div
                  key={item.errorType}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-amber-200/80 dark:border-emerald-900/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      {item.tip.badgeTitle} (تكرار: {item.count}
                      {item.sampleWords.length > 0
                        ? ` · مثل: ${item.sampleWords.join('، ')}`
                        : ''}
                      ):
                    </span>{' '}
                    <span className="text-neutral-700 dark:text-neutral-200">
                      {item.tip.oneLineAdvice}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Screening Modal */}
      {screeningModalOpen && (
        <PedagogicalScreeningModal
          student={student}
          initialProfile={student.pedagogicalProfile}
          onClose={() => setScreeningModalOpen(false)}
          onSaveProfile={(profile) => {
            saveStudentPedagogicalProfile(student.id, profile);
            setScreeningModalOpen(false);
          }}
        />
      )}

      {/* 4-Track Smart Teacher Guide Modal */}
      {guideModalOpen && (
        <SmartTeacherGuideModal
          initialTab={guideInitialTab}
          student={student}
          onClose={() => setGuideModalOpen(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// 2. نافذة اختبار الفرز التربوي وأنماط التعلم للأطفال (7 أسئلة بالملاحظة المباشرة)
// ============================================================================

export const PedagogicalScreeningModal: React.FC<{
  student: Student;
  initialProfile?: StudentPedagogicalProfile;
  onClose: () => void;
  onSaveProfile: (profile: StudentPedagogicalProfile) => void;
}> = ({ student, initialProfile, onClose, onSaveProfile }) => {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (initialProfile?.rawAnswers && Object.keys(initialProfile.rawAnswers).length > 0) {
      return initialProfile.rawAnswers;
    }
    const defaults: Record<string, string> = {};
    PEDAGOGICAL_SCREENING_QUESTIONS.forEach((q) => {
      defaults[q.id] = q.options[0].id;
    });
    return defaults;
  });

  const [teacherNote, setTeacherNote] = useState(
    initialProfile?.teacherObservationNote || ''
  );

  const liveResult = useMemo(
    () => evaluatePedagogicalScreening(answers, teacherNote),
    [answers, teacherNote]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[#dfbd69] font-bold">
              أداة تقييم تربوي ومهاري بالملاحظة المباشرة (ليست تشخيصاً طبياً)
            </div>
            <h2 className="text-lg font-extrabold mt-0.5">
              اختبار الفرز التربوي وأنماط التعلم للأطفال — الطالب: {student.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-5">
          {/* Questions List */}
          <div className="space-y-4">
            {PEDAGOGICAL_SCREENING_QUESTIONS.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    السؤال {q.number}: {q.dimensionLabel}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    🔍 {q.observationHint}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-[#14281d] dark:text-white">
                  {q.questionText}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className={`p-3 rounded-xl border text-right text-xs font-bold transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-xs'
                            : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 text-neutral-700 dark:text-neutral-200 hover:border-[#145a3a]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              selected
                                ? 'border-[#dfbd69] bg-[#c59b27] text-[#14281d]'
                                : 'border-neutral-400'
                            }`}
                          >
                            {selected && '✓'}
                          </span>
                          <span className="leading-relaxed">{opt.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Teacher Extra Observation Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              ملاحظات تربوية إضافية للمحفظ حول أسلوب تعلم الطالب:
            </label>
            <input
              type="text"
              value={teacherNote}
              onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="مثال: يحب التشجيع بنقاط الهمة ويقرأ بشكل ممتاز عند تقسيم السورة لمقاطع من 3 آيات..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold"
            />
          </div>

          {/* Live Diagnostic Result Preview Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-l from-[#145a3a]/15 to-[#c59b27]/15 border-2 border-[#c59b27] space-y-3">
            <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              📊 نتيجة الفرز التربوي الفورية (تُحفظ في ملف الطالب وتظهر في شاشة الحصة):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-[#12231a]">
                <span className="text-neutral-500 block">النمط الحسي السائد:</span>
                <strong className="text-sm text-[#145a3a] dark:text-[#dfbd69]">
                  نمط {liveResult.learningStyle}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#12231a]">
                <span className="text-neutral-500 block">التحدي الأساسي:</span>
                <strong className="text-sm text-amber-800 dark:text-amber-300">
                  {CHALLENGE_METADATA[liveResult.primaryChallengeKey]?.shortBadge}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#12231a]">
                <span className="text-neutral-500 block">المسار المقترح:</span>
                <strong className="text-sm text-emerald-700 dark:text-emerald-300">
                  {liveResult.suggestedTrack}
                </strong>
              </div>
            </div>
            <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
              <strong>خطة العمل المقترحة:</strong> {liveResult.teacherActionSummary}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f6f7f2] dark:bg-[#0b1711] border-t border-neutral-200 dark:border-emerald-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-800 text-xs font-bold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => onSaveProfile(liveResult)}
            className="px-5 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-[#dfbd69]" />
            <span>اعتماد وحفظ بطاقة التشخيص التربوي في ملف الطالب</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. دليل المحفظ الذكي: استراتيجيات التعليم والتجويد والتأسيس (4 مسارات عملية)
// ============================================================================

export const SmartTeacherGuideModal: React.FC<{
  initialTab?: 'foundation' | 'tajweed' | 'challenges' | 'error_coaching';
  student?: Student | null;
  onClose: () => void;
}> = ({ initialTab = 'foundation', student, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'foundation' | 'tajweed' | 'challenges' | 'error_coaching'
  >(initialTab);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[#dfbd69] font-bold">
              مكتبة المحفظ التربوية والمهارية (تعمل 100% دون إنترنت)
            </div>
            <h2 className="text-lg font-extrabold mt-0.5">
              دليل المحفظ الذكي: استراتيجيات التأسيس القرائي وتبسيط التجويد وصعوبات التعلم
              {student ? ` — (${student.name})` : ''}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Track Tabs */}
        <div className="flex overflow-x-auto border-b border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] px-4 pt-2 gap-2">
          {[
            {
              id: 'foundation',
              label: '١. استراتيجيات التأسيس القرائي (6 مراحل)',
            },
            {
              id: 'tajweed',
              label: '٢. تبسيط التجويد للأطفال بالقصص والأمثلة الحسية',
            },
            {
              id: 'challenges',
              label: '٣. خطط التعامل مع صعوبات التعلم في الحلقة',
            },
            {
              id: 'error_coaching',
              label: '٤. الربط الذكي بسجل الأخطاء المتكررة',
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-4 py-3 rounded-t-2xl text-xs font-extrabold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white dark:bg-[#12231a] text-[#145a3a] dark:text-[#dfbd69] border-[#c59b27]'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-[#145a3a]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-4">
          {activeTab === 'foundation' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {READING_FOUNDATION_STRATEGIES.map((step) => (
                <div
                  key={step.id}
                  className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-2.5"
                >
                  <div className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    {step.title}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    <strong>الهدف المهاري:</strong> {step.pedagogicalGoal}
                  </p>
                  <ul className="space-y-1 text-xs text-neutral-700 dark:text-neutral-200 list-disc pr-4">
                    {step.teachingSteps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-[#c59b27]/40 text-xs">
                    <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                      📖 تدريب تطبيقي من قصار السور:
                    </strong>{' '}
                    {step.shortSurahDrill}
                  </div>
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                    🛠️ علاج الخطأ الشائع: {step.commonMistakeRemedy}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tajweed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {KIDS_TAJWEED_SIMPLIFIED.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      {rule.ruleTitle}
                    </h3>
                    <span className="text-xs font-mono font-bold text-[#c59b27]">
                      {rule.targetLetters}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-[#c59b27]/40 text-xs leading-relaxed">
                    <strong>🌟 القصة والتشبيه الحسي للطفل:</strong> {rule.sensoryStoryMetaphor}
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300">
                    <strong>🖐️ تطبيق عملي في الحلقة:</strong> {rule.practicalChildHint}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rule.quranExamples.map((ex, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-quran"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="space-y-4">
              {LEARNING_DIFFICULTIES_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="p-5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      {plan.targetGroupTitle}
                    </h3>
                    <span className="text-xs text-neutral-500">
                      المؤشرات: {plan.symptomsSummary}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {plan.inSessionActionPlan.map((step, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/80 dark:border-emerald-900/40 text-xs leading-relaxed"
                      >
                        <strong className="text-[#c59b27] ml-1">خطوة {i + 1}:</strong>
                        {step}
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/50 text-xs">
                    <strong>🏡 توجيه المتابعة المنزلية المرادف:</strong> {plan.homeFollowUpTip}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'error_coaching' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                يرتبط هذا الجدول تلقائياً بسجل أخطاء التسميع في الحصة؛ فعند تسجيل أو تكرار أي خطأ في (نطق/تشكيل، حفظ، تجويد، تردد، نسيان آية) تظهر للمحفظ شارة نصيحة تربوية سريعة من سطر واحد:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(ERROR_PEDAGOGICAL_COACHING_MAP).map((item) => (
                  <div
                    key={item.errorType}
                    className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-1.5"
                  >
                    <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      {item.badgeTitle} — [نوع الخطأ: {item.errorType}]
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
                      {item.oneLineAdvice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f6f7f2] dark:bg-[#0b1711] border-t border-neutral-200 dark:border-emerald-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. مولّد نصائح الوالدين المختصرة («👨👩👧 توجيه تربوي للأسرة»)
// ============================================================================

export const FamilyGuidanceGeneratorSection: React.FC<{
  student: Student;
  errors?: RecitationError[];
  surahName?: string;
  fromAyah?: number;
  toAyah?: number;
  onInsertIntoParentMessage?: (text: string) => void;
}> = ({
  student,
  errors = [],
  surahName,
  fromAyah,
  toAyah,
  onInsertIntoParentMessage,
}) => {
  const { publishFamilyGuidanceToGuardian, showToast } = useAcademy();

  const autoRecommendation = useMemo(
    () =>
      generateRecommendedFamilyGuidance({
        student,
        errors,
        surahName,
        fromAyah,
        toAyah,
      }),
    [student, errors, surahName, fromAyah, toAyah]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    autoRecommendation.template.id
  );
  const [targetWordOrLetter, setTargetWordOrLetter] = useState<string>('');
  const [adviceText, setAdviceText] = useState<string>(
    autoRecommendation.generatedText
  );

  // Sync when student or autoRecommendation changes
  useEffect(() => {
    setSelectedTemplateId(autoRecommendation.template.id);
    setAdviceText(autoRecommendation.generatedText);
  }, [student.id, autoRecommendation.template.id, autoRecommendation.generatedText]);

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found =
      SMART_FAMILY_GUIDANCE_TEMPLATES.find((t) => t.id === tplId) ||
      SMART_FAMILY_GUIDANCE_TEMPLATES[0];
    const generated = found.generateText({
      studentName: student.name,
      surahName: surahName || student.currentStop?.surahName || 'النبأ',
      fromAyah: fromAyah || student.currentStop?.ayah || 1,
      toAyah: toAyah || (student.currentStop?.ayah || 1) + 5,
      targetLetterOrWord: targetWordOrLetter.trim() || undefined,
    });
    setAdviceText(generated);
  };

  const activeTemplate =
    SMART_FAMILY_GUIDANCE_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    SMART_FAMILY_GUIDANCE_TEMPLATES[0];

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-l from-amber-50/90 via-[#fcfaf2] to-emerald-50/60 dark:from-[#12231a] dark:via-[#0b1711] dark:to-[#12231a] border-2 border-[#c59b27]/60 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-[#c59b27]" />
            <span>👨‍👩‍👧 توجيه تربوي للأسرة (مولّد نصائح الوالدين المختصرة)</span>
          </h4>
          <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
            نصيحة إيجابية داعمة ومختصرة (3–4 أسطر) مبنية على حالة الطفل في الحصة أو نتيجة تقييمه التربوي لإدراجها في واتساب أو بوابة ولي الأمر
          </p>
        </div>

        <span className="text-[11px] font-bold text-[#c59b27]">
          التوصية الذكية: {activeTemplate.categoryLabel}
        </span>
      </div>

      {/* Template Selector Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {SMART_FAMILY_GUIDANCE_TEMPLATES.map((tpl) => {
          const isSelected = tpl.id === selectedTemplateId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#145a3a] text-white border-[#c59b27]'
                  : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 text-neutral-700 dark:text-neutral-200 hover:border-[#145a3a]'
              }`}
            >
              {tpl.title}
            </button>
          );
        })}
      </div>

      {/* Optional Specific Letter/Word Input for Pronunciation Template */}
      {selectedTemplateId === 'fg_pronunciation_drill' && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={targetWordOrLetter}
            onChange={(e) => {
              const val = e.target.value;
              setTargetWordOrLetter(val);
              const tpl = SMART_FAMILY_GUIDANCE_TEMPLATES.find(
                (t) => t.id === 'fg_pronunciation_drill'
              );
              if (tpl) {
                setAdviceText(
                  tpl.generateText({
                    studentName: student.name,
                    surahName: surahName || student.currentStop?.surahName || 'النبأ',
                    targetLetterOrWord: val.trim() || undefined,
                  })
                );
              }
            }}
            placeholder="حدد الحرف أو الكلمة المستهدفة للتدريب المنزلي (مثال: حرف القاف / كلمة الْمُعْصِرَاتِ)..."
            className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#12231a] text-xs font-bold"
          />
        </div>
      )}

      {/* Editable 3-4 Line Advice Box */}
      <textarea
        rows={3}
        value={adviceText}
        onChange={(e) => setAdviceText(e.target.value)}
        className="w-full p-3 rounded-xl border border-[#c59b27]/50 bg-white dark:bg-[#12231a] text-xs font-semibold leading-relaxed"
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {onInsertIntoParentMessage && (
            <button
              type="button"
              onClick={() => {
                onInsertIntoParentMessage(adviceText);
                showToast(
                  '➕ تم إدراج النصيحة التربوية في رسالة ولي الأمر بنجاح',
                  'success'
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#dfbd69]" />
              <span>➕ إدراج النصيحة في رسالة ولي الأمر</span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              publishFamilyGuidanceToGuardian(student.id, {
                title: activeTemplate.title,
                categoryLabel: activeTemplate.categoryLabel,
                bodyText: adviceText,
                targetLetterOrSurah:
                  targetWordOrLetter.trim() ||
                  surahName ||
                  student.currentStop?.surahName,
              })
            }
            className="px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>عرضها في بطاقة مستقلة ببوابة ولي الأمر</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(adviceText);
              showToast('تم نسخ التوجيه التربوي للأسرة', 'success');
            }}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>نسخ</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            window.open(
              buildWhatsAppUrl(student.whatsappPhone, adviceText),
              '_blank',
              'noopener'
            );
          }}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>إرسال التوجيه عبر واتساب</span>
        </button>
      </div>
    </div>
  );
};

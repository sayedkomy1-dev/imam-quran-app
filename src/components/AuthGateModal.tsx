import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { OFFICIAL_ACADEMY_WHATSAPP } from '../data/hybridFoundationData';
import {
  BookOpen,
  GraduationCap,
  KeyRound,
  MessageCircle,
  Moon,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  Users,
} from 'lucide-react';
import { PWAInstallButton } from './PWAComponents';
import { WaqfDedicationBannerCard } from './PublicMushafWaqfPortalView';

export const AuthGateModal: React.FC = () => {
  const {
    students,
    settings,
    updateSettings,
    loginAsTeacher,
    loginAsGuardian,
    loginAsGuardianDirect,
    loginAsGuest,
    submitAdmissionRequest,
    setPublicMushafPortalOpen,
  } = useAcademy();

  const [selectedMode, setSelectedMode] = useState<
    'teacher' | 'guardian' | 'guest' | 'admission'
  >('teacher');
  const [phoneInput, setPhoneInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showWaqfDetailsOnGate, setShowWaqfDetailsOnGate] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);

  // Admission Funnel Form State
  const [admName, setAdmName] = useState('');
  const [admAge, setAdmAge] = useState(9);
  const [admGuardianName, setAdmGuardianName] = useState('');
  const [admGuardianPhone, setAdmGuardianPhone] = useState('');
  const [admRiwayah, setAdmRiwayah] = useState<
    'حفص عن عاصم' | 'ورش عن نافع' | 'قالون عن نافع' | 'شعبة عن عاصم' | 'الدوري عن أبي عمرو'
  >('حفص عن عاصم');
  const [admLevel, setAdmLevel] = useState('مبتدئ / جزء عم');
  const [admDays, setAdmDays] = useState('السبت - الإثنين - الأربعاء');
  const [admTime, setAdmTime] = useState('17:00');
  const [admSubmitted, setAdmSubmitted] = useState(false);

  const handleGuardianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = loginAsGuardian(phoneInput.trim(), pinInput.trim());
    if (!res.ok) {
      setAuthError(res.error || 'بيانات الدخول غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f2] dark:bg-[#0b1711] text-[#14281d] dark:text-[#e9f2ec] flex flex-col justify-between p-4 md:p-8">
      {/* Top Bar */}
      <header className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-200/70 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/icon-192_29a1c2ce.png"
            alt="شعار أكاديمية الإمام"
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-xl border border-[#c59b27]/40 shadow-xs object-cover"
          />
          <div>
            <span className="font-extrabold text-base md:text-lg text-[#145a3a] dark:text-[#dfbd69] block tracking-tight">
              أكاديمية الإمام لتحفيظ القرآن الكريم
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              بالقرآن نحيا · منصة الحلقات والإسناد والمصحف الوقفي
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs cursor-pointer transition"
            title="التواصل الرسمي مع إدارة الأكاديمية والدعم الفني عبر واتساب"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">واتساب الأكاديمية:</span>
            <span className="font-mono" dir="ltr">+{OFFICIAL_ACADEMY_WHATSAPP}</span>
          </a>
          <PWAInstallButton />
          <div className="flex items-center rounded-xl border border-neutral-200 dark:border-emerald-900/60 bg-white dark:bg-[#12231a] p-0.5">
            {(
              [
                { id: 'light' as const, label: '☀️ نهاري' },
                { id: 'dark' as const, label: '🌙 ليلي' },
                { id: 'sepia' as const, label: '📜 كريمي' },
              ]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateSettings({ theme: m.id })}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  settings.theme === m.id
                    ? 'bg-[#145a3a] text-[#dfbd69]'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Public Madinah Mushaf & Daily Wird (Waqf & Sadaqah Jariyah) Prominent Hero Banner (No Login Required) */}
      <section className="max-w-5xl w-full mx-auto mt-5 space-y-3">
        <div className="rounded-3xl bg-gradient-to-l from-[#145a3a] via-[#0f452c] to-[#14281d] text-white p-5 md:p-6 border border-[#c59b27]/80 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#dfbd69] font-bold">
              <span>🌿 وقف قرآني وصدقة جارية — متاح لعموم المسلمين بدون تسجيل دخول</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setShowWaqfDetailsOnGate((prev) => !prev)}
                className="underline decoration-[#dfbd69]/60 hover:text-white transition cursor-pointer font-extrabold"
              >
                {showWaqfDetailsOnGate ? 'إخفاء وثيقة الوقف والدعاء' : 'عرض أسماء المهدى إليهم والدعاء بالرحمة'}
              </button>
            </div>
            <h2 className="text-base md:text-xl font-extrabold text-white tracking-tight">
              🕌 الدخول إلى بوابة المصحف العام والورد اليومي (مصحف المدينة 604 صفحات + التلاوة المتزامنة)
            </h2>
            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl">
              تلاوة واستماع متزامن لـ 6 قراء مع وضع القراءة الخاشعة، التفسير الميسر ومعاني الكلمات، مركز تنزيل للعمل بدون إنترنت 100%، وشهادة الختمة الفورية.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPublicMushafPortalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] font-extrabold text-xs md:text-sm shadow-md transition-all cursor-pointer shrink-0 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <BookOpen className="w-4 h-4" />
            <span>فتح المصحف العام والورد اليومي الآن</span>
          </button>
        </div>

        {showWaqfDetailsOnGate && <WaqfDedicationBannerCard compact />}
      </section>

      {/* Main Auth Card */}
      <main className="max-w-5xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-neutral-200 dark:border-emerald-900/50 bg-white dark:bg-[#12231a] shadow-xl">
        {/* Right Column: Academy Identity Banner */}
        <div className="lg:col-span-5 bg-[#145a3a] text-white p-7 md:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-6">
              <img
                src="/assets/aistudio/icon-192_29a1c2ce.png"
                alt="شعار الأكاديمية"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl border-2 border-[#c59b27] shadow-md"
              />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  أكاديمية الإمام
                </h1>
                <p className="text-sm font-medium text-[#dfbd69]">لتحفيظ القرآن الكريم — بالقرآن نحيا</p>
              </div>
            </div>

            <p className="text-sm text-emerald-100 leading-relaxed mb-6">
              منصة قرآنية متكاملة تعمل دون إنترنت (Offline-First PWA) لإدارة الحلقات، محرك التسميع الخماسي، السبورة التفاعلية، الأسانيد والإجازات، ومتابعة أولياء الأمور.
            </p>

            <div className="space-y-3 text-xs text-emerald-100/90 border-t border-emerald-700/60 pt-5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#dfbd69] shrink-0" />
                <span>محرك الحصة الخماسي وتسجيل التلاوة مع مؤشرات الأخطاء الزمنية</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#dfbd69] shrink-0" />
                <span>مصحف عثماني وتفسير ميسر وصوتيات كبار القراء</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#dfbd69] shrink-0" />
                <span>السبورة الذكية للرسم على الآيات واختبار إخفاء الكلمات</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-emerald-800/80 text-xs text-emerald-200 flex items-center justify-between">
            <span>إصدار Offline-First PWA</span>
            <span className="tabular-nums font-mono text-[#dfbd69]">114 سورة · 30 جزء</span>
          </div>
        </div>

        {/* Left Column: Role Switcher & Login */}
        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-lg font-extrabold text-[#14281d] dark:text-white">
                بوابة الدخول للأكاديمية
              </h2>
              <button
                type="button"
                onClick={() => setShowDemoSwitcher((prev) => !prev)}
                className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69] hover:underline cursor-pointer"
              >
                {showDemoSwitcher ? 'إخفاء أزرار التجربة السريعة' : '🧪 تجربة سريعة للنظام (Demo)'}
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
              اختر المسار المناسب لك للدخول إلى حسابك أو تقديم طلب التحاق طالب جديد.
            </p>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-neutral-100 dark:bg-[#0b1711] mb-6">
              <button
                type="button"
                onClick={() => setSelectedMode('teacher')}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                  selectedMode === 'teacher'
                    ? 'bg-[#145a3a] text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>المعلم / المشرف</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode('guardian')}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                  selectedMode === 'guardian'
                    ? 'bg-[#145a3a] text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>بوابة ولي الأمر</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode('guest')}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                  selectedMode === 'guest'
                    ? 'bg-[#145a3a] text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>التحفيظ كضيف</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMode('admission');
                  setAdmSubmitted(false);
                }}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                  selectedMode === 'admission'
                    ? 'bg-[#c59b27] text-[#14281d] shadow-xs'
                    : 'text-amber-700 dark:text-[#dfbd69] hover:bg-amber-500/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>التحق بالأكاديمية</span>
              </button>
            </div>

            {/* Mode 1: Teacher */}
            {selectedMode === 'teacher' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{settings.teacherName}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        إدارة الحلقات، محرك التسميع الخماسي، السبورة الذكية، الاختبارات، والمالية
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    بوابة الإدارة المركزية للمحفظين والمشرفين لمتابعة الحضور، تقييم التلاوة، وإصدار التقارير والشهادات.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loginAsTeacher}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <GraduationCap className="w-5 h-5 text-[#dfbd69]" />
                  <span>الدخول إلى لوحة المعلم والمشرف</span>
                </button>
              </div>
            )}

            {/* Mode 2: Guardian */}
            {selectedMode === 'guardian' && (
              <form onSubmit={handleGuardianSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-neutral-700 dark:text-neutral-300">
                      رقم هاتف / واتساب ولي الأمر
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute right-3 top-3 text-neutral-400" />
                      <input
                        type="tel"
                        dir="ltr"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711] text-sm tabular-nums text-left"
                        placeholder="010xxxxxxxx"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-neutral-700 dark:text-neutral-300">
                      رمز الدخول السري (PIN — 6 أرقام)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute right-3 top-3 text-neutral-400" />
                      <input
                        type="password"
                        inputMode="numeric"
                        dir="ltr"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711] text-sm tabular-nums text-left font-mono tracking-widest"
                        placeholder="••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-bold text-sm transition-colors cursor-pointer min-h-[44px]"
                >
                  دخول لصفحة متابعة الطالب
                </button>
              </form>
            )}

            {/* Mode 3: Guest */}
            {selectedMode === 'guest' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
                  <h3 className="text-sm font-bold text-[#145a3a] dark:text-[#dfbd69] mb-1">
                    مركز التحفيظ الحر والتلاوة (بدون حساب)
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    يتيح لك استعراض السور بالرسم العثماني، الاستماع للقراء مع تكرار الآيات، قراءة التفسير الميسر، واستخدام السبورة الذكية ووضع اختبار الحفظ الذاتي بإخفاء الكلمات.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loginAsGuest}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#c59b27] hover:bg-[#b38b1d] text-[#14281d] font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>ابدأ التحفيظ الحر كضيف الآن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPublicMushafPortalOpen(true)}
                  className="w-full py-3 px-5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 border border-[#c59b27]/40 min-h-[44px]"
                >
                  <Sparkles className="w-4 h-4 text-[#dfbd69]" />
                  <span>📖 دخول بوابة المصحف العام والورد اليومي (وقف وصدقة جارية)</span>
                </button>
              </div>
            )}

            {/* Mode 4: New Student Admission Funnel («التحق بالأكاديمية / حجز تحديد مستوى») */}
            {selectedMode === 'admission' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-[#0b1711] border border-[#c59b27]/50">
                  <h3 className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    📝 استمارة الالتحاق وحجز موعد تحديد المستوى
                  </h3>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                    يُحفظ الطلب مباشرة في «طابور القبول» لدى المعلم مع إرسال تأكيد فوري عبر واتساب الأكاديمية ({OFFICIAL_ACADEMY_WHATSAPP})
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold mb-1">اسم الطالب *</label>
                    <input
                      type="text"
                      value={admName}
                      onChange={(e) => setAdmName(e.target.value)}
                      placeholder="اسم الطالب ثلاثياً"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">العمر والرواية</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={4}
                        max={85}
                        value={admAge}
                        onChange={(e) => setAdmAge(Number(e.target.value) || 8)}
                        className="w-16 px-2 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711] text-center"
                      />
                      <select
                        value={admRiwayah}
                        onChange={(e) =>
                          setAdmRiwayah(
                            e.target.value as
                              | 'حفص عن عاصم'
                              | 'ورش عن نافع'
                              | 'قالون عن نافع'
                              | 'شعبة عن عاصم'
                              | 'الدوري عن أبي عمرو'
                          )
                        }
                        className="flex-1 px-2 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711] font-bold"
                      >
                        <option value="حفص عن عاصم">حفص عن عاصم</option>
                        <option value="ورش عن نافع">ورش عن نافع</option>
                        <option value="قالون عن نافع">قالون عن نافع</option>
                        <option value="شعبة عن عاصم">شعبة عن عاصم</option>
                        <option value="الدوري عن أبي عمرو">الدوري عن أبي عمرو</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">اسم ولي الأمر</label>
                    <input
                      type="text"
                      value={admGuardianName}
                      onChange={(e) => setAdmGuardianName(e.target.value)}
                      placeholder="اسم ولي الأمر"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">رقم واتساب ولي الأمر *</label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={admGuardianPhone}
                      onChange={(e) => setAdmGuardianPhone(e.target.value)}
                      placeholder="2010xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711] text-left font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">المستوى الحالي</label>
                    <input
                      type="text"
                      value={admLevel}
                      onChange={(e) => setAdmLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">الأيام والموعد المفضل</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={admDays}
                        onChange={(e) => setAdmDays(e.target.value)}
                        className="flex-1 px-2 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711]"
                      />
                      <input
                        type="time"
                        value={admTime}
                        onChange={(e) => setAdmTime(e.target.value)}
                        className="w-24 px-2 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#0b1711] font-mono"
                      />
                    </div>
                  </div>
                </div>

                {admSubmitted && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    ✅ تم إرسال طلب الالتحاق لطابور القبول بنجاح! يمكنك تأكيد الموعد عبر واتساب أدناه.
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!admName.trim() || !admGuardianPhone.trim()) return;
                      submitAdmissionRequest({
                        studentName: admName.trim(),
                        age: admAge,
                        guardianName: admGuardianName.trim() || 'ولي الأمر',
                        guardianPhone: admGuardianPhone.trim(),
                        countryOrTimezone: 'توقيت محلي / دولي',
                        preferredDays: admDays,
                        preferredTime: admTime,
                        currentLevel: admLevel,
                        requestedRiwayah: admRiwayah,
                        notes: 'طلب التحاق من شاشة الدخول الرئيسية',
                      });
                      setAdmSubmitted(true);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold cursor-pointer"
                  >
                    تسجيل في طابور القبول
                  </button>

                  <a
                    href={`https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}?text=${encodeURIComponent(
                      `السلام عليكم ورحمة الله، أرغب في حجز موعد تحديد مستوى للطالب (${admName || 'طالب جديد'}) - العمر (${admAge}) - الرواية (${admRiwayah}) - الموعد المفضل (${admDays} الساعة ${admTime}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تأكيد واتساب ({OFFICIAL_ACADEMY_WHATSAPP})</span>
                  </a>
                </div>
              </div>
            )}

            {showDemoSwitcher && (
              <div className="mt-5 p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  <span>🧪 وضع الفحص والمعاينة الفورية (Demo Switcher)</span>
                  <span className="text-[11px] font-normal text-neutral-500">تبديل بضغطة واحدة</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={loginAsTeacher}
                    className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
                  >
                    دخول تجريبي: مالك / محفظ
                  </button>
                  <button
                    type="button"
                    onClick={loginAsGuest}
                    className="px-3 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-bold cursor-pointer"
                  >
                    دخول تجريبي: طالب / ضيف
                  </button>
                  {students.slice(0, 4).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => loginAsGuardianDirect(st.id)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-emerald-900/60 bg-white dark:bg-[#12231a] hover:border-[#c59b27] transition-colors cursor-pointer"
                    >
                      ولي أمر: {st.name.split(' ').slice(0, 2).join(' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-emerald-950 flex items-center justify-between text-xs text-neutral-400">
            <span>حفظ تلقائي محلي 100%</span>
            <span>دعم كامل للوضع الليلي والطباعة</span>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center justify-center gap-3">
        <span>أكاديمية الإمام لتحفيظ القرآن الكريم — بالقرآن نحيا</span>
        <span>•</span>
        <a
          href={`https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#145a3a] dark:text-[#dfbd69] font-extrabold hover:underline font-mono"
          dir="ltr"
        >
          WhatsApp: +{OFFICIAL_ACADEMY_WHATSAPP}
        </a>
      </footer>
    </div>
  );
};

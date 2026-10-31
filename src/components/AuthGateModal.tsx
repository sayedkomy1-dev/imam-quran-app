import React, { useEffect, useRef, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { OFFICIAL_ACADEMY_WHATSAPP } from '../data/hybridFoundationData';
import { WAQF_DEDICATION_TEXT } from '../data/quranData';
import { SUPABASE_OFFICIAL_CONFIG } from '../utils/wlqSyncCore';
import { QuranRiwayah } from '../types';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Globe,
  GraduationCap,
  Heart,
  KeyRound,
  Lock,
  Mail,
  MessageCircle,
  Mic,
  MicOff,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

type WelcomePortalRole = 'teacher' | 'supervisor' | 'guardian' | 'student' | 'admission';

export const AuthGateModal: React.FC = () => {
  const {
    settings,
    setActiveTab: setAppActiveTab,
    googleAuthUser,
    managedTeachers,
    loginAsTeacher,
    loginWithGoogleEmail,
    startGoogleOAuthRedirect,
    startMicrosoftOAuthRedirect,
    submitNewStaffJoinRequest,
    loginAsGuardian,
    loginAsGuest,
    submitAdmissionRequest,
    setPublicMushafPortalOpen,
    waqfImpactStats,
    recordWaqfAmeenPrayer,
  } = useAcademy();

  const [selectedPortal, setSelectedPortal] = useState<WelcomePortalRole | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);

  // Teacher & Supervisor Auth state
  const [teacherAuthMode, setTeacherAuthMode] = useState<'google_and_pin' | 'pin_only'>('google_and_pin');
  const [teacherGoogleEmail, setTeacherGoogleEmail] = useState<string>('');
  const [teacherPinInput, setTeacherPinInput] = useState('');
  const [teacherError, setTeacherError] = useState('');

  // Hybrid SSO Inline Account Picker & Onboarding / Pending Approval Flow State
  const [ssoFlowStep, setSsoFlowStep] = useState<
    'default' | 'sso_email_prompt' | 'onboarding_card' | 'pending_approval'
  >('default');
  const [ssoProvider, setSsoProvider] = useState<'google' | 'microsoft'>('google');
  const [ssoEmailInput, setSsoEmailInput] = useState<string>('');
  const [ssoDisplayName, setSsoDisplayName] = useState<string>('');
  const [ssoUid, setSsoUid] = useState<string>('');

  // Quick Join Card Fields (بطاقة الانضمام السريعة للمحفظين والمشرفين الجدد)
  const [joinFullName, setJoinFullName] = useState<string>('');
  const [joinWhatsapp, setJoinWhatsapp] = useState<string>('');
  const [joinSpecialization, setJoinSpecialization] = useState<string>(
    'إجازة في رواية حفص عن عاصم ومنهج التأسيس'
  );
  const [joinRequestedRole, setJoinRequestedRole] = useState<'teacher' | 'supervisor'>('teacher');
  const [pendingStaffRecordId, setPendingStaffRecordId] = useState<string>('');

  // Guardian & Student Auth state
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [guardianError, setGuardianError] = useState('');

  // New Student Admission Request Form State
  const [admStudentName, setAdmStudentName] = useState('');
  const [admAge, setAdmAge] = useState('9');
  const [admGuardianName, setAdmGuardianName] = useState('');
  const [admPhone, setAdmPhone] = useState('');
  const [admCountry, setAdmCountry] = useState('مصر / القاهرة (GMT+2)');
  const [admRiwayah, setAdmRiwayah] = useState<QuranRiwayah>('حفص عن عاصم');
  const [admCurrentLevel, setAdmCurrentLevel] = useState<'مبتدئ' | 'متوسط' | 'متقدم'>('مبتدئ');
  const [admMemorizedSummary, setAdmMemorizedSummary] = useState('جزء عمّ أو قصار السور');
  const [admPreferredSchedule, setAdmPreferredSchedule] = useState('السبت والاثنين والأربعاء — 6:00 مساءً');
  const [admNotes, setAdmNotes] = useState('');
  const [admSuccess, setAdmSuccess] = useState(false);

  // Fatiha Placement Audio Recording State (تسجيل تلاوة الفاتحة لتحديد المستوى الأولي)
  const [fatihaAudioDataUrl, setFatihaAudioDataUrl] = useState<string>('');
  const [fatihaAudioDuration, setFatihaAudioDuration] = useState<number>(0);
  const [isRecordingFatiha, setIsRecordingFatiha] = useState<boolean>(false);
  const [fatihaRecordingSec, setFatihaRecordingSec] = useState<number>(0);
  const fatihaMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fatihaChunksRef = useRef<Blob[]>([]);
  const fatihaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStartFatihaRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      fatihaMediaRecorderRef.current = recorder;
      fatihaChunksRef.current = [];
      setFatihaRecordingSec(0);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          fatihaChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        try {
          stream.getTracks().forEach((track) => track.stop());
        } catch {
          // ignore
        }
        const blob = new Blob(fatihaChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setFatihaAudioDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(250);
      setIsRecordingFatiha(true);
      fatihaTimerRef.current = setInterval(() => {
        setFatihaRecordingSec((prev) => {
          if (prev >= 60) {
            handleStopFatihaRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      // microphone permission denied or unavailable
    }
  };

  const handleStopFatihaRecording = () => {
    if (fatihaMediaRecorderRef.current && isRecordingFatiha) {
      try {
        fatihaMediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecordingFatiha(false);
      if (fatihaTimerRef.current) {
        clearInterval(fatihaTimerRef.current);
        fatihaTimerRef.current = null;
      }
      setFatihaAudioDuration(fatihaRecordingSec);
    }
  };

  const handleClearFatihaRecording = () => {
    setFatihaAudioDataUrl('');
    setFatihaAudioDuration(0);
    setFatihaRecordingSec(0);
    if (fatihaTimerRef.current) {
      clearInterval(fatihaTimerRef.current);
      fatihaTimerRef.current = null;
    }
  };

  // Sadaqah Jariyah Popup Modal State
  const [sadaqahModalOpen, setSadaqahModalOpen] = useState(false);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPortal(null);
        setSadaqahModalOpen(false);
        setTeacherError('');
        setGuardianError('');
        setSsoFlowStep('default');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (fatihaTimerRef.current) clearInterval(fatihaTimerRef.current);
    };
  }, []);

  const expectedTeacherPin = (settings.teacherPin || '1234').trim();

  // Check if a pending staff member got approved in real time
  const activePendingMember = managedTeachers.find(
    (m) =>
      (pendingStaffRecordId && m.id === pendingStaffRecordId) ||
      (ssoEmailInput && m.email.toLowerCase() === ssoEmailInput.trim().toLowerCase())
  );

  const handleEvaluateSsoEmail = (
    emailToVerify: string,
    provider: 'google' | 'microsoft',
    displayNameHint?: string,
    uidHint?: string
  ) => {
    setTeacherError('');
    const normalized = emailToVerify.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      setTeacherError('يرجى إدخال بريد إلكتروني صحيح للمتابعة.');
      return;
    }

    const res = loginWithGoogleEmail(normalized, teacherPinInput || expectedTeacherPin, provider);
    if (res.ok) {
      if (
        normalized === 'sayedkomy1@gmail.com' ||
        normalized === 'sayedkomy2@gmail.com'
      ) {
        setAppActiveTab('owner_panel');
      } else if (selectedPortal === 'supervisor') {
        setAppActiveTab('settings');
      } else {
        setAppActiveTab('dashboard');
      }
      return;
    }

    if (res.requiresOnboardingCard) {
      setSsoProvider(provider);
      setSsoEmailInput(normalized);
      setJoinFullName(displayNameHint || normalized.split('@')[0] || '');
      setJoinRequestedRole(selectedPortal === 'supervisor' ? 'supervisor' : 'teacher');
      setSsoUid(uidHint || '');
      setSsoFlowStep('onboarding_card');
      return;
    }

    if (res.requiresPendingScreen) {
      setSsoProvider(provider);
      setSsoEmailInput(normalized);
      if (res.pendingStaff?.id) {
        setPendingStaffRecordId(res.pendingStaff.id);
      }
      if (res.pendingStaff?.name) {
        setJoinFullName(res.pendingStaff.name);
      }
      setSsoFlowStep('pending_approval');
      return;
    }

    if (res.error) {
      setTeacherError(res.error);
    }
  };

  const handleOAuthProviderClick = async (
    provider: 'google' | 'microsoft',
    role: 'teacher' | 'supervisor' | 'guardian' | 'student'
  ) => {
    setTeacherError('');
    setGuardianError('');
    setSsoProvider(provider);

    if (provider === 'google') {
      setGoogleLoading(true);
    } else {
      setMicrosoftLoading(true);
    }

    try {
      const res =
        provider === 'google'
          ? await startGoogleOAuthRedirect(role)
          : await startMicrosoftOAuthRedirect(
              role === 'supervisor' ? 'supervisor' : 'teacher'
            );

      if (res.ok) {
        if (role === 'supervisor') {
          setAppActiveTab('settings');
        }
        return;
      }

      if (res.requiresOnboardingCard && res.oauthUser) {
        setSsoEmailInput(res.oauthUser.email);
        setSsoDisplayName(res.oauthUser.displayName);
        setSsoUid(res.oauthUser.uid);
        setJoinFullName(res.oauthUser.displayName || '');
        setJoinRequestedRole(role === 'supervisor' ? 'supervisor' : 'teacher');
        setSsoFlowStep('onboarding_card');
        return;
      }

      if (res.requiresPendingScreen && res.oauthUser) {
        setSsoEmailInput(res.oauthUser.email);
        setJoinFullName(res.oauthUser.displayName || '');
        setSsoFlowStep('pending_approval');
        return;
      }

      if (
        res.error === 'POPUP_FALLBACK_GOOGLE' ||
        res.error === 'POPUP_FALLBACK_MICROSOFT'
      ) {
        // In preview iframe where popup is blocked, smoothly open the inline SSO Account Verification screen
        setSsoFlowStep('sso_email_prompt');
        return;
      }

      if (res.error) {
        if (role === 'guardian' || role === 'student') {
          setGuardianError(res.error);
        } else {
          setTeacherError(res.error);
        }
      }
    } finally {
      setGoogleLoading(false);
      setMicrosoftLoading(false);
    }
  };

  const handleQuickJoinCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    if (!joinFullName.trim() || !ssoEmailInput.trim() || !joinWhatsapp.trim()) {
      setTeacherError('يرجى استكمال الاسم الثلاثي ورقم الواتساب والبريد الإلكتروني.');
      return;
    }
    const created = submitNewStaffJoinRequest({
      name: joinFullName.trim(),
      email: ssoEmailInput.trim().toLowerCase(),
      whatsappPhone: joinWhatsapp.trim(),
      specialization: joinSpecialization.trim() || 'محفظ قرآن كريم وتجويد',
      requestedPosition: joinRequestedRole,
      authProvider: ssoProvider,
      uid: ssoUid || undefined,
    });

    if (created.status === 'active') {
      // Master Owner email automatically activated
      loginWithGoogleEmail(created.email, expectedTeacherPin, ssoProvider);
      setAppActiveTab('owner_panel');
      return;
    }

    setPendingStaffRecordId(created.id);
    setSsoFlowStep('pending_approval');
  };

  const handleTeacherOrSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    if (teacherAuthMode === 'google_and_pin') {
      const normalized = teacherGoogleEmail.trim().toLowerCase();
      // Master Owner emails do not require PIN if they enter their email directly, or can enter with PIN
      const isMaster =
        normalized === 'sayedkomy1@gmail.com' ||
        normalized === 'sayedkomy2@gmail.com';
      if (!isMaster && teacherPinInput.trim() !== expectedTeacherPin) {
        // Check if this is a brand new or pending teacher before rejecting PIN
        const existing = managedTeachers.find(
          (t) => t.email.toLowerCase() === normalized
        );
        if (!existing || existing.status === 'pending') {
          handleEvaluateSsoEmail(normalized, 'google');
          return;
        }
        setTeacherError('رمز المرور السري (PIN) غير صحيح.');
        return;
      }
      const res = loginWithGoogleEmail(normalized, teacherPinInput, 'google');
      if (res.requiresOnboardingCard) {
        setSsoProvider('google');
        setSsoEmailInput(normalized);
        setJoinFullName(normalized.split('@')[0] || '');
        setJoinRequestedRole(selectedPortal === 'supervisor' ? 'supervisor' : 'teacher');
        setSsoFlowStep('onboarding_card');
        return;
      }
      if (res.requiresPendingScreen) {
        setSsoProvider('google');
        setSsoEmailInput(normalized);
        if (res.pendingStaff?.id) setPendingStaffRecordId(res.pendingStaff.id);
        if (res.pendingStaff?.name) setJoinFullName(res.pendingStaff.name);
        setSsoFlowStep('pending_approval');
        return;
      }
      if (!res.ok) {
        setTeacherError(res.error || 'تعذر التحقق من البريد الإلكتروني.');
        return;
      }
      if (isMaster) {
        setAppActiveTab('owner_panel');
        return;
      }
    } else {
      if (teacherPinInput.trim() !== expectedTeacherPin) {
        setTeacherError('رمز المرور السري (PIN) غير صحيح.');
        return;
      }
      loginAsTeacher();
    }
    if (selectedPortal === 'supervisor') {
      setAppActiveTab('settings');
    } else {
      setAppActiveTab('dashboard');
    }
  };

  const handleGuardianOrStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGuardianError('');
    const result = loginAsGuardian(phone, pin);
    if (!result.ok) {
      setGuardianError(result.error || 'رقم الهاتف أو الكود السري غير صحيح');
    }
  };

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admStudentName.trim() || !admGuardianName.trim() || !admPhone.trim()) {
      return;
    }
    submitAdmissionRequest({
      studentName: admStudentName.trim(),
      age: Number(admAge) || 9,
      guardianName: admGuardianName.trim(),
      whatsappPhone: admPhone.replace(/\D/g, ''),
      countryAndTimezone: admCountry.trim(),
      preferredRiwayah: admRiwayah,
      currentLevel: admCurrentLevel,
      memorizedPartsSummary: admMemorizedSummary.trim(),
      preferredDaysAndTime: admPreferredSchedule.trim(),
      notes: admNotes.trim(),
      fatihaAudioDataUrl: fatihaAudioDataUrl || undefined,
      fatihaAudioDurationSec: fatihaAudioDuration || undefined,
    });
    setAdmSuccess(true);
  };

  const portalCards: {
    id: WelcomePortalRole;
    title: string;
    subtitle: string;
    badge: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'teacher',
      title: 'دخول المحفظ',
      subtitle: 'إدارة الحلقات والتسميع والتقييم الصوتي',
      badge: 'Google / Microsoft / PIN',
      icon: <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />,
    },
    {
      id: 'supervisor',
      title: 'دخول المشرف / المالك',
      subtitle: 'الإشراف العام، التقارير، ولوحة المالك العليا',
      badge: 'Google / Microsoft / PIN',
      icon: <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />,
    },
    {
      id: 'guardian',
      title: 'دخول ولي الأمر',
      subtitle: 'متابعة الحفظ والحضور والرسوم الشهرية',
      badge: 'رقم الهاتف + الكود',
      icon: <Users className="w-8 h-8 sm:w-10 sm:h-10" />,
    },
    {
      id: 'student',
      title: 'دخول الطالب',
      subtitle: 'الورد اليومي، المصحف، وتسجيل الواجب',
      badge: 'رقم الهاتف + الكود',
      icon: <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10" />,
    },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-emerald-950 via-[#0f291e] to-slate-950 text-slate-900 dark:text-slate-100 relative overflow-x-hidden"
    >
      {/* Subtle geometric background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Navigation & Brand Header */}
      <header className="sticky top-0 z-30 w-full bg-emerald-950/90 backdrop-blur-md border-b border-emerald-800/60">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-2xl shadow-md">
              🕌
            </div>
            <div>
              <h1 className="font-amiri text-xl sm:text-2xl font-bold text-white leading-tight">
                {settings.academyName}
              </h1>
              <p className="text-xs text-amber-300 font-semibold">
                {settings.tagline} • المنصة القرآنية المتكاملة للإقراء والمتابعة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setPublicMushafPortalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-l from-amber-400/20 to-emerald-900/90 hover:from-amber-400/30 hover:to-emerald-800 text-amber-200 border border-amber-400/40 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
              <span>بوابة المصحف العام والورد اليومي</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Portal Selection Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="w-full bg-emerald-950/60 backdrop-blur-md rounded-3xl border border-emerald-800/70 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h2 className="font-amiri text-2xl sm:text-3xl font-bold text-white leading-snug">
              اختر بوابة الدخول المناسبة لك
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80">
              اضغط على الأيقونة المخصصة لدورك لفتح نموذج التحقق والدخول الآمن
            </p>
          </div>

          {/* 4 Prominent Circular Icon Entry Buttons */}
          <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {portalCards.map((card) => {
              const isSelected = selectedPortal === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setSelectedPortal(card.id);
                    setTeacherError('');
                    setGuardianError('');
                    setSsoFlowStep('default');
                  }}
                  className={`group text-center p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-400/20 via-emerald-900/95 to-emerald-950 text-white border-amber-400 shadow-xl scale-[1.02]'
                      : 'bg-emerald-900/40 hover:bg-emerald-900/75 text-white border-emerald-800/70 hover:border-amber-400/50'
                  }`}
                >
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 text-emerald-950 ring-4 ring-amber-400/35 shadow-lg'
                        : 'bg-emerald-950/90 text-amber-300 border-2 border-amber-400/40 ring-4 ring-emerald-900/60 group-hover:border-amber-300'
                    }`}
                  >
                    {card.icon}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      {card.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-emerald-100/80 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>

                  <span
                    className={`text-[11px] font-bold pt-1 ${
                      isSelected ? 'text-amber-300' : 'text-emerald-300/80 group-hover:text-amber-200'
                    }`}
                  >
                    {isSelected ? '● اضغط لفتح النموذج' : card.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Spiritual & Educational Showcase: Faith Oasis & Circles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-emerald-800/50">
            {/* 1. Daily Ayah Reflection from Faith Oasis */}
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-700/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>قبس قرآني من واحة الإيمان</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-900/80 border border-amber-400/30 text-[10px]">
                  سورة القمر
                </span>
              </div>
              <p className="font-amiri text-base sm:text-lg text-emerald-50 text-center py-1">
                ﴿وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ﴾
              </p>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed text-center">
                تيسير الله لحفظ كتابه هو منحة ربانية لكل مقبل بقلبه؛ فاقبل على وردك وتثبيتك بحب وثبات.
              </p>
            </div>

            {/* 2. Study Circles Overview & Quick Mushaf Link */}
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-700/60 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>الحلقات القرآنية المعتمدة بالأكاديمية</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-900/80 border border-emerald-700 text-emerald-100">
                    حلقة المستوى المتقدم
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-900/80 border border-emerald-700 text-emerald-100">
                    حلقة المستوى المتوسط
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-900/80 border border-emerald-700 text-emerald-100">
                    حلقة التأسيس والناشئة
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPublicMushafPortalOpen(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-amber-200 border border-amber-400/30 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>تصفح المصحف والورد اليومي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPortal('admission')}
                  className="py-2 px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>طلب التحاق طالب جديد</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Modal Popup for Login Card — Completely hidden on the first page until a portal button is clicked */}
      {selectedPortal !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedPortal(null);
              setSsoFlowStep('default');
            }
          }}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-500/40 overflow-hidden my-auto animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Top Bar */}
            <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3 border-b border-emerald-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
                  {selectedPortal === 'teacher' && <BookOpen className="w-4 h-4" />}
                  {selectedPortal === 'supervisor' && <ShieldCheck className="w-4 h-4" />}
                  {selectedPortal === 'guardian' && <Users className="w-4 h-4" />}
                  {selectedPortal === 'student' && <GraduationCap className="w-4 h-4" />}
                  {selectedPortal === 'admission' && <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-amiri text-white">
                    {selectedPortal === 'teacher' && 'بوابة دخول وانضمام المحفظين (Google & Microsoft SSO)'}
                    {selectedPortal === 'supervisor' &&
                      'بوابة دخول المشرفين ومالك الأكاديمية (Super Admin & RBAC)'}
                    {selectedPortal === 'guardian' && 'بوابة دخول ولي الأمر'}
                    {selectedPortal === 'student' && 'بوابة دخول الطالب'}
                    {selectedPortal === 'admission' && 'نموذج طلب التحاق طالب جديد'}
                  </h3>
                  <p className="text-[11px] text-amber-200">
                    {selectedPortal === 'teacher' &&
                      'تسجيل الدخول أو الانضمام كمحفظ جديد عبر حساب Google أو Microsoft الرسمي'}
                    {selectedPortal === 'supervisor' &&
                      'دخول المالك الأعلى أو المشرفين المعتمدين أو تقديم طلب انضمام إشرافي'}
                    {selectedPortal === 'guardian' &&
                      'الدخول برقم الهاتف المسجل والكود السري الذي يولده الشيخ للطالب'}
                    {selectedPortal === 'student' &&
                      'الدخول برقم الهاتف والكود السري لفتح الورد اليومي والمصحف التفاعلي'}
                    {selectedPortal === 'admission' &&
                      'سجّل بيانات الطالب الجديد ليتم تحديد مستواه وإلحاقه بالحلقة المناسبة'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedPortal !== 'admission' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPortal('admission');
                      setAdmSuccess(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>تسجيل طالب جديد</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPortal('guardian')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-950 text-amber-200 border border-amber-400/30 text-xs font-bold cursor-pointer"
                  >
                    العودة لتسجيل الدخول ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPortal(null);
                    setSsoFlowStep('default');
                  }}
                  title="إغلاق نافذة الدخول والعودة للصفحة الرئيسية"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-red-600/90 text-white border border-emerald-700/60 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق</span>
                </button>
              </div>
            </div>

            {/* Card Form Content */}
            <div className="p-6">
              {/* PORTAL 1 & 2: TEACHER OR SUPERVISOR LOGIN (Google & Microsoft OAuth + Onboarding + Pending Screen) */}
              {(selectedPortal === 'teacher' || selectedPortal === 'supervisor') && (
                <div className="space-y-4">
                  {/* STEP A: PENDING OWNER APPROVAL SCREEN (شاشة انتظار موافقة المالك) */}
                  {ssoFlowStep === 'pending_approval' && (
                    <div className="p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border-2 border-amber-400/80 dark:border-amber-700 space-y-4 text-center animate-in fade-in">
                      <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-2xl">
                        ⏳
                      </div>
                      <div className="space-y-1.5">
                        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-black border border-amber-500/40">
                          حالة الحساب: قيد انتظار موافقة المالك (Pending Approval)
                        </span>
                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                          تم تسجيل طلبك بنجاح ببريدك الإلكتروني ({ssoEmailInput})
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
                          حسابك الآن قيد المراجعة والتفعيل من قِبل مالك الأكاديمية. بمجرد اعتماد حسابك وتخصيص حلقاتك وصلاحياتك، ستفتح لك لوحة التحكم تلقائياً.
                        </p>
                      </div>

                      {activePendingMember?.status === 'active' ? (
                        <div className="p-3.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 text-emerald-900 dark:text-emerald-200 space-y-2">
                          <div className="text-xs font-black flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>🎉 مبروك! تم تفعيل حسابك الآن من قِبل مالك الأكاديمية</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleEvaluateSsoEmail(ssoEmailInput, ssoProvider)
                            }
                            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer shadow-md"
                          >
                            الدخول الفوري إلى لوحة التحكم الآن ←
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                          <a
                            href={`https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}?text=${encodeURIComponent(
                              `السلام عليكم ورحمة الله وبركاته، قمت بالتسجيل في أكاديمية الإمام لتحفيظ القرآن الكريم:\n• الاسم: ${
                                joinFullName || activePendingMember?.name || ssoEmailInput
                              }\n• البريد الإلكتروني: ${ssoEmailInput}\n• المنصب المطلوب: ${
                                joinRequestedRole === 'supervisor'
                                  ? 'مشرف تعليمي'
                                  : 'محفظ حلقة'
                              }\nأرجو التكرم بمراجعة الطلب وتفعيل الحساب من لوحة المالك.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-l from-[#25D366] to-[#128C7E] hover:opacity-95 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>إرسال إشعار للمالك عبر واتساب لتفعيل الحساب</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setSsoFlowStep('default')}
                            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            العودة لبوابة الدخول
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP B: QUICK JOIN CARD FOR NEW STAFF (بطاقة الانضمام السريعة للمحفظين والمشرفين الجدد) */}
                  {ssoFlowStep === 'onboarding_card' && (
                    <form
                      onSubmit={handleQuickJoinCardSubmit}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border-2 border-emerald-600/50 space-y-4 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                        <div>
                          <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 block">
                            ✨ مرحباً بك في الكادر التعليمي والإشرافي لأكاديمية الإمام
                          </span>
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                            بطاقة الانضمام السريعة ({ssoProvider === 'microsoft' ? 'حساب Microsoft' : 'حساب Google'})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSsoFlowStep('default')}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          تغيير الحساب ←
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            البريد الإلكتروني المتصل *
                          </label>
                          <input
                            type="email"
                            dir="ltr"
                            value={ssoEmailInput}
                            onChange={(e) => setSsoEmailInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-left"
                            required
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            الاسم الثلاثي الكامل *
                          </label>
                          <input
                            type="text"
                            value={joinFullName}
                            onChange={(e) => setJoinFullName(e.target.value)}
                            placeholder="مثال: الشيخ محمد أحمد محمود"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                            required
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            رقم الواتساب للتواصل والتفعيل *
                          </label>
                          <input
                            type="tel"
                            dir="ltr"
                            value={joinWhatsapp}
                            onChange={(e) => setJoinWhatsapp(e.target.value)}
                            placeholder="201000000000"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-left"
                            required
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            المنصب المطلوب بالأكاديمية *
                          </label>
                          <select
                            value={joinRequestedRole}
                            onChange={(e) =>
                              setJoinRequestedRole(
                                e.target.value as 'teacher' | 'supervisor'
                              )
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                          >
                            <option value="teacher">محفظ حلقة قرآنية</option>
                            <option value="supervisor">مشرف تعليمي وعام</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            التخصص / الإجازات القرآنية والخبرات *
                          </label>
                          <input
                            type="text"
                            value={joinSpecialization}
                            onChange={(e) => setJoinSpecialization(e.target.value)}
                            placeholder="مثال: مجاز برواية حفص وشعبة، خبرة 5 سنوات في تحفيظ الناشئة والتأسيس"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                            required
                          />
                        </div>
                      </div>

                      {teacherError && (
                        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs text-red-700 font-bold">
                          {teacherError}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setSsoFlowStep('default')}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer shadow-md"
                        >
                          إرسال طلب الانضمام لموافقة المالك ✓
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP C: INLINE SSO ACCOUNT CHOOSER (عند حظر النوافذ المنبثقة في المتصفح أو لاختيار الحساب السريع) */}
                  {ssoFlowStep === 'sso_email_prompt' && (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-emerald-600/50 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                        <div className="flex items-center gap-2.5">
                          {ssoProvider === 'google' ? (
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                              />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 shrink-0" viewBox="0 0 23 23">
                              <path fill="#f25022" d="M1 1h10v10H1z" />
                              <path fill="#00a4ef" d="M1 12h10v10H1z" />
                              <path fill="#7fba00" d="M12 1h10v10H12z" />
                              <path fill="#ffb900" d="M12 12h10v10H12z" />
                            </svg>
                          )}
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              المتابعة عبر حساب {ssoProvider === 'microsoft' ? 'Microsoft' : 'Google'} المعتمد
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              أدخل بريدك الإلكتروني للدخول الفوري أو فتح بطاقة الانضمام للمحفظين الجدد
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSsoFlowStep('default')}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          رجوع ←
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            البريد الإلكتروني ({ssoProvider === 'microsoft' ? 'Outlook / Hotmail / Microsoft' : 'Gmail / Google'}):
                          </label>
                          <input
                            type="email"
                            dir="ltr"
                            value={ssoEmailInput}
                            onChange={(e) => setSsoEmailInput(e.target.value)}
                            placeholder={
                              ssoProvider === 'microsoft'
                                ? 'teacher@outlook.com'
                                : 'teacher@gmail.com'
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>

                        {/* Quick Account Selector Chips for Instant Verification */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 block">
                            أو اختر حساباً مسجلاً للتجربة الفورية:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleEvaluateSsoEmail('sayedkomy1@gmail.com', ssoProvider)
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/60 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold cursor-pointer"
                            >
                              👑 sayedkomy1@gmail.com (المالك الأعلى)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleEvaluateSsoEmail('sayedkomy2@gmail.com', ssoProvider)
                              }
                              className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/60 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold cursor-pointer"
                            >
                              👑 sayedkomy2@gmail.com (المالك الأعلى)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSsoEmailInput('new.teacher@gmail.com');
                                handleEvaluateSsoEmail('new.teacher@gmail.com', ssoProvider);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold cursor-pointer"
                            >
                              ➕ تجربة انضمام محفظ جديد
                            </button>
                          </div>
                        </div>

                        {teacherError && (
                          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs text-red-700 font-bold">
                            {teacherError}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleEvaluateSsoEmail(ssoEmailInput, ssoProvider)
                          }
                          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-black cursor-pointer shadow-md"
                        >
                          متابعة والتحقق من الصلاحيات ←
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP D: DEFAULT TEACHER / SUPERVISOR LOGIN VIEW */}
                  {ssoFlowStep === 'default' && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
                      {googleAuthUser && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-emerald-900 dark:text-emerald-200">
                              حساب متصل: {googleAuthUser.displayName} ({googleAuthUser.email})
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Two Official SSO Buttons: Google & Microsoft */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* 1. Google Official SSO Button */}
                        <button
                          type="button"
                          disabled={googleLoading || microsoftLoading}
                          onClick={() =>
                            void handleOAuthProviderClick('google', selectedPortal)
                          }
                          className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50/60 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-xs border-2 border-emerald-600/40 hover:border-emerald-600 shadow-sm flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
                        >
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              fill="#4285F4"
                              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                            />
                          </svg>
                          <span>
                            {googleLoading
                              ? 'جارٍ الاتصال بـ Google...'
                              : 'تسجيل الدخول / الانضمام عبر حساب Google'}
                          </span>
                        </button>

                        {/* 2. Microsoft Official SSO Button */}
                        <button
                          type="button"
                          disabled={googleLoading || microsoftLoading}
                          onClick={() =>
                            void handleOAuthProviderClick('microsoft', selectedPortal)
                          }
                          className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50/60 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-xs border-2 border-blue-600/40 hover:border-blue-600 shadow-sm flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
                        >
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 23 23" aria-hidden="true">
                            <path fill="#f25022" d="M1 1h10v10H1z" />
                            <path fill="#00a4ef" d="M1 12h10v10H1z" />
                            <path fill="#7fba00" d="M12 1h10v10H12z" />
                            <path fill="#ffb900" d="M12 12h10v10H12z" />
                          </svg>
                          <span>
                            {microsoftLoading
                              ? 'جارٍ الاتصال بـ Microsoft...'
                              : 'تسجيل الدخول / الانضمام عبر حساب Microsoft'}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        <span>أو عبر البريد المعتمد ورمز المرور السري (PIN)</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                      </div>

                      <form onSubmit={handleTeacherOrSupervisorSubmit} className="space-y-3.5">
                        <div className="flex gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setTeacherAuthMode('google_and_pin')}
                            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                              teacherAuthMode === 'google_and_pin'
                                ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            البريد الإلكتروني (Google / Microsoft) + PIN
                          </button>
                          <button
                            type="button"
                            onClick={() => setTeacherAuthMode('pin_only')}
                            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                              teacherAuthMode === 'pin_only'
                                ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            رمز المرور السري (PIN) فقط
                          </button>
                        </div>

                        {teacherAuthMode === 'google_and_pin' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              {selectedPortal === 'supervisor'
                                ? 'البريد الإلكتروني للمالك أو المشرف:'
                                : 'البريد الإلكتروني للمحفظ:'}
                            </label>
                            <div className="relative">
                              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                              <input
                                type="email"
                                dir="ltr"
                                value={teacherGoogleEmail}
                                onChange={(e) => setTeacherGoogleEmail(e.target.value)}
                                placeholder="sayedkomy1@gmail.com / teacher@example.com"
                                autoComplete="username"
                                className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-600"
                                required
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {selectedPortal === 'supervisor'
                              ? 'رمز المرور السري (PIN):'
                              : 'رمز مرور المحفظ السري (PIN):'}
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                            <input
                              type="password"
                              dir="ltr"
                              value={teacherPinInput}
                              onChange={(e) => {
                                setTeacherPinInput(e.target.value);
                                if (teacherError) setTeacherError('');
                              }}
                              placeholder="••••"
                              maxLength={12}
                              autoComplete="current-password"
                              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-600"
                              required={
                                teacherAuthMode === 'pin_only' ||
                                (teacherGoogleEmail.trim().toLowerCase() !==
                                  'sayedkomy1@gmail.com' &&
                                  teacherGoogleEmail.trim().toLowerCase() !==
                                    'sayedkomy2@gmail.com')
                              }
                            />
                          </div>
                        </div>

                        {teacherError && (
                          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-semibold flex items-start justify-between gap-2 animate-in fade-in">
                            <div className="flex-1 space-y-1">
                              <p>{teacherError}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setTeacherAuthMode('pin_only');
                                  setTeacherError('');
                                }}
                                className="text-[11px] text-emerald-700 dark:text-emerald-300 underline font-bold cursor-pointer block"
                              >
                                ← أو استخدم رمز المرور السري (PIN) فقط للدخول السريع
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTeacherError('')}
                              className="text-red-500 hover:text-red-800 dark:hover:text-red-200 p-0.5 rounded cursor-pointer shrink-0"
                              title="إخفاء التنبيه"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <Lock className="w-4 h-4" />
                          <span>
                            {selectedPortal === 'supervisor'
                              ? 'تسجيل الدخول للوحة المالك / الإشراف العام'
                              : 'تسجيل الدخول للوحة المحفظ والحلقات'}
                          </span>
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

            {/* PORTAL 3 & 4: GUARDIAN OR STUDENT LOGIN (Google Sign-In or Phone + PIN) */}
            {(selectedPortal === 'guardian' || selectedPortal === 'student') && (
              <div className="space-y-4">
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={() => void handleOAuthProviderClick('google', selectedPortal)}
                  className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50/60 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold text-xs sm:text-sm border-2 border-emerald-600/40 hover:border-emerald-600 shadow-md flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>
                    {googleLoading
                      ? 'جارٍ التحقق من حساب Google...'
                      : selectedPortal === 'guardian'
                      ? 'تسجيل الدخول لولي الأمر بحساب Google المرتبط'
                      : 'تسجيل الدخول للطالب بحساب Google المرتبط'}
                  </span>
                </button>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span>أو عبر رقم الهاتف والكود السري</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>
                <form onSubmit={handleGuardianOrStudentSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {selectedPortal === 'guardian'
                        ? 'رقم هاتف ولي الأمر المسجل بالأكاديمية (واتساب):'
                        : 'رقم الهاتف المسجل لملف الطالب:'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01000000001"
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {selectedPortal === 'guardian'
                        ? 'الكود السري للمتابعة (الذي يولده الشيخ لولي الأمر):'
                        : 'كود الطالب السري (المُسلّم من الشيخ):'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="password"
                        dir="ltr"
                        maxLength={8}
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value);
                          if (guardianError) setGuardianError('');
                        }}
                        placeholder="••••••"
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        required
                      />
                    </div>
                  </div>

                  {guardianError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                      <span>{guardianError}</span>
                      <button
                        type="button"
                        onClick={() => setGuardianError('')}
                        className="text-red-500 hover:text-red-800 dark:hover:text-red-200 p-0.5 rounded cursor-pointer shrink-0"
                        title="إخفاء التنبيه"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>
                      {selectedPortal === 'guardian'
                        ? 'دخول بوابة ولي الأمر وتقارير المتابعة'
                        : 'دخول بوابة الطالب والورد اليومي'}
                    </span>
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    {selectedPortal === 'student'
                      ? 'هل تريد التدرب على التلاوة والحفظ بدون كود؟'
                      : 'هل ترغب في تسجيل طالب جديد بالأكاديمية؟'}
                  </span>
                  {selectedPortal === 'student' ? (
                    <button
                      type="button"
                      onClick={loginAsGuest}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      فتح مركز التلاوة والتدرب الذاتي ←
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedPortal('admission')}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      تقديم طلب التحاق طالب جديد ←
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PORTAL 5: NEW STUDENT ADMISSION FORM */}
            {selectedPortal === 'admission' && (
              <div>
                {admSuccess ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">
                      تم إرسال طلب الالتحاق بنجاح!
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      تم تسجيل بيانات الطالب في قائمة القبول لدى إدارة الحلقات لتحديد موعد المقابلة الصوتية وتوليد كود الدخول الخاص به.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      <a
                        href={`https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}?text=${encodeURIComponent(
                          `السلام عليكم ورحمة الله وبركاته، قمت بتسجيل طلب التحاق جديد للطالب (${admStudentName}) في أكاديمية الإمام لتحفيظ القرآن الكريم.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        تأكيد الموعد عبر واتساب الأكاديمية
                      </a>
                      <button
                        type="button"
                        onClick={() => setAdmSuccess(false)}
                        className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                      >
                        تقديم طلب آخر
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAdmissionSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          اسم الطالب رباعياً *
                        </label>
                        <input
                          type="text"
                          value={admStudentName}
                          onChange={(e) => setAdmStudentName(e.target.value)}
                          placeholder="اسم الطالب..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          العمر (سنوات) *
                        </label>
                        <input
                          type="number"
                          min={4}
                          max={80}
                          value={admAge}
                          onChange={(e) => setAdmAge(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          اسم ولي الأمر *
                        </label>
                        <input
                          type="text"
                          value={admGuardianName}
                          onChange={(e) => setAdmGuardianName(e.target.value)}
                          placeholder="اسم ولي الأمر..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رقم واتساب للتواصل (مع كود الدولة) *
                        </label>
                        <input
                          type="tel"
                          dir="ltr"
                          value={admPhone}
                          onChange={(e) => setAdmPhone(e.target.value)}
                          placeholder="2010..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          الرواية المطلوبة
                        </label>
                        <select
                          value={admRiwayah}
                          onChange={(e) => setAdmRiwayah(e.target.value as QuranRiwayah)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        >
                          <option value="حفص عن عاصم">رواية حفص عن عاصم</option>
                          <option value="ورش عن نافع">رواية ورش عن نافع</option>
                          <option value="قالون عن نافع">رواية قالون عن نافع</option>
                          <option value="شعبة عن عاصم">رواية شعبة عن عاصم</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          المستوى الحالي ومقدار الحفظ
                        </label>
                        <input
                          type="text"
                          value={admMemorizedSummary}
                          onChange={(e) => setAdmMemorizedSummary(e.target.value)}
                          placeholder="مثال: جزء عمّ / مبتدئ بالتأسيس"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        />
                      </div>
                    </div>

                    {/* التسجيل الصوتي لتلاوة سورة الفاتحة لتحديد المستوى الأولي */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-400/40 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                        <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Mic className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>تسجيل تلاوة سورة الفاتحة لتحديد المستوى الأولي (اختياري)</span>
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          بصوت الطالب (حتى 60 ثانية)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isRecordingFatiha ? (
                          <button
                            type="button"
                            onClick={handleStopFatihaRecording}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 animate-pulse cursor-pointer shadow-sm"
                          >
                            <Square className="w-3.5 h-3.5 fill-white" />
                            <span>إيقاف وحفظ التلاوة ({fatihaRecordingSec} ثانية)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStartFatihaRecording}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>{fatihaAudioDataUrl ? 'إعادة تسجيل التلاوة 🎙️' : 'بدء تسجيل تلاوة الفاتحة 🎙️'}</span>
                          </button>
                        )}

                        {fatihaAudioDataUrl && (
                          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                            <audio
                              controls
                              src={fatihaAudioDataUrl}
                              className="h-8 flex-1 max-w-[280px]"
                            />
                            <button
                              type="button"
                              onClick={handleClearFatihaRecording}
                              className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300 cursor-pointer"
                              title="حذف التسجيل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                        تُعرض التلاوة للشيخ مباشرة في لوحة التحكم للاستماع وتقييم النطق والتسكين بالحلقة المناسبة.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                    >
                      إرسال طلب الالتحاق وتحديد المستوى
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Calm Footer Bar */}
      <footer className="relative z-10 w-full bg-emerald-950/90 border-t border-amber-400/20 px-4 py-3 text-emerald-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-right">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-300 font-bold">🌿 وقف قرآني وصدقة جارية —</span>
            <span className="text-emerald-100/90">
              اللهم اجعل ثواب هذا المصحف وتلاوته وحفظه صدقة جارية ونوراً ورحمة لوالدينا وأمواتنا وأموات المسلمين أجمعين
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSadaqahModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-amber-300" />
              <span>تفاصيل الوقف القرآني ({waqfImpactStats.ameenPrayersCount.toLocaleString('ar-EG')})</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Independent Popup Modal for "بوابة الصدقة الجارية" */}
      {sadaqahModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-950 text-white border-2 border-amber-400/50 shadow-2xl p-6 space-y-5 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-xl">
                  🌿
                </div>
                <div>
                  <h3 className="font-amiri text-xl sm:text-2xl font-bold text-amber-300">
                    بوابة الصدقة الجارية والوقف القرآني العام
                  </h3>
                  <p className="text-xs text-emerald-200">
                    {WAQF_DEDICATION_TEXT.header}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSadaqahModalOpen(false)}
                className="p-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 cursor-pointer"
                aria-label="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Waqf Dedication & Preserved Family Memorial Names */}
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-amber-400/30 space-y-3">
              <p className="font-amiri text-base sm:text-lg text-emerald-50 leading-relaxed">
                {WAQF_DEDICATION_TEXT.intro}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WAQF_DEDICATION_TEXT.names.map((personName, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-900/70 border border-amber-400/30 text-amber-100 text-xs sm:text-sm font-bold flex items-center gap-2"
                  >
                    <span className="text-amber-400">✨</span>
                    <span>{personName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Impact Metrics of the Sadaqah Jariyah Portal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-emerald-900/50 border border-emerald-700/60">
                <div className="text-lg font-extrabold text-amber-300 font-mono">
                  {waqfImpactStats.totalPagesRead.toLocaleString('ar-EG')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-0.5">صفحة مقروءة في الوقف</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-900/50 border border-emerald-700/60">
                <div className="text-lg font-extrabold text-amber-300 font-mono">
                  {waqfImpactStats.totalJuzRead.toLocaleString('ar-EG')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-0.5">جزء قرآني متلو</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-900/50 border border-emerald-700/60">
                <div className="text-lg font-extrabold text-amber-300 font-mono">
                  {waqfImpactStats.completedKhatmahsCount.toLocaleString('ar-EG')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-0.5">ختمة قرآنية مباركة</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-900/50 border border-emerald-700/60">
                <div className="text-lg font-extrabold text-amber-300 font-mono">
                  {waqfImpactStats.ameenPrayersCount.toLocaleString('ar-EG')}
                </div>
                <div className="text-[11px] text-emerald-100 mt-0.5">دعوة وتأمين للوقف</div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-emerald-800/80">
              <button
                type="button"
                onClick={() => recordWaqfAmeenPrayer()}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 border border-amber-400/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>{WAQF_DEDICATION_TEXT.ameenButtonLabel} ({waqfImpactStats.ameenPrayersCount.toLocaleString('ar-EG')})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSadaqahModalOpen(false);
                  setPublicMushafPortalOpen(true);
                }}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-l from-amber-400 via-amber-300 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-emerald-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-950" />
                <span>فتح المصحف الشريف والورد اليومي الكامل</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

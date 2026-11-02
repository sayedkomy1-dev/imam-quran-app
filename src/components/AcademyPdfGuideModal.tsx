import React from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Crown,
  Download,
  FileText,
  GraduationCap,
  Heart,
  Layers,
  Mail,
  MessageCircle,
  Mic,
  Phone,
  Printer,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { ACADEMY_BRAND_CONFIG } from '../constants/brandConfig';

interface AcademyPdfGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcademyPdfGuideModal: React.FC<AcademyPdfGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-4xl rounded-3xl overflow-hidden border-2 border-amber-400/70 bg-[#fffdf7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (Hidden in Print) */}
        <div className="bg-gradient-to-l from-emerald-950 via-[#0d3b26] to-teal-950 px-5 py-4 text-white flex flex-wrap items-center justify-between gap-3 border-b border-amber-400/40 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-amber-300">
                  الدليل التعريفي المصور للأكاديمية ونظام المصحف التفاعلي (الإصدار 2.0.0)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/50 text-[11px] font-black text-white">
                  {ACADEMY_BRAND_CONFIG.slogan}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                دليل إرشادي شامل للطالب وولي الأمر والمحفظ والزائر — جاهز للطباعة أو الحفظ كملف PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ الدليل كملف PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white transition cursor-pointer"
              title="إغلاق الدليل"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
          {/* Official Header Stamp */}
          <div className="rounded-3xl border-2 border-amber-500/70 bg-gradient-to-br from-emerald-950 via-[#0a2e1f] to-emerald-900 text-white p-6 text-center space-y-3 shadow-lg">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-black">
              <Sparkles className="w-4 h-4" />
              <span>بسم الله الرحمن الرحيم • {ACADEMY_BRAND_CONFIG.slogan}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-quran text-amber-300">
              {ACADEMY_BRAND_CONFIG.platformName} ({ACADEMY_BRAND_CONFIG.slogan})
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto leading-relaxed font-semibold">
              المنظومة القرآنية الذكية المتكاملة للإقراء، التحفيظ، السند المتصل، المصحف التفاعلي (604 صفحة)، التفسير المزدوج، والوقف القرآني والصدقة الجارية.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-amber-200 font-bold">
              <span>تصميم وتطوير: {ACADEMY_BRAND_CONFIG.creatorNameEn}</span>
              <span>•</span>
              <span dir="ltr">WhatsApp: {ACADEMY_BRAND_CONFIG.whatsappNumber}</span>
              <span>•</span>
              <span dir="ltr">{ACADEMY_BRAND_CONFIG.primaryEmail}</span>
            </div>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. QuranicPage Engine & Mushaf v2.0.0 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-600/40 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-amber-300 font-black text-sm sm:text-base">
                <BookOpen className="w-5 h-5 text-amber-500 shrink-0" />
                <span>١. محرك المصحف التفاعلي (QuranicPage Engine 2.0)</span>
              </div>
              <ul className="space-y-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تصفح 604 صفحة بالسحب الأفقي السلس (RTL Swipe) مع وضع الصفحة الواحدة أو المصحف المفتوح (صفحتين متقابلتين).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>التبديل الفوري بين 3 طبعات: النص العثماني التفاعلي الملون بالتجويد، مصحف المدينة المنورة المصور، ومصحف الشمرلي المصري.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>فهرس جانبي ذكي (Drawer) يضم الـ 114 سورة، الـ 30 جزءاً والـ 240 ربعاً، البحث الفوري بدون تشكيل، والفواصل الملونة الثلاثة.</span>
                </li>
              </ul>
            </div>

            {/* 2. Audio, Memorization & Dual Tafseer */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-500/50 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-amber-300 font-black text-sm sm:text-base">
                <Mic className="w-5 h-5 text-amber-500 shrink-0" />
                <span>٢. محرك الصوتيات والتحفيظ والتفسير المزدوج</span>
              </div>
              <ul className="space-y-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>نخبة القراء: الشيخ الحصري (المرتل والمعلم)، د. أيمن سويد (للتجويد والمخارج)، المنشاوي، عبد الباسط، العفاسي، المعيقلي، والحذيفي.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تكرار الآية (1–10 مرات أو ∞) وتكرار نطاق الآيات مع «فترة سكت ذكية» بعد كل آية ليردد الطالب خلف الشيخ.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>تفسير مزدوج يعمل أوفلاين عبر IndexedDB (التفسير الميسر + تفسير الجلالين) مع مشاركة الآية كبطاقة مصورة فاخرة.</span>
                </li>
              </ul>
            </div>

            {/* 3. Student & Parent Portals */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-600/40 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-amber-300 font-black text-sm sm:text-base">
                <GraduationCap className="w-5 h-5 text-amber-500 shrink-0" />
                <span>٣. بوابة الطالب الذكية وبوابة ولي الأمر التنفيذية</span>
              </div>
              <ul className="space-y-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>غرفة التدريب والحفظ الذاتي للطالب: تفتح الواجب القادم تلقائياً مع زر «ابدأ جلسة الحفظ الذكي» وإخفاء الكلمات والتسجيل الصوتي.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>خريطة الإتقان الحرارية للسور (Surah Mastery Heatmap)، الحصون الخمسة، ولوحة الأوسمة والمسابقات التنافسية.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>بوابة ولي الأمر: متابعة الحضور والتقييم، الاستماع لتسجيلات الابن وملاحظات المعلم، وتحميل «تقرير الحصاد الشهري PDF».</span>
                </li>
              </ul>
            </div>

            {/* 4. Waqf, Sadaqah Jariyah & Teacher/Owner Suite */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-500/40 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-amber-300 font-black text-sm sm:text-base">
                <Heart className="w-5 h-5 text-rose-500 shrink-0" />
                <span>٤. منظومة الوقف والصدقة الجارية ولوحة المالك والمحفظ</span>
              </div>
              <ul className="space-y-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>مولد الصدقة الجارية القابل للمشاركة: إنشاء رابط مصحف وقفي مخصص (`?waqf=...`) وبطاقة دعاء فاخرة باسم الوالدين أو المتوفى.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>مكتبة الأذكار ودعاء الختم والرقية الشرعية المدمجة مع مسبحة إلكترونية تفاعلية.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>محرك الحصة الخماسي، السبورة الذكية التفاعلية، ونظام صلاحيات المالك والمشرفين (RBAC & Hybrid Auth).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Official Footer Stamp for Print & PDF */}
          <div className="rounded-2xl bg-emerald-950 text-white p-5 border border-amber-400/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <div className="text-sm font-black text-amber-300">
                {ACADEMY_BRAND_CONFIG.printAndBoardFooterText}
              </div>
              <div className="text-xs text-emerald-200">
                البريد الرسمي: {ACADEMY_BRAND_CONFIG.primaryEmail} • {ACADEMY_BRAND_CONFIG.secondaryEmail}
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <a
                href={ACADEMY_BRAND_CONFIG.whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل عبر واتساب ({ACADEMY_BRAND_CONFIG.whatsappNumber})</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

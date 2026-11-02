import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Copy,
  FileText,
  HeadphonesIcon,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { ACADEMY_BRAND_CONFIG } from '../constants/brandConfig';
import { AcademyPdfGuideModal } from './AcademyPdfGuideModal';

interface DeveloperSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperSupportModal: React.FC<DeveloperSupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<'phone' | 'email1' | 'email2' | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (text: string, field: 'phone' | 'email1' | 'email2') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2200);
    } catch {
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 print:hidden"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden border-2 border-amber-400/50 bg-gradient-to-b from-[#062c21] via-[#041f17] to-[#02130e] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Ornamental Gold Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-emerald-400" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-amber-200 transition cursor-pointer"
          aria-label="إغلاق البطاقة"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header Badge & Academy Logo */}
          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/25 to-emerald-500/20 border-2 border-amber-400/60 flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-amber-300" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>أكاديمية الإمام — {ACADEMY_BRAND_CONFIG.slogan}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white font-quran tracking-wide">
              {ACADEMY_BRAND_CONFIG.platformName}
            </h3>
            <p className="text-xs text-emerald-200/85">
              بطاقة الهوية الرقمية وحقوق التصميم والتطوير ومركز التواصل المباشر
            </p>
          </div>

          {/* Creator & System Founder Luxury Box */}
          <div className="rounded-2xl bg-white/5 border border-amber-400/30 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                مُنشئ ومؤسس ومطور النظام:
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                المالك والمعماري الرسمي
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-white tracking-tight">
              {ACADEMY_BRAND_CONFIG.creatorFullLabel}
            </div>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              جميع حقوق التصميم والهندسة البرمجية وتطوير منظومة الحلقات والسبورة الذكية محفوظة رسمياً لـ{' '}
              <span className="text-amber-300 font-bold">
                {ACADEMY_BRAND_CONFIG.creatorNameEn}
              </span>
              .
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-3">
            {/* Green Direct WhatsApp Button */}
            <div className="flex items-stretch gap-2">
              <a
                href={ACADEMY_BRAND_CONFIG.whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-5 h-5 shrink-0" />
                <span>💬 تواصل مباشر عبر واتساب ({ACADEMY_BRAND_CONFIG.whatsappNumber})</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopy(ACADEMY_BRAND_CONFIG.whatsappNumber, 'phone')}
                className="px-3.5 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-400/30 text-emerald-100 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer shrink-0"
                title="نسخ رقم الواتساب"
              >
                {copiedField === 'phone' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span className="text-[11px] text-emerald-300">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-[11px]">نسخ</span>
                  </>
                )}
              </button>
            </div>

            {/* Blue/Gold Direct Email Button (Primary) */}
            <div className="flex items-stretch gap-2">
              <a
                href={`mailto:${ACADEMY_BRAND_CONFIG.primaryEmail}`}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition"
              >
                <Mail className="w-5 h-5 shrink-0" />
                <span>✉️ مراسلة عبر البريد الإلكتروني ({ACADEMY_BRAND_CONFIG.primaryEmail})</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopy(ACADEMY_BRAND_CONFIG.primaryEmail, 'email1')}
                className="px-3.5 rounded-2xl bg-amber-900/50 hover:bg-amber-800/70 border border-amber-400/40 text-amber-100 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer shrink-0"
                title="نسخ البريد الإلكتروني الأول"
              >
                {copiedField === 'email1' ? (
                  <>
                    <Check className="w-4 h-4 text-amber-300" />
                    <span className="text-[11px] text-amber-300">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-[11px]">نسخ</span>
                  </>
                )}
              </button>
            </div>

            {/* Secondary Official Email Row */}
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center gap-2 text-emerald-100 truncate">
                <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-emerald-200/80">البريد الرسمي الثاني:</span>
                <a
                  href={`mailto:${ACADEMY_BRAND_CONFIG.secondaryEmail}`}
                  className="font-mono font-bold text-white hover:text-amber-300 underline truncate"
                >
                  {ACADEMY_BRAND_CONFIG.secondaryEmail}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(ACADEMY_BRAND_CONFIG.secondaryEmail, 'email2')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-amber-200 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedField === 'email2' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ البريد</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Slogan Stamp */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-200/80">
            <span className="font-bold text-amber-300">
              {ACADEMY_BRAND_CONFIG.signatureFooterText}
            </span>
            <span className="font-mono text-emerald-300" dir="ltr">
              {ACADEMY_BRAND_CONFIG.whatsappNumber}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DeveloperSignatureFooterProps {
  onOpenModal: () => void;
  variant?: 'dark' | 'light' | 'compact';
  className?: string;
}

export const DeveloperSignatureFooter: React.FC<DeveloperSignatureFooterProps> = ({
  onOpenModal,
  variant = 'light',
  className = '',
}) => {
  const [pdfGuideOpen, setPdfGuideOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <>
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-950/60 border border-amber-400/25 text-[11px] text-emerald-100/90 ${className}`}
        >
          <button
            type="button"
            onClick={onOpenModal}
            className="text-right hover:text-amber-300 transition font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>تصميم وتطوير: </span>
            <span className="text-amber-300 underline decoration-amber-400/60">
              {ACADEMY_BRAND_CONFIG.creatorNameEn}
            </span>
            <span>© 2026 — {ACADEMY_BRAND_CONFIG.slogan}</span>
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPdfGuideOpen(true)}
              className="px-2 py-0.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-600 border border-emerald-400/40 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-amber-300" />
              <span>الدليل التعريفي PDF</span>
            </button>
            <button
              type="button"
              onClick={onOpenModal}
              className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold text-[10px] transition cursor-pointer"
            >
              تواصل مع الإدارة / المطور
            </button>
          </div>
        </div>
        <AcademyPdfGuideModal
          isOpen={pdfGuideOpen}
          onClose={() => setPdfGuideOpen(false)}
        />
      </>
    );
  }

  const isDark = variant === 'dark';

  return (
    <>
      <footer
        className={`w-full rounded-2xl border px-4 py-3 transition print:hidden ${
          isDark
            ? 'bg-emerald-950/75 border-amber-400/30 text-emerald-100'
            : 'bg-gradient-to-r from-emerald-950 via-[#062c21] to-emerald-950 border-amber-400/40 text-white shadow-md'
        } ${className}`}
        dir="rtl"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-[11px]">
              {ACADEMY_BRAND_CONFIG.slogan}
            </span>
            <span className="text-emerald-100 font-semibold">
              تصميم وتطوير:{' '}
              <button
                type="button"
                onClick={onOpenModal}
                className="font-black text-amber-300 hover:text-amber-200 underline decoration-amber-400/60 cursor-pointer transition"
              >
                {ACADEMY_BRAND_CONFIG.creatorNameEn}
              </button>{' '}
              © 2026 — {ACADEMY_BRAND_CONFIG.slogan}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPdfGuideOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-amber-400/40 text-amber-200 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>📄 الدليل التعريفي للأكاديمية PDF</span>
            </button>
            <button
              type="button"
              onClick={onOpenModal}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>تواصل مع الإدارة / المطور</span>
            </button>
            <a
              href={ACADEMY_BRAND_CONFIG.whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span dir="ltr">{ACADEMY_BRAND_CONFIG.whatsappNumber}</span>
            </a>
          </div>
        </div>
      </footer>
      <AcademyPdfGuideModal
        isOpen={pdfGuideOpen}
        onClose={() => setPdfGuideOpen(false)}
      />
    </>
  );
};

interface QuickSupportFloatingButtonProps {
  onOpenDeveloperModal: () => void;
}

export const QuickSupportFloatingButton: React.FC<QuickSupportFloatingButtonProps> = ({
  onOpenDeveloperModal,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-[140] print:hidden" dir="rtl">
      {menuOpen && (
        <div className="mb-2.5 w-72 rounded-2xl bg-[#042219] border-2 border-amber-400/50 text-white shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-black text-amber-200">
                الدعم السريع — {ACADEMY_BRAND_CONFIG.slogan}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="text-emerald-200 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-emerald-100/85 leading-relaxed">
            هل نسيت رمز الـ PIN أو تحتاج مساعدة في تسجيل الدخول أو تفعيل الحساب؟ تواصل مباشرة مع إدارة الأكاديمية:
          </p>

          <div className="space-y-2">
            <a
              href={ACADEMY_BRAND_CONFIG.quickSupportPinHelpWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow transition"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>واتساب الدعم المباشر ({ACADEMY_BRAND_CONFIG.whatsappCleanNumber})</span>
            </a>

            <a
              href={`mailto:${ACADEMY_BRAND_CONFIG.primaryEmail}?subject=${encodeURIComponent(
                'طلب دعم فني — أكاديمية الإمام (بالقرآن نحيا)'
              )}`}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>مراسلة البريد ({ACADEMY_BRAND_CONFIG.primaryEmail})</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenDeveloperModal();
              }}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>بطاقة المطور: {ACADEMY_BRAND_CONFIG.creatorNameEn}</span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-emerald-800 via-[#063628] to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white border-2 border-amber-400/60 shadow-xl cursor-pointer transition"
        title="الدعم السريع والتواصل مع الإدارة / المطور"
      >
        <span className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-300">
          <MessageCircle className="w-4 h-4" />
        </span>
        <span className="text-xs font-black text-amber-100">
          مساعدة سريعة / تواصل مع الإدارة
        </span>
      </button>
    </div>
  );
};

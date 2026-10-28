export function normalizeWhatsAppPhone(input: string): string {
  const ascii = String(input || '').replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String(code >= 0x6f0 ? code - 0x6f0 : code - 0x660);
  });
  const digits = ascii.replace(/\D/g, '');
  if (/^01[0125]\d{8}$/.test(digits)) {
    return '2' + digits; // Egyptian local mobile -> 201xxxxxxxxx
  }
  if (/^05\d{8}$/.test(digits)) {
    return '966' + digits.slice(1); // Saudi local mobile -> 9665xxxxxxxx
  }
  if (digits.startsWith('00')) {
    return digits.slice(2);
  }
  return digits;
}

export function isValidWhatsAppPhone(input: string): boolean {
  const norm = normalizeWhatsAppPhone(input);
  return /^[1-9]\d{9,14}$/.test(norm);
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const norm = normalizeWhatsAppPhone(phone);
  return `https://wa.me/${norm}?text=${encodeURIComponent(message)}`;
}

export const PARENT_NOTE_TEMPLATES = [
  'أداء ممتاز اليوم وتلاوة متقنة، بارك الله في همته العالية وزاده علماً 🌿',
  'الحفظ جيد جداً ويحتاج إلى مزيد من التكرار والتثبيت قبل الحصة القادمة 📖',
  'نرجو الاهتمام بسماع القارئ المتقن (الشيخ الحصري) لضبط أحكام المدود والغنة 🎧',
  'يرجى مراجعة المتشابهات وأواخر الآيات بعناية لتجنب التردد أثناء التسميع ✨',
  'نأمل الالتزام بموعد الحصة والمراجعة اليومية في المنزل لتحقيق خطة الحفظ 🎯',
];

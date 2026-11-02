// Lightweight High-Speed Hijri & Gregorian Calendar Library (Umm al-Qura + Astronomical Kuwaiti Fallback)
// Default behavior for teachers: Display both Hijri and Gregorian dates together (showHijri = true)

export const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
] as const;

export const GREGORIAN_MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

export interface HijriDateParts {
  day: number;
  monthIndex: number; // 0-11
  monthNumber: number; // 1-12
  monthName: string;
  year: number;
  weekday: string;
  formattedLong: string;
  formattedShort: string;
  gregorianIso: string;
  gregorianFormatted: string;
}

// Singleton Intl formatters (instantiated once to eliminate GC & layout overhead)
let ummAlQuraLongFormatter: Intl.DateTimeFormat | null = null;
let ummAlQuraNumericPartsFormatter: Intl.DateTimeFormat | null = null;
let gregorianBannerFormatter: Intl.DateTimeFormat | null = null;
let arabicWeekdayFormatter: Intl.DateTimeFormat | null = null;

try {
  ummAlQuraLongFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  ummAlQuraNumericPartsFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  gregorianBannerFormatter = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  arabicWeekdayFormatter = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
  });
} catch {
  // Fallback algorithm will be used automatically if Intl islamic-umalqura is unsupported
}

// Fast O(1) Memoization Caches for Instant Table/Dashboard/Print Rendering
const HIJRI_PARTS_CACHE = new Map<string, HijriDateParts>();
const DUAL_FORMAT_CACHE = new Map<string, string>();

export function parseDateSafe(input?: string | Date | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? new Date() : input;
  }
  const trimmed = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00`);
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function toIsoDateKey(input?: string | Date | null): string {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return input.trim();
  }
  const d = parseDateSafe(input);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Astronomical Kuwaiti algorithm fallback if Intl islamic calendar is unavailable
export function fallbackGregorianToHijri(date: Date): {
  day: number;
  monthIndex: number;
  monthName: string;
  year: number;
} {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  let b = 2 - a + Math.floor(a / 4);
  if (y < 1583) b = 0;
  if (y === 1582) {
    if (m > 10) b = -10;
    if (m === 10) {
      b = 0;
      if (day > 4) b = -10;
    }
  }

  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    b -
    1524;

  const iyear = 10631 / 30;
  const epochastro = 1948084;
  const shift1 = 8.01 / 60;

  let z = jd - epochastro;
  const cyc = Math.floor(z / 10631);
  z = z - 10631 * cyc;
  const j = Math.floor((z - shift1) / iyear);
  const iy = 30 * cyc + j;
  z = z - Math.floor(j * iyear + shift1);
  let im = Math.floor((z + 28.5001) / 29.5);
  if (im === 13) im = 12;
  const id = z - Math.floor(29.5001 * im - 29);

  const monthIndex = Math.max(0, Math.min(11, im - 1));
  return {
    day: id,
    monthIndex,
    monthName: HIJRI_MONTHS_AR[monthIndex],
    year: iy,
  };
}

/**
 * Extracts complete Hijri & Gregorian structured parts with O(1) caching
 */
export function getHijriDateParts(dateInput?: string | Date | null): HijriDateParts {
  const isoKey = toIsoDateKey(dateInput);
  const cached = HIJRI_PARTS_CACHE.get(isoKey);
  if (cached) return cached;

  const date = parseDateSafe(isoKey);
  const fb = fallbackGregorianToHijri(date);

  let day = fb.day;
  let monthIndex = fb.monthIndex;
  let year = fb.year;

  if (ummAlQuraNumericPartsFormatter) {
    try {
      const parts = ummAlQuraNumericPartsFormatter.formatToParts(date);
      const dVal = parseInt(parts.find((p) => p.type === 'day')?.value || '', 10);
      const mVal = parseInt(parts.find((p) => p.type === 'month')?.value || '', 10);
      const yVal = parseInt(parts.find((p) => p.type === 'year')?.value || '', 10);
      if (!isNaN(dVal) && !isNaN(mVal) && !isNaN(yVal) && mVal >= 1 && mVal <= 12) {
        day = dVal;
        monthIndex = mVal - 1;
        year = yVal;
      }
    } catch {
      // keep fallback values
    }
  }

  const monthName = HIJRI_MONTHS_AR[monthIndex] || fb.monthName;
  let formattedLong = `${day} ${monthName} ${year} هـ`;

  if (ummAlQuraLongFormatter) {
    try {
      const rawLong = ummAlQuraLongFormatter.format(date);
      if (rawLong && !rawLong.includes('Invalid')) {
        formattedLong = rawLong.includes('هـ') ? rawLong : `${rawLong} هـ`;
      }
    } catch {
      // keep constructed formattedLong
    }
  }

  const monthNumber = monthIndex + 1;
  const formattedShort = `${String(day).padStart(2, '0')}/${String(monthNumber).padStart(2, '0')} هـ`;
  const weekday = arabicWeekdayFormatter ? arabicWeekdayFormatter.format(date) : '';
  const gregMonthName = GREGORIAN_MONTHS_AR[date.getMonth()] || '';
  const gregorianFormatted = `${date.getDate()} ${gregMonthName} ${date.getFullYear()} م`;

  const result: HijriDateParts = {
    day,
    monthIndex,
    monthNumber,
    monthName,
    year,
    weekday,
    formattedLong,
    formattedShort,
    gregorianIso: isoKey,
    gregorianFormatted,
  };

  if (HIJRI_PARTS_CACHE.size > 1500) {
    HIJRI_PARTS_CACHE.clear();
  }
  HIJRI_PARTS_CACHE.set(isoKey, result);
  return result;
}

export function formatHijriDate(
  dateInput: string | Date,
  format: 'long' | 'short' = 'long'
): string {
  const parts = getHijriDateParts(dateInput);
  return format === 'short' ? parts.formattedShort : parts.formattedLong;
}

export function formatGregorianAndHijri(
  dateStr: string | Date,
  showHijri = true,
  mode: 'inline' | 'compact' | 'badge' = 'inline'
): string {
  if (!dateStr) return '';
  const isoStr = toIsoDateKey(dateStr);
  const cacheKey = `${isoStr}|${showHijri ? '1' : '0'}|${mode}`;
  const cached = DUAL_FORMAT_CACHE.get(cacheKey);
  if (cached) return cached;

  let output = '';
  if (!showHijri) {
    output = mode === 'compact' ? isoStr.slice(5) : `${isoStr} م`;
  } else {
    const parts = getHijriDateParts(isoStr);
    if (mode === 'compact') {
      output = `${isoStr.slice(5)} م • ${parts.formattedShort}`;
    } else if (mode === 'badge') {
      output = `${parts.formattedLong} | ${parts.gregorianFormatted} (${isoStr})`;
    } else {
      output = `${isoStr} م • ${parts.formattedLong}`;
    }
  }

  if (DUAL_FORMAT_CACHE.size > 2000) {
    DUAL_FORMAT_CACHE.clear();
  }
  DUAL_FORMAT_CACHE.set(cacheKey, output);
  return output;
}

export function formatFullTodayBannerDate(showHijri = true, referenceDate?: string | Date): string {
  const target = parseDateSafe(referenceDate);
  const gregStr = gregorianBannerFormatter
    ? gregorianBannerFormatter.format(target)
    : getHijriDateParts(target).gregorianFormatted;

  if (!showHijri) {
    return `${gregStr} م`;
  }

  const hijriStr = formatHijriDate(target, 'long');
  return `${hijriStr} — الموافق ${gregStr} م`;
}

/**
 * Self-contained Hijri Calendar utility object for direct use across Teacher & Admin views
 */
export const HijriCalendar = {
  months: HIJRI_MONTHS_AR,
  gregorianMonths: GREGORIAN_MONTHS_AR,
  getParts: getHijriDateParts,
  formatHijri: formatHijriDate,
  formatDual: formatGregorianAndHijri,
  formatBanner: formatFullTodayBannerDate,
  getDualTeacherBadge(dateInput?: string | Date | null, showHijri = true): {
    hijri: string;
    hijriShort: string;
    gregorian: string;
    gregorianIso: string;
    weekday: string;
    combined: string;
    isBlessedSeason: boolean;
  } {
    const parts = getHijriDateParts(dateInput);
    const isBlessedSeason = parts.monthIndex === 8 || parts.monthIndex === 11; // Ramadan or Dhul-Hijjah
    return {
      hijri: parts.formattedLong,
      hijriShort: parts.formattedShort,
      gregorian: parts.gregorianFormatted,
      gregorianIso: parts.gregorianIso,
      weekday: parts.weekday,
      combined: showHijri
        ? `${parts.formattedLong} • ${parts.gregorianIso} م`
        : `${parts.gregorianFormatted} (${parts.gregorianIso} م)`,
      isBlessedSeason,
    };
  },
};

/**
 * High-Speed Print Engine (`تحسين سرعة الطباعة`)
 * Temporarily disables expensive GPU filters/blurs/animations on the DOM before invoking `window.print()`
 * so the browser print preview opens instantaneously without main-thread rasterization lag.
 */
export function triggerFastPrint(customTitle?: string): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const previousTitle = document.title;

  root.classList.add('fast-printing');
  if (customTitle) {
    document.title = customTitle;
  }

  const cleanup = () => {
    root.classList.remove('fast-printing');
    if (customTitle) {
      document.title = previousTitle;
    }
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup, { once: true });

  // Allow single fast style-recalc frame before opening native print dialog
  requestAnimationFrame(() => {
    window.print();
    // Safety fallback cleanup in case afterprint does not fire on some mobile browsers
    setTimeout(cleanup, 1500);
  });
}


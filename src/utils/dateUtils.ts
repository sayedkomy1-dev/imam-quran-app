// Hijri & Gregorian Date Formatting Utility using Intl.DateTimeFormat (Umm al-Qura)

const HIJRI_MONTHS_AR = [
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
];

function parseDateSafe(input: string | Date): Date {
  if (input instanceof Date) return input;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T12:00:00`);
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

// Fallback Kuwaiti algorithm if Intl islamic calendar is unavailable
function fallbackGregorianToHijri(date: Date): {
  day: number;
  monthIndex: number;
  monthName: string;
  year: number;
} {
  let day = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();

  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  let a = Math.floor(y / 100);
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

export function formatHijriDate(
  dateInput: string | Date,
  format: 'long' | 'short' = 'long'
): string {
  const date = parseDateSafe(dateInput);

  try {
    if (format === 'long') {
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const formatted = formatter.format(date);
      if (formatted && !formatted.includes('Invalid')) {
        return formatted.includes('هـ') ? formatted : `${formatted} هـ`;
      }
    } else {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: '2-digit',
        month: '2-digit',
      });
      const parts = formatter.formatToParts(date);
      const dayPart = parts.find((p) => p.type === 'day')?.value;
      const monthPart = parts.find((p) => p.type === 'month')?.value;
      if (dayPart && monthPart) {
        return `${dayPart}/${monthPart} هـ`;
      }
    }
  } catch {
    // Fallback below
  }

  const fb = fallbackGregorianToHijri(date);
  if (format === 'short') {
    return `${fb.day}/${fb.monthIndex + 1} هـ`;
  }
  return `${fb.day} ${fb.monthName} ${fb.year} هـ`;
}

export function formatGregorianAndHijri(
  dateStr: string,
  showHijri = true,
  mode: 'inline' | 'compact' = 'inline'
): string {
  if (!dateStr) return '';
  if (!showHijri) {
    return mode === 'compact' ? dateStr.slice(5) : `${dateStr} م`;
  }

  if (mode === 'compact') {
    const shortGreg = dateStr.slice(5);
    const shortHijri = formatHijriDate(dateStr, 'short');
    return `${shortGreg} (${shortHijri})`;
  }

  const hijriLong = formatHijriDate(dateStr, 'long');
  return `${dateStr} م • ${hijriLong}`;
}

export function formatFullTodayBannerDate(showHijri = true): string {
  const now = new Date();
  const gregStr = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  if (!showHijri) {
    return `${gregStr} م`;
  }

  const hijriStr = formatHijriDate(now, 'long');
  return `${gregStr} م — الموافق ${hijriStr}`;
}

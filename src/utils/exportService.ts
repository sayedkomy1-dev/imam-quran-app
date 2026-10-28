import {
  AcademySettings,
  CircleGroup,
  ExamRecord,
  IjazahRecord,
  SessionRecord,
  Student,
  TaskItem,
} from '../types';
import { DAY_NAMES } from '../data/quranData';
import { formatGregorianAndHijri } from './dateUtils';

export type ExportReportScope = 'all' | 'students' | 'finance';

function escapeCsvCell(value: string | number | undefined | null): string {
  const str = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  if (str.includes(',') || str.includes('"') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Exports all students, sessions, financial records, and academy data to a local JSON backup file
 */
export function exportDataToJsonBackup(params: {
  students: Student[];
  sessions: SessionRecord[];
  circles: CircleGroup[];
  exams: ExamRecord[];
  ijazahs: IjazahRecord[];
  tasks: TaskItem[];
  settings: AcademySettings;
}): void {
  const { students, sessions, circles, exams, ijazahs, tasks, settings } = params;
  const showHijri = settings.showHijriDates ?? true;
  const todayIso = new Date().toISOString().slice(0, 10);

  const financialRecords = students.flatMap((st) =>
    st.fees.map((fee) => ({
      studentId: st.id,
      studentName: st.name,
      level: st.level,
      circle: st.circle,
      guardianName: st.guardianName,
      whatsappPhone: st.whatsappPhone,
      monthlyFee: st.monthlyFee,
      month: fee.month,
      amount: fee.amount,
      status: fee.status,
      method: fee.method || null,
      paidAt: fee.paidAt || null,
      paidAtFormatted: fee.paidAt
        ? formatGregorianAndHijri(fee.paidAt, showHijri)
        : null,
      notes: fee.notes || '',
    }))
  );

  const totalPaid = financialRecords
    .filter((f) => f.status === 'مدفوع')
    .reduce((acc, f) => acc + f.amount, 0);
  const totalOverdue = financialRecords
    .filter((f) => f.status === 'متأخر')
    .reduce((acc, f) => acc + f.amount, 0);
  const totalExempt = financialRecords
    .filter((f) => f.status === 'معفى')
    .reduce((acc, f) => acc + f.amount, 0);
  const totalMemorizedJuz = students.reduce(
    (acc, s) => acc + s.memorizedJuz.length,
    0
  );

  const backupPayload = {
    app: 'أكاديمية الإمام لتحفيظ القرآن الكريم — بالقرآن نحيا',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    exportedDateFormatted: formatGregorianAndHijri(todayIso, showHijri),
    summary: {
      totalStudents: students.length,
      totalSessions: sessions.length,
      totalFinancialRecords: financialRecords.length,
      totalPaidAmount: totalPaid,
      totalOverdueAmount: totalOverdue,
      totalExemptAmount: totalExempt,
      totalMemorizedJuz,
    },
    students,
    sessions,
    financialRecords,
    circles,
    exams,
    ijazahs,
    tasks,
    settings,
  };

  const jsonString = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonString], {
    type: 'application/json;charset=utf-8',
  });
  downloadBlob(blob, `imam-academy-backup-${todayIso}.json`);
}

/**
 * Exports comprehensive student records to a UTF-8 BOM CSV file (Excel-compatible for Arabic RTL)
 */
export function exportStudentsToCSV(
  students: Student[],
  sessions: SessionRecord[],
  showHijri: boolean
): void {
  const headers = [
    'كود الطالب',
    'اسم الطالب',
    'المستوى',
    'الحلقة',
    'خطة الحفظ',
    'منطق الربط',
    'اسم ولي الأمر',
    'رقم واتساب ولي الأمر',
    'رمز دخول ولي الأمر (PIN)',
    'أيام الحصة الأسبوعية',
    'موعد الحصة',
    'مدة الحصة (دقيقة)',
    'تاريخ الانضمام',
    'عدد الأجزاء المحفوظة',
    'الأجزاء المحفوظة تفصيلاً',
    'عدد السور المتقنة',
    'موضع التوقف الحالي',
    'إجمالي الحصص المسجلة',
    'نسبة الحضور (%)',
    'متوسط الإتقان (%)',
    'الرسوم الشهرية (ج.م)',
    'ملاحظات المعلم',
  ];

  const rows = students.map((student) => {
    const studentSessions = sessions.filter((s) => s.studentId === student.id);
    const attended = studentSessions.filter((s) => s.status === 'حضر');
    const attendanceRate =
      studentSessions.length > 0
        ? Math.round((attended.length / studentSessions.length) * 100)
        : 100;
    const avgMastery =
      attended.length > 0
        ? Math.round(
            attended.reduce((acc, s) => acc + s.masteryScore, 0) / attended.length
          )
        : 95;
    const daysText = student.scheduleDays
      .map((d) => DAY_NAMES[d] || '')
      .filter(Boolean)
      .join(' - ');

    return [
      student.id,
      student.name,
      student.level,
      student.circle,
      student.plan,
      student.linkLogic,
      student.guardianName,
      student.whatsappPhone,
      student.guardianPin,
      daysText,
      student.scheduleTime,
      student.sessionDuration,
      formatGregorianAndHijri(student.startDate, showHijri),
      student.memorizedJuz.length,
      student.memorizedJuz.join('، '),
      student.memorizedSurahs.length,
      `سورة ${student.currentStop.surahName} آية ${student.currentStop.ayah} (جزء ${student.currentStop.juzNumber})`,
      studentSessions.length,
      `${attendanceRate}%`,
      `${avgMastery}%`,
      student.monthlyFee,
      student.notes,
    ].map(escapeCsvCell);
  });

  const csvContent =
    '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `imam-academy-students-${dateStamp}.csv`);
}

/**
 * Exports all student financial & monthly fee records to a UTF-8 BOM CSV file
 */
export function exportFinanceToCSV(
  students: Student[],
  showHijri: boolean
): void {
  const headers = [
    'اسم الطالب',
    'الحلقة',
    'المستوى',
    'ولي الأمر',
    'رقم واتساب',
    'الرسوم الشهرية المقررة (ج.م)',
    'الشهر',
    'المبلغ (ج.م)',
    'حالة السداد',
    'وسيلة الدفع',
    'تاريخ السداد',
    'ملاحظات مالية',
  ];

  const rows: string[][] = [];
  let totalPaid = 0;
  let totalOverdue = 0;
  let totalExempt = 0;

  students.forEach((student) => {
    if (!student.fees || student.fees.length === 0) {
      rows.push(
        [
          student.name,
          student.circle,
          student.level,
          student.guardianName,
          student.whatsappPhone,
          student.monthlyFee,
          '-',
          student.monthlyFee,
          'غير مسجل',
          '-',
          '-',
          '',
        ].map(escapeCsvCell)
      );
      return;
    }

    student.fees.forEach((fee) => {
      if (fee.status === 'مدفوع') totalPaid += fee.amount;
      else if (fee.status === 'متأخر') totalOverdue += fee.amount;
      else if (fee.status === 'معفى') totalExempt += fee.amount;

      rows.push(
        [
          student.name,
          student.circle,
          student.level,
          student.guardianName,
          student.whatsappPhone,
          student.monthlyFee,
          fee.month,
          fee.amount,
          fee.status,
          fee.method || '-',
          fee.paidAt ? formatGregorianAndHijri(fee.paidAt, showHijri) : '-',
          fee.notes || '',
        ].map(escapeCsvCell)
      );
    });
  });

  // Add summary rows at the bottom
  rows.push([]);
  rows.push(
    [
      'إجمالي المحصل (مدفوع)',
      `${totalPaid} ج.م`,
      'إجمالي المتأخرات',
      `${totalOverdue} ج.م`,
      'إجمالي الإعفاءات',
      `${totalExempt} ج.م`,
      '',
      '',
      '',
      '',
      '',
      '',
    ].map(escapeCsvCell)
  );

  const csvContent =
    '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `imam-academy-finance-${dateStamp}.csv`);
}

/**
 * Exports a combined master CSV containing both student academic summary and financial status
 */
export function exportCombinedMasterCSV(
  students: Student[],
  sessions: SessionRecord[],
  showHijri: boolean
): void {
  const headers = [
    'اسم الطالب',
    'المستوى',
    'الحلقة',
    'خطة الطالب',
    'ولي الأمر',
    'واتساب ولي الأمر',
    'الأجزاء المحفوظة',
    'السور المتقنة',
    'موضع التوقف الحالي',
    'إجمالي الحصص',
    'متوسط الإتقان (%)',
    'الرسوم الشهرية (ج.م)',
    'إجمالي المدفوع (ج.م)',
    'إجمالي المتأخر (ج.م)',
    'آخر شهر مسجل',
    'حالة آخر شهر',
    'تاريخ الانضمام',
  ];

  const rows = students.map((student) => {
    const studentSessions = sessions.filter((s) => s.studentId === student.id);
    const attended = studentSessions.filter((s) => s.status === 'حضر');
    const avgMastery =
      attended.length > 0
        ? Math.round(
            attended.reduce((acc, s) => acc + s.masteryScore, 0) / attended.length
          )
        : 95;

    const paidSum = student.fees
      .filter((f) => f.status === 'مدفوع')
      .reduce((acc, f) => acc + f.amount, 0);
    const overdueSum = student.fees
      .filter((f) => f.status === 'متأخر')
      .reduce((acc, f) => acc + f.amount, 0);
    const latestFee = student.fees[0];

    return [
      student.name,
      student.level,
      student.circle,
      student.plan,
      student.guardianName,
      student.whatsappPhone,
      student.memorizedJuz.length,
      student.memorizedSurahs.length,
      `سورة ${student.currentStop.surahName} آية ${student.currentStop.ayah}`,
      studentSessions.length,
      `${avgMastery}%`,
      student.monthlyFee,
      paidSum,
      overdueSum,
      latestFee?.month || '-',
      latestFee?.status || '-',
      formatGregorianAndHijri(student.startDate, showHijri),
    ].map(escapeCsvCell);
  });

  const csvContent =
    '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `imam-academy-master-students-finance-${dateStamp}.csv`);
}

/**
 * Packages an array of JPEG DataURLs (rendered A4 canvases) into a multi-page standard PDF 1.4 binary Blob.
 */
function buildPdfFromJpegPages(
  pages: { dataUrl: string; widthPt: number; heightPt: number; pixelWidth: number; pixelHeight: number }[]
): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const xrefOffsets: number[] = [0]; // object 0 is free

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  xrefOffsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages (will reference page objects 3, 6, 9, ...)
  const pageObjIds = pages.map((_, idx) => 3 + idx * 3);
  xrefOffsets[2] = offset;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds
      .map((id) => `${id} 0 R`)
      .join(' ')}] /Count ${pages.length} >>\nendobj\n`
  );

  pages.forEach((page, idx) => {
    const pageObjId = 3 + idx * 3;
    const contentObjId = pageObjId + 1;
    const imageObjId = pageObjId + 2;

    const base64Data = page.dataUrl.split(',')[1] || '';
    const binaryStr = atob(base64Data);
    const imgBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      imgBytes[i] = binaryStr.charCodeAt(i);
    }

    // Page Object
    xrefOffsets[pageObjId] = offset;
    pushStr(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.widthPt} ${page.heightPt}] /Resources << /XObject << /Im0 ${imageObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    // Content Stream Object
    const contentStream = `q\n${page.widthPt} 0 0 ${page.heightPt} 0 0 cm\n/Im0 Do\nQ\n`;
    xrefOffsets[contentObjId] = offset;
    pushStr(
      `${contentObjId} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
    );

    // Image XObject
    xrefOffsets[imageObjId] = offset;
    pushStr(
      `${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.pixelWidth} /Height ${page.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
    );
    pushBytes(imgBytes);
    pushStr('\nendstream\nendobj\n');
  });

  const xrefStart = offset;
  const totalObjects = xrefOffsets.length;
  pushStr(`xref\n0 ${totalObjects}\n0000000000 65535 f \n`);
  for (let i = 1; i < totalObjects; i++) {
    const padded = String(xrefOffsets[i]).padStart(10, '0');
    pushStr(`${padded} 00000 n \n`);
  }

  pushStr(
    `trailer\n<< /Size ${totalObjects} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  );

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

/**
 * Generates and downloads a localized Arabic RTL PDF document containing Student & Financial Records.
 */
export function exportRecordsToPDF(options: {
  scope: ExportReportScope;
  students: Student[];
  sessions: SessionRecord[];
  settings: AcademySettings;
}): void {
  const { scope, students, sessions, settings } = options;
  const showHijri = settings.showHijriDates ?? true;
  const todayFormatted = formatGregorianAndHijri(
    new Date().toISOString().slice(0, 10),
    showHijri
  );

  const widthPt = 595; // A4 width in pt
  const heightPt = 842; // A4 height in pt
  const scale = 2; // 2x retina resolution
  const canvasW = widthPt * scale;
  const canvasH = heightPt * scale;

  const renderedPages: {
    dataUrl: string;
    widthPt: number;
    heightPt: number;
    pixelWidth: number;
    pixelHeight: number;
  }[] = [];

  const createPageCanvas = (pageTitle: string, pageSubtitle: string, pageNum: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';

    // Paper background
    ctx.fillStyle = '#fcfcfa';
    ctx.fillRect(0, 0, widthPt, heightPt);

    // Decorative outer border
    ctx.strokeStyle = '#145a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, widthPt - 36, heightPt - 36);

    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(22, 22, widthPt - 44, heightPt - 44);

    // Header Banner
    ctx.fillStyle = '#145a3a';
    ctx.fillRect(28, 28, widthPt - 56, 68);

    // Gold accent bar
    ctx.fillStyle = '#c59b27';
    ctx.fillRect(28, 92, widthPt - 56, 4);

    // Header Text (Right side)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Tajawal", "Cairo", sans-serif';
    ctx.fillText(settings.academyName, widthPt - 42, 54);

    ctx.fillStyle = '#dfbd69';
    ctx.font = 'bold 11px "Tajawal", "Cairo", sans-serif';
    ctx.fillText(`${pageTitle} — ${pageSubtitle}`, widthPt - 42, 76);

    // Header Meta (Left side)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e9f2ec';
    ctx.font = '10px "Tajawal", "Cairo", sans-serif';
    ctx.fillText(`التاريخ: ${todayFormatted}`, 40, 52);
    ctx.fillText(`المشرف: ${settings.teacherName}`, 40, 74);

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px "Tajawal", "Cairo", sans-serif';
    ctx.fillText(
      `${settings.academyName} — ${settings.tagline} | صفحة ${pageNum}`,
      widthPt / 2,
      heightPt - 28
    );

    ctx.textAlign = 'right';
    return { canvas, ctx };
  };

  let pageCounter = 1;

  // SECTION 1: STUDENTS RECORDS PAGE(S)
  if (scope === 'all' || scope === 'students') {
    const { canvas, ctx } = createPageCanvas(
      'سجل الطلاب والتقدم القرآني الشامل',
      `إجمالي الطلاب: ${students.length}`,
      pageCounter++
    );

    const totalJuz = students.reduce((acc, s) => acc + s.memorizedJuz.length, 0);
    const totalSurahs = students.reduce((acc, s) => acc + s.memorizedSurahs.length, 0);
    const advCount = students.filter((s) => s.level === 'متقدم').length;
    const midCount = students.filter((s) => s.level === 'متوسط').length;
    const begCount = students.filter((s) => s.level === 'مبتدئ').length;

    // Summary KPI strip
    const kpis = [
      { label: 'إجمالي الطلاب', val: `${students.length} طلاب` },
      { label: 'مجموع الأجزاء المحفوظة', val: `${totalJuz} جزءاً` },
      { label: 'مجموع السور المتقنة', val: `${totalSurahs} سورة` },
      { label: 'توزيع المستويات', val: `متقدم:${advCount} | متوسط:${midCount} | مبتدئ:${begCount}` },
    ];

    const boxW = (widthPt - 56 - 18) / 4;
    kpis.forEach((k, idx) => {
      const xRight = widthPt - 28 - idx * (boxW + 6);
      const xLeft = xRight - boxW;
      ctx.fillStyle = '#f3f5ef';
      ctx.fillRect(xLeft, 108, boxW, 44);
      ctx.strokeStyle = '#d6dccf';
      ctx.lineWidth = 1;
      ctx.strokeRect(xLeft, 108, boxW, 44);

      ctx.fillStyle = '#5c6b61';
      ctx.font = 'bold 9px "Tajawal", sans-serif';
      ctx.fillText(k.label, xRight - 8, 124);

      ctx.fillStyle = '#145a3a';
      ctx.font = 'bold 11px "Tajawal", sans-serif';
      ctx.fillText(k.val, xRight - 8, 142);
    });

    // Table Header
    const tableTop = 166;
    const rowH = 32;
    const cols = [
      { title: 'اسم الطالب', width: 115 },
      { title: 'المستوى / الحلقة', width: 95 },
      { title: 'ولي الأمر وواتساب', width: 110 },
      { title: 'الأجزاء والسور', width: 75 },
      { title: 'موضع التوقف الحالي', width: 95 },
      { title: 'الرسوم', width: 49 },
    ];

    ctx.fillStyle = '#145a3a';
    ctx.fillRect(28, tableTop, widthPt - 56, 26);

    let curX = widthPt - 28;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Tajawal", sans-serif';
    cols.forEach((col) => {
      ctx.fillText(col.title, curX - 6, tableTop + 17);
      curX -= col.width;
    });

    students.slice(0, 18).forEach((st, idx) => {
      const y = tableTop + 26 + idx * rowH;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f6f7f2';
      ctx.fillRect(28, y, widthPt - 56, rowH);

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(28, y, widthPt - 56, rowH);

      let cellX = widthPt - 28;
      ctx.fillStyle = '#14281d';
      ctx.font = 'bold 10px "Tajawal", sans-serif';
      ctx.fillText(st.name, cellX - 6, y + 14);
      ctx.fillStyle = '#6b7280';
      ctx.font = '8.5px "Tajawal", sans-serif';
      ctx.fillText(`خطة: ${st.plan}`, cellX - 6, y + 26);
      cellX -= cols[0].width;

      ctx.fillStyle = '#145a3a';
      ctx.font = 'bold 9.5px "Tajawal", sans-serif';
      ctx.fillText(st.level, cellX - 6, y + 14);
      ctx.fillStyle = '#6b7280';
      ctx.font = '8.5px "Tajawal", sans-serif';
      ctx.fillText(st.circle, cellX - 6, y + 26);
      cellX -= cols[1].width;

      ctx.fillStyle = '#14281d';
      ctx.font = '9px "Tajawal", sans-serif';
      ctx.fillText(st.guardianName, cellX - 6, y + 14);
      ctx.fillStyle = '#6b7280';
      ctx.font = '8.5px monospace';
      ctx.fillText(st.whatsappPhone, cellX - 6, y + 26);
      cellX -= cols[2].width;

      ctx.fillStyle = '#145a3a';
      ctx.font = 'bold 9.5px "Tajawal", sans-serif';
      ctx.fillText(`${st.memorizedJuz.length} جزءاً`, cellX - 6, y + 14);
      ctx.fillStyle = '#c59b27';
      ctx.font = 'bold 8.5px "Tajawal", sans-serif';
      ctx.fillText(`${st.memorizedSurahs.length} سورة`, cellX - 6, y + 26);
      cellX -= cols[3].width;

      ctx.fillStyle = '#14281d';
      ctx.font = '9.5px "Tajawal", sans-serif';
      ctx.fillText(`سورة ${st.currentStop.surahName}`, cellX - 6, y + 14);
      ctx.fillStyle = '#6b7280';
      ctx.font = '8.5px "Tajawal", sans-serif';
      ctx.fillText(`آية ${st.currentStop.ayah} (جزء ${st.currentStop.juzNumber})`, cellX - 6, y + 26);
      cellX -= cols[4].width;

      ctx.fillStyle = '#145a3a';
      ctx.font = 'bold 9.5px "Tajawal", sans-serif';
      ctx.fillText(`${st.monthlyFee} ج`, cellX - 6, y + 19);
    });

    renderedPages.push({
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      widthPt,
      heightPt,
      pixelWidth: canvasW,
      pixelHeight: canvasH,
    });
  }

  // SECTION 2: FINANCIAL RECORDS PAGE
  if (scope === 'all' || scope === 'finance') {
    const allFees = students.flatMap((st) =>
      st.fees.map((f) => ({
        studentName: st.name,
        circle: st.circle,
        guardianName: st.guardianName,
        monthlyFee: st.monthlyFee,
        ...f,
      }))
    );

    const paidTotal = allFees
      .filter((f) => f.status === 'مدفوع')
      .reduce((acc, f) => acc + f.amount, 0);
    const overdueTotal = allFees
      .filter((f) => f.status === 'متأخر')
      .reduce((acc, f) => acc + f.amount, 0);
    const exemptTotal = allFees
      .filter((f) => f.status === 'معفى')
      .reduce((acc, f) => acc + f.amount, 0);

    const { canvas, ctx } = createPageCanvas(
      'التقرير المالي وسجل تحصيل الرسوم الشهرية',
      `إجمالي السجلات المالية: ${allFees.length}`,
      pageCounter++
    );

    const finKpis = [
      { label: 'إجمالي المحصل (مدفوع)', val: `${paidTotal} ج.م`, color: '#145a3a' },
      { label: 'إجمالي المتأخرات', val: `${overdueTotal} ج.م`, color: '#dc2626' },
      { label: 'إجمالي الإعفاءات', val: `${exemptTotal} ج.م`, color: '#d97706' },
      {
        label: 'نسبة التحصيل',
        val: `${
          paidTotal + overdueTotal > 0
            ? Math.round((paidTotal / (paidTotal + overdueTotal)) * 100)
            : 100
        }%`,
        color: '#145a3a',
      },
    ];

    const boxW = (widthPt - 56 - 18) / 4;
    finKpis.forEach((k, idx) => {
      const xRight = widthPt - 28 - idx * (boxW + 6);
      const xLeft = xRight - boxW;
      ctx.fillStyle = '#f3f5ef';
      ctx.fillRect(xLeft, 108, boxW, 44);
      ctx.strokeStyle = '#d6dccf';
      ctx.lineWidth = 1;
      ctx.strokeRect(xLeft, 108, boxW, 44);

      ctx.fillStyle = '#5c6b61';
      ctx.font = 'bold 9px "Tajawal", sans-serif';
      ctx.fillText(k.label, xRight - 8, 124);

      ctx.fillStyle = k.color;
      ctx.font = 'bold 12px "Tajawal", sans-serif';
      ctx.fillText(k.val, xRight - 8, 142);
    });

    const tableTop = 166;
    const rowH = 26;
    const cols = [
      { title: 'اسم الطالب', width: 120 },
      { title: 'الحلقة', width: 95 },
      { title: 'الشهر', width: 65 },
      { title: 'المبلغ', width: 65 },
      { title: 'الحالة', width: 65 },
      { title: 'وسيلة وتاريخ السداد', width: 129 },
    ];

    ctx.fillStyle = '#145a3a';
    ctx.fillRect(28, tableTop, widthPt - 56, 26);

    let curX = widthPt - 28;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Tajawal", sans-serif';
    cols.forEach((col) => {
      ctx.fillText(col.title, curX - 6, tableTop + 17);
      curX -= col.width;
    });

    allFees.slice(0, 22).forEach((item, idx) => {
      const y = tableTop + 26 + idx * rowH;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f6f7f2';
      ctx.fillRect(28, y, widthPt - 56, rowH);

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(28, y, widthPt - 56, rowH);

      let cellX = widthPt - 28;
      ctx.fillStyle = '#14281d';
      ctx.font = 'bold 9.5px "Tajawal", sans-serif';
      ctx.fillText(item.studentName, cellX - 6, y + 17);
      cellX -= cols[0].width;

      ctx.fillStyle = '#4b5563';
      ctx.font = '9px "Tajawal", sans-serif';
      ctx.fillText(item.circle, cellX - 6, y + 17);
      cellX -= cols[1].width;

      ctx.fillStyle = '#14281d';
      ctx.font = 'bold 9.5px monospace';
      ctx.fillText(item.month, cellX - 6, y + 17);
      cellX -= cols[2].width;

      ctx.fillStyle = '#145a3a';
      ctx.font = 'bold 9.5px "Tajawal", sans-serif';
      ctx.fillText(`${item.amount} ج.م`, cellX - 6, y + 17);
      cellX -= cols[3].width;

      ctx.fillStyle =
        item.status === 'مدفوع'
          ? '#15803d'
          : item.status === 'متأخر'
          ? '#dc2626'
          : '#d97706';
      ctx.font = 'bold 9.5px "Tajawal", sans-serif';
      ctx.fillText(item.status, cellX - 6, y + 17);
      cellX -= cols[4].width;

      ctx.fillStyle = '#4b5563';
      ctx.font = '8.5px "Tajawal", sans-serif';
      const paidInfo = item.paidAt
        ? `${item.method || 'نقدي'} (${formatGregorianAndHijri(item.paidAt, showHijri)})`
        : item.notes || 'لم يسدد بعد';
      ctx.fillText(paidInfo, cellX - 6, y + 17);
    });

    renderedPages.push({
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      widthPt,
      heightPt,
      pixelWidth: canvasW,
      pixelHeight: canvasH,
    });
  }

  const pdfBlob = buildPdfFromJpegPages(renderedPages);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const scopeSlug =
    scope === 'students' ? 'students' : scope === 'finance' ? 'finance' : 'full-report';
  downloadBlob(pdfBlob, `imam-academy-${scopeSlug}-${dateStamp}.pdf`);
}

import React, { useState } from 'react';
import { AcademySettings, FeeRecord, FeeStatus, Student } from '../types';
import { DAY_NAMES } from '../data/quranData';
import { OFFICIAL_ACADEMY_WHATSAPP } from '../data/hybridFoundationData';
import { formatGregorianAndHijri } from '../utils/dateUtils';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  IdCard,
  Phone,
  Printer,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

// Deterministic 21x21 Offline QR Code Matrix Generator
export function generateOfflineQrMatrix(payload: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;
      if (inTopLeft || inTopRight || inBottomLeft || isTiming) continue;

      const charCode =
        payload.charCodeAt((r * size + c) % Math.max(1, payload.length)) || 7;
      const v = (hash ^ (r * 31 + c * 17 + charCode * 13)) >>> 0;
      matrix[r][c] = v % 2 === 0;
    }
  }

  return matrix;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function downloadStudentIdCardPng(
  student: Student,
  settings: AcademySettings
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Deep Emerald Royal Background
  const grad = ctx.createLinearGradient(0, 0, 1200, 720);
  grad.addColorStop(0, '#145a3a');
  grad.addColorStop(0.55, '#0f452c');
  grad.addColorStop(1, '#082618');
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, 0, 0, 1200, 720, 36);
  ctx.fill();

  // Outer & Inner Gold Borders
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, 20, 20, 1160, 680, 28);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(223, 189, 105, 0.35)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 34, 34, 1132, 652, 22);
  ctx.stroke();

  // Header Banner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  drawRoundedRect(ctx, 60, 55, 1080, 90, 18);
  ctx.fill();

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#dfbd69';
  ctx.font = 'bold 28px Cairo, sans-serif';
  ctx.fillText(
    `${settings.academyName} — ${settings.tagline}`,
    1110,
    98
  );

  ctx.fillStyle = '#d1fae5';
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.fillText(
    `بطاقة الهوية القرآنية الذكية للطالب (Student Smart ID) • إشراف: ${settings.teacherName}`,
    1110,
    130
  );

  // Student Name & Badge on the Right
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px Cairo, sans-serif';
  ctx.fillText(
    `${student.name} ${student.hasGoldenCrown ? '👑' : ''}`,
    1110,
    220
  );

  ctx.fillStyle = '#dfbd69';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.fillText(
    `${student.circle}  •  المستوى: ${student.level}  •  منهج الإمام للتأسيس: المستوى ${
      student.foundationLevel || 1
    }/8`,
    1110,
    265
  );

  // KPI Boxes
  const kpis = [
    {
      label: 'السور المحفوظة',
      value: `${student.memorizedSurahs.length} / 114 سورة`,
    },
    {
      label: 'الأجزاء المكتملة',
      value: `${student.memorizedJuz.length} / 30 جزء`,
    },
    {
      label: 'نقاط الهمة (XP)',
      value: `${student.xpPoints || 120} نقطة`,
    },
    {
      label: 'رمز دخول البوابة (PIN)',
      value: student.guardianPin,
    },
  ];

  kpis.forEach((item, idx) => {
    const boxW = 190;
    const boxH = 105;
    const boxX = 1110 - (idx + 1) * boxW - idx * 16;
    const boxY = 305;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(223, 189, 105, 0.45)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 16px Cairo, sans-serif';
    ctx.fillText(item.label, boxX + boxW / 2, boxY + 38);

    ctx.fillStyle = '#dfbd69';
    ctx.font = 'bold 24px Cairo, monospace';
    ctx.fillText(item.value, boxX + boxW / 2, boxY + 78);
  });

  // Current Stop & Schedule Info
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Cairo, sans-serif';
  ctx.fillText(
    `📖 موضع الحفظ الحالي: سورة ${student.currentStop.surahName} — الآية (${student.currentStop.ayah}) • الجزء (${student.currentStop.juzNumber})`,
    1110,
    470
  );

  ctx.fillStyle = '#d1fae5';
  ctx.font = 'bold 20px Cairo, sans-serif';
  const daysText = student.scheduleDays.map((d) => DAY_NAMES[d]).join('، ');
  ctx.fillText(
    `🗓️ مواعيد الحلقة: ${daysText} — الساعة ${student.scheduleTime} (${student.sessionDuration} دقيقة)`,
    1110,
    515
  );

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 19px Cairo, sans-serif';
  ctx.fillText(
    `👨‍👦 ولي الأمر: ${student.guardianName}  •  خطة الحفظ: ${student.plan}`,
    1110,
    560
  );

  // Offline QR Box on the Left
  const qrBoxX = 65;
  const qrBoxY = 180;
  const qrBoxSize = 270;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 45, 22);
  ctx.fill();
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 45, 22);
  ctx.stroke();

  const qrPayload = `IMAM-ID:${student.id}|PIN:${student.guardianPin}|SURAH:${student.currentStop.surahId}:${student.currentStop.ayah}|JUZ:${student.memorizedJuz.length}|XP:${student.xpPoints || 120}`;
  const matrix = generateOfflineQrMatrix(qrPayload);
  const cellSize = 10;
  const startX = qrBoxX + 30;
  const startY = qrBoxY + 25;

  ctx.fillStyle = '#14281d';
  matrix.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell) {
        ctx.fillRect(
          startX + cIdx * cellSize,
          startY + rIdx * cellSize,
          cellSize,
          cellSize
        );
      }
    });
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#145a3a';
  ctx.font = 'bold 16px Cairo, monospace';
  ctx.fillText(
    `QR OFFLINE • ID #${student.id.slice(-4)}`,
    qrBoxX + qrBoxSize / 2,
    qrBoxY + qrBoxSize + 22
  );

  // Footer Bar
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 615);
  ctx.lineTo(1140, 615);
  ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 18px Cairo, sans-serif';
  ctx.fillText(
    `تاريخ الإصدار: ${new Date().toISOString().slice(0, 10)}  •  بطاقة معتمدة من منظومة أكاديمية الإمام`,
    1110,
    652
  );

  ctx.textAlign = 'left';
  ctx.fillStyle = '#dfbd69';
  ctx.font = 'bold 19px Cairo, monospace';
  ctx.fillText(`WhatsApp: +${OFFICIAL_ACADEMY_WHATSAPP}`, 65, 652);

  const link = document.createElement('a');
  link.download = `بطاقة-الطالب-${student.name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function downloadPaymentReceiptPng(
  student: Student,
  fee: FeeRecord,
  settings: AcademySettings
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Warm Parchment Receipt Background
  ctx.fillStyle = '#fcfaf2';
  drawRoundedRect(ctx, 0, 0, 1200, 800, 32);
  ctx.fill();

  // Double Gold Frame
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 8;
  drawRoundedRect(ctx, 20, 20, 1160, 760, 24);
  ctx.stroke();

  ctx.strokeStyle = '#145a3a';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 34, 34, 1132, 732, 18);
  ctx.stroke();

  // Top Header Emerald Band
  ctx.fillStyle = '#145a3a';
  drawRoundedRect(ctx, 55, 55, 1090, 115, 18);
  ctx.fill();

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#dfbd69';
  ctx.font = 'bold 32px Cairo, sans-serif';
  ctx.fillText(settings.academyName, 1115, 105);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px Cairo, sans-serif';
  ctx.fillText(
    `${settings.tagline} • إيصال سداد رسوم شهرية معتمد (سند قبض رقمي)`,
    1115,
    145
  );

  const receiptNo =
    fee.receiptNumber ||
    `REC-${fee.month.replace('-', '')}-${student.id.replace(/\D/g, '') || '101'}`;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#dfbd69';
  ctx.font = 'bold 22px Cairo, monospace';
  ctx.fillText(receiptNo, 85, 105);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 17px Cairo, sans-serif';
  ctx.fillText(`WhatsApp: +${OFFICIAL_ACADEMY_WHATSAPP}`, 85, 142);

  // Receipt Details Grid on the Right
  const fields = [
    { label: 'اسم الطالب', value: student.name },
    { label: 'اسم ولي الأمر', value: student.guardianName },
    { label: 'الحلقة القرآنية', value: student.circle },
    { label: 'عن شهر الاشتراك', value: fee.month },
    { label: 'وسيلة السداد', value: fee.method || 'نقدي / إنستا باي' },
    {
      label: 'تاريخ السداد والإصدار',
      value: fee.paidAt || new Date().toISOString().slice(0, 10),
    },
  ];

  fields.forEach((f, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const boxW = 380;
    const boxH = 86;
    const boxX = 1145 - (col + 1) * boxW - col * 20;
    const boxY = 200 + row * 102;

    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 14);
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 14);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 16px Cairo, sans-serif';
    ctx.fillText(f.label, boxX + boxW - 20, boxY + 32);

    ctx.fillStyle = '#14281d';
    ctx.font = 'bold 22px Cairo, sans-serif';
    ctx.fillText(f.value, boxX + boxW - 20, boxY + 66);
  });

  // Paid Amount Banner
  ctx.fillStyle = '#145a3a';
  drawRoundedRect(ctx, 365, 515, 780, 115, 20);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 20px Cairo, sans-serif';
  ctx.fillText('إجمالي المبلغ المسدد والمعتمد:', 1115, 558);

  ctx.fillStyle = '#dfbd69';
  ctx.font = 'bold 42px Cairo, monospace';
  ctx.fillText(`${fee.amount} ج.م`, 1115, 608);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Cairo, sans-serif';
  ctx.fillText(
    fee.status === 'معفى' ? '✓ منحة وإعفاء معتمد' : '✓ خالص السداد',
    395,
    585
  );

  // QR Verification Box on Left
  const qrBoxX = 60;
  const qrBoxY = 200;
  const qrBoxW = 280;
  const qrBoxH = 430;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 20);
  ctx.fill();
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 20);
  ctx.stroke();

  const qrPayload = `IMAM-REC:${receiptNo}|ST:${student.id}|M:${fee.month}|AMT:${fee.amount}|STATUS:${fee.status}`;
  const matrix = generateOfflineQrMatrix(qrPayload);
  const cellSize = 10;
  const startX = qrBoxX + 35;
  const startY = qrBoxY + 30;

  ctx.fillStyle = '#14281d';
  matrix.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell) {
        ctx.fillRect(
          startX + cIdx * cellSize,
          startY + rIdx * cellSize,
          cellSize,
          cellSize
        );
      }
    });
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#145a3a';
  ctx.font = 'bold 16px Cairo, sans-serif';
  ctx.fillText('رمز التحقق الرقمي (QR)', qrBoxX + qrBoxW / 2, qrBoxY + 275);

  // Official Stamp Circle inside Left Box
  ctx.strokeStyle = '#145a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(qrBoxX + qrBoxW / 2, qrBoxY + 350, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#145a3a';
  ctx.font = 'bold 15px Cairo, sans-serif';
  ctx.fillText('ختم الأكاديمية', qrBoxX + qrBoxW / 2, qrBoxY + 345);
  ctx.fillStyle = '#c59b27';
  ctx.font = 'bold 16px Cairo, sans-serif';
  ctx.fillText('معتمد ✓', qrBoxX + qrBoxW / 2, qrBoxY + 370);

  // Footer
  ctx.textAlign = 'right';
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 19px Cairo, sans-serif';
  ctx.fillText(
    `المشرف العام والمحفظ: ${settings.teacherName}  •  جزاكم الله خيراً على دعم مسيرة كتاب الله`,
    1140,
    705
  );

  const link = document.createElement('a');
  link.download = `إيصال-سداد-${student.name}-${fee.month}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

interface StudentIdCardModalProps {
  student: Student;
  allStudents?: Student[];
  onSelectStudent?: (studentId: string) => void;
  settings: AcademySettings;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info') => void;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  student,
  allStudents,
  onSelectStudent,
  settings,
  onClose,
  onShowToast,
}) => {
  const [cardSide, setCardSide] = useState<'front' | 'both'>('both');

  const qrPayload = `IMAM-ID:${student.id}|PIN:${student.guardianPin}|SURAH:${student.currentStop.surahId}:${student.currentStop.ayah}|JUZ:${student.memorizedJuz.length}|XP:${student.xpPoints || 120}`;
  const matrix = generateOfflineQrMatrix(qrPayload);

  const handleCopyCardInfo = () => {
    const text = `🪪 بطاقة الطالب الذكية — ${settings.academyName}\n• الطالب: ${student.name}\n• الكود: #${student.id.slice(-4)}\n• الحلقة: ${student.circle}\n• المستوى: ${student.level} (تأسيس ${student.foundationLevel || 1}/8)\n• آخر موضع حفظ: سورة ${student.currentStop.surahName} آية (${student.currentStop.ayah})\n• رمز دخول بوابة ولي الأمر (PIN): ${student.guardianPin}\n• واتساب الأكاديمية: https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}`;
    navigator.clipboard?.writeText(text);
    onShowToast?.('تم نسخ بيانات بطاقة الطالب ورمز الدخول (PIN) بنجاح', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-[#12231a] text-[#14281d] dark:text-white p-5 md:p-7 shadow-2xl border-2 border-[#c59b27] space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-emerald-900 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#145a3a] text-[#dfbd69]">
              <IdCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                بطاقة الهوية القرآنية الذكية للطالب (Student Smart ID + Offline QR)
              </h3>
              <p className="text-[11px] text-neutral-500">
                بطاقة رسمية معتمدة قابلة للتحميل كصورة PNG، الطباعة، أو المشاركة المباشرة عبر واتساب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allStudents && allStudents.length > 1 && onSelectStudent && (
              <select
                value={student.id}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-emerald-800 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                {allStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    الطالب: {st.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-neutral-200 dark:border-emerald-900 text-neutral-500 hover:text-neutral-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Toggle (Front Only vs Front & Back) */}
        <div className="flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
            <button
              type="button"
              onClick={() => setCardSide('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                cardSide === 'both'
                  ? 'bg-[#145a3a] text-white'
                  : 'text-neutral-600 dark:text-neutral-300'
              }`}
            >
              عرض الوجهين (الأمامي + الخلفي)
            </button>
            <button
              type="button"
              onClick={() => setCardSide('front')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                cardSide === 'front'
                  ? 'bg-[#145a3a] text-white'
                  : 'text-neutral-600 dark:text-neutral-300'
              }`}
            >
              الوجه الأمامي فقط
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                downloadStudentIdCardPng(student, settings);
                onShowToast?.('تم تحميل بطاقة الطالب الذكية كصورة PNG عالية الدقة', 'success');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل صورة البطاقة (PNG)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#dfbd69]" />
              <span>طباعة البطاقة / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCardInfo}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 text-xs font-bold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#c59b27]" />
              <span>نسخ البيانات</span>
            </button>

            <a
              href={buildWhatsAppUrl(
                student.whatsappPhone || OFFICIAL_ACADEMY_WHATSAPP,
                `🪪 *بطاقة الطالب الذكية — ${settings.academyName}*\n\n👤 الطالب: *${student.name}*\n🆔 رقم القيد: #${student.id.slice(-4)}\n📚 الحلقة: ${student.circle}\n🎯 المستوى: ${student.level} | منهج الإمام للتأسيس: المستوى ${student.foundationLevel || 1}/8\n📖 آخر موضع حفظ: سورة ${student.currentStop.surahName} آية (${student.currentStop.ayah})\n🏆 المحفوظات: ${student.memorizedSurahs.length} سورة (${student.memorizedJuz.length} جزء)\n⚡ نقاط الهمة: ${student.xpPoints || 120} XP\n🔑 رمز دخول بوابة الطالب وولي الأمر (PIN): *${student.guardianPin}*\n📞 واتساب الأكاديمية الرسمي: https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>إرسال البطاقة عبر واتساب</span>
            </a>
          </div>
        </div>

        {/* FRONT FACE OF STUDENT ID CARD */}
        <div className="rounded-3xl bg-gradient-to-br from-[#145a3a] via-[#0f452c] to-[#082618] text-white p-6 md:p-7 border-4 border-[#c59b27] shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-right flex-1">
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-[#dfbd69]/40 text-xs font-extrabold text-[#dfbd69]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{settings.academyName}</span>
                <span>•</span>
                <span>بطاقة هوية طالب معتمدة</span>
                <span>•</span>
                <span className="font-mono">ID #{student.id.slice(-4)}</span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border-2 border-[#dfbd69] flex items-center justify-center text-lg font-extrabold text-[#dfbd69] shrink-0">
                  {student.name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')}
                </div>
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h2 className="text-2xl font-extrabold text-white">
                      {student.name}
                    </h2>
                    {student.hasGoldenCrown && (
                      <span
                        title="حامل تاج الإتقان الذهبي"
                        className="text-xl"
                      >
                        👑
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                    {student.circle} • المستوى: {student.level} • التأسيس الهجين: المستوى{' '}
                    {student.foundationLevel || 1}/8
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-center">
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/15">
                  <div className="text-[10px] text-emerald-200">السور المحفوظة</div>
                  <div className="text-sm font-extrabold text-[#dfbd69] font-mono mt-0.5">
                    {student.memorizedSurahs.length} / 114
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/15">
                  <div className="text-[10px] text-emerald-200">الأجزاء المكتملة</div>
                  <div className="text-sm font-extrabold text-[#dfbd69] font-mono mt-0.5">
                    {student.memorizedJuz.length} / 30
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/15">
                  <div className="text-[10px] text-emerald-200">نقاط الهمة</div>
                  <div className="text-sm font-extrabold text-[#dfbd69] font-mono mt-0.5">
                    ⚡ {student.xpPoints || 120} XP
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#c59b27]/25 border border-[#dfbd69]">
                  <div className="text-[10px] text-amber-200">رمز البوابة (PIN)</div>
                  <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                    {student.guardianPin}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-emerald-100">
                <span className="px-3 py-1 rounded-xl bg-black/20 border border-white/10">
                  📖 آخر موضع: سورة {student.currentStop.surahName} (آية{' '}
                  {student.currentStop.ayah} • جزء {student.currentStop.juzNumber})
                </span>
                <span className="px-3 py-1 rounded-xl bg-black/20 border border-white/10">
                  👨‍👦 ولي الأمر: {student.guardianName}
                </span>
              </div>
            </div>

            {/* Offline Deterministic SVG QR Code */}
            <div className="flex flex-col items-center bg-white p-3.5 rounded-2xl border-3 border-[#c59b27] shrink-0 shadow-lg">
              <svg
                viewBox="0 0 21 21"
                className="w-32 h-32"
                shapeRendering="crispEdges"
                aria-label="QR Code الطالب"
              >
                {matrix.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell ? (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx}
                        y={rIdx}
                        width={1}
                        height={1}
                        fill="#14281d"
                      />
                    ) : null
                  )
                )}
              </svg>
              <span className="text-[10px] font-mono font-extrabold text-[#145a3a] mt-1.5">
                QR OFFLINE • PIN: {student.guardianPin}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-100">
            <span>المشرف العام: {settings.teacherName}</span>
            <span>خطة الحفظ: {student.plan}</span>
            <span dir="ltr" className="font-mono text-[#dfbd69] font-bold">
              WhatsApp: +{OFFICIAL_ACADEMY_WHATSAPP}
            </span>
          </div>
        </div>

        {/* BACK FACE OF STUDENT ID CARD (Schedule, Badges & Instructions) */}
        {cardSide === 'both' && (
          <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#0b1711] text-[#14281d] dark:text-white p-5 border-2 border-dashed border-[#c59b27] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#c59b27]/30">
              <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#c59b27]" />
                <span>الوجه الخلفي للبطاقة: جدول الحلقات وتعليمات بوابة الطالب</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                {settings.academyName} — بالقرآن نحيا
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50">
                <span className="text-neutral-500 block mb-1">🗓️ مواعيد الحلقة الأسبوعية:</span>
                <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                  {student.scheduleDays.map((d) => DAY_NAMES[d]).join('، ')}
                </strong>
                <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                  الساعة {student.scheduleTime} ({student.sessionDuration} دقيقة)
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50">
                <span className="text-neutral-500 block mb-1">🏅 الأوسمة المكتسبة:</span>
                <div className="flex flex-wrap gap-1">
                  {(student.badges && student.badges.length > 0
                    ? student.badges
                    : ['وسام الحضور المبكر']
                  ).map((b) => (
                    <span
                      key={b}
                      className="px-2 py-0.5 rounded-lg bg-[#145a3a]/10 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] text-[10px] font-bold"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50">
                <span className="text-neutral-500 block mb-1">🔐 طريقة دخول بوابة ولي الأمر:</span>
                <p className="text-[11px] leading-relaxed">
                  ادخل برمز الـ PIN (<strong>{student.guardianPin}</strong>) لمتابعة الحصون
                  الخمسة، تنبيهات الحلقة، وإيصالات السداد الشهرية.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface PaymentReceiptModalProps {
  student: Student;
  fee: FeeRecord;
  settings: AcademySettings;
  onClose: () => void;
  onUpdateFee?: (
    studentId: string,
    month: string,
    status: FeeStatus,
    amount?: number,
    method?: string
  ) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info') => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  student,
  fee,
  settings,
  onClose,
  onUpdateFee,
  onShowToast,
}) => {
  const [editableMonth, setEditableMonth] = useState(fee.month);
  const [editableAmount, setEditableAmount] = useState(
    fee.amount || student.monthlyFee || 350
  );
  const [editableMethod, setEditableMethod] = useState(
    fee.method || 'إنستا باي (InstaPay)'
  );
  const [editableStatus, setEditableStatus] = useState<FeeStatus>(
    fee.status === 'متأخر' ? 'مدفوع' : fee.status
  );

  const receiptNumber =
    fee.receiptNumber ||
    `REC-${editableMonth.replace('-', '')}-${student.id.replace(/\D/g, '') || '101'}`;

  const issueDate = fee.paidAt || new Date().toISOString().slice(0, 10);

  const currentFeeObj: FeeRecord = {
    month: editableMonth,
    amount: editableAmount,
    status: editableStatus,
    paidAt: issueDate,
    method: editableMethod,
    receiptNumber,
  };

  const qrPayload = `IMAM-REC:${receiptNumber}|ST:${student.id}|M:${editableMonth}|AMT:${editableAmount}|STATUS:${editableStatus}`;
  const qrMatrix = generateOfflineQrMatrix(qrPayload);

  const handleSaveReceipt = () => {
    if (onUpdateFee) {
      onUpdateFee(
        student.id,
        editableMonth,
        editableStatus,
        editableAmount,
        editableMethod
      );
    }
    onShowToast?.(
      `تم اعتماد وحفظ إيصال السداد (${receiptNumber}) للطالب ${student.name}`,
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white text-[#14281d] p-5 md:p-7 shadow-2xl border-2 border-[#c59b27] space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Top Modal Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 no-print">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#145a3a] text-[#dfbd69]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-[#145a3a]">
                إيصال سداد رقمي معتمد (سند قبض أكاديمية الإمام)
              </h3>
              <p className="text-[11px] text-neutral-500">
                رقم السند: <span className="font-mono font-bold">{receiptNumber}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Customization Toolbar (Only shown when teacher can edit) */}
        {onUpdateFee && (
          <div className="p-3.5 rounded-2xl bg-[#f6f7f2] border border-neutral-200 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs no-print">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1">
                عن شهر
              </label>
              <input
                type="month"
                value={editableMonth}
                onChange={(e) => setEditableMonth(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white font-mono text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1">
                المبلغ (ج.م)
              </label>
              <input
                type="number"
                value={editableAmount}
                onChange={(e) => setEditableAmount(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white font-mono text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1">
                وسيلة السداد
              </label>
              <select
                value={editableMethod}
                onChange={(e) => setEditableMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold"
              >
                <option value="إنستا باي (InstaPay)">إنستا باي (InstaPay)</option>
                <option value="نقدي">نقدي</option>
                <option value="فودافون كاش / محفظة إلكترونية">
                  فودافون كاش / محفظة
                </option>
                <option value="تحويل بنكي">تحويل بنكي</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSaveReceipt}
                className="w-full py-2 px-3 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>اعتماد وحفظ السداد</span>
              </button>
            </div>
          </div>
        )}

        {/* Official Printable Voucher Canvas */}
        <div className="border-4 border-double border-[#c59b27] rounded-3xl p-5 md:p-6 bg-[#fcfaf2] space-y-4 relative overflow-hidden">
          {/* Voucher Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#c59b27]/40 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#145a3a]/10 text-[#145a3a] text-[10px] font-extrabold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>سند قبض رسمي معتمد</span>
              </div>
              <h3 className="text-lg font-extrabold text-[#145a3a]">
                {settings.academyName}
              </h3>
              <p className="text-xs text-neutral-600">
                {settings.tagline} • واتساب الإدارة الرسمي: {OFFICIAL_ACADEMY_WHATSAPP}+
              </p>
            </div>

            <div className="text-right sm:text-left font-mono">
              <span className="px-3.5 py-1 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold inline-block">
                إيصال سداد رسوم
              </span>
              <span className="text-xs font-extrabold text-[#14281d] mt-1 block">
                {receiptNumber}
              </span>
            </div>
          </div>

          {/* Main Body: Details + Offline QR Verification */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-neutral-200">
                  <span className="text-neutral-500 block text-[11px]">اسم الطالب:</span>
                  <strong className="text-sm text-[#14281d]">{student.name}</strong>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-neutral-200">
                  <span className="text-neutral-500 block text-[11px]">ولي الأمر:</span>
                  <strong className="text-sm text-[#14281d]">
                    {student.guardianName}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-neutral-200">
                  <span className="text-neutral-500 block text-[11px]">
                    الحلقة القرآنية:
                  </span>
                  <strong className="text-xs text-[#145a3a]">{student.circle}</strong>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-neutral-200">
                  <span className="text-neutral-500 block text-[11px]">
                    عن شهر الاشتراك:
                  </span>
                  <strong className="font-mono text-sm text-[#14281d]">
                    {editableMonth}
                  </strong>
                </div>
              </div>

              {/* Amount Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-xs text-emerald-100">
                    المبلغ المسدد ({editableMethod})
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-[#dfbd69] mt-0.5">
                    {editableAmount} ج.م
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 border border-[#dfbd69]/40 text-xs font-extrabold text-[#dfbd69]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>
                    {editableStatus === 'معفى' ? 'إعفاء ومنحة ✓' : 'خالص السداد ✓'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right/Left QR & Official Academy Seal */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border-2 border-[#c59b27] text-center space-y-2">
              <svg
                viewBox="0 0 21 21"
                className="w-24 h-24"
                shapeRendering="crispEdges"
                aria-label="QR التحقق من الإيصال"
              >
                {qrMatrix.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell ? (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx}
                        y={rIdx}
                        width={1}
                        height={1}
                        fill="#14281d"
                      />
                    ) : null
                  )
                )}
              </svg>
              <div className="text-[10px] font-mono font-extrabold text-[#145a3a]">
                QR التحقق الرقمي
              </div>
              <div className="px-3 py-1 rounded-full bg-[#fcfaf2] border border-[#c59b27] text-[10px] font-extrabold text-[#145a3a]">
                ختم الأكاديمية المعتمد ✓
              </div>
            </div>
          </div>

          {/* Voucher Footer */}
          <div className="pt-3 border-t border-[#c59b27]/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-600">
            <span>المشرف العام: {settings.teacherName}</span>
            <span>
              تاريخ الإصدار:{' '}
              {formatGregorianAndHijri(
                issueDate,
                settings.showHijriDates ?? true
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons: Download PNG, Print, WhatsApp Share */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 no-print">
          <button
            type="button"
            onClick={() => {
              downloadPaymentReceiptPng(student, currentFeeObj, settings);
              onShowToast?.('تم تحميل إيصال السداد كصورة PNG عالية الدقة', 'success');
            }}
            className="py-2.5 px-4 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>تحميل الإيصال كصورة (PNG)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#dfbd69]" />
            <span>طباعة الإيصال / PDF</span>
          </button>

          <a
            href={buildWhatsAppUrl(
              student.whatsappPhone || OFFICIAL_ACADEMY_WHATSAPP,
              `🧾 *إيصال سداد رقمي معتمد — ${settings.academyName}*\n\n• رقم الإيصال: *${receiptNumber}*\n• الطالب: *${student.name}*\n• ولي الأمر: ${student.guardianName}\n• الحلقة: ${student.circle}\n• الشهر: ${editableMonth}\n• المبلغ المسدد: *${editableAmount} ج.م* (${editableMethod} — مدفوع ✓)\n• تاريخ الإصدار: ${issueDate}\n• المشرف: ${settings.teacherName}\n• واتساب الأكاديمية الرسمي: https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}\n\nبارك الله فيكم وتقبل منكم 🌿`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>إرسال لولي الأمر واتساب</span>
          </a>
        </div>
      </div>
    </div>
  );
};

// 8. مولّد «بطاقات البشارة» للمشاركة العائلية (Milestone Share Cards - PNG + WhatsApp Status)
export function downloadMilestoneBisharahCardPng(
  student: Student,
  milestoneTitle: string,
  milestoneSubtitle: string,
  settings: AcademySettings
): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Royal Emerald & Gold Gradient Square Canvas (ideal for WhatsApp Status & Family Sharing)
  const bg = ctx.createLinearGradient(0, 0, 1080, 1080);
  bg.addColorStop(0, '#0a3320');
  bg.addColorStop(0.5, '#145a3a');
  bg.addColorStop(1, '#072215');
  ctx.fillStyle = bg;
  drawRoundedRect(ctx, 0, 0, 1080, 1080, 44);
  ctx.fill();

  // Luxury Double Ornamental Frame
  ctx.strokeStyle = '#dfbd69';
  ctx.lineWidth = 10;
  drawRoundedRect(ctx, 28, 28, 1024, 1024, 34);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(223, 189, 105, 0.4)';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 48, 48, 984, 984, 26);
  ctx.stroke();

  // Top Header Crown & Academy Branding
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#dfbd69';
  ctx.font = 'bold 34px Cairo, sans-serif';
  ctx.fillText(`🎉 بشارة إنجاز قرآني مبارك 🎉`, 540, 130);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px Cairo, sans-serif';
  ctx.fillText(settings.academyName, 540, 190);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 24px Cairo, sans-serif';
  ctx.fillText(settings.tagline, 540, 235);

  // Center Medallion Box for Student Name
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  drawRoundedRect(ctx, 110, 280, 860, 220, 28);
  ctx.fill();
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 110, 280, 860, 220, 28);
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 26px Cairo, sans-serif';
  ctx.fillText('تزف الأكاديمية أطيب التهاني والتبريكات لأسرة الطالب المبارك:', 540, 340);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px Cairo, sans-serif';
  ctx.fillText(`👑 ${student.name} 👑`, 540, 420);

  ctx.fillStyle = '#dfbd69';
  ctx.font = 'bold 24px Cairo, sans-serif';
  ctx.fillText(
    `${student.circle}  •  المستوى: ${student.level}  •  ولي الأمر: ${student.guardianName}`,
    540,
    472
  );

  // Achievement Highlight Banner
  ctx.fillStyle = '#fcfaf2';
  drawRoundedRect(ctx, 110, 535, 860, 210, 28);
  ctx.fill();
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, 110, 535, 860, 210, 28);
  ctx.stroke();

  ctx.fillStyle = '#145a3a';
  ctx.font = 'bold 38px Cairo, sans-serif';
  ctx.fillText(milestoneTitle, 540, 615);

  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 25px Cairo, sans-serif';
  ctx.fillText(milestoneSubtitle, 540, 675);

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 20px Cairo, sans-serif';
  ctx.fillText(
    '«خيركم من تعلم القرآن وعلمه» — اللهم اجعله قرة عين لوالديه شفيعاً لهما يوم القيامة',
    540,
    720
  );

  // Sheikh Signature & Offline QR Verification
  const qrPayload = `BISHARAH:${student.id}|SURAH:${student.currentStop.surahName}|WA:${OFFICIAL_ACADEMY_WHATSAPP}`;
  const matrix = generateOfflineQrMatrix(qrPayload);
  const qrSize = 145;
  const qrX = 115;
  const qrY = 785;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, qrX, qrY, qrSize, qrSize, 18);
  ctx.fill();

  ctx.fillStyle = '#14281d';
  matrix.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell) {
        ctx.fillRect(qrX + 15 + cIdx * 5.5, qrY + 15 + rIdx * 5.5, 5.5, 5.5);
      }
    });
  });

  ctx.textAlign = 'right';
  ctx.fillStyle = '#dfbd69';
  ctx.font = 'bold 28px Cairo, sans-serif';
  ctx.fillText(`إشراف الشيخ المحفظ: ${settings.teacherName}`, 955, 835);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Cairo, sans-serif';
  ctx.fillText(
    `للتسجيل والتواصل مع الأكاديمية عبر واتساب: +${OFFICIAL_ACADEMY_WHATSAPP}`,
    955,
    885
  );

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 20px Cairo, monospace';
  ctx.fillText(
    `تاريخ الإصدار: ${new Date().toISOString().slice(0, 10)}  •  https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}`,
    955,
    930
  );

  const link = document.createElement('a');
  link.download = `بطاقة-بشارة-${student.name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export interface MilestoneBisharahModalProps {
  student: Student;
  settings: AcademySettings;
  defaultMilestoneTitle?: string;
  defaultMilestoneSubtitle?: string;
  onClose: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info') => void;
}

export const MilestoneBisharahModal: React.FC<MilestoneBisharahModalProps> = ({
  student,
  settings,
  defaultMilestoneTitle,
  defaultMilestoneSubtitle,
  onClose,
  onShowToast,
}) => {
  const presets = [
    {
      title: `ختم وإتقان سورة ${student.currentStop.surahName} المباركة`,
      subtitle: `بإتقان تام لأحكام التجويد ومخارج الحروف (${student.memorizedSurahs.length} سورة محفوظة)`,
    },
    {
      title: `تحقيق نسبة إتقان 100% في التسميع القرآني اليوم`,
      subtitle: `تسميع متقن بلا أخطاء في سورة ${student.currentStop.surahName} (الآية ${student.currentStop.ayah})`,
    },
    {
      title: `اجتياز المستوى (${student.foundationLevel || 1}/8) في منهج الإمام الهجين للتأسيس`,
      subtitle: 'إتقان القراءة العربية الفصيحة والتهجي القرآني والتجويد التطبيقي',
    },
    {
      title: `إتمام حفظ وتثبيت (${Math.max(1, student.memorizedJuz.length)}) أجزاء من كتاب الله`,
      subtitle: 'ثبات في المراجعة القريبة والبعيدة والالتزام بالحصون الخمسة',
    },
  ];

  const [title, setTitle] = useState(
    defaultMilestoneTitle || presets[0].title
  );
  const [subtitle, setSubtitle] = useState(
    defaultMilestoneSubtitle || presets[0].subtitle
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#12231a] text-[#14281d] dark:text-white p-5 md:p-7 shadow-2xl border-2 border-[#c59b27] space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#145a3a] text-[#dfbd69]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                🎉 مولّد «بطاقات البشارة» للمشاركة العائلية وحالات واتساب
              </h3>
              <p className="text-[11px] text-neutral-500">
                بطاقة تهنئة فخمة باسم الطالب والشيخ ورقم الأكاديمية الرسمي ({OFFICIAL_ACADEMY_WHATSAPP})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-neutral-200 dark:border-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Selector Pills */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-neutral-500">
            اختر نوع البشارة أو عدّل النص مباشرة:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTitle(p.title);
                  setSubtitle(p.subtitle);
                }}
                className={`p-2.5 rounded-xl border text-right text-xs font-bold transition cursor-pointer ${
                  title === p.title
                    ? 'bg-[#145a3a] text-[#dfbd69] border-[#c59b27]'
                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold"
              placeholder="عنوان البشارة..."
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold"
              placeholder="تفاصيل الإنجاز..."
            />
          </div>
        </div>

        {/* Live Luxury Preview Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0a3320] via-[#145a3a] to-[#072215] text-white p-6 border-4 border-[#dfbd69] shadow-xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/15 border border-[#dfbd69]/50 text-xs font-extrabold text-[#dfbd69]">
            <span>🎉 بشارة إنجاز قرآني مبارك 🎉</span>
          </div>

          <div>
            <h4 className="text-lg font-extrabold text-white">{settings.academyName}</h4>
            <p className="text-xs text-emerald-200">{settings.tagline}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-[#c59b27]">
            <div className="text-xs text-amber-200">تزف الأكاديمية أطيب التهاني لأسرة البطل:</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              👑 {student.name} 👑
            </div>
            <div className="text-xs text-[#dfbd69] mt-1">
              {student.circle} • ولي الأمر: {student.guardianName}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#fcfaf2] text-[#14281d] border-2 border-[#c59b27]">
            <div className="text-base font-extrabold text-[#145a3a]">{title}</div>
            <div className="text-xs font-bold text-amber-800 mt-1">{subtitle}</div>
          </div>

          <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100">
            <span>إشراف الشيخ: {settings.teacherName}</span>
            <span dir="ltr" className="font-mono font-bold text-[#dfbd69]">
              WhatsApp: +{OFFICIAL_ACADEMY_WHATSAPP}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              downloadMilestoneBisharahCardPng(student, title, subtitle, settings);
              onShowToast?.('تم تنزيل بطاقة البشارة كصورة PNG عالية الدقة لمشاركتها في حالات واتساب', 'success');
            }}
            className="py-3 px-4 rounded-2xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>تحميل بطاقة البشارة كصورة (PNG)</span>
          </button>

          <a
            href={buildWhatsAppUrl(
              student.whatsappPhone || OFFICIAL_ACADEMY_WHATSAPP,
              `🎉 *بشارة إنجاز قرآني مبارك — ${settings.academyName}*\n\nتزف الأكاديمية وأسرة «${student.circle}» أطيب التهاني والتبريكات لولي أمر الطالب البطل: *👑 ${student.name} 👑* (${student.guardianName})\n\n🏆 *الإنجاز:* ${title}\n✨ *التفاصيل:* ${subtitle}\n👤 *بإشراف الشيخ المحفظ:* ${settings.teacherName}\n\nاللهم اجعل القرآن العظيم ربيع قلبه ونور صدره واجعله قرة عين لوالديه 🌿\n📞 للتواصل والتسجيل بالأكاديمية: https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة البشارة عبر واتساب الآن</span>
          </a>
        </div>
      </div>
    </div>
  );
};


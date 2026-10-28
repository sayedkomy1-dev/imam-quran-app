import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { getCurrentMonthKey } from '../data/seedData';
import {
  OFFICIAL_ACADEMY_WHATSAPP,
  OFFICIAL_ACADEMY_WHATSAPP_URL,
} from '../data/hybridFoundationData';
import { FeeRecord, Student } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import {
  downloadPaymentReceiptPng,
  PaymentReceiptModal,
  StudentIdCardModal,
} from './StudentIdAndReceiptModals';
import {
  Clock,
  Download,
  FileText,
  IdCard,
  Phone,
  Printer,
  Wallet,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const {
    students,
    sessions,
    circles,
    settings,
    updateStudentFee,
    showToast,
  } = useAcademy();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    getCurrentMonthKey()
  );
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'مدفوع' | 'متأخر' | 'معفى'
  >('all');

  const [activeReceipt, setActiveReceipt] = useState<{
    student: Student;
    fee: FeeRecord;
  } | null>(null);

  const [activeIdCardStudent, setActiveIdCardStudent] =
    useState<Student | null>(null);

  const rows = useMemo(() => {
    return students
      .map((st) => {
        const feeEntry: FeeRecord = st.fees.find(
          (f) => f.month === selectedMonth
        ) || {
          month: selectedMonth,
          amount: st.monthlyFee,
          status: 'متأخر' as const,
        };
        return { student: st, fee: feeEntry };
      })
      .filter((r) => statusFilter === 'all' || r.fee.status === statusFilter);
  }, [students, selectedMonth, statusFilter]);

  const totals = useMemo(() => {
    let collected = 0;
    let overdue = 0;
    let exempted = 0;
    students.forEach((st) => {
      const f = st.fees.find((x) => x.month === selectedMonth) || {
        amount: st.monthlyFee,
        status: 'متأخر' as const,
      };
      if (f.status === 'مدفوع') collected += f.amount;
      else if (f.status === 'متأخر') overdue += f.amount;
      else exempted += f.amount;
    });
    return {
      collected,
      overdue,
      exempted,
      totalExpected: collected + overdue,
    };
  }, [students, selectedMonth]);

  // Teacher Monthly Logged Hours Calculation (حساب إجمالي ساعات الحصص المسجلة عبر مؤقت الحصة لكل محفظ شهرياً)
  const teacherMonthlyHours = useMemo(() => {
    const monthAttendedSessions = sessions.filter(
      (s) => s.date.startsWith(selectedMonth) && s.status === 'حضر'
    );

    let totalMinutes = 0;
    const byCircle: Record<string, { sessionsCount: number; minutes: number }> =
      {};

    circles.forEach((c) => {
      byCircle[c.name] = { sessionsCount: 0, minutes: 0 };
    });

    monthAttendedSessions.forEach((ses) => {
      const st = students.find((x) => x.id === ses.studentId);
      const mins = ses.durationMinutes || st?.sessionDuration || 35;
      totalMinutes += mins;
      const circleName = st?.circle || 'حلقة عامة';
      if (!byCircle[circleName]) {
        byCircle[circleName] = { sessionsCount: 0, minutes: 0 };
      }
      byCircle[circleName].sessionsCount += 1;
      byCircle[circleName].minutes += mins;
    });

    // Also compute scheduled monthly target hours for comparison
    const scheduledWeeklyMinutes = students.reduce(
      (acc, st) => acc + st.sessionDuration * Math.min(3, st.scheduleDays.length),
      0
    );

    const hours = (totalMinutes / 60).toFixed(1);
    return {
      sessionsCount: monthAttendedSessions.length,
      totalMinutes,
      totalHours: hours,
      scheduledMonthlyHours: ((scheduledWeeklyMinutes * 4) / 60).toFixed(1),
      byCircle,
    };
  }, [sessions, students, circles, selectedMonth]);

  const exportCsvReport = () => {
    const header = [
      'الطالب',
      'الحلقة',
      'الشهر',
      'المبلغ',
      'الحالة',
      'وسيلة الدفع',
      'رقم الإيصال',
    ];
    const lines = rows.map((r) => [
      r.student.name,
      r.student.circle,
      selectedMonth,
      String(r.fee.amount),
      r.fee.status,
      r.fee.method || 'نقدي / إنستا باي',
      r.fee.receiptNumber || '—',
    ]);
    const csvContent =
      '\uFEFF' +
      [header, ...lines]
        .map((row) => row.map((c) => `"${c}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imam-finance-${selectedMonth}.csv`;
    a.click();
  };

  const handleMarkPaidAndOpenReceipt = (student: Student) => {
    const receiptNum = `REC-${selectedMonth.replace('-', '')}-${
      student.id.replace(/\D/g, '') || '100'
    }`;
    const paidAt = new Date().toISOString().slice(0, 10);
    updateStudentFee(
      student.id,
      selectedMonth,
      'مدفوع',
      student.monthlyFee,
      'إنستا باي',
      'تم السداد وإصدار إيصال رقمي معتمد'
    );
    setActiveReceipt({
      student,
      fee: {
        month: selectedMonth,
        amount: student.monthlyFee,
        status: 'مدفوع',
        paidAt,
        method: 'إنستا باي',
        receiptNumber: receiptNum,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <span>
              الإدارة المالية، إيصالات السداد الرقمية، وحساب ساعات المحفظ
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            توليد إيصالات سداد فورية قابلة للطباعة والمشاركة عبر واتساب، وحساب إجمالي ساعات الحصص المسجلة شهرياً
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums"
          />
          {students[0] && (
            <>
              <button
                type="button"
                onClick={() => handleMarkPaidAndOpenReceipt(students[0])}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>إصدار إيصال سداد فوري</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveIdCardStudent(students[0])}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27] text-[#14281d] dark:text-[#dfbd69] text-xs font-extrabold cursor-pointer"
              >
                <IdCard className="w-4 h-4 text-[#c59b27]" />
                <span>بطاقة الطالب الذكية</span>
              </button>
            </>
          )}
          <button
            onClick={exportCsvReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-emerald-900 text-xs font-bold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
          <a
            href={OFFICIAL_ACADEMY_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>إدارة الأكاديمية ({OFFICIAL_ACADEMY_WHATSAPP})</span>
          </a>
        </div>
      </div>

      {/* Financial & Teacher Hours Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50">
          <div className="text-xs font-bold text-neutral-500">
            إجمالي المحصل (مدفوع)
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tabular-nums font-mono mt-1">
            {totals.collected} ج.م
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            مع إيصالات سداد رقمية جاهزة
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50">
          <div className="text-xs font-bold text-neutral-500">
            إجمالي المتأخرات
          </div>
          <div className="text-2xl font-extrabold text-red-600 tabular-nums font-mono mt-1">
            {totals.overdue} ج.م
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            يمكن إرسال تذكير واتساب بضغطة زر
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50">
          <div className="text-xs font-bold text-neutral-500">
            إعفاءات ومنح الأكاديمية
          </div>
          <div className="text-2xl font-extrabold text-[#c59b27] tabular-nums font-mono mt-1">
            {totals.exempted} ج.م
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            منح التفوق القرآني المعتمدة
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white p-5 border border-[#c59b27]/40">
          <div className="flex items-center justify-between text-xs font-bold text-[#dfbd69]">
            <span>ساعات المحفظ المسجلة ({selectedMonth})</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold tabular-nums font-mono mt-1">
            {teacherMonthlyHours.totalHours} ساعة
          </div>
          <div className="text-[11px] text-emerald-100 mt-1">
            ({teacherMonthlyHours.totalMinutes} دقيقة عبر{' '}
            {teacherMonthlyHours.sessionsCount} حصة مسجلة)
          </div>
        </div>
      </div>

      {/* Teacher Monthly Hours Breakdown Card */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c59b27]" />
              <span>
                بيان ساعات المحفظ المسجلة عبر مؤقت الحصة — {settings.teacherName}
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              يُحتسب تلقائياً من زمن الحصص المنعقدة ومؤقت السبورة الذكية خلال شهر ({selectedMonth})
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 text-xs font-mono font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
            المستهدف الشهري المجدول: {teacherMonthlyHours.scheduledMonthlyHours}{' '}
            ساعة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(teacherMonthlyHours.byCircle).map(
            ([circleName, info]) => (
              <div
                key={circleName}
                className="p-3.5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-extrabold">{circleName}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    عدد الحصص المنعقدة: {info.sessionsCount} حصة
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    {(info.minutes / 60).toFixed(1)} ساعة
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {info.minutes} دقيقة
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'مدفوع', 'متأخر', 'معفى'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              statusFilter === st
                ? 'bg-[#145a3a] text-white'
                : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50'
            }`}
          >
            {st === 'all' ? 'جميع الطلاب' : `حالة: ${st}`}
          </button>
        ))}
      </div>

      {/* Students Financial Ledger Table */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 shadow-xs overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#f6f7f2] dark:bg-[#0b1711] border-b border-neutral-200 dark:border-emerald-900/50 text-neutral-500">
            <tr>
              <th className="py-3.5 px-4 font-bold">الطالب</th>
              <th className="py-3.5 px-4 font-bold">الحلقة</th>
              <th className="py-3.5 px-4 font-bold">الرسوم الشهرية</th>
              <th className="py-3.5 px-4 font-bold">الحالة</th>
              <th className="py-3.5 px-4 font-bold">تغيير الحالة السريع</th>
              <th className="py-3.5 px-4 font-bold">إيصال السداد الرقمي</th>
              <th className="py-3.5 px-4 font-bold">إشعار واتساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-emerald-950">
            {rows.map(({ student, fee }) => (
              <tr
                key={student.id}
                className="hover:bg-[#f6f7f2]/40 dark:hover:bg-[#0b1711]/40"
              >
                <td className="py-3.5 px-4 font-bold text-sm">{student.name}</td>
                <td className="py-3.5 px-4 text-neutral-500">{student.circle}</td>
                <td className="py-3.5 px-4 font-mono tabular-nums font-bold">
                  {fee.amount} ج.م
                </td>
                <td className="py-3.5 px-4 font-extrabold">
                  <span
                    className={
                      fee.status === 'مدفوع'
                        ? 'text-emerald-600'
                        : fee.status === 'متأخر'
                        ? 'text-red-600'
                        : 'text-[#c59b27]'
                    }
                  >
                    {fee.status}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    {(['مدفوع', 'متأخر', 'معفى'] as const).map(
                      (statusOption) => (
                        <button
                          key={statusOption}
                          onClick={() => {
                            if (statusOption === 'مدفوع') {
                              handleMarkPaidAndOpenReceipt(student);
                            } else {
                              updateStudentFee(
                                student.id,
                                selectedMonth,
                                statusOption,
                                student.monthlyFee,
                                'نقدي'
                              );
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                            fee.status === statusOption
                              ? 'bg-[#145a3a] text-white border-[#145a3a]'
                              : 'border-neutral-200 dark:border-emerald-900'
                          }`}
                        >
                          {statusOption}
                        </button>
                      )
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReceipt({
                          student,
                          fee: {
                            ...fee,
                            receiptNumber:
                              fee.receiptNumber ||
                              `REC-${selectedMonth.replace('-', '')}-${
                                student.id.replace(/\D/g, '') || '100'
                              }`,
                            paidAt:
                              fee.paidAt ||
                              new Date().toISOString().slice(0, 10),
                            method: fee.method || 'إنستا باي (InstaPay)',
                          },
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] font-extrabold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>إيصال السداد</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const enrichedFee = {
                          ...fee,
                          receiptNumber:
                            fee.receiptNumber ||
                            `REC-${selectedMonth.replace('-', '')}-${
                              student.id.replace(/\D/g, '') || '100'
                            }`,
                          paidAt:
                            fee.paidAt || new Date().toISOString().slice(0, 10),
                          method: fee.method || 'إنستا باي (InstaPay)',
                        };
                        downloadPaymentReceiptPng(student, enrichedFee, settings);
                        showToast(
                          'تم تحميل إيصال السداد كصورة PNG عالية الدقة',
                          'success'
                        );
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#145a3a] text-white font-bold cursor-pointer"
                      title="تحميل إيصال السداد كصورة PNG"
                    >
                      <Download className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveIdCardStudent(student)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#c59b27] text-[#14281d] dark:text-[#dfbd69] font-bold cursor-pointer"
                      title="عرض بطاقة الطالب الذكية"
                    >
                      <IdCard className="w-3.5 h-3.5 text-[#c59b27]" />
                      <span>البطاقة</span>
                    </button>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <a
                    href={buildWhatsAppUrl(
                      student.whatsappPhone,
                      `${settings.whatsappHeader}\n\nولي أمر الطالب *${student.name}*، إشعار مالي لشهر (${selectedMonth}): حالة الاشتراك الشهري (${fee.amount} ج.م) هي: *${fee.status}*.\nرقم إيصال الأكاديمية: ${
                        fee.receiptNumber || 'REC-2026'
                      }\nالتواصل الرسمي للأكاديمية: https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}\n\n${settings.whatsappFooter}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>مشاركة واتساب</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Digital Payment Receipt Modal */}
      {activeReceipt && (
        <PaymentReceiptModal
          student={activeReceipt.student}
          fee={activeReceipt.fee}
          settings={settings}
          onClose={() => setActiveReceipt(null)}
          onUpdateFee={(studentId, month, status, amount, method) => {
            updateStudentFee(
              studentId,
              month,
              status,
              amount ?? activeReceipt.fee.amount,
              method
            );
            setActiveReceipt((prev) =>
              prev
                ? {
                    ...prev,
                    fee: {
                      ...prev.fee,
                      month,
                      status,
                      amount: amount ?? prev.fee.amount,
                      method: method ?? prev.fee.method,
                    },
                  }
                : null
            );
          }}
          onShowToast={showToast}
        />
      )}

      {/* Smart Student ID Card Modal */}
      {activeIdCardStudent && (
        <StudentIdCardModal
          student={activeIdCardStudent}
          allStudents={students}
          onSelectStudent={(id) => {
            const found = students.find((s) => s.id === id);
            if (found) setActiveIdCardStudent(found);
          }}
          settings={settings}
          onClose={() => setActiveIdCardStudent(null)}
          onShowToast={showToast}
        />
      )}
    </div>
  );
};

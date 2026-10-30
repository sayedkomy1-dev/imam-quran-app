import {
  AcademySettings,
  AttendanceStatus,
  CircleGroup,
  ErrorContext,
  ErrorType,
  FeeRecord,
  GradeType,
  JuzAssignmentItem,
  RecitationError,
  SessionRecord,
  Student,
  StudentLevel,
  StudentPlan,
  SurahRangeAssignment,
} from '../types';
import { JUZ_NAMES, SURAHS } from '../data/quranData';

function cleanSurahName(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/^سورة\s+/, '').trim();
}

function findSurahMeta(idOrName?: number | string) {
  if (typeof idOrName === 'number') {
    return SURAHS.find((s) => s.id === idOrName);
  }
  if (typeof idOrName === 'string' && idOrName.trim()) {
    const cleaned = cleanSurahName(idOrName);
    return (
      SURAHS.find((s) => s.name === cleaned) ||
      SURAHS.find((s) => s.name.includes(cleaned) || cleaned.includes(s.name))
    );
  }
  return undefined;
}

function normalizeGrade(raw?: unknown): GradeType | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const g = raw.trim();
  if (
    g === 'ممتاز' ||
    g === 'جيد جداً' ||
    g === 'جيد' ||
    g === 'ضعيف' ||
    g === 'إعادة'
  ) {
    return g;
  }
  if (g === 'جيد جدا') return 'جيد جداً';
  if (g === 'اعادة') return 'إعادة';
  return undefined;
}

function gradeToScore(grade?: GradeType): number {
  switch (grade) {
    case 'ممتاز':
      return 96;
    case 'جيد جداً':
      return 86;
    case 'جيد':
      return 76;
    case 'ضعيف':
      return 62;
    case 'إعادة':
      return 50;
    default:
      return 90;
  }
}

function parseJuzChipToItem(chip: string, idx: number, grade?: GradeType): JuzAssignmentItem {
  const c = chip.trim();
  let juzNumber = 30;
  if (c.includes('عم')) juzNumber = 30;
  else if (c.includes('تبارك')) juzNumber = 29;
  else if (c.includes('قد سمع')) juzNumber = 28;
  else if (c.includes('الذاريات') || c.includes('قال فما خطبكم')) juzNumber = 27;
  else if (c.includes('الأحقاف') || c.includes('حم')) juzNumber = 26;
  else if (c.includes('إليه يرد')) juzNumber = 25;
  else if (c.includes('فمن أظلم')) juzNumber = 24;
  else if (c.includes('وما لي')) juzNumber = 23;
  else if (c.includes('ومن يقنت')) juzNumber = 22;
  else if (c.includes('اتل ما أوحي')) juzNumber = 21;
  else if (c.includes('أمن خلق')) juzNumber = 20;
  else if (c.includes('وقال الذين')) juzNumber = 19;
  else if (c.includes('قد أفلح')) juzNumber = 18;
  else if (c.includes('اقترب')) juzNumber = 17;
  else if (c.includes('قال ألم')) juzNumber = 16;
  else if (c.includes('سبحان')) juzNumber = 15;
  else if (c.includes('ربما')) juzNumber = 14;
  else if (c.includes('وما أبرئ')) juzNumber = 13;
  else if (c.includes('وما من دابة')) juzNumber = 12;
  else if (c.includes('يعتذرون')) juzNumber = 11;
  else if (c.includes('واعلموا')) juzNumber = 10;
  else if (c.includes('قال الملأ')) juzNumber = 9;
  else if (c.includes('ولو أننا')) juzNumber = 8;
  else if (c.includes('وإذا سمعوا')) juzNumber = 7;
  else if (c.includes('لا يحب الله')) juzNumber = 6;
  else if (c.includes('والمحصنات')) juzNumber = 5;
  else if (c.includes('لن تنالوا')) juzNumber = 4;
  else if (c.includes('تلك الرسل')) juzNumber = 3;
  else if (c.includes('سيقول')) juzNumber = 2;
  else if (c.includes('ألم')) juzNumber = 1;

  let scope: JuzAssignmentItem['scope'] = 'full';
  if (c.includes('الربع الأول')) scope = 'q1';
  else if (c.includes('الربع الثاني')) scope = 'q2';
  else if (c.includes('الربع الثالث')) scope = 'q3';
  else if (c.includes('الربع الرابع')) scope = 'q4';
  else if (c.includes('الربع الخامس')) scope = 'q5';
  else if (c.includes('الربع السادس')) scope = 'q6';
  else if (c.includes('الربع السابع')) scope = 'q7';
  else if (c.includes('الربع الثامن')) scope = 'q8';
  else if (c.includes('الحزب الأول')) scope = 'hizb1';
  else if (c.includes('الحزب الثاني')) scope = 'hizb2';

  return {
    id: `jz-imp-${juzNumber}-${idx}`,
    juzNumber,
    juzName: JUZ_NAMES[juzNumber - 1] || `الجزء ${juzNumber}`,
    scope,
    label: c,
    grade,
  };
}

function mapPortableErrorType(rawType?: string, rawGroup?: string): ErrorType {
  if (!rawType) return 'حفظ';
  const t = rawType.trim();
  if (t === 'تردد') return 'تردد';
  if (t === 'تلقين') return 'تلقين';
  if (t === 'نسيان آية') return 'نسيان آية';
  if (t === 'تشكيل' || t.includes('حركة') || t.includes('ضبط')) return 'تشكيل';
  if (
    t === 'تجويد' ||
    rawGroup === 'tajweed' ||
    t.includes('غنه') ||
    t.includes('غنة') ||
    t.includes('مد') ||
    t.includes('إقلاب') ||
    t.includes('إخفاء') ||
    t.includes('إدغام') ||
    t.includes('وقف') ||
    t.includes('تجويد')
  ) {
    return 'تجويد';
  }
  return 'حفظ';
}

function mapPortableErrorContext(mode?: string): ErrorContext {
  if (mode === 'new_read') return 'الحفظ الجديد';
  if (mode === 'near_review') return 'المراجعة القريبة';
  if (mode === 'far_review') return 'المراجعة البعيدة';
  return 'التسميع';
}

export function normalizePortableSession(rawObj: Record<string, unknown>): SessionRecord {
  // Check if already in v13 format
  if (
    rawObj.juzReview &&
    typeof (rawObj.juzReview as Record<string, unknown>).enabled === 'boolean' &&
    rawObj.surahReview &&
    Array.isArray((rawObj.surahReview as Record<string, unknown>).surahNames) &&
    Array.isArray(rawObj.errors)
  ) {
    return rawObj as unknown as SessionRecord;
  }

  const id = String(rawObj.id || `ses-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const studentId = String(rawObj.studentId || '');
  const rawDateStr = String(rawObj.sessionDate || rawObj.date || new Date().toISOString());
  const date = rawDateStr.slice(0, 10);

  const rawStatus = String(rawObj.status || 'حضر');
  const status: AttendanceStatus =
    rawStatus === 'غاب' || rawStatus === 'إجازة' ? rawStatus : 'حضر';

  const prevGrades = (rawObj.prevGrades || {}) as Record<string, unknown>;
  const assessmentScores = (rawObj.assessmentScores || {}) as Record<string, number>;
  const directions = (rawObj.directions || {}) as Record<string, number>;

  const newGrade = normalizeGrade(prevGrades.new);
  const nearGrade = normalizeGrade(prevGrades.rec);
  const farGrade = normalizeGrade(prevGrades.far);
  const juzGrade = normalizeGrade(prevGrades.juz);
  const surahGrade = normalizeGrade(prevGrades.surahReview);

  const buildRangeAssignment = (
    rangeRaw: unknown,
    dirVal?: number,
    fallbackGrade?: GradeType,
    pctVal?: number
  ): SurahRangeAssignment | undefined => {
    if (!rangeRaw || typeof rangeRaw !== 'object') return undefined;
    const r = rangeRaw as Record<string, unknown>;
    const surahMeta = findSurahMeta((r.surahId as number | undefined) || (r.surah as string | undefined));
    const surahName = surahMeta?.name || cleanSurahName(String(r.surah || ''));
    if (!surahName) return undefined;
    const surahId = surahMeta?.id || Number(r.surahId) || 1;
    const fromAyah = Math.max(1, Number(r.from) || 1);
    const toAyah = Math.max(fromAyah, Number(r.to) || surahMeta?.ayahs || fromAyah);
    const isFullSurah = Boolean(r.full) || (fromAyah === 1 && toAyah === (surahMeta?.ayahs || -1));
    const grade = normalizeGrade(r.grade) || fallbackGrade;

    return {
      enabled: true,
      surahId,
      surahName,
      isFullSurah,
      fromAyah,
      toAyah,
      direction: dirVal === -1 ? 'desc' : 'asc',
      grade,
      percentage: typeof pctVal === 'number' ? pctVal : undefined,
    };
  };

  const newMemorization =
    (rawObj.newMemorization as SurahRangeAssignment | undefined) ||
    buildRangeAssignment(rawObj.new, directions.new, newGrade, assessmentScores.new);

  const nearReview =
    (rawObj.nearReview as SurahRangeAssignment | undefined) ||
    buildRangeAssignment(rawObj.rec, directions.rec, nearGrade, assessmentScores.rec);

  const farReview =
    (rawObj.farReview as SurahRangeAssignment | undefined) ||
    buildRangeAssignment(rawObj.far, directions.far, farGrade, assessmentScores.far);

  let actualRecitation: SessionRecord['actualRecitation'] = undefined;
  if (rawObj.actualRecitation && typeof rawObj.actualRecitation === 'object') {
    const actObj = rawObj.actualRecitation as Record<string, unknown>;
    if (actObj.surahName) {
      actualRecitation = actObj as unknown as SessionRecord['actualRecitation'];
    } else if (actObj.new && typeof actObj.new === 'object') {
      const built = buildRangeAssignment(actObj.new, directions.new, newGrade, assessmentScores.new);
      if (built) {
        actualRecitation = {
          ...built,
          stopAyah: built.toAyah,
          completedStatus: 'كامل',
        };
      }
    }
  }

  // Juz review
  const rawJuz = (rawObj.juz || {}) as { chips?: string[] };
  const juzChips = Array.isArray(rawJuz.chips) ? rawJuz.chips : [];
  const juzItems: JuzAssignmentItem[] = juzChips.map((chip, idx) =>
    parseJuzChipToItem(chip, idx, juzGrade)
  );

  // Surah review
  const rawSurahRev = (rawObj.surahReview || {}) as { chips?: string[]; surahNames?: string[] };
  const surahChips = Array.isArray(rawSurahRev.surahNames)
    ? rawSurahRev.surahNames
    : Array.isArray(rawSurahRev.chips)
    ? rawSurahRev.chips.map((c) => cleanSurahName(c)).filter(Boolean)
    : [];

  // Also extract surah names from reviewAssignments if surahChips is empty
  if (surahChips.length === 0 && Array.isArray(rawObj.reviewAssignments)) {
    for (const assign of rawObj.reviewAssignments as Record<string, unknown>[]) {
      if (assign.type === 'surah_group' && Array.isArray(assign.items)) {
        for (const item of assign.items as Record<string, unknown>[]) {
          const sName = cleanSurahName(String(item.surahName || item.label || ''));
          if (sName && !surahChips.includes(sName)) {
            surahChips.push(sName);
          }
        }
      }
    }
  }

  // Recitation errors
  const rawRecErrors = Array.isArray(rawObj.recitationErrors)
    ? (rawObj.recitationErrors as Record<string, unknown>[])
    : [];
  const errors: RecitationError[] = rawRecErrors.map((err, idx) => {
    const rawTypeStr = String(err.type || 'حفظ');
    const rawGroupStr = String(err.group || '');
    return {
      id: String(err.id || `err-${id}-${idx}`),
      type: mapPortableErrorType(rawTypeStr, rawGroupStr),
      context: mapPortableErrorContext(String(err.mode || '')),
      surah: cleanSurahName(String(err.surah || '')),
      ayah: Number(err.ayah) || undefined,
      word: err.word ? String(err.word) : undefined,
      wordIndex: typeof err.wordIndex === 'number' ? err.wordIndex : undefined,
      letter: err.charText ? String(err.charText) : undefined,
      subType: rawTypeStr,
      correctedInSession: Boolean(err.resolved),
      followUpStatus: err.resolved ? 'mastered' : 'open',
      timestamp: String(err.at || rawDateStr).slice(0, 10),
    };
  });

  // Mastery score calculation
  let masteryScore = typeof rawObj.masteryScore === 'number' ? rawObj.masteryScore : 0;
  if (!masteryScore) {
    if (status !== 'حضر') {
      masteryScore = 0;
    } else {
      const scoreValues = Object.values(assessmentScores).filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      if (scoreValues.length > 0) {
        masteryScore = Math.round(
          scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
        );
      } else {
        const gradesList = [newGrade, nearGrade, farGrade, juzGrade, surahGrade].filter(
          (g): g is GradeType => Boolean(g)
        );
        if (gradesList.length > 0) {
          masteryScore = Math.round(
            gradesList.reduce((acc, g) => acc + gradeToScore(g), 0) / gradesList.length
          );
        } else {
          masteryScore = Math.max(70, 94 - errors.length * 3);
        }
      }
    }
  }

  const rawNotes = String(rawObj.parentNotes || rawObj.notes || '').trim();
  const rawSummary = String(rawObj.summary || '').trim();
  const parentNotes =
    rawNotes ||
    (rawSummary && rawSummary !== 'حصة مسجلة'
      ? `تم تسميع وتكليف: ${rawSummary}`
      : 'أتم الطالب الحصة بنجاح، بارك الله في همته.');

  return {
    id,
    studentId,
    date,
    status,
    masteryScore,
    previousEvaluation: {
      newGrade,
      nearGrade,
      farGrade,
      juzGrade,
      surahGrade,
    },
    sectionPercentages: {
      newMem: assessmentScores.new,
      nearRev: assessmentScores.rec,
      farRev: assessmentScores.far,
    },
    actualRecitation,
    errors,
    newMemorization,
    nearReview,
    farReview,
    juzReview: {
      enabled: juzItems.length > 0,
      items: juzItems,
      direction: directions.juz === -1 ? 'desc' : 'asc',
    },
    surahReview: {
      enabled: surahChips.length > 0,
      surahNames: surahChips,
      direction: directions.surahReview === -1 ? 'desc' : 'asc',
    },
    parentNotes,
    syncStatus: 'تمت المزامنة',
    createdAt: String(rawObj.createdAt || rawDateStr),
  };
}

export function normalizePortableStudent(
  rawObj: Record<string, unknown>,
  studentSessions: SessionRecord[],
  currentMonthKey: string
): Student {
  const id = String(rawObj.id || `st-${Date.now()}`);
  const name = String(rawObj.name || 'طالب').trim();

  // Derive guardian name from guardianName, parent, or second part of student's name
  let guardianName = String(rawObj.guardianName || rawObj.parent || '').trim();
  if (!guardianName) {
    const nameParts = name.split(/\s+/);
    guardianName =
      nameParts.length > 1
        ? `ولي أمر (${nameParts.slice(1).join(' ')})`
        : `ولي أمر ${name}`;
  }

  const whatsappPhone = String(rawObj.whatsappPhone || rawObj.phone || '')
    .replace(/\D/g, '')
    .trim();

  // Deterministic 6-digit PIN from last 6 digits of phone, or existing guardianPin, or 123456
  const existingPin = String(rawObj.guardianPin || '').trim();
  const guardianPin =
    existingPin.length >= 4
      ? existingPin
      : whatsappPhone.length >= 6
      ? whatsappPhone.slice(-6)
      : '123456';

  const rawLevel = String(rawObj.level || 'مبتدئ').trim();
  const level: StudentLevel =
    rawLevel === 'متقدم' || rawLevel === 'متوسط' || rawLevel === 'مبتدئ'
      ? rawLevel
      : 'مبتدئ';

  const rawCircle = String(rawObj.circle || rawObj.group || '').trim();
  const circle =
    rawCircle ||
    (level === 'متقدم'
      ? 'حلقة المستوى المتقدم'
      : level === 'متوسط'
      ? 'حلقة المستوى المتوسط'
      : 'حلقة التأسيس والناشئة');

  const rawPlan = String(rawObj.plan || 'balanced');
  const plan: StudentPlan =
    rawPlan === 'مكثفة' ||
    rawPlan === 'مراجعة فقط' ||
    rawPlan === 'تثبيت' ||
    rawPlan === 'قصار السور' ||
    rawPlan === 'متوازنة'
      ? rawPlan
      : level === 'متقدم'
      ? 'مكثفة'
      : level === 'مبتدئ'
      ? 'قصار السور'
      : 'متوازنة';

  const scheduleDays =
    Array.isArray(rawObj.scheduleDays) && rawObj.scheduleDays.length > 0
      ? (rawObj.scheduleDays as number[])
      : [0, 2, 4]; // Sunday, Tuesday, Thursday default
  const scheduleTime = String(rawObj.scheduleTime || '').trim() || '16:30';
  const sessionDuration = Number(rawObj.sessionDuration) || 30;
  const startDate = String(rawObj.startDate || '2026-06-13').slice(0, 10);

  const priorMem = (rawObj.priorMemorization || {}) as {
    status?: string;
    declared?: string;
  };
  const declaredPrior = String(priorMem.declared || '').trim();
  const baseNotes = String(rawObj.notes || '').trim();
  const notes =
    baseNotes ||
    (declaredPrior ? `الحفظ السابق المصرح به: ${declaredPrior}` : '');

  // Sort sessions oldest -> newest to trace progression accurately
  const sortedSessions = [...studentSessions].sort((a, b) =>
    a.date !== b.date
      ? a.date.localeCompare(b.date)
      : a.createdAt.localeCompare(b.createdAt)
  );

  const memorizedSet = new Set<number>(
    Array.isArray(rawObj.memorizedSurahs) ? (rawObj.memorizedSurahs as number[]) : [1]
  );
  const inProgressSet = new Set<number>(
    Array.isArray(rawObj.inProgressSurahs) ? (rawObj.inProgressSurahs as number[]) : []
  );
  const juzSet = new Set<number>(
    Array.isArray(rawObj.memorizedJuz) ? (rawObj.memorizedJuz as number[]) : []
  );

  // Check priorMemorization declared text (e.g. "من سورة الناس الي سورة الجن")
  if (declaredPrior) {
    if (declaredPrior.includes('الجن')) {
      for (let s = 72; s <= 114; s++) memorizedSet.add(s);
      juzSet.add(30);
    }
  }

  let latestStop: Student['currentStop'] | null =
    rawObj.currentStop && typeof rawObj.currentStop === 'object'
      ? (rawObj.currentStop as Student['currentStop'])
      : null;

  for (const ses of sortedSessions) {
    if (ses.newMemorization?.enabled) {
      const sId = ses.newMemorization.surahId;
      const sMeta = findSurahMeta(sId) || findSurahMeta(ses.newMemorization.surahName);
      if (sMeta) {
        latestStop = {
          surahId: sMeta.id,
          surahName: sMeta.name,
          ayah: ses.newMemorization.toAyah || 1,
          juzNumber: sMeta.juz,
        };
        if (ses.newMemorization.isFullSurah || ses.newMemorization.toAyah >= sMeta.ayahs) {
          memorizedSet.add(sMeta.id);
          inProgressSet.delete(sMeta.id);
        } else {
          inProgressSet.add(sMeta.id);
        }
        // If student is memorizing in Juz 30..25 descending (from 114 upwards), mark subsequent surahs in Juz 30 as memorized
        if (sMeta.id >= 34 && sMeta.id < 114) {
          for (let s = sMeta.id + 1; s <= 114; s++) {
            memorizedSet.add(s);
          }
        }
      }
    }

    if (ses.nearReview?.enabled) {
      const sMeta = findSurahMeta(ses.nearReview.surahId) || findSurahMeta(ses.nearReview.surahName);
      if (sMeta) memorizedSet.add(sMeta.id);
    }

    if (ses.farReview?.enabled) {
      const sMeta = findSurahMeta(ses.farReview.surahId) || findSurahMeta(ses.farReview.surahName);
      if (sMeta) memorizedSet.add(sMeta.id);
    }

    if (ses.surahReview?.enabled) {
      for (const sName of ses.surahReview.surahNames) {
        const sMeta = findSurahMeta(sName);
        if (sMeta) memorizedSet.add(sMeta.id);
      }
    }

    if (ses.juzReview?.enabled) {
      for (const jItem of ses.juzReview.items) {
        juzSet.add(jItem.juzNumber);
        for (const s of SURAHS) {
          if (s.juz === jItem.juzNumber) memorizedSet.add(s.id);
        }
      }
    }
  }

  // Infer completed Juz from memorizedSurahs
  for (let j = 1; j <= 30; j++) {
    const surahsInJuz = SURAHS.filter((s) => s.juz === j);
    if (
      surahsInJuz.length > 0 &&
      surahsInJuz.every((s) => memorizedSet.has(s.id))
    ) {
      juzSet.add(j);
    }
  }

  if (!latestStop) {
    // Fallback if student has no newMemorization session yet
    if (sortedSessions.length > 0) {
      const lastSes = sortedSessions[sortedSessions.length - 1];
      const fallbackName =
        lastSes.nearReview?.surahName ||
        lastSes.farReview?.surahName ||
        lastSes.surahReview?.surahNames?.[0] ||
        'النبأ';
      const sMeta = findSurahMeta(fallbackName) || SURAHS[77];
      latestStop = {
        surahId: sMeta.id,
        surahName: sMeta.name,
        ayah: 1,
        juzNumber: sMeta.juz,
      };
    } else {
      latestStop = {
        surahId: 114,
        surahName: 'الناس',
        ayah: 1,
        juzNumber: 30,
      };
    }
  }

  // Finance conversion from studentFinance (if present) or clean defaults
  let monthlyFee = Number(rawObj.monthlyFee) || (level === 'متقدم' ? 350 : level === 'متوسط' ? 300 : 250);
  const fees: FeeRecord[] = Array.isArray(rawObj.fees) ? [...(rawObj.fees as FeeRecord[])] : [];

  if (rawObj.studentFinance && typeof rawObj.studentFinance === 'object') {
    const sf = rawObj.studentFinance as {
      rateCents?: number;
      plannedSessions?: number;
      months?: Record<
        string,
        {
          rateCents?: number;
          plannedSessions?: number;
          payments?: {
            id?: string;
            date?: string;
            amountCents?: number;
            method?: string;
            note?: string;
            voidedAt?: string;
          }[];
          closedSnapshot?: {
            dueCents?: number;
            paidCents?: number;
          };
        }
      >;
    };
    if (sf.rateCents && sf.plannedSessions) {
      monthlyFee = Math.round((sf.rateCents * sf.plannedSessions) / 100);
    }
    if (sf.months && typeof sf.months === 'object') {
      for (const [mKey, mVal] of Object.entries(sf.months)) {
        const activePayments = (mVal.payments || []).filter((p) => !p.voidedAt);
        const totalPaidEgp = Math.round(
          activePayments.reduce((sum, p) => sum + (Number(p.amountCents) || 0), 0) / 100
        );
        const dueEgp = mVal.closedSnapshot?.dueCents
          ? Math.round(mVal.closedSnapshot.dueCents / 100)
          : monthlyFee;
        const amount = totalPaidEgp > 0 ? totalPaidEgp : dueEgp;
        const lastPayment = activePayments[activePayments.length - 1];
        fees.push({
          month: mKey,
          amount: amount || monthlyFee,
          status: totalPaidEgp > 0 ? 'مدفوع' : 'متأخر',
          paidAt: lastPayment?.date,
          method: lastPayment?.method === 'cash' ? 'نقدي' : lastPayment?.method || 'نقدي',
          notes: lastPayment?.note || undefined,
          receiptNumber: `REC-${mKey}-${id.slice(-4)}`,
        });
      }
    }
  }

  if (fees.length === 0) {
    fees.push({
      month: currentMonthKey,
      amount: monthlyFee,
      status: 'مدفوع',
      paidAt: sortedSessions[sortedSessions.length - 1]?.date || startDate,
      method: 'فودافون كاش / إنستا باي',
      receiptNumber: `REC-${currentMonthKey}-${id.slice(-4)}`,
    });
  }

  const attendedCount = sortedSessions.filter((s) => s.status === 'حضر').length;
  const computedXp =
    typeof rawObj.xpPoints === 'number'
      ? rawObj.xpPoints
      : Math.max(150, attendedCount * 35 + memorizedSet.size * 10);

  const badges = Array.isArray(rawObj.badges)
    ? (rawObj.badges as string[])
    : attendedCount >= 10
    ? ['وسام القارئ المتقن', 'وسام المواظبة والهمة العالية', 'وسام الحضور المبكر']
    : attendedCount >= 4
    ? ['وسام المواظبة والهمة العالية', 'وسام الحضور المبكر']
    : ['وسام بطل التأسيس'];

  return {
    id,
    name,
    guardianName,
    whatsappPhone,
    guardianPin,
    accountStatus:
      rawObj.studentStatus === 'archived'
        ? 'مؤرشف'
        : rawObj.studentStatus === 'paused'
        ? 'متوقف'
        : (rawObj.accountStatus as Student['accountStatus']) || 'نشط',
    level,
    circle,
    plan,
    linkLogic: (rawObj.linkLogic as Student['linkLogic']) || 'الآية التالية',
    scheduleDays,
    scheduleTime,
    sessionDuration,
    startDate,
    notes,
    memorizedSurahs: Array.from(memorizedSet).sort((a, b) => a - b),
    inProgressSurahs: Array.from(inProgressSet).sort((a, b) => a - b),
    memorizedJuz: Array.from(juzSet).sort((a, b) => a - b),
    currentStop: latestStop,
    monthlyFee,
    fees,
    disciplineWarnings: Array.isArray(rawObj.disciplineWarnings)
      ? (rawObj.disciplineWarnings as Student['disciplineWarnings'])
      : [],
    riwayah: (rawObj.riwayah as Student['riwayah']) || 'حفص عن عاصم',
    accessibilityMode:
      (rawObj.accessibilityMode as Student['accessibilityMode']) || 'standard',
    foundationLevel:
      (rawObj.foundationLevel as Student['foundationLevel']) ||
      (level === 'متقدم' ? 8 : level === 'متوسط' ? 6 : 3),
    completedFoundationLevels: Array.isArray(rawObj.completedFoundationLevels)
      ? (rawObj.completedFoundationLevels as number[])
      : level === 'متقدم'
      ? [1, 2, 3, 4, 5, 6, 7, 8]
      : level === 'متوسط'
      ? [1, 2, 3, 4, 5]
      : [1, 2],
    xpPoints: computedXp,
    badges,
    hasGoldenCrown:
      typeof rawObj.hasGoldenCrown === 'boolean'
        ? rawObj.hasGoldenCrown
        : juzSet.size >= 1 || attendedCount >= 8,
    permanentMeetingUrl:
      String(rawObj.permanentMeetingUrl || '') ||
      'https://meet.google.com/imam-academy-live',
    fiveFortressesLog:
      (rawObj.fiveFortressesLog as Student['fiveFortressesLog']) || {},
  };
}

export function normalizePortableBackupPayload(
  rawPayload: unknown,
  fallbackSettings: AcademySettings,
  fallbackCircles: CircleGroup[],
  currentMonthKey: string
): {
  students: Student[];
  sessions: SessionRecord[];
  circles: CircleGroup[];
  settings: AcademySettings;
} | null {
  if (!rawPayload || typeof rawPayload !== 'object') return null;
  const obj = rawPayload as Record<string, unknown>;
  if (!Array.isArray(obj.students)) return null;

  // Check syncTombstones so deleted students/sessions stay deleted
  const rawSettingsObj = (obj.settings || {}) as Record<string, unknown>;
  const syncTombstones = (rawSettingsObj.syncTombstones || {}) as {
    students?: Record<string, unknown>;
    sessions?: Record<string, unknown>;
  };
  const deletedStudentIds = new Set(Object.keys(syncTombstones.students || {}));
  const deletedSessionIds = new Set(Object.keys(syncTombstones.sessions || {}));

  const rawSessions = Array.isArray(obj.sessions)
    ? (obj.sessions as Record<string, unknown>[])
    : [];

  // Deduplicate rapid double-click sessions (same student, same date, same summary within 5 seconds)
  const normalizedSessions: SessionRecord[] = [];
  for (const sRaw of rawSessions) {
    const sId = String(sRaw.id || '');
    if (deletedSessionIds.has(sId)) continue;
    const norm = normalizePortableSession(sRaw);
    if (deletedStudentIds.has(norm.studentId)) continue;
    normalizedSessions.push(norm);
  }

  // Group sessions by studentId
  const sessionsByStudent = new Map<string, SessionRecord[]>();
  for (const ses of normalizedSessions) {
    const list = sessionsByStudent.get(ses.studentId) || [];
    list.push(ses);
    sessionsByStudent.set(ses.studentId, list);
  }

  const normalizedStudents: Student[] = [];
  for (const stRaw of obj.students as Record<string, unknown>[]) {
    const stId = String(stRaw.id || '');
    if (!stId || deletedStudentIds.has(stId)) continue;
    const stSessions = sessionsByStudent.get(stId) || [];
    normalizedStudents.push(
      normalizePortableStudent(stRaw, stSessions, currentMonthKey)
    );
  }

  const teacherNameFromBackup =
    String(rawSettingsObj.teacherName || rawSettingsObj.name || '').trim() ||
    fallbackSettings.teacherName;
  const phoneFromBackup =
    String(
      rawSettingsObj.officialWhatsappPhone || rawSettingsObj.phone || ''
    ).trim() || fallbackSettings.officialWhatsappPhone;

  const rawWeeklyGoals = (rawSettingsObj.weeklyGoals || {}) as Record<string, number>;

  const mergedSettings: AcademySettings = {
    ...fallbackSettings,
    teacherName: teacherNameFromBackup,
    officialWhatsappPhone: phoneFromBackup,
    theme:
      rawSettingsObj.theme === 'dark' ||
      rawSettingsObj.theme === 'sepia' ||
      rawSettingsObj.theme === 'light'
        ? rawSettingsObj.theme
        : fallbackSettings.theme,
    fontSize:
      rawSettingsObj.fontSize === 'sm' ||
      rawSettingsObj.fontSize === 'md' ||
      rawSettingsObj.fontSize === 'lg' ||
      rawSettingsObj.fontSize === 'xl'
        ? rawSettingsObj.fontSize
        : fallbackSettings.fontSize,
    weeklyGoals: {
      newAyatTarget:
        Number(rawWeeklyGoals.newAyatTarget || rawWeeklyGoals.newAyat) ||
        fallbackSettings.weeklyGoals.newAyatTarget,
      reviewsTarget:
        Number(rawWeeklyGoals.reviewsTarget || rawWeeklyGoals.reviews) ||
        fallbackSettings.weeklyGoals.reviewsTarget,
      sessionsTarget:
        Number(rawWeeklyGoals.sessionsTarget || rawWeeklyGoals.sessions) ||
        fallbackSettings.weeklyGoals.sessionsTarget,
      attendanceTarget:
        Number(rawWeeklyGoals.attendanceTarget || rawWeeklyGoals.attendance) ||
        fallbackSettings.weeklyGoals.attendanceTarget,
    },
  };

  const circles: CircleGroup[] = Array.isArray(obj.circles) && obj.circles.length > 0
    ? (obj.circles as CircleGroup[])
    : fallbackCircles.map((c) => ({
        ...c,
        teacherName: teacherNameFromBackup,
      }));

  return {
    students: normalizedStudents,
    sessions: normalizedSessions,
    circles,
    settings: mergedSettings,
  };
}

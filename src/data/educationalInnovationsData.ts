import { SURAHS } from './quranData';
import { QuranRiwayah, SeasonalModeType, SessionRecord, Student } from '../types';

export interface SurahThematicBlock {
  id: string;
  surahId: number;
  fromAyah: number;
  toAyah: number;
  title: string;
  summary: string;
  meaningfulStopHint: string;
  mentalLinkTip: string;
  colorBadge: string;
}

export interface TarbiyahAdabCard {
  id: string;
  category: 'آداب القرآن' | 'الأخلاق والبر' | 'الأذكار والعبادات' | 'همة الحافظ';
  title: string;
  oneMinuteReminder: string;
  evidenceOrHadith: string;
  practicalAction: string;
}

export interface SeasonalProgramPreset {
  id: SeasonalModeType;
  title: string;
  badge: string;
  dailyGoal: string;
  dailyTargetRecommendation: string;
  challengeReward: string;
  description: string;
}

export interface RiwayahGuideInfo {
  id: QuranRiwayah;
  imamAndNarrator: string;
  tariq: string;
  badgeColor: string;
  keyRulesReminder: string[];
  alertForTeacher: string;
}

export const QURAN_RIWAYAT_GUIDE: Record<QuranRiwayah, RiwayahGuideInfo> = {
  'حفص عن عاصم': {
    id: 'حفص عن عاصم',
    imamAndNarrator: 'رواية حفص بن سليمان عن الإمام عاصم الكوفي',
    tariq: 'من طريق الشاطبية (توسط المنفصل 4 حركات)',
    badgeColor: 'emerald',
    keyRulesReminder: [
      'المد المنفصل والمتصل 4 أو 5 حركات (التوسط)',
      'السكتات الأربع الواجبة (عوجا، مرقدنا، من راق، بل ران)',
      'إمالة مجراها في سورة هود فقط، وتسهيل (ءأعجمي) بفصلت',
    ],
    alertForTeacher: 'مراعاة تحقيق الهمزات وضبط مقادير الغنن والمدود على التوسط (4 حركات).',
  },
  'ورش عن نافع': {
    id: 'ورش عن نافع',
    imamAndNarrator: 'رواية عثمان بن سعيد (ورش) عن الإمام نافع المدني',
    tariq: 'من طريق الأزرق (الشاطبية)',
    badgeColor: 'amber',
    keyRulesReminder: [
      'نقل حركة الهمزة إلى الساكن الصحيح قبلها (مثل: قَدَ افْلَحَ)',
      'إبدال الهمز المفرد الساكن فاءً للكلمة (مثل: يُومِنُونَ)',
      'تغليظ اللام المفتوحة بعد (ص، ط، ظ) وترقيق الراء بعد كسر أو ياء',
      'تثليث مد البدل (2 أو 4 أو 6) وإشباع المتصل والمنفصل (6 حركات)',
    ],
    alertForTeacher: 'تنبيه: الطالب يقرأ برواية ورش — راقب النقل، الإبدال، تغليظ اللامات، وترقيق الراءات.',
  },
  'قالون عن نافع': {
    id: 'قالون عن نافع',
    imamAndNarrator: 'رواية عيسى بن مينا (قالون) عن الإمام نافع المدني',
    tariq: 'من طريق أبي نشيط (الشاطبية)',
    badgeColor: 'indigo',
    keyRulesReminder: [
      'صلة ميم الجمع أو إسكانها (المقدم الإسكان أو الصلة بوجه معتمد)',
      'قصر أو توسط المد المنفصل وتوسط المد المتصل (4 حركات)',
      'إسكان هاء (وهْو، وهْي) بعد الواو والفاء واللام',
      'تسهيل الهمزة الثانية مع الإدخال في الهمزتين من كلمة',
    ],
    alertForTeacher: 'تنبيه: الطالب يقرأ برواية قالون — اضبط الوجه المختار في ميم الجمع والمد المنفصل.',
  },
  'شعبة عن عاصم': {
    id: 'شعبة عن عاصم',
    imamAndNarrator: 'رواية أبي بكر بن عياش (شعبة) عن الإمام عاصم الكوفي',
    tariq: 'من طريق الشاطبية',
    badgeColor: 'purple',
    keyRulesReminder: [
      'إبدال همزة (مؤصدة، لؤلؤ) وإمالة ألف (رمى، أعمى، نأى، ران)',
      'إمالة ألفات (حي طهر) في فواتح السور (را، حا، يا، طا، ها)',
      'عدم السكت في المواضع الأربعة التي يسكت فيها حفص (بل يدغم: بل ران، من راق)',
    ],
    alertForTeacher: 'تنبيه: الطالب يقرأ برواية شعبة عن عاصم — انتبه لمواضع الإمالة وكلمات الخلاف مع حفص.',
  },
  'الدوري عن أبي عمرو': {
    id: 'الدوري عن أبي عمرو',
    imamAndNarrator: 'رواية حفص الدوري عن الإمام أبي عمرو البصري',
    tariq: 'من طريق الشاطبية',
    badgeColor: 'rose',
    keyRulesReminder: [
      'إمالة ذوات الراء (بشرى، ذكرى، النصارى) والتقليل في (يا ويلتى، الدنيا)',
      'إسكان هاء (يؤدهْ، نولهْ، نصلهْ) وكسر ميم الجمع قبل ساكن (بهمِ الأسباب)',
      'إدغام المتماثلين والمتقاربين بشروطه وضبط همزات الوصل والقطع',
    ],
    alertForTeacher: 'تنبيه: الطالب يقرأ برواية الدوري عن أبي عمرو — راقب إمالة ذوات الراء وكسر ميم الجمع.',
  },
};

export interface GlobalTimezoneOption {
  id: string;
  label: string;
  offsetFromCairoHours: number; // Reference Academy time is Cairo/Makkah standard
  gmtLabel: string;
}

export const GLOBAL_TIMEZONES_LIST: GlobalTimezoneOption[] = [
  { id: 'Africa/Cairo', label: 'القاهرة / القدس (توقيت الأكاديمية المرجعي)', offsetFromCairoHours: 0, gmtLabel: 'GMT+2/3' },
  { id: 'Asia/Riyadh', label: 'مكة المكرمة / الرياض / الدوحة / الكويت', offsetFromCairoHours: 1, gmtLabel: 'GMT+3' },
  { id: 'Asia/Dubai', label: 'دبي / مسقط (الإمارات وعمان)', offsetFromCairoHours: 2, gmtLabel: 'GMT+4' },
  { id: 'Africa/Casablanca', label: 'الرباط / الجزائر / تونس', offsetFromCairoHours: -1, gmtLabel: 'GMT+1' },
  { id: 'Europe/Berlin', label: 'برلين / باريس / إسطنبول / أوروبا الوسطى', offsetFromCairoHours: -1, gmtLabel: 'GMT+1/2' },
  { id: 'Europe/London', label: 'لندن / دبلن (بريطانيا)', offsetFromCairoHours: -2, gmtLabel: 'GMT+0/1' },
  { id: 'America/New_York', label: 'نيويورك / تورونتو (شرق أمريكا وكندا)', offsetFromCairoHours: -7, gmtLabel: 'GMT-5' },
  { id: 'America/Chicago', label: 'شيكاغو / دالاس (وسط أمريكا)', offsetFromCairoHours: -8, gmtLabel: 'GMT-6' },
  { id: 'Asia/Kuala_Lumpur', label: 'كوالالمبور / جاكرتا (شرق آسيا)', offsetFromCairoHours: 6, gmtLabel: 'GMT+8' },
  { id: 'Australia/Sydney', label: 'سيدني / ملبورن (أستراليا)', offsetFromCairoHours: 8, gmtLabel: 'GMT+10' },
];

export function convertAcademyTimeToStudentZone(
  academyTimeHHmm: string,
  offsetFromCairoHours: number
): { studentTime24: string; studentTimeFormatted: string; dayShiftLabel: string } {
  const [hStr, mStr] = (academyTimeHHmm || '17:00').split(':');
  const baseH = Number(hStr) || 17;
  const baseM = Number(mStr) || 0;
  let shiftedH = baseH + offsetFromCairoHours;
  let dayShiftLabel = 'نفس اليوم';
  if (shiftedH >= 24) {
    shiftedH -= 24;
    dayShiftLabel = 'اليوم التالي (+1)';
  } else if (shiftedH < 0) {
    shiftedH += 24;
    dayShiftLabel = 'اليوم السابق (-1)';
  }
  const period = shiftedH >= 12 ? 'م' : 'ص';
  const h12 = shiftedH % 12 === 0 ? 12 : shiftedH % 12;
  const padM = String(baseM).padStart(2, '0');
  const padH24 = String(shiftedH).padStart(2, '0');
  return {
    studentTime24: `${padH24}:${padM}`,
    studentTimeFormatted: `${h12}:${padM} ${period}`,
    dayShiftLabel,
  };
}

export function predictStudentKhatmah(student: Student, sessions: SessionRecord[]) {
  const stSessions = sessions.filter(
    (s) => s.studentId === student.id && s.status === 'حضر'
  );
  const totalAyatRecited = stSessions.reduce((acc, ses) => {
    if (ses.actualRecitation?.enabled) {
      return (
        acc +
        Math.max(
          1,
          ses.actualRecitation.toAyah - ses.actualRecitation.fromAyah + 1
        )
      );
    }
    if (ses.newMemorization?.enabled) {
      return (
        acc +
        Math.max(1, ses.newMemorization.toAyah - ses.newMemorization.fromAyah + 1)
      );
    }
    return acc + 10;
  }, 0);

  const avgAyatPerSession =
    stSessions.length > 0
      ? Math.max(5, Math.round(totalAyatRecited / stSessions.length))
      : student.plan === 'مكثفة'
      ? 20
      : 12;

  const weeklySessionsCount = Math.max(1, student.scheduleDays.length || 3);
  const completedJuzCount = student.memorizedJuz.length;
  const remainingJuzCount = Math.max(1, 30 - completedJuzCount);

  // Average ~208 ayahs per Juz
  const sessionsPerJuz = Math.max(4, Math.ceil(200 / avgAyatPerSession));
  const daysToFinishCurrentJuz = Math.max(
    7,
    Math.round((sessionsPerJuz * 0.65 / weeklySessionsCount) * 7)
  );
  const totalRemainingSessions = remainingJuzCount * sessionsPerJuz;
  const totalRemainingWeeks = Math.ceil(
    totalRemainingSessions / weeklySessionsCount
  );
  const totalRemainingMonths = Math.max(
    1,
    Math.round(totalRemainingWeeks / 4.3)
  );

  const currentJuzDate = new Date();
  currentJuzDate.setDate(currentJuzDate.getDate() + daysToFinishCurrentJuz);

  const fullKhatmahDate = new Date();
  fullKhatmahDate.setDate(fullKhatmahDate.getDate() + totalRemainingWeeks * 7);

  return {
    avgAyatPerSession,
    weeklySessionsCount,
    completedJuzCount,
    remainingJuzCount,
    daysToFinishCurrentJuz,
    expectedCurrentJuzDate: currentJuzDate.toISOString().slice(0, 10),
    expectedFullKhatmahDate: fullKhatmahDate.toISOString().slice(0, 10),
    totalRemainingMonths,
    totalRemainingSessions,
  };
}

// 1. الخرائط الموضوعية للسور والوقف المعنوي (وفق التفسير الميسر المعتمد)
export const CURATED_SURAH_THEMATIC_BLOCKS: Record<number, SurahThematicBlock[]> = {
  1: [
    {
      id: 'th-1-1',
      surahId: 1,
      fromAyah: 1,
      toAyah: 4,
      title: 'الثناء على الله وتمجيده وإثبات اليوم الآخر',
      summary: 'حمد الله رب العالمين والتذكير برحمته الواسعة وتفرده بملك يوم الجزاء والحساب',
      meaningfulStopHint: 'وقف تام معنوي عند قوله تعالى: ﴿مَالِكِ يَوْمِ الدِّينِ﴾ لاكتمال الثناء قبل الانتقال للدعاء.',
      mentalLinkTip: 'تبدأ بالحمد وتنتهي بـ (مالك يوم الدين)',
      colorBadge: 'emerald',
    },
    {
      id: 'th-1-2',
      surahId: 1,
      fromAyah: 5,
      toAyah: 7,
      title: 'العهد بالعبودية والاستعانة والدعاء بالهداية للصراط المستقيم',
      summary: 'إخلاص العبادة والاستعانة بالله وحده وسؤاله الهداية لطريق المنعم عليهم',
      meaningfulStopHint: 'وقف تام بنهاية السورة عند ﴿وَلَا الضَّالِّينَ﴾ ويسن التأمين بعدها.',
      mentalLinkTip: 'من (إياك نعبد) إلى نهاية السورة',
      colorBadge: 'amber',
    },
  ],
  2: [
    {
      id: 'th-2-1',
      surahId: 2,
      fromAyah: 1,
      toAyah: 5,
      title: 'صفات المتقين المهتدين بالقرآن الكريم',
      summary: 'بيان هداية الكتاب للمتقين الذين يؤمنون بالغيب ويقيمون الصلاة وينفقون مما رزقهم الله',
      meaningfulStopHint: 'وقف معنوي تام عند ﴿وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ﴾ لاكتمال قسم المؤمنين.',
      mentalLinkTip: 'أول خمس آيات في وصف المؤمنين المفلحين',
      colorBadge: 'emerald',
    },
    {
      id: 'th-2-2',
      surahId: 2,
      fromAyah: 6,
      toAyah: 20,
      title: 'حقيقة الكافرين وأوصاف المنافقين وأمثالهم النارية والمائية',
      summary: 'بيان حال المعاندين في آيتين، ثم تفصيل أحوال المنافقين وضرب المثل الناري والمائي لهم',
      meaningfulStopHint: 'وقف معنوي تام عند ﴿إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ﴾ قبل نداء البشرية العام.',
      mentalLinkTip: 'آيتان في الكافرين و13 آية في المنافقين',
      colorBadge: 'rose',
    },
    {
      id: 'th-2-3',
      surahId: 2,
      fromAyah: 21,
      toAyah: 29,
      title: 'النداء العام للبشرية بعبادة الخالق والتحدي بالقرآن',
      summary: 'الأمر بعبادة الله وحده، والتحدي بالإتيان بسورة من مثله، ودلائل الإحياء والإماتة',
      meaningfulStopHint: 'وقف معنوي عند ﴿وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ﴾ (الآية 29) قبل بدء قصة خلق آدم.',
      mentalLinkTip: 'تبدأ بـ (يا أيها الناس اعبدوا ربكم) وتنتهي بتسوية السماوات السبع',
      colorBadge: 'indigo',
    },
    {
      id: 'th-2-4',
      surahId: 2,
      fromAyah: 30,
      toAyah: 39,
      title: 'قصة استخلاف آدم عليه السلام في الأرض والوعد بالهداية',
      summary: 'حوار الملائكة، تعليم آدم الأسماء، إباء إبليس، والهبوط للأرض مع ميثاق اتباع الهدى',
      meaningfulStopHint: 'وقف تام عند ﴿هُمْ فِيهَا خَالِدُونَ﴾ (الآية 39) قبل نداء بني إسرائيل.',
      mentalLinkTip: 'قصة آدم كاملة في 10 آيات من (وإذ قال ربك للملائكة)',
      colorBadge: 'amber',
    },
    {
      id: 'th-2-5',
      surahId: 2,
      fromAyah: 255,
      toAyah: 257,
      title: 'آية الكرسي وعظمة التوحيد والولاية الإلهية',
      summary: 'أعظم آية في كتاب الله، ولا إكراه في الدين، والله ولي الذين آمنوا يخرجهم من الظلمات إلى النور',
      meaningfulStopHint: 'وقف تام عند ﴿هُمْ فِيهَا خَالِدُونَ﴾ (الآية 257) قبل المحاجّة مع إبراهيم عليه السلام.',
      mentalLinkTip: 'مقطع التوحيد والنور الخالص وسط الجزء الثالث',
      colorBadge: 'emerald',
    },
    {
      id: 'th-2-6',
      surahId: 2,
      fromAyah: 284,
      toAyah: 286,
      title: 'خواتيم سورة البقرة وميثاق الإيمان والدعاء الجامع',
      summary: 'محاسبة الله للعباد، إيمان الرسول والمؤمنين وسمعهم وطاعتهم، ورفع الآصار والأغلال',
      meaningfulStopHint: 'مسك ختام السورة عند ﴿فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ﴾.',
      mentalLinkTip: 'الآيات الثلاث الأخيرة التي يُستحب قراءتها كل ليلة',
      colorBadge: 'amber',
    },
  ],
  18: [
    {
      id: 'th-18-1',
      surahId: 18,
      fromAyah: 1,
      toAyah: 8,
      title: 'مقدمة السورة: الحمد على إنزال الكتاب وحقيقة زينة الأرض',
      summary: 'استفتاح السورة بالحمد وبيان أن ما على الأرض زينة للابتلاء أيهم أحسن عملاً',
      meaningfulStopHint: 'وقف معنوي عند ﴿وَإِنَّا لَجَاعِلُونَ مَا عَلَيْهَا صَعِيدًا جُرُزًا﴾ قبل قصة الكهف.',
      mentalLinkTip: 'التمهيد العقائدي قبل بدء القصص الأربع',
      colorBadge: 'emerald',
    },
    {
      id: 'th-18-2',
      surahId: 18,
      fromAyah: 9,
      toAyah: 26,
      title: 'القصة الأولى: فتية أصحاب الكهف (العصمة من فتنة الدين)',
      summary: 'ثبات الفتية المؤمنين وحفظ الله لهم في الكهف ثلاثمائة سنين وازدادوا تسعاً',
      meaningfulStopHint: 'وقف تام عند ﴿مَا لَهُم مِّن دُونِهِ مِن وَلِيٍّ وَلَا يُشْرِكُ فِي حُكْمِهِ أَحَدًا﴾.',
      mentalLinkTip: 'من (أم حسبت أن أصحاب الكهف) إلى (ولا يشرك في حكمه أحداً)',
      colorBadge: 'amber',
    },
    {
      id: 'th-18-3',
      surahId: 18,
      fromAyah: 32,
      toAyah: 44,
      title: 'القصة الثانية: صاحب الجنتين (العصمة من فتنة المال والجاه)',
      summary: 'حوار المؤمن الشاكر مع صاحبه المغترّ بماله وزوال الجنة والندم حين لا ينفع الندم',
      meaningfulStopHint: 'وقف معنوي تام عند ﴿هُنَالِكَ الْوَلَايَةُ لِلَّهِ الْحَقِّ هُوَ خَيْرٌ ثَوَابًا وَخَيْرٌ عُقْبًا﴾.',
      mentalLinkTip: 'تبدأ بـ (واضرب لهم مثلاً رجلين) وتنتهي بـ (هنالك الولاية لله الحق)',
      colorBadge: 'indigo',
    },
    {
      id: 'th-18-4',
      surahId: 18,
      fromAyah: 60,
      toAyah: 82,
      title: 'القصة الثالثة: موسى والخضر عليهما السلام (فتنة العلم)',
      summary: 'رحلة طلب العلم والصبر على خفايا الأقدار الإلهية في السفينة والغلام والجدار',
      meaningfulStopHint: 'وقف تام عند ﴿ذَٰلِكَ تَأْوِيلُ مَا لَمْ تَسْطِع عَّلَيْهِ صَبْرًا﴾.',
      mentalLinkTip: 'ثلاثة مواقف مع الخضر وتأويلها في آخر المقطع',
      colorBadge: 'emerald',
    },
    {
      id: 'th-18-5',
      surahId: 18,
      fromAyah: 83,
      toAyah: 98,
      title: 'القصة الرابعة: ذو القرنين وبناء السد (فتنة السلطة والتمكين)',
      summary: 'طواف ذي القرنين شرقاً وغرباً بالعدل وإقامة الردم أمام يأجوج ومأجوج وشكره لربه',
      meaningfulStopHint: 'وقف معنوي عند ﴿وَكَانَ وَعْدُ رَبِّي حَقًّا﴾ قبل مشاهد الحشر.',
      mentalLinkTip: 'تبدأ بـ (ويسألونك عن ذي القرنين) وتنتهي بـ (هذا رحمة من ربي)',
      colorBadge: 'amber',
    },
  ],
  36: [
    {
      id: 'th-36-1',
      surahId: 36,
      fromAyah: 1,
      toAyah: 12,
      title: 'تأكيد رسالة النبي ﷺ وإحصاء الأعمال والآثار',
      summary: 'القسم بالقرآن الحكيم على صدق الرسالة وكتابة ما قدموا وآثارهم في إمام مبين',
      meaningfulStopHint: 'وقف تام عند ﴿وَكُلَّ شَيْءٍ أَحْصَيْنَاهُ فِي إِمَامٍ مُّبِينٍ﴾.',
      mentalLinkTip: 'ينتهي المقطع بـ (وكل شيء أحصيناه في إمام مبين)',
      colorBadge: 'emerald',
    },
    {
      id: 'th-36-2',
      surahId: 36,
      fromAyah: 13,
      toAyah: 32,
      title: 'قصة أصحاب القرية ومؤمن آل ياسين',
      summary: 'إرسال المرسلين للقرية ونصيحة الرجل الصالح ودخوله الجنة وإهلاك المكذبين بصيحة واحدة',
      meaningfulStopHint: 'وقف تام عند ﴿وَإِن كُلٌّ لَّمَّا جَمِيعٌ لَّدَيْنَا مُحْضَرُونَ﴾.',
      mentalLinkTip: 'تبدأ بـ (واضرب لهم مثلاً أصحاب القرية)',
      colorBadge: 'amber',
    },
    {
      id: 'th-36-3',
      surahId: 36,
      fromAyah: 33,
      toAyah: 50,
      title: 'آيات الله الكونية في الأرض والليل والشمس والفلَك',
      summary: 'ثلاث آيات كونية متتابعة تبدأ بـ (وآية لهم الأرض... وآية لهم الليل... وآية لهم أنهم...)',
      meaningfulStopHint: 'وقف معنوي عند ﴿فَلَا يَسْتَطِيعُونَ تَوْصِيَةً وَلَا إِلَىٰ أَهْلِهِمْ يَرْجِعُونَ﴾.',
      mentalLinkTip: 'الربط الثلاثي المتناظر بـ (وآية لهم)',
      colorBadge: 'indigo',
    },
  ],
  67: [
    {
      id: 'th-67-1',
      surahId: 67,
      fromAyah: 1,
      toAyah: 5,
      title: 'عظمة الملك الإلهي وإبداع خلق السماوات السبع',
      summary: 'تبارك الذي بيده الملك، خلق الموت والحياة، وإحكام خلق السماوات وتزيينها بالمصابيح',
      meaningfulStopHint: 'وقف معنوي تام عند ﴿وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ﴾ (الآية 5).',
      mentalLinkTip: 'قف عند تمام وصف مصابيح السماء في الآية 5',
      colorBadge: 'emerald',
    },
    {
      id: 'th-67-2',
      surahId: 67,
      fromAyah: 6,
      toAyah: 14,
      title: 'مصير الكافرين واعترافهم مقابل أجر الذين يخشون ربهم بالغيب',
      summary: 'سؤال خزنة جهنم وحسرة أهلها، وبشارة المغفرة والأجر الكبير للمؤمنين',
      meaningfulStopHint: 'وقف تام عند ﴿أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ﴾ (الآية 14).',
      mentalLinkTip: 'ينتهي المقطع بآية العلم اللطيف (ألا يعلم من خلق وهو اللطيف الخبير)',
      colorBadge: 'amber',
    },
    {
      id: 'th-67-3',
      surahId: 67,
      fromAyah: 15,
      toAyah: 30,
      title: 'ذلولية الأرض، الطير الصافات، والتوكل على الرحمن',
      summary: 'تمكين المشي في مناكب الأرض، تذكير بنعم السمع والبصر والماء المعين',
      meaningfulStopHint: 'ختام السورة عند ﴿فَمَن يَأْتِيكُم بِمَاءٍ مَّعِينٍ﴾.',
      mentalLinkTip: 'من (هو الذي جعل لكم الأرض ذلولاً) إلى ختام السورة بالماء المعين',
      colorBadge: 'indigo',
    },
  ],
  78: [
    {
      id: 'th-78-1',
      surahId: 78,
      fromAyah: 1,
      toAyah: 16,
      title: 'التساؤل عن النبأ العظيم ودلائل القدرة في الكون',
      summary: 'الأرض مهاداً والجبال أوتاداً والنوم سباتاً والسراج الوهاج والماء الثجاج والجنات ألفافاً',
      meaningfulStopHint: 'وقف تام عند ﴿وَجَنَّاتٍ أَلْفَافًا﴾ (الآية 16) لاكتمال دلائل القدرة.',
      mentalLinkTip: 'تسع نعم كونية متتابعة من الآية 6 إلى 16',
      colorBadge: 'emerald',
    },
    {
      id: 'th-78-2',
      surahId: 78,
      fromAyah: 17,
      toAyah: 30,
      title: 'مشاهد يوم الفصل وجزاء الطاغين في جهنم',
      summary: 'نفخ الصور وفتح السماء ومرصاد جهنم للطاغين الذين لم يرجوا حساباً وكذبوا بالآيات',
      meaningfulStopHint: 'وقف تام عند ﴿فَذُوقُوا فَلَن نَّزِيدَكُمْ إِلَّا عَذَابًا﴾ (الآية 30).',
      mentalLinkTip: 'تبدأ بـ (إن يوم الفصل كان ميقاتاً) وتنتهي بجزاء المكذبين',
      colorBadge: 'rose',
    },
    {
      id: 'th-78-3',
      surahId: 78,
      fromAyah: 31,
      toAyah: 40,
      title: 'نعيم المتقين ومقام القيام بين يدي الرحمن',
      summary: 'إن للمتقين مفازاً، وعطاءً حساباً، والإنذار القريب بيوم ينظر المرء ما قدمت يداه',
      meaningfulStopHint: 'وقف تام بنهاية السورة عند ﴿يَا لَيْتَنِي كُنتُ تُرَابًا﴾.',
      mentalLinkTip: 'من (إن للمتقين مفازاً) حتى ختام السورة',
      colorBadge: 'amber',
    },
  ],
  79: [
    {
      id: 'th-79-1',
      surahId: 79,
      fromAyah: 1,
      toAyah: 14,
      title: 'قسم الله بالملائكة وأهوال البعث والحافرة',
      summary: 'النازعات والناشطات والسابحات، ورجفة القلوب والأبصار يوم القيامة',
      meaningfulStopHint: 'وقف تام عند ﴿فَإِذَا هُم بِالسَّاهِرَةِ﴾ (الآية 14) قبل قصة موسى.',
      mentalLinkTip: 'من أول السورة إلى البعث في الساهرة',
      colorBadge: 'emerald',
    },
    {
      id: 'th-79-2',
      surahId: 79,
      fromAyah: 15,
      toAyah: 26,
      title: 'قصة موسى عليه السلام مع فرعون ونكال الآخرة والأولى',
      summary: 'نداء موسى بالوادي المقدس طوى وطغيان فرعون بقوله أنا ربكم الأعلى وعقابه',
      meaningfulStopHint: 'وقف تام عند ﴿إِنَّ فِي ذَٰلِكَ لَعِبْرَةً لِّمَن يَخْشَىٰ﴾ (الآية 26).',
      mentalLinkTip: 'تبدأ بـ (هل أتاك حديث موسى) وتنتهي بآية العبرة لمن يخشى',
      colorBadge: 'amber',
    },
    {
      id: 'th-79-3',
      surahId: 79,
      fromAyah: 27,
      toAyah: 46,
      title: 'بناء السماء ودحو الأرض والجزاء يوم الطامة الكبرى',
      summary: 'آيات الخلق، مصير من طغى ومن خاف مقام ربه، وعلم الساعة عند الله',
      meaningfulStopHint: 'ختام السورة عند ﴿عَشِيَّةً أَوْ ضُحَاهَا﴾.',
      mentalLinkTip: 'من (أأنتم أشد خلقاً أم السماء بناها) إلى نهاية السورة',
      colorBadge: 'indigo',
    },
  ],
  80: [
    {
      id: 'th-80-1',
      surahId: 80,
      fromAyah: 1,
      toAyah: 16,
      title: 'عتاب النبي ﷺ في شأن ابن أم مكتوم وشرف القرآن الكريم',
      summary: 'إقبال الأعمى يخشى ورفعة صحف القرآن المكرمة بأيدي سفرة كرام بررة',
      meaningfulStopHint: 'وقف تام عند ﴿كِرَامٍ بَرَرَةٍ﴾ (الآية 16).',
      mentalLinkTip: 'قصة الأعمى يتبعها وصف صحف القرآن المكرمة',
      colorBadge: 'emerald',
    },
    {
      id: 'th-80-2',
      surahId: 80,
      fromAyah: 17,
      toAyah: 42,
      title: 'نعم الله في الخلق والطعام ومشاهد الصاخة والوجوه المسفرة',
      summary: 'أطوار خلق الإنسان، إنبات الحب والعنب، والفرار يوم الصاخة وتباين الوجوه',
      meaningfulStopHint: 'ختام السورة عند ﴿أُولَٰئِكَ هُمُ الْكَفَرَةُ الْفَجَرَةُ﴾.',
      mentalLinkTip: 'من (فلينظر الإنسان إلى طعامه) إلى مشهد الصاخة',
      colorBadge: 'amber',
    },
  ],
};

export function getSurahThematicBlocks(surahId: number): SurahThematicBlock[] {
  if (CURATED_SURAH_THEMATIC_BLOCKS[surahId]) {
    return CURATED_SURAH_THEMATIC_BLOCKS[surahId];
  }

  const surah = SURAHS.find((s) => s.id === surahId) || SURAHS[0];
  const total = surah.ayahs;

  if (total <= 10) {
    return [
      {
        id: `th-${surahId}-all`,
        surahId,
        fromAyah: 1,
        toAyah: total,
        title: `وحدة موضوعية متكاملة لسورة ${surah.name}`,
        summary: `تحفظ سورة ${surah.name} كاملة (${total} آيات) كوحدة معنوية واحدة مترابطة وفق التفسير الميسر.`,
        meaningfulStopHint: `وقف تام على ختام السورة (الآية ${total}) لتمام المقصد القرآني.`,
        mentalLinkTip: 'احفظ السورة كاملة في جلسة واحدة لارتباط خواتيم آياتها.',
        colorBadge: 'emerald',
      },
    ];
  }

  const segmentCount = total <= 30 ? 3 : total <= 80 ? 4 : 6;
  const step = Math.ceil(total / segmentCount);
  const blocks: SurahThematicBlock[] = [];
  const colors = ['emerald', 'amber', 'indigo', 'rose'];
  const titles = [
    'المقطع الأول: مطلع السورة وتقرير التوحيد والرسالة',
    'المقطع الثاني: الدلائل الكونية والقصص والعبر',
    'المقطع الثالث: التوجيهات الإيمانية والأحكام التشريعية',
    'المقطع الرابع: مشاهد اليوم الآخر والوعد والوعيد',
    'المقطع الخامس: تثبيت المؤمنين والوعد بالنصر والتمكين',
    'المقطع السادس: خواتيم السورة ومسك الختام والدعاء',
  ];

  for (let i = 0; i < segmentCount; i++) {
    const fromAyah = i * step + 1;
    if (fromAyah > total) break;
    const toAyah = Math.min(total, (i + 1) * step);
    blocks.push({
      id: `th-${surahId}-${i + 1}`,
      surahId,
      fromAyah,
      toAyah,
      title: titles[i % titles.length],
      summary: `الآيات من (${fromAyah}) إلى (${toAyah}) من سورة ${surah.name} — مقطع متكامل المعنى في التفسير الميسر.`,
      meaningfulStopHint: `وقف معنوي تام عند الآية (${toAyah}) من سورة ${surah.name} لاكتمال المعنى قبل الانتقال للمحور التالي.`,
      mentalLinkTip: `اربط نهاية الآية (${toAyah}) بمفتتح الآية (${Math.min(total, toAyah + 1)}).`,
      colorBadge: colors[i % colors.length],
    });
  }

  return blocks;
}

// 7. ركن «آداب حامل القرآن والتربية» في الحصة
export const TARBIYAH_ADAB_CARDS: TarbiyahAdabCard[] = [
  {
    id: 'trb-1',
    category: 'آداب القرآن',
    title: 'إخلاص النية لله وتوقير كلام الله',
    oneMinuteReminder:
      'يا بطل القرآن، تذكر أن كل حرف تقرؤه بعشر حسنات، فجدد نيتك أن تحفظ ليرضى الله عنك وتلبس والديك تاج الوقار.',
    evidenceOrHadith: 'قال ﷺ: «خيركم من تعلم القرآن وعلمه»',
    practicalAction: 'استحضر نية رضا الله قبل فتح المصحف اليوم',
  },
  {
    id: 'trb-2',
    category: 'الأخلاق والبر',
    title: 'بر الوالدين وتقبيل أيديهما بعد الحلقة',
    oneMinuteReminder:
      'حامل القرآن هو أحسن الناس خلقاً وبرّاً بوالديه؛ لأنهما سبب وجودك في حلقة كتاب الله.',
    evidenceOrHadith: '﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا﴾',
    practicalAction: 'اشكر والديك اليوم بعد انتهاء الحلقة وادعُ لهما',
  },
  {
    id: 'trb-3',
    category: 'آداب القرآن',
    title: 'الطهارة والوضوء وحسن الجلسة مع المصحف',
    oneMinuteReminder:
      'من تعظيم كلام الله أن تتوضأ قبل الحلقة، وتجلس جلسة الوقار والأدب، وترفع المصحف في مكان طاهر مرتفع.',
    evidenceOrHadith: '﴿ذَٰلِكَ وَمَن يُعَظِّمْ شَعَائِرَ اللَّهِ فَإِنَّهَا مِن تَقْوَى الْقُلُوبِ﴾',
    practicalAction: 'المحافظة على الوضوء ووضع المصحف في مكان لائق',
  },
  {
    id: 'trb-4',
    category: 'آداب القرآن',
    title: 'قراءة الورد المحفوظ في الصلوات الخمس',
    oneMinuteReminder:
      'أقوى طريقة لتثبيت حفظك الجديد ألا تنساه أبداً هي أن تقرأ بالسور التي حفظتها اليوم في صلواتك والسنن الرواتب.',
    evidenceOrHadith: '«تعاهدوا هذا القرآن، فوالذي نفس محمد بيده لهو أشد تفلتاً من الإبل في عقلها»',
    practicalAction: 'صلِّ ركعتين اليوم بما حفظته في هذه الحصة',
  },
  {
    id: 'trb-5',
    category: 'الأخلاق والبر',
    title: 'الصدق وحفظ اللسان عن الكلمات غير اللائقة',
    oneMinuteReminder:
      'اللسان الذي يقرأ القرآن الكريم لسان طاهر مبارك، فلا يليق به إلا الصدق والكلام الطيب وإفشاء السلام.',
    evidenceOrHadith: '﴿وَقُولُوا لِلنَّاسِ حُسْنًا﴾',
    practicalAction: 'التزم بالكلمة الطيبة والابتسامة مع إخوتك وزملائك',
  },
  {
    id: 'trb-6',
    category: 'همة الحافظ',
    title: 'الصبر على التكرار والمراجعة اليومية',
    oneMinuteReminder:
      'الماهر بالقرآن مع السفرة الكرام البررة، ومن تَتَعْتَع فيه وهو عليه شاق فله أجران؛ فلا تيأس من التكرار أبداً.',
    evidenceOrHadith: 'قال ﷺ: «الماهر بالقرآن مع السفرة الكرام البررة»',
    practicalAction: 'تكرار المقطع الجديد 10 مرات بتركيز بعد الحصة',
  },
];

// 5. أوضاع المواسم والدورات المكثفة
export const SEASONAL_PROGRAM_PRESETS: SeasonalProgramPreset[] = [
  {
    id: 'عادي',
    title: 'الخطة الاعتيادية المستمرة للحلقة',
    badge: '📚 الوضع الاعتيادي',
    dailyGoal: 'نصف وجه حفظ جديد + مراجعة قريبة وبعيدة متوازنة',
    dailyTargetRecommendation: 'نصف وجه حفظ جديد + مراجعة قريبة وبعيدة متوازنة',
    challengeReward: 'نقاط الهمة الأسبوعية (XP)',
    description: 'السير المنتظم حسب الخطة الفردية الأصلية لكل طالب دون ضغط إضافي.',
  },
  {
    id: 'ختمة رمضان',
    title: 'برنامج شهر رمضان المبارك — ربيع القلوب',
    badge: '🌙 موسم رمضان',
    dailyGoal: 'وجه كامل مراجعة مركزة + ختمة تلاوة وتدبر جماعية',
    dailyTargetRecommendation: 'وجه كامل مراجعة مركزة + ختمة تلاوة وتدبر جماعية',
    challengeReward: 'وسام فارس رمضان + بطاقة بشارة رمضانية ذهبية (+200 XP)',
    description: 'وضع موسمي خاص بشهر رمضان يركز على تثبيت المحفوظ ومضاعفة الورد اليومي دون إتلاف خطة الطالب الأصلية.',
  },
  {
    id: 'مكثف الصيف',
    title: 'الدورة الصيفية المكثفة — تاج الوقار',
    badge: '☀️ دورة صيفية مكثفة',
    dailyGoal: 'وجهان حفظ ومراجعة يومياً مع متابعة الحصون الخمسة',
    dailyTargetRecommendation: 'وجهان حفظ ومراجعة يومياً مع متابعة الحصون الخمسة',
    challengeReward: 'تاج الإتقان الذهبي + شهادة إتمام الدورة الصيفية (+300 XP)',
    description: 'استثمار الإجازة الصيفية بمضاعفة كمية الحفظ والمراجعة مع الاحتفاظ بخطة الطالب الأصلية عند انتهاء الموسم.',
  },
  {
    id: 'مراجعة عشر ذي الحجة',
    title: 'موسم عشر ذي الحجة — أيام الذكر والتكبير',
    badge: '🕋 عشر ذي الحجة',
    dailyGoal: 'تثبيت جزء كامل مع الأذكار وتدبر آيات الحج والتوحيد',
    dailyTargetRecommendation: 'تثبيت جزء كامل مع الأذكار وتدبر آيات الحج والتوحيد',
    challengeReward: 'وسام عشر ذي الحجة المباركة (+250 XP)',
    description: 'برنامج موسمي خاص بالعشر الأوائل من ذي الحجة لمضاعفة المراجعة والعمل الصالح.',
  },
  {
    id: 'معسكر تثبيت',
    title: 'معسكر تثبيت الخمسة أجزاء والسرد المتقن',
    badge: '🏕️ معسكر السرد',
    dailyGoal: 'سرد حزب كامل غيباً بدون أخطاء + ضبط المتشابهات',
    dailyTargetRecommendation: 'سرد حزب كامل غيباً بدون أخطاء + ضبط المتشابهات',
    challengeReward: 'وسام الضبط المتقن + بطاقة بشارة عائلية',
    description: 'دورة مكثفة قصيرة لسرد ومراجعة الأجزاء المحفوظة سابقاً واختبارها.',
  },
];

// 6. رادار الإنذار المبكر لانقطاع الطلاب
export interface DropoutRadarItem {
  student: Student;
  studentId: string;
  studentName: string;
  circle: string;
  riskLevel: 'حرج' | 'مرتفع' | 'متوسط' | 'منخفض' | 'آمن';
  riskScore: number; // 0..100
  daysSinceLastSession: number;
  consecutiveAbsences: number;
  inactivePortalDays: number;
  masteryDropDelta: number;
  triggers: string[];
  indicators: string[];
  recommendedAction: string;
  gentleMessageTemplate: string;
  gentleWhatsAppMessage: string;
}

export function computeDropoutRadar(
  students: Student[],
  sessions: SessionRecord[],
  academyName: string,
  teacherName: string,
  officialPhone = '201068631966'
): DropoutRadarItem[] {
  const activeStudents = students.filter((s) => (s.accountStatus || 'نشط') === 'نشط');

  return activeStudents
    .map((st) => {
      const stSessions = sessions
        .filter((s) => s.studentId === st.id)
        .sort((a, b) => b.date.localeCompare(a.date));

      // 1. Consecutive absences at the head of history
      let consecutiveAbsences = 0;
      for (const ses of stSessions) {
        if (ses.status === 'غاب') {
          consecutiveAbsences++;
        } else {
          break;
        }
      }

      // Days since last session
      let daysSinceLastSession = 2;
      if (stSessions[0]?.date) {
        const diffMs = Date.now() - new Date(stSessions[0].date).getTime();
        daysSinceLastSession = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }

      // 2. Portal / Five Fortresses inactivity
      const fortDates = Object.keys(st.fiveFortressesLog || {}).sort((a, b) =>
        b.localeCompare(a)
      );
      let inactivePortalDays = 5;
      if (fortDates.length > 0) {
        const diffMs = Date.now() - new Date(fortDates[0]).getTime();
        inactivePortalDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }

      // 3. Sudden drop in mastery score (latest attended vs previous average)
      const attended = stSessions.filter((s) => s.status === 'حضر');
      let masteryDropDelta = 0;
      if (attended.length >= 2) {
        const latestScore = attended[0].masteryScore;
        const prevAvg =
          attended
            .slice(1, 4)
            .reduce((acc, item) => acc + item.masteryScore, 0) /
          Math.min(3, attended.length - 1);
        masteryDropDelta = Math.max(0, Math.round(prevAvg - latestScore));
      } else if (attended.length === 1 && attended[0].masteryScore < 80) {
        masteryDropDelta = 88 - attended[0].masteryScore;
      }

      let riskScore = 0;
      const triggers: string[] = [];

      if (consecutiveAbsences >= 2) {
        riskScore += 45;
        triggers.push(`غياب متتالٍ (${consecutiveAbsences} حصص متتالية)`);
      } else if (consecutiveAbsences === 1) {
        riskScore += 20;
        triggers.push('غياب في آخر حصة مقررة وعدم تسميع ورد الأمس');
      }

      if (inactivePortalDays >= 4) {
        riskScore += 30;
        triggers.push(`توقف نشاط بوابة الطالب والحصون الخمسة منذ (${inactivePortalDays} أيام)`);
      }

      if (masteryDropDelta >= 8) {
        riskScore += 30;
        triggers.push(`انخفاض تدريجي في الدرجات ومؤشر الإتقان (-${masteryDropDelta}%)`);
      }

      if (st.disciplineWarnings.length > 0) {
        riskScore += 15;
        triggers.push(`وجود (${st.disciplineWarnings.length}) تنبيهات متابعة سابقة`);
      }

      if (triggers.length === 0) {
        triggers.push('يوصى بتشجيع دوري للحفاظ على الحماس ومنع الفتور');
        riskScore = 15;
      }

      riskScore = Math.min(100, riskScore);
      const riskLevel: 'حرج' | 'متوسط' | 'منخفض' =
        riskScore >= 55 ? 'حرج' : riskScore >= 30 ? 'متوسط' : 'منخفض';

      const recommendedAction =
        riskScore >= 55
          ? 'إرسال رسالة اطمئنان دافئة فوراً وتخفيف الورد مؤقتاً إلى مراجعة مشجعة.'
          : riskScore >= 30
          ? 'تشجيع الطالب في بداية الحلقة القادمة ومنحه نقاط همة تحفيزية.'
          : 'استمرار المتابعة الإيجابية ومكافأة الانتظام.';

      const gentleMessageTemplate = `🌿 *رسالة اطمئنان ومودة — ${academyName}*\n\nالسلام عليكم ورحمة الله وبركاته، ولي أمر ابننا الغالي وبطل القرآن *${st.name}* (${st.guardianName}) حفظكم الله،\n\nافتقدنا حضور وتفاعل بطلنا المبارك في «${st.circle}»، ونود الاطمئنان عليه وعلى أحوالكم الكريمة، فمكانه في الحلقة محفوظ، والشيخ *${teacherName}* يقرئه السلام وينتظر عودته بشوق لاستكمال حفظ *سورة ${st.currentStop.surahName} (من الآية ${st.currentStop.ayah})*.\n\nإذا كان هناك أي ظرف أو احتجتم لتعديل وقت الحصة أو تخفيف الورد مؤقتاً فنحن في خدمتكم دائماً عبر واتساب الإدارة الرسمي: https://wa.me/${officialPhone}\n\nحفظكم الله وبارك في ذريتكم 🌸`;

      return {
        student: st,
        studentId: st.id,
        studentName: st.name,
        circle: st.circle,
        riskLevel,
        riskScore,
        daysSinceLastSession,
        consecutiveAbsences,
        inactivePortalDays,
        masteryDropDelta,
        triggers,
        indicators: triggers,
        recommendedAction,
        gentleMessageTemplate,
        gentleWhatsAppMessage: gentleMessageTemplate,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

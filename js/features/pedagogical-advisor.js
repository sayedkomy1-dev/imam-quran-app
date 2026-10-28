// ============================================================================
// وحدة «المستشار التربوي والتأسيس القرآني وصعوبات التعلم» — أكاديمية الإمام
// Offline-First Pedagogical Advisor Module (Schema = 12 Additive Compatible)
// ============================================================================

export const LOCAL_SCHEMA_VERSION = 12;

export const PEDAGOGICAL_SCREENING_QUESTIONS = [
  {
    id: 'q1_modality',
    number: 1,
    questionText: 'كيف يلتقط الطفل الآية الجديدة بشكل أسرع أثناء الحلقة؟',
    options: [
      { id: 'q1_auditory', label: 'يردد خلف الشيخ بالسمع والنغمة فوراً', style: 'سمعي', track: 'تلقين سمعي' },
      { id: 'q1_visual', label: 'يحتاج لرؤية الكلمة ومكانها في السطر', style: 'بصري', track: 'تأسيس قرائي' },
      { id: 'q1_kinesthetic', label: 'يتفاعل مع العد بالأصابع والإشارة والتسميع التفاعلي', style: 'حركي/تفاعلي', track: 'تحفيظ بجرعات صغيرة' },
    ],
  },
  {
    id: 'q2_pronunciation',
    number: 2,
    questionText: 'ما مستوى نطق الحروف والمخارج عند القراءة أو الترديد؟',
    options: [
      { id: 'q2_clear', label: 'ينطق مخارج الحروف بوضوح', challenge: 'balanced_typical' },
      { id: 'q2_mild_swap', label: 'يخلط أحياناً بين الحروف المتقاربة والمفخم والمرقق', challenge: 'pronunciation_makharij', weight: 2 },
      { id: 'q2_severe_lisp', label: 'إبدال متكرر للحروف أو لثغة تحتاج لتلقين مشافه', challenge: 'pronunciation_makharij', weight: 4 },
    ],
  },
  {
    id: 'q3_attention',
    number: 3,
    questionText: 'كيف تصف قدرة الطفل على الجلوس والتركيز المتواصل في الحلقة؟',
    options: [
      { id: 'q3_focused', label: 'يحافظ على تركيزه ويتابع موضع الآية بهدوء', challenge: 'balanced_typical' },
      { id: 'q3_short_span', label: 'يركز في أول 5 دقائق ثم يفقد موضع الآية', challenge: 'attention_hyperactivity', weight: 3 },
      { id: 'q3_hyperactive', label: 'كثير الحركة والتململ ويشعر بالملل سريعاً', challenge: 'attention_hyperactivity', weight: 4 },
    ],
  },
  {
    id: 'q4_memory_retention',
    number: 4,
    questionText: 'ماذا يحدث عندما ينتقل الطفل من حفظ الآية الأولى إلى الآية التي تليها؟',
    options: [
      { id: 'q4_solid', label: 'يثبت الآية الأولى ويربطها بالثانية بسهولة', challenge: 'balanced_typical' },
      { id: 'q4_forgets_quickly', label: 'ينسى الآية فور الانتقال للتي تليها', challenge: 'slow_memorization', weight: 4 },
      { id: 'q4_mixes_similar', label: 'يخلط نهايات الآيات والمتشابهات عند الوصل', challenge: 'slow_memorization', weight: 3 },
    ],
  },
  {
    id: 'q5_reading_foundation',
    number: 5,
    questionText: 'ما مستوى الطفل عند قراءة كلمة قرآنية مشكّلة من المصحف مباشرة؟',
    options: [
      { id: 'q5_fluent', label: 'يقرأ الكلمات المشكّلة بطلاقة', challenge: 'balanced_typical' },
      { id: 'q5_struggles_sukun_shaddah', label: 'يتعثر في السكون أو التنوين أو الشدة والمدود', challenge: 'weak_reading_foundation', weight: 3 },
      { id: 'q5_letter_by_letter', label: 'عدم إتقان الحركات القصيرة ويعتمد على السماع فقط', challenge: 'weak_reading_foundation', weight: 4 },
    ],
  },
  {
    id: 'q6_hesitation_confidence',
    number: 6,
    questionText: 'كيف يتصرف الطفل عندما يتوقف أو يخطئ في كلمة أثناء التسميع؟',
    options: [
      { id: 'q6_confident', label: 'يحاول استرجاع الآية بهدوء وثقة', challenge: 'balanced_typical' },
      { id: 'q6_needs_first_letter', label: 'يتردد كثيراً وينتظر أول حرف من المحفظ', challenge: 'slow_memorization', weight: 2 },
      { id: 'q6_anxious', label: 'يرتبك ويحتاج لتشجيع مستمر وجرعات صغيرة', challenge: 'attention_hyperactivity', weight: 2 },
    ],
  },
  {
    id: 'q7_tajweed_perception',
    number: 7,
    questionText: 'ما الطريقة التي يستجيب لها الطفل عند تعليمه حكماً تجويدياً؟',
    options: [
      { id: 'q7_echo', label: 'محاكاة نبرة صوت الشيخ مباشرة', style: 'سمعي' },
      { id: 'q7_color_visual', label: 'رؤية الحرف ملوناً في المصحف والسبورة', style: 'بصري' },
      { id: 'q7_hand_gesture', label: 'حركة اليد والعد بالأصابع والقصة الحسية', style: 'حركي/تفاعلي' },
    ],
  },
];

export const SMART_TEACHER_GUIDE = {
  readingFoundation: [
    'الحروف الهجائية مجردة وأشكالها في الكلمة',
    'الحركات القصيرة الثلاث (الفتح، الكسر، الضم)',
    'المدود الطبيعية الثلاثة (الألف، الواو، الياء)',
    'السكون ومهارة التصادم الصوتي',
    'التنوين بالفتح والكسر والضم',
    'الشدة (الحرف المضعف = ساكن + متحرك)',
  ],
  kidsTajweed: [
    'النون والميم المشددتين (جرس الرنين الجميل بمقدار إصبعين)',
    'القلقلة في قطب جد (الكرة النطاطة عند السكون)',
    'المدود القرآنية (جسر الصوت الممتد)',
    'أحكام النون الساكنة والتنوين بالمحاكاة السمعية المبسطة',
  ],
  learningChallengesPlans: {
    attention_hyperactivity:
      'تقسيم الحصة إلى فقرات من 5 دقائق، التسميع التفاعلي المتناوب، استخدام التكرار النغمي، وتكليفه بمهام قيادية صغيرة.',
    slow_memorization:
      'طريقة «الربط التراكمي (آية بآية)»، وتقليل المقدار مع زيادة التكرار السمعي للمقرئ المعلم قبل الحصة.',
    pronunciation_makharij:
      'التركيز على التلقين المشافه البصري، وتقسيم الكلمة القرآنية الطويلة إلى مقاطع صوتية.',
    weak_reading_foundation:
      'التدرج في منهج التأسيس القرائي وتهجئة كلمات قصار السور قبل تحفيظها.',
  },
  errorCoachingBadges: {
    نطق: '💡 نصيحة تربوية: فكّك الكلمة إلى مقاطع صوتية ودرّب الطالب على مخرج الحرف بالمشافهة البطيئة.',
    تشكيل: '💡 نصيحة تربوية: قسّم الكلمة إلى مقاطع صوتية قصيرة واطلب تهجئة الحرف مع حركته بتأنٍ.',
    حفظ: '💡 نصيحة تربوية: طبّق الربط التراكمي آية بآية (٣ مرات) مع توضيح المعنى الكلي للآية.',
    تجويد: '💡 نصيحة تربوية: استخدم المحاكاة السمعية وإشارة الأصابع لضبط زمن الغنة أو المد دون تعقيد اصطلاحي.',
    تردد: '💡 نصيحة تربوية: امنح الطالب ٣ ثوانٍ هادئة مع ابتسامة مطمئنة ليسترجع الكلمة بنفسه دون استعجال.',
  },
};

export function evaluatePedagogicalAssessment(answers = {}) {
  const styles = { سمعي: 0, بصري: 0, 'حركي/تفاعلي': 0 };
  const challenges = {
    pronunciation_makharij: 0,
    attention_hyperactivity: 0,
    slow_memorization: 0,
    weak_reading_foundation: 0,
  };

  const hasExplicitAnswers = Object.keys(answers).length > 0;
  for (const q of PEDAGOGICAL_SCREENING_QUESTIONS) {
    const chosenId = answers[q.id];
    const opt = hasExplicitAnswers
      ? q.options.find((o) => o.id === chosenId)
      : q.options[0];
    if (!opt) continue;
    if (opt.style) styles[opt.style] = (styles[opt.style] || 0) + 3;
    if (opt.challenge && challenges[opt.challenge] !== undefined) {
      challenges[opt.challenge] += opt.weight || 2;
    }
  }

  const learningStyle = Object.keys(styles).sort((a, b) => styles[b] - styles[a])[0] || 'سمعي';
  const topChallenge = Object.keys(challenges).sort((a, b) => challenges[b] - challenges[a])[0];
  const primaryChallengeKey = challenges[topChallenge] >= 2 ? topChallenge : 'balanced_typical';

  let suggestedTrack = 'تلقين سمعي';
  if (primaryChallengeKey === 'weak_reading_foundation') {
    suggestedTrack = 'تأسيس قرائي';
  } else if (
    primaryChallengeKey === 'attention_hyperactivity' ||
    primaryChallengeKey === 'slow_memorization'
  ) {
    suggestedTrack = 'تحفيظ بجرعات صغيرة';
  }

  return {
    schemaVersion: LOCAL_SCHEMA_VERSION,
    learningStyle,
    primaryChallengeKey,
    suggestedTrack,
    teacherRecommendation:
      SMART_TEACHER_GUIDE.learningChallengesPlans[primaryChallengeKey] ||
      'الجمع بين التلقين السمعي المتقن والمراجعة التراكمية.',
  };
}

export function getErrorCoachingTip(errorType = 'حفظ') {
  return (
    SMART_TEACHER_GUIDE.errorCoachingBadges[errorType] ||
    SMART_TEACHER_GUIDE.errorCoachingBadges['حفظ']
  );
}

export function generateParentGuidanceMessage({
  studentName = 'الطالب',
  surahName = 'النبأ',
  templateType = 'sleep_listening',
  targetLetter = 'القاف',
} = {}) {
  const templates = {
    sleep_listening: `👨‍👩‍👧 توجيه تربوي للأسرة:\nلتثبيت حفظ الابن (${studentName}) بيسر، ننصح بتشغيل المقرئ المعلم لسورة ${surahName} لمدة ١٠ دقائق قبل النوم.\nالاستماع الهادئ قبل النوم يرسخ الآيات في الذاكرة تلقائياً دون إجهاد.`,
    encourage_hesitant: `👨‍👩‍👧 توجيه تربوي للأسرة:\nأدى الابن (${studentName}) جهداً طيباً اليوم في سورة ${surahName}.\nنرجو منحه مهلة هادئة (٥ ثوانٍ) عند التسميع في المنزل مع التشجيع دون ضغط نفسي لبناء ثقته وطلاقته.`,
    pronunciation_drill: `👨‍👩‍👧 توجيه تربوي للأسرة:\nنتدرب مع البطل (${studentName}) على إتقان نطق حرف (${targetLetter}) في سورة ${surahName}.\nنرجو تدريبه ٣ دقائق يومياً على نطق الكلمة مقطعة ثم موصولة بأسلوب مشوق.`,
    focused_10min: `👨‍👩‍👧 توجيه تربوي للأسرة:\nلرفع تركيز البطل (${studentName})، ننصح بمراجعة سورة ${surahName} في جلستين قصيرتين (٥ دقائق صباحاً و٥ مساءً) بعيداً عن الشاشات مع التناوب معه آية بآية.`,
  };

  return templates[templateType] || templates.sleep_listening;
}

import {
  ErrorType,
  LearningStyleType,
  PedagogicalChallengeKey,
  RecitationError,
  Student,
  StudentPedagogicalProfile,
  SuggestedEducationalTrack,
} from '../types';

export interface PedagogicalScreeningOption {
  id: string;
  label: string;
  learningStyleWeight?: Partial<Record<LearningStyleType, number>>;
  challengeWeight?: Partial<Record<PedagogicalChallengeKey, number>>;
  trackHint?: SuggestedEducationalTrack;
}

export interface PedagogicalScreeningQuestion {
  id: string;
  number: number;
  dimensionLabel: string;
  questionText: string;
  observationHint: string;
  options: PedagogicalScreeningOption[];
}

export const PEDAGOGICAL_SCREENING_QUESTIONS: PedagogicalScreeningQuestion[] = [
  {
    id: 'q1_modality',
    number: 1,
    dimensionLabel: 'القناة الحسية الأسرع للاستيعاب',
    questionText: 'كيف يلتقط الطفل الآية الجديدة بشكل أسرع أثناء الحلقة؟',
    observationHint: 'لاحظ استجابته عند التلقين الصوتي مقارنة بالنظر في المصحف أو الإشارة باليد.',
    options: [
      {
        id: 'q1_auditory',
        label: 'يردد خلف الشيخ بالسمع والنغمة فوراً حتى دون النظر للمصحف',
        learningStyleWeight: { سمعي: 3 },
        trackHint: 'تلقين سمعي',
      },
      {
        id: 'q1_visual',
        label: 'يحتاج لرؤية الكلمة ومكانها في السطر وتلوين الحروف ليتذكرها',
        learningStyleWeight: { بصري: 3 },
        trackHint: 'تأسيس قرائي',
      },
      {
        id: 'q1_kinesthetic',
        label: 'يتفاعل أكثر عند العدّ بالأصابع أو الإشارة أو الترديد الحركي الجماعي',
        learningStyleWeight: { 'حركي/تفاعلي': 3 },
        trackHint: 'تحفيظ بجرعات صغيرة',
      },
    ],
  },
  {
    id: 'q2_pronunciation',
    number: 2,
    dimensionLabel: 'سلامة النطق ومخارج الحروف',
    questionText: 'ما مستوى نطق الحروف والمخارج عند القراءة أو الترديد؟',
    observationHint: 'انتبه لإبدال الحروف (مثل س/ث، ك/ق، ر/ل) أو الخلط بين المفخم والمرقق.',
    options: [
      {
        id: 'q2_clear',
        label: 'ينطق مخارج الحروف بوضوح ويميز بين المفخم والمرقق بشكل طبيعي',
        challengeWeight: { balanced_typical: 2 },
      },
      {
        id: 'q2_mild_swap',
        label: 'يخلط أحياناً بين الحروف المتقاربة (مثل: الطاء والتاء، الذال والزاي، الصاد والسين)',
        challengeWeight: { pronunciation_makharij: 2 },
        trackHint: 'تلقين سمعي',
      },
      {
        id: 'q2_severe_lisp',
        label: 'يوجد إبدال متكرر للحروف أو لثغة واضحة تحتاج لتلقين مشافه وتفكيك مقطعي',
        challengeWeight: { pronunciation_makharij: 4 },
        trackHint: 'تأسيس قرائي',
      },
    ],
  },
  {
    id: 'q3_attention',
    number: 3,
    dimensionLabel: 'التركيز والانتباه أثناء الحصة',
    questionText: 'كيف تصف قدرة الطفل على الجلوس والتركيز المتواصل في الحلقة؟',
    observationHint: 'راقب متى يبدأ بالتململ أو فقدان موضع الآية في المصحف.',
    options: [
      {
        id: 'q3_focused',
        label: 'يحافظ على تركيزه ويتابع موضع الآية بهدوء طوال مدة التسميع',
        challengeWeight: { balanced_typical: 2 },
        learningStyleWeight: { بصري: 1 },
      },
      {
        id: 'q3_short_span',
        label: 'يركز في أول 5 دقائق ثم يتشتت بصره أو يفقد موضع الآية في السطر',
        challengeWeight: { attention_hyperactivity: 3 },
        learningStyleWeight: { 'حركي/تفاعلي': 2 },
        trackHint: 'تحفيظ بجرعات صغيرة',
      },
      {
        id: 'q3_hyperactive',
        label: 'كثير الحركة والتململ ويشعر بالملل سريعاً إذا طالت فقرة التسميع',
        challengeWeight: { attention_hyperactivity: 4 },
        learningStyleWeight: { 'حركي/تفاعلي': 3 },
        trackHint: 'تحفيظ بجرعات صغيرة',
      },
    ],
  },
  {
    id: 'q4_memory_retention',
    number: 4,
    dimensionLabel: 'سرعة الحفظ وتثبيت الذاكرة',
    questionText: 'ماذا يحدث عندما ينتقل الطفل من حفظ الآية الأولى إلى الآية التي تليها؟',
    observationHint: 'جرب ربط آيتين جديدتين ببعضهما ولاحظ ثبات الآية الأولى.',
    options: [
      {
        id: 'q4_solid',
        label: 'يثبت الآية الأولى ويربطها بالثانية بسهولة مع تكرار معتدل (3 مرات)',
        challengeWeight: { balanced_typical: 2 },
        learningStyleWeight: { سمعي: 1 },
      },
      {
        id: 'q4_forgets_quickly',
        label: 'ينسى الآية الأولى فور الانتقال للتي تليها ويحتاج لربط تراكمي آية بآية',
        challengeWeight: { slow_memorization: 4 },
        trackHint: 'تحفيظ بجرعات صغيرة',
      },
      {
        id: 'q4_mixes_similar',
        label: 'يحفظ الآيات المفردة لكنه يخلط نهايات الآيات أو المتشابهات عند الوصل',
        challengeWeight: { slow_memorization: 3 },
        learningStyleWeight: { بصري: 1 },
        trackHint: 'تلقين سمعي',
      },
    ],
  },
  {
    id: 'q5_reading_foundation',
    number: 5,
    dimensionLabel: 'إتقان التأسيس القرائي والتهجئة',
    questionText: 'ما مستوى الطفل عند قراءة كلمة قرآنية مشكّلة من المصحف مباشرة؟',
    observationHint: 'اختبره في كلمة تحوي فتحاً وكسراً ومداً وسكوناً وشدة.',
    options: [
      {
        id: 'q5_fluent',
        label: 'يقرأ الكلمات المشكّلة بطلاقة ويميز الحركات والمدود والسكون والشدة',
        challengeWeight: { balanced_typical: 2 },
        learningStyleWeight: { بصري: 2 },
      },
      {
        id: 'q5_struggles_sukun_shaddah',
        label: 'يميز الحركات القصيرة لكنه يتعثر في السكون أو التنوين أو الشدة والمدود',
        challengeWeight: { weak_reading_foundation: 3 },
        trackHint: 'تأسيس قرائي',
      },
      {
        id: 'q5_letter_by_letter',
        label: 'لا يستطيع تهجئة الكلمات ويعتمد كلياً على الحفظ السماعي دون معرفة الحركات',
        challengeWeight: { weak_reading_foundation: 4 },
        learningStyleWeight: { سمعي: 2 },
        trackHint: 'تأسيس قرائي',
      },
    ],
  },
  {
    id: 'q6_hesitation_confidence',
    number: 6,
    dimensionLabel: 'الثقة النفسية والطلاقة في التسميع',
    questionText: 'كيف يتصرف الطفل عندما يتوقف أو يخطئ في كلمة أثناء التسميع؟',
    observationHint: 'لاحظ هل يحاول التهجئة بهدوء أم يصمت ويتوتر وينتظر أول حرف.',
    options: [
      {
        id: 'q6_confident',
        label: 'يحاول استرجاع الآية أو تهجئتها بهدوء وثقة دون خوف من الخطأ',
        challengeWeight: { balanced_typical: 2 },
      },
      {
        id: 'q6_needs_first_letter',
        label: 'يتردد كثيراً وينتظر من المحفظ تلقينه أول حرف من كل آية لينطلق',
        challengeWeight: { slow_memorization: 2 },
        learningStyleWeight: { سمعي: 2 },
        trackHint: 'تلقين سمعي',
      },
      {
        id: 'q6_anxious',
        label: 'يرتبك ويتوقف عن القراءة إذا شُدّد عليه في التصحيح ويحتاج لتشجيع مستمر',
        challengeWeight: { attention_hyperactivity: 1, slow_memorization: 2 },
        learningStyleWeight: { 'حركي/تفاعلي': 1 },
        trackHint: 'تحفيظ بجرعات صغيرة',
      },
    ],
  },
  {
    id: 'q7_tajweed_perception',
    number: 7,
    dimensionLabel: 'استيعاب أحكام التجويد (المد والغنة والقلقلة)',
    questionText: 'ما الطريقة التي يستجيب لها الطفل عند تعليمه حكماً تجويدياً كالغنة أو المد؟',
    observationHint: 'قارن بين تقليده لصوتك مباشرة أو استجابته للإشارة بفتح الأصابع.',
    options: [
      {
        id: 'q7_echo',
        label: 'يتقن الحكم فوراً بمجرد تقليد نبرة صوت الشيخ (محاكاة سمعية)',
        learningStyleWeight: { سمعي: 3 },
        trackHint: 'تلقين سمعي',
      },
      {
        id: 'q7_color_visual',
        label: 'يتذكر الحكم عندما يرى الحرف ملوناً في مصحف التجويد أو مرسوماً على السبورة',
        learningStyleWeight: { بصري: 3 },
      },
      {
        id: 'q7_hand_gesture',
        label: 'يضبط زمن المد والقلقلة عندما نربطها بحركة اليد والعدّ بالأصابع وقصة مشوقة',
        learningStyleWeight: { 'حركي/تفاعلي': 3 },
      },
    ],
  },
];

export const CHALLENGE_METADATA: Record<
  PedagogicalChallengeKey,
  {
    label: string;
    shortBadge: string;
    defaultTrack: SuggestedEducationalTrack;
    teacherActionSummary: string;
    sliceMinutes: number;
    dailyListening: number;
  }
> = {
  pronunciation_makharij: {
    label: 'صعوبات النطق ومخارج الحروف (إبدال الحروف أو اللثغة أو الخلط بين المفخم والمرقق)',
    shortBadge: 'صعوبات النطق ومخارج الحروف',
    defaultTrack: 'تلقين سمعي',
    teacherActionSummary:
      'التركيز على التلقين المشافه البطيء مع رؤية مخرج الحرف، وتقسيم الكلمة القرآنية الطويلة إلى مقاطع صوتية مع عدم إرهاق الطفل بكثرة المصطلحات.',
    sliceMinutes: 10,
    dailyListening: 5,
  },
  attention_hyperactivity: {
    label: 'تشتت الانتباه والحركة الزائدة (ملل سريع وفقدان موضع الآية)',
    shortBadge: 'تشتت الانتباه والحركة الزائدة',
    defaultTrack: 'تحفيظ بجرعات صغيرة',
    teacherActionSummary:
      'تقسيم الحصة إلى فقرات قصيرة (5 دقائق لكل فقرة)، استخدام التسميع التفاعلي والتكرار النغمي، وتكليف الطفل بمهام قيادية صغيرة في الحلقة.',
    sliceMinutes: 5,
    dailyListening: 3,
  },
  slow_memorization: {
    label: 'بطء الحفظ وتثبيت الذاكرة (نسيان الآية عند الانتقال للتي تليها وخلط المتشابهات)',
    shortBadge: 'بطء الحفظ وتثبيت الذاكرة',
    defaultTrack: 'تحفيظ بجرعات صغيرة',
    teacherActionSummary:
      'تطبيق طريقة «الربط التراكمي (آية بآية)»، وتقليل مقدار الحفظ الجديد (3 آيات متقنة خير من صفحة متفلتة) مع زيادة الاستماع للمقرئ المعلم قبل الحصة.',
    sliceMinutes: 7,
    dailyListening: 7,
  },
  weak_reading_foundation: {
    label: 'ضعف التأسيس القرائي (عدم إتقان الحركات القصيرة، المدود، السكون، أو الشدة)',
    shortBadge: 'ضعف التأسيس القرائي',
    defaultTrack: 'تأسيس قرائي',
    teacherActionSummary:
      'إعطاء الأولوية لمنهج التأسيس المتدرج (الحركات القصيرة ← المدود ← السكون ← التنوين ← الشدة) مع تهجئة كلمات قصار السور قبل تحفيظها.',
    sliceMinutes: 8,
    dailyListening: 5,
  },
  balanced_typical: {
    label: 'نمو مهاري متوازن واستعداد قرآني جيد',
    shortBadge: 'مسار متوازن ومستقر',
    defaultTrack: 'تلقين سمعي',
    teacherActionSummary:
      'الاستمرار على خطة الجمع بين التلقين المتقن والتهجئة البصرية مع التحفيز بنقاط الهمة ومراجعة الربط المستمرة.',
    sliceMinutes: 15,
    dailyListening: 3,
  },
};

export function evaluatePedagogicalScreening(
  answers: Record<string, string>,
  teacherObservationNote?: string
): StudentPedagogicalProfile {
  const styleScores: Record<LearningStyleType, number> = {
    سمعي: 0,
    بصري: 0,
    'حركي/تفاعلي': 0,
  };

  const challengeScores: Record<PedagogicalChallengeKey, number> = {
    pronunciation_makharij: 0,
    attention_hyperactivity: 0,
    slow_memorization: 0,
    weak_reading_foundation: 0,
    balanced_typical: 0,
  };

  const hasExplicitAnswers = Object.keys(answers).length > 0;
  for (const q of PEDAGOGICAL_SCREENING_QUESTIONS) {
    const pickedId = answers[q.id];
    const pickedOpt = hasExplicitAnswers
      ? q.options.find((o) => o.id === pickedId)
      : q.options[0];
    if (!pickedOpt) continue;

    if (pickedOpt.learningStyleWeight) {
      (Object.keys(pickedOpt.learningStyleWeight) as LearningStyleType[]).forEach((st) => {
        styleScores[st] += pickedOpt.learningStyleWeight?.[st] || 0;
      });
    }
    if (pickedOpt.challengeWeight) {
      (Object.keys(pickedOpt.challengeWeight) as PedagogicalChallengeKey[]).forEach((ch) => {
        challengeScores[ch] += pickedOpt.challengeWeight?.[ch] || 0;
      });
    }
  }

  // Pick dominant learning style
  const sortedStyles = (Object.keys(styleScores) as LearningStyleType[]).sort(
    (a, b) => styleScores[b] - styleScores[a]
  );
  const learningStyle: LearningStyleType = sortedStyles[0] || 'سمعي';

  // Pick primary challenge (ignore balanced_typical if any specific challenge has score >= 2)
  const specificChallenges: PedagogicalChallengeKey[] = [
    'weak_reading_foundation',
    'pronunciation_makharij',
    'attention_hyperactivity',
    'slow_memorization',
  ];
  const sortedSpecific = specificChallenges.sort(
    (a, b) => challengeScores[b] - challengeScores[a]
  );

  const topChallenge = sortedSpecific[0];
  const primaryChallengeKey: PedagogicalChallengeKey =
    challengeScores[topChallenge] >= 2 ? topChallenge : 'balanced_typical';

  const secondaryChallenges = sortedSpecific
    .slice(1)
    .filter((k) => challengeScores[k] >= 2)
    .map((k) => CHALLENGE_METADATA[k].shortBadge);

  const meta = CHALLENGE_METADATA[primaryChallengeKey];

  let suggestedTrack: SuggestedEducationalTrack = meta.defaultTrack;
  if (primaryChallengeKey === 'weak_reading_foundation') {
    suggestedTrack = 'تأسيس قرائي';
  } else if (
    primaryChallengeKey === 'attention_hyperactivity' ||
    primaryChallengeKey === 'slow_memorization'
  ) {
    suggestedTrack = 'تحفيظ بجرعات صغيرة';
  } else if (learningStyle === 'سمعي') {
    suggestedTrack = 'تلقين سمعي';
  }

  return {
    assessedAt: new Date().toISOString().slice(0, 10),
    learningStyle,
    primaryChallengeKey,
    primaryChallengeLabel: meta.label,
    secondaryChallenges,
    suggestedTrack,
    teacherActionSummary: meta.teacherActionSummary,
    recommendedSessionSliceMinutes: meta.sliceMinutes,
    recommendedDailyListeningCount: meta.dailyListening,
    rawAnswers: answers,
    teacherObservationNote: teacherObservationNote?.trim() || undefined,
  };
}

// ============================================================================
// 2. دليل المحفظ الذكي: استراتيجيات التعليم والتجويد والتأسيس (4 مسارات عملية)
// ============================================================================

export interface FoundationStrategyStep {
  id: string;
  stageNumber: number;
  title: string;
  pedagogicalGoal: string;
  teachingSteps: string[];
  shortSurahDrill: string;
  commonMistakeRemedy: string;
}

export const READING_FOUNDATION_STRATEGIES: FoundationStrategyStep[] = [
  {
    id: 'fs-1',
    stageNumber: 1,
    title: '١. الحروف الهجائية مجردة وأشكالها في الكلمة',
    pedagogicalGoal: 'تمييز اسم الحرف وصوته وشكله في أول ووسط وآخر الكلمة دون خلط بين المتشابهات رسماً.',
    teachingSteps: [
      'اربط الحروف المتشابهة رسماً (ب / ت / ث) بعدد النقاط ومكانها بأسلوب بصري مشوق.',
      'افصل في التدريب بين الحروف المفخمة (خص ضغط قظ) والحروف المرققة النظيرة لها (ط/ت، ص/س، ض/د، ظ/ذ).',
    ],
    shortSurahDrill: 'استخراج الحروف المقطعة وحروف سورة الإخلاص والفلق من المصحف.',
    commonMistakeRemedy: 'عند الخلط بين (ج / ح / خ): استخدم إشارة اليد (نقطة في البطن، بلا نقطة، نقطة فوق الرأس).',
  },
  {
    id: 'fs-2',
    stageNumber: 2,
    title: '٢. الحركات القصيرة الثلاث (الفتح، الكسر، الضم)',
    pedagogicalGoal: 'قراءة الحرف المتحرك في زمن حركته الصحيح (حركة واحدة) دون تمطيط يتولد منه حرف مد.',
    teachingSteps: [
      'الفتح = فتح الفم لأعلى (بَ)، الكسر = خفض الفك لأسفل (بِ)، الضم = ضم الشفتين للأمام (بُ).',
      'تدريب القراءة الثلاثية السريعة (خَلَقَ، وُلِدَ، كُتِبَ) بخطف الحركة دون إشباع.',
    ],
    shortSurahDrill: 'تطبيق قراءة الكلمات الثلاثية في سورة المسد وسورة الفلق: ﴿خَلَقَ﴾، ﴿وَجَدَ﴾، ﴿حَسَدَ﴾.',
    commonMistakeRemedy: 'علاج تولّد الألف أو الياء من الحركة: استخدام إشارة القبض السريع باليد لضبط زمن الحركة الواحدة.',
  },
  {
    id: 'fs-3',
    stageNumber: 3,
    title: '٣. المدود الطبيعية الثلاثة (الألف، الواو، الياء)',
    pedagogicalGoal: 'التفريق السمعي والبصري بين زمن الحركة القصيرة (حركة) وزمن حرف المد الطبيعي (حركتان).',
    teachingSteps: [
      'المقارنة السمعية المباشرة بين (قَلَ / قَالَ)، (يَقُلُ / يَقُولُ)، (قِلَ / قِيلَ).',
      'ضبط مقدار الحركتين بفتح إصبعين بهدوء مع تنبيه الطفل لعلامة الألف الخنجرية في الرسم العثماني.',
    ],
    shortSurahDrill: 'تطبيق المد الطبيعي في سورة الناس والكافرون: ﴿إِلَٰهِ ٱلنَّاسِ﴾، ﴿لَآ أَعْبُدُ مَا تَعْبُدُونَ﴾.',
    commonMistakeRemedy: 'إذا أسقط الطفل الألف الخنجرية الصغيرة (مَٰلِكِ): لوّنها له على السبورة وسمّها «الألف القرآنية الواقفة».',
  },
  {
    id: 'fs-4',
    stageNumber: 4,
    title: '٤. السكون ومهارة «التصادم الصوتي»',
    pedagogicalGoal: 'إدراك أن الحرف الساكن لا يُقرأ وحده أبداً، بل يُنطق ملتصقاً بالحرف المتحرك قبله في مقطع واحد.',
    teachingSteps: [
      'شبه الحرف الساكن بـ «الطفل الصغير الذي يمسك بيد أخيه المتحرك قبله» فلا يمشي وحده.',
      'درّب الطفل على قراءة المقطع الساكن دفعة واحدة (أَبْ، قَدْ، لَمْ، نَعْـ) مع بيان همس أو قلقلة الحرف الساكن.',
    ],
    shortSurahDrill: 'تطبيق مقاطع السكون في سورة الإخلاص والعصر والفيل: ﴿لَمْ يَلِدْ وَلَمْ يُولَدْ﴾، ﴿وَٱلْعَصْرِ﴾، ﴿أَلَمْ تَرَ كَيْفَ﴾.',
    commonMistakeRemedy: 'علاج تحريك الساكن (مثل قلقلة اللام في الحَمْد): تثبيت اللسان في مخرج اللام الساكنة ثانية كاملة قبل الانتقال للميم.',
  },
  {
    id: 'fs-5',
    stageNumber: 5,
    title: '٥. التنوين بالفتح والكسر والضم',
    pedagogicalGoal: 'فهم أن التنوين نون ساكنة زائدة تُسمع في الوصل ولا تُكتب، وتُحذف عند الوقف (أو تُبدل ألفاً في الفتح).',
    teachingSteps: [
      'ربط شكل الحركتين المتضاعفتين بصوت الجرس النوني في آخر الكلمة (أَحَدٌ = أَحَدُنْ).',
      'تدريب عملي على الفرق بين وصل الكلمة المنونة والوقف عليها بالسكون أو مد العوض.',
    ],
    shortSurahDrill: 'تطبيق التنوين في سورة الإخلاص والمسد والهمزة: ﴿أَحَدٌ﴾، ﴿لَهَبٍ وَتَبَّ﴾، ﴿هُمَزَةٍ لُّمَزَةٍ﴾.',
    commonMistakeRemedy: 'عند نطق التنوين بالفتح ألفاً في الوصل: ذكّره أن الألف المرسومة بعد تنوين الفتح هي «كرسي الوقف فقط».',
  },
  {
    id: 'fs-6',
    stageNumber: 6,
    title: '٦. الشدة (الحرف المضعّف = ساكن + متحرك)',
    pedagogicalGoal: 'تمكين الطفل من الضغط على مخرج الحرف المشدد وإعطائه زمن حرفين (ساكن يمسك بما قبله + متحرك بحركته).',
    teachingSteps: [
      'فكّك الحرف المشدد بصرياً على السبورة: (رَبِّ = رَبْ + بِ)، (إِنَّ = إِنْ + نَ).',
      'استخدم إشارة الضغط بالقبضة عند النطق بالساكن الأول ثم فتح اليد مع الحركة الثانية.',
    ],
    shortSurahDrill: 'تطبيق الشدة في سورة الناس والمسد والتكاثر: ﴿بِرَبِّ ٱلنَّاسِ﴾، ﴿تَبَّتْ يَدَا﴾، ﴿كَلَّا سَوْفَ﴾.',
    commonMistakeRemedy: 'علاج تخفيف المشدد (قرأ رَبِي بدل رَبِّي): التوقف لحظة لطيفة على المقطع الساكن الأول حتى يسمع الطفل ثقل الحرف.',
  },
];

export interface KidsTajweedSimplifiedRule {
  id: string;
  ruleTitle: string;
  targetLetters: string;
  sensoryStoryMetaphor: string;
  practicalChildHint: string;
  quranExamples: string[];
}

export const KIDS_TAJWEED_SIMPLIFIED: KidsTajweedSimplifiedRule[] = [
  {
    id: 'tj-ghunnah',
    ruleTitle: '١. النون والميم المشددتان (نّ / مّ) — «جرس الرنين الجميل»',
    targetLetters: 'نّ — مّ',
    sensoryStoryMetaphor:
      'النون والميم عليهما قبعة الشدة الذهبية؛ عندما نصل إليهما نُخرج صوت رنين دافئ من الأنف (الخيشوم) بمقدار فتح إصبعين كاملين.',
    practicalChildHint:
      'اجعل الطفل يضع إصبعه برفق بجانب أنفه أثناء نطق (إِنَّ) أو (عَمَّ) ليشعر باهتزاز الغنة بنفسه.',
    quranExamples: ['﴿عَمَّ يَتَسَآءَلُونَ﴾', '﴿إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ﴾', '﴿مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ﴾'],
  },
  {
    id: 'tj-qalqalah',
    ruleTitle: '٢. القلقلة (قُطْبُ جَدٍ) — «الكرة النطاطة»',
    targetLetters: 'ق — ط — ب — ج — د (وهي ساكنة)',
    sensoryStoryMetaphor:
      'حروف (قطب جد) عندما تكون ساكنة تشبه الكرة المطاطية؛ إذا ضغطنا عليها ارتدت بنبرة واضحة رشيقة دون أن نفتح فمنا بحركة.',
    practicalChildHint:
      'مثّل ارتداد الكرة بيدك عند نهاية كل آية في سورة الإخلاص والفلق ليسمع الطفل نبرة القلقلة الصحيحة.',
    quranExamples: ['﴿قُلْ هُوَ ٱللَّهُ أَحَدٌ﴾', '﴿قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ﴾', '﴿وَٱلسَّمَآءِ ذَاتِ ٱلْبُرُوجِ﴾'],
  },
  {
    id: 'tj-madd',
    ruleTitle: '٣. المدود القرآنية — «جسر الصوت الممتد»',
    targetLetters: 'ا — و — ي (وفوقها علامة المدة ٓ )',
    sensoryStoryMetaphor:
      'حرف المد الطبيعي خطوتان، فإذا جاءت فوقه «موجة البحر ٓ » وبعده همزة أو شدة طار الصوت على جسر طويل أربع أو ست خطوات.',
    practicalChildHint:
      'عدّ على أصابع يدك أمام الكاميرا أو في الحلقة (١ - ٢ - ٣ - ٤) أثناء مد كلمة ﴿جَآءَ﴾ أو ﴿ٱلضَّآلِّينَ﴾.',
    quranExamples: ['﴿إِذَا جَآءَ نَصْرُ ٱللَّهِ﴾', '﴿وَٱلسَّمَآءِ وَٱلطَّارِقِ﴾', '﴿وَلَا ٱلضَّآلِّينَ﴾'],
  },
  {
    id: 'tj-noon-sakinah',
    ruleTitle: '٤. أحكام النون الساكنة والتنوين — «المواقف الأربعة للنون»',
    targetLetters: 'نْ / ً ٍ ٌ',
    sensoryStoryMetaphor:
      'النون الساكنة مسافرة لطيفة: عند حروف الحلق تظهر بوضوح (إظهار)، وعند (يرملون) تدخل في الحرف بعدها (إدغام)، وعند الباء تنقلب ميماً (إقلاب)، وعند باقي الحروف تختبئ خلف ستارة الغنة (إخفاء).',
    practicalChildHint:
      'لا تشغل الطفل بحفظ حروف الإخفاء الخمسة عشر نظرياً؛ درّبه سمعياً على تهيئة الفم لمخرج الحرف التالي مع الغنة.',
    quranExamples: ['﴿مِنْ خَوْفٍ﴾ (إظهار)', '﴿مَن يَعْمَلْ﴾ (إدغام)', '﴿مِنۢ بَعْدِ﴾ (إقلاب)', '﴿مِن شَرِّ﴾ (إخفاء)'],
  },
];

export interface LearningChallengeInterventionPlan {
  id: string;
  targetGroupTitle: string;
  challengeKey: PedagogicalChallengeKey;
  symptomsSummary: string;
  inSessionActionPlan: string[];
  homeFollowUpTip: string;
}

export const LEARNING_DIFFICULTIES_PLANS: LearningChallengeInterventionPlan[] = [
  {
    id: 'plan-hyperactive',
    targetGroupTitle: '١. خطة التعامل مع الطفل كثير الحركة / مشتت الانتباه',
    challengeKey: 'attention_hyperactivity',
    symptomsSummary: 'تململ سريع، النظر بعيداً عن المصحف، فقدان موضع الآية، الملل من التسميع الطويل.',
    inSessionActionPlan: [
      'تقسيم الحصة إلى فقرات قصيرة (5 دقائق لكل فقرة: 5 دقائق تسميع تفاعلي + 5 دقائق تلقين نغمي + 5 دقائق مسابقة سريعة).',
      'استخدام «التسميع التفاعلي المتناوب»: يقرأ الشيخ آية ويقرأ الطالب الآية التالية لإبقاء ذهنه متيقظاً.',
      'استخدام التكرار النغمي وإشارات اليد لتمثيل المعاني ومواضع المدود.',
      'تكليف الطفل بمهام قيادية صغيرة في الحلقة (مثل: مؤقت الفقرة، أو اكتشاف موضع الغنة) لتفريغ طاقته إيجابياً.',
    ],
    homeFollowUpTip: 'مراجعة يومية لمدة 10 دقائق فقط في مكان هادئ خالٍ من الشاشات والألعاب مع مكافأة فورية بعد الإنجاز.',
  },
  {
    id: 'plan-slow-memorization',
    targetGroupTitle: '٢. خطة التعامل مع الطالب بطيء الحفظ أو كثير النسيان',
    challengeKey: 'slow_memorization',
    symptomsSummary: 'ينسى الآية الأولى فور الانتقال للآية الثانية، أو يخلط بين خواتيم الآيات والمتشابهات.',
    inSessionActionPlan: [
      'تطبيق طريقة «الربط التراكمي (آية بآية)»: يحفظ الآية (1) 3 مرات ← يحفظ (2) 3 مرات ← يربط (1+2) معاً 3 مرات قبل الانتقال للآية (3).',
      'تقليل مقدار الحفظ الجديد (3 إلى 4 آيات قصيرة متقنة 100% أفضل من 10 آيات غير مستقرة).',
      'ربط الكلمات بمعناها المبسط وقصة السورة حتى تستقر في الذاكرة الدلالية للطفل وليس السمعية فقط.',
      'اشتراط الاستماع القبلي للمقرئ المعلم (الحصري أو المنشاوي) 5 مرات في المنزل قبل دخول الحصة.',
    ],
    homeFollowUpTip: 'تشغيل المقرئ المعلم للمقطع الجديد 10 دقائق قبل النوم يومياً؛ فالذاكرة السمعية تثبت المحفوظ أثناء النوم دون جهد.',
  },
  {
    id: 'plan-weak-pronunciation',
    targetGroupTitle: '٣. خطة التعامل مع ضعيف النطق / التهجئة القرائية',
    challengeKey: 'pronunciation_makharij',
    symptomsSummary: 'إبدال بعض الحروف، صعوبة نطق الكلمات القرآنية الطويلة، أو خطأ متكرر في الحركات والسكون.',
    inSessionActionPlan: [
      'التركيز على «التلقين المشافه البصري»: أن يرى الطالب حركة شفتي المحفظ ومخرج الحرف بوضوح وببطء.',
      'تقسيم الكلمة القرآنية الطويلة إلى مقاطع صوتية قصيرة (مثل: فَسَيَكْفِيكَهُمُ ← فَـ / سَـ / يَكْـ / فِيـ / كَـ / هُمُ) ثم دمجها تدريجياً.',
      'الاكتفاء بتصحيح حرف واحد أو حكم واحد في كل حصة حتى لا يفقد الطفل ثقته بنفسه.',
      'استخدام مختبر التفكيك المقطعي الصوتي في تبويب «منهج الإمام للتأسيس».',
    ],
    homeFollowUpTip: 'التدرب المنزلي المرح أمام المرآة لمدة 3 دقائق على نطق الحرف المستهدف في 3 كلمات قرآنية مع تشجيع الطفل.',
  },
];

// ============================================================================
// 4. الربط الذكي بسجل الأخطاء (teacher-error-marking / SessionEngineView)
// ============================================================================

export interface ErrorPedagogicalCoachingTip {
  errorType: ErrorType | string;
  badgeTitle: string;
  oneLineAdvice: string;
  recommendedStrategyTab: 'foundation' | 'tajweed' | 'challenges';
}

export const ERROR_PEDAGOGICAL_COACHING_MAP: Record<string, ErrorPedagogicalCoachingTip> = {
  تشكيل: {
    errorType: 'تشكيل',
    badgeTitle: '💡 نصيحة تربوية (ضبط الحركات والنطق)',
    oneLineAdvice:
      'قسّم الكلمة إلى مقاطع صوتية قصيرة، واطلب من الطالب تهجئة الحرف مع حركته بتأنٍ قبل وصل الكلمة كاملة.',
    recommendedStrategyTab: 'foundation',
  },
  تجويد: {
    errorType: 'تجويد',
    badgeTitle: '💡 نصيحة تربوية (تثبيت الحكم التجويدي)',
    oneLineAdvice:
      'استخدم المحاكاة السمعية المباشرة وإشارة الأصابع لضبط زمن الغنة أو المد بدلاً من التنبيه النظري المجرد.',
    recommendedStrategyTab: 'tajweed',
  },
  حفظ: {
    errorType: 'حفظ',
    badgeTitle: '💡 نصيحة تربوية (تثبيت الحفظ والذاكرة)',
    oneLineAdvice:
      'طبّق «الربط التراكمي»: أعد ربط هذه الآية بالآية التي قبلها ٣ مرات متتالية مع توضيح معناها الكلي للطالب.',
    recommendedStrategyTab: 'challenges',
  },
  'نسيان آية': {
    errorType: 'نسيان آية',
    badgeTitle: '💡 نصيحة تربوية (ربط أوائل الآيات)',
    oneLineAdvice:
      'اربط آخر كلمة في الآية السابقة بأول كلمة في الآية المنسية كجملة واحدة يكررها الطالب ٥ مرات.',
    recommendedStrategyTab: 'challenges',
  },
  تردد: {
    errorType: 'تردد',
    badgeTitle: '💡 نصيحة تربوية (معالجة التردد وبناء الثقة)',
    oneLineAdvice:
      'امنح الطالب ٣ ثوانٍ صامتة مع ابتسامة مطمئنة ليسترجع الكلمة بنفسه دون استعجال في تلقينه أول حرف.',
    recommendedStrategyTab: 'challenges',
  },
  تلقين: {
    errorType: 'تلقين',
    badgeTitle: '💡 نصيحة تربوية (تقليل الاعتماد على التلقين)',
    oneLineAdvice:
      'استخدم أسلوب التلميح بالمعنى أو الإشارة لمطلع الكلمة بدلاً من نطقها كاملة لتنشيط الاسترجاع الذاتي.',
    recommendedStrategyTab: 'challenges',
  },
};

export function getRepeatedErrorsPedagogicalTips(
  errors: RecitationError[]
): {
  errorType: string;
  count: number;
  sampleWords: string[];
  tip: ErrorPedagogicalCoachingTip;
}[] {
  const grouped: Record<string, { count: number; words: Set<string> }> = {};

  for (const err of errors || []) {
    const key = err.type || 'حفظ';
    if (!grouped[key]) {
      grouped[key] = { count: 0, words: new Set() };
    }
    const increment = err.repeatCount && err.repeatCount > 1 ? err.repeatCount : 1;
    grouped[key].count += increment;
    if (err.word) grouped[key].words.add(err.word);
  }

  return Object.entries(grouped)
    .filter(([, data]) => data.count >= 1)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([errorType, data]) => ({
      errorType,
      count: data.count,
      sampleWords: Array.from(data.words).slice(0, 3),
      tip:
        ERROR_PEDAGOGICAL_COACHING_MAP[errorType] ||
        ERROR_PEDAGOGICAL_COACHING_MAP['حفظ'],
    }));
}

// ============================================================================
// 5. مولّد نصائح الوالدين المختصرة (WhatsApp + بوابة ولي الأمر)
// ============================================================================

export interface SmartFamilyGuidanceTemplate {
  id: string;
  title: string;
  categoryLabel: string;
  challengeMatch?: PedagogicalChallengeKey;
  errorTypeMatch?: ErrorType;
  generateText: (params: {
    studentName: string;
    surahName?: string;
    fromAyah?: number;
    toAyah?: number;
    targetLetterOrWord?: string;
  }) => string;
}

export const SMART_FAMILY_GUIDANCE_TEMPLATES: SmartFamilyGuidanceTemplate[] = [
  {
    id: 'fg_sleep_listening',
    title: '🎧 تشغيل المقرئ المعلم قبل النوم (تثبيت الحفظ السمعي)',
    categoryLabel: 'تثبيت الحفظ السمعي',
    challengeMatch: 'slow_memorization',
    errorTypeMatch: 'حفظ',
    generateText: ({ studentName, surahName = 'النبأ', fromAyah = 1, toAyah = 10 }) =>
      `👨‍👩‍👧 توجيه تربوي للأسرة الكريمة:\nلتثبيت حفظ البطل (${studentName}) بيسر ودون إجهاد، ننصح بتشغيل تلاوة «المصحف المعلم للشيخ الحصري أو المنشاوي» لمقرره في سورة ${surahName} (الآيات ${fromAyah}-${toAyah}) بهدوء لمدة ١٠ دقائق قبل النوم؛ فالاستماع الهادئ قبل النوم يرسخ الآيات في الذاكرة طويلة المدى تلقائياً.`,
  },
  {
    id: 'fg_encourage_hesitant',
    title: '🌱 تشجيع الطفل المتردد دون ضغط نفسي',
    categoryLabel: 'بناء الثقة والطلاقة',
    challengeMatch: 'balanced_typical',
    errorTypeMatch: 'تردد',
    generateText: ({ studentName, surahName = 'النبأ' }) =>
      `👨‍👩‍👧 توجيه تربوي للأسرة الكريمة:\nأدى الابن (${studentName}) جهداً طيباً اليوم في سورة ${surahName}. عند التسميع له في المنزل، نرجو منحه مهلة هادئة (٥ ثوانٍ) إذا توقف في آية مع الابتسام والثناء على محاولته دون استعجاله؛ فالأمان النفسي والتشجيع يزيلان التردد ويطلقان اللسان بثقة.`,
  },
  {
    id: 'fg_pronunciation_drill',
    title: '🗣️ تمرين منزلي لطيف لنطق الحروف والتشكيل',
    categoryLabel: 'تحسين النطق والتهجئة',
    challengeMatch: 'pronunciation_makharij',
    errorTypeMatch: 'تشكيل',
    generateText: ({ studentName, surahName = 'النبأ', targetLetterOrWord }) =>
      `👨‍👩‍👧 توجيه تربوي للأسرة الكريمة:\nنركز هذا الأسبوع مع البطل (${studentName}) على إتقان نطق ${
        targetLetterOrWord ? `كلمة/حرف «${targetLetterOrWord}»` : `مخارج الحروف والحركات في سورة ${surahName}`
      }. نرجو تدريبه لمدة ٣ دقائق يومياً على قراءة الكلمة مقطعةً ببطء ثم وصلها، مع الاستماع لنطق الشيخ وتقليده كمسابقة صوتية ممتعة.`,
  },
  {
    id: 'fg_short_10min_focused',
    title: '⏱️ خطة مراجعة 10 دقائق يومياً للطفل كثير الحركة/المشتت',
    categoryLabel: 'رفع التركيز والانتباه',
    challengeMatch: 'attention_hyperactivity',
    errorTypeMatch: 'نسيان آية',
    generateText: ({ studentName, surahName = 'النبأ', fromAyah = 1, toAyah = 8 }) =>
      `👨‍👩‍👧 توجيه تربوي للأسرة الكريمة:\nلتحقيق أعلى تركيز للبطل (${studentName})، ننصح بتقسيم ورد المراجعة في سورة ${surahName} (${fromAyah}-${toAyah}) إلى جلستين قصيرتين (٥ دقائق صباحاً و٥ دقائق مساءً) في مكان هادئ بعيداً عن الشاشات، مع التناوب معه (تقرؤون آية ويقرأ آية) لتحويل المراجعة لنشاط تفاعلي محبب.`,
  },
  {
    id: 'fg_reading_foundation',
    title: '📖 تقوية التأسيس القرائي (الحركات والسكون والشدة)',
    categoryLabel: 'التأسيس القرائي',
    challengeMatch: 'weak_reading_foundation',
    errorTypeMatch: 'تلقين',
    generateText: ({ studentName, surahName = 'النبأ' }) =>
      `👨‍👩‍👧 توجيه تربوي للأسرة الكريمة:\nنسير مع البطل (${studentName}) في تقوية مهارة القراءة المباشرة من المصحف في سورة ${surahName}. نرجو عند المراجعة المنزلية أن يضع إصبعه تحت الكلمة التي يقرؤها وينطق الحرف الساكن أو المشدد مع الحرف الذي قبله، فربط العين بالإصبع والصوت يضاعف سرعة طلاقته القرائية.`,
  },
];

export function generateRecommendedFamilyGuidance(params: {
  student: Student;
  errors?: RecitationError[];
  surahName?: string;
  fromAyah?: number;
  toAyah?: number;
}): {
  template: SmartFamilyGuidanceTemplate;
  generatedText: string;
} {
  const { student, errors = [], surahName, fromAyah, toAyah } = params;
  const effectiveSurah = surahName || student.currentStop?.surahName || 'النبأ';
  const effectiveFrom = fromAyah || student.currentStop?.ayah || 1;
  const effectiveTo = toAyah || effectiveFrom + 5;

  // Check if student has a pedagogical profile first
  const profileChallenge = student.pedagogicalProfile?.primaryChallengeKey;

  // Or check dominant session error
  const firstErrorWithWord = errors.find((e) => e.word || e.letter);
  const targetWord = firstErrorWithWord?.word || firstErrorWithWord?.letter;

  let chosenTemplate = SMART_FAMILY_GUIDANCE_TEMPLATES[0];

  if (errors.some((e) => e.type === 'تشكيل' || e.category === 'حروف')) {
    chosenTemplate =
      SMART_FAMILY_GUIDANCE_TEMPLATES.find((t) => t.id === 'fg_pronunciation_drill') ||
      SMART_FAMILY_GUIDANCE_TEMPLATES[0];
  } else if (errors.some((e) => e.type === 'تردد')) {
    chosenTemplate =
      SMART_FAMILY_GUIDANCE_TEMPLATES.find((t) => t.id === 'fg_encourage_hesitant') ||
      SMART_FAMILY_GUIDANCE_TEMPLATES[0];
  } else if (profileChallenge) {
    const byChallenge = SMART_FAMILY_GUIDANCE_TEMPLATES.find(
      (t) => t.challengeMatch === profileChallenge
    );
    if (byChallenge) chosenTemplate = byChallenge;
  }

  return {
    template: chosenTemplate,
    generatedText: chosenTemplate.generateText({
      studentName: student.name,
      surahName: effectiveSurah,
      fromAyah: effectiveFrom,
      toAyah: effectiveTo,
      targetLetterOrWord: targetWord,
    }),
  };
}

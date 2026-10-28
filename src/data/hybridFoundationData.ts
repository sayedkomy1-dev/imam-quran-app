import { FoundationLevelNumber } from '../types';

export const OFFICIAL_ACADEMY_WHATSAPP = '201068631966';
export const OFFICIAL_ACADEMY_WHATSAPP_URL = 'https://wa.me/201068631966';

export interface SyllableUnit {
  text: string;
  type: 'harakah' | 'sukun_pair' | 'madd_pair' | 'shaddah' | 'ghunnah' | 'qalqalah';
  color: string;
  ruleLabel: string;
}

export interface HybridFoundationWord {
  id: string;
  word: string;
  meaning: string;
  meaningOrContext: string;
  surahRef?: string;
  syllables: SyllableUnit[];
  tahajjiSteps: string[];
  durationBeats: number; // 1, 2, 4, or 6 beats
  phoneticTip: string;
  phoneticHint: string;
}

export type FoundationWordCard = HybridFoundationWord;

export interface FoundationExamQuestion {
  id: string;
  question: string;
  prompt: string;
  targetWord: string;
  word: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FoundationVisualPair {
  groupTitle: string;
  items: string[];
  distinctionTip: string;
  tip: string;
}

export interface HybridFoundationLevel {
  level: FoundationLevelNumber;
  levelNumber: FoundationLevelNumber;
  title: string;
  shortTitle: string;
  subtitle: string;
  methodologyBadge: string;
  methodologyTag: string;
  color: string;
  badgeColor: string;
  objective: string;
  objectives: string[];
  keyRules: string[];
  visualPairs: FoundationVisualPair[];
  words: HybridFoundationWord[];
  syllableCards: HybridFoundationWord[];
  examQuestions: FoundationExamQuestion[];
}

export interface SpeechDefectRemedy {
  id: string;
  letter: string;
  targetLetters: string;
  makhrajRegion: string;
  defectTitle: string;
  title: string;
  commonMistake: string;
  commonError: string;
  practicalExercise: string;
  practicalRemedy: string;
  quranicDrillWords: string[];
  drillWords: string[];
}

export interface MatnChapter {
  id: string;
  chapterTitle: string;
  explanation: string;
  verses: {
    firstHemistich: string;
    secondHemistich: string;
  }[];
}

export interface MatnWork {
  id: string;
  title: string;
  author: string;
  chapters: MatnChapter[];
}

function makeWord(item: {
  id: string;
  word: string;
  meaning: string;
  surahRef?: string;
  syllables: SyllableUnit[];
  tahajjiSteps: string[];
  durationBeats: number;
  phoneticTip: string;
}): HybridFoundationWord {
  return {
    ...item,
    meaningOrContext: item.meaning,
    phoneticHint: item.phoneticTip,
  };
}

function makeQuestion(item: {
  id: string;
  prompt: string;
  word: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}): FoundationExamQuestion {
  return {
    ...item,
    question: item.prompt,
    targetWord: item.word,
  };
}

function makePair(item: {
  groupTitle: string;
  items: string[];
  tip: string;
}): FoundationVisualPair {
  return {
    ...item,
    distinctionTip: item.tip,
  };
}

function makeLevel(item: {
  level: FoundationLevelNumber;
  title: string;
  shortTitle: string;
  subtitle: string;
  methodologyTag: string;
  badgeColor: string;
  objective: string;
  keyRules: string[];
  visualPairs: FoundationVisualPair[];
  words: HybridFoundationWord[];
  examQuestions: FoundationExamQuestion[];
}): HybridFoundationLevel {
  return {
    ...item,
    levelNumber: item.level,
    methodologyBadge: item.methodologyTag,
    color: item.badgeColor,
    objectives: item.keyRules,
    syllableCards: item.words,
  };
}

export const HYBRID_FOUNDATION_LEVELS: HybridFoundationLevel[] = [
  makeLevel({
    level: 1,
    title: 'المستوى 1: الحروف الهجائية مجردة والمتشابهات رسماً ونطقاً',
    shortTitle: 'الحروف الهجائية والمتشابهات',
    subtitle: 'تعرف اسم الحرف وشكله في أول ووسط وآخر الكلمة مع التمييز البصري والصوتي',
    methodologyTag: 'القاعدة النورانية + نور البيان البصري',
    badgeColor: '#145a3a',
    objective:
      'نطق أسماء الحروف الهجائية (ألف، با، تا، ثا...) نطقاً عربياً فصيحاً وتمييز المتشابهات رسماً ونطقاً.',
    keyRules: [
      'نطق أسماء الحروف الهجائية (ألف، با، تا، ثا...) نطقاً عربياً فصيحاً بدون إمالة.',
      'تمييز أشكال الحرف المقطوع والموصول في أول ووسط وآخر الكلمة.',
      'التفريق البصري بين الحروف المتشابهة رسماً (ب / ت / ث) و(ج / ح / خ) و(د / ذ).',
      'التفريق الصوتي الدقيق بين الحروف المتقاربة مخرجاً (ذ / ز / ظ)، (س / ص)، (ت / ط)، (ق / ك).',
    ],
    visualPairs: [
      makePair({
        groupTitle: 'المتشابهة رسماً (النقاط)',
        items: ['ب (نقطة تحت)', 'ت (نقطتان فوق)', 'ث (ثلاث نقاط فوق)', 'ن (نقطة فوق)'],
        tip: 'الباء نقطتها في الأسفل كالقارب، والتاء نقطتان كالعينين، والثاء ثلاث نقاط مع إخراج طرف اللسان.',
      }),
      makePair({
        groupTitle: 'الحروف اللثوية الثلاثة',
        items: ['ث (مرقق مهموس)', 'ذ (مرقق مجهور)', 'ظ (مفخم مطبق)'],
        tip: 'جميعها تخرج من طرف اللسان مع أطراف الثنايا العليا؛ احذر قلب الذال زاياً أو الظاء زايًا مفخمة.',
      }),
      makePair({
        groupTitle: 'الترقيق والتفخيم المتقابل',
        items: ['س ↔ ص', 'ت ↔ ط', 'د ↔ ض', 'ك ↔ ق'],
        tip: 'الحرف الأول مرقق (ابتسامة صوتية) والثاني مفخم مستعلٍ يملأ الفم بصدى الصوت.',
      }),
    ],
    words: [
      makeWord({
        id: 'lvl1-w1',
        word: 'أ ب ت ث',
        meaning: 'فصل الحروف بالنقاط ومخرج الثاء اللثوي',
        surahRef: 'الدرس الأول - النورانية',
        syllables: [
          { text: 'أَلِفْ', type: 'harakah', color: '#145a3a', ruleLabel: 'اسم الحرف' },
          { text: 'بَا', type: 'madd_pair', color: '#2563eb', ruleLabel: 'شفوي' },
          { text: 'تَا', type: 'madd_pair', color: '#059669', ruleLabel: 'نطعي' },
          { text: 'ثَا', type: 'madd_pair', color: '#d97706', ruleLabel: 'لثوي' },
        ],
        tahajjiSteps: [
          'همزة ألف (أَلِفْ)',
          'با ألف مد طبيعي حركتان (بَا)',
          'تا ألف مد طبيعي حركتان (تَا)',
          'ثا لثوية بطرف اللسان (ثَا)',
        ],
        durationBeats: 2,
        phoneticTip: 'تجنب ختم (با، تا، ثا) بهمزة؛ فلا تقل (باءْ) عند التهجي النوراني بل (بَا).',
      }),
      makeWord({
        id: 'lvl1-w2',
        word: 'ذَٰلِكَ — زَلْزَلَة — ظَلَمُوا',
        meaning: 'التمييز الصوتي بين (ذ / ز / ظ)',
        surahRef: 'البقرة: 2 / الزلزلة: 1',
        syllables: [
          { text: 'ذَا', type: 'madd_pair', color: '#059669', ruleLabel: 'ذال لثوية مرققة' },
          { text: 'زَلْ', type: 'sukun_pair', color: '#2563eb', ruleLabel: 'زاي صفيرية' },
          { text: 'ظَ', type: 'harakah', color: '#dc2626', ruleLabel: 'ظاء لثوية مفخمة' },
        ],
        tahajjiSteps: [
          'ذال فتحة ألف صغيرة (ذَا) بطرف اللسان مع الترقيق',
          'زاي فتحة لام سكون (زَلْ) من طرف اللسان مع الصفير بدون إخراج اللسان',
          'ظاء فتحة (ظَ) بطرف اللسان مع استعلاء أقصى اللسان وإطباق',
        ],
        durationBeats: 2,
        phoneticTip: 'الذال والظاء يخرج فيهما طرف اللسان يسيراً، أما الزاي فخلف الأسنان السفلى مع صفير.',
      }),
      makeWord({
        id: 'lvl1-w3',
        word: 'قُلْ — كُلُّ',
        meaning: 'التفريق بين القاف المفخمة والكاف المرققة',
        surahRef: 'الإخلاص: 1',
        syllables: [
          { text: 'قُلْ', type: 'sukun_pair', color: '#dc2626', ruleLabel: 'قاف أقصى اللسان مفخمة' },
          { text: 'كُلْ', type: 'sukun_pair', color: '#145a3a', ruleLabel: 'كاف مرققة مهموسة' },
          { text: 'لُ', type: 'harakah', color: '#2563eb', ruleLabel: 'لام مضمومة' },
        ],
        tahajjiSteps: [
          'قاف ضمة لام سكون (قُلْ) من أقصى اللسان مع الحنك اللحمي',
          'كاف ضمة لام شدة (كُلْ) أسفل مخرج القاف قليلاً مع الترقيق',
          'لام ضمة (لُ) -> كُلُّ',
        ],
        durationBeats: 1,
        phoneticTip: 'انتبه في ﴿قُلْ هُوَ اللَّهُ أَحَدٌ﴾ من نطق القاف كافاً أو الكاف قافاً.',
      }),
    ],
    examQuestions: [
      makeQuestion({
        id: 'q1-1',
        prompt: 'أي مجموعة من الحروف التالية هي (الحروف اللثوية) التي يخرج فيها طرف اللسان؟',
        word: 'ث - ذ - ظ',
        options: ['ث - ذ - ظ', 'س - ز - ص', 'ج - ش - ي', 'ق - ك - خ'],
        correctIndex: 0,
        explanation: 'الحروف اللثوية الثلاثة هي (الثاء، الذال، الظاء) وتخرج من طرف اللسان مع أطراف الثنايا العليا.',
      }),
      makeQuestion({
        id: 'q1-2',
        prompt: 'كيف نميز نطق حرف (الطَّاء) عن حرف (التَّاء) في التلاوة؟',
        word: 'ط / ت',
        options: [
          'الطاء مفخمة مطبقة ومجهورة، والتاء مرققة مهموسة',
          'التاء مفخمة والطاء مرققة',
          'لا فرق بينهما في المخرج والصفات',
          'الطاء تخرج من الحلق والتاء من الشفتين',
        ],
        correctIndex: 0,
        explanation: 'الطاء والتاء من مخرج واحد (طرف اللسان مع أصول الثنايا العليا) وتنفرد الطاء بالتفخيم والإطباق والقلقلة.',
      }),
    ],
  }),
  makeLevel({
    level: 2,
    title: 'المستوى 2: الحركات القصيرة الثلاث وميزان زمن الحركة',
    shortTitle: 'الحركات القصيرة ( َ ِ ُ )',
    subtitle: 'الفتحة والكسرة والضمة وقراءة الكلمات الثلاثية المتحركة دون تمطيط (توليد مد)',
    methodologyTag: 'القاعدة البغدادية + نور البيان',
    badgeColor: '#047857',
    objective:
      'ضبط زمن الحركة الواحدة (مقدار قبض الإصبع أو بسطه) دون تطويل يولد حرف مد أو خطف يختلس الحركة.',
    keyRules: [
      'الفتحة (ـَ) بفتح الفم فتحاً معتدلاً عمودياً دون إمالة.',
      'الكسرة (ـِ) بخفض الفك السفلي تماماً دون تمطيط يتولد منه ياء.',
      'الضمة (ـُ) بضم الشفتين إلى الأمام ضماً محكماً دون توليد واو.',
      'التركيب التدريجي البغدادي: حرف أول + حرف ثانٍ = مقطع ثنائي، ثم ضم الحرف الثالث.',
    ],
    visualPairs: [
      makePair({
        groupTitle: 'ميزان الحركات الثلاث',
        items: ['بَ (فتح الفم)', 'بِ (خفض الفك)', 'بُ (ضم الشفتين)'],
        tip: 'زمن الحركة القصيرة = حركة واحدة فقط؛ إشباع الفتحة يولد ألفاً وإشباع الكسرة يولد ياءً.',
      }),
      makePair({
        groupTitle: 'التجميع التدريجي للكلمة الثلاثية',
        items: ['كَ', 'كَتَ', 'كَتَبَ'],
        tip: 'اقرأ الحرف الأول فالثاني معاً (كَتَ) ثم أضف الثالث (كَتَبَ) بلا سكت بين الحروف.',
      }),
    ],
    words: [
      makeWord({
        id: 'lvl2-w1',
        word: 'خَلَقَ',
        meaning: 'أوجد وأبدع (تركيب مفخم فمرقق فمفخم)',
        surahRef: 'العلق: 1',
        syllables: [
          { text: 'خَ', type: 'harakah', color: '#dc2626', ruleLabel: 'مفخم مفتوح (1)' },
          { text: 'لَ', type: 'harakah', color: '#145a3a', ruleLabel: 'مرقق مفتوح (1)' },
          { text: 'قَ', type: 'harakah', color: '#dc2626', ruleLabel: 'مفخم مفتوح (1)' },
        ],
        tahajjiSteps: [
          'خا فتحة (خَ)',
          'لام فتحة (لَ) -> خَلَ (احذر تفخيم اللام بين الخاء والقاف)',
          'قاف فتحة (قَ) -> خَلَقَ',
        ],
        durationBeats: 1,
        phoneticTip: 'وقع حرف اللام المرقق بين حرفين مفخمين (خ، ق)؛ فاحذر أن تقول (خَلَّقَ) بتفخيم اللام.',
      }),
      makeWord({
        id: 'lvl2-w2',
        word: 'حَمِدَ',
        meaning: 'شكر وأثنى (التنقل من الفتح للكسر للفتح)',
        surahRef: 'تدريب نور البيان',
        syllables: [
          { text: 'حَ', type: 'harakah', color: '#145a3a', ruleLabel: 'فتحة (1)' },
          { text: 'مِ', type: 'harakah', color: '#2563eb', ruleLabel: 'كسرة محققة (1)' },
          { text: 'دَ', type: 'harakah', color: '#145a3a', ruleLabel: 'فتحة (1)' },
        ],
        tahajjiSteps: [
          'حا فتحة (حَ)',
          'ميم كسرة (مِ) -> حَمِ',
          'دال فتحة (دَ) -> حَمِدَ',
        ],
        durationBeats: 1,
        phoneticTip: 'أحكم كسرة الميم (مِ) دون أن تطيلها فتصير (حَمِيدَ).',
      }),
      makeWord({
        id: 'lvl2-w3',
        word: 'رُسُلُ',
        meaning: 'جمع رسول (توالي الضمات دون اختلاس)',
        surahRef: 'آل عمران: 144',
        syllables: [
          { text: 'رُ', type: 'harakah', color: '#dc2626', ruleLabel: 'ضم مفخم (1)' },
          { text: 'سُ', type: 'harakah', color: '#059669', ruleLabel: 'ضم مرقق (1)' },
          { text: 'لُ', type: 'harakah', color: '#059669', ruleLabel: 'ضم مرقق (1)' },
        ],
        tahajjiSteps: [
          'را ضمة (رُ)',
          'سين ضمة (سُ) -> رُسُ',
          'لام ضمة (لُ) -> رُسُلُ',
        ],
        durationBeats: 1,
        phoneticTip: 'عند توالي الضمات أبقِ الشفتين مضمومتين حتى انتهاء الحرف الثالث ولا تسكّن السين.',
      }),
    ],
    examQuestions: [
      makeQuestion({
        id: 'q2-1',
        prompt: 'ماذا يحدث إذا أطال القارئ زمن الفتحة في كلمة ﴿كَتَبَ﴾؟',
        word: 'كَتَبَ',
        options: [
          'يتولد منها حرف مد بالألف فيتغير المبنى والمعنى (كاتب / كتاب)',
          'تصبح القراءة أخشع وأصح',
          'تتحول الفتحة إلى ضمة',
          'لا يتأثر الوزن الصوتي للكلمة',
        ],
        correctIndex: 0,
        explanation: 'إشباع الحركة القصيرة خطأ جلي يُسمى (التمطيط) لأنه يولد حرف مد زائد في القرآن.',
      }),
    ],
  }),
  makeLevel({
    level: 3,
    title: 'المستوى 3: المدود الثلاثة وحروف اللين وميزان طول المد (2 / 4 / 6)',
    shortTitle: 'المدود الثلاثة واللين',
    subtitle: 'مد الألف والواو والياء الطبيعية والفرعية، وحرفا اللين (الواو والياء الساكنتان بعد فتح)',
    methodologyTag: 'التلقين الصوتي البصري + ميزان المدود',
    badgeColor: '#2563eb',
    objective:
      'قراءة حرف المد مع الحرف الممدود قبله كمقطع صوتي واحد بمقدار حركتين (الطبيعي) أو 4-5 (المتصل/المنفصل) أو 6 (اللازم).',
    keyRules: [
      'الألف المدية ساكنة دائماً وما قبلها مفتوح (قَالَ).',
      'الواو المدية ساكنة وما قبلها مضموم (يَقُولُ)، والياء المدية ساكنة وما قبلها مكسور (قِيلَ).',
      'حرفا اللين: الواو والياء الساكنتان المفتوح ما قبلهما مثل ﴿خَوْفٍ﴾ و﴿قُرَيْشٍ﴾.',
      'ميزان المد البصري: المد الطبيعي = حركتان (2)، المتصل/المنفصل = 4-5 حركات، اللازم = 6 حركات.',
    ],
    visualPairs: [
      makePair({
        groupTitle: 'حروف المد الثلاثة في كلمة واحدة',
        items: ['نُو (مد واو - 2)', 'حِي (مد ياء - 2)', 'هَا (مد ألف - 2)'],
        tip: 'كلمة ﴿نُوحِيهَا﴾ جمعت المدود الطبيعية الثلاثة: ضم فواو، كسر فياء، فتح فألف.',
      }),
      makePair({
        groupTitle: 'الفرق بين مد الياء وياء اللين',
        items: ['فِي (ياء مدية قبلها كسر)', 'قُرَيْشٍ (ياء لين ساكنة قبلها فتح)'],
        tip: 'ياء المد عليها خلو من الحركة وقبلها كسرة، أما ياء اللين فعليها رأس حاء السكون وقبلها فتحة.',
      }),
    ],
    words: [
      makeWord({
        id: 'lvl3-w1',
        word: 'نُوحِيهَا',
        meaning: 'نرسلها وحياً (جمعت المدود الثلاثة)',
        surahRef: 'هود: 49',
        syllables: [
          { text: 'نُو', type: 'madd_pair', color: '#2563eb', ruleLabel: 'مد طبيعي بالواو (2)' },
          { text: 'حِي', type: 'madd_pair', color: '#059669', ruleLabel: 'مد طبيعي بالياء (2)' },
          { text: 'هَا', type: 'madd_pair', color: '#d97706', ruleLabel: 'مد طبيعي بالألف (2)' },
        ],
        tahajjiSteps: [
          'نون ضمة واو مد طبيعي حركتان (نُو)',
          'حا كسرة يا مد طبيعي حركتان (حِي) -> نُوحِي',
          'ها فتحة ألف مد طبيعي حركتان (هَا) -> نُوحِيهَا',
        ],
        durationBeats: 2,
        phoneticTip: 'حافظ على تساوي أزمنة المدود الثلاثة (2 : 2 : 2) في نُوحِيهَا.',
      }),
      makeWord({
        id: 'lvl3-w2',
        word: 'جَآءَ',
        meaning: 'حضر (مد واجب متصل 4-5 حركات)',
        surahRef: 'النصر: 1',
        syllables: [
          { text: 'جَآ', type: 'madd_pair', color: '#dc2626', ruleLabel: 'مد واجب متصل (4 حركات)' },
          { text: 'ءَ', type: 'harakah', color: '#145a3a', ruleLabel: 'همزة مفتوحة (1)' },
        ],
        tahajjiSteps: [
          'جيم فتحة ألف مد متصل واجب أربع حركات (جَآ)',
          'همزة فتحة (ءَ) -> جَآءَ',
        ],
        durationBeats: 4,
        phoneticTip: 'وجود علامة المدة (~) فوق الألف وبعدها همزة في نفس الكلمة يوجب المد 4 أو 5 حركات.',
      }),
      makeWord({
        id: 'lvl3-w3',
        word: 'ٱلصَّآخَّةُ',
        meaning: 'صيحة يوم القيامة (مد لازم كلمي مثقل 6 حركات)',
        surahRef: 'عبس: 33',
        syllables: [
          { text: 'ٱلصْ', type: 'shaddah', color: '#7c3aed', ruleLabel: 'لام شمسية مدغمة' },
          { text: 'صَآخْ', type: 'madd_pair', color: '#dc2626', ruleLabel: 'مد لازم 6 حركات' },
          { text: 'خَ', type: 'harakah', color: '#145a3a', ruleLabel: 'خاء مفتوحة' },
          { text: 'ةُ', type: 'harakah', color: '#2563eb', ruleLabel: 'تاء مربوطة' },
        ],
        tahajjiSteps: [
          'همزة وصل تسقط وصلاً، لام شمسية مدغمة في الصاد المشددة',
          'صاد فتحة ألف مد لازم كلمي مثقل ست حركات (صَآخْ)',
          'خا فتحة تاء ضمة -> ٱلصَّآخَّةُ',
        ],
        durationBeats: 6,
        phoneticTip: 'المد اللازم الكلمي المثقل يمد 6 حركات لزوماً لأن بعد حرف المد حرفاً مشدداً.',
      }),
    ],
    examQuestions: [
      makeQuestion({
        id: 'q3-1',
        prompt: 'كم حركة يُمد المد اللازم الكلمي المثقل في كلمة ﴿ٱلْحَآقَّةُ﴾؟',
        word: 'ٱلْحَآقَّةُ',
        options: ['6 حركات لزوماً', 'حركتان فقط', '4 حركات جوازاً', 'حركة واحدة'],
        correctIndex: 0,
        explanation: 'اجتمع حرف المد وبعده حرف مشدد في كلمة واحدة فيسمى مداً لازماً كلمياً مثقلاً ويمد 6 حركات.',
      }),
    ],
  }),
  makeLevel({
    level: 4,
    title: 'المستوى 4: السكون والقلقلة (قطب جد) والهمزات',
    shortTitle: 'السكون والقلقلة',
    subtitle: 'نطق الحرف الساكن مع المتحرك قبله في دفعة صوتية واحدة وتطبيق قلقلة (ق ط ب ج د)',
    methodologyTag: 'نور البيان + المختبر الصوتي التطبيقي',
    badgeColor: '#7c3aed',
    objective:
      'وعي القاعدة الذهبية: الحرف الساكن لا يُقرأ وحده أبداً، بل يُقرأ مدمجاً مع الحرف المتحرك الذي قبله.',
    keyRules: [
      'علامة السكون في رسم المصحف هي رأس الحاء الصغيرة (ـۡ) وتعني إظهار الحرف الساكن بوضوح.',
      'الحرف الساكن يُقرأ مع المتحرك قبله كمقطع صوتي واحد.',
      'حروف القلقلة الخمسة مجموعة في (قُطْبُ جَدٍّ): إذا سكنت نُطقت باضطراب ونبرة واضحة دون ميل لأي حركة.',
      'الهمزة الساكنة (يَأْمُرُ / يُؤْمِنُونَ / إِئْذَن) تُحقق من أقصى الحلق بلا قلقلة ولا تسهيل.',
    ],
    visualPairs: [
      makePair({
        groupTitle: 'حروف القلقلة الخمسة (قُطْبُ جَدٍّ)',
        items: ['قْ (يَقْطَعُ)', 'طْ (أَطْعَمَهُم)', 'بْ (أَبْوَاباً)', 'جْ (يَجْعَلْ)', 'دْ (قَدْ أَفْلَحَ)'],
        tip: 'تخرج القلقلة بالتصادم ثم التباعد السريع بين طرفي عضو النطق دون فتح أو ضم أو كسر.',
      }),
      makePair({
        groupTitle: 'الفرق بين قلقلة الدال وسكون الهمزة',
        items: ['أَحَدْ (قلقلة واضحة)', 'يُؤْمِنُونَ (همزة ساكنة بلا قلقلة)'],
        tip: 'احذر قلقلة الهمزة الساكنة في (يؤمنون / بئس / يأكلون).',
      }),
    ],
    words: [
      makeWord({
        id: 'lvl4-w1',
        word: 'يَجْعَلْ',
        meaning: 'يصير (قلقلة الجيم الساكنة وسط الكلمة)',
        surahRef: 'الطلاق: 2',
        syllables: [
          { text: 'يَجْ', type: 'qalqalah', color: '#2563eb', ruleLabel: 'مقطع ساكن + قلقلة صغرى' },
          { text: 'عَلْ', type: 'sukun_pair', color: '#145a3a', ruleLabel: 'مقطع ساكن متوسط' },
        ],
        tahajjiSteps: [
          'يا فتحة جيم سكون ومقلقلة (يَجْ)',
          'عين فتحة لام سكون (عَلْ) -> يَجْعَلْ',
        ],
        durationBeats: 1,
        phoneticTip: 'اقرأ (يَجْ) بقلقلة الجيم اللطيفة في درج الكلام، وأظهر سكون اللام في (عَلْ).',
      }),
      makeWord({
        id: 'lvl4-w2',
        word: 'أَطْعَمَهُم',
        meaning: 'رزقهم الطعام (قلقلة الطاء المفخمة)',
        surahRef: 'قريش: 4',
        syllables: [
          { text: 'أَطْ', type: 'qalqalah', color: '#dc2626', ruleLabel: 'همزة + طاء مقلقلة مفخمة' },
          { text: 'عَ', type: 'harakah', color: '#145a3a', ruleLabel: 'عين مفتوحة' },
          { text: 'مَ', type: 'harakah', color: '#145a3a', ruleLabel: 'ميم مفتوحة' },
          { text: 'هُمْ', type: 'sukun_pair', color: '#2563eb', ruleLabel: 'هاء + ميم مظهرة' },
        ],
        tahajjiSteps: [
          'همزة فتحة طا سكون ومقلقلة (أَطْ)',
          'عين فتحة (عَ) ميم فتحة (مَ) -> أَطْعَمَ',
          'ها ضمة ميم سكون (هُمْ) -> أَطْعَمَهُم',
        ],
        durationBeats: 1,
        phoneticTip: 'الطاء في (أَطْ) تجمع القلقلة والتفخيم والإطباق، فلا تقلقلها مرققة كالتاء.',
      }),
      makeWord({
        id: 'lvl4-w3',
        word: 'يُؤْمِنُونَ',
        meaning: 'يصدقون (تحقيق الهمزة الساكنة)',
        surahRef: 'البقرة: 3',
        syllables: [
          { text: 'يُؤْ', type: 'sukun_pair', color: '#7c3aed', ruleLabel: 'همزة ساكنة محققة' },
          { text: 'مِ', type: 'harakah', color: '#145a3a', ruleLabel: 'ميم مكسورة' },
          { text: 'نُو', type: 'madd_pair', color: '#2563eb', ruleLabel: 'مد طبيعي بالواو (2)' },
          { text: 'نَ', type: 'harakah', color: '#145a3a', ruleLabel: 'نون مفتوحة' },
        ],
        tahajjiSteps: [
          'يا ضمة همزة سكون (يُؤْ) بدون قلقلة',
          'ميم كسرة (مِ) -> يُؤْمِ',
          'نون ضمة واو مد طبيعي (نُو) نون فتحة (نَ) -> يُؤْمِنُونَ',
        ],
        durationBeats: 2,
        phoneticTip: 'أمسك مخرج الهمزة في (يُؤْ) بهدوء دون نبرة زائدة أو قلقلة.',
      }),
    ],
    examQuestions: [
      makeQuestion({
        id: 'q4-1',
        prompt: 'ما هي حروف القلقلة الخمسة إذا جاءت ساكنة؟',
        word: 'قُطْبُ جَدٍّ',
        options: ['ق - ط - ب - ج - د', 'ي - ر - م - ل - و - ن', 'ء - هـ - ع - ح - غ - خ', 'ص - ض - ط - ظ'],
        correctIndex: 0,
        explanation: 'حروف القلقلة الخمسة جمعها العلماء في قولهم (قُطْبُ جَدٍّ).',
      }),
    ],
  }),
  makeLevel({
    level: 5,
    title: 'المستوى 5: التنوين الثلاثي والفرق بين النون الساكنة والتنوين',
    shortTitle: 'التنوين الثلاثي ( ً ٍ ٌ )',
    subtitle: 'التنوين بالفتح والكسر والضم، وأحكام الوقف على التنوين بالفتح (مد العوض)',
    methodologyTag: 'القاعدة النورانية + الرسم العثماني',
    badgeColor: '#d97706',
    objective:
      'إدراك أن التنوين نون ساكنة زائدة تلحق آخر الاسم لفظاً وتفارقه خطاً ووقفاً.',
    keyRules: [
      'التنوين نون ساكنة زائدة تلحق آخر الاسم لفظاً وتفارقه خطاً ووقفاً.',
      'في الرسم العثماني: التراكب المتساوي للحركتين يدل على الإظهار، والتتابع المتزحزح يدل على الإدغام أو الإخفاء.',
      'عند الوقف على التنوين بالفتح (ما عدا التاء المربوطة) نبدله ألفاً مدية بمقدار حركتين (مد عوض) مثل: ﴿عَلِيمًا﴾ -> (عَلِيمَا).',
      'عند الوقف على التاء المربوطة المنونة نقف عليها بالهاء الساكنة مثل: ﴿رَحْمَةً﴾ -> (رَحْمَهْ).',
    ],
    visualPairs: [
      makePair({
        groupTitle: 'علامة التنوين في المصحف الشريف',
        items: ['ـً / ـٍ / ـٌ (متراكب = إظهار)', 'ـً / ـٍ / ـٌ (متتابع = إدغام أو إخفاء)', 'ـمـ (إقلاب ميماً)'],
        tip: 'رسم المصحف يرشدك للحكم التجويدي بمجرد النظر إلى شكل التنوين!',
      }),
      makePair({
        groupTitle: 'الوقف على التنوين بالفتح',
        items: ['غَفُورًا ⬅ غَفُورَا (مد عوض 2)', 'جَنَّةً ⬅ جَنَّهْ (هاء ساكنة)'],
        tip: 'التنوين بالفتح يعوض عنه بألف مدية وقفاً إلا إذا كان على تاء مربوطة.',
      }),
    ],
    words: [
      makeWord({
        id: 'lvl5-w1',
        word: 'عَلِيمًا حَكِيمًا',
        meaning: 'تنوين بالفتح مظهر ثم مد عوض عند الوقف',
        surahRef: 'النساء: 11',
        syllables: [
          { text: 'عَ', type: 'harakah', color: '#145a3a', ruleLabel: 'فتحة' },
          { text: 'لِي', type: 'madd_pair', color: '#2563eb', ruleLabel: 'مد طبيعي (2)' },
          { text: 'مَنْ', type: 'sukun_pair', color: '#d97706', ruleLabel: 'تنوين مظهر عند الحاء' },
          { text: 'حَ', type: 'harakah', color: '#145a3a', ruleLabel: 'حاء حلقية' },
          { text: 'كِي', type: 'madd_pair', color: '#2563eb', ruleLabel: 'مد طبيعي (2)' },
          { text: 'مَا', type: 'madd_pair', color: '#059669', ruleLabel: 'مد عوض وقفاً (2)' },
        ],
        tahajjiSteps: [
          'عين فتحة (عَ) لام كسرة يا مد (لِي) ميم فتحتين إظهار حلقي (مَنْ) -> عَلِيمًا',
          'حا فتحة (حَ) كاف كسرة يا مد (كِي) ميم فتحتين نقف عليها بمد العوض حركتين (مَا) -> حَكِيمَا',
        ],
        durationBeats: 2,
        phoneticTip: 'أظهر التنوين في (عَلِيمًا) لأن بعده حرف الحاء، وقف على (حَكِيمًا) بألف مدية (حَكِيمَا).',
      }),
      makeWord({
        id: 'lvl5-w2',
        word: 'رَاضِيَةٍ * فِى جَنَّةٍ عَالِيَةٍ',
        meaning: 'تنوين بالكسر مع الإخفاء والإظهار',
        surahRef: 'الحاقة: 21-22',
        syllables: [
          { text: 'جَنْ', type: 'ghunnah', color: '#16a34a', ruleLabel: 'نون مشددة بغنة (2)' },
          { text: 'نَ', type: 'harakah', color: '#145a3a', ruleLabel: 'فتحة' },
          { text: 'تِنْ', type: 'sukun_pair', color: '#d97706', ruleLabel: 'تنوين مظهر قبل العين' },
        ],
        tahajjiSteps: [
          'جيم فتحة نون شدة وغنة حركتان (جَنَّ)',
          'تاء كسرتين إظهار حلقي عند العين (تِنْ) -> جَنَّةٍ عَالِيَةٍ',
        ],
        durationBeats: 2,
        phoneticTip: 'عند الوقف على (رَاضِيَةٍ) أو (عَالِيَةٍ) يسقط التنوين وتُبدل التاء المربوطة هاءً ساكنة (رَاضِيَهْ).',
      }),
    ],
    examQuestions: [
      makeQuestion({
        id: 'q5-1',
        prompt: 'كيف نقف على كلمة ﴿مَآءً ثَجَّاجًا﴾ عند الوقف على الكلمة الثانية؟',
        word: 'ثَجَّاجًا',
        options: [
          'نقف بألف مدية بمقدار حركتين (ثَجَّاجَا) ويسمى مد عوض',
          'نقف بنون ساكنة (ثجاجنْ)',
          'نقف بسكون الجيم (ثجاجْ)',
          'نقف بمد ست حركات',
        ],
        correctIndex: 0,
        explanation: 'التنوين بالفتح يُعوض عنه عند الوقف بألف مدية تمد مقدار حركتين ويسمى (مد العوض).',
      }),
    ],
  }),
  makeLevel({
    level: 6,
    title: 'المستوى 6: الشدة واللام الشمسية والقمرية وهمزة الوصل',
    shortTitle: 'الشدة واللامات وهمزة الوصل',
    subtitle: 'تفكيك الحرف المشدد إلى (ساكن + متحرك)، وتمييز اللام الشمسية والقمرية وهمزة الوصل',
    methodologyTag: 'نور البيان + القاعدة النورانية المتقدمة',
    badgeColor: '#0f766e',
    objective:
      'إدراك أن الحرف المشدد حرفان في اللفظ: الأول ساكن يُقرأ مع ما قبله، والثاني متحرك يُقرأ بحركته.',
    keyRules: [
      'الحرف المشدد = حرف ساكن + حرف متحرك من جنسه.',
      'النون والميم المشددتان (نّ / مّ) تغنان بمقدار حركتين وجوباً (حرف غنة مشدد).',
      'اللام القمرية عليها سكون رأس الحاء (ٱلْقَمَرُ) وتُظهر، وحروفها في (ابغ حجك وخف عقيمه).',
      'اللام الشمسية خالية من السكون وبعدها حرف مشدد (ٱلشَّمْسُ) وتُدغم، وهمزة الوصل تسقط في درج الكلام.',
    ],
    visualPairs: [
      makePair({
        groupTitle: 'المقارنة بين اللام القمرية والشمسية',
        items: ['ٱلْحَمْدُ (قمرية مظهرة عليها ۡ)', 'ٱلرَّحْمَٰنِ (شمسية مدغمة بعدها شدة ّ)'],
        tip: 'إذا رأيت رأس الحاء فوق اللام فانطقها، وإذا كانت اللام عارية وبعدها شدة فاقفز من الحرف قبلها إلى الحرف المشدد.',
      }),
      makePair({
        groupTitle: 'همزة الوصل في درج الكلام',
        items: ['وَٱلشَّمْسِ ⬅ تُقرأ (وَشْشَمْسِ)', 'وَٱلْقَمَرِ ⬅ تُقرأ (وَلْقَمَرِ)'],
        tip: 'همزة الوصل (ٱ) جسر للنطق بالساكن في أول الكلام فقط، وتسقط تماماً عند الوصل.',
      }),
    ],
    words: [
      makeWord({
        id: 'lvl6-w1',
        word: 'وَٱلشَّمْسِ وَضُحَىٰهَا',
        meaning: 'سقوط همزة الوصل وإدغام اللام الشمسية',
        surahRef: 'الشمس: 1',
        syllables: [
          { text: 'وَشْ', type: 'shaddah', color: '#7c3aed', ruleLabel: 'واو + شين ساكنة (إدغام شمسي)' },
          { text: 'شَمْ', type: 'sukun_pair', color: '#145a3a', ruleLabel: 'شين مفتوحة + ميم ساكنة' },
          { text: 'سِ', type: 'harakah', color: '#2563eb', ruleLabel: 'سين مكسورة' },
        ],
        tahajjiSteps: [
          'واو فتحة شين شدة (وَشْ) — سقطت همزة الوصل وأدغمت اللام الشمسية في الشين',
          'شين فتحة ميم سكون (شَمْ) -> وَٱلشَّمْ',
          'سين كسرة (سِ) -> وَٱلشَّمْسِ',
        ],
        durationBeats: 1,
        phoneticTip: 'انتقل مباشرة من الواو المفتوحة إلى الشين المشددة (وَشْ-شَمْسِ) مع تفشي الشين.',
      }),
      makeWord({
        id: 'lvl6-w2',
        word: 'إِنَّآ أَعْطَيْنَٰكَ',
        meaning: 'نون مشددة بغنة حركتين ومد منفصل',
        surahRef: 'الكوثر: 1',
        syllables: [
          { text: 'إِنْ', type: 'ghunnah', color: '#16a34a', ruleLabel: 'نون مشددة بغنة (2)' },
          { text: 'نَآ', type: 'madd_pair', color: '#dc2626', ruleLabel: 'مد جائز منفصل (4)' },
          { text: 'أَعْ', type: 'sukun_pair', color: '#145a3a', ruleLabel: 'همزة + عين وسط الحلق' },
          { text: 'طَيْ', type: 'sukun_pair', color: '#d97706', ruleLabel: 'ياء لين ساكنة' },
          { text: 'نَٰ', type: 'madd_pair', color: '#2563eb', ruleLabel: 'ألف خنجرية (2)' },
          { text: 'كَ', type: 'harakah', color: '#145a3a', ruleLabel: 'كاف مفتوحة' },
        ],
        tahajjiSteps: [
          'همزة كسرة نون شدة وغنة حركتان (إِنّ) + ألف مد منفصل (إِنَّآ)',
          'همزة فتحة عين سكون (أَعْ) طا فتحة يا سكون لين (طَيْ)',
          'نون فتحة ألف صغيرة (نَٰ) كاف فتحة (كَ) -> أَعْطَيْنَٰكَ',
        ],
        durationBeats: 4,
        phoneticTip: 'أعطِ النون المشددة في (إِنَّا) زمن الغنة الكامل (حركتين) قبل الانتقال للمد.',
      }),
    ],
    examQuestions: [
      makeQuestion({
        id: 'q6-1',
        prompt: 'كيف تُقرأ كلمة ﴿وَٱلضُّحَىٰ﴾ عند الوصل؟',
        word: 'وَٱلضُّحَىٰ',
        options: [
          'تسقط همزة الوصل وتدغم اللام الشمسية في الضاد فتُقرأ (وَضْ-ضُحَى)',
          'تُظهر اللام وتُنطق همزة الوصل (وَأَلْضُّحَى)',
          'تُحذف الواو والضاد',
          'تُقلقل الضاد المشددة',
        ],
        correctIndex: 0,
        explanation: 'همزة الوصل تسقط في درج الكلام، واللام الشمسية تدغم في الضاد لأنها من الحروف الشمسية.',
      }),
    ],
  }),
  makeLevel({
    level: 7,
    title: 'المستوى 7: خصائص الرسم العثماني والحروف المقطعة في المصحف',
    shortTitle: 'الرسم العثماني وفواتح السور',
    subtitle: 'الألف الخنجرية، الصفر المستدير والمستطيل، الواو والياء الصغيرة، والحروف المقطعة',
    methodologyTag: 'ضبط المصحف الشريف + القاعدة النورانية',
    badgeColor: '#b45309',
    objective:
      'قراءة علامات ضبط المصحف العثماني بدقة وإتقان مدود الحروف المقطعة في أوائل السور.',
    keyRules: [
      'الألف الخنجرية (ـٰ) والواو الصغيرة (ـۥ) والياء الصغيرة (ـۦ) تُنطق حروف مد طبيعي كاملة.',
      'الصفر المستدير (ْ دائرة صغيرة فوق الألف أو الواو أو الياء) يدل على سقوط الحرف وصلاً ووقفاً مثل ﴿قَالُوا۟﴾ و﴿أُو۟لَٰٓئِكَ﴾.',
      'الصفر المستطيل القائم (أَنَا۠ / لَّٰكِنَّا۠) يدل على إثبات الألف وقفاً وحذفها وصلاً.',
      'الحروف المقطعة في أوائل السور: (حي طهر) تمد حركتين، و(سنقص علمك) تمد 6 حركات، و(ألف) لا مد فيها.',
    ],
    visualPairs: [
      makePair({
        groupTitle: 'الصفر المستدير مقابل الصفر المستطيل',
        items: ['أُو۟لَٰٓئِكَ (صفر مستدير = يحذف وصلاً ووقفاً)', 'أَنَا۠ نَذِيرٌ (صفر مستطيل = يثبت وقفاً فقط)'],
        tip: 'الواو التي فوقها دائرة مستديرة في (أولئك) لا تُنطق أبداً، فتُقرأ (أُلَائِكَ).',
      }),
      makePair({
        groupTitle: 'الحروف المقطعة في فواتح السور',
        items: ['أَلِفْ لَآمْ مِيٓمْ (الـم)', 'حَا مِيٓمْ (حم)', 'كَهيعص'],
        tip: 'في (الم): ألف لا مد فيها، لام تمد 6 حركات ثم تدغم ميمها في ميم (ميم) بغنة حركتين ثم تمد ميم 6 حركات.',
      }),
    ],
    words: [
      makeWord({
        id: 'lvl7-w1',
        word: 'أُو۟لَٰٓئِكَ',
        meaning: 'اسم إشارة (واو عليها صفر مستدير + ألف خنجرية مد متصل)',
        surahRef: 'البقرة: 5',
        syllables: [
          { text: 'أُ', type: 'harakah', color: '#145a3a', ruleLabel: 'همزة مضمومة فقط (الواو لا تنطق)' },
          { text: 'لَٰٓ', type: 'madd_pair', color: '#dc2626', ruleLabel: 'ألف خنجرية مد متصل (4 حركات)' },
          { text: 'ئِ', type: 'harakah', color: '#2563eb', ruleLabel: 'همزة مكسورة' },
          { text: 'كَ', type: 'harakah', color: '#145a3a', ruleLabel: 'كاف مفتوحة' },
        ],
        tahajjiSteps: [
          'همزة ضمة (أُ) — الواو فوقها صفر مستدير لا تنطق (إياك أن تمد أُو)',
          'لام فتحة ألف خنجرية مد متصل واجب 4 حركات (لَٰٓ)',
          'همزة كسرة (ئِ) كاف فتحة (كَ) -> أُو۟لَٰٓئِكَ',
        ],
        durationBeats: 4,
        phoneticTip: 'أكبر خطأ شائع هو مد الواو الأولى في (أولئك)؛ والصواب ضم الهمزة فقط زمن حركة واحدة (أُلَائِكَ).',
      }),
      makeWord({
        id: 'lvl7-w2',
        word: 'الٓمٓ',
        meaning: 'فواتح السور (مد لازم حرفي مثقل ومخفف)',
        surahRef: 'البقرة: 1',
        syllables: [
          { text: 'أَلِفْ', type: 'harakah', color: '#145a3a', ruleLabel: 'ثلاثة أحرف لا مد فيها' },
          { text: 'لَآمْ', type: 'madd_pair', color: '#dc2626', ruleLabel: 'مد لازم حرفي مثقل (6) + إدغام بغنة (2)' },
          { text: 'مِيٓمْ', type: 'madd_pair', color: '#2563eb', ruleLabel: 'مد لازم حرفي مخفف (6)' },
        ],
        tahajjiSteps: [
          'أَلِفْ (بدون مد)',
          'لَآمْ (مد 6 حركات ثم إدغام الميم الساكنة في الميم التالية بغنة حركتين)',
          'مِيٓمْ (مد 6 حركات مع إظهار الميم الأخيرة عند الوقف)',
        ],
        durationBeats: 6,
        phoneticTip: 'تنطق أسماء الحروف المقطعة هكذا: (أَلِفْ لَآمِّيٓمْ).',
      }),
    ],
    examQuestions: [
      makeQuestion({
        id: 'q7-1',
        prompt: 'ما دلالة (الصفر المستدير ۟) فوق الواو في كلمة ﴿أُو۟لَٰٓئِكَ﴾؟',
        word: 'أُو۟لَٰٓئِكَ',
        options: [
          'أن حرف الواو زائد رسماً فلا يُنطق لا وصلاً ولا وقفاً',
          'أن الواو تمد ست حركات',
          'أن الواو تقلقل عند الوقف',
          'أن الواو تنطق في الوصل فقط',
        ],
        correctIndex: 0,
        explanation: 'الصفر المستدير في ضبط المصحف يدل على زيادة الحرف في الرسم العثماني وسقوطه في النطق وصلاً ووقفاً.',
      }),
    ],
  }),
  makeLevel({
    level: 8,
    title: 'المستوى 8: التأسيس التجويدي التطبيقي والكلمات القرآنية المركبة',
    shortTitle: 'التجويد التطبيقي الشامل',
    subtitle: 'أحكام النون والميم الساكنتين، التفخيم والترقيق، وتدريبات الدمج في الآيات القرآنية',
    methodologyTag: 'التكامل النهائي: النورانية + التحفة + الترتيل التطبيقي',
    badgeColor: '#be123c',
    objective:
      'التطبيق المتكامل لأحكام النون الساكنة والتنوين والميم الساكنة وتخليص الحروف في الكلمات القرآنية الصعبة.',
    keyRules: [
      'أحكام النون الساكنة والتنوين الأربعة: الإظهار الحلقي، الإدغام (يرملون)، الإقلاب (ب)، الإخفاء الحقيقي (15 حرفاً).',
      'أحكام الميم الساكنة الثلاثة: الإخفاء الشفوي عند (ب)، إدغام المثلين عند (م)، الإظهار الشفوي عند باقي الحروف.',
      'تخليص الحروف المرققة من المفخمة في الكلمات القرآنية الشديدة مثل ﴿مَخْمَصَةٍ﴾ و﴿لِيَحْكُمَ﴾ و﴿فَسَيَكْفِيكَهُمُ﴾.',
    ],
    visualPairs: [
      makePair({
        groupTitle: 'خريطة النون الساكنة والتنوين',
        items: ['إظهار (ء هـ ع ح غ خ)', 'إدغام (ي ر م ل و ن)', 'إقلاب (ب ⬅ م)', 'إخفاء (صف ذا ثنا...)'],
        tip: 'الغنة تلازم الإدغام الناقص (ينمو) والإقلاب والإخفاء بمقدار حركتين، وتفخم غنة الإخفاء إذا تلاها حرف مفخم (ص ض ط ظ ق).',
      }),
      makePair({
        groupTitle: 'تفخيم وترقيق غنة الإخفاء',
        items: ['مَنصُورًا (غنة مفخمة قبل الصاد)', 'مَن كَانَ (غنة مرققة قبل الكاف)'],
        tip: 'غنة الإخفاء تتبع ما بعدها تفخيماً وترقيقاً؛ فهيئ الفم لمخرج الحرف التالي أثناء الغنة.',
      }),
    ],
    words: [
      makeWord({
        id: 'lvl8-w1',
        word: 'مِنۢ بَعْدِ',
        meaning: 'إقلاب النون الساكنة ميماً مخفاة بغنة عند الباء',
        surahRef: 'البقرة: 27',
        syllables: [
          { text: 'مِمْ', type: 'ghunnah', color: '#16a34a', ruleLabel: 'إقلاب ميماً مخفاة بغنة (2)' },
          { text: 'بَعْ', type: 'sukun_pair', color: '#145a3a', ruleLabel: 'باء مفتوحة + عين ساكنة' },
          { text: 'دِ', type: 'harakah', color: '#2563eb', ruleLabel: 'دال مكسورة (تقلقل وقفاً)' },
        ],
        tahajjiSteps: [
          'ميم كسرة نون ساكنة منقلبة ميماً مخفاة عند الباء بغنة حركتين (مِمۢ)',
          'با فتحة عين سكون (بَعْ)',
          'دال كسرة (دِ) وعند الوقف نقلقل الدال (مِنۢ بَعْدْ)',
        ],
        durationBeats: 2,
        phoneticTip: 'عند الإقلاب تلامس الشفتان تلامساً لطيفاً من غير كزٍّ ولا فرجة واسعة مع جريان الغنة من الخيشوم.',
      }),
      makeWord({
        id: 'lvl8-w2',
        word: 'مَخْمَصَةٍ',
        meaning: 'مجاعة (تخليص الميمين المرققتين من الخاء والصاد المفخمتين)',
        surahRef: 'المائدة: 3',
        syllables: [
          { text: 'مَخْ', type: 'sukun_pair', color: '#dc2626', ruleLabel: 'ميم مرققة + خاء مفخمة مهموسة' },
          { text: 'مَ', type: 'harakah', color: '#145a3a', ruleLabel: 'ميم مرققة' },
          { text: 'صَ', type: 'harakah', color: '#dc2626', ruleLabel: 'صاد مفخمة مطبقة' },
          { text: 'ةٍ', type: 'harakah', color: '#2563eb', ruleLabel: 'تاء منونة بالكسر' },
        ],
        tahajjiSteps: [
          'ميم فتحة مرققة خا سكون مفخمة (مَخْ)',
          'ميم فتحة مرققة (مَ) صاد فتحة مفخمة (صَ) -> مَخْمَصَ',
          'تاء كسرتين (ةٍ) -> مَخْمَصَةٍ',
        ],
        durationBeats: 1,
        phoneticTip: 'تدريب ذهبي على تخليص الحروف: رقق الميم الأولى، فخم الخاء، رقق الميم الثانية، فخم الصاد، رقق التاء!',
      }),
      makeWord({
        id: 'lvl8-w3',
        word: 'فَسَيَكْفِيكَهُمُ ٱللَّهُ',
        meaning: 'أطول كلمة قرآنية في سورة البقرة (ضبط الحركات المتتالية)',
        surahRef: 'البقرة: 137',
        syllables: [
          { text: 'فَ', type: 'harakah', color: '#145a3a', ruleLabel: 'فاء مفتوحة' },
          { text: 'سَ', type: 'harakah', color: '#145a3a', ruleLabel: 'سين مفتوحة' },
          { text: 'يَكْ', type: 'sukun_pair', color: '#7c3aed', ruleLabel: 'ياء + كاف مهموسة' },
          { text: 'فِي', type: 'madd_pair', color: '#2563eb', ruleLabel: 'مد طبيعي بالياء (2)' },
          { text: 'كَ', type: 'harakah', color: '#145a3a', ruleLabel: 'كاف مفتوحة' },
          { text: 'هُمُ', type: 'harakah', color: '#d97706', ruleLabel: 'ضم ميم الجمع للتخلص من الساكنين' },
        ],
        tahajjiSteps: [
          'فا فتحة (فَ) سين فتحة (سَ) -> فَسَ',
          'يا فتحة كاف سكون مهموسة (يَكْ) فا كسرة يا مد طبيعي (فِي) -> فَسَيَكْفِي',
          'كاف فتحة (كَ) ها ضمة (هُ) ميم ضمة (مُ) -> فَسَيَكْفِيكَهُمُ ٱللَّهُ',
        ],
        durationBeats: 2,
        phoneticTip: 'ضم ميم الجمع في (هُمُ) مع تفخيم لام لفظ الجلالة بعدها لأن ما قبلها مضموم.',
      }),
    ],
    examQuestions: [
      makeQuestion({
        id: 'q8-1',
        prompt: 'ما حكم النون الساكنة في قوله تعالى ﴿مِنۢ بَعْدِ﴾؟',
        word: 'مِنۢ بَعْدِ',
        options: [
          'إقلاب النون الساكنة ميماً مخفاة بغنة بمقدار حركتين لوقوع الباء بعدها',
          'إظهار حلقي',
          'إدغام بغير غنة',
          'إخفاء شفوي',
        ],
        correctIndex: 0,
        explanation: 'إذا وقع حرف الباء بعد النون الساكنة أو التنوين وجب قلبها ميماً مخفاة مع الغنة، وعلامته في المصحف الميم الصغيرة القائمة (ۢ).',
      }),
      makeQuestion({
        id: 'q8-2',
        prompt: 'لماذا فُخمت لام لفظ الجلالة في قوله تعالى ﴿فَسَيَكْفِيكَهُمُ ٱللَّهُ﴾؟',
        word: 'فَسَيَكْفِيكَهُمُ ٱللَّهُ',
        options: [
          'لأنها سُبقت بضم في آخر الكلمة قبلها (هُمُ)',
          'لأنها سُبقت بكسر',
          'لأن لام لفظ الجلالة مفخمة في جميع الأحوال',
          'لوجود همزة القطع قبلها',
        ],
        correctIndex: 0,
        explanation: 'تفخم لام لفظ الجلالة (اللَّه) إذا سُبقت بفتح أو ضم، وترقق إذا سُبقت بكسر مثل (بِسْمِ اللَّهِ).',
      }),
    ],
  }),
];

function makeRemedy(item: {
  id: string;
  targetLetters: string;
  makhrajRegion: string;
  title: string;
  commonError: string;
  practicalRemedy: string;
  drillWords: string[];
}): SpeechDefectRemedy {
  return {
    ...item,
    letter: item.targetLetters,
    defectTitle: item.title,
    commonMistake: item.commonError,
    practicalExercise: item.practicalRemedy,
    quranicDrillWords: item.drillWords,
  };
}

export const SPEECH_DEFECT_REMEDIES: SpeechDefectRemedy[] = [
  makeRemedy({
    id: 'remedy-ra',
    targetLetters: 'ر (الراء)',
    makhrajRegion: 'طرف اللسان مع ما يحاذيه من لثة الثنايا العليا',
    title: 'علاج لثغة الراء (قلبها غيناً أو ياءً أو لاما أو تكريرها المفرط)',
    commonError: 'نطق الراء غيناً من الحلق (غحمن) أو ياءً (يحمن) أو ارتجاف اللسان بتكرير كثير.',
    practicalRemedy:
      'اجعل ظهر طرف اللسان يقرع لثة الأسنان الأمامية العليا قرعة واحدة خفيفة مع ترك فرجة يسيرة جداً في وسط طرف اللسان يمر منها الصوت (صفة البينية والانحراف)، ودرب الطالب على نطق (تَ - دَ - رَ) متتابعة.',
    drillWords: ['ٱلرَّحْمَٰنِ', 'رَبِّ ٱلْعَٰلَمِينَ', 'فِرْعَوْنَ', 'مَرْيَمَ'],
  }),
  makeRemedy({
    id: 'remedy-lathawiyyah',
    targetLetters: 'ث / ذ / ظ (الحروف اللثوية)',
    makhrajRegion: 'طرف اللسان مع أطراف الثنايا العليا',
    title: 'علاج إبدال الحروف اللثوية بـ (س / ز / ص)',
    commonError: 'قراءة ﴿ٱلَّذِينَ﴾ بالزاي (الزين)، أو ﴿ٱلظَّالِمِينَ﴾ بالزاي المفخمة، أو ﴿ثُمَّ﴾ بالسين.',
    practicalRemedy:
      'اطلب من الطالب إخراج رأس طرف اللسان يسيراً (بمقدار 2 ملم) ليلامس حافة الأسنان الأمامية العليا مع النظر في مرآة صغيرة أو كاميرا السبورة أثناء نطق (ثَ - ذَ - ظَ).',
    drillWords: ['ٱلَّذِينَ', 'ٱلظَّٰلِمِينَ', 'ثُمَّ كَلَّا', 'حَافِظِينَ'],
  }),
  makeRemedy({
    id: 'remedy-qaf-kaf',
    targetLetters: 'ق / ك (القاف والكاف)',
    makhrajRegion: 'أقصى اللسان (الحنك اللحمي للقاف، والحنك العظمي للكاف)',
    title: 'علاج خلط القاف بالكاف أو نطق القاف كافاً مفخمة',
    commonError: 'نطق ﴿ٱلْمُسْتَقِيمَ﴾ بالكاف (المستكيم) أو نطق ﴿كُلُوا﴾ بالقاف عند الأطفال والمبتدئين.',
    practicalRemedy:
      'يرفع الطالب أقصى اللسان (مؤخرته) ليقرع المنطقة الرخوة في سقف الحلق مع استعلاء الصوت نحو قبة الحنك في (ق)، بينما يقدم اللسان للأمام قليلاً نحو السقف الصلب مع همس لطيف في (ك).',
    drillWords: ['ٱلْمُسْتَقِيمَ', 'خَلَقَكُمْ', 'فَٱسْتَقِمْ كَمَآ', 'قُلْ كَفَىٰ'],
  }),
  makeRemedy({
    id: 'remedy-dad',
    targetLetters: 'ض (الضاد العربية)',
    makhrajRegion: 'إحدى حافتي اللسان أو كلتاهما مع ما يحاذيهما من الأضراس العليا',
    title: 'علاج نطق الضاد دالاً مفخمة أو ظاءً لثوية',
    commonError: 'قراءة ﴿وَلَا ٱلضَّآلِّينَ﴾ بالدال المفخمة الشديدة (والدالين) أو بإخراج اللسان كالظاء (والظالين).',
    practicalRemedy:
      'اعتمد بحافة اللسان الجانبية على الصفحة الداخلية للأضراس العليا مع بقاء طرف اللسان خلف الأسنان العليا دون إخراجه، وإعطاء زمن الاستطالة والرخاوة قبل فتح الحرف.',
    drillWords: ['وَلَا ٱلضَّآلِّينَ', 'فَضْلِ ٱللَّهِ', 'يَضْرِبُ', 'ٱلْأَرْضِ'],
  }),
  makeRemedy({
    id: 'remedy-ayn-ha',
    targetLetters: 'ع / ح (وسط الحلق)',
    makhrajRegion: 'وسط الحلق (لسان المزمار)',
    title: 'علاج تعويم العين أو قلب الحاء هاءً عند الأطفال والأعاجم',
    commonError: 'نطق ﴿نَعْبُدُ﴾ بهمزة مسهلة (نأبد) أو نطق ﴿ٱلْحَمْدُ﴾ بالهاء (الهمد).',
    practicalRemedy:
      'تدريب الطالب على رجوع لسان المزمار للخلف قليلاً كأنه يتنحنح بلطف لإحكام بحة الحاء (حْ) وجهر العين (عْ) في تدريبات السكون أولاً: (أَعْ - إِعْ - أُعْ) و(أَحْ - إِحْ - أُحْ).',
    drillWords: ['إِيَّاكَ نَعْبُدُ', 'ٱلْحَمْدُ لِلَّهِ', 'ٱلْعَٰلَمِينَ', 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'],
  }),
];

export const MATN_LIBRARY: MatnWork[] = [
  {
    id: 'matn-tuhfah',
    title: 'متن تحفة الأطفال والغلمان في تجويد القرآن',
    author: 'الإمام سليمان الجمزوري رحمه الله',
    chapters: [
      {
        id: 'tuhfah-intro',
        chapterTitle: '١. مقدمة المنظومة',
        explanation:
          'يفتتح الناظم رحمه الله بحمد الله والصلاة على النبي ﷺ وآله وتلاميذه، ويبين أن النظم في أحكام النون الساكنة والتنوين والمدود بعبارة ميسرة للمبتدئين.',
        verses: [
          {
            firstHemistich: 'يَقُولُ رَاجِي رَحْمَةِ الْغَفُورِ',
            secondHemistich: 'دَوْمًا سُلَيْمَانُ هُوَ الجَمْزُورِي',
          },
          {
            firstHemistich: 'الْحَمْدُ لِلَّهِ مُصَلِّيًا عَلَى',
            secondHemistich: 'مُحَمَّدٍ وَآلِهِ وَمَنْ تَلَا',
          },
          {
            firstHemistich: 'وَبَعْدُ هَذَا النَّظْمُ لِلْمُرِيدِ',
            secondHemistich: 'فِي النُّونِ والتَّنْوِينِ وَالْمُدُودِ',
          },
        ],
      },
      {
        id: 'tuhfah-noon',
        chapterTitle: '٢. باب أحكام النون الساكنة والتنوين',
        explanation:
          'للنون الساكنة والتنوين أربعة أحكام عند التقاء حروف الهجاء بها: الإظهار الحلقي (6 أحرف)، الإدغام في (يرملون) بقسميه، الإقلاب عند الباء، والإخفاء الحقيقي عند باقي الحروف الخمسة عشر.',
        verses: [
          {
            firstHemistich: 'لِلنُّونِ إِنْ تَسْكُنْ وَلِلتَّنْوِينِ',
            secondHemistich: 'أَرْبَعُ أَحْكَامٍ فَخُذْ تَبْيِينِي',
          },
          {
            firstHemistich: 'فَالأَوَّلُ الإِظْهَارُ قَبْلَ أَحْرُفِ',
            secondHemistich: 'لِلْحَلْقِ سِتٌّ رُتِّبَتْ فَلْتَعْرِفِ',
          },
          {
            firstHemistich: 'هَمْزٌ فَهَاءٌ ثُمَّ عَيْنٌ حَاءُ',
            secondHemistich: 'مُهْمَلَتَانِ ثُمَّ غَيْنٌ خَاءُ',
          },
          {
            firstHemistich: 'وَالثَّانِ إِدْغَامٌ بِسِتَّةٍ أَتَتْ',
            secondHemistich: 'فِي (يَرْمَلُونَ) عِنْدَهُمْ قَدْ ثَبَتَتْ',
          },
          {
            firstHemistich: 'وَالثَّالِثُ الإِقْلاَبُ عِنْدَ الْبَاءِ',
            secondHemistich: 'مِيمًا بِغُنَّةٍ مَعَ الإِخْفَاءِ',
          },
          {
            firstHemistich: 'وَالرَّابِعُ الإِخْفَاءُ عِنْدَ الْفَاضِلِ',
            secondHemistich: 'مِنَ الحُرُوفِ وَاجِبٌ لِلْفَاضِلِ',
          },
        ],
      },
      {
        id: 'tuhfah-meem',
        chapterTitle: '٣. باب أحكام الميم والنون المشددتين والميم الساكنة',
        explanation:
          'وجوب إظهار الغنة بمقدار حركتين في كل ميم ونون مشددتين، وبيان الأحكام الثلاثة للميم الساكنة: الإخفاء الشفوي عند الباء، وإدغام المثلين الصغير عند الميم، والإظهار الشفوي عند بقية الأحرف وخاصة الواو والفاء.',
        verses: [
          {
            firstHemistich: 'وَغُنَّ مِيمًا ثُمَّ نُونًا شُدِّدَا',
            secondHemistich: 'وَسَمِّ كُلًّا حَرْفَ غُنَّةٍ بَدَا',
          },
          {
            firstHemistich: 'وَالمِيمُ إِنْ تَسْكُنْ تَجِي قَبْلَ الهِجَا',
            secondHemistich: 'لاَ أَلِفٍ لَيِّنَةٍ لِذِي الحِجَا',
          },
          {
            firstHemistich: 'أَحْكَامُهَا ثَلاَثَةٌ لِمَنْ ضَبَطْ',
            secondHemistich: 'إِخْفَاءٌ ادْغَامٌ وَإِظْهَارٌ فَقَطْ',
          },
          {
            firstHemistich: 'وَاحْذَرْ لَدَى وَاوٍ وَفَا أَنْ تَخْتَفِي',
            secondHemistich: 'لِقُرْبِهَا وَلاتِّحَادِ فَاعْرِفِ',
          },
        ],
      },
    ],
  },
  {
    id: 'matn-jazariyyah',
    title: 'متن المقدمة الجزرية في التجويد ومخارج الحروف',
    author: 'الإمام محمد بن الجزري رحمه الله',
    chapters: [
      {
        id: 'jazariyyah-makharij',
        chapterTitle: '١. باب مخارج الحروف السبعة عشر',
        explanation:
          'تفصيل مخارج الحروف العربية السبعة عشر الموزعة على خمسة مخارج عامة: الجوف، الحلق، اللسان، الشفتان، والخيشوم.',
        verses: [
          {
            firstHemistich: 'مَخَارِجُ الحُرُوفِ سَبْعَةَ عَشَرْ',
            secondHemistich: 'عَلَى الَّذِي يَخْتَارُهُ مَنِ اخْتَبَرْ',
          },
          {
            firstHemistich: 'فَأَلِفُ الجَوْفِ وَأُخْتَاهَا وَهِي',
            secondHemistich: 'حُرُوفُ مَدٍّ لِلْهَوَاءِ تَنْتَهِي',
          },
          {
            firstHemistich: 'ثُمَّ لأَقْصَى الحَلْقِ هَمْزٌ هَاءُ',
            secondHemistich: 'ثُمَّ لِوَسْطِهِ فَعَيْنٌ حَاءُ',
          },
          {
            firstHemistich: 'أَدْنَاهُ غَيْنٌ خَاؤُهَا وَالقَافُ',
            secondHemistich: 'أَقْصَى اللِّسَانِ فَوْقُ ثُمَّ الكَافُ',
          },
        ],
      },
      {
        id: 'jazariyyah-tajweed',
        chapterTitle: '٢. باب التجويد والترقيق والتفخيم',
        explanation:
          'بيان فرضية التجويد في التلاوة وتخليص الحروف المستفلة المرققة من الحروف المستعلية المفخمة المجمعة في (خص ضغط قظ).',
        verses: [
          {
            firstHemistich: 'وَالأَخْذُ بِالتَّجْوِيدِ حَتْمٌ لاَزِمُ',
            secondHemistich: 'مَنْ لَمْ يُجَوِّدِ القُرَآنَ آثِمُ',
          },
          {
            firstHemistich: 'لأَنَّهُ بِهِ الإِلَهُ أَنْزَلاَ',
            secondHemistich: 'وَهَكَذَا مِنْهُ إِلَيْنَا وَصَلاَ',
          },
          {
            firstHemistich: 'فَرَقِّقَنْ مُسْتَفِلاً مِنْ أَحْرُفِ',
            secondHemistich: 'وَحَاذِرَنْ تَفْخِيمَ لَفْظِ الأَلِفِ',
          },
        ],
      },
    ],
  },
];

import {
  PeerCompetitionPack,
  SmartQuizQuestion,
  SmartQuizQuestionCategory,
  Student,
} from '../types';
import { SURAHS } from './quranData';
import { getLocalDateString } from './seedData';

export const SMART_QUIZ_CATEGORY_LABELS: Record<SmartQuizQuestionCategory, string> = {
  complete_ayah: '١. أكمل الآية الكريمة',
  identify_surah: '٢. في أي سورة وردت هذه الآية؟',
  continue_after_ayah: '٣. أكمل بعد الآية المحددة (الآيات التالية)',
  tajweed_and_madd: '٤. تحديد أحكام التجويد ونوع المد',
};

export const SMART_QUIZ_QUESTIONS_BANK: SmartQuizQuestion[] = [
  // ================= CATEGORY 1: أكمل الآية الكريمة (complete_ayah) =================
  {
    id: 'sq-ca-1',
    category: 'complete_ayah',
    categoryLabel: 'أكمل الآية الكريمة',
    juz: 30,
    surahName: 'النبأ',
    ayahNumber: 6,
    verseSnippet: '﴿أَلَمْ نَجْعَلِ الْأَرْضَ مِهَادًا * وَالْجِبَالَ ...﴾',
    questionPrompt: 'أكمل الآية الكريمة بعد قوله تعالى: ﴿أَلَمْ نَجْعَلِ الْأَرْضَ مِهَادًا * وَالْجِبَالَ ...﴾',
    options: [
      'أَوْتَادًا * وَخَلَقْنَاكُمْ أَزْوَاجًا',
      'رَوَاسِيَ شَامِخَاتٍ وَأَسْقَيْنَاكُم',
      'دَكًّا دَكًّا * وَجَاءَ رَبُّكَ',
      'كَالْعِهْنِ الْمَنفُوشِ',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿وَالْجِبَالَ أَوْتَادًا * وَخَلَقْنَاكُمْ أَزْوَاجًا * وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا﴾',
    tajweedExplanation: 'في قوله (أَوْتَادًا) مد عوض عند الوقف بمقدار حركتين، وعند الوصل إدغام بغنة مع الواو.',
    points: 25,
  },
  {
    id: 'sq-ca-2',
    category: 'complete_ayah',
    categoryLabel: 'أكمل الآية الكريمة',
    juz: 30,
    surahName: 'النازعات',
    ayahNumber: 40,
    verseSnippet: '﴿وَأَمَّا مَنْ خَافَ مَقَامَ رَبِّهِ وَنَهَى النَّفْسَ عَنِ الْهَوَىٰ * فَإِنَّ ...﴾',
    questionPrompt: 'أكمل الآية الكريمة: ﴿وَأَمَّا مَنْ خَافَ مَقَامَ رَبِّهِ وَنَهَى النَّفْسَ عَنِ الْهَوَىٰ * فَإِنَّ ...﴾',
    options: [
      'الْجَنَّةَ هِيَ الْمَأْوَىٰ',
      'الْجَحِيمَ هِيَ الْمَأْوَىٰ',
      'إِلَىٰ رَبِّكَ الْمُنتَهَىٰ',
      'ذَٰلِكَ لِمَنْ خَشِيَ رَبَّهُ',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿فَإِنَّ الْجَنَّةَ هِيَ الْمَأْوَىٰ﴾',
    tajweedExplanation: '(مَنْ خَافَ) إظهار حلقي لوقوع الخاء بعد النون الساكنة، و(النَّفْسَ) و(الْجَنَّةَ) نون مشددة تغن بمقدار حركتين.',
    points: 25,
  },
  {
    id: 'sq-ca-3',
    category: 'complete_ayah',
    categoryLabel: 'أكمل الآية الكريمة',
    juz: 30,
    surahName: 'الأعلى',
    ayahNumber: 14,
    verseSnippet: '﴿قَدْ أَفْلَحَ مَن تَزَكَّىٰ * وَذَكَرَ اسْمَ رَبِّهِ ...﴾',
    questionPrompt: 'أكمل الآية الكريمة بعد قوله تعالى: ﴿قَدْ أَفْلَحَ مَن تَزَكَّىٰ * وَذَكَرَ اسْمَ رَبِّهِ ...﴾',
    options: [
      'فَصَلَّىٰ * بَلْ تُؤْثِرُونَ الْحَيَاةَ الدُّنْيَا',
      'فَصَلَّىٰ لِرَبِّكَ وَانْحَرْ',
      'بُكْرَةً وَأَصِيلًا',
      'وَأَطَاعَ اللّهَ وَرَسُولَهُ',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿وَذَكَرَ اسْمَ رَبِّهِ فَصَلَّىٰ * بَلْ تُؤْثِرُونَ الْحَيَاةَ الدُّنْيَا * وَالْآخِرَةُ خَيْرٌ وَأَبْقَىٰ﴾',
    tajweedExplanation: '(قَدْ) قلقلة صغرى في حرف الدال، و(مَن تَزَكَّىٰ) إخفاء حقيقي بغنة مرققة حركتين.',
    points: 25,
  },
  {
    id: 'sq-ca-4',
    category: 'complete_ayah',
    categoryLabel: 'أكمل الآية الكريمة',
    juz: 29,
    surahName: 'الملك',
    ayahNumber: 2,
    verseSnippet: '﴿الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ ...﴾',
    questionPrompt: 'أكمل ختام الآية الكريمة من سورة الملك: ﴿... لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ ...﴾',
    options: [
      'الْعَزِيزُ الْغَفُورُ',
      'السَّمِيعُ الْبَصِيرُ',
      'اللَّطِيفُ الْخَبِيرُ',
      'الْغَفُورُ الرَّحِيمُ',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿وَهُوَ الْعَزِيزُ الْغَفُورُ﴾',
    tajweedExplanation: '(لِيَبْلُوَكُمْ) قلقلة صغرى في الباء، وإظهار شفوي للميم الساكنة قبل الهمزة في (أَيُّكُمْ).',
    points: 25,
  },
  {
    id: 'sq-ca-5',
    category: 'complete_ayah',
    categoryLabel: 'أكمل الآية الكريمة',
    juz: 28,
    surahName: 'الحشر',
    ayahNumber: 22,
    verseSnippet: '﴿هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ ۖ عَالِمُ الْغَيْبِ وَالشَّهَادَةِ ۖ هُوَ ...﴾',
    questionPrompt: 'أكمل ختام الآية (22) من سورة الحشر: ﴿... عَالِمُ الْغَيْبِ وَالشَّهَادَةِ ۖ هُوَ ...﴾',
    options: [
      'الرَّحْمَٰنُ الرَّحِيمُ',
      'الْعَزِيزُ الْحَكِيمُ',
      'الْمَلِكُ الْقُدُّوسُ السَّلَامُ',
      'الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿هُوَ الرَّحْمَٰنُ الرَّحِيمُ﴾',
    tajweedExplanation: '(لَا إِلَٰهَ) مد جائز منفصل يمد بمقدار 4 أو 5 حركات من طريق الشاطبية.',
    points: 25,
  },
  {
    id: 'sq-ca-6',
    category: 'complete_ayah',
    categoryLabel: 'أكمل الآية الكريمة',
    juz: 15,
    surahName: 'الكهف',
    ayahNumber: 10,
    verseSnippet: '﴿إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ ...﴾',
    questionPrompt: 'أكمل الآية الكريمة من سورة الكهف: ﴿... رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ ...﴾',
    options: [
      'لَنَا مِنْ أَمْرِنَا رَشَدًا',
      'لَنَا مِن لَّدُنكَ سُلْطَانًا نَّصِيرًا',
      'قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا',
      'لَنَا نُورًا نَّمْشِي بِهِ',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا﴾',
    tajweedExplanation: '(مِن لَّدُنكَ) إدغام بغير غنة في اللام، وإخفاء حقيقي للنون عند الكاف.',
    points: 25,
  },

  // ================= CATEGORY 2: في أي سورة وردت هذه الآية؟ (identify_surah) =================
  {
    id: 'sq-is-1',
    category: 'identify_surah',
    categoryLabel: 'في أي سورة وردت هذه الآية؟',
    juz: 30,
    surahName: 'التكوير',
    ayahNumber: 18,
    verseSnippet: '﴿وَالصُّبْحِ إِذَا تَنَفَّسَ * إِنَّهُ لَقَوْلُ رَسُولٍ كَرِيمٍ﴾',
    questionPrompt: 'في أي سورة كريمة ورد قوله تعالى: ﴿وَالصُّبْحِ إِذَا تَنَفَّسَ * إِنَّهُ لَقَوْلُ رَسُولٍ كَرِيمٍ﴾؟',
    options: ['سورة التكوير', 'سورة المدثر', 'سورة الفجر', 'سورة الليل'],
    correctOptionIndex: 0,
    modelAnswerText: 'سورة التكوير (الآيتان 18 - 19) — بينما في سورة المدثر: ﴿وَالصُّبْحِ إِذَا أَسْفَرَ﴾.',
    tajweedExplanation: 'انتبه للضابط بين المتشابهات: (تَنَفَّسَ) بالتاء مع (التكوير) بالتاء، و(أَسْفَرَ) في المدثر.',
    points: 25,
  },
  {
    id: 'sq-is-2',
    category: 'identify_surah',
    categoryLabel: 'في أي سورة وردت هذه الآية؟',
    juz: 30,
    surahName: 'المطففين',
    ayahNumber: 26,
    verseSnippet: '﴿خِتَامُهُ مِسْكٌ ۚ وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾',
    questionPrompt: 'في أي سورة ورد قوله تعالى: ﴿خِتَامُهُ مِسْكٌ ۚ وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾؟',
    options: ['سورة المطففين', 'سورة الإنسان', 'سورة الواقعة', 'سورة الغاشية'],
    correctOptionIndex: 0,
    modelAnswerText: 'سورة المطففين (الآية 26).',
    tajweedExplanation: 'في (خِتَامُهُ مِسْكٌ) مد صلة صغرى على هاء الضمير بمقدار حركتين وصلاً.',
    points: 25,
  },
  {
    id: 'sq-is-3',
    category: 'identify_surah',
    categoryLabel: 'في أي سورة وردت هذه الآية؟',
    juz: 29,
    surahName: 'القلم',
    ayahNumber: 4,
    verseSnippet: '﴿وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ﴾',
    questionPrompt: 'في أي سورة ورد ثناء الله العظيم على نبيه ﷺ: ﴿وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ﴾؟',
    options: ['سورة القلم', 'سورة المزمل', 'سورة الضحى', 'سورة الشرح'],
    correctOptionIndex: 0,
    modelAnswerText: 'سورة القلم (الآية 4).',
    tajweedExplanation: '(خُلُقٍ عَظِيمٍ) إظهار حلقي للتنوين لوقوع حرف العين بعده، و(عَظِيمٍ) مد عارض للسكون عند الوقف.',
    points: 25,
  },
  {
    id: 'sq-is-4',
    category: 'identify_surah',
    categoryLabel: 'في أي سورة وردت هذه الآية؟',
    juz: 29,
    surahName: 'الإنسان',
    ayahNumber: 8,
    verseSnippet: '﴿وَيُطْعِمُونَ الطَّعَامَ عَلَىٰ حُبِّهِ مِسْكِينًا وَيَتِيمًا وَأَسِيرًا﴾',
    questionPrompt: 'في أي سورة ورد قوله تعالى: ﴿وَيُطْعِمُونَ الطَّعَامَ عَلَىٰ حُبِّهِ مِسْكِينًا وَيَتِيمًا وَأَسِيرًا﴾؟',
    options: ['سورة الإنسان', 'سورة البلد', 'سورة الماعون', 'سورة الحاقة'],
    correctOptionIndex: 0,
    modelAnswerText: 'سورة الإنسان (الآية 8).',
    tajweedExplanation: '(مِسْكِينًا وَيَتِيمًا وَأَسِيرًا) إدغام بغنة للتنوين في الواو بمقدار حركتين.',
    points: 25,
  },
  {
    id: 'sq-is-5',
    category: 'identify_surah',
    categoryLabel: 'في أي سورة وردت هذه الآية؟',
    juz: 28,
    surahName: 'الجمعة',
    ayahNumber: 9,
    verseSnippet: '﴿يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ﴾',
    questionPrompt: 'في أي سورة وردت آية النداء لصلاة الجمعة: ﴿... فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ﴾؟',
    options: ['سورة الجمعة', 'سورة الصف', 'سورة التغابن', 'سورة المجادلة'],
    correctOptionIndex: 0,
    modelAnswerText: 'سورة الجمعة (الآية 9).',
    tajweedExplanation: '(ذِكْرِ اللَّهِ) ترقيق لام لفظ الجلالة لأنها سبقت براء مكسورة.',
    points: 25,
  },
  {
    id: 'sq-is-6',
    category: 'identify_surah',
    categoryLabel: 'في أي سورة وردت هذه الآية؟',
    juz: 1,
    surahName: 'البقرة',
    ayahNumber: 186,
    verseSnippet: '﴿وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ﴾',
    questionPrompt: 'في أي سورة وردت آية القرب وإجابة الدعاء: ﴿وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ...﴾؟',
    options: ['سورة البقرة', 'سورة آل عمران', 'سورة غافر', 'سورة الأنبياء'],
    correctOptionIndex: 0,
    modelAnswerText: 'سورة البقرة (الآية 186).',
    tajweedExplanation: '(عَنِّي) و(فَإِنِّي) نون مشددة تغن بمقدار حركتين مع مد طبيعي بعدها.',
    points: 25,
  },

  // ================= CATEGORY 3: أكمل بعد الآية المحددة (continue_after_ayah) =================
  {
    id: 'sq-cn-1',
    category: 'continue_after_ayah',
    categoryLabel: 'أكمل بعد الآية المحددة',
    juz: 30,
    surahName: 'الفجر',
    ayahNumber: 27,
    verseSnippet: '﴿يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ﴾',
    questionPrompt: 'ما هي الآيات الثلاث التي تلي قوله تعالى في سورة الفجر: ﴿يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ﴾؟',
    options: [
      '﴿ارْجِعِي إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً * فَادْخُلِي فِي عِبَادِي * وَادْخُلِي جَنَّتِي﴾',
      '﴿جَزَاؤُهُمْ عِندَ رَبِّهِمْ جَنَّاتُ عَدْنٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ﴾',
      '﴿فِي جَنَّةٍ عَالِيَةٍ * لَّا تَسْمَعُ فِيهَا لَاغِيَةً﴾',
      '﴿إِنَّ الْأَبْرَارَ لَفِي نَعِيمٍ * عَلَى الْأَرَائِكِ يَنظُرُونَ﴾',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿ارْجِعِي إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً * فَادْخُلِي فِي عِبَادِي * وَادْخُلِي جَنَّتِي﴾',
    tajweedExplanation: '(رَاضِيَةً مَّرْضِيَّةً) إدغام كامل بغنة للتنوين في الميم، و(فَادْخُلِي) قلقلة صغرى في الدال.',
    points: 25,
  },
  {
    id: 'sq-cn-2',
    category: 'continue_after_ayah',
    categoryLabel: 'أكمل بعد الآية المحددة',
    juz: 30,
    surahName: 'الضحى',
    ayahNumber: 3,
    verseSnippet: '﴿مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ﴾',
    questionPrompt: 'ما الآيتان اللتان تليان قوله تعالى في سورة الضحى: ﴿مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ﴾؟',
    options: [
      '﴿وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ * وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ﴾',
      '﴿أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ * وَوَجَدَكَ ضَالًّا فَهَدَىٰ﴾',
      '﴿فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ * وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ﴾',
      '﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا * إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ * وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ * أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ﴾',
    tajweedExplanation: '(خَيْرٌ لَّكَ) إدغام كامل بغير غنة للتنوين في اللام، وترقيق الراء في (خَيْرٌ) للياء الساكنة قبلها.',
    points: 25,
  },
  {
    id: 'sq-cn-3',
    category: 'continue_after_ayah',
    categoryLabel: 'أكمل بعد الآية المحددة',
    juz: 30,
    surahName: 'عبس',
    ayahNumber: 33,
    verseSnippet: '﴿فَإِذَا جَاءَتِ الصَّاخَّةُ﴾',
    questionPrompt: 'أكمل الآيات التي تلي قوله تعالى في سورة عبس: ﴿فَإِذَا جَاءَتِ الصَّاخَّةُ﴾:',
    options: [
      '﴿يَوْمَ يَفِرُّ الْمَرْءُ مِنْ أَخِيهِ * وَأُمِّهِ وَأَبِيهِ * وَصَاحِبَتِهِ وَبَنِيهِ﴾',
      '﴿يَوْمَ يَكُونُ النَّاسُ كَالْفَرَاشِ الْمَبْثُوثِ * وَتَكُونُ الْجِبَالُ كَالْعِهْنِ﴾',
      '﴿وُجُوهٌ يَوْمَئِذٍ مُّسْفِرَةٌ * ضَاحِكَةٌ مُّسْتَبْشِرَةٌ﴾',
      '﴿كَلَّا إِذَا دُكَّتِ الْأَرْضُ دَكًّا دَكًّا﴾',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿يَوْمَ يَفِرُّ الْمَرْءُ مِنْ أَخِيهِ * وَأُمِّهِ وَأَبِيهِ * وَصَاحِبَتِهِ وَبَنِيهِ * لِكُلِّ امْرِئٍ مِّنْهُمْ يَوْمَئِذٍ شَأْنٌ يُغْنِيهِ﴾',
    tajweedExplanation: '(الصَّاخَّةُ) مد لازم كلمي مثقل يمد 6 حركات لزوماً لوقوع الحرف المشدد بعد حرف المد.',
    points: 25,
  },
  {
    id: 'sq-cn-4',
    category: 'continue_after_ayah',
    categoryLabel: 'أكمل بعد الآية المحددة',
    juz: 29,
    surahName: 'الملك',
    ayahNumber: 13,
    verseSnippet: '﴿وَأَسِرُّوا قَوْلَكُمْ أَوِ اجْهَرُوا بِهِ ۖ إِنَّهُ عَلِيمٌ بِذَاتِ الصُّدُورِ﴾',
    questionPrompt: 'ما هي الآية التي تلي مباشرة قوله تعالى في سورة الملك: ﴿... إِنَّهُ عَلِيمٌ بِذَاتِ الصُّدُورِ﴾؟',
    options: [
      '﴿أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ﴾',
      '﴿هُوَ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ ذَلُولًا فَامْشُوا فِي مَنَاكِبِهَا﴾',
      '﴿أَأَمِنتُم مَّن فِي السَّمَاءِ أَن يَخْسِفَ بِكُمُ الْأَرْضَ﴾',
      '﴿قُلْ هُوَ الَّذِي أَنشَأَكُمْ وَجَعَلَ لَكُمُ السَّمْعَ وَالْأَبْصَارَ﴾',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '﴿أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ * هُوَ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ ذَلُولًا...﴾',
    tajweedExplanation: '(عَلِيمٌ بِذَاتِ) إقلاب للتنوين ميماً مخفاة بغنة حركتين لمجيء الباء بعده.',
    points: 25,
  },

  // ================= CATEGORY 4: تحديد أحكام التجويد ونوع المد (tajweed_and_madd) =================
  {
    id: 'sq-tj-1',
    category: 'tajweed_and_madd',
    categoryLabel: 'تحديد أحكام التجويد ونوع المد',
    juz: 30,
    surahName: 'الضحى',
    ayahNumber: 7,
    verseSnippet: '﴿وَوَجَدَكَ ضَالًّا فَهَدَىٰ﴾',
    questionPrompt: 'ما نوع المد ومقداره في كلمة ﴿ضَالًّا﴾ في سورة الضحى؟',
    options: [
      'مد لازم كلمي مثقل — يُمد 6 حركات لزوماً',
      'مد واجب متصل — يُمد 4 أو 5 حركات',
      'مد جائز منفصل — يُمد 2 أو 4 حركات',
      'مد عارض للسكون — يُمد 2 أو 4 أو 6 حركات',
    ],
    correctOptionIndex: 0,
    modelAnswerText: 'مد لازم كلمي مثقل (6 حركات لزوماً)؛ لأن حرف المد جاء بعده حرف مشدد (اللام المشددة) في كلمة واحدة.',
    tajweedExplanation: 'وفي (ضَالًّا فَهَدَىٰ) بعد المد اللازم يوجد إخفاء حقيقي للتنوين عند حرف الفاء بغنة مرققة حركتين.',
    points: 25,
  },
  {
    id: 'sq-tj-2',
    category: 'tajweed_and_madd',
    categoryLabel: 'تحديد أحكام التجويد ونوع المد',
    juz: 30,
    surahName: 'النبأ',
    ayahNumber: 1,
    verseSnippet: '﴿عَمَّ يَتَسَاءَلُونَ * عَنِ النَّبَإِ الْعَظِيمِ﴾',
    questionPrompt: 'ما الحكم التجويدي في الميم من كلمة ﴿عَمَّ﴾ وما نوع المد في ﴿يَتَسَاءَلُونَ﴾؟',
    options: [
      'ميم مشددة تغن حركتين + مد واجب متصل (4-5 حركات)',
      'إظهار شفوي للميم + مد جائز منفصل',
      'إدغام مثلين صغير + مد بدل حركتان',
      'إخفاء شفوي + مد لازم 6 حركات',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '(عَمَّ): ميم مشددة حكمها وجوب الغنة الأكمل بمقدار حركتين، و(يَتَسَاءَلُونَ): مد واجب متصل لاجتماع المد والهمز في كلمة واحدة.',
    tajweedExplanation: 'أصل (عَمَّ) هو (عَنْ مَا) فأدغمت النون في الميم وصارت ميماً مشددة وحذفت ألف (ما) الاستفهامية.',
    points: 25,
  },
  {
    id: 'sq-tj-3',
    category: 'tajweed_and_madd',
    categoryLabel: 'تحديد أحكام التجويد ونوع المد',
    juz: 30,
    surahName: 'الهمزة',
    ayahNumber: 4,
    verseSnippet: '﴿كَلَّا ۖ لَيُنبَذَنَّ فِي الْحُطَمَةِ﴾',
    questionPrompt: 'ما حكم النون الساكنة في كلمة ﴿لَيُنبَذَنَّ﴾ وما حكم النون الأخيرة المشددة؟',
    options: [
      'إقلاب النون الساكنة ميماً مخفاة بغنة عند الباء + غنة النون المشددة حركتين',
      'إخفاء حقيقي للنون الساكنة + إظهار حلقي',
      'إدغام بغنة ناقص + قلقلة كبرى',
      'إظهار مطلق للنون الساكنة في كلمة واحدة',
    ],
    correctOptionIndex: 0,
    modelAnswerText: 'إقلاب (قلب النون الساكنة ميماً مخفاة مع الغنة حركتين لمجيء الباء بعدها)، والنون المشددة تغن حركتين.',
    tajweedExplanation: 'علامة الإقلاب في رسم المصحف وضع ميم صغيرة قائمة (مـ) فوق النون الساكنة.',
    points: 25,
  },
  {
    id: 'sq-tj-4',
    category: 'tajweed_and_madd',
    categoryLabel: 'تحديد أحكام التجويد ونوع المد',
    juz: 30,
    surahName: 'الكافرون',
    ayahNumber: 1,
    verseSnippet: '﴿قُلْ يَا أَيُّهَا الْكَافِرُونَ * لَا أَعْبُدُ مَا تَعْبُدُونَ﴾',
    questionPrompt: 'ما نوع المد في قوله تعالى: ﴿يَا أَيُّهَا﴾ و ﴿لَا أَعْبُدُ﴾ برواية حفص عن عاصم؟',
    options: [
      'مد جائز منفصل — يُمد بمقدار 4 أو 5 حركات (من طريق الشاطبية)',
      'مد واجب متصل — لا يجوز قصره بحال',
      'مد صلة كبرى — خاص بهاء الضمير',
      'مد تمكين — بمقدار حركتين فقط',
    ],
    correctOptionIndex: 0,
    modelAnswerText: 'مد جائز منفصل؛ لأن حرف المد في آخر الكلمة الأولى والهمزة في أول الكلمة الثانية (ويا النداء وها التنبيه موصولتان رسماً في المصحف).',
    tajweedExplanation: 'يمد الجائز المنفصل عند حفص من طريق الشاطبية 4 أو 5 حركات (التوسط أو فويق التوسط).',
    points: 25,
  },
  {
    id: 'sq-tj-5',
    category: 'tajweed_and_madd',
    categoryLabel: 'تحديد أحكام التجويد ونوع المد',
    juz: 29,
    surahName: 'الحاقة',
    ayahNumber: 1,
    verseSnippet: '﴿الْحَاقَّةُ * مَا الْحَاقَّةُ﴾',
    questionPrompt: 'ما نوع المد في كلمة ﴿الْحَاقَّةُ﴾ وما حكم القاف عند الوقف عليها؟',
    options: [
      'مد لازم كلمي مثقل (6 حركات) + قلقلة كبرى مشددة عند الوقف على الحاقة بالسكون',
      'مد متصل (4 حركات) + همس القاف',
      'مد عارض للسكون + ترقيق القاف',
      'مد بدل + إدغام متجانسين',
    ],
    correctOptionIndex: 0,
    modelAnswerText: 'مد لازم كلمي مثقل (6 حركات) لوجود القاف المشددة بعد الألف، والتاء المربوطة تبدل هاءً ساكنة عند الوقف.',
    tajweedExplanation: 'القاف من حروف التفخيم (خص ضغط قظ) وفي أعلى مراتب التفخيم لأنها مفتوحة وبعدها ألف.',
    points: 25,
  },
  {
    id: 'sq-tj-6',
    category: 'tajweed_and_madd',
    categoryLabel: 'تحديد أحكام التجويد ونوع المد',
    juz: 30,
    surahName: 'القدر',
    ayahNumber: 1,
    verseSnippet: '﴿إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ﴾',
    questionPrompt: 'استخرج الأحكام التجويدية المرتبة في قوله تعالى: ﴿إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ﴾:',
    options: [
      'غنة النون المشددة + مد منفصل + إخفاء النون عند الزاي + قلقلة الدال في (القدر)',
      'إدغام بغير غنة + مد متصل + إظهار حلقي للنون',
      'إقلاب النون + مد لازم 6 حركات + تفخيم الدال',
      'إخفاء شفوي + مد صلة كبرى + سكت واجب',
    ],
    correctOptionIndex: 0,
    modelAnswerText: '١) إِنَّا: نون مشددة حركتان ومد منفصل مع الهمزة، ٢) أَنزَلْنَاهُ: إخفاء حقيقي للنون عند الزاي وإظهار للام الفعل، ٣) الْقَدْرِ: قلقلة صغرى للدال وترقيق الراء عند الوقف.',
    tajweedExplanation: 'عند الوقف على (الْقَدْرِ) بالسكون ترقق الراء لأنها سكنت للوقف وقبلها ساكن مستفل (الدال) وقبله فتح؟ لا، قبل الدال فتحة (القَدر) فتفخم الراء عند الجمهور، وترقق في (مِصْر) و(القِطْر).',
    points: 25,
  },
];

export function generateSmartQuizQuestions(params: {
  scope: 'juz30' | 'juz29' | 'juz28' | 'student_memorized' | 'all';
  categories: SmartQuizQuestionCategory[];
  count: number;
  student?: Student;
}): SmartQuizQuestion[] {
  const { scope, categories, count, student } = params;
  const activeCats: SmartQuizQuestionCategory[] =
    categories.length > 0
      ? categories
      : [
          'complete_ayah',
          'identify_surah',
          'continue_after_ayah',
          'tajweed_and_madd',
        ];

  let pool = SMART_QUIZ_QUESTIONS_BANK.filter((q) =>
    activeCats.includes(q.category)
  );

  if (scope === 'juz30') {
    pool = pool.filter((q) => q.juz === 30);
  } else if (scope === 'juz29') {
    pool = pool.filter((q) => q.juz === 29 || q.juz === 30);
  } else if (scope === 'juz28') {
    pool = pool.filter((q) => q.juz >= 28);
  } else if (scope === 'student_memorized' && student) {
    const memSurahNames = new Set(
      student.memorizedSurahs
        .map((id) => SURAHS.find((s) => s.id === id)?.name)
        .filter(Boolean)
    );
    const matching = pool.filter((q) => memSurahNames.has(q.surahName));
    if (matching.length >= 2) {
      pool = matching;
    }
  }

  if (pool.length === 0) {
    pool = [...SMART_QUIZ_QUESTIONS_BANK];
  }

  // Shuffle deterministically-random and pick balanced across selected categories
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));
  const pointsPerQ = Math.round(100 / Math.max(1, picked.length));

  return picked.map((q, idx) => ({
    ...q,
    id: `${q.id}-gen-${Date.now()}-${idx}`,
    points: pointsPerQ,
  }));
}

export function buildInitialPeerCompetitions(students: Student[]): PeerCompetitionPack[] {
  const s1 = students[0];
  const s2 = students[1] || students[0];
  const s3 = students[2] || students[0];
  const s4 = students[3] || students[0];

  const juz30Questions = SMART_QUIZ_QUESTIONS_BANK.filter((q) => q.juz === 30).slice(0, 4);
  const juz29Questions = SMART_QUIZ_QUESTIONS_BANK.filter((q) => q.juz >= 29).slice(0, 4);

  return [
    {
      id: 'comp-pack-juz30-champions',
      title: '🏆 مسابقة فرسان جزء عمّ والتجويد التطبيقية',
      description:
        'حقيبة اختبارية تنافسية شاملة لطلاب الحلقات في إكمال الآيات، معرفة السور، وأحكام التجويد والمدود في جزء عمّ.',
      targetLevel: 'الكل',
      scopeLabel: 'جزء عمّ (الثلاثون) + التجويد',
      questions: juz30Questions,
      timeLimitSeconds: 120,
      xpRewardFirst: 150,
      xpRewardParticipant: 60,
      badgeTitle: '🏆 كأس فرسان جزء عمّ',
      status: 'نشطة',
      createdAt: getLocalDateString(-2),
      submissions: [
        ...(s1
          ? [
              {
                id: 'sub-seed-1',
                competitionId: 'comp-pack-juz30-champions',
                studentId: s1.id,
                studentName: s1.name,
                circleName: s1.circle,
                level: s1.level,
                score: 100,
                correctCount: 4,
                totalQuestions: 4,
                timeSeconds: 34,
                compositeRankPoints: 186,
                awardedCup: '🏆 الكأس الذهبي' as const,
                completedAt: getLocalDateString(-1),
              },
            ]
          : []),
        ...(s2 && s2.id !== s1?.id
          ? [
              {
                id: 'sub-seed-2',
                competitionId: 'comp-pack-juz30-champions',
                studentId: s2.id,
                studentName: s2.name,
                circleName: s2.circle,
                level: s2.level,
                score: 100,
                correctCount: 4,
                totalQuestions: 4,
                timeSeconds: 48,
                compositeRankPoints: 172,
                awardedCup: '🥈 الكأس الفضي' as const,
                completedAt: getLocalDateString(-1),
              },
            ]
          : []),
        ...(s3 && s3.id !== s2?.id
          ? [
              {
                id: 'sub-seed-3',
                competitionId: 'comp-pack-juz30-champions',
                studentId: s3.id,
                studentName: s3.name,
                circleName: s3.circle,
                level: s3.level,
                score: 75,
                correctCount: 3,
                totalQuestions: 4,
                timeSeconds: 41,
                compositeRankPoints: 134,
                awardedCup: '🥉 الكأس البرونزي' as const,
                completedAt: getLocalDateString(0),
              },
            ]
          : []),
      ],
    },
    {
      id: 'comp-pack-tabarak-mutashabihat',
      title: '⚡ تحدي الإتقان السريع: جزء تبارك وأحكام المدود',
      description:
        'تحدٍ تنافسي لقياس سرعة البديهة القرآنية وضبط أواخر الآيات والمد اللازم والمنفصل لطلاب المستوى المتوسط والمتقدم.',
      targetLevel: 'متوسط',
      scopeLabel: 'جزء تبارك وعمّ (29 - 30)',
      questions: juz29Questions,
      timeLimitSeconds: 90,
      xpRewardFirst: 200,
      xpRewardParticipant: 80,
      badgeTitle: '🏆 وسام الإتقان والبديهة القرآنية',
      status: 'نشطة',
      createdAt: getLocalDateString(-1),
      submissions: [
        ...(s4
          ? [
              {
                id: 'sub-seed-4',
                competitionId: 'comp-pack-tabarak-mutashabihat',
                studentId: s4.id,
                studentName: s4.name,
                circleName: s4.circle,
                level: s4.level,
                score: 100,
                correctCount: 4,
                totalQuestions: 4,
                timeSeconds: 39,
                compositeRankPoints: 181,
                awardedCup: '🏆 الكأس الذهبي' as const,
                completedAt: getLocalDateString(0),
              },
            ]
          : []),
      ],
    },
  ];
}

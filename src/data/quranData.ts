export interface SurahMeta {
  id: number;
  name: string;
  ayahs: number;
  type: 'مكية' | 'مدنية';
  juz: number;
}

export const SURAHS: SurahMeta[] = [
  { id: 1, name: 'الفاتحة', ayahs: 7, type: 'مكية', juz: 1 },
  { id: 2, name: 'البقرة', ayahs: 286, type: 'مدنية', juz: 1 },
  { id: 3, name: 'آل عمران', ayahs: 200, type: 'مدنية', juz: 3 },
  { id: 4, name: 'النساء', ayahs: 176, type: 'مدنية', juz: 4 },
  { id: 5, name: 'المائدة', ayahs: 120, type: 'مدنية', juz: 6 },
  { id: 6, name: 'الأنعام', ayahs: 165, type: 'مكية', juz: 7 },
  { id: 7, name: 'الأعراف', ayahs: 206, type: 'مكية', juz: 8 },
  { id: 8, name: 'الأنفال', ayahs: 75, type: 'مدنية', juz: 9 },
  { id: 9, name: 'التوبة', ayahs: 129, type: 'مدنية', juz: 10 },
  { id: 10, name: 'يونس', ayahs: 109, type: 'مكية', juz: 11 },
  { id: 11, name: 'هود', ayahs: 123, type: 'مكية', juz: 11 },
  { id: 12, name: 'يوسف', ayahs: 111, type: 'مكية', juz: 12 },
  { id: 13, name: 'الرعد', ayahs: 43, type: 'مدنية', juz: 13 },
  { id: 14, name: 'إبراهيم', ayahs: 52, type: 'مكية', juz: 13 },
  { id: 15, name: 'الحجر', ayahs: 99, type: 'مكية', juz: 14 },
  { id: 16, name: 'النحل', ayahs: 128, type: 'مكية', juz: 14 },
  { id: 17, name: 'الإسراء', ayahs: 111, type: 'مكية', juz: 15 },
  { id: 18, name: 'الكهف', ayahs: 110, type: 'مكية', juz: 15 },
  { id: 19, name: 'مريم', ayahs: 98, type: 'مكية', juz: 16 },
  { id: 20, name: 'طه', ayahs: 135, type: 'مكية', juz: 16 },
  { id: 21, name: 'الأنبياء', ayahs: 112, type: 'مكية', juz: 17 },
  { id: 22, name: 'الحج', ayahs: 78, type: 'مدنية', juz: 17 },
  { id: 23, name: 'المؤمنون', ayahs: 118, type: 'مكية', juz: 18 },
  { id: 24, name: 'النور', ayahs: 64, type: 'مدنية', juz: 18 },
  { id: 25, name: 'الفرقان', ayahs: 77, type: 'مكية', juz: 18 },
  { id: 26, name: 'الشعراء', ayahs: 227, type: 'مكية', juz: 19 },
  { id: 27, name: 'النمل', ayahs: 93, type: 'مكية', juz: 19 },
  { id: 28, name: 'القصص', ayahs: 88, type: 'مكية', juz: 20 },
  { id: 29, name: 'العنكبوت', ayahs: 69, type: 'مكية', juz: 20 },
  { id: 30, name: 'الروم', ayahs: 60, type: 'مكية', juz: 21 },
  { id: 31, name: 'لقمان', ayahs: 34, type: 'مكية', juz: 21 },
  { id: 32, name: 'السجدة', ayahs: 30, type: 'مكية', juz: 21 },
  { id: 33, name: 'الأحزاب', ayahs: 73, type: 'مدنية', juz: 21 },
  { id: 34, name: 'سبأ', ayahs: 54, type: 'مكية', juz: 22 },
  { id: 35, name: 'فاطر', ayahs: 45, type: 'مكية', juz: 22 },
  { id: 36, name: 'يس', ayahs: 83, type: 'مكية', juz: 22 },
  { id: 37, name: 'الصافات', ayahs: 182, type: 'مكية', juz: 23 },
  { id: 38, name: 'ص', ayahs: 88, type: 'مكية', juz: 23 },
  { id: 39, name: 'الزمر', ayahs: 75, type: 'مكية', juz: 23 },
  { id: 40, name: 'غافر', ayahs: 85, type: 'مكية', juz: 24 },
  { id: 41, name: 'فصلت', ayahs: 54, type: 'مكية', juz: 24 },
  { id: 42, name: 'الشورى', ayahs: 53, type: 'مكية', juz: 25 },
  { id: 43, name: 'الزخرف', ayahs: 89, type: 'مكية', juz: 25 },
  { id: 44, name: 'الدخان', ayahs: 59, type: 'مكية', juz: 25 },
  { id: 45, name: 'الجاثية', ayahs: 37, type: 'مكية', juz: 25 },
  { id: 46, name: 'الأحقاف', ayahs: 35, type: 'مكية', juz: 26 },
  { id: 47, name: 'محمد', ayahs: 38, type: 'مدنية', juz: 26 },
  { id: 48, name: 'الفتح', ayahs: 29, type: 'مدنية', juz: 26 },
  { id: 49, name: 'الحجرات', ayahs: 18, type: 'مدنية', juz: 26 },
  { id: 50, name: 'ق', ayahs: 45, type: 'مكية', juz: 26 },
  { id: 51, name: 'الذاريات', ayahs: 60, type: 'مكية', juz: 26 },
  { id: 52, name: 'الطور', ayahs: 49, type: 'مكية', juz: 27 },
  { id: 53, name: 'النجم', ayahs: 62, type: 'مكية', juz: 27 },
  { id: 54, name: 'القمر', ayahs: 55, type: 'مكية', juz: 27 },
  { id: 55, name: 'الرحمن', ayahs: 78, type: 'مدنية', juz: 27 },
  { id: 56, name: 'الواقعة', ayahs: 96, type: 'مكية', juz: 27 },
  { id: 57, name: 'الحديد', ayahs: 29, type: 'مدنية', juz: 27 },
  { id: 58, name: 'المجادلة', ayahs: 22, type: 'مدنية', juz: 28 },
  { id: 59, name: 'الحشر', ayahs: 24, type: 'مدنية', juz: 28 },
  { id: 60, name: 'الممتحنة', ayahs: 13, type: 'مدنية', juz: 28 },
  { id: 61, name: 'الصف', ayahs: 14, type: 'مدنية', juz: 28 },
  { id: 62, name: 'الجمعة', ayahs: 11, type: 'مدنية', juz: 28 },
  { id: 63, name: 'المنافقون', ayahs: 11, type: 'مدنية', juz: 28 },
  { id: 64, name: 'التغابن', ayahs: 18, type: 'مدنية', juz: 28 },
  { id: 65, name: 'الطلاق', ayahs: 12, type: 'مدنية', juz: 28 },
  { id: 66, name: 'التحريم', ayahs: 12, type: 'مدنية', juz: 28 },
  { id: 67, name: 'الملك', ayahs: 30, type: 'مكية', juz: 29 },
  { id: 68, name: 'القلم', ayahs: 52, type: 'مكية', juz: 29 },
  { id: 69, name: 'الحاقة', ayahs: 52, type: 'مكية', juz: 29 },
  { id: 70, name: 'المعارج', ayahs: 44, type: 'مكية', juz: 29 },
  { id: 71, name: 'نوح', ayahs: 28, type: 'مكية', juz: 29 },
  { id: 72, name: 'الجن', ayahs: 28, type: 'مكية', juz: 29 },
  { id: 73, name: 'المزمل', ayahs: 20, type: 'مكية', juz: 29 },
  { id: 74, name: 'المدثر', ayahs: 56, type: 'مكية', juz: 29 },
  { id: 75, name: 'القيامة', ayahs: 40, type: 'مكية', juz: 29 },
  { id: 76, name: 'الإنسان', ayahs: 31, type: 'مدنية', juz: 29 },
  { id: 77, name: 'المرسلات', ayahs: 50, type: 'مكية', juz: 29 },
  { id: 78, name: 'النبأ', ayahs: 40, type: 'مكية', juz: 30 },
  { id: 79, name: 'النازعات', ayahs: 46, type: 'مكية', juz: 30 },
  { id: 80, name: 'عبس', ayahs: 42, type: 'مكية', juz: 30 },
  { id: 81, name: 'التكوير', ayahs: 29, type: 'مكية', juz: 30 },
  { id: 82, name: 'الانفطار', ayahs: 19, type: 'مكية', juz: 30 },
  { id: 83, name: 'المطففين', ayahs: 36, type: 'مكية', juz: 30 },
  { id: 84, name: 'الانشقاق', ayahs: 25, type: 'مكية', juz: 30 },
  { id: 85, name: 'البروج', ayahs: 22, type: 'مكية', juz: 30 },
  { id: 86, name: 'الطارق', ayahs: 17, type: 'مكية', juz: 30 },
  { id: 87, name: 'الأعلى', ayahs: 19, type: 'مكية', juz: 30 },
  { id: 88, name: 'الغاشية', ayahs: 26, type: 'مكية', juz: 30 },
  { id: 89, name: 'الفجر', ayahs: 30, type: 'مكية', juz: 30 },
  { id: 90, name: 'البلد', ayahs: 20, type: 'مكية', juz: 30 },
  { id: 91, name: 'الشمس', ayahs: 15, type: 'مكية', juz: 30 },
  { id: 92, name: 'الليل', ayahs: 21, type: 'مكية', juz: 30 },
  { id: 93, name: 'الضحى', ayahs: 11, type: 'مكية', juz: 30 },
  { id: 94, name: 'الشرح', ayahs: 8, type: 'مكية', juz: 30 },
  { id: 95, name: 'التين', ayahs: 8, type: 'مكية', juz: 30 },
  { id: 96, name: 'العلق', ayahs: 19, type: 'مكية', juz: 30 },
  { id: 97, name: 'القدر', ayahs: 5, type: 'مكية', juz: 30 },
  { id: 98, name: 'البينة', ayahs: 8, type: 'مدنية', juz: 30 },
  { id: 99, name: 'الزلزلة', ayahs: 8, type: 'مدنية', juz: 30 },
  { id: 100, name: 'العاديات', ayahs: 11, type: 'مكية', juz: 30 },
  { id: 101, name: 'القارعة', ayahs: 11, type: 'مكية', juz: 30 },
  { id: 102, name: 'التكاثر', ayahs: 8, type: 'مكية', juz: 30 },
  { id: 103, name: 'العصر', ayahs: 3, type: 'مكية', juz: 30 },
  { id: 104, name: 'الهمزة', ayahs: 9, type: 'مكية', juz: 30 },
  { id: 105, name: 'الفيل', ayahs: 5, type: 'مكية', juz: 30 },
  { id: 106, name: 'قريش', ayahs: 4, type: 'مكية', juz: 30 },
  { id: 107, name: 'الماعون', ayahs: 7, type: 'مكية', juz: 30 },
  { id: 108, name: 'الكوثر', ayahs: 3, type: 'مكية', juz: 30 },
  { id: 109, name: 'الكافرون', ayahs: 6, type: 'مكية', juz: 30 },
  { id: 110, name: 'النصر', ayahs: 3, type: 'مدنية', juz: 30 },
  { id: 111, name: 'المسد', ayahs: 5, type: 'مكية', juz: 30 },
  { id: 112, name: 'الإخلاص', ayahs: 4, type: 'مكية', juz: 30 },
  { id: 113, name: 'الفلق', ayahs: 5, type: 'مكية', juz: 30 },
  { id: 114, name: 'الناس', ayahs: 6, type: 'مكية', juz: 30 },
];

export const JUZ_NAMES: string[] = [
  'جزء ألم (الأول)',
  'جزء سيقول (الثاني)',
  'جزء تلك الرسل (الثالث)',
  'جزء لن تنالوا (الرابع)',
  'جزء والمحصنات (الخامس)',
  'جزء لا يحب الله (السادس)',
  'جزء وإذا سمعوا (السابع)',
  'جزء ولو أننا (الثامن)',
  'جزء قال الملأ (التاسع)',
  'جزء واعلموا (العاشر)',
  'جزء يعتذرون (الحادي عشر)',
  'جزء وما من دابة (الثاني عشر)',
  'جزء وما أبرئ (الثالث عشر)',
  'جزء ربما (الرابع عشر)',
  'جزء سبحان الذي (الخامس عشر)',
  'جزء قال ألم (السادس عشر)',
  'جزء اقترب للناس (السابع عشر)',
  'جزء قد أفلح (الثامن عشر)',
  'جزء وقال الذين (التاسع عشر)',
  'جزء أمن خلق (العشرون)',
  'جزء اتل ما أوحي (الحادي والعشرون)',
  'جزء ومن يقنت (الثاني والعشرون)',
  'جزء وما لي (الثالث والعشرون)',
  'جزء فمن أظلم (الرابع والعشرون)',
  'جزء إليه يرد (الخامس والعشرون)',
  'جزء حم (السادس والعشرون)',
  'جزء قال فما خطبكم (السابع والعشرون)',
  'جزء قد سمع (الثامن والعشرون)',
  'جزء تبارك (التاسع والعشرون)',
  'جزء عمّ (الثلاثون)',
];

export const JUZ_SCOPES = [
  { value: 'full', label: 'الجزء كاملاً (حزبان - 8 أرباع)' },
  { value: 'hizb1', label: 'الحزب الأول (4 أرباع)' },
  { value: 'hizb2', label: 'الحزب الثاني (4 أرباع)' },
  { value: 'q1', label: 'الربع الأول (1/8)' },
  { value: 'q2', label: 'الربع الثاني (2/8)' },
  { value: 'q3', label: 'الربع الثالث (3/8)' },
  { value: 'q4', label: 'الربع الرابع (4/8)' },
  { value: 'q5', label: 'الربع الخامس (5/8)' },
  { value: 'q6', label: 'الربع السادس (6/8)' },
  { value: 'q7', label: 'الربع السابع (7/8)' },
  { value: 'q8', label: 'الربع الثامن (8/8)' },
] as const;

export const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const RECITERS = [
  { id: 'Husary_128kbps', name: 'الحصري مرتل (الشيخ محمود خليل الحصري)' },
  { id: 'Husary_Muallim_128kbps', name: 'الحصري المصحف المعلم (مع ترديد التلقين)' },
  { id: 'Minshawy_Murattal_128kbps', name: 'المنشاوي مرتل (الشيخ محمد صديق المنشاوي)' },
  { id: 'Minshawy_Teacher_128kbps', name: 'المنشاوي المصحف المعلم (تحفيظ وتلقين)' },
  { id: 'Alafasy_128kbps', name: 'مشاري العفاسي (الشيخ مشاري راشد العفاسي)' },
  { id: 'MaherAlMuaiqly128kbps', name: 'ماهر المعيقلي (الشيخ ماهر بن حمد المعيقلي)' },
] as const;

export interface AyahEntry {
  ayah: number;
  text: string;
  tafsir: string;
  meanings: Record<string, string>;
}

// Embedded Uthmani text and Tafsir Al-Muyassar for instant offline work
export const EMBEDDED_SURAH_CONTENT: Record<number, AyahEntry[]> = {
  1: [
    {
      ayah: 1,
      text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      tafsir: 'أبدأ قراءتي مستعيناً بالله المتصف بالرحمة الواسعة والواصلة لعباده.',
      meanings: { 'ٱلرَّحْمَٰنِ': 'ذي الرحمة الواسعة لجميع الخلق', 'ٱلرَّحِيمِ': 'الراحم بالمؤمنين خاصة' },
    },
    {
      ayah: 2,
      text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
      tafsir: 'الثناء الكامل لله وحده خالق الخلق ومالكهم ومدبر شؤونهم.',
      meanings: { 'ٱلْحَمْدُ': 'الثناء بالكمال مع المحبة والتعظيم', 'ٱلْعَٰلَمِينَ': 'كل ما سوى الله من المخلوقات' },
    },
    {
      ayah: 3,
      text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      tafsir: 'الذي وسعت رحمته كل شيء وخص المؤمنين برحمته.',
      meanings: { 'ٱلرَّحْمَٰنِ': 'الرحيم بجميع خلقه' },
    },
    {
      ayah: 4,
      text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ',
      tafsir: 'المتصرف وحده في يوم القيامة والحساب والجزاء.',
      meanings: { 'يَوْمِ ٱلدِّينِ': 'يوم الجزاء والحساب' },
    },
    {
      ayah: 5,
      text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      tafsir: 'نخصك وحدك بالعبادة والطاعة، ونطلب العون منك وحدك في كل أمورنا.',
      meanings: { 'نَعْبُدُ': 'نطيع ونخضع خضوعاً كاملاً', 'نَسْتَعِينُ': 'نطلب المعونة والتوفيق' },
    },
    {
      ayah: 6,
      text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
      tafsir: 'دلّنا وأرشدنا وثبتنا على الطريق الواضح الذي لا اعوجاج فيه وهو الإسلام.',
      meanings: { 'ٱهْدِنَا': 'أرشدنا وثبتنا', 'ٱلصِّرَٰطَ': 'الطريق الواضح' },
    },
    {
      ayah: 7,
      text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
      tafsir: 'طريق النبيين والصديقين والشهداء والصالحين، غير طريق من عرفوا الحق وتركوه ولا من ضلوا عنه عن جهل.',
      meanings: { 'أَنْعَمْتَ عَلَيْهِمْ': 'بالهداية والتوفيق', 'ٱلضَّآلِّينَ': 'التائهين عن طريق الحق' },
    },
  ],
  2: [
    {
      ayah: 1,
      text: 'الٓمٓ',
      tafsir: 'حروف مقطعة في أوائل السور للإشارة إلى إعجاز القرآن الكريم.',
      meanings: { 'الٓمٓ': 'حروف مقطعة الله أعلم بمراده بها' },
    },
    {
      ayah: 2,
      text: 'ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ',
      tafsir: 'هذا القرآن العظيم لا شك فيه أنه من عند الله، وهو هداية ونور للمتقين.',
      meanings: { 'لَا رَيْبَ': 'لا شك ولا مرية', 'لِّلْمُتَّقِينَ': 'الذين يتقون الله بامتثال أوامره واجتناب نواهيه' },
    },
    {
      ayah: 3,
      text: 'ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَٰهُمْ يُنفِقُونَ',
      tafsir: 'الذين يصدقون بما غاب عن حواسهم مما أخبر الله به، ويؤدون الصلاة بأركانها وخشوعها، وينفقون في سبيل الله.',
      meanings: { 'بِٱلْغَيْبِ': 'ما غاب عن العيون كالملائكة واليوم الآخر', 'يُقِيمُونَ': 'يؤدونها تامة في أوقاتها' },
    },
    {
      ayah: 4,
      text: 'وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْأٓخِرَةِ هُمْ يُوقِنُونَ',
      tafsir: 'والذين يصدقون بالقرآن المنزل عليك وبما أنزل على الرسل قبلك، ويوقنون بالدار الآخرة.',
      meanings: { 'يُوقِنُونَ': 'يعلمون علماً جازماً لا شك فيه' },
    },
    {
      ayah: 5,
      text: 'أُوْلَٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُوْلَٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ',
      tafsir: 'أولئك المتصفون بهذه الصفات على نور وتوفيق من ربهم، وهم الفائزون بمطلوبهم الناجون من الشر.',
      meanings: { 'ٱلْمُفْلِحُونَ': 'الفائزون بالجنة والناجون من النار' },
    },
  ],
  18: [
    {
      ayah: 1,
      text: 'ٱلْحَمْدُ لِلَّهِ ٱلَّذِىٓ أَنزَلَ عَلَىٰ عَبْدِهِ ٱلْكِتَٰبَ وَلَمْ يَجْعَل لَّهُۥ عِوَجَا ۜ',
      tafsir: 'الثناء على الله الذي أنزل على عبده محمد القرآن الكريم مستقيماً لا اختلاف فيه ولا تناقض.',
      meanings: { 'عِوَجَا': 'اعوجاجاً أو ميلاً عن الحق' },
    },
    {
      ayah: 2,
      text: 'قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ ٱلْمُؤْمِنِينَ ٱلَّذِينَ يَعْمَلُونَ ٱلصَّٰلِحَٰتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا',
      tafsir: 'مستقيماً ليحذر الكافرين من عذاب شديد من عنده، ويبشر المؤمنين العاملين للصالحات بالثواب العظيم.',
      meanings: { 'قَيِّمًا': 'مستقيماً معتدلاً', 'بَأْسًا': 'عذاباً' },
    },
    {
      ayah: 3,
      text: 'مَّٰكِثِينَ فِيهِ أَبَدًا',
      tafsir: 'ماكثين في هذا النعيم والثواب إقامة دائمة لا تنقطع.',
      meanings: { 'مَّٰكِثِينَ': 'مقيمين دائماً' },
    },
  ],
  67: [
    {
      ayah: 1,
      text: 'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ',
      tafsir: 'تعاظم وكثر خير الله الذي بيده ملك السماوات والأرض والتصرف فيهما وهو على كل شيء قدير.',
      meanings: { 'تَبَٰرَكَ': 'تعاظم وتقدس وكثر خيره', 'بِيَدِهِ ٱلْمُلْكُ': 'السلطان والتصرف المطلق' },
    },
    {
      ayah: 2,
      text: 'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ',
      tafsir: 'الذي قدر الموت والحياة ليختبركم أيها الناس أيكم أخلص عملاً وأصوبه على السنة.',
      meanings: { 'لِيَبْلُوَكُمْ': 'ليختبركم ويمتحنكم', 'أَحْسَنُ عَمَلًا': 'أخلصه وأصوبه' },
    },
    {
      ayah: 3,
      text: 'ٱلَّذِى خَلَقَ سَبْعَ سَمَٰوَٰتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَٰنِ مِن تَفَٰوُتٍ ۖ فَٱرْجِعِ ٱلْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ',
      tafsir: 'الذي خلق سبع سماوات بعضها فوق بعض متطابقة، لا ترى في خلقه من خلل أو اضطراب.',
      meanings: { 'طِبَاقًا': 'بعضها فوق بعض', 'تَفَٰوُتٍ': 'اختلاف أو عدم تناسب', 'فُطُورٍ': 'شقوق وصدوع' },
    },
  ],
  78: [
    {
      ayah: 1,
      text: 'عَمَّ يَتَسَآءَلُونَ',
      tafsir: 'عن أي شيء يتساءل كفار قريش؟',
      meanings: { 'عَمَّ': 'عن أي شيء' },
    },
    {
      ayah: 2,
      text: 'عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ',
      tafsir: 'يتساءلون عن الخبر العظيم الشأن وهو القرآن والبعث بعد الموت.',
      meanings: { 'ٱلنَّبَإِ ٱلْعَظِيمِ': 'الخبر الهائل وهو البعث والقرآن' },
    },
    {
      ayah: 3,
      text: 'ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ',
      tafsir: 'الذي هم فيه مختلفون بين مصدق ومكذب.',
      meanings: { 'مُخْتَلِفُونَ': 'بين مؤمن به وجاحد له' },
    },
    {
      ayah: 4,
      text: 'كَلَّا سَيَعْلَمُونَ',
      tafsir: 'حقاً سيعلمون عاقبة تكذيبهم حين ينكشف لهم الحق يوم القيامة.',
      meanings: { 'كَلَّا': 'ردع وزجر عن الشك' },
    },
    {
      ayah: 5,
      text: 'ثُمَّ كَلَّا سَيَعْلَمُونَ',
      tafsir: 'تأكيد بعد تأكيد بأنهم سيعلمون صدق ما جاء به الرسول صلى الله عليه وسلم.',
      meanings: { 'سَيَعْلَمُونَ': 'عند معاينة العذاب' },
    },
    {
      ayah: 6,
      text: 'أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَٰدًا',
      tafsir: 'ألم نجعل الأرض ممهدة لكم كالفراش لتستقروا عليها؟',
      meanings: { 'مِهَٰدًا': 'فراشاً ممهدة للعيش' },
    },
    {
      ayah: 7,
      text: 'وَٱلْجِبَالَ أَوْتَادًا',
      tafsir: 'وجعلنا الجبال أوتاداً تثبت الأرض لئلا تضطرب بكم.',
      meanings: { 'أَوْتَادًا': 'كالأوتاد التي تثبت الخيمة' },
    },
  ],
  87: [
    {
      ayah: 1,
      text: 'سَبِّحِ ٱسْمَ رَبِّكَ ٱلْأَعْلَى',
      tafsir: 'نزّه اسم ربك الأعلى عن كل ما لا يليق بعظمته وجلاله.',
      meanings: { 'سَبِّحِ': 'نزّه وعظّم', 'ٱلْأَعْلَى': 'المتعالي فوق كل شيء' },
    },
    {
      ayah: 2,
      text: 'ٱلَّذِى خَلَقَ فَسَوَّىٰ',
      tafsir: 'الذي خلق المخلوقات فأتقن خلقها وأحسن تصويرها.',
      meanings: { 'فَسَوَّىٰ': 'عدل الخلقة وأتقنها' },
    },
    {
      ayah: 3,
      text: 'وَٱلَّذِى قَدَّرَ فَهَدَىٰ',
      tafsir: 'والذي قدّر لكل مخلوق ما يصلحه فهداه إليه.',
      meanings: { 'قَدَّرَ': 'قدر الأرزاق والآجال', 'فَهَدَىٰ': 'أرشد كل مخلوق لمعاشه' },
    },
    {
      ayah: 4,
      text: 'وَٱلَّذِىٓ أَخْرَجَ ٱلْمَرْعَىٰ',
      tafsir: 'والذي أنبت العشب والكلأ الأخضر لرعي الدواب.',
      meanings: { 'ٱلْمَرْعَىٰ': 'النبات والعشب الأخضر' },
    },
    {
      ayah: 5,
      text: 'فَجَعَلَهُۥ غُثَآءً أَحْوَىٰ',
      tafsir: 'فجعله بعد خضرته يابساً هشيماً أسود.',
      meanings: { 'غُثَآءً': 'هشيماً جافاً', 'أَحْوَىٰ': 'مائلاً للسواد بعد الخضرة' },
    },
    {
      ayah: 6,
      text: 'سَنُقْرِئُكَ فَلَا تَنسَىٰٓ',
      tafsir: 'سنقرئك يا محمد هذا القرآن ونحفظه في صدرك فلا تنساه.',
      meanings: { 'سَنُقْرِئُكَ': 'سنجمع القرآن في صدرك' },
    },
  ],
  93: [
    {
      ayah: 1,
      text: 'وَٱلضُّحَىٰ',
      tafsir: 'أقسم الله بوقت الضحى ونور النهار.',
      meanings: { 'وَٱلضُّحَىٰ': 'أول النهار حين ترتفع الشمس' },
    },
    {
      ayah: 2,
      text: 'وَٱلَّيْلِ إِذَا سَجَىٰ',
      tafsir: 'وبالليل إذا سكن وغطى ظلامه الكون.',
      meanings: { 'سَجَىٰ': 'سكن وهدأ واشتد ظلامه' },
    },
    {
      ayah: 3,
      text: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
      tafsir: 'ما تركك ربك يا محمد وما أبغضك منذ أحبك.',
      meanings: { 'مَا وَدَّعَكَ': 'ما تركك', 'وَمَا قَلَىٰ': 'وما أبغضك' },
    },
    {
      ayah: 4,
      text: 'وَلَلْأٓخِرَةُ خَيْرٌ لَّكَ مِنَ ٱلْأُولَىٰ',
      tafsir: 'وللدار الآخرة وما أعد الله لك فيها من الكرامة خير لك من الدنيا.',
      meanings: { 'ٱلْأُولَىٰ': 'الحياة الدنيا' },
    },
    {
      ayah: 5,
      text: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ',
      tafsir: 'ولسوف يمنحك ربك من النصر والشفاعة والكرامة حتى ترضى.',
      meanings: { 'فَتَرْضَىٰٓ': 'رضاً تاماً في الدنيا والآخرة' },
    },
  ],
  97: [
    {
      ayah: 1,
      text: 'إِنَّآ أَنزَلْنَٰهُ فِى لَيْلَةِ ٱلْقَدْرِ',
      tafsir: 'إنا أنزلنا القرآن الكريم في ليلة الشرف والعظمة من شهر رمضان.',
      meanings: { 'لَيْلَةِ ٱلْقَدْرِ': 'ليلة الشرف والتقدير' },
    },
    {
      ayah: 2,
      text: 'وَمَآ أَدْرَىٰكَ مَا لَيْلَةُ ٱلْقَدْرِ',
      tafsir: 'وما أعلمك يا محمد ما شأن ليلة القدر وعظيم فضلها؟',
      meanings: { 'أَدْرَىٰكَ': 'أعلمك بعظيم منزلتها' },
    },
    {
      ayah: 3,
      text: 'لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ',
      tafsir: 'العمل الصالح في ليلة القدر خير من العمل في ألف شهر ليس فيها ليلة القدر.',
      meanings: { 'أَلْفِ شَهْرٍ': 'أكثر من ثلاث وثمانين سنة' },
    },
    {
      ayah: 4,
      text: 'تَنَزَّلُ ٱلْمَلَٰٓئِكَةُ وَٱلرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ',
      tafsir: 'يكثر نزول الملائكة وجبريل عليه السلام فيها بإذن ربهم بكل أمر قضاه الله لتلك السنة.',
      meanings: { 'وَٱلرُّوحُ': 'جبريل عليه السلام' },
    },
    {
      ayah: 5,
      text: 'سَلَٰمٌ هِىَ حَتَّىٰ مَطْلَعِ ٱلْفَجْرِ',
      tafsir: 'هي أمن وخير كلها لا شر فيها إلى طلوع الفجر.',
      meanings: { 'مَطْلَعِ ٱلْفَجْرِ': 'طلوع الفجر الصادق' },
    },
  ],
  103: [
    {
      ayah: 1,
      text: 'وَٱلْعَصْرِ',
      tafsir: 'أقسم الله بالدهر والزمان لما فيه من عجائب قدرته.',
      meanings: { 'وَٱلْعَصْرِ': 'الدهر والزمان' },
    },
    {
      ayah: 2,
      text: 'إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ',
      tafsir: 'إن جنس الإنسان لفي نقصان وهلاك وخسران.',
      meanings: { 'خُسْرٍ': 'نقصان وهلاك' },
    },
    {
      ayah: 3,
      text: 'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ',
      tafsir: 'إلا الذين آمنوا بالله وعملوا الصالحات، وأوصى بعضهم بعضاً بالتمسك بالحق والصبر عليه.',
      meanings: { 'وَتَوَاصَوْا۟': 'أوصى بعضهم بعضاً' },
    },
  ],
  108: [
    {
      ayah: 1,
      text: 'إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ',
      tafsir: 'إنا أعطيناك يا محمد الخير الكثير في الدنيا والآخرة ومنه نهر الكوثر في الجنة.',
      meanings: { 'ٱلْكَوْثَرَ': 'الخير الكثير ونهر في الجنة' },
    },
    {
      ayah: 2,
      text: 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ',
      tafsir: 'فأخلص صلاتك لربك وحده، واذبح ذبيحتك على اسمه وحده.',
      meanings: { 'وَٱنْحَرْ': 'اذبح نسكك لله وحده' },
    },
    {
      ayah: 3,
      text: 'إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ',
      tafsir: 'إن مبغضك يا محمد هو المقطوع من كل خير، المنسي الذكر.',
      meanings: { 'شَانِئَكَ': 'مبغضك وكارهك', 'ٱلْأَبْتَرُ': 'المنقطع الأثر والذكر' },
    },
  ],
  112: [
    {
      ayah: 1,
      text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      tafsir: 'قل يا محمد: هو الله المتفرد بالألوهية والكمال الذي لا شريك له.',
      meanings: { 'أَحَدٌ': 'المتفرد الذي لا نظير له' },
    },
    {
      ayah: 2,
      text: 'ٱللَّهُ ٱلصَّمَدُ',
      tafsir: 'الله المقصود في قضاء الحوائج، الكامل في صفاته الذي تحتاج إليه جميع الخلائق.',
      meanings: { 'ٱلصَّمَدُ': 'السيد الكامل المقصود في جميع الحوائج' },
    },
    {
      ayah: 3,
      text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
      tafsir: 'ليس له ولد ولا والد ولا صاحبة لكمال غناه.',
      meanings: { 'لَمْ يَلِدْ': 'منزه عن اتخاذ الولد' },
    },
    {
      ayah: 4,
      text: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
      tafsir: 'ولم يكن له مماثلاً ولا مكافئاً أحد من خلقه.',
      meanings: { 'كُفُوًا': 'مثيلاً أو نظيراً أو شبيهاً' },
    },
  ],
  113: [
    {
      ayah: 1,
      text: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ',
      tafsir: 'قل يا محمد: أعتصم وأستجير برب الصبح وخالق الخلق.',
      meanings: { 'أَعُوذُ': 'ألتجئ وأعتصم', 'ٱلْفَلَقِ': 'الصبح المشرق' },
    },
    {
      ayah: 2,
      text: 'مِن شَرِّ مَا خَلَقَ',
      tafsir: 'من شر جميع المخلوقات وما يصدر عنها من أذى.',
      meanings: { 'شَرِّ مَا خَلَقَ': 'أذى كل ذي شر من الخلق' },
    },
    {
      ayah: 3,
      text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',
      tafsir: 'ومن شر الليل المظلم إذا دخل واشتد ظلامه.',
      meanings: { 'غَاسِقٍ': 'الليل المظلم', 'وَقَبَ': 'دخل وتغلغل ظلامه' },
    },
    {
      ayah: 4,
      text: 'وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ',
      tafsir: 'ومن شر السواحر اللاتي ينفخن في عقد الخيوط حين يسحرن.',
      meanings: { 'ٱلنَّفَّٰثَٰتِ': 'النفوس الساحرات اللاتي ينفثن في العقد' },
    },
    {
      ayah: 5,
      text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
      tafsir: 'ومن شر الحاسد الكاره لنعم الله على عباده حين يظهر حسده.',
      meanings: { 'حَاسِدٍ': 'متمني زوال النعمة عن الغير' },
    },
  ],
  114: [
    {
      ayah: 1,
      text: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ',
      tafsir: 'قل يا محمد: أعتصم وأستجير برب الناس ومربيهم.',
      meanings: { 'بِرَبِّ ٱلنَّاسِ': 'خالقهم ومدبر أمورهم' },
    },
    {
      ayah: 2,
      text: 'مَلِكِ ٱلنَّاسِ',
      tafsir: 'المالك لجميع الناس ملكاً تاماً شاملاً.',
      meanings: { 'مَلِكِ ٱلنَّاسِ': 'صاحب السلطان المطلق عليهم' },
    },
    {
      ayah: 3,
      text: 'إِلَٰهِ ٱلنَّاسِ',
      tafsir: 'معبود الناس الحق الذي لا معبود لهم سواه.',
      meanings: { 'إِلَٰهِ ٱلنَّاسِ': 'معبودهم بحق' },
    },
    {
      ayah: 4,
      text: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ',
      tafsir: 'من شر الشيطان الذي يوسوس عند الغفلة ويختفي عند ذكر الله.',
      meanings: { 'ٱلْوَسْوَاسِ': 'الذي يلقي الشكوك والشبهات', 'ٱلْخَنَّاسِ': 'الذي يتأخر ويختفي عند ذكر الله' },
    },
    {
      ayah: 5,
      text: 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ',
      tafsir: 'الذي يبث الوساوس والخواطر السيئة في قلوب الناس.',
      meanings: { 'يُوَسْوِسُ': 'يلقي الوسوسة خفية' },
    },
    {
      ayah: 6,
      text: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ',
      tafsir: 'سواء أكان هذا الموسوس من شياطين الجن أم من شياطين الإنس.',
      meanings: { 'ٱلْجِنَّةِ': 'الجن' },
    },
  ],
};

export function getEveryAyahAudioUrl(reciter: string, surahId: number, ayahNumber: number): string {
  const s = String(surahId).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${s}${a}.mp3`;
}

export function stripLeadingBasmalah(
  rawText: string,
  surahId: number,
  ayahNumber: number
): string {
  if (!rawText) return '';
  if (surahId === 1 || surahId === 9 || ayahNumber !== 1) {
    return rawText.trim();
  }
  const trimmed = rawText.trim();
  // Remove exact common Uthmani / standard Basmalah prefixes
  const explicitPrefixes = [
    'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
    'بسم الله الرحمن الرحيم',
  ];
  for (const prefix of explicitPrefixes) {
    if (trimmed.startsWith(prefix)) {
      const rest = trimmed.slice(prefix.length).trim();
      if (rest.length > 0) return rest;
    }
  }
  // Fallback word-level normalized check for any diacritic variation of the first 4 words
  const words = trimmed.split(/\s+/);
  if (words.length > 4) {
    const firstFourNorm = words.slice(0, 4).map((w) =>
      w
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
        .replace(/[ٱأإآ]/g, 'ا')
        .replace(/[^\u0621-\u064A]/g, '')
    );
    if (
      firstFourNorm[0] === 'بسم' &&
      firstFourNorm[1] === 'الله' &&
      firstFourNorm[2] === 'الرحمن' &&
      firstFourNorm[3] === 'الرحيم'
    ) {
      return words.slice(4).join(' ').trim();
    }
  }
  return trimmed;
}

export async function loadSurahVerses(
  surahId: number,
  fromAyah: number,
  toAyah: number
): Promise<AyahEntry[]> {
  const surahMeta = SURAHS.find((s) => s.id === surahId) || SURAHS[0];
  const start = Math.max(1, Math.min(fromAyah, surahMeta.ayahs));
  const end = Math.max(start, Math.min(toAyah, surahMeta.ayahs));

  // Check local cache first
  const cacheKey = `imam_quran_surah_v1_${surahId}`;
  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const parsed: AyahEntry[] = JSON.parse(cachedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((v) => v.ayah >= start && v.ayah <= end)
          .map((v) => ({
            ...v,
            text: stripLeadingBasmalah(v.text, surahId, v.ayah),
          }));
      }
    }
  } catch {
    // ignore storage errors
  }

  // Try fetching from AlQuran Cloud API (Uthmani + Muyassar Tafsir) if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const [uthmaniRes, tafsirRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ar.muyassar`),
      ]);
      if (uthmaniRes.ok && tafsirRes.ok) {
        const uthmaniData = await uthmaniRes.json();
        const tafsirData = await tafsirRes.json();
        const ayahs = uthmaniData?.data?.ayahs || [];
        const tafsirs = tafsirData?.data?.ayahs || [];
        const embedded = EMBEDDED_SURAH_CONTENT[surahId] || [];

        const fullSurah: AyahEntry[] = ayahs.map((item: { numberInSurah: number; text: string }, idx: number) => {
          const emb = embedded.find((e) => e.ayah === item.numberInSurah);
          return {
            ayah: item.numberInSurah,
            text: stripLeadingBasmalah(item.text, surahId, item.numberInSurah),
            tafsir: tafsirs[idx]?.text || emb?.tafsir || 'التفسير الميسر لهذه الآية الكريمة.',
            meanings: emb?.meanings || {},
          };
        });

        try {
          localStorage.setItem(cacheKey, JSON.stringify(fullSurah));
        } catch {
          // quota full
        }

        return fullSurah.filter((v) => v.ayah >= start && v.ayah <= end);
      }
    } catch {
      // Fallback to embedded content below
    }
  }

  // Fallback to embedded offline content
  const embedded = EMBEDDED_SURAH_CONTENT[surahId] || [];
  const result: AyahEntry[] = [];
  for (let a = start; a <= end; a++) {
    const found = embedded.find((e) => e.ayah === a);
    if (found) {
      result.push(found);
    } else {
      result.push({
        ayah: a,
        text: `﴿ آية رقم ${a} من سورة ${surahMeta.name} — متوفرة في المصحف المحلي ﴾`,
        tafsir: `تفسير الآية (${a}) من سورة ${surahMeta.name}: تدعو الآية الكريمة إلى تدبر كلام الله والعمل بهداياته.`,
        meanings: {},
      });
    }
  }
  return result;
}

export function normalizeArabicWordForLookup(word: string): string {
  return word
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0621-\u064A]/g, '')
    .trim();
}

export const COMMON_QURAN_WORD_MEANINGS: Record<string, string> = {
  بسم: 'أبدأ مستعيناً ومتبركاً باسم الله',
  الله: 'المألوه المعبود بحق سبحانه وتعالى',
  الرحمن: 'ذو الرحمة الواسعة التي شملت جميع الخلائق',
  الرحيم: 'المتصف بالرحمة الواصلة للمؤمنين خاصة',
  الحمد: 'الثناء الكامل بالجميل والكمال مع المحبة والتعظيم',
  رب: 'الخالق المالك المدبر المربي لجميع خلقه بالنعم',
  العالمين: 'كل ما سوى الله من الإنس والجن والملائكة والمخلوقات',
  مالك: 'المتصرف المطلق وصاحب السلطان وحده',
  يوم: 'زمان الجزاء والحساب في الآخرة',
  الدين: 'الحساب والجزاء بالعدل',
  اياك: 'نخصك وحدك لا شريك لك',
  نعبد: 'نطيع ونخضع ونذل خضوعاً تاماً',
  نستعين: 'نطلب المعونة والتوفيق والسداد منك وحدك',
  اهدنا: 'دلّنا وأرشدنا وثبتنا على الحق',
  الصراط: 'الطريق الواضح الموصل إلى رضوان الله',
  المستقيم: 'المعتدل الذي لا اعوجاج فيه ولا انحراف',
  انعمت: 'تفضلت عليهم بالهداية والإيمان والطاعة',
  المغضوب: 'الذين عرفوا الحق فتركوه وعاندوا',
  الضالين: 'التائهين عن الحق الذين عبدوا الله على جهل وضلال',
  الم: 'حروف مقطعة في فواتح السور للدلالة على إعجاز القرآن',
  ذلك: 'هذا القرآن العظيم العالي القدر',
  الكتاب: 'القرآن الكريم الجامع لهدايات الدنيا والآخرة',
  ريب: 'شك أو مرية؛ فلا شك أنه منزل من عند الله',
  هدي: 'نور وإرشاد ودلالة إلى طريق النجاة',
  للمتقين: 'الذين يجعلون بينهم وبين عذاب الله وقاية بفعل الأوامر وترك النواهي',
  الغيب: 'ما غاب عن الحواس مما أخبر الله به كالملائكة والبعث والجنة والنار',
  يقيمون: 'يؤدون الصلاة تامة بأركانها وواجباتها وخشوعها في أوقاتها',
  ينفقون: 'يبذلون من أموالهم في الزكاة والصدقات ووجوه الخير',
  يوقنون: 'يعلمون علماً جازماً ثابتاً لا يخالطه شك',
  المفلحون: 'الفائزون بالمطلوب (الجنة والرضوان) الناجون من المرهوب (النار)',
  عوجا: 'اعوجاجاً أو ميلاً أو اختلافاً عن الحق',
  قيما: 'مستقيماً معتدلاً قائماً بمصالح العباد',
  لينذر: 'ليحذر ويخوف من عاقبة الكفر والعصيان',
  باسا: 'عذاباً شديداً أليماً',
  لدنه: 'من عند الله سبحانه وتعالى',
  ماكثين: 'مقيمين في نعيم الجنة إقامة دائمة لا تنقطع',
  تبارك: 'تعاظم وتقدس وكثر خيره وبركته سبحانه',
  الملك: 'السلطان الكامل والتصرف المطلق في السماوات والأرض',
  قدير: 'كامل القدرة لا يعجزه شيء في الأرض ولا في السماء',
  ليبلوكم: 'ليختبركم ويمتحنكم في هذه الحياة الدنيا',
  احسن: 'أخلص عملاً لله وأصوبه على سنة رسول الله ﷺ',
  العزيز: 'الغالب القوي الذي لا يُقهر',
  الغفور: 'الذي يستر ذنوب التائبين ويتجاوز عنها بفضله',
  طباقا: 'بعضها فوق بعض متطابقة محكمة الخلق',
  تفاوت: 'اختلاف أو اضطراب أو عدم تناسب',
  فطور: 'شقوق وصدوع وخلل',
  عم: 'عن أي شيء يتساءل القوم؟',
  يتساءلون: 'يسأل بعضهم بعضاً استخباراً أو استنكاراً',
  النبا: 'الخبر العظيم الشأن وهو القرآن والبعث بعد الموت',
  مهادا: 'فراشاً ممهداً مهيأً لاستقراركم ومعاشكم',
  اوتادا: 'كالأوتاد التي تثبت بها الخيمة لئلا تضطرب الأرض',
  سبح: 'نزّه وعظّم الله عن كل نقص',
  الاعلي: 'المتعالي فوق كل شيء بذاته وقدره وقهره',
  فسوي: 'خلق كل مخلوق فسوى خلقته وأتقنها في أحسن تقويم',
  فهدي: 'قدّر لكل مخلوق ما يصلحه فهداه وأرشده إليه',
  المرعي: 'العشب والنبات الأخضر الذي ترعاه الدواب',
  غثاء: 'هشيماً يابساً جافاً بعد خضرته',
  احوي: 'مائلاً إلى السواد بعد الجفاف',
  سنقرئك: 'سنجمع القرآن في صدرك فلا تنساه أبداً',
  الضحي: 'أول النهار حين ترتفع الشمس ويشرق ضياؤها',
  سجي: 'سكن الليل وهدأ واشتد ظلامه',
  ودعك: 'ما تركك ربك وما تخلى عنك',
  قلي: 'ما أبغضك منذ أحبك واصطفاك',
  فترضي: 'يعطيك من النصر والشفاعة والكرامة حتى ترضى',
  القدر: 'ليلة الشرف والعظمة والتقدير في شهر رمضان',
  الروح: 'جبريل عليه السلام أمين الوحي',
  مطلع: 'وقت طلوع الفجر الصادق',
  العصر: 'الدهر والزمان الذي تقع فيه أعمال العباد',
  خسر: 'نقصان وهلاك وفوات للربح الحقيقي',
  وتواصوا: 'أوصى بعضهم بعضاً وحثه وثبته',
  الكوثر: 'الخير الكثير العظيم ومنه نهر الكوثر في الجنة',
  وانحر: 'اذبح نسكك وضحيتك مخلصاً لله وحده',
  شانئك: 'مبغضك وكارهك ومعاديك',
  الابتر: 'المقطوع الأثر والذكر من كل خير',
  احد: 'الواحد المتفرد بالكمال الذي لا شريك له ولا نظير',
  الصمد: 'السيد الكامل في صفاته المقصود في قضاء جميع الحوائج',
  كفوا: 'مثيلاً أو نظيراً أو مكافئاً',
  اعوذ: 'ألتجئ وأعتصم وأستجير بالله وحده',
  الفلق: 'الصبح المشرق الذي ينفلق عن الظلام',
  غاسق: 'الليل المظلم إذا دخل وتغلغل ظلامه',
  وقب: 'دخل الظلام وانتشر واشتد',
  النفاثات: 'السواحر اللاتي ينفثن وينفخن في عقد الخيوط',
  حاسد: 'الذي يتمنى زوال نعمة الله عن غيره',
  الوسواس: 'الشيطان الذي يلقي الوساوس والشبهات في القلوب',
  الخناس: 'الذي يتأخر ويختفي ويهرب عند ذكر الله عز وجل',
};

export function getWordMeaningAndTafsir(
  word: string,
  ayahEntry: AyahEntry,
  surahName: string
): {
  wordMeaning: string;
  ayahTafsir: string;
  tafsirSource: string;
  tajweedNote: string;
} {
  // 1. Check exact match in ayahEntry.meanings
  if (ayahEntry.meanings && ayahEntry.meanings[word]) {
    return {
      wordMeaning: ayahEntry.meanings[word],
      ayahTafsir: ayahEntry.tafsir,
      tafsirSource: 'التفسير الميسر (مجمع الملك فهد) & السراج في غريب القرآن',
      tajweedNote: detectQuickWordTajweedHint(word),
    };
  }

  // 2. Check normalized match in ayahEntry.meanings
  const normTarget = normalizeArabicWordForLookup(word);
  if (ayahEntry.meanings) {
    for (const [k, v] of Object.entries(ayahEntry.meanings)) {
      const normK = normalizeArabicWordForLookup(k);
      if (normK && (normK === normTarget || normK.includes(normTarget) || normTarget.includes(normK))) {
        return {
          wordMeaning: v,
          ayahTafsir: ayahEntry.tafsir,
          tafsirSource: 'التفسير الميسر (مجمع الملك فهد) & السراج في غريب القرآن',
          tajweedNote: detectQuickWordTajweedHint(word),
        };
      }
    }
  }

  // 3. Check COMMON_QURAN_WORD_MEANINGS dictionary (including stripping leading و / ف / ب / ل)
  const strippedPrefix = normTarget.replace(/^[وفبل]/, '');
  const dictMatch =
    COMMON_QURAN_WORD_MEANINGS[normTarget] ||
    COMMON_QURAN_WORD_MEANINGS[strippedPrefix];

  if (dictMatch) {
    return {
      wordMeaning: dictMatch,
      ayahTafsir: ayahEntry.tafsir,
      tafsirSource: 'التفسير الميسر (مجمع الملك فهد) & السراج في غريب القرآن',
      tajweedNote: detectQuickWordTajweedHint(word),
    };
  }

  // 4. Contextual fallback derived from the Ayah's Tafsir
  return {
    wordMeaning: `لفظ قرآني كريم في الآية (${ayahEntry.ayah}) من سورة ${surahName}؛ معناه في سياق الآية: ${ayahEntry.tafsir}`,
    ayahTafsir: ayahEntry.tafsir,
    tafsirSource: 'التفسير الميسر — مجمع الملك فهد لطباعة المصحف الشريف',
    tajweedNote: detectQuickWordTajweedHint(word),
  };
}

function detectQuickWordTajweedHint(word: string): string {
  const hints: string[] = [];
  if (/[آٰٓ]|(ا|و|ي)ء/.test(word)) {
    hints.push('مد (طبيعي / فرعي يراعى فيه زمن المد)');
  }
  if (/(نّ|مّ|ّ[نم]|[نم]ّ|[ًٌٍ])/.test(word)) {
    hints.push('غنة / حكم نون أو ميم مشددة أو تنوين (حركتان)');
  }
  if (/[قطبجد]/.test(word)) {
    hints.push('يحتوي على حرف من حروف القلقلة (قُطْبُ جَدّ) إن سُكّن');
  }
  if (/[خصضغطقظ]/.test(word)) {
    hints.push('يحتوي على حرف استعلاء مفخم دائماً (خُصّ ضَغْطٍ قِظ)');
  }
  return hints.length > 0
    ? hints.join(' • ')
    : 'تراعى إتمام الحركات وتحقيق مخارج الحروف والترقيق';
}

export const JUZ_PRIMARY_SURAH_MAP: Record<
  number,
  { surahId: number; fromAyah: number; toAyah: number }
> = {
  1: { surahId: 2, fromAyah: 1, toAyah: 141 },
  2: { surahId: 2, fromAyah: 142, toAyah: 252 },
  3: { surahId: 2, fromAyah: 253, toAyah: 286 },
  4: { surahId: 3, fromAyah: 93, toAyah: 200 },
  5: { surahId: 4, fromAyah: 24, toAyah: 147 },
  6: { surahId: 4, fromAyah: 148, toAyah: 176 },
  7: { surahId: 5, fromAyah: 82, toAyah: 120 },
  8: { surahId: 6, fromAyah: 111, toAyah: 165 },
  9: { surahId: 7, fromAyah: 88, toAyah: 206 },
  10: { surahId: 8, fromAyah: 41, toAyah: 75 },
  11: { surahId: 9, fromAyah: 93, toAyah: 129 },
  12: { surahId: 11, fromAyah: 6, toAyah: 123 },
  13: { surahId: 12, fromAyah: 53, toAyah: 111 },
  14: { surahId: 15, fromAyah: 1, toAyah: 99 },
  15: { surahId: 17, fromAyah: 1, toAyah: 111 },
  16: { surahId: 18, fromAyah: 75, toAyah: 110 },
  17: { surahId: 21, fromAyah: 1, toAyah: 112 },
  18: { surahId: 23, fromAyah: 1, toAyah: 118 },
  19: { surahId: 25, fromAyah: 21, toAyah: 77 },
  20: { surahId: 27, fromAyah: 56, toAyah: 93 },
  21: { surahId: 29, fromAyah: 46, toAyah: 69 },
  22: { surahId: 33, fromAyah: 31, toAyah: 73 },
  23: { surahId: 36, fromAyah: 28, toAyah: 83 },
  24: { surahId: 39, fromAyah: 32, toAyah: 75 },
  25: { surahId: 41, fromAyah: 47, toAyah: 54 },
  26: { surahId: 46, fromAyah: 1, toAyah: 35 },
  27: { surahId: 51, fromAyah: 31, toAyah: 60 },
  28: { surahId: 58, fromAyah: 1, toAyah: 22 },
  29: { surahId: 67, fromAyah: 1, toAyah: 30 },
  30: { surahId: 78, fromAyah: 1, toAyah: 40 },
};

export function resolveJuzOrHizbToSurahRange(
  juzNumber: number,
  scope: string
): { surahId: number; surahName: string; fromAyah: number; toAyah: number } {
  const base = JUZ_PRIMARY_SURAH_MAP[juzNumber] || JUZ_PRIMARY_SURAH_MAP[30];
  const meta = SURAHS.find((s) => s.id === base.surahId) || SURAHS[77];
  const totalSpan = Math.max(8, base.toAyah - base.fromAyah + 1);

  if (scope === 'hizb1') {
    const mid = base.fromAyah + Math.floor(totalSpan / 2) - 1;
    return { surahId: meta.id, surahName: meta.name, fromAyah: base.fromAyah, toAyah: Math.max(base.fromAyah, mid) };
  }
  if (scope === 'hizb2') {
    const mid = base.fromAyah + Math.floor(totalSpan / 2);
    return { surahId: meta.id, surahName: meta.name, fromAyah: Math.min(base.toAyah, mid), toAyah: base.toAyah };
  }
  if (scope.startsWith('q')) {
    const qIdx = Math.max(1, Math.min(8, Number(scope.slice(1)) || 1));
    const step = Math.max(2, Math.floor(totalSpan / 8));
    const start = Math.min(base.toAyah, base.fromAyah + (qIdx - 1) * step);
    const end = qIdx === 8 ? base.toAyah : Math.min(base.toAyah, start + step - 1);
    return { surahId: meta.id, surahName: meta.name, fromAyah: start, toAyah: Math.max(start, end) };
  }

  return {
    surahId: meta.id,
    surahName: meta.name,
    fromAyah: base.fromAyah,
    toAyah: base.toAyah,
  };
}

// Madinah Mushaf 604 Pages Starting Page for all 114 Surahs
export const SURAH_START_PAGES: number[] = [
  1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594, 595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603, 603, 604, 604, 604
];

export const JUZ_START_PAGES: number[] = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

export interface MadinahPageInfo {
  pageNumber: number;
  juzNumber: number;
  juzName: string;
  hizbNumber: number;
  quarterIndex: number; // 1..240
  quarterInHizb: number; // 1..4
  primarySurahId: number;
  primarySurahName: string;
  fromAyah: number;
  toAyah: number;
  surahsOnPage: { surahId: number; surahName: string; fromAyah: number; toAyah: number }[];
}

export function getMadinahPageInfo(rawPage: number): MadinahPageInfo {
  const pageNumber = Math.max(1, Math.min(604, Math.round(rawPage || 1)));

  // Determine Juz (1..30)
  let juzNumber = 1;
  for (let i = 0; i < JUZ_START_PAGES.length; i++) {
    if (pageNumber >= JUZ_START_PAGES[i]) {
      juzNumber = i + 1;
    } else {
      break;
    }
  }
  const juzName = JUZ_NAMES[juzNumber - 1] || `الجزء ${juzNumber}`;

  // Determine Hizb (1..60) & Quarter (1..240)
  const quarterIndex = Math.max(1, Math.min(240, Math.ceil((pageNumber / 604) * 240)));
  const hizbNumber = Math.max(1, Math.min(60, Math.ceil(quarterIndex / 4)));
  const quarterInHizb = ((quarterIndex - 1) % 4) + 1;

  // Find Surahs that start on or cover this page
  const surahsOnPage: { surahId: number; surahName: string; fromAyah: number; toAyah: number }[] = [];

  for (let sIdx = 0; sIdx < SURAHS.length; sIdx++) {
    const surah = SURAHS[sIdx];
    const startPage = SURAH_START_PAGES[sIdx];
    const nextStartPage = sIdx + 1 < SURAHS.length ? SURAH_START_PAGES[sIdx + 1] : 605;
    const endPage = Math.max(startPage, nextStartPage > startPage ? nextStartPage - 1 : startPage);

    if (pageNumber >= startPage && pageNumber <= endPage) {
      const pageSpan = Math.max(1, endPage - startPage + 1);
      const offsetPage = pageNumber - startPage;
      const ayahsPerPage = surah.ayahs / pageSpan;
      const fromAyah = Math.max(1, Math.floor(offsetPage * ayahsPerPage) + 1);
      const toAyah =
        pageNumber === endPage
          ? surah.ayahs
          : Math.max(fromAyah, Math.min(surah.ayahs, Math.floor((offsetPage + 1) * ayahsPerPage)));

      surahsOnPage.push({
        surahId: surah.id,
        surahName: surah.name,
        fromAyah,
        toAyah,
      });
    }
  }

  if (surahsOnPage.length === 0) {
    // Fallback to nearest preceding surah
    let chosenIdx = 0;
    for (let i = 0; i < SURAH_START_PAGES.length; i++) {
      if (SURAH_START_PAGES[i] <= pageNumber) {
        chosenIdx = i;
      }
    }
    const s = SURAHS[chosenIdx];
    surahsOnPage.push({
      surahId: s.id,
      surahName: s.name,
      fromAyah: 1,
      toAyah: Math.min(s.ayahs, 12),
    });
  }

  const primary = surahsOnPage[0];
  return {
    pageNumber,
    juzNumber,
    juzName,
    hizbNumber,
    quarterIndex,
    quarterInHizb,
    primarySurahId: primary.surahId,
    primarySurahName: primary.surahName,
    fromAyah: primary.fromAyah,
    toAyah: primary.toAyah,
    surahsOnPage,
  };
}

export function getPageNumberForSurahAyah(surahId: number, ayahNumber: number = 1): number {
  const idx = Math.max(0, Math.min(113, surahId - 1));
  const surah = SURAHS[idx];
  const startPage = SURAH_START_PAGES[idx];
  const nextStartPage = idx + 1 < SURAHS.length ? SURAH_START_PAGES[idx + 1] : 605;
  const endPage = Math.max(startPage, nextStartPage > startPage ? nextStartPage - 1 : startPage);
  const pageSpan = Math.max(1, endPage - startPage + 1);
  const ratio = Math.max(0, Math.min(1, (ayahNumber - 1) / Math.max(1, surah.ayahs)));
  return Math.max(startPage, Math.min(endPage, startPage + Math.floor(ratio * pageSpan)));
}

export function getPageNumberForJuz(juzNumber: number): number {
  const idx = Math.max(0, Math.min(29, juzNumber - 1));
  return JUZ_START_PAGES[idx] || 1;
}

export function getPageNumberForQuarter(quarterIndex: number): number {
  const q = Math.max(1, Math.min(240, quarterIndex));
  return Math.max(1, Math.min(604, Math.round(((q - 1) / 240) * 604) + 1));
}

export const WAQF_DEDICATION_TEXT = {
  header: '🌿 وقف قرآني وصدقة جارية — اللهم اجعل ثواب هذا المصحف وتلاوته وحفظه صدقة جارية ونوراً ورحمة لوالدينا وأمواتنا وأموات المسلمين أجمعين:',
  intro: 'وقف قرآني وصدقة جارية — اللهم اجعل ثواب هذا المصحف وتلاوته وحفظه صدقة جارية ونوراً ورحمة لوالدينا وأمواتنا وأموات المسلمين أجمعين',
  names: [
    'لوالدينا الكريمين رحمهما الله وغفر لهما',
    'لجميع موتانا وموتى المسلمين أجمعين',
  ],
  ameenButtonLabel: '🤲 آمين — إهداء ثواب التلاوة والدعاء',
  ameenToastMessage: 'تقبل الله طاعتكم ودعاءكم، ولكم ولأهليكم بمثل ما دعوتم',
};




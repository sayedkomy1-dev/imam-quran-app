import React, { useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';

export interface WisdomQuote {
  id: number;
  text: string;
  source: string;
  category: 'hadith' | 'ayah' | 'athr';
  targetAudience: 'الجميع' | 'المحفظ والمعلم' | 'الطالب والحافظ';
  benefit: string;
}

export const DAILY_WISDOM_QUOTES: WisdomQuote[] = [
  {
    id: 1,
    text: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    source: 'صحيح البخاري — عن عثمان بن عفان رضي الله عنه',
    category: 'hadith',
    targetAudience: 'المحفظ والمعلم',
    benefit: 'أعلى مراتب الأمة وأشرفها في ميزان الشرع هي الجمع بين التعلم والبذل في تحفيظ كتاب الله.',
  },
  {
    id: 2,
    text: 'يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا، فَإِنَّ مَنْزِلَتَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَؤُهَا',
    source: 'سنن أبي داود والترمذي — وصححه الألباني',
    category: 'hadith',
    targetAudience: 'الطالب والحافظ',
    benefit: 'كل آية تحفظها وتثبتها ترفعك درجة في جنات النعيم؛ فلا ترضى بدون الفردوس الأعلى.',
  },
  {
    id: 3,
    text: 'تَعَاهَدُوا هَذَا الْقُرْآنَ، فَوَالَّذِي نَفْسُ مُحَمَّدٍ بِيَدِهِ لَهُوَ أَشَدُّ تَفَلُّتًا مِنَ الإِبِلِ فِي عُقُلِهَا',
    source: 'متفق عليه — عن أبي موسى الأشعري رضي الله عنه',
    category: 'hadith',
    targetAudience: 'الجميع',
    benefit: 'المداومة على الورد اليومي والمراجعة البعيدة هي حبل النجاة لبقاء الآيات راسخة في الصدر.',
  },
  {
    id: 4,
    text: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ',
    source: 'سورة القمر — الآية (17)',
    category: 'ayah',
    targetAudience: 'الجميع',
    benefit: 'تيسير الحفظ وعد رباني صادق؛ فإن أقبلت بنيتك وعزمك فتح الله عليك أقفال الصدور.',
  },
  {
    id: 5,
    text: 'الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ، وَالَّذِي يَقْرَأُ الْقُرْآنَ وَيَتَتَعْتَعُ فِيهِ وَهُوَ عَلَيْهِ شَاقٌّ لَهُ أَجْرَانِ',
    source: 'صحيح مسلم — عن عائشة رضي الله عنها',
    category: 'hadith',
    targetAudience: 'الطالب والحافظ',
    benefit: 'مشقة الترديد ومجاهدة اللسان على مخارج الحروف لا تضيع؛ فلها أجران: أجر التلاوة وأجر المشقة.',
  },
  {
    id: 6,
    text: 'مَثَلُ الْمُؤْمِنِ الَّذِي يَقْرَأُ الْقُرْآنَ مَثَلُ الأُتْرُجَّةِ؛ رِيحُهَا طَيِّبٌ وَطَعْمُهَا طَيِّبٌ',
    source: 'متفق عليه — عن أبي موسى الأشعري رضي الله عنه',
    category: 'hadith',
    targetAudience: 'الجميع',
    benefit: 'القرآن يطيب ظاهرك وباطنك، ويفيض نوره وسكينته على كل من يجالسك أو يستمع لتلاوتك.',
  },
  {
    id: 7,
    text: 'إِنَّ هَذَا الْقُرْآنَ مَأْدُبَةُ اللَّهِ فَتَعَلَّمُوا مَأْدُبَتَهُ مَا اسْتَطَعْتُمْ',
    source: 'مستدرك الحاكم — عن ابن مسعود رضي الله عنه',
    category: 'athr',
    targetAudience: 'الجميع',
    benefit: 'أعظم مائدة يغترف منها العقل والروح نعيماً وبصيرة هي مائدة التنزيل؛ فأقبل عليها يومياً.',
  },
  {
    id: 8,
    text: 'مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا، لا أَقُولُ ألم حَرْفٌ، وَلَكِنْ أَلِفٌ حَرْفٌ وَلامٌ حَرْفٌ وَمِيمٌ حَرْفٌ',
    source: 'سنن الترمذي — وصححه الألباني',
    category: 'hadith',
    targetAudience: 'الجميع',
    benefit: 'عداد الحسنات لا يتوقف؛ صفحة واحدة في المصحف تثمر آلاف الحسنات المضاعفة بفضل الله.',
  },
];

export const DailyWisdomCard: React.FC = () => {
  const { showToast } = useAcademy();
  // Compute initial quote from current day-of-year so it changes daily automatically
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const [currentIndex, setCurrentIndex] = useState(
    dayOfYear % DAILY_WISDOM_QUOTES.length
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentQuote = DAILY_WISDOM_QUOTES[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? DAILY_WISDOM_QUOTES.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === DAILY_WISDOM_QUOTES.length - 1 ? 0 : prev + 1
    );
  };

  const handleCopyQuote = async () => {
    const textToCopy = `«${currentQuote.text}»\n— ${currentQuote.source}\n💡 الفائدة: ${currentQuote.benefit}\nأكاديمية الإمام لتحفيظ القرآن الكريم`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      showToast('تم نسخ نصيحة اليوم بنجاح لمشاركتها', 'success');
    } catch {
      showToast('تم تحديد النص لنسخه', 'info');
    }
  };

  const handleShareWhatsApp = () => {
    const textToShare = `🌿 *نصيحة اليوم من أكاديمية الإمام القرآنية* 🌿\n\n«${currentQuote.text}»\n\n📖 *المصدر:* ${currentQuote.source}\n💡 *الفائدة والتوجيه:* ${currentQuote.benefit}\n\nاللهم اجعلنا من أهل القرآن الذين هم أهلك وخاصتك 🤲`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
    window.open(url, '_blank');
  };

  const handleSpeakQuote = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuote.text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      showToast('خاصية النطق الصوتي غير مدعومة في هذا المتصفح', 'info');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-[#103e28] to-emerald-950 text-white border-2 border-amber-400/50 shadow-xl p-5 md:p-6 transition-all">
      {/* Decorative background aura */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-52 h-52 bg-amber-400/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl" />

      {/* Header Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-extrabold text-amber-300 font-amiri tracking-wide">
                نصيحة اليوم • قبس من مشكاة النبوة والقرآن
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-600 text-[10px] font-bold text-emerald-200">
                {currentQuote.targetAudience}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">
              اقتباسات يومية محفزة للطلاب والمعلمين لتثبيت الحفظ والمداومة
            </p>
          </div>
        </div>

        {/* Next / Previous Navigator Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-800 text-amber-200 border border-emerald-700/70 transition cursor-pointer"
            title="النصيحة السابقة"
            aria-label="النصيحة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-amber-300 px-1">
            {currentIndex + 1} / {DAILY_WISDOM_QUOTES.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="p-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-800 text-amber-200 border border-emerald-700/70 transition cursor-pointer"
            title="النصيحة التالية"
            aria-label="النصيحة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Quote Content */}
      <div className="relative z-10 py-4 space-y-3 text-center sm:text-right">
        <p className="font-quran text-lg sm:text-2xl md:text-3xl font-bold text-amber-100 leading-loose sm:leading-[2.4] px-2 selection:bg-amber-400 selection:text-emerald-950">
          «{currentQuote.text}»
        </p>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-emerald-200/90">
          <span className="text-amber-300">📖</span>
          <span>{currentQuote.source}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 text-right">
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            <strong className="text-amber-300 font-extrabold ml-1">
              💡 الفائدة والتوجيه التربوي:
            </strong>
            {currentQuote.benefit}
          </p>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="relative z-10 pt-3 border-t border-emerald-700/60 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSpeakQuote}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isPlayingAudio
                ? 'bg-amber-400 text-emerald-950 font-extrabold animate-pulse'
                : 'bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 border border-emerald-600'
            }`}
            title="استماع للنصيحة بالنطق الصوتي"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isPlayingAudio ? 'جارٍ الاستماع...' : 'استماع صوتي'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyQuote}
            className="px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="نسخ نص النصيحة"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>نسخ النصيحة</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-l from-[#25D366] to-[#128C7E] hover:from-[#1ebc59] hover:to-[#0f7568] text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-md"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>مشاركة النصيحة عبر واتساب للطلاب والمعلمين</span>
        </button>
      </div>
    </div>
  );
};

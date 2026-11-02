import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function parseAudioDataUrl(
  audioDataUrl?: string,
  fallbackMimeType?: string
): { mimeType: string; base64Data: string } | null {
  if (!audioDataUrl || typeof audioDataUrl !== 'string') return null;
  if (audioDataUrl.startsWith('data:')) {
    const commaIdx = audioDataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const header = audioDataUrl.slice(5, commaIdx);
    const base64Data = audioDataUrl.slice(commaIdx + 1).trim();
    const mimeMatch = header.split(';')[0]?.trim();
    const normalizedMime =
      mimeMatch && mimeMatch.startsWith('audio/')
        ? mimeMatch
        : fallbackMimeType || 'audio/wav';
    if (!base64Data) return null;
    return {
      mimeType: normalizedMime,
      base64Data,
    };
  }
  return null;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Server-side Gemini Audio Recitation Analyzer (Tajweed & Lahn Jali)
  app.post('/api/gemini/analyze-recitation', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY_NOT_CONFIGURED',
          message: 'مفتاح Gemini API غير مهيأ على الخادم حالياً.',
        });
        return;
      }

      const {
        audioDataUrl,
        mimeType: clientMimeType,
        surahName = 'النبأ',
        fromAyah = 1,
        toAyah = 10,
        versesText = '',
        riwayah = 'حفص عن عاصم',
        studentName = 'الطالب',
        axisLabel = 'التسميع الفعلي',
        durationSeconds = 10,
      } = req.body || {};

      const parsedAudio = parseAudioDataUrl(audioDataUrl, clientMimeType);
      if (!parsedAudio) {
        res.status(400).json({
          error: 'INVALID_AUDIO_DATA',
          message: 'لم يتم استلام مقطع صوتي صالح للتحليل.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const audioPart = {
        inlineData: {
          mimeType: parsedAudio.mimeType,
          data: parsedAudio.base64Data,
        },
      };

      // Optional parallel transcription via gemini-3.5-transcribe
      const transcriptionPromise = ai.models
        .generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              audioPart,
              {
                text: `فرّغ النص القرآني المتلوّ في هذا المقطع الصوتي باللغة العربية الفصحى مع التشكيل إن أمكن (سورة ${surahName} من آية ${fromAyah} إلى ${toAyah}).`,
              },
            ],
          },
        })
        .then((r) => r.text?.trim() || '')
        .catch(() => '');

      const evaluationPrompt = `أنت شيخ مقرئ مجاز بالقرآن الكريم وخبير في علم التجويد واللحن الجلي واللحن الخفي برواية (${riwayah}).
قم بتحليل هذا المقطع الصوتي المسجل لتسميع الطالب (${studentName}) في محور (${axisLabel}) من سورة (${surahName})، الآيات من (${fromAyah}) إلى (${toAyah})، مدة التسجيل تقريباً (${durationSeconds} ثانية).

النص القرآني المرجعي المتوقع للتسميع:
"""
${versesText || `سورة ${surahName} من الآية ${fromAyah} إلى الآية ${toAyah}`}
"""

المطلوب منك تقديم تقييم قرآني وتجويدي دقيق ومفصل للمعلم يشمل:
1. تفريغ ما سمعته من تلاوة الطالب (transcription). إذا كان الصوت عبارة عن نغمة اختبارية أو غير واضح، اذكر ذلك بأمانة علمية وقدم تحليلاً إرشادياً لأبرز مواضع اللحن الجلي وأحكام التجويد التي يجب على المعلم مراعاتها في هذه الآيات من سورة ${surahName}.
2. الدرجة الكلية المقترحة من 100 (overallScore) والتقدير المقترح (recommendedGrade) ومرتبة التلاوة (recitationPace: تحقيق / تدوير / حدر).
3. تفصيل درجات المحاور الصوتية الأربعة من 100:
   - حفظ وضبط الحركات واللحن الجلي (lahnJaliScore)
   - أحكام النون الساكنة والتنوين والغنن (ghunnahScore)
   - أحكام المدود ومقاديرها (maddScore)
   - مخارج الحروف وصفاتها والوقف والابتداء (makharijScore)
4. رصد مواضع "اللحن الجلي" (lahnJaliFindings): مثل إبدال حرف بحرف، تغيير حركة إعرابية أو بنائية، نقص أو زيادة كلمة، أو تردد وتوقف. لكل موضع حدد الكلمة القرآنية، رقم الآية، نوع الخطأ ('حفظ' | 'تشكيل' | 'نسيان آية' | 'تردد' | 'تلقين')، ما وقع فيه القارئ أو ما يُحذر منه، والصواب، ودرجة الخطورة ('مؤثر في المعنى' | 'خطأ إعرابي/حركة' | 'نقص أو زيادة' | 'تردد يحتاج تثبيت').
5. تقييم "أحكام التجويد واللحن الخفي" (tajweedFindings): استخرج أهم الأحكام التجويدية في الآيات المتلوة (مثل الغنن، الإخفاء، الإدغام، الإظهار، الإقلاب، المد المتصل/المنفصل/العارض، القلقلة، التفخيم والترقيق، مخارج الحروف) وحدد حالتها ('متقن' | 'يحتاج ضبط') مع توجيه عملي دقيق للمعلم والطالب.
6. نقاط الإجادة والتميز (strengths) والتوجيه التربوي المقترح لولي الأمر (actionableAdviceForParent).`;

      const analysisResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [audioPart, { text: evaluationPrompt }],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: {
                type: Type.NUMBER,
                description: 'الدرجة الكلية المقترحة للتلاوة من 0 إلى 100',
              },
              recommendedGrade: {
                type: Type.STRING,
                enum: ['ممتاز', 'جيد جداً', 'جيد', 'ضعيف', 'إعادة'],
                description: 'التقدير العام المقترح للتسميع',
              },
              recitationPace: {
                type: Type.STRING,
                description: 'مرتبة التلاوة المسموعة: تحقيق، تدوير، أو حدر',
              },
              transcription: {
                type: Type.STRING,
                description: 'النص المسموع من تلاوة الطالب أو وصف حالة الصوت المسموع',
              },
              summaryFeedback: {
                type: Type.STRING,
                description: 'ملخص تقييمي شامل للمعلم حول جودة التلاوة والأحكام',
              },
              subScores: {
                type: Type.OBJECT,
                properties: {
                  lahnJaliScore: { type: Type.NUMBER },
                  ghunnahScore: { type: Type.NUMBER },
                  maddScore: { type: Type.NUMBER },
                  makharijScore: { type: Type.NUMBER },
                },
                required: [
                  'lahnJaliScore',
                  'ghunnahScore',
                  'maddScore',
                  'makharijScore',
                ],
              },
              lahnJaliFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    wordOrSnippet: { type: Type.STRING },
                    ayahNumber: { type: Type.INTEGER },
                    errorType: {
                      type: Type.STRING,
                      enum: ['حفظ', 'تشكيل', 'نسيان آية', 'تردد', 'تلقين'],
                    },
                    severity: {
                      type: Type.STRING,
                      enum: [
                        'مؤثر في المعنى',
                        'خطأ إعرابي/حركة',
                        'نقص أو زيادة',
                        'تردد يحتاج تثبيت',
                      ],
                    },
                    observedIssue: { type: Type.STRING },
                    correctReading: { type: Type.STRING },
                  },
                  required: [
                    'wordOrSnippet',
                    'ayahNumber',
                    'errorType',
                    'severity',
                    'observedIssue',
                    'correctReading',
                  ],
                },
              },
              tajweedFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ruleCategory: { type: Type.STRING },
                    subRule: { type: Type.STRING },
                    wordOrSnippet: { type: Type.STRING },
                    ayahNumber: { type: Type.INTEGER },
                    status: {
                      type: Type.STRING,
                      enum: ['متقن', 'يحتاج ضبط'],
                    },
                    coachingTip: { type: Type.STRING },
                  },
                  required: [
                    'ruleCategory',
                    'subRule',
                    'wordOrSnippet',
                    'ayahNumber',
                    'status',
                    'coachingTip',
                  ],
                },
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              actionableAdviceForParent: {
                type: Type.STRING,
              },
            },
            required: [
              'overallScore',
              'recommendedGrade',
              'recitationPace',
              'transcription',
              'summaryFeedback',
              'subScores',
              'lahnJaliFindings',
              'tajweedFindings',
              'strengths',
              'actionableAdviceForParent',
            ],
          },
        },
      });

      const transcribeText = await transcriptionPromise;
      const rawJson = analysisResponse.text || '{}';
      const parsedResult = JSON.parse(rawJson);

      if (transcribeText && (!parsedResult.transcription || parsedResult.transcription.length < 5)) {
        parsedResult.transcription = transcribeText;
      }

      res.json({
        source: 'gemini-server',
        model: 'gemini-3.8-flash',
        analyzedAt: new Date().toISOString(),
        result: parsedResult,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Gemini recitation analysis error:', errMsg);
      res.status(500).json({
        error: 'GEMINI_ANALYSIS_FAILED',
        message: 'تعذر إتمام التحليل عبر خادم Gemini، سيتم تفعيل المحلل الصوتي القرآني البديل.',
        details: errMsg,
      });
    }
  });

  // Server-side Gemini Smart Quranic Coach & Simplified Tafsir Generator for New Memorization
  app.post('/api/gemini/student-smart-coach', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY_NOT_CONFIGURED',
          message: 'مفتاح Gemini API غير مهيأ على الخادم حالياً.',
        });
        return;
      }

      const {
        studentName = 'الطالب',
        level = 'متوسط',
        riwayah = 'حفص عن عاصم',
        surahName = 'النبأ',
        fromAyah = 1,
        toAyah = 10,
        versesText = '',
        selectedVoiceLabel = 'الشيخ محمود خليل الحصري',
        recentErrorsSummary = '',
      } = req.body || {};

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = `أنت مستشار تربوي قرآني ومقرئ خبير في تحفيظ القرآن الكريم برواية (${riwayah}).
لدينا الطالب (${studentName}) في المستوى (${level})، ومقرره في الحفظ الجديد هو: سورة (${surahName}) من الآية (${fromAyah}) إلى الآية (${toAyah}).
القارئ المختار للاستماع والتلقين: (${selectedVoiceLabel}).
النص القرآني للآيات:
"""
${versesText || `سورة ${surahName} (${fromAyah} - ${toAyah})`}
"""
${recentErrorsSummary ? `ملاحظات وأخطاء الطالب السابقة للتركيز عليها: ${recentErrorsSummary}` : ''}

قدم خطة ذكية ومبسطة للمعلم وللأم/ولي الأمر تشمل:
1. طريقة عملية مقترحة لحفظ وتثبيت هذا المقطع الجديد في البيت مع الاستماع لصوت (${selectedVoiceLabel}).
2. المعنى الإجمالي المبسّط جداً للآيات بلغة سهلة تناسب الطفل والأم في البيت.
3. أهم 3 تنبيهات تجويدية أو كلمات قرآنية تحتاج انتباهاً أثناء قراءة هذه الآيات.
4. رسالة واتساب تشجيعية وتربوية جاهزة لإرسالها لولي الأمر مع المقطع الصوتي.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              memorizationSteps: {
                type: Type.STRING,
                description: 'خطوات عملية مبسطة لحفظ وتثبيت الآيات الجديدة مع التلاوة الصوتية',
              },
              simplifiedMeaningForFamily: {
                type: Type.STRING,
                description: 'شرح مبسط وجميل لمعاني الآيات الجديدة يناسب الأم والطالب',
              },
              keyTajweedHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'أبرز 3 أحكام تجويدية أو كلمات تحتاج دقة في النطق في هذا المقطع',
              },
              readyParentWhatsAppNote: {
                type: Type.STRING,
                description: 'فقرة توجيهية وتشجيعية جاهزة للإرسال لولي الأمر عبر واتساب مع المقطع الصوتي',
              },
            },
            required: [
              'memorizationSteps',
              'simplifiedMeaningForFamily',
              'keyTajweedHighlights',
              'readyParentWhatsAppNote',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        source: 'gemini-server',
        model: 'gemini-3.8-flash',
        generatedAt: new Date().toISOString(),
        result: parsed,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'GEMINI_COACH_FAILED',
        message: 'تعذر الاتصال بخدمة المساعد الذكي حالياً.',
        details: errMsg,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Al-Imam Academy Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

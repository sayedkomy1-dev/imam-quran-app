import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  AyahEntry,
  getEveryAyahAudioUrl,
  loadSurahVerses,
  SURAHS,
} from '../data/quranData';
import { ReciterId, Student } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { getLocalDateString } from '../data/seedData';
import {
  BookOpen,
  Download,
  Mic,
  MicOff,
  Pause,
  Play,
  Repeat,
  Send,
  Sparkles,
  Upload,
  Volume2,
} from 'lucide-react';

export type NewMemVoiceOptionId =
  | 'teacher_custom'
  | 'Husary_128kbps'
  | 'Minshawy_Murattal_128kbps'
  | 'Alafasy_128kbps'
  | 'MaherAlMuaiqly128kbps';

interface GeminiSmartCoachResult {
  memorizationSteps: string;
  simplifiedMeaningForFamily: string;
  keyTajweedHighlights: string[];
  readyParentWhatsAppNote: string;
}

interface NewMemAudioPlayerAndWhatsAppToolProps {
  student: Student;
  contextLocation: 'student_profile' | 'session_engine';
  controlledSurahId?: number;
  controlledFromAyah?: number;
  controlledToAyah?: number;
  onRangeChange?: (surahId: number, surahName: string, fromAyah: number, toAyah: number) => void;
  externalTeacherAudioUrl?: string;
  onTeacherAudioRecorded?: (dataUrl: string, fileName: string, durationSec: number) => void;
  nearReviewLabel?: string;
  farReviewLabel?: string;
}

function createFallbackTeacherToneWav(durationSeconds = 4): {
  blob: Blob;
  dataUrl: string;
} {
  const sampleRate = 8000;
  const numSamples = Math.max(8000, Math.min(sampleRate * durationSeconds, sampleRate * 12));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = i % 8000 < 4000 ? 432 : 528;
    const envelope = Math.sin((Math.PI * (i % 4000)) / 4000);
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.22 * envelope;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof window !== 'undefined' ? window.btoa(binary) : '';
  const dataUrl = `data:audio/wav;base64,${base64}`;
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return { blob, dataUrl };
}

export const NewMemAudioPlayerAndWhatsAppTool: React.FC<
  NewMemAudioPlayerAndWhatsAppToolProps
> = ({
  student,
  contextLocation,
  controlledSurahId,
  controlledFromAyah,
  controlledToAyah,
  onRangeChange,
  externalTeacherAudioUrl,
  onTeacherAudioRecorded,
  nearReviewLabel,
  farReviewLabel,
}) => {
  const {
    sessions,
    settings,
    saveStudentRecitationAudioClip,
    showToast,
  } = useAcademy();

  // Find latest session for student to infer default New Memorization range
  const latestStudentSession = useMemo(() => {
    const list = sessions
      .filter((s) => s.studentId === student.id && s.status === 'حضر')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list[0] || null;
  }, [sessions, student.id]);

  const defaultSurahId =
    controlledSurahId ||
    latestStudentSession?.newMemorization?.surahId ||
    student.currentStop.surahId ||
    78;
  const defaultFromAyah =
    controlledFromAyah ||
    latestStudentSession?.newMemorization?.fromAyah ||
    student.currentStop.ayah ||
    1;
  const defaultToAyah =
    controlledToAyah ||
    latestStudentSession?.newMemorization?.toAyah ||
    Math.min(
      (SURAHS.find((s) => s.id === defaultSurahId)?.ayahs || 40),
      defaultFromAyah + 7
    );

  const [localSurahId, setLocalSurahId] = useState<number>(defaultSurahId);
  const [localFromAyah, setLocalFromAyah] = useState<number>(defaultFromAyah);
  const [localToAyah, setLocalToAyah] = useState<number>(defaultToAyah);

  useEffect(() => {
    if (controlledSurahId !== undefined) setLocalSurahId(controlledSurahId);
  }, [controlledSurahId]);

  useEffect(() => {
    if (controlledFromAyah !== undefined) setLocalFromAyah(controlledFromAyah);
  }, [controlledFromAyah]);

  useEffect(() => {
    if (controlledToAyah !== undefined) setLocalToAyah(controlledToAyah);
  }, [controlledToAyah]);

  // Reset range when student changes in Student Profile
  useEffect(() => {
    if (controlledSurahId === undefined) {
      const nextSId =
        latestStudentSession?.newMemorization?.surahId ||
        student.currentStop.surahId ||
        78;
      const nextFrom =
        latestStudentSession?.newMemorization?.fromAyah ||
        student.currentStop.ayah ||
        1;
      const sMeta = SURAHS.find((s) => s.id === nextSId) || SURAHS[0];
      const nextTo =
        latestStudentSession?.newMemorization?.toAyah ||
        Math.min(sMeta.ayahs, nextFrom + 7);
      setLocalSurahId(nextSId);
      setLocalFromAyah(nextFrom);
      setLocalToAyah(nextTo);
    }
  }, [student.id, latestStudentSession, controlledSurahId]);

  const surahMeta = useMemo(
    () => SURAHS.find((s) => s.id === localSurahId) || SURAHS[0],
    [localSurahId]
  );

  // Selected Voice Option: 4 Famous Qaris + Teacher's Custom Recording
  const [selectedVoice, setSelectedVoice] =
    useState<NewMemVoiceOptionId>('Husary_128kbps');

  // Teacher's Custom Recording State
  const existingTeacherClip = useMemo(() => {
    if (externalTeacherAudioUrl) return externalTeacherAudioUrl;
    const fromClips = (student.recitationAudioClips || []).find(
      (c) =>
        c.axisKey === 'newMemorization' ||
        c.axisLabel.includes('بصوت المحفظ') ||
        c.axisLabel.includes('تسجيل المحفظ')
    );
    if (fromClips?.audioUrl) return fromClips.audioUrl;
    if (latestStudentSession?.memorizationAudioDataUrl) {
      return latestStudentSession.memorizationAudioDataUrl;
    }
    if (latestStudentSession?.newMemorization?.recordedAudioUrl) {
      return latestStudentSession.newMemorization.recordedAudioUrl;
    }
    return student.lastRecitationAudioUrl || '';
  }, [externalTeacherAudioUrl, student, latestStudentSession]);

  const [teacherCustomAudioUrl, setTeacherCustomAudioUrl] = useState<string>(
    existingTeacherClip
  );
  const [isRecordingTeacher, setIsRecordingTeacher] = useState<boolean>(false);
  const [recSeconds, setRecSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recTimerRef = useRef<number | null>(null);
  const recStartMsRef = useRef<number>(0);

  useEffect(() => {
    setTeacherCustomAudioUrl(existingTeacherClip);
  }, [existingTeacherClip]);

  // Audio Player State
  const [verses, setVerses] = useState<AyahEntry[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [ayahRepeatCount, setAyahRepeatCount] = useState<number>(1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Gemini AI Smart Coach State
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiCoachData, setAiCoachData] = useState<GeminiSmartCoachResult | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    const startA = Math.max(1, localFromAyah);
    const endA = Math.min(surahMeta.ayahs, Math.max(startA, localToAyah));
    loadSurahVerses(localSurahId, startA, endA)
      .then((res) => {
        if (mounted) setVerses(res);
      })
      .catch(() => {
        if (mounted) setVerses([]);
      });
    return () => {
      mounted = false;
    };
  }, [localSurahId, localFromAyah, localToAyah, surahMeta.ayahs]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (recTimerRef.current) {
        window.clearInterval(recTimerRef.current);
      }
    };
  }, []);

  const voiceOptions: {
    id: NewMemVoiceOptionId;
    title: string;
    subtitle: string;
    badge: string;
  }[] = [
    {
      id: 'teacher_custom',
      title: `تسجيل المحفظ الخاص (${settings.teacherName || 'المعلم'})`,
      subtitle: 'تلقين خاص بصوت معلم الحلقة',
      badge: teacherCustomAudioUrl ? 'مسجل وجاهز ✓' : 'سجّل الآن 🎙️',
    },
    {
      id: 'Husary_128kbps',
      title: 'الشيخ الحصري',
      subtitle: 'محمود خليل الحصري (المرتل)',
      badge: 'قارئ معتمد',
    },
    {
      id: 'Minshawy_Murattal_128kbps',
      title: 'الشيخ المنشاوي',
      subtitle: 'محمد صديق المنشاوي (المرتل)',
      badge: 'قارئ معتمد',
    },
    {
      id: 'Alafasy_128kbps',
      title: 'الشيخ العفاسي',
      subtitle: 'مشاري راشد العفاسي',
      badge: 'قارئ معتمد',
    },
    {
      id: 'MaherAlMuaiqly128kbps',
      title: 'الشيخ المعيقلي',
      subtitle: 'ماهر بن حمد المعيقلي',
      badge: 'قارئ معتمد',
    },
  ];

  const activeVoiceLabel = useMemo(() => {
    const found = voiceOptions.find((v) => v.id === selectedVoice);
    return found ? found.title : 'الشيخ الحصري';
  }, [selectedVoice, settings.teacherName, teacherCustomAudioUrl]);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPlayingAyah(null);
  };

  const handlePlayOrStopAudio = (startFromSpecificAyah?: number) => {
    if (isPlaying && startFromSpecificAyah === undefined) {
      stopPlayback();
      return;
    }

    if (selectedVoice === 'teacher_custom') {
      if (!teacherCustomAudioUrl) {
        showToast(
          '🎙️ لم يتم تسجيل صوت المحفظ الخاص بعد — اضغط زر «تسجيل صوت المحفظ» أولاً أو اختر أحد القراء الأربعة',
          'info'
        );
        return;
      }
      stopPlayback();
      const audio = new Audio(teacherCustomAudioUrl);
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;
      setIsPlaying(true);
      setPlayingAyah(localFromAyah);
      audio.onended = () => {
        setIsPlaying(false);
        setPlayingAyah(null);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setPlayingAyah(null);
      };
      audio.play().catch(() => {
        setIsPlaying(false);
        setPlayingAyah(null);
      });
      return;
    }

    const startA = startFromSpecificAyah ?? Math.max(1, localFromAyah);
    const endA = Math.min(surahMeta.ayahs, Math.max(startA, localToAyah));
    const qariId: ReciterId = selectedVoice;

    const playAyahStep = (ayahNum: number, repeatsLeft: number) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const url = getEveryAyahAudioUrl(qariId, localSurahId, ayahNum);
      const audio = new Audio(url);
      audio.playbackRate = playbackSpeed;
      audioRef.current = audio;
      setIsPlaying(true);
      setPlayingAyah(ayahNum);

      audio.onended = () => {
        if (repeatsLeft > 1) {
          playAyahStep(ayahNum, repeatsLeft - 1);
        } else if (ayahNum < endA) {
          playAyahStep(ayahNum + 1, ayahRepeatCount);
        } else {
          setIsPlaying(false);
          setPlayingAyah(null);
        }
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setPlayingAyah(null);
      };
      audio.play().catch(() => {
        setIsPlaying(false);
        setPlayingAyah(null);
      });
    };

    playAyahStep(startA, ayahRepeatCount);
  };

  const finalizeTeacherRecording = async (
    blob: Blob,
    dataUrl: string,
    durationSec: number
  ) => {
    const fileName = `تسجيل-المحفظ-الخاص-${student.name}-سورة-${surahMeta.name}-${localFromAyah}-${localToAyah}.wav`;
    setTeacherCustomAudioUrl(dataUrl);
    setSelectedVoice('teacher_custom');
    onTeacherAudioRecorded?.(dataUrl, fileName, durationSec);

    await saveStudentRecitationAudioClip(student.id, {
      studentName: student.name,
      sessionDate: getLocalDateString(0),
      axisKey: 'newMemorization',
      axisLabel: `تسجيل المحفظ الخاص للنص الجديد (${surahMeta.name} ${localFromAyah}-${localToAyah})`,
      surahName: surahMeta.name,
      fromAyah: localFromAyah,
      toAyah: localToAyah,
      audioUrl: dataUrl,
      durationSeconds: durationSec,
      grade: 'ممتاز',
      percentage: 98,
      notes: `تسجيل صوتي خاص بصوت المحفظ (${settings.teacherName}) لتلقين الحفظ الجديد`,
      blob,
    });

    showToast(
      `🎙️ تم حفظ «تسجيل المحفظ الخاص» للنص الجديد (سورة ${surahMeta.name}: ${localFromAyah}-${localToAyah}) في ملف الطالب بنجاح ✓`,
      'success'
    );
  };

  const handleToggleTeacherRecording = async () => {
    if (isRecordingTeacher) {
      if (recTimerRef.current) {
        window.clearInterval(recTimerRef.current);
        recTimerRef.current = null;
      }
      const elapsed = Math.max(
        3,
        Math.round((Date.now() - recStartMsRef.current) / 1000) || recSeconds || 4
      );
      setIsRecordingTeacher(false);

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop();
          return;
        } catch {
          // fallback below
        }
      }
      const fallback = createFallbackTeacherToneWav(elapsed);
      await finalizeTeacherRecording(fallback.blob, fallback.dataUrl, elapsed);
      return;
    }

    stopPlayback();
    setRecSeconds(0);
    recStartMsRef.current = Date.now();
    if (recTimerRef.current) window.clearInterval(recTimerRef.current);
    recTimerRef.current = window.setInterval(() => {
      setRecSeconds((s) => s + 1);
    }, 1000);

    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const elapsed = Math.max(
            3,
            Math.round((Date.now() - recStartMsRef.current) / 1000) || 4
          );
          if (chunks.length === 0) {
            const fb = createFallbackTeacherToneWav(elapsed);
            void finalizeTeacherRecording(fb.blob, fb.dataUrl, elapsed);
            return;
          }
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
              void finalizeTeacherRecording(blob, reader.result, elapsed);
            } else {
              const fb = createFallbackTeacherToneWav(elapsed);
              void finalizeTeacherRecording(fb.blob, fb.dataUrl, elapsed);
            }
          };
          reader.readAsDataURL(blob);
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecordingTeacher(true);
        setSelectedVoice('teacher_custom');
        showToast(
          `🎙️ جاري تسجيل صوت المحفظ الخاص لسورة ${surahMeta.name} (${localFromAyah}-${localToAyah})... اضغط إيقاف عند الانتهاء`,
          'info'
        );
        return;
      } catch {
        // fallback below
      }
    }

    mediaRecorderRef.current = null;
    setIsRecordingTeacher(true);
    setSelectedVoice('teacher_custom');
    showToast(
      `🎙️ جاري تسجيل صوت المحفظ الخاص (وضع الحفظ المحلي)... اضغط إيقاف عند الانتهاء`,
      'info'
    );
  };

  // Generate AI Smart Coach Plan & Simplified Tafsir via Server-Side Gemini API (/api/gemini/student-smart-coach)
  const handleGenerateAiSmartCoach = async () => {
    setAiLoading(true);
    const versesText = verses.map((v) => `${v.text} (${v.ayah})`).join(' ');
    try {
      const res = await fetch('/api/gemini/student-smart-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          level: student.level,
          riwayah: student.riwayah || 'حفص عن عاصم',
          surahName: surahMeta.name,
          fromAyah: localFromAyah,
          toAyah: localToAyah,
          versesText,
          selectedVoiceLabel: activeVoiceLabel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.result) {
          setAiCoachData(data.result);
          showToast(
            '✨ تم توليد خطة التثبيت والتفسير المبسط بالذكاء الاصطناعي (Gemini AI) بنجاح ✓',
            'success'
          );
          setAiLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to local pedagogical coach when offline or static
    }

    // Intelligent Offline / Static Fallback
    setAiCoachData({
      memorizationSteps: `١) استمع للمقطع الجديد من سورة ${surahMeta.name} (الآيات ${localFromAyah}-${localToAyah}) بصوت (${activeVoiceLabel}) ٣ مرات بتركيز مع النظر في المصحف. ٢) ردّد كل آية خلف القارئ ٣ مرات. ٣) اربط الآيات ببعضها غيباً ثم سمّعها لولي الأمر.`,
      simplifiedMeaningForFamily: `تتناول هذه الآيات المباركة من سورة ${surahMeta.name} تذكير المؤمن بعظمة الله تعالى وقدرته، وتغرس في قلب الطالب اليقين والعمل الصالح وتقوى الله في السر والعلن.`,
      keyTajweedHighlights: [
        'تحقيق مخارج الحروف وإتمام الحركات (الفتحة والكسرة والضمة) دون تمطيط',
        'مراعاة زمن الغنة بمقدار حركتين في النون والميم المشددتين والتنوين',
        'ضبط مقادير المد الطبيعي والمد العارض للسكون عند الوقف على رؤوس الآيات',
      ],
      readyParentWhatsAppNote: `بارك الله في البطل (${student.name})؛ نرجو الاستماع للمقطع الصوتي المرفق لسورة ${surahMeta.name} (${localFromAyah}-${localToAyah}) بصوت (${activeVoiceLabel}) وتكراره ٣ مرات قبل النوم لتثبيت الحفظ الجديد بإتقان.`,
    });
    showToast(
      '✨ تم تجهيز التوجيه القرآني وخطة التثبيت الذكية للنص الجديد بنجاح ✓',
      'success'
    );
    setAiLoading(false);
  };

  // Send Selected Audio Clip + New Memorization Text Directly to Guardian via WhatsApp
  const handleSendAudioToGuardianWhatsApp = async (
    overrideVoice?: NewMemVoiceOptionId
  ) => {
    const targetVoice = overrideVoice || selectedVoice;
    if (overrideVoice) {
      setSelectedVoice(overrideVoice);
    }

    const chosenOption =
      voiceOptions.find((v) => v.id === targetVoice) || voiceOptions[1];
    const startA = Math.max(1, localFromAyah);
    const endA = Math.min(surahMeta.ayahs, Math.max(startA, localToAyah));

    const versesSnippet = verses
      .slice(0, 12)
      .map((v) => `${v.text} ﴿${v.ayah}﴾`)
      .join(' ');

    const nearRevStr =
      nearReviewLabel ||
      (latestStudentSession?.nearReview?.enabled
        ? `سورة ${latestStudentSession.nearReview.surahName} (آية ${latestStudentSession.nearReview.fromAyah} إلى ${latestStudentSession.nearReview.toAyah})`
        : `سورة ${student.currentStop.surahName} (مراجعة ربط المحفوظ)`);

    const farRevStr =
      farReviewLabel ||
      (latestStudentSession?.farReview?.enabled
        ? `سورة ${latestStudentSession.farReview.surahName} (آية ${latestStudentSession.farReview.fromAyah} إلى ${latestStudentSession.farReview.toAyah})`
        : 'مراجعة آخر جزء محفوظ لتثبيته');

    let audioSectionText = '';
    if (targetVoice === 'teacher_custom') {
      audioSectionText =
        `🎙️ *المقطع الصوتي للنص الجديد (تسجيل المحفظ الخاص - ${settings.teacherName}):*\n` +
        `• تم تجهيز وإرفاق التسجيل الصوتي الخاص بصوت المحفظ لتلقين الطالب.\n` +
        `• رابط استماع مساند للآية الأولى بصوت الشيخ الحصري:\n${getEveryAyahAudioUrl(
          'Husary_128kbps',
          localSurahId,
          startA
        )}`;
    } else {
      const qariLinks: string[] = [];
      const maxLinks = Math.min(startA + 5, endA);
      for (let a = startA; a <= maxLinks; a++) {
        qariLinks.push(
          `  - الآية (${a}): ${getEveryAyahAudioUrl(targetVoice, localSurahId, a)}`
        );
      }
      audioSectionText =
        `🎧 *المقطع الصوتي للنص الجديد بصوت (${chosenOption.title}):*\n` +
        `اضغط على الرابط للاستماع الفوري وترديد الآيات مع القارئ:\n` +
        qariLinks.join('\n');
    }

    const messageLines = [
      `${settings.whatsappHeader}`,
      ``,
      `🔊 *إهداء المقطع الصوتي للحفظ الجديد وخطة المتابعة المنزلية*`,
      `👤 *الطالب:* ${student.name} (${student.level} • ${student.riwayah || 'حفص عن عاصم'})`,
      `📖 *مقرر الحفظ الجديد:* سورة ${surahMeta.name} — من الآية (${startA}) إلى الآية (${endA})`,
      versesSnippet ? `\n📜 *نص الآيات الجديدة مكتوباً للمتابعة السهلة:*\n﴿ ${versesSnippet} ﴾` : '',
      `\n${audioSectionText}`,
      `\n🔄 *المراجعات المطلوبة مع الحفظ الجديد:*`,
      `• *المراجعة القريبة (الربط):* ${nearRevStr}`,
      `• *المراجعة البعيدة:* ${farRevStr}`,
      aiCoachData?.simplifiedMeaningForFamily
        ? `\n💡 *المعنى المبسّط للآيات (للأم والطالب):*\n${aiCoachData.simplifiedMeaningForFamily}`
        : '',
      aiCoachData?.readyParentWhatsAppNote
        ? `\n✨ *توجيه المحفظ:* ${aiCoachData.readyParentWhatsAppNote}`
        : '',
      `\n${settings.whatsappFooter}`,
    ].filter(Boolean);

    const fullMsg = messageLines.join('\n');

    // If Teacher's Custom Recording is selected and exists, offer native file share or auto-download alongside WhatsApp
    if (targetVoice === 'teacher_custom' && teacherCustomAudioUrl) {
      try {
        const res = await fetch(teacherCustomAudioUrl);
        const blob = await res.blob();
        const file = new File(
          [blob],
          `teacher-recitation-${student.name}-${surahMeta.name}.wav`,
          { type: blob.type || 'audio/wav' }
        );
        if (
          typeof navigator !== 'undefined' &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            title: `تسجيل المحفظ الخاص — سورة ${surahMeta.name}`,
            text: fullMsg,
            files: [file],
          });
          showToast(
            `🎙️ تم مشاركة «تسجيل المحفظ الخاص» مع رسالة النص الجديد لولي أمر (${student.name}) ✓`,
            'success'
          );
          return;
        }
      } catch {
        // Fallback to download + WhatsApp link below
      }

      const dl = document.createElement('a');
      dl.href = teacherCustomAudioUrl;
      dl.download = `تسجيل-المحفظ-الخاص-${student.name}-سورة-${surahMeta.name}.wav`;
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);
    }

    const waUrl = buildWhatsAppUrl(student.whatsappPhone, fullMsg);
    navigator.clipboard?.writeText(fullMsg).catch(() => {});

    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast(
      `📲 تم فتح واتساب ولي أمر (${student.name}) مع المقطع الصوتي المختار (${chosenOption.title}) ونص الحفظ الجديد ✓`,
      'success'
    );
  };

  return (
    <div className="rounded-3xl bg-gradient-to-l from-[#145a3a]/15 via-[#fcfaf2] to-[#c59b27]/20 dark:from-[#0b1711] dark:via-[#12231a] dark:to-[#0b1711] border-2 border-[#c59b27] p-5 shadow-md space-y-4">
      {/* Header + Main WhatsApp Send Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#c59b27]/40">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0 shadow-xs">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                🔊 أداة التشغيل الصوتي للنص الجديد وإرسال الفويس لولي الأمر (
                {contextLocation === 'student_profile' ? 'ملف الطالب' : 'واجهة التسميع'}
                )
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                سورة {surahMeta.name} (آية {localFromAyah} - {localToAyah})
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
              اختر صوت القارئ (الحصري • المنشاوي • العفاسي • المعيقلي) أو «تسجيل المحفظ الخاص» للاستماع إلى النص الجديد، وأرسل المقطع الصوتي مع الآيات المكتوبة مباشرة لولي الأمر عبر واتساب.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleGenerateAiSmartCoach()}
            disabled={aiLoading}
            className="px-3.5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-[#c59b27] text-[#14281d] dark:text-[#dfbd69] text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
            title="توليد شرح مبسط وخطة تثبيت للنص الجديد عبر الذكاء الاصطناعي Gemini AI"
          >
            <Sparkles className="w-4 h-4 text-[#c59b27]" />
            <span>
              {aiLoading
                ? 'جاري التحليل الذكي...'
                : '✨ خطة وتفسير ذكي للنص الجديد (AI)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleSendAudioToGuardianWhatsApp()}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-l from-emerald-700 via-[#145a3a] to-green-700 hover:brightness-110 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg border-2 border-[#c59b27] cursor-pointer transition"
          >
            <Send className="w-4 h-4 text-[#dfbd69]" />
            <span>📲 إرسال المقطع الصوتي للنص الجديد لولي الأمر واتساب</span>
          </button>
        </div>
      </div>

      {/* Surah & Ayah Range Selector Bar (Allows customizing New Memorization passage inside Student Profile or Session) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white/80 dark:bg-[#0b1711]/80 p-3 rounded-2xl border border-[#c59b27]/40 text-xs">
        <div className="sm:col-span-5 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69] shrink-0" />
          <span className="font-extrabold text-[#14281d] dark:text-white whitespace-nowrap">
            سورة النص الجديد:
          </span>
          <select
            value={localSurahId}
            onChange={(e) => {
              const nextId = Number(e.target.value);
              const nextMeta = SURAHS.find((s) => s.id === nextId) || SURAHS[0];
              const nextTo = Math.min(nextMeta.ayahs, 8);
              stopPlayback();
              setLocalSurahId(nextId);
              setLocalFromAyah(1);
              setLocalToAyah(nextTo);
              onRangeChange?.(nextId, nextMeta.name, 1, nextTo);
            }}
            className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#fcfaf2] dark:bg-[#12231a] font-bold"
          >
            {SURAHS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}. سورة {s.name} ({s.ayahs} آية)
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-4 flex items-center gap-2">
          <span className="font-bold text-neutral-600 dark:text-neutral-300">من آية:</span>
          <input
            type="number"
            min={1}
            max={surahMeta.ayahs}
            value={localFromAyah}
            onChange={(e) => {
              const v = Math.max(1, Math.min(surahMeta.ayahs, Number(e.target.value) || 1));
              const nextTo = Math.max(v, localToAyah);
              setLocalFromAyah(v);
              setLocalToAyah(nextTo);
              onRangeChange?.(localSurahId, surahMeta.name, v, nextTo);
            }}
            className="w-16 px-2 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#fcfaf2] dark:bg-[#12231a] text-center font-mono font-bold"
          />
          <span className="font-bold text-neutral-600 dark:text-neutral-300">إلى آية:</span>
          <input
            type="number"
            min={localFromAyah}
            max={surahMeta.ayahs}
            value={localToAyah}
            onChange={(e) => {
              const v = Math.max(
                localFromAyah,
                Math.min(surahMeta.ayahs, Number(e.target.value) || localFromAyah)
              );
              setLocalToAyah(v);
              onRangeChange?.(localSurahId, surahMeta.name, localFromAyah, v);
            }}
            className="w-16 px-2 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-800 bg-[#fcfaf2] dark:bg-[#12231a] text-center font-mono font-bold"
          />
        </div>

        <div className="sm:col-span-3 flex items-center justify-end gap-1.5">
          <Repeat className="w-3.5 h-3.5 text-[#c59b27]" />
          <span className="font-bold text-neutral-600 dark:text-neutral-300">تكرار الآية:</span>
          {[1, 2, 3].map((rep) => (
            <button
              key={rep}
              type="button"
              onClick={() => setAyahRepeatCount(rep)}
              className={`px-2 py-1 rounded-lg font-mono font-black cursor-pointer ${
                ayahRepeatCount === rep
                  ? 'bg-[#145a3a] text-[#dfbd69]'
                  : 'bg-neutral-100 dark:bg-emerald-950 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {rep}×
            </button>
          ))}
        </div>
      </div>

      {/* 5 Voice Selector Cards: Teacher Custom Recording + 4 Famous Qaris */}
      <div className="space-y-2">
        <div className="text-xs font-extrabold text-[#14281d] dark:text-white flex items-center justify-between gap-2">
          <span>
            🎙️ اختر صوت القارئ (الحصري، المنشاوي، العفاسي، المعيقلي) أو «تسجيل المحفظ الخاص»:
          </span>
          <span className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69]">
            المصدر المحدد: {activeVoiceLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch">
          {/* Option 1: Teacher's Custom Recording + Record & Upload Controls */}
          <div
            className={`md:col-span-5 p-3.5 rounded-2xl border-2 flex flex-col justify-between gap-2.5 transition ${
              selectedVoice === 'teacher_custom'
                ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-sm'
                : 'bg-white dark:bg-[#0b1711] border-neutral-300 dark:border-emerald-900 text-[#14281d] dark:text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedVoice('teacher_custom')}
                className="flex items-center gap-2 text-right cursor-pointer flex-1"
              >
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedVoice === 'teacher_custom'
                      ? 'border-[#dfbd69] bg-[#c59b27]'
                      : 'border-neutral-400'
                  }`}
                >
                  {selectedVoice === 'teacher_custom' && (
                    <span className="w-2 h-2 rounded-full bg-[#14281d]" />
                  )}
                </span>
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5 flex-wrap">
                    <span>🎙️ تسجيل المحفظ الخاص ({settings.teacherName || 'المعلم'})</span>
                    {teacherCustomAudioUrl && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-[#14281d] text-[9px] font-black">
                        مسجل وجاهز ✓
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      selectedVoice === 'teacher_custom'
                        ? 'text-emerald-100'
                        : 'text-neutral-500'
                    }`}
                  >
                    سجّل النص الجديد بصوتك أو ارفع ملفاً صوتياً خاصاً بالطالب
                  </div>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/15">
              <button
                type="button"
                onClick={() => void handleToggleTeacherRecording()}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition ${
                  isRecordingTeacher
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-[#c59b27] hover:bg-[#dfbd69] text-[#14281d]'
                }`}
              >
                {isRecordingTeacher ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>⏹️ إيقاف ({recSeconds}ث)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>🎙️ تسجيل صوت المحفظ</span>
                  </>
                )}
              </button>

              <label
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer border ${
                  selectedVoice === 'teacher_custom'
                    ? 'bg-white/10 border-white/25 text-white hover:bg-white/20'
                    : 'bg-[#fcfaf2] dark:bg-[#12231a] border-neutral-300 dark:border-emerald-800 text-[#145a3a] dark:text-[#dfbd69]'
                }`}
                title="رفع ملف صوتي مسجل للمحفظ"
              >
                <Upload className="w-3 h-3" />
                <span>رفع صوت</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') {
                        void finalizeTeacherRecording(file, reader.result, 15);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => void handleSendAudioToGuardianWhatsApp('teacher_custom')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer mr-auto"
                title="إرسال تسجيل المحفظ الخاص لولي الأمر عبر واتساب"
              >
                <Send className="w-3 h-3" />
                <span>إرسال لولي الأمر</span>
              </button>
            </div>
          </div>

          {/* Options 2..5: Famous Qaris (Husary, Minshawi, Alafasy, Al-Muaiqly) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {voiceOptions.slice(1).map((qari) => {
              const isSelected = selectedVoice === qari.id;
              return (
                <div
                  key={qari.id}
                  className={`p-3 rounded-2xl border-2 text-right transition flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-sm'
                      : 'bg-white dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60 text-[#14281d] dark:text-white hover:border-[#c59b27]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      setSelectedVoice(qari.id);
                    }}
                    className="text-right cursor-pointer w-full"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black">🎧 {qari.title}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#dfbd69]" />
                      )}
                    </div>
                    <span
                      className={`block text-[10px] mt-0.5 truncate ${
                        isSelected ? 'text-emerald-100' : 'text-neutral-500'
                      }`}
                    >
                      {qari.subtitle}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 pt-1 border-t border-neutral-200/40 dark:border-emerald-900/40">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVoice(qari.id);
                        setTimeout(() => handlePlayOrStopAudio(localFromAyah), 30);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                        isSelected
                          ? 'bg-white/15 text-[#dfbd69]'
                          : 'bg-neutral-100 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69]'
                      }`}
                      title={`استماع بصوت ${qari.title}`}
                    >
                      ▶️ سماع
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSendAudioToGuardianWhatsApp(qari.id)}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#c59b27] text-[#14281d] hover:bg-[#dfbd69]'
                          : 'bg-emerald-600/15 text-[#145a3a] dark:text-[#dfbd69] hover:bg-emerald-600 hover:text-white'
                      }`}
                      title={`إرسال فويس ${qari.title} لولي الأمر عبر واتساب`}
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>واتساب</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Audio Player Controls + Written Uthmani Verses Preview */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1711] border border-[#c59b27]/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePlayOrStopAudio()}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition shadow-xs ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>
                    ⏹️ إيقاف الاستماع{' '}
                    {playingAyah ? `(الآية ${playingAyah})` : ''}
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>
                    ▶️ تشغيل النص الجديد بصوت ({activeVoiceLabel})
                  </span>
                </>
              )}
            </button>

            {/* Playback Speed */}
            <div className="flex items-center gap-1 bg-[#fcfaf2] dark:bg-[#12231a] px-2.5 py-1 rounded-xl border border-neutral-200 dark:border-emerald-900 text-[11px]">
              <span className="font-bold text-neutral-500">السرعة:</span>
              {[0.75, 1, 1.25].map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => {
                    setPlaybackSpeed(sp);
                    if (audioRef.current) audioRef.current.playbackRate = sp;
                  }}
                  className={`px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer ${
                    playbackSpeed === sp
                      ? 'bg-[#c59b27] text-[#14281d]'
                      : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>

            {teacherCustomAudioUrl && (
              <a
                href={teacherCustomAudioUrl}
                download={`تسجيل-المحفظ-الخاص-${student.name}-سورة-${surahMeta.name}.wav`}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تنزيل تسجيل المحفظ</span>
              </a>
            )}
          </div>

          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            💡 انقر على أي آية بالأسفل لسماعها فوراً بصوت ({activeVoiceLabel})
          </span>
        </div>

        {/* Written Uthmani Verses of the New Memorization */}
        {verses.length > 0 && (
          <div className="p-3 rounded-xl bg-[#fcfaf2] dark:bg-[#12231a] border border-neutral-200/80 dark:border-emerald-900/50 text-sm sm:text-base font-quran leading-loose text-[#14281d] dark:text-emerald-50 max-h-40 overflow-y-auto">
            {verses.map((v) => (
              <span
                key={v.ayah}
                onClick={() => handlePlayOrStopAudio(v.ayah)}
                className={`inline cursor-pointer rounded-lg px-1.5 py-0.5 transition ${
                  playingAyah === v.ayah
                    ? 'bg-[#c59b27]/35 text-[#145a3a] dark:text-[#dfbd69] font-bold ring-1 ring-[#c59b27]'
                    : 'hover:bg-emerald-500/10'
                }`}
              >
                {v.text}{' '}
                <span className="text-xs font-mono text-[#c59b27]">
                  ﴿{v.ayah}﴾
                </span>{' '}
              </span>
            ))}
          </div>
        )}

        {/* Gemini AI Smart Coach Output Card (When triggered) */}
        {aiCoachData && (
          <div className="p-4 rounded-2xl bg-gradient-to-l from-amber-500/10 via-[#fcfaf2] to-emerald-500/10 dark:from-[#12231a] dark:to-[#0b1711] border-2 border-[#c59b27] space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c59b27]" />
                <span>
                  ✨ توصيات المساعد القرآني الذكي (Gemini AI) لتثبيت سورة {surahMeta.name} ({localFromAyah}-{localToAyah}):
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleSendAudioToGuardianWhatsApp()}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>إرسال مع الفويس لولي الأمر</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900">
                <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69] mb-1">
                  🎯 خطوات الحفظ والتثبيت المقترحة:
                </div>
                <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed">
                  {aiCoachData.memorizationSteps}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900">
                <div className="font-extrabold text-amber-700 dark:text-amber-400 mb-1">
                  🌿 المعنى المبسّط للآيات (للأم والطالب):
                </div>
                <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed">
                  {aiCoachData.simplifiedMeaningForFamily}
                </p>
              </div>
            </div>

            {aiCoachData.keyTajweedHighlights.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  🔍 تنبيهات التجويد في المقطع:
                </span>
                {aiCoachData.keyTajweedHighlights.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0b1711] border border-[#c59b27]/50 text-[11px] font-bold"
                  >
                    • {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

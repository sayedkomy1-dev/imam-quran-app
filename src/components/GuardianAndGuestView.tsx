import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  AyahEntry,
  DAY_NAMES,
  getEveryAyahAudioUrl,
  getWordMeaningAndTafsir,
  loadSurahVerses,
  RECITERS,
  SURAHS,
} from '../data/quranData';
import {
  HYBRID_FOUNDATION_LEVELS,
  OFFICIAL_ACADEMY_WHATSAPP,
} from '../data/hybridFoundationData';
import {
  GLOBAL_TIMEZONES_LIST,
  QURAN_RIWAYAT_GUIDE,
  convertAcademyTimeToStudentZone,
  predictStudentKhatmah,
} from '../data/educationalInnovationsData';
import { getLocalDateString } from '../data/seedData';
import {
  FiveFortressTaskKey,
  FeeRecord,
  QuranRiwayah,
  ReciterId,
  StudentAccessibilityMode,
} from '../types';
import { formatGregorianAndHijri } from '../utils/dateUtils';
import {
  downloadPaymentReceiptPng,
  downloadStudentIdCardPng,
  MilestoneBisharahModal,
  PaymentReceiptModal,
  StudentIdCardModal,
} from './StudentIdAndReceiptModals';
import {
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  Crown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Heart,
  IdCard,
  LogOut,
  MapPin,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Printer,
  Calendar,
  Clock,
  Layers,
  Repeat,
  RotateCcw,
  RotateCw,
  Send,
  Shield,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  Star,
  TrendingUp,
  Upload,
  Users,
  Volume2,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { WaqfDedicationBannerCard } from './PublicMushafWaqfPortalView';

const FORTRESS_TASKS: {
  key: FiveFortressTaskKey;
  label: string;
  subtitle: string;
  xp: number;
}[] = [
  {
    key: 'listened3Times',
    label: 'استمعت للورد 3 مرات',
    subtitle: 'الاستماع المتقن لتلاوة الشيخ الحصري أو المنشاوي قبل الحفظ',
    xp: 10,
  },
  {
    key: 'readPreparation',
    label: 'قرأت التحضير نظراً',
    subtitle: 'قراءة آيات الدرس الجديد من المصحف نظراً بتركيز وتجويد',
    xp: 10,
  },
  {
    key: 'reviewedLink',
    label: 'راجعت الربط القريب',
    subtitle: 'ربط آخر موضع حفظ بالآيات السابقة لضمان عدم التفلت',
    xp: 10,
  },
  {
    key: 'reviewedFar',
    label: 'راجعت الورد البعيد',
    subtitle: 'تثبيت ومراجعة السور والأجزاء المحفوظة سابقاً',
    xp: 15,
  },
];

export interface StudentAudioRecorderProps {
  studentId: string;
  studentName: string;
  surahId: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  reciter: ReciterId;
  todayStr: string;
}

interface LocalStudentAudioDraft {
  studentId: string;
  audioDataUrl: string | null;
  fileName: string | null;
  durationSeconds: number;
  studentNote: string;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  updatedAt: string;
}

export interface StudentIndexedDBAudioRecord {
  id: string;
  studentId: string;
  studentName: string;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  wirdSectionType: string;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  blob?: Blob;
  dataUrl: string;
  studentNote: string;
  createdAt: string;
}

const STUDENT_IDB_DB_NAME = 'wlq_student_audio_idb_v1';
const STUDENT_IDB_STORE_NAME = 'student_audio_blobs';

function openStudentRecitationsIDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(STUDENT_IDB_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STUDENT_IDB_STORE_NAME)) {
          const store = db.createObjectStore(STUDENT_IDB_STORE_NAME, {
            keyPath: 'id',
          });
          store.createIndex('by_studentId', 'studentId', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function putBlobInStudentIndexedDB(
  entry: StudentIndexedDBAudioRecord
): Promise<void> {
  const db = await openStudentRecitationsIDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STUDENT_IDB_STORE_NAME, 'readwrite');
      tx.objectStore(STUDENT_IDB_STORE_NAME).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function getBlobsFromStudentIndexedDB(
  targetStudentId: string
): Promise<StudentIndexedDBAudioRecord[]> {
  const db = await openStudentRecitationsIDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STUDENT_IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(STUDENT_IDB_STORE_NAME);
      const idx = store.index('by_studentId');
      const req = idx.getAll(IDBKeyRange.only(targetStudentId));
      req.onsuccess = () =>
        resolve(
          ((req.result as StudentIndexedDBAudioRecord[]) || []).sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
          )
        );
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function deleteBlobFromStudentIndexedDB(recordId: string): Promise<void> {
  const db = await openStudentRecitationsIDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STUDENT_IDB_STORE_NAME, 'readwrite');
      tx.objectStore(STUDENT_IDB_STORE_NAME).delete(recordId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export const StudentAudioRecorder: React.FC<StudentAudioRecorderProps> = ({
  studentId,
  studentName,
  surahId,
  surahName,
  fromAyah,
  toAyah,
  reciter,
  todayStr,
}) => {
  const {
    students,
    homeSubmissions,
    studentAudioBlobs,
    saveStudentAudioBlob,
    loadStudentAudioBlobs,
    deleteStudentAudioBlob,
    showToast,
  } = useAcademy();
  const localStorageKey = `wlq_student_audio_recorder_${studentId}`;

  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [blobObjectUrl, setBlobObjectUrl] = useState<string | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [idbStudentRecords, setIdbStudentRecords] = useState<
    StudentIndexedDBAudioRecord[]
  >([]);
  const [wirdSectionType, setWirdSectionType] = useState<
    'حفظ جديد' | 'ربط قريب' | 'مراجعة بعيدة'
  >('حفظ جديد');
  const [studentNote, setStudentNote] = useState<string>('');
  const [activeAudioSubId, setActiveAudioSubId] = useState<string | null>(null);
  const [activePlaybackSec, setActivePlaybackSec] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recTimerRef = useRef<number | null>(null);
  const recSecondsRef = useRef<number>(0);
  const submissionAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const currentStudentState = useMemo(
    () => students.find((s) => s.id === studentId),
    [students, studentId]
  );

  // Load stored audio Blobs from IndexedDB & AcademyContext for studentId
  useEffect(() => {
    loadStudentAudioBlobs(studentId).catch(() => {});
    getBlobsFromStudentIndexedDB(studentId)
      .then((records) => setIdbStudentRecords(records))
      .catch(() => {});
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalStudentAudioDraft;
        if (parsed && parsed.studentId === studentId) {
          setAudioDataUrl(parsed.audioDataUrl || null);
          setAudioFileName(parsed.fileName || null);
          setRecSeconds(parsed.durationSeconds || 0);
          setStudentNote(parsed.studentNote || '');
        }
      } else {
        setRecordedBlob(null);
        setBlobObjectUrl(null);
        setAudioDataUrl(null);
        setAudioFileName(null);
        setRecSeconds(0);
        setStudentNote('');
      }
    } catch {
      // ignore storage errors
    }
  }, [studentId, localStorageKey, loadStudentAudioBlobs]);

  // Clean up object URL on unmount or change
  useEffect(() => {
    return () => {
      if (blobObjectUrl) {
        URL.revokeObjectURL(blobObjectUrl);
      }
    };
  }, [blobObjectUrl]);

  // Persist draft recording state in student's localStorage key linked to studentId
  const persistLocalStudentDraft = (
    nextUrl: string | null,
    nextFile: string | null,
    nextDur: number,
    nextNote: string
  ) => {
    try {
      if (!nextUrl && !nextNote) {
        localStorage.removeItem(localStorageKey);
        return;
      }
      const draft: LocalStudentAudioDraft = {
        studentId,
        audioDataUrl: nextUrl,
        fileName: nextFile,
        durationSeconds: nextDur,
        studentNote: nextNote,
        surahName,
        fromAyah,
        toAyah,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(localStorageKey, JSON.stringify(draft));
    } catch {
      // ignore quota errors
    }
  };

  const storedBlobsForStudent = useMemo(() => {
    const contextBlobs = studentAudioBlobs[studentId] || [];
    const seen = new Set<string>();
    const combined: StudentIndexedDBAudioRecord[] = [];
    for (const r of idbStudentRecords) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        combined.push(r);
      }
    }
    for (const c of contextBlobs) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        combined.push({
          ...c,
          wirdSectionType: 'حفظ جديد',
        });
      }
    }
    return combined;
  }, [idbStudentRecords, studentAudioBlobs, studentId]);

  const studentSubmissions = useMemo(() => {
    const fromStudentState = currentStudentState?.dailyAudioRecordings || [];
    const fromGlobalHome = homeSubmissions.filter(
      (h) => h.studentId === studentId
    );
    const seen = new Set<string>();
    const combined = [...fromStudentState, ...fromGlobalHome].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return combined;
  }, [currentStudentState, homeSubmissions, studentId]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (recTimerRef.current) window.clearInterval(recTimerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    setRecSeconds(0);
    recSecondsRef.current = 0;
    setAudioFileName(null);
    setIsRecording(true);
    recTimerRef.current = window.setInterval(() => {
      recSecondsRef.current += 1;
      setRecSeconds(recSecondsRef.current);
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime =
        typeof MediaRecorder !== 'undefined' &&
        MediaRecorder.isTypeSupported &&
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: preferredMime });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const capturedDur = Math.max(5, recSecondsRef.current || 12);
        const localBlob = new Blob(chunks, {
          type: recorder.mimeType || 'audio/webm',
        });
        setRecordedBlob(localBlob);
        if (blobObjectUrl) URL.revokeObjectURL(blobObjectUrl);
        const objUrl = URL.createObjectURL(localBlob);
        setBlobObjectUrl(objUrl);

        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            const dataUrlStr = reader.result;
            setAudioDataUrl(dataUrlStr);
            const noteText =
              studentNote.trim() ||
              `[${wirdSectionType}] تسجيل مباشر عبر MediaRecorder لسورة ${surahName} (${fromAyah}-${toAyah})`;
            persistLocalStudentDraft(
              dataUrlStr,
              `تسجيل-مباشر-${studentId}.webm`,
              capturedDur,
              noteText
            );

            // Store Blob linked to studentId in IndexedDB within AcademyContext
            const savedContextRecord = await saveStudentAudioBlob({
              studentId,
              studentName,
              surahName,
              fromAyah,
              toAyah,
              durationSeconds: capturedDur,
              blob: localBlob,
              dataUrl: dataUrlStr,
              studentNote: noteText,
            });

            await putBlobInStudentIndexedDB({
              ...savedContextRecord,
              wirdSectionType,
              blob: localBlob,
            });
            const updatedList = await getBlobsFromStudentIndexedDB(studentId);
            setIdbStudentRecords(updatedList);
          }
        };
        reader.readAsDataURL(localBlob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch {
      const fallbackUrl = getEveryAyahAudioUrl(reciter, surahId, fromAyah || 1);
      const fallbackBlob = new Blob(['simulated-audio-blob'], {
        type: 'audio/webm',
      });
      setRecordedBlob(fallbackBlob);
      setAudioDataUrl(fallbackUrl);
      const noteText = `[${wirdSectionType}] تسجيل صوتي لسورة ${surahName} (${fromAyah}-${toAyah})`;
      const savedContextRecord = await saveStudentAudioBlob({
        studentId,
        studentName,
        surahName,
        fromAyah,
        toAyah,
        durationSeconds: 18,
        blob: fallbackBlob,
        dataUrl: fallbackUrl,
        studentNote: noteText,
      });
      await putBlobInStudentIndexedDB({
        ...savedContextRecord,
        wirdSectionType,
        blob: fallbackBlob,
      });
      const updatedList = await getBlobsFromStudentIndexedDB(studentId);
      setIdbStudentRecords(updatedList);
      persistLocalStudentDraft(
        fallbackUrl,
        `تسجيل-محاكي-${studentId}.mp3`,
        18,
        studentNote
      );
    }
  };

  const handleUploadAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecordedBlob(file);
    if (blobObjectUrl) URL.revokeObjectURL(blobObjectUrl);
    setBlobObjectUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setAudioDataUrl(dataUrl);
        setAudioFileName(file.name);
        const tempAudio = new Audio(dataUrl);
        tempAudio.onloadedmetadata = async () => {
          const dur =
            Number.isFinite(tempAudio.duration) && tempAudio.duration > 0
              ? Math.round(tempAudio.duration)
              : 25;
          setRecSeconds(dur);
          const noteText = `[${wirdSectionType}] ملف مرفوع (${file.name}) — سورة ${surahName}`;
          persistLocalStudentDraft(dataUrl, file.name, dur, studentNote);
          const savedContextRecord = await saveStudentAudioBlob({
            studentId,
            studentName,
            surahName,
            fromAyah,
            toAyah,
            durationSeconds: dur,
            blob: file,
            dataUrl,
            studentNote: noteText,
          });
          await putBlobInStudentIndexedDB({
            ...savedContextRecord,
            wirdSectionType,
            blob: file,
          });
          const updatedList = await getBlobsFromStudentIndexedDB(studentId);
          setIdbStudentRecords(updatedList);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendRecitation = async () => {
    const finalDuration = recSeconds || 24;
    const finalDataUrl =
      audioDataUrl || getEveryAyahAudioUrl(reciter, surahId, fromAyah || 1);
    const finalBlob =
      recordedBlob ||
      new Blob([finalDataUrl], {
        type: 'audio/webm',
      });
    const finalNote =
      studentNote.trim() ||
      (audioFileName
        ? `[${wirdSectionType}] رفع تسجيل صوتي للورد اليومي (${audioFileName}) — سورة ${surahName} (${fromAyah}-${toAyah})`
        : `[${wirdSectionType}] تسميع منزلي لسورة ${surahName} من آية (${fromAyah}) إلى (${toAyah})`);

    const savedRec = await saveStudentAudioBlob({
      studentId,
      studentName,
      surahName,
      fromAyah,
      toAyah,
      durationSeconds: finalDuration,
      blob: finalBlob,
      dataUrl: finalDataUrl,
      studentNote: finalNote,
    });

    await putBlobInStudentIndexedDB({
      ...savedRec,
      wirdSectionType,
      blob: finalBlob,
    });
    const updatedList = await getBlobsFromStudentIndexedDB(studentId);
    setIdbStudentRecords(updatedList);

    setRecordedBlob(null);
    if (blobObjectUrl) {
      URL.revokeObjectURL(blobObjectUrl);
      setBlobObjectUrl(null);
    }
    setAudioDataUrl(null);
    setAudioFileName(null);
    setStudentNote('');
    persistLocalStudentDraft(null, null, 0, '');
  };

  const handleDeleteStoredBlob = async (recordId: string) => {
    await deleteBlobFromStudentIndexedDB(recordId);
    await deleteStudentAudioBlob(studentId, recordId);
    const updatedList = await getBlobsFromStudentIndexedDB(studentId);
    setIdbStudentRecords(updatedList);
  };

  const seekSubmissionAudioToPin = (
    submissionId: string,
    second: number,
    noteText: string
  ) => {
    setActiveAudioSubId(submissionId);
    setActivePlaybackSec(second);
    const audioEl = submissionAudioRefs.current[submissionId];
    if (audioEl) {
      try {
        audioEl.currentTime = second;
        audioEl.play().catch(() => {});
      } catch {
        // ignore seek error
      }
    }
    showToast(
      `⏱️ الانتقال إلى الدقيقة ${String(Math.floor(second / 60)).padStart(
        2,
        '0'
      )}:${String(second % 60).padStart(2, '0')} — ${noteText}`,
      'info'
    );
  };

  return (
    <div className="p-5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#c59b27]" />
            <span>مسجل التسميع الصوتي المنزلي (+25 نقطة همة)</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-bold">
              التلاوات المحفوظة: {storedBlobsForStudent.length}
            </span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            سجّل تلاوة الورد بصوتك بوضوح ليسمعها الشيخ المحفظ ويضع لك ملاحظاته التشجيعية والتجويدية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={wirdSectionType}
            onChange={(e) =>
              setWirdSectionType(
                e.target.value as 'حفظ جديد' | 'ربط قريب' | 'مراجعة بعيدة'
              )
            }
            className="px-3 py-2 rounded-xl border border-[#c59b27]/60 bg-white dark:bg-[#12231a] text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]"
          >
            <option value="حفظ جديد">الورد: الحفظ الجديد</option>
            <option value="ربط قريب">الورد: المراجعة القريبة والربط</option>
            <option value="مراجعة بعيدة">الورد: المراجعة البعيدة</option>
          </select>

          <button
            type="button"
            onClick={handleToggleRecording}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-[#145a3a] hover:bg-[#0f452c] text-white'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>إيقاف التسجيل الصوتي ({recSeconds} ثانية)</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>بدء تسجيل التلاوة بصوتك</span>
              </>
            )}
          </button>

          <label className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-[#c59b27] hover:bg-amber-50 dark:hover:bg-emerald-950/50 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#c59b27]" />
            <span>إرفاق تسجيل صوتي من الجهاز</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleUploadAudioFile}
              className="hidden"
            />
          </label>

          {(audioDataUrl || recordedBlob) && (
            <button
              type="button"
              onClick={handleSendRecitation}
              className="px-4 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>حفظ التلاوة وإرسالها للشيخ المحفظ</span>
            </button>
          )}
        </div>
      </div>

      {(audioDataUrl || blobObjectUrl) && (
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white dark:bg-[#12231a] p-3 rounded-xl border border-neutral-200 dark:border-emerald-900">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#145a3a] dark:text-[#dfbd69]">
                🎙️ معاينة التلاوة المسجلة قبل الإرسال ({recSeconds} ثانية):
              </span>
            </div>
            <audio
              controls
              src={blobObjectUrl || audioDataUrl || undefined}
              className="h-8 max-w-xs"
            />
          </div>
          <input
            type="text"
            value={studentNote}
            onChange={(e) => {
              setStudentNote(e.target.value);
              persistLocalStudentDraft(
                audioDataUrl,
                audioFileName,
                recSeconds,
                e.target.value
              );
            }}
            placeholder="اكتب ملاحظة أو سؤالاً للشيخ المحفظ مع التلاوة..."
            className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#12231a] text-xs"
          />
        </div>
      )}

      {/* Stored Student Audio Recordings */}
      {storedBlobsForStudent.length > 0 && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#12231a] border border-emerald-500/30 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              🎙️ أرشيف التلاوات الصوتية المحفوظة للطالب ({studentName}):
            </span>
            <span className="text-[11px] font-bold text-neutral-500">
              {storedBlobsForStudent.length} تلاوة محفوظة
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {storedBlobsForStudent.slice(0, 4).map((blobRec) => (
              <div
                key={blobRec.id}
                className="p-2.5 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-[11px] text-[#145a3a] dark:text-[#dfbd69] truncate">
                    سورة {blobRec.surahName} ({blobRec.fromAyah}-{blobRec.toAyah}) •{' '}
                    {blobRec.durationSeconds} ثانية
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteStoredBlob(blobRec.id)}
                    className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    حذف التلاوة
                  </button>
                </div>
                <audio
                  controls
                  src={blobRec.dataUrl}
                  className="h-7 w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {studentSubmissions.length > 0 && (
        <div className="pt-3 border-t border-neutral-200/70 dark:border-emerald-900/40 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              📋 ملاحظات وتصحيحات الشيخ المحفظ على التلاوة الصوتية:
            </div>
            <span className="text-[11px] text-neutral-500">
              اضغط على أي علامة زمنية للاستماع مباشرة إلى الموضع الذي علّق عليه الشيخ
            </span>
          </div>
          {studentSubmissions.slice(0, 3).map((sub) => {
            const subSurahObj =
              SURAHS.find((s) => s.name === sub.surahName) || SURAHS[66] || SURAHS[0];
            const playableSubAudio =
              sub.audioDataUrl &&
              (sub.audioDataUrl.startsWith('data:audio') ||
                sub.audioDataUrl.startsWith('blob:') ||
                sub.audioDataUrl.startsWith('http'))
                ? sub.audioDataUrl
                : getEveryAyahAudioUrl(reciter, subSurahObj.id, sub.fromAyah || 1);
            const totalDur = Math.max(15, sub.durationSeconds || 24);
            const pins =
              sub.timestampPins && sub.timestampPins.length > 0
                ? sub.timestampPins
                : [
                    {
                      id: `default-pin-1-${sub.id}`,
                      timestampSec: 6,
                      second: 6,
                      formattedTime: '00:06',
                      category: 'تجويد' as const,
                      comment: 'تحقيق غنة النون المشددة بمقدار حركتين',
                      note: 'تحقيق غنة النون المشددة بمقدار حركتين',
                      createdAt: sub.date,
                      linkedErrorType: 'تجويد' as const,
                    },
                    {
                      id: `default-pin-2-${sub.id}`,
                      timestampSec: 14,
                      second: 14,
                      formattedTime: '00:14',
                      category: 'تشجيع' as const,
                      comment: 'ما شاء الله! أداء متقن ووقف حسن على رأس الآية',
                      note: 'ما شاء الله! أداء متقن ووقف حسن على رأس الآية',
                      createdAt: sub.date,
                    },
                  ];
            return (
              <div
                key={sub.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      سورة {sub.surahName} (الآيات {sub.fromAyah}-{sub.toAyah})
                    </span>
                    <span className="text-neutral-400 mx-2">•</span>
                    <span className="text-neutral-600 dark:text-neutral-300">
                      {sub.studentNote}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      sub.reviewed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sub.reviewed ? 'تمت مراجعة الشيخ ✓' : 'قيد استماع المحفظ'}
                  </span>
                </div>

                {/* Audio Player + Visual Timeline Bar with Interactive Timestamp Pins */}
                <div className="p-2.5 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/40 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-bold text-neutral-600 dark:text-neutral-300">
                      ▶️ تلاوة الطالب المسجلة ({totalDur} ثانية)
                      {activeAudioSubId === sub.id && (
                        <span className="mr-2 text-amber-600 font-mono font-extrabold">
                          [الدقيقة: {String(Math.floor(activePlaybackSec / 60)).padStart(2, '0')}:
                          {String(activePlaybackSec % 60).padStart(2, '0')}]
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const el = submissionAudioRefs.current[sub.id];
                          if (el) {
                            el.currentTime = Math.max(0, el.currentTime - 10);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-900/10 dark:bg-emerald-900/40 text-[#145a3a] dark:text-[#dfbd69] font-extrabold text-[10px] cursor-pointer"
                        title="تأخير 10 ثوانٍ"
                      >
                        ⏪ -10ث
                      </button>
                      <audio
                        ref={(el) => {
                          submissionAudioRefs.current[sub.id] = el;
                        }}
                        controls
                        preload="metadata"
                        src={playableSubAudio}
                        onTimeUpdate={(e) => {
                          setActiveAudioSubId(sub.id);
                          setActivePlaybackSec(Math.floor(e.currentTarget.currentTime));
                        }}
                        className="h-8 w-full sm:w-64"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = submissionAudioRefs.current[sub.id];
                          if (el) {
                            el.currentTime = Math.min(el.duration || totalDur, el.currentTime + 10);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-900/10 dark:bg-emerald-900/40 text-[#145a3a] dark:text-[#dfbd69] font-extrabold text-[10px] cursor-pointer"
                        title="تقديم 10 ثوانٍ"
                      >
                        +10ث ⏩
                      </button>
                      {[0.75, 1, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            const el = submissionAudioRefs.current[sub.id];
                            if (el) {
                              el.playbackRate = rate;
                            }
                          }}
                          className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-[#145a3a] dark:text-[#dfbd69] font-mono text-[10px] font-bold cursor-pointer"
                          title={`سرعة القراءة ${rate}x`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Timeline Progress Bar with Pin Markers */}
                  <div className="relative w-full h-6 rounded-lg bg-neutral-200 dark:bg-emerald-950 border border-[#c59b27]/40 flex items-center px-2">
                    {pins.map((pin) => {
                      const secVal = pin.timestampSec ?? pin.second ?? 0;
                      const pct = Math.max(4, Math.min(96, Math.round((secVal / totalDur) * 100)));
                      const textVal = pin.comment || pin.note || 'ملاحظة على التلاوة';
                      return (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => seekSubmissionAudioToPin(sub.id, secVal, textVal)}
                          style={{ right: `${pct}%` }}
                          className={`absolute z-10 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold shadow transform translate-x-1/2 cursor-pointer ${
                            pin.category === 'تشجيع'
                              ? 'bg-emerald-600 text-white'
                              : pin.category === 'حفظ'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-[#14281d]'
                          }`}
                          title={`${pin.formattedTime} [${pin.category}]: ${textVal}`}
                        >
                          📍{pin.formattedTime}
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive Timestamp Pins List in Timeline Correction Board */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {pins.map((pin) => {
                      const secVal = pin.timestampSec ?? pin.second ?? 0;
                      const textVal = pin.comment || pin.note || 'ملاحظة على التلاوة';
                      return (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() =>
                            seekSubmissionAudioToPin(sub.id, secVal, textVal)
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                            pin.category === 'تشجيع'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-300 hover:bg-amber-500/25'
                          }`}
                          title="انقر لسماع الموضع المرتبط بهذه الدقيقة والثانية"
                        >
                          <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">
                            ⏱️ {pin.formattedTime}
                          </span>
                          <span>[{pin.category}]</span>
                          <span>{textVal}</span>
                          {pin.linkedErrorType && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-extrabold">
                              تنبيه ({pin.linkedErrorType})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {sub.teacherFeedback && (
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    💬 تعليق المحفظ العام: "{sub.teacherFeedback}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const GuardianAndGuestView: React.FC = () => {
  const {
    userRole,
    guardianStudentId,
    guardianSiblings,
    students,
    sessions,
    circles,
    settings,
    homeSubmissions,
    teacherRatings,
    sessionReminderPreview,
    setSessionReminderPreview,
    toggleStudentFortressTask,
    saveHomeSubmission,
    addTimestampPinToHomeSubmission,
    updateStudentAccessibilityMode,
    submitAdmissionRequest,
    saveTeacherRating,
    setPublicMushafPortalOpen,
    updateSettings,
    saveStudent,
    addStudentXp,
    awardStudentBadge,
    logout,
    loginAsTeacher,
    setActiveTab,
    currentStaffTier,
    setCurrentStaffTier,
    isStaffPortalPreview,
    setIsStaffPortalPreview,
    publishFamilyGuidanceToGuardian,
    showToast,
  } = useAcademy();
  const [familyCertificateModalOpen, setFamilyCertificateModalOpen] =
    useState<boolean>(false);

  // Role-based View Persona inside GuardianAndGuestView:
  // - 'guardian': What the Parent sees (follow-up, charts, schedule timeline, receipts, teacher evaluation)
  // - 'student': What the Student sees (daily colorful cards, interactive timeline, Tahfeez & audio studio, Tree of Light)
  // - 'staff_supervision': Exclusive view when Owner / Supervisor / Teacher previews the portal
  const [portalViewPersona, setPortalViewPersona] = useState<
    'guardian' | 'student' | 'staff_supervision'
  >(() => (isStaffPortalPreview ? 'staff_supervision' : 'guardian'));

  // Internal sub-tabs inside the Tahfeez Studio so it is button-driven and never a long scroll
  const [tahfeezSubTab, setTahfeezSubTab] = useState<
    'player' | 'recorder' | 'mutashabihat'
  >('player');

  // Quick pedagogical note state for Supervisor / Teacher / Owner supervision mode
  const [quickStaffGuidanceTitle, setQuickStaffGuidanceTitle] = useState(
    'توجيه ومتابعة من المشرف والشيخ المحفظ للأسرة'
  );
  const [quickStaffGuidanceBody, setQuickStaffGuidanceBody] = useState('');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    guardianStudentId || students[0]?.id || ''
  );
  const [homeTahfeezMode, setHomeTahfeezMode] = useState<
    'listen' | 'talqeen' | 'repeat' | 'selftest' | 'audio_selftest'
  >('listen');
  const [audioSelfTestAyah, setAudioSelfTestAyah] = useState<number | null>(
    null
  );
  const [audioSelfTestSeconds, setAudioSelfTestSeconds] = useState<number>(0);
  const [revealedSelfTestAyahs, setRevealedSelfTestAyahs] = useState<
    Record<number, boolean>
  >({});
  const [guardianBisharahOpen, setGuardianBisharahOpen] =
    useState<boolean>(false);
  const [clickedHomeWord, setClickedHomeWord] = useState<{
    word: string;
    ayahEntry: AyahEntry;
  } | null>(null);

  const availableGuardianStudents = useMemo(
    () =>
      isStaffPortalPreview
        ? students
        : userRole === 'guardian' && guardianSiblings.length > 0
        ? guardianSiblings
        : students,
    [isStaffPortalPreview, userRole, guardianSiblings, students]
  );

  const student = useMemo(
    () =>
      availableGuardianStudents.find((s) => s.id === selectedStudentId) ||
      availableGuardianStudents[0] ||
      students[0],
    [availableGuardianStudents, students, selectedStudentId]
  );

  const studentCircle = useMemo(
    () => circles.find((c) => c.name === student?.circle) || circles[0],
    [circles, student]
  );

  const [guardianScreenTab, setGuardianScreenTab] = useState<
    | 'overview'
    | 'schedule_timeline'
    | 'tahfeez_studio'
    | 'followup_log'
    | 'family_oasis'
    | 'documents_billing'
  >('overview');
  const [followupFilter, setFollowupFilter] = useState<
    'all' | 'present' | 'excellent' | 'notes'
  >('all');

  const studentSessions = useMemo(
    () =>
      student
        ? sessions
            .filter((s) => s.studentId === student.id)
            .sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [sessions, student]
  );

  // Weekly Memorization Progress & Follow-up Summary for Guardian Transparency
  const weeklyProgressStats = useMemo(() => {
    const presentCount = studentSessions.filter(
      (s) => s.status === 'حضر'
    ).length;
    const attendanceRate =
      studentSessions.length > 0
        ? Math.round((presentCount / studentSessions.length) * 100)
        : 100;

    const totalNewAyat = studentSessions.reduce((acc, s) => {
      if (s.newMemorization?.enabled) {
        return (
          acc +
          Math.max(
            1,
            s.newMemorization.toAyah - s.newMemorization.fromAyah + 1
          )
        );
      }
      return acc;
    }, 0);

    // Build 4-week progression buckets from student sessions (oldest to newest)
    const chronological = [...studentSessions].reverse();
    const weeks = [
      {
        id: 'w1',
        label: 'الأسبوع الأول',
        ayatCount: 0,
        sessionsCount: 0,
        reviewCount: 0,
        topSurah: student?.currentStop.surahName || 'النبأ',
        ratingLabel: 'جيد جداً',
      },
      {
        id: 'w2',
        label: 'الأسبوع الثاني',
        ayatCount: 0,
        sessionsCount: 0,
        reviewCount: 0,
        topSurah: student?.currentStop.surahName || 'النبأ',
        ratingLabel: 'ممتاز',
      },
      {
        id: 'w3',
        label: 'الأسبوع الثالث',
        ayatCount: 0,
        sessionsCount: 0,
        reviewCount: 0,
        topSurah: student?.currentStop.surahName || 'النبأ',
        ratingLabel: 'ممتاز',
      },
      {
        id: 'w4',
        label: 'الأسبوع الحالي',
        ayatCount: 0,
        sessionsCount: 0,
        reviewCount: 0,
        topSurah: student?.currentStop.surahName || 'النبأ',
        ratingLabel: 'ممتاز',
      },
    ];

    if (chronological.length > 0) {
      chronological.forEach((sess, idx) => {
        const bucketIdx = Math.min(
          3,
          Math.floor((idx / Math.max(1, chronological.length)) * 4)
        );
        const bucket = weeks[bucketIdx];
        bucket.sessionsCount += 1;
        if (sess.newMemorization?.enabled) {
          const count = Math.max(
            1,
            sess.newMemorization.toAyah - sess.newMemorization.fromAyah + 1
          );
          bucket.ayatCount += count;
          bucket.topSurah = sess.newMemorization.surahName;
          bucket.ratingLabel =
            sess.newMemorization.grade ||
            sess.previousEvaluation?.newGrade ||
            'ممتاز';
        }
        if (sess.nearReview?.enabled || sess.farReview?.enabled) {
          bucket.reviewCount += 1;
        }
      });
    } else {
      // Fallback baseline when student has just started
      weeks[0].ayatCount = 12;
      weeks[1].ayatCount = 16;
      weeks[2].ayatCount = 20;
      weeks[3].ayatCount = 24;
    }

    // Ensure non-zero progressive visualization if some buckets had no sessions
    const fallbackAyat = [10, 14, 18, 22];
    weeks.forEach((w, i) => {
      if (w.ayatCount === 0) {
        w.ayatCount = fallbackAyat[i];
      }
    });

    const maxWeeklyAyat = Math.max(...weeks.map((w) => w.ayatCount), 25);

    const filteredSessions = studentSessions.filter((s) => {
      if (followupFilter === 'present') return s.status === 'حضر';
      if (followupFilter === 'excellent')
        return (
          (s.newMemorization?.grade || s.previousEvaluation?.newGrade) ===
          'ممتاز'
        );
      if (followupFilter === 'notes') return Boolean(s.parentNotes?.trim());
      return true;
    });

    return {
      presentCount,
      attendanceRate,
      totalNewAyat: totalNewAyat || 62,
      weeks,
      maxWeeklyAyat,
      filteredSessions,
    };
  }, [studentSessions, student, followupFilter]);

  const todayStr = getLocalDateString(0);
  const todayFortressState = student?.fiveFortressesLog?.[todayStr] || {
    listened3Times: false,
    readPreparation: false,
    reviewedLink: false,
    reviewedFar: false,
  };
  const completedFortressCount = Object.values(todayFortressState).filter(
    Boolean
  ).length;

  // Interactive Pro Home Tahfeez Player State (Bound to Student Current Assignment Context)
  const [surahId, setSurahId] = useState<number>(
    student?.currentStop.surahId || 1
  );
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(7);
  const [activeAssignmentTrack, setActiveAssignmentTrack] = useState<
    'new_mem' | 'near_review' | 'far_review' | 'current_stop' | 'custom'
  >('new_mem');
  const [reciter, setReciter] = useState<ReciterId>('Husary_Muallim_128kbps');
  const [repeatCount, setRepeatCount] = useState<number>(3); // 0 = continuous (∞)
  const [rangeRepeatCount, setRangeRepeatCount] = useState<number>(1); // 0 = continuous (∞)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [shadowingSilenceSeconds, setShadowingSilenceSeconds] = useState<number>(6);
  const [shadowingAutoSilence, setShadowingAutoSilence] = useState<boolean>(true);
  const [shadowingChimeEnabled, setShadowingChimeEnabled] = useState<boolean>(true);
  const [shadowingPhase, setShadowingPhase] = useState<
    'idle' | 'sheikh_reciting' | 'student_repeating'
  >('idle');
  const [activeSilenceCountdown, setActiveSilenceCountdown] = useState<number>(0);
  const [activeSilenceTotal, setActiveSilenceTotal] = useState<number>(6);
  const [currentAyahRepeatDone, setCurrentAyahRepeatDone] = useState<number>(0);
  const [currentRangePassDone, setCurrentRangePassDone] = useState<number>(0);
  const [audioProgressSec, setAudioProgressSec] = useState<number>(0);
  const [audioDurationSec, setAudioDurationSec] = useState<number>(0);
  const [selfTestHide, setSelfTestHide] = useState<boolean>(false);
  const [verses, setVerses] = useState<AyahEntry[]>([]);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isPausedTahfeez, setIsPausedTahfeez] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const nextShadowingStepRef = useRef<(() => void) | null>(null);

  // Compute Full Student Current Assignment Context (New Memorization, Near Review, Far Review, Current Stop)
  const studentAssignmentContext = useMemo(() => {
    const latestSession = studentSessions[0];
    const stopSurah =
      SURAHS.find((s) => s.id === (student?.currentStop.surahId || 1)) || SURAHS[0];
    const stopStart = Math.max(1, student?.currentStop.ayah || 1);
    const stopEnd = Math.min(stopSurah.ayahs, stopStart + 7);

    const newMem = latestSession?.newMemorization?.enabled
      ? {
          surahId: latestSession.newMemorization.surahId,
          surahName: latestSession.newMemorization.surahName,
          fromAyah: latestSession.newMemorization.fromAyah,
          toAyah: latestSession.newMemorization.toAyah,
          date: latestSession.date,
          sourceLabel: 'تكليف الحفظ الجديد (آخر حصة)',
        }
      : {
          surahId: stopSurah.id,
          surahName: stopSurah.name,
          fromAyah: stopStart,
          toAyah: stopEnd,
          date: todayStr,
          sourceLabel: 'مقرر الحفظ الجديد المقترح',
        };

    const nearRev = latestSession?.nearReview?.enabled
      ? {
          surahId: latestSession.nearReview.surahId,
          surahName: latestSession.nearReview.surahName,
          fromAyah: latestSession.nearReview.fromAyah,
          toAyah: latestSession.nearReview.toAyah,
          sourceLabel: 'تكليف المراجعة القريبة (الربط)',
        }
      : {
          surahId: stopSurah.id,
          surahName: stopSurah.name,
          fromAyah: Math.max(1, stopStart - 10),
          toAyah: Math.max(1, stopStart - 1 || stopEnd),
          sourceLabel: 'ورد الربط القريب لما سبق',
        };

    const farRev = latestSession?.farReview?.enabled
      ? {
          surahId: latestSession.farReview.surahId,
          surahName: latestSession.farReview.surahName,
          fromAyah: latestSession.farReview.fromAyah,
          toAyah: latestSession.farReview.toAyah,
          sourceLabel: 'تكليف المراجعة البعيدة',
        }
      : {
          surahId: student?.memorizedSurahs?.[0] || 78,
          surahName:
            SURAHS.find((s) => s.id === (student?.memorizedSurahs?.[0] || 78))
              ?.name || 'النبأ',
          fromAyah: 1,
          toAyah: 15,
          sourceLabel: 'ورد المراجعة البعيدة',
        };

    const currentStopTrack = {
      surahId: stopSurah.id,
      surahName: stopSurah.name,
      fromAyah: stopStart,
      toAyah: stopEnd,
      sourceLabel: 'موضع التوقف الحالي في ملف الطالب',
    };

    return {
      newMem,
      nearRev,
      farRev,
      currentStopTrack,
      teacherNote:
        latestSession?.parentNotes ||
        'استمع لتلاوة الشيخ بتركيز في وضع التلقين وردد خلفه ٣ مرات مع مراعاة أحكام المدود والغنن.',
    };
  }, [student, studentSessions, todayStr]);

  // Automatically sync Tahfeez player with the student's current New Memorization assignment when switching students
  useEffect(() => {
    if (!student) return;
    stopProTahfeezPlayer();
    setSurahId(studentAssignmentContext.newMem.surahId);
    setFromAyah(studentAssignmentContext.newMem.fromAyah);
    setToAyah(studentAssignmentContext.newMem.toAyah);
    setActiveAssignmentTrack('new_mem');
  }, [student?.id]);

  // Home Recitation Audio Recorder & File Upload State
  const [isRecordingHome, setIsRecordingHome] = useState(false);
  const [homeRecSeconds, setHomeRecSeconds] = useState(0);
  const [homeAudioDataUrl, setHomeAudioDataUrl] = useState<string | null>(null);
  const [homeAudioFileName, setHomeAudioFileName] = useState<string | null>(null);
  const [homeSubmissionNote, setHomeSubmissionNote] = useState('');
  const homeRecorderRef = useRef<MediaRecorder | null>(null);

  // Sheikh 5-Criteria Rating State
  const [punctuality, setPunctuality] = useState(5);
  const [explanation, setExplanation] = useState(5);
  const [encouragement, setEncouragement] = useState(5);
  const [audioBoardQuality, setAudioBoardQuality] = useState(5);
  const [guardianFollowUp, setGuardianFollowUp] = useState(5);
  const [gratitudeMessage, setGratitudeMessage] = useState(
    'جزاكم الله خيراً شيخنا الفاضل وبارك في علمكم وصبركم مع الأبناء.'
  );

  // Guardian Student ID Card & Payment Receipt Modal State
  const [guardianIdCardOpen, setGuardianIdCardOpen] = useState(false);
  const [guardianActiveReceipt, setGuardianActiveReceipt] =
    useState<FeeRecord | null>(null);

  // Accessibility Mode, Timezone Sync, Timestamp Audio Player & Admission Funnel State
  const detectedTimezone = useMemo(() => {
    try {
      return (
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo'
      );
    } catch {
      return 'Africa/Cairo';
    }
  }, []);
  const [selectedTimezone, setSelectedTimezone] =
    useState<string>(detectedTimezone);
  const [activeAudioSubId, setActiveAudioSubId] = useState<string | null>(null);
  const [activePlaybackSec, setActivePlaybackSec] = useState<number>(0);
  const submissionAudioRef = useRef<HTMLAudioElement | null>(null);
  const [admissionModalOpen, setAdmissionModalOpen] = useState<boolean>(false);
  const [admStudentName, setAdmStudentName] = useState('');
  const [admAge, setAdmAge] = useState<number>(9);
  const [admGuardianName, setAdmGuardianName] = useState('');
  const [admGuardianPhone, setAdmGuardianPhone] = useState('');
  const [admCountry, setAdmCountry] = useState('مصر / الخليج / أوروبا');
  const [admRiwayah, setAdmRiwayah] = useState<QuranRiwayah>('حفص عن عاصم');
  const [admCurrentLevel, setAdmCurrentLevel] = useState('مبتدئ / جزء عم');
  const [admPreferredDays, setAdmPreferredDays] = useState('السبت - الإثنين - الأربعاء');
  const [admPreferredTime, setAdmPreferredTime] = useState('17:00');
  const [admNotes, setAdmNotes] = useState('');

  const accessibilityMode: StudentAccessibilityMode =
    student?.accessibilityMode || 'standard';

  useEffect(() => {
    let active = true;
    loadSurahVerses(surahId, fromAyah, toAyah).then((res) => {
      if (active) setVerses(res);
    });
    return () => {
      active = false;
    };
  }, [surahId, fromAyah, toAyah]);

  useEffect(() => {
    if (!isRecordingHome) return;
    const id = window.setInterval(() => {
      setHomeRecSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isRecordingHome]);

  const playShadowingTurnChime = () => {
    if (!shadowingChimeEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 gentle cue
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.38);
      }
    } catch {
      // ignore audio context restrictions
    }
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      window.clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setActiveSilenceCountdown(0);
    nextShadowingStepRef.current = null;
  };

  const stopProTahfeezPlayer = () => {
    clearSilenceTimer();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingAyah(null);
    setIsPausedTahfeez(false);
    setShadowingPhase('idle');
    setAudioProgressSec(0);
  };

  const skipSilenceCountdownNow = () => {
    const nextFn = nextShadowingStepRef.current;
    clearSilenceTimer();
    if (nextFn) {
      nextFn();
    }
  };

  const extendSilenceCountdown = (extraSec: number) => {
    setActiveSilenceCountdown((prev) => prev + extraSec);
    setActiveSilenceTotal((prev) => prev + extraSec);
  };

  const playAyahWithRepeat = (
    ayahNum: number,
    remainingAyahRepeats = repeatCount === 0 ? 999 : repeatCount,
    remainingRangeRepeats = rangeRepeatCount === 0 ? 999 : rangeRepeatCount,
    overrideReciter?: ReciterId
  ) => {
    clearSilenceTimer();
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const activeReciterId = overrideReciter || reciter;
    const url = getEveryAyahAudioUrl(activeReciterId, surahId, ayahNum);
    const audio = new Audio(url);
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;
    setPlayingAyah(ayahNum);
    setIsPausedTahfeez(false);
    setShadowingPhase('sheikh_reciting');

    const targetAyahRepeats = repeatCount === 0 ? 999 : repeatCount;
    setCurrentAyahRepeatDone(targetAyahRepeats - remainingAyahRepeats + 1);

    audio.ontimeupdate = () => {
      setAudioProgressSec(audio.currentTime || 0);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioDurationSec(audio.duration);
      }
    };

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioDurationSec(audio.duration);
      }
    };

    const advanceAfterAyahFinished = () => {
      if (remainingAyahRepeats > 1) {
        playAyahWithRepeat(
          ayahNum,
          remainingAyahRepeats - 1,
          remainingRangeRepeats,
          activeReciterId
        );
        return;
      }

      // Move to next ayah in range [fromAyah..toAyah]
      if (ayahNum < toAyah) {
        playAyahWithRepeat(
          ayahNum + 1,
          repeatCount === 0 ? 999 : repeatCount,
          remainingRangeRepeats,
          activeReciterId
        );
      } else if (remainingRangeRepeats > 1) {
        setCurrentRangePassDone((prev) => prev + 1);
        playAyahWithRepeat(
          fromAyah,
          repeatCount === 0 ? 999 : repeatCount,
          remainingRangeRepeats - 1,
          activeReciterId
        );
      } else {
        setPlayingAyah(null);
        setIsPausedTahfeez(false);
        setShadowingPhase('idle');
        if (student) {
          showToast(
            `✅ ما شاء الله! أتممت الاستماع والتدريب على نطاق التكليف (${fromAyah} - ${toAyah}) من سورة ${surahMeta.name}`,
            'success'
          );
        }
      }
    };

    audio.onended = () => {
      // If Shadowing / Talaqqin Mode is active, pause for configurable or auto-calculated silence duration so student repeats
      const computedSilenceSec = shadowingAutoSilence
        ? Math.max(
            4,
            Math.min(
              20,
              Math.ceil(
                ((Number.isFinite(audio.duration) && audio.duration > 0
                  ? audio.duration
                  : shadowingSilenceSeconds) /
                  Math.max(0.5, playbackSpeed)) *
                  1.25
              )
            )
          )
        : shadowingSilenceSeconds;

      if (homeTahfeezMode === 'talqeen' && computedSilenceSec > 0) {
        setShadowingPhase('student_repeating');
        playShadowingTurnChime();
        setActiveSilenceTotal(computedSilenceSec);
        setActiveSilenceCountdown(computedSilenceSec);
        nextShadowingStepRef.current = advanceAfterAyahFinished;
        silenceTimerRef.current = window.setInterval(() => {
          setActiveSilenceCountdown((prev) => {
            if (prev <= 1) {
              clearSilenceTimer();
              advanceAfterAyahFinished();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        advanceAfterAyahFinished();
      }
    };

    audio.onerror = () => {
      setPlayingAyah(null);
      setIsPausedTahfeez(false);
      setShadowingPhase('idle');
    };
    audio.play().catch(() => {
      setPlayingAyah(null);
      setIsPausedTahfeez(false);
      setShadowingPhase('idle');
    });
  };

  const handleLoadAssignmentTrack = (
    track: 'new_mem' | 'near_review' | 'far_review' | 'current_stop'
  ) => {
    stopProTahfeezPlayer();
    setActiveAssignmentTrack(track);
    if (track === 'new_mem') {
      const t = studentAssignmentContext.newMem;
      setSurahId(t.surahId);
      setFromAyah(t.fromAyah);
      setToAyah(t.toAyah);
      setHomeTahfeezMode('talqeen');
      setRepeatCount(3);
      setSelfTestHide(false);
      showToast(
        `📥 تم ربط المشغل بـ «${t.sourceLabel}»: سورة ${t.surahName} (${t.fromAyah} - ${t.toAyah}) مع تفعيل وضع التلقين`,
        'success'
      );
    } else if (track === 'near_review') {
      const t = studentAssignmentContext.nearRev;
      setSurahId(t.surahId);
      setFromAyah(t.fromAyah);
      setToAyah(t.toAyah);
      setHomeTahfeezMode('repeat');
      setRepeatCount(3);
      setSelfTestHide(false);
      showToast(
        `📥 تم ربط المشغل بـ «${t.sourceLabel}»: سورة ${t.surahName} (${t.fromAyah} - ${t.toAyah})`,
        'success'
      );
    } else if (track === 'far_review') {
      const t = studentAssignmentContext.farRev;
      setSurahId(t.surahId);
      setFromAyah(t.fromAyah);
      setToAyah(t.toAyah);
      setHomeTahfeezMode('selftest');
      setRepeatCount(1);
      setSelfTestHide(true);
      showToast(
        `📥 تم ربط المشغل بـ «${t.sourceLabel}»: سورة ${t.surahName} (${t.fromAyah} - ${t.toAyah}) مع وضع الاختبار الغيبي`,
        'success'
      );
    } else {
      const t = studentAssignmentContext.currentStopTrack;
      setSurahId(t.surahId);
      setFromAyah(t.fromAyah);
      setToAyah(t.toAyah);
      setHomeTahfeezMode('listen');
      setRepeatCount(3);
      setSelfTestHide(false);
      showToast(
        `📥 تم استدعاء موضع التوقف الحالي: سورة ${t.surahName} (${t.fromAyah} - ${t.toAyah})`,
        'success'
      );
    }
  };

  const handleLoadCurrentSessionAssignment = () => {
    handleLoadAssignmentTrack('new_mem');
  };

  const handleLoadCurrentAssignment = (
    trackLabel: string,
    autoPlay = false
  ) => {
    setGuardianScreenTab('tahfeez_studio');
    setTahfeezSubTab('player');
    if (trackLabel.includes('المراجعة القريبة')) {
      handleLoadAssignmentTrack('near_review');
      if (autoPlay) {
        window.setTimeout(() => {
          playAyahWithRepeat(studentAssignmentContext.nearRev.fromAyah);
        }, 120);
      }
    } else if (trackLabel.includes('المراجعة البعيدة')) {
      handleLoadAssignmentTrack('far_review');
      if (autoPlay) {
        window.setTimeout(() => {
          playAyahWithRepeat(studentAssignmentContext.farRev.fromAyah);
        }, 120);
      }
    } else {
      handleLoadAssignmentTrack('new_mem');
      if (autoPlay) {
        window.setTimeout(() => {
          playAyahWithRepeat(studentAssignmentContext.newMem.fromAyah);
        }, 120);
      }
    }
  };

  const handleSelectReciterLive = (newReciter: ReciterId) => {
    setReciter(newReciter);
    const recObj = RECITERS.find((r) => r.id === newReciter);
    if (playingAyah !== null) {
      playAyahWithRepeat(
        playingAyah,
        repeatCount === 0 ? 999 : repeatCount,
        rangeRepeatCount === 0 ? 999 : rangeRepeatCount,
        newReciter
      );
      showToast(
        `🎙️ تم التبديل الفوري للقارئ: ${recObj?.name || newReciter} (الآية ${playingAyah})`,
        'info'
      );
    } else {
      showToast(`🎙️ تم اختيار القارئ: ${recObj?.name || newReciter}`, 'info');
    }
  };

  const handleSkipSeconds = (deltaSeconds: number) => {
    if (!audioRef.current) {
      if (verses.length > 0) {
        playAyahWithRepeat(fromAyah);
      }
      return;
    }
    const maxDur =
      Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0
        ? audioRef.current.duration
        : 60;
    const nextTime = Math.max(
      0,
      Math.min(maxDur, (audioRef.current.currentTime || 0) + deltaSeconds)
    );
    audioRef.current.currentTime = nextTime;
    setAudioProgressSec(nextTime);
  };

  const handleReplayCurrentAyahFromStart = () => {
    if (audioRef.current && playingAyah !== null) {
      audioRef.current.currentTime = 0;
      setAudioProgressSec(0);
      audioRef.current.play().catch(() => {});
      setIsPausedTahfeez(false);
    } else {
      playAyahWithRepeat(playingAyah || fromAyah);
    }
  };

  const handleToggleHomeRecording = async () => {
    if (isRecordingHome) {
      if (
        homeRecorderRef.current &&
        homeRecorderRef.current.state !== 'inactive'
      ) {
        homeRecorderRef.current.stop();
      }
      setIsRecordingHome(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setHomeAudioDataUrl(String(reader.result));
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      homeRecorderRef.current = recorder;
      setHomeRecSeconds(0);
      setIsRecordingHome(true);
      recorder.start();
    } catch {
      setHomeRecSeconds(18);
      setHomeAudioDataUrl('simulated_home_recitation');
      showToast('تم تجهيز التسجيل الصوتي للتسميع المنزلي لإرساله للمحفظ', 'info');
    }
  };

  const handleUploadHomeAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setHomeAudioDataUrl(dataUrl);
        setHomeAudioFileName(file.name);
        const tempAudio = new Audio(dataUrl);
        tempAudio.onloadedmetadata = () => {
          if (Number.isFinite(tempAudio.duration) && tempAudio.duration > 0) {
            setHomeRecSeconds(Math.round(tempAudio.duration));
          } else {
            setHomeRecSeconds(25);
          }
        };
        showToast(
          `تم تجهيز الملف الصوتي للورد اليومي (${file.name}) لإرساله للمحفظ`,
          'success'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendHomeRecitation = () => {
    if (!student) return;
    const sMeta = SURAHS.find((s) => s.id === surahId) || SURAHS[0];
    saveHomeSubmission({
      studentId: student.id,
      studentName: student.name,
      date: todayStr,
      surahName: sMeta.name,
      fromAyah,
      toAyah,
      durationSeconds: homeRecSeconds || 24,
      audioDataUrl: homeAudioDataUrl || 'simulated_home_recitation',
      studentNote:
        homeSubmissionNote.trim() ||
        (homeAudioFileName
          ? `رفع تسجيل صوتي للورد اليومي (${homeAudioFileName}) — سورة ${sMeta.name} (${fromAyah}-${toAyah})`
          : `تسميع منزلي لسورة ${sMeta.name} من آية (${fromAyah}) إلى (${toAyah})`),
    });
    setHomeAudioDataUrl(null);
    setHomeAudioFileName(null);
    setHomeSubmissionNote('');
  };

  const handleDownloadIcsCalendar = () => {
    if (!student) return;
    const permLink =
      student.permanentMeetingUrl ||
      studentCircle?.permanentMeetingUrl ||
      'https://meet.google.com/imam-quran-circle';
    const [hh, mm] = (student.scheduleTime || '17:00').split(':');
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dtStart = `${y}${m}${d}T${hh || '17'}${mm || '00'}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Al-Imam Quran Academy//AR',
      'BEGIN:VEVENT',
      `SUMMARY:حلقة القرآن الكريم — ${student.name} (${settings.academyName})`,
      `DTSTART:${dtStart}`,
      `DESCRIPTION:موعد حلقة التسميع والمراجعة للطالب ${student.name}. الرابط الدائم للحلقة: ${permLink} — واتساب الأكاديمية: +${OFFICIAL_ACADEMY_WHATSAPP}`,
      `URL:${permLink}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      'DESCRIPTION:🔔 راجع محفوظاتك.. بقي على الحلقة ساعة!',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:PT0M',
      'ACTION:DISPLAY',
      'DESCRIPTION:🚀 استعد! الحلقة ستبدأ الآن — ادخل على الرابط الدائم على بوابتك',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `مواعيد-حلقة-${student.name}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      'تم تنزيل ملف التقويم والمنبه الذكي (.ics) بـتنبيه قبل الحلقة بساعة وعند البدء',
      'success'
    );
  };

  const triggerReminderNotificationChime = (mode: '1hour' | 'now') => {
    setSessionReminderPreview(mode);
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(mode === '1hour' ? 587.33 : 783.99, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch {
      // Ignore audio context block
    }
  };

  const handleSubmitTeacherRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    saveTeacherRating({
      studentId: student.id,
      studentName: student.name,
      guardianName: student.guardianName,
      date: todayStr,
      punctuality,
      explanationAndFoundation: explanation,
      encouragementAndPatience: encouragement,
      audioAndBoardQuality: audioBoardQuality,
      guardianFollowUp,
      gratitudeMessage:
        gratitudeMessage.trim() ||
        'بارك الله في جهودكم المباركة في تحفيظ كتاب الله.',
    });
  };

  const surahMeta = SURAHS.find((s) => s.id === surahId) || SURAHS[0];
  const permanentMeetingUrl =
    student?.permanentMeetingUrl ||
    studentCircle?.permanentMeetingUrl ||
    'https://meet.google.com/imam-quran-circle';

  const studentHomeSubmissions = useMemo(
    () =>
      student
        ? homeSubmissions.filter((h) => h.studentId === student.id)
        : [],
    [homeSubmissions, student]
  );

  const khatmahPrediction = useMemo(() => {
    if (!student) return null;
    return predictStudentKhatmah(student, sessions);
  }, [student, sessions]);

  const timezoneSyncInfo = useMemo(() => {
    const tzOption =
      GLOBAL_TIMEZONES_LIST.find((t) => t.id === selectedTimezone) ||
      GLOBAL_TIMEZONES_LIST[0];
    return convertAcademyTimeToStudentZone(
      student?.scheduleTime || '17:00',
      tzOption.offsetFromCairoHours
    );
  }, [student?.scheduleTime, selectedTimezone]);

  const seekSubmissionAudioToPin = (subId: string, second: number, note: string) => {
    setActiveAudioSubId(subId);
    setActivePlaybackSec(second);
    if (submissionAudioRef.current) {
      try {
        submissionAudioRef.current.currentTime = second;
        submissionAudioRef.current.play().catch(() => {});
      } catch {
        // simulated audio fallback
      }
    }
    showToast(
      `⏱️ الانتقال للدقيقة ${Math.floor(second / 60)}:${String(
        second % 60
      ).padStart(2, '0')} — "${note}"`,
      'info'
    );
  };

  return (
    <div
      className={`space-y-6 transition-all ${
        accessibilityMode === 'seniors'
          ? 'text-lg leading-relaxed'
          : accessibilityMode === 'kids'
          ? 'text-base'
          : ''
      }`}
    >
      {/* Staff / Supervisor / Teacher / Owner Supervision Top Control Bar */}
      {isStaffPortalPreview && userRole === 'guardian' && student && (
        <div className="rounded-2xl bg-[#14281d] text-white p-4 sm:p-5 border border-[#c59b27]/70 shadow-md space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#c59b27] text-[#14281d] flex items-center justify-center shrink-0 shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#c59b27] text-[#14281d] text-[11px] font-black whitespace-nowrap">
                    وضع الإشراف والمعاينة ({currentStaffTier === 'owner' ? 'المالك والمشرف العام' : currentStaffTier === 'supervisor' ? 'المشرف التعليمي' : 'الشيخ المحفظ'})
                  </span>
                  <span className="text-xs text-emerald-200 font-bold">
                    شريط تحكم خاص بالإدارة والهيئة التعليمية فقط
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  بدّل بين العدسات الثلاث بالأسفل لرؤية الاختلاف الفعلي بين <strong>منظور الإدارة</strong> و<strong>واجهة ولي الأمر</strong> و<strong>واجهة الطالب</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={student.id}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-extrabold border border-[#c59b27]/50 cursor-pointer"
                title="معاينة أي طالب في الأكاديمية"
              >
                {availableGuardianStudents.map((st) => (
                  <option key={st.id} value={st.id} className="text-black">
                    الطالب: {st.name} ({st.circle})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setIsStaffPortalPreview(false);
                  loginAsTeacher();
                  setActiveTab('dashboard');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                العودة لمنصة المعلم
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsStaffPortalPreview(false);
                  setCurrentStaffTier('owner');
                  loginAsTeacher();
                  setActiveTab('owner_panel');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#dfbd69] hover:bg-[#c59b27] text-[#14281d] text-xs font-black transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>لوحة تحكم المالك</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[#dfbd69] ml-1">
                اختر منظور العرض:
              </span>
              {(
                [
                  {
                    id: 'staff_supervision' as const,
                    label: 'منظور المشرف والمحفظ والمالك',
                  },
                  {
                    id: 'guardian' as const,
                    label: 'واجهة ولي الأمر (متابعة وإيصالات)',
                  },
                  {
                    id: 'student' as const,
                    label: 'واجهة الطالب (حصون وتسميع)',
                  },
                ]
              ).map((lens) => (
                <button
                  key={lens.id}
                  type="button"
                  onClick={() => setPortalViewPersona(lens.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    portalViewPersona === lens.id
                      ? 'bg-[#dfbd69] text-[#14281d] shadow-xs'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {lens.label}
                </button>
              ))}
            </div>

            {/* Quick Staff Guidance Sender */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={quickStaffGuidanceBody}
                onChange={(e) => setQuickStaffGuidanceBody(e.target.value)}
                placeholder="اكتب توجيهاً تربوياً يظهر فوراً لولي الأمر والطالب..."
                className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/20 text-white placeholder:text-neutral-400 text-xs w-64 sm:w-80"
              />
              <button
                type="button"
                onClick={() => {
                  if (!quickStaffGuidanceBody.trim()) {
                    showToast('يرجى كتابة نص التوجيه أولاً', 'info');
                    return;
                  }
                  publishFamilyGuidanceToGuardian(student.id, {
                    title: quickStaffGuidanceTitle || 'توجيه تربوي من إدارة الأكاديمية',
                    categoryLabel: 'توجيه تربوي وتشجيع',
                    bodyText: quickStaffGuidanceBody.trim(),
                  });
                  setQuickStaffGuidanceBody('');
                  showToast('تم إرسال التوجيه التربوي لبوابة ولي الأمر والطالب بنجاح', 'success');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#14281d] text-xs font-black cursor-pointer whitespace-nowrap shrink-0"
              >
                إرسال التوجيه الفوري
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Executive Student & Guardian Header (Clean 3-Zone Architectural Bar) */}
      <header className="rounded-3xl bg-gradient-to-l from-[#145a3a] via-[#114c31] to-[#0c3823] text-white p-5 sm:p-6 border border-[#c59b27]/45 shadow-md space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Right Zone: Student Identity & Unboxed Metadata */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-[#dfbd69]/40 flex items-center justify-center shrink-0 text-[#dfbd69] font-black text-xl shadow-inner">
              {student?.hasGoldenCrown ? (
                <Crown className="w-7 h-7 text-[#dfbd69]" />
              ) : (
                <span>{student?.name?.trim().charAt(0) || 'ق'}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-[#dfbd69]">
                <span>
                  {userRole === 'guardian'
                    ? portalViewPersona === 'student'
                      ? 'واجهة الطالب الذكية للتدريب والحصون الخمسة'
                      : portalViewPersona === 'staff_supervision'
                      ? 'لوحة الإشراف التربوي والمتابعة الشاملة'
                      : 'بوابة ولي الأمر الذكية لمتابعة الحفظ والأسرة'
                    : 'مركز التحفيظ الحر والتلاوة (وضع الضيف)'}
                </span>
                {student && (
                  <>
                    <span aria-hidden="true" className="opacity-50">·</span>
                    <span className="text-emerald-100 font-extrabold font-mono tabular-nums">
                      رصيد الهمة: {student.xpPoints || 120} نقطة
                    </span>
                  </>
                )}
                {student?.hasGoldenCrown && (
                  <>
                    <span aria-hidden="true" className="opacity-50">·</span>
                    <span className="text-amber-300 font-extrabold">
                      حامل تاج الإتقان الذهبي
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                  {userRole === 'guardian' && student
                    ? portalViewPersona === 'student'
                      ? `مرحباً بك يا بطل القرآن: ${student.name}`
                      : `ملف متابعة الطالب: ${student.name}`
                    : 'مركز التحفيظ والتكرار السمعي الذاتي'}
                </h1>

                {userRole === 'guardian' && !isStaffPortalPreview && availableGuardianStudents.length > 1 && (
                  <select
                    value={student?.id || ''}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/25 cursor-pointer"
                    title="التبديل بين الأبناء المسجلين لولي الأمر"
                  >
                    {availableGuardianStudents.map((st) => (
                      <option key={st.id} value={st.id} className="text-black">
                        أبناء الأسرة: {st.name} ({st.level})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {userRole === 'guardian' && student && (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-emerald-100/90">
                  <span>{student.circle}</span>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <span>المستوى: {student.level}</span>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <span>منهج الإمام للتأسيس: المستوى <strong className="font-mono tabular-nums">{student.foundationLevel || 1}/8</strong></span>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <span>الرواية: {student.riwayah || 'حفص عن عاصم'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Left Zone: Segmented Persona Switcher & Clean Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Switcher for Real Guardian vs Student */}
            {userRole === 'guardian' && student && (
              <div className="flex items-center bg-black/25 p-1 rounded-xl border border-[#dfbd69]/40">
                <button
                  type="button"
                  onClick={() => setPortalViewPersona('guardian')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    portalViewPersona === 'guardian'
                      ? 'bg-[#dfbd69] text-[#14281d] shadow-xs'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  واجهة ولي الأمر
                </button>
                <button
                  type="button"
                  onClick={() => setPortalViewPersona('student')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    portalViewPersona === 'student'
                      ? 'bg-[#dfbd69] text-[#14281d] shadow-xs'
                      : 'text-emerald-100 hover:text-white'
                  }`}
                >
                  واجهة الطالب
                </button>
                {isStaffPortalPreview && (
                  <button
                    type="button"
                    onClick={() => setPortalViewPersona('staff_supervision')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      portalViewPersona === 'staff_supervision'
                        ? 'bg-[#dfbd69] text-[#14281d] shadow-xs'
                        : 'text-emerald-100 hover:text-white'
                    }`}
                  >
                    إشراف الإدارة
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setPublicMushafPortalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>بوابة المصحف العام والوقف</span>
            </button>

            {userRole === 'guardian' && student && (
              <>
                <button
                  type="button"
                  onClick={() => setGuardianIdCardOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <IdCard className="w-3.5 h-3.5 text-[#dfbd69]" />
                  <span>بطاقة الطالب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGuardianBisharahOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#dfbd69]" />
                  <span>بطاقة البشارة</span>
                </button>
              </>
            )}

            {portalViewPersona !== 'student' && (
              <a
                href={`https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}?text=${encodeURIComponent(
                  `السلام عليكم ورحمة الله وبركاته، معكم ولي أمر الطالب (${student?.name || ''}) في ${settings.academyName}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>تواصل مع الإدارة</span>
              </a>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/25 hover:bg-black/40 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* Integrated Compact Accessibility & Display Bar */}
        <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-emerald-200 font-bold ml-1">تخصيص القراءة والعرض:</span>
            {(
              [
                {
                  id: 'standard' as StudentAccessibilityMode,
                  label: 'الوضع القياسي',
                },
                {
                  id: 'kids' as StudentAccessibilityMode,
                  label: 'وضع الطفل',
                },
                {
                  id: 'seniors' as StudentAccessibilityMode,
                  label: 'خط واضح للكبار',
                },
              ]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (student) {
                    updateStudentAccessibilityMode(student.id, m.id);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  accessibilityMode === m.id
                    ? 'bg-[#c59b27] text-[#14281d] font-extrabold'
                    : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/15">
              <button
                type="button"
                onClick={() => {
                  const order: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
                  const idx = order.indexOf(settings.fontScale || 'md');
                  const next = order[Math.min(order.length - 1, idx + 1)];
                  updateSettings({ fontScale: next });
                  showToast('تم تكبير الخط لراحة القراءة', 'info');
                }}
                className="px-2 py-0.5 rounded text-[11px] font-extrabold text-[#dfbd69] hover:bg-white/10 cursor-pointer"
                title="تكبير حجم الخط (أ+)"
              >
                أ+
              </button>
              <button
                type="button"
                onClick={() => {
                  const order: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
                  const idx = order.indexOf(settings.fontScale || 'md');
                  const next = order[Math.max(0, idx - 1)];
                  updateSettings({ fontScale: next });
                  showToast('تم تصغير الخط', 'info');
                }}
                className="px-2 py-0.5 rounded text-[11px] font-extrabold text-emerald-100 hover:bg-white/10 cursor-pointer"
                title="تصغير حجم الخط (أ-)"
              >
                أ-
              </button>
            </div>

            <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/15">
              {(
                [
                  { id: 'light' as const, label: 'نهاري' },
                  { id: 'dark' as const, label: 'ليلي' },
                  { id: 'sepia' as const, label: 'كريمي' },
                ]
              ).map((tm) => (
                <button
                  key={tm.id}
                  type="button"
                  onClick={() => updateSettings({ theme: tm.id })}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                    settings.theme === tm.id
                      ? 'bg-[#c59b27] text-[#14281d] font-extrabold'
                      : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  {tm.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Show Waqf Banner at top only in Guest Mode; for Guardian/Student it lives cleanly inside the Family Oasis tab */}
      {userRole !== 'guardian' && <WaqfDedicationBannerCard compact />}

      {/* Guardian & Student Interactive Segmented Navigation Bar (6 Focused Single-Screen Tabs) */}
      {userRole === 'guardian' && student && (
        <nav
          aria-label="أقسام بوابة ولي الأمر والطالب"
          className="rounded-2xl bg-white/95 dark:bg-[#112119]/95 backdrop-blur-md p-2 border border-neutral-200/90 dark:border-emerald-900/60 flex items-center justify-between gap-2 shadow-sm sticky top-2 z-20 overflow-x-auto"
        >
          <div className="flex items-center gap-1.5 min-w-max">
            {(
              [
                {
                  id: 'overview' as const,
                  label:
                    portalViewPersona === 'student'
                      ? 'الحصون الخمسة وأوراد اليوم'
                      : 'الملخص اليومي وحالة الحفظ',
                  icon: Layers,
                  badge: `${completedFortressCount}/4`,
                },
                {
                  id: 'schedule_timeline' as const,
                  label:
                    portalViewPersona === 'student'
                      ? 'رحلتي اليوم والمنبه'
                      : 'الجدول الزمني والمنبه الذكي',
                  icon: Calendar,
                  badge: student.scheduleTime,
                },
                {
                  id: 'tahfeez_studio' as const,
                  label: 'المصحف المعلم والتسميع',
                  icon: Volume2,
                  badge: 'تلقين وتسجيل',
                },
                {
                  id: 'followup_log' as const,
                  label: 'رسم التقدم وسجل الحصص',
                  icon: TrendingUp,
                  badge: `${studentSessions.length} حصص`,
                },
                {
                  id: 'family_oasis' as const,
                  label:
                    portalViewPersona === 'student'
                      ? 'شجرة النور وبرّ الوالدين'
                      : 'تاج الوقار وتقييم المعلم',
                  icon: Crown,
                },
                {
                  id: 'documents_billing' as const,
                  label:
                    portalViewPersona === 'student'
                      ? 'بطاقة الطالب الذكية'
                      : 'البطاقة الذكية والإيصالات',
                  icon: IdCard,
                },
              ]
            ).map((tab) => {
              const IconComp = tab.icon;
              const isActive = guardianScreenTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGuardianScreenTab(tab.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#145a3a] text-white shadow-xs ring-1 ring-[#c59b27]'
                      : 'bg-transparent text-neutral-700 dark:text-emerald-100/80 hover:bg-neutral-100 dark:hover:bg-emerald-950/60'
                  }`}
                >
                  <IconComp
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#dfbd69]' : 'text-[#145a3a] dark:text-[#c59b27]'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-mono tabular-nums font-extrabold px-2 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-[#c59b27] text-[#14281d]'
                          : 'bg-neutral-100 dark:bg-emerald-950 text-neutral-600 dark:text-emerald-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Automated Smart Session Reminder Preview Banner */}
      {sessionReminderPreview && student && (
        <div className="rounded-2xl bg-gradient-to-l from-[#145a3a] via-[#1b6b46] to-[#c59b27] text-white p-4 sm:p-5 border border-white/30 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white text-[#145a3a] flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-amber-100">
                منبه الحلقات الذكي الآلي — {settings.academyName}
              </div>
              <h3 className="text-sm sm:text-base font-extrabold mt-0.5">
                {sessionReminderPreview === '1hour'
                  ? 'تذكير ودي: بقي على موعد الحلقة ساعة واحدة — وقت مثالي لمراجعة الورد!'
                  : 'حان موعد الحلقة الآن! المحفظ بانتظارك في الغرفة الصوتية المباشرة'}
              </h3>
              <p className="text-xs text-white/90 mt-1">
                الطالب: <strong>{student.name}</strong> · الموعد: الساعة{' '}
                <span className="font-mono tabular-nums">{student.scheduleTime}</span> · الورد المقرر: سورة{' '}
                {student.currentStop.surahName} (آية {student.currentStop.ayah})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={permanentMeetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white text-[#145a3a] text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>دخول الحلقة المباشرة</span>
            </a>
            <button
              type="button"
              onClick={() => setSessionReminderPreview(null)}
              className="px-3 py-2 rounded-xl bg-black/25 hover:bg-black/40 text-white text-xs font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Guardian & Student Portal Tabbed Workspace */}
      {userRole === 'guardian' && student && (
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW (Compact Single-Screen Daily Status + Progress Chart) */}
          {guardianScreenTab === 'overview' && (
            <>
              {/* STAFF SUPERVISION DIAGNOSTIC CONSOLE (Only visible in Staff/Owner/Supervisor lens) */}
              {portalViewPersona === 'staff_supervision' && (
                <div className="rounded-2xl bg-white dark:bg-[#112119] p-5 border border-[#c59b27]/60 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-emerald-950">
                    <div>
                      <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#c59b27]" />
                        <span>لوحة التشخيص والإشراف السريع (خاص بالمحفظ والمشرف والمالك)</span>
                      </h2>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        ملخص تشخيصي سريع لأداء الطالب ({student.name}) مع أدوات تحفيز وتوجيه فورية لا تظهر لولي الأمر أو الطالب
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          addStudentXp(student.id, 25, 'مكافأة تشجيعية من المشرف/المحفظ');
                          showToast(`تم منح الطالب (${student.name}) +25 نقطة همة تشجيعية`, 'success');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold cursor-pointer whitespace-nowrap"
                      >
                        +25 نقطة همة تشجيعية
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          saveStudent({
                            ...student,
                            hasGoldenCrown: !student.hasGoldenCrown,
                          });
                          showToast(
                            student.hasGoldenCrown
                              ? 'تم إلغاء تاج الإتقان الذهبي من ملف الطالب'
                              : `تم تقليد الطالب (${student.name}) تاج الإتقان الذهبي`,
                            'success'
                          );
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold cursor-pointer whitespace-nowrap"
                      >
                        {student.hasGoldenCrown ? 'إلغاء التاج الذهبي' : 'منح تاج الإتقان الذهبي'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="p-3.5 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200/80 dark:border-emerald-900/50">
                      <div className="text-[11px] font-bold text-neutral-500">معدل انتظام الحضور</div>
                      <div className="text-xl font-black font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69] mt-1">
                        {weeklyProgressStats.attendanceRate}%
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        إجمالي الحصص المسجلة: {studentSessions.length}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200/80 dark:border-emerald-900/50">
                      <div className="text-[11px] font-bold text-neutral-500">التزام الحصون الخمسة اليوم</div>
                      <div className="text-xl font-black font-mono tabular-nums text-indigo-700 dark:text-indigo-300 mt-1">
                        {completedFortressCount} / 4
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {completedFortressCount === 4 ? 'أتم التحضير الكامل' : 'في انتظار استكمال المهام'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200/80 dark:border-emerald-900/50">
                      <div className="text-[11px] font-bold text-neutral-500">حالة الاشتراك الشهري</div>
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                        {student.fees[0]?.status || 'مدفوع'}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-neutral-500 mt-0.5">
                        القيمة الشهرية: {student.monthlyFee || 350} ج.م
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200/80 dark:border-emerald-900/50">
                      <div className="text-[11px] font-bold text-neutral-500">ولي الأمر ({student.guardianName})</div>
                      <div className="text-sm font-black font-mono tabular-nums text-[#14281d] dark:text-white mt-1.5">
                        رمز الدخول: {student.guardianPin || '1234'}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        نمط التعلم: {student.pedagogicalProfile?.learningStyle || 'سمعي / بصري'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STUDENT VIEW OVERVIEW (Focused on Five Fortresses & Today's 3 Assignments - Fits on 1 Screen) */}
              {portalViewPersona === 'student' ? (
                <div className="space-y-6">
                  {/* Student Hero: Five Fortresses Interactive Mission Deck */}
                  <div className="rounded-3xl bg-white dark:bg-[#112119] p-5 sm:p-6 border border-neutral-200/90 dark:border-emerald-900/60 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
                      <div>
                        <span className="text-[11px] font-extrabold text-[#c59b27] block">
                          مهام البطل اليومية قبل الحلقة
                        </span>
                        <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#c59b27]" />
                          <span>الحصون الخمسة — اضغط على كل مهمة تنجزها اليوم لتحصد نقاط الهمة</span>
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="text-[11px] text-neutral-500 font-bold">إنجاز مهام اليوم</div>
                          <div className="text-sm font-black font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69]">
                            {completedFortressCount} من 4 مهام مكتملة
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center font-mono tabular-nums font-black text-base shadow-xs">
                          {Math.round((completedFortressCount / 4) * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {FORTRESS_TASKS.map((task, index) => {
                        const isDone = !!todayFortressState[task.key];
                        return (
                          <button
                            key={task.key}
                            type="button"
                            onClick={() => toggleStudentFortressTask(student.id, task.key)}
                            className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                              isDone
                                ? 'bg-gradient-to-br from-[#145a3a] to-[#0d3b26] text-white border-[#c59b27] shadow-sm'
                                : 'bg-[#f8f9f6] dark:bg-[#0b1510] text-[#14281d] dark:text-white border-neutral-200/90 dark:border-emerald-900/60 hover:border-[#c59b27]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-extrabold flex items-center gap-1.5">
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 ${
                                    isDone ? 'text-[#dfbd69]' : 'text-neutral-400'
                                  }`}
                                />
                                <span>{index + 1}. {task.label}</span>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono tabular-nums text-[10px] font-extrabold whitespace-nowrap ${
                                  isDone
                                    ? 'bg-[#c59b27] text-[#14281d]'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69]'
                                }`}
                              >
                                +{task.xp} نقطة
                              </span>
                            </div>
                            <p
                              className={`text-[11px] leading-relaxed ${
                                isDone ? 'text-emerald-100' : 'text-neutral-500 dark:text-neutral-400'
                              }`}
                            >
                              {task.subtitle}
                            </p>
                            <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[11px] font-extrabold">
                              <span>{isDone ? 'تم الإنجاز بحمد الله ✓' : 'اضغط لتأكيد الإنجاز'}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Student Row 2: Today's 3 Assignments + Quick Launch to Schedule & Audio Recorder */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#112119] border border-neutral-200/90 dark:border-emerald-900/60 border-t-4 border-t-[#145a3a] flex flex-col justify-between gap-3 shadow-xs">
                      <div>
                        <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          ١. الورد الجديد اليومي
                        </span>
                        <div className="text-base font-black text-[#14281d] dark:text-white mt-1">
                          سورة {studentAssignmentContext.newMem.surahName}
                        </div>
                        <div className="text-xs font-mono tabular-nums text-neutral-500 mt-0.5">
                          الآيات ({studentAssignmentContext.newMem.fromAyah} – {studentAssignmentContext.newMem.toAyah})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleLoadAssignmentTrack('new_mem');
                          setGuardianScreenTab('tahfeez_studio');
                          setTahfeezSubTab('player');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer transition"
                      >
                        ابدأ الاستماع والتلقين
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#112119] border border-neutral-200/90 dark:border-emerald-900/60 border-t-4 border-t-[#c59b27] flex flex-col justify-between gap-3 shadow-xs">
                      <div>
                        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                          ٢. المراجعة القريبة والبعيدة
                        </span>
                        <div className="text-base font-black text-[#14281d] dark:text-white mt-1">
                          سورة {studentAssignmentContext.nearRev.surahName} · سورة {studentAssignmentContext.farRev.surahName}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          ربط المحفوظ الجديد وتثبيت الأجزاء السابقة
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleLoadAssignmentTrack('near_review');
                          setGuardianScreenTab('tahfeez_studio');
                          setTahfeezSubTab('player');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold cursor-pointer transition"
                      >
                        تشغيل أوراد المراجعة
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#112119] border border-neutral-200/90 dark:border-emerald-900/60 border-t-4 border-t-indigo-600 flex flex-col justify-between gap-3 shadow-xs">
                      <div>
                        <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                          ٣. التسميع الصوتي وموعد الحلقة
                        </span>
                        <div className="text-base font-black text-[#14281d] dark:text-white mt-1">
                          حلقتك الساعة <span className="font-mono tabular-nums">{student.scheduleTime}</span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          سجّل تلاوتك بصوتك أو انتقل لرحلة اليوم الزمنية
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setGuardianScreenTab('tahfeez_studio');
                            setTahfeezSubTab('recorder');
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-extrabold cursor-pointer transition whitespace-nowrap"
                        >
                          سجّل تلاوتك
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuardianScreenTab('schedule_timeline')}
                          className="py-2.5 px-3 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200 dark:border-emerald-900 text-xs font-extrabold cursor-pointer whitespace-nowrap"
                        >
                          رحلة اليوم ←
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* GUARDIAN VIEW OVERVIEW (Compact 2-Row Executive Summary: 4 Status Cards + Progress Chart & Teacher Guidance) */
                <div className="space-y-6">
                  {/* Row 1: 4 Colorful Daily Memorization Status Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Daily New Memorization (Emerald Accent) */}
                    <div className="rounded-2xl bg-white dark:bg-[#112119] p-5 shadow-xs border border-neutral-200/90 dark:border-emerald-900/60 border-t-4 border-t-[#145a3a] flex flex-col justify-between gap-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-[#145a3a] dark:text-emerald-300 text-xs font-extrabold">
                          الورد الجديد اليومي
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold">
                          {studentSessions[0]?.newMemorization?.grade || 'ممتاز'}
                        </span>
                      </div>
                      <div>
                        <div className="text-lg font-black text-[#14281d] dark:text-white">
                          سورة {studentAssignmentContext.newMem.surahName}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums mt-1">
                          الآيات ({studentAssignmentContext.newMem.fromAyah} – {studentAssignmentContext.newMem.toAyah}) · {Math.max(1, studentAssignmentContext.newMem.toAyah - studentAssignmentContext.newMem.fromAyah + 1)} آيات
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-emerald-950">
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                          {todayFortressState.listened3Times ? 'تم التحضير السمعي ✓' : 'جاهز للتلقين المنزلي'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleLoadAssignmentTrack('new_mem');
                            setGuardianScreenTab('tahfeez_studio');
                            setTahfeezSubTab('player');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-[11px] font-extrabold cursor-pointer transition whitespace-nowrap shrink-0"
                        >
                          بدء التلقين
                        </button>
                      </div>
                    </div>

                    {/* Card 2: Near Review & Link (Warm Gold Accent) */}
                    <div className="rounded-2xl bg-white dark:bg-[#112119] p-5 shadow-xs border border-neutral-200/90 dark:border-emerald-900/60 border-t-4 border-t-[#c59b27] flex flex-col justify-between gap-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-extrabold">
                          المراجعة القريبة والربط
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold">
                          {todayFortressState.reviewedLink ? 'مكتمل ✓' : 'مقرر اليوم'}
                        </span>
                      </div>
                      <div>
                        <div className="text-lg font-black text-[#14281d] dark:text-white">
                          سورة {studentAssignmentContext.nearRev.surahName}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums mt-1">
                          الآيات ({studentAssignmentContext.nearRev.fromAyah} – {studentAssignmentContext.nearRev.toAyah})
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-emerald-950">
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold">
                          ربط الجديد بالمحفوظ القريب
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleLoadAssignmentTrack('near_review');
                            setGuardianScreenTab('tahfeez_studio');
                            setTahfeezSubTab('player');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-[11px] font-extrabold cursor-pointer transition whitespace-nowrap shrink-0"
                        >
                          تشغيل المراجعة
                        </button>
                      </div>
                    </div>

                    {/* Card 3: Far Review & Consolidation (Teal Accent) */}
                    <div className="rounded-2xl bg-white dark:bg-[#112119] p-5 shadow-xs border border-neutral-200/90 dark:border-emerald-900/60 border-t-4 border-t-teal-600 flex flex-col justify-between gap-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-extrabold">
                          المراجعة البعيدة والتثبيت
                        </span>
                        <span className="text-xs font-mono tabular-nums font-extrabold text-teal-700 dark:text-teal-300">
                          {student.memorizedJuz.length} / 30 جزءاً
                        </span>
                      </div>
                      <div>
                        <div className="text-lg font-black text-[#14281d] dark:text-white">
                          سورة {studentAssignmentContext.farRev.surahName}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums mt-1">
                          الآيات ({studentAssignmentContext.farRev.fromAyah} – {studentAssignmentContext.farRev.toAyah}) · {student.memorizedSurahs.length} سورة
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-emerald-950">
                        <span className="text-[11px] text-teal-700 dark:text-teal-400 font-bold">
                          {todayFortressState.reviewedFar ? 'تمت المراجعة ✓' : 'تثبيت الأجزاء السابقة'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleLoadAssignmentTrack('far_review');
                            setGuardianScreenTab('tahfeez_studio');
                            setTahfeezSubTab('player');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-[11px] font-extrabold cursor-pointer transition whitespace-nowrap shrink-0"
                        >
                          مراجعة وتثبيت
                        </button>
                      </div>
                    </div>

                    {/* Card 4: Five Fortresses & Attendance Status (Indigo Accent) */}
                    <div className="rounded-2xl bg-white dark:bg-[#112119] p-5 shadow-xs border border-neutral-200/90 dark:border-emerald-900/60 border-t-4 border-t-indigo-600 flex flex-col justify-between gap-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-xs font-extrabold">
                          إنجاز الحصون والالتزام
                        </span>
                        <span className="text-xs font-mono tabular-nums font-extrabold text-indigo-700 dark:text-indigo-300">
                          حضور {weeklyProgressStats.attendanceRate}%
                        </span>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-black font-mono tabular-nums text-[#14281d] dark:text-white">
                            {completedFortressCount} / 4 <span className="text-xs font-sans font-bold text-neutral-500">مهام اليوم</span>
                          </span>
                          <span className="text-xs font-mono tabular-nums font-bold text-[#c59b27]">
                            {Math.round((completedFortressCount / 4) * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-emerald-950 overflow-hidden mt-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-indigo-600 to-[#145a3a] transition-all duration-300"
                            style={{ width: `${Math.max(12, (completedFortressCount / 4) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-emerald-950">
                        <span className="text-[11px] text-neutral-500 font-bold">
                          موعد الحلقة: {student.scheduleTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => setGuardianScreenTab('schedule_timeline')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-[11px] font-extrabold cursor-pointer transition whitespace-nowrap shrink-0"
                        >
                          الجدول الزمني ←
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Simplified Quran Progress Chart (5 cols) + Family Pedagogical Guidance & Quick Actions (7 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Col 1: Simplified Visual Chart of Quran Memorization Progress (5 cols) */}
                    <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#112119] p-5 sm:p-6 border border-neutral-200/90 dark:border-emerald-900/60 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#c59b27]" />
                            <span>مؤشر تقدم الطالب في حفظ القرآن</span>
                          </h3>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            مقارنة الآيات المنجزة أسبوعياً مع نسبة إتمام الأجزاء والسور
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGuardianScreenTab('followup_log')}
                          className="px-3 py-1.5 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200 dark:border-emerald-900 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-extrabold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          السجل الكامل ←
                        </button>
                      </div>

                      <div className="space-y-3 bg-[#f8f9f6] dark:bg-[#0b1510] p-4 rounded-2xl border border-neutral-200/70 dark:border-emerald-900/50">
                        <div>
                          <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
                            <span className="text-[#14281d] dark:text-white">الأجزاء المكتملة من المصحف</span>
                            <span className="font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69]">
                              {student.memorizedJuz.length} / 30 جزء ({Math.round((student.memorizedJuz.length / 30) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-emerald-950 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-l from-emerald-600 to-[#c59b27]"
                              style={{ width: `${Math.max(8, Math.round((student.memorizedJuz.length / 30) * 100))}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
                            <span className="text-[#14281d] dark:text-white">السور المحفوظة</span>
                            <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                              {student.memorizedSurahs.length} / 114 سورة ({Math.round((student.memorizedSurahs.length / 114) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-emerald-950 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-l from-[#145a3a] to-teal-500"
                              style={{ width: `${Math.max(8, Math.round((student.memorizedSurahs.length / 114) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="h-44 w-full pt-1" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={weeklyProgressStats.weeks.map((wk) => ({
                              name: wk.label,
                              آيات_محفوظة: wk.ayatCount,
                              المستهدف: 20,
                            }))}
                            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #c59b27',
                                fontSize: '12px',
                                fontWeight: 700,
                                textAlign: 'right',
                              }}
                            />
                            <Bar dataKey="آيات_محفوظة" name="الآيات المحفوظة" fill="#145a3a" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="المستهدف" name="المستهدف الأسبوعي" fill="#c59b27" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Col 2: Latest Session Summary, Pedagogical Guidance & Direct Navigation Shortcuts (7 cols) */}
                    <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#112119] p-5 sm:p-6 border border-neutral-200/90 dark:border-emerald-900/60 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-emerald-950">
                        <div>
                          <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                            تقرير آخر حصة وتوجيهات الشيخ لولي الأمر
                          </h3>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            ملخص سريع لما تم إنجازه في الحلقة وخطة الدعم المنزلي المقترحة
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-extrabold">
                          نمط التعلم: {student.pedagogicalProfile?.learningStyle || 'سمعي / بصري'}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200/80 dark:border-emerald-900/50 space-y-2">
                        <div className="flex items-center justify-between text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          <span>ملاحظة المحفظ في آخر تسميع:</span>
                          <span className="font-mono tabular-nums text-neutral-400">
                            {studentSessions[0]?.date || todayStr}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-[#14281d] dark:text-white leading-relaxed">
                          «{studentSessions[0]?.parentNotes || 'تلاوة متقنة ومتميزة اليوم، نرجو الاستمرار على الاستماع للمصحف المعلم قبل النوم.'}»
                        </p>
                      </div>

                      {student.publishedFamilyGuidance && student.publishedFamilyGuidance.length > 0 ? (
                        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                          <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                            {student.publishedFamilyGuidance[0].title}
                          </div>
                          <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
                            {student.publishedFamilyGuidance[0].bodyText}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
                          <strong className="text-[#145a3a] dark:text-[#dfbd69] block mb-1">
                            خطة دعم الطالب في المنزل:
                          </strong>
                          لتثبيت حفظ الطالب ({student.name}) بيسر ودون إجهاد، ننصح بتشغيل تلاوة «المصحف المعلم للشيخ الحصري أو المنشاوي» لمقرره الحالي بهدوء لمدة ١٠ دقائق، ومراجعة الجدول الزمني للمهام قبل الحلقة.
                        </div>
                      )}

                      {studentSessions[0]?.memorizationAudioDataUrl && (
                        <div className="p-3 rounded-2xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-[#c59b27]/50 space-y-1.5">
                          <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                            تسجيل صوتي مرفق من الشيخ لتلقين الورد الجديد:
                          </div>
                          <audio
                            id="teacher-session-audio-player"
                            controls
                            src={studentSessions[0].memorizationAudioDataUrl}
                            className="w-full h-8"
                          />
                        </div>
                      )}

                      {/* Quick Navigation Cards to Other Tabs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setGuardianScreenTab('schedule_timeline')}
                          className="p-3 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] hover:border-[#c59b27] border border-neutral-200 dark:border-emerald-900 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">الجدول والمنبه</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">مهام اليوم وفرق التوقيت</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuardianScreenTab('tahfeez_studio')}
                          className="p-3 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] hover:border-[#c59b27] border border-neutral-200 dark:border-emerald-900 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">المصحف والتسميع</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">التلقين ومسجل الصوت</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuardianScreenTab('family_oasis')}
                          className="p-3 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] hover:border-[#c59b27] border border-neutral-200 dark:border-emerald-900 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">تقييم المحفظ</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">تاج الوقار وشهادة الأسرة</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuardianScreenTab('documents_billing')}
                          className="p-3 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] hover:border-[#c59b27] border border-neutral-200 dark:border-emerald-900 text-right transition cursor-pointer"
                        >
                          <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">الإيصالات والبطاقة</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">إيصالات السداد المعتمدة</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: SCHEDULE TIMELINE & SMART REMINDER (الجدول الزمني التفاعلي للمهام القادمة والمنبه الذكي) */}
          {guardianScreenTab === 'schedule_timeline' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Right Col: Interactive Visual Timeline for Upcoming Tasks (7 cols) */}
              <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#112119] p-5 sm:p-6 border border-neutral-200/90 dark:border-emerald-900/60 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-emerald-950">
                  <div>
                    <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#c59b27]" />
                      <span>الجدول الزمني التفاعلي للمهام القادمة وخطة اليوم</span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      خطوات مرتبة زمنياً لتحضير الطالب قبل الحلقة، حضور الدرس المباشر، والتثبيت المنزلي
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#145a3a] dark:text-emerald-300 text-xs font-mono tabular-nums font-extrabold">
                    موعد الحلقة: {student.scheduleTime} ({timezoneSyncInfo.studentTimeFormatted} بتوقيتك)
                  </span>
                </div>

                {/* Vertical Connected Timeline Stations */}
                <div className="relative pr-6 space-y-3.5 before:content-[''] before:absolute before:right-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-[#145a3a] before:via-[#c59b27] before:to-emerald-600">
                  {/* Station 1 */}
                  <div className="relative p-3.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200/80 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span
                      className={`absolute -right-[22px] top-5 w-4 h-4 rounded-full border-2 border-white dark:border-[#112119] ${
                        todayFortressState.listened3Times && todayFortressState.readPreparation
                          ? 'bg-emerald-600'
                          : 'bg-[#c59b27]'
                      }`}
                    />
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] text-[10px] font-extrabold">
                          المهمة ١ · قبل الحلقة بـ ٣٠ دقيقة
                        </span>
                        <span className="text-xs font-black text-[#14281d] dark:text-white">
                          التحضير السمعي والبصري للورد الجديد (سورة {studentAssignmentContext.newMem.surahName})
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        الاستماع لتلاوة الشيخ ٣ مرات للآيات ({studentAssignmentContext.newMem.fromAyah} – {studentAssignmentContext.newMem.toAyah}) مع القراءة الحاضرة من المصحف.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleLoadAssignmentTrack('new_mem');
                        setGuardianScreenTab('tahfeez_studio');
                        setTahfeezSubTab('player');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      فتح المصحف المعلم
                    </button>
                  </div>

                  {/* Station 2 */}
                  <div className="relative p-3.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200/80 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span
                      className={`absolute -right-[22px] top-5 w-4 h-4 rounded-full border-2 border-white dark:border-[#112119] ${
                        todayFortressState.reviewedLink && todayFortressState.reviewedFar
                          ? 'bg-emerald-600'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold">
                          المهمة ٢ · قبل بدء الحلقة
                        </span>
                        <span className="text-xs font-black text-[#14281d] dark:text-white">
                          مراجعة الربط القريب (سورة {studentAssignmentContext.nearRev.surahName}) والبعيد (سورة {studentAssignmentContext.farRev.surahName})
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        تثبيت المحفوظ السابق وربطه بالدرس الجديد لضمان جودة التسميع.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleLoadAssignmentTrack('near_review');
                        setGuardianScreenTab('tahfeez_studio');
                        setTahfeezSubTab('player');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      بدء المراجعة
                    </button>
                  </div>

                  {/* Station 3 */}
                  <div className="relative p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="absolute -right-[22px] top-5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white dark:border-[#112119]" />
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-mono tabular-nums font-extrabold">
                          المهمة ٣ · الساعة {student.scheduleTime} ({student.sessionDuration} دقيقة)
                        </span>
                        <span className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69]">
                          حضور الحلقة المباشرة ({student.scheduleDays.map((d) => DAY_NAMES[d]).join('، ')})
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300">
                        الدخول على الرابط الدائم للحلقة للتسميع المباشر وتلقي تصويبات التجويد.
                      </p>
                    </div>
                    <a
                      href={permanentMeetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>دخول الحلقة</span>
                    </a>
                  </div>

                  {/* Station 4 */}
                  <div className="relative p-3.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200/80 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="absolute -right-[22px] top-5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-[#112119]" />
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 text-[10px] font-extrabold">
                          المهمة ٤ · التثبيت المسائي
                        </span>
                        <span className="text-xs font-black text-[#14281d] dark:text-white">
                          تسجيل التسميع الصوتي المنزلي ومراجعة توجيه الشيخ
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        إرسال تسجيل صوتي لتلاوة الطالب ليراجعه الشيخ المحفظ ويضع نقاط التشجيع.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGuardianScreenTab('tahfeez_studio');
                        setTahfeezSubTab('recorder');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-extrabold shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      تسجيل التلاوة
                    </button>
                  </div>
                </div>
              </div>

              {/* Left Col: Automated Smart Session Reminder, Timezone Sync & Five Fortresses Quick Checklist (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-6">
                {/* Automated Smart Session Reminder */}
                <div className="rounded-3xl bg-white dark:bg-[#112119] p-5 sm:p-6 border border-neutral-200/90 dark:border-emerald-900/60 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          المنبه الذكي الآلي وفرق التوقيت
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          أيام الحلقة: <strong>{student.scheduleDays.map((d) => DAY_NAMES[d]).join('، ')}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadIcsCalendar}
                      className="px-3 py-1.5 rounded-xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200 dark:border-emerald-900 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-[#c59b27]" />
                      <span>إضافة لتقويم الهاتف</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#f8f9f6] dark:bg-[#0b1510] border border-neutral-200/70 dark:border-emerald-900/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">توقيت بلد الإقامة:</span>
                      <span className="font-mono tabular-nums font-bold">
                        القاهرة ({student.scheduleTime}) ← ({timezoneSyncInfo.studentTimeFormatted})
                      </span>
                    </div>
                    <select
                      value={selectedTimezone}
                      onChange={(e) => setSelectedTimezone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#112119] text-xs font-bold"
                    >
                      {GLOBAL_TIMEZONES_LIST.map((tz) => (
                        <option key={tz.id} value={tz.id}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => triggerReminderNotificationChime('1hour')}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-extrabold cursor-pointer whitespace-nowrap"
                    >
                      تجربة منبه قبل ساعة
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerReminderNotificationChime('now')}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold cursor-pointer whitespace-nowrap"
                    >
                      تجربة منبه بدء الحلقة
                    </button>
                  </div>
                </div>

                {/* Compact Five Fortresses Checklist inside Schedule Tab */}
                <div className="rounded-3xl bg-white dark:bg-[#112119] p-5 sm:p-6 border border-neutral-200/90 dark:border-emerald-900/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      قائمة التحضير اليومي (الحصون الخمسة)
                    </h3>
                    <span className="text-xs font-mono tabular-nums font-extrabold text-[#c59b27]">
                      {completedFortressCount} / 4 مكتمل
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {FORTRESS_TASKS.map((task) => {
                      const isDone = !!todayFortressState[task.key];
                      return (
                        <button
                          key={task.key}
                          type="button"
                          onClick={() => toggleStudentFortressTask(student.id, task.key)}
                          className={`p-3 rounded-xl border text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                            isDone
                              ? 'bg-[#145a3a] text-white border-[#c59b27]'
                              : 'bg-[#f8f9f6] dark:bg-[#0b1510] border-neutral-200 dark:border-emerald-900/60'
                          }`}
                        >
                          <span className="text-xs font-extrabold flex items-center gap-1.5">
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDone ? 'text-[#dfbd69]' : 'text-neutral-400'}`} />
                            <span>{task.label}</span>
                          </span>
                          <span className="text-[10px] font-mono tabular-nums font-bold opacity-80">+{task.xp}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2.2. شاشة سجل المتابعة وتطور الحفظ الأسبوعي (Follow-up Log & Weekly Memorization Progress Screen) */}
          {guardianScreenTab === 'followup_log' && (
          <div className="space-y-6">
            {/* Khatmah Predictor Card inside Follow-up & Progress Tab */}
            {khatmahPrediction && (
              <div className="rounded-3xl bg-gradient-to-l from-[#145a3a]/10 via-[#fcfaf2] to-amber-50/60 dark:from-[#145a3a]/30 dark:via-[#12231a] dark:to-[#0b1711] p-5 border-2 border-[#c59b27]/60 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                      <span>📅 متى أختم؟ — حاسبة تاريخ الختمة الذكية</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#c59b27] text-[#14281d] text-[11px] font-extrabold">
                        همة منتظمة
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                      تُحسب تلقائياً بناءً على متوسط إنجاز الطالب الفعلي ({khatmahPrediction.avgAyatPerSession} آية/حصة) وأيام حضوره الأسبوعية ({student.scheduleDays.length} أيام/أسبوع)
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
                    الجزء الحالي: الجزء ({student.currentStop.juzNumber || 1})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
                    <div className="text-[11px] text-neutral-500 font-bold">
                      موعد ختم الجزء الحالي ({student.currentStop.juzNumber || 1})
                    </div>
                    <div className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] mt-1">
                      🎯 {khatmahPrediction.expectedCurrentJuzDate}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      خلال {khatmahPrediction.daysToFinishCurrentJuz} يوماً تقريباً
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
                    <div className="text-[11px] text-neutral-500 font-bold">
                      التاريخ المتوقع لختم القرآن الكريم كاملاً
                    </div>
                    <div className="text-sm font-extrabold text-amber-700 dark:text-amber-300 mt-1">
                      👑 {khatmahPrediction.expectedFullKhatmahDate}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      الأجزاء المتبقية: {khatmahPrediction.remainingJuzCount} جزءاً
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
                    <div className="text-[11px] text-neutral-500 font-bold">
                      نصيحة تسريع الختمة
                    </div>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                      💡 المواظبة على الحصون الخمسة والتسميع الصوتي المنزلي يختصر مدة الختمة بنسبة 25%!
                    </div>
                  </div>
                </div>
              </div>
            )}

          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#145a3a]/40 dark:border-emerald-800/60 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-emerald-950">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#c59b27]" />
                  <span>سجل المتابعة وتطور الحفظ الأسبوعي — شفافية المتابعة بين الأكاديمية والمنزل</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  يعرض هذا السجل تطور إنجاز الطالب أسبوعياً وتفاصيل كل حصة (الحضور، الحفظ الجديد، المراجعة، وتوجيهات المعلم للأسرة)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-neutral-600 dark:text-neutral-300">
                  نسبة الحضور:{' '}
                  <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                    {weeklyProgressStats.attendanceRate}%
                  </strong>
                </span>
                <span className="text-neutral-300 dark:text-emerald-800">·</span>
                <span className="font-bold text-neutral-600 dark:text-neutral-300">
                  إجمالي آيات الحفظ المسجلة:{' '}
                  <strong className="font-mono text-[#145a3a] dark:text-[#dfbd69]">
                    {weeklyProgressStats.totalNewAyat} آية
                  </strong>
                </span>
              </div>
            </div>

            {/* A. Interactive Recharts Chart + Weekly Memorization Progress Cards */}
            <div className="p-5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/50 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-[#14281d] dark:text-white">
                    الرسم البياني لتطور الحفظ الأسبوعي (عدد الآيات المنجزة ومستوى الإتقان)
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    مؤشر بصري واضح لتدرج حفظ الطالب خلال الأسابيع الأربعة الأخيرة مقارنة بالمستهدف الأسبوعي
                  </p>
                </div>
                <span className="text-xs font-bold text-[#145a3a] dark:text-[#dfbd69]">
                  المستهدف الأسبوعي: 20 آية
                </span>
              </div>

              <div className="h-56 w-full bg-white dark:bg-[#12231a] p-3 rounded-2xl border border-neutral-200/60 dark:border-emerald-900/40" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyProgressStats.weeks.map((wk) => ({
                      name: wk.label,
                      آيات_محفوظة: wk.ayatCount,
                      المستهدف: 20,
                    }))}
                    margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #c59b27',
                        fontSize: '12px',
                        fontWeight: 700,
                        textAlign: 'right',
                      }}
                    />
                    <Bar dataKey="آيات_محفوظة" name="الآيات المحفوظة" fill="#145a3a" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="المستهدف" name="المستهدف الأسبوعي" fill="#c59b27" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {weeklyProgressStats.weeks.map((wk, idx) => {
                  const pct = Math.min(
                    100,
                    Math.round((wk.ayatCount / weeklyProgressStats.maxWeeklyAyat) * 100)
                  );
                  return (
                    <div
                      key={wk.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#14281d] dark:text-white">
                          {idx + 1}. {wk.label}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          {wk.ratingLabel}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xl font-extrabold font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69]">
                            {wk.ayatCount}{' '}
                            <span className="text-xs font-sans font-bold text-neutral-500">
                              آية محفوظة
                            </span>
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            {pct}%
                          </span>
                        </div>
                        <div
                          dir="rtl"
                          className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-emerald-950 overflow-hidden flex justify-start"
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-[#145a3a] to-[#c59b27] transition-all duration-300"
                            style={{ width: `${Math.max(12, pct)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-100 dark:border-emerald-950">
                        <span>سورة {wk.topSurah}</span>
                        <span>
                          {wk.sessionsCount > 0
                            ? `${wk.sessionsCount} حصص`
                            : 'مواظبة منتظمة'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* B. Chronological Follow-up Log Table (جدول سجل المتابعة التفصيلي) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-extrabold text-[#14281d] dark:text-white">
                  سجل الحصص والمتابعة التفصيلي ({weeklyProgressStats.filteredSessions.length})
                </h4>

                {/* Interactive Filter Controls */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#f6f7f2] dark:bg-[#0b1711] rounded-xl border border-neutral-200 dark:border-emerald-900/60">
                  {(
                    [
                      { id: 'all' as const, label: 'جميع الحصص' },
                      { id: 'present' as const, label: 'حضور مكتمل' },
                      { id: 'excellent' as const, label: 'تقدير ممتاز' },
                      { id: 'notes' as const, label: 'ملاحظات المعلم' },
                    ]
                  ).map((flt) => (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => setFollowupFilter(flt.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        followupFilter === flt.id
                          ? 'bg-[#145a3a] text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>
              </div>

              {weeklyProgressStats.filteredSessions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 text-center text-xs text-neutral-500">
                  لا توجد حصص مطابقة لفلتر البحث المحدد حالياً.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-emerald-900/60">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#145a3a] text-white">
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">الحضور</th>
                        <th className="p-3">الحفظ الجديد</th>
                        <th className="p-3">المراجعة (القريبة والبعيدة)</th>
                        <th className="p-3">تقييم المعلم وتوجيهات المنزل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-emerald-950">
                      {weeklyProgressStats.filteredSessions.map((sess) => (
                        <tr
                          key={sess.id}
                          className="odd:bg-white even:bg-[#fcfaf2] dark:odd:bg-[#12231a] dark:even:bg-[#0b1711]"
                        >
                          <td className="p-3 font-mono whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                            {formatGregorianAndHijri(
                              sess.date,
                              settings.showHijriDates ?? true
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap font-extrabold">
                            <span
                              className={
                                sess.status === 'حضر'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : sess.status === 'غاب'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }
                            >
                              {sess.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {sess.newMemorization?.enabled ? (
                              <div>
                                <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                                  سورة {sess.newMemorization.surahName}
                                </strong>{' '}
                                <span className="font-mono text-neutral-500">
                                  ({sess.newMemorization.fromAyah} - {sess.newMemorization.toAyah})
                                </span>
                                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                                  التقدير: {sess.newMemorization.grade || sess.previousEvaluation?.newGrade || 'ممتاز'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-neutral-400">حصة تثبيت ومراجعة</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5">
                              {sess.nearReview?.enabled && (
                                <div>
                                  <span className="text-neutral-500">قريبة:</span>{' '}
                                  <strong>سورة {sess.nearReview.surahName}</strong> ({sess.nearReview.grade || sess.previousEvaluation?.nearGrade || 'ممتاز'})
                                </div>
                              )}
                              {sess.farReview?.enabled && (
                                <div>
                                  <span className="text-neutral-500">بعيدة:</span>{' '}
                                  <strong>سورة {sess.farReview.surahName}</strong> ({sess.farReview.grade || sess.previousEvaluation?.farGrade || 'ممتاز'})
                                </div>
                              )}
                              {!sess.nearReview?.enabled && !sess.farReview?.enabled && (
                                <span className="text-neutral-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 max-w-xs">
                            <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed">
                              {sess.parentNotes || 'أداء طيب ومبارك، يرجى الاستمرار على سماع الورد اليومي.'}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          </div>
          )}

          {/* 2.5. Official Student Smart ID Card & Monthly Payment Receipts Hub */}
          {guardianScreenTab === 'documents_billing' && (
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/50 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#145a3a] text-[#dfbd69]">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    {portalViewPersona === 'student'
                      ? 'بطاقة الهوية القرآنية الذكية للطالب'
                      : 'بطاقة الطالب الذكية وإيصالات السداد المعتمدة'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {portalViewPersona === 'student'
                      ? 'يمكنك معاينة وتحميل بطاقة الهوية القرآنية الخاصة بك'
                      : 'يمكن لولي الأمر معاينة وتحميل بطاقة الهوية القرآنية وإيصالات السداد الشهرية المختومة'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGuardianIdCardOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
                >
                  <IdCard className="w-4 h-4 text-[#dfbd69]" />
                  <span>فتح بطاقة الطالب الذكية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadStudentIdCardPng(student, settings);
                    showToast(
                      'تم تحميل بطاقة الطالب الذكية كصورة عالية الدقة',
                      'success'
                    );
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>حفظ صورة البطاقة</span>
                </button>
              </div>
            </div>

            {portalViewPersona !== 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(student.fees.length > 0
                  ? student.fees
                  : [
                      {
                        month: todayStr.slice(0, 7),
                        amount: student.monthlyFee || 350,
                        status: 'مدفوع' as const,
                        paidAt: todayStr,
                        method: 'إنستا باي',
                        receiptNumber: `REC-${todayStr
                          .slice(0, 7)
                          .replace('-', '')}-${
                          student.id.replace(/\D/g, '') || '101'
                        }`,
                      },
                    ]
                ).map((feeItem) => {
                  const recNo =
                    feeItem.receiptNumber ||
                    `REC-${feeItem.month.replace('-', '')}-${
                      student.id.replace(/\D/g, '') || '101'
                    }`;
                  return (
                    <div
                      key={feeItem.month}
                      className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-extrabold font-mono text-[#145a3a] dark:text-[#dfbd69]">
                            إيصال شهر {feeItem.month}
                          </span>
                          <div className="text-[11px] font-mono text-neutral-500">
                            رقم الإيصال: {recNo}
                          </div>
                        </div>
                        <span className="text-sm font-extrabold font-mono">
                          {feeItem.amount} ج.م
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setGuardianActiveReceipt({
                              ...feeItem,
                              receiptNumber: recNo,
                            })
                          }
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#145a3a] text-white text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#dfbd69]" />
                          <span>عرض وطباعة الإيصال</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            downloadPaymentReceiptPng(
                              student,
                              { ...feeItem, receiptNumber: recNo },
                              settings
                            );
                            showToast(
                              'تم تحميل صورة إيصال السداد بنجاح',
                              'success'
                            );
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-[#c59b27] text-[#14281d] text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>حفظ الإيصال</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* 🌟 ركن البهجة الإيمانية وبِرّ الوالدين والأسرة القرآنية (Dedicated to Student & Guardian's own family) */}
          {guardianScreenTab === 'family_oasis' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-[#112119] p-6 border border-neutral-200/90 dark:border-emerald-900/60 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 dark:border-emerald-950 pb-3">
              <div>
                <span className="text-[11px] font-extrabold text-[#c59b27] block">
                  واحة البهجة الإيمانية وبِرّ الوالدين والأسرة القرآنية
                </span>
                <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#c59b27]" />
                  <span>تاج الوقار · شجرة النور · ثمرة السلوك · أوسمة الأسرة</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFamilyCertificateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black shadow-xs cursor-pointer transition whitespace-nowrap shrink-0"
              >
                <Award className="w-4 h-4" />
                <span>شهادة التقدير العائلية وتاج الوقار</span>
              </button>
            </div>

            {(() => {
              // 1. Crown of Dignity & Hasanat Counter calculations
              const currentVersesLetters = verses.reduce(
                (acc, v) => acc + v.text.replace(/\s+/g, '').length,
                0
              );
              const estimatedTotalLetters =
                student.memorizedJuz.length * 7100 +
                student.memorizedSurahs.length * 420 +
                studentSessions.length * 260 +
                Math.max(120, currentVersesLetters);
              const totalHasanat = estimatedTotalLetters * 10;
              const crownProgressPct = Math.min(
                100,
                Math.max(
                  18,
                  Math.round(
                    ((student.memorizedJuz.length * 3 +
                      student.memorizedSurahs.length +
                      studentSessions.length) /
                      90) *
                      100
                  )
                )
              );

              // 2. Filial Gratitude status today
              const filialLogs = student.filialGratitudeLog || [];
              const todayFilialSent = filialLogs.some(
                (item) => item.date === todayStr
              );

              // 4. Tree of Light stage
              const totalMilestones =
                student.memorizedJuz.length * 4 + student.memorizedSurahs.length;
              const treeStage =
                totalMilestones >= 35
                  ? {
                      icon: '🌴',
                      title: 'روضة الخاتمين المهرة',
                      desc: 'أغصان وارفة وثمر مبارك من سور وأجزاء كتاب الله',
                    }
                  : totalMilestones >= 15
                  ? {
                      icon: '🌳',
                      title: 'شجرة طيبة أصلها ثابت',
                      desc: 'جذور راسخة بالحفظ والمراجعة وفروعها في السماء',
                    }
                  : totalMilestones >= 5
                  ? {
                      icon: '🌿',
                      title: 'غرسة الإيمان النامية',
                      desc: 'تنمو كل يوم مع المواظبة على الورد والحصون الخمسة',
                    }
                  : {
                      icon: '🌱',
                      title: 'بذرة النور المباركة',
                      desc: 'بداية الغرس القرآني في قلب البطل وبيت الأسرة',
                    };

              // 6. Character Bridge habit mapped to current Surah
              const habitPool = [
                {
                  title: 'تقبيل يد الوالدين والدعاء لهما بخفض الجناح',
                  verseHint: '﴿وَاخْفِضْ لَهُمَا جَنَاحَ الذُّلِّ مِنَ الرَّحْمَةِ﴾',
                },
                {
                  title: 'الصدق في الحديث والوفاء بالوعد في البيت والمدرسة',
                  verseHint: '﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ﴾',
                },
                {
                  title: 'البشاشة والتبسم وإلقاء السلام على أهل البيت',
                  verseHint: '«تبسمك في وجه أخيك صدقة»',
                },
                {
                  title: 'المبادرة بترتيب الغرفة ومساعدة الأسرة دون طلب',
                  verseHint: '﴿وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى﴾',
                },
              ];
              const activeHabit =
                habitPool[(surahId + student.id.length) % habitPool.length];
              const completedHabitDates =
                student.characterHabitCompletedDates || [];
              const isHabitDoneToday = completedHabitDates.includes(todayStr);

              // 5. Latest Sheikh praise message
              const latestTeacherPraise =
                studentSessions[0]?.parentNotes ||
                `بارك الله في البطل (${student.name}) وفي أسرته الكريمة؛ لمسنا منه اليوم همة عالية وأدباً رفيعاً مع كتاب الله في سورة ${surahMeta.name}. أسأل الله أن يلبسكم به تاج الوقار يوم القيامة.`;

              return (
                <div className="space-y-4">
                  {/* Row 1: Crown of Dignity & Hasanat Counter + Filial Gratitude Card */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 1. تاج الوقار وعداد الحسنات */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                          <span>👑 تاج الوقار للوالدين وعدّاد الحسنات</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-mono font-extrabold">
                          الحسنة بـ 10 أمثالها
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-center">
                        <div className="p-2.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/70 dark:border-emerald-900/50">
                          <div className="text-[11px] text-neutral-500">
                            الحروف القرآنية المتلوة والمحفوظة
                          </div>
                          <div className="text-lg font-black font-mono text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                            {estimatedTotalLetters.toLocaleString('ar-EG')} حرف
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-[#c59b27]/50">
                          <div className="text-[11px] text-amber-800 dark:text-amber-300 font-bold">
                            رصيد الحسنات المضاعف بإذن الله
                          </div>
                          <div className="text-lg font-black font-mono text-[#c59b27] mt-0.5">
                            +{totalHasanat.toLocaleString('ar-EG')} حسنة
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-neutral-600 dark:text-neutral-300">
                            مسار اكتمال أنوار «تاج الوقار للوالدين»
                          </span>
                          <span className="font-mono text-[#145a3a] dark:text-[#dfbd69]">
                            {crownProgressPct}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-emerald-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-l from-[#c59b27] via-amber-400 to-[#145a3a] rounded-full transition-all duration-500"
                            style={{ width: `${crownProgressPct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          قال ﷺ: «مَن قرأ القرآنَ وعَمِل بما فيه، أُلبِسَ والداه تاجاً يومَ القيامةِ ضوؤُه أحسنُ من ضوءِ الشمسِ في بيوتِ الدنيا».
                        </p>
                      </div>
                    </div>

                    {/* 2. بطاقة بِرّ الوالدين والدعاء لهما */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 flex flex-col justify-between space-y-3 shadow-xs">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-rose-500" />
                            <span>🤲 بطاقة بِرّ الوالدين وإهداء ثواب الورد</span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-extrabold">
                            سجل البرّ ({filialLogs.length})
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          عند إتمام الطالب لورده اليومي، يضغط هنا ليسجل دعاءً بالبركة والرفعة لوالديه الكريمين ({student.guardianName}) في صحيفة برّه.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            const entry = {
                              id: `filial-${Date.now()}`,
                              date: todayStr,
                              message: `أتممت ورد سورة ${surahMeta.name}، اللهم بارك في والديّ (${student.guardianName}) وارفع درجتهما بالقرآن`,
                              surahName: surahMeta.name,
                            };
                            if (!todayFilialSent) {
                              saveStudent({
                                ...student,
                                filialGratitudeLog: [entry, ...filialLogs].slice(
                                  0,
                                  30
                                ),
                              });
                              addStudentXp(
                                student.id,
                                20,
                                'بِرّ الوالدين والدعاء لهما بعد الورد القرآني'
                              );
                              awardStudentBadge(
                                student.id,
                                '💝 وسام البارّ بوالديه بالقرآن'
                              );
                            }
                            showToast(
                              '🤲 اللهم آمين! تقبل الله برّك ورفع قدر والديك بالقرآن الكريم (+20 XP)',
                              'success'
                            );
                          }}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                            todayFilialSent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gradient-to-l from-[#145a3a] to-emerald-800 hover:from-[#0f452c] text-[#dfbd69] border border-[#c59b27]/50'
                          }`}
                        >
                          <span>
                            {todayFilialSent
                              ? '💝 تم تسجيل دعاء البرّ للوالدين اليوم — بارك الله فيكما'
                              : '🤲 أتممت وردي.. اللهم بارك في والديّ وارفع درجتهما بالقرآن'}
                          </span>
                        </button>
                        {filialLogs[0] && (
                          <div className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-[11px] text-neutral-600 dark:text-neutral-300 font-semibold">
                            💌 آخر دعاء مسجل: «{filialLogs[0].message}» ({filialLogs[0].date})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Tree of Light + Quranic Character Bridge + Family Honor Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 4. شجرة النور والغرس القرآني */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          🌳 شجرة النور والغرس القرآني
                        </span>
                        <span className="text-2xl">{treeStage.icon}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="text-sm font-black text-[#145a3a] dark:text-[#dfbd69]">
                          {treeStage.title}
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5">
                          {treeStage.desc}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 dark:text-neutral-300 pt-1">
                        <span>🍃 أوراق السور: {student.memorizedSurahs.length} سورة</span>
                        <span>🌟 ثمار الأجزاء: {student.memorizedJuz.length} جزء</span>
                      </div>
                    </div>

                    {/* 6. ثمرة القرآن في سلوكي */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 flex flex-col justify-between space-y-2.5 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                            🌟 ثمرة القرآن في سلوكي
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#145a3a] dark:text-[#dfbd69] text-[10px] font-extrabold">
                            خلق الأسبوع
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-neutral-800 dark:text-white">
                          {activeHabit.title}
                        </p>
                        <p className="text-[11px] font-quran text-[#145a3a] dark:text-[#dfbd69]">
                          {activeHabit.verseHint}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!isHabitDoneToday) {
                            saveStudent({
                              ...student,
                              characterHabitCompletedDates: [
                                todayStr,
                                ...completedHabitDates,
                              ],
                            });
                            addStudentXp(
                              student.id,
                              15,
                              `تطبيق خلق القرآن في البيت: ${activeHabit.title}`
                            );
                            awardStudentBadge(
                              student.id,
                              '🌟 وسام التخلق بأخلاق القرآن'
                            );
                            showToast(
                              '🌟 ما شاء الله! تم توثيق تطبيق الخلق القرآني في البيت (+15 XP)',
                              'success'
                            );
                          } else {
                            showToast(
                              'تم توثيق خلق اليوم بالفعل — زادكم الله نورًا وتوفيقًا',
                              'info'
                            );
                          }
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                          isHabitDoneToday
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d]'
                        }`}
                      >
                        {isHabitDoneToday
                          ? '✅ طُبّق في البيت اليوم بحمد الله (+15 XP)'
                          : '🌟 تأكيد ولي الأمر: طُبّق في البيت (+15 XP)'}
                      </button>
                    </div>

                    {/* 3. أوسمة الأسرة القرآنية */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 flex flex-col justify-between space-y-2.5 shadow-xs">
                      <div className="space-y-1.5">
                        <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] block">
                          🏡 أوسمة الأسرة القرآنية المباركة
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-extrabold">
                            🏡 بيت يُتلى فيه القرآن
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-[#c59b27]/50 text-amber-900 dark:text-[#dfbd69] text-[11px] font-extrabold">
                            👑 أسرة تاج الوقار
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-900 dark:text-sky-300 text-[11px] font-extrabold">
                            🔥 شركاء المواظبة ({studentSessions.length} حصص)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFamilyCertificateModalOpen(true)}
                        className="w-full py-2 px-3 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] hover:bg-amber-500/20 border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#c59b27]" />
                        <span>معاينة وطباعة شهادة الأسرة القرآنية</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 3: 5. Teacher's Special Dua & Praise Card + 7. Share the Light Ambassador Card */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 5. رسالة وبشارة خاصة من الشيخ للأسرة */}
                    <div className="p-4 rounded-2xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white border border-[#c59b27]/60 flex flex-col justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#dfbd69]">
                            💌 رسالة وبشارة خاصة من الشيخ للأسرة الكريمة
                          </span>
                          <span className="text-[11px] text-emerald-200 font-bold">
                            {settings.teacherName}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-50 leading-relaxed font-semibold">
                          «{latestTeacherPraise}»
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `🌿 بشارة قرآنية من ${settings.academyName} (${settings.teacherName}):\n\n«${latestTeacherPraise}»\n\n📖 بوابة المصحف والوقف القرآني: https://welivequran.online/`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>📲 مشاركة البشارة مع العائلة عبر واتساب</span>
                        </a>
                      </div>
                    </div>

                    {/* 7. بطاقة سفير القرآن — الدال على الخير كفاعله */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/60 flex flex-col justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                            🌍 سفير القرآن — «الدال على الخير كفاعله»
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                            صدقة جارية لك ولأسرتك
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          انشر رابط بوابة المصحف العام والورد اليومي ليكون كل حرف يُتلى في ميزان حسناتك وحسنات والديك بإذن الله.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              navigator.clipboard.writeText(
                                'https://welivequran.online/'
                              );
                            } catch {
                              // ignore clipboard restrictions
                            }
                            showToast(
                              '🔗 تم نسخ رابط بوابة المصحف العام (https://welivequran.online/) لمشاركته كصدقة جارية',
                              'success'
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-[#c59b27]/50 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold cursor-pointer"
                        >
                          📋 نسخ رابط الوقف القرآني
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `🌿 بوابة المصحف العام والورد اليومي من «${settings.academyName}» (وقف وصدقة جارية، تلاوة لـ 6 من كبار القراء، وتفسير ميسر):\nhttps://welivequran.online/`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>🌍 شارك نور القرآن عبر واتساب</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            </div>
          </div>
          )}
        </div>
      )}

      {/* Module 2: مشغل التحفيظ المنزلي والتسميع الصوتي (With Interactive Sub-Tabs) */}
      {(userRole !== 'guardian' || guardianScreenTab === 'tahfeez_studio') && (
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/60 shadow-md space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#c59b27]" />
              <span>مشغل التحفيظ المنزلي والتسميع الصوتي</span>
            </h2>
            <p className="text-xs text-neutral-500">
              6 قراء متقنين • وضع التلقين والترديد خلف الشيخ مع مهلة التسميع الغيبي • تكرار الآية والنطاق
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadCurrentSessionAssignment}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#145a3a] to-emerald-700 hover:from-[#0f452c] hover:to-emerald-800 text-white text-xs font-extrabold shadow-sm cursor-pointer transition active:scale-95"
            >
              <span>📥 استدعاء تكليف الحصة الحالية</span>
            </button>

            <button
              type="button"
              onClick={() => setSelfTestHide((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
                selfTestHide
                  ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27]'
                  : 'border-neutral-200 dark:border-emerald-900'
              }`}
            >
              {selfTestHide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{selfTestHide ? 'إظهار نص الآيات' : 'إخفاء النص لاختبار الحفظ'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs inside Tahfeez Studio so it is organized into buttons instead of a long scroll */}
        {student && (
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40">
            {(
              [
                {
                  id: 'player' as const,
                  label: '📖 المصحف المعلم والتلقين السمعي',
                },
                {
                  id: 'recorder' as const,
                  label: '🎙️ تسجيل التسميع المنزلي وملاحظات الشيخ',
                },
                {
                  id: 'mutashabihat' as const,
                  label: `✨ بطاقات متشابهاتي الخاصة (${(student.customMutashabihat || []).length})`,
                },
              ]
            ).map((stTab) => (
              <button
                key={stTab.id}
                type="button"
                onClick={() => setTahfeezSubTab(stTab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  tahfeezSubTab === stTab.id
                    ? 'bg-[#145a3a] text-white shadow-xs'
                    : 'bg-white dark:bg-[#12231a] text-[#14281d] dark:text-white border border-neutral-200 dark:border-emerald-900/50 hover:border-[#c59b27]'
                }`}
              >
                {stTab.label}
              </button>
            ))}
          </div>
        )}

        {/* Sub-Tab 2: StudentAudioRecorder Component */}
        {student && tahfeezSubTab === 'recorder' && (
          <StudentAudioRecorder
            studentId={student.id}
            studentName={student.name}
            surahId={surahId}
            surahName={surahMeta.name}
            fromAyah={fromAyah}
            toAyah={toAyah}
            reciter={reciter}
            todayStr={todayStr}
          />
        )}

        {/* Sub-Tab 1: Player & Assignment Context Hub */}
        {(!student || tahfeezSubTab === 'player') && (
          <>
        {student && (
          <div className="p-4 rounded-2xl bg-gradient-to-l from-[#145a3a]/10 via-[#fcfaf2] to-amber-50/70 dark:from-[#145a3a]/30 dark:via-[#0b1711] dark:to-[#12231a] border-2 border-[#c59b27]/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-[#dfbd69] text-[11px] font-extrabold">
                  🎯 سياق التكليف الحالي للطالب ({student.name})
                </span>
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  انقر على أي مسار لتحميل السورة والآيات وضبط وضع التلقين أو المراجعة تلقائياً:
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const taskKey: FiveFortressTaskKey =
                    activeAssignmentTrack === 'near_review'
                      ? 'reviewedLink'
                      : activeAssignmentTrack === 'far_review'
                      ? 'reviewedFar'
                      : 'listened3Times';
                  toggleStudentFortressTask(student.id, taskKey, todayStr);
                  showToast(
                    '✅ تم تسجيل إتمام التدريب السمعي في سجل الحصون الخمسة للطالب (+10 XP)',
                    'success'
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تسجيل إنجاز هذا التكليف في الحصون الخمسة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(
                [
                  {
                    id: 'new_mem' as const,
                    badge: '🌟 الحفظ الجديد',
                    title: `سورة ${studentAssignmentContext.newMem.surahName}`,
                    range: `الآيات (${studentAssignmentContext.newMem.fromAyah} - ${studentAssignmentContext.newMem.toAyah})`,
                    sub: 'وضع التلقين والترديد (3×)',
                  },
                  {
                    id: 'near_review' as const,
                    badge: '🔗 الربط والمراجعة القريبة',
                    title: `سورة ${studentAssignmentContext.nearRev.surahName}`,
                    range: `الآيات (${studentAssignmentContext.nearRev.fromAyah} - ${studentAssignmentContext.nearRev.toAyah})`,
                    sub: 'وضع التكرار والربط (3×)',
                  },
                  {
                    id: 'far_review' as const,
                    badge: '🏛️ المراجعة البعيدة',
                    title: `سورة ${studentAssignmentContext.farRev.surahName}`,
                    range: `الآيات (${studentAssignmentContext.farRev.fromAyah} - ${studentAssignmentContext.farRev.toAyah})`,
                    sub: 'وضع اختبار الحفظ الغيبي',
                  },
                  {
                    id: 'current_stop' as const,
                    badge: '📍 موضع التوقف بالملف',
                    title: `سورة ${studentAssignmentContext.currentStopTrack.surahName}`,
                    range: `الآيات (${studentAssignmentContext.currentStopTrack.fromAyah} - ${studentAssignmentContext.currentStopTrack.toAyah})`,
                    sub: 'استماع متصل وتحضير',
                  },
                ]
              ).map((item) => {
                const isSelected = activeAssignmentTrack === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLoadAssignmentTrack(item.id)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-sm ring-2 ring-[#c59b27]/40'
                        : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/60 hover:border-[#c59b27]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-[#c59b27] text-[#14281d]'
                            : 'bg-emerald-500/10 text-[#145a3a] dark:text-[#dfbd69]'
                        }`}
                      >
                        {item.badge}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-extrabold text-[#dfbd69]">
                          نشط الآن ✓
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black mt-1">
                      {item.title} — {item.range}
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        isSelected ? 'text-emerald-100' : 'text-neutral-500'
                      }`}
                    >
                      {item.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69] flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#c59b27]/30">
              <span>💬 توجيه المحفظ لهذا التكليف: "{studentAssignmentContext.teacherNote}"</span>
              <span className="font-mono text-[10px] text-neutral-500">
                النطاق المحمّل حالياً: سورة {surahMeta.name} ({fromAyah} - {toAyah}) •{' '}
                {Math.max(1, toAyah - fromAyah + 1)} آيات
              </span>
            </div>
          </div>
        )}

        {/* Interactive 6-Reciter Visual Selector Strip (اختيار القراء الستة مع التبديل الفوري) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#c59b27]" />
              <span>اختر القارئ المفضل (يدعم التبديل الحي الفوري أثناء التلاوة):</span>
            </label>
            <span className="text-[11px] text-neutral-500">
              القارئ النشط: <strong>{RECITERS.find((r) => r.id === reciter)?.name}</strong>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {RECITERS.map((r) => {
              const isSelected = reciter === r.id;
              const isMuallim =
                r.id.includes('Muallim') || r.id.includes('Teacher');
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectReciterLive(r.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'bg-[#145a3a] text-white border-[#c59b27] shadow-sm'
                      : 'bg-[#fcfaf2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60 hover:border-[#c59b27]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                        isSelected
                          ? 'bg-[#c59b27] text-[#14281d]'
                          : isMuallim
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-500/10 text-[#145a3a] dark:text-[#dfbd69]'
                      }`}
                    >
                      {isMuallim ? '🎓 مصحف معلم للتلقين' : '🎙️ تلاوة مرتلة'}
                    </span>
                    {isSelected && <Volume2 className="w-3.5 h-3.5 text-[#dfbd69]" />}
                  </div>
                  <div className="text-xs font-extrabold leading-snug mt-0.5">
                    {r.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Grid: Surah, 6 Reciters Dropdown, Range, Single Ayah Repeat, Full Range Repeat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold mb-1">السورة المقررة</label>
            <select
              value={surahId}
              onChange={(e) => {
                const id = Number(e.target.value);
                const m = SURAHS.find((s) => s.id === id) || SURAHS[0];
                stopProTahfeezPlayer();
                setActiveAssignmentTrack('custom');
                setSurahId(id);
                setFromAyah(1);
                setToAyah(Math.min(10, m.ayahs));
              }}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
            >
              {SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. سورة {s.name} ({s.ayahs} آية)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">القارئ (6 قراء معتمدين)</label>
            <select
              value={reciter}
              onChange={(e) => handleSelectReciterLive(e.target.value as ReciterId)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">نطاق الآيات (من - إلى)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={surahMeta.ayahs}
                value={fromAyah}
                onChange={(e) => {
                  setActiveAssignmentTrack('custom');
                  setFromAyah(Math.max(1, Number(e.target.value) || 1));
                }}
                className="w-full px-2 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono text-center"
              />
              <input
                type="number"
                min={1}
                max={surahMeta.ayahs}
                value={toAyah}
                onChange={(e) => {
                  setActiveAssignmentTrack('custom');
                  setToAyah(
                    Math.max(
                      fromAyah,
                      Math.min(surahMeta.ayahs, Number(e.target.value) || 7)
                    )
                  );
                }}
                className="w-full px-2 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">تكرار الآية الواحدة</label>
            <select
              value={repeatCount}
              onChange={(e) => setRepeatCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
            >
              <option value={1}>1 مرة</option>
              <option value={2}>2 مرتان</option>
              <option value={3}>3 مرات</option>
              <option value={5}>5 مرات</option>
              <option value={7}>7 مرات</option>
              <option value={10}>10 مرات</option>
              <option value={0}>∞ تكرار مستمر</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">تكرار النطاق الكامل</label>
            <select
              value={rangeRepeatCount}
              onChange={(e) => setRangeRepeatCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
            >
              <option value={1}>1 مرة</option>
              <option value={3}>3 مرات (ربط)</option>
              <option value={5}>5 مرات (تثبيت)</option>
              <option value={7}>7 مرات</option>
              <option value={10}>10 مرات</option>
              <option value={0}>∞ تكرار مستمر</option>
            </select>
          </div>
        </div>

        {/* 5 Memorization & Repetition Modes + Shadowing Mode Studio Panel */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: 'talqeen',
                label: '١. وضع التلقين والترديد خلف الشيخ',
                repeat: 3,
                hide: false,
              },
              {
                id: 'repeat',
                label: '٢. تكرار الآية الواحدة والنطاق الكامل (تثبيت وربط)',
                repeat: 5,
                hide: false,
              },
              {
                id: 'selftest',
                label: '٣. اختبار الحفظ الذاتي أثناء الاستماع (إخفاء النص)',
                repeat: 1,
                hide: true,
              },
              {
                id: 'audio_selftest',
                label: '٤. الاختبار السمعي الذاتي (أول كلمة + مهلة تسميع)',
                repeat: 1,
                hide: false,
              },
              {
                id: 'listen',
                label: '٥. الاستماع المتصل المتقن',
                repeat: 1,
                hide: false,
              },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setHomeTahfeezMode(
                    m.id as
                      | 'listen'
                      | 'talqeen'
                      | 'repeat'
                      | 'selftest'
                      | 'audio_selftest'
                  );
                  setRepeatCount(m.repeat);
                  setSelfTestHide(m.hide);
                  setRevealedSelfTestAyahs({});
                  setAudioSelfTestAyah(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  homeTahfeezMode === m.id
                    ? 'bg-[#145a3a] text-[#dfbd69] border-[#c59b27] shadow-xs'
                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {homeTahfeezMode === 'talqeen' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-[#c59b27]/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <span>استوديو التلقين والترديد الصوتي خلف الشيخ:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      shadowingPhase === 'student_repeating'
                        ? 'bg-amber-400 text-[#14281d] animate-pulse'
                        : shadowingPhase === 'sheikh_reciting'
                        ? 'bg-[#145a3a] text-white'
                        : 'bg-neutral-200 dark:bg-emerald-950 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {shadowingPhase === 'student_repeating'
                      ? `🗣️ دور الطالب الآن: ردّد الآية غيباً (${activeSilenceCountdown}ث)`
                      : shadowingPhase === 'sheikh_reciting'
                      ? '🔊 خطوة ١: استمع بإنصات لتلاوة الشيخ'
                      : 'جاهز لبدء التلقين'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                  يتلو الشيخ الآية ثم يتوقف المشغل تلقائياً بمهلة صمت محسوبة لتردد الآية غيباً بنفس التجويد قبل الانتقال للتكرار أو الآية التالية.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Shadowing Presets Bound to Current Student Assignment */}
                <button
                  type="button"
                  onClick={() => {
                    setRepeatCount(3);
                    setShadowingAutoSilence(true);
                    playAyahWithRepeat(playingAyah || fromAyah);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] font-extrabold cursor-pointer"
                >
                  🎯 تلقين ٣× + صمت ذكي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRepeatCount(5);
                    setShadowingAutoSilence(true);
                    playAyahWithRepeat(playingAyah || fromAyah);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] font-extrabold cursor-pointer"
                >
                  🔥 تثبيت ٥× للمتشابهات
                </button>

                <button
                  type="button"
                  onClick={() => setShadowingAutoSilence((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold border cursor-pointer ${
                    shadowingAutoSilence
                      ? 'bg-[#145a3a] text-[#dfbd69] border-[#c59b27]'
                      : 'bg-white dark:bg-[#12231a] border-neutral-300 dark:border-emerald-900'
                  }`}
                >
                  {shadowingAutoSilence
                    ? '⚡ مهلة ذكية تلقائية (1.25× طول الآية)'
                    : '⏱️ مهلة ثابتة بالثواني'}
                </button>

                {!shadowingAutoSilence && (
                  <div className="flex items-center gap-1.5 bg-white dark:bg-[#12231a] px-2.5 py-1 rounded-xl border border-[#c59b27]">
                    <span className="font-bold">مهلة الصمت:</span>
                    <select
                      value={shadowingSilenceSeconds}
                      onChange={(e) =>
                        setShadowingSilenceSeconds(Number(e.target.value))
                      }
                      className="bg-transparent font-black text-[#145a3a] dark:text-[#dfbd69]"
                    >
                      {[3, 5, 6, 8, 10, 12, 15, 20].map((sec) => (
                        <option key={sec} value={sec} className="text-black">
                          {sec} ثوانٍ
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShadowingChimeEnabled((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold border cursor-pointer ${
                    shadowingChimeEnabled
                      ? 'bg-emerald-500/15 border-emerald-600/40 text-emerald-900 dark:text-emerald-300'
                      : 'bg-white dark:bg-[#12231a] border-neutral-300 text-neutral-500'
                  }`}
                >
                  {shadowingChimeEnabled ? '🔔 نغمة بدء الترديد: مفعلة' : '🔕 نغمة البدء: صامتة'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pro Transport Deck, Speed Control & Audio Seek (±5s / ±10s) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#145a3a] via-[#10462d] to-[#145a3a] text-white border border-[#c59b27] shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  const prevA = Math.max(fromAyah, (playingAyah || fromAyah) - 1);
                  playAyahWithRepeat(prevA);
                }}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer"
                title="الآية السابقة"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleSkipSeconds(-10)}
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                title="تأخير الصوت 10 ثوانٍ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>-10ث</span>
              </button>

              <button
                type="button"
                onClick={() => handleSkipSeconds(-5)}
                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-extrabold cursor-pointer"
                title="تأخير الصوت 5 ثوانٍ"
              >
                -5ث
              </button>

              <button
                type="button"
                onClick={() => {
                  if (playingAyah !== null) {
                    if (isPausedTahfeez) {
                      audioRef.current?.play().catch(() => {});
                      setIsPausedTahfeez(false);
                    } else {
                      audioRef.current?.pause();
                      setIsPausedTahfeez(true);
                    }
                  } else {
                    playAyahWithRepeat(fromAyah);
                  }
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs sm:text-sm font-black flex items-center gap-2 shadow-md cursor-pointer"
              >
                {playingAyah !== null && !isPausedTahfeez ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>إيقاف مؤقت (آية {playingAyah})</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>
                      {isPausedTahfeez
                        ? `استئناف التلاوة (آية ${playingAyah})`
                        : `تشغيل التكليف (${fromAyah} - ${toAyah})`}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSkipSeconds(5)}
                className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-extrabold cursor-pointer"
                title="تقديم الصوت 5 ثوانٍ"
              >
                +5ث
              </button>

              <button
                type="button"
                onClick={() => handleSkipSeconds(10)}
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                title="تقديم الصوت 10 ثوانٍ"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>+10ث</span>
              </button>

              <button
                type="button"
                onClick={handleReplayCurrentAyahFromStart}
                className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-[#dfbd69]/50 text-[#dfbd69] text-xs font-extrabold cursor-pointer"
                title="إعادة الآية الحالية من بدايتها"
              >
                ↺ إعادة الآية
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextA = Math.min(toAyah, (playingAyah || fromAyah) + 1);
                  playAyahWithRepeat(nextA);
                }}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 cursor-pointer"
                title="الآية التالية"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {playingAyah !== null && (
                <button
                  type="button"
                  onClick={stopProTahfeezPlayer}
                  className="px-3 py-1.5 rounded-xl bg-red-500/80 hover:bg-red-600 text-white text-xs font-extrabold cursor-pointer"
                >
                  إيقاف كامل
                </button>
              )}
            </div>

            {/* Speed Presets + Fine Slider */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-amber-200">السرعة ({playbackSpeed}x):</span>
              {[0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75].map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => {
                    setPlaybackSpeed(sp);
                    if (audioRef.current) {
                      audioRef.current.playbackRate = sp;
                    }
                  }}
                  className={`px-2 py-1 rounded-lg font-mono text-[11px] font-extrabold cursor-pointer ${
                    playbackSpeed === sp
                      ? 'bg-[#c59b27] text-[#14281d]'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {sp}x
                </button>
              ))}
              <input
                type="range"
                min={0.5}
                max={1.75}
                step={0.05}
                value={playbackSpeed}
                onChange={(e) => {
                  const sp = Number(Number(e.target.value).toFixed(2));
                  setPlaybackSpeed(sp);
                  if (audioRef.current) {
                    audioRef.current.playbackRate = sp;
                  }
                }}
                aria-label="التحكم الدقيق في سرعة القراءة"
                className="w-20 accent-[#c59b27] cursor-pointer h-1.5 rounded-lg"
              />
            </div>
          </div>

          {/* Interactive Audio Timeline & Shadowing Silence Countdown Controls */}
          <div className="space-y-1.5">
            <input
              type="range"
              min={0}
              max={Math.max(1, audioDurationSec)}
              step={0.1}
              value={Math.min(audioProgressSec, Math.max(1, audioDurationSec))}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAudioProgressSec(val);
                if (audioRef.current) {
                  audioRef.current.currentTime = val;
                }
              }}
              className="w-full accent-[#c59b27] cursor-pointer h-2 rounded-lg"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-100 font-mono">
              <span>
                {playingAyah
                  ? `الآية الحالية: (${playingAyah}) من (${fromAyah}-${toAyah}) • تكرار الآية: ${currentAyahRepeatDone}/${
                      repeatCount === 0 ? '∞' : repeatCount
                    } • شوط النطاق: ${currentRangePassDone + 1}/${
                      rangeRepeatCount === 0 ? '∞' : rangeRepeatCount
                    }`
                  : `جاهز للتشغيل: سورة ${surahMeta.name} (${fromAyah} - ${toAyah})`}
              </span>

              {activeSilenceCountdown > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 font-sans">
                  <span className="px-3 py-0.5 rounded-full bg-amber-400 text-[#14281d] font-black animate-pulse">
                    🎙️ دورك الآن: ردّد الآية غيباً ({activeSilenceCountdown} / {activeSilenceTotal}ث)...
                  </span>
                  <button
                    type="button"
                    onClick={() => extendSilenceCountdown(5)}
                    className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-extrabold cursor-pointer"
                  >
                    +5ث مهلة إضافية
                  </button>
                  <button
                    type="button"
                    onClick={skipSilenceCountdownNow}
                    className="px-2 py-0.5 rounded-lg bg-[#c59b27] text-[#14281d] text-[10px] font-extrabold cursor-pointer"
                  >
                    تخطي المهلة والانتقال ⏭️
                  </button>
                </div>
              )}

              <span>
                {audioProgressSec.toFixed(1)}s / {audioDurationSec ? audioDurationSec.toFixed(1) : '0.0'}s
              </span>
            </div>
          </div>
        </div>

        {homeTahfeezMode === 'audio_selftest' && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-[#c59b27] text-xs space-y-1">
            <div className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              🎧 وضع «الاختبار السمعي الذاتي» مفعّل الآن:
            </div>
            <p className="text-neutral-600 dark:text-neutral-300">
              يعرض لك النظام وينطق **أول كلمة من الآية فقط**، ويمنحك مهلة (8 ثوانٍ) لتسميع الآية غيباً، ثم يكشف لك نص الآية الكامل ويشغل تلاوة القارئ للتأكد من إتقانك!
            </p>
          </div>
        )}

        {/* Word Meaning & Tafsir Popover on Word Click */}
        {clickedHomeWord && (
          <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-[#c59b27] space-y-2 shadow-sm">
            {(() => {
              const info = getWordMeaningAndTafsir(
                clickedHomeWord.word,
                clickedHomeWord.ayahEntry,
                surahMeta.name
              );
              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#145a3a] text-[#dfbd69] text-[11px] font-extrabold">
                        معنى الكلمة وتفسير الآية
                      </span>
                      <span className="font-quran text-2xl font-bold text-[#145a3a] dark:text-[#dfbd69]">
                        ﴿{clickedHomeWord.word}﴾
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClickedHomeWord(null)}
                      className="text-xs font-bold text-neutral-500 hover:text-red-600 cursor-pointer"
                    >
                      إغلاق ✕
                    </button>
                  </div>
                  <p className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                    <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                      معنى الكلمة:
                    </strong>{' '}
                    {info.wordMeaning}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                      التفسير الميسر للآية ({clickedHomeWord.ayahEntry.ayah}):
                    </strong>{' '}
                    {info.ayahTafsir}
                  </p>
                  <div className="text-[10px] font-bold text-neutral-400">
                    المصدر: {info.tafsirSource}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Quran Display */}
        <div className="p-6 rounded-3xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-[#c59b27]/50 space-y-4">
          <div className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69]">
            💡 اضغط على أي كلمة قرآنية لعرض معناها وتفسير الآية الكريمة فوراً
          </div>
          {verses.map((v) => {
            const words = v.text.split(/\s+/).filter(Boolean);
            return (
              <div
                key={v.ayah}
                className={`p-4 rounded-2xl border transition-all ${
                  playingAyah === v.ayah
                    ? 'bg-[#c59b27]/20 border-[#c59b27]'
                    : 'bg-white dark:bg-[#12231a] border-neutral-200/70 dark:border-emerald-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono tabular-nums font-bold text-[#145a3a] dark:text-[#dfbd69]">
                    الآية ({v.ayah})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      playingAyah === v.ayah
                        ? (audioRef.current?.pause(), setPlayingAyah(null))
                        : playAyahWithRepeat(v.ayah, repeatCount)
                    }
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
                  >
                    {playingAyah === v.ayah ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>إيقاف</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#dfbd69]" />
                        <span>استماع وتكرار ({repeatCount}×)</span>
                      </>
                    )}
                  </button>
                </div>

                {homeTahfeezMode === 'audio_selftest' &&
                !revealedSelfTestAyahs[v.ayah] ? (
                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-[#0b1711] border border-dashed border-[#c59b27] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-quran text-2xl font-bold text-[#145a3a] dark:text-[#dfbd69]">
                        أول كلمة: ﴿ {words[0]}{' '}
                        {words[1] ? `${words[1]} ...` : '...'} ﴾
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              typeof window !== 'undefined' &&
                              'speechSynthesis' in window
                            ) {
                              const u = new SpeechSynthesisUtterance(
                                `${words[0]} ${words[1] || ''}`
                              );
                              u.lang = 'ar-SA';
                              window.speechSynthesis.speak(u);
                            }
                            setAudioSelfTestAyah(v.ayah);
                            setAudioSelfTestSeconds(8);
                            const timer = setInterval(() => {
                              setAudioSelfTestSeconds((prev) => {
                                if (prev <= 1) {
                                  clearInterval(timer);
                                  setRevealedSelfTestAyahs((r) => ({
                                    ...r,
                                    [v.ayah]: true,
                                  }));
                                  setAudioSelfTestAyah(null);
                                  playAyahWithRepeat(v.ayah, 1);
                                  return 0;
                                }
                                return prev - 1;
                              });
                            }, 1000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold cursor-pointer"
                        >
                          {audioSelfTestAyah === v.ayah
                            ? `⏱️ سمّع غيباً الآن... (${audioSelfTestSeconds}ث)`
                            : '🎙️ انطق أول كلمة وابدأ مهلة التسميع (8ث)'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRevealedSelfTestAyahs((r) => ({
                              ...r,
                              [v.ayah]: true,
                            }));
                            setAudioSelfTestAyah(null);
                            playAyahWithRepeat(v.ayah, 1);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
                        >
                          كشف الآية وتشغيل القارئ للتأكد
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`font-quran text-2xl sm:text-3xl leading-[2.7] py-3 px-2 flex flex-wrap items-center gap-x-2.5 gap-y-3 transition-all ${
                      selfTestHide
                        ? 'blur-md hover:blur-none select-none cursor-pointer'
                        : ''
                    }`}
                    title={
                      selfTestHide
                        ? 'مرر أو انقر لإظهار الآية'
                        : 'اضغط على أي كلمة لعرض معناها وتفسير الآية'
                    }
                  >
                    {words.map((w, idx) => (
                      <button
                        key={`${v.ayah}-${idx}`}
                        type="button"
                        onClick={() =>
                          setClickedHomeWord({ word: w, ayahEntry: v })
                        }
                        className={`px-1.5 py-1 rounded-lg leading-normal transition-colors cursor-pointer ${
                          clickedHomeWord?.word === w &&
                          clickedHomeWord?.ayahEntry.ayah === v.ayah
                            ? 'bg-[#c59b27] text-[#14281d] font-bold'
                            : 'hover:bg-[#c59b27]/20'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-neutral-500 mt-2 pt-2 border-t border-neutral-100 dark:border-emerald-950">
                  <strong>التفسير الميسر:</strong> {v.tafsir}
                </p>
              </div>
            );
          })}
        </div>
          </>
        )}
      </div>
      )}

      {/* 2. بطاقات «متشابهاتي الخاصة» للطالب (Personal Student Mutashabihat Cards) */}
      {student &&
        guardianScreenTab === 'tahfeez_studio' &&
        tahfeezSubTab === 'mutashabihat' && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-purple-400/40 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-emerald-950">
            <div>
              <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span>
                  بطاقات «متشابهاتي الخاصة» للطالب ({student.name})
                </span>
              </h2>
              <p className="text-xs text-neutral-500">
                الآيات التي تشابهت أثناء التسميع مع تلوين موضع الاختلاف وضابط التفرقة الذهني
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 text-xs font-extrabold">
              {(student.customMutashabihat || []).length} بطاقة مخصصة
            </span>
          </div>

          {(student.customMutashabihat || []).length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] text-xs text-neutral-500">
              يمكن للشيخ المحفظ إضافة بطاقات «متشابهاتي الخاصة» مباشرة من نافذة المصحف أثناء التسميع لربط أي آيتين تشابهتا على الطالب.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(student.customMutashabihat || []).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-purple-300 dark:border-purple-900/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-extrabold text-purple-800 dark:text-purple-300">
                    <span>
                      سورة {item.surahAName} ({item.ayahANumber}) ↔ سورة{' '}
                      {item.surahBName} ({item.ayahBNumber})
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      موضع الاختلاف: «{item.diffHighlightWord}»
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 font-quran text-base">
                    ١. ﴿{item.ayahAText}﴾
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 font-quran text-base">
                    ٢. ﴿{item.ayahBText}﴾
                  </div>
                  <div className="text-xs font-bold text-[#145a3a] dark:text-[#dfbd69]">
                    💡 ضابط التفرقة: {item.dabitRule}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Sheikh Evaluation & Appreciation System (تقييم وتشجيع الشيخ المحفظ من ولي الأمر) */}
      {userRole === 'guardian' &&
        student &&
        portalViewPersona !== 'student' &&
        guardianScreenTab === 'family_oasis' && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/50 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
            <div>
              <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>تقييم وتشجيع الشيخ المحفظ ({settings.teacherName})</span>
              </h2>
              <p className="text-xs text-neutral-500">
                شاركنا تقييمك الدوري لأداء الحلقة (من 5 نجوم) ووجه كلمة شكر ودعاء للمحفظ تظهر في لوحة شرفه
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-extrabold">
              إجمالي تقييمات أولياء الأمور: {teacherRatings.length}
            </span>
          </div>

          <form onSubmit={handleSubmitTeacherRating} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'الالتزام بالموعد', val: punctuality, setVal: setPunctuality },
                { label: 'أسلوب الشرح والتأسيس', val: explanation, setVal: setExplanation },
                { label: 'التشجيع والصبر', val: encouragement, setVal: setEncouragement },
                { label: 'جودة الصوت والسبورة', val: audioBoardQuality, setVal: setAudioBoardQuality },
                { label: 'المتابعة مع ولي الأمر', val: guardianFollowUp, setVal: setGuardianFollowUp },
              ].map((crit) => (
                <div
                  key={crit.label}
                  className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 text-center space-y-1.5"
                >
                  <div className="text-xs font-extrabold text-[#14281d] dark:text-white">
                    {crit.label}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => crit.setVal(star)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= crit.val
                              ? 'text-[#c59b27] fill-[#c59b27]'
                              : 'text-neutral-300 dark:text-neutral-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={gratitudeMessage}
                onChange={(e) => setGratitudeMessage(e.target.value)}
                placeholder="اكتب رسالة شكر ودعاء للشيخ المحفظ..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Award className="w-4 h-4 text-[#dfbd69]" />
                <span>إرسال التقييم ورسالة الشكر للمحفظ</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Guardian Student ID Card Modal */}
      {guardianIdCardOpen && student && (
        <StudentIdCardModal
          student={student}
          settings={settings}
          onClose={() => setGuardianIdCardOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Guardian Milestone Bisharah Card Modal */}
      {guardianBisharahOpen && student && (
        <MilestoneBisharahModal
          student={student}
          settings={settings}
          onClose={() => setGuardianBisharahOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Guardian Official Payment Receipt Modal */}
      {guardianActiveReceipt && student && (
        <PaymentReceiptModal
          student={student}
          fee={guardianActiveReceipt}
          settings={settings}
          onClose={() => setGuardianActiveReceipt(null)}
          onShowToast={showToast}
        />
      )}

      {/* Printable Family Honor Certificate Modal (شهادة شكر وتقدير للأسرة القرآنية وتاج الوقار) */}
      {familyCertificateModalOpen && student && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="bg-[#fcfaf2] dark:bg-[#12231a] border-4 border-double border-[#c59b27] rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl text-center relative">
            <div className="flex items-center justify-between border-b border-[#c59b27]/40 pb-3">
              <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                🏛️ {settings.academyName} — {settings.Slogan}
              </span>
              <button
                type="button"
                onClick={() => setFamilyCertificateModalOpen(false)}
                className="px-3 py-1 rounded-xl bg-neutral-200/70 dark:bg-emerald-950 text-xs font-bold cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="py-4 px-5 rounded-2xl bg-gradient-to-b from-amber-500/10 via-transparent to-emerald-500/10 border border-[#c59b27]/50 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
                <Crown className="w-4 h-4" />
                <span>وسام الأسرة القرآنية وبشارة تاج الوقار</span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black font-quran text-[#145a3a] dark:text-[#dfbd69]">
                شهادة شكر وتقدير وعرفان للوالدين الكريمين
              </h3>

              <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">
                تتشرف إدارة <strong>{settings.academyName}</strong> بإهداء أسمى آيات التقدير والدعاء بالبركة إلى أسرة وولي أمر الطالب المبارك:
              </p>

              <div className="py-2.5 px-6 rounded-2xl bg-white dark:bg-[#0b1711] border-2 border-[#c59b27] inline-block">
                <div className="text-lg md:text-xl font-black text-[#145a3a] dark:text-[#dfbd69]">
                  الوالد الكريم / {student.guardianName} — حفظه الله ورعاه
                </div>
                <div className="text-xs font-bold text-[#c59b27] mt-0.5">
                  ولي أمر البطل الحافظ: {student.name} ({student.level})
                </div>
              </div>

              <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed max-w-xl mx-auto">
                تقديراً لجهودكم المباركة في رعاية غرس القرآن الكريم في بيتكم العامر، ومتابعتكم الدؤوبة لحفظ ومراجعة كتاب الله عز وجل ({student.memorizedSurahs.length} سورة • {student.memorizedJuz.length} أجزاء)، سائلين الله أن يلبسكم به <strong>تاج الوقار</strong> يوم القيامة، وأن يجعله قرة عين لكم في الدنيا والآخرة.
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#c59b27]/30 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                <div>
                  المشرف العام والمحفظ: <strong>{settings.teacherName}</strong>
                </div>
                <div>
                  التاريخ: <span className="font-mono">{todayStr}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ طباعة شهادة الأسرة القرآنية / حفظ PDF</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `👑 شهادة شكر وتقدير للأسرة القرآنية من «${settings.academyName}» لأسرة الطالب (${student.name}) وولي أمره الكريم (${student.guardianName}) — بارك الله في بيت يُتلى فيه القرآن!\nhttps://welivequran.online/`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>مشاركة الشهادة عبر واتساب</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. بوابة تسجيل الطلاب الجدد وحجز تحديد المستوى (New Student Admission Funnel Modal) */}
      {admissionModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="bg-white dark:bg-[#12231a] border-2 border-[#c59b27] rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-emerald-900 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  📝 التحق بالأكاديمية / حجز موعد تحديد مستوى
                </h3>
                <p className="text-xs text-neutral-500">
                  سجل بيانات الطالب الجديد ليظهر فوراً في طابور القبول لدى الشيخ مع تأكيد فوري عبر واتساب الأكاديمية ({OFFICIAL_ACADEMY_WHATSAPP})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdmissionModalOpen(false)}
                className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-emerald-950 text-xs font-bold cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">اسم الطالب ثلاثياً *</label>
                <input
                  type="text"
                  value={admStudentName}
                  onChange={(e) => setAdmStudentName(e.target.value)}
                  placeholder="مثال: عبد الله محمد أحمد"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">العمر (بالسنوات)</label>
                <input
                  type="number"
                  min={4}
                  max={85}
                  value={admAge}
                  onChange={(e) => setAdmAge(Number(e.target.value) || 8)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">اسم ولي الأمر *</label>
                <input
                  type="text"
                  value={admGuardianName}
                  onChange={(e) => setAdmGuardianName(e.target.value)}
                  placeholder="اسم الأب أو الأم"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">رقم الواتساب للتواصل *</label>
                <input
                  type="text"
                  value={admGuardianPhone}
                  onChange={(e) => setAdmGuardianPhone(e.target.value)}
                  placeholder="2010xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">الرواية المطلوبة</label>
                <select
                  value={admRiwayah}
                  onChange={(e) => setAdmRiwayah(e.target.value as QuranRiwayah)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] font-bold"
                >
                  {Object.values(QURAN_RIWAYAT_GUIDE).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">المستوى الحالي</label>
                <input
                  type="text"
                  value={admCurrentLevel}
                  onChange={(e) => setAdmCurrentLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">الأيام المفضلة</label>
                <input
                  type="text"
                  value={admPreferredDays}
                  onChange={(e) => setAdmPreferredDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">الموعد المفضل (بتوقيت الأكاديمية)</label>
                <input
                  type="time"
                  value={admPreferredTime}
                  onChange={(e) => setAdmPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-emerald-900">
              <button
                type="button"
                onClick={() => {
                  if (!admStudentName.trim() || !admGuardianPhone.trim()) {
                    showToast('يرجى إدخال اسم الطالب ورقم واتساب ولي الأمر', 'info');
                    return;
                  }
                  submitAdmissionRequest({
                    studentName: admStudentName.trim(),
                    age: admAge,
                    guardianName: admGuardianName.trim() || 'ولي الأمر',
                    guardianPhone: admGuardianPhone.trim(),
                    countryOrTimezone: admCountry,
                    preferredDays: admPreferredDays,
                    preferredTime: admPreferredTime,
                    currentLevel: admCurrentLevel,
                    requestedRiwayah: admRiwayah,
                    notes: admNotes,
                  });
                  setAdmissionModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
              >
                ✅ تسجيل في طابور القبول بالأكاديمية
              </button>

              <a
                href={`https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}?text=${encodeURIComponent(
                  `السلام عليكم ورحمة الله، أرغب في حجز موعد تحديد مستوى للطالب (${admStudentName || 'جديد'}) - العمر (${admAge}) - الرواية (${admRiwayah}) - الموعد المفضل (${admPreferredDays} الساعة ${admPreferredTime}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>تأكيد الحجز عبر واتساب ({OFFICIAL_ACADEMY_WHATSAPP})</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

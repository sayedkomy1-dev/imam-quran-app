// ============================================================================
// WLQSyncCore, Canonical JSON, ImamSessionRestore, Haptics & Memory Relief
// Release v12.0.0 (Schema = 12) — Offline-First & Deterministic Cloud Sync
// ============================================================================

export const SUPABASE_OFFICIAL_CONFIG = {
  supabaseUrl: 'https://svtcntalwfmexthcnvqe.supabase.co',
  publishableKey: 'sb_publishable_qYw8VdT1IXQ5WsdB2rhtEA_F6dSAN-j',
  siteUrl: 'https://welivequran.online/',
  ownerEmail: 'info.welivequran@gmail.com',
  trustStorageKey: 'wlq.auth.trusted.v1',
  schemaVersion: 12,
  appVersion: '12.0.0',
} as const;

export type SyncStateBadge =
  | 'مسودة محلية'
  | 'محفوظ محلياً'
  | 'بانتظار المزامنة'
  | 'تمت المزامنة السحابية'
  | 'تعارض يحتاج مراجعة'
  | 'تم فتح واتساب للمراجعة اليدوية';

/**
 * Recursive alphabetical key sorting for 100% deterministic tie-breaking
 * across all browsers and devices when timestamps are equal.
 */
export function canonicalJson(value: unknown): string {
  const normalize = (val: unknown): unknown => {
    if (val === null || typeof val !== 'object') {
      return val;
    }
    if (Array.isArray(val)) {
      return val.map(normalize);
    }
    const record = val as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const k of sortedKeys) {
      if (record[k] !== undefined) {
        sortedObj[k] = normalize(record[k]);
      }
    }
    return sortedObj;
  };

  try {
    return JSON.stringify(normalize(value));
  } catch {
    return String(value);
  }
}

export interface TombstoneEntry {
  id: string;
  deletedAt: number;
  entityType: 'student' | 'session' | 'task';
}

const TOMBSTONES_STORAGE_KEY = 'wlq_sync_tombstones_v12';
const DELETED_STUDENT_IDS_KEY = 'wlq_deleted_student_ids_v12';

export const WLQSyncCore = {
  getDeletedStudentIds(): string[] {
    try {
      const raw = localStorage.getItem(DELETED_STUDENT_IDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getTombstones(): Record<string, TombstoneEntry> {
    try {
      const raw = localStorage.getItem(TOMBSTONES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  markTombstone(
    id: string,
    entityType: 'student' | 'session' | 'task' = 'student',
    deletedAt = Date.now()
  ): Record<string, TombstoneEntry> {
    const current = this.getTombstones();
    current[id] = { id, entityType, deletedAt };
    try {
      localStorage.setItem(TOMBSTONES_STORAGE_KEY, JSON.stringify(current));
      if (entityType === 'student') {
        const deletedIds = new Set(this.getDeletedStudentIds());
        deletedIds.add(id);
        localStorage.setItem(
          DELETED_STUDENT_IDS_KEY,
          JSON.stringify(Array.from(deletedIds))
        );
      }
    } catch {
      // ignore storage quota errors
    }
    return current;
  },

  mergeTombstones(
    localTombstones: Record<string, TombstoneEntry>,
    remoteTombstones: Record<string, TombstoneEntry>
  ): Record<string, TombstoneEntry> {
    const merged: Record<string, TombstoneEntry> = { ...localTombstones };
    for (const [id, remoteEntry] of Object.entries(remoteTombstones || {})) {
      const existing = merged[id];
      if (!existing || remoteEntry.deletedAt > existing.deletedAt) {
        merged[id] = remoteEntry;
      }
    }
    try {
      localStorage.setItem(TOMBSTONES_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }
    return merged;
  },

  /**
   * Deterministic merge by ID using updatedAt timestamp and canonicalJson tie-breaker,
   * while respecting tombstones and deletedStudentIds.
   */
  mergeById<T extends { id: string; updatedAt?: number | string }>(
    localList: T[],
    remoteList: T[],
    tombstones: Record<string, TombstoneEntry> = WLQSyncCore.getTombstones()
  ): T[] {
    const deletedStudentIds = new Set(WLQSyncCore.getDeletedStudentIds());
    const map = new Map<string, T>();

    const toMillis = (v?: number | string): number => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const parsed = Date.parse(v);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const upsert = (item: T) => {
      if (!item || !item.id) return;
      if (tombstones[item.id] || deletedStudentIds.has(item.id)) return;

      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
        return;
      }

      const existingTs = toMillis(existing.updatedAt);
      const candidateTs = toMillis(item.updatedAt);

      if (candidateTs > existingTs) {
        map.set(item.id, item);
      } else if (candidateTs === existingTs) {
        // Deterministic tie-breaker via canonicalJson
        const existingCanonical = canonicalJson(existing);
        const candidateCanonical = canonicalJson(item);
        if (candidateCanonical.localeCompare(existingCanonical) > 0) {
          map.set(item.id, item);
        }
      }
    };

    (localList || []).forEach(upsert);
    (remoteList || []).forEach(upsert);

    return Array.from(map.values());
  },

  /**
   * Sanitizes student roster for cloud supervisor sync (never leaks guardianPhone or guardianPin).
   */
  buildSafeSupervisorRoster<
    T extends {
      id: string;
      name: string;
      circle: string;
      level: string;
      accountStatus?: string;
    }
  >(students: T[], _circles?: unknown) {
    return (students || []).map((st) => ({
      id: st.id,
      name: st.name,
      circle: st.circle,
      level: st.level,
      accountStatus: st.accountStatus || 'نشط',
      syncedAt: new Date().toISOString(),
    }));
  },
};

// ============================================================================
// Android Instant Session Restore (ImamSessionRestore)
// ============================================================================

export interface ImamRestoredSessionState {
  activeTab: string;
  selectedStudentId: string | null;
  userRole?: string;
  guardianStudentId?: string | null;
  isLoggedIn?: boolean;
  scrollY?: number;
  savedAt?: number;
  updatedAt?: number;
  sessionDraft?: Record<string, unknown>;
}

const SESSION_RESTORE_KEY = 'wlq_imam_session_restore_v12';
let restoreDebounceTimer: number | null = null;

export const ImamSessionRestore = {
  saveSnapshot(state: ImamRestoredSessionState, immediate = false) {
    const writeNow = () => {
      const now = Date.now();
      const payload: ImamRestoredSessionState = {
        ...state,
        scrollY: typeof window !== 'undefined' ? window.scrollY || 0 : 0,
        savedAt: now,
        updatedAt: state.updatedAt || now,
      };
      const serialized = JSON.stringify(payload);
      try {
        sessionStorage.setItem(SESSION_RESTORE_KEY, serialized);
        localStorage.setItem(SESSION_RESTORE_KEY, serialized);
      } catch {
        // ignore storage errors
      }
    };

    if (immediate) {
      if (restoreDebounceTimer) window.clearTimeout(restoreDebounceTimer);
      writeNow();
      return;
    }

    if (restoreDebounceTimer) {
      window.clearTimeout(restoreDebounceTimer);
    }
    restoreDebounceTimer = window.setTimeout(writeNow, 150);
  },

  saveDebounced(state: ImamRestoredSessionState) {
    this.saveSnapshot(state, false);
  },

  saveImmediate(state: ImamRestoredSessionState) {
    this.saveSnapshot(state, true);
  },

  loadRecentSnapshot(maxAgeMinutes = 30): ImamRestoredSessionState | null {
    try {
      const raw =
        sessionStorage.getItem(SESSION_RESTORE_KEY) ||
        localStorage.getItem(SESSION_RESTORE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ImamRestoredSessionState;
      const savedTs = parsed.savedAt || parsed.updatedAt || 0;
      const ageMs = Date.now() - savedTs;
      const wasDiscarded = Boolean(
        typeof document !== 'undefined' &&
          (document as unknown as { wasDiscarded?: boolean }).wasDiscarded
      );
      if (wasDiscarded || ageMs <= maxAgeMinutes * 60 * 1000) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  load(maxAgeMinutes = 30): ImamRestoredSessionState | null {
    return this.loadRecentSnapshot(maxAgeMinutes);
  },

  clear() {
    if (restoreDebounceTimer) {
      window.clearTimeout(restoreDebounceTimer);
      restoreDebounceTimer = null;
    }
    try {
      sessionStorage.removeItem(SESSION_RESTORE_KEY);
      localStorage.removeItem(SESSION_RESTORE_KEY);
    } catch {
      // ignore storage errors
    }
  },
};

// ============================================================================
// Haptic Micro-interactions & Memory Pressure Relief
// ============================================================================

export function triggerHaptic(ms = 12): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch {
    // ignore unsupported environments
  }
}

export function releaseMemoryPressure(options?: {
  audioElement?: HTMLAudioElement | null;
  blobUrls?: string[];
  canvasElement?: HTMLCanvasElement | null;
}): void {
  try {
    if (options?.audioElement) {
      options.audioElement.pause();
      options.audioElement.removeAttribute('src');
      options.audioElement.load();
    }
    if (options?.blobUrls && Array.isArray(options.blobUrls)) {
      options.blobUrls.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    }
    if (options?.canvasElement) {
      const ctx = options.canvasElement.getContext('2d');
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          options.canvasElement.width,
          options.canvasElement.height
        );
      }
    }
  } catch {
    // safe no-op
  }
}

/**
 * Generates a deterministic verification hash code for Certificates & Ijazahs.
 */
export function generateVerificationHash(
  docId: string,
  studentName: string,
  issueDate: string
): string {
  const seed = `${docId}|${studentName}|${issueDate}|IMAM-V12`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `WLQ-V12-${hex}`;
}

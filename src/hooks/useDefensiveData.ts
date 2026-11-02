/**
 * useDefensiveData — Null-Safety & Defensive Coding Hook
 * أكاديمية الإمام لتحفيظ القرآن الكريم — بالقرآن نحيا
 * تصميم وتطوير: Sayed Mohamed Elkomy
 *
 * يوفر دوال مساعدة لحماية العمليات من القيم الفارغة والمصفوفات غير المعرَّفة
 * Zero Runtime Crash — Null-Safe Array Operations
 */

/**
 * تأمين المصفوفة: يُعيد مصفوفة فارغة إذا كانت القيمة غير صالحة
 */
export function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * تأمين النص: يُعيد نصاً فارغاً إذا كانت القيمة null أو undefined
 */
export function safeStr(value: string | null | undefined, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

/**
 * تأمين الرقم: يُعيد 0 أو القيمة الافتراضية إذا لم يكن الرقم صالحاً
 */
export function safeNum(value: number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || isNaN(value as number)) return fallback;
  return Number(value);
}

/**
 * تأمين الكائن: يُعيد كائناً فارغاً إذا كانت القيمة null أو undefined
 */
export function safeObj<T extends object>(value: T | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  return value;
}

/**
 * تنفيذ آمن لـ .map() على أي قيمة قد تكون غير مصفوفة
 */
export function safeMap<T, R>(
  value: T[] | null | undefined,
  callback: (item: T, index: number, arr: T[]) => R
): R[] {
  return safeArray(value).map(callback);
}

/**
 * تنفيذ آمن لـ .filter() على أي قيمة قد تكون غير مصفوفة
 */
export function safeFilter<T>(
  value: T[] | null | undefined,
  predicate: (item: T, index: number, arr: T[]) => boolean
): T[] {
  return safeArray(value).filter(predicate);
}

/**
 * تنفيذ آمن لـ .find() على أي قيمة قد تكون غير مصفوفة
 */
export function safeFind<T>(
  value: T[] | null | undefined,
  predicate: (item: T, index: number, arr: T[]) => boolean
): T | undefined {
  return safeArray(value).find(predicate);
}

/**
 * تنفيذ آمن لـ .reduce() على أي قيمة قد تكون غير مصفوفة
 */
export function safeReduce<T, R>(
  value: T[] | null | undefined,
  callback: (accumulator: R, currentValue: T, index: number, array: T[]) => R,
  initialValue: R
): R {
  return safeArray(value).reduce(callback, initialValue);
}

/**
 * تأمين استدعاء دالة: يُنفِّذ الدالة فقط إذا كانت دالة فعلية
 */
export function safeCall<T>(fn: ((...args: unknown[]) => T) | null | undefined, ...args: unknown[]): T | undefined {
  if (typeof fn === 'function') {
    return fn(...args) as T;
  }
  return undefined;
}

/**
 * Hook للاستخدام المباشر في المكونات
 */
export function useDefensiveData() {
  return {
    safeArray,
    safeStr,
    safeNum,
    safeObj,
    safeMap,
    safeFilter,
    safeFind,
    safeReduce,
    safeCall,
  };
}

export default useDefensiveData;

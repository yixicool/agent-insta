/**
 * 外部数据（localStorage、文件解析结果）先按 unknown 处理，
 * 经这里的类型守卫逐层收窄后才进入业务代码。
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

export function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

export function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return isString(value) && (allowed as readonly string[]).includes(value);
}

export function isNullOr<T>(
  value: unknown,
  guard: (item: unknown) => item is T,
): value is T | null {
  return value === null || guard(value);
}

/** 读取记录中的字段并按守卫校验，失败返回 undefined 而不抛错 */
export function readField<T>(
  record: Record<string, unknown>,
  key: string,
  guard: (value: unknown) => value is T,
): T | undefined {
  const value = record[key];
  return guard(value) ? value : undefined;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 严格校验 yyyy-mm-dd。
 * 不能只靠 Date.parse：引擎会把 2026-02-31 这类越界日期顺延到下个月，
 * 因此需要回读年月日三段确认没有发生顺延。
 */
export function isIsoDate(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  const match = ISO_DATE_PATTERN.exec(value);
  if (match === null) {
    return false;
  }
  const [, yearText, monthText, dayText] = match;
  if (yearText === undefined || monthText === undefined || dayText === undefined) {
    return false;
  }
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function isIsoTimestamp(value: unknown): value is string {
  return isString(value) && Number.isFinite(Date.parse(value));
}

/** 仅接受 http/https，阻断 javascript: 等危险协议 */
export function isHttpUrl(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isScoreInRange(value: unknown, min: number, max: number): value is number {
  return isFiniteNumber(value) && value >= min && value <= max;
}

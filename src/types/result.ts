/**
 * 全应用统一的成功/失败结果类型。
 * 领域函数与适配器一律返回 Result，不抛出异常，避免错误被静默吞掉。
 */

export type ErrorCode =
  | 'storage-unavailable'
  | 'quota-exceeded'
  | 'file-rejected'
  | 'decode-failed'
  | 'gateway-unavailable'
  | 'schema-mismatch'
  | 'invalid-transition'
  | 'missing-source'
  | 'invalid-input'
  | 'not-found';

export interface AppError {
  /** 机器可判别的错误分类 */
  readonly code: ErrorCode;
  /** 面向用户的说明：发生了什么 */
  readonly message: string;
  /** 面向用户的下一步建议 */
  readonly hint: string;
}

export type Result<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: AppError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T>(code: ErrorCode, message: string, hint: string): Result<T> {
  return { ok: false, error: { code, message, hint } };
}

/** 把未知的 catch 值转成可读文本，供错误上下文记录使用 */
export function describeUnknownError(caught: unknown): string {
  if (caught instanceof Error) {
    return caught.message;
  }
  if (typeof caught === 'string' && caught.length > 0) {
    return caught;
  }
  return '未知错误';
}

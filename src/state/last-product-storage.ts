import { isRecord, isString } from '../lib/guards';
import { LAST_PRODUCT_STORAGE_KEY, readJson, removeItem, writeJson } from '../lib/storage';
import type { Result } from '../types/result';

/**
 * 「上次浏览的机型」持久化。
 *
 * 单独一个存储键，不进 WorkspaceData：
 * 它是浏览偏好而非用户录入的业务数据，混进去会牵动 schema 版本与迁移，
 * 让已有的洞察、需求、验收记录承担不必要的失效风险。
 */

interface LastProductRecord {
  readonly productId: string;
}

/** 机型 id 与路由口径一致，只允许小写字母、数字与连字符 */
const PRODUCT_ID_PATTERN = /^[a-z0-9-]+$/;

function isLastProductRecord(value: unknown): value is LastProductRecord {
  return isRecord(value) && isString(value.productId) && PRODUCT_ID_PATTERN.test(value.productId);
}

/**
 * 读取上次浏览的机型 id。
 * 存储不可用、无记录或结构不符都返回 null，由调用方回落到推荐第一名。
 */
export function loadLastProductId(): string | null {
  const result: Result<LastProductRecord> = readJson(LAST_PRODUCT_STORAGE_KEY, isLastProductRecord);
  return result.ok ? result.data.productId : null;
}

/**
 * 记住本次打开的机型。
 * 写入失败不阻断导航，仅返回 Result 供调用方按需提示。
 */
export function saveLastProductId(productId: string): Result<void> {
  return writeJson(LAST_PRODUCT_STORAGE_KEY, { productId });
}

export function clearLastProductId(): Result<void> {
  return removeItem(LAST_PRODUCT_STORAGE_KEY);
}

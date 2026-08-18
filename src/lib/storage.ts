import { describeUnknownError, fail, ok, type Result } from '../types/result';

/**
 * localStorage 读写封装。
 * 浏览器可能完全禁用存储（无痕模式抛 SecurityError）或写满配额，
 * 两种情况都以 Result 失败返回，由上层降级为「仅本次会话有效」。
 */

export const WORKSPACE_STORAGE_KEY = 'agent-insta:workspace';
/** 上次浏览的机型，用于让导航里的产品工作区始终有一台可去的机型 */
export const LAST_PRODUCT_STORAGE_KEY = 'agent-insta:last-product';
/** 用户显式选择的主题；未选过时跟随系统 */
export const THEME_STORAGE_KEY = 'agent-insta:theme';

function resolveStorage(): Result<Storage> {
  try {
    const storage = globalThis.localStorage;
    if (storage === undefined || storage === null) {
      return fail(
        'storage-unavailable',
        '当前环境不支持本地存储。',
        '工作台数据仅在本次会话内有效。',
      );
    }
    return ok(storage);
  } catch (caught: unknown) {
    return fail(
      'storage-unavailable',
      `无法访问本地存储：${describeUnknownError(caught)}`,
      '可能处于无痕模式或浏览器禁用了存储，工作台数据仅在本次会话内有效。',
    );
  }
}

/**
 * 读取并按守卫校验。数据缺失或结构不符时返回失败，由上层决定是否回退到初始值。
 *
 * migrate 在守卫之前运行，用于把旧版本结构升到当前版本；
 * 返回的是迁移后的值，因此调用方拿到的始终是当前版本结构。
 */
export function readJson<T>(
  key: string,
  guard: (value: unknown) => value is T,
  migrate?: (value: unknown) => unknown,
): Result<T> {
  const storage = resolveStorage();
  if (!storage.ok) {
    return storage;
  }

  let raw: string | null;
  try {
    raw = storage.data.getItem(key);
  } catch (caught: unknown) {
    return fail(
      'storage-unavailable',
      `读取本地存储失败：${describeUnknownError(caught)}`,
      '工作台将以空数据启动，本次会话的改动不会被保存。',
    );
  }

  if (raw === null) {
    return fail('not-found', '本地没有已保存的工作台数据。', '开始录入洞察或需求后会自动保存。');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (caught: unknown) {
    return fail(
      'schema-mismatch',
      `本地数据不是合法 JSON：${describeUnknownError(caught)}`,
      '已忽略损坏的数据，工作台以空数据启动。',
    );
  }

  const migrated = migrate === undefined ? parsed : migrate(parsed);

  if (!guard(migrated)) {
    return fail(
      'schema-mismatch',
      '本地数据结构与当前版本不匹配。',
      '已忽略旧版本数据，工作台以空数据启动。可在导出功能中备份后重新录入。',
    );
  }

  return ok(migrated);
}

export function writeJson(key: string, value: unknown): Result<void> {
  const storage = resolveStorage();
  if (!storage.ok) {
    return storage;
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch (caught: unknown) {
    return fail(
      'schema-mismatch',
      `数据无法序列化：${describeUnknownError(caught)}`,
      '本次改动未保存，请检查是否包含无法存储的内容（例如原始文件对象）。',
    );
  }

  try {
    storage.data.setItem(key, serialized);
    return ok(undefined);
  } catch (caught: unknown) {
    if (isQuotaError(caught)) {
      return fail(
        'quota-exceeded',
        '本地存储空间不足，最新改动未能保存。',
        '可以导出数据备份后清空工作台，或删除不再需要的素材记录。',
      );
    }
    return fail(
      'storage-unavailable',
      `写入本地存储失败：${describeUnknownError(caught)}`,
      '改动仅在本次会话内有效，关闭页面后会丢失。',
    );
  }
}

export function removeItem(key: string): Result<void> {
  const storage = resolveStorage();
  if (!storage.ok) {
    return storage;
  }
  try {
    storage.data.removeItem(key);
    return ok(undefined);
  } catch (caught: unknown) {
    return fail(
      'storage-unavailable',
      `清除本地存储失败：${describeUnknownError(caught)}`,
      '请手动清理浏览器站点数据。',
    );
  }
}

function isQuotaError(caught: unknown): boolean {
  if (!(caught instanceof Error)) {
    return false;
  }
  return caught.name === 'QuotaExceededError' || caught.name === 'NS_ERROR_DOM_QUOTA_REACHED';
}

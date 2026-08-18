import { afterEach, describe, expect, it, vi } from 'vitest';
import { isRecord, isString } from './guards';
import { readJson, removeItem, writeJson } from './storage';

interface Payload {
  readonly name: string;
}

function isPayload(value: unknown): value is Payload {
  return isRecord(value) && isString(value.name);
}

const KEY = 'test:payload';

/**
 * jsdom 的 localStorage 是 Proxy，spyOn 无法拦截其方法，
 * 因此用可控的假实现整体替换全局对象来模拟各类失败。
 */
function stubFailingStorage(
  failing: Partial<Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>>,
): void {
  const base: Storage = {
    length: 0,
    clear: () => undefined,
    getItem: () => null,
    key: () => null,
    removeItem: () => undefined,
    setItem: () => undefined,
  };
  vi.stubGlobal('localStorage', { ...base, ...failing });
}

function throwWith(name: string, message: string): () => never {
  return () => {
    const error = new Error(message);
    error.name = name;
    throw error;
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('readJson', () => {
  it('returns parsed data when the guard passes', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ name: 'Osmo Action 6' }));
    const result = readJson(KEY, isPayload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Osmo Action 6');
    }
  });

  it('reports not-found when nothing is stored', () => {
    const result = readJson(KEY, isPayload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('not-found');
    }
  });

  it('reports schema-mismatch for corrupted JSON', () => {
    window.localStorage.setItem(KEY, '{not json');
    const result = readJson(KEY, isPayload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('schema-mismatch');
      expect(result.error.hint).not.toBe('');
    }
  });

  it('reports schema-mismatch when the shape does not match', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ name: 42 }));
    const result = readJson(KEY, isPayload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('schema-mismatch');
    }
  });

  it('surfaces storage-unavailable when getItem throws', () => {
    stubFailingStorage({ getItem: throwWith('SecurityError', 'blocked') });
    const result = readJson(KEY, isPayload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('storage-unavailable');
    }
  });
});

describe('writeJson', () => {
  it('persists serializable values', () => {
    const result = writeJson(KEY, { name: 'X5' });
    expect(result.ok).toBe(true);
    expect(window.localStorage.getItem(KEY)).toBe('{"name":"X5"}');
  });

  it('maps QuotaExceededError to quota-exceeded with actionable hint', () => {
    stubFailingStorage({ setItem: throwWith('QuotaExceededError', 'full') });
    const result = writeJson(KEY, { name: 'X5' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('quota-exceeded');
      expect(result.error.hint).toContain('导出');
    }
  });

  it('maps other write failures to storage-unavailable', () => {
    stubFailingStorage({ setItem: throwWith('SecurityError', 'denied') });
    const result = writeJson(KEY, { name: 'X5' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('storage-unavailable');
    }
  });

  it('reports schema-mismatch for circular structures', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const result = writeJson(KEY, circular);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('schema-mismatch');
    }
  });
});

describe('removeItem', () => {
  it('clears the stored key', () => {
    window.localStorage.setItem(KEY, '{"name":"X5"}');
    expect(removeItem(KEY).ok).toBe(true);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('reports failure when removal throws', () => {
    stubFailingStorage({ removeItem: throwWith('SecurityError', 'denied') });
    const result = removeItem(KEY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('storage-unavailable');
    }
  });
});

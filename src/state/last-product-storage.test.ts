import { afterEach, describe, expect, it } from 'vitest';
import { clearLastProductId, loadLastProductId, saveLastProductId } from './last-product-storage';
import { LAST_PRODUCT_STORAGE_KEY } from '../lib/storage';

afterEach(() => {
  window.localStorage.clear();
});

describe('last-product-storage', () => {
  it('写入后能读回同一台机型', () => {
    expect(saveLastProductId('insta360-x5').ok).toBe(true);
    expect(loadLastProductId()).toBe('insta360-x5');
  });

  it('没有记录时返回 null', () => {
    expect(loadLastProductId()).toBeNull();
  });

  it('清除后不再返回旧机型', () => {
    saveLastProductId('insta360-x5');
    expect(clearLastProductId().ok).toBe(true);
    expect(loadLastProductId()).toBeNull();
  });

  it('损坏的 JSON 按无记录处理', () => {
    window.localStorage.setItem(LAST_PRODUCT_STORAGE_KEY, '{ not json');
    expect(loadLastProductId()).toBeNull();
  });

  it('结构不符的记录被拒绝', () => {
    window.localStorage.setItem(LAST_PRODUCT_STORAGE_KEY, JSON.stringify({ productId: 42 }));
    expect(loadLastProductId()).toBeNull();
  });

  it('机型 id 含非法字符时被拒绝，避免污染 hash 地址', () => {
    window.localStorage.setItem(
      LAST_PRODUCT_STORAGE_KEY,
      JSON.stringify({ productId: '../secret' }),
    );
    expect(loadLastProductId()).toBeNull();
  });
});

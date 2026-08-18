import { afterEach, describe, expect, it } from 'vitest';
import { loadStoredTheme, resolveInitialTheme } from './use-theme';
import { THEME_STORAGE_KEY } from '../lib/storage';

afterEach(() => {
  window.localStorage.clear();
});

describe('use-theme', () => {
  it('读回用户显式选择的主题', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ theme: 'light' }));
    expect(loadStoredTheme()).toBe('light');
    expect(resolveInitialTheme()).toBe('light');
  });

  it('没有选择记录时不返回主题', () => {
    expect(loadStoredTheme()).toBeNull();
  });

  it('不认识的主题值被拒绝，回落到系统偏好', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ theme: 'sepia' }));
    expect(loadStoredTheme()).toBeNull();
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('损坏的存储内容按未选择处理', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'not-json');
    expect(loadStoredTheme()).toBeNull();
  });
});

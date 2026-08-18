import { useCallback, useEffect, useState } from 'react';
import { isOneOf, isRecord } from '../lib/guards';
import { THEME_STORAGE_KEY, readJson, writeJson } from '../lib/storage';

/**
 * 主题。默认跟随系统的 prefers-color-scheme，
 * 用户显式切换后写入 localStorage 并覆盖系统偏好。
 *
 * 主题通过 <html data-theme> 传给 CSS，令牌在 index.css 里按该属性切换，
 * 因此所有已使用 var(--color-*) 的组件与图表都会自动跟随，无需逐个改配色。
 */

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const DEFAULT_THEME: Theme = 'dark';

interface ThemeRecord {
  readonly theme: Theme;
}

function isThemeRecord(value: unknown): value is ThemeRecord {
  return isRecord(value) && isOneOf(value.theme, THEMES);
}

/** 读取用户显式选择的主题；未选过或存储不可用时返回 null */
export function loadStoredTheme(): Theme | null {
  const result = readJson(THEME_STORAGE_KEY, isThemeRecord);
  return result.ok ? result.data.theme : null;
}

/** 系统偏好。matchMedia 在部分测试环境缺失，缺失时按深色处理 */
function readSystemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return DEFAULT_THEME;
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function resolveInitialTheme(): Theme {
  return loadStoredTheme() ?? readSystemTheme();
}

export interface ThemeControl {
  readonly theme: Theme;
  readonly toggleTheme: () => void;
}

export function useTheme(): ThemeControl {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  // 主题只能落在 <html> 上，Tailwind 令牌与 color-scheme 都依赖它
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      // 写入失败只影响下次打开是否记住，不阻断本次切换
      writeJson(THEME_STORAGE_KEY, { theme: next });
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}

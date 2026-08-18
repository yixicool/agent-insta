import type { ReactNode } from 'react';
import type { Theme } from '../state/use-theme';

/**
 * 主题切换。图标只作装饰，可访问名称由文字承担，
 * 因此读屏器听到的是「切换到浅色主题」这类明确动作而不是一个图标名。
 */

export interface ThemeToggleProps {
  readonly theme: Theme;
  readonly onToggle: () => void;
}

function SunIcon(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="4" strokeWidth="1.75" />
      <path
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M18.4 5.6l-1.1 1.1M6.7 17.3l-1.1 1.1"
      />
    </svg>
  );
}

function MoonIcon(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M20.5 13.3A8.5 8.5 0 1 1 10.7 3.5a6.6 6.6 0 0 0 9.8 9.8Z"
      />
    </svg>
  );
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps): ReactNode {
  const nextLabel = theme === 'dark' ? '切换到浅色主题' : '切换到深色主题';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={nextLabel}
      title={nextLabel}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-line-subtle)] text-[var(--color-ink-body)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-strong)]"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

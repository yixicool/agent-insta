import type { ReactNode } from 'react';
import type { AppError } from '../types/result';

/** 加载中占位。用文字而非纯动画，读屏器也能理解当前状态。 */
export function LoadingBlock({ label }: { readonly label: string }): ReactNode {
  return (
    <div
      className="panel flex items-center gap-3 p-6 text-sm text-[var(--color-ink-muted)]"
      role="status"
      aria-live="polite"
    >
      <span
        className="size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--color-line-strong)] border-t-[var(--color-accent)]"
        aria-hidden="true"
      />
      正在加载{label}…
    </div>
  );
}

export interface ErrorNoticeProps {
  readonly error: AppError;
  readonly onRetry?: () => void;
}

/** 失败态。同时展示原因与下一步建议，不静默吞掉错误。 */
export function ErrorNotice({ error, onRetry }: ErrorNoticeProps): ReactNode {
  return (
    <div className="panel border-[var(--color-critical)] p-5" role="alert">
      <h3 className="text-sm font-semibold text-[var(--color-critical)]">{error.message}</h3>
      <p className="mt-1.5 text-sm text-[var(--color-ink-body)]">{error.hint}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">错误代码：{error.code}</p>
      {onRetry !== undefined && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--color-ink-inverse)] hover:bg-[var(--color-accent-strong)]"
        >
          重试
        </button>
      )}
    </div>
  );
}

export interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}

/** 空状态。明确说明为什么是空的以及下一步做什么，而不是留白。 */
export function EmptyState({ title, description, action }: EmptyStateProps): ReactNode {
  return (
    <div className="panel border-dashed p-8 text-center sm:p-10">
      <h3 className="text-base font-semibold text-[var(--color-ink-strong)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        {description}
      </p>
      {action !== undefined && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export type BannerTone = 'info' | 'caution' | 'critical' | 'positive';

const TONE_CLASSES: Readonly<Record<BannerTone, string>> = {
  info: 'border-[var(--color-info)] text-[var(--color-info)]',
  caution: 'border-[var(--color-caution)] text-[var(--color-caution)]',
  critical: 'border-[var(--color-critical)] text-[var(--color-critical)]',
  positive: 'border-[var(--color-positive)] text-[var(--color-positive)]',
};

export interface BannerProps {
  readonly tone: BannerTone;
  readonly children: ReactNode;
  readonly onDismiss?: () => void;
  readonly dismissLabel?: string;
}

export function Banner({
  tone,
  children,
  onDismiss,
  dismissLabel = '关闭提示',
}: BannerProps): ReactNode {
  return (
    <div
      className={`flex items-start gap-3 rounded-[var(--radius-panel)] border bg-[var(--color-surface-raised)] px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}
    >
      <div className="flex-1 text-[var(--color-ink-body)]">{children}</div>
      {onDismiss !== undefined && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="shrink-0 rounded px-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink-strong)]"
        >
          ✕
        </button>
      )}
    </div>
  );
}

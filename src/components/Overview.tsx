import type { ReactNode } from 'react';

/**
 * 页面顶部的大字概览。
 * 让用户在不滚动、不读小字的情况下先拿到最重要的几个结论。
 */

export type StatTone = 'neutral' | 'positive' | 'caution' | 'critical';

const TONE_CLASSES: Readonly<Record<StatTone, string>> = {
  neutral: 'text-[var(--color-ink-strong)]',
  positive: 'text-[var(--color-positive)]',
  caution: 'text-[var(--color-caution)]',
  critical: 'text-[var(--color-critical)]',
};

export interface OverviewStat {
  readonly label: string;
  readonly value: string;
  /** 数值下方的补充说明，例如「同类中最大」 */
  readonly hint?: string;
  readonly tone?: StatTone;
}

export interface OverviewStatsProps {
  readonly items: readonly OverviewStat[];
  /** 一句话结论，放在数字下方 */
  readonly summary?: string;
  readonly action?: ReactNode;
}

export function OverviewStats({ items, summary, action }: OverviewStatsProps): ReactNode {
  return (
    <section className="panel p-4 sm:p-6" aria-label="本页概览">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs text-[var(--color-ink-muted)]">{item.label}</dt>
            <dd
              className={`numeric mt-1 text-2xl leading-tight font-semibold sm:text-3xl ${TONE_CLASSES[item.tone ?? 'neutral']}`}
            >
              {item.value}
            </dd>
            {item.hint !== undefined && (
              <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{item.hint}</p>
            )}
          </div>
        ))}
      </dl>
      {(summary !== undefined || action !== undefined) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line-subtle)] pt-3">
          {summary !== undefined && (
            <p className="max-w-prose text-sm text-[var(--color-ink-body)]">{summary}</p>
          )}
          {action !== undefined && <div className="flex flex-wrap gap-2">{action}</div>}
        </div>
      )}
    </section>
  );
}

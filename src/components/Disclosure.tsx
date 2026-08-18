import type { ReactNode } from 'react';

/**
 * 统一的折叠容器。
 *
 * 用原生 <details>/<summary> 而不是自己管状态：天然支持键盘 Enter/Space，
 * 读屏器会正确播报展开状态，也不需要额外的 aria-expanded 维护。
 */

export interface DisclosureProps {
  /** 折叠标题，例如「查看全部参数」 */
  readonly summary: string;
  /** 展开后的条目数，显示为「（9）」让用户预期里面有多少内容 */
  readonly count?: number;
  readonly defaultOpen?: boolean;
  readonly children: ReactNode;
}

export function Disclosure({
  summary,
  count,
  defaultOpen = false,
  children,
}: DisclosureProps): ReactNode {
  return (
    <details open={defaultOpen} className="group">
      <summary className="cursor-pointer list-none text-xs text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink-strong)]">
        <span className="inline-flex items-center gap-1">
          <span
            aria-hidden="true"
            className="inline-block transition-transform group-open:rotate-90"
          >
            ▸
          </span>
          {summary}
          {count !== undefined && <span className="numeric">（{count}）</span>}
        </span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

/**
 * 折叠的分区容器，用于「深入分析」这类默认收起的整块内容。
 * 标题比 Disclosure 更醒目，并支持一句话说明里面是什么。
 */
export interface CollapsibleSectionProps {
  readonly title: string;
  readonly description: string;
  readonly defaultOpen?: boolean;
  readonly children: ReactNode;
}

export function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps): ReactNode {
  return (
    <details open={defaultOpen} className="panel group p-4 sm:p-6">
      <summary className="cursor-pointer list-none">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-base font-semibold text-[var(--color-ink-strong)]">
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-open:rotate-90"
            >
              ▸
            </span>
            {title}
          </span>
          <span className="text-xs text-[var(--color-ink-muted)]">{description}</span>
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

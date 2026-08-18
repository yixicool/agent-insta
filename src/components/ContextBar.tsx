import type { ReactNode } from 'react';
import { DECISION_STAGE_LABELS, type DecisionStage } from '../types/decision';
import { buildHash, type Route } from '../state/use-hash-route';

/**
 * 当前机型的上下文条。
 *
 * 主导航已经回答「我能去哪」，这里只回答「我现在带着哪台机型」：
 * 机型名、我把它放在选购流程的哪一档、围绕它记了多少条反馈。
 * 不重复主导航的链接，也不放「换一台」——那属于产品页自身的操作。
 */

export interface ContextBarProps {
  readonly productId: string;
  /** 机型展示名。机型库仍在加载时为 null，此时退化为显示 id */
  readonly productName: string | null;
  /** 用户给这台机型标的选购阶段；还没记过为 null */
  readonly stage: DecisionStage | null;
  readonly feedbackCount: number;
  /** 当前是否已经停在该机型的详情页，是则不再显示回详情页的链接 */
  readonly isOnProductPage: boolean;
  readonly onNavigate: (route: Route) => void;
}

export function ContextBar({
  productId,
  productName,
  stage,
  feedbackCount,
  isOnProductPage,
  onNavigate,
}: ContextBarProps): ReactNode {
  const target: Route = { id: 'product', productId };

  return (
    <section
      aria-label="当前机型"
      className="panel flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-xs"
    >
      <span className="text-[var(--color-ink-muted)]">当前机型</span>
      <span className="font-medium text-[var(--color-ink-strong)]">{productName ?? productId}</span>
      <span aria-hidden="true" className="text-[var(--color-line-strong)]">
        ·
      </span>
      <span className="text-[var(--color-ink-body)]">
        {stage === null ? '还没记进选购清单' : DECISION_STAGE_LABELS[stage]}
      </span>
      <span className="text-[var(--color-ink-body)]">
        <span className="numeric">{feedbackCount}</span> 条我的反馈
      </span>
      {!isOnProductPage && (
        <a
          href={buildHash(target)}
          onClick={(event) => {
            event.preventDefault();
            onNavigate(target);
          }}
          className="ml-auto rounded-[var(--radius-pill)] border border-[var(--color-line-strong)] px-2.5 py-1 text-[var(--color-ink-body)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink-strong)]"
        >
          回到它的详情页
        </a>
      )}
    </section>
  );
}

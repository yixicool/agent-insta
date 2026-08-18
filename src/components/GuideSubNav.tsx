import type { ReactNode } from 'react';
import { buildHash, type Route, type RouteId } from '../state/use-hash-route';

/**
 * 购机指南内部的顺序子步骤：选型对比 → 产品详情 → 性能监控。
 *
 * 这三步确实是一条流程（先挑、再看参数、再看表现），所以保留
 * <ol> + aria-current="step" 与序号、箭头分隔符。但它不是全站主导航——
 * 主导航（FlowBar）已经用一个「购机指南」标签覆盖了这三个路由，
 * 这里只用 <section aria-label> 承载子步骤，避免出现第二处
 * role="navigation"，保持「全站只有一处主导航」的不变式。
 */

interface SubStep {
  readonly route: RouteId;
  readonly ordinal: string;
  readonly label: string;
}

const STEPS: readonly SubStep[] = [
  { route: 'picker', ordinal: '①', label: '选型对比' },
  { route: 'product', ordinal: '②', label: '产品详情' },
  { route: 'monitor', ordinal: '③', label: '性能监控' },
];

/** 需要机型段的步骤 */
const PRODUCT_SCOPED: readonly RouteId[] = ['product', 'monitor'];

export interface GuideSubNavProps {
  readonly current: Route;
  readonly onNavigate: (route: Route) => void;
  /** 带机型段的步骤要落到的机型；机型库为空时为 null */
  readonly activeProductId: string | null;
  /**
   * activeProductId 是否为默认机型（而非用户本次显式选定）。
   * 为 true 时相应步骤标注「默认」，让用户知道点进去看到的不是自己刚选的那台。
   */
  readonly isDefaultProduct: boolean;
}

/** 带机型段的步骤没有可用机型时退回选型对比页，绝不产生死链 */
function resolveTarget(step: SubStep, activeProductId: string | null): Route {
  if (!PRODUCT_SCOPED.includes(step.route)) {
    return { id: step.route, productId: null };
  }
  return activeProductId === null
    ? { id: 'picker', productId: null }
    : { id: step.route, productId: activeProductId };
}

export function GuideSubNav({
  current,
  onNavigate,
  activeProductId,
  isDefaultProduct,
}: GuideSubNavProps): ReactNode {
  return (
    <section aria-label="购机指南进度" className="panel px-3 py-2">
      <ol className="flex items-center gap-0.5 overflow-x-auto text-sm">
        {STEPS.map((step, index) => {
          const isCurrent = step.route === current.id;
          const target = resolveTarget(step, activeProductId);
          const showDefaultHint = PRODUCT_SCOPED.includes(step.route) && isDefaultProduct;

          return (
            <li key={step.route} className="flex shrink-0 items-center gap-0.5">
              <a
                href={buildHash(target)}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(target);
                }}
                className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1.5 transition-colors sm:px-2.5 ${
                  isCurrent
                    ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-ink-strong)]'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-inset)] hover:text-[var(--color-ink-strong)]'
                }`}
              >
                <span aria-hidden="true" className="text-xs">
                  {step.ordinal}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
                {showDefaultHint && (
                  <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface-inset)] px-1.5 py-0.5 text-[11px] font-normal text-[var(--color-ink-muted)]">
                    默认
                  </span>
                )}
                {isCurrent && <span className="sr-only">（当前步骤）</span>}
              </a>
              {index < STEPS.length - 1 && (
                <span aria-hidden="true" className="text-[var(--color-line-strong)]">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

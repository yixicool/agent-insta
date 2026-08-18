import type { ReactNode } from 'react';
import { buildHash, type Route, type RouteId } from '../state/use-hash-route';

/**
 * 主导航。三大板块彼此并列（首页 / 购机指南 / 选购笔记），
 * 因此用 <ul> + aria-current="page" 表达平级关系，而不是顺序步骤。
 *
 * 这是站点唯一的主导航：导航必须始终回答「我能去哪」，
 * 所以每一项都是真链接。购机指南内部的顺序子步骤见 GuideSubNav。
 */

interface TopLevelTab {
  readonly label: string;
  readonly target: Route;
  /** 该标签覆盖的路由集合，用于高亮判断 */
  readonly matches: readonly RouteId[];
}

const TABS: readonly TopLevelTab[] = [
  { label: '首页', target: { id: 'home', productId: null }, matches: ['home'] },
  {
    label: '购机指南',
    target: { id: 'picker', productId: null },
    matches: ['picker', 'product', 'monitor'],
  },
  { label: '选购笔记', target: { id: 'my', productId: null }, matches: ['my'] },
];

export interface FlowBarProps {
  readonly current: Route;
  readonly onNavigate: (route: Route) => void;
}

export function FlowBar({ current, onNavigate }: FlowBarProps): ReactNode {
  return (
    <nav aria-label="主导航" className="min-w-0 flex-1">
      <ul className="flex items-center gap-0.5 overflow-x-auto text-sm">
        {TABS.map((tab) => {
          const isCurrent = tab.matches.includes(current.id);

          return (
            <li key={tab.label} className="shrink-0">
              <a
                href={buildHash(tab.target)}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={(event) => {
                  // 用受控导航保证状态与地址同步，同时保留可复制的真实链接
                  event.preventDefault();
                  onNavigate(tab.target);
                }}
                className={`inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-1.5 transition-colors sm:px-3 ${
                  isCurrent
                    ? 'bg-[var(--color-accent-soft)] font-semibold text-[var(--color-ink-strong)]'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-inset)] hover:text-[var(--color-ink-strong)]'
                }`}
              >
                <span className="whitespace-nowrap">{tab.label}</span>
                {isCurrent && <span className="sr-only">（当前板块）</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

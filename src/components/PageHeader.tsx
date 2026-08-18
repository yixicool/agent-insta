import type { ReactNode } from 'react';

export interface PageHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
  readonly meta?: ReactNode;
}

export function PageHeader({ title, description, actions, meta }: PageHeaderProps): ReactNode {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold text-[var(--color-ink-strong)] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1.5 max-w-prose text-sm text-[var(--color-ink-muted)]">{description}</p>
        {meta !== undefined && <div className="mt-1.5">{meta}</div>}
      </div>
      {actions !== undefined && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export interface SectionProps {
  readonly title: string;
  readonly description?: string;
  readonly badge?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

/** 视图内的分区容器，统一标题层级为 h3 */
export function Section({ title, description, badge, actions, children }: SectionProps): ReactNode {
  return (
    <section className="panel p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-[var(--color-ink-strong)]">
            {title}
            {badge}
          </h3>
          {description !== undefined && (
            <p className="mt-1 max-w-prose text-xs text-[var(--color-ink-muted)]">{description}</p>
          )}
        </div>
        {actions !== undefined && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** 竞品卡片使用的自绘形态示意图，不引用任何第三方图片素材 */
export function FormFactorGlyph({ formFactor }: { readonly formFactor: string }): ReactNode {
  const shapes: Readonly<Record<string, ReactNode>> = {
    'action-cube': <rect x="10" y="10" width="28" height="24" rx="4" />,
    'action-360': (
      <>
        <rect x="18" y="6" width="12" height="32" rx="5" />
        <circle cx="24" cy="13" r="2.5" fill="var(--color-surface-base)" />
        <circle cx="24" cy="31" r="2.5" fill="var(--color-surface-base)" />
      </>
    ),
    'pocket-gimbal': (
      <>
        <rect x="19" y="16" width="10" height="22" rx="3" />
        <circle cx="24" cy="11" r="6" />
      </>
    ),
    'modular-mini': (
      <>
        <rect x="16" y="14" width="16" height="16" rx="4" />
        <rect x="19" y="31" width="10" height="4" rx="2" opacity="0.5" />
      </>
    ),
    'compact-cinema': (
      <>
        <rect x="8" y="14" width="24" height="20" rx="3" />
        <circle cx="34" cy="24" r="7" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 48 48" className="size-12 shrink-0" role="img" aria-label="产品形态示意图">
      <g fill="var(--color-line-strong)">{shapes[formFactor] ?? shapes['action-cube']}</g>
    </svg>
  );
}

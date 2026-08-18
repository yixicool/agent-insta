import type { ReactNode } from 'react';
import { SOURCE_KIND_LABELS, type SourceKind } from '../types/provenance';

/**
 * 来源类型徽标。颜色 + 文字双重编码，
 * 不单靠颜色传达可信层级，满足无障碍要求。
 */

const KIND_CLASSES: Readonly<Record<SourceKind, string>> = {
  official: 'border-[var(--color-source-official)] text-[var(--color-source-official)]',
  'press-release': 'border-[var(--color-source-press)] text-[var(--color-source-press)]',
  review: 'border-[var(--color-source-review)] text-[var(--color-source-review)]',
  community: 'border-[var(--color-source-community)] text-[var(--color-source-community)]',
  retailer: 'border-[var(--color-source-retailer)] text-[var(--color-source-retailer)]',
};

export interface SourceBadgeProps {
  readonly kind: SourceKind;
}

export function SourceBadge({ kind }: SourceBadgeProps): ReactNode {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[11px] leading-none font-medium ${KIND_CLASSES[kind]}`}
    >
      {SOURCE_KIND_LABELS[kind]}
    </span>
  );
}

/** 本地数据标识，与外部真实数据在 UI 上明确区分 */
export function LocalDataBadge(): ReactNode {
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-dashed border-[var(--color-line-strong)] px-1.5 py-0.5 text-[11px] leading-none font-medium text-[var(--color-ink-muted)]">
      本地数据
    </span>
  );
}

/** 编者内部判断，与可核对的外部事实区分开 */
export function InternalAnalysisBadge(): ReactNode {
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-dashed border-[var(--color-accent)] px-1.5 py-0.5 text-[11px] leading-none font-medium text-[var(--color-accent)]">
      内部分析
    </span>
  );
}

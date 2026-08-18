import type { ReactNode } from 'react';
import { formatIsoDate } from '../lib/format';
import type { SourceRef } from '../types/provenance';
import { SourceBadge } from './SourceBadge';

/** 单条来源链接，附类型徽标与采集日期 */
export function SourceLink({ source }: { readonly source: SourceRef }): ReactNode {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      <SourceBadge kind={source.kind} />
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-[var(--color-accent)] underline decoration-dotted underline-offset-2 hover:decoration-solid"
      >
        {source.publisher}
        <span className="sr-only">（在新窗口打开）</span>
      </a>
      <span className="text-[var(--color-ink-muted)]">
        采集于 {formatIsoDate(source.retrievedAt)}
      </span>
    </span>
  );
}

export interface SourceListProps {
  readonly sources: readonly SourceRef[];
  readonly note?: string | undefined;
  /** 无障碍标签，说明这组来源属于哪个字段 */
  readonly label?: string | undefined;
}

export function SourceList({ sources, note, label }: SourceListProps): ReactNode {
  if (sources.length === 0 && (note ?? '') === '') {
    return null;
  }
  return (
    <div className="mt-1 space-y-1 text-xs">
      {sources.length > 0 && (
        <ul aria-label={label ?? '数据来源'} className="flex flex-wrap gap-x-3 gap-y-1">
          {sources.map((source) => (
            <li key={`${source.url}-${source.title}`} title={source.title}>
              <SourceLink source={source} />
            </li>
          ))}
        </ul>
      )}
      {note !== undefined && note !== '' && (
        <p className="text-[var(--color-ink-muted)] italic">说明：{note}</p>
      )}
    </div>
  );
}

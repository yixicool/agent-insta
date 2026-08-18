import type { ReactNode } from 'react';
import type { TermWording } from '../lib/wording';

/**
 * 术语注解。页面上显示大白话说法，
 * 原始专业术语与计算口径通过 <abbr> 的 title 与屏幕阅读器文本保留，
 * 这样非专业读者不被术语挡住，专业读者也不丢失信息。
 */

export interface TermProps {
  readonly wording: TermWording;
  /** 是否在标签后显示可见的术语提示符 */
  readonly showMarker?: boolean;
}

export function Term({ wording, showMarker = true }: TermProps): ReactNode {
  const explanation = `技术指标：${wording.technical}。${wording.explain}`;
  return (
    <abbr
      title={explanation}
      className="no-underline"
      // 用 decoration 而非默认下划线，避免在密集表格里显得杂乱
      style={{ textDecoration: 'none' }}
    >
      {wording.plain}
      {showMarker && (
        <span aria-hidden="true" className="ml-0.5 text-[10px] text-[var(--color-ink-muted)]">
          ⓘ
        </span>
      )}
      <span className="sr-only">（{explanation}）</span>
    </abbr>
  );
}

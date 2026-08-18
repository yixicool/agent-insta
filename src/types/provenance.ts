/**
 * 数据溯源类型。项目要求所有外部数据都能追到原始出处，
 * 因此规格、价格、趋势、人群痛点等字段一律用 Sourced<T> 包装。
 */

export type SourceKind =
  /** 品牌官网产品页、规格页、技术白皮书 */
  | 'official'
  /** 官方新闻稿、投资者关系公告 */
  | 'press-release'
  /** 第三方专业评测媒体 */
  | 'review'
  /** 社区讨论、用户反馈 */
  | 'community'
  /** 零售渠道报价 */
  | 'retailer';

export const SOURCE_KIND_LABELS: Readonly<Record<SourceKind, string>> = {
  official: '官方',
  'press-release': '官方新闻稿',
  review: '专业评测',
  community: '社区讨论',
  retailer: '零售渠道',
};

/** 规格与价格必须来自这两类来源之一 */
export const AUTHORITATIVE_SOURCE_KINDS: readonly SourceKind[] = ['official', 'press-release'];

export interface SourceRef {
  readonly kind: SourceKind;
  /** 发布方，例如 'GoPro 官方' / 'DPReview' / 'Reddit r/gopro' */
  readonly publisher: string;
  readonly title: string;
  readonly url: string;
  /** 采集日期，ISO yyyy-mm-dd */
  readonly retrievedAt: string;
}

export interface Sourced<T> {
  readonly value: T;
  readonly sources: readonly SourceRef[];
  /** 来源冲突、口径差异或补充说明 */
  readonly note?: string;
}

/** 字段值确实查不到时使用，避免猜测填值 */
export const UNDISCLOSED = '未公开' as const;
export type Undisclosed = typeof UNDISCLOSED;

export function sourced<T>(value: T, sources: readonly SourceRef[], note?: string): Sourced<T> {
  return note === undefined ? { value, sources } : { value, sources, note };
}

export function isUndisclosed(value: unknown): value is Undisclosed {
  return value === UNDISCLOSED;
}

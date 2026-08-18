import type { CapabilityDimension } from './competitor';

/**
 * 用户自己录入的使用反馈，属本地数据。
 * 与来自社区讨论的真实反馈并列展示，但徽标上明确区分。
 */

export type FeedbackKind = 'problem' | 'praise';

export const FEEDBACK_KIND_LABELS: Readonly<Record<FeedbackKind, string>> = {
  problem: '遇到问题',
  praise: '表现不错',
};

export interface FeedbackEntry {
  readonly id: string;
  readonly productId: string;
  readonly kind: FeedbackKind;
  /** 出现这个情况的场景，例如「夜骑」 */
  readonly sceneLabel: string;
  readonly summary: string;
  /** 归因到哪个能力维度，用于并入根因分析 */
  readonly dimension: CapabilityDimension;
  /** 严重或满意程度 1-5 */
  readonly severity: number;
  readonly createdAt: string;
}

export interface FeedbackInput {
  readonly productId: string;
  readonly kind: FeedbackKind;
  readonly sceneLabel: string;
  readonly summary: string;
  readonly dimension: CapabilityDimension;
  readonly severity: number;
}

export const SEVERITY_MIN = 1;
export const SEVERITY_MAX = 5;

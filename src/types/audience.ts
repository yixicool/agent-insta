import type { AudienceId, CapabilityDimension, TrendImpact } from './competitor';
import type { SourceRef } from './provenance';

/**
 * 人群场景与真实用户反馈。
 * 痛点全部来自社区讨论，保留原贴链接并转述大意。
 */

export interface AudiencePainPoint {
  readonly id: string;
  readonly summary: string;
  /** 用户当前的替代做法 */
  readonly workaround: string;
  /**
   * 该抱怨最可能由哪些能力维度不足导致。
   * 这是编者判断（用于根因分析），不是社区原文，UI 需标注为内部分析。
   */
  readonly relatedDimensions: readonly CapabilityDimension[];
  readonly source: SourceRef;
}

export interface AudienceScenario {
  readonly id: string;
  readonly audience: AudienceId;
  readonly scenario: string;
  readonly context: string;
  readonly painPoints: readonly AudiencePainPoint[];
  readonly expectation: string;
  readonly impact: TrendImpact;
}

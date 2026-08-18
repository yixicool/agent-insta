import { CAPABILITY_DIMENSIONS } from './competitor-analysis';
import {
  CAPABILITY_LABELS,
  type CapabilityDimension,
  type CompetitorModel,
} from '../types/competitor';
import type { AudiencePainPoint, AudienceScenario } from '../types/audience';
import type { FeedbackEntry } from '../types/feedback';

/**
 * 反馈根因分析。
 *
 * 把两类反馈按能力维度归拢到一起：来自社区讨论的真实抱怨（外部数据），
 * 以及用户自己在本站录入的使用反馈（本地数据）。
 * 归拢后与该机型在该维度的实际得分并列，才能说清「抱怨是不是有据可依」。
 *
 * 归因本身是编者判断，UI 必须标注为内部分析，不能冒充社区原文。
 */

export const ROOT_CAUSE_NOTE =
  '根因分析把每条反馈按它最可能对应的能力维度归拢，再和这台机型在该维度的实际得分放在一起看。维度归因是编者判断，不是社区用户的原话；能力得分附有官方规格与第三方实测来源。得分越低而抱怨越多，说明这个短板确实会被用户感知到。';

/** 该机型在某个能力维度上的反馈聚合 */
export interface RootCauseGroup {
  readonly dimension: CapabilityDimension;
  readonly label: string;
  /** 该机型在该维度的得分 */
  readonly score: number;
  /** 来自社区讨论的抱怨 */
  readonly communityPains: readonly AudiencePainPoint[];
  /** 用户在本站录入的问题反馈 */
  readonly localProblems: readonly FeedbackEntry[];
  /** 两类反馈的总条数 */
  readonly totalCount: number;
  /**
   * 是否判定为「确有短板」：该维度得分偏低且有反馈指向它。
   * 只有反馈没有低分，说明是使用方法问题而非机器能力问题。
   */
  readonly isConfirmedWeakness: boolean;
}

/** 得分低于该值才可能被判为确有短板 */
export const WEAKNESS_SCORE_CEILING = 70;

function collectCommunityPains(
  scenarios: readonly AudienceScenario[],
  dimension: CapabilityDimension,
): readonly AudiencePainPoint[] {
  return scenarios.flatMap((scenario) =>
    scenario.painPoints.filter((pain) => pain.relatedDimensions.includes(dimension)),
  );
}

/**
 * 按能力维度归拢反馈。只返回有反馈指向的维度，
 * 没有任何反馈的维度不占版面。
 */
export function groupByRootCause(
  model: CompetitorModel,
  scenarios: readonly AudienceScenario[],
  feedback: readonly FeedbackEntry[],
): readonly RootCauseGroup[] {
  const ownFeedback = feedback.filter((entry) => entry.productId === model.id);

  const groups: RootCauseGroup[] = [];
  for (const dimension of CAPABILITY_DIMENSIONS) {
    const communityPains = collectCommunityPains(scenarios, dimension);
    const localProblems = ownFeedback.filter(
      (entry) => entry.kind === 'problem' && entry.dimension === dimension,
    );
    const totalCount = communityPains.length + localProblems.length;
    if (totalCount === 0) {
      continue;
    }
    const score = model.capabilities[dimension].value;
    groups.push({
      dimension,
      label: CAPABILITY_LABELS[dimension],
      score,
      communityPains,
      localProblems,
      totalCount,
      isConfirmedWeakness: score <= WEAKNESS_SCORE_CEILING,
    });
  }

  // 先按是否确有短板，再按反馈条数排序，让最该关注的排在最前
  return [...groups].sort((left, right) => {
    if (left.isConfirmedWeakness !== right.isConfirmedWeakness) {
      return left.isConfirmedWeakness ? -1 : 1;
    }
    return right.totalCount - left.totalCount;
  });
}

/** 反馈面板顶部的一句话结论 */
export function summarizeRootCauses(
  model: CompetitorModel,
  groups: readonly RootCauseGroup[],
): string {
  if (groups.length === 0) {
    return `暂时没有指向 ${model.name} 具体能力维度的反馈。可以在下方记录你自己遇到的情况。`;
  }
  const confirmed = groups.filter((group) => group.isConfirmedWeakness);
  const top = confirmed[0];
  if (top === undefined) {
    return `共 ${groups.reduce((sum, group) => sum + group.totalCount, 0)} 条反馈指向具体能力维度，但 ${model.name} 在这些维度上的得分都不低——更可能是拍摄方法或场景预期的问题，而不是机器拍不到。`;
  }
  return `${top.label}最值得注意：有 ${top.totalCount} 条反馈指向它，而 ${model.name} 在该维度只有 ${top.score} 分，短板确实会被用户感知到。`;
}

/** 用户自己录入的反馈按场景聚合，用于「我遇到的情况」列表 */
export interface FeedbackByScene {
  readonly sceneLabel: string;
  readonly entries: readonly FeedbackEntry[];
}

export function groupFeedbackByScene(
  feedback: readonly FeedbackEntry[],
): readonly FeedbackByScene[] {
  const byScene = new Map<string, FeedbackEntry[]>();
  for (const entry of feedback) {
    const key = entry.sceneLabel.trim() === '' ? '未标注场景' : entry.sceneLabel;
    const existing = byScene.get(key);
    if (existing === undefined) {
      byScene.set(key, [entry]);
    } else {
      existing.push(entry);
    }
  }
  return [...byScene.entries()].map(([sceneLabel, entries]) => ({ sceneLabel, entries }));
}

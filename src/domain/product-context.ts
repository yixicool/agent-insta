import {
  CAPABILITY_DIMENSIONS,
  computeDimensionAverage,
  computeOverallScore,
  findDimensionLeader,
} from './competitor-analysis';
import {
  AUDIENCE_LABELS,
  BRAND_LABELS,
  CAPABILITY_LABELS,
  type AudienceId,
  type CapabilityDimension,
  type CompetitorModel,
} from '../types/competitor';
import type { AudienceScenario } from '../types/audience';

/**
 * 单机型页的派生数据：这台机器强在哪、弱在哪、它的用户在抱怨什么。
 * 全部为纯函数，不触碰 React 与存储。
 */

export const PRODUCT_GAP_NOTE =
  '短板 = 该机型在某个能力维度上低于其余在售机型的平均分，且差距超过 8 分。分数由数据编者依据官方规格与第三方实测标注并附来源，同类均值不含该机型自身。';

/** 判定为「明显落后」的最小分差，低于该值属正常波动 */
export const PRODUCT_GAP_THRESHOLD = 8;

/** 判定为「明显领先」的最小分差 */
export const PRODUCT_EDGE_THRESHOLD = 8;

/** 该机型在某个维度上相对同类的量化位置 */
export interface ProductWeakness {
  readonly dimension: CapabilityDimension;
  readonly label: string;
  /** 该机型自身得分 */
  readonly score: number;
  /** 其余在售机型在该维度的平均分 */
  readonly peerAverage: number;
  /** 落后分数，正值 */
  readonly deficit: number;
  /** 该维度上得分最高的同类机型名 */
  readonly leaderName: string;
  readonly leaderScore: number;
}

/** 该机型明显强于同类的维度 */
export interface ProductStrength {
  readonly dimension: CapabilityDimension;
  readonly label: string;
  readonly score: number;
  readonly peerAverage: number;
  /** 领先分数，正值 */
  readonly surplus: number;
}

/**
 * 找出该机型明显落后于同类均值的维度，差距大的排在前面。
 * 只有一款机型时没有可比基准，返回空数组而不是硬凑结论。
 */
export function findProductWeaknesses(
  model: CompetitorModel,
  allModels: readonly CompetitorModel[],
): readonly ProductWeakness[] {
  const peers = allModels.filter((candidate) => candidate.id !== model.id);
  if (peers.length === 0) {
    return [];
  }

  const weaknesses: ProductWeakness[] = [];
  for (const dimension of CAPABILITY_DIMENSIONS) {
    const average = computeDimensionAverage(peers, dimension);
    if (average === null) {
      continue;
    }
    const score = model.capabilities[dimension].value;
    const deficit = Number((average - score).toFixed(1));
    if (deficit < PRODUCT_GAP_THRESHOLD) {
      continue;
    }
    const leader = findDimensionLeader(peers, dimension);
    if (leader === null) {
      continue;
    }
    weaknesses.push({
      dimension,
      label: CAPABILITY_LABELS[dimension],
      score,
      peerAverage: average,
      deficit,
      leaderName: `${BRAND_LABELS[leader.brand]} ${leader.name}`,
      leaderScore: leader.capabilities[dimension].value,
    });
  }

  return [...weaknesses].sort((left, right) => right.deficit - left.deficit);
}

/** 找出该机型明显强于同类均值的维度，领先幅度大的排在前面 */
export function findProductStrengths(
  model: CompetitorModel,
  allModels: readonly CompetitorModel[],
): readonly ProductStrength[] {
  const peers = allModels.filter((candidate) => candidate.id !== model.id);
  if (peers.length === 0) {
    return [];
  }

  const strengths: ProductStrength[] = [];
  for (const dimension of CAPABILITY_DIMENSIONS) {
    const average = computeDimensionAverage(peers, dimension);
    if (average === null) {
      continue;
    }
    const score = model.capabilities[dimension].value;
    const surplus = Number((score - average).toFixed(1));
    if (surplus < PRODUCT_EDGE_THRESHOLD) {
      continue;
    }
    strengths.push({
      dimension,
      label: CAPABILITY_LABELS[dimension],
      score,
      peerAverage: average,
      surplus,
    });
  }

  return [...strengths].sort((left, right) => right.surplus - left.surplus);
}

/**
 * 该机型官方定位人群对应的真实社区场景。
 * 只保留 targetAudiences 命中的场景，避免把无关人群的抱怨挂到这台机器上。
 */
export function findRelevantScenarios(
  model: CompetitorModel,
  scenarios: readonly AudienceScenario[],
): readonly AudienceScenario[] {
  return scenarios.filter((scenario) => model.targetAudiences.includes(scenario.audience));
}

/** 产品页顶部的一句话结论 */
export function summarizeProductPosition(
  model: CompetitorModel,
  allModels: readonly CompetitorModel[],
  weaknesses: readonly ProductWeakness[],
): string {
  const overall = computeOverallScore(model);
  const peers = allModels.filter((candidate) => candidate.id !== model.id);
  const audienceText = model.targetAudiences
    .slice(0, 3)
    .map((id: AudienceId) => AUDIENCE_LABELS[id])
    .join('、');

  if (peers.length === 0) {
    return `${model.name} 综合能力 ${overall} 分，官方定位${audienceText}。当前没有可比机型。`;
  }

  const top = weaknesses[0];
  if (top === undefined) {
    return `${model.name} 综合能力 ${overall} 分，官方定位${audienceText}。各能力维度都没有明显落后同类的地方。`;
  }
  return `${model.name} 综合能力 ${overall} 分，官方定位${audienceText}。最明显的短板是${top.label}——比同类平均低 ${top.deficit} 分，${top.leaderName} 做到了 ${top.leaderScore}。`;
}

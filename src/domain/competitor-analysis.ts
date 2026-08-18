import {
  CAPABILITY_LABELS,
  type CapabilityDimension,
  type CompetitorModel,
} from '../types/competitor';

/**
 * 竞品派生分析。全部是纯函数，评分口径在 SCORING_NOTE 中对用户公开，
 * 不做黑箱打分。
 */

export const CAPABILITY_DIMENSIONS: readonly CapabilityDimension[] = [
  'lowLight',
  'stabilization',
  'battery',
  'ruggedness',
  'portability',
  'creativeFlexibility',
];

export const SCORING_NOTE =
  '能力评分为 0-100，由数据编者依据官方规格与第三方实测逐项标注并附来源，不是自动生成的估算值。综合分为六个维度的算术平均。';

export interface DimensionScore {
  readonly dimension: CapabilityDimension;
  readonly label: string;
  readonly score: number;
}

/** 单机型的六维评分，供雷达图直接使用 */
export function scoreCapabilityDimensions(model: CompetitorModel): readonly DimensionScore[] {
  return CAPABILITY_DIMENSIONS.map((dimension) => ({
    dimension,
    label: CAPABILITY_LABELS[dimension],
    score: model.capabilities[dimension].value,
  }));
}

export function computeOverallScore(model: CompetitorModel): number {
  const total = CAPABILITY_DIMENSIONS.reduce(
    (carry, dimension) => carry + model.capabilities[dimension].value,
    0,
  );
  return Number((total / CAPABILITY_DIMENSIONS.length).toFixed(1));
}

/** 某个维度上得分最高的机型；机型列表为空时返回 null */
export function findDimensionLeader(
  models: readonly CompetitorModel[],
  dimension: CapabilityDimension,
): CompetitorModel | null {
  return models.reduce<CompetitorModel | null>((leader, model) => {
    if (leader === null) {
      return model;
    }
    return model.capabilities[dimension].value > leader.capabilities[dimension].value
      ? model
      : leader;
  }, null);
}

/** 某个维度上所有机型的平均分；列表为空时返回 null 而不是 0，避免把「没有数据」读成「得分为零」 */
export function computeDimensionAverage(
  models: readonly CompetitorModel[],
  dimension: CapabilityDimension,
): number | null {
  if (models.length === 0) {
    return null;
  }
  const total = models.reduce((carry, model) => carry + model.capabilities[dimension].value, 0);
  return Number((total / models.length).toFixed(1));
}

import { CAPABILITY_DIMENSIONS, computeOverallScore } from './competitor-analysis';
import {
  AUDIENCE_LABELS,
  CAPABILITY_LABELS,
  type AudienceId,
  type CapabilityDimension,
  type CompetitorModel,
} from '../types/competitor';

/**
 * 引导式选产品的打分规则。
 *
 * 全部是纯函数，权重与算式在 MATCH_FORMULA_NOTE 中对用户公开：
 * 首页给出的推荐必须能被用户复算，不是黑箱排序。
 *
 * 打分只使用机型自带的、附来源的真实能力评分与官方价格，
 * 不引入任何推测数据。
 */

/** 每个拍摄场景最看重的能力维度，权重之和固定为 1 */
type DimensionWeights = Readonly<Partial<Record<CapabilityDimension, number>>>;

const AUDIENCE_WEIGHTS: Readonly<Record<AudienceId, DimensionWeights>> = {
  cycling: { stabilization: 0.3, battery: 0.25, ruggedness: 0.2, lowLight: 0.15, portability: 0.1 },
  snow: { ruggedness: 0.3, battery: 0.25, stabilization: 0.25, lowLight: 0.2 },
  water: { ruggedness: 0.4, stabilization: 0.2, lowLight: 0.2, creativeFlexibility: 0.2 },
  motorcycle: {
    stabilization: 0.3,
    battery: 0.25,
    ruggedness: 0.2,
    creativeFlexibility: 0.15,
    lowLight: 0.1,
  },
  'trail-running': {
    portability: 0.35,
    stabilization: 0.25,
    battery: 0.2,
    ruggedness: 0.2,
  },
  'family-pet': {
    portability: 0.3,
    lowLight: 0.25,
    creativeFlexibility: 0.25,
    stabilization: 0.2,
  },
  'travel-vlog': {
    creativeFlexibility: 0.3,
    lowLight: 0.25,
    portability: 0.25,
    stabilization: 0.2,
  },
  'pro-filmmaking': {
    lowLight: 0.35,
    creativeFlexibility: 0.3,
    stabilization: 0.2,
    ruggedness: 0.15,
  },
};

export const MATCH_FORMULA_NOTE =
  '匹配度 = 所选场景最看重的能力维度加权平均（0-100）。多选场景时取各场景得分的算术平均。能力评分本身由数据编者依据官方规格与第三方实测逐项标注并附来源。命中「官方标注的适用人群」额外加 5 分，超出预算按超出比例扣分，最多扣 15 分。未选场景时按六维综合分排序。';

/** 官方标注适用人群的加分，体现厂商自己的场景定位 */
const AUDIENCE_MATCH_BONUS = 5;
/** 超预算的最大扣分，避免高价机型因单项能力强而始终排前 */
const MAX_BUDGET_PENALTY = 15;

/** 用户在首页给出的选购条件 */
export interface SelectionCriteria {
  /** 关心的拍摄场景；空数组表示还没选，按综合分排序 */
  readonly audiences: readonly AudienceId[];
  /** 预算上限（人民币）；null 表示不限 */
  readonly maxPrice: number | null;
  readonly formFactors: readonly CompetitorModel['formFactor'][];
}

export const EMPTY_CRITERIA: SelectionCriteria = {
  audiences: [],
  maxPrice: null,
  formFactors: [],
};

/** 推荐理由的一条依据，逐条可读 */
export interface MatchReason {
  readonly label: string;
  readonly detail: string;
}

export interface ProductMatch {
  readonly model: CompetitorModel;
  /** 0-100 的匹配度 */
  readonly score: number;
  /** 六维综合分，用于并列时的次级排序与展示 */
  readonly overallScore: number;
  /** 该机型在所选场景下最强的两个维度 */
  readonly strongestDimensions: readonly string[];
  /** 所选场景下明显偏弱的维度，提前告知短板 */
  readonly weakestDimension: string | null;
  readonly reasons: readonly MatchReason[];
  /** 是否超出预算；超预算不过滤掉，而是标注并扣分 */
  readonly overBudget: boolean;
}

function averageWeighted(model: CompetitorModel, weights: DimensionWeights): number {
  const entries = Object.entries(weights) as readonly (readonly [CapabilityDimension, number])[];
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight <= 0) {
    return computeOverallScore(model);
  }
  const weighted = entries.reduce(
    (sum, [dimension, weight]) => sum + model.capabilities[dimension].value * weight,
    0,
  );
  return weighted / totalWeight;
}

/** 所选场景下的能力得分：多选取平均，未选取六维综合分 */
function scoreForAudiences(model: CompetitorModel, audiences: readonly AudienceId[]): number {
  if (audiences.length === 0) {
    return computeOverallScore(model);
  }
  const total = audiences.reduce(
    (sum, audience) => sum + averageWeighted(model, AUDIENCE_WEIGHTS[audience]),
    0,
  );
  return total / audiences.length;
}

/** 合并多个场景的权重，用于找出「所选场景下」最强与最弱的维度 */
function mergeWeights(audiences: readonly AudienceId[]): DimensionWeights {
  if (audiences.length === 0) {
    return Object.fromEntries(CAPABILITY_DIMENSIONS.map((dimension) => [dimension, 1]));
  }
  const merged = new Map<CapabilityDimension, number>();
  for (const audience of audiences) {
    for (const [dimension, weight] of Object.entries(
      AUDIENCE_WEIGHTS[audience],
    ) as readonly (readonly [CapabilityDimension, number])[]) {
      merged.set(dimension, (merged.get(dimension) ?? 0) + weight);
    }
  }
  return Object.fromEntries(merged);
}

/** 在所选场景关心的维度里，按机型自身得分排序 */
function rankRelevantDimensions(
  model: CompetitorModel,
  audiences: readonly AudienceId[],
): readonly CapabilityDimension[] {
  const relevant = Object.keys(mergeWeights(audiences)) as readonly CapabilityDimension[];
  return [...relevant].sort(
    (left, right) => model.capabilities[right].value - model.capabilities[left].value,
  );
}

function computeBudgetPenalty(model: CompetitorModel, maxPrice: number | null): number {
  if (maxPrice === null || maxPrice <= 0) {
    return 0;
  }
  const amount = model.price.value.amount;
  if (amount <= maxPrice) {
    return 0;
  }
  const overshootRatio = (amount - maxPrice) / maxPrice;
  return Math.min(MAX_BUDGET_PENALTY, Number((overshootRatio * 100).toFixed(1)));
}

function buildReasons(
  model: CompetitorModel,
  criteria: SelectionCriteria,
  strongest: readonly CapabilityDimension[],
  penalty: number,
  audienceHit: readonly AudienceId[],
): readonly MatchReason[] {
  const reasons: MatchReason[] = [];

  const [best, second] = strongest;
  if (best !== undefined) {
    reasons.push({
      label: `${CAPABILITY_LABELS[best]}表现最好`,
      detail: `该维度得分 ${model.capabilities[best].value}，是这台机器在你关心的能力里最强的一项。`,
    });
  }
  if (second !== undefined) {
    reasons.push({
      label: `${CAPABILITY_LABELS[second]}同样够用`,
      detail: `该维度得分 ${model.capabilities[second].value}。`,
    });
  }

  if (audienceHit.length > 0) {
    reasons.push({
      label: '厂商官方就把它定位给这些场景',
      detail: `官方标注的适用人群包含${audienceHit.map((id) => AUDIENCE_LABELS[id]).join('、')}。`,
    });
  }

  if (penalty > 0 && criteria.maxPrice !== null) {
    reasons.push({
      label: '超出你设定的预算',
      detail: `官方价 ${model.price.value.currency} ${model.price.value.amount}，高于预算 ¥${criteria.maxPrice}，已按超出比例扣 ${penalty} 分。`,
    });
  }

  return reasons;
}

function matchesFormFactor(model: CompetitorModel, criteria: SelectionCriteria): boolean {
  return criteria.formFactors.length === 0 || criteria.formFactors.includes(model.formFactor);
}

/**
 * 按选购条件给单个机型打分。
 * 形态筛选是硬条件（在 recommendProducts 中过滤），预算是软条件（扣分并标注）。
 */
export function scoreProduct(model: CompetitorModel, criteria: SelectionCriteria): ProductMatch {
  const base = scoreForAudiences(model, criteria.audiences);
  const audienceHit = criteria.audiences.filter((audience) =>
    model.targetAudiences.includes(audience),
  );
  const bonus = audienceHit.length > 0 ? AUDIENCE_MATCH_BONUS : 0;
  const penalty = computeBudgetPenalty(model, criteria.maxPrice);
  const score = Number(Math.min(100, Math.max(0, base + bonus - penalty)).toFixed(1));

  const ranked = rankRelevantDimensions(model, criteria.audiences);
  const strongest = ranked.slice(0, 2);
  const weakest = ranked.length > 2 ? (ranked[ranked.length - 1] ?? null) : null;

  return {
    model,
    score,
    overallScore: computeOverallScore(model),
    strongestDimensions: strongest.map((dimension) => CAPABILITY_LABELS[dimension]),
    weakestDimension: weakest === null ? null : CAPABILITY_LABELS[weakest],
    reasons: buildReasons(model, criteria, strongest, penalty, audienceHit),
    overBudget: penalty > 0,
  };
}

/**
 * 生成推荐列表。形态不符的机型直接排除；
 * 超预算的保留但扣分并标注，避免用户完全看不到略超预算的更优解。
 */
export function recommendProducts(
  models: readonly CompetitorModel[],
  criteria: SelectionCriteria,
): readonly ProductMatch[] {
  const matches = models
    .filter((model) => matchesFormFactor(model, criteria))
    .map((model) => scoreProduct(model, criteria));

  return [...matches].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    // 匹配度并列时用综合分兜底，保证排序稳定可预期
    return right.overallScore - left.overallScore;
  });
}

/** 首页概览用的一句话结论 */
export function summarizeRecommendation(
  matches: readonly ProductMatch[],
  criteria: SelectionCriteria,
): string {
  const top = matches[0];
  if (top === undefined) {
    return '当前筛选条件下没有符合的机型，放宽形态或预算再试。';
  }
  if (criteria.audiences.length === 0) {
    return `还没选拍摄场景，暂按六维综合能力排序，${top.model.name} 综合分最高。选一个场景会得到更贴合的推荐。`;
  }
  const audienceText = criteria.audiences.map((id) => AUDIENCE_LABELS[id]).join('、');
  const strengths = top.strongestDimensions.join('与');
  return `按${audienceText}的权重算，${top.model.name} 匹配度最高（${top.score} 分），强在${strengths}。点开就能围绕它提需求。`;
}

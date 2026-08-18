import { CAPABILITY_DIMENSIONS } from './competitor-analysis';
import {
  AUDIENCE_LABELS,
  CAPABILITY_LABELS,
  type CapabilityDimension,
  type CompetitorModel,
} from '../types/competitor';
import type { PlayStyle } from '../types/play';

/**
 * 玩法与机型的双向匹配。
 *
 * 首页从玩法出发问「这个玩法该用哪台机器」，
 * 产品页从机型出发问「这台机器最适合哪些玩法」，
 * 两个方向共用同一套评分口径，避免两页给出互相矛盾的结论。
 */

export const PLAY_FIT_NOTE =
  '契合度 = 该玩法所依赖的能力维度在这台机型上的平均分（0-100）。依赖维度是编者对玩法的判断，能力分本身由数据编者依据官方规格与第三方实测标注并附来源。命中厂商官方标注的适用人群额外加 5 分。';

/** 命中官方定位人群的加分 */
const AUDIENCE_MATCH_BONUS = 5;

/** 达到该分数才算「这台机器拍得动这个玩法」 */
export const PLAY_FIT_THRESHOLD = 70;

export interface PlayFit {
  readonly play: PlayStyle;
  readonly model: CompetitorModel;
  /** 0-100 的契合度 */
  readonly score: number;
  /** 该玩法依赖的维度中，这台机器最强的一项 */
  readonly bestDimension: CapabilityDimension | null;
  /** 该玩法依赖的维度中，这台机器最弱的一项 */
  readonly weakestDimension: CapabilityDimension | null;
  /** 官方定位是否命中该玩法的人群 */
  readonly audienceHit: boolean;
}

function averageOverDimensions(
  model: CompetitorModel,
  dimensions: readonly CapabilityDimension[],
): number {
  const used = dimensions.length === 0 ? CAPABILITY_DIMENSIONS : dimensions;
  const total = used.reduce((sum, dimension) => sum + model.capabilities[dimension].value, 0);
  return total / used.length;
}

/** 按玩法依赖的维度给机型打分 */
export function scorePlayFit(play: PlayStyle, model: CompetitorModel): PlayFit {
  const dimensions = play.demands.length === 0 ? CAPABILITY_DIMENSIONS : play.demands;
  const base = averageOverDimensions(model, play.demands);
  const audienceHit = model.targetAudiences.includes(play.audience);
  const score = Number(Math.min(100, base + (audienceHit ? AUDIENCE_MATCH_BONUS : 0)).toFixed(1));

  const ranked = [...dimensions].sort(
    (left, right) => model.capabilities[right].value - model.capabilities[left].value,
  );

  return {
    play,
    model,
    score,
    bestDimension: ranked[0] ?? null,
    weakestDimension: ranked.length > 1 ? (ranked[ranked.length - 1] ?? null) : null,
    audienceHit,
  };
}

/** 某个玩法下所有机型的排序，最贴合的排在最前 */
export function rankModelsForPlay(
  play: PlayStyle,
  models: readonly CompetitorModel[],
): readonly PlayFit[] {
  const fits = models.map((model) => scorePlayFit(play, model));
  return [...fits].sort((left, right) => right.score - left.score);
}

/** 某台机型下所有玩法的排序，最拍得动的排在最前 */
export function rankPlaysForModel(
  model: CompetitorModel,
  plays: readonly PlayStyle[],
): readonly PlayFit[] {
  const fits = plays.map((play) => scorePlayFit(play, model));
  return [...fits].sort((left, right) => right.score - left.score);
}

/** 一句话说明这台机器为什么适合（或不适合）这个玩法 */
export function describePlayFit(fit: PlayFit): string {
  const dimensionText =
    fit.bestDimension === null
      ? ''
      : `${CAPABILITY_LABELS[fit.bestDimension]}得分 ${fit.model.capabilities[fit.bestDimension].value}`;

  if (fit.score < PLAY_FIT_THRESHOLD) {
    const weak =
      fit.weakestDimension === null
        ? '这个玩法依赖的能力上还有明显短板'
        : `${CAPABILITY_LABELS[fit.weakestDimension]}只有 ${fit.model.capabilities[fit.weakestDimension].value} 分，是这个玩法的瓶颈`;
    return `${fit.model.name} 拍这个玩法比较吃力：${weak}。`;
  }

  const audienceText = fit.audienceHit
    ? `，且厂商官方就把它定位给${AUDIENCE_LABELS[fit.play.audience]}`
    : '';
  return `${fit.model.name} 适合这个玩法：${dimensionText}${audienceText}。`;
}

/** 玩法卡上要标出的能力要求文字 */
export function describePlayDemands(play: PlayStyle): string {
  if (play.demands.length === 0) {
    return '对机器没有特别偏好，六维能力均衡即可。';
  }
  return `主要吃${play.demands.map((dimension) => CAPABILITY_LABELS[dimension]).join('、')}。`;
}

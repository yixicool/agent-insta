import type { Sourced, Undisclosed } from './provenance';

export type BrandId = 'dji' | 'insta360' | 'gopro';

export const BRAND_LABELS: Readonly<Record<BrandId, string>> = {
  dji: '大疆 DJI',
  insta360: '影石 Insta360',
  gopro: 'GoPro',
};

/** 形态决定了适用场景，是筛选竞品的主要维度之一 */
export type FormFactor =
  'action-cube' | 'action-360' | 'pocket-gimbal' | 'modular-mini' | 'compact-cinema';

export const FORM_FACTOR_LABELS: Readonly<Record<FormFactor, string>> = {
  'action-cube': '方形运动相机',
  'action-360': '全景运动相机',
  'pocket-gimbal': '口袋云台相机',
  'modular-mini': '拇指模块相机',
  'compact-cinema': '紧凑电影机',
};

export type AudienceId =
  | 'cycling'
  | 'snow'
  | 'water'
  | 'motorcycle'
  | 'trail-running'
  | 'family-pet'
  | 'travel-vlog'
  | 'pro-filmmaking';

export const AUDIENCE_LABELS: Readonly<Record<AudienceId, string>> = {
  cycling: '骑行',
  snow: '滑雪',
  water: '水下与水上',
  motorcycle: '摩托',
  'trail-running': '越野跑',
  'family-pet': '亲子与宠物',
  'travel-vlog': '旅拍 Vlog',
  'pro-filmmaking': '专业影视',
};

export type CurrencyCode = 'USD' | 'CNY';

export interface PriceQuote {
  readonly amount: number;
  readonly currency: CurrencyCode;
  /** 报价适用地区，例如 '美国 MSRP' / '中国大陆官方价' */
  readonly region: string;
  /** 套装说明，例如 '标准套装 (64GB)' */
  readonly variant: string;
}

/** 可用于评分的能力维度，评分算法在 domain/competitor-analysis.ts 中公开 */
export type CapabilityDimension =
  'lowLight' | 'stabilization' | 'battery' | 'ruggedness' | 'portability' | 'creativeFlexibility';

export const CAPABILITY_LABELS: Readonly<Record<CapabilityDimension, string>> = {
  lowLight: '低光画质',
  stabilization: '防抖',
  battery: '续航',
  ruggedness: '三防耐用',
  portability: '便携性',
  creativeFlexibility: '创作灵活度',
};

export interface CompetitorModel {
  readonly id: string;
  readonly brand: BrandId;
  readonly name: string;
  readonly formFactor: FormFactor;
  /** 上市日期或发布日期，ISO yyyy-mm-dd */
  readonly releasedOn: Sourced<string>;
  readonly sensor: Sourced<string>;
  readonly aperture: Sourced<string | Undisclosed>;
  readonly maxVideo: Sourced<string>;
  readonly stabilization: Sourced<string>;
  /** 官方标称续航 */
  readonly ratedBattery: Sourced<string>;
  /** 第三方实测续航，必须来自 review 类来源 */
  readonly measuredBattery: Sourced<string | Undisclosed>;
  readonly waterproof: Sourced<string>;
  readonly weightGrams: Sourced<number | Undisclosed>;
  readonly storage: Sourced<string>;
  readonly price: Sourced<PriceQuote>;
  readonly targetAudiences: readonly AudienceId[];
  readonly strengths: readonly Sourced<string>[];
  readonly weaknesses: readonly Sourced<string>[];
  /** 图床完整 URL；缺图时为 null */
  readonly imagePath: string | null;
  /** 归一化到 0-100 的能力评分，由数据编者依据实测与规格给出并附来源 */
  readonly capabilities: Readonly<Record<CapabilityDimension, Sourced<number>>>;
}

export type TrendImpact = 'high' | 'medium' | 'low';

export const TREND_IMPACT_LABELS: Readonly<Record<TrendImpact, string>> = {
  high: '高影响',
  medium: '中影响',
  low: '观察中',
};

export interface IndustryTrend {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly impact: TrendImpact;
  /** 该趋势下的代表性产品动作 */
  readonly evidence: readonly Sourced<string>[];
  /** 对本品的启示，属于编者判断，UI 需标注为内部分析 */
  readonly implication: string;
}

/** 未官方确认的传闻，独立分区展示，绝不混入在售矩阵 */
export interface RumorEntry {
  readonly id: string;
  readonly brand: BrandId;
  readonly subject: string;
  readonly claim: Sourced<string>;
  readonly status: 'unannounced' | 'delayed' | 'teased';
}

export interface CompetitorSnapshot {
  /** 整份快照的采集日期 */
  readonly capturedAt: string;
  readonly models: readonly CompetitorModel[];
  readonly trends: readonly IndustryTrend[];
  readonly rumors: readonly RumorEntry[];
}

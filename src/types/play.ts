import type { AudienceId, CapabilityDimension } from './competitor';
import type { Sourced } from './provenance';

/**
 * 玩法：一个「素材场景 + 具体拍法」的组合，是首页的主要内容单元。
 *
 * evidence 是可核对的真实产品能力或评测结论；
 * demands（这个玩法吃哪些能力）是编者判断，UI 需标注为内部分析。
 */

/** 自绘场景插画的形态键，对应 components/SceneArt.tsx */
export type SceneArtKey =
  | 'night-road'
  | 'dual-format'
  | 'panorama'
  | 'wearable'
  | 'snow-glare'
  | 'underwater'
  | 'touring'
  | 'trail'
  | 'cinema'
  | 'telemetry';

/** 上手难度，决定首页是否把它推给新手 */
export type PlayEffort = 'easy' | 'moderate' | 'advanced';

export const PLAY_EFFORT_LABELS: Readonly<Record<PlayEffort, string>> = {
  easy: '开箱就能拍',
  moderate: '需要一点设置',
  advanced: '要后期才出效果',
};

export interface PlayStyle {
  readonly id: string;
  /** 玩法名，例如「隧道穿行的明暗切换」 */
  readonly name: string;
  /** 素材场景，例如「城市夜骑」 */
  readonly sceneLabel: string;
  readonly audience: AudienceId;
  readonly artKey: SceneArtKey;
  readonly effort: PlayEffort;
  /** 这个玩法拍出来是什么样 */
  readonly summary: string;
  /** 具体怎么拍，逐步可执行 */
  readonly steps: readonly string[];
  /** 这个玩法主要吃哪些能力，用于反查机型 */
  readonly demands: readonly CapabilityDimension[];
  /** 器材与配件上的注意事项 */
  readonly gearNote: string;
  /** 支撑这个玩法确实可行的真实产品能力或评测结论 */
  readonly evidence: readonly Sourced<string>[];
}

import type { Sourced } from './provenance';

/** 技术雷达四环，沿用 ThoughtWorks 雷达的语义 */
export type RadarRing = 'adopt' | 'trial' | 'assess' | 'hold';

export const RADAR_RING_LABELS: Readonly<Record<RadarRing, string>> = {
  adopt: '已普及',
  trial: '正在铺开',
  assess: '仍在观察',
  hold: '暂不建议',
};

export type RadarCategory = 'sensor-optics' | 'compute-ai' | 'form-factor' | 'data-connectivity';

export const RADAR_CATEGORY_LABELS: Readonly<Record<RadarCategory, string>> = {
  'sensor-optics': '传感与光学',
  'compute-ai': '算力与 AI',
  'form-factor': '形态与结构',
  'data-connectivity': '数据与连接',
};

export interface TechRadarEntry {
  readonly id: string;
  readonly name: string;
  readonly ring: RadarRing;
  readonly category: RadarCategory;
  readonly summary: string;
  /** 对运动相机品类的适配度，0-100，属于编者判断 */
  readonly fitScore: number;
  readonly risk: string;
  readonly evidence: readonly Sourced<string>[];
}

export interface TrendRadar {
  readonly capturedAt: string;
  readonly entries: readonly TechRadarEntry[];
}

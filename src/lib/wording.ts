/**
 * 术语大白话映射与定性判读。
 *
 * 目标：让不熟悉影像技术参数的人也能读懂结论，同时不丢失专业信息——
 * 每个大白话标签都保留对应的技术术语与口径说明，由 UI 以注解形式展示。
 */

export interface TermWording {
  /** 面向所有人的说法 */
  readonly plain: string;
  /** 原始专业术语 */
  readonly technical: string;
  /** 计算口径或含义说明 */
  readonly explain: string;
}

/** 页面上出现的专业术语。键名与出现位置无关，按术语自身命名。 */
export const GENERAL_WORDING = {
  openGate: {
    plain: '全画幅读出',
    technical: 'open-gate',
    explain: '读取传感器完整面积，后期可自由裁出横屏或竖屏，不必重复拍摄。',
  },
  quadBayer: {
    plain: '四合一像素',
    technical: 'Quad Bayer',
    explain: '相邻四个像素可合并为一个大像素，弱光下用于提升信噪比。',
  },
  ipx8: {
    plain: '防水等级',
    technical: 'IPX8',
    explain: '国际防护等级中的防水第 8 级，可在厂商标注的深度下持续浸泡。',
  },
  flowState: {
    plain: '电子防抖',
    technical: 'FlowState',
    explain: '影石的电子防抖方案，含地平线锁定。',
  },
  dLogM: {
    plain: '宽容度录制模式',
    technical: '10bit D-Log M',
    explain: '保留更多明暗信息的记录方式，需要后期调色才能得到成片观感。',
  },
  dynamicRange: {
    plain: '明暗宽容度',
    technical: '动态范围（档）',
    explain: '同一画面里能同时留住细节的最亮处与最暗处的跨度，档数越多越不容易一头死白一头死黑。',
  },
  horizonLock: {
    plain: '地平线锁定',
    technical: 'HorizonSteady / HorizonBalancing',
    explain: '机身翻转时把画面地平线保持水平，代价是会裁掉部分视角。',
  },
  capabilityScore: {
    plain: '能力评分',
    technical: '六维能力分（0–100）',
    explain:
      '由数据编者依据官方规格与第三方实测逐项标注并附来源的相对判断，不是厂商公布的参数，也不是自动生成的估算值。',
  },
} as const satisfies Record<string, TermWording>;

export type GeneralTermKey = keyof typeof GENERAL_WORDING;

/** 能力评分（0–100）的档位说明 */
export function describeCapabilityLevel(score: number): string {
  if (!Number.isFinite(score)) {
    return '未评估';
  }
  if (score >= 90) {
    return '第一梯队';
  }
  if (score >= 75) {
    return '较强';
  }
  if (score >= 60) {
    return '中等';
  }
  return '偏弱';
}

/** 严重程度（1–5）的说明，用于用户自己录入的反馈 */
export function describeSeverityLevel(severity: number): string {
  if (!Number.isFinite(severity)) {
    return '未评估';
  }
  if (severity >= 5) {
    return '完全没法用';
  }
  if (severity >= 4) {
    return '明显影响';
  }
  if (severity >= 3) {
    return '有点影响';
  }
  if (severity >= 2) {
    return '轻微';
  }
  return '几乎无感';
}

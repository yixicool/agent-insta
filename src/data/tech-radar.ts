import { sourced } from '../types/provenance';
import type { TechRadarEntry, TrendRadar } from '../types/tech-radar';
import { CAPTURED_AT } from './sources';
import {
  CINED_OSMO_NANO,
  DJI_ACTION_6_PRODUCT,
  DJI_NANO_STORE,
  DJI_OSMO_360_PRESS,
  DJI_OSMO_PRODUCTS,
  DPREVIEW_MISSION_PRO_ILS,
  DPREVIEW_MISSION_SERIES,
  DPREVIEW_OSMO_NANO,
  GOPRO_HERO13_SPECS,
  GOPRO_MISSION_1_ANNOUNCE,
  INSTA360_ACE_PRO_2_PRODUCT,
  INSTA360_GO_ULTRA_PRESS,
  INSTA360_X5_PRESS,
  PCMAG_BEST_ACTION_CAMERAS,
  REDDIT_EXTERNAL_POWER,
  REDDIT_MAX2_WIND_NOISE,
  REDDIT_MOTO_TOURING,
  TECHRADAR_OSMO_ACTION_6,
} from './sources';

/**
 * 技术雷达。ring 与 fitScore 是编者对本品适配度的判断，
 * evidence 为可核对的真实产品事实，二者在 UI 上分开呈现。
 */

const ENTRIES: readonly TechRadarEntry[] = [
  {
    id: 'radar-large-sensor',
    name: '1 英寸级大底传感器',
    ring: 'adopt',
    category: 'sensor-optics',
    summary:
      '传感器面积直接决定低光信噪比。头部机型已把 1/1.1 英寸到 1 英寸做成旗舰标配，这已不再是差异化选项而是入场门槛。',
    fitScore: 95,
    risk: '大底带来机身体积、功耗与散热压力，需要同步升级供电与散热设计，且 BOM 成本上升明显。',
    evidence: [
      sourced('GoPro MISSION 1 系列使用 50MP Type-1（128mm²）传感器。', [
        GOPRO_MISSION_1_ANNOUNCE,
        DPREVIEW_MISSION_SERIES,
      ]),
      sourced('DJI Osmo Action 6 使用 1/1.1 英寸方形传感器。', [DJI_ACTION_6_PRODUCT]),
    ],
  },
  {
    id: 'radar-variable-aperture',
    name: '可变光圈模组',
    ring: 'trial',
    category: 'sensor-optics',
    summary:
      '用光学方式覆盖明暗剧变场景，替代运动相机长期依赖的外挂 ND 滤镜。目前仅一家旗舰落地，属于可验证但未普及的方案。',
    fitScore: 85,
    risk: '机械光圈在震动、粉尘与低温环境下的可靠性需要长期验证，运动相机的使用条件比手机严苛得多。',
    evidence: [
      sourced('DJI Osmo Action 6 配备 f/2.0–f/4.0 可变光圈。', [
        DJI_OSMO_PRODUCTS,
        TECHRADAR_OSMO_ACTION_6,
      ]),
    ],
  },
  {
    id: 'radar-open-gate',
    name: 'open-gate 全传感器读出',
    ring: 'adopt',
    category: 'compute-ai',
    summary:
      '读出完整传感器面积，后期自由重构横屏与竖屏。已被 GoPro 全系采用，方形传感器是同一问题的另一种解法。',
    fitScore: 92,
    risk: '数据量与码率显著上升，对存储写入速度、散热与后期工作流都有连带要求。',
    evidence: [
      sourced('MISSION 1 系列全系支持 open-gate，PRO 型号支持 8K open-gate。', [
        DPREVIEW_MISSION_SERIES,
        DPREVIEW_MISSION_PRO_ILS,
      ]),
      sourced('DJI 用方形传感器实现一次拍摄多比例输出。', [DJI_ACTION_6_PRODUCT]),
    ],
  },
  {
    id: 'radar-ai-denoise',
    name: 'AI 弱光降噪',
    ring: 'adopt',
    category: 'compute-ai',
    summary:
      '在传感器尺寸受限的形态上，算法降噪是提升弱光可用度的主要手段，两家头部厂商均已产品化。',
    fitScore: 90,
    risk: '过度降噪会牺牲细节与真实感，必须建立客观指标（边缘能量、对比度）加主观评分的双轨评估，否则容易调出「涂抹感」。',
    evidence: [
      sourced('影石 Ace Pro 2 以 AI 降噪配合 13.5 档动态范围提升弱光成片。', [
        INSTA360_ACE_PRO_2_PRODUCT,
      ]),
      sourced('影石 X5 的 PureVideo 基于三 AI 芯片架构。', [INSTA360_X5_PRESS]),
    ],
  },
  {
    id: 'radar-360-reconstruction',
    name: '360° 全景重构与 AI 取景',
    ring: 'trial',
    category: 'compute-ai',
    summary:
      '先拍摄全景再由算法选择视角，特别适合无法边拍边构图的骑行与摩托场景。已成为两家旗舰产品线的一部分。',
    fitScore: 78,
    risk: '后期工作流较重，导出耗时长；若自动取景不够聪明，用户仍需大量手工操作，实际效率提升有限。',
    evidence: [
      sourced('DJI Osmo 360 提供 1 英寸级 360° 成像与最高 120MP 全景照片。', [DJI_OSMO_360_PRESS]),
      sourced('PCMag 将影石 X5 列为 360° 视频首选。', [
        PCMAG_BEST_ACTION_CAMERAS,
        INSTA360_X5_PRESS,
      ]),
    ],
  },
  {
    id: 'radar-modular-magnetic',
    name: '磁吸模块化与超轻机身',
    ring: 'trial',
    category: 'form-factor',
    summary: '50g 级机身加磁吸底座，把佩戴位置从头盔胸带扩展到衣领、背包带等更多机位。',
    fitScore: 80,
    risk: '续航与散热是该形态的根本约束；磁吸固定在高速运动与震动下的可靠性需要实测验证，脱落风险直接影响口碑。',
    evidence: [
      sourced('DJI Osmo Nano 相机主体 52g，配磁吸扩展坞。', [DPREVIEW_OSMO_NANO]),
      sourced('影石 GO Ultra 主体 53g，内置磁吸底座。', [INSTA360_GO_ULTRA_PRESS]),
    ],
  },
  {
    id: 'radar-interchangeable-lens',
    name: '紧凑机身可换镜头卡口',
    ring: 'assess',
    category: 'form-factor',
    summary:
      '把镜头卡口放进紧凑运动影像机身。GoPro 已官宣定价与季度，但受众明确偏向影视创作者而非大众运动用户。',
    fitScore: 55,
    risk: '卡口牺牲机身密封性与体积，与运动相机的三防定位存在根本冲突；受众规模也远小于主流运动人群。',
    evidence: [
      sourced('MISSION 1 PRO ILS 定价 US$699.99，计划 2026 年第三季度上市。', [
        DPREVIEW_MISSION_PRO_ILS,
      ]),
      sourced('DPReview 分析该机型主要面向影视创作者。', [DPREVIEW_MISSION_PRO_ILS]),
    ],
  },
  {
    id: 'radar-log-color',
    name: '10bit Log 色彩管线',
    ring: 'trial',
    category: 'compute-ai',
    summary: '10bit D-Log 类曲线已下沉到 52g 的拇指相机，说明专业色彩管线不再是大机身专属。',
    fitScore: 75,
    risk: 'Log 素材需要后期调色，对普通用户是负担；需要同时提供高质量的一键还原 LUT，否则功能形同虚设。',
    evidence: [
      sourced('DJI Osmo Nano 支持 4K/120fps 与 10bit D-Log M。', [CINED_OSMO_NANO, DJI_NANO_STORE]),
    ],
  },
  {
    id: 'radar-gps-overlay',
    name: 'GNSS 与运动数据叠加',
    ring: 'adopt',
    category: 'data-connectivity',
    summary:
      '机内 GPS 与数据叠加已是成熟能力，对骑行与赛事记录场景价值直接：速度、海拔、轨迹可直接烧进画面。',
    fitScore: 88,
    risk: '定位精度与功耗需要平衡；心率、功率等数据依赖第三方设备互联，协议兼容工作量容易被低估。',
    evidence: [sourced('GoPro HERO13 Black 内置 GPS 与数据叠加功能。', [GOPRO_HERO13_SPECS])],
  },
  {
    id: 'radar-external-power',
    name: '外接供电与长时录制方案',
    ring: 'adopt',
    category: 'data-connectivity',
    summary:
      '长途骑行与摩托用户普遍绕过机内电池，直接接车电或外置电池。这不是边缘用法，而是该人群的常规解法。',
    fitScore: 90,
    risk: '边充边录的发热叠加是主要风险；接口密封性与防水等级需要重新验证，历史上有机型在外接供电时不稳定。',
    evidence: [
      sourced('社区讨论把续航与散热列为长途摩托拍摄的首要约束，明确提出 4 小时以上续航需求。', [
        REDDIT_MOTO_TOURING,
      ]),
      sourced('社区建议长时间录制直接接车电供电，而非依赖机内电池。', [REDDIT_EXTERNAL_POWER]),
    ],
  },
  {
    id: 'radar-wind-noise',
    name: '风噪抑制与机内音频处理',
    ring: 'trial',
    category: 'compute-ai',
    summary: '高速运动下的风噪是长期未被彻底解决的问题，目前主要靠物理风罩加算法抑制的组合方案。',
    fitScore: 82,
    risk: '算法抑噪容易连带削弱环境音与人声，需要在真实高速场景下评估，室内测试无法反映实际效果。',
    evidence: [
      sourced('社区反馈摩托与骑行场景即使不加配件也非常吵，风噪问题突出。', [
        REDDIT_MAX2_WIND_NOISE,
      ]),
      sourced('影石 Ace Pro 2 出厂预装 Wind Guard 风罩以应对风噪。', [INSTA360_ACE_PRO_2_PRODUCT]),
    ],
  },
  {
    id: 'radar-subscription',
    name: '订阅制与云端工作流',
    ring: 'assess',
    category: 'data-connectivity',
    summary:
      '厂商用订阅折扣影响购买决策（订阅用户可享受更低机价），云端存储与自动成片成为持续收入来源。',
    fitScore: 45,
    risk: '订阅绑定会引起用户反感，且中国大陆的云服务合规与带宽成本与海外差异大，不能直接复制海外模式。',
    evidence: [
      sourced('GoPro 订阅用户购买 MISSION 1 可低于 MSRP US$100（US$499.99 对 US$599.99）。', [
        GOPRO_MISSION_1_ANNOUNCE,
      ]),
    ],
  },
];

export const TECH_RADAR: TrendRadar = {
  capturedAt: CAPTURED_AT,
  entries: ENTRIES,
};

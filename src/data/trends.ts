import { sourced } from '../types/provenance';
import type { IndustryTrend, RumorEntry } from '../types/competitor';
import {
  DJI_ACTION_6_PRODUCT,
  DJI_NANO_STORE,
  DJI_OSMO_360_PRESS,
  DJI_OSMO_PRODUCTS,
  DPREVIEW_MISSION_PRO_ILS,
  DPREVIEW_MISSION_SERIES,
  DPREVIEW_OSMO_NANO,
  GOPRO_MISSION_1_ANNOUNCE,
  GOPRO_MISSION_1_PRICING,
  INSTA360_ACE_PRO_2_PRODUCT,
  INSTA360_GO_ULTRA_PRESS,
  INSTA360_X5_PRESS,
  PCMAG_BEST_ACTION_CAMERAS,
  PETAPIXEL_OSMO_NANO,
  REDSHARK_SUMMER_2026,
  TECHRADAR_OSMO_ACTION_6,
} from './sources';

/**
 * 行业动向。每条趋势的 evidence 是可核对的真实产品动作，
 * implication 是编者的内部判断，UI 会明确区分二者。
 */

export const INDUSTRY_TRENDS: readonly IndustryTrend[] = [
  {
    id: 'trend-large-sensor',
    title: '大底传感器下沉到运动相机品类',
    summary:
      '传感器尺寸从 1/1.9 英寸级别快速推进到 1/1.1 英寸乃至 1 英寸，低光画质成为旗舰机型的主要竞争点。',
    impact: 'high',
    evidence: [
      sourced('GoPro MISSION 1 系列采用 50MP Type-1（1 英寸，128mm²）Quad Bayer 传感器。', [
        GOPRO_MISSION_1_ANNOUNCE,
        DPREVIEW_MISSION_SERIES,
      ]),
      sourced('DJI Osmo Action 6 采用 1/1.1 英寸方形传感器，为方块形运动相机中最大。', [
        DJI_ACTION_6_PRODUCT,
        TECHRADAR_OSMO_ACTION_6,
      ]),
      sourced('影石 X5 用双 1/1.28 英寸传感器，相比 X4 的 1/2 英寸增大约 144%。', [
        INSTA360_X5_PRESS,
      ]),
    ],
    implication:
      '低光是骑行、滑雪、潜水等真实场景的高频痛点。若本品传感器仍停留在 1/1.9 英寸级别，在评测横评与用户口碑中会持续处于劣势，需要把大底列入下一代硬件基线。',
  },
  {
    id: 'trend-variable-aperture',
    title: '可变光圈进入运动相机',
    summary: '运动相机开始配备可变光圈，用光学手段而非纯算法应对强光与弱光的巨大跨度。',
    impact: 'high',
    evidence: [
      sourced('DJI Osmo Action 6 配备 f/2.0–f/4.0 可变光圈，可自动或手动调节。', [
        DJI_OSMO_PRODUCTS,
        TECHRADAR_OSMO_ACTION_6,
      ]),
    ],
    implication:
      '可变光圈解决了运动相机长期依赖 ND 滤镜控制曝光的痛点，对骑行穿隧道、滑雪强反光等明暗剧变场景价值明确，是硬件差异化的重要抓手。',
  },
  {
    id: 'trend-open-gate',
    title: 'open-gate 拍摄与竖屏重构成为标配诉求',
    summary:
      '短视频平台的竖屏分发压力，推动厂商用全传感器读出（open-gate）或方形画幅，让一次拍摄同时满足横屏与竖屏交付。',
    impact: 'high',
    evidence: [
      sourced('GoPro MISSION 1 系列全系支持 open-gate，PRO 型号可 8K open-gate。', [
        DPREVIEW_MISSION_SERIES,
        DPREVIEW_MISSION_PRO_ILS,
      ]),
      sourced('DJI Osmo Action 6 用方形传感器，一次拍摄同时输出横竖构图。', [DJI_ACTION_6_PRODUCT]),
    ],
    implication:
      '这是拍摄流程层面的变化，不只是分辨率参数。产品侧需要同步考虑机内预览、剪辑软件的重构工作流，否则硬件能力无法转化为用户可感知的效率提升。',
  },
  {
    id: 'trend-interchangeable-lens',
    title: '可换镜头首次进入紧凑运动影像品类',
    summary: 'GoPro 推出带镜头卡口的机型，把可换镜头能力从专业相机下移到紧凑运动影像形态。',
    impact: 'medium',
    evidence: [
      sourced('MISSION 1 PRO ILS 支持更换镜头，官方定价 US$699.99，计划 2026 年第三季度上市。', [
        GOPRO_MISSION_1_PRICING,
      ]),
      sourced('DPReview 分析该机型主要面向影视创作者而非普通运动用户。', [
        DPREVIEW_MISSION_PRO_ILS,
      ]),
      sourced('影石 X5 采用可更换镜头设计，主要解决镜面刮花后的维修成本问题。', [
        INSTA360_X5_PRESS,
      ]),
    ],
    implication:
      '两家的「可换镜头」目标不同：GoPro 面向创作自由度，影石面向耐用性与维修成本。本品若跟进，应先明确解决的是哪一类问题，避免堆砌参数。',
  },
  {
    id: 'trend-modular-magnetic',
    title: '磁吸模块化与超轻佩戴形态成为独立赛道',
    summary: '50g 级别的拇指相机配合磁吸底座与扩展坞，开辟了传统方块机之外的佩戴式市场。',
    impact: 'high',
    evidence: [
      sourced('DJI Osmo Nano 相机主体仅 52g，配磁吸多功能扩展坞。', [
        DPREVIEW_OSMO_NANO,
        PETAPIXEL_OSMO_NANO,
      ]),
      sourced('影石 GO Ultra 主体 53g，内置磁吸底座，可佩戴到常规相机难固定的位置。', [
        INSTA360_GO_ULTRA_PRESS,
      ]),
      sourced('DJI Osmo Nano 提供 64GB / 128GB 机内存储版本，降低佩戴时的配件依赖。', [
        DJI_NANO_STORE,
      ]),
    ],
    implication:
      '该形态的核心约束是续航与散热，而非画质。若进入这一赛道，供电方案（扩展坞、车电、外接电池）必须与相机本体同时设计，否则会重复竞品被用户吐槽的问题。',
  },
  {
    id: 'trend-360-mainstream',
    title: '360° 全景从小众走向主力产品线',
    summary: '两家头部厂商都把 360° 机型放在旗舰位置，全景重构成为主流创作方式之一。',
    impact: 'medium',
    evidence: [
      sourced('DJI Osmo 360 主打 1 英寸级 360° 成像与最高 120MP（16K）全景照片。', [
        DJI_OSMO_360_PRESS,
      ]),
      sourced('影石 X5 用三 AI 芯片架构支撑 8K/30fps 360° 视频与 PureVideo 低光模式。', [
        INSTA360_X5_PRESS,
      ]),
      sourced('PCMag 把影石 X5 列为 360° 视频类别的首选推荐。', [PCMAG_BEST_ACTION_CAMERAS]),
    ],
    implication:
      '360° 的真实价值在于「先拍后构图」，尤其适合摩托与骑行这类无法边拍边调整构图的场景。但后期工作流较重，产品侧需要把重构做到足够自动化才能扩大受众。',
  },
  {
    id: 'trend-ai-processing',
    title: 'AI 降噪与自动成片成为软件竞争主线',
    summary: '算力从单纯支撑高分辨率转向弱光降噪、自动剪辑与智能取景，软件成为差异化的重要部分。',
    impact: 'high',
    evidence: [
      sourced('影石 Ace Pro 2 强调 AI 降噪与 13.5 档动态范围配合，提升弱光成片可用度。', [
        INSTA360_ACE_PRO_2_PRODUCT,
      ]),
      sourced('影石 X5 的 PureVideo 是基于三 AI 芯片的低光增强模式。', [INSTA360_X5_PRESS]),
      sourced('GoPro 用新 GP3 处理器同时提升分辨率、续航与热表现。', [GOPRO_MISSION_1_ANNOUNCE]),
    ],
    implication:
      '硬件参数趋同后，用户实际感知的差距更多来自算法。本品需要建立可量化的画质评估流程（客观指标 + 主观评分），否则难以判断算法迭代是否真的带来改善。',
  },
  {
    id: 'trend-product-cycle',
    title: '旗舰迭代节奏被拉长，产品窗口出现空档',
    summary: '部分预期中的换代产品推迟发布，头部厂商的迭代节奏不再稳定按年推进。',
    impact: 'low',
    evidence: [
      sourced('影石 Ace Pro 3 原预期 2026 年上半年发布，至 7 月底仍未官宣。', [
        REDSHARK_SUMMER_2026,
      ]),
      sourced('DJI Osmo Action 7 同样尚未发布。', [REDSHARK_SUMMER_2026]),
      sourced('GoPro 用 MISSION 1 系列开辟新产品线，HERO13 Black 转为中端定位。', [
        GOPRO_MISSION_1_PRICING,
      ]),
    ],
    implication:
      '竞品迭代放缓给本品留出了窗口期，但也说明该品类的硬件创新正在放慢。跟进节奏时应关注竞品在软件与配件生态上的持续更新，而非只盯发布会。',
  },
];

/**
 * 未官方确认的传闻与待观察项。
 * 独立分区，绝不与在售矩阵混排。
 */
export const RUMOR_ENTRIES: readonly RumorEntry[] = [
  {
    id: 'rumor-ace-pro-3',
    brand: 'insta360',
    subject: 'Insta360 Ace Pro 3',
    claim: sourced(
      '媒体此前预期在 2026 年上半年发布，截至 2026 年 7 月底仍未官宣，已超出预期窗口。',
      [REDSHARK_SUMMER_2026],
      '仅为媒体观察，影石官方未确认任何发布计划。',
    ),
    status: 'delayed',
  },
  {
    id: 'rumor-osmo-action-7',
    brand: 'dji',
    subject: 'DJI Osmo Action 7',
    claim: sourced(
      '媒体报道称仍未发布，相关消息处于传闻阶段。',
      [REDSHARK_SUMMER_2026],
      'DJI 官方未确认该产品存在。',
    ),
    status: 'unannounced',
  },
  {
    id: 'rumor-mission-1-pro-ils',
    brand: 'gopro',
    subject: 'GoPro MISSION 1 PRO ILS 上市时间',
    claim: sourced(
      '官方已公布定价 US$699.99，标注 2026 年第三季度上市，但具体开售日期尚未公布。',
      [GOPRO_MISSION_1_PRICING, DPREVIEW_MISSION_PRO_ILS],
      '定价与季度为官方信息；确切开售日期未公布，故列入待观察。',
    ),
    status: 'teased',
  },
];

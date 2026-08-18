import type { AudienceScenario } from '../types/audience';
import {
  REDDIT_ACTION_5_PRO_THREADS,
  REDDIT_EXTERNAL_POWER,
  REDDIT_GO_2_THREADS,
  REDDIT_HELMET_CAM_THREADS,
  REDDIT_HERO13_THREADS,
  REDDIT_MAX2_WIND_NOISE,
  REDDIT_MOTO_TOURING,
} from './sources';

/**
 * 人群场景与真实痛点。
 * 全部痛点来自社区讨论，保留原贴链接并转述大意，不逐字长段复制用户原文。
 * expectation 是编者基于痛点归纳的产品期待，属内部判断。
 */

export const AUDIENCE_SCENARIOS: readonly AudienceScenario[] = [
  {
    id: 'scenario-cycling-commute-record',
    audience: 'cycling',
    scenario: '通勤与长途骑行全程记录',
    context:
      '骑行者把相机装在车把、头盔或坐垫下，希望全程录制作为行车记录与事故取证依据。单次骑行常在 2 小时以上，长途更久。',
    painPoints: [
      {
        id: 'pain-cycling-battery',
        summary: '机内电池撑不完整段骑行，中途断录导致关键片段缺失。',
        workaround: '社区普遍建议直接接车载电源或外置电池，而不依赖机内电池。',
        relatedDimensions: ['battery'],
        source: REDDIT_EXTERNAL_POWER,
      },
      {
        id: 'pain-cycling-thermal',
        summary: '连续录制时机身发热，部分机型不到一小时即因过热停止工作。',
        workaround: '分段录制、避开日晒、或改用发热较低的机型。',
        relatedDimensions: ['battery', 'ruggedness'],
        source: REDDIT_GO_2_THREADS,
      },
      {
        id: 'pain-cycling-lowlight',
        summary: '夜骑与隧道等弱光环境下画面噪点重，车牌与路标难以辨认，削弱取证价值。',
        workaround: '换用大底机型，或依赖厂商的 AI 弱光模式。',
        relatedDimensions: ['lowLight'],
        source: REDDIT_HERO13_THREADS,
      },
    ],
    expectation:
      '需要边充边录且不显著加剧发热的供电方案，以及在弱光下仍能保留车牌级细节的画质表现。取证价值直接取决于这两点。',
    impact: 'high',
  },
  {
    id: 'scenario-cycling-helmet-framing',
    audience: 'cycling',
    scenario: '头盔机位构图与画面稳定',
    context: '头盔机位视角接近骑行者视线，是最自然的第一人称机位，但头部动作幅度远超预期。',
    painPoints: [
      {
        id: 'pain-helmet-shake',
        summary: '头部持续小幅晃动加上突然转头，画面构图难以稳定，后期难以修正。',
        workaround: '改用车把或胸带机位，或依赖电子防抖与地平线锁定。',
        relatedDimensions: ['stabilization'],
        source: REDDIT_HELMET_CAM_THREADS,
      },
      {
        id: 'pain-helmet-wind-noise',
        summary: '高速行进时风噪严重，即使不加配件也非常吵，人声几乎不可用。',
        workaround: '加装风罩、外接麦克风，或后期直接替换音轨。',
        relatedDimensions: [],
        source: REDDIT_MAX2_WIND_NOISE,
      },
    ],
    expectation:
      '防抖需要覆盖「持续微抖 + 突发大幅转向」两类运动，而非只优化匀速抖动。音频侧需要在真实高速场景下验证风噪抑制效果。',
    impact: 'high',
  },
  {
    id: 'scenario-motorcycle-touring',
    audience: 'motorcycle',
    scenario: '长途摩旅全程拍摄',
    context: '摩旅单日骑行时间长，相机长期暴露在阳光直射、高速气流与震动环境中。',
    painPoints: [
      {
        id: 'pain-moto-endurance',
        summary: '续航是首要约束，社区明确提出 4 小时以上的续航需求。',
        workaround: '接车电供电、备多块电池、或使用循环录制配合大容量存储。',
        relatedDimensions: ['battery'],
        source: REDDIT_MOTO_TOURING,
      },
      {
        id: 'pain-moto-thermal-sun',
        summary: '阳光直射下的散热是选机关键，过热停机会直接中断记录。',
        workaround: '选择热表现更好的机型，或调低分辨率与帧率。',
        relatedDimensions: ['battery', 'ruggedness'],
        source: REDDIT_MOTO_TOURING,
      },
      {
        id: 'pain-moto-crash-risk',
        summary: '摔车时相机与配件容易损坏，机位选择需要同时考虑事故风险。',
        workaround: '选择可更换镜头或镜片的机型，降低单次损坏的维修成本。',
        relatedDimensions: ['ruggedness'],
        source: REDDIT_MAX2_WIND_NOISE,
      },
    ],
    expectation:
      '这一人群把「能不能一直录下去」排在画质之前。供电、散热、循环录制三者需要作为一个整体方案设计，而不是分散的参数。',
    impact: 'high',
  },
  {
    id: 'scenario-wearable-pov',
    audience: 'family-pet',
    scenario: '佩戴式第一人称与低机位视角',
    context:
      '拇指相机可磁吸在衣领、背包带或宠物背带上，拍摄常规相机难以覆盖的视角，适合亲子与宠物日常记录。',
    painPoints: [
      {
        id: 'pain-wearable-dock-dependency',
        summary: '脱离扩展坞后续航明显缩短，社区反馈需要大约每小时回坞充电。',
        workaround: '随身携带扩展坞，或接受分段短时拍摄。',
        relatedDimensions: ['battery', 'portability'],
        source: REDDIT_ACTION_5_PRO_THREADS,
      },
      {
        id: 'pain-wearable-overheat',
        summary: '超轻机身散热面积有限，连续录制容易过热。',
        workaround: '缩短单次录制时长，避免日晒环境。',
        relatedDimensions: ['battery', 'ruggedness'],
        source: REDDIT_GO_2_THREADS,
      },
    ],
    expectation:
      '这一形态的用户接受短时拍摄，但不接受「不知道什么时候会停」。需要清晰的剩余录制时间提示与可预期的续航表现。',
    impact: 'medium',
  },
  {
    id: 'scenario-snow-highlight',
    audience: 'snow',
    scenario: '雪场高反光与低温环境拍摄',
    context: '雪地反光强烈、明暗对比极大，同时低温会显著影响电池表现。',
    painPoints: [
      {
        id: 'pain-snow-cold-battery',
        summary: '低温下电池容量衰减，实际可拍时长远低于标称。',
        workaround: '贴身保温、备用电池轮换，或选择标称耐低温的机型。',
        relatedDimensions: ['battery'],
        source: REDDIT_MOTO_TOURING,
      },
      {
        id: 'pain-snow-dynamic-range',
        summary: '雪面过曝与阴影死黑同时出现，动态范围不足时细节两头丢失。',
        workaround: '手动降低曝光补偿，或使用 HDR 与 Log 模式后期救回。',
        relatedDimensions: ['lowLight'],
        source: REDDIT_HERO13_THREADS,
      },
    ],
    expectation:
      '需要把低温续航作为独立的验证项，用实测而非标称值沟通。高反差场景的评估要同时看过曝占比与暗部细节，不能只看整体亮度。',
    impact: 'medium',
  },
  {
    id: 'scenario-water-diving',
    audience: 'water',
    scenario: '水下与水上运动拍摄',
    context: '浮潜、冲浪与水下拍摄要求可靠密封，同时水下偏色与光线衰减对画质构成额外挑战。',
    painPoints: [
      {
        id: 'pain-water-depth-rating',
        summary:
          '各机型防水深度差异大（10 米到 20 米不等），部分产品仅以使用限制描述而未给出米数，选型时难以判断。',
        workaround: '加装防水壳以获得确定的深度等级。',
        relatedDimensions: ['ruggedness'],
        source: REDDIT_MOTO_TOURING,
      },
    ],
    expectation:
      '防水能力必须以明确的深度等级沟通，模糊表述会直接导致用户损坏设备。产品页面应给出可核对的数值而非定性描述。',
    impact: 'medium',
  },
  {
    id: 'scenario-trail-running',
    audience: 'trail-running',
    scenario: '越野跑轻量化随身记录',
    context: '越野跑对重量极度敏感，跑者不愿为拍摄增加明显负重，同时上下起伏带来剧烈颠簸。',
    painPoints: [
      {
        id: 'pain-trail-weight',
        summary: '常规方块机加配件的重量在长距离奔跑中负担明显。',
        workaround: '改用 50g 级拇指相机，牺牲部分画质与续航。',
        relatedDimensions: ['portability'],
        source: REDDIT_GO_2_THREADS,
      },
      {
        id: 'pain-trail-vertical-shake',
        summary: '奔跑带来的垂直颠簸幅度大，防抖裁切后视角明显变窄。',
        workaround: '使用地平线锁定并接受视角损失。',
        relatedDimensions: ['stabilization'],
        source: REDDIT_HELMET_CAM_THREADS,
      },
    ],
    expectation:
      '轻量化不能只减重量，还要保证防抖裁切后仍有可用视角。需要给出防抖各档位对应的实际视角损失数据。',
    impact: 'medium',
  },
  {
    id: 'scenario-travel-vlog-delivery',
    audience: 'travel-vlog',
    scenario: '旅拍 Vlog 的横竖屏双版本交付',
    context: '创作者需要同时向横屏与竖屏平台分发，重复拍摄成本高，希望一次拍摄覆盖两种画幅。',
    painPoints: [
      {
        id: 'pain-vlog-dual-format',
        summary: '为兼顾横竖屏需要重复拍摄或大幅裁切，裁切后画质与构图都受损。',
        workaround: '用 open-gate 或方形画幅机型一次拍摄，后期分别重构。',
        relatedDimensions: ['creativeFlexibility'],
        source: REDDIT_HERO13_THREADS,
      },
    ],
    expectation:
      'open-gate 与方形画幅要在机内预览阶段就显示两种画幅的安全框，否则用户仍需靠猜测构图，硬件能力无法转化为效率。',
    impact: 'high',
  },
];

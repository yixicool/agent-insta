import { sourced } from '../types/provenance';
import type { PlayStyle } from '../types/play';
import {
  CINED_OSMO_NANO,
  DJI_ACTION_6_PRODUCT,
  DJI_NANO_STORE,
  DJI_OSMO_360_PRESS,
  DJI_OSMO_360_STORE,
  DJI_OSMO_PRODUCTS,
  DPREVIEW_MISSION_PRO_ILS,
  DPREVIEW_MISSION_SERIES,
  DPREVIEW_OSMO_NANO,
  GOPRO_HERO13_SPECS,
  INSTA360_ACE_PRO_2_PRESS,
  INSTA360_ACE_PRO_2_PRODUCT,
  INSTA360_GO_ULTRA_PRESS,
  INSTA360_X5_PRESS,
  PCMAG_BEST_ACTION_CAMERAS,
  PCMAG_OSMO_ACTION_6,
  REDDIT_EXTERNAL_POWER,
  REDDIT_MOTO_TOURING,
  TECHRADAR_OSMO_ACTION_6,
} from './sources';

/**
 * 玩法库：首页展示的「素材场景 + 具体拍法」。
 *
 * summary、steps、gearNote 是编者写的拍摄建议；
 * evidence 是可核对的真实产品能力或评测结论，说明这个玩法确实有机器支撑。
 * demands 是编者判断的能力依赖，用于把玩法反查到机型。
 */

export const PLAY_STYLES: readonly PlayStyle[] = [
  {
    id: 'play-tunnel-exposure',
    name: '隧道穿行的明暗急变',
    sceneLabel: '城市夜骑',
    audience: 'cycling',
    artKey: 'night-road',
    effort: 'moderate',
    summary:
      '冲进隧道口的一两秒里画面从暗到亮跳一整档，拍好了是很有张力的镜头，拍坏了就是一片死白加一片死黑。',
    steps: [
      '把相机固定在车把而不是头盔上，让地平线保持稳定，明暗变化才是画面的主角。',
      '锁定手动曝光并按隧道内的亮度设定，宁可让洞外稍微过曝，也不要让洞内全黑。',
      '有可变光圈就交给相机自动收放，没有就上 ND 滤镜控制洞外光量。',
      '进洞前保持匀速，不要边骑边调参数，事后再裁掉多余的部分。',
    ],
    demands: ['lowLight', 'stabilization', 'creativeFlexibility'],
    gearNote: '车把支架 + ND 滤镜（无可变光圈时）。头盔机位在这个玩法上不占优势。',
    evidence: [
      sourced('DJI Osmo Action 6 配备 f/2.0–f/4.0 可变光圈，可自动或手动调节进光量。', [
        DJI_OSMO_PRODUCTS,
        TECHRADAR_OSMO_ACTION_6,
      ]),
      sourced('影石 Ace Pro 2 以 13.5 档动态范围配合 AI 降噪提升弱光成片可用度。', [
        INSTA360_ACE_PRO_2_PRODUCT,
      ]),
    ],
  },
  {
    id: 'play-dual-format-vlog',
    name: '一次拍摄交付横屏与竖屏',
    sceneLabel: '旅拍 Vlog',
    audience: 'travel-vlog',
    artKey: 'dual-format',
    effort: 'moderate',
    summary: '同一段素材同时发长视频平台和短视频平台，不用为了竖屏重拍一遍，也不用把人裁掉一半。',
    steps: [
      '开启 open-gate 或方形画幅，让相机读出完整传感器面积。',
      '构图时把主体放在画面正中偏上，给上下左右都留出裁切余量。',
      '拍摄时按横屏取景，竖屏交给后期重新裁，而不是反过来。',
      '后期先导出横屏版本定剪辑点，再复制一条时间线改画幅，避免两版节奏不一致。',
    ],
    demands: ['creativeFlexibility', 'lowLight', 'portability'],
    gearNote: '需要机身支持 open-gate 或方形传感器；普通 16:9 机型做不到这个玩法。',
    evidence: [
      sourced('GoPro MISSION 1 系列全系支持 open-gate，PRO 型号可 8K open-gate。', [
        DPREVIEW_MISSION_SERIES,
        DPREVIEW_MISSION_PRO_ILS,
      ]),
      sourced('DJI Osmo Action 6 用方形传感器一次拍摄同时输出横竖构图。', [
        DJI_ACTION_6_PRODUCT,
        PCMAG_OSMO_ACTION_6,
      ]),
    ],
  },
  {
    id: 'play-invisible-selfie',
    name: '隐形自拍杆的第三人称跟拍',
    sceneLabel: '山路骑行与徒步',
    audience: 'cycling',
    artKey: 'panorama',
    effort: 'easy',
    summary:
      '360° 机型会把自拍杆从画面里抹掉，看上去像有个人举着相机在你旁边跟拍，是全景机最直观的玩法。',
    steps: [
      '把 360° 相机装在配套自拍杆上，杆身必须在两颗镜头的接缝位置。',
      '全程按全景录制，不要先选视角，视角留到后期再定。',
      '后期用重构工具拉出跟拍轨迹，一段素材可以导出好几个不同视角的版本。',
      '导出前确认接缝没有穿过人脸或主体，必要时把视角旋开一点。',
    ],
    demands: ['creativeFlexibility', 'stabilization', 'ruggedness'],
    gearNote: '必须是 360° 机型加配套自拍杆。后期导出比单镜头素材耗时明显更长。',
    evidence: [
      sourced('DJI Osmo 360 主打 8K 360° 拍摄与最高 120MP（16K）全景照片，后期裁切余量大。', [
        DJI_OSMO_360_PRESS,
        DJI_OSMO_360_STORE,
      ]),
      sourced('PCMag 把影石 X5 列为 360° 视频类别的首选推荐。', [PCMAG_BEST_ACTION_CAMERAS]),
    ],
  },
  {
    id: 'play-wearable-pov',
    name: '磁吸在衣领上的免持第一视角',
    sceneLabel: '亲子与宠物日常',
    audience: 'family-pet',
    artKey: 'wearable',
    effort: 'easy',
    summary:
      '50g 级的机身直接吸在衣领或宠物背带上，不用举着也不用架三脚架，拍到的是真正的日常视角。',
    steps: [
      '把磁吸底座扣在衣领内侧，机身吸在外侧，位置越靠中间画面越正。',
      '按分段拍摄而不是一路长录，超轻机身的电量和发热都撑不住长时间连拍。',
      '带上扩展坞随时补电，社区反馈脱坞后大约每小时就要回坞一次。',
      '拍完当天就导出，机内存储容量有限，覆盖掉就找不回来了。',
    ],
    demands: ['portability', 'lowLight', 'battery'],
    gearNote: '拇指形态机型 + 磁吸底座。续航是这个玩法的主要限制，不是画质。',
    evidence: [
      sourced('DJI Osmo Nano 相机主体仅 52g，可磁吸佩戴。', [DPREVIEW_OSMO_NANO, DJI_NANO_STORE]),
      sourced('影石 GO Ultra 主体 53g，内置磁吸底座，可佩戴到常规相机难固定的位置。', [
        INSTA360_GO_ULTRA_PRESS,
      ]),
    ],
  },
  {
    id: 'play-snow-glare',
    name: '雪面高反光下保住两头细节',
    sceneLabel: '雪场滑行',
    audience: 'snow',
    artKey: 'snow-glare',
    effort: 'advanced',
    summary:
      '雪面白得发光、树影黑成一片，同一个画面里两头都要留住细节，这是动态范围最难的场景之一。',
    steps: [
      '用 Log 或 HDR 模式拍摄，宁可素材看起来发灰，也不要在机内就把高光烧掉。',
      '曝光按雪面来定，让雪保持在接近过曝但还没到纯白的位置。',
      '电池贴身放，低温会让实际可拍时长明显短于标称值。',
      '后期先压高光再提暗部，顺序反了噪点会很难看。',
    ],
    demands: ['lowLight', 'battery', 'ruggedness'],
    gearNote: '备用电池必须贴身保温。Log 素材需要后期调色，不调色直接发反而更难看。',
    evidence: [
      sourced('影石 Ace Pro 2 官方标注 13.5 档动态范围，用于高反差场景。', [
        INSTA360_ACE_PRO_2_PRESS,
      ]),
      sourced('DJI Osmo Action 6 官方标注耐低温与约 4 小时续航。', [DJI_OSMO_PRODUCTS]),
      sourced('社区讨论指出低温下电池容量衰减，实际可拍时长低于标称。', [REDDIT_MOTO_TOURING]),
    ],
  },
  {
    id: 'play-underwater-color',
    name: '水下找回被吃掉的红色',
    sceneLabel: '浮潜与水下',
    audience: 'water',
    artKey: 'underwater',
    effort: 'advanced',
    summary:
      '水会先吃掉红色，越深画面越偏青蓝。想拍出接近眼睛看到的颜色，靠的是下水前的准备而不是后期。',
    steps: [
      '确认机身防水深度等级，不确定就加防水壳，别拿模糊的描述赌设备。',
      '浅于 5 米可以只靠白平衡校正，更深就要上红色滤镜补回损失的波段。',
      '尽量顺光拍并靠近主体，水里每多一米距离都会让颜色和清晰度打折。',
      '同一场景多拍几条不同白平衡的版本，水下没法回看确认颜色对不对。',
    ],
    demands: ['ruggedness', 'lowLight', 'creativeFlexibility'],
    gearNote: '红色滤镜 + 明确的防水深度等级。部分机型只给防水描述不给米数，这类要额外谨慎。',
    evidence: [
      sourced('影石 X5 官方标注 15 米（IPX8）防水，且镜头可更换降低刮花损失。', [
        INSTA360_X5_PRESS,
      ]),
      sourced('DJI Osmo Action 6 官方标注 20 米机身防水。', [DJI_OSMO_PRODUCTS]),
    ],
  },
  {
    id: 'play-touring-longform',
    name: '摩旅整天不断录',
    sceneLabel: '长途摩旅',
    audience: 'motorcycle',
    artKey: 'touring',
    effort: 'moderate',
    summary: '整天骑下来要有连续可用的素材，也要在真出事时有记录。这个玩法拼的不是画质，是不中断。',
    steps: [
      '接车电供电，不要指望机内电池撑完一天，社区的常规做法就是外接。',
      '开循环录制并配大容量存储卡，让最新的素材始终覆盖最旧的。',
      '相机避开阳光直射的位置，过热停机比电量耗尽更常见。',
      '装风罩再出发，高速下的风噪会让人声完全不可用。',
    ],
    demands: ['battery', 'ruggedness', 'stabilization'],
    gearNote: '车电供电线 + 大容量存储卡 + 风罩。机位要同时考虑摔车时的损坏风险。',
    evidence: [
      sourced('社区讨论把续航与散热列为长途摩托拍摄的首要约束，明确提出 4 小时以上续航需求。', [
        REDDIT_MOTO_TOURING,
      ]),
      sourced('社区建议长时间录制直接接车电供电，而非依赖机内电池。', [REDDIT_EXTERNAL_POWER]),
    ],
  },
  {
    id: 'play-trail-lightweight',
    name: '越野跑不增负重的随身记录',
    sceneLabel: '越野跑',
    audience: 'trail-running',
    artKey: 'trail',
    effort: 'easy',
    summary: '跑者对重量极度敏感，几十克的差别在几十公里后是能感觉到的。轻是这个玩法的第一约束。',
    steps: [
      '选拇指形态机身并吸在背包肩带上，不要用头盔或胸带那套配件。',
      '开地平线锁定，垂直颠簸靠防抖处理，代价是视角变窄，提前构图时留余量。',
      '按上下坡的节点分段录，不追求全程连续。',
      '接受画质不如方块机，这个玩法换来的是「你真的会带上它」。',
    ],
    demands: ['portability', 'stabilization', 'battery'],
    gearNote: '拇指机型 + 肩带磁吸。防抖裁切后视角会明显变窄，这是必须接受的代价。',
    evidence: [
      sourced('影石 GO Ultra 主体 53g，内置磁吸底座。', [INSTA360_GO_ULTRA_PRESS]),
      sourced('DJI Osmo Nano 相机主体 52g，为当前最轻的一档。', [DPREVIEW_OSMO_NANO]),
    ],
  },
  {
    id: 'play-log-grading',
    name: '用 Log 素材做电影感调色',
    sceneLabel: '专业短片',
    audience: 'pro-filmmaking',
    artKey: 'cinema',
    effort: 'advanced',
    summary:
      '10bit Log 保留了更多明暗与色彩信息，代价是必须调色。愿意花后期时间的话，成片质感和直出完全不是一个级别。',
    steps: [
      '用 D-Log M 一类的 Log 模式拍摄，欠曝比过曝更容易救回来。',
      '同一场景先拍一段灰卡或白墙，后期还原白平衡有据可依。',
      '后期先套官方 LUT 回到正常观感，再在这个基础上做风格化。',
      '多机位混剪时统一色彩管线，不同机型的 Log 曲线不能直接互换 LUT。',
    ],
    demands: ['lowLight', 'creativeFlexibility', 'stabilization'],
    gearNote: '需要机身支持 10bit Log。不打算调色的话，这个玩法只会让画面发灰。',
    evidence: [
      sourced('DJI Osmo Nano 支持 4K/120fps 与 10bit D-Log M。', [CINED_OSMO_NANO, DJI_NANO_STORE]),
      sourced('GoPro MISSION 1 PRO ILS 支持更换镜头，官方定位影视创作者。', [
        DPREVIEW_MISSION_PRO_ILS,
      ]),
    ],
  },
  {
    id: 'play-telemetry-overlay',
    name: '把速度与轨迹烧进画面',
    sceneLabel: '骑行与赛事记录',
    audience: 'cycling',
    artKey: 'telemetry',
    effort: 'moderate',
    summary:
      '画面角上挂着实时速度、海拔和轨迹图，一段普通的骑行素材立刻变成有信息量的记录，也方便复盘。',
    steps: [
      '拍摄前确认机内 GPS 已定位完成，没定位到就不会有数据。',
      '起步前先静置十几秒，让轨迹起点落在正确位置。',
      '后期用官方软件把数据叠加上去，叠加层放在不挡主体的画面角落。',
      '想加心率或功率就要提前连好第三方设备，事后补不上。',
    ],
    demands: ['battery', 'creativeFlexibility', 'stabilization'],
    gearNote: 'GPS 会额外耗电，长途场景要和供电方案一起考虑。',
    evidence: [sourced('GoPro HERO13 Black 内置 GPS 与数据叠加功能。', [GOPRO_HERO13_SPECS])],
  },
];

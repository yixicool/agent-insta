import type { SceneArtKey } from '../types/play';

/**
 * 图片版权声明：场景插画（玩法卡背景）与机型产品图两套素材，
 * 语义不同，登记结构分开，互不影响。
 *
 * 场景图片均来自品牌官方营销素材，版权归各品牌所有，
 * 本项目仅用于非商业性产品选型参考，不对图片进行二次加工或商业使用。
 *
 * 机型产品图均来自各品牌官网产品页，版权归各品牌所有，不逐张标注具体采集日期。
 * 新增图片时：图片存入 `public/images/products/`（复数 images，与场景图的
 * `public/image/products/` 单数目录不是同一处，不要混用），在
 * `src/data/competitors.ts` 把对应机型的 `imagePath` 从 `null` 改成实际路径，
 * 并在下方 `PRODUCT_IMAGE_CREDITS` 补一条登记。
 */

export interface ImageCredit {
  /** 场景键 */
  readonly key: SceneArtKey;
  /** 图片文件名（不含路径） */
  readonly filename: string;
  /** 版权归属（品牌名称） */
  readonly copyright: string;
  /** 用途说明 */
  readonly usage: string;
}

export const IMAGE_CREDITS: readonly ImageCredit[] = [
  {
    key: 'night-road',
    filename: 'night-road.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '夜间道路拍摄场景示意',
  },
  {
    key: 'dual-format',
    filename: 'dual-format.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '横竖双构图拍摄场景示意',
  },
  {
    key: 'panorama',
    filename: 'panorama.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '360度全景拍摄场景示意',
  },
  {
    key: 'wearable',
    filename: 'wearable.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '可穿戴磁吸拍摄场景示意',
  },
  {
    key: 'snow-glare',
    filename: 'snow-glare.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '雪地高反差拍摄场景示意',
  },
  {
    key: 'underwater',
    filename: 'underwater.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '水下拍摄场景示意',
  },
  {
    key: 'touring',
    filename: 'touring.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '长途骑行拍摄场景示意',
  },
  {
    key: 'trail',
    filename: 'trail.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '越野跑拍摄场景示意',
  },
  {
    key: 'cinema',
    filename: 'cinema.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '电影感画幅拍摄场景示意',
  },
  {
    key: 'telemetry',
    filename: 'telemetry.jpg',
    copyright: 'DJI / Insta360 / GoPro',
    usage: '数据叠加拍摄场景示意',
  },
];

/** 机型产品图版权登记，key 为 `CompetitorModel.id` */
export interface ProductImageCredit {
  /** 对应的机型 id */
  readonly modelId: string;
  /** 图片文件名（不含路径） */
  readonly filename: string;
  /** 版权归属（品牌名称） */
  readonly copyright: string;
  /** 该品牌官网产品页地址，供核对图片出处 */
  readonly sourceUrl: string;
}

export const PRODUCT_IMAGE_CREDITS: readonly ProductImageCredit[] = [
  {
    modelId: 'dji-osmo-action-6',
    filename: 'dji-osmo-action-6.png',
    copyright: 'DJI',
    sourceUrl: 'https://www.dji.com/global/osmo-action-6',
  },
  {
    modelId: 'dji-osmo-360',
    filename: 'dji-osmo-360.png',
    copyright: 'DJI',
    sourceUrl: 'https://store.dji.com/product/osmo-360-standard-combo',
  },
  {
    modelId: 'dji-osmo-nano',
    filename: 'dji-osmo-nano.png',
    copyright: 'DJI',
    sourceUrl: 'https://www.djiusa.com/products/osmo-nano-standard-combo-128gb',
  },
  {
    modelId: 'insta360-ace-pro-2',
    filename: 'insta360-ace-pro-2.png',
    copyright: 'Insta360',
    sourceUrl: 'https://www.insta360.com/product/insta360-ace-pro2',
  },
  {
    modelId: 'insta360-x5',
    filename: 'insta360-x5.png',
    copyright: 'Insta360',
    sourceUrl: 'https://www.insta360.com/us/specs/x5',
  },
  {
    modelId: 'insta360-go-ultra',
    filename: 'insta360-go-ultra.png',
    copyright: 'Insta360',
    sourceUrl: 'https://store.insta360.com/product/go-ultra/',
  },
  {
    modelId: 'gopro-mission-1-pro',
    filename: 'gopro-mission-1-pro.png',
    copyright: 'GoPro',
    sourceUrl: 'https://gopro.com/en/us/shop/buy-cameras/mission-1-series',
  },
  {
    modelId: 'gopro-mission-1',
    filename: 'gopro-mission-1.png',
    copyright: 'GoPro',
    sourceUrl: 'https://gopro.com/en/us/shop/buy-cameras/mission-1-series',
  },
  {
    modelId: 'gopro-hero13-black',
    filename: 'gopro-hero13-black.png',
    copyright: 'GoPro',
    sourceUrl:
      'https://gopro.com/en/do/shop/cameras/buy/hero13black/CHDHX-131-master.html?tab=tech-specs',
  },
];

/** 页脚统一版权声明文本 */
export const IMAGE_COPYRIGHT_NOTICE =
  '场景图片来自 DJI、Insta360、GoPro 官方营销素材，版权归各品牌所有；如已收录机型产品图，同样版权归各品牌所有。本站仅用于非商业性产品选型参考。';

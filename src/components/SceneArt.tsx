import type { ReactNode } from 'react';
import type { SceneArtKey } from '../types/play';

/**
 * 玩法卡的场景图片。
 *
 * 使用品牌官方营销照片展示真实拍摄效果；图片存放于 public/image/products/，
 * 版权归各品牌所有，详见 src/data/image-credits.ts。
 *
 * 图片通过 object-fit: cover 保证卡片内高度一致，避免因原始比例不同导致参差。
 */

const IMAGE_ALT: Readonly<Record<SceneArtKey, string>> = {
  'night-road': '夜间道路拍摄场景',
  'dual-format': '横竖双构图拍摄场景',
  panorama: '360度全景拍摄场景',
  wearable: '可穿戴磁吸拍摄场景',
  'snow-glare': '雪地高反差拍摄场景',
  underwater: '水下拍摄场景',
  touring: '长途骑行拍摄场景',
  trail: '越野跑拍摄场景',
  cinema: '电影感画幅拍摄场景',
  telemetry: '数据叠加拍摄场景',
};

/** 已实现场景图片的形态键，供数据完整性测试核对玩法数据 */
export const SCENE_ART_KEYS: readonly SceneArtKey[] = [
  'night-road',
  'dual-format',
  'panorama',
  'wearable',
  'snow-glare',
  'underwater',
  'touring',
  'trail',
  'cinema',
  'telemetry',
];

export interface SceneArtProps {
  readonly artKey: SceneArtKey;
  /** 额外的容器样式，用于控制卡片里的高度 */
  readonly className?: string;
}

export function SceneArt({ artKey, className = 'h-28 w-full' }: SceneArtProps): ReactNode {
  return (
    <img
      src={`/image/products/${artKey}.jpg`}
      alt={IMAGE_ALT[artKey]}
      role="img"
      className={`block rounded-[var(--radius-control)] object-cover ${className}`}
      loading="lazy"
    />
  );
}

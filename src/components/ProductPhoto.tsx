import { useState, type ReactNode } from 'react';
import { FormFactorGlyph } from './PageHeader';
import { BRAND_LABELS, type CompetitorModel } from '../types/competitor';

/**
 * 机型产品图。有登记的真实图片路径就展示图片，
 * 没有登记或图片加载失败（路径失效、文件缺失）时退回自绘形态示意图，
 * 保证任何时刻都不会出现破图或死链。
 */

export interface ProductPhotoProps {
  readonly model: CompetitorModel;
  readonly className?: string;
}

const DEFAULT_CLASSES = 'size-12 shrink-0 rounded-[var(--radius-control)] object-cover';

export function ProductPhoto({ model, className = DEFAULT_CLASSES }: ProductPhotoProps): ReactNode {
  const [failed, setFailed] = useState(false);

  if (model.imagePath === null || failed) {
    return <FormFactorGlyph formFactor={model.formFactor} />;
  }

  return (
    <img
      src={model.imagePath}
      alt={`${BRAND_LABELS[model.brand]} ${model.name} 官方产品图`}
      loading="lazy"
      className={className}
      onError={() => {
        setFailed(true);
      }}
    />
  );
}

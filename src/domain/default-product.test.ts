import { describe, expect, it } from 'vitest';
import { resolveActiveProduct, resolveDefaultProduct } from './default-product';
import { EMPTY_CRITERIA, recommendProducts } from './product-recommendation';
import { COMPETITOR_MODELS } from '../data/competitors';

/** 未选条件时推荐第一名，用作兜底机型的期望值 */
const TOP_MODEL_ID = recommendProducts(COMPETITOR_MODELS, EMPTY_CRITERIA)[0]?.model.id ?? '';

describe('resolveDefaultProduct', () => {
  it('没有历史记录时落到推荐第一名', () => {
    expect(resolveDefaultProduct(COMPETITOR_MODELS, null)).toEqual({
      productId: TOP_MODEL_ID,
      isFallback: true,
    });
  });

  it('优先使用上次浏览过的机型', () => {
    expect(resolveDefaultProduct(COMPETITOR_MODELS, 'gopro-hero13-black')).toEqual({
      productId: 'gopro-hero13-black',
      isFallback: true,
    });
  });

  it('历史机型已不在库中时回落到推荐第一名', () => {
    expect(resolveDefaultProduct(COMPETITOR_MODELS, 'no-longer-sold')).toEqual({
      productId: TOP_MODEL_ID,
      isFallback: true,
    });
  });

  it('机型库为空时没有可去的机型', () => {
    expect(resolveDefaultProduct([], 'gopro-hero13-black')).toEqual({
      productId: null,
      isFallback: false,
    });
  });
});

describe('resolveActiveProduct', () => {
  it('本次会话显式选过的机型优先，且不算兜底', () => {
    expect(resolveActiveProduct(COMPETITOR_MODELS, 'insta360-x5', 'gopro-hero13-black')).toEqual({
      productId: 'insta360-x5',
      isFallback: false,
    });
  });

  it('本次未选时退回历史机型并标记为兜底', () => {
    expect(resolveActiveProduct(COMPETITOR_MODELS, null, 'insta360-x5')).toEqual({
      productId: 'insta360-x5',
      isFallback: true,
    });
  });

  it('显式选择的机型不存在时同样走兜底逻辑', () => {
    expect(resolveActiveProduct(COMPETITOR_MODELS, 'not-a-camera', null)).toEqual({
      productId: TOP_MODEL_ID,
      isFallback: true,
    });
  });
});

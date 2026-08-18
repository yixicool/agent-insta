import { EMPTY_CRITERIA, recommendProducts } from './product-recommendation';
import type { CompetitorModel } from '../types/competitor';

/**
 * 「第二步该落到哪台机型」的决策。
 *
 * 导航必须始终回答「我能去哪」，因此产品工作区这一步不能是死链：
 * 用户还没显式选过机型时，也要有一台可去的默认机型。
 *
 * 纯函数，机型库与已存 id 都由调用方传入，便于直接单测。
 */

export interface DefaultProductChoice {
  /** 机型库为空时为 null，此时第二步只能退回选产品页 */
  readonly productId: string | null;
  /**
   * true 表示这不是用户本次会话显式选的机型，
   * 页面需要提示「这是默认机型，可回首页重选」。
   */
  readonly isFallback: boolean;
}

const NO_PRODUCT: DefaultProductChoice = { productId: null, isFallback: false };

/**
 * 决定默认机型。优先用上次浏览过的机型，它已不在库中（下架或数据更新）时
 * 回落到当前推荐第一名——复用首页那套已对用户公开的加权算式，不新增排序口径。
 */
export function resolveDefaultProduct(
  models: readonly CompetitorModel[],
  storedProductId: string | null,
): DefaultProductChoice {
  if (models.length === 0) {
    return NO_PRODUCT;
  }

  if (storedProductId !== null && models.some((model) => model.id === storedProductId)) {
    return { productId: storedProductId, isFallback: true };
  }

  const top = recommendProducts(models, EMPTY_CRITERIA)[0];
  if (top === undefined) {
    return NO_PRODUCT;
  }
  return { productId: top.model.id, isFallback: true };
}

/**
 * 结合本次会话的显式选择得出最终要去的机型。
 * 显式选过就用它，且不再提示默认机型。
 */
export function resolveActiveProduct(
  models: readonly CompetitorModel[],
  pickedProductId: string | null,
  storedProductId: string | null,
): DefaultProductChoice {
  if (pickedProductId !== null && models.some((model) => model.id === pickedProductId)) {
    return { productId: pickedProductId, isFallback: false };
  }
  return resolveDefaultProduct(models, storedProductId);
}

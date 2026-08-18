import { useCallback, useEffect, useState } from 'react';

/**
 * 自建 hash 路由。用 hash 而非 history 是为了免除服务端 rewrite，
 * Vercel 与任意静态托管都能直接工作。
 *
 * 站点主线是「先看能拍出什么，再挑机器，再跟踪它表现如何」，
 * 因此 product 与 monitor 路由都带一个机型 id 段：
 * '#/product/dji-osmo-action-6'、'#/monitor/dji-osmo-action-6'。
 */

export const ROUTE_IDS = ['home', 'picker', 'product', 'monitor', 'my'] as const;
export type RouteId = (typeof ROUTE_IDS)[number];

export const DEFAULT_ROUTE: RouteId = 'home';

/** 需要机型段的路由 */
const PRODUCT_SCOPED_ROUTES: readonly RouteId[] = ['product', 'monitor'];

/** 当前地址的解析结果。productId 仅在带机型段的路由下有值。 */
export interface Route {
  readonly id: RouteId;
  readonly productId: string | null;
}

function isRouteId(value: string): value is RouteId {
  return (ROUTE_IDS as readonly string[]).includes(value);
}

function isProductScoped(id: RouteId): boolean {
  return PRODUCT_SCOPED_ROUTES.includes(id);
}

/** 机型 id 形如 'dji-osmo-action-6'，只允许小写字母、数字与连字符 */
const PRODUCT_ID_PATTERN = /^[a-z0-9-]+$/;

export function isValidProductId(value: string): boolean {
  return PRODUCT_ID_PATTERN.test(value);
}

/**
 * 从 '#/product/dji-osmo-360' 解析出路由与机型 id。
 * 无法识别时返回 null，交由上层提示，而不是静默回落。
 */
export function parseHash(hash: string): Route | null {
  const withoutQuery = hash.replace(/^#\/?/, '').split('?')[0] ?? '';
  if (withoutQuery === '') {
    return { id: DEFAULT_ROUTE, productId: null };
  }

  const segments = withoutQuery.split('/').filter((segment) => segment !== '');
  const [head, second, ...rest] = segments;
  if (head === undefined || !isRouteId(head) || rest.length > 0) {
    return null;
  }

  if (!isProductScoped(head)) {
    // 不带机型段的路由不接受额外段，避免 '#/my/anything' 被当成合法地址
    return second === undefined ? { id: head, productId: null } : null;
  }
  if (second === undefined) {
    // 少了机型段时回到挑机型页比报错更符合预期
    return { id: 'picker', productId: null };
  }
  return isValidProductId(second) ? { id: head, productId: second } : null;
}

/** 把路由转回可复制、可收藏的地址 */
export function buildHash(route: Route): string {
  if (isProductScoped(route.id) && route.productId !== null) {
    return `#/${route.id}/${route.productId}`;
  }
  return `#/${route.id}`;
}

export interface HashRoute {
  readonly route: Route;
  /** 上一次地址无法识别时的提示文案，正常导航为 null */
  readonly unknownHash: string | null;
  readonly navigate: (next: Route) => void;
}

function readCurrentHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash;
}

const FALLBACK_ROUTE: Route = { id: DEFAULT_ROUTE, productId: null };

export function useHashRoute(): HashRoute {
  const [hash, setHash] = useState<string>(readCurrentHash);

  useEffect(() => {
    const onHashChange = (): void => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = buildHash(next);
  }, []);

  const parsed = parseHash(hash);
  return {
    route: parsed ?? FALLBACK_ROUTE,
    unknownHash: parsed === null ? hash : null,
    navigate,
  };
}

import { describe, expect, it } from 'vitest';
import { DEFAULT_ROUTE, ROUTE_IDS, buildHash, isValidProductId, parseHash } from './use-hash-route';

describe('parseHash', () => {
  it('resolves each route that carries no product segment', () => {
    expect(parseHash('#/home')).toEqual({ id: 'home', productId: null });
    expect(parseHash('#/picker')).toEqual({ id: 'picker', productId: null });
    expect(parseHash('#/my')).toEqual({ id: 'my', productId: null });
  });

  it('reads the model id out of the product-scoped routes', () => {
    expect(parseHash('#/product/dji-osmo-action-6')).toEqual({
      id: 'product',
      productId: 'dji-osmo-action-6',
    });
    expect(parseHash('#/monitor/dji-osmo-action-6')).toEqual({
      id: 'monitor',
      productId: 'dji-osmo-action-6',
    });
  });

  it('accepts a hash without the leading slash', () => {
    expect(parseHash('#picker')).toEqual({ id: 'picker', productId: null });
  });

  it('falls back to the default route for an empty hash', () => {
    for (const hash of ['', '#', '#/']) {
      expect(parseHash(hash)).toEqual({ id: DEFAULT_ROUTE, productId: null });
    }
  });

  it('sends a product-scoped route with no model id back to the picker', () => {
    expect(parseHash('#/product')).toEqual({ id: 'picker', productId: null });
    expect(parseHash('#/monitor')).toEqual({ id: 'picker', productId: null });
  });

  it('ignores a query string suffix', () => {
    expect(parseHash('#/my?id=note-1')).toEqual({ id: 'my', productId: null });
  });

  it('returns null for an unknown route so the UI can warn', () => {
    expect(parseHash('#/nope')).toBeNull();
    expect(parseHash('#/studio')).toBeNull();
  });

  it('rejects extra segments', () => {
    expect(parseHash('#/my/extra')).toBeNull();
    expect(parseHash('#/product/dji-osmo-360/extra')).toBeNull();
  });

  it('rejects a model id containing unexpected characters', () => {
    expect(parseHash('#/product/DJI_Osmo')).toBeNull();
    expect(parseHash('#/product/../secret')).toBeNull();
    expect(parseHash('#/monitor/DJI_Osmo')).toBeNull();
  });
});

describe('buildHash', () => {
  it('round-trips every route without a product segment', () => {
    for (const id of ROUTE_IDS) {
      if (id === 'product' || id === 'monitor') {
        continue;
      }
      const route = { id, productId: null } as const;
      expect(parseHash(buildHash(route))).toEqual(route);
    }
  });

  it('round-trips the product-scoped routes', () => {
    for (const id of ['product', 'monitor'] as const) {
      const route = { id, productId: 'insta360-x5' } as const;
      expect(buildHash(route)).toBe(`#/${id}/insta360-x5`);
      expect(parseHash(buildHash(route))).toEqual(route);
    }
  });

  it('drops the segment when a product-scoped route has no model id', () => {
    expect(buildHash({ id: 'product', productId: null })).toBe('#/product');
  });

  it('ignores a stray product id on a route that does not take one', () => {
    expect(buildHash({ id: 'my', productId: 'insta360-x5' })).toBe('#/my');
  });
});

describe('isValidProductId', () => {
  it('accepts lowercase kebab-case ids', () => {
    expect(isValidProductId('gopro-hero13-black')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidProductId('GoPro')).toBe(false);
    expect(isValidProductId('a/b')).toBe(false);
    expect(isValidProductId('')).toBe(false);
  });
});

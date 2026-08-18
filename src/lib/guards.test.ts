import { describe, expect, it } from 'vitest';
import {
  isArrayOf,
  isBoolean,
  isFiniteNumber,
  isHttpUrl,
  isIsoDate,
  isIsoTimestamp,
  isNullOr,
  isOneOf,
  isRecord,
  isScoreInRange,
  isString,
  isStringArray,
  readField,
} from './guards';

describe('primitive guards', () => {
  it('accepts plain objects only', () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('x')).toBe(false);
  });

  it('rejects non-finite numbers', () => {
    expect(isFiniteNumber(1.5)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isFiniteNumber('1')).toBe(false);
  });

  it('checks strings and booleans', () => {
    expect(isString('')).toBe(true);
    expect(isString(0)).toBe(false);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(0)).toBe(false);
  });
});

describe('array guards', () => {
  it('validates string arrays including the empty array', () => {
    expect(isStringArray([])).toBe(true);
    expect(isStringArray(['a', 'b'])).toBe(true);
    expect(isStringArray(['a', 1])).toBe(false);
    expect(isStringArray('ab')).toBe(false);
  });

  it('validates arrays with a custom item guard', () => {
    expect(isArrayOf([1, 2], isFiniteNumber)).toBe(true);
    expect(isArrayOf([1, '2'], isFiniteNumber)).toBe(false);
  });
});

describe('isOneOf', () => {
  const rings = ['adopt', 'trial'] as const;

  it('narrows to allowed literals', () => {
    expect(isOneOf('adopt', rings)).toBe(true);
    expect(isOneOf('hold', rings)).toBe(false);
    expect(isOneOf(1, rings)).toBe(false);
  });
});

describe('isNullOr', () => {
  it('accepts null and matching values', () => {
    expect(isNullOr(null, isString)).toBe(true);
    expect(isNullOr('x', isString)).toBe(true);
    expect(isNullOr(1, isString)).toBe(false);
    expect(isNullOr(undefined, isString)).toBe(false);
  });
});

describe('readField', () => {
  it('returns the value when the guard passes', () => {
    expect(readField({ name: 'X5' }, 'name', isString)).toBe('X5');
  });

  it('returns undefined for missing or mistyped fields', () => {
    expect(readField({ name: 1 }, 'name', isString)).toBeUndefined();
    expect(readField({}, 'name', isString)).toBeUndefined();
  });
});

describe('date guards', () => {
  it('accepts strict yyyy-mm-dd only', () => {
    expect(isIsoDate('2026-08-05')).toBe(true);
    expect(isIsoDate('2026-8-5')).toBe(false);
    expect(isIsoDate('2026-08-05T00:00:00Z')).toBe(false);
    expect(isIsoDate('未公开')).toBe(false);
  });

  it('rejects impossible calendar dates', () => {
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-02-31')).toBe(false);
  });

  it('accepts full timestamps', () => {
    expect(isIsoTimestamp('2026-08-05T12:30:00.000Z')).toBe(true);
    expect(isIsoTimestamp('not-a-date')).toBe(false);
  });
});

describe('isHttpUrl', () => {
  it('accepts http and https', () => {
    expect(isHttpUrl('https://www.dji.com/osmo-action-6')).toBe(true);
    expect(isHttpUrl('http://example.com')).toBe(true);
  });

  it('blocks dangerous and malformed schemes', () => {
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('data:text/html,<script>')).toBe(false);
    expect(isHttpUrl('/relative/path')).toBe(false);
    expect(isHttpUrl(42)).toBe(false);
  });
});

describe('isScoreInRange', () => {
  it('enforces inclusive bounds', () => {
    expect(isScoreInRange(1, 1, 5)).toBe(true);
    expect(isScoreInRange(5, 1, 5)).toBe(true);
    expect(isScoreInRange(0, 1, 5)).toBe(false);
    expect(isScoreInRange(6, 1, 5)).toBe(false);
    expect(isScoreInRange('3', 1, 5)).toBe(false);
  });
});

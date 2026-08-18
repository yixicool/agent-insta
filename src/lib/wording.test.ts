import { describe, expect, it } from 'vitest';
import { GENERAL_WORDING, describeCapabilityLevel, describeSeverityLevel } from './wording';

describe('describeCapabilityLevel', () => {
  it('maps 0-100 scores to readable tiers', () => {
    expect(describeCapabilityLevel(95)).toBe('第一梯队');
    expect(describeCapabilityLevel(90)).toBe('第一梯队');
    expect(describeCapabilityLevel(80)).toBe('较强');
    expect(describeCapabilityLevel(65)).toBe('中等');
    expect(describeCapabilityLevel(40)).toBe('偏弱');
  });

  it('reports unevaluated for non-finite scores', () => {
    expect(describeCapabilityLevel(Number.NaN)).toBe('未评估');
  });
});

describe('describeSeverityLevel', () => {
  it('maps 1-5 severity to plain wording', () => {
    expect(describeSeverityLevel(5)).toBe('完全没法用');
    expect(describeSeverityLevel(4)).toBe('明显影响');
    expect(describeSeverityLevel(3)).toBe('有点影响');
    expect(describeSeverityLevel(2)).toBe('轻微');
    expect(describeSeverityLevel(1)).toBe('几乎无感');
  });

  it('reports unevaluated for non-finite input', () => {
    expect(describeSeverityLevel(Number.NaN)).toBe('未评估');
  });
});

describe('术语表完整性', () => {
  it('每条措辞都有大白话、术语与口径说明', () => {
    for (const [key, wording] of Object.entries(GENERAL_WORDING)) {
      expect(wording.plain.trim(), `${key} 缺少大白话说法`).not.toBe('');
      expect(wording.technical.trim(), `${key} 缺少专业术语`).not.toBe('');
      expect(wording.explain.trim(), `${key} 缺少口径说明`).not.toBe('');
    }
  });

  it('大白话说法不与专业术语完全相同，否则注解没有意义', () => {
    for (const [key, wording] of Object.entries(GENERAL_WORDING)) {
      expect(wording.plain, `${key} 的大白话与术语相同`).not.toBe(wording.technical);
    }
  });
});

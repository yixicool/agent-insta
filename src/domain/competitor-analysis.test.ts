import { describe, expect, it } from 'vitest';
import {
  CAPABILITY_DIMENSIONS,
  SCORING_NOTE,
  computeDimensionAverage,
  computeOverallScore,
  findDimensionLeader,
  scoreCapabilityDimensions,
} from './competitor-analysis';
import { COMPETITOR_MODELS } from '../data/competitors';
import { CAPABILITY_LABELS } from '../types/competitor';
import { FLAT_CAPABILITIES, buildModel } from '../test/fixtures';

describe('CAPABILITY_DIMENSIONS', () => {
  it('覆盖类型里定义的全部维度，且每个都有中文标签', () => {
    expect([...CAPABILITY_DIMENSIONS].sort()).toEqual(Object.keys(CAPABILITY_LABELS).sort());
  });
});

describe('scoreCapabilityDimensions', () => {
  it('按固定顺序返回六个维度，供雷达图直接使用', () => {
    const scores = scoreCapabilityDimensions(buildModel({ id: 'test' }));
    expect(scores.map((item) => item.dimension)).toEqual([...CAPABILITY_DIMENSIONS]);
  });

  it('分数直接取自数据，不做加工', () => {
    const model = buildModel({
      id: 'test',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 91 },
    });
    const lowLight = scoreCapabilityDimensions(model).find((item) => item.dimension === 'lowLight');
    expect(lowLight?.score).toBe(91);
    expect(lowLight?.label).toBe('低光画质');
  });
});

describe('computeOverallScore', () => {
  it('取六维算术平均', () => {
    const model = buildModel({
      id: 'test',
      capabilities: {
        lowLight: 90,
        stabilization: 90,
        battery: 60,
        ruggedness: 60,
        portability: 30,
        creativeFlexibility: 30,
      },
    });
    expect(computeOverallScore(model)).toBe(60);
  });

  it('保留一位小数，不产生长浮点尾数', () => {
    const model = buildModel({
      id: 'test',
      capabilities: {
        lowLight: 91,
        stabilization: 88,
        battery: 92,
        ruggedness: 85,
        portability: 70,
        creativeFlexibility: 78,
      },
    });
    expect(String(computeOverallScore(model))).toMatch(/^\d+(\.\d)?$/);
  });

  it('真实数据里每款机型的综合分都落在 0-100', () => {
    for (const model of COMPETITOR_MODELS) {
      const score = computeOverallScore(model);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

describe('findDimensionLeader', () => {
  it('返回该维度得分最高的机型', () => {
    const weak = buildModel({
      id: 'weak',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 40 },
    });
    const strong = buildModel({
      id: 'strong',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 95 },
    });
    expect(findDimensionLeader([weak, strong], 'lowLight')?.id).toBe('strong');
  });

  it('列表为空时返回 null，而不是抛错', () => {
    expect(findDimensionLeader([], 'lowLight')).toBeNull();
  });
});

describe('computeDimensionAverage', () => {
  it('返回该维度的平均分', () => {
    const low = buildModel({ id: 'low', capabilities: { ...FLAT_CAPABILITIES, lowLight: 40 } });
    const high = buildModel({ id: 'high', capabilities: { ...FLAT_CAPABILITIES, lowLight: 80 } });
    expect(computeDimensionAverage([low, high], 'lowLight')).toBe(60);
  });

  it('列表为空时返回 null，避免把「没有数据」读成「得分为零」', () => {
    expect(computeDimensionAverage([], 'lowLight')).toBeNull();
  });
});

describe('SCORING_NOTE', () => {
  it('对用户说明评分是人工标注而非自动估算', () => {
    expect(SCORING_NOTE).toContain('附来源');
    expect(SCORING_NOTE).toContain('不是自动生成的估算值');
  });
});

import { describe, expect, it } from 'vitest';
import {
  PRODUCT_GAP_NOTE,
  PRODUCT_GAP_THRESHOLD,
  findProductStrengths,
  findProductWeaknesses,
  findRelevantScenarios,
  summarizeProductPosition,
} from './product-context';
import { COMPETITOR_MODELS } from '../data/competitors';
import { FLAT_CAPABILITIES, buildModel, buildPainPoint, buildScenario } from '../test/fixtures';

describe('findProductWeaknesses', () => {
  it('找出明显低于同类均值的维度', () => {
    const target = buildModel({
      id: 'target',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 30 },
    });
    const peerA = buildModel({
      id: 'peer-a',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 80 },
    });
    const peerB = buildModel({
      id: 'peer-b',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 90 },
    });

    const weaknesses = findProductWeaknesses(target, [target, peerA, peerB]);
    const lowLight = weaknesses.find((item) => item.dimension === 'lowLight');

    expect(lowLight).toBeDefined();
    expect(lowLight?.score).toBe(30);
    expect(lowLight?.peerAverage).toBe(85);
    expect(lowLight?.deficit).toBe(55);
    expect(lowLight?.leaderName).toContain('peer-b');
    expect(lowLight?.leaderScore).toBe(90);
  });

  it('同类均值不含该机型自身', () => {
    // 自身 0 分，同类 80 分。若把自身算进均值，差距会被稀释
    const target = buildModel({
      id: 'target',
      capabilities: { ...FLAT_CAPABILITIES, battery: 0 },
    });
    const peer = buildModel({ id: 'peer', capabilities: { ...FLAT_CAPABILITIES, battery: 80 } });

    const battery = findProductWeaknesses(target, [target, peer]).find(
      (item) => item.dimension === 'battery',
    );
    expect(battery?.peerAverage).toBe(80);
    expect(battery?.deficit).toBe(80);
  });

  it('差距未达阈值的维度不算短板', () => {
    const target = buildModel({
      id: 'target',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 50 },
    });
    // 差距 7 分，低于 8 分阈值
    const peer = buildModel({ id: 'peer', capabilities: { ...FLAT_CAPABILITIES, lowLight: 57 } });

    expect(PRODUCT_GAP_THRESHOLD).toBe(8);
    expect(findProductWeaknesses(target, [target, peer])).toHaveLength(0);
  });

  it('只有一款机型时没有可比基准，返回空数组', () => {
    const only = buildModel({ id: 'only' });
    expect(findProductWeaknesses(only, [only])).toHaveLength(0);
  });

  it('差距大的排在前面', () => {
    const target = buildModel({
      id: 'target',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 40, battery: 20 },
    });
    const peer = buildModel({
      id: 'peer',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 70, battery: 90 },
    });

    const weaknesses = findProductWeaknesses(target, [target, peer]);
    expect(weaknesses[0]?.dimension).toBe('battery');
    expect(weaknesses[1]?.dimension).toBe('lowLight');
  });
});

describe('findProductStrengths', () => {
  it('找出明显高于同类均值的维度', () => {
    const target = buildModel({
      id: 'target',
      capabilities: { ...FLAT_CAPABILITIES, portability: 95 },
    });
    const peer = buildModel({
      id: 'peer',
      capabilities: { ...FLAT_CAPABILITIES, portability: 40 },
    });

    const portability = findProductStrengths(target, [target, peer]).find(
      (item) => item.dimension === 'portability',
    );
    expect(portability?.surplus).toBe(55);
    expect(portability?.peerAverage).toBe(40);
  });

  it('领先幅度大的排在前面', () => {
    const target = buildModel({
      id: 'target',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 70, battery: 95 },
    });
    const peer = buildModel({
      id: 'peer',
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 50, battery: 30 },
    });

    const strengths = findProductStrengths(target, [target, peer]);
    expect(strengths[0]?.dimension).toBe('battery');
  });

  it('只有一款机型时返回空数组', () => {
    const only = buildModel({ id: 'only' });
    expect(findProductStrengths(only, [only])).toHaveLength(0);
  });
});

describe('findRelevantScenarios', () => {
  it('只保留该机型官方定位人群的场景', () => {
    const model = buildModel({ id: 'model', targetAudiences: ['cycling'] });
    const cycling = buildScenario({
      id: 'cycling-scenario',
      audience: 'cycling',
      painPoints: [],
    });
    const snow = buildScenario({ id: 'snow-scenario', audience: 'snow', painPoints: [] });

    const relevant = findRelevantScenarios(model, [cycling, snow]);
    expect(relevant.map((item) => item.id)).toEqual(['cycling-scenario']);
  });

  it('官方未标注人群时不挂任何场景', () => {
    const model = buildModel({ id: 'model', targetAudiences: [] });
    const scenario = buildScenario({ id: 'any', audience: 'cycling', painPoints: [] });
    expect(findRelevantScenarios(model, [scenario])).toHaveLength(0);
  });
});

describe('summarizeProductPosition', () => {
  it('点出最明显的短板与该维度的领先者', () => {
    const target = buildModel({
      id: 'target',
      targetAudiences: ['cycling'],
      capabilities: { ...FLAT_CAPABILITIES, lowLight: 30 },
    });
    const peer = buildModel({ id: 'peer', capabilities: { ...FLAT_CAPABILITIES, lowLight: 90 } });
    const weaknesses = findProductWeaknesses(target, [target, peer]);

    const summary = summarizeProductPosition(target, [target, peer], weaknesses);
    expect(summary).toContain('低光画质');
    expect(summary).toContain('peer');
    expect(summary).toContain('骑行');
  });

  it('没有短板时明说各维度都不落后，不硬凑结论', () => {
    const target = buildModel({ id: 'target', targetAudiences: ['snow'] });
    const peer = buildModel({ id: 'peer' });
    const summary = summarizeProductPosition(target, [target, peer], []);
    expect(summary).toContain('没有明显落后');
  });

  it('没有可比机型时明确说明', () => {
    const only = buildModel({ id: 'only', targetAudiences: ['water'] });
    expect(summarizeProductPosition(only, [only], [])).toContain('没有可比机型');
  });
});

describe('真实数据上的表现', () => {
  it('每款在售机型的短板与强项都不会同时包含同一维度', () => {
    for (const model of COMPETITOR_MODELS) {
      const weakDimensions = new Set(
        findProductWeaknesses(model, COMPETITOR_MODELS).map((item) => item.dimension),
      );
      for (const strength of findProductStrengths(model, COMPETITOR_MODELS)) {
        expect(weakDimensions.has(strength.dimension)).toBe(false);
      }
    }
  });
});

describe('PRODUCT_GAP_NOTE', () => {
  it('对用户公开判定口径', () => {
    expect(PRODUCT_GAP_NOTE).toContain('8 分');
    expect(PRODUCT_GAP_NOTE).toContain('不含该机型自身');
  });
});

describe('痛点归因数据', () => {
  it('构造出的痛点保留原贴来源', () => {
    const pain = buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery'] });
    expect(pain.source.kind).toBe('community');
    expect(pain.source.url).toMatch(/^https:\/\//);
  });
});

import { describe, expect, it } from 'vitest';
import {
  EMPTY_CRITERIA,
  MATCH_FORMULA_NOTE,
  recommendProducts,
  scoreProduct,
  summarizeRecommendation,
  type SelectionCriteria,
} from './product-recommendation';
import { computeOverallScore } from './competitor-analysis';
import { COMPETITOR_MODELS } from '../data/competitors';
import type { CapabilityDimension, CompetitorModel } from '../types/competitor';

/** 用真实数据里的第一款机型做模板，只覆盖测试关心的字段 */
function buildModel(overrides: {
  readonly id: string;
  readonly amount: number;
  readonly capabilities: Readonly<Record<CapabilityDimension, number>>;
  readonly targetAudiences?: CompetitorModel['targetAudiences'];
  readonly formFactor?: CompetitorModel['formFactor'];
}): CompetitorModel {
  const template = COMPETITOR_MODELS[0];
  if (template === undefined) {
    throw new Error('竞品数据为空，测试模板无法构建');
  }
  const capabilities = Object.fromEntries(
    Object.entries(overrides.capabilities).map(([dimension, value]) => [
      dimension,
      { value, sources: template.capabilities.lowLight.sources },
    ]),
  ) as CompetitorModel['capabilities'];

  return {
    ...template,
    id: overrides.id,
    name: overrides.id,
    formFactor: overrides.formFactor ?? template.formFactor,
    targetAudiences: overrides.targetAudiences ?? [],
    price: {
      ...template.price,
      value: { ...template.price.value, amount: overrides.amount },
    },
    capabilities,
  };
}

const FLAT_CAPABILITIES: Readonly<Record<CapabilityDimension, number>> = {
  lowLight: 50,
  stabilization: 50,
  battery: 50,
  ruggedness: 50,
  portability: 50,
  creativeFlexibility: 50,
};

describe('scoreProduct', () => {
  it('weights the dimensions the chosen audience cares about', () => {
    // 越野跑最看重便携；两台机型总分相同，便携强的应得更高匹配度
    const portable = buildModel({
      id: 'portable',
      amount: 300,
      capabilities: { ...FLAT_CAPABILITIES, portability: 90, lowLight: 10 },
    });
    const lowLightStrong = buildModel({
      id: 'low-light',
      amount: 300,
      capabilities: { ...FLAT_CAPABILITIES, portability: 10, lowLight: 90 },
    });

    const criteria: SelectionCriteria = { ...EMPTY_CRITERIA, audiences: ['trail-running'] };
    expect(scoreProduct(portable, criteria).score).toBeGreaterThan(
      scoreProduct(lowLightStrong, criteria).score,
    );
  });

  it('falls back to the overall score when no audience is chosen', () => {
    const model = buildModel({ id: 'flat', amount: 300, capabilities: FLAT_CAPABILITIES });
    expect(scoreProduct(model, EMPTY_CRITERIA).score).toBe(computeOverallScore(model));
  });

  it('adds a bonus when the vendor targets that audience itself', () => {
    const base = { amount: 300, capabilities: FLAT_CAPABILITIES } as const;
    const targeted = buildModel({ ...base, id: 'targeted', targetAudiences: ['cycling'] });
    const untargeted = buildModel({ ...base, id: 'untargeted', targetAudiences: ['snow'] });

    const criteria: SelectionCriteria = { ...EMPTY_CRITERIA, audiences: ['cycling'] };
    expect(scoreProduct(targeted, criteria).score - scoreProduct(untargeted, criteria).score).toBe(
      5,
    );
  });

  it('penalises going over budget in proportion to the overshoot', () => {
    const model = buildModel({ id: 'pricey', amount: 400, capabilities: FLAT_CAPABILITIES });
    const within = scoreProduct(model, { ...EMPTY_CRITERIA, maxPrice: 400 });
    const over = scoreProduct(model, { ...EMPTY_CRITERIA, maxPrice: 200 });

    expect(within.overBudget).toBe(false);
    expect(over.overBudget).toBe(true);
    // 超出 100%，扣分触及 15 分上限
    expect(within.score - over.score).toBe(15);
    expect(over.reasons.some((reason) => reason.label.includes('超出'))).toBe(true);
  });

  it('caps the budget penalty so an expensive strong model stays visible', () => {
    const model = buildModel({ id: 'very-pricey', amount: 5000, capabilities: FLAT_CAPABILITIES });
    const over = scoreProduct(model, { ...EMPTY_CRITERIA, maxPrice: 100 });
    expect(over.score).toBe(35);
  });

  it('never leaves the 0-100 range', () => {
    const perfect = Object.fromEntries(
      Object.keys(FLAT_CAPABILITIES).map((key) => [key, 100]),
    ) as Readonly<Record<CapabilityDimension, number>>;
    const model = buildModel({
      id: 'perfect',
      amount: 100,
      capabilities: perfect,
      targetAudiences: ['cycling'],
    });
    const score = scoreProduct(model, { ...EMPTY_CRITERIA, audiences: ['cycling'] }).score;
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('names the strongest and weakest dimension for the chosen audience', () => {
    const model = buildModel({
      id: 'lopsided',
      amount: 300,
      capabilities: { ...FLAT_CAPABILITIES, stabilization: 95, lowLight: 5 },
    });
    const match = scoreProduct(model, { ...EMPTY_CRITERIA, audiences: ['cycling'] });
    expect(match.strongestDimensions[0]).toBe('防抖');
    expect(match.weakestDimension).toBe('低光画质');
  });
});

describe('recommendProducts', () => {
  it('sorts by match score, using the overall score to break ties', () => {
    const strong = buildModel({
      id: 'strong',
      amount: 300,
      capabilities: { ...FLAT_CAPABILITIES, portability: 90 },
    });
    const weak = buildModel({ id: 'weak', amount: 300, capabilities: FLAT_CAPABILITIES });

    const ranked = recommendProducts([weak, strong], {
      ...EMPTY_CRITERIA,
      audiences: ['trail-running'],
    });
    expect(ranked.map((match) => match.model.id)).toEqual(['strong', 'weak']);
  });

  it('treats form factor as a hard filter', () => {
    const cube = buildModel({
      id: 'cube',
      amount: 300,
      capabilities: FLAT_CAPABILITIES,
      formFactor: 'action-cube',
    });
    const panorama = buildModel({
      id: 'panorama',
      amount: 300,
      capabilities: FLAT_CAPABILITIES,
      formFactor: 'action-360',
    });

    const ranked = recommendProducts([cube, panorama], {
      ...EMPTY_CRITERIA,
      formFactors: ['action-360'],
    });
    expect(ranked.map((match) => match.model.id)).toEqual(['panorama']);
  });

  it('keeps an over-budget model in the list instead of hiding it', () => {
    const model = buildModel({ id: 'pricey', amount: 900, capabilities: FLAT_CAPABILITIES });
    const ranked = recommendProducts([model], { ...EMPTY_CRITERIA, maxPrice: 300 });
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.overBudget).toBe(true);
  });

  it('returns an empty list when nothing matches the form factor', () => {
    const ranked = recommendProducts([], EMPTY_CRITERIA);
    expect(ranked).toEqual([]);
  });

  it('ranks every real model without throwing', () => {
    const ranked = recommendProducts(COMPETITOR_MODELS, {
      audiences: ['cycling', 'snow'],
      maxPrice: 500,
      formFactors: [],
    });
    expect(ranked).toHaveLength(COMPETITOR_MODELS.length);
    for (const match of ranked) {
      expect(match.score).toBeGreaterThanOrEqual(0);
      expect(match.score).toBeLessThanOrEqual(100);
      expect(match.reasons.length).toBeGreaterThan(0);
    }
  });
});

describe('summarizeRecommendation', () => {
  it('explains that sorting falls back to the overall score', () => {
    const ranked = recommendProducts(COMPETITOR_MODELS, EMPTY_CRITERIA);
    expect(summarizeRecommendation(ranked, EMPTY_CRITERIA)).toContain('还没选拍摄场景');
  });

  it('names the winning model and its strengths', () => {
    const criteria: SelectionCriteria = { ...EMPTY_CRITERIA, audiences: ['cycling'] };
    const ranked = recommendProducts(COMPETITOR_MODELS, criteria);
    const summary = summarizeRecommendation(ranked, criteria);
    expect(summary).toContain(ranked[0]?.model.name ?? '');
    expect(summary).toContain('骑行');
  });

  it('tells the user how to recover when nothing matches', () => {
    expect(summarizeRecommendation([], EMPTY_CRITERIA)).toContain('没有符合的机型');
  });
});

describe('MATCH_FORMULA_NOTE', () => {
  it('discloses the weighting, bonus and penalty so the score is reproducible', () => {
    expect(MATCH_FORMULA_NOTE).toContain('加权平均');
    expect(MATCH_FORMULA_NOTE).toContain('5 分');
    expect(MATCH_FORMULA_NOTE).toContain('15 分');
  });
});

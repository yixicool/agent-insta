import { COMPETITOR_MODELS } from '../data/competitors';
import type { AudiencePainPoint, AudienceScenario } from '../types/audience';
import type { AudienceId, CapabilityDimension, CompetitorModel } from '../types/competitor';
import type { FeedbackEntry, FeedbackKind } from '../types/feedback';
import type { PlayStyle, SceneArtKey } from '../types/play';
import type { SourceRef } from '../types/provenance';

/**
 * 测试用构造器。
 *
 * 以真实数据里的第一款机型为模板，只覆盖用例关心的字段——
 * 这样构造出的对象始终满足当前类型定义，字段增删时测试不会悄悄漏掉新字段。
 */

function requireTemplate(): CompetitorModel {
  const template = COMPETITOR_MODELS[0];
  if (template === undefined) {
    throw new Error('竞品数据为空，测试模板无法构建');
  }
  return template;
}

export const FLAT_CAPABILITIES: Readonly<Record<CapabilityDimension, number>> = {
  lowLight: 50,
  stabilization: 50,
  battery: 50,
  ruggedness: 50,
  portability: 50,
  creativeFlexibility: 50,
};

export function buildModel(overrides: {
  readonly id: string;
  readonly amount?: number;
  readonly capabilities?: Readonly<Record<CapabilityDimension, number>>;
  readonly targetAudiences?: readonly AudienceId[];
  readonly formFactor?: CompetitorModel['formFactor'];
}): CompetitorModel {
  const template = requireTemplate();
  const capabilities = Object.fromEntries(
    Object.entries(overrides.capabilities ?? FLAT_CAPABILITIES).map(([dimension, value]) => [
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
      value: { ...template.price.value, amount: overrides.amount ?? 400 },
    },
    capabilities,
  };
}

const TEST_SOURCE: SourceRef = {
  kind: 'community',
  publisher: 'Reddit r/test',
  title: '测试用讨论帖',
  url: 'https://example.com/thread',
  retrievedAt: '2026-08-05',
};

export function buildPainPoint(overrides: {
  readonly id: string;
  readonly relatedDimensions: readonly CapabilityDimension[];
  readonly summary?: string;
}): AudiencePainPoint {
  return {
    id: overrides.id,
    summary: overrides.summary ?? `${overrides.id} 的抱怨`,
    workaround: '暂时只能绕过去',
    relatedDimensions: overrides.relatedDimensions,
    source: TEST_SOURCE,
  };
}

export function buildScenario(overrides: {
  readonly id: string;
  readonly audience: AudienceId;
  readonly painPoints: readonly AudiencePainPoint[];
}): AudienceScenario {
  return {
    id: overrides.id,
    audience: overrides.audience,
    scenario: `${overrides.id} 场景`,
    context: '测试用场景说明',
    painPoints: overrides.painPoints,
    expectation: '测试用产品期待',
    impact: 'high',
  };
}

export function buildPlay(overrides: {
  readonly id: string;
  readonly audience: AudienceId;
  readonly demands: readonly CapabilityDimension[];
  readonly artKey?: SceneArtKey;
}): PlayStyle {
  return {
    id: overrides.id,
    name: `${overrides.id} 玩法`,
    sceneLabel: '测试场景',
    audience: overrides.audience,
    artKey: overrides.artKey ?? 'night-road',
    effort: 'moderate',
    summary: '测试用玩法说明',
    steps: ['第一步', '第二步'],
    demands: overrides.demands,
    gearNote: '测试用器材说明',
    evidence: [{ value: '测试用证据', sources: [TEST_SOURCE] }],
  };
}

export function buildFeedback(overrides: {
  readonly id: string;
  readonly productId: string;
  readonly dimension: CapabilityDimension;
  readonly kind?: FeedbackKind;
  readonly sceneLabel?: string;
  readonly severity?: number;
}): FeedbackEntry {
  return {
    id: overrides.id,
    productId: overrides.productId,
    kind: overrides.kind ?? 'problem',
    sceneLabel: overrides.sceneLabel ?? '夜骑',
    summary: `${overrides.id} 的情况`,
    dimension: overrides.dimension,
    severity: overrides.severity ?? 3,
    createdAt: '2026-08-05T00:00:00.000Z',
  };
}

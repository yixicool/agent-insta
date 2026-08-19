import { describe, expect, it } from 'vitest';
import { checkSourcedField, checkSourcedFields, formatIssues } from '../domain/source-integrity';
import { isHttpUrl, isIsoDate } from '../lib/guards';
import {
  AUDIENCE_LABELS,
  BRAND_LABELS,
  CAPABILITY_LABELS,
  FORM_FACTOR_LABELS,
} from '../types/competitor';
import { PLAY_EFFORT_LABELS } from '../types/play';
import { SCENE_ART_KEYS, SCENE_ART_URLS } from '../components/SceneArt';
import { RADAR_CATEGORY_LABELS, RADAR_RING_LABELS } from '../types/tech-radar';
import { UNDISCLOSED, type Sourced } from '../types/provenance';
import { AUDIENCE_SCENARIOS } from './audiences';
import { COMPETITOR_MODELS } from './competitors';
import { IMAGE_CREDITS, PRODUCT_IMAGE_CREDITS } from './image-credits';
import { PLAY_STYLES } from './plays';
import { CAPTURED_AT } from './sources';
import { TECH_RADAR } from './tech-radar';
import { INDUSTRY_TRENDS, RUMOR_ENTRIES } from './trends';

/**
 * 数据真实性自动化闸门。
 * 遍历全部数据文件，断言「无来源字段不得进入产品」。
 * 这条测试失败即表示有数据违反了 CLAUDE.md 的数据真实性要求。
 */

const TODAY = CAPTURED_AT;
const STRICT = { requireAuthoritative: true, today: TODAY } as const;
const LENIENT = { requireAuthoritative: false, today: TODAY } as const;

/** 规格与价格字段：必须有官方或官方新闻稿来源 */
function authoritativeFields(
  model: (typeof COMPETITOR_MODELS)[number],
): (readonly [string, Sourced<unknown>])[] {
  const prefix = model.id;
  return [
    [`${prefix}.releasedOn`, model.releasedOn],
    [`${prefix}.sensor`, model.sensor],
    [`${prefix}.aperture`, model.aperture],
    [`${prefix}.maxVideo`, model.maxVideo],
    [`${prefix}.stabilization`, model.stabilization],
    [`${prefix}.ratedBattery`, model.ratedBattery],
    [`${prefix}.waterproof`, model.waterproof],
    [`${prefix}.weightGrams`, model.weightGrams],
    [`${prefix}.storage`, model.storage],
    [`${prefix}.price`, model.price],
  ];
}

/** 其余字段：至少要有来源，但不强制官方 */
function supportingFields(
  model: (typeof COMPETITOR_MODELS)[number],
): (readonly [string, Sourced<unknown>])[] {
  const prefix = model.id;
  return [
    [`${prefix}.measuredBattery`, model.measuredBattery],
    ...model.strengths.map(
      (field, index) =>
        [`${prefix}.strengths[${index}]`, field] as readonly [string, Sourced<unknown>],
    ),
    ...model.weaknesses.map(
      (field, index) =>
        [`${prefix}.weaknesses[${index}]`, field] as readonly [string, Sourced<unknown>],
    ),
    ...Object.entries(model.capabilities).map(
      ([dimension, field]) =>
        [`${prefix}.capabilities.${dimension}`, field] as readonly [string, Sourced<unknown>],
    ),
  ];
}

describe('竞品数据集完整性', () => {
  it('包含 8-12 款主力在售机型', () => {
    expect(COMPETITOR_MODELS.length).toBeGreaterThanOrEqual(8);
    expect(COMPETITOR_MODELS.length).toBeLessThanOrEqual(12);
  });

  it('覆盖大疆、影石、GoPro 三大品牌', () => {
    const brands = new Set(COMPETITOR_MODELS.map((model) => model.brand));
    expect([...brands].sort()).toEqual(['dji', 'gopro', 'insta360']);
  });

  it('每个机型 id 唯一', () => {
    const ids = COMPETITOR_MODELS.map((model) => model.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('规格与价格字段全部具备官方或官方新闻稿来源', () => {
    const issues = COMPETITOR_MODELS.flatMap((model) =>
      checkSourcedFields(authoritativeFields(model), STRICT),
    );
    expect(formatIssues(issues)).toBe('全部字段来源合规。');
  });

  it('实测、亮点、短板与能力评分字段全部具备来源', () => {
    const issues = COMPETITOR_MODELS.flatMap((model) =>
      checkSourcedFields(supportingFields(model), LENIENT),
    );
    expect(formatIssues(issues)).toBe('全部字段来源合规。');
  });

  it('每个机型至少有一条亮点和一条短板', () => {
    for (const model of COMPETITOR_MODELS) {
      expect(model.strengths.length, `${model.id} 缺少亮点`).toBeGreaterThan(0);
      expect(model.weaknesses.length, `${model.id} 缺少短板`).toBeGreaterThan(0);
    }
  });

  it('价格标注了币种、地区与套装', () => {
    for (const model of COMPETITOR_MODELS) {
      const { value } = model.price;
      expect(value.amount, `${model.id} 价格应为正数`).toBeGreaterThan(0);
      expect(['USD', 'CNY']).toContain(value.currency);
      expect(value.region.trim(), `${model.id} 缺少价格地区`).not.toBe('');
      expect(value.variant.trim(), `${model.id} 缺少套装说明`).not.toBe('');
    }
  });

  it('发布日期是合法 ISO 日期且不晚于采集日期', () => {
    for (const model of COMPETITOR_MODELS) {
      const released = model.releasedOn.value;
      expect(isIsoDate(released), `${model.id} 发布日期格式非法：${released}`).toBe(true);
      expect(released <= TODAY, `${model.id} 发布日期晚于采集日期`).toBe(true);
    }
  });

  it('能力评分落在 0-100 区间', () => {
    for (const model of COMPETITOR_MODELS) {
      for (const [dimension, field] of Object.entries(model.capabilities)) {
        expect(field.value, `${model.id}.${dimension} 越界`).toBeGreaterThanOrEqual(0);
        expect(field.value, `${model.id}.${dimension} 越界`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('未公开字段都附带说明，不留空猜测', () => {
    for (const model of COMPETITOR_MODELS) {
      for (const [path, field] of [...authoritativeFields(model), ...supportingFields(model)]) {
        if (field.value === UNDISCLOSED) {
          expect(field.note?.trim() ?? '', `${path} 标为未公开但没有说明原因`).not.toBe('');
        }
      }
    }
  });

  it('目标人群与形态使用已定义的枚举值', () => {
    for (const model of COMPETITOR_MODELS) {
      expect(Object.keys(BRAND_LABELS)).toContain(model.brand);
      expect(Object.keys(FORM_FACTOR_LABELS)).toContain(model.formFactor);
      expect(model.targetAudiences.length, `${model.id} 缺少目标人群`).toBeGreaterThan(0);
      for (const audience of model.targetAudiences) {
        expect(Object.keys(AUDIENCE_LABELS)).toContain(audience);
      }
    }
  });

  it('每个引用的产品图都已在 image-credits 中登记版权', () => {
    for (const model of COMPETITOR_MODELS) {
      if (model.imagePath === null) {
        continue;
      }
      const credit = PRODUCT_IMAGE_CREDITS.find((item) => item.modelId === model.id);
      expect(credit, `${model.id} 的 imagePath 缺少版权登记`).toBeDefined();
      expect(isHttpUrl(model.imagePath), `${model.id} 的 imagePath 不是合法的图床 URL`).toBe(true);
    }
  });

  it('产品图版权登记表里每条 modelId 都指向真实存在的机型', () => {
    const knownIds = new Set(COMPETITOR_MODELS.map((model) => model.id));
    for (const credit of PRODUCT_IMAGE_CREDITS) {
      expect(knownIds.has(credit.modelId), `${credit.modelId} 不是已知机型 id`).toBe(true);
    }
  });

  it('产品图版权登记表里每条都有版权归属与合法的官网来源链接', () => {
    for (const credit of PRODUCT_IMAGE_CREDITS) {
      expect(credit.copyright.trim(), `${credit.modelId} 缺少版权归属`).not.toBe('');
      expect(isHttpUrl(credit.sourceUrl), `${credit.modelId} 的来源链接非法`).toBe(true);
    }
  });

  it('场景图片版权登记完整', () => {
    for (const credit of IMAGE_CREDITS) {
      expect(credit.filename).toMatch(/\.jpg$/);
      expect(credit.copyright.trim()).not.toBe('');
      expect(credit.usage.trim()).not.toBe('');
      expect(SCENE_ART_KEYS).toContain(credit.key);
    }
  });

  it('每个场景形态键都有对应的版权登记', () => {
    const registeredKeys = new Set(IMAGE_CREDITS.map((c) => c.key));
    for (const key of SCENE_ART_KEYS) {
      expect(registeredKeys.has(key), `场景 ${key} 缺少版权登记`).toBe(true);
      expect(isHttpUrl(SCENE_ART_URLS[key]), `场景 ${key} 的图床 URL 不合法`).toBe(true);
    }
  });
});

describe('行业动向数据完整性', () => {
  it('每条趋势的证据都具备来源', () => {
    const issues = INDUSTRY_TRENDS.flatMap((trend) =>
      trend.evidence.flatMap((field, index) =>
        checkSourcedField(field, `${trend.id}.evidence[${index}]`, LENIENT),
      ),
    );
    expect(formatIssues(issues)).toBe('全部字段来源合规。');
  });

  it('每条趋势都有证据、摘要与内部启示', () => {
    for (const trend of INDUSTRY_TRENDS) {
      expect(trend.evidence.length, `${trend.id} 缺少证据`).toBeGreaterThan(0);
      expect(trend.summary.trim()).not.toBe('');
      expect(trend.implication.trim(), `${trend.id} 缺少启示`).not.toBe('');
    }
  });

  it('趋势 id 唯一', () => {
    const ids = INDUSTRY_TRENDS.map((trend) => trend.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('传闻分区完整性', () => {
  it('每条传闻都有来源并在 note 中声明未官方确认', () => {
    for (const rumor of RUMOR_ENTRIES) {
      expect(checkSourcedField(rumor.claim, `${rumor.id}.claim`, LENIENT)).toHaveLength(0);
      expect(rumor.claim.note?.trim() ?? '', `${rumor.id} 缺少未确认声明`).not.toBe('');
    }
  });

  it('传闻中的机型不出现在在售矩阵里', () => {
    const shippingNames = COMPETITOR_MODELS.map((model) => model.name.toLowerCase());
    for (const rumor of RUMOR_ENTRIES) {
      if (rumor.status === 'unannounced' || rumor.status === 'delayed') {
        expect(shippingNames, `${rumor.subject} 不应出现在在售矩阵`).not.toContain(
          rumor.subject.toLowerCase(),
        );
      }
    }
  });
});

describe('技术雷达数据完整性', () => {
  it('采集日期合法且不晚于今天', () => {
    expect(isIsoDate(TECH_RADAR.capturedAt)).toBe(true);
    expect(TECH_RADAR.capturedAt <= TODAY).toBe(true);
  });

  it('每个条目的证据都具备来源', () => {
    const issues = TECH_RADAR.entries.flatMap((entry) =>
      entry.evidence.flatMap((field, index) =>
        checkSourcedField(field, `${entry.id}.evidence[${index}]`, LENIENT),
      ),
    );
    expect(formatIssues(issues)).toBe('全部字段来源合规。');
  });

  it('每个条目都有证据、风险说明与合法环位', () => {
    for (const entry of TECH_RADAR.entries) {
      expect(entry.evidence.length, `${entry.id} 缺少证据`).toBeGreaterThan(0);
      expect(entry.risk.trim(), `${entry.id} 缺少风险说明`).not.toBe('');
      expect(Object.keys(RADAR_RING_LABELS)).toContain(entry.ring);
      expect(Object.keys(RADAR_CATEGORY_LABELS)).toContain(entry.category);
      expect(entry.fitScore).toBeGreaterThanOrEqual(0);
      expect(entry.fitScore).toBeLessThanOrEqual(100);
    }
  });

  it('四个环位都有条目，雷达不出现空象限', () => {
    const rings = new Set(TECH_RADAR.entries.map((entry) => entry.ring));
    expect(rings.has('adopt')).toBe(true);
    expect(rings.has('trial')).toBe(true);
    expect(rings.has('assess')).toBe(true);
  });

  it('条目 id 唯一', () => {
    const ids = TECH_RADAR.entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('人群场景数据完整性', () => {
  it('每条痛点都来自社区讨论并带原贴链接', () => {
    for (const scenario of AUDIENCE_SCENARIOS) {
      expect(scenario.painPoints.length, `${scenario.id} 缺少痛点`).toBeGreaterThan(0);
      for (const pain of scenario.painPoints) {
        expect(pain.source.kind, `${pain.id} 痛点来源必须是社区讨论`).toBe('community');
        expect(isHttpUrl(pain.source.url), `${pain.id} 来源链接非法`).toBe(true);
        expect(isIsoDate(pain.source.retrievedAt), `${pain.id} 采集日期非法`).toBe(true);
        expect(pain.source.retrievedAt <= TODAY).toBe(true);
        expect(pain.summary.trim()).not.toBe('');
        expect(pain.workaround.trim(), `${pain.id} 缺少现有替代方案`).not.toBe('');
      }
    }
  });

  it('痛点转述保持简短，不逐字长段复制用户原文', () => {
    for (const scenario of AUDIENCE_SCENARIOS) {
      for (const pain of scenario.painPoints) {
        expect(pain.summary.length, `${pain.id} 转述过长，可能是逐字复制`).toBeLessThanOrEqual(120);
      }
    }
  });

  it('每条场景都有上下文与产品期待', () => {
    for (const scenario of AUDIENCE_SCENARIOS) {
      expect(scenario.context.trim(), `${scenario.id} 缺少场景上下文`).not.toBe('');
      expect(scenario.expectation.trim(), `${scenario.id} 缺少产品期待`).not.toBe('');
      expect(Object.keys(AUDIENCE_LABELS)).toContain(scenario.audience);
    }
  });

  it('覆盖骑行人群的真实记录需求', () => {
    const cycling = AUDIENCE_SCENARIOS.filter((scenario) => scenario.audience === 'cycling');
    expect(cycling.length).toBeGreaterThan(0);
  });

  it('场景与痛点 id 均唯一', () => {
    const scenarioIds = AUDIENCE_SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
    const painIds = AUDIENCE_SCENARIOS.flatMap((scenario) =>
      scenario.painPoints.map((pain) => pain.id),
    );
    expect(new Set(painIds).size).toBe(painIds.length);
  });

  it('痛点的能力归因只使用已知维度', () => {
    for (const scenario of AUDIENCE_SCENARIOS) {
      for (const pain of scenario.painPoints) {
        for (const dimension of pain.relatedDimensions) {
          expect(Object.keys(CAPABILITY_LABELS), `${pain.id} 归因到未知维度`).toContain(dimension);
        }
        expect(new Set(pain.relatedDimensions).size).toBe(pain.relatedDimensions.length);
      }
    }
  });
});

describe('玩法数据完整性', () => {
  it('每个玩法都有可核对的支撑证据', () => {
    for (const play of PLAY_STYLES) {
      expect(play.evidence.length, `${play.id} 缺少支撑证据`).toBeGreaterThan(0);
      const issues = checkSourcedFields(
        play.evidence.map((item, index) => [`${play.id}.evidence[${index}]`, item] as const),
        LENIENT,
      );
      expect(issues, formatIssues(issues)).toHaveLength(0);
    }
  });

  it('每个玩法都写清了拍法、器材与能力要求', () => {
    for (const play of PLAY_STYLES) {
      expect(play.summary.trim(), `${play.id} 缺少玩法说明`).not.toBe('');
      expect(play.steps.length, `${play.id} 缺少拍摄步骤`).toBeGreaterThan(0);
      for (const step of play.steps) {
        expect(step.trim(), `${play.id} 存在空步骤`).not.toBe('');
      }
      expect(play.gearNote.trim(), `${play.id} 缺少器材说明`).not.toBe('');
      expect(play.demands.length, `${play.id} 未标注能力依赖`).toBeGreaterThan(0);
    }
  });

  it('玩法的人群与能力依赖都是已知取值', () => {
    for (const play of PLAY_STYLES) {
      expect(Object.keys(AUDIENCE_LABELS), `${play.id} 人群未知`).toContain(play.audience);
      for (const dimension of play.demands) {
        expect(Object.keys(CAPABILITY_LABELS), `${play.id} 依赖未知维度`).toContain(dimension);
      }
      expect(Object.keys(PLAY_EFFORT_LABELS), `${play.id} 难度取值未知`).toContain(play.effort);
    }
  });

  it('玩法 id 唯一', () => {
    const ids = PLAY_STYLES.map((play) => play.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每个玩法的场景插画都有对应的自绘实现', () => {
    for (const play of PLAY_STYLES) {
      expect(SCENE_ART_KEYS, `${play.id} 的插画 ${play.artKey} 没有实现`).toContain(play.artKey);
    }
  });
});

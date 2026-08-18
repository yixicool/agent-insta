import { describe, expect, it } from 'vitest';
import {
  ROOT_CAUSE_NOTE,
  WEAKNESS_SCORE_CEILING,
  groupByRootCause,
  groupFeedbackByScene,
  summarizeRootCauses,
} from './feedback-analysis';
import { AUDIENCE_SCENARIOS } from '../data/audiences';
import { COMPETITOR_MODELS } from '../data/competitors';
import { CAPABILITY_DIMENSIONS } from './competitor-analysis';
import {
  FLAT_CAPABILITIES,
  buildFeedback,
  buildModel,
  buildPainPoint,
  buildScenario,
} from '../test/fixtures';

describe('groupByRootCause', () => {
  it('把社区抱怨按归因维度归拢', () => {
    const model = buildModel({ id: 'model', capabilities: { ...FLAT_CAPABILITIES, battery: 40 } });
    const scenario = buildScenario({
      id: 'scenario',
      audience: 'cycling',
      painPoints: [
        buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery'] }),
        buildPainPoint({ id: 'pain-2', relatedDimensions: ['battery'] }),
      ],
    });

    const groups = groupByRootCause(model, [scenario], []);
    const battery = groups.find((group) => group.dimension === 'battery');
    expect(battery?.communityPains).toHaveLength(2);
    expect(battery?.totalCount).toBe(2);
  });

  it('一条抱怨可以同时归到多个维度', () => {
    const model = buildModel({ id: 'model' });
    const scenario = buildScenario({
      id: 'scenario',
      audience: 'cycling',
      painPoints: [buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery', 'ruggedness'] })],
    });

    const dimensions = groupByRootCause(model, [scenario], []).map((group) => group.dimension);
    expect(dimensions).toContain('battery');
    expect(dimensions).toContain('ruggedness');
  });

  it('并入用户自己录入的问题反馈', () => {
    const model = buildModel({ id: 'model' });
    const scenario = buildScenario({
      id: 'scenario',
      audience: 'cycling',
      painPoints: [buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery'] })],
    });
    const feedback = [buildFeedback({ id: 'fb-1', productId: 'model', dimension: 'battery' })];

    const battery = groupByRootCause(model, [scenario], feedback).find(
      (group) => group.dimension === 'battery',
    );
    expect(battery?.localProblems).toHaveLength(1);
    expect(battery?.totalCount).toBe(2);
  });

  it('只统计当前机型的反馈，不串到别的机型', () => {
    const model = buildModel({ id: 'model' });
    const feedback = [
      buildFeedback({ id: 'fb-1', productId: 'other-model', dimension: 'battery' }),
    ];
    expect(groupByRootCause(model, [], feedback)).toHaveLength(0);
  });

  it('好评不计入问题根因', () => {
    const model = buildModel({ id: 'model' });
    const feedback = [
      buildFeedback({ id: 'fb-1', productId: 'model', dimension: 'battery', kind: 'praise' }),
    ];
    expect(groupByRootCause(model, [], feedback)).toHaveLength(0);
  });

  it('没有反馈指向的维度不占版面', () => {
    const model = buildModel({ id: 'model' });
    const scenario = buildScenario({
      id: 'scenario',
      audience: 'cycling',
      painPoints: [buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery'] })],
    });

    const groups = groupByRootCause(model, [scenario], []);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.dimension).toBe('battery');
  });

  it('得分偏低且有反馈指向时判定为确有短板', () => {
    const model = buildModel({
      id: 'model',
      capabilities: { ...FLAT_CAPABILITIES, battery: WEAKNESS_SCORE_CEILING - 10 },
    });
    const scenario = buildScenario({
      id: 'scenario',
      audience: 'cycling',
      painPoints: [buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery'] })],
    });

    const battery = groupByRootCause(model, [scenario], []).find(
      (group) => group.dimension === 'battery',
    );
    expect(battery?.isConfirmedWeakness).toBe(true);
  });

  it('得分不低时不判为短板——那更可能是使用方法问题', () => {
    const model = buildModel({
      id: 'model',
      capabilities: { ...FLAT_CAPABILITIES, battery: WEAKNESS_SCORE_CEILING + 20 },
    });
    const scenario = buildScenario({
      id: 'scenario',
      audience: 'cycling',
      painPoints: [buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery'] })],
    });

    const battery = groupByRootCause(model, [scenario], []).find(
      (group) => group.dimension === 'battery',
    );
    expect(battery?.isConfirmedWeakness).toBe(false);
  });

  it('确有短板的维度排在前面，其次按反馈条数', () => {
    const model = buildModel({
      id: 'model',
      capabilities: { ...FLAT_CAPABILITIES, battery: 90, lowLight: 30 },
    });
    const scenario = buildScenario({
      id: 'scenario',
      audience: 'cycling',
      painPoints: [
        // 续航反馈更多，但得分很高；低光只有一条，但确实是短板
        buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery'] }),
        buildPainPoint({ id: 'pain-2', relatedDimensions: ['battery'] }),
        buildPainPoint({ id: 'pain-3', relatedDimensions: ['lowLight'] }),
      ],
    });

    const groups = groupByRootCause(model, [scenario], []);
    expect(groups[0]?.dimension).toBe('lowLight');
  });
});

describe('summarizeRootCauses', () => {
  it('没有反馈时引导用户自己记一条', () => {
    const model = buildModel({ id: 'model' });
    expect(summarizeRootCauses(model, [])).toContain('记录你自己遇到的情况');
  });

  it('有确认短板时点出该维度与得分', () => {
    const model = buildModel({
      id: 'model',
      capabilities: { ...FLAT_CAPABILITIES, battery: 35 },
    });
    const scenario = buildScenario({
      id: 'scenario',
      audience: 'cycling',
      painPoints: [buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery'] })],
    });
    const groups = groupByRootCause(model, [scenario], []);

    const summary = summarizeRootCauses(model, groups);
    expect(summary).toContain('续航');
    expect(summary).toContain('35');
  });

  it('有反馈但都不指向低分维度时，明说更可能是方法问题', () => {
    const model = buildModel({
      id: 'model',
      capabilities: { ...FLAT_CAPABILITIES, battery: 95 },
    });
    const scenario = buildScenario({
      id: 'scenario',
      audience: 'cycling',
      painPoints: [buildPainPoint({ id: 'pain-1', relatedDimensions: ['battery'] })],
    });
    const groups = groupByRootCause(model, [scenario], []);

    expect(summarizeRootCauses(model, groups)).toContain('拍摄方法');
  });
});

describe('groupFeedbackByScene', () => {
  it('按场景聚合', () => {
    const entries = [
      buildFeedback({ id: 'a', productId: 'm', dimension: 'battery', sceneLabel: '夜骑' }),
      buildFeedback({ id: 'b', productId: 'm', dimension: 'lowLight', sceneLabel: '夜骑' }),
      buildFeedback({ id: 'c', productId: 'm', dimension: 'ruggedness', sceneLabel: '雪场' }),
    ];

    const grouped = groupFeedbackByScene(entries);
    expect(grouped).toHaveLength(2);
    expect(grouped.find((group) => group.sceneLabel === '夜骑')?.entries).toHaveLength(2);
  });

  it('未填场景的归到「未标注场景」而不是丢掉', () => {
    const entries = [
      buildFeedback({ id: 'a', productId: 'm', dimension: 'battery', sceneLabel: '   ' }),
    ];
    expect(groupFeedbackByScene(entries)[0]?.sceneLabel).toBe('未标注场景');
  });

  it('空列表返回空数组', () => {
    expect(groupFeedbackByScene([])).toHaveLength(0);
  });
});

describe('真实数据上的表现', () => {
  it('每条真实痛点的归因维度都是已知维度', () => {
    for (const scenario of AUDIENCE_SCENARIOS) {
      for (const pain of scenario.painPoints) {
        for (const dimension of pain.relatedDimensions) {
          expect(CAPABILITY_DIMENSIONS).toContain(dimension);
        }
      }
    }
  });

  it('每台真实机型都能在真实痛点上跑出根因分组而不抛错', () => {
    for (const model of COMPETITOR_MODELS) {
      const scenarios = AUDIENCE_SCENARIOS.filter((scenario) =>
        model.targetAudiences.includes(scenario.audience),
      );
      const groups = groupByRootCause(model, scenarios, []);
      for (const group of groups) {
        expect(group.totalCount).toBeGreaterThan(0);
      }
      expect(summarizeRootCauses(model, groups).length).toBeGreaterThan(0);
    }
  });
});

describe('ROOT_CAUSE_NOTE', () => {
  it('明确说明维度归因是编者判断而非社区原话', () => {
    expect(ROOT_CAUSE_NOTE).toContain('编者判断');
    expect(ROOT_CAUSE_NOTE).toContain('不是社区用户的原话');
  });
});

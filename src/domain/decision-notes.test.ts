import { describe, expect, it } from 'vitest';
import {
  RECOMMENDATION_NOTE,
  buildDecisionReport,
  groupDecisionsByStage,
  resolveDecision,
  suggestFromShortlist,
} from './decision-notes';
import { DECISION_STAGE_ORDER, type DecisionNote, type DecisionStage } from '../types/decision';
import { FLAT_CAPABILITIES, buildModel, buildPlay } from '../test/fixtures';

function buildNote(overrides: {
  readonly id: string;
  readonly productId: string;
  readonly stage?: DecisionStage;
  readonly budget?: number | null;
  readonly likes?: readonly string[];
  readonly worries?: readonly string[];
  readonly playIds?: readonly string[];
  readonly note?: string;
}): DecisionNote {
  return {
    id: overrides.id,
    productId: overrides.productId,
    stage: overrides.stage ?? 'considering',
    playIds: overrides.playIds ?? [],
    budget: overrides.budget ?? null,
    likes: overrides.likes ?? [],
    worries: overrides.worries ?? [],
    note: overrides.note ?? '',
    createdAt: '2026-08-05T00:00:00.000Z',
    updatedAt: '2026-08-05T00:00:00.000Z',
  };
}

describe('resolveDecision', () => {
  it('把记录关联到机型与玩法', () => {
    const model = buildModel({ id: 'model-a' });
    const play = buildPlay({ id: 'play-a', audience: 'cycling', demands: ['battery'] });
    const note = buildNote({ id: 'n1', productId: 'model-a', playIds: ['play-a'] });

    const resolved = resolveDecision(note, [model], [play]);
    expect(resolved.model?.id).toBe('model-a');
    expect(resolved.plays.map((item) => item.id)).toEqual(['play-a']);
  });

  it('机型已下架时 model 为 null，而不是抛错', () => {
    const note = buildNote({ id: 'n1', productId: 'gone' });
    expect(resolveDecision(note, [], []).model).toBeNull();
  });

  it('忽略已不存在的玩法 id，不留下空洞', () => {
    const model = buildModel({ id: 'model-a' });
    const note = buildNote({ id: 'n1', productId: 'model-a', playIds: ['missing'] });
    expect(resolveDecision(note, [model], []).plays).toHaveLength(0);
  });

  it('官方价高于预算时标出超出金额', () => {
    const model = buildModel({ id: 'model-a', amount: 550 });
    const note = buildNote({ id: 'n1', productId: 'model-a', budget: 400 });

    const resolved = resolveDecision(note, [model], []);
    expect(resolved.overBudget).toBe(true);
    expect(resolved.overBudgetBy).toBe(150);
  });

  it('价格在预算内时不标超支', () => {
    const model = buildModel({ id: 'model-a', amount: 300 });
    const note = buildNote({ id: 'n1', productId: 'model-a', budget: 400 });

    const resolved = resolveDecision(note, [model], []);
    expect(resolved.overBudget).toBe(false);
    expect(resolved.overBudgetBy).toBeNull();
  });

  it('没设预算时不做超支判断', () => {
    const model = buildModel({ id: 'model-a', amount: 9999 });
    const note = buildNote({ id: 'n1', productId: 'model-a', budget: null });
    expect(resolveDecision(note, [model], []).overBudget).toBe(false);
  });
});

describe('groupDecisionsByStage', () => {
  it('按给定顺序分组', () => {
    const notes = [
      buildNote({ id: 'n1', productId: 'a', stage: 'purchased' }),
      buildNote({ id: 'n2', productId: 'b', stage: 'shortlisted' }),
    ];
    const groups = groupDecisionsByStage(notes, DECISION_STAGE_ORDER);
    expect(groups.map((group) => group.stage)).toEqual([...DECISION_STAGE_ORDER]);
    expect(groups[0]?.notes.map((note) => note.id)).toEqual(['n2']);
  });

  it('没有记录的阶段返回空列表而不是被省略', () => {
    const groups = groupDecisionsByStage([], DECISION_STAGE_ORDER);
    expect(groups).toHaveLength(DECISION_STAGE_ORDER.length);
    for (const group of groups) {
      expect(group.notes).toHaveLength(0);
    }
  });
});

describe('suggestFromShortlist', () => {
  it('只在进了候选的机型里比较', () => {
    const models = [buildModel({ id: 'a' }), buildModel({ id: 'b' })];
    const notes = [
      // 「还在看」的看中点更多，但不该被推荐
      buildNote({ id: 'n1', productId: 'a', stage: 'considering', likes: ['x', 'y', 'z'] }),
      buildNote({ id: 'n2', productId: 'b', stage: 'shortlisted', likes: ['x'] }),
    ];
    const resolved = notes.map((note) => resolveDecision(note, models, []));

    expect(suggestFromShortlist(resolved)?.resolved.note.id).toBe('n2');
  });

  it('看中点减犹豫点更高的排前', () => {
    const models = [buildModel({ id: 'a' }), buildModel({ id: 'b' })];
    const notes = [
      buildNote({
        id: 'n1',
        productId: 'a',
        stage: 'shortlisted',
        likes: ['x', 'y'],
        worries: ['w1', 'w2'],
      }),
      buildNote({ id: 'n2', productId: 'b', stage: 'shortlisted', likes: ['x', 'y'] }),
    ];
    const resolved = notes.map((note) => resolveDecision(note, models, []));

    const suggestion = suggestFromShortlist(resolved);
    expect(suggestion?.resolved.note.id).toBe('n2');
    expect(suggestion?.leaning).toBe(2);
  });

  it('倾向打平时用综合分决胜', () => {
    const weak = buildModel({ id: 'weak', capabilities: FLAT_CAPABILITIES });
    const strong = buildModel({
      id: 'strong',
      capabilities: {
        lowLight: 90,
        stabilization: 90,
        battery: 90,
        ruggedness: 90,
        portability: 90,
        creativeFlexibility: 90,
      },
    });
    const notes = [
      buildNote({ id: 'n1', productId: 'weak', stage: 'shortlisted', likes: ['x'] }),
      buildNote({ id: 'n2', productId: 'strong', stage: 'shortlisted', likes: ['x'] }),
    ];
    const resolved = notes.map((note) => resolveDecision(note, [weak, strong], []));

    expect(suggestFromShortlist(resolved)?.resolved.note.id).toBe('n2');
  });

  it('没有候选时返回 null，不硬给建议', () => {
    const model = buildModel({ id: 'a' });
    const notes = [buildNote({ id: 'n1', productId: 'a', stage: 'ruled-out' })];
    const resolved = notes.map((note) => resolveDecision(note, [model], []));
    expect(suggestFromShortlist(resolved)).toBeNull();
  });

  it('犹豫点不少于看中点时提醒先想清楚，而不是催着买', () => {
    const model = buildModel({ id: 'a' });
    const note = buildNote({
      id: 'n1',
      productId: 'a',
      stage: 'shortlisted',
      likes: ['x'],
      worries: ['w1', 'w2'],
    });
    const suggestion = suggestFromShortlist([resolveDecision(note, [model], [])]);
    expect(suggestion?.reason).toContain('先把犹豫的点弄清楚');
  });

  it('什么理由都没写时提示补充，而不是空口给结论', () => {
    const model = buildModel({ id: 'a' });
    const note = buildNote({ id: 'n1', productId: 'a', stage: 'shortlisted' });
    expect(suggestFromShortlist([resolveDecision(note, [model], [])])?.reason).toContain(
      '还没写下看中它什么',
    );
  });

  it('超预算时在建议里如实说明', () => {
    const model = buildModel({ id: 'a', amount: 800 });
    const note = buildNote({
      id: 'n1',
      productId: 'a',
      stage: 'shortlisted',
      budget: 500,
      likes: ['x', 'y'],
    });
    expect(suggestFromShortlist([resolveDecision(note, [model], [])])?.reason).toContain(
      '超出你设的预算',
    );
  });
});

describe('buildDecisionReport', () => {
  it('包含倾向建议与口径说明', () => {
    const model = buildModel({ id: 'a' });
    const note = buildNote({ id: 'n1', productId: 'a', stage: 'shortlisted', likes: ['画质好'] });
    const resolved = [resolveDecision(note, [model], [])];
    const suggestion = suggestFromShortlist(resolved);

    const report = buildDecisionReport(resolved, suggestion, '2026-08-05T00:00:00.000Z');
    expect(report).toContain('# 我的选购决策记录');
    expect(report).toContain('当前倾向');
    expect(report).toContain(RECOMMENDATION_NOTE);
  });

  it('列出看中点、犹豫点与备注', () => {
    const model = buildModel({ id: 'a' });
    const note = buildNote({
      id: 'n1',
      productId: 'a',
      likes: ['防水够深'],
      worries: ['略贵'],
      note: '等降价',
    });
    const report = buildDecisionReport(
      [resolveDecision(note, [model], [])],
      null,
      '2026-08-05T00:00:00.000Z',
    );

    expect(report).toContain('防水够深');
    expect(report).toContain('略贵');
    expect(report).toContain('等降价');
  });

  it('机型已下架时如实标注，而不是留空', () => {
    const note = buildNote({ id: 'n1', productId: 'gone' });
    const report = buildDecisionReport(
      [resolveDecision(note, [], [])],
      null,
      '2026-08-05T00:00:00.000Z',
    );
    expect(report).toContain('已不在机型库中');
  });

  it('结尾声明数据来源与本地内容的区别', () => {
    const report = buildDecisionReport([], null, '2026-08-05T00:00:00.000Z');
    expect(report).toContain('请以官网为准');
    expect(report).toContain('本地自建');
  });
});

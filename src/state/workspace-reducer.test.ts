import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  findDecisionForProduct,
  findFeedbackForProduct,
  workspaceReducer,
  type WorkspaceAction,
} from './workspace-reducer';
import { WORKSPACE_SCHEMA_VERSION, type WorkspaceState } from '../types/workspace';
import type { DecisionInput } from '../types/decision';
import { SEVERITY_MAX, SEVERITY_MIN, type FeedbackInput } from '../types/feedback';
import type { UserPlayInput } from '../types/user-play';

/**
 * reducer 是纯函数，因此每条动作都直接断言输入输出。
 * 时间戳一律由动作传入，测试里用固定值以保证结果可预期。
 */

const AT = '2026-08-05T10:00:00.000Z';
const LATER = '2026-08-06T10:00:00.000Z';

function initial(): WorkspaceState {
  return createInitialState(AT);
}

function apply(state: WorkspaceState, ...actions: readonly WorkspaceAction[]): WorkspaceState {
  return actions.reduce(workspaceReducer, state);
}

function decisionInput(overrides: Partial<DecisionInput> = {}): DecisionInput {
  return {
    productId: 'dji-osmo-action-6',
    stage: 'considering',
    playIds: [],
    budget: null,
    likes: [],
    worries: [],
    note: '',
    ...overrides,
  };
}

function feedbackInput(overrides: Partial<FeedbackInput> = {}): FeedbackInput {
  return {
    productId: 'dji-osmo-action-6',
    kind: 'problem',
    sceneLabel: '夜骑',
    summary: '录到 40 分钟因过热停机',
    dimension: 'battery',
    severity: 4,
    ...overrides,
  };
}

function userPlayInput(overrides: Partial<UserPlayInput> = {}): UserPlayInput {
  return {
    sceneLabel: '露营夜拍',
    name: '帐篷延时',
    summary: '架在帐篷顶拍星空延时。',
    imageDataUrl: null,
    ...overrides,
  };
}

describe('createInitialState', () => {
  it('starts empty at the current schema version', () => {
    const state = initial();
    expect(state.data.schemaVersion).toBe(WORKSPACE_SCHEMA_VERSION);
    expect(state.data.decisions).toHaveLength(0);
    expect(state.data.feedback).toHaveLength(0);
    expect(state.notice).toBeNull();
    expect(state.persistence.mode).toBe('persisted');
  });
});

describe('SAVE_DECISION', () => {
  it('adds a decision note and announces it', () => {
    const state = apply(initial(), { type: 'SAVE_DECISION', input: decisionInput(), at: AT });
    expect(state.data.decisions).toHaveLength(1);
    expect(state.data.decisions[0]?.productId).toBe('dji-osmo-action-6');
    expect(state.notice).not.toBeNull();
  });

  it('keeps only one note per model, updating in place', () => {
    const state = apply(
      initial(),
      { type: 'SAVE_DECISION', input: decisionInput({ likes: ['画质好'] }), at: AT },
      {
        type: 'SAVE_DECISION',
        input: decisionInput({ stage: 'shortlisted', likes: ['画质好', '够轻'] }),
        at: LATER,
      },
    );

    expect(state.data.decisions).toHaveLength(1);
    const note = state.data.decisions[0];
    expect(note?.stage).toBe('shortlisted');
    expect(note?.likes).toEqual(['画质好', '够轻']);
    // 更新时保留原创建时间，只推进 updatedAt
    expect(note?.createdAt).toBe(AT);
    expect(note?.updatedAt).toBe(LATER);
  });

  it('keeps separate notes for different models', () => {
    const state = apply(
      initial(),
      { type: 'SAVE_DECISION', input: decisionInput({ productId: 'a' }), at: AT },
      { type: 'SAVE_DECISION', input: decisionInput({ productId: 'b' }), at: AT },
    );
    expect(state.data.decisions).toHaveLength(2);
  });

  it('trims and dedupes the free-text lists', () => {
    const state = apply(initial(), {
      type: 'SAVE_DECISION',
      input: decisionInput({
        likes: ['  画质好  ', '画质好', '', '   ', '够轻'],
        worries: ['贵', '贵'],
      }),
      at: AT,
    });

    expect(state.data.decisions[0]?.likes).toEqual(['画质好', '够轻']);
    expect(state.data.decisions[0]?.worries).toEqual(['贵']);
  });

  it('dedupes selected play ids', () => {
    const state = apply(initial(), {
      type: 'SAVE_DECISION',
      input: decisionInput({ playIds: ['p1', 'p1', 'p2'] }),
      at: AT,
    });
    expect(state.data.decisions[0]?.playIds).toEqual(['p1', 'p2']);
  });

  it('normalizes an unusable budget to null rather than storing a dirty value', () => {
    for (const budget of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) {
      const state = apply(initial(), {
        type: 'SAVE_DECISION',
        input: decisionInput({ budget }),
        at: AT,
      });
      expect(state.data.decisions[0]?.budget).toBeNull();
    }
  });

  it('rounds a valid budget to two decimals', () => {
    const state = apply(initial(), {
      type: 'SAVE_DECISION',
      input: decisionInput({ budget: 499.999 }),
      at: AT,
    });
    expect(state.data.decisions[0]?.budget).toBe(500);
  });

  it('refuses a note with no model and explains why', () => {
    const state = apply(initial(), {
      type: 'SAVE_DECISION',
      input: decisionInput({ productId: '  ' }),
      at: AT,
    });
    expect(state.data.decisions).toHaveLength(0);
    expect(state.notice).toContain('缺少机型');
  });
});

describe('SET_DECISION_STAGE', () => {
  it('moves a note to another stage', () => {
    const saved = apply(initial(), { type: 'SAVE_DECISION', input: decisionInput(), at: AT });
    const id = saved.data.decisions[0]?.id ?? '';

    const state = apply(saved, {
      type: 'SET_DECISION_STAGE',
      id,
      stage: 'purchased',
      at: LATER,
    });
    expect(state.data.decisions[0]?.stage).toBe('purchased');
    expect(state.data.decisions[0]?.updatedAt).toBe(LATER);
  });

  it('reports a missing note instead of silently doing nothing', () => {
    const state = apply(initial(), {
      type: 'SET_DECISION_STAGE',
      id: 'nope',
      stage: 'purchased',
      at: AT,
    });
    expect(state.notice).toContain('未找到');
  });
});

describe('REMOVE_DECISION', () => {
  it('removes the note', () => {
    const saved = apply(initial(), { type: 'SAVE_DECISION', input: decisionInput(), at: AT });
    const id = saved.data.decisions[0]?.id ?? '';

    const state = apply(saved, { type: 'REMOVE_DECISION', id, at: LATER });
    expect(state.data.decisions).toHaveLength(0);
  });

  it('reports an already-removed note', () => {
    const state = apply(initial(), { type: 'REMOVE_DECISION', id: 'nope', at: AT });
    expect(state.notice).toContain('已不存在');
  });
});

describe('ADD_FEEDBACK', () => {
  it('records feedback and says it will feed the root-cause panel', () => {
    const state = apply(initial(), { type: 'ADD_FEEDBACK', input: feedbackInput(), at: AT });
    expect(state.data.feedback).toHaveLength(1);
    expect(state.data.feedback[0]?.dimension).toBe('battery');
    expect(state.notice).toContain('根因');
  });

  it('puts the newest entry first', () => {
    const state = apply(
      initial(),
      { type: 'ADD_FEEDBACK', input: feedbackInput({ summary: '第一条' }), at: AT },
      { type: 'ADD_FEEDBACK', input: feedbackInput({ summary: '第二条' }), at: LATER },
    );
    expect(state.data.feedback[0]?.summary).toBe('第二条');
  });

  it('refuses an empty description', () => {
    const state = apply(initial(), {
      type: 'ADD_FEEDBACK',
      input: feedbackInput({ summary: '   ' }),
      at: AT,
    });
    expect(state.data.feedback).toHaveLength(0);
    expect(state.notice).toContain('请先写下');
  });

  it('rejects an unknown capability dimension', () => {
    const state = apply(initial(), {
      type: 'ADD_FEEDBACK',
      // 模拟越过 UI 传进来的脏值
      input: feedbackInput({ dimension: 'nonsense' as FeedbackInput['dimension'] }),
      at: AT,
    });
    expect(state.data.feedback).toHaveLength(0);
    expect(state.notice).toContain('未识别');
  });

  it('clamps severity into the allowed range', () => {
    const low = apply(initial(), {
      type: 'ADD_FEEDBACK',
      input: feedbackInput({ severity: -3 }),
      at: AT,
    });
    const high = apply(initial(), {
      type: 'ADD_FEEDBACK',
      input: feedbackInput({ severity: 99 }),
      at: AT,
    });

    expect(low.data.feedback[0]?.severity).toBe(SEVERITY_MIN);
    expect(high.data.feedback[0]?.severity).toBe(SEVERITY_MAX);
  });

  it('rounds a fractional severity', () => {
    const state = apply(initial(), {
      type: 'ADD_FEEDBACK',
      input: feedbackInput({ severity: 3.6 }),
      at: AT,
    });
    expect(state.data.feedback[0]?.severity).toBe(4);
  });

  it('trims the scene label', () => {
    const state = apply(initial(), {
      type: 'ADD_FEEDBACK',
      input: feedbackInput({ sceneLabel: '  雪场  ' }),
      at: AT,
    });
    expect(state.data.feedback[0]?.sceneLabel).toBe('雪场');
  });
});

describe('REMOVE_FEEDBACK', () => {
  it('removes the entry', () => {
    const saved = apply(initial(), { type: 'ADD_FEEDBACK', input: feedbackInput(), at: AT });
    const id = saved.data.feedback[0]?.id ?? '';
    expect(apply(saved, { type: 'REMOVE_FEEDBACK', id, at: LATER }).data.feedback).toHaveLength(0);
  });

  it('reports an already-removed entry', () => {
    expect(apply(initial(), { type: 'REMOVE_FEEDBACK', id: 'nope', at: AT }).notice).toContain(
      '已不存在',
    );
  });
});

describe('ADD_USER_PLAY', () => {
  it('records a user play and announces it as local-only', () => {
    const state = apply(initial(), { type: 'ADD_USER_PLAY', input: userPlayInput(), at: AT });
    expect(state.data.userPlays).toHaveLength(1);
    expect(state.data.userPlays[0]?.name).toBe('帐篷延时');
    expect(state.notice).toContain('仅你自己可见');
  });

  it('puts the newest entry first', () => {
    const state = apply(
      initial(),
      { type: 'ADD_USER_PLAY', input: userPlayInput({ name: '第一条' }), at: AT },
      { type: 'ADD_USER_PLAY', input: userPlayInput({ name: '第二条' }), at: LATER },
    );
    expect(state.data.userPlays[0]?.name).toBe('第二条');
  });

  it('refuses when any required field is blank', () => {
    for (const overrides of [{ sceneLabel: '   ' }, { name: '' }, { summary: '  ' }]) {
      const state = apply(initial(), {
        type: 'ADD_USER_PLAY',
        input: userPlayInput(overrides),
        at: AT,
      });
      expect(state.data.userPlays).toHaveLength(0);
      expect(state.notice).toContain('都要填');
    }
  });

  it('trims text fields and keeps an optional image', () => {
    const state = apply(initial(), {
      type: 'ADD_USER_PLAY',
      input: userPlayInput({
        sceneLabel: '  露营夜拍  ',
        name: '  帐篷延时  ',
        summary: '  架在帐篷顶拍星空延时。  ',
        imageDataUrl: 'data:image/png;base64,xyz',
      }),
      at: AT,
    });
    const entry = state.data.userPlays[0];
    expect(entry?.sceneLabel).toBe('露营夜拍');
    expect(entry?.name).toBe('帐篷延时');
    expect(entry?.summary).toBe('架在帐篷顶拍星空延时。');
    expect(entry?.imageDataUrl).toBe('data:image/png;base64,xyz');
  });
});

describe('REMOVE_USER_PLAY', () => {
  it('removes the entry', () => {
    const saved = apply(initial(), { type: 'ADD_USER_PLAY', input: userPlayInput(), at: AT });
    const id = saved.data.userPlays[0]?.id ?? '';
    expect(apply(saved, { type: 'REMOVE_USER_PLAY', id, at: LATER }).data.userPlays).toHaveLength(
      0,
    );
  });

  it('reports an already-removed entry', () => {
    expect(apply(initial(), { type: 'REMOVE_USER_PLAY', id: 'nope', at: AT }).notice).toContain(
      '已不存在',
    );
  });
});

describe('notices and persistence', () => {
  it('NOTIFY sets a one-off message without touching data', () => {
    const saved = apply(initial(), { type: 'SAVE_DECISION', input: decisionInput(), at: AT });
    const state = apply(saved, { type: 'NOTIFY', message: '已导出选购记录。' });
    expect(state.notice).toBe('已导出选购记录。');
    expect(state.data.decisions).toEqual(saved.data.decisions);
  });

  it('DISMISS_NOTICE clears the message', () => {
    const state = apply(initial(), { type: 'NOTIFY', message: '提示' }, { type: 'DISMISS_NOTICE' });
    expect(state.notice).toBeNull();
  });

  it('SET_PERSISTENCE records the degraded mode', () => {
    const state = apply(initial(), {
      type: 'SET_PERSISTENCE',
      persistence: { mode: 'memory-only', message: '无法写入本地存储。' },
    });
    expect(state.persistence.mode).toBe('memory-only');
  });

  it('HYDRATE replaces data and clears any stale notice', () => {
    const withNotice = apply(initial(), { type: 'NOTIFY', message: '提示' });
    const state = apply(withNotice, {
      type: 'HYDRATE',
      data: {
        schemaVersion: WORKSPACE_SCHEMA_VERSION,
        decisions: [],
        feedback: [],
        userPlays: [],
        updatedAt: AT,
      },
      persistence: { mode: 'persisted', message: null },
    });
    expect(state.notice).toBeNull();
  });

  it('RESET_WORKSPACE clears local records and says external data is untouched', () => {
    const populated = apply(
      initial(),
      { type: 'SAVE_DECISION', input: decisionInput(), at: AT },
      { type: 'ADD_FEEDBACK', input: feedbackInput(), at: AT },
      { type: 'ADD_USER_PLAY', input: userPlayInput(), at: AT },
    );

    const state = apply(populated, { type: 'RESET_WORKSPACE', at: LATER });
    expect(state.data.decisions).toHaveLength(0);
    expect(state.data.feedback).toHaveLength(0);
    expect(state.data.userPlays).toHaveLength(0);
    expect(state.notice).toContain('外部真实数据不受影响');
  });
});

describe('immutability', () => {
  it('never mutates the state it was given', () => {
    const before = initial();
    const snapshot = JSON.stringify(before);
    apply(before, { type: 'SAVE_DECISION', input: decisionInput(), at: AT });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('stamps updatedAt on every data change', () => {
    const state = apply(initial(), { type: 'SAVE_DECISION', input: decisionInput(), at: LATER });
    expect(state.data.updatedAt).toBe(LATER);
  });

  it('ignores an unrecognized action instead of crashing', () => {
    const before = initial();
    // 模拟未来新增但尚未实现的动作
    const after = workspaceReducer(before, { type: 'UNKNOWN' } as unknown as WorkspaceAction);
    expect(after).toBe(before);
  });
});

describe('selectors', () => {
  it('findDecisionForProduct returns the note for that model only', () => {
    const state = apply(
      initial(),
      { type: 'SAVE_DECISION', input: decisionInput({ productId: 'a' }), at: AT },
      { type: 'SAVE_DECISION', input: decisionInput({ productId: 'b' }), at: AT },
    );
    expect(findDecisionForProduct(state.data, 'a')?.productId).toBe('a');
    expect(findDecisionForProduct(state.data, 'missing')).toBeUndefined();
  });

  it('findFeedbackForProduct filters by model', () => {
    const state = apply(
      initial(),
      { type: 'ADD_FEEDBACK', input: feedbackInput({ productId: 'a' }), at: AT },
      { type: 'ADD_FEEDBACK', input: feedbackInput({ productId: 'b' }), at: AT },
    );
    expect(findFeedbackForProduct(state.data, 'a')).toHaveLength(1);
    expect(findFeedbackForProduct(state.data, 'missing')).toHaveLength(0);
  });
});

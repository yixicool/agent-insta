import { createId } from '../lib/id';
import { CAPABILITY_DIMENSIONS } from '../domain/competitor-analysis';
import type { CapabilityDimension } from '../types/competitor';
import type { DecisionInput, DecisionNote, DecisionStage } from '../types/decision';
import {
  SEVERITY_MAX,
  SEVERITY_MIN,
  type FeedbackEntry,
  type FeedbackInput,
} from '../types/feedback';
import type { UserPlay, UserPlayInput } from '../types/user-play';
import {
  WORKSPACE_SCHEMA_VERSION,
  createEmptyWorkspaceData,
  type PersistenceState,
  type WorkspaceData,
  type WorkspaceState,
} from '../types/workspace';

/**
 * 工作台状态归约。纯函数，不触碰 React 与 localStorage，
 * 因此每条动作都能直接单测。
 *
 * 所有需要时间戳或 id 的动作都由调用方传入 `at`，
 * 避免 reducer 内部产生不可预测的副作用。
 */

export type WorkspaceAction =
  | {
      readonly type: 'HYDRATE';
      readonly data: WorkspaceData;
      readonly persistence: PersistenceState;
    }
  | { readonly type: 'SET_PERSISTENCE'; readonly persistence: PersistenceState }
  | { readonly type: 'DISMISS_NOTICE' }
  /** 视图层的一次性提示（例如导出成功或失败），不改动业务数据 */
  | { readonly type: 'NOTIFY'; readonly message: string }
  | { readonly type: 'SAVE_DECISION'; readonly input: DecisionInput; readonly at: string }
  | {
      readonly type: 'SET_DECISION_STAGE';
      readonly id: string;
      readonly stage: DecisionStage;
      readonly at: string;
    }
  | { readonly type: 'REMOVE_DECISION'; readonly id: string; readonly at: string }
  | { readonly type: 'ADD_FEEDBACK'; readonly input: FeedbackInput; readonly at: string }
  | { readonly type: 'REMOVE_FEEDBACK'; readonly id: string; readonly at: string }
  | { readonly type: 'ADD_USER_PLAY'; readonly input: UserPlayInput; readonly at: string }
  | { readonly type: 'REMOVE_USER_PLAY'; readonly id: string; readonly at: string }
  | { readonly type: 'RESET_WORKSPACE'; readonly at: string };

export function createInitialState(at: string): WorkspaceState {
  return {
    data: createEmptyWorkspaceData(at),
    persistence: { mode: 'persisted', message: null },
    notice: null,
  };
}

function withData(
  state: WorkspaceState,
  data: WorkspaceData,
  notice: string,
  at: string,
): WorkspaceState {
  return {
    ...state,
    data: { ...data, schemaVersion: WORKSPACE_SCHEMA_VERSION, updatedAt: at },
    notice,
  };
}

/** 清洗自由文本列表：去空、去重、保留顺序 */
function normalizeTextList(items: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  for (const item of items) {
    const trimmed = item.trim();
    if (trimmed !== '') {
      seen.add(trimmed);
    }
  }
  return [...seen];
}

/** 预算为负数或非有限值时按「没设预算」处理，不写入脏值 */
function normalizeBudget(budget: number | null): number | null {
  if (budget === null || !Number.isFinite(budget) || budget <= 0) {
    return null;
  }
  return Number(budget.toFixed(2));
}

function clampSeverity(value: number): number {
  if (!Number.isFinite(value)) {
    return SEVERITY_MIN;
  }
  return Math.min(SEVERITY_MAX, Math.max(SEVERITY_MIN, Math.round(value)));
}

function isKnownDimension(value: string): value is CapabilityDimension {
  return (CAPABILITY_DIMENSIONS as readonly string[]).includes(value);
}

function buildDecision(
  input: DecisionInput,
  id: string,
  createdAt: string,
  at: string,
): DecisionNote {
  return {
    id,
    productId: input.productId,
    stage: input.stage,
    playIds: [...new Set(input.playIds)],
    budget: normalizeBudget(input.budget),
    likes: normalizeTextList(input.likes),
    worries: normalizeTextList(input.worries),
    note: input.note.trim(),
    createdAt,
    updatedAt: at,
  };
}

/**
 * 保存决策记录。一台机型只保留一条记录：
 * 用户对同一台机器的看法会变，多条历史版本只会让「我在看哪几台」变得难读。
 */
function handleSaveDecision(
  state: WorkspaceState,
  input: DecisionInput,
  at: string,
): WorkspaceState {
  const { data } = state;
  if (input.productId.trim() === '') {
    return { ...state, notice: '缺少机型信息，无法保存这条记录。' };
  }

  const existing = data.decisions.find((note) => note.productId === input.productId);
  if (existing === undefined) {
    const created = buildDecision(input, createId('decision'), at, at);
    return withData(
      state,
      { ...data, decisions: [created, ...data.decisions] },
      '已记下这台机型。',
      at,
    );
  }

  const updated = buildDecision(input, existing.id, existing.createdAt, at);
  return withData(
    state,
    {
      ...data,
      decisions: data.decisions.map((note) => (note.id === existing.id ? updated : note)),
    },
    '已更新这台机型的记录。',
    at,
  );
}

function handleDecisionActions(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState | null {
  const { data } = state;
  switch (action.type) {
    case 'SAVE_DECISION':
      return handleSaveDecision(state, action.input, action.at);
    case 'SET_DECISION_STAGE': {
      const existing = data.decisions.find((note) => note.id === action.id);
      if (existing === undefined) {
        return { ...state, notice: '未找到这条记录，可能已被删除。' };
      }
      const updated: DecisionNote = { ...existing, stage: action.stage, updatedAt: action.at };
      return withData(
        state,
        {
          ...data,
          decisions: data.decisions.map((note) => (note.id === action.id ? updated : note)),
        },
        '已更新这台机型的状态。',
        action.at,
      );
    }
    case 'REMOVE_DECISION': {
      if (!data.decisions.some((note) => note.id === action.id)) {
        return { ...state, notice: '这条记录已不存在。' };
      }
      return withData(
        state,
        { ...data, decisions: data.decisions.filter((note) => note.id !== action.id) },
        '已删除这条记录。',
        action.at,
      );
    }
    default:
      return null;
  }
}

function handleFeedbackActions(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState | null {
  const { data } = state;
  switch (action.type) {
    case 'ADD_FEEDBACK': {
      const { input } = action;
      if (input.summary.trim() === '') {
        return { ...state, notice: '请先写下遇到的情况再保存。' };
      }
      if (!isKnownDimension(input.dimension)) {
        return { ...state, notice: '未识别的能力维度，无法保存这条反馈。' };
      }
      const entry: FeedbackEntry = {
        id: createId('feedback'),
        productId: input.productId,
        kind: input.kind,
        sceneLabel: input.sceneLabel.trim(),
        summary: input.summary.trim(),
        dimension: input.dimension,
        severity: clampSeverity(input.severity),
        createdAt: action.at,
      };
      return withData(
        state,
        { ...data, feedback: [entry, ...data.feedback] },
        '已记下这条反馈，它会并入下方的根因分析。',
        action.at,
      );
    }
    case 'REMOVE_FEEDBACK': {
      if (!data.feedback.some((entry) => entry.id === action.id)) {
        return { ...state, notice: '这条反馈已不存在。' };
      }
      return withData(
        state,
        { ...data, feedback: data.feedback.filter((entry) => entry.id !== action.id) },
        '已删除这条反馈。',
        action.at,
      );
    }
    default:
      return null;
  }
}

/**
 * 用户自己上传的玩法，属本地数据：没有 evidence 来源支撑，
 * 不进入 src/data/plays.ts，UI 上必须标注「本地数据」。
 */
function handleUserPlayActions(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState | null {
  const { data } = state;
  switch (action.type) {
    case 'ADD_USER_PLAY': {
      const { input } = action;
      const sceneLabel = input.sceneLabel.trim();
      const name = input.name.trim();
      const summary = input.summary.trim();
      if (sceneLabel === '' || name === '' || summary === '') {
        return { ...state, notice: '场景名称、玩法名称与怎么拍都要填才能上传。' };
      }
      const entry: UserPlay = {
        id: createId('user-play'),
        sceneLabel,
        name,
        summary,
        imageDataUrl: input.imageDataUrl,
        createdAt: action.at,
      };
      return withData(
        state,
        { ...data, userPlays: [entry, ...data.userPlays] },
        '已上传这条玩法，仅你自己可见。',
        action.at,
      );
    }
    case 'REMOVE_USER_PLAY': {
      if (!data.userPlays.some((entry) => entry.id === action.id)) {
        return { ...state, notice: '这条玩法已不存在。' };
      }
      return withData(
        state,
        { ...data, userPlays: data.userPlays.filter((entry) => entry.id !== action.id) },
        '已删除这条玩法。',
        action.at,
      );
    }
    default:
      return null;
  }
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'HYDRATE':
      return { data: action.data, persistence: action.persistence, notice: null };
    case 'SET_PERSISTENCE':
      return { ...state, persistence: action.persistence };
    case 'DISMISS_NOTICE':
      return { ...state, notice: null };
    case 'NOTIFY':
      return { ...state, notice: action.message };
    case 'RESET_WORKSPACE':
      return {
        ...state,
        data: createEmptyWorkspaceData(action.at),
        notice: '已清空本地记录。外部真实数据不受影响。',
      };
    default:
      return (
        handleDecisionActions(state, action) ??
        handleFeedbackActions(state, action) ??
        handleUserPlayActions(state, action) ??
        state
      );
  }
}

/** 某台机型下已有的决策记录；没有则返回 undefined */
export function findDecisionForProduct(
  data: WorkspaceData,
  productId: string,
): DecisionNote | undefined {
  return data.decisions.find((note) => note.productId === productId);
}

/** 某台机型下用户录入的反馈 */
export function findFeedbackForProduct(
  data: WorkspaceData,
  productId: string,
): readonly FeedbackEntry[] {
  return data.feedback.filter((entry) => entry.productId === productId);
}

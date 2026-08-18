import type { DecisionNote } from './decision';
import type { FeedbackEntry } from './feedback';
import type { UserPlay } from './user-play';

/**
 * 持久化结构版本。
 *
 * v3：站点从「需求管理工作台」改为「选购决策与效果跟踪」，
 * 旧版的洞察、需求、素材与验收记录在新结构中没有对应字段。
 * v4：新增用户自己上传的玩法（userPlays），是纯增量字段，
 * 不影响 decisions/feedback，因此 v3 → v4 不清空已有记录。
 * 迁移规则见 state/workspace-storage.ts 的 migrateWorkspaceData。
 */
export const WORKSPACE_SCHEMA_VERSION = 4;

export interface WorkspaceData {
  readonly schemaVersion: number;
  /** 用户的选购决策记录 */
  readonly decisions: readonly DecisionNote[];
  /** 用户录入的使用反馈 */
  readonly feedback: readonly FeedbackEntry[];
  /** 用户自己上传的玩法，本地数据，不代表真实证据 */
  readonly userPlays: readonly UserPlay[];
  readonly updatedAt: string;
}

/** 存储降级状态：无痕模式或配额耗尽时仅内存有效 */
export interface PersistenceState {
  readonly mode: 'persisted' | 'memory-only';
  readonly message: string | null;
}

export interface WorkspaceState {
  readonly data: WorkspaceData;
  readonly persistence: PersistenceState;
  /** 最近一次操作的用户可见提示，供 aria-live 播报 */
  readonly notice: string | null;
}

export function createEmptyWorkspaceData(updatedAt: string): WorkspaceData {
  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    decisions: [],
    feedback: [],
    userPlays: [],
    updatedAt,
  };
}

import { isArrayOf, isFiniteNumber, isNullOr, isOneOf, isRecord, isString } from '../lib/guards';
import { WORKSPACE_STORAGE_KEY, readJson, removeItem, writeJson } from '../lib/storage';
import { CAPABILITY_DIMENSIONS } from '../domain/competitor-analysis';
import { DECISION_STAGE_ORDER } from '../types/decision';
import type { Result } from '../types/result';
import { WORKSPACE_SCHEMA_VERSION, type WorkspaceData } from '../types/workspace';

/**
 * 工作台持久化的类型守卫与读写。
 * localStorage 的内容属于外部不可信数据，逐层收窄后才交给 reducer。
 *
 * 守卫刻意保持结构性校验（字段存在且类型正确），
 * 不重复校验业务范围——那由 reducer 与领域函数负责。
 */

/** 保留 Record 类型以便后续字段访问，不收窄成只有 id 的对象 */
function isEntity(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && isString(value.id);
}

function isStringList(value: unknown): value is string[] {
  return isArrayOf(value, isString);
}

function isDecisionShape(value: unknown): boolean {
  return (
    isEntity(value) &&
    isString(value.productId) &&
    isOneOf(value.stage, DECISION_STAGE_ORDER) &&
    isStringList(value.playIds) &&
    isNullOr(value.budget, isFiniteNumber) &&
    isStringList(value.likes) &&
    isStringList(value.worries) &&
    isString(value.note) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isFeedbackShape(value: unknown): boolean {
  return (
    isEntity(value) &&
    isString(value.productId) &&
    (value.kind === 'problem' || value.kind === 'praise') &&
    isString(value.sceneLabel) &&
    isString(value.summary) &&
    isOneOf(value.dimension, CAPABILITY_DIMENSIONS) &&
    isFiniteNumber(value.severity) &&
    isString(value.createdAt)
  );
}

/** 用户自己上传的玩法：没有 evidence/demands，配图可选 */
function isUserPlayShape(value: unknown): boolean {
  return (
    isEntity(value) &&
    isString(value.sceneLabel) &&
    isString(value.name) &&
    isString(value.summary) &&
    isNullOr(value.imageDataUrl, isString) &&
    isString(value.createdAt)
  );
}

/** 完整的持久化结构守卫，含 schemaVersion 检查 */
export function isWorkspaceData(value: unknown): value is WorkspaceData {
  if (!isRecord(value)) {
    return false;
  }
  if (value.schemaVersion !== WORKSPACE_SCHEMA_VERSION) {
    return false;
  }
  return (
    isArrayOf(value.decisions, (item): item is unknown => isDecisionShape(item)) &&
    isArrayOf(value.feedback, (item): item is unknown => isFeedbackShape(item)) &&
    isArrayOf(value.userPlays, (item): item is unknown => isUserPlayShape(item)) &&
    isString(value.updatedAt)
  );
}

/**
 * v1/v2 → v3 迁移。
 *
 * 旧版本存的是产品经理视角的洞察、需求、素材与验收记录，
 * 新版本是消费者视角的选购决策与使用反馈——两者没有字段对应关系，
 * 无法把「一条需求」翻译成「一条选购记录」而不凭空编造用户意图。
 *
 * 因此这里明确以空记录起步，而不是猜一个映射。
 * 旧数据在被覆盖前用户可通过旧版本的导出功能自行备份；
 * 界面上也会说明本地记录只保存在浏览器里。
 */
function migrateToV3(value: Record<string, unknown>): Record<string, unknown> {
  return {
    schemaVersion: 3,
    decisions: [],
    feedback: [],
    updatedAt: isString(value.updatedAt) ? value.updatedAt : new Date().toISOString(),
  };
}

/**
 * v3 → v4 迁移：新增用户上传的玩法（userPlays）。
 *
 * 与 v1/v2 → v3 不同，这是纯增量字段，不影响已有结构，
 * 因此原样保留 decisions/feedback，只补一个空数组，不清空任何已有记录。
 */
function migrateToV4(value: Record<string, unknown>): Record<string, unknown> {
  return {
    ...value,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    userPlays: [],
  };
}

/**
 * 把任意版本的已存数据升到当前版本。
 * 无法识别的版本返回原值，交由守卫拒绝，避免带着未知结构继续运行。
 */
export function migrateWorkspaceData(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  let migrated = value;
  if (migrated.schemaVersion === 1 || migrated.schemaVersion === 2) {
    migrated = migrateToV3(migrated);
  }
  if (migrated.schemaVersion === 3) {
    migrated = migrateToV4(migrated);
  }
  return migrated;
}

export function loadWorkspace(): Result<WorkspaceData> {
  return readJson(WORKSPACE_STORAGE_KEY, isWorkspaceData, migrateWorkspaceData);
}

export function saveWorkspace(data: WorkspaceData): Result<void> {
  return writeJson(WORKSPACE_STORAGE_KEY, data);
}

export function clearWorkspace(): Result<void> {
  return removeItem(WORKSPACE_STORAGE_KEY);
}

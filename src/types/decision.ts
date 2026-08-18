/**
 * 选购决策记录。这是用户在本站内自建的本地数据，
 * 与外部真实数据在 UI 上明确区分。
 */

export type DecisionStage = 'considering' | 'shortlisted' | 'ruled-out' | 'purchased';

export const DECISION_STAGE_LABELS: Readonly<Record<DecisionStage, string>> = {
  considering: '还在看',
  shortlisted: '进了候选',
  'ruled-out': '已排除',
  purchased: '已入手',
};

export const DECISION_STAGE_ORDER: readonly DecisionStage[] = [
  'shortlisted',
  'considering',
  'purchased',
  'ruled-out',
];

export interface DecisionNote {
  readonly id: string;
  /** 记录针对哪台机型 */
  readonly productId: string;
  readonly stage: DecisionStage;
  /** 我打算用它拍的玩法 id */
  readonly playIds: readonly string[];
  /** 我的预算上限（人民币）；null 表示没设 */
  readonly budget: number | null;
  /** 看中它的点 */
  readonly likes: readonly string[];
  /** 还在犹豫的点 */
  readonly worries: readonly string[];
  readonly note: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 新建或编辑决策记录时的输入，未清洗 */
export interface DecisionInput {
  readonly productId: string;
  readonly stage: DecisionStage;
  readonly playIds: readonly string[];
  readonly budget: number | null;
  readonly likes: readonly string[];
  readonly worries: readonly string[];
  readonly note: string;
}

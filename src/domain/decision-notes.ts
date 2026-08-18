import { computeOverallScore } from './competitor-analysis';
import { formatPrice } from '../lib/format';
import { BRAND_LABELS, type CompetitorModel } from '../types/competitor';
import { DECISION_STAGE_LABELS, type DecisionNote, type DecisionStage } from '../types/decision';
import type { PlayStyle } from '../types/play';

/**
 * 选购决策记录的派生逻辑。
 *
 * 这里回答的是消费者视角的问题：我在看哪几台、为什么在看、
 * 我打算用它拍什么、超预算了没有、最后该买哪台。
 * 全部为纯函数。
 */

/** 按阶段分组后的决策记录 */
export interface DecisionGroup {
  readonly stage: DecisionStage;
  readonly label: string;
  readonly notes: readonly DecisionNote[];
}

export function groupDecisionsByStage(
  notes: readonly DecisionNote[],
  order: readonly DecisionStage[],
): readonly DecisionGroup[] {
  return order.map((stage) => ({
    stage,
    label: DECISION_STAGE_LABELS[stage],
    notes: notes.filter((note) => note.stage === stage),
  }));
}

/** 一条决策记录对应的机型与玩法，供卡片渲染 */
export interface ResolvedDecision {
  readonly note: DecisionNote;
  /** 机型库里找不到时为 null（机型可能已下架） */
  readonly model: CompetitorModel | null;
  readonly plays: readonly PlayStyle[];
  /** 官方价是否超出用户自己设定的预算 */
  readonly overBudget: boolean;
  /** 超出的金额；未超或没设预算时为 null */
  readonly overBudgetBy: number | null;
}

export function resolveDecision(
  note: DecisionNote,
  models: readonly CompetitorModel[],
  plays: readonly PlayStyle[],
): ResolvedDecision {
  const model = models.find((candidate) => candidate.id === note.productId) ?? null;
  const chosenPlays = note.playIds
    .map((id) => plays.find((play) => play.id === id))
    .filter((play): play is PlayStyle => play !== undefined);

  if (model === null || note.budget === null) {
    return { note, model, plays: chosenPlays, overBudget: false, overBudgetBy: null };
  }

  const amount = model.price.value.amount;
  const overBudget = amount > note.budget;
  return {
    note,
    model,
    plays: chosenPlays,
    overBudget,
    overBudgetBy: overBudget ? Number((amount - note.budget).toFixed(2)) : null,
  };
}

/**
 * 在候选里给出一个「按你自己写下的理由，这台最合」的建议。
 *
 * 口径刻意保持简单并对用户公开：只看进了候选的机型，
 * 用你记下的看中点数量减去犹豫点数量作为倾向，综合分用于打平。
 * 这是对用户自己输入的整理，不是替用户做决定。
 */
export const RECOMMENDATION_NOTE =
  '这个建议只整理你自己写下的内容：在「进了候选」的机型里，比较你记下的看中点与犹豫点数量，数量相同时看六维综合分，超出你设定预算的机型会被标注但不会被排除。它不替你决定，只是把你已经想清楚的部分摆出来。';

export interface DecisionSuggestion {
  readonly resolved: ResolvedDecision;
  /** 看中点数 - 犹豫点数 */
  readonly leaning: number;
  readonly reason: string;
}

export function suggestFromShortlist(
  resolvedNotes: readonly ResolvedDecision[],
): DecisionSuggestion | null {
  const shortlisted = resolvedNotes.filter(
    (item) => item.note.stage === 'shortlisted' && item.model !== null,
  );
  if (shortlisted.length === 0) {
    return null;
  }

  const scored = shortlisted.map((resolved) => ({
    resolved,
    leaning: resolved.note.likes.length - resolved.note.worries.length,
  }));

  const best = [...scored].sort((left, right) => {
    if (right.leaning !== left.leaning) {
      return right.leaning - left.leaning;
    }
    const leftScore = left.resolved.model === null ? 0 : computeOverallScore(left.resolved.model);
    const rightScore =
      right.resolved.model === null ? 0 : computeOverallScore(right.resolved.model);
    return rightScore - leftScore;
  })[0];

  if (best === undefined) {
    return null;
  }

  return { ...best, reason: buildSuggestionReason(best.resolved, best.leaning) };
}

function buildSuggestionReason(resolved: ResolvedDecision, leaning: number): string {
  const model = resolved.model;
  if (model === null) {
    return '这台机型已不在当前机型库中，建议重新挑一台。';
  }
  const name = `${BRAND_LABELS[model.brand]} ${model.name}`;
  const likeCount = resolved.note.likes.length;
  const worryCount = resolved.note.worries.length;

  const budgetText = resolved.overBudget
    ? `不过它的官方价 ${formatPrice(model.price.value)} 超出你设的预算 ¥${resolved.overBudgetBy}，这一点要自己权衡。`
    : '';

  if (likeCount === 0 && worryCount === 0) {
    return `${name} 目前在候选里，但你还没写下看中它什么。补几条理由会让这个判断更可靠。${budgetText}`;
  }
  if (leaning <= 0) {
    return `${name} 在候选里排最前，但你记下的犹豫点（${worryCount} 条）不比看中点（${likeCount} 条）少。建议先把犹豫的点弄清楚再决定。${budgetText}`;
  }
  return `按你自己记下的内容，${name} 目前最合：看中 ${likeCount} 点、犹豫 ${worryCount} 点。${budgetText}`;
}

/** 导出决策记录用的 Markdown 报告 */
export function buildDecisionReport(
  resolvedNotes: readonly ResolvedDecision[],
  suggestion: DecisionSuggestion | null,
  createdAt: string,
): string {
  const lines: string[] = ['# 我的选购决策记录', '', `导出时间：${createdAt}`, ''];

  if (suggestion !== null) {
    lines.push('## 当前倾向', '', suggestion.reason, '', `> ${RECOMMENDATION_NOTE}`, '');
  }

  lines.push('## 记录明细', '');
  for (const resolved of resolvedNotes) {
    const model = resolved.model;
    const title =
      model === null
        ? `${resolved.note.productId}（已不在机型库中）`
        : `${BRAND_LABELS[model.brand]} ${model.name}`;
    lines.push(`### ${title}`, '');
    lines.push(`- 阶段：${DECISION_STAGE_LABELS[resolved.note.stage]}`);
    if (model !== null) {
      lines.push(`- 官方价：${formatPrice(model.price.value)}（${model.price.value.region}）`);
    }
    if (resolved.note.budget !== null) {
      lines.push(
        `- 我的预算：¥${resolved.note.budget}${resolved.overBudget ? `（超出 ¥${resolved.overBudgetBy}）` : ''}`,
      );
    }
    if (resolved.plays.length > 0) {
      lines.push(`- 打算拍：${resolved.plays.map((play) => play.name).join('、')}`);
    }
    if (resolved.note.likes.length > 0) {
      lines.push(`- 看中：${resolved.note.likes.join('；')}`);
    }
    if (resolved.note.worries.length > 0) {
      lines.push(`- 犹豫：${resolved.note.worries.join('；')}`);
    }
    if (resolved.note.note.trim() !== '') {
      lines.push(`- 备注：${resolved.note.note.trim()}`);
    }
    lines.push('');
  }

  lines.push(
    '---',
    '',
    '机型参数与价格来自品牌官网、官方新闻稿与专业评测，随厂商更新而变化，请以官网为准。本记录中的看中点、犹豫点与备注为本地自建内容。',
  );

  return lines.join('\n');
}

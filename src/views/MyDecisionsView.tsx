import { useMemo, type ReactNode } from 'react';
import {
  RECOMMENDATION_NOTE,
  buildDecisionReport,
  groupDecisionsByStage,
  resolveDecision,
  suggestFromShortlist,
  type ResolvedDecision,
} from '../domain/decision-notes';
import { computeOverallScore } from '../domain/competitor-analysis';
import { buildDatedFileName, downloadMarkdown } from '../lib/download';
import { formatPrice, formatScore } from '../lib/format';
import { Button, StagePill } from '../components/Controls';
import { Disclosure } from '../components/Disclosure';
import { EmptyState, ErrorNotice, LoadingBlock } from '../components/Feedback';
import { OverviewStats, type OverviewStat } from '../components/Overview';
import { PageHeader, Section } from '../components/PageHeader';
import { InternalAnalysisBadge, LocalDataBadge } from '../components/SourceBadge';
import { SourceList } from '../components/SourceList';
import { useAsyncResource } from '../state/use-async-resource';
import { useWorkspace } from '../state/use-workspace';
import type { AgentGateway } from '../gateway/agent-gateway';
import { BRAND_LABELS, type CompetitorSnapshot } from '../types/competitor';
import { DECISION_STAGE_LABELS, DECISION_STAGE_ORDER, type DecisionStage } from '../types/decision';

/**
 * 我的选购页。
 *
 * 消费者视角的收尾：我在看哪几台、各自看中什么、犹豫什么、
 * 有没有超预算，最后该买哪台。全部内容都是用户自己录入的本地数据。
 */

function DecisionCard({
  resolved,
  onOpenProduct,
  onOpenMonitor,
  onStageChange,
  onRemove,
}: {
  readonly resolved: ResolvedDecision;
  readonly onOpenProduct: (productId: string) => void;
  readonly onOpenMonitor: (productId: string) => void;
  readonly onStageChange: (stage: DecisionStage) => void;
  readonly onRemove: () => void;
}): ReactNode {
  const { note, model } = resolved;
  const title =
    model === null
      ? `${note.productId}（已不在机型库中）`
      : `${BRAND_LABELS[model.brand]} ${model.name}`;

  return (
    <article className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-[var(--color-ink-strong)]">{title}</h4>
          {model !== null && (
            <p className="numeric mt-0.5 text-xs text-[var(--color-ink-muted)]">
              {formatPrice(model.price.value)} · 综合能力 {formatScore(computeOverallScore(model))}
            </p>
          )}
        </div>
        <StagePill stage={note.stage} />
      </div>

      {resolved.overBudget && resolved.overBudgetBy !== null && (
        <p className="numeric mt-2 text-xs text-[var(--color-caution)]">
          比你设的预算 ¥{note.budget} 高出 ¥{resolved.overBudgetBy}。
        </p>
      )}

      {resolved.plays.length > 0 && (
        <p className="mt-2 text-xs text-[var(--color-ink-body)]">
          <span className="text-[var(--color-ink-muted)]">打算拍：</span>
          {resolved.plays.map((play) => play.name).join('、')}
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <h5 className="text-xs font-medium text-[var(--color-positive)]">
            看中（{note.likes.length}）
          </h5>
          {note.likes.length === 0 ? (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">还没写</p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-xs text-[var(--color-ink-body)]">
              {note.likes.map((like) => (
                <li key={like}>· {like}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h5 className="text-xs font-medium text-[var(--color-caution)]">
            犹豫（{note.worries.length}）
          </h5>
          {note.worries.length === 0 ? (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">还没写</p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-xs text-[var(--color-ink-body)]">
              {note.worries.map((worry) => (
                <li key={worry}>· {worry}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {note.note.trim() !== '' && (
        <p className="mt-2 text-xs text-[var(--color-ink-muted)]">备注：{note.note}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-line-subtle)] pt-3">
        <label className="sr-only" htmlFor={`stage-${note.id}`}>
          修改「{title}」的选购状态
        </label>
        <select
          id={`stage-${note.id}`}
          value={note.stage}
          onChange={(event) => {
            onStageChange(event.target.value as DecisionStage);
          }}
          className="rounded-[var(--radius-control)] border border-[var(--color-line-subtle)] bg-[var(--color-surface-inset)] px-2 py-1 text-xs text-[var(--color-ink-strong)]"
        >
          {DECISION_STAGE_ORDER.map((stage) => (
            <option key={stage} value={stage}>
              {DECISION_STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
        {model !== null && (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                onOpenProduct(model.id);
              }}
            >
              看参数
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onOpenMonitor(model.id);
              }}
            >
              看实际表现
            </Button>
          </>
        )}
        <Button variant="danger" onClick={onRemove} ariaLabel={`删除「${title}」的记录`}>
          删除
        </Button>
      </div>

      {model !== null && (
        <div className="mt-2">
          <Disclosure summary="价格来源" count={model.price.sources.length}>
            <SourceList sources={model.price.sources} label={`${model.name} 的价格来源`} />
          </Disclosure>
        </div>
      )}
    </article>
  );
}

export interface MyDecisionsViewProps {
  readonly gateway: AgentGateway;
  readonly onOpenProduct: (productId: string) => void;
  readonly onOpenMonitor: (productId: string) => void;
  readonly onBrowsePlays: () => void;
  readonly onPickProduct: () => void;
  readonly onNotify: (message: string) => void;
}

export function MyDecisionsView({
  gateway,
  onOpenProduct,
  onOpenMonitor,
  onBrowsePlays,
  onPickProduct,
  onNotify,
}: MyDecisionsViewProps): ReactNode {
  const { state, dispatch, resetAll } = useWorkspace();
  const snapshotResource = useAsyncResource<CompetitorSnapshot>(() =>
    gateway.fetchCompetitorSnapshot(),
  );
  const playsResource = useAsyncResource(() => gateway.fetchPlayStyles());

  const models = snapshotResource.data?.models ?? [];
  const plays = playsResource.data ?? [];

  const resolvedNotes = useMemo(
    () => state.data.decisions.map((note) => resolveDecision(note, models, plays)),
    [state.data.decisions, models, plays],
  );

  const suggestion = useMemo(() => suggestFromShortlist(resolvedNotes), [resolvedNotes]);

  const groups = useMemo(
    () => groupDecisionsByStage(state.data.decisions, DECISION_STAGE_ORDER),
    [state.data.decisions],
  );

  if (snapshotResource.status === 'loading' || snapshotResource.status === 'idle') {
    return <LoadingBlock label="机型库" />;
  }
  if (snapshotResource.status === 'error' && snapshotResource.error !== null) {
    return <ErrorNotice error={snapshotResource.error} onRetry={snapshotResource.reload} />;
  }

  const shortlistedCount = state.data.decisions.filter(
    (note) => note.stage === 'shortlisted',
  ).length;
  const purchasedCount = state.data.decisions.filter((note) => note.stage === 'purchased').length;
  const overBudgetCount = resolvedNotes.filter((item) => item.overBudget).length;

  const overviewItems: readonly OverviewStat[] = [
    { label: '我在看的机型', value: `${state.data.decisions.length} 款`, hint: '含已排除的' },
    {
      label: '进了候选',
      value: `${shortlistedCount} 款`,
      hint: shortlistedCount === 0 ? '还没有候选' : '下方给出倾向建议',
      tone: shortlistedCount > 0 ? ('positive' as const) : ('neutral' as const),
    },
    {
      label: '超出预算',
      value: `${overBudgetCount} 款`,
      hint: overBudgetCount === 0 ? '都在预算内' : '已标注但未排除',
      tone: overBudgetCount > 0 ? ('caution' as const) : ('neutral' as const),
    },
    {
      label: '已入手',
      value: `${purchasedCount} 款`,
      hint: purchasedCount === 0 ? '还没入手' : '记得回去记使用反馈',
    },
  ];

  function exportReport(): void {
    const timestamp = new Date().toISOString();
    const markdown = buildDecisionReport(resolvedNotes, suggestion, timestamp);
    const result = downloadMarkdown(buildDatedFileName('我的选购记录', 'md', timestamp), markdown);
    onNotify(result.ok ? '已导出选购记录。' : `${result.error.message}${result.error.hint}`);
  }

  if (state.data.decisions.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="我的选购"
          description="你看过、犹豫过、决定了的机型都记在这里。看中一台就在它的详情页记一条，之后可以横向比较。"
        />
        <EmptyState
          title="还没有记录"
          description="先看看能拍出什么样的画面，找到想拍的玩法，再顺着它挑一台机器记下来。"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={onBrowsePlays}>
                去看玩法
              </Button>
              <Button variant="secondary" onClick={onPickProduct}>
                直接挑机型
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="我的选购"
        description="你看过、犹豫过、决定了的机型都记在这里。所有内容都是你自己录入的，只保存在这台浏览器里。"
        actions={
          <>
            <Button variant="secondary" onClick={exportReport}>
              导出为 Markdown
            </Button>
            <Button variant="ghost" onClick={onPickProduct}>
              再挑一台
            </Button>
          </>
        }
        meta={
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <LocalDataBadge />
            机型参数与价格来自官网与专业评测；看中点、犹豫点与备注是你自己写的。
          </p>
        }
      />

      <OverviewStats items={overviewItems} />

      {suggestion !== null && (
        <Section
          title="按你记下的内容，现在最合的是"
          badge={<InternalAnalysisBadge />}
          actions={
            suggestion.resolved.model !== null ? (
              <Button
                variant="primary"
                onClick={() => {
                  const model = suggestion.resolved.model;
                  if (model !== null) {
                    onOpenProduct(model.id);
                  }
                }}
              >
                再看一遍这台
              </Button>
            ) : undefined
          }
        >
          <p className="max-w-prose text-sm text-[var(--color-ink-body)]">{suggestion.reason}</p>
          <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-muted)]">
            {RECOMMENDATION_NOTE}
          </p>
        </Section>
      )}

      {groups
        .filter((group) => group.notes.length > 0)
        .map((group) => (
          <Section
            key={group.stage}
            title={`${group.label}（${group.notes.length}）`}
            badge={<LocalDataBadge />}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {group.notes.map((note) => {
                const resolved = resolvedNotes.find((item) => item.note.id === note.id);
                if (resolved === undefined) {
                  return null;
                }
                return (
                  <DecisionCard
                    key={note.id}
                    resolved={resolved}
                    onOpenProduct={onOpenProduct}
                    onOpenMonitor={onOpenMonitor}
                    onStageChange={(stage) => {
                      dispatch({
                        type: 'SET_DECISION_STAGE',
                        id: note.id,
                        stage,
                        at: new Date().toISOString(),
                      });
                    }}
                    onRemove={() => {
                      dispatch({
                        type: 'REMOVE_DECISION',
                        id: note.id,
                        at: new Date().toISOString(),
                      });
                    }}
                  />
                );
              })}
            </div>
          </Section>
        ))}

      <Section
        title="清空本地记录"
        description="只会删除你自己录入的选购记录与使用反馈，机型参数等外部数据不受影响。"
      >
        <Button variant="danger" onClick={resetAll}>
          清空我的全部记录
        </Button>
      </Section>
    </div>
  );
}

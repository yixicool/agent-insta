import { useMemo, useState, type ReactNode } from 'react';
import { CAPABILITY_DIMENSIONS, scoreCapabilityDimensions } from '../domain/competitor-analysis';
import {
  ROOT_CAUSE_NOTE,
  groupByRootCause,
  groupFeedbackByScene,
  summarizeRootCauses,
} from '../domain/feedback-analysis';
import { findRelevantScenarios } from '../domain/product-context';
import { formatIsoDate, formatScore } from '../lib/format';
import { describeCapabilityLevel, describeSeverityLevel } from '../lib/wording';
import { MetricBar } from '../components/Charts';
import { Button, Field, INPUT_CLASSES, ScoreInput } from '../components/Controls';
import { CollapsibleSection, Disclosure } from '../components/Disclosure';
import { EmptyState, ErrorNotice, LoadingBlock } from '../components/Feedback';
import { OverviewStats, type OverviewStat } from '../components/Overview';
import { PageHeader, Section } from '../components/PageHeader';
import { InternalAnalysisBadge, LocalDataBadge, SourceBadge } from '../components/SourceBadge';
import { SourceLink, SourceList } from '../components/SourceList';
import { useAsyncResource } from '../state/use-async-resource';
import { useWorkspace } from '../state/use-workspace';
import { findFeedbackForProduct } from '../state/workspace-reducer';
import type { AgentGateway } from '../gateway/agent-gateway';
import type { AudienceScenario } from '../types/audience';
import {
  AUDIENCE_LABELS,
  BRAND_LABELS,
  CAPABILITY_LABELS,
  TREND_IMPACT_LABELS,
  type CapabilityDimension,
  type CompetitorModel,
  type CompetitorSnapshot,
} from '../types/competitor';
import { FEEDBACK_KIND_LABELS, type FeedbackEntry, type FeedbackKind } from '../types/feedback';

/**
 * 实际表现页。
 *
 * 这一页回答「买回来之后它到底表现如何」：
 * 核心数据、真实用户反馈、社区在讨论什么、以及这些抱怨的根因在哪个能力维度。
 *
 * 三类内容在 UI 上严格区分：官方规格与实测（外部真实数据）、
 * 社区讨论（外部真实数据）、我自己录的反馈（本地数据）。
 */

/** 核心数据条目 */
interface CoreMetric {
  readonly dimension: CapabilityDimension;
  readonly label: string;
  readonly score: number;
}

function CoreMetricsPanel({ model }: { readonly model: CompetitorModel }): ReactNode {
  const metrics: readonly CoreMetric[] = scoreCapabilityDimensions(model).map((item) => ({
    dimension: item.dimension,
    label: item.label,
    score: item.score,
  }));

  return (
    <div className="space-y-3">
      {metrics.map((metric) => (
        <div key={metric.dimension}>
          <MetricBar
            label={metric.label}
            ratio={metric.score / 100}
            display={`${formatScore(metric.score)} · ${describeCapabilityLevel(metric.score)}`}
            tone={metric.score >= 75 ? 'positive' : metric.score >= 60 ? 'accent' : 'caution'}
          />
          <SourceList
            sources={model.capabilities[metric.dimension].sources}
            note={model.capabilities[metric.dimension].note}
            label={`${metric.label}的来源`}
          />
        </div>
      ))}
    </div>
  );
}

/** 一条社区讨论 */
function CommunityThread({ scenario }: { readonly scenario: AudienceScenario }): ReactNode {
  return (
    <article className="rounded-[var(--radius-control)] bg-[var(--color-surface-inset)] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">{scenario.scenario}</h4>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {AUDIENCE_LABELS[scenario.audience]} · {TREND_IMPACT_LABELS[scenario.impact]}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-[var(--color-ink-body)]">{scenario.context}</p>

      <ul className="mt-2 space-y-2">
        {scenario.painPoints.map((pain) => (
          <li
            key={pain.id}
            className="rounded-[var(--radius-control)] bg-[var(--color-surface-raised)] p-2.5"
          >
            <p className="text-xs text-[var(--color-ink-body)]">{pain.summary}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              大家现在只能：{pain.workaround}
            </p>
            {pain.relatedDimensions.length > 0 && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                <InternalAnalysisBadge />
                可能与
                {pain.relatedDimensions.map((dimension) => CAPABILITY_LABELS[dimension]).join('、')}
                有关
              </p>
            )}
            <div className="mt-1.5">
              <SourceLink source={pain.source} />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
        <InternalAnalysisBadge />
        {scenario.expectation}
      </p>
    </article>
  );
}

/** 我自己录的一条反馈 */
function FeedbackItem({
  entry,
  onRemove,
}: {
  readonly entry: FeedbackEntry;
  readonly onRemove: () => void;
}): ReactNode {
  const isProblem = entry.kind === 'problem';
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded-[var(--radius-control)] bg-[var(--color-surface-inset)] p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] leading-none ${
              isProblem
                ? 'border-[var(--color-caution)] text-[var(--color-caution)]'
                : 'border-[var(--color-positive)] text-[var(--color-positive)]'
            }`}
          >
            {FEEDBACK_KIND_LABELS[entry.kind]}
          </span>
          <span className="text-xs text-[var(--color-ink-muted)]">
            {entry.sceneLabel === '' ? '未标注场景' : entry.sceneLabel}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-ink-body)]">{entry.summary}</p>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          归到{CAPABILITY_LABELS[entry.dimension]} · {describeSeverityLevel(entry.severity)}
          <span className="numeric ml-1.5">{entry.severity}/5</span>
        </p>
      </div>
      <Button variant="ghost" onClick={onRemove} ariaLabel={`删除反馈「${entry.summary}」`}>
        删除
      </Button>
    </li>
  );
}

interface FeedbackDraft {
  readonly kind: FeedbackKind;
  readonly sceneLabel: string;
  readonly summary: string;
  readonly dimension: CapabilityDimension;
  readonly severity: number;
}

const EMPTY_DRAFT: FeedbackDraft = {
  kind: 'problem',
  sceneLabel: '',
  summary: '',
  dimension: 'lowLight',
  severity: 3,
};

export interface MonitorViewProps {
  readonly gateway: AgentGateway;
  readonly productId: string;
  readonly onPickProduct: () => void;
  readonly onOpenProduct: (productId: string) => void;
}

export function MonitorView({
  gateway,
  productId,
  onPickProduct,
  onOpenProduct,
}: MonitorViewProps): ReactNode {
  const { state, dispatch } = useWorkspace();
  const snapshotResource = useAsyncResource<CompetitorSnapshot>(() =>
    gateway.fetchCompetitorSnapshot(),
  );
  const scenariosResource = useAsyncResource(() => gateway.fetchAudienceScenarios());
  const [draft, setDraft] = useState<FeedbackDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);

  const snapshot = snapshotResource.data;
  const allScenarios = scenariosResource.data ?? [];

  const model = useMemo(
    () => snapshot?.models.find((candidate) => candidate.id === productId) ?? null,
    [snapshot, productId],
  );

  const scenarios = useMemo(
    () => (model === null ? [] : findRelevantScenarios(model, allScenarios)),
    [model, allScenarios],
  );

  const myFeedback = findFeedbackForProduct(state.data, productId);

  const rootCauses = useMemo(
    () => (model === null ? [] : groupByRootCause(model, scenarios, state.data.feedback)),
    [model, scenarios, state.data.feedback],
  );

  const byScene = useMemo(() => groupFeedbackByScene(myFeedback), [myFeedback]);

  if (snapshotResource.status === 'loading' || snapshotResource.status === 'idle') {
    return <LoadingBlock label="机型资料" />;
  }
  if (snapshotResource.status === 'error' && snapshotResource.error !== null) {
    return <ErrorNotice error={snapshotResource.error} onRetry={snapshotResource.reload} />;
  }
  if (snapshot === null) {
    return <EmptyState title="暂无机型数据" description="数据源返回为空，请稍后重试。" />;
  }
  if (model === null) {
    return (
      <EmptyState
        title="没找到这台机型"
        description={`地址里的机型 ${productId} 不在当前机型库中，可能已下架或地址有误。`}
        action={<Button onClick={onPickProduct}>回到挑机型</Button>}
      />
    );
  }

  function submitFeedback(): void {
    if (draft.summary.trim() === '') {
      setFormError('请先写下你遇到的情况，再保存。');
      return;
    }
    setFormError(null);
    dispatch({
      type: 'ADD_FEEDBACK',
      input: {
        productId,
        kind: draft.kind,
        sceneLabel: draft.sceneLabel,
        summary: draft.summary,
        dimension: draft.dimension,
        severity: draft.severity,
      },
      at: new Date().toISOString(),
    });
    setDraft(EMPTY_DRAFT);
  }

  const communityPainCount = scenarios.reduce(
    (sum, scenario) => sum + scenario.painPoints.length,
    0,
  );
  const problemCount = myFeedback.filter((entry) => entry.kind === 'problem').length;
  const confirmedCount = rootCauses.filter((group) => group.isConfirmedWeakness).length;

  const overviewItems: readonly OverviewStat[] = [
    {
      label: '社区反馈',
      value: `${communityPainCount} 条`,
      hint: `覆盖 ${scenarios.length} 个使用场景`,
    },
    {
      label: '我记的反馈',
      value: `${myFeedback.length} 条`,
      hint: problemCount > 0 ? `其中 ${problemCount} 条是问题` : '还没记过问题',
      tone: problemCount > 0 ? ('caution' as const) : ('neutral' as const),
    },
    {
      label: '确有短板的维度',
      value: `${confirmedCount} 个`,
      hint: confirmedCount === 0 ? '抱怨都不指向低分维度' : '低分且有反馈指向',
      tone: confirmedCount > 0 ? ('critical' as const) : ('positive' as const),
    },
    { label: '数据采集日', value: formatIsoDate(snapshot.capturedAt), hint: '请以官网为准' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${BRAND_LABELS[model.brand]} ${model.name} 的实际表现`}
        description="官方参数只说了它能做什么。这一页看的是它实际表现如何：核心数据、真实用户反馈，以及这些抱怨到底出在哪个能力上。"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                onOpenProduct(model.id);
              }}
            >
              回看它的参数
            </Button>
            <Button variant="ghost" onClick={onPickProduct}>
              换一台
            </Button>
          </>
        }
      />

      <OverviewStats items={overviewItems} summary={summarizeRootCauses(model, rootCauses)} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="核心数据"
          badge={<InternalAnalysisBadge />}
          description="六个能力维度的当前水平，每项都能点开来源核对。"
        >
          <CoreMetricsPanel model={model} />
        </Section>

        <Section
          title="问题根因"
          badge={<InternalAnalysisBadge />}
          description="把每条反馈按它最可能对应的能力维度归拢，再和这台机型在该维度的实际得分放在一起。"
        >
          {rootCauses.length === 0 ? (
            <EmptyState
              title="还没有指向具体能力的反馈"
              description="社区讨论与你自己录入的反馈都会自动并入这里。"
            />
          ) : (
            <ul className="space-y-3">
              {rootCauses.map((group) => (
                <li
                  key={group.dimension}
                  className={`rounded-[var(--radius-control)] border p-3 ${
                    group.isConfirmedWeakness
                      ? 'border-[var(--color-critical)] bg-[var(--color-critical-soft)]/25'
                      : 'border-[var(--color-line-subtle)] bg-[var(--color-surface-inset)]'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">
                      {group.label}
                    </h4>
                    <span className="numeric text-xs text-[var(--color-ink-body)]">
                      能力分 {group.score} · {group.totalCount} 条反馈
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-ink-body)]">
                    {group.isConfirmedWeakness
                      ? `得分偏低且有 ${group.totalCount} 条反馈指向它，这个短板确实会被感知到。`
                      : `有 ${group.totalCount} 条反馈指向它，但这台机器在该维度得分不低，更可能是拍摄方法或场景预期的问题。`}
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    {group.communityPains.length > 0 && (
                      <Disclosure summary="社区里的相关反馈" count={group.communityPains.length}>
                        <ul className="space-y-1.5 text-xs">
                          {group.communityPains.map((pain) => (
                            <li key={pain.id}>
                              <span className="text-[var(--color-ink-body)]">{pain.summary}</span>
                              <div className="mt-0.5">
                                <SourceLink source={pain.source} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </Disclosure>
                    )}
                    {group.localProblems.length > 0 && (
                      <Disclosure summary="我自己记的相关反馈" count={group.localProblems.length}>
                        <ul className="space-y-1 text-xs">
                          {group.localProblems.map((entry) => (
                            <li key={entry.id} className="flex flex-wrap items-center gap-1.5">
                              <LocalDataBadge />
                              <span className="text-[var(--color-ink-body)]">{entry.summary}</span>
                            </li>
                          ))}
                        </ul>
                      </Disclosure>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-muted)]">
            {ROOT_CAUSE_NOTE}
          </p>
        </Section>
      </div>

      <Section
        title={`社区在讨论什么（${communityPainCount}）`}
        badge={<SourceBadge kind="community" />}
        description="来自这台机器目标人群的真实讨论，每条都保留原贴链接。这里是转述大意，点开可以读原文。"
      >
        {scenarios.length === 0 ? (
          <EmptyState
            title="暂无匹配的社区讨论"
            description="当前数据集里还没有覆盖这台机型官方定位人群的讨论。"
          />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {scenarios.map((scenario) => (
              <CommunityThread key={scenario.id} scenario={scenario} />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="记一条我遇到的情况"
        badge={<LocalDataBadge />}
        description="录进来的反馈会按能力维度并入上方的根因分析，只保存在你的浏览器里。"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Field label="这是问题还是好评">
              {(id) => (
                <select
                  id={id}
                  value={draft.kind}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      kind: event.target.value as FeedbackKind,
                    }));
                  }}
                  className={INPUT_CLASSES}
                >
                  {Object.entries(FEEDBACK_KIND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="什么场景" hint="例如「夜骑」「雪场」「水下」。">
              {(id) => (
                <input
                  id={id}
                  type="text"
                  value={draft.sceneLabel}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, sceneLabel: event.target.value }));
                  }}
                  className={INPUT_CLASSES}
                />
              )}
            </Field>

            <Field label="具体情况" required>
              {(id) => (
                <textarea
                  id={id}
                  rows={3}
                  value={draft.summary}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, summary: event.target.value }));
                  }}
                  placeholder="录到 40 分钟就因为过热停了一次"
                  className={INPUT_CLASSES}
                />
              )}
            </Field>
          </div>

          <div className="space-y-3">
            <Field label="你觉得是哪方面的问题" hint="选完会并入对应维度的根因分析。">
              {(id) => (
                <select
                  id={id}
                  value={draft.dimension}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      dimension: event.target.value as CapabilityDimension,
                    }));
                  }}
                  className={INPUT_CLASSES}
                >
                  {CAPABILITY_DIMENSIONS.map((dimension) => (
                    <option key={dimension} value={dimension}>
                      {CAPABILITY_LABELS[dimension]}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <ScoreInput
              label={`影响程度：${describeSeverityLevel(draft.severity)}`}
              value={draft.severity}
              onChange={(value) => {
                setDraft((current) => ({ ...current, severity: value }));
              }}
            />

            {formError !== null && (
              <p role="alert" className="text-xs text-[var(--color-critical)]">
                {formError}
              </p>
            )}

            <Button variant="primary" onClick={submitFeedback}>
              保存这条反馈
            </Button>
          </div>
        </div>
      </Section>

      <CollapsibleSection
        title={`我记过的反馈（${myFeedback.length}）`}
        description="按场景分组，方便回看同一场景下的表现变化"
        defaultOpen={myFeedback.length > 0}
      >
        {myFeedback.length === 0 ? (
          <EmptyState
            title="还没有记录"
            description="用上面的表单记下第一条，之后就能看到同一场景下的表现变化。"
          />
        ) : (
          <div className="space-y-4">
            {byScene.map((group) => (
              <div key={group.sceneLabel}>
                <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">
                  {group.sceneLabel}
                  <span className="numeric ml-1.5 text-xs font-normal text-[var(--color-ink-muted)]">
                    {group.entries.length} 条
                  </span>
                </h4>
                <ul className="mt-2 space-y-2">
                  {group.entries.map((entry) => (
                    <FeedbackItem
                      key={entry.id}
                      entry={entry}
                      onRemove={() => {
                        dispatch({
                          type: 'REMOVE_FEEDBACK',
                          id: entry.id,
                          at: new Date().toISOString(),
                        });
                      }}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}

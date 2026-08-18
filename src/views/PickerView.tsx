import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  EMPTY_CRITERIA,
  MATCH_FORMULA_NOTE,
  recommendProducts,
  summarizeRecommendation,
  type ProductMatch,
  type SelectionCriteria,
} from '../domain/product-recommendation';
import { scorePlayFit } from '../domain/play-matching';
import { formatIsoDate, formatPrice, formatScore } from '../lib/format';
import { describeCapabilityLevel } from '../lib/wording';
import { Button, StagePill } from '../components/Controls';
import { CollapsibleSection, Disclosure } from '../components/Disclosure';
import { EmptyState, ErrorNotice, LoadingBlock } from '../components/Feedback';
import { OverviewStats, type OverviewStat } from '../components/Overview';
import { PageHeader, Section } from '../components/PageHeader';
import { ProductPhoto } from '../components/ProductPhoto';
import { SceneArt } from '../components/SceneArt';
import { InternalAnalysisBadge } from '../components/SourceBadge';
import { SourceList } from '../components/SourceList';
import { useAsyncResource } from '../state/use-async-resource';
import { useWorkspace } from '../state/use-workspace';
import type { AgentGateway } from '../gateway/agent-gateway';
import {
  AUDIENCE_LABELS,
  BRAND_LABELS,
  FORM_FACTOR_LABELS,
  TREND_IMPACT_LABELS,
  type AudienceId,
  type CompetitorSnapshot,
  type FormFactor,
  type IndustryTrend,
  type RumorEntry,
} from '../types/competitor';
import type { DecisionNote } from '../types/decision';
import { RADAR_CATEGORY_LABELS, RADAR_RING_LABELS } from '../types/tech-radar';
import type { PlayStyle } from '../types/play';

/**
 * 挑机型页。
 *
 * 从首页带着某个玩法进来时，这个玩法的人群会被预选，
 * 每张卡上额外显示「拍这个玩法契合度多少」，让选择和目的对得上。
 */

const RUMOR_STATUS_LABELS: Readonly<Record<RumorEntry['status'], string>> = {
  unannounced: '未发布',
  delayed: '超出预期窗口',
  teased: '已预告未开售',
};

/** 预算档位。金额为人民币，与数据里的官方价口径一致。 */
const BUDGET_OPTIONS: readonly { readonly label: string; readonly value: number | null }[] = [
  { label: '不限预算', value: null },
  { label: '¥2000 以内', value: 2000 },
  { label: '¥3000 以内', value: 3000 },
  { label: '¥5000 以内', value: 5000 },
];

function ProductCard({
  match,
  rank,
  decision,
  playFitScore,
  playName,
  onOpen,
}: {
  readonly match: ProductMatch;
  readonly rank: number;
  /** 用户已记下的选购状态；没记过为 undefined */
  readonly decision: DecisionNote | undefined;
  /** 带着玩法进来时该机型对这个玩法的契合度 */
  readonly playFitScore: number | null;
  readonly playName: string | null;
  readonly onOpen: () => void;
}): ReactNode {
  const { model } = match;
  const isTop = rank === 1;

  return (
    <article
      className={`panel panel-interactive p-4 sm:p-5 ${isTop ? 'border-[var(--color-accent)]' : ''}`}
    >
      <div className="flex items-start gap-3">
        <ProductPhoto model={model} />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[var(--color-ink-strong)]">
            {BRAND_LABELS[model.brand]} {model.name}
          </h4>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            {FORM_FACTOR_LABELS[model.formFactor]} · 综合能力
            {describeCapabilityLevel(match.overallScore)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="numeric text-sm font-semibold text-[var(--color-ink-strong)]">
            {formatPrice(model.price.value)}
          </p>
          <p className="numeric mt-0.5 text-xs text-[var(--color-ink-muted)]">
            匹配度 {formatScore(match.score)}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {isTop && (
          <span className="inline-flex rounded-full border border-[var(--color-accent)] px-2 py-0.5 text-[11px] text-[var(--color-accent)]">
            当前条件下最贴合
          </span>
        )}
        {decision !== undefined && <StagePill stage={decision.stage} />}
      </div>

      {playFitScore !== null && playName !== null && (
        <p className="numeric mt-2 text-xs text-[var(--color-ink-body)]">
          拍「{playName}」契合度 {formatScore(playFitScore)}
        </p>
      )}

      <ul className="mt-3 space-y-1 text-xs">
        {match.reasons.map((reason) => (
          <li key={reason.label}>
            <span className="font-medium text-[var(--color-ink-strong)]">{reason.label}</span>
            <span className="text-[var(--color-ink-body)]">：{reason.detail}</span>
          </li>
        ))}
      </ul>

      {match.weakestDimension !== null && (
        <p className="mt-2 text-xs text-[var(--color-caution)]">
          相对短板：{match.weakestDimension}。点进去能看到用户在这方面的实际反馈。
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-line-subtle)] pt-3">
        <Button variant={isTop ? 'primary' : 'secondary'} onClick={onOpen}>
          看这台怎么样
        </Button>
        <Disclosure summary="数据来源" count={model.price.sources.length}>
          <SourceList sources={model.price.sources} label={`${model.name} 的价格来源`} />
        </Disclosure>
      </div>
    </article>
  );
}

function TrendCard({ trend }: { readonly trend: IndustryTrend }): ReactNode {
  return (
    <article className="rounded-[var(--radius-control)] bg-[var(--color-surface-inset)] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">{trend.title}</h4>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {TREND_IMPACT_LABELS[trend.impact]}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-[var(--color-ink-body)]">{trend.summary}</p>
      <p className="mt-2 text-xs">
        <span className="text-[var(--color-ink-muted)]">对选型的启示：</span>
        <span className="text-[var(--color-ink-body)]">{trend.implication}</span>
      </p>
      <div className="mt-2">
        <Disclosure summary="支撑证据" count={trend.evidence.length}>
          <ul className="space-y-1.5 text-xs">
            {trend.evidence.map((item, index) => (
              <li key={index}>
                <span className="text-[var(--color-ink-body)]">{String(item.value)}</span>
                <SourceList sources={item.sources} note={item.note} label="趋势证据来源" />
              </li>
            ))}
          </ul>
        </Disclosure>
      </div>
    </article>
  );
}

export interface PickerViewProps {
  readonly gateway: AgentGateway;
  readonly onSelectProduct: (productId: string) => void;
  /** 从首页带进来的玩法；直接进入本页时为 null */
  readonly activePlay: PlayStyle | null;
  readonly onClearPlay: () => void;
  readonly onBackToPlays: () => void;
}

export function PickerView({
  gateway,
  onSelectProduct,
  activePlay,
  onClearPlay,
  onBackToPlays,
}: PickerViewProps): ReactNode {
  const { state } = useWorkspace();
  const resource = useAsyncResource<CompetitorSnapshot>(() => gateway.fetchCompetitorSnapshot());
  const radarResource = useAsyncResource(() => gateway.fetchTrendRadar());
  const [criteria, setCriteria] = useState<SelectionCriteria>(EMPTY_CRITERIA);

  // 带着玩法进来时预选它的人群，让首页的选择在这一步延续下去
  useEffect(() => {
    if (activePlay === null) {
      return;
    }
    setCriteria((current) =>
      current.audiences.includes(activePlay.audience)
        ? current
        : { ...current, audiences: [activePlay.audience] },
    );
  }, [activePlay]);

  const snapshot = resource.data;
  const radar = radarResource.data;

  const matches = useMemo(
    () => (snapshot === null ? [] : recommendProducts(snapshot.models, criteria)),
    [snapshot, criteria],
  );

  const decisionByProduct = useMemo(() => {
    const byProduct = new Map<string, DecisionNote>();
    for (const note of state.data.decisions) {
      byProduct.set(note.productId, note);
    }
    return byProduct;
  }, [state.data.decisions]);

  function toggleAudience(audience: AudienceId): void {
    setCriteria((current) => ({
      ...current,
      audiences: current.audiences.includes(audience)
        ? current.audiences.filter((item) => item !== audience)
        : [...current.audiences, audience],
    }));
  }

  function toggleFormFactor(formFactor: FormFactor): void {
    setCriteria((current) => ({
      ...current,
      formFactors: current.formFactors.includes(formFactor)
        ? current.formFactors.filter((item) => item !== formFactor)
        : [...current.formFactors, formFactor],
    }));
  }

  if (resource.status === 'loading' || resource.status === 'idle') {
    return <LoadingBlock label="机型库" />;
  }
  if (resource.status === 'error' && resource.error !== null) {
    return <ErrorNotice error={resource.error} onRetry={resource.reload} />;
  }
  if (snapshot === null) {
    return <EmptyState title="暂无机型数据" description="数据源返回为空，请稍后重试。" />;
  }

  const trackedCount = state.data.decisions.length;
  const overviewItems: readonly OverviewStat[] = [
    { label: '可选机型', value: `${snapshot.models.length} 款`, hint: '大疆 / 影石 / GoPro' },
    {
      label: '符合当前条件',
      value: `${matches.length} 款`,
      hint: criteria.audiences.length === 0 ? '还没选场景' : '已按匹配度排序',
    },
    {
      label: '我记下的机型',
      value: `${trackedCount} 款`,
      hint: trackedCount === 0 ? '看中就记一条' : '在「我的选购」里查看',
      tone: trackedCount > 0 ? ('positive' as const) : ('neutral' as const),
    },
    { label: '数据采集日', value: formatIsoDate(snapshot.capturedAt), hint: '请以官网为准' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="选型对比"
        description="告诉我们你要拍什么，我们按真实参数和实测数据排出最贴合的机型。每条推荐理由都能点开对回原始来源。"
        actions={
          <Button variant="secondary" onClick={onBackToPlays}>
            回去看玩法
          </Button>
        }
      />

      {activePlay !== null && (
        <section
          aria-label="当前玩法"
          className="panel flex flex-wrap items-center gap-3 p-3 sm:p-4"
        >
          <SceneArt artKey={activePlay.artKey} className="h-16 w-24 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--color-ink-muted)]">正在为这个玩法挑机器</p>
            <p className="mt-0.5 text-sm font-medium text-[var(--color-ink-strong)]">
              {activePlay.name}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
              已按{AUDIENCE_LABELS[activePlay.audience]}预选场景，下方每张卡都标出了它的契合度。
            </p>
          </div>
          <Button variant="ghost" onClick={onClearPlay}>
            不限玩法
          </Button>
        </section>
      )}

      <OverviewStats
        items={overviewItems}
        summary={summarizeRecommendation(matches, criteria)}
        action={
          criteria.audiences.length > 0 || criteria.maxPrice !== null ? (
            <Button
              variant="ghost"
              onClick={() => {
                setCriteria(EMPTY_CRITERIA);
              }}
            >
              重置条件
            </Button>
          ) : undefined
        }
      />

      <Section
        title="你要拍什么"
        description="多选会取各场景的平均权重。不选也能看，但按场景筛出来的结果更贴合。"
        actions={
          <Disclosure summary="匹配度怎么算">
            <p className="max-w-prose text-xs text-[var(--color-ink-muted)]">
              {MATCH_FORMULA_NOTE}
            </p>
          </Disclosure>
        }
      >
        <div className="space-y-4">
          <fieldset>
            <legend className="text-xs font-medium text-[var(--color-ink-muted)]">
              拍摄场景（可多选）
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(AUDIENCE_LABELS).map(([id, label]) => {
                const selected = criteria.audiences.includes(id as AudienceId);
                return (
                  <label
                    key={id}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                      selected
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-medium text-[var(--color-ink-strong)]'
                        : 'border-[var(--color-line-subtle)] text-[var(--color-ink-body)] hover:border-[var(--color-line-strong)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        toggleAudience(id as AudienceId);
                      }}
                      className="sr-only"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium text-[var(--color-ink-muted)]">预算</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((option) => {
                const selected = criteria.maxPrice === option.value;
                return (
                  <label
                    key={option.label}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                      selected
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-medium text-[var(--color-ink-strong)]'
                        : 'border-[var(--color-line-subtle)] text-[var(--color-ink-body)] hover:border-[var(--color-line-strong)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="budget"
                      checked={selected}
                      onChange={() => {
                        setCriteria((current) => ({ ...current, maxPrice: option.value }));
                      }}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">
              略超预算的机型不会被藏起来，只会按超出比例扣分并标注。
            </p>
          </fieldset>

          <Disclosure summary="按机身形态筛选">
            <fieldset className="flex flex-wrap gap-x-3 gap-y-1.5">
              <legend className="sr-only">按机身形态筛选</legend>
              {Object.entries(FORM_FACTOR_LABELS).map(([id, label]) => (
                <label key={id} className="flex cursor-pointer items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={criteria.formFactors.includes(id as FormFactor)}
                    onChange={() => {
                      toggleFormFactor(id as FormFactor);
                    }}
                    className="size-3.5 accent-[var(--color-accent)]"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          </Disclosure>
        </div>
      </Section>

      <Section
        title={`推荐机型（${matches.length}）`}
        badge={<InternalAnalysisBadge />}
        description="排序由公开的加权算式得出，每条理由都能对回真实参数。"
      >
        {matches.length === 0 ? (
          <EmptyState
            title="没有符合条件的机型"
            description="机身形态是硬条件，取消一部分形态筛选再试。"
            action={
              <Button
                onClick={() => {
                  setCriteria(EMPTY_CRITERIA);
                }}
              >
                重置条件
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {matches.map((match, index) => (
              <ProductCard
                key={match.model.id}
                match={match}
                rank={index + 1}
                decision={decisionByProduct.get(match.model.id)}
                playFitScore={
                  activePlay === null ? null : scorePlayFit(activePlay, match.model).score
                }
                playName={activePlay?.name ?? null}
                onOpen={() => {
                  onSelectProduct(match.model.id);
                }}
              />
            ))}
          </div>
        )}
      </Section>

      <CollapsibleSection
        title="行业动向"
        description={`${snapshot.trends.length} 条 · 真实产品动作构成的趋势判断，帮你判断现在值不值得入手`}
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {snapshot.trends.map((trend) => (
            <TrendCard key={trend.id} trend={trend} />
          ))}
        </div>
      </CollapsibleSection>

      {radar !== null && (
        <CollapsibleSection
          title="这些技术值不值得等"
          description={`${radar.entries.length} 项 · 已普及的现在就该有，仍在观察的可以先不为它加预算`}
        >
          <ul className="space-y-2">
            {radar.entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-[var(--radius-control)] bg-[var(--color-surface-inset)] p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">
                    {entry.name}
                  </h4>
                  <span className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded border border-[var(--color-accent)] px-1.5 py-0.5 text-[var(--color-accent)]">
                      {RADAR_RING_LABELS[entry.ring]}
                    </span>
                    <span className="text-[var(--color-ink-muted)]">
                      {RADAR_CATEGORY_LABELS[entry.category]}
                    </span>
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[var(--color-ink-body)]">{entry.summary}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                  <InternalAnalysisBadge />
                  要注意：{entry.risk}
                </p>
                <div className="mt-1.5">
                  <Disclosure summary="哪些机型已经做到了" count={entry.evidence.length}>
                    <ul className="space-y-1.5 text-xs">
                      {entry.evidence.map((item) => (
                        <li key={item.value}>
                          <span className="text-[var(--color-ink-body)]">{item.value}</span>
                          <SourceList
                            sources={item.sources}
                            note={item.note}
                            label={`${entry.name} 的落地证据来源`}
                          />
                        </li>
                      ))}
                    </ul>
                  </Disclosure>
                </div>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="尚未发布的机型"
        description={`${snapshot.rumors.length} 条 · 未获官方确认，不计入上方推荐`}
      >
        <ul className="space-y-2">
          {snapshot.rumors.map((rumor) => (
            <li
              key={rumor.id}
              className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line-strong)] p-2.5"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">
                  {rumor.subject}
                </h4>
                <span className="rounded border border-[var(--color-caution)] px-1.5 py-0.5 text-[11px] text-[var(--color-caution)]">
                  {RUMOR_STATUS_LABELS[rumor.status]}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--color-ink-body)]">
                {String(rumor.claim.value)}
              </p>
              <SourceList sources={rumor.claim.sources} note={rumor.claim.note} label="传闻来源" />
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}

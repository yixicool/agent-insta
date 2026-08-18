import { useMemo, useState, type ReactNode } from 'react';
import { SCORING_NOTE, scoreCapabilityDimensions } from '../domain/competitor-analysis';
import {
  PRODUCT_GAP_NOTE,
  findProductStrengths,
  findProductWeaknesses,
  summarizeProductPosition,
} from '../domain/product-context';
import {
  PLAY_FIT_NOTE,
  PLAY_FIT_THRESHOLD,
  describePlayFit,
  rankPlaysForModel,
  type PlayFit,
} from '../domain/play-matching';
import { formatPrice, formatScore, formatWeight } from '../lib/format';
import { GENERAL_WORDING, describeCapabilityLevel } from '../lib/wording';
import { RadarChart } from '../components/Charts';
import { Button, Field, INPUT_CLASSES, Modal, StagePill } from '../components/Controls';
import { CollapsibleSection, Disclosure } from '../components/Disclosure';
import { EmptyState, ErrorNotice, LoadingBlock } from '../components/Feedback';
import { Term } from '../components/Glossary';
import { OverviewStats, type OverviewStat } from '../components/Overview';
import { PageHeader, Section } from '../components/PageHeader';
import { ProductPhoto } from '../components/ProductPhoto';
import { SceneArt } from '../components/SceneArt';
import { InternalAnalysisBadge, LocalDataBadge } from '../components/SourceBadge';
import { SourceList } from '../components/SourceList';
import { useAsyncResource } from '../state/use-async-resource';
import { useWorkspace } from '../state/use-workspace';
import { findDecisionForProduct } from '../state/workspace-reducer';
import type { AgentGateway } from '../gateway/agent-gateway';
import {
  AUDIENCE_LABELS,
  BRAND_LABELS,
  FORM_FACTOR_LABELS,
  type CompetitorModel,
  type CompetitorSnapshot,
} from '../types/competitor';
import { DECISION_STAGE_LABELS, DECISION_STAGE_ORDER, type DecisionStage } from '../types/decision';
import type { PlayStyle } from '../types/play';
import { UNDISCLOSED, isUndisclosed, type Sourced } from '../types/provenance';

/**
 * 单机型详情页。
 *
 * 这一页回答「这台机器到底怎么样」：官方参数、六维能力位置、
 * 以及它最拿手的玩法。看中了可以直接记进选购清单。
 */

function plainValue(field: Sourced<unknown>): string {
  const value = field.value;
  if (isUndisclosed(value)) {
    return UNDISCLOSED;
  }
  return typeof value === 'number' ? formatWeight(value) : String(value);
}

function SpecRow({
  label,
  field,
}: {
  readonly label: string;
  readonly field: Sourced<unknown>;
}): ReactNode {
  const undisclosed = isUndisclosed(field.value);
  return (
    <div className="border-b border-[var(--color-line-subtle)]/50 py-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <dt className="w-24 shrink-0 text-xs text-[var(--color-ink-muted)]">{label}</dt>
        <dd
          className={`min-w-0 flex-1 text-xs ${undisclosed ? 'text-[var(--color-ink-muted)] italic' : 'text-[var(--color-ink-body)]'}`}
        >
          {plainValue(field)}
          {field.note !== undefined && (
            <span className="mt-0.5 block text-[var(--color-ink-muted)]">{field.note}</span>
          )}
          <SourceList sources={field.sources} label={`${label}的来源`} />
        </dd>
      </div>
    </div>
  );
}

/** 一个玩法在这台机器上的契合情况 */
function PlayFitCard({ fit }: { readonly fit: PlayFit }): ReactNode {
  const { play } = fit;
  const capable = fit.score >= PLAY_FIT_THRESHOLD;

  return (
    <article className="panel overflow-hidden">
      <SceneArt artKey={play.artKey} className="h-20 w-full" />
      <div className="p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-ink-muted)]">{play.sceneLabel}</p>
            <h4 className="mt-0.5 text-sm font-semibold text-[var(--color-ink-strong)]">
              {play.name}
            </h4>
          </div>
          <span
            className={`numeric shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${
              capable
                ? 'border-[var(--color-positive)] text-[var(--color-positive)]'
                : 'border-[var(--color-caution)] text-[var(--color-caution)]'
            }`}
          >
            契合度 {formatScore(fit.score)}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-ink-body)]">{play.summary}</p>
        <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">{describePlayFit(fit)}</p>
        <div className="mt-2">
          <Disclosure summary="怎么拍" count={play.steps.length}>
            <ol className="space-y-1 text-xs text-[var(--color-ink-body)]">
              {play.steps.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="numeric shrink-0 text-[var(--color-ink-muted)]"
                  >
                    {index + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-[var(--color-ink-muted)]">器材：{play.gearNote}</p>
          </Disclosure>
        </div>
      </div>
    </article>
  );
}

/** 记一条选购决策的弹窗 */
interface DecisionDraft {
  readonly stage: DecisionStage;
  readonly budget: string;
  readonly likes: string;
  readonly worries: string;
  readonly note: string;
  readonly playIds: readonly string[];
}

function DecisionDialog({
  model,
  plays,
  draft,
  onChange,
  onSubmit,
  onClose,
}: {
  readonly model: CompetitorModel;
  readonly plays: readonly PlayStyle[];
  readonly draft: DecisionDraft;
  readonly onChange: (patch: Partial<DecisionDraft>) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}): ReactNode {
  return (
    <Modal
      title={`把 ${model.name} 记进选购清单`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={onSubmit}>
            保存记录
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="我现在的态度">
          {(id) => (
            <select
              id={id}
              value={draft.stage}
              onChange={(event) => {
                onChange({ stage: event.target.value as DecisionStage });
              }}
              className={INPUT_CLASSES}
            >
              {DECISION_STAGE_ORDER.map((stage) => (
                <option key={stage} value={stage}>
                  {DECISION_STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="我的预算上限（人民币）"
          hint={`留空表示没设。这台的官方价是 ${formatPrice(model.price.value)}。`}
        >
          {(id) => (
            <input
              id={id}
              type="number"
              min="0"
              step="1"
              value={draft.budget}
              onChange={(event) => {
                onChange({ budget: event.target.value });
              }}
              className={INPUT_CLASSES}
            />
          )}
        </Field>

        <fieldset>
          <legend className="text-xs font-medium text-[var(--color-ink-muted)]">
            我打算用它拍（可多选）
          </legend>
          <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-line-subtle)] p-2">
            {plays.map((play) => (
              <label key={play.id} className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={draft.playIds.includes(play.id)}
                  onChange={() => {
                    onChange({
                      playIds: draft.playIds.includes(play.id)
                        ? draft.playIds.filter((id) => id !== play.id)
                        : [...draft.playIds, play.id],
                    });
                  }}
                  className="mt-0.5 size-3.5 shrink-0 accent-[var(--color-accent)]"
                />
                <span className="text-[var(--color-ink-body)]">
                  {play.name}
                  <span className="ml-1 text-[var(--color-ink-muted)]">（{play.sceneLabel}）</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="看中它什么" hint="一行一条。">
          {(id) => (
            <textarea
              id={id}
              rows={3}
              value={draft.likes}
              onChange={(event) => {
                onChange({ likes: event.target.value });
              }}
              placeholder={'低光够用\n20 米防水不用另买壳'}
              className={INPUT_CLASSES}
            />
          )}
        </Field>

        <Field label="还在犹豫什么" hint="一行一条。写下来才好比较。">
          {(id) => (
            <textarea
              id={id}
              rows={3}
              value={draft.worries}
              onChange={(event) => {
                onChange({ worries: event.target.value });
              }}
              placeholder={'比预算高了一点\n不确定续航够不够'}
              className={INPUT_CLASSES}
            />
          )}
        </Field>

        <Field label="备注">
          {(id) => (
            <textarea
              id={id}
              rows={2}
              value={draft.note}
              onChange={(event) => {
                onChange({ note: event.target.value });
              }}
              className={INPUT_CLASSES}
            />
          )}
        </Field>

        <p className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
          <LocalDataBadge />
          这条记录只保存在你的浏览器里，不会上传。
        </p>
      </div>
    </Modal>
  );
}

function toLines(text: string): readonly string[] {
  return text.split('\n');
}

export interface ProductViewProps {
  readonly gateway: AgentGateway;
  readonly productId: string;
  readonly onPickProduct: () => void;
  readonly onOpenMonitor: (productId: string) => void;
  readonly onOpenDecisions: () => void;
}

export function ProductView({
  gateway,
  productId,
  onPickProduct,
  onOpenMonitor,
  onOpenDecisions,
}: ProductViewProps): ReactNode {
  const { state, dispatch } = useWorkspace();
  const snapshotResource = useAsyncResource<CompetitorSnapshot>(() =>
    gateway.fetchCompetitorSnapshot(),
  );
  const playsResource = useAsyncResource(() => gateway.fetchPlayStyles());
  const [draft, setDraft] = useState<DecisionDraft | null>(null);

  const snapshot = snapshotResource.data;
  const plays = playsResource.data ?? [];

  const model = useMemo(
    () => snapshot?.models.find((candidate) => candidate.id === productId) ?? null,
    [snapshot, productId],
  );

  const existingDecision = findDecisionForProduct(state.data, productId);

  const playFits = useMemo(
    () => (model === null ? [] : rankPlaysForModel(model, plays)),
    [model, plays],
  );

  const weaknesses = useMemo(
    () =>
      model === null || snapshot === null ? [] : findProductWeaknesses(model, snapshot.models),
    [model, snapshot],
  );

  const strengths = useMemo(
    () => (model === null || snapshot === null ? [] : findProductStrengths(model, snapshot.models)),
    [model, snapshot],
  );

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

  const dimensions = scoreCapabilityDimensions(model);
  const overall = Number(
    (dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length).toFixed(1),
  );

  function openDraft(): void {
    setDraft({
      stage: existingDecision?.stage ?? 'considering',
      budget:
        existingDecision?.budget === undefined || existingDecision.budget === null
          ? ''
          : String(existingDecision.budget),
      likes: existingDecision?.likes.join('\n') ?? '',
      worries: existingDecision?.worries.join('\n') ?? '',
      note: existingDecision?.note ?? '',
      playIds: existingDecision?.playIds ?? [],
    });
  }

  /** model 由调用处传入：函数声明拿不到外层对 model 的 null 收窄 */
  function submitDraft(target: CompetitorModel): void {
    if (draft === null) {
      return;
    }
    const parsedBudget = draft.budget.trim() === '' ? null : Number(draft.budget);
    dispatch({
      type: 'SAVE_DECISION',
      input: {
        productId: target.id,
        stage: draft.stage,
        playIds: draft.playIds,
        // 非数字输入按「没设预算」处理，reducer 会再做一次范围清洗
        budget: parsedBudget === null || !Number.isFinite(parsedBudget) ? null : parsedBudget,
        likes: toLines(draft.likes),
        worries: toLines(draft.worries),
        note: draft.note,
      },
      at: new Date().toISOString(),
    });
    setDraft(null);
  }

  const bestPlay = playFits[0];
  const overviewItems: readonly OverviewStat[] = [
    {
      label: '综合能力',
      value: formatScore(overall),
      hint: describeCapabilityLevel(overall),
    },
    {
      label: '官方价',
      value: formatPrice(model.price.value),
      hint: model.price.value.region,
    },
    {
      label: '最拿手的玩法',
      value: bestPlay === undefined ? '—' : formatScore(bestPlay.score),
      hint: bestPlay === undefined ? '玩法库加载中' : bestPlay.play.name,
      tone: 'positive' as const,
    },
    {
      label: '我的态度',
      value:
        existingDecision === undefined ? '未记录' : DECISION_STAGE_LABELS[existingDecision.stage],
      hint: existingDecision === undefined ? '看中就记一条' : '在「我的选购」里比较',
      tone: existingDecision === undefined ? ('neutral' as const) : ('positive' as const),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${BRAND_LABELS[model.brand]} ${model.name}`}
        description={summarizeProductPosition(model, snapshot.models, weaknesses)}
        actions={
          <>
            <Button variant="primary" onClick={openDraft}>
              {existingDecision === undefined ? '记进选购清单' : '更新我的记录'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onOpenMonitor(model.id);
              }}
            >
              看它的实际表现
            </Button>
            <Button variant="ghost" onClick={onPickProduct}>
              换一台
            </Button>
          </>
        }
        meta={
          <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <ProductPhoto model={model} />
            {FORM_FACTOR_LABELS[model.formFactor]} · 官方定位
            {model.targetAudiences.map((id) => AUDIENCE_LABELS[id]).join('、')}
            {existingDecision !== undefined && <StagePill stage={existingDecision.stage} />}
          </p>
        }
      />

      <OverviewStats items={overviewItems} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="六维能力"
          badge={<InternalAnalysisBadge />}
          description="每个维度的分数都附有官方规格或第三方实测来源。"
        >
          <RadarChart
            axes={dimensions.map((item) => item.label)}
            series={[{ label: model.name, values: dimensions.map((item) => item.score) }]}
            caption={`${model.name} 的六维能力评分`}
          />
          <ul className="mt-3 space-y-2">
            {dimensions.map((item) => (
              <li key={item.dimension} className="text-xs">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[var(--color-ink-body)]">{item.label}</span>
                  <span className="numeric text-[var(--color-ink-strong)]">
                    {item.score}
                    <span className="ml-1.5 text-[var(--color-ink-muted)]">
                      {describeCapabilityLevel(item.score)}
                    </span>
                  </span>
                </div>
                <SourceList
                  sources={model.capabilities[item.dimension].sources}
                  note={model.capabilities[item.dimension].note}
                  label={`${item.label}评分的来源`}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
            <Term wording={GENERAL_WORDING.capabilityScore} />：{SCORING_NOTE}
          </p>
        </Section>

        <Section title="官方参数" description="查不到的字段标为「未公开」，不填近似值。">
          <dl>
            <SpecRow label="发布日期" field={model.releasedOn} />
            <SpecRow label="传感器" field={model.sensor} />
            <SpecRow label="光圈" field={model.aperture} />
            <SpecRow label="最高视频" field={model.maxVideo} />
            <SpecRow label="防抖" field={model.stabilization} />
            <SpecRow label="官方续航" field={model.ratedBattery} />
            <SpecRow label="实测续航" field={model.measuredBattery} />
            <SpecRow label="防水" field={model.waterproof} />
            <SpecRow label="重量" field={model.weightGrams} />
            <SpecRow label="存储" field={model.storage} />
            <SpecRow label="价格" field={model.price} />
          </dl>
        </Section>
      </div>

      <Section
        title={`它最拿手的玩法（${playFits.length}）`}
        badge={<InternalAnalysisBadge />}
        description="按玩法依赖的能力维度在这台机器上的得分排序，契合度低的也列出来，避免只看到好的一面。"
      >
        {playFits.length === 0 ? (
          <EmptyState title="玩法库加载中" description="稍等一下，或刷新页面重试。" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playFits.map((fit) => (
              <PlayFitCard key={fit.play.id} fit={fit} />
            ))}
          </div>
        )}
        <p className="mt-3 max-w-prose text-xs text-[var(--color-ink-muted)]">{PLAY_FIT_NOTE}</p>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="它的强项" description="明显高于同类平均的维度。">
          {strengths.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)]">
              没有明显高于同类平均的维度，属于均衡型机器。
            </p>
          ) : (
            <ul className="space-y-2">
              {strengths.map((strength) => (
                <li
                  key={strength.dimension}
                  className="rounded-[var(--radius-control)] bg-[var(--color-surface-inset)] p-3"
                >
                  <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">
                    {strength.label}
                    <span className="numeric ml-2 text-xs font-normal text-[var(--color-positive)]">
                      高于同类平均 {formatScore(strength.surplus)} 分
                    </span>
                  </h4>
                  <p className="numeric mt-1 text-xs text-[var(--color-ink-body)]">
                    本机 {strength.score} · 同类平均 {strength.peerAverage}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="它的短板" description="明显低于同类平均的维度。">
          {weaknesses.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)]">没有明显落后同类平均的维度。</p>
          ) : (
            <ul className="space-y-2">
              {weaknesses.map((weakness) => (
                <li
                  key={weakness.dimension}
                  className="rounded-[var(--radius-control)] bg-[var(--color-surface-inset)] p-3"
                >
                  <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">
                    {weakness.label}
                    <span className="numeric ml-2 text-xs font-normal text-[var(--color-caution)]">
                      低于同类平均 {formatScore(weakness.deficit)} 分
                    </span>
                  </h4>
                  <p className="numeric mt-1 text-xs text-[var(--color-ink-body)]">
                    本机 {weakness.score} · 同类平均 {weakness.peerAverage} · {weakness.leaderName}{' '}
                    做到 {weakness.leaderScore}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-[var(--color-ink-muted)]">{PRODUCT_GAP_NOTE}</p>
        </Section>
      </div>

      <CollapsibleSection
        title="官方说的优点与已知不足"
        description={`${model.strengths.length + model.weaknesses.length} 条 · 每条都附来源`}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">优点</h4>
            <ul className="mt-2 space-y-2 text-xs">
              {model.strengths.map((item) => (
                <li key={item.value}>
                  <span className="text-[var(--color-ink-body)]">{item.value}</span>
                  <SourceList sources={item.sources} note={item.note} label="优点来源" />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-[var(--color-ink-strong)]">已知不足</h4>
            <ul className="mt-2 space-y-2 text-xs">
              {model.weaknesses.map((item) => (
                <li key={item.value}>
                  <span className="text-[var(--color-ink-body)]">{item.value}</span>
                  <SourceList sources={item.sources} note={item.note} label="不足来源" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      {existingDecision !== undefined && (
        <Section
          title="我对这台的记录"
          badge={<LocalDataBadge />}
          actions={
            <Button variant="secondary" onClick={onOpenDecisions}>
              去比较所有候选
            </Button>
          }
        >
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-[var(--color-ink-muted)]">态度</dt>
              <dd className="mt-0.5 text-[var(--color-ink-body)]">
                {DECISION_STAGE_LABELS[existingDecision.stage]}
              </dd>
            </div>
            {existingDecision.likes.length > 0 && (
              <div>
                <dt className="text-[var(--color-ink-muted)]">看中</dt>
                <dd className="mt-0.5 text-[var(--color-ink-body)]">
                  {existingDecision.likes.join('；')}
                </dd>
              </div>
            )}
            {existingDecision.worries.length > 0 && (
              <div>
                <dt className="text-[var(--color-ink-muted)]">犹豫</dt>
                <dd className="mt-0.5 text-[var(--color-ink-body)]">
                  {existingDecision.worries.join('；')}
                </dd>
              </div>
            )}
          </dl>
        </Section>
      )}

      {draft !== null && (
        <DecisionDialog
          model={model}
          plays={plays}
          draft={draft}
          onChange={(patch) => {
            setDraft((current) => (current === null ? current : { ...current, ...patch }));
          }}
          onSubmit={() => {
            submitDraft(model);
          }}
          onClose={() => {
            setDraft(null);
          }}
        />
      )}
    </div>
  );
}

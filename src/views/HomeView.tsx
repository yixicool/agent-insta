import { useMemo, useState, type ReactNode } from 'react';
import { PLAY_FIT_NOTE, describePlayDemands, rankModelsForPlay } from '../domain/play-matching';
import { formatIsoDate, formatPrice } from '../lib/format';
import { Button } from '../components/Controls';
import { Disclosure } from '../components/Disclosure';
import { EmptyState, ErrorNotice, LoadingBlock } from '../components/Feedback';
import { PageHeader, Section } from '../components/PageHeader';
import { SceneArt } from '../components/SceneArt';
import { InternalAnalysisBadge } from '../components/SourceBadge';
import { SourceList } from '../components/SourceList';
import { UploadPlayCard, UserPlayCard } from '../components/UserPlays';
import { useAsyncResource } from '../state/use-async-resource';
import { useWorkspace } from '../state/use-workspace';
import type { AgentGateway } from '../gateway/agent-gateway';
import {
  AUDIENCE_LABELS,
  BRAND_LABELS,
  type AudienceId,
  type CompetitorSnapshot,
} from '../types/competitor';
import { PLAY_EFFORT_LABELS, type PlayStyle } from '../types/play';

/**
 * 展示首页。
 *
 * 站点入口不再是筛选表单,而是「这类相机能拍出什么」：
 * 先用玩法卡把场景与拍法讲清楚,用户看中哪个玩法,再顺着它去挑机器。
 * 每张卡的场景图都是自绘示意,不使用任何品牌官方图片。
 */

function EffortTag({ play }: { readonly play: PlayStyle }): ReactNode {
  const tone =
    play.effort === 'easy'
      ? 'border-[var(--color-positive)] text-[var(--color-positive)]'
      : play.effort === 'moderate'
        ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
        : 'border-[var(--color-caution)] text-[var(--color-caution)]';
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] leading-none ${tone}`}
    >
      {PLAY_EFFORT_LABELS[play.effort]}
    </span>
  );
}

function PlayCard({
  play,
  snapshot,
  onPickPlay,
}: {
  readonly play: PlayStyle;
  readonly snapshot: CompetitorSnapshot | null;
  readonly onPickPlay: (play: PlayStyle) => void;
}): ReactNode {
  const topFit = useMemo(() => {
    if (snapshot === null) {
      return null;
    }
    return rankModelsForPlay(play, snapshot.models)[0] ?? null;
  }, [play, snapshot]);

  return (
    <article className="panel panel-interactive overflow-hidden">
      <SceneArt artKey={play.artKey} className="h-32 w-full" />

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-[var(--color-accent)]">
              {play.sceneLabel} · {AUDIENCE_LABELS[play.audience]}
            </p>
            <h4 className="mt-0.5 text-base font-semibold text-[var(--color-ink-strong)]">
              {play.name}
            </h4>
          </div>
          <EffortTag play={play} />
        </div>

        <p className="mt-2 text-sm text-[var(--color-ink-body)]">{play.summary}</p>

        {topFit !== null && (
          <p className="mt-2 text-xs text-[var(--color-ink-body)]">
            <span className="text-[var(--color-ink-muted)]">现在最拍得动它的是</span>{' '}
            <span className="font-medium text-[var(--color-ink-strong)]">
              {BRAND_LABELS[topFit.model.brand]} {topFit.model.name}
            </span>
            <span className="numeric ml-1.5 text-[var(--color-ink-muted)]">
              契合度 {topFit.score} · {formatPrice(topFit.model.price.value)}
            </span>
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-line-subtle)] pt-3">
          <Button
            variant="primary"
            onClick={() => {
              onPickPlay(play);
            }}
          >
            按这个玩法挑机器
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          <Disclosure summary="拍法步骤" count={play.steps.length}>
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
          </Disclosure>

          <Disclosure summary="需要的能力" count={play.demands.length}>
            <div className="space-y-2">
              <InternalAnalysisBadge />
              <p className="text-xs text-[var(--color-ink-body)]">{describePlayDemands(play)}</p>
            </div>
          </Disclosure>

          <Disclosure summary="器材建议">
            <p className="text-xs text-[var(--color-ink-body)]">{play.gearNote}</p>
          </Disclosure>

          <Disclosure summary="这个玩法有机器支撑吗" count={play.evidence.length}>
            <ul className="space-y-2 text-xs">
              {play.evidence.map((item) => (
                <li key={item.value}>
                  <span className="text-[var(--color-ink-body)]">{item.value}</span>
                  <SourceList
                    sources={item.sources}
                    note={item.note}
                    label={`${play.name} 的支撑证据来源`}
                  />
                </li>
              ))}
            </ul>
          </Disclosure>
        </div>
      </div>
    </article>
  );
}

export interface HomeViewProps {
  readonly gateway: AgentGateway;
  /** 带着某个玩法去挑机型 */
  readonly onPickPlay: (play: PlayStyle) => void;
  readonly onBrowseAll: () => void;
}

export function HomeView({ gateway, onPickPlay, onBrowseAll }: HomeViewProps): ReactNode {
  const { state, dispatch } = useWorkspace();
  const plays = useAsyncResource(() => gateway.fetchPlayStyles());
  const snapshotResource = useAsyncResource<CompetitorSnapshot>(() =>
    gateway.fetchCompetitorSnapshot(),
  );
  /** 场景筛选；null 表示不限 */
  const [audienceFilter, setAudienceFilter] = useState<AudienceId | null>(null);

  const allPlays = plays.data ?? [];

  const audiences = useMemo(() => {
    const unique = new Set<AudienceId>(allPlays.map((play) => play.audience));
    return [...unique];
  }, [allPlays]);

  const filtered = useMemo(
    () =>
      audienceFilter === null
        ? allPlays
        : allPlays.filter((play) => play.audience === audienceFilter),
    [allPlays, audienceFilter],
  );

  if (plays.status === 'loading' || plays.status === 'idle') {
    return <LoadingBlock label="玩法库" />;
  }
  if (plays.status === 'error' && plays.error !== null) {
    return <ErrorNotice error={plays.error} onRetry={plays.reload} />;
  }
  if (allPlays.length === 0) {
    return <EmptyState title="暂无玩法内容" description="数据源返回为空，请稍后重试。" />;
  }

  const snapshot = snapshotResource.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="运动相机能拍出什么"
        description="先看能拍出什么样的画面，再决定要哪台机器。下面每个玩法都写清了具体拍法与器材要求，并标出现在哪台机型最拍得动它。"
        actions={
          <Button variant="secondary" onClick={onBrowseAll}>
            直接去挑机型
          </Button>
        }
        meta={
          snapshot === null ? undefined : (
            <p className="text-xs text-[var(--color-ink-muted)]">
              {`机型参数采集于 ${formatIsoDate(snapshot.capturedAt)}，共 ${snapshot.models.length} 款在售机型可选。`}
            </p>
          )
        }
      />

      <Section
        title="按场景看"
        description="选一个你会去拍的场景，只看这个场景下的玩法。"
        actions={
          audienceFilter !== null ? (
            <Button
              variant="ghost"
              onClick={() => {
                setAudienceFilter(null);
              }}
            >
              看全部场景
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="按场景筛选玩法">
          {audiences.map((audience) => {
            const isActive = audienceFilter === audience;
            return (
              <button
                key={audience}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setAudienceFilter(isActive ? null : audience);
                }}
                className={`rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-medium text-[var(--color-ink-strong)]'
                    : 'border-[var(--color-line-strong)] text-[var(--color-ink-body)] hover:border-[var(--color-accent)]'
                }`}
              >
                {AUDIENCE_LABELS[audience]}
              </button>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((play) => (
          <PlayCard key={play.id} play={play} snapshot={snapshot} onPickPlay={onPickPlay} />
        ))}
        {state.data.userPlays.map((play) => (
          <UserPlayCard
            key={play.id}
            play={play}
            onRemove={() => {
              dispatch({ type: 'REMOVE_USER_PLAY', id: play.id, at: new Date().toISOString() });
            }}
          />
        ))}
        <UploadPlayCard
          onSubmit={(input) => {
            dispatch({ type: 'ADD_USER_PLAY', input, at: new Date().toISOString() });
          }}
        />
      </div>

      <Section title="契合度是怎么算的" badge={<InternalAnalysisBadge />}>
        <p className="max-w-prose text-xs text-[var(--color-ink-body)]">{PLAY_FIT_NOTE}</p>
      </Section>
    </div>
  );
}

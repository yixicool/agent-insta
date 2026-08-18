import { useEffect, useRef, type ReactNode } from 'react';
import { IMAGE_COPYRIGHT_NOTICE } from '../data/image-credits';
import { type Route } from '../state/use-hash-route';
import type { Theme } from '../state/use-theme';
import type { DecisionStage } from '../types/decision';
import { BackToTop } from './BackToTop';
import { ContextBar } from './ContextBar';
import { Disclosure } from './Disclosure';
import { Banner } from './Feedback';
import { FlowBar } from './FlowBar';
import { GuideSubNav } from './GuideSubNav';
import { ThemeToggle } from './ThemeToggle';

/** 当前机型在上下文条上要回显的内容 */
export interface ProductContextSummary {
  readonly productId: string;
  readonly productName: string | null;
  /** 用户给这台机型标的选购阶段；还没记过为 null */
  readonly stage: DecisionStage | null;
  readonly feedbackCount: number;
}

export interface AppShellProps {
  readonly route: Route;
  readonly onNavigate: (route: Route) => void;
  /** 第二步要落到的机型；机型库为空时为 null */
  readonly activeProductId: string | null;
  /** activeProductId 是否为默认机型而非用户显式选定 */
  readonly isDefaultProduct: boolean;
  readonly productContext: ProductContextSummary | null;
  readonly theme: Theme;
  readonly onToggleTheme: () => void;
  readonly unknownHash: string | null;
  readonly persistenceMessage: string | null;
  readonly notice: string | null;
  readonly onDismissNotice: () => void;
  readonly children: ReactNode;
}

export function AppShell({
  route,
  onNavigate,
  activeProductId,
  isDefaultProduct,
  productContext,
  theme,
  onToggleTheme,
  unknownHash,
  persistenceMessage,
  notice,
  onDismissNotice,
  children,
}: AppShellProps): ReactNode {
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRenderRef = useRef(true);

  // 视图切换后把焦点移到主区域，键盘用户无需从头 Tab 一遍
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [route.id, route.productId]);

  /** 只有购机指南三步（挑一台/这台怎么样/实际表现）需要子步骤条与当前机型上下文 */
  const isInGuide = route.id === 'picker' || route.id === 'product' || route.id === 'monitor';

  /** 停在默认机型上时要明说，否则用户会以为这是自己选的那台 */
  const showsDefaultProductHint =
    (route.id === 'product' || route.id === 'monitor') && isDefaultProduct;

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)]">
      <a href="#workspace-main" className="skip-link">
        跳到主内容
      </a>

      <header className="app-header">
        <div className="site-container">
          <div className="app-header-shell">
            {/* 站点标题保留 h1 以维持文档大纲；窄屏放不下时仅对读屏器可见 */}
            <h1 className="sr-only shrink-0 text-sm font-semibold text-[var(--color-ink-strong)] lg:not-sr-only">
              MOMENTS Lab
            </h1>
            <FlowBar current={route} onNavigate={onNavigate} />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </header>

      <div className="site-container pt-4 pb-10 sm:pt-6 sm:pb-16">
        <main
          id="workspace-main"
          ref={mainRef}
          tabIndex={-1}
          className="min-w-0 space-y-4 focus:outline-none"
        >
          {isInGuide && (
            <GuideSubNav
              current={route}
              onNavigate={onNavigate}
              activeProductId={activeProductId}
              isDefaultProduct={isDefaultProduct}
            />
          )}

          {isInGuide && productContext !== null && (
            <ContextBar
              productId={productContext.productId}
              productName={productContext.productName}
              stage={productContext.stage}
              feedbackCount={productContext.feedbackCount}
              isOnProductPage={route.id === 'product'}
              onNavigate={onNavigate}
            />
          )}

          {showsDefaultProductHint && (
            <Banner tone="info">
              这是默认机型（你上次看过的机型，或当前推荐第一名）。回到
              <button
                type="button"
                onClick={() => {
                  onNavigate({ id: 'picker', productId: null });
                }}
                className="mx-1 underline underline-offset-2 hover:text-[var(--color-ink-strong)]"
              >
                挑一台
              </button>
              可以重新选。
            </Banner>
          )}

          {unknownHash !== null && (
            <Banner tone="caution">
              地址 <code className="numeric">{unknownHash}</code> 无法识别，已回到默认模块。
            </Banner>
          )}
          {persistenceMessage !== null && (
            <Banner tone="caution">
              {persistenceMessage}本地录入的内容仅在本次会话内有效，建议及时导出备份。
            </Banner>
          )}

          {/* 操作反馈统一在此播报，避免读屏器漏读散落各处的提示 */}
          <div aria-live="polite" aria-atomic="true">
            {notice !== null && (
              <Banner tone="info" onDismiss={onDismissNotice}>
                {notice}
              </Banner>
            )}
          </div>

          {children}
        </main>
      </div>

      <BackToTop />

      <footer className="border-t border-[var(--color-line-subtle)] bg-[var(--color-surface-raised)]">
        <div className="site-container space-y-2 py-6 text-xs text-[var(--color-ink-muted)]">
          <p>数据来自品牌官网、新闻稿、专业评测与社区讨论，随厂商更新而变化，请以官网为准。</p>
          <Disclosure summary="数据来源与版权说明">
            <div className="space-y-1.5">
              <p>
                竞品参数、价格、行业动向与人群痛点均附来源链接与采集日期，每条都能点开原文核对。
              </p>
              <p>{IMAGE_COPYRIGHT_NOTICE}</p>
              <p>
                能力评分与根因归因是编者判断，标注为「内部分析」；你自己记下的选购记录与使用反馈属本地数据，只保存在这台浏览器里，不会上传。
              </p>
            </div>
          </Disclosure>
        </div>
      </footer>
    </div>
  );
}

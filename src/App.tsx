import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppShell, type ProductContextSummary } from './components/AppShell';
import { COMPETITOR_MODELS } from './data/competitors';
import { resolveActiveProduct } from './domain/default-product';
import { createStaticGateway } from './gateway/static-gateway';
import { loadLastProductId, saveLastProductId } from './state/last-product-storage';
import { useHashRoute, type Route, type RouteId } from './state/use-hash-route';
import { useTheme } from './state/use-theme';
import { useWorkspace } from './state/use-workspace';
import { WorkspaceProvider } from './state/WorkspaceProvider';
import { findDecisionForProduct, findFeedbackForProduct } from './state/workspace-reducer';
import { BRAND_LABELS } from './types/competitor';
import type { PlayStyle } from './types/play';
import { HomeView } from './views/HomeView';
import { MonitorView } from './views/MonitorView';
import { MyDecisionsView } from './views/MyDecisionsView';
import { PickerView } from './views/PickerView';
import { ProductView } from './views/ProductView';

/**
 * 站点装配。
 *
 * 主线是「看能拍什么 → 挑一台 → 看它怎么样 → 看实际表现 → 记下选购决定」，
 * 前后两步之间靠 activePlay（用户看中的玩法）与 activeProduct（当前机型）串起来。
 */
function Workspace(): ReactNode {
  const { state, dispatch } = useWorkspace();
  const { route, unknownHash, navigate } = useHashRoute();
  const { theme, toggleTheme } = useTheme();

  /**
   * 上次看过的机型。只在挂载时读一次存储，
   * 之后由 openProduct 同步更新，避免每次渲染都碰 localStorage。
   */
  const [lastProductId, setLastProductId] = useState<string | null>(loadLastProductId);
  /** 本次会话显式打开过的机型；null 表示当前停在默认机型上 */
  const [pickedProductId, setPickedProductId] = useState<string | null>(route.productId);
  /**
   * 用户在首页看中的玩法。刻意只放在内存里而不写入 WorkspaceData——
   * 这是一次浏览过程中的临时上下文，不该让已有的本地业务数据承担迁移风险。
   */
  const [activePlay, setActivePlay] = useState<PlayStyle | null>(null);

  const gateway = useMemo(() => createStaticGateway(), []);

  const goTo = useCallback(
    (id: RouteId) => {
      navigate({ id, productId: null });
    },
    [navigate],
  );

  /** 用户从卡片、筛选结果等处显式挑定某台机型 */
  const openProduct = useCallback(
    (productId: string) => {
      setPickedProductId(productId);
      navigate({ id: 'product', productId });
    },
    [navigate],
  );

  const openMonitor = useCallback(
    (productId: string) => {
      setPickedProductId(productId);
      navigate({ id: 'monitor', productId });
    },
    [navigate],
  );

  /** 从首页带着一个玩法去挑机器 */
  const pickPlay = useCallback(
    (play: PlayStyle) => {
      setActivePlay(play);
      goTo('picker');
    },
    [goTo],
  );

  /**
   * 记住看过的机型，让导航里依赖机型的步骤与下次打开都落到同一台。
   *
   * 这里只更新「记忆」，不更新「本次是否显式选过」：
   * 顺着导航默认项走进来的机型仍算默认，页面要继续提示可回去重选。
   * 依赖 productId 而非整个 route 对象——后者每次渲染都是新对象。
   */
  const currentProductId = route.productId;
  useEffect(() => {
    if (currentProductId === null) {
      return;
    }
    // 地址里的机型可能已下架或拼错，那种情况由页面给出出路，不写进记忆
    if (!COMPETITOR_MODELS.some((model) => model.id === currentProductId)) {
      return;
    }
    saveLastProductId(currentProductId);
    setLastProductId(currentProductId);
  }, [currentProductId]);

  const activeProduct = useMemo(
    () => resolveActiveProduct(COMPETITOR_MODELS, pickedProductId, lastProductId),
    [pickedProductId, lastProductId],
  );

  const productContext = useMemo<ProductContextSummary | null>(() => {
    const productId = activeProduct.productId;
    if (productId === null) {
      return null;
    }
    const model = COMPETITOR_MODELS.find((candidate) => candidate.id === productId);
    const decision = findDecisionForProduct(state.data, productId);
    return {
      productId,
      productName: model === undefined ? null : `${BRAND_LABELS[model.brand]} ${model.name}`,
      stage: decision?.stage ?? null,
      feedbackCount: findFeedbackForProduct(state.data, productId).length,
    };
  }, [activeProduct.productId, state.data]);

  return (
    <AppShell
      route={route}
      onNavigate={(next: Route) => {
        navigate(next);
      }}
      activeProductId={activeProduct.productId}
      isDefaultProduct={activeProduct.isFallback}
      productContext={productContext}
      theme={theme}
      onToggleTheme={toggleTheme}
      unknownHash={unknownHash}
      persistenceMessage={
        state.persistence.mode === 'memory-only' ? state.persistence.message : null
      }
      notice={state.notice}
      onDismissNotice={() => {
        dispatch({ type: 'DISMISS_NOTICE' });
      }}
    >
      {route.id === 'home' && (
        <HomeView
          gateway={gateway}
          onPickPlay={pickPlay}
          onBrowseAll={() => {
            goTo('picker');
          }}
        />
      )}

      {route.id === 'picker' && (
        <PickerView
          gateway={gateway}
          onSelectProduct={openProduct}
          activePlay={activePlay}
          onClearPlay={() => {
            setActivePlay(null);
          }}
          onBackToPlays={() => {
            goTo('home');
          }}
        />
      )}

      {route.id === 'product' && route.productId !== null && (
        <ProductView
          gateway={gateway}
          productId={route.productId}
          onPickProduct={() => {
            goTo('picker');
          }}
          onOpenMonitor={openMonitor}
          onOpenDecisions={() => {
            goTo('my');
          }}
        />
      )}

      {route.id === 'monitor' && route.productId !== null && (
        <MonitorView
          gateway={gateway}
          productId={route.productId}
          onPickProduct={() => {
            goTo('picker');
          }}
          onOpenProduct={openProduct}
        />
      )}

      {route.id === 'my' && (
        <MyDecisionsView
          gateway={gateway}
          onOpenProduct={openProduct}
          onOpenMonitor={openMonitor}
          onBrowsePlays={() => {
            goTo('home');
          }}
          onPickProduct={() => {
            goTo('picker');
          }}
          onNotify={(message) => {
            dispatch({ type: 'NOTIFY', message });
          }}
        />
      )}
    </AppShell>
  );
}

export function App(): ReactNode {
  return (
    <WorkspaceProvider>
      <Workspace />
    </WorkspaceProvider>
  );
}

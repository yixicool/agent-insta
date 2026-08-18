import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { clearWorkspace, loadWorkspace, saveWorkspace } from './workspace-storage';
import { createInitialState, workspaceReducer, type WorkspaceAction } from './workspace-reducer';
import type { WorkspaceState } from '../types/workspace';

/**
 * 工作台状态容器。挂载时从 localStorage 恢复，
 * 状态变化时防抖写回；写入失败降级为「仅本次会话有效」并展示横幅。
 */

const PERSIST_DEBOUNCE_MS = 400;

export interface WorkspaceContextValue {
  readonly state: WorkspaceState;
  readonly dispatch: (action: WorkspaceAction) => void;
  /** 清空本地数据并同步删除持久化内容 */
  readonly resetAll: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export interface WorkspaceProviderProps {
  readonly children: ReactNode;
  /** 测试可注入固定时间戳，保持结果可预期 */
  readonly now?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

export function WorkspaceProvider({
  children,
  now = defaultNow,
}: WorkspaceProviderProps): ReactNode {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () =>
    createInitialState(now()),
  );
  const hydratedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // 首次挂载：恢复已保存数据。not-found 属正常首次访问，不提示错误。
  useEffect(() => {
    const loaded = loadWorkspace();
    if (loaded.ok) {
      dispatch({
        type: 'HYDRATE',
        data: loaded.data,
        persistence: { mode: 'persisted', message: null },
      });
    } else if (loaded.error.code === 'not-found') {
      hydratedRef.current = true;
      return;
    } else {
      const memoryOnly = loaded.error.code === 'storage-unavailable';
      dispatch({
        type: 'SET_PERSISTENCE',
        persistence: {
          mode: memoryOnly ? 'memory-only' : 'persisted',
          message: `${loaded.error.message}${loaded.error.hint}`,
        },
      });
    }
    hydratedRef.current = true;
  }, []);

  // 数据变化后防抖写回，避免连续输入时频繁触发序列化
  useEffect(() => {
    if (!hydratedRef.current) {
      return undefined;
    }
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      const saved = saveWorkspace(state.data);
      if (!saved.ok && state.persistence.mode !== 'memory-only') {
        dispatch({
          type: 'SET_PERSISTENCE',
          persistence: {
            mode: 'memory-only',
            message: `${saved.error.message}${saved.error.hint}`,
          },
        });
      }
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [state.data, state.persistence.mode]);

  const resetAll = useCallback(() => {
    clearWorkspace();
    dispatch({ type: 'RESET_WORKSPACE', at: now() });
  }, [now]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({ state, dispatch, resetAll }),
    [state, resetAll],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

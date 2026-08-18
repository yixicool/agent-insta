import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppError, Result } from '../types/result';

/**
 * 统一封装 gateway 调用的四态，避免每个视图各写一遍加载与失败处理。
 * 含卸载后不 setState 的防护，防止组件已销毁仍写入状态。
 */

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncResource<T> {
  readonly status: AsyncStatus;
  readonly data: T | null;
  readonly error: AppError | null;
  readonly reload: () => void;
}

export function useAsyncResource<T>(load: () => Promise<Result<T>>): AsyncResource<T> {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const mountedRef = useRef(true);
  const loadRef = useRef(load);

  // 保持最新的 load 闭包，但不把它作为 effect 依赖，避免每次渲染重复请求
  loadRef.current = load;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);

    loadRef
      .current()
      .then((result) => {
        if (cancelled || !mountedRef.current) {
          return;
        }
        if (result.ok) {
          setData(result.data);
          setStatus('success');
        } else {
          setError(result.error);
          setStatus('error');
        }
      })
      .catch((caught: unknown) => {
        if (cancelled || !mountedRef.current) {
          return;
        }
        // 网关约定返回 Result，走到这里说明是未预期的运行时异常
        setError({
          code: 'gateway-unavailable',
          message: caught instanceof Error ? caught.message : '数据加载过程中发生未预期的错误。',
          hint: '请点击重试，若持续失败请刷新页面。',
        });
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return { status, data, error, reload };
}

import { useEffect, useState, type ReactNode } from 'react';

/**
 * 回到顶部。页面较长（首页机型列表、看板）时滚过一屏才出现，
 * 避免在短页面上占位。滚动行为由 index.css 的 scroll-behavior 控制，
 * 系统开启「减少动效」时自动变为瞬时跳转。
 */

/** 滚过这个距离才认为用户已经离开首屏 */
const REVEAL_OFFSET_PX = 640;

export function BackToTop(): ReactNode {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = (): void => {
      setIsVisible(window.scrollY > REVEAL_OFFSET_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="回到顶部"
      title="回到顶部"
      onClick={() => {
        window.scrollTo({ top: 0 });
      }}
      className="panel fixed right-4 bottom-4 z-40 inline-flex size-10 items-center justify-center rounded-[var(--radius-pill)] text-[var(--color-ink-body)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-strong)] sm:right-6 sm:bottom-6"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
      >
        <path strokeWidth="1.75" strokeLinecap="round" d="M12 19V6M6 12l6-6 6 6" />
      </svg>
    </button>
  );
}

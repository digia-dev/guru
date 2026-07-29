import { useState, useRef, useCallback, type ReactNode, type TouchEvent } from 'react';

const THRESHOLD = 60;
const MAX_PULL = 120;

interface Props {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}

function getScrollTop(): number {
  const main = document.querySelector('main');
  if (main) return main.scrollTop;
  return window.scrollY;
}

export default function PullToRefresh({ children, onRefresh }: Props) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (refreshing) return;
    if (getScrollTop() !== 0) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current || refreshing) return;
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff <= 0) { setPullDistance(0); return; }
    setPullDistance(Math.min(diff * 0.5, MAX_PULL));
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try { await onRefresh(); } catch { /* ignore */ }
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance, opacity: pullDistance > 0 ? 1 : 0 }}
      >
        <div className="flex flex-col items-center gap-1 pt-2">
          <i
            className={`fas ${refreshing ? 'fa-spinner fa-spin' : progress >= 1 ? 'fa-check-circle' : 'fa-arrow-down'} text-primary text-lg transition-all`}
          />
          <span className="text-[10px] text-text-tertiary font-medium whitespace-nowrap">
            {refreshing ? 'Memuat ulang...' : progress >= 1 ? 'Lepaskan' : 'Tarik'}
          </span>
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullingRef.current ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

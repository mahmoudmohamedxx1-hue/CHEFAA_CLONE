import React, { useEffect, useRef, useState, useCallback } from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

/**
 * Virtual scrolling component for large lists
 * Only renders visible items for optimal performance
 */
export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);
  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      setScrollTop(target.scrollTop);

      // Check if reached end
      if (onEndReached) {
        const scrollPercentage =
          (target.scrollTop + target.clientHeight) / target.scrollHeight;
        if (scrollPercentage >= endReachedThreshold) {
          onEndReached();
        }
      }
    },
    [onEndReached, endReachedThreshold]
  );

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Virtual grid for 2D layouts
 */
interface VirtualGridProps<T> {
  items: T[];
  columns: number;
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  columns,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  renderItem,
  gap = 0,
  className = '',
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rows = Math.ceil(items.length / columns);
  const totalHeight = rows * (itemHeight + gap);
  const visibleRows = Math.ceil(containerHeight / (itemHeight + gap));
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - 1);
  const endRow = Math.min(rows, startRow + visibleRows + 2);

  const visibleItems = items.slice(
    startRow * columns,
    endRow * columns
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight, width: containerWidth }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startRow * (itemHeight + gap)}px)` }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
              gap: `${gap}px`,
            }}
          >
            {visibleItems.map((item, index) => (
              <div
                key={startRow * columns + index}
                style={{
                  height: itemHeight,
                  width: itemWidth,
                }}
              >
                {renderItem(item, startRow * columns + index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Infinite scroll component
 */
interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  loadMore: () => void;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  threshold?: number;
  className?: string;
}

export function InfiniteScroll({
  children,
  hasMore,
  loadMore,
  loader,
  endMessage,
  threshold = 0.8,
  className = '',
}: InfiniteScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isLoading || !hasMore) return;

    const scrollPercentage =
      (container.scrollTop + container.clientHeight) / container.scrollHeight;

    if (scrollPercentage >= threshold) {
      setIsLoading(true);
      loadMore();
      // Reset loading after a delay
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [hasMore, isLoading, loadMore, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`}>
      {children}
      {isLoading && hasMore && (
        <div className="flex justify-center p-4">
          {loader || (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          )}
        </div>
      )}
      {!hasMore && endMessage && (
        <div className="text-center p-4 text-gray-500">{endMessage}</div>
      )}
    </div>
  );
}

/**
 * Hook for virtual scrolling
 */
export function useVirtualScroll<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const [scrollTop, setScrollTop] = useState(0);
  const { itemHeight, containerHeight, overscan = 3 } = options;

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    onScroll,
    offsetY: startIndex * itemHeight,
  };
}

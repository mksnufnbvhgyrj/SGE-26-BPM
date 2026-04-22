import React, { useRef, useEffect, useState, memo } from 'react';

interface VirtualTableProps<T> {
  data: T[];
  rowHeight: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;
}

export const VirtualTable = memo(function VirtualTable<T>({
  data, rowHeight, renderRow, containerHeight = 600
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const handleScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const totalHeight = data.length * rowHeight;
  const startIndex = Math.floor(scrollTop / rowHeight);
  const visibleCount = Math.ceil(containerHeight / rowHeight) + 2; // buffer
  const endIndex = Math.min(startIndex + visibleCount, data.length);
  const offsetY = startIndex * rowHeight;

  return (
    <div ref={containerRef} style={{ height: containerHeight, overflow: 'auto' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {data.slice(startIndex, endIndex).map((item, idx) => (
            <div key={startIndex + idx} style={{ height: rowHeight }}>
              {renderRow(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

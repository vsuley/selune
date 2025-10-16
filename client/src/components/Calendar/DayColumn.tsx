import { useDroppable } from '@dnd-kit/core';
import { formatDayHeader, isToday } from '../../utils/dateHelpers';
import type { ReactNode, MouseEvent } from 'react';

interface DayColumnProps {
  date: Date;
  children?: ReactNode;
  onDoubleClick?: (date: Date, time: { hours: number; minutes: number }) => void;
}

export function DayColumn({ date, children, onDoubleClick }: DayColumnProps) {
  const dayKey = date.toISOString().split('T')[0];
  const { setNodeRef, isOver } = useDroppable({
    id: dayKey,
    data: {
      date,
      type: 'day-column',
    },
  });

  const today = isToday(date);

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onDoubleClick) return;

    // Get the click position relative to the day column
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;

    // Calculate time based on position (1px = 1 minute)
    const totalMinutes = Math.floor(relativeY);

    // Round down to nearest 15-minute increment
    const roundedMinutes = Math.floor(totalMinutes / 15) * 15;

    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    onDoubleClick(date, { hours, minutes });
  };

  return (
    <div className="relative h-full flex flex-col border-r-2" style={{ borderRightColor: 'rgba(131, 56, 236, 0.5)' }}>
      {/* Day header */}
      <div
        className={`
          sticky top-0 z-10 px-2 py-2 text-center font-mono text-sm
          border-b-2
          ${
            today
              ? 'bg-synthwave-bg-light border-synthwave-neon-pink text-synthwave-neon-pink font-bold'
              : 'bg-synthwave-bg border-synthwave-grid-medium text-synthwave-neon-teal'
          }
        `}
      >
        {formatDayHeader(date)}
        {today && (
          <div className="text-xs text-synthwave-neon-pink/70 mt-0.5">Today</div>
        )}
      </div>

      {/* Drop zone for the entire day */}
      <div
        ref={setNodeRef}
        className={`
          relative flex-1 transition-colors z-0
          ${isOver ? 'bg-synthwave-neon-purple/10' : 'bg-transparent'}
        `}
        style={{ minHeight: '1440px' }} // 24 hours * 60px
        onDoubleClick={handleDoubleClick}
      >
        {children}
      </div>
    </div>
  );
}

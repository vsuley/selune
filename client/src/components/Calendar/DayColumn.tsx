import { useDroppable } from '@dnd-kit/core';
import { formatDayHeader, isToday } from '../../utils/dateHelpers';
import type { ReactNode } from 'react';

interface DayColumnProps {
  date: Date;
  children?: ReactNode;
}

export function DayColumn({ date, children }: DayColumnProps) {
  const dayKey = date.toISOString().split('T')[0];
  const { setNodeRef, isOver } = useDroppable({
    id: dayKey,
    data: {
      date,
      type: 'day-column',
    },
  });

  const today = isToday(date);

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
      >
        {children}
      </div>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";
import { formatDayHeader, isToday } from "../../utils/dateHelpers";
import type { ReactNode, MouseEvent } from "react";

interface DayColumnProps {
  date: Date;
  children?: ReactNode;
  onDoubleClick?: (
    date: Date,
    time: { hours: number; minutes: number }
  ) => void;
}

export function DayColumn({ date, children, onDoubleClick }: DayColumnProps) {
  const dayKey = date.toISOString().split("T")[0];
  const { setNodeRef, isOver } = useDroppable({
    id: dayKey,
    data: {
      date,
      type: "day-column",
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
    <div className="relative h-full flex flex-col border-r-1 border-purple-600">
      {/* Day header */}
      <div
        className={`
          sticky top-0 z-10 px-2 py-2 text-center text-sm
          border-b-1
          ${today ? "font-semibold text-amber-200" : "text-teal-500"}
        `}
      >
        {formatDayHeader(date)}
      </div>

      {/* Drop zone for the entire day */}
      <div
        ref={setNodeRef}
        className={`
          relative flex-1 transition-colors z-0
          ${isOver ? "bg-synthwave-neon-purple/10" : "bg-transparent"}
        `}
        style={{ minHeight: "1440px" }} // 24 hours * 60px
        onDoubleClick={handleDoubleClick}
      >
        {children}
      </div>
    </div>
  );
}

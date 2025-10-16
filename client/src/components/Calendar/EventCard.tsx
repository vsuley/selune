import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import {
  getDurationHeight,
  getTimePosition,
  isPastEvent,
} from "../../utils/dateHelpers";

interface Event {
  id: string;
  title: string;
  startTime: Date;
  durationMinutes: number;
  category?: string;
  parentEventId?: string | null;
}

interface EventCardProps {
  event: Event;
  onDoubleClick?: (event: Event) => void;
}

// Category color mapping
const categoryColors = {
  default: {
    bg: "bg-purple-900",
    border: "border-sky-400",
  },
  personal: {
    bg: "bg-purple-900",
    border: "border-pink-400",
  },
  work: {
    bg: "bg-purple-900",
    border: "border-amber-400",
  },
  health: {
    bg: "bg-purple-900",
    border: "border-teal-400",
  },
};

export function EventCard({ event, onDoubleClick }: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      data: {
        event,
        type: "event",
      },
    });

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(event);
    }
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    position: "absolute" as const,
    top: `${getTimePosition(event.startTime)}px`,
    height: `${getDurationHeight(event.durationMinutes)}px`,
    left: "4px",
    right: "4px",
  };

  const colors =
    categoryColors[event.category as keyof typeof categoryColors] ||
    categoryColors.default;
  const isChild = !!event.parentEventId;
  const isPast = isPastEvent(event.startTime, event.durationMinutes);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        rounded-lg border-2 p-2 cursor-move overflow-hidden
        transition-all duration-150
        ${colors.bg} ${colors.border}
        ${
          isDragging
            ? "opacity-50 scale-105 z-50"
            : isPast
            ? "opacity-50 hover:opacity-50 z-10"
            : "opacity-90 hover:opacity-100 z-10"
        }
        ${isChild ? "ml-2 border-dashed" : "border-solid"}
        bg-opacity-20 backdrop-blur-sm
      `}
      onDoubleClick={handleDoubleClick}
      {...listeners}
      {...attributes}
    >
      <div className="flex flex-col h-full">
        {/* Event title */}
        <div className="text-white text-sm mb-1 truncate">{event.title}</div>
      </div>

      {/* Glow effect on hover */}
      <div
        className={`
          absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity
          pointer-events-none
        `}
      />
    </div>
  );
}

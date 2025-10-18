import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useDraggable } from "@dnd-kit/core";
import {
  getDurationHeight,
  getTimePosition,
  isPastEvent,
} from "../../utils/dateHelpers";
import type { Event } from "../../services/api";

interface EventCardProps {
  event: Event;
  onDoubleClick?: (event: Event) => void;
  isBeingDragged?: boolean;
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

export function EventCard({
  event,
  onDoubleClick,
  isBeingDragged = false,
}: EventCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: {
      event,
      type: "event",
    },
  });

  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick(event);
    }
  };

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.right + 8,
        y: rect.top,
      });
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isVeryShort = event.durationMinutes <= 15;

  // Never apply transform to positioned elements - causes jumpiness
  // The DragOverlay handles the drag preview separately
  const style = {
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

  // Hide the original element when dragging (DragOverlay shows the preview)
  // Also keep it hidden briefly after drop while optimistic update completes
  if (isDragging || isBeingDragged) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-0"
        {...listeners}
        {...attributes}
      />
    );
  }

  return (
    <>
      <div
        ref={(node) => {
          setNodeRef(node);
          if (cardRef.current !== node) {
            cardRef.current = node;
          }
        }}
        style={style}
        className={`
          rounded-lg border-2 cursor-move relative
          ${event.durationMinutes <= 30 ? "p-0" : "p-2"}
          ${colors.bg} ${colors.border}
          ${
            isPast
              ? "opacity-50 hover:opacity-50 z-10"
              : "opacity-90 hover:opacity-100 z-10"
          }
          ${isChild ? "ml-2 border-dashed" : "border-solid"}
          bg-opacity-20 backdrop-blur-sm
          ${!isVeryShort ? "overflow-hidden" : "overflow-visible"}
        `}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={isVeryShort ? handleMouseEnter : undefined}
        onMouseLeave={isVeryShort ? handleMouseLeave : undefined}
        {...listeners}
        {...attributes}
      >
        <div className="flex flex-col h-full">
          {/* Event title - hide for very short events, smaller font for short events */}
          {!isVeryShort && (
            <div
              className={`text-white truncate ${
                event.durationMinutes <= 30
                  ? "text-[8pt] m-1 ml-3"
                  : "text-sm mb-1"
              }`}
              style={
                event.durationMinutes <= 30
                  ? { fontFamily: "Verdana, sans-serif" }
                  : undefined
              }
            >
              {event.title}
            </div>
          )}
        </div>

        {/* Glow effect on hover */}
        <div
          className={`
            absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity
            pointer-events-none
          `}
        />
      </div>

      {/* Tooltip portal - rendered at document root to escape stacking contexts */}
      {isVeryShort &&
        isHovered &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[9999] whitespace-nowrap"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-700">
              {event.title}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

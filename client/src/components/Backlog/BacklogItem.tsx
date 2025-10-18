import { useDraggable } from "@dnd-kit/core";
import type { VirtualEvent } from "../../services/api";

interface BacklogItemProps {
  virtualEvent: VirtualEvent;
  onCommit: (virtualEvent: VirtualEvent) => void;
  isDraggable: boolean;
}

export function BacklogItem({
  virtualEvent,
  onCommit,
  isDraggable,
}: BacklogItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `virtual-${virtualEvent.id}`,
    data: {
      virtualEvent,
      type: "virtual-event",
    },
    disabled: !isDraggable,
  });

  const handleCommit = () => {
    onCommit(virtualEvent);
  };

  return (
    <div
      ref={isDraggable ? setNodeRef : undefined}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
      className={`
        bg-purple-900 border-2 border-purple-700 rounded-lg p-3
        hover:border-purple-500 transition-colors
        ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <h3 className="text-white font-semibold text-sm flex-1">
            {virtualEvent.title}
          </h3>
        </div>

        <div className="flex items-center justify-between text-xs text-purple-300">
          <span>{virtualEvent.durationMinutes} min</span>
          {virtualEvent.category && (
            <span className="px-2 py-0.5 bg-purple-800 rounded">
              {virtualEvent.category}
            </span>
          )}
        </div>

        {virtualEvent.notes && (
          <p className="text-xs text-purple-400 line-clamp-2">
            {virtualEvent.notes}
          </p>
        )}

        {!isDraggable && (
          <button
            onClick={handleCommit}
            className="mt-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded transition-colors"
          >
            Commit
          </button>
        )}
      </div>
    </div>
  );
}

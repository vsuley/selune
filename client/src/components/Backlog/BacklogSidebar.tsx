import { BacklogItem } from "./BacklogItem";
import type { VirtualEvent } from "../../services/api";

interface BacklogSidebarProps {
  virtualEvents: VirtualEvent[];
  onCommit: (virtualEvent: VirtualEvent) => void;
}

export function BacklogSidebar({
  virtualEvents,
  onCommit,
}: BacklogSidebarProps) {
  // Separate inflexible and flexible events
  const inflexibleEvents = virtualEvents.filter((event) => !event.isFlexible);
  const flexibleEvents = virtualEvents.filter((event) => event.isFlexible);

  return (
    <div className="w-80 bg-zinc-900 border-l-2 border-purple-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b-2 border-purple-700">
        <h2 className="text-2xl font-bold text-amber-500">Backlog</h2>
        <p className="text-sm text-purple-300 mt-1">
          {inflexibleEvents.length} inflexible, {flexibleEvents.length} flexible
        </p>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Inflexible Events Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-teal-400 mb-3">
            Inflexible Events
          </h3>
          <div className="space-y-3">
            {inflexibleEvents.length === 0 ? (
              <p className="text-purple-400 text-sm text-center py-4">
                No inflexible events
              </p>
            ) : (
              inflexibleEvents.map((virtualEvent) => (
                <BacklogItem
                  key={virtualEvent.id}
                  virtualEvent={virtualEvent}
                  onCommit={onCommit}
                  isDraggable={false}
                />
              ))
            )}
          </div>
        </div>

        {/* Flexible Events Section */}
        <div>
          <h3 className="text-lg font-semibold text-sky-400 mb-3">
            Flexible Events
          </h3>
          <p className="text-xs text-purple-400 mb-3">
            Drag to calendar to schedule
          </p>
          <div className="space-y-3">
            {flexibleEvents.length === 0 ? (
              <p className="text-purple-400 text-sm text-center py-4">
                No flexible events
              </p>
            ) : (
              flexibleEvents.map((virtualEvent) => (
                <BacklogItem
                  key={virtualEvent.id}
                  virtualEvent={virtualEvent}
                  onCommit={onCommit}
                  isDraggable={true}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

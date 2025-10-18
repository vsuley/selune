import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useUIStore } from "../../stores/uiStore";
import {
  getWeekDays,
  formatWeekRange,
  getNextWeek,
  getPreviousWeek,
  getWeekStart,
  getWeekEnd,
  snapToQuarterHour,
  getColumnIndex,
  DAY_HEADER_HEIGHT,
} from "../../utils/dateHelpers";
import { TimeGrid } from "./TimeGrid";
import { DayColumn } from "./DayColumn";
import { EventCard } from "./EventCard";
import { EventFormModal } from "./EventFormModal";
import { BacklogSidebar } from "../Backlog/BacklogSidebar";
import {
  useEvents,
  useUpdateEvent,
  useCreateEvent,
} from "../../hooks/useEvents";
import type {
  Event,
  CreateEventData,
  UpdateEventData,
  VirtualEvent,
} from "../../services/api";

export function WeekView() {
  const { selectedDate, setSelectedDate } = useUIStore();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventStartTime, setNewEventStartTime] = useState<
    Date | undefined
  >();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);

  const weekDays = useMemo(
    () => getWeekDays(selectedDate),
    [selectedDate]
  );

  const weekStart = getWeekStart(selectedDate);
  const weekEnd = getWeekEnd(selectedDate);

  // Fetch events for the current week
  const { data, isLoading, error } = useEvents(weekStart, weekEnd);
  const events = useMemo(() => data?.events ?? [], [data?.events]);
  const virtualEvents = useMemo(
    () => data?.virtualEvents ?? [],
    [data?.virtualEvents]
  );
  const updateEventMutation = useUpdateEvent();
  const createEventMutation = useCreateEvent();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handlePreviousWeek = () => {
    setSelectedDate(getPreviousWeek(selectedDate));
  };

  const handleNextWeek = () => {
    setSelectedDate(getNextWeek(selectedDate));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDayDoubleClick = (
    date: Date,
    time: { hours: number; minutes: number }
  ) => {
    // Create the start time from the clicked date and time
    const startTime = new Date(date);
    startTime.setHours(time.hours, time.minutes, 0, 0);

    setNewEventStartTime(startTime);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const handleEventDoubleClick = (event: Event) => {
    setEditingEvent(event);
    setNewEventStartTime(undefined);
    setIsModalOpen(true);
  };

  const handleCreateEvent = (data: CreateEventData) => {
    createEventMutation.mutate(data);
  };

  const handleUpdateEvent = (id: string, data: UpdateEventData) => {
    updateEventMutation.mutate({ id, data });
  };

  const handleCommitVirtualEvent = (virtualEvent: VirtualEvent) => {
    // Commit the virtual event by creating a real event with the virtual event's data
    // The start time will be set to the deadline (or current time as fallback)
    const startTime = virtualEvent.deadline || new Date();

    const eventData: CreateEventData = {
      title: virtualEvent.title,
      startTime: startTime.toISOString(),
      durationMinutes: virtualEvent.durationMinutes,
      patternId: virtualEvent.patternId,
      periodKey: virtualEvent.periodKey,
      category: virtualEvent.category,
      isFlexible: false, // Committing makes it inflexible (scheduled)
      isTimeBound: false, // Once scheduled, no longer time-bound
      notes: virtualEvent.notes,
    };

    createEventMutation.mutate(eventData);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = event.active.data.current?.["event"] as
      | Event
      | undefined;
    const virtualEvent = event.active.data.current?.["virtualEvent"] as
      | VirtualEvent
      | undefined;

    if (draggedEvent) {
      setActiveEvent(draggedEvent);
      setDraggingEventId(draggedEvent.id);
    } else if (virtualEvent) {
      // Convert virtual event to Event format for drag preview
      setActiveEvent({
        id: virtualEvent.id,
        title: virtualEvent.title,
        durationMinutes: virtualEvent.durationMinutes,
        category: virtualEvent.category,
        notes: virtualEvent.notes,
        isFlexible: virtualEvent.isFlexible,
        isTimeBound: false,
        patternId: virtualEvent.patternId,
        periodKey: virtualEvent.periodKey,
        parentEventId: null,
        startTime: new Date(), // Placeholder, will be set on drop
        deadline: virtualEvent.deadline,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setDraggingEventId(`virtual-${virtualEvent.id}`);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      // Drag was cancelled, reset immediately
      setActiveEvent(null);
      setDraggingEventId(null);
      return;
    }

    const draggedEvent = active.data.current?.["event"] as Event | undefined;
    const virtualEvent = active.data.current?.["virtualEvent"] as
      | VirtualEvent
      | undefined;
    const overData = over.data.current;

    // Handle dragging a virtual event from backlog to calendar
    if (virtualEvent && overData) {
      const targetDate = overData["date"] as Date | undefined;

      if (!targetDate) {
        setActiveEvent(null);
        setDraggingEventId(null);
        return;
      }

      // Calculate the start time based on drop position
      const columnIdx = getColumnIndex(targetDate, weekStart);
      const targetDay = weekDays[columnIdx];

      if (!targetDay) {
        setActiveEvent(null);
        setDraggingEventId(null);
        return;
      }

      // Get the drop position within the day column
      // The over.rect is the droppable zone (the inner div, not including the header)
      // The active.rect is the dragged element's position
      const overRect = over.rect;
      const activeRect = active.rect.current.translated;

      if (!overRect || !activeRect) {
        setActiveEvent(null);
        setDraggingEventId(null);
        return;
      }

      // Calculate the Y position within the drop zone
      // Since overRect is already the drop zone (without the header), we don't need to subtract anything
      // The relativeY is how far down from the top of the drop zone (midnight) we are
      const relativeY = activeRect.top - overRect.top;

      // Ensure we don't get negative values
      const minutesFromMidnight = Math.max(0, Math.floor(relativeY));

      let newStartTime = new Date(targetDay);
      newStartTime.setHours(0, 0, 0, 0);
      newStartTime = new Date(newStartTime.getTime() + minutesFromMidnight * 60 * 1000);

      // Snap to 15-minute increments
      newStartTime = snapToQuarterHour(newStartTime);

      // Create a real event from the virtual event
      const eventData: CreateEventData = {
        title: virtualEvent.title,
        startTime: newStartTime.toISOString(),
        durationMinutes: virtualEvent.durationMinutes,
        patternId: virtualEvent.patternId,
        periodKey: virtualEvent.periodKey,
        category: virtualEvent.category,
        isFlexible: false, // Scheduling makes it inflexible
        isTimeBound: false,
        notes: virtualEvent.notes,
      };

      createEventMutation.mutate(eventData, {
        onSuccess: () => {
          setActiveEvent(null);
          setTimeout(() => setDraggingEventId(null), 100);
        },
        onError: () => {
          setActiveEvent(null);
          setDraggingEventId(null);
        },
      });

      return;
    }

    // Handle dragging an existing event to a new time
    if (!draggedEvent || !overData || !draggedEvent.startTime) {
      setActiveEvent(null);
      setDraggingEventId(null);
      return;
    }

    // Calculate new time based on drop position
    const targetDate = overData["date"] as Date | undefined;
    const delta = event.delta;

    // Get the new position
    let newStartTime = new Date(draggedEvent.startTime);

    // If dropped on a different day
    if (targetDate) {
      const columnIdx = getColumnIndex(targetDate, weekStart);
      const targetDay = weekDays[columnIdx];

      if (targetDay) {
        // Keep the same time but change the day
        newStartTime = new Date(targetDay);
        newStartTime.setHours(draggedEvent.startTime.getHours());
        newStartTime.setMinutes(draggedEvent.startTime.getMinutes());
      }
    }

    // Apply vertical delta (time change)
    if (delta.y !== 0) {
      const minutesChange = delta.y; // 1px = 1 minute
      newStartTime = new Date(
        newStartTime.getTime() + minutesChange * 60 * 1000
      );
    }

    // Snap to 15-minute increments
    newStartTime = snapToQuarterHour(newStartTime);

    // DON'T clear activeEvent yet - keep the overlay visible during transition
    // The mutation's optimistic update will happen synchronously
    updateEventMutation.mutate(
      {
        id: draggedEvent.id,
        data: {
          startTime: newStartTime.toISOString(),
        },
      },
      {
        onSuccess: () => {
          // Clear drag state after successful update
          setActiveEvent(null);
          setTimeout(() => setDraggingEventId(null), 100);
        },
        onError: () => {
          // Clear immediately on error
          setActiveEvent(null);
          setDraggingEventId(null);
        },
      }
    );
  };

  // Group events by day (only scheduled events with startTime)
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, Event[]> = {};

    weekDays.forEach((day) => {
      const dayKey = day.toISOString().split("T")[0];
      grouped[dayKey] = [];
    });

    events.forEach((event) => {
      // Only include events that have a startTime (scheduled events)
      if (event.startTime) {
        const eventDayKey = event.startTime.toISOString().split("T")[0];
        if (grouped[eventDayKey]) {
          grouped[eventDayKey].push(event);
        }
      }
    });

    return grouped;
  }, [weekDays, events]);

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-teal-500 text-xl font-mono">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl font-mono">
          Error loading events: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-purple-950">
      {/* Header with navigation */}
      <div className="border-b-2 p-4 flex items-center justify-between bg-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleToday}
            className="px-4 py-2 font-semibold rounded-lg text-amber-300 hover:text-amber-200 transition-all"
          >
            Today
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousWeek}
              className="p-2 transition-colors text-amber-500 hover:text-amber-400"
              aria-label="Previous week"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={handleNextWeek}
              className="p-2 transition-colors text-amber-500 hover:text-amber-400"
              aria-label="Next week"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Date range display */}
          <h2 className="text-xl font-bold text-amber-500">
            {formatWeekRange(weekStart, weekEnd)}
          </h2>
        </div>
      </div>

      {/* Main content area with calendar and sidebar */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Calendar grid */}
          <div className="flex-1 overflow-auto">
            <div className="relative" style={{ minHeight: "1440px" }}>
              {/* Time grid background */}
              <TimeGrid />

              {/* Day columns */}
              <div
                className="grid relative"
                style={{
                  gridTemplateColumns: "64px repeat(7, 1fr)",
                  minHeight: "1440px", // 24 hours * 60px
                }}
              >
                {/* Empty corner for time labels */}
                <div className="border-r-1 border-purple-700" />

                {/* Day columns with events */}
                {weekDays.map((day) => {
                  const dayKey = day.toISOString().split("T")[0];
                  const dayEvents = eventsByDay[dayKey] || [];

                  return (
                    <DayColumn
                      key={dayKey}
                      date={day}
                      onDoubleClick={handleDayDoubleClick}
                    >
                      {dayEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event as Event & { startTime: Date }}
                          onDoubleClick={handleEventDoubleClick}
                          isBeingDragged={draggingEventId === event.id}
                        />
                      ))}
                    </DayColumn>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Backlog Sidebar */}
          <BacklogSidebar
            virtualEvents={virtualEvents}
            onCommit={handleCommitVirtualEvent}
          />
        </div>

        {/* Drag overlay - simplified preview that follows cursor */}
        <DragOverlay
          dropAnimation={{
            duration: 0,
            easing: "ease",
          }}
        >
          {activeEvent ? (
            <div
              className={`
                rounded-lg border-2 p-2 overflow-hidden
                bg-purple-900 border-sky-400
                bg-opacity-20 backdrop-blur-sm
                opacity-90
                cursor-grabbing
                shadow-lg
              `}
              style={{
                width: "180px",
                height: `${activeEvent.durationMinutes}px`,
                minHeight: "40px",
              }}
            >
              <div className="text-white text-sm truncate">
                {activeEvent.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Event creation/editing modal */}
      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(undefined);
          setNewEventStartTime(undefined);
        }}
        onSubmit={handleCreateEvent}
        onUpdate={handleUpdateEvent}
        {...(newEventStartTime && { initialStartTime: newEventStartTime })}
        {...(editingEvent && { editingEvent })}
      />
    </div>
  );
}

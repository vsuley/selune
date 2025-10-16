import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useUIStore } from '../../stores/uiStore';
import {
  getWeekDays,
  formatWeekRange,
  getNextWeek,
  getPreviousWeek,
  getWeekStart,
  getWeekEnd,
  snapToQuarterHour,
  getColumnIndex,
} from '../../utils/dateHelpers';
import { TimeGrid } from './TimeGrid';
import { DayColumn } from './DayColumn';
import { EventCard } from './EventCard';
import { EventFormModal } from './EventFormModal';
import { useEvents, useUpdateEvent, useCreateEvent } from '../../hooks/useEvents';
import type { Event, CreateEventData } from '../../services/api';

export function WeekView() {
  const { weekStartsOn, selectedDate, setSelectedDate } = useUIStore();
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventStartTime, setNewEventStartTime] = useState<Date | undefined>();

  const weekDays = useMemo(
    () => getWeekDays(selectedDate, weekStartsOn),
    [selectedDate, weekStartsOn]
  );

  const weekStart = getWeekStart(selectedDate, weekStartsOn);
  const weekEnd = getWeekEnd(selectedDate, weekStartsOn);

  // Fetch events for the current week
  const { data: events = [], isLoading, error } = useEvents(weekStart, weekEnd);
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

  const handleDayDoubleClick = (date: Date, time: { hours: number; minutes: number }) => {
    // Create the start time from the clicked date and time
    const startTime = new Date(date);
    startTime.setHours(time.hours, time.minutes, 0, 0);

    setNewEventStartTime(startTime);
    setIsModalOpen(true);
  };

  const handleCreateEvent = (data: CreateEventData) => {
    createEventMutation.mutate(data);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = event.active.data.current?.['event'] as Event | undefined;
    if (draggedEvent) {
      setActiveEvent(draggedEvent);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);

    if (!over) return;

    const draggedEvent = active.data.current?.['event'] as Event | undefined;
    const overData = over.data.current;

    if (!draggedEvent || !overData || !draggedEvent.startTime) return;

    // Calculate new time based on drop position
    const targetDate = overData['date'] as Date | undefined;
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
      newStartTime = new Date(newStartTime.getTime() + minutesChange * 60 * 1000);
    }

    // Snap to 15-minute increments
    newStartTime = snapToQuarterHour(newStartTime);

    // Update the event on the server
    updateEventMutation.mutate({
      id: draggedEvent.id,
      data: {
        startTime: newStartTime.toISOString(),
      },
    });
  };

  // Group events by day (only scheduled events with startTime)
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, Event[]> = {};

    weekDays.forEach((day) => {
      const dayKey = day.toISOString().split('T')[0];
      grouped[dayKey] = [];
    });

    events.forEach((event) => {
      // Only include events that have a startTime (scheduled events)
      if (event.startTime) {
        const eventDayKey = event.startTime.toISOString().split('T')[0];
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
      <div className="h-screen flex items-center justify-center bg-synthwave-bg-dark">
        <div className="text-synthwave-neon-teal text-xl font-mono">
          Loading events...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-synthwave-bg-dark">
        <div className="text-synthwave-neon-pink text-xl font-mono">
          Error loading events: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-synthwave-bg-dark">
      {/* Header with navigation */}
      <div className="bg-synthwave-bg border-b-2 border-synthwave-neon-purple p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-synthwave-neon-teal text-synthwave-bg-dark font-semibold rounded-lg hover:shadow-neon-teal transition-all"
          >
            Today
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousWeek}
              className="p-2 text-synthwave-neon-purple hover:text-synthwave-neon-pink transition-colors"
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
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={handleNextWeek}
              className="p-2 text-synthwave-neon-purple hover:text-synthwave-neon-pink transition-colors"
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

          <h2 className="text-xl font-bold text-synthwave-neon-teal font-mono">
            {formatWeekRange(weekStart, weekEnd)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-synthwave-neon-purple text-sm font-mono">
            Week starts on:
          </label>
          <select
            value={weekStartsOn}
            onChange={(e) => useUIStore.getState().setWeekStartsOn(Number(e.target.value) as 0 | 1)}
            className="px-3 py-1 bg-synthwave-bg-light text-synthwave-neon-teal border-2 border-synthwave-neon-purple rounded-lg font-mono"
          >
            <option value={0}>Sunday</option>
            <option value={1}>Monday</option>
          </select>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="relative" style={{ minHeight: '1440px' }}>
            {/* Time grid background */}
            <TimeGrid daysCount={7} />

            {/* Day columns */}
            <div
              className="grid relative"
              style={{
                gridTemplateColumns: '64px repeat(7, 1fr)',
                minHeight: '1440px', // 24 hours * 60px
              }}
            >
              {/* Empty corner for time labels */}
              <div className="border-r-2 border-synthwave-grid-heavy" />

              {/* Day columns with events */}
              {weekDays.map((day) => {
                const dayKey = day.toISOString().split('T')[0];
                const dayEvents = eventsByDay[dayKey] || [];

                return (
                  <DayColumn key={dayKey} date={day} onDoubleClick={handleDayDoubleClick}>
                    {dayEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </DayColumn>
                );
              })}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeEvent ? <EventCard event={activeEvent} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Event creation modal */}
      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
        initialStartTime={newEventStartTime}
      />
    </div>
  );
}

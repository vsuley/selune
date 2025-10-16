import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { getDurationHeight, getTimePosition } from '../../utils/dateHelpers';

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
}

// Category color mapping
const categoryColors = {
  default: {
    bg: 'bg-synthwave-neon-purple',
    border: 'border-synthwave-neon-purple',
    shadow: 'shadow-neon-purple',
  },
  personal: {
    bg: 'bg-synthwave-neon-pink',
    border: 'border-synthwave-neon-pink',
    shadow: 'shadow-neon-pink',
  },
  work: {
    bg: 'bg-synthwave-neon-blue',
    border: 'border-synthwave-neon-blue',
    shadow: 'shadow-neon-blue',
  },
  health: {
    bg: 'bg-synthwave-neon-teal',
    border: 'border-synthwave-neon-teal',
    shadow: 'shadow-neon-teal',
  },
};

export function EventCard({ event }: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: {
      event,
      type: 'event',
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute' as const,
    top: `${getTimePosition(event.startTime)}px`,
    height: `${getDurationHeight(event.durationMinutes)}px`,
    left: '4px',
    right: '4px',
  };

  const colors = categoryColors[event.category as keyof typeof categoryColors] || categoryColors.default;
  const isChild = !!event.parentEventId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        rounded-lg border-2 p-2 cursor-move overflow-hidden
        transition-all duration-150
        ${colors.bg} ${colors.border} ${colors.shadow}
        ${isDragging ? 'opacity-50 scale-105 z-50' : 'opacity-90 hover:opacity-100 z-10'}
        ${isChild ? 'ml-2 border-dashed' : 'border-solid'}
        bg-opacity-20 backdrop-blur-sm
      `}
      {...listeners}
      {...attributes}
    >
      <div className="flex flex-col h-full">
        {/* Event title */}
        <div className="font-semibold text-white text-sm mb-1 truncate">
          {event.title}
        </div>

        {/* Event time */}
        {event.durationMinutes >= 30 && (
          <div className="text-xs font-mono text-white/80">
            {format(event.startTime, 'h:mm a')}
          </div>
        )}

        {/* Duration indicator for longer events */}
        {event.durationMinutes >= 60 && (
          <div className="text-xs font-mono text-white/60 mt-auto">
            {event.durationMinutes >= 60
              ? `${Math.floor(event.durationMinutes / 60)}h ${event.durationMinutes % 60 > 0 ? `${event.durationMinutes % 60}m` : ''}`
              : `${event.durationMinutes}m`}
          </div>
        )}
      </div>

      {/* Glow effect on hover */}
      <div
        className={`
          absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity
          ${colors.shadow}
          pointer-events-none
        `}
      />
    </div>
  );
}

import { formatHourLabel, getHoursInDay } from '../../utils/dateHelpers';

interface TimeGridProps {
  daysCount: number;
}

export function TimeGrid({ daysCount }: TimeGridProps) {
  const hours = getHoursInDay();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Time labels column */}
      <div className="absolute left-0 top-0 w-16 h-full">
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 w-full text-xs text-synthwave-neon-teal font-mono"
            style={{ top: `${hour * 60}px` }}
          >
            <span className="px-2">{formatHourLabel(hour)}</span>
          </div>
        ))}
      </div>

      {/* Grid lines */}
      <div className="absolute left-16 right-0 top-0 bottom-0">
        {/* Vertical lines (day separators) */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${daysCount}, 1fr)` }}>
          {Array.from({ length: daysCount }).map((_, idx) => (
            <div
              key={`day-${idx}`}
              className="border-r border-synthwave-grid-heavy"
              style={{
                borderRightWidth: idx === daysCount - 1 ? '0' : '2px',
              }}
            />
          ))}
        </div>

        {/* Horizontal lines (time markers) */}
        <div className="absolute inset-0">
          {hours.map((hour) => (
            <div key={`hour-${hour}`}>
              {/* Hour line (solid) */}
              <div
                className="absolute left-0 right-0 border-t border-synthwave-grid-medium"
                style={{
                  top: `${hour * 60}px`,
                  borderTopWidth: '1px',
                }}
              />

              {/* 15-minute markers (dotted, very light) */}
              <div
                className="absolute left-0 right-0 border-t border-dotted border-synthwave-grid-light opacity-30"
                style={{
                  top: `${hour * 60 + 15}px`,
                  borderTopWidth: '1px',
                }}
              />

              {/* 30-minute marker (dashed) */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-synthwave-grid-light"
                style={{
                  top: `${hour * 60 + 30}px`,
                  borderTopWidth: '1px',
                }}
              />

              {/* 45-minute markers (dotted, very light) */}
              <div
                className="absolute left-0 right-0 border-t border-dotted border-synthwave-grid-light opacity-30"
                style={{
                  top: `${hour * 60 + 45}px`,
                  borderTopWidth: '1px',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

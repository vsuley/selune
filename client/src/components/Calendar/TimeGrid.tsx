import { formatHourLabel, getHoursInDay } from "../../utils/dateHelpers";

export function TimeGrid() {
  const hours = getHoursInDay();

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Grid lines */}
      <div className="absolute left-12 right-12 top-0 bottom-0 z-10">
        {/* Horizontal lines (time markers) */}
        <div className="absolute inset-0 z-10">
          {hours.map((hour) => (
            <div key={`hour-${hour}`}>
              {/* Hour line (solid) */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: `${hour * 60}px`,
                  borderTop: "1px solid rgba(131, 70, 236, 0.6)",
                  height: "0px",
                }}
              />

              {/* 15-minute markers (dotted, very light) */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: `${hour * 60 + 15}px`,
                  borderTop: "1px dotted rgba(131, 56, 236, 0.2)",
                  height: "0px",
                }}
              />

              {/* 30-minute marker (dashed) */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: `${hour * 60 + 30}px`,
                  borderTop: "1px dashed rgba(131, 56, 236, 0.3)",
                  height: "0px",
                }}
              />

              {/* 45-minute markers (dotted, very light) */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: `${hour * 60 + 45}px`,
                  borderTop: "1px dotted rgba(131, 56, 236, 0.2)",
                  height: "0px",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Left time labels */}
      <div className="absolute left-0 top-0 w-12 h-full z-10">
        {hours.map((hour) => (
          <div
            key={`left-${hour}`}
            className="absolute w-full text-[10px] font-semibold text-amber-500 text-right pr-2"
            style={{ top: `${hour * 60 - 8}px` }}
          >
            {formatHourLabel(hour)}
          </div>
        ))}
      </div>

      {/* Right time labels */}
      <div className="absolute right-0 top-0 w-12 h-full z-10">
        {hours.map((hour) => (
          <div
            key={`right-${hour}`}
            className="absolute w-full text-[10px] font-semibold text-amber-500 text-left pl-2"
            style={{ top: `${hour * 60 - 8}px` }}
          >
            {formatHourLabel(hour)}
          </div>
        ))}
      </div>
    </div>
  );
}

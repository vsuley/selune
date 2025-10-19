import { useState, useEffect, type FormEvent } from "react";
import { format, getISOWeek, getISOWeekYear, getYear, getMonth } from "date-fns";
import type {
  CreateEventData,
  Event,
  UpdateEventData,
  FrequencyType,
  CreatePatternData,
} from "../../services/api";
import { createPattern, generatePatternInstance } from "../../services/api";

// Helper to calculate period key from date and frequency
function getPeriodKey(date: Date, frequency: FrequencyType): string | null {
  switch (frequency) {
    case "weekly":
    case "n_per_period": {
      const isoWeek = getISOWeek(date);
      const isoYear = getISOWeekYear(date);
      return `${isoYear}-W${isoWeek.toString().padStart(2, "0")}`;
    }
    case "monthly":
    case "nth_weekday_of_month": {
      const year = getYear(date);
      const month = getMonth(date) + 1;
      return `${year}-${month.toString().padStart(2, "0")}`;
    }
    case "yearly": {
      return getYear(date).toString();
    }
    case "every_n_days":
      // every_n_days doesn't use period keys
      return null;
    default:
      return null;
  }
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventData) => void;
  onUpdate?: (id: string, data: UpdateEventData) => void;
  initialStartTime?: Date;
  editingEvent?: Event;
}

export function EventFormModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  initialStartTime,
  editingEvent,
}: EventFormModalProps) {
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<FrequencyType>("weekly");
  const [frequencyValue, setFrequencyValue] = useState(1);
  const [flexibleScheduling, setFlexibleScheduling] = useState(true);

  // nth_weekday_of_month config
  const [nthWeekday, setNthWeekday] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(6); // Saturday
  const [nthOccurrence, setNthOccurrence] = useState<1 | 2 | 3 | 4 | -1>(1); // First

  // yearly config
  const [yearlyMonth, setYearlyMonth] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  >(1);
  const [yearlyDay, setYearlyDay] = useState(1);

  const isEditMode = !!editingEvent;

  // Reset form when modal opens, or populate with event data if editing
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        // Editing mode - populate with event data
        setTitle(editingEvent.title);
        setDurationMinutes(editingEvent.durationMinutes);
        setCategory(editingEvent.category || "");
        setNotes(editingEvent.notes || "");
        // Reset recurrence fields for editing (patterns can't be edited from this form)
        setIsRecurring(false);
      } else {
        // Create mode - reset to defaults
        setTitle("");
        setDurationMinutes(60);
        setCategory("");
        setNotes("");
        setIsRecurring(false);
        setFrequency("weekly");
        setFrequencyValue(1);
        setFlexibleScheduling(true);
        setNthWeekday(6);
        setNthOccurrence(1);
        setYearlyMonth(1);
        setYearlyDay(1);
      }
    }
  }, [isOpen, editingEvent]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    if (isEditMode && editingEvent && onUpdate) {
      // Update existing event
      const updateData: UpdateEventData = {
        title: title.trim(),
        durationMinutes,
        category: category.trim() || "default",
        notes: notes.trim(),
      };

      onUpdate(editingEvent.id, updateData);
      onClose();
    } else if (isRecurring) {
      // Create recurring pattern and first instance
      try {
        const patternData: CreatePatternData = {
          title: title.trim(),
          frequency,
          frequencyValue,
          durationMinutes,
          flexibleScheduling,
        };

        // Add frequency-specific config
        if (frequency === "nth_weekday_of_month") {
          patternData.nthWeekdayConfig = {
            weekday: nthWeekday,
            occurrence: nthOccurrence,
          };
        } else if (frequency === "yearly") {
          patternData.yearlyConfig = {
            month: yearlyMonth,
            day: yearlyDay,
          };
        }

        // Create the pattern
        const pattern = await createPattern(patternData);

        // Generate first instance using initialStartTime or current date
        const referenceDate = initialStartTime || new Date();
        const periodKey = getPeriodKey(referenceDate, frequency);

        try {
          await generatePatternInstance(pattern.id, periodKey || undefined);
          alert("Recurring pattern and first instance created successfully!");
        } catch (error) {
          console.error("Failed to generate first instance:", error);
          alert(
            "Pattern created, but failed to generate first instance. You can generate it manually."
          );
        }

        onClose();
      } catch (error) {
        console.error("Failed to create pattern:", error);
        alert("Failed to create recurring pattern. Please try again.");
      }
    } else {
      // Create new one-time event
      const eventData: CreateEventData = {
        title: title.trim(),
        startTime: initialStartTime ? initialStartTime.toISOString() : null,
        durationMinutes,
        category: category.trim() || "default",
        notes: notes.trim(),
      };

      onSubmit(eventData);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-800/70"
      onClick={handleBackdropClick}
    >
      <div className="border-1 rounded-lg w-full max-w-md p-5 bg-zinc-900 text-yellow-600 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-3 text-sky-500">
          {isEditMode ? "Edit Event" : "New Event"}
        </h2>

        {initialStartTime && !isEditMode && (
          <div className="mb-3 text-xs">
            {format(initialStartTime, "EEEE, MMM d, yyyy")} at{" "}
            {format(initialStartTime, "h:mm a")}
          </div>
        )}

        {isEditMode && editingEvent?.startTime && (
          <div className="mb-3 text-xs">
            {format(editingEvent.startTime, "EEEE, MMM d, yyyy")} at{" "}
            {format(editingEvent.startTime, "h:mm a")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-medium mb-1 text-sky-500"
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300"
              placeholder="Event title"
              autoFocus
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="duration"
              className="block text-xs font-medium mb-1 text-sky-500"
            >
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300"
            />
          </div>

          {/* Category - only show for non-recurring events */}
          {!isRecurring && (
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-medium mb-1 text-sky-500"
              >
                Category
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300"
                placeholder="work, personal, health, etc."
              />
            </div>
          )}

          {/* Notes - only show for non-recurring events */}
          {!isRecurring && (
            <div>
              <label
                htmlFor="notes"
                className="block text-xs font-medium mb-1 text-sky-500"
              >
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300 resize-none"
                placeholder="Additional notes..."
              />
            </div>
          )}

          {/* Recurring Checkbox - only show when creating new events */}
          {!isEditMode && (
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
              <input
                id="isRecurring"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 text-fuchsia-600 focus:ring-fuchsia-500"
              />
              <label
                htmlFor="isRecurring"
                className="text-xs font-medium text-sky-500"
              >
                This is a recurring event
              </label>
            </div>
          )}

          {/* Recurrence Pattern Fields */}
          {isRecurring && !isEditMode && (
            <div className="space-y-3 pt-2 border-t border-zinc-700">
              {/* Frequency Type */}
              <div>
                <label
                  htmlFor="frequency"
                  className="block text-xs font-medium mb-1 text-sky-500"
                >
                  Frequency *
                </label>
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value as FrequencyType)
                  }
                  className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300 bg-zinc-800"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly (specific date)</option>
                  <option value="every_n_days">Every N days</option>
                  <option value="n_per_period">N times per week</option>
                  <option value="nth_weekday_of_month">
                    Nth weekday of month
                  </option>
                </select>
              </div>

              {/* Frequency Value - for every_n_days and n_per_period */}
              {(frequency === "every_n_days" ||
                frequency === "n_per_period") && (
                <div>
                  <label
                    htmlFor="frequencyValue"
                    className="block text-xs font-medium mb-1 text-sky-500"
                  >
                    {frequency === "every_n_days"
                      ? "Number of days"
                      : "Times per week"}{" "}
                    *
                  </label>
                  <input
                    id="frequencyValue"
                    type="number"
                    min="1"
                    max={frequency === "n_per_period" ? 7 : 365}
                    value={frequencyValue}
                    onChange={(e) => setFrequencyValue(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300"
                  />
                </div>
              )}

              {/* Nth Weekday of Month Config */}
              {frequency === "nth_weekday_of_month" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="nthOccurrence"
                      className="block text-xs font-medium mb-1 text-sky-500"
                    >
                      Which
                    </label>
                    <select
                      id="nthOccurrence"
                      value={nthOccurrence}
                      onChange={(e) =>
                        setNthOccurrence(
                          Number(e.target.value) as 1 | 2 | 3 | 4 | -1
                        )
                      }
                      className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300 bg-zinc-800"
                    >
                      <option value={1}>First</option>
                      <option value={2}>Second</option>
                      <option value={3}>Third</option>
                      <option value={4}>Fourth</option>
                      <option value={-1}>Last</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="nthWeekday"
                      className="block text-xs font-medium mb-1 text-sky-500"
                    >
                      Day
                    </label>
                    <select
                      id="nthWeekday"
                      value={nthWeekday}
                      onChange={(e) =>
                        setNthWeekday(
                          Number(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6
                        )
                      }
                      className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300 bg-zinc-800"
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Yearly Config */}
              {frequency === "yearly" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="yearlyMonth"
                      className="block text-xs font-medium mb-1 text-sky-500"
                    >
                      Month *
                    </label>
                    <select
                      id="yearlyMonth"
                      value={yearlyMonth}
                      onChange={(e) =>
                        setYearlyMonth(
                          Number(e.target.value) as
                            | 1
                            | 2
                            | 3
                            | 4
                            | 5
                            | 6
                            | 7
                            | 8
                            | 9
                            | 10
                            | 11
                            | 12
                        )
                      }
                      className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300 bg-zinc-800"
                    >
                      <option value={1}>January</option>
                      <option value={2}>February</option>
                      <option value={3}>March</option>
                      <option value={4}>April</option>
                      <option value={5}>May</option>
                      <option value={6}>June</option>
                      <option value={7}>July</option>
                      <option value={8}>August</option>
                      <option value={9}>September</option>
                      <option value={10}>October</option>
                      <option value={11}>November</option>
                      <option value={12}>December</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="yearlyDay"
                      className="block text-xs font-medium mb-1 text-sky-500"
                    >
                      Day *
                    </label>
                    <input
                      id="yearlyDay"
                      type="number"
                      min="1"
                      max="31"
                      value={yearlyDay}
                      onChange={(e) => setYearlyDay(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border-1 rounded-lg focus:outline-none focus:border-amber-300"
                    />
                  </div>
                </div>
              )}

              {/* Flexible Scheduling */}
              <div className="flex items-center gap-2">
                <input
                  id="flexibleScheduling"
                  type="checkbox"
                  checked={flexibleScheduling}
                  onChange={(e) => setFlexibleScheduling(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <label
                  htmlFor="flexibleScheduling"
                  className="text-xs text-yellow-600"
                >
                  Flexible scheduling (add to backlog instead of auto-schedule)
                </label>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-1.5 text-sm border-1 rounded-lg hover:bg-zinc-900/10 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-fuchsia-700 hover:bg-fuchsia-500 transition-all text-white font-semibold"
            >
              {isEditMode
                ? "Update"
                : isRecurring
                ? "Create Pattern"
                : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

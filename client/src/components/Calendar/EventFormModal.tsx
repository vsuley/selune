import { useState, useEffect, type FormEvent } from 'react';
import { format } from 'date-fns';
import type { CreateEventData } from '../../services/api';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventData) => void;
  initialStartTime?: Date;
}

export function EventFormModal({ isOpen, onClose, onSubmit, initialStartTime }: EventFormModalProps) {
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDurationMinutes(60);
      setCategory('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const eventData: CreateEventData = {
      title: title.trim(),
      startTime: initialStartTime ? initialStartTime.toISOString() : null,
      durationMinutes,
      category: category.trim() || 'default',
      notes: notes.trim(),
    };

    onSubmit(eventData);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={handleBackdropClick}
    >
      <div className="bg-synthwave-bg border-2 border-synthwave-neon-purple rounded-lg shadow-neon-purple w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-synthwave-neon-teal mb-4 font-mono">
          New Event
        </h2>

        {initialStartTime && (
          <div className="mb-4 text-sm text-synthwave-neon-purple font-mono">
            {format(initialStartTime, 'EEEE, MMM d, yyyy')} at {format(initialStartTime, 'h:mm a')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-synthwave-neon-teal mb-1 font-mono">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-synthwave-bg-light text-synthwave-neon-teal border-2 border-synthwave-neon-purple rounded-lg focus:outline-none focus:border-synthwave-neon-pink font-mono"
              placeholder="Event title"
              autoFocus
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-synthwave-neon-teal mb-1 font-mono">
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 bg-synthwave-bg-light text-synthwave-neon-teal border-2 border-synthwave-neon-purple rounded-lg focus:outline-none focus:border-synthwave-neon-pink font-mono"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-synthwave-neon-teal mb-1 font-mono">
              Category
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-synthwave-bg-light text-synthwave-neon-teal border-2 border-synthwave-neon-purple rounded-lg focus:outline-none focus:border-synthwave-neon-pink font-mono"
              placeholder="work, personal, health, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-synthwave-neon-teal mb-1 font-mono">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-synthwave-bg-light text-synthwave-neon-teal border-2 border-synthwave-neon-purple rounded-lg focus:outline-none focus:border-synthwave-neon-pink font-mono resize-none"
              placeholder="Additional notes..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-synthwave-bg-light text-synthwave-neon-purple border-2 border-synthwave-neon-purple rounded-lg hover:bg-synthwave-neon-purple/10 transition-colors font-mono font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-synthwave-neon-teal text-synthwave-bg-dark rounded-lg hover:shadow-neon-teal transition-all font-mono font-semibold"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

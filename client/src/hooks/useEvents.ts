import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, updateEvent, createEvent, type Event, type EventsResponse, type UpdateEventData, type CreateEventData } from '../services/api';

/**
 * Hook to fetch events for a given date range
 */
export function useEvents(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['events', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => getEvents(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update an event (for drag-and-drop operations)
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventData }) =>
      updateEvent(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events'] });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueriesData({ queryKey: ['events'] });

      // Optimistically update to the new value
      queryClient.setQueriesData<EventsResponse>({ queryKey: ['events'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          events: old.events.map((event) =>
            event.id === id
              ? {
                  ...event,
                  ...data,
                  startTime: data.startTime ? new Date(data.startTime) : event.startTime,
                }
              : event
          ),
        };
      });

      // Return a context object with the snapshotted value
      return { previousEvents };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEvents) {
        context.previousEvents.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync with the server
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/**
 * Hook to create a new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventData) => createEvent(data),
    onSuccess: () => {
      // Invalidate and refetch events after creating a new one
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

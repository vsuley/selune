import { Router } from "express";
import { PrismaClient } from "../../prisma-client";
import type {
  CreateEventRequest,
  EventResponse,
  UpdateEventRequest,
  EventsResponse,
} from "../types";
import { generateVirtualEventsForRange } from "../services/virtualEventService";

const router = Router();
const prisma = new PrismaClient();

// GET /api/events - Get events within a date range
// Returns separate lists for scheduled events and unscheduled virtual events
router.get("/", async (req, res) => {
  try {
    const { start, end, includeVirtual } = req.query;

    // Build query filters for real events
    const where: any = {};

    if (start || end) {
      where.startTime = {};
      if (start) {
        where.startTime.gte = new Date(start as string);
      }
      if (end) {
        where.startTime.lte = new Date(end as string);
      }
    }

    // Fetch real events from database
    const events = await prisma.event.findMany({
      where,
      orderBy: {
        startTime: "asc",
      },
    });

    const eventResponses: EventResponse[] = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      startTime: event.startTime,
      durationMinutes: event.durationMinutes,
      parentEventId: event.parentEventId,
      patternId: event.patternId,
      periodKey: event.periodKey,
      category: event.category,
      isFlexible: event.isFlexible,
      isTimeBound: event.isTimeBound,
      deadline: event.deadline,
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));

    // Generate virtual events for unsatisfied patterns if date range provided
    let virtualEvents: any[] = [];
    if (
      (includeVirtual === "true" || includeVirtual === undefined) &&
      start &&
      end
    ) {
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);

      virtualEvents = await generateVirtualEventsForRange(startDate, endDate);
    }

    const response: EventsResponse = {
      events: eventResponses,
      virtualEvents,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/events/backlog - Get flexible events (events that can be rescheduled)
router.get("/backlog", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        isFlexible: true,
      },
      orderBy: [
        { isTimeBound: "desc" }, // Time-bound items first
        { deadline: "asc" }, // Then by deadline
        { createdAt: "desc" }, // Then most recent
      ],
    });

    const response: EventResponse[] = events.map((event: any) => ({
      id: event.id,
      title: event.title,
      startTime: event.startTime,
      durationMinutes: event.durationMinutes,
      parentEventId: event.parentEventId,
      patternId: event.patternId,
      periodKey: event.periodKey,
      category: event.category,
      isFlexible: event.isFlexible,
      isTimeBound: event.isTimeBound,
      deadline: event.deadline,
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));

    res.json(response);
  } catch (error) {
    console.error("Error fetching backlog events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/events - Create a new event (or schedule a virtual event)
router.post("/", async (req, res) => {
  try {
    const {
      title,
      startTime,
      durationMinutes,
      parentEventId,
      patternId,
      periodKey,
      category,
      isFlexible,
      isTimeBound,
      deadline,
      notes,
    } = req.body as CreateEventRequest;

    // Basic validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!startTime) {
      return res.status(400).json({ error: "Start time is required" });
    }

    if (!durationMinutes || durationMinutes <= 0) {
      return res.status(400).json({ error: "Duration must be greater than 0" });
    }

    // If time-bound, deadline is required
    if (isTimeBound && !deadline) {
      return res.status(400).json({
        error: "Deadline is required for time-bound events",
      });
    }

    // If patternId is provided, verify the pattern exists and is active
    if (patternId) {
      const pattern = await prisma.recurrencePattern.findUnique({
        where: { id: patternId },
      });

      if (!pattern) {
        return res.status(400).json({ error: "Pattern not found" });
      }

      if (!pattern.active) {
        return res.status(400).json({ error: "Pattern is not active" });
      }

      // Check if this pattern+period combination already has a scheduled event
      if (periodKey) {
        const existingEvent = await prisma.event.findFirst({
          where: {
            patternId,
            periodKey,
          },
        });

        if (existingEvent) {
          return res.status(409).json({
            error: "An event for this pattern and period already exists",
          });
        }
      }
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        startTime: new Date(startTime),
        durationMinutes,
        parentEventId: parentEventId || null,
        patternId: patternId || null,
        periodKey: periodKey || null,
        category: category || "general",
        isFlexible: isFlexible !== undefined ? isFlexible : true,
        isTimeBound: isTimeBound || false,
        deadline: deadline ? new Date(deadline) : null,
        notes: notes || "",
      },
    });

    const response: EventResponse = {
      id: event.id,
      title: event.title,
      startTime: event.startTime,
      durationMinutes: event.durationMinutes,
      parentEventId: event.parentEventId,
      patternId: event.patternId,
      periodKey: event.periodKey,
      category: event.category,
      isFlexible: event.isFlexible,
      isTimeBound: event.isTimeBound,
      deadline: event.deadline,
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/events/:id - Update an event
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateEventRequest;

    // Verify event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Build update data object
    const updateData: any = {};

    if (updates.title !== undefined) {
      if (updates.title.trim().length === 0) {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      updateData.title = updates.title.trim();
    }

    if (updates.startTime !== undefined) {
      if (!updates.startTime) {
        return res.status(400).json({ error: "Start time cannot be null" });
      }
      updateData.startTime = new Date(updates.startTime);
    }

    if (updates.durationMinutes !== undefined) {
      if (updates.durationMinutes <= 0) {
        return res
          .status(400)
          .json({ error: "Duration must be greater than 0" });
      }
      updateData.durationMinutes = updates.durationMinutes;
    }

    if (updates.category !== undefined) {
      updateData.category = updates.category;
    }

    if (updates.isFlexible !== undefined) {
      updateData.isFlexible = updates.isFlexible;
    }

    if (updates.isTimeBound !== undefined) {
      updateData.isTimeBound = updates.isTimeBound;
    }

    if (updates.deadline !== undefined) {
      updateData.deadline = updates.deadline
        ? new Date(updates.deadline)
        : null;
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }

    if (updates.parentEventId !== undefined) {
      updateData.parentEventId = updates.parentEventId;
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    const response: EventResponse = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      startTime: updatedEvent.startTime,
      durationMinutes: updatedEvent.durationMinutes,
      parentEventId: updatedEvent.parentEventId,
      patternId: updatedEvent.patternId,
      periodKey: updatedEvent.periodKey,
      category: updatedEvent.category,
      isFlexible: updatedEvent.isFlexible,
      isTimeBound: updatedEvent.isTimeBound,
      deadline: updatedEvent.deadline,
      notes: updatedEvent.notes,
      createdAt: updatedEvent.createdAt,
      updatedAt: updatedEvent.updatedAt,
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/events/:id - Delete an event
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Delete the event (cascade will handle child events)
    await prisma.event.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

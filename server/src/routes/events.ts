import { Router } from 'express';
import { PrismaClient } from '../../prisma-client';
import type { CreateEventRequest, EventResponse } from '../types';

const router = Router();
const prisma = new PrismaClient();

// POST /api/events - Create a new event
router.post('/', async (req, res) => {
  try {
    const {
      title,
      startTime,
      durationMinutes,
      parentEventId,
      category,
      isTimeBound,
      deadline,
      notes,
    } = req.body as CreateEventRequest;

    // Basic validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!durationMinutes || durationMinutes <= 0) {
      return res.status(400).json({ error: 'Duration must be greater than 0' });
    }

    // If time-bound, deadline is required
    if (isTimeBound && !deadline) {
      return res.status(400).json({
        error: 'Deadline is required for time-bound events'
      });
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        startTime: startTime ? new Date(startTime) : null,
        durationMinutes,
        parentEventId: parentEventId || null,
        category: category || 'general',
        isTimeBound: isTimeBound || false,
        deadline: deadline ? new Date(deadline) : null,
        notes: notes || '',
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
      isTimeBound: event.isTimeBound,
      deadline: event.deadline,
      notes: event.notes,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

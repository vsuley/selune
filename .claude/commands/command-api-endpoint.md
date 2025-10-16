---
name: api-endpoint
description: Create a new API endpoint with validation and error handling
---

Create a new API endpoint: $ARGUMENTS

Requirements:
1. **Express route definition**
   - Use appropriate HTTP method (GET, POST, PATCH, DELETE)
   - Clear, RESTful URL structure
   - Add to appropriate route file in server/src/routes/

2. **Request validation**
   - Validate all inputs
   - Clear error messages for invalid requests
   - Use TypeScript types for request/response

3. **Prisma database operations**
   - Use Prisma client for database access
   - Handle errors gracefully
   - Use transactions where appropriate (especially for parent-child operations)

4. **Error handling**
   - Try-catch blocks around database operations
   - Return appropriate HTTP status codes:
     - 200 OK - success
     - 201 Created - resource created
     - 400 Bad Request - validation error
     - 404 Not Found - resource not found
     - 500 Internal Server Error - server error
   - Log errors for debugging

5. **Type safety**
   - Define request body type
   - Define response type
   - Use TypeScript throughout

Example structure:
```typescript
import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

interface CreateEventRequest {
  title: string;
  startTime: Date | null;
  durationMinutes: number;
  // ... other fields
}

interface CreateEventResponse {
  event: Event;
}

router.post('/events', async (req, res) => {
  try {
    const { title, startTime, durationMinutes } = req.body as CreateEventRequest;
    
    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Database operation
    const event = await prisma.event.create({
      data: {
        title,
        startTime,
        durationMinutes,
      },
    });
    
    res.status(201).json({ event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

export default router;
```

Remember:
- Follow RESTful conventions
- Handle all error cases
- Use appropriate status codes
- Validate all inputs
- Use transactions for multi-record operations

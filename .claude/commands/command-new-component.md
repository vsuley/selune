---
name: new-component
description: Create a new React component with TypeScript and tests
---

Create a new React component: $ARGUMENTS

Requirements:
1. **TypeScript with proper typing**
   - Define props interface
   - Type all state and function parameters
   - No `any` types

2. **Functional component with hooks**
   - Use appropriate hooks (useState, useEffect, useCallback, useMemo)
   - Follow React best practices
   - Keep component under 200 lines

3. **File structure**
   - Create in appropriate directory (Calendar/, Backlog/, shared/, etc.)
   - Use PascalCase for component name
   - Export as named export

4. **Documentation**
   - Add JSDoc comment explaining component purpose
   - Document complex logic inline
   - Include prop descriptions in interface

5. **Styling**
   - Use Tailwind CSS utility classes
   - Ensure mobile-friendly (min 44x44px touch targets if interactive)
   - Follow design system patterns

6. **Testing**
   - Create companion `.test.tsx` file
   - Test critical user interactions
   - Use React Testing Library

7. **Accessibility**
   - Semantic HTML
   - ARIA labels where appropriate
   - Keyboard navigation support

Example structure:
```typescript
import { useState } from 'react';
import { Event } from '@/types';

/**
 * EventCard displays a calendar event with drag-and-drop support
 */
interface EventCardProps {
  event: Event;
  onUpdate: (event: Event) => void;
  onDelete: () => void;
}

export function EventCard({ event, onUpdate, onDelete }: EventCardProps) {
  // Component implementation
}
```

Follow all code standards in CLAUDE.md.

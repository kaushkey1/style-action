import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TooltipProvider } from '@/components/ui';
import { PriorityChip } from '@/modules/tasks/components/PriorityChip';
import type { TaskPriority } from '@/modules/tasks/types/task.types';

const ALL_PRIORITIES: TaskPriority[] = ['Critical', 'High', 'Medium', 'Low'];

describe('PriorityChip', () => {
  it.each(ALL_PRIORITIES)('renders %s priority without crashing', (priority) => {
    render(
      <TooltipProvider>
        <PriorityChip priority={priority} />
      </TooltipProvider>
    );
    expect(screen.getByText(priority)).toBeInTheDocument();
  });
});

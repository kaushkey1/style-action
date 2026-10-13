import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ViewSwitcher } from '@/modules/tasks/components/ViewSwitcher';

describe('ViewSwitcher (desktop)', () => {
  it('renders only Kanban and Table (no Cards)', () => {
    render(<ViewSwitcher value="kanban" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Kanban' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Table' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Cards' })).not.toBeInTheDocument();
  });

  it('marks the active option as checked', () => {
    render(<ViewSwitcher value="table" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Table' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Kanban' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when a different option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewSwitcher value="table" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Kanban' }));
    expect(onChange).toHaveBeenCalledWith('kanban');
  });
});

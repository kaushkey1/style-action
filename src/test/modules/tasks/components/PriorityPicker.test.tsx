import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PriorityPicker } from '@/modules/tasks/components/PriorityPicker';

describe('PriorityPicker', () => {
  it('renders all four options as radio buttons', () => {
    render(<PriorityPicker value="Medium" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Low' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'High' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Critical' })).toBeInTheDocument();
  });

  it('marks the active option as checked', () => {
    render(<PriorityPicker value="Critical" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Critical' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Low' })).toHaveAttribute('aria-checked', 'false');
  });

  it('fires onChange with the clicked value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PriorityPicker value="Low" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: 'High' }));
    expect(onChange).toHaveBeenCalledWith('High');
  });

  it('does not fire onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PriorityPicker value="Low" onChange={onChange} disabled />);
    await user.click(screen.getByRole('radio', { name: 'High' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

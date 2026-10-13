import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui';

function Harness({ initial = 'card' }: { initial?: string }) {
  const [v, setV] = React.useState(initial);
  return (
    <ToggleGroup value={v} onValueChange={setV} aria-label="View">
      <ToggleGroupItem value="card">Cards</ToggleGroupItem>
      <ToggleGroupItem value="table">Table</ToggleGroupItem>
      <ToggleGroupItem value="kanban">Kanban</ToggleGroupItem>
    </ToggleGroup>
  );
}

describe('ToggleGroup', () => {
  it('renders 3 items and marks initial value as active', () => {
    render(<Harness initial="card" />);
    const cardBtn = screen.getByRole('radio', { name: 'Cards' });
    expect(cardBtn).toHaveAttribute('data-state', 'on');
    expect(screen.getByRole('radio', { name: 'Table' })).toHaveAttribute('data-state', 'off');
  });

  it('switches active item on click', async () => {
    const user = userEvent.setup();
    render(<Harness initial="card" />);
    await user.click(screen.getByRole('radio', { name: 'Table' }));
    expect(screen.getByRole('radio', { name: 'Table' })).toHaveAttribute('data-state', 'on');
    expect(screen.getByRole('radio', { name: 'Cards' })).toHaveAttribute('data-state', 'off');
  });

  it('does not deselect (clicking active item keeps it on)', async () => {
    const user = userEvent.setup();
    render(<Harness initial="card" />);
    await user.click(screen.getByRole('radio', { name: 'Cards' }));
    expect(screen.getByRole('radio', { name: 'Cards' })).toHaveAttribute('data-state', 'on');
  });
});

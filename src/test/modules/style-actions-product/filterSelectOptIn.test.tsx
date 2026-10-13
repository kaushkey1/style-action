import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FilterSelect } from '@/components/ui';

// Scope 1a R8 / decision F-D6: the workspace's store selector opts into wider label, panel and option classes.
// The contract under test is "no prop passed, no change" for the 42 other FilterSelect consumers, which is a
// class-level guarantee, so these tests read classes deliberately.

const LABEL = '8080 · RRL Trends Main Street Mall Mu · Mumbai';
const OPTIONS = [
  { value: '8080', label: LABEL },
  { value: '5943', label: '5943 · RRL Trends Infinity Mall Malad · Mumbai' },
];

function triggerLabel(): HTMLElement {
  const label = screen.getByText(LABEL, { selector: 'button > span' });
  return label;
}

describe('FilterSelect opt-in width props', () => {
  it('keeps the default label cap, panel width and truncated options when no prop is passed', async () => {
    const user = userEvent.setup();
    render(<FilterSelect value="8080" onChange={vi.fn()} placeholder="Choose a store" searchable options={OPTIONS} />);
    expect(triggerLabel()).toHaveClass('truncate', 'max-w-40');
    await user.click(screen.getByRole('button', { name: LABEL }));
    const listbox = screen.getByRole('listbox', { name: 'Choose a store' });
    expect(listbox.parentElement).toHaveClass('w-56');
    expect(screen.getAllByRole('option')[1]?.querySelector('span')).toHaveClass('truncate');
  });

  it('applies the opt-in label, panel and option classes', async () => {
    const user = userEvent.setup();
    render(
      <FilterSelect
        value="8080"
        onChange={vi.fn()}
        placeholder="Choose a store"
        searchable
        options={OPTIONS}
        labelClassName="max-w-none"
        panelClassName="w-[28rem]"
        optionLabelClassName="min-w-0 break-words text-left"
      />,
    );
    expect(triggerLabel()).toHaveClass('truncate', 'max-w-none');
    expect(triggerLabel()).not.toHaveClass('max-w-40');
    await user.click(screen.getByRole('button', { name: LABEL }));
    const panel = screen.getByRole('listbox', { name: 'Choose a store' }).parentElement;
    expect(panel).toHaveClass('w-[28rem]');
    expect(panel).not.toHaveClass('w-56');
    const option = screen.getAllByRole('option')[1]?.querySelector('span');
    expect(option).toHaveClass('break-words');
    expect(option).not.toHaveClass('truncate');
  });
});

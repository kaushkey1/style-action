import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DrilldownTable } from '@/modules/dashboard/components/DrilldownTable';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderTable(props: React.ComponentProps<typeof DrilldownTable>) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>
        <DrilldownTable {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DrilldownTable', () => {
  const mockHeaders = ['Name', 'Value 1', 'Value 2'];
  const mockRows = [
    {
      id: 'row-1',
      name: 'Parent Row',
      values: ['100', '200'],
      children: [
        {
          id: 'row-1-1',
          name: 'Child Row',
          values: ['50', '75'],
        },
      ],
    },
    {
      id: 'row-2',
      name: 'Single Row',
      values: ['300', '400'],
    },
  ];

  it('renders without crashing', () => {
    renderTable({ title: 'Test Table', headers: mockHeaders, rows: [] });
  });

  it('displays table title', () => {
    renderTable({ title: 'Test Table', headers: mockHeaders, rows: mockRows });
    expect(screen.getByText('Test Table')).toBeInTheDocument();
  });

  it('renders headers correctly', () => {
    renderTable({ title: 'Test Table', headers: mockHeaders, rows: mockRows });
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value 1')).toBeInTheDocument();
    expect(screen.getByText('Value 2')).toBeInTheDocument();
  });

  it('renders parent rows', () => {
    renderTable({ title: 'Test Table', headers: mockHeaders, rows: mockRows });
    expect(screen.getByText('Parent Row')).toBeInTheDocument();
    expect(screen.getByText('Single Row')).toBeInTheDocument();
  });

  it('expands and collapses rows on click', () => {
    renderTable({ title: 'Test Table', headers: mockHeaders, rows: mockRows });

    const parentRow = screen.getByText('Parent Row').closest('tr')!;
    expect(screen.queryByText('Child Row')).not.toBeInTheDocument();

    fireEvent.click(parentRow);
    expect(screen.getByText('Child Row')).toBeInTheDocument();

    fireEvent.click(parentRow);
    expect(screen.queryByText('Child Row')).not.toBeInTheDocument();
  });

  it('expands all rows when Expand All is clicked', () => {
    renderTable({ title: 'Test Table', headers: mockHeaders, rows: mockRows });

    const expandAllButton = screen.getByRole('button', { name: 'Expand all rows' });
    expect(screen.queryByText('Child Row')).not.toBeInTheDocument();

    fireEvent.click(expandAllButton);
    expect(screen.getByText('Child Row')).toBeInTheDocument();
  });

  it('collapses all rows when Collapse is clicked', () => {
    renderTable({ title: 'Test Table', headers: mockHeaders, rows: mockRows });

    fireEvent.click(screen.getByRole('button', { name: 'Expand all rows' }));
    expect(screen.getByText('Child Row')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all rows' }));
    expect(screen.queryByText('Child Row')).not.toBeInTheDocument();
  });

  it('shows empty state when no rows', () => {
    renderTable({ title: 'Test Table', headers: mockHeaders, rows: [] });
    expect(screen.getByText(/No category rows/i)).toBeInTheDocument();
  });

  it('handles keyboard interaction for expandable rows', () => {
    renderTable({ title: 'Test Table', headers: mockHeaders, rows: mockRows });

    const parentRow = screen.getByText('Parent Row').closest('tr')!;
    fireEvent.keyDown(parentRow, { key: 'Enter' });
    expect(screen.getByText('Child Row')).toBeInTheDocument();

    fireEvent.keyDown(parentRow, { key: ' ' });
    expect(screen.queryByText('Child Row')).not.toBeInTheDocument();
  });
});

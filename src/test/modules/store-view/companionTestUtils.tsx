import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { apiFetch } from '@/lib/api';
import { DateRangeContext, type DateRange } from '@/modules/store-view/shared/dateRange';
import { apiResponses } from './companionFixtures';

export function mockCompanionResponses(overrides: Record<string, unknown> = {}) {
  const responses = { ...apiResponses, ...overrides };
  vi.mocked(apiFetch).mockImplementation(async <T,>(path: string): Promise<T> => {
    if (!(path in responses)) throw new Error(`Unexpected Companion request: ${path}`);
    return structuredClone(responses[path]) as T;
  });
}

export function renderCompanion(ui: ReactElement, range: DateRange | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  const tree = (value: DateRange | null) => (
    <QueryClientProvider client={client}>
      <DateRangeContext.Provider value={value}>{ui}</DateRangeContext.Provider>
    </QueryClientProvider>
  );
  const result = render(tree(range));
  return { ...result, client, changeRange: (value: DateRange | null) => result.rerender(tree(value)) };
}

/** Panel's title is in SectionHeader, immediately inside the panel wrapper. */
export function panel(title: string) {
  const element = screen.getByText(title).closest('.rounded-lg');
  if (!(element instanceof HTMLElement)) throw new Error(`Panel not found: ${title}`);
  return within(element);
}

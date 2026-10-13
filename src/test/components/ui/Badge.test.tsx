import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '@/components/ui';

describe('Badge purple variant', () => {
  it('renders with purple background + text classes', () => {
    render(<Badge variant="purple">in_review</Badge>);
    const el = screen.getByText('in_review');
    expect(el.className).toContain('bg-purple-100');
    expect(el.className).toContain('text-purple-700');
  });
});

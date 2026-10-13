import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Funnel } from '@/modules/store-view/product-health/phKit';

describe('Companion funnel', () => {
  it('keeps cross-channel counts and clamps rising-stage drop-off to zero', () => {
    render(<Funnel stages={[{ label: 'Payment', value: 110478 }, { label: 'Confirmed', value: 110668 }]} />);
    expect(screen.getByText('1,10,668')).toBeInTheDocument();
    expect(screen.getByText('−0 drop-off (0%)')).toBeInTheDocument();
    expect(screen.queryByText(/−-190/)).not.toBeInTheDocument();
  });
  it('handles zero-count stages without NaN or Infinity', () => {
    const { container } = render(<Funnel stages={[{ label: 'Start', value: 0 }, { label: 'End', value: 0 }]} />);
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
  });
  it('handles an empty stage list', () => {
    const { container } = render(<Funnel stages={[]} />);
    expect(container.textContent).toBe('');
    expect(container.querySelector('[style]')).toBeNull();
  });
  it('caps bar widths while retaining cross-channel counts and percentages', () => {
    const { container } = render(<Funnel stages={[{ label: 'Payment', value: 10 }, { label: 'Confirmed', value: 20 }]} />);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('200% of start')).toBeInTheDocument();
    const widths = Array.from(container.querySelectorAll<HTMLElement>('[style]'), (bar) => bar.style.width);
    expect(widths).toEqual(['100%', '100%']);
  });
});

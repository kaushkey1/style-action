import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar } from '@/components/ui';

describe('Avatar', () => {
  it('renders explicit initials', () => {
    render(<Avatar initials="BB" name="Bob Brown" />);
    expect(screen.getByText('BB')).toBeInTheDocument();
  });
  it('derives initials from a 2-part name', () => {
    render(<Avatar name="Alice Anderson" />);
    expect(screen.getByText('AA')).toBeInTheDocument();
  });
  it('derives initials from a single-word name', () => {
    render(<Avatar name="Cher" />);
    expect(screen.getByText('CH')).toBeInTheDocument();
  });
  it('renders Lucide user icon when no name/initials and fallbackIcon=true', () => {
    const { container } = render(<Avatar />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
  it('applies size classes correctly', () => {
    const { rerender, container } = render(<Avatar name="X" size="xs" />);
    expect(container.firstChild).toHaveClass('w-6', 'h-6');
    rerender(<Avatar name="X" size="md" />);
    expect(container.firstChild).toHaveClass('w-10', 'h-10');
  });
  it('exposes accessible name when `name` provided', () => {
    render(<Avatar name="Bob Brown" />);
    expect(screen.getByLabelText('Avatar for Bob Brown')).toBeInTheDocument();
  });
});

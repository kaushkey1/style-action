import { Table as TableIcon, Columns } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { TaskView } from '../types/task.types';

interface Option {
  value: TaskView;
  label: string;
  Icon: typeof Columns;
}

// Desktop only: Kanban + Table. Mobile is Card-only, so the switcher is hidden.
const DESKTOP_OPTIONS: readonly Option[] = [
  { value: 'kanban', label: 'Kanban', Icon: Columns },
  { value: 'table', label: 'Table', Icon: TableIcon },
];

interface ViewSwitcherProps {
  value: TaskView;
  onChange: (v: TaskView) => void;
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps): React.JSX.Element | null {
  const isMobile = useIsMobile();
  // Card-only on mobile — no toggle needed.
  if (isMobile) return null;

  // h-8 outer + h-full items keeps the switcher the same 32px height as the
  // filter triggers and search box (standardised toolbar control height).
  // Icons only — labels are redundant with the recognisable board/table glyphs.
  return (
    <ToggleGroup
      value={value}
      onValueChange={(v) => onChange(v as TaskView)}
      aria-label="View"
      className="h-8 shrink-0 p-0.5"
    >
      {DESKTOP_OPTIONS.map(({ value: v, label, Icon }) => (
        <ToggleGroupItem key={v} value={v} aria-label={label} className="h-full">
          <Icon className="w-4 h-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

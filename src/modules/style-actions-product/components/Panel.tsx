import { Card, SectionHeader } from '@/components/ui';
import { cn } from '@/lib/utils';

interface PanelProps {
  readonly title: React.ReactNode;
  readonly subtitle?: string;
  readonly actions?: React.ReactNode;
  readonly className?: string;
  readonly children: React.ReactNode;
}

/** Bordered section with a SectionHeader (ported from the prototype). */
export function Panel({ title, subtitle, actions, className, children }: PanelProps): React.ReactNode {
  return (
    <Card className={cn('min-w-0 p-4', className)}>
      <SectionHeader title={title} subtitle={subtitle} actions={actions} inlineActions={actions === undefined} />
      {children}
    </Card>
  );
}

/** Plain-language placeholder for evidence the source does not hold (never a zero). */
export function MissingEvidence({ children }: { readonly children: React.ReactNode }): React.ReactNode {
  return <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-500">{children}</p>;
}

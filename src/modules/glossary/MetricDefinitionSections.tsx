/**
 * The three "insights" sections for the glossary detail pane:
 * What this metric means · How we calculate it · Worked example.
 * `size='detail'` bumps typography for the right pane (labels 14, body 16).
 */
import { motion } from 'motion/react';
import { BookOpen, Calculator, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GlossaryEntry } from './useGlossary';

const SPRING = { type: 'spring', duration: 0.3, bounce: 0 } as const;

export type SectionsSize = 'compact' | 'detail';

export function MetricDefinitionSections({
  entry,
  show = true,
  size = 'detail',
  className,
}: {
  entry: GlossaryEntry;
  show?: boolean;
  size?: SectionsSize;
  className?: string;
}): React.JSX.Element {
  const detail = size === 'detail';
  const labelCls = detail ? 'text-sm font-semibold text-gray-900' : 'text-xs font-semibold text-gray-900';
  const bodyCls = detail
    ? 'text-base text-gray-600 leading-relaxed text-pretty'
    : 'text-sm text-gray-600 leading-relaxed text-pretty';
  const monoCls = detail
    ? 'text-base text-gray-800 font-mono leading-relaxed tabular-nums'
    : 'text-sm text-gray-700 font-mono leading-relaxed tabular-nums';
  const exampleCls = detail
    ? 'text-base text-gray-700 leading-relaxed tabular-nums text-pretty'
    : 'text-sm text-gray-700 leading-relaxed tabular-nums text-pretty';
  const iconCls = detail ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const gap = detail ? 'space-y-4' : 'space-y-3';

  return (
    <div className={cn(gap, className)}>
      <Section index={0} open={show} icon={<BookOpen className={cn(iconCls, 'text-gray-500')} />} label="What this metric means" labelCls={labelCls}>
        <p className={bodyCls}>{entry.what}</p>
      </Section>

      {entry.formula && (
        <Section index={1} open={show} icon={<Calculator className={cn(iconCls, 'text-gray-500')} />} label="How we calculate it" labelCls={labelCls}>
          <div className={cn('rounded-md bg-gray-50 ring-1 ring-inset ring-gray-200/80', detail ? 'px-3.5 py-2.5' : 'px-3 py-2')}>
            <p className={monoCls}>{entry.formula}</p>
          </div>
        </Section>
      )}

      {entry.example && (
        <Section index={2} open={show} icon={<FileText className={cn(iconCls, 'text-amber-500')} />} label="Worked example" labelCls={labelCls}>
          <div className={cn('rounded-md bg-amber-50 ring-1 ring-inset ring-amber-100', detail ? 'px-3.5 py-2.5' : 'px-3 py-2')}>
            <p className={exampleCls}>{entry.example}</p>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  index,
  open,
  icon,
  label,
  labelCls,
  children,
}: {
  index: number;
  open: boolean;
  icon: React.ReactNode;
  label: string;
  labelCls: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ ...SPRING, delay: 0.05 + index * 0.06 }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className={labelCls}>{label}</span>
      </div>
      {children}
    </motion.div>
  );
}

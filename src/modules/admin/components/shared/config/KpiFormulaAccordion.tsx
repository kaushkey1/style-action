import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatedConfigContent } from './AnimatedConfigContent';

interface FormulaItem {
  key?: string;
  name: string;
  formula: string;
  unit?: string;
}

export function KpiFormulaAccordion({ title, items, animated = false }: { title: string; items: FormulaItem[]; animated?: boolean }): ReactNode {
  const [isOpen, setOpen] = useState(true);
  const id = useId();
  const content = items.map((item) => <div key={item.key ?? item.name} className="pt-3 border-t border-gray-100">
    <p className="text-sm font-mono font-medium text-gray-900">{item.name}</p>
    {item.unit && <p className="text-xs text-gray-500 mt-1">Unit: {item.unit}</p>}
    <pre className="mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">{item.formula}</pre>
  </div>);
  return <div className="bg-white rounded-lg border border-gray-200">
    <button id={`${id}-trigger`} type="button" aria-expanded={isOpen} aria-controls={`${id}-content`}
      onClick={() => setOpen((open) => !open)}
      className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg">
      {animated ? <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
        : isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" /> : <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />}
      <span className="text-sm font-semibold text-gray-900">{title}</span>{' '}
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">{items.length}</span>
    </button>
    {animated ? <AnimatedConfigContent open={isOpen} id={`${id}-content`} labelledBy={`${id}-trigger`} className="px-4 pb-3 space-y-3">{content}</AnimatedConfigContent>
      : isOpen && <div id={`${id}-content`} role="region" aria-labelledby={`${id}-trigger`} className="px-4 pb-3 space-y-3">{content}</div>}
  </div>;
}

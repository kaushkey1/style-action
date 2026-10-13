import { Info } from 'lucide-react';

import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';

interface TermProps {
  /** The visible label. */
  readonly children: React.ReactNode;
  /** One line of plain help; the shared Tooltip opens on hover, focus and tap (S2-C67 M9). */
  readonly help: string;
}

/** A label with a small focusable help icon, for terms a planner may not know. */
export function Term({ children, help }: TermProps): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={`About: ${help}`} className="relative h-auto min-h-0 rounded-full p-0 text-gray-400 hover:bg-transparent hover:text-gray-600">
            <span aria-hidden className="absolute -inset-3" />
            <Info className="size-3" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{help}</TooltipContent>
      </Tooltip>
    </span>
  );
}

/**
 * Download control for a session log — one action, one UI: an icon trigger that
 * opens a DropdownMenu on desktop and a BottomSheet on mobile (app rule: all
 * dropdowns become bottom sheets on mobile). Shared by the Virtual Team task
 * detail Session Log and the Sessions page rows.
 */
import { useState } from 'react';
import { Download, FileCode, FileText } from 'lucide-react';
import {
  BottomSheet,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { downloadSessionMarkdown, downloadSessionPdf } from './sessionExport';
import type { ExportMessage, SessionExportMeta } from './sessionExport';

interface SessionDownloadMenuProps {
  meta: SessionExportMeta;
  messages: ExportMessage[];
  /** Accessible label for the icon-only trigger */
  ariaLabel: string;
  className?: string;
}

const SHEET_ITEM_CLASS =
  'flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-gray-700 hover:bg-gray-50';

export function SessionDownloadMenu({
  meta,
  messages,
  ariaLabel,
  className,
}: SessionDownloadMenuProps): React.ReactNode {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          aria-label={ariaLabel}
          className={className}
          onClick={() => setSheetOpen(true)}
        >
          <Download className="w-4 h-4 text-gray-500" />
        </Button>
        <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Download session">
          <div className="space-y-1">
            <button
              type="button"
              className={SHEET_ITEM_CLASS}
              onClick={() => {
                downloadSessionPdf(meta, messages);
                setSheetOpen(false);
              }}
            >
              <FileText className="h-4 w-4 text-gray-500" aria-hidden />
              PDF
            </button>
            <button
              type="button"
              className={SHEET_ITEM_CLASS}
              onClick={() => {
                downloadSessionMarkdown(meta, messages);
                setSheetOpen(false);
              }}
            >
              <FileCode className="h-4 w-4 text-gray-500" aria-hidden />
              Markdown
            </button>
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={ariaLabel} className={className}>
          <Download className="w-4 h-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => downloadSessionPdf(meta, messages)}>
          <FileText className="mr-2 h-4 w-4" /> PDF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadSessionMarkdown(meta, messages)}>
          <FileCode className="mr-2 h-4 w-4" /> Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

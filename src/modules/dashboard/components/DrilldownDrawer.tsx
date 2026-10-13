import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Download, StopCircle } from 'lucide-react';
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import {
  drilldownByFormat,
  drilldownByCategory,
  drilldownByStore,
  drilldownByOption,
  type DrilldownItem,
} from '../data/mockDrilldownData';

// ---------------------------------------------------------------------------
// Ranked list sub-component
// ---------------------------------------------------------------------------

const STATUS_BAR_COLOR: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  on_track: 'bg-green-500',
};

function RankedList({ items }: { items: DrilldownItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">{item.valueFormatted}</p>
          </div>
          {/* eslint-disable no-restricted-syntax -- dynamic width for percentage bar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', STATUS_BAR_COLOR[item.status])} style={{ width: `${item.percentage}%` }} />
            </div>
          {/* eslint-enable no-restricted-syntax */}
            <span className="text-xs font-medium text-gray-700 w-8 text-right">{item.percentage}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Drawer
// ---------------------------------------------------------------------------

interface DrilldownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onApprove?: () => void;
  onReject?: () => void;
  approveLabel?: string;
}

export function DrilldownDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  onApprove,
  onReject,
  approveLabel = 'Approve',
}: DrilldownDrawerProps) {
  const isMobile = useIsMobile();
  const { success } = useToast();
  const [confirmStop, setConfirmStop] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    success('Download started: aged-options.csv');
  };

  const handleStopOrders = () => {
    if (!confirmStop) {
      setConfirmStop(true);
      return;
    }
    success('Styles flagged as "no further orders"');
    setConfirmStop(false);
  };

  const drawer = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed z-50 bg-white flex flex-col',
          isMobile
            ? 'inset-x-0 bottom-0 rounded-t-2xl max-h-[95dvh]'
            : 'top-0 right-0 bottom-0 w-[60vw] max-w-[900px] border-l border-gray-200',
        )}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center py-2 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabbed content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Tabs defaultValue="format">
            <TabsList variant="default" className="mb-4">
              <TabsTrigger value="format">By Format</TabsTrigger>
              <TabsTrigger value="category">By Category</TabsTrigger>
              <TabsTrigger value="store">By Store</TabsTrigger>
              <TabsTrigger value="option">By Option</TabsTrigger>
            </TabsList>

            <TabsContent value="format">
              <RankedList items={drilldownByFormat} />
            </TabsContent>

            <TabsContent value="category">
              <RankedList items={drilldownByCategory} />
            </TabsContent>

            <TabsContent value="store">
              <div className="space-y-2">
                {drilldownByStore.map((store) => (
                  <div key={store.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{store.name}</p>
                      <p className="text-xs text-gray-500">{store.code} · {store.format}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{store.valueFormatted}</p>
                      <p className="text-xs text-gray-500">{store.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="option">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-3 font-medium text-gray-500">Code</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">Description</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500">Age</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500">Units</th>
                      <th className="text-right py-2 pl-3 font-medium text-gray-500">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drilldownByOption.map((opt) => (
                      <tr key={opt.id} className="border-b border-gray-50">
                        <td className="py-2 pr-3 font-mono text-gray-700">{opt.code}</td>
                        <td className="py-2 px-3 text-gray-900">{opt.description}</td>
                        <td className="py-2 px-3 text-right text-gray-700">{opt.ageDays}d</td>
                        <td className="py-2 px-3 text-right text-gray-700">{opt.units.toLocaleString('en-IN')}</td>
                        <td className="py-2 pl-3 text-right font-medium text-gray-900">{opt.valueFormatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>

          {/* Agent actions */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Agent actions available</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={handleStopOrders}
            >
              <StopCircle className="w-3.5 h-3.5" />
              {confirmStop ? 'Confirm: Flag styles as no further orders?' : 'Stop further orders for these styles'}
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              Foreclose open POs →
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              Export aged options list
            </Button>
          </div>
        </div>

        {/* Sticky footer with actions */}
        {(onApprove || onReject) && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex items-center gap-3 pb-safe">
            {onReject && (
              <Button variant="outline" size="sm" className="flex-1 border-error/40 text-error hover:bg-error-50 hover:border-error/60" onClick={onReject}>
                Reject resolution
              </Button>
            )}
            {onApprove && (
              <Button size="sm" className="flex-1" onClick={onApprove}>
                {approveLabel} →
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );

  return createPortal(drawer, document.body);
}

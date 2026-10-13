import {
  Badge, SectionHeader, EmptyState,
  DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell,
} from '@/components/ui';
import type { StoreAuditData, ActionPriority } from '@/modules/store-view/types/storeAudit.types';

const PRIORITY_CONFIG: Record<ActionPriority, {
  label: string;
  badgeVariant: 'error' | 'warning' | 'info';
  borderClass: string;
}> = {
  S0: {
    label: 'S0 — Critical — Fix within 48 hours',
    badgeVariant: 'error',
    borderClass: 'border-l-3 border-l-red-500',
  },
  S1: {
    label: 'S1 — High — Fix within 7 days',
    badgeVariant: 'warning',
    borderClass: 'border-l-3 border-l-amber-500',
  },
  S2: {
    label: 'S2 — Medium — Fix within 30 days',
    badgeVariant: 'info',
    borderClass: 'border-l-3 border-l-blue-500',
  },
};

interface StoreActionItemsProps {
  data: StoreAuditData;
}

export function StoreActionItems({ data }: StoreActionItemsProps) {
  const priorities: ActionPriority[] = ['S0', 'S1', 'S2'];
  const groups = priorities
    .map((priority) => ({
      priority,
      items: data.actionItems.filter((item) => item.priority === priority),
      config: PRIORITY_CONFIG[priority],
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div>
      <SectionHeader title="Action Items & Prioritized Focus Areas" />

      {groups.length === 0 ? (
        <EmptyState description="No action items for this store" />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.priority}
              id={`section-${group.priority.toLowerCase()}`}
              className="scroll-mt-20"
            >
              {/* Priority Group Header */}
              <div className={`bg-white rounded-lg border border-gray-200 ${group.config.borderClass} px-4 py-2 mb-2`}>
                <div className="flex items-center gap-2">
                  <Badge variant={group.config.badgeVariant} dot size="sm">
                    {group.priority}
                  </Badge>
                  <span className="text-sm font-semibold text-gray-700">{group.config.label}</span>
                </div>
              </div>

              {/* Action Items Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <DataTable>
                  <DataTableHeader>
                    <DataTableHead className="w-10">#</DataTableHead>
                    <DataTableHead className="w-16">Priority</DataTableHead>
                    <DataTableHead>Issue</DataTableHead>
                    <DataTableHead className="w-20">Ref</DataTableHead>
                    <DataTableHead>Details</DataTableHead>
                  </DataTableHeader>
                  <DataTableBody>
                    {group.items.map((item, index) => (
                      <DataTableRow key={index}>
                        <DataTableCell className="text-xs text-gray-500 tabular-nums">
                          {index + 1}
                        </DataTableCell>
                        <DataTableCell>
                          <Badge variant={group.config.badgeVariant} size="sm">
                            {item.priority}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell className="font-medium text-gray-900 text-sm">
                          {item.issue}
                        </DataTableCell>
                        <DataTableCell className="font-mono text-xs text-gray-500">
                          {item.relatedChecklist}
                        </DataTableCell>
                        <DataTableCell className="text-sm text-gray-600 max-w-[400px]">
                          {item.description}
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

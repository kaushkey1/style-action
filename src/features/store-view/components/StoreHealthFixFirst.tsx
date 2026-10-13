import { Badge } from '@/components/ui';
import type { StoreAuditData } from '@/modules/store-view/types/storeAudit.types';

interface StoreHealthFixFirstProps {
  data: StoreAuditData;
}

export function StoreHealthFixFirst({ data }: StoreHealthFixFirstProps) {
  const s0Items = data.actionItems.filter((item) => item.priority === 'S0');
  const s1Items = data.actionItems.filter((item) => item.priority === 'S1').slice(0, 3);
  const fixItems = [...s0Items, ...s1Items];

  if (fixItems.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border-l-3 border-l-red-500 border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">What to Fix First</h3>
      <div className="space-y-2">
        {fixItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant={item.priority === 'S0' ? 'error' : 'warning'} size="sm">
              {item.priority}
            </Badge>
            <span className="text-sm font-medium text-gray-900 flex-1">{item.issue}</span>
            <span className="text-xs text-gray-500 font-mono ml-auto shrink-0">{item.relatedChecklist}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

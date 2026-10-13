import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

interface OrgSelectorProps {
  orgIds: string[];
  orgNames: Record<string, string>;
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  className?: string;
}

export function OrgSelector({
  orgIds,
  orgNames,
  selectedOrgId,
  onOrgChange,
  className,
}: OrgSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor="org-selector" className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
        <Building2 className="w-3.5 h-3.5" />
        Organization
      </label>
      <Select value={selectedOrgId} onValueChange={onOrgChange}>
        <SelectTrigger id="org-selector" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {orgIds.map((orgId) => (
            <SelectItem key={orgId} value={orgId}>
              {orgNames[orgId] || orgId}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

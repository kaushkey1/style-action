import { SectionHeader } from '@/components/ui';
import type { StoreAuditData } from '@/modules/store-view/types/storeAudit.types';

interface StoreHealthSummaryProps {
  data: StoreAuditData;
}

export function StoreHealthSummary({ data }: StoreHealthSummaryProps) {
  const sentences = data.healthSummary
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => (s.endsWith('.') ? s : `${s}.`));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Store Health Summary" />
      <ul className="space-y-2 list-disc pl-5 marker:text-primary">
        {sentences.map((sentence, index) => (
          <li key={index} className="text-sm text-gray-700 leading-relaxed">
            {sentence}
          </li>
        ))}
      </ul>
    </div>
  );
}

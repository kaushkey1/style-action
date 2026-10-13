import { Link2Off } from 'lucide-react';

interface LinkedEntitiesProps {
  emptyHint?: string;
}

export function LinkedEntities({ emptyHint }: LinkedEntitiesProps): React.ReactNode {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-6 text-center">
      <Link2Off className="h-4 w-4 text-gray-400" aria-hidden />
      <p className="text-xs text-gray-500">{emptyHint ?? 'No linked insight or task'}</p>
    </div>
  );
}

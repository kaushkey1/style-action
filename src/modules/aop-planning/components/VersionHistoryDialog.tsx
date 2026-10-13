import React from 'react';
import { Modal, ModalFooter, Button, Badge, EmptyState } from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';
import { useVersions, useCreateRevision } from '../api/salesPlanHooks';

interface VersionHistoryDialogProps {
  cycleId: string;
  cycleName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VersionHistoryDialog({
  cycleId,
  cycleName,
  isOpen,
  onClose,
}: VersionHistoryDialogProps): React.ReactNode {
  const { data, isLoading, isError } = useVersions(isOpen ? cycleId : undefined);
  const createRevision = useCreateRevision(cycleId);

  function handleNewRevision(): void {
    createRevision.mutate(undefined, {
      onError: (e: unknown) =>
        window.alert(e instanceof Error ? e.message : 'Failed to create revision'),
    });
  }

  const versions = data?.versions ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Version history"
      description={
        cycleName
          ? `Revisions for ${cycleName}. A new revision clones the current plan; downstream OTB uses the latest.`
          : 'A new revision clones the current plan; downstream OTB references the latest.'
      }
      size="md"
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="h-32 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
        ) : isError ? (
          <EmptyState title="Unable to load versions" description="Please try again." />
        ) : versions.length === 0 ? (
          <EmptyState title="No versions yet" description="This cycle has no revisions." />
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Version</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Created</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...versions].reverse().map((v) => (
                  <tr key={v.versionId} className={cn(v.isCurrent && 'bg-indigo-50/40')}>
                    <td className="px-3 py-2 font-semibold text-gray-900">
                      {v.label}
                      {v.isCurrent && (
                        <Badge size="sm" variant="info" className="ml-2">
                          Latest
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{v.status}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {v.createdAt ? formatDateTime(v.createdAt) : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-600 truncate max-w-[140px]">
                      {v.createdBy || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handleNewRevision} disabled={createRevision.isPending}>
          {createRevision.isPending ? 'Creating…' : 'New Revision'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Database } from 'lucide-react';
import { Button, EmptyState, ConfirmDialog } from '@/components/ui';
import { useExtensionStore } from '../stores/useExtensionStore';
import { DatasetConfigForm } from './DatasetConfigForm';

import type { DatasetConfig } from '../data/extensionTypes';

interface DatasetConfigListProps {
  slug: string;
}

export function DatasetConfigList({ slug }: DatasetConfigListProps): React.ReactNode {
  const datasets = useExtensionStore((s) => s.datasets);
  const deleteDataset = useExtensionStore((s) => s.deleteDataset);
  const saving = useExtensionStore((s) => s.saving);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DatasetConfig | null>(null);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteDataset(slug, deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error in store
    }
  }, [slug, deleteTarget, deleteDataset]);

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line design-system/prefer-section-header -- inline count + conditional action, not a section header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} configured
        </p>
        {!showForm && !editingId && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Dataset
          </Button>
        )}
      </div>

      {showForm && (
        <DatasetConfigForm
          slug={slug}
          onComplete={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {datasets.length === 0 && !showForm ? (
        <EmptyState
          icon={Database}
          description="No dataset configs yet. Add one to define which BigQuery tables this extension can access."
          action={
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              Add Dataset
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {datasets.map((ds) =>
            editingId === ds.id ? (
              <DatasetConfigForm
                key={ds.id}
                slug={slug}
                existing={ds}
                onComplete={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={ds.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{ds.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {ds.bq_project_id}.{ds.bq_dataset}
                      {ds.bq_table ? `.${ds.bq_table}` : ''}
                    </p>
                    {ds.query_template && (
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-[400px]">
                        SQL: {ds.query_template}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingId(ds.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={`Edit ${ds.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(ds)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={`Delete ${ds.name}`}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Dataset Config"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        confirmDisabled={saving}
      />
    </div>
  );
}

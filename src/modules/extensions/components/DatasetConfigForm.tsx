import { useState, useCallback } from 'react';
import { Button, Input } from '@/components/ui';
import { useExtensionStore } from '../stores/useExtensionStore';

import type { CreateDatasetInput, DatasetConfig, UpdateDatasetInput } from '../data/extensionTypes';

interface DatasetConfigFormProps {
  slug: string;
  existing?: DatasetConfig;
  onComplete: () => void;
  onCancel: () => void;
}

export function DatasetConfigForm({
  slug,
  existing,
  onComplete,
  onCancel,
}: DatasetConfigFormProps): React.ReactNode {
  const [name, setName] = useState(existing?.name ?? '');
  const [bqProjectId, setBqProjectId] = useState(existing?.bq_project_id ?? '');
  const [bqDataset, setBqDataset] = useState(existing?.bq_dataset ?? '');
  const [bqTable, setBqTable] = useState(existing?.bq_table ?? '');
  const [queryTemplate, setQueryTemplate] = useState(existing?.query_template ?? '');
  const [filtersJson, setFiltersJson] = useState(
    existing?.filters ? JSON.stringify(existing.filters, null, 2) : '',
  );
  const [error, setError] = useState<string | null>(null);

  const createDataset = useExtensionStore((s) => s.createDataset);
  const updateDataset = useExtensionStore((s) => s.updateDataset);
  const saving = useExtensionStore((s) => s.saving);

  const isValid = name.trim().length > 0 && bqProjectId.trim().length > 0 && bqDataset.trim().length > 0
    && (bqTable.trim().length > 0 || queryTemplate.trim().length > 0);

  const handleSubmit = useCallback(async () => {
    setError(null);
    let filters: Record<string, unknown> | undefined;

    if (filtersJson.trim()) {
      try {
        filters = JSON.parse(filtersJson) as Record<string, unknown>;
      } catch {
        setError('Invalid JSON in filters field');
        return;
      }
    }

    try {
      if (existing) {
        const input: UpdateDatasetInput = {};
        if (name !== existing.name) input.name = name;
        if (bqTable !== (existing.bq_table ?? '')) input.bq_table = bqTable || undefined;
        if (queryTemplate !== (existing.query_template ?? ''))
          input.query_template = queryTemplate || undefined;
        if (filtersJson.trim() !== JSON.stringify(existing.filters, null, 2))
          input.filters = filters;
        await updateDataset(slug, existing.id, input);
      } else {
        const input: CreateDatasetInput = {
          name,
          bq_project_id: bqProjectId,
          bq_dataset: bqDataset,
        };
        if (bqTable.trim()) input.bq_table = bqTable;
        if (queryTemplate.trim()) input.query_template = queryTemplate;
        if (filters) input.filters = filters;
        await createDataset(slug, input);
      }
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save dataset config');
    }
  }, [slug, existing, name, bqProjectId, bqDataset, bqTable, queryTemplate, filtersJson, createDataset, updateDataset, onComplete]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="ds-name" className="text-xs font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <Input id="ds-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="US Sales Data" />
        </div>
        <div className="space-y-1">
          <label htmlFor="ds-project" className="text-xs font-medium text-gray-700">
            BQ Project ID <span className="text-red-500">*</span>
          </label>
          <Input
            id="ds-project"
            value={bqProjectId}
            onChange={(e) => setBqProjectId(e.target.value)}
            placeholder="my-gcp-project"
            disabled={!!existing}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ds-dataset" className="text-xs font-medium text-gray-700">
            BQ Dataset <span className="text-red-500">*</span>
          </label>
          <Input
            id="ds-dataset"
            value={bqDataset}
            onChange={(e) => setBqDataset(e.target.value)}
            placeholder="retail_data"
            disabled={!!existing}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ds-table" className="text-xs font-medium text-gray-700">Table</label>
          <Input id="ds-table" value={bqTable} onChange={(e) => setBqTable(e.target.value)} placeholder="sales_daily" />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="ds-query" className="text-xs font-medium text-gray-700">Query Template</label>
        {/* eslint-disable-next-line no-restricted-syntax -- textarea is not in ui barrel */}
        <textarea
          id="ds-query"
          className="w-full min-h-[60px] p-2 text-sm font-mono border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={queryTemplate}
          onChange={(e) => setQueryTemplate(e.target.value)}
          placeholder="SELECT * FROM {{table}} WHERE date >= '{{date_from}}'"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="ds-filters" className="text-xs font-medium text-gray-700">Filters (JSON)</label>
        {/* eslint-disable-next-line no-restricted-syntax -- textarea is not in ui barrel */}
        <textarea
          id="ds-filters"
          className="w-full min-h-[40px] p-2 text-sm font-mono border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filtersJson}
          onChange={(e) => setFiltersJson(e.target.value)}
          placeholder='{ "region": "US" }'
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!isValid || saving}>
          {saving ? 'Saving...' : existing ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}

import { Badge, Input, SectionHeader } from '@/components/ui';
import type {
  ANRFilterRule,
  ANRConstants,
  ANRDataPoint,
  ANRDataSource,
  ANRCustomDataSource,
} from '../data/anrConfigTypes';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

// ─── Filter Rules Editor ────────────────────────────────────────────

interface FilterRulesEditorProps {
  rules: ANRFilterRule[];
  onChange: (rules: ANRFilterRule[]) => void;
}

export function FilterRulesEditor({ rules, onChange }: FilterRulesEditorProps) {
  const toggleRuleActive = (index: number) => {
    const newRules = [...rules];
    const currentRule = newRules[index];
    if (currentRule) {
      newRules[index] = { ...currentRule, is_active: !currentRule.is_active };
      onChange(newRules);
    }
  };

  const updateRuleValue = (index: number, value: string | number) => {
    const newRules = [...rules];
    const currentRule = newRules[index];
    if (currentRule) {
      newRules[index] = { ...currentRule, value };
      onChange(newRules);
    }
  };

  const activeCount = rules.filter((r) => r.is_active).length;

  return (
    <div className="space-y-2">
      <SectionHeader
        title={`${activeCount} of ${rules.length} rules active`}
        className="mb-2"
      />

      <div className="grid gap-2">
        {rules.map((rule, index) => (
          <div
            key={rule.name}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border',
              rule.is_active
                ? 'bg-white border-gray-200'
                : 'bg-gray-50 border-gray-100 opacity-60'
            )}
          >
            <button
              type="button"
              onClick={() => toggleRuleActive(index)}
              className="flex-shrink-0"
              aria-label={`Toggle ${rule.name}`}
            >
              <Badge variant={rule.is_active ? 'success' : 'default'} className="text-xs cursor-pointer">
                {rule.is_active ? 'ON' : 'OFF'}
              </Badge>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-xs font-medium text-gray-900">{rule.field}</code>
                <span className="text-xs text-gray-500">{rule.operator}</span>
                {rule.value !== undefined && (
                  <>
                    {typeof rule.value === 'string' && rule.value.startsWith('col(') ? (
                      <code className="text-xs text-primary">{rule.value}</code>
                    ) : (
                      <Input
                        type={typeof rule.value === 'number' ? 'number' : 'text'}
                        value={rule.value}
                        onChange={(e) =>
                          updateRuleValue(
                            index,
                            typeof rule.value === 'number' ? Number(e.target.value) : e.target.value
                          )
                        }
                        disabled={!rule.is_active}
                        className="w-24 h-7 text-xs"
                      />
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500">{rule.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Constants Editor ───────────────────────────────────────────────

interface ConstantsEditorProps {
  constants: ANRConstants;
  onChange: (constants: ANRConstants) => void;
}

export function ConstantsEditor({ constants, onChange }: ConstantsEditorProps) {
  const updateConstant = <K extends keyof ANRConstants>(key: K, value: ANRConstants[K]) => {
    onChange({ ...constants, [key]: value });
  };

  const updateArrayConstant = (key: keyof ANRConstants, value: string) => {
    const array = value.split(',').map((s) => s.trim()).filter(Boolean);
    onChange({ ...constants, [key]: array });
  };

  return (
    <div className="space-y-3">
      {/* Numeric constants */}
      <div className="grid grid-cols-2 gap-3">
        {constants.trailing_days !== undefined && (
          <div>
            <label htmlFor="trailing_days" className="text-xs font-medium text-gray-700 block mb-1">
              Trailing Days
            </label>
            <Input
              id="trailing_days"
              type="number"
              value={constants.trailing_days}
              onChange={(e) => updateConstant('trailing_days', Number(e.target.value))}
              className="text-sm"
            />
          </div>
        )}

        {constants.default_cover_days !== undefined && (
          <div>
            <label htmlFor="default_cover_days" className="text-xs font-medium text-gray-700 block mb-1">
              Default Cover Days
            </label>
            <Input
              id="default_cover_days"
              type="number"
              value={constants.default_cover_days}
              onChange={(e) => updateConstant('default_cover_days', Number(e.target.value))}
              className="text-sm"
            />
          </div>
        )}

        {constants.default_fill_rate !== undefined && (
          <div>
            <label htmlFor="default_fill_rate" className="text-xs font-medium text-gray-700 block mb-1">
              Default Fill Rate
            </label>
            <Input
              id="default_fill_rate"
              type="number"
              step="0.1"
              value={constants.default_fill_rate}
              onChange={(e) => updateConstant('default_fill_rate', Number(e.target.value))}
              className="text-sm"
            />
          </div>
        )}

        {constants.min_sales_threshold !== undefined && (
          <div>
            <label htmlFor="min_sales_threshold" className="text-xs font-medium text-gray-700 block mb-1">
              Min Sales Threshold
            </label>
            <Input
              id="min_sales_threshold"
              type="number"
              step="0.01"
              value={constants.min_sales_threshold}
              onChange={(e) => updateConstant('min_sales_threshold', Number(e.target.value))}
              className="text-sm"
            />
          </div>
        )}

        {constants.days_per_week !== undefined && (
          <div>
            <label htmlFor="days_per_week" className="text-xs font-medium text-gray-700 block mb-1">
              Days per Week
            </label>
            <Input
              id="days_per_week"
              type="number"
              value={constants.days_per_week}
              onChange={(e) => updateConstant('days_per_week', Number(e.target.value))}
              className="text-sm"
            />
          </div>
        )}
      </div>

      {/* Array constants - segments, brands, sub-formats */}
      {constants.segments_in_scope && (
        <div>
          <label htmlFor="segments_in_scope" className="text-xs font-medium text-gray-700 block mb-1">
            Segments in Scope
            <span className="text-gray-500 font-normal ml-1">(comma-separated)</span>
          </label>
          <Input
            id="segments_in_scope"
            type="text"
            value={constants.segments_in_scope.join(', ')}
            onChange={(e) => updateArrayConstant('segments_in_scope', e.target.value)}
            placeholder="42, 55, 56, 80"
            className="text-sm font-mono"
          />
        </div>
      )}

      {constants.brands_in_scope && (
        <div>
          <label htmlFor="brands_in_scope" className="text-xs font-medium text-gray-700 block mb-1">
            Brands in Scope
            <span className="text-gray-500 font-normal ml-1">(comma-separated)</span>
          </label>
          <Input
            id="brands_in_scope"
            type="text"
            value={constants.brands_in_scope.join(', ')}
            onChange={(e) => updateArrayConstant('brands_in_scope', e.target.value)}
            placeholder="F085, F086, F639"
            className="text-sm font-mono"
          />
        </div>
      )}

      {constants.sub_formats_in_scope && (
        <div>
          <label htmlFor="sub_formats_in_scope" className="text-xs font-medium text-gray-700 block mb-1">
            Sub-Formats in Scope
            <span className="text-gray-500 font-normal ml-1">(comma-separated)</span>
          </label>
          <Input
            id="sub_formats_in_scope"
            type="text"
            value={constants.sub_formats_in_scope.join(', ')}
            onChange={(e) => updateArrayConstant('sub_formats_in_scope', e.target.value)}
            placeholder="14, 42, 43, 49"
            className="text-sm font-mono"
          />
        </div>
      )}

      {/* Read-only fields */}
      {constants.run_date && (
        <div className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg">
          <Info className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <span className="font-medium">Run Date:</span> {constants.run_date}
            {constants.batch_size && (
              <span className="ml-3">
                <span className="font-medium">Batch Size:</span> {constants.batch_size}
              </span>
            )}
          </div>
        </div>
      )}

      {constants.comments_for_ui && (
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg">
          <Info className="w-3.5 h-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700">{constants.comments_for_ui}</p>
        </div>
      )}
    </div>
  );
}

// ─── Data Points Viewer ─────────────────────────────────────────────

interface DataPointsViewerProps {
  dataPoints: ANRDataPoint[];
  onChange: (dataPoints: ANRDataPoint[]) => void;
}

export function DataPointsViewer({ dataPoints, onChange }: DataPointsViewerProps) {
  const toggleDataPointActive = (index: number) => {
    const newDataPoints = [...dataPoints];
    const currentDataPoint = newDataPoints[index];
    if (currentDataPoint) {
      newDataPoints[index] = { ...currentDataPoint, is_active: !currentDataPoint.is_active };
      onChange(newDataPoints);
    }
  };

  const activeCount = dataPoints.filter((dp) => dp.is_active).length;

  const dataPointsByType = dataPoints.reduce(
    (acc, dp) => {
      if (!acc[dp.type]) acc[dp.type] = [];
      acc[dp.type]!.push(dp);
      return acc;
    },
    {} as Record<string, ANRDataPoint[]>
  );

  return (
    <div className="space-y-3">
      <SectionHeader
        title={`${activeCount} of ${dataPoints.length} data points active`}
        className="mb-2"
      />

      {Object.entries(dataPointsByType).map(([type, points]) => (
        <div key={type}>
          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
            {type} ({points.length})
          </h4>
          <div className="grid gap-2">
            {points.map((dp) => {
              const index = dataPoints.indexOf(dp);
              return (
                <div
                  key={dp.name}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    dp.is_active
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-100 opacity-60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleDataPointActive(index)}
                    className="flex-shrink-0 mt-0.5"
                    aria-label={`Toggle ${dp.name}`}
                  >
                    <Badge variant={dp.is_active ? 'success' : 'default'} className="text-xs cursor-pointer">
                      {dp.is_active ? 'ON' : 'OFF'}
                    </Badge>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs font-semibold text-gray-900">{dp.name}</code>
                      <Badge variant="default" className="text-[10px]">
                        {dp.type}
                      </Badge>
                    </div>
                    <code className="text-xs text-gray-600 block mb-1 font-mono break-all">
                      {dp.formula.length > 80 ? `${dp.formula.substring(0, 80)}...` : dp.formula}
                    </code>
                    <p className="text-xs text-gray-500">{dp.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Data Sources Viewer ────────────────────────────────────────────

interface DataSourcesViewerProps {
  dataSources: ANRDataSource[];
  customDataSources?: ANRCustomDataSource[];
  onChange: (dataSources: ANRDataSource[], customDataSources?: ANRCustomDataSource[]) => void;
}

export function DataSourcesViewer({ dataSources, customDataSources, onChange }: DataSourcesViewerProps) {
  const toggleDataSourceActive = (index: number) => {
    const newDataSources = [...dataSources];
    const currentDataSource = newDataSources[index];
    if (currentDataSource) {
      newDataSources[index] = { ...currentDataSource, is_active: !currentDataSource.is_active };
      onChange(newDataSources, customDataSources);
    }
  };

  const toggleCustomDataSourceActive = (index: number) => {
    if (!customDataSources) return;
    const newCustomDataSources = [...customDataSources];
    const currentCustomDataSource = newCustomDataSources[index];
    if (currentCustomDataSource) {
      newCustomDataSources[index] = {
        ...currentCustomDataSource,
        is_active: !currentCustomDataSource.is_active,
      };
      onChange(dataSources, newCustomDataSources);
    }
  };

  const activeCount = dataSources.filter((ds) => ds.is_active).length;
  const customActiveCount = customDataSources?.filter((ds) => ds.is_active).length ?? 0;

  return (
    <div className="space-y-3">
      <SectionHeader
        title={`${activeCount + customActiveCount} of ${dataSources.length + (customDataSources?.length ?? 0)} data sources active`}
        className="mb-2"
      />

      {/* Standard Data Sources */}
      <div>
        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
          Standard Sources ({dataSources.length})
        </h4>
        <div className="grid gap-2">
          {dataSources.map((ds, index) => (
            <div
              key={ds.name}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                ds.is_active
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-50 border-gray-100 opacity-60'
              )}
            >
              <button
                type="button"
                onClick={() => toggleDataSourceActive(index)}
                className="flex-shrink-0"
                aria-label={`Toggle ${ds.name}`}
              >
                <Badge variant={ds.is_active ? 'success' : 'default'} className="text-xs cursor-pointer">
                  {ds.is_active ? 'ON' : 'OFF'}
                </Badge>
              </button>

              {/* eslint-disable-next-line design-system/prefer-metric-grid -- This is a data table row, not a metric grid */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="font-medium text-gray-900">{ds.name}</span>
                </div>
                <div className="text-gray-600">
                  <Badge variant={ds.backend === 'bq' ? 'info' : 'warning'} className="text-[10px]">
                    {ds.backend.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-gray-600">
                  <Badge variant="default" className="text-[10px]">
                    {ds.level}
                  </Badge>
                </div>
                <div className="text-gray-500 text-right">
                  {ds.interval}d interval
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Data Sources */}
      {customDataSources && customDataSources.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
            Custom Sources ({customDataSources.length})
          </h4>
          <div className="grid gap-2">
            {customDataSources.map((ds, index) => (
              <div
                key={ds.name}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border',
                  ds.is_active
                    ? 'bg-white border-gray-200'
                    : 'bg-gray-50 border-gray-100 opacity-60'
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleCustomDataSourceActive(index)}
                  className="flex-shrink-0"
                  aria-label={`Toggle ${ds.name}`}
                >
                  <Badge variant={ds.is_active ? 'success' : 'default'} className="text-xs cursor-pointer">
                    {ds.is_active ? 'ON' : 'OFF'}
                  </Badge>
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900">{ds.name}</span>
                    <Badge variant="info" className="text-[10px]">
                      {ds.backend.toUpperCase()}
                    </Badge>
                    <Badge variant="default" className="text-[10px]">
                      {ds.level}
                    </Badge>
                  </div>
                  <code className="text-xs text-gray-600 block font-mono">
                    Template: {ds.query_template}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

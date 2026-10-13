import { useId, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/ui';
import { aopAdminApi, aopError } from '../../api/aopAdminApi';
import { FISCAL_MONTHS } from '../../api/aopAdminCalendar';
import { gridColumns, GRID_PARAMETERS } from '../../api/aopGridDraft';
import { useAopAdminContext } from '../../api/useAopAdminConfig';
import type { ParameterResolver } from '../../api/aopAdminDraft';
import { AopErrorState, type EditProps } from './AopFields';
import { AopMonthlySiteTable } from './AopMonthlySiteTable';
import { AnimatedConfigContent } from '../shared/config/AnimatedConfigContent';
import type { ParameterKey, Season } from '../../types/aopAdmin';

interface Props extends EditProps {
  channel: string;
  configurable: boolean;
  configId: string | null;
  seasons: Season[];
  resolve: ParameterResolver;
}

export function AopSiteChannel({ channel, configurable, configId, seasons, resolve, ...edit }: Props): ReactNode {
  const [isOpen, setOpen] = useState(false);
  const [parameters, setParameters] = useState<ParameterKey[]>(['nsm_ratio']);
  const [search, setSearch] = useState('');
  const id = useId();
  const context = useAopAdminContext();
  const label = channel;
  const filters = { channel, search: '', overrides_only: false, all_sites: true, summary_only: false, include_resolved: false, limit: 25, offset: 0 };
  const query = useQuery({
    queryKey: [...context.key, 'parameters', configId, filters],
    queryFn: () => aopAdminApi.parameters(configId, filters),
    enabled: configurable && isOpen,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  return <section className={`min-w-0 rounded-lg border border-gray-200 ${configurable ? 'bg-white' : 'bg-gray-50'}`}>
    <button id={`${id}-trigger`} type="button" disabled={!configurable}
      aria-expanded={configurable ? isOpen : undefined} aria-controls={configurable ? `${id}-content` : undefined}
      aria-label={`${label} monthly site parameters`} onClick={() => setOpen((open) => !open)}
      className="flex min-h-11 w-full items-center gap-2 rounded-lg px-4 py-3 text-left transition-colors duration-150 enabled:hover:bg-gray-50 enabled:active:bg-gray-100 disabled:cursor-default motion-reduce:transition-none">
      <ChevronRight className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
      <span className={`text-sm font-semibold ${configurable ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
      {!configurable ? <span className="ml-auto shrink-0 text-xs text-gray-500">Not applicable</span>
        : query.data && <span className="ml-auto text-xs text-gray-500">{query.data.total} {query.data.total === 1 ? 'site' : 'sites'}</span>}
    </button>
    {configurable && <AnimatedConfigContent open={isOpen} id={`${id}-content`} labelledBy={`${id}-trigger`} className="min-w-0 px-4 pb-3">
      {query.isPending && <SiteSkeleton label={label} parameters={parameters} />}
      {query.isError && <AopErrorState message={aopError(query.error)} onRetry={() => void query.refetch()} />}
      {query.data && (query.data.items.length
        ? <AopMonthlySiteTable grid={query.data} channel={label} seasons={seasons} resolve={resolve}
          parameters={parameters} onParameters={setParameters} search={search} onSearch={setSearch} {...edit} />
        : <EmptyState title="No sites available" description="Sites will appear here when they are added to this channel." />)}
    </AnimatedConfigContent>}
  </section>;
}

const SKELETON_SITE_ROWS = 12;

function SiteSkeleton({ label, parameters }: { label: string; parameters: ParameterKey[] }): ReactNode {
  const selectedParameters = GRID_PARAMETERS.filter((metric) => parameters.includes(metric.key));
  const singleParameter = selectedParameters.length === 1;
  const columns = gridColumns(FISCAL_MONTHS, parameters);
  return <div role="status" aria-label={`Loading ${label} sites`} className="@container min-w-0 border-t border-gray-100 motion-reduce:[&_[data-slot=skeleton]]:animate-none">
    <span className="sr-only">Loading site names and monthly parameters</span>
    <div aria-hidden="true">
      <div className="space-y-3 py-4">
        <div className="grid grid-cols-1 items-center gap-1 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:gap-3">
          <FilterSkeleton labels={GRID_PARAMETERS.map((metric) => `${metric.heading}%`)} />
          <div className="flex flex-wrap items-center justify-end gap-2 justify-self-end">
            <div className="flex h-11 items-center gap-1 px-2 @2xl:h-8"><Skeleton className="h-3.5 w-3.5" /><Skeleton className="h-3 w-28" /></div>
            <div className="flex h-11 items-center px-2 @2xl:h-8"><Skeleton className="h-3 w-16" /></div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 py-3">
        <Skeleton className="ml-auto h-11 w-full @lg:w-80 @2xl:h-8" />
      </div>
      <div className="h-[40rem] max-h-[75vh] overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full table-fixed text-sm">
          <colgroup><col className="w-48 @2xl:w-56" />{columns.map(({ month, parameter }) => <col key={`${month}:${parameter}`} className="w-36 @2xl:w-32" />)}</colgroup>
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th rowSpan={singleParameter ? 1 : 2} className="px-3 py-2"><Skeleton className="h-3 w-12" /></th>
              {FISCAL_MONTHS.map((month) => <th key={month} colSpan={selectedParameters.length} className="border-l border-gray-200 px-2 py-1.5">
                <div className={`flex items-center justify-center gap-1 ${singleParameter ? 'h-11 @2xl:h-6' : 'h-4'}`}><Skeleton className="h-3 w-20" />{singleParameter && <Skeleton className="h-4 w-4 shrink-0" />}</div>
              </th>)}
            </tr>
            {!singleParameter && <tr className="border-b border-gray-200">{columns.map(({ month, parameter }) => <th key={`${month}:${parameter}`} className="border-l border-gray-200 px-2 py-1.5">
              <div className="flex h-11 items-center justify-end gap-2 @2xl:h-6"><Skeleton className="h-3 w-12" /><Skeleton className="h-4 w-4" /></div>
            </th>)}</tr>}
          </thead>
          <tbody>{Array.from({ length: SKELETON_SITE_ROWS }, (_, row) => <tr key={row} className="border-b border-gray-100">
            <td className="px-3 py-2 align-top">
              <div className="flex min-h-11 items-start justify-between gap-2 @2xl:min-h-0"><div className="min-w-0">
                <div className="flex h-5 items-center"><Skeleton className={row % 2 ? 'h-4 w-24 @2xl:w-28' : 'h-4 w-20 @2xl:w-24'} /></div>
                <div className="mt-0.5 flex h-4 items-center"><Skeleton className="h-3 w-16" /></div>
              </div><Skeleton className="mt-1 h-4 w-4 shrink-0" /></div>
            </td>
            {columns.map(({ month, parameter }) => <td key={`${month}:${parameter}`} className="border-l border-gray-100 px-2 py-2 align-top">
              <div className="flex items-start justify-end gap-1"><Skeleton className="h-11 w-20 shrink-0 @2xl:h-8" /><div className="w-4 pt-3 @2xl:pt-1.5"><Skeleton className="h-3 w-3" /></div></div>
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
    </div>
  </div>;
}

function FilterSkeleton({ labels }: { labels: string[] }): ReactNode {
  return <div className="flex flex-col gap-2 @lg:flex-row @lg:items-start @lg:gap-3">
    <div className="flex h-4 w-20 shrink-0 items-center @lg:mt-4 @2xl:mt-3"><Skeleton className="h-3 w-16" /></div>
    <div className="flex min-w-0 flex-wrap gap-1 rounded-lg bg-gray-50 p-1">{labels.map((label) =>
      <Skeleton key={label} className="flex h-11 min-w-11 items-center px-2.5 text-xs font-medium @2xl:h-8 @2xl:min-w-9"><span className="invisible">{label}</span></Skeleton>)}</div>
  </div>;
}

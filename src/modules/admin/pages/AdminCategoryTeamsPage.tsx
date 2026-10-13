import { useState } from 'react';
import { AlertTriangle, Calendar, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge, MetricGrid, Progress, EmptyState } from '@/components/ui';
import { DetailPanel, DetailPanelSection, DetailPanelRow } from '@/components/ui';
import { mockCategoryTeams, categoryTeamSummary, type CategoryTeam } from '../data/mockCategoryTeams';
import { strikeTriggerRules, restructuringActions } from '../data/mockStrikeEnforcement';
import {cn, getCurrencySymbol} from '@/lib/utils';
import { TimePeriodFilter } from '@/components/TimePeriodFilter';

function TeamCard({
  team,
  isSelected,
  onSelect,
}: {
  team: CategoryTeam;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-md',
        isSelected && 'border-primary ring-1 ring-primary/20',
        team.strikeCount >= 3 && 'border-error/30'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-900">{team.name}</span>
        <div className="flex items-center gap-1.5">
          {team.strikeCount > 0 && (
            <Badge variant={team.strikeCount >= 3 ? 'error' : team.strikeCount >= 2 ? 'warning' : 'default'} className="text-[10px]">
              {team.strikeCount} strike{team.strikeCount > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge
            variant={team.profitLoss === 'profit' ? 'success' : team.profitLoss === 'loss' ? 'error' : 'default'}
            className="text-[10px]"
          >
            {team.profitLoss}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-2">Head: {team.teamHead}</p>
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- inline stats, not metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-gray-400">Revenue</p>
          <p className="text-xs font-bold text-gray-900">{getCurrencySymbol()}{team.actualRevenue_cr} Cr</p>
          <p className="text-[10px] text-gray-400">/{team.targetRevenue_cr} Cr</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400">ST (15d)</p>
          <p className={cn('text-xs font-bold', team.sellThrough15d_pct >= 80 ? 'text-success' : team.sellThrough15d_pct >= 60 ? 'text-warning' : 'text-error')}>
            {team.sellThrough15d_pct}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400">Growth</p>
          <p className={cn('text-xs font-bold', team.growth_pct > 0 ? 'text-success' : 'text-error')}>
            {team.growth_pct > 0 ? '+' : ''}{team.growth_pct}%
          </p>
        </div>
      </div>
    </button>
  );
}

function TeamDetail({ team, onClose }: { team: CategoryTeam; onClose: () => void }) {
  const revenuePct = Math.round((team.actualRevenue_cr / team.targetRevenue_cr) * 100);

  return (
    <DetailPanel isOpen={true} title={team.name} onClose={onClose}>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={team.profitLoss === 'profit' ? 'success' : team.profitLoss === 'loss' ? 'error' : 'default'}
          >
            {team.profitLoss}
          </Badge>
          {team.strikeCount > 0 && (
            <Badge variant={team.strikeCount >= 3 ? 'error' : 'warning'}>
              {team.strikeCount} strike{team.strikeCount > 1 ? 's' : ''}
            </Badge>
          )}
          {team.strikeCount >= 3 && (
            <Badge variant="error">Restructuring Triggered</Badge>
          )}
        </div>

        <DetailPanelSection title="Team">
          <DetailPanelRow label="Team Head" value={team.teamHead} />
          <DetailPanelRow label="Functions" value={team.functions.join(', ')} />
          <DetailPanelRow label="Staffing" value={`${team.staffingPct}%`} />
          <DetailPanelRow label="Space" value={`${team.spaceAllocation_sqft.toLocaleString()} sqft`} />
        </DetailPanelSection>

        <DetailPanelSection title="Performance">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-400">Revenue</p>
              <p className="text-sm font-bold text-gray-900">{getCurrencySymbol()}{team.actualRevenue_cr} Cr</p>
              <Progress value={revenuePct} className="h-1.5 mt-1" />
              <p className="text-[10px] text-gray-400 mt-0.5">{revenuePct}% of {getCurrencySymbol()}{team.targetRevenue_cr} Cr</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-400">Sell-Through (15d)</p>
              <p className={cn('text-sm font-bold', team.sellThrough15d_pct >= 80 ? 'text-success' : 'text-warning')}>
                {team.sellThrough15d_pct}%
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Target: ≥80%</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-400">Growth</p>
              <p className={cn('text-sm font-bold', team.growth_pct > 0 ? 'text-success' : 'text-error')}>
                {team.growth_pct > 0 ? '+' : ''}{team.growth_pct}%
              </p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-400">P&L</p>
              <p className={cn('text-sm font-bold',
                team.profitLoss === 'profit' ? 'text-success' : team.profitLoss === 'loss' ? 'text-error' : 'text-gray-500'
              )}>
                {team.profitLoss.charAt(0).toUpperCase() + team.profitLoss.slice(1)}
              </p>
            </div>
          </div>
        </DetailPanelSection>

        {team.strikes.length > 0 && (
          <DetailPanelSection title="Strikes">
            <div className="space-y-2">
              {team.strikes.map((strike, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-error-50/50 border border-error/10">
                  <AlertTriangle className="w-3 h-3 text-error shrink-0" />
                  <span className="text-xs text-error-600">{strike}</span>
                </div>
              ))}
            </div>
          </DetailPanelSection>
        )}

        {/* Strike History Timeline */}
        {team.strikeHistory.length > 0 && (
          <DetailPanelSection title="Strike History">
            {team.restructuringTriggered && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-error-50 border border-error/20 mb-3">
                <ShieldAlert className="w-4 h-4 text-error shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-error-700">Restructuring Triggered</p>
                  <p className="text-[10px] text-error-600">3 strikes reached — restructuring actions initiated</p>
                </div>
              </div>
            )}
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-3">
                {team.strikeHistory.map((strike, i) => (
                  <div key={i} className="relative flex items-start gap-3 pl-0.5">
                    <div className={cn(
                      'relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                      strike.resolved ? 'bg-success-50 border-success' :
                      strike.severity === 'S1' ? 'bg-error-50 border-error' :
                      'bg-warning-50 border-warning'
                    )}>
                      {strike.resolved ? (
                        <CheckCircle2 className="w-3 h-3 text-success" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-error" />
                      )}
                    </div>
                    <div className="flex-1 rounded-lg border border-gray-100 p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {strike.date}
                        </div>
                        <Badge variant={strike.severity === 'S1' ? 'error' : 'warning'} size="sm">
                          {strike.severity}
                        </Badge>
                        <Badge variant="outline" size="sm" className="text-[10px]">
                          {strike.kpiId}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-700">{strike.rootCause}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DetailPanelSection>
        )}

        {/* Restructuring Actions (if applicable) */}
        {team.restructuringTriggered && (() => {
          const rstAction = restructuringActions.find(r => r.categoryTeamId === team.id);
          if (!rstAction) return null;
          const doneCount = rstAction.actions.filter(a => a.status === 'done').length;
          return (
            <DetailPanelSection title="Restructuring Plan">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Badge variant={rstAction.status === 'completed' ? 'success' : rstAction.status === 'in-progress' ? 'primary' : 'warning'} size="sm">
                  {rstAction.status}
                </Badge>
                <span className="text-[10px] text-gray-400">{doneCount}/{rstAction.actions.length} completed</span>
              </div>
              <div className="space-y-2">
                {rstAction.actions.map((action, i) => (
                  <div key={i} className={cn(
                    'p-2 rounded-lg border text-xs',
                    action.status === 'done' ? 'bg-success-50/30 border-success/20' : 'bg-gray-50 border-gray-200'
                  )}>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-medium text-gray-900">{action.type}</span>
                      <Badge variant={action.status === 'done' ? 'success' : 'default'} size="sm">
                        {action.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-0.5">{action.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>Assigned: {action.assignedTo}</span>
                      <span>Due: {action.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DetailPanelSection>
          );
        })()}

        {/* Applicable Strike Trigger Rules */}
        {team.strikeHistory.length > 0 && (
          <DetailPanelSection title="Enforcement Rules">
            <div className="space-y-2">
              {strikeTriggerRules
                .filter(rule => team.strikeHistory.some(s => s.kpiId === rule.kpiId))
                .map(rule => (
                  <div key={rule.id} className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-gray-900">{rule.name}</span>
                      <Badge variant={rule.severity === 'S1' ? 'error' : 'warning'} size="sm">{rule.severity}</Badge>
                    </div>
                    <p className="text-[10px] text-gray-500">{rule.condition}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Auto-strike: {rule.autoStrikeAfter}</p>
                  </div>
                ))
              }
            </div>
          </DetailPanelSection>
        )}
      </div>
    </DetailPanel>
  );
}

export function AdminCategoryTeamsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? mockCategoryTeams.find((t) => t.id === selectedId) : null;

  return (
    <div className="relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">User Management is under development</p>
        </div>
      </div>
    <div className="pointer-events-none select-none opacity-40 grayscale">
      {/* Summary */}
      <div className="flex items-center justify-end mb-2">
        <TimePeriodFilter />
      </div>
      <MetricGrid columns={4}>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Teams</p>
          <p className="text-xl font-bold text-gray-900">{categoryTeamSummary.totalTeams}</p>
        </div>
        <div className={cn('bg-white rounded-lg border p-3', categoryTeamSummary.atRisk > 0 ? 'border-warning/30' : 'border-success/30')}>
          <p className="text-xs text-gray-500">At Risk (2+ strikes)</p>
          <p className={cn('text-xl font-bold', categoryTeamSummary.atRisk > 0 ? 'text-warning' : 'text-success')}>
            {categoryTeamSummary.atRisk}
          </p>
        </div>
        <div className={cn('bg-white rounded-lg border p-3', categoryTeamSummary.restructuring > 0 ? 'border-error/30' : 'border-success/30')}>
          <p className="text-xs text-gray-500">Restructuring (3 strikes)</p>
          <p className={cn('text-xl font-bold', categoryTeamSummary.restructuring > 0 ? 'text-error' : 'text-success')}>
            {categoryTeamSummary.restructuring}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Revenue vs Target</p>
          <p className="text-xl font-bold text-gray-900">
            {getCurrencySymbol()}{categoryTeamSummary.totalActualRevenue}/{categoryTeamSummary.totalTargetRevenue} Cr
          </p>
        </div>
      </MetricGrid>

      {/* Team Grid + Detail */}
      <div className="flex gap-4">
        <div className={cn('transition-all', selected ? 'w-[60%]' : 'w-full')}>
          <div className={cn('grid gap-3', selected ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
            {mockCategoryTeams.length === 0 ? (
              <EmptyState description="No category teams to display" />
            ) : mockCategoryTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isSelected={selectedId === team.id}
                onSelect={() => setSelectedId(selectedId === team.id ? null : team.id)}
              />
            ))}
          </div>
        </div>
        {selected && (
          <div className="w-[40%]">
            <TeamDetail team={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

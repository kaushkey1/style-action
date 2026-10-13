import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Badge,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { cn, formatNumber } from '@/lib/utils';
import { Plus, Copy, Trash2, ArrowRightLeft } from 'lucide-react';
import { useSpacePlanStore } from '../stores/useSpacePlanStore';

interface ScenarioComparePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScenarioComparePanel({ open, onOpenChange }: ScenarioComparePanelProps): React.ReactNode {
  const scenarios = useSpacePlanStore((s) => s.scenarios);
  const createScenario = useSpacePlanStore((s) => s.createScenario);
  const duplicateScenario = useSpacePlanStore((s) => s.duplicateScenario);
  const deleteScenario = useSpacePlanStore((s) => s.deleteScenario);
  const makeScenarioActive = useSpacePlanStore((s) => s.makeScenarioActive);
  const saveVersion = useSpacePlanStore((s) => s.saveVersion);

  const [compareA, setCompareA] = useState<string>(scenarios[0]?.id ?? '');
  const [compareB, setCompareB] = useState<string>(scenarios[1]?.id ?? '');
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);

  const scenA = scenarios.find((s) => s.id === compareA);
  const scenB = compareB ? scenarios.find((s) => s.id === compareB) : undefined;

  const handleCreate = (): void => {
    if (!newName.trim()) return;
    createScenario(newName.trim());
    setNewName('');
    setShowNew(false);
  };

  const rows: Array<{ label: string; aVal: string; bVal: string; delta: string; highlight: boolean }> = [];

  if (scenA && scenB) {
    rows.push({
      label: 'PL Pool',
      aVal: formatNumber(scenA.plPool),
      bVal: formatNumber(scenB.plPool),
      delta: scenA.plPool === scenB.plPool ? '—' : formatNumber(scenB.plPool - scenA.plPool),
      highlight: false,
    });

    for (const catA of scenA.categories) {
      const catB = scenB.categories.find((c) => c.code === catA.code);
      if (!catB) continue;
      const d = catB.newSpace - catA.newSpace;
      rows.push({
        label: `${catA.code}   space`,
        aVal: `${formatNumber(catA.newSpace)}${catA.boundBadge !== 'free' ? `   ${catA.boundBadge === '>sigmaMax' ? '⚠ >ΣMAX' : catA.boundBadge === 'manual' ? '✎' : `@${catA.boundBadge.replace('@', '')}`}` : ''}`,
        bVal: `${formatNumber(catB.newSpace)}${catB.boundBadge !== 'free' ? `   ${catB.boundBadge === '>sigmaMax' ? '⚠ >ΣMAX' : catB.boundBadge === 'manual' ? '✎' : `@${catB.boundBadge.replace('@', '')}`}` : ''}`,
        delta: d === 0 ? '—' : `${d > 0 ? '+' : ''}${formatNumber(d)}`,
        highlight: d !== 0,
      });
    }

    rows.push({
      label: 'Options (total)',
      aVal: `${formatNumber(scenA.optionsTotalMin)}–${formatNumber(scenA.optionsTotalMax)}`,
      bVal: `${formatNumber(scenB.optionsTotalMin)}–${formatNumber(scenB.optionsTotalMax)}`,
      delta: `${scenB.optionsTotalMin - scenA.optionsTotalMin > 0 ? '+' : ''}${scenB.optionsTotalMin - scenA.optionsTotalMin} / ${scenB.optionsTotalMax - scenA.optionsTotalMax > 0 ? '+' : ''}${scenB.optionsTotalMax - scenA.optionsTotalMax}`,
      highlight: false,
    });

    rows.push({
      label: 'Exceptions',
      aVal: String(scenA.exceptionCount),
      bVal: String(scenB.exceptionCount),
      delta: scenA.exceptionCount === scenB.exceptionCount ? '—' : String(scenB.exceptionCount - scenA.exceptionCount),
      highlight: scenA.exceptionCount !== scenB.exceptionCount,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scenarios</DialogTitle>
        </DialogHeader>

        {/* Scenario selector */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-sm text-gray-500">Compare:</span>
          <Select value={compareA} onValueChange={setCompareA}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-400">vs</span>
          <Select value={compareB} onValueChange={setCompareB}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => { setCompareA(compareB); setCompareB(compareA); }}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label="Swap scenarios"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison table */}
        {scenA && scenB ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium" />
                  <th className="text-right py-2 px-3 text-gray-700 font-semibold">A · {scenA.name}</th>
                  <th className="text-right py-2 px-3 text-gray-700 font-semibold">B · {scenB.name}</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Δ (B−A)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-gray-700 font-medium">{row.label}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-900">{row.aVal}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-900">{row.bVal}</td>
                    <td className={cn('py-2 px-3 text-right font-mono font-medium', row.delta.includes('+') ? 'text-green-700' : row.delta.includes('-') ? 'text-red-700' : 'text-gray-400')}>
                      {row.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-4">
            {scenarios.length < 2 ? 'Create a second scenario to compare side-by-side.' : 'Select two scenarios to compare.'}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {scenB && !scenB.isActive && (
            <Button size="sm" onClick={() => makeScenarioActive(scenB.id)}>
              Make B active
            </Button>
          )}
          {scenB && (
            <>
              <Button size="sm" variant="outline" onClick={() => duplicateScenario(scenB.id)}>
                <Copy className="w-3 h-3 mr-1" />Duplicate
              </Button>
              <Button size="sm" variant="outline" onClick={() => saveVersion(`Promoted scenario: ${scenB.name}`)}>
                Save as version
              </Button>
              {scenarios.length > 1 && (
                <Button size="sm" variant="outline" className="border-error/40 text-error hover:bg-error-50 hover:border-error/60" onClick={() => deleteScenario(scenB.id)}>
                  <Trash2 className="w-3 h-3 mr-1" />Discard B
                </Button>
              )}
            </>
          )}
        </div>

        {/* New scenario */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          {showNew ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Scenario name..."
                className="w-64"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                aria-label="New scenario name"
              />
              <Button size="sm" onClick={handleCreate}>Create</Button>
              <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowNew(true)}>
              <Plus className="w-3 h-3 mr-1" />New Scenario
            </Button>
          )}
        </div>

        {/* Scenario list */}
        {/* eslint-disable design-system/prefer-section-header -- scenario list items use flex justify-between for name+count, not section headers */}
        <div className="mt-4 space-y-2">
          {scenarios.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{s.name}</span>
                {s.isActive && <Badge variant="success" size="sm">Active</Badge>}
              </div>
              <span className="text-xs text-gray-400">{s.exceptionCount} exception{s.exceptionCount !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
        {/* eslint-enable design-system/prefer-section-header */}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Checkbox,
  RadioGroup,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  RadioGroupItem,
  Label,
} from '@/components/ui';
import { Download } from 'lucide-react';
import { useSpacePlanStore } from '../stores/useSpacePlanStore';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps): React.ReactNode {
  const currentVersion = useSpacePlanStore((s) => s.currentVersion);
  const scenarios = useSpacePlanStore((s) => s.scenarios);
  const categories = useSpacePlanStore((s) => s.categories);

  const [scope, setScope] = useState<'version' | 'scenario'>('version');
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0]?.id ?? '');
  const [includeCategorySheet, setIncludeCategorySheet] = useState(true);
  const [includeSubcategorySheet, setIncludeSubcategorySheet] = useState(true);
  const [rangeMode, setRangeMode] = useState<'midpoint' | 'range'>('range');

  const handleExport = (): void => {
    const header = 'Category,Current Space,New Space';
    const catRows = categories.map((c) => `${c.name},${c.currentSpace},${c.newSpace}`);
    const csv = [header, ...catRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `space-plan-v${currentVersion}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export to Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Scope */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Scope</p>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as 'version' | 'scenario')}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="version" id="scope-version" />
                <Label htmlFor="scope-version" className="text-sm">This version (v{currentVersion})</Label>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <RadioGroupItem value="scenario" id="scope-scenario" />
                <Label htmlFor="scope-scenario" className="text-sm">A scenario</Label>
                {scope === 'scenario' && scenarios.length > 0 && (
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger className="w-44 h-8 text-sm ml-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Sheets */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Sheets</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sheet-category"
                  checked={includeCategorySheet}
                  onCheckedChange={(v) => setIncludeCategorySheet(v === true)}
                />
                <Label htmlFor="sheet-category" className="text-sm">Category Space</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sheet-subcategory"
                  checked={includeSubcategorySheet}
                  onCheckedChange={(v) => setIncludeSubcategorySheet(v === true)}
                />
                <Label htmlFor="sheet-subcategory" className="text-sm">Subcategory Space (Space / Options / Units)</Label>
              </div>
            </div>
          </div>

          {/* Ranges */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ranges</p>
            <RadioGroup value={rangeMode} onValueChange={(v) => setRangeMode(v as 'midpoint' | 'range')}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="midpoint" id="range-midpoint" />
                <Label htmlFor="range-midpoint" className="text-sm">Mid-point</Label>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <RadioGroupItem value="range" id="range-minmax" />
                <Label htmlFor="range-minmax" className="text-sm">Min–Max ranges for options & units</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            disabled={!includeCategorySheet && !includeSubcategorySheet}
          >
            <Download className="w-4 h-4 mr-1" />Download .xlsx
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

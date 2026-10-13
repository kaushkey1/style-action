import { useState } from 'react';
import {
  Modal,
  ModalFooter,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import type { ScenarioType } from '../types/aopPlanning.types';

interface CreateScenarioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, type: ScenarioType, growthModifier: number, gmModifier: number) => void;
  existingTypes: ScenarioType[];
}

const SCENARIO_TYPES: Array<{ value: ScenarioType; label: string; description: string }> = [
  { value: 'base', label: 'Base', description: 'Standard growth assumptions' },
  { value: 'optimistic', label: 'Optimistic', description: 'Higher growth, aggressive targets' },
  { value: 'conservative', label: 'Conservative', description: 'Lower growth, cautious targets' },
];

export function CreateScenarioDialog({
  isOpen,
  onClose,
  onCreate,
  existingTypes,
}: CreateScenarioDialogProps): React.ReactNode {
  const [name, setName] = useState('');
  const [type, setType] = useState<ScenarioType>('optimistic');
  const [growthModifier, setGrowthModifier] = useState('3');
  const [gmModifier, setGmModifier] = useState('0');

  const availableTypes = SCENARIO_TYPES.filter((t) => !existingTypes.includes(t.value));

  function handleCreate(): void {
    onCreate(
      name.trim() || SCENARIO_TYPES.find((t) => t.value === type)?.label || type,
      type,
      parseFloat(growthModifier) || 0,
      parseFloat(gmModifier) || 0,
    );
    setName('');
    setGrowthModifier('3');
    setGmModifier('0');
    onClose();
  }

  function handleClose(): void {
    setName('');
    setGrowthModifier('3');
    setGmModifier('0');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Scenario">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Fork a new scenario from the base plan with modified growth and margin assumptions.
        </p>

        <div>
          <Label htmlFor="scenario-name">Scenario Name</Label>
          <Input
            id="scenario-name"
            placeholder={SCENARIO_TYPES.find((t) => t.value === type)?.label ?? 'New Scenario'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="scenario-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as ScenarioType)}>
            <SelectTrigger id="scenario-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.length > 0 ? (
                availableTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} — {t.description}
                  </SelectItem>
                ))
              ) : (
                SCENARIO_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} — {t.description}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="growth-mod">Growth Modifier (%)</Label>
            <Input
              id="growth-mod"
              type="number"
              step="0.5"
              value={growthModifier}
              onChange={(e) => setGrowthModifier(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              {parseFloat(growthModifier) >= 0 ? '+' : ''}{growthModifier}% applied to base growth
            </p>
          </div>
          <div>
            <Label htmlFor="gm-mod">GM% Modifier</Label>
            <Input
              id="gm-mod"
              type="number"
              step="0.1"
              value={gmModifier}
              onChange={(e) => setGmModifier(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              {parseFloat(gmModifier) >= 0 ? '+' : ''}{gmModifier}% applied to base GM
            </p>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
        <Button onClick={handleCreate}>Create Scenario</Button>
      </ModalFooter>
    </Modal>
  );
}

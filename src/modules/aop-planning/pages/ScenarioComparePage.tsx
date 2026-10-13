import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader, EmptyState, Button } from '@/components/ui';
import { Plus } from 'lucide-react';
import { useAOPPlanningStore } from '../stores/useAOPPlanningStore';
import { ScenarioCard } from '../components/ScenarioCard';
import { CreateScenarioDialog } from '../components/CreateScenarioDialog';
import { AopSubNav } from '../components/AopSubNav';

export function ScenarioComparePage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  const cycles = useAOPPlanningStore((s) => s.cycles);
  const scenarios = useAOPPlanningStore((s) => s.scenarios);
  const setActiveScenario = useAOPPlanningStore((s) => s.setActiveScenario);
  const createScenario = useAOPPlanningStore((s) => s.createScenario);

  const [createOpen, setCreateOpen] = useState(false);

  const cycle = cycles.find((c) => c.id === cycleId);
  if (!cycle) {
    return <EmptyState title="Cycle not found" description="The requested planning cycle does not exist." />;
  }

  const cycleScenarios = scenarios.filter((s) => s.cycleId === cycle.id);
  const existingTypes = cycleScenarios.map((s) => s.type);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scenario Compare"
        backTo={{ label: cycle.name, path: `/sales-plan/workspace/${cycle.id}` }}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Scenario
          </Button>
        }
      />

      <AopSubNav />

      {cycleScenarios.length === 0 ? (
        <EmptyState
          title="No scenarios"
          description="No scenarios have been created for this cycle."
          variant="neutral"
        />
      ) : (
        // eslint-disable-next-line design-system/prefer-metric-grid -- scenario cards are not metric cards
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {cycleScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              isActive={scenario.isActive}
              onSetActive={() => setActiveScenario(scenario.id)}
            />
          ))}
        </div>
      )}

      <CreateScenarioDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createScenario}
        existingTypes={existingTypes}
      />
    </div>
  );
}

import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Button, EmptyState } from '@/components/ui';
import { useAOPPlanningStore } from '../stores/useAOPPlanningStore';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { ReadinessChecklist } from '../components/ReadinessChecklist';
import { STATUS_TO_PHASE } from '../types/aopPlanning.types';

export function CycleSetupPage(): React.ReactNode {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const cycles = useAOPPlanningStore((s) => s.cycles);
  const cycle = cycles.find((c) => c.id === cycleId);

  if (!cycle) {
    return <EmptyState title="Cycle not found" description="The requested planning cycle does not exist." />;
  }

  const allReady = cycle.readinessChecks.every((rc) => rc.status === 'ready');
  const phase = STATUS_TO_PHASE[cycle.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${cycle.name} — Setup`}
        backTo={{ label: cycle.name, path: `/sales-plan/workspace/${cycle.id}` }}
        actions={
          <Button
            onClick={() => navigate(`/sales-plan/workspace/${cycle.id}`)}
            disabled={!allReady}
          >
            Proceed to Planning
          </Button>
        }
      />

      <WorkflowStepper currentPhase={phase} status={cycle.status} />

      <ReadinessChecklist checks={cycle.readinessChecks} />
    </div>
  );
}

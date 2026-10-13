// Route: /style-actions-product/engine
// Needs to be registered in the route file (src/modules/style-actions-product/route.tsx).

import { PageHeader } from '@/components/ui';

import { RunStatusBar } from '../components/engine/RunStatusBar';
import { OutcomeTable } from '../components/engine/OutcomeTable';
import { MOCK_ENGINE_RUN } from '../data/mockEngineRun';

/** Engine Dashboard — shows what the engine ran, what it decided, and why. */
export default function EngineDashboardPage(): React.ReactNode {
  const run = MOCK_ENGINE_RUN;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Engine Dashboard"
        backTo={{ label: 'Workspace', path: '/style-actions-product' }}
      />

      {/* Zone 1: Run Status */}
      <RunStatusBar
        runType={run.runType}
        asOfDate={run.asOfDate}
        runTimestamp={run.runTimestamp}
        readinessChecks={run.readinessChecks}
        lineCounts={run.lineCounts}
        pipeline={run.pipeline}
      />

      {/* Zone 2 + Zone 3: Outcomes Table (with inline Gate Stepper on row expand) */}
      <OutcomeTable outcomes={run.outcomes} />
    </div>
  );
}

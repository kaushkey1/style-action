import { useState, useEffect } from 'react';
import type {
  StoreSpaceProfile,
  StoreSegmentData,
  SpaceRecommendation,
  SPSFTarget,
  NetworkCapacityRow,
  StoreFashionSplit,
  GradeSegmentBenchmark,
  StoreDiagnostic,
  FixtureRebalancingRec,
  FixtureTransfer,
  NSOStore,
  FixtureConversion,
  StoreSpaceChange,
  SpaceScenario,
  ABTest,
  PlanComparisonRow,
  SpsfTrendPoint,
  RAFeedback,
  TacticalReallocation,
} from '@/data/mockSpacePlanning';
import type {
  GarmentCapacity,
  SpaceMetric,
  SpaceAdjustment,
} from '@/data/mockNetworkSpace';
import { isMockMode } from '@/environment';
import { apiFetch } from '@/lib/api';

export interface SpacePlanningData {
  storeSpaceProfiles: StoreSpaceProfile[];
  storeSegmentAllocations: StoreSegmentData[];
  spaceRecommendations: SpaceRecommendation[];
  spsfTargets: SPSFTarget[];
  networkCapacityBuildUp: NetworkCapacityRow[];
  storeFashionSplits: Record<string, StoreFashionSplit[]>;
  gradeSegmentBenchmarks: GradeSegmentBenchmark[];
  storeDiagnostics: StoreDiagnostic[];
  fixtureRebalancingRecs: FixtureRebalancingRec[];
  fixtureTransfers: FixtureTransfer[];
  fixtureConversions: FixtureConversion[];
  nsoStores: NSOStore[];
  storeSpaceChanges: StoreSpaceChange[];
  spaceScenarios: SpaceScenario[];
  abTests: ABTest[];
  planComparison: PlanComparisonRow[];
  spsfTrend: SpsfTrendPoint[];
  raFeedback: RAFeedback[];
  tacticalReallocations: TacticalReallocation[];
  garmentCapacity: GarmentCapacity[];
  networkSpaceMetrics: SpaceMetric[];
  spaceAdjustments: SpaceAdjustment[];
  networkSpaceSummary: {
    actualCapacityCr: number;
    targetCapacityCr: number;
    networkAvgSpsf: number;
    storesBelowFloor: number;
    totalStores: number;
    totalSqft: number;
  };
}

export function useSpacePlanningData() {
  const [data, setData] = useState<SpacePlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMockMode()) {
      Promise.all([
        import('@/data/mockSpacePlanning'),
        import('@/data/mockNetworkSpace'),
      ])
        .then(([sp, ns]) => {
          setData({
            storeSpaceProfiles: sp.storeSpaceProfiles,
            storeSegmentAllocations: sp.storeSegmentAllocations,
            spaceRecommendations: sp.spaceRecommendations,
            spsfTargets: sp.spsfTargets,
            networkCapacityBuildUp: sp.networkCapacityBuildUp,
            storeFashionSplits: sp.storeFashionSplits,
            gradeSegmentBenchmarks: sp.gradeSegmentBenchmarks,
            storeDiagnostics: sp.storeDiagnostics,
            fixtureRebalancingRecs: sp.fixtureRebalancingRecs,
            fixtureTransfers: sp.fixtureTransfers,
            fixtureConversions: sp.fixtureConversions,
            nsoStores: sp.nsoStores,
            storeSpaceChanges: sp.storeSpaceChanges,
            spaceScenarios: sp.spaceScenarios,
            abTests: sp.abTests,
            planComparison: sp.planComparisonData,
            spsfTrend: sp.spsfTrendData,
            raFeedback: sp.raFeedbackItems,
            tacticalReallocations: sp.tacticalReallocations,
            garmentCapacity: ns.garmentCapacity,
            networkSpaceMetrics: ns.networkSpaceMetrics,
            spaceAdjustments: ns.spaceAdjustments,
            networkSpaceSummary: ns.networkSpaceSummary,
          });
          setLoading(false);
        })
        .catch((e) => {
          setError(e.message);
          setLoading(false);
        });
    } else {
      apiFetch<SpacePlanningData>('/v1/space-planning/dashboard')
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, []);

  return { data, loading, error };
}

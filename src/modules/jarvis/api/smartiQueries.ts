// ─── Smarti Data Fetching Hooks ─────────────────────────────────────────────
// Lightweight hooks returning { data, isLoading, error } shape.
// API functions handle all response transformation internally.
// Includes an in-memory cache so tab switches render data instantly.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchFootfall,
  fetchActiveCount,
  fetchAttendedUnattended,
  fetchDemographics,
  fetchEmotions,
  fetchAreaDwellTime,
  fetchAreaCount,
  fetchFlowFunnel,
  fetchOperatingHours,
  fetchCustomerTransitions,
  fetchAlerts,
  fetchDepartments,
  fetchDeptAnalytics,
  fetchDeptFirstZoneVisit,
  fetchDeptAttendedUnattended,
  fetchDeptDwellTime,
  fetchCameraHeatmaps,
} from './smartiApi';
import { fetchNPSResponses } from './npsApi';
import type { NPSResponse } from '../data/npsUtils';
import type {
  FootfallResponse,
  ActiveCountResponse,
  AttendedUnattendedResponse,
  DemographicsResponse,
  EmotionsResponse,
  AreaDwellTimeResponse,
  AreaCountResponse,
  FlowFunnelResponse,
  OperatingHoursResponse,
  CustomerTransitionResponse,
  AlertsResponse,
  DepartmentsResponse,
  DeptAnalyticsResponse,
  FirstZoneVisitResponse,
  DeptAttendedUnattendedResponse,
  DeptDwellTimeResponse,
  CameraHeatmapResponse,
} from './smartiTypes';

// ─── In-memory cache ───────────────────────────────────────────────────────

const QUERY_CACHE = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = QUERY_CACHE.get(key);
  if (!entry || Date.now() - entry.ts > CACHE_TTL_MS) return null;
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  QUERY_CACHE.set(key, { data, ts: Date.now() });
}

function qk(name: string, ...args: string[]): string {
  return ['smarti', name, ...args].join(':');
}

// ─── Generic query hook ─────────────────────────────────────────────────────

interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

function useSmartiQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  options?: { refetchInterval?: number },
): QueryResult<T> {
  const [data, setData] = useState<T | null>(() => getCached<T>(key));
  const [isLoading, setIsLoading] = useState(() => getCached<T>(key) === null);
  const [error, setError] = useState<Error | null>(null);
  const counterRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  const cacheKeyRef = useRef(key);
  fetcherRef.current = fetcher;
  cacheKeyRef.current = key;

  const execute = useCallback(() => {
    const id = ++counterRef.current;
    const currentKey = cacheKeyRef.current;

    const cached = getCached<T>(currentKey);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    fetcherRef.current()
      .then((result) => {
        if (counterRef.current === id) {
          setCache(currentKey, result);
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (counterRef.current === id) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (counterRef.current === id) {
          setIsLoading(false);
        }
      });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls dependencies via deps array
  useEffect(() => { execute(); }, deps);

  useEffect(() => {
    if (!options?.refetchInterval) return;
    const interval = setInterval(execute, options.refetchInterval);
    return () => clearInterval(interval);
  }, [execute, options?.refetchInterval]);

  return { data, isLoading, error };
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useSmartiFootfall(startDate: string, endDate: string): QueryResult<FootfallResponse> {
  return useSmartiQuery(
    qk('footfall', startDate, endDate),
    () => fetchFootfall(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiActiveCount(): QueryResult<ActiveCountResponse> {
  return useSmartiQuery(
    qk('activeCount'),
    () => fetchActiveCount(),
    [],
    { refetchInterval: 60_000 },
  );
}

export function useSmartiAttendedUnattended(startDate: string, endDate: string): QueryResult<AttendedUnattendedResponse> {
  return useSmartiQuery(
    qk('attendedUnattended', startDate, endDate),
    () => fetchAttendedUnattended(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiDemographics(startDate: string, endDate: string): QueryResult<DemographicsResponse> {
  return useSmartiQuery(
    qk('demographics', startDate, endDate),
    () => fetchDemographics(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiEmotions(startDate: string, endDate: string): QueryResult<EmotionsResponse> {
  return useSmartiQuery(
    qk('emotions', startDate, endDate),
    () => fetchEmotions(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiAreaDwellTime(startDate: string, endDate: string): QueryResult<AreaDwellTimeResponse> {
  return useSmartiQuery(
    qk('areaDwellTime', startDate, endDate),
    () => fetchAreaDwellTime(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiAreaCount(startDate: string, endDate: string): QueryResult<AreaCountResponse> {
  return useSmartiQuery(
    qk('areaCount', startDate, endDate),
    () => fetchAreaCount(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiFlowFunnel(startDate: string, endDate: string): QueryResult<FlowFunnelResponse> {
  return useSmartiQuery(
    qk('flowFunnel', startDate, endDate),
    () => fetchFlowFunnel(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiOperatingHours(): QueryResult<OperatingHoursResponse> {
  return useSmartiQuery(
    qk('operatingHours'),
    () => fetchOperatingHours(),
    [],
  );
}

export function useSmartiCustomerTransitions(startDate: string, endDate: string): QueryResult<CustomerTransitionResponse> {
  return useSmartiQuery(
    qk('transitions', startDate, endDate),
    () => fetchCustomerTransitions(startDate, endDate),
    [startDate, endDate],
  );
}

// ─── New Hooks (Alerts, Departments, Heatmap) ──────────────────────────────

export function useSmartiAlerts(startDate: string, endDate: string): QueryResult<AlertsResponse> {
  return useSmartiQuery(
    qk('alerts', startDate, endDate),
    () => fetchAlerts(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiDepartments(): QueryResult<DepartmentsResponse> {
  return useSmartiQuery(
    qk('departments'),
    () => fetchDepartments(),
    [],
  );
}

export function useSmartiDeptAnalytics(startDate: string, endDate: string): QueryResult<DeptAnalyticsResponse> {
  return useSmartiQuery(
    qk('deptAnalytics', startDate, endDate),
    () => fetchDeptAnalytics(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiFirstZoneVisit(startDate: string, endDate: string): QueryResult<FirstZoneVisitResponse> {
  return useSmartiQuery(
    qk('firstZoneVisit', startDate, endDate),
    () => fetchDeptFirstZoneVisit(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiDeptAttendedUnattended(startDate: string, endDate: string): QueryResult<DeptAttendedUnattendedResponse> {
  return useSmartiQuery(
    qk('deptAttendedUnattended', startDate, endDate),
    () => fetchDeptAttendedUnattended(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiDeptDwellTime(startDate: string, endDate: string): QueryResult<DeptDwellTimeResponse> {
  return useSmartiQuery(
    qk('deptDwellTime', startDate, endDate),
    () => fetchDeptDwellTime(startDate, endDate),
    [startDate, endDate],
  );
}

export function useSmartiCameraHeatmaps(startDate: string, endDate: string): QueryResult<CameraHeatmapResponse> {
  return useSmartiQuery(
    qk('cameraHeatmaps', startDate, endDate),
    () => fetchCameraHeatmaps(startDate, endDate),
    [startDate, endDate],
  );
}

// ─── NPS Hook ──────────────────────────────────────────────────────────────

export function useNPSResponses(storeCode: string, startDate: string, endDate: string): QueryResult<NPSResponse[]> {
  return useSmartiQuery(
    qk('npsResponses', storeCode, startDate, endDate),
    () => fetchNPSResponses(storeCode, startDate, endDate),
    [storeCode, startDate, endDate],
  );
}

// ─── Prefetch ──────────────────────────────────────────────────────────────

/**
 * Fires all Smarti API calls concurrently and populates the in-memory cache.
 * Call from JarvisDashboardPage on mount and on every date change so data is
 * ready before the user switches tabs.
 */
export function prefetchJarvisData(startDate: string, endDate: string, storeCode = '9626'): void {
  const pre = (key: string, fn: () => Promise<unknown>): void => {
    if (getCached(key)) return;
    fn()
      .then((data) => setCache(key, data))
      .catch(() => {});
  };

  pre(qk('npsResponses', storeCode, startDate, endDate), () => fetchNPSResponses(storeCode, startDate, endDate));
  pre(qk('footfall', startDate, endDate), () => fetchFootfall(startDate, endDate));
  pre(qk('attendedUnattended', startDate, endDate), () => fetchAttendedUnattended(startDate, endDate));
  pre(qk('demographics', startDate, endDate), () => fetchDemographics(startDate, endDate));
  pre(qk('emotions', startDate, endDate), () => fetchEmotions(startDate, endDate));
  pre(qk('areaDwellTime', startDate, endDate), () => fetchAreaDwellTime(startDate, endDate));
  pre(qk('areaCount', startDate, endDate), () => fetchAreaCount(startDate, endDate));
  pre(qk('flowFunnel', startDate, endDate), () => fetchFlowFunnel(startDate, endDate));
  pre(qk('firstZoneVisit', startDate, endDate), () => fetchDeptFirstZoneVisit(startDate, endDate));
  pre(qk('deptAnalytics', startDate, endDate), () => fetchDeptAnalytics(startDate, endDate));
  pre(qk('deptAttendedUnattended', startDate, endDate), () => fetchDeptAttendedUnattended(startDate, endDate));
  pre(qk('deptDwellTime', startDate, endDate), () => fetchDeptDwellTime(startDate, endDate));
  pre(qk('cameraHeatmaps', startDate, endDate), () => fetchCameraHeatmaps(startDate, endDate));
  pre(qk('alerts', startDate, endDate), () => fetchAlerts(startDate, endDate));

  if (startDate === endDate) {
    pre(qk('transitions', startDate, endDate), () => fetchCustomerTransitions(startDate, endDate));
  }

  pre(qk('activeCount'), () => fetchActiveCount());
  pre(qk('departments'), () => fetchDepartments());
  pre(qk('operatingHours'), () => fetchOperatingHours());
}

// ─── Smarti API Client ──────────────────────────────────────────────────────
// All API functions for the Smarti CCTV analytics platform.
// Fetches from the actual Smarti API endpoints and transforms responses
// into the shapes expected by page components.

import { SMARTI_STORE_ID } from './smartiTypes';
import { apiUrl, getActiveOrgUuid, getActiveTenantId } from '@/lib/utils';
import type {
  FootfallResponse,
  FootfallEntry,
  ActiveCountResponse,
  AttendedUnattendedResponse,
  DemographicsResponse,
  EmotionsResponse,
  EmotionsEntry,
  AreaDwellTimeResponse,
  AreaDwellTimeEntry,
  AreaCountResponse,
  AreaCountEntry,
  FlowFunnelResponse,
  FlowFunnelStage,
  StoreZonesResponse,
  StoreZone,
  OperatingHoursResponse,
  CustomerTransitionResponse,
  AlertsResponse,
  AlertEntry,
  DepartmentsResponse,
  DepartmentInfo,
  DeptAnalyticsResponse,
  DeptAnalyticsEntry,
  FirstZoneVisitResponse,
  FirstZoneVisitEntry,
  DeptAttendedUnattendedResponse,
  DeptAttendedEntry,
  DeptDwellTimeResponse,
  DeptDwellTimeEntry,
  CameraHeatmapResponse,
  RawFlowFunnelFullResponse,
  RawCountResponse,
  RawActiveCountsResponse,
  RawAttendedUnattendedResponse,
  RawAttendedBuckets,
  RawEmotionsResponse,
  RawDemographicsResponse,
  RawAreaItem,
  RawAreaCountItem,
  RawAreaDwellTimeResponse,
  RawFlowFunnelResponse,
  RawAlertsResponse,
  RawDepartment,
  RawDeptAnalyticsResponse,
  RawFirstZoneVisitResponse,
  RawDeptAttendedUnattendedResponse,
  RawDeptDwellTimeResponse,
} from './smartiTypes';

// Backend Smarti proxy (impetus-agentic-central `app.smarti`). The backend
// injects the Smarti bearer token server-side; the browser only sends tenant
// headers. Path is relative to the impetus-agentic service base (see apiUrl).
const BASE_URL = '/jarvis/smarti/retail/stores';
const DEFAULT_TIMEOUT_MS = 45_000;

function filterStoreZones(areas: RawAreaItem[]): RawAreaItem[] {
  return areas.filter((a) => a.metadata.zone_type === 'ZONE');
}

async function smartiFetch<T>(path: string, params?: Record<string, string>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const url = new URL(apiUrl(path), window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-Tenant-ID': getActiveTenantId(),
        'X-Org-ID': getActiveOrgUuid(),
      },
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Smarti API timeout: ${path} took longer than ${timeoutMs / 1000}s`);
    }
    throw err;
  }

  clearTimeout(timer);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Smarti API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

function storeUrl(endpoint: string): string {
  return `${BASE_URL}/${SMARTI_STORE_ID}/${endpoint}`;
}

function dateParams(startDate: string, endDate: string): Record<string, string> {
  return {
    minTime: `${startDate}T00:00:00`,
    maxTime: `${endDate}T23:59:59`,
  };
}

/** Sum all bucket values in an attended time-bucket object */
function sumAttendedBuckets(buckets: RawAttendedBuckets): number {
  return (
    buckets['0-15s'] +
    buckets['15-30s'] +
    buckets['30-45s'] +
    buckets['45-60s'] +
    buckets['60s+']
  );
}

// ─── API Functions ──────────────────────────────────────────────────────────

/**
 * Fetches footfall data by combining four separate endpoints:
 * customers/entries, customers/exits, staff/entries, staff/exits.
 * Merges the hourly groupBy arrays into FootfallEntry[] keyed by time.
 */
export async function fetchFootfall(startDate: string, endDate: string): Promise<FootfallResponse> {
  const params = dateParams(startDate, endDate);

  const [customerEntries, customerExits, staffEntries, staffExits] = await Promise.all([
    smartiFetch<RawCountResponse>(storeUrl('customers/entries'), params),
    smartiFetch<RawCountResponse>(storeUrl('customers/exits'), params),
    smartiFetch<RawCountResponse>(storeUrl('staff/entries'), params),
    smartiFetch<RawCountResponse>(storeUrl('staff/exits'), params),
  ]);

  // Build a map of time -> FootfallEntry from all four responses
  const timeMap = new Map<string, FootfallEntry>();

  function ensureEntry(time: string): FootfallEntry {
    const existing = timeMap.get(time);
    if (existing) return existing;
    const entry: FootfallEntry = { time, customerEntries: 0, customerExits: 0, staffEntries: 0, staffExits: 0 };
    timeMap.set(time, entry);
    return entry;
  }

  for (const item of customerEntries.groupby) {
    ensureEntry(item.time).customerEntries = item.count;
  }
  for (const item of customerExits.groupby) {
    ensureEntry(item.time).customerExits = item.count;
  }
  for (const item of staffEntries.groupby) {
    ensureEntry(item.time).staffEntries = item.count;
  }
  for (const item of staffExits.groupby) {
    ensureEntry(item.time).staffExits = item.count;
  }

  // Sort by time ascending
  const data = Array.from(timeMap.values()).sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  return { data };
}

/**
 * Fetches live active counts (customers and staff currently in store).
 * Endpoint: GET active-counts (no date params)
 */
export async function fetchActiveCount(): Promise<ActiveCountResponse> {
  const raw = await smartiFetch<RawActiveCountsResponse>(storeUrl('active-counts'));
  return {
    data: {
      activeCustomers: raw.customerCount,
      activeStaff: raw.staffCount,
    },
  };
}

/**
 * Fetches attended/unattended data and transforms to flat array.
 * The raw API returns departments[] with attended as time-bucketed object.
 * We sum the attended buckets into a single number for each zone.
 */
export async function fetchAttendedUnattended(startDate: string, endDate: string): Promise<AttendedUnattendedResponse> {
  const raw = await smartiFetch<RawAttendedUnattendedResponse>(
    storeUrl('attended-unattended'),
    dateParams(startDate, endDate),
  );

  const data = raw.departments.map((dept) => ({
    areaId: dept.zoneId,
    areaName: dept.zoneName,
    attended: sumAttendedBuckets(dept.attended),
    unattended: dept.unattended,
    total: dept.totalVisits,
  }));

  return { data };
}

/**
 * Fetches demographics by combining two separate endpoints:
 * customers/demographics/gender and customers/demographics/age.
 * Transforms raw counts into percentages for the consumer.
 */
export async function fetchDemographics(startDate: string, endDate: string): Promise<DemographicsResponse> {
  const params = dateParams(startDate, endDate);

  const [genderRaw, ageRaw] = await Promise.all([
    smartiFetch<RawDemographicsResponse>(storeUrl('customers/demographics/gender'), params),
    smartiFetch<RawDemographicsResponse>(storeUrl('customers/demographics/age'), params),
  ]);

  // Gender: convert raw counts to percentages
  const maleCount = genderRaw.total['male'] ?? 0;
  const femaleCount = genderRaw.total['female'] ?? 0;
  const genderTotal = maleCount + femaleCount;
  const malePct = genderTotal > 0 ? (maleCount / genderTotal) * 100 : 0;
  const femalePct = genderTotal > 0 ? (femaleCount / genderTotal) * 100 : 0;

  // Age: convert raw counts to percentages
  const childCount = ageRaw.total['child'] ?? 0;
  const teensCount = ageRaw.total['teens'] ?? ageRaw.total['teenager'] ?? 0;
  const youngAdultCount = ageRaw.total['young adult'] ?? ageRaw.total['young_adult'] ?? 0;
  const adultCount = ageRaw.total['adult'] ?? 0;
  const seniorCount = ageRaw.total['senior'] ?? 0;
  const ageTotal = childCount + teensCount + youngAdultCount + adultCount + seniorCount;

  const agePct = (count: number): number => ageTotal > 0 ? (count / ageTotal) * 100 : 0;

  return {
    data: {
      gender: {
        male: malePct,
        female: femalePct,
      },
      ageGroup: {
        child: agePct(childCount),
        teens: agePct(teensCount),
        youngAdults: agePct(youngAdultCount),
        adults: agePct(adultCount),
        seniors: agePct(seniorCount),
      },
    },
  };
}

/**
 * Fetches customer emotions and transforms into percentages.
 * Endpoint: GET customers/emotions
 */
export async function fetchEmotions(startDate: string, endDate: string): Promise<EmotionsResponse> {
  const raw = await smartiFetch<RawEmotionsResponse>(
    storeUrl('customers/emotions'),
    dateParams(startDate, endDate),
  );

  // Overall: convert counts to percentages
  const neutralCount = raw.total['neutral'] ?? 0;
  const positiveCount = raw.total['positive'] ?? 0;
  const negativeCount = raw.total['negative'] ?? 0;
  const emotionTotal = neutralCount + positiveCount + negativeCount;

  const pct = (count: number): number => emotionTotal > 0 ? Math.round((count / emotionTotal) * 100) : 0;

  // Hourly: convert each groupBy entry to percentages
  const hourly: EmotionsEntry[] = raw.groupBy.map((g) => {
    const gNeutral = g.counts['neutral'] ?? 0;
    const gPositive = g.counts['positive'] ?? 0;
    const gNegative = g.counts['negative'] ?? 0;
    const gTotal = gNeutral + gPositive + gNegative;
    const gPct = (c: number): number => gTotal > 0 ? Math.round((c / gTotal) * 100) : 0;

    return {
      time: g.time,
      neutral: gPct(gNeutral),
      positive: gPct(gPositive),
      negative: gPct(gNegative),
    };
  });

  return {
    data: {
      overall: {
        neutral: pct(neutralCount),
        positive: pct(positiveCount),
        negative: pct(negativeCount),
      },
      hourly,
    },
  };
}

/**
 * Fetches areas list, then fetches dwell-time for each area.
 * Combines into AreaDwellTimeEntry[] with per-zone stats.
 *
 * The per-area dwell-time endpoint returns time buckets (0-2min, 2-4min, etc.)
 * rather than individual times. We derive approximate stats from the buckets.
 */
export async function fetchAreaDwellTime(startDate: string, endDate: string): Promise<AreaDwellTimeResponse> {
  const params = dateParams(startDate, endDate);
  const rawAreas = await smartiFetch<RawAreaItem[]>(storeUrl('areas'));
  const areas = filterStoreZones(rawAreas);

  const bucketMidpoints: Record<string, number> = {
    '0-2min': 60,
    '2-4min': 180,
    '4-6min': 300,
    '6-8min': 420,
    '8-10min': 540,
    '10min+': 720,
  };

  // Fetch dwell-time for each area in parallel
  const perAreaResults = await Promise.all(
    areas.map(async (area) => {
      try {
        const raw = await smartiFetch<RawAreaDwellTimeResponse>(
          storeUrl(`areas/${area.id}/dwell-time`),
          { ...params, binSize: '2' },
        );
        return { name: area.name, buckets: raw.total };
      } catch {
        return { name: area.name, buckets: {} as Record<string, number> };
      }
    }),
  );

  // Aggregate zones with the same name
  const nameMap = new Map<string, { totalTime: number; totalCount: number; minDwell: number; maxDwell: number }>();
  for (const result of perAreaResults) {
    let agg = nameMap.get(result.name);
    if (!agg) {
      agg = { totalTime: 0, totalCount: 0, minDwell: Infinity, maxDwell: 0 };
      nameMap.set(result.name, agg);
    }
    for (const [bucket, count] of Object.entries(result.buckets)) {
      const typedCount = typeof count === 'number' ? count : 0;
      if (typedCount <= 0) continue;
      const midpoint = bucketMidpoints[bucket] ?? 0;
      if (midpoint === 0) continue;
      agg.totalTime += midpoint * typedCount;
      agg.totalCount += typedCount;
      if (midpoint < agg.minDwell) agg.minDwell = midpoint;
      if (midpoint > agg.maxDwell) agg.maxDwell = midpoint;
    }
  }

  const data: AreaDwellTimeEntry[] = Array.from(nameMap.entries()).map(([name, agg]) => ({
    areaId: name,
    areaName: name,
    avgDwellTime: agg.totalCount > 0 ? agg.totalTime / agg.totalCount : 0,
    minDwellTime: agg.totalCount > 0 ? agg.minDwell : 0,
    maxDwellTime: agg.totalCount > 0 ? agg.maxDwell : 0,
    totalVisits: agg.totalCount,
  }));

  return { data };
}

/**
 * Fetches areas list, then fetches count for each area.
 * Combines into AreaCountEntry[] with per-zone queue/wait stats.
 *
 * Also augments with totalVisits from attended-unattended for zones that
 * don't have explicit count data (department zones vs queue zones).
 */
export async function fetchAreaCount(startDate: string, endDate: string): Promise<AreaCountResponse> {
  const params = dateParams(startDate, endDate);

  // Fetch areas list and attended-unattended in parallel
  const [allAreas, attendedRaw] = await Promise.all([
    smartiFetch<RawAreaItem[]>(storeUrl('areas')),
    smartiFetch<RawAttendedUnattendedResponse>(storeUrl('attended-unattended'), params),
  ]);

  const areas = filterStoreZones(allAreas);

  // Build a map of zone visits from attended-unattended for fallback totalVisits
  const zoneVisitMap = new Map<string, number>();
  for (const dept of attendedRaw.departments) {
    zoneVisitMap.set(dept.zoneId, dept.totalVisits);
  }

  // Fetch count for each area in parallel
  const perAreaResults = await Promise.all(
    areas.map(async (area) => {
      const queueType = area.metadata.queue ?? null;
      try {
        const rawArr = await smartiFetch<RawAreaCountItem[]>(
          storeUrl(`areas/${area.id}/count`),
          params,
        );
        const raw = rawArr[0];
        if (raw) {
          return {
            name: area.name,
            totalVisits: raw.customers.total,
            activeVisitors: raw.customers.current,
            avgWaitTime: raw.waitTime.avg,
            maxWaitTime: raw.waitTime.max,
            minWaitTime: raw.waitTime.min,
            totalServed: raw.customers.total,
            queueType,
          };
        }
        const visitCount = zoneVisitMap.get(area.id) ?? 0;
        return { name: area.name, totalVisits: visitCount, activeVisitors: 0, avgWaitTime: 0, maxWaitTime: 0, minWaitTime: 0, totalServed: 0, queueType };
      } catch {
        const visitCount = zoneVisitMap.get(area.id) ?? 0;
        return { name: area.name, totalVisits: visitCount, activeVisitors: 0, avgWaitTime: 0, maxWaitTime: 0, minWaitTime: 0, totalServed: 0, queueType };
      }
    }),
  );

  // Aggregate zones with the same name
  const nameMap = new Map<string, AreaCountEntry>();
  for (const r of perAreaResults) {
    const existing = nameMap.get(r.name);
    if (existing) {
      existing.totalVisits += r.totalVisits;
      existing.activeVisitors += r.activeVisitors;
      existing.avgWaitTime = Math.max(existing.avgWaitTime, r.avgWaitTime);
      existing.maxWaitTime = Math.max(existing.maxWaitTime, r.maxWaitTime);
      existing.totalServed += r.totalServed;
    } else {
      nameMap.set(r.name, {
        areaId: r.name,
        areaName: r.name,
        totalVisits: r.totalVisits,
        activeVisitors: r.activeVisitors,
        avgWaitTime: r.avgWaitTime,
        maxWaitTime: r.maxWaitTime,
        minWaitTime: r.minWaitTime,
        totalServed: r.totalServed,
        queueType: r.queueType,
      });
    }
  }

  return { data: Array.from(nameMap.values()) };
}

/**
 * Fetches flow funnel data and aggregates zone-level clusters into a
 * 3-stage retail funnel: Walk-in → Browsing/Trial → Billing.
 *
 * - Walk-in  = "Entry / Exit" cluster visitor count
 * - Browsing = sum of edges FROM Entry/Exit TO department zones
 *              (avoids double-counting a customer who visits multiple zones)
 * - Billing  = "Cash Counter" cluster visitor count
 */
export async function fetchFlowFunnel(startDate: string, endDate: string): Promise<FlowFunnelResponse> {
  const raw = await smartiFetch<RawFlowFunnelResponse>(
    storeUrl('flow/funnel'),
    dateParams(startDate, endDate),
    30_000,
  );

  if (!raw.clusters || Object.keys(raw.clusters).length === 0) {
    return { data: [] };
  }

  const entryIds: string[] = [];
  const billingIds: string[] = [];
  let walkInCount = 0;
  let billingCount = 0;

  for (const [id, cluster] of Object.entries(raw.clusters)) {
    const name = cluster.clusterName.toLowerCase();
    const count = Number(cluster.visitorCount);
    if (name.includes('entry') || name.includes('exit')) {
      entryIds.push(id);
      walkInCount += count;
    } else if (name.includes('cash') || name.includes('counter') || name.includes('billing') || name.includes('checkout')) {
      billingIds.push(id);
      billingCount += count;
    }
  }

  // Browsing = all people who moved from Entry into the store (any zone)
  let browsingCount = 0;
  for (const edge of raw.edges) {
    if (entryIds.includes(edge.fromCluster) && !entryIds.includes(edge.toCluster)) {
      browsingCount += edge.transitionCount;
    }
  }

  const stages: FlowFunnelStage[] = [
    { stageName: 'Footfall', count: walkInCount, percentage: 100 },
    { stageName: 'Browsing / Trial', count: browsingCount, percentage: walkInCount > 0 ? Math.round((browsingCount / walkInCount) * 100) : 0 },
    { stageName: 'Billing', count: billingCount, percentage: walkInCount > 0 ? Math.round((billingCount / walkInCount) * 100) : 0 },
  ];

  return { data: stages };
}

/**
 * Fetches areas list and transforms into StoreZone format.
 */
export async function fetchStoreZones(): Promise<StoreZonesResponse> {
  const rawAreas = await smartiFetch<RawAreaItem[]>(storeUrl('areas'));
  const areas = filterStoreZones(rawAreas);

  const zones: StoreZone[] = areas.map((area) => ({
    id: area.id,
    name: area.name,
    department: area.metadata.department ?? '',
    type: area.metadata.zone_type,
  }));

  return { data: zones };
}

/**
 * Fetches operating hours. Currently may error on the API side.
 */
export async function fetchOperatingHours(): Promise<OperatingHoursResponse> {
  return smartiFetch<OperatingHoursResponse>(storeUrl('operating-hours'));
}

/**
 * Fetches customer transition data from flow/funnel endpoint.
 * Returns the full clusters + edges data for heatmap and chord visualizations.
 * The visitorCount field can be either a number or string from the API.
 */
export async function fetchCustomerTransitions(startDate: string, endDate: string): Promise<CustomerTransitionResponse> {
  if (startDate !== endDate) {
    throw new Error('Customer transition data is only available for single-day view. Select "Today" to see transitions.');
  }

  const raw = await smartiFetch<RawFlowFunnelFullResponse>(
    storeUrl('flow/funnel'),
    dateParams(startDate, endDate),
    30_000,
  );

  const clusters: CustomerTransitionResponse['clusters'] = {};
  for (const [id, cluster] of Object.entries(raw.clusters)) {
    clusters[id] = {
      ...cluster,
      visitorCount: Number(cluster.visitorCount),
    };
  }

  return {
    clusters,
    edges: raw.edges,
  };
}

// ─── New API Functions (Alerts, Departments, Heatmap) ──────────────────────

/**
 * Fetches alerts from Smarti. Uses page/pagesize/minTimestamp/maxTimestamp params.
 */
export async function fetchAlerts(
  startDate: string,
  endDate: string,
  page = 1,
  pageSize = 50,
): Promise<AlertsResponse> {
  const minTs = new Date(`${startDate}T00:00:00`).getTime();
  const maxTs = new Date(`${endDate}T23:59:59`).getTime();

  const raw = await smartiFetch<RawAlertsResponse>(storeUrl('alerts'), {
    page: String(page),
    pagesize: String(pageSize),
    minTimestamp: String(minTs),
    maxTimestamp: String(maxTs),
  });

  const alerts: AlertEntry[] = raw.objects.map((item) => ({
    id: item.id,
    type: item.type,
    severity: item.severity,
    status: item.status,
    category: item.category,
    cameraId: item.cameraId,
    zoneId: item.zoneId,
    createdAt: item.createdAt,
    frameUrl: item.computedFramePath || item.originalFramePath,
    count: item.count,
    serialId: item.serialId,
    siteId: item.siteId,
    timestamp: item.timestamp,
    siteName: item.site?.name ?? '',
    cameraName: item.camera?.name ?? '',
    thumbnailBase64: item.metadata?.thumbnailBase64 ?? null,
  }));

  return { alerts, total: raw.total };
}

/**
 * Fetches department hierarchy (no date params).
 */
export async function fetchDepartments(): Promise<DepartmentsResponse> {
  const raw = await smartiFetch<RawDepartment[]>(storeUrl('departments'));

  const departments: DepartmentInfo[] = raw.map((dept) => ({
    departmentId: dept.departmentId,
    name: dept.name,
    cameraCount: dept.cameras.length,
    activeCameras: dept.cameras.filter((c) => c.isActive).length,
  }));

  return { departments };
}

/**
 * Fetches department analytics: visitor counts, employee counts per department.
 */
export async function fetchDeptAnalytics(
  startDate: string,
  endDate: string,
): Promise<DeptAnalyticsResponse> {
  const raw = await smartiFetch<RawDeptAnalyticsResponse>(
    storeUrl('departments/analytics'),
    dateParams(startDate, endDate),
  );

  // Aggregate duplicate department entries by departmentId
  const deptMap = new Map<string, DeptAnalyticsEntry>();
  for (const dept of raw.departments) {
    const existing = deptMap.get(dept.departmentId);
    if (existing) {
      existing.visitorCount += dept.count;
      existing.totalVisits += dept.totalVisits;
      existing.employeeCount = Math.max(existing.employeeCount, dept.employeeCount);
    } else {
      deptMap.set(dept.departmentId, {
        departmentId: dept.departmentId,
        name: dept.name,
        visitorCount: dept.count,
        totalVisits: dept.totalVisits,
        employeeCount: dept.employeeCount,
        visitShare: 0,
      });
    }
  }
  const departments = Array.from(deptMap.values());
  const total = raw.total || departments.reduce((sum, d) => sum + d.totalVisits, 0);
  for (const dept of departments) {
    dept.visitShare = total > 0 ? Math.round((dept.totalVisits / total) * 100) : 0;
  }

  return { departments, total };
}

/**
 * Fetches which department customers visit first after entering.
 */
export async function fetchDeptFirstZoneVisit(
  startDate: string,
  endDate: string,
): Promise<FirstZoneVisitResponse> {
  const raw = await smartiFetch<RawFirstZoneVisitResponse>(
    storeUrl('departments/first-zone-visit'),
    dateParams(startDate, endDate),
  );

  // Aggregate duplicate department entries by departmentId
  const deptMap = new Map<string, FirstZoneVisitEntry>();
  for (const dept of raw.departments) {
    const existing = deptMap.get(dept.departmentId);
    if (existing) {
      existing.count += dept.count;
    } else {
      deptMap.set(dept.departmentId, {
        departmentId: dept.departmentId,
        name: dept.name,
        count: dept.count,
        percentage: 0,
      });
    }
  }
  const entries = Array.from(deptMap.values());
  const total = raw.total || entries.reduce((sum, d) => sum + d.count, 0);
  for (const entry of entries) {
    entry.percentage = total > 0 ? Math.round((entry.count / total) * 100) : 0;
  }

  return { entries, total };
}

/**
 * Fetches per-department attended/unattended with per-camera breakdown.
 */
export async function fetchDeptAttendedUnattended(
  startDate: string,
  endDate: string,
): Promise<DeptAttendedUnattendedResponse> {
  const raw = await smartiFetch<RawDeptAttendedUnattendedResponse>(
    storeUrl('departments/attended-unattended'),
    dateParams(startDate, endDate),
  );

  // Aggregate duplicate department entries by departmentId
  const deptMap = new Map<string, DeptAttendedEntry>();
  for (const dept of raw.departments) {
    const attended = sumAttendedBuckets(dept.attended);
    const perCamera = dept.perCamera.map((cam) => ({
      cameraId: cam.cameraId,
      cameraName: cam.cameraName,
      attended: sumAttendedBuckets(cam.attended),
      unattended: cam.unattended,
      totalVisits: cam.totalVisits,
    }));

    const existing = deptMap.get(dept.departmentId);
    if (existing) {
      existing.attended += attended;
      existing.unattended += dept.unattended;
      existing.totalVisits += dept.totalVisits;
      existing.perCamera.push(...perCamera);
      existing.attendedRate = existing.totalVisits > 0
        ? Math.round((existing.attended / existing.totalVisits) * 100)
        : 0;
    } else {
      const total = dept.totalVisits;
      deptMap.set(dept.departmentId, {
        departmentId: dept.departmentId,
        name: dept.name,
        attended,
        unattended: dept.unattended,
        totalVisits: total,
        attendedRate: total > 0 ? Math.round((attended / total) * 100) : 0,
        perCamera,
      });
    }
  }
  const departments = Array.from(deptMap.values());

  return { departments };
}

const DWELL_BIN_MIDPOINTS: Record<string, number> = {
  '0-5min': 2.5,
  '5-10min': 7.5,
  '10-15min': 12.5,
  '15-20min': 17.5,
  '20min+': 25,
};

/**
 * Fetches per-department dwell time histogram.
 */
export async function fetchDeptDwellTime(
  startDate: string,
  endDate: string,
): Promise<DeptDwellTimeResponse> {
  const raw = await smartiFetch<RawDeptDwellTimeResponse>(
    storeUrl('departments/dwell-time'),
    dateParams(startDate, endDate),
  );

  // Aggregate duplicate department entries by departmentId, merging bins
  const deptMap = new Map<string, { name: string; bins: Record<string, number> }>();
  for (const dept of raw.departments) {
    const existing = deptMap.get(dept.departmentId);
    if (existing) {
      for (const [bin, count] of Object.entries(dept.bins)) {
        existing.bins[bin] = (existing.bins[bin] ?? 0) + (typeof count === 'number' ? count : 0);
      }
    } else {
      deptMap.set(dept.departmentId, {
        name: dept.name,
        bins: { ...dept.bins },
      });
    }
  }

  const departments: DeptDwellTimeEntry[] = Array.from(deptMap.entries()).map(([departmentId, { name, bins }]) => {
    let totalTime = 0;
    let totalCount = 0;
    for (const [bin, count] of Object.entries(bins)) {
      const typedCount = typeof count === 'number' ? count : 0;
      if (typedCount <= 0) continue;
      const midpoint = DWELL_BIN_MIDPOINTS[bin] ?? 10;
      totalTime += midpoint * typedCount;
      totalCount += typedCount;
    }
    return {
      departmentId,
      name,
      bins,
      totalVisits: totalCount,
      avgDwellMinutes: totalCount > 0 ? Math.round((totalTime / totalCount) * 10) / 10 : 0,
    };
  });

  return { departments };
}

/**
 * Fetches per-camera heatmap images. Gets camera list from departments,
 * then fetches each camera's heatmap PNG in parallel.
 */
export async function fetchCameraHeatmaps(
  startDate: string,
  endDate: string,
): Promise<CameraHeatmapResponse> {
  const depts = await smartiFetch<RawDepartment[]>(storeUrl('departments'));

  const cameras = depts.flatMap((dept) =>
    dept.cameras.map((cam) => ({
      cameraId: cam.cameraId,
      cameraName: cam.name,
      department: dept.name,
      isActive: cam.isActive,
    })),
  );

  const params = dateParams(startDate, endDate);
  const qs = new URLSearchParams(params).toString();

  const entries = await Promise.all(
    cameras.map(async (cam) => {
      const url = apiUrl(`/jarvis/smarti/retail/cameras/${cam.cameraId}/heatmap?${qs}`);
      try {
        const res = await fetch(url, {
          headers: {
            Accept: 'image/png',
            'X-Tenant-ID': getActiveTenantId(),
            'X-Org-ID': getActiveOrgUuid(),
          },
          credentials: 'include',
        });
        if (!res.ok) return { ...cam, imageUrl: null };
        const blob = await res.blob();
        if (blob.size === 0) return { ...cam, imageUrl: null };
        return { ...cam, imageUrl: URL.createObjectURL(blob) };
      } catch {
        return { ...cam, imageUrl: null };
      }
    }),
  );

  return { cameras: entries };
}

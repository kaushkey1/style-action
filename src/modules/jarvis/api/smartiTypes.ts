// ─── Smarti API Response Types ──────────────────────────────────────────────
// Based on actual Smarti API endpoints at smarti-jio.aiqaisolutions.com

/** Store constants */
export const SMARTI_STORE_ID = '892ea5c5-eda5-4ec5-9fdc-3b336fc379db';
export const SMARTI_STORE_CODE = '9626';
export const SMARTI_STORE_NAME = '9626_ANDHERI_TRENDS';

// ─── Raw API response types ────────────────────────────────────────────────
// These match the actual JSON returned by the Smarti API endpoints.

/** GET customers/entries or customers/exits or staff/entries or staff/exits */
export interface RawCountGroupBy {
  time: string;
  count: number;
}

export interface RawCountResponse {
  count: number;
  /** groupBy has numeric Unix timestamps — prefer groupby (lowercase) which has ISO strings */
  groupBy: { time: number; count: number }[];
  /** groupby (lowercase) has ISO datetime strings */
  groupby: RawCountGroupBy[];
  total: number;
}

/** GET active-counts */
export interface RawActiveCountsResponse {
  customerCount: number;
  staffCount: number;
}

/** GET attended-unattended */
export interface RawAttendedBuckets {
  '0-15s': number;
  '15-30s': number;
  '30-45s': number;
  '45-60s': number;
  '60s+': number;
}

export interface RawAttendedDepartment {
  zoneId: string;
  zoneName: string;
  attended: RawAttendedBuckets;
  unattended: number;
  totalVisits: number;
}

export interface RawAttendedUnattendedResponse {
  departments: RawAttendedDepartment[];
  total: {
    attended: RawAttendedBuckets;
    unattended: number;
    totalVisits: number;
  };
}

/** GET customers/emotions */
export interface RawEmotionGroupBy {
  time: string;
  counts: Record<string, number>;
}

export interface RawEmotionsResponse {
  total: Record<string, number>;
  groupBy: RawEmotionGroupBy[];
}

/** GET customers/demographics/gender */
export interface RawDemographicsResponse {
  total: Record<string, number>;
  groupBy: { time: string; counts: Record<string, number> }[];
}

/** GET areas */
export interface RawAreaItem {
  id: string;
  name: string;
  siteId: string;
  metadata: {
    priority: number;
    zone_type: string;
    department?: string;
    queue?: string;
  };
}

/** GET areas/{areaId}/count */
export interface RawAreaCountItem {
  areaId: string;
  waitTime: {
    avg: number;
    min: number;
    max: number;
  };
  customers: {
    total: number;
    current: number;
  };
}

/** GET areas/{areaId}/dwell-time */
export interface RawAreaDwellTimeResponse {
  zones: unknown[];
  total: Record<string, number>;
}

/** GET flow/funnel — returns clusters + edges (no "nodes" key) */
export interface RawFlowFunnelResponse {
  clusters: Record<string, { clusterName: string; visitorCount: number | string; stage: number; conversionRate: number }>;
  edges: TransitionEdge[];
  overallConversionRate: number;
}

// ─── Transformed / consumer-facing types ───────────────────────────────────
// These are the shapes that hooks return to page components.

// ─── Footfall ───────────────────────────────────────────────────────────────

export interface FootfallEntry {
  time: string;
  customerEntries: number;
  customerExits: number;
  staffEntries: number;
  staffExits: number;
}

export interface FootfallResponse {
  data: FootfallEntry[];
}

// ─── Active Count ───────────────────────────────────────────────────────────

export interface ActiveCountResponse {
  data: {
    activeCustomers: number;
    activeStaff: number;
  };
}

// ─── Attended / Unattended ──────────────────────────────────────────────────

export interface AttendedUnattendedEntry {
  areaId: string;
  areaName: string;
  attended: number;
  unattended: number;
  total: number;
}

export interface AttendedUnattendedResponse {
  data: AttendedUnattendedEntry[];
}

// ─── Demographics ───────────────────────────────────────────────────────────

export interface DemographicsResponse {
  data: {
    gender: {
      male: number;
      female: number;
    };
    ageGroup: {
      child: number;
      teens: number;
      youngAdults: number;
      adults: number;
      seniors: number;
    };
  };
}

// ─── Emotions ───────────────────────────────────────────────────────────────

export interface EmotionsEntry {
  time: string;
  neutral: number;
  positive: number;
  negative: number;
}

export interface EmotionsResponse {
  data: {
    overall: {
      neutral: number;
      positive: number;
      negative: number;
    };
    hourly: EmotionsEntry[];
  };
}

// ─── Area Dwell Time ────────────────────────────────────────────────────────

export interface AreaDwellTimeEntry {
  areaId: string;
  areaName: string;
  avgDwellTime: number;
  minDwellTime: number;
  maxDwellTime: number;
  totalVisits: number;
}

export interface AreaDwellTimeResponse {
  data: AreaDwellTimeEntry[];
}

// ─── Area Count ─────────────────────────────────────────────────────────────

export interface AreaCountEntry {
  areaId: string;
  areaName: string;
  totalVisits: number;
  activeVisitors: number;
  avgWaitTime: number;
  maxWaitTime: number;
  minWaitTime: number;
  totalServed: number;
  /** Queue type from area metadata — e.g. 'cash_counters_queue', 'trial_room_queue' */
  queueType: string | null;
}

export interface AreaCountResponse {
  data: AreaCountEntry[];
}

// ─── Flow Funnel ────────────────────────────────────────────────────────────

export interface FlowFunnelStage {
  stageName: string;
  count: number;
  percentage: number;
}

export interface FlowFunnelResponse {
  data: FlowFunnelStage[];
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

/** Raw response from GET /stores/{storeId}/alerts */
export interface RawAlertItem {
  id: string;
  cameraId: string;
  type: string;
  severity: string;
  status: string;
  category: string;
  createdAt: string;
  computedFramePath: string;
  originalFramePath: string;
  serialId: string;
  siteId: string;
  zoneId: string;
  count: number;
  timestamp: number;
  site?: { name: string };
  camera?: { name: string };
  metadata?: { thumbnailBase64?: string };
}

export interface RawAlertsResponse {
  objects: RawAlertItem[];
  total: number;
}

export interface AlertEntry {
  id: string;
  type: string;
  severity: string;
  status: string;
  category: string;
  cameraId: string;
  zoneId: string;
  createdAt: string;
  frameUrl: string;
  count: number;
  serialId: string;
  siteId: string;
  timestamp: number;
  siteName: string;
  cameraName: string;
  thumbnailBase64: string | null;
}

export interface AlertsResponse {
  alerts: AlertEntry[];
  total: number;
}

// ─── Departments ───────────────────────────────────────────────────────────

/** Raw response from GET /stores/{storeId}/departments */
export interface RawDepartmentCamera {
  cameraId: string;
  name: string;
  isActive: boolean;
}

export interface RawDepartment {
  departmentId: string;
  name: string;
  cameras: RawDepartmentCamera[];
}

export interface DepartmentInfo {
  departmentId: string;
  name: string;
  cameraCount: number;
  activeCameras: number;
}

export interface DepartmentsResponse {
  departments: DepartmentInfo[];
}

// ─── Department Analytics ─────────────────────────────────────────────────

/** Raw response from GET /stores/{storeId}/departments/analytics */
export interface RawDeptAnalyticsItem {
  departmentId: string;
  name: string;
  count: number;
  totalVisits: number;
  employeeCount: number;
}

export interface RawDeptAnalyticsResponse {
  departments: RawDeptAnalyticsItem[];
  total: number;
  multicameraEnabled: boolean;
}

export interface DeptAnalyticsEntry {
  departmentId: string;
  name: string;
  visitorCount: number;
  totalVisits: number;
  employeeCount: number;
  visitShare: number;
}

export interface DeptAnalyticsResponse {
  departments: DeptAnalyticsEntry[];
  total: number;
}

// ─── Department First Zone Visit ───────────────────────────────────────────

/** Raw response from GET /stores/{storeId}/departments/first-zone-visit */
export interface RawFirstZoneVisitItem {
  departmentId: string;
  name: string;
  count: number;
}

export interface RawFirstZoneVisitResponse {
  departments: RawFirstZoneVisitItem[];
  total: number;
}

export interface FirstZoneVisitEntry {
  departmentId: string;
  name: string;
  count: number;
  percentage: number;
}

export interface FirstZoneVisitResponse {
  entries: FirstZoneVisitEntry[];
  total: number;
}

// ─── Department Attended / Unattended ──────────────────────────────────────

/** Raw response from GET /stores/{storeId}/departments/attended-unattended */
export interface RawDeptAttendedItem {
  departmentId: string;
  name: string;
  attended: RawAttendedBuckets;
  unattended: number;
  totalVisits: number;
  perCamera: Array<{
    cameraId: string;
    cameraName: string;
    attended: RawAttendedBuckets;
    unattended: number;
    totalVisits: number;
  }>;
}

export interface RawDeptAttendedUnattendedResponse {
  departments: RawDeptAttendedItem[];
}

export interface DeptCameraAttended {
  cameraId: string;
  cameraName: string;
  attended: number;
  unattended: number;
  totalVisits: number;
}

export interface DeptAttendedEntry {
  departmentId: string;
  name: string;
  attended: number;
  unattended: number;
  totalVisits: number;
  attendedRate: number;
  perCamera: DeptCameraAttended[];
}

export interface DeptAttendedUnattendedResponse {
  departments: DeptAttendedEntry[];
}

// ─── Department Dwell Time ─────────────────────────────────────────────────

/** Raw response from GET /stores/{storeId}/departments/dwell-time */
export interface RawDeptDwellTimeItem {
  departmentId: string;
  name: string;
  bins: Record<string, number>;
  perCamera: Array<{
    cameraId: string;
    cameraName: string;
    bins: Record<string, number>;
  }>;
}

export interface RawDeptDwellTimeResponse {
  departments: RawDeptDwellTimeItem[];
}

export interface DeptDwellTimeEntry {
  departmentId: string;
  name: string;
  bins: Record<string, number>;
  totalVisits: number;
  avgDwellMinutes: number;
}

export interface DeptDwellTimeResponse {
  departments: DeptDwellTimeEntry[];
}

// ─── Camera Heatmap ────────────────────────────────────────────────────────

export interface CameraHeatmapEntry {
  cameraId: string;
  cameraName: string;
  department: string;
  isActive: boolean;
  imageUrl: string | null;
}

export interface CameraHeatmapResponse {
  cameras: CameraHeatmapEntry[];
}

// ─── Zones / Areas ──────────────────────────────────────────────────────────

export interface StoreZone {
  id: string;
  name: string;
  department: string;
  type: string;
}

export interface StoreZonesResponse {
  data: StoreZone[];
}

// ─── Operating Hours ────────────────────────────────────────────────────────

export interface OperatingHoursResponse {
  data: {
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  };
}

// ─── Customer Transitions (flow/funnel full response) ─────────────────────

export interface FlowCluster {
  clusterName: string;
  cameraCount: number;
  visitorCount: number;
  stage: number;
  conversionRate: number;
}

export interface TransitionEdge {
  fromCluster: string;
  toCluster: string;
  transitionCount: number;
}

export interface RawFlowFunnelFullResponse {
  clusters: Record<string, FlowCluster>;
  edges: TransitionEdge[];
  overallConversionRate: number;
}

export interface CustomerTransitionResponse {
  clusters: Record<string, FlowCluster>;
  edges: TransitionEdge[];
}

// ─── Date filter presets ────────────────────────────────────────────────────

export type DatePreset = 'today' | 'this-week' | 'last-week' | 'this-month' | 'custom';

export interface DateRange {
  preset: DatePreset;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
}

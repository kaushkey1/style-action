// ─── PulsePoint Task Engine ────────────────────────────────────────────────
// Generates flat, actionable tasks from real Smarti CCTV + NPS data.
// Each task is a single concrete instruction for the store manager.

import type { NPSMetrics, NPSVerbatim } from './npsUtils';
import type {
  AreaCountEntry,
  AttendedUnattendedEntry,
  DeptAttendedEntry,
  DeptDwellTimeEntry,
} from '../api/smartiTypes';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActionSeverity = 'S0' | 'S1' | 'S2';

export type ActionCategory =
  | 'Staff Coverage'
  | 'Staff Behaviour'
  | 'Queue Management'
  | 'Stock Availability'
  | 'Store Environment'
  | 'Conversion Drop'
  | 'NPS Recovery'
  | 'Operational';

export type ActionJourneyStage = 'Walk-in' | 'Trial' | 'Billing' | 'Others';

export type ActionSourceType = 'CCTV' | 'NPS Survey' | 'Audio' | 'Input Data' | 'Multi-Source';

export type TaskStatus = 'Open' | 'In Progress' | 'Escalated' | 'Resolved';

export interface PulsePointTask {
  id: string;
  task: string;
  severity: ActionSeverity;
  journeyStage: ActionJourneyStage;
  category: ActionCategory;
  sourceType: ActionSourceType;
  insight: string;
  owner: { role: string; name: string };
  status: TaskStatus;
  escalation: string | null;
  progress: string | null;
}

// Keep old types exported for backwards compatibility
export type ActionEvidence = { source: string; description: string; metric?: string };
export type ActionImpact = { metricImpact?: string; customersAffected?: number };
export interface PulsePointAction {
  id: string;
  title: string;
  description: string;
  severity: ActionSeverity;
  journeyStage: ActionJourneyStage;
  category: ActionCategory;
  status: 'Open';
  sourceType: ActionSourceType;
  evidence: ActionEvidence[];
  impact: ActionImpact;
  owner: { role: string; name: string };
  tasks: string[];
}

// ─── Configurable Thresholds ────────────────────────────────────────────────

export const ACTION_THRESHOLDS = {
  npsTargetMin: 75,
  npsSubRatingMin: 3.0,
  driverScoreNegativeThreshold: 0,
  driverSelectionMin: 20,
  conversionTargetMin: 15,
  funnelDropOffMax: 60,

  staffInteractionRateMin: 60,
  customerStaffRatioMax: 15,
  zoneServedRateMin: 20,
  dwellTimeMinMinutes: 2,
  departmentAttendedMin: 30,

  trialWaitMaxSeconds: 300,
  trialAssistanceRateMin: 50,
  singleQueueWaitMaxSeconds: 720,
  deptAttendanceRateMin: 40,

  billingWaitMaxSeconds: 480,
  billingMaxWaitMaxSeconds: 900,
  activeCounterMinPercent: 50,
  counterImbalanceRatio: 3,
} as const;

// ─── Verbatim Keyword Categories ────────────────────────────────────────────

const VERBATIM_KEYWORDS: Record<string, readonly string[]> = {
  staffRudeness: ['rude', 'disrespect', 'attitude', 'ignored', 'unhelpful', 'arrogant', 'not supportive', 'bad service', 'no smile', 'timepass', 'not willing', 'unprofessional', 'bad day', 'not even having', 'very bad', 'worst service'],
  waitQueue: ['wait', 'queue', 'slow', 'long time', 'standing', 'took forever', 'half hour', 'wasted time', 'time pass'],
  stockIssues: ['size not available', 'out of stock', 'couldn\'t find', 'limited options', 'no variety', 'sizes were les', 'no stock', 'not available', 'less collection', 'no collection', 'old stuff', 'not trendy', 'poor stock', 'proper size', 'hardly any stock', 'size and fit', 'brands just have', 'not getting billed'],
  environment: ['dirty', 'smell', 'hot', 'cold', 'ac not', 'messy', 'crowded', 'stinky', 'suffocating', 'humid', 'no ac', 'ac was not', 'no fan', 'horrible', 'air condition', 'not ironed', 'steel mill', 'exhausted', 'bed service', 'worst experience', 'poor condition'],
  trialRoom: ['trial room', 'fitting room', 'lock', 'mirror', 'trail room', 'changing room', 'try room'],
  staffPositive: ['helpful', 'amazing staff', 'thank you', 'excellent service', 'great service', 'professional', 'found us exactly', 'made up for'],
  billing: ['billing', 'credit note', 'exchange', 'return', 'refund', 'deducted', 'overcharged', 'wrong bill', 'late for billing', 'cash counter', 'invoice', 'payment', 'debited', 'not reflected', 'counter only', 'tester', 'system is not', 'counter was'],
  pricing: ['price', 'expensive', 'discount', 'offer', 'sale tag', 'value for money', 'overpriced', 'costly', 'discounts don', 'no discount', 'charge for', 'denied', 'inactive', 'bag'],
};

function matchesKeywords(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

// ─── Owner Assignment ───────────────────────────────────────────────────────

const STORE_MANAGER = { role: 'Store Manager', name: 'Rajesh Kumar' };
const DEPT_MANAGER = { role: 'Department Manager', name: 'Vikram Patel' };

function ownerBySeverity(severity: ActionSeverity): { role: string; name: string } {
  return severity === 'S0' ? STORE_MANAGER : DEPT_MANAGER;
}

// ─── Status + Escalation Assignment ─────────────────────────────────────────

function statusForSeverity(severity: ActionSeverity): TaskStatus {
  return severity === 'S0' ? 'Escalated' : 'Open';
}

function escalationForSeverity(severity: ActionSeverity): string | null {
  if (severity === 'S0') return 'Auto-escalated to Store Manager — requires action within 2 hours';
  if (severity === 'S1') return 'Escalate to Store Manager if unresolved in 4 hours';
  return null;
}

function progressForSeverity(severity: ActionSeverity): string {
  if (severity === 'S0') return 'Awaiting immediate action';
  if (severity === 'S1') return 'Pending assignment';
  return 'Queued for review';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

let taskCounter = 0;
function nextId(): string {
  taskCounter += 1;
  return `pp-${taskCounter}`;
}

function addTask(
  tasks: PulsePointTask[],
  task: string,
  severity: ActionSeverity,
  stage: ActionJourneyStage,
  category: ActionCategory,
  source: ActionSourceType,
  insight: string,
): void {
  tasks.push({
    id: nextId(),
    task,
    severity,
    journeyStage: stage,
    category,
    sourceType: source,
    insight,
    owner: ownerBySeverity(severity),
    status: statusForSeverity(severity),
    escalation: escalationForSeverity(severity),
    progress: progressForSeverity(severity),
  });
}

// ─── Generation Input ───────────────────────────────────────────────────────

export interface EmotionsOverall {
  neutral: number;
  positive: number;
  negative: number;
}

export interface TaskGenerationInput {
  nps: NPSMetrics;
  verbatims: NPSVerbatim[];

  totalFootfall: number;
  activeCustomers: number;
  activeStaff: number;

  attendedUnattended: AttendedUnattendedEntry[];
  allZones: AreaCountEntry[];
  deptAttended: DeptAttendedEntry[];
  deptDwellTime: DeptDwellTimeEntry[];

  totalBillingServed: number;
  totalTrialVisits: number;

  emotions: EmotionsOverall | null;
}

export type ActionGenerationInput = TaskGenerationInput;

// ─── Task Generation Engine ────────────────────────────────────────────────

export function generateTasks(input: TaskGenerationInput): PulsePointTask[] {
  taskCounter = 0;
  const tasks: PulsePointTask[] = [];
  const T = ACTION_THRESHOLDS;

  const {
    nps, verbatims, totalFootfall, activeCustomers, activeStaff,
    attendedUnattended, allZones, deptAttended, deptDwellTime,
    totalBillingServed, totalTrialVisits, emotions,
  } = input;

  const trialRoomZones = allZones.filter((z) => z.queueType === 'trial_room_queue');
  const cashCounterZones = allZones.filter((z) => z.queueType === 'cash_counters_queue');

  const totalAttended = attendedUnattended.reduce((s, a) => s + a.attended, 0);
  const totalUnattended = attendedUnattended.reduce((s, a) => s + a.unattended, 0);
  const totalInteractions = totalAttended + totalUnattended;
  const attendedRate = totalInteractions > 0 ? Math.round((totalAttended / totalInteractions) * 100) : 0;

  const avgTrialWait = trialRoomZones.length > 0
    ? trialRoomZones.reduce((s, z) => s + z.avgWaitTime, 0) / trialRoomZones.length : 0;
  const avgBillingWait = cashCounterZones.length > 0
    ? cashCounterZones.reduce((s, z) => s + z.avgWaitTime, 0) / cashCounterZones.length : 0;
  const maxBillingWait = cashCounterZones.length > 0
    ? Math.max(...cashCounterZones.map((z) => z.maxWaitTime)) : 0;
  const activeCashCounters = cashCounterZones.filter((z) => z.totalServed > 0).length;
  const conversionRate = totalFootfall > 0
    ? Math.round((totalBillingServed / totalFootfall) * 1000) / 10 : 0;

  // ════════════════════════════════════════════════════════════════════════
  // A — CCTV-derived tasks
  // ════════════════════════════════════════════════════════════════════════

  // Walk-In CCTV
  if (totalInteractions > 0 && attendedRate < T.staffInteractionRateMin) {
    addTask(tasks, `Redeploy ${Math.min(2, Math.ceil(totalUnattended / 50))} staff from back-office to the floor — only ${attendedRate}% of customers are being attended`, 'S1', 'Walk-in', 'Staff Coverage', 'CCTV', `CCTV: ${totalAttended} attended vs ${totalUnattended} unattended (${attendedRate}%, target ${T.staffInteractionRateMin}%)`);
    addTask(tasks, `Assign each floor staff a specific zone — no unassigned roaming until interaction rate hits ${T.staffInteractionRateMin}%`, 'S1', 'Walk-in', 'Staff Coverage', 'CCTV', `${totalUnattended} customers went unattended across all zones`);
  }

  if (activeStaff > 0) {
    const ratio = Math.round(activeCustomers / activeStaff);
    if (ratio > T.customerStaffRatioMax) {
      addTask(tasks, `Pull ${Math.min(3, Math.ceil((ratio - T.customerStaffRatioMax) / 5))} staff from back-office to the floor immediately — ratio is 1:${ratio}`, 'S1', 'Walk-in', 'Staff Coverage', 'CCTV', `Live: ${activeCustomers} customers to ${activeStaff} staff (1:${ratio}, max 1:${T.customerStaffRatioMax})`);
    }
  }

  if (totalFootfall > 0 && totalTrialVisits < totalFootfall) {
    const dropOff = Math.round(((totalFootfall - totalTrialVisits) / totalFootfall) * 100);
    if (dropOff > T.funnelDropOffMax) {
      addTask(tasks, `Station 1 dedicated greeter at store entrance during peak hours — ${dropOff}% of walk-ins leave without browsing`, 'S1', 'Walk-in', 'Conversion Drop', 'CCTV', `${totalFootfall} walk-ins, only ${totalTrialVisits} reached trial zones (${dropOff}% drop-off)`);
      addTask(tasks, 'Ensure first-visible merchandise at entrance is seasonally relevant and priced to draw browsers in', 'S2', 'Walk-in', 'Conversion Drop', 'CCTV', `${dropOff}% walk-in-to-trial drop-off`);
    }
  }

  for (const zone of allZones) {
    if (zone.totalVisits > 50) {
      const servedRate = zone.totalVisits > 0 ? (zone.totalServed / zone.totalVisits) * 100 : 0;
      if (servedRate < T.zoneServedRateMin)
        addTask(tasks, `Assign 1 dedicated staff to ${zone.areaName} for this shift — only ${Math.round(servedRate)}% of ${zone.totalVisits} visitors served`, 'S1', 'Walk-in', 'Staff Coverage', 'CCTV', `${zone.areaName}: ${zone.totalServed} served of ${zone.totalVisits} visits`);
    }
  }

  for (const dept of deptAttended) {
    if (dept.totalVisits > 0 && dept.attendedRate < T.departmentAttendedMin)
      addTask(tasks, `Reassign 1 staff to ${dept.name} — ${dept.unattended} customers went unassisted (${dept.attendedRate}% attendance)`, 'S1', 'Walk-in', 'Staff Coverage', 'CCTV', `${dept.name}: ${dept.attended} attended, ${dept.unattended} unattended`);
  }

  for (const dept of deptDwellTime) {
    if (dept.totalVisits > 0 && dept.avgDwellMinutes > 0 && dept.avgDwellMinutes < T.dwellTimeMinMinutes)
      addTask(tasks, `Walk ${dept.name} — check rack organization, size visibility, and navigation (avg dwell ${dept.avgDwellMinutes.toFixed(1)} min)`, 'S2', 'Walk-in', 'Store Environment', 'CCTV', `${dept.name}: ${dept.avgDwellMinutes.toFixed(1)} min avg dwell (below ${T.dwellTimeMinMinutes} min)`);
  }

  // Trial CCTV
  if (trialRoomZones.length > 0 && avgTrialWait > T.trialWaitMaxSeconds) {
    addTask(tasks, `Open all available trial rooms — confirm none are locked or used for storage. Avg wait: ${formatSeconds(avgTrialWait)}`, 'S1', 'Trial', 'Queue Management', 'CCTV', `Avg trial room wait: ${formatSeconds(avgTrialWait)} across ${trialRoomZones.length} rooms`);
    addTask(tasks, 'Assign 1 staff to manage the trial room queue and hand out tokens', 'S1', 'Trial', 'Queue Management', 'CCTV', `Trial room queue bottleneck: avg wait ${formatSeconds(avgTrialWait)}`);
  }

  if (totalInteractions > 0 && attendedRate < T.trialAssistanceRateMin)
    addTask(tasks, `Assign 1 staff to trial area to proactively approach customers carrying garments — only ${attendedRate}% getting help`, 'S1', 'Trial', 'Staff Coverage', 'CCTV', `Assistance rate: ${attendedRate}% (target ${T.trialAssistanceRateMin}%)`);

  for (const zone of trialRoomZones) {
    if (zone.maxWaitTime > T.singleQueueWaitMaxSeconds)
      addTask(tasks, `Check ${zone.areaName} now — max wait hit ${formatSeconds(zone.maxWaitTime)}. Identify bottleneck`, 'S1', 'Trial', 'Queue Management', 'CCTV', `${zone.areaName}: max wait ${formatSeconds(zone.maxWaitTime)}`);
  }

  for (const dept of deptAttended) {
    if (dept.totalVisits > 0 && dept.attendedRate < T.deptAttendanceRateMin && dept.attendedRate >= T.departmentAttendedMin)
      addTask(tasks, `Move 1 staff from a less busy department to ${dept.name} — attendance at ${dept.attendedRate}%`, 'S2', 'Trial', 'Staff Coverage', 'CCTV', `${dept.name}: ${dept.attended} attended of ${dept.totalVisits}`);
  }

  // Billing CCTV
  if (cashCounterZones.length > 0 && maxBillingWait > T.billingMaxWaitMaxSeconds) {
    addTask(tasks, `Open all ${cashCounterZones.length} counters NOW and deploy 1 queue marshal — max wait hit ${formatSeconds(maxBillingWait)}`, 'S0', 'Billing', 'Queue Management', 'CCTV', `Max billing wait: ${formatSeconds(maxBillingWait)} (critical: ${formatSeconds(T.billingMaxWaitMaxSeconds)})`);
    addTask(tasks, `Escalate to Area Manager if wait doesn't drop below ${formatSeconds(T.billingMaxWaitMaxSeconds)} within 30 min`, 'S0', 'Billing', 'Queue Management', 'CCTV', `Customer abandonment risk at ${formatSeconds(maxBillingWait)} max wait`);
  }

  if (cashCounterZones.length > 0 && avgBillingWait > T.billingWaitMaxSeconds) {
    const idle = cashCounterZones.length - activeCashCounters;
    addTask(tasks, `Open ${idle > 0 ? `${idle} idle counter${idle > 1 ? 's' : ''}` : 'additional counters'} — avg billing wait is ${formatSeconds(avgBillingWait)}`, 'S1', 'Billing', 'Queue Management', 'CCTV', `Avg billing wait: ${formatSeconds(avgBillingWait)} (max ${formatSeconds(T.billingWaitMaxSeconds)})`);
  }

  if (cashCounterZones.length > 0) {
    const pct = Math.round((activeCashCounters / cashCounterZones.length) * 100);
    if (pct < T.activeCounterMinPercent)
      addTask(tasks, `Staff and open ${cashCounterZones.length - activeCashCounters} idle counter${cashCounterZones.length - activeCashCounters > 1 ? 's' : ''} within 15 min — only ${activeCashCounters}/${cashCounterZones.length} active`, 'S1', 'Billing', 'Operational', 'CCTV', `Counter utilization: ${pct}% (target ${T.activeCounterMinPercent}%)`);
  }

  if (cashCounterZones.length >= 2) {
    const served = cashCounterZones.map((z) => z.totalServed).filter((s) => s > 0);
    if (served.length >= 2) {
      const mx = Math.max(...served), mn = Math.min(...served);
      if (mn > 0 && mx / mn > T.counterImbalanceRatio) {
        const minC = cashCounterZones.find((z) => z.totalServed === mn);
        addTask(tasks, `Redirect queue: send customers to ${minC?.areaName ?? 'underutilized counter'} until load balances (${mx} vs ${mn} served)`, 'S2', 'Billing', 'Operational', 'CCTV', `Counter imbalance: ${mx} vs ${mn} served`);
      }
    }
  }

  // Blended CCTV + NPS
  if (emotions !== null && emotions.negative > 25 && nps.detractors > 0) {
    const dp = nps.totalResponses > 0 ? Math.round((nps.detractors / nps.totalResponses) * 100) : 0;
    addTask(tasks, `Full floor walk during next peak hour — ${emotions.negative}% negative emotion (CCTV) + ${dp}% NPS detractors. Note staff behaviour, cleanliness, waits`, emotions.negative > 40 ? 'S0' : 'S1', 'Walk-in', 'Store Environment', 'Multi-Source', `CCTV emotion: ${emotions.negative}% negative. NPS: ${nps.detractors} detractors of ${nps.totalResponses}`);
  }

  // ════════════════════════════════════════════════════════════════════════
  // B — NPS-derived tasks
  // ════════════════════════════════════════════════════════════════════════

  if (nps.totalResponses > 0 && nps.overallScore < T.npsTargetMin) {
    addTask(tasks, 'Call back the 3 most recent detractors within 24 hours — understand their issues and offer resolution', 'S1', 'Others', 'NPS Recovery', 'NPS Survey', `NPS: ${nps.overallScore} (target ${T.npsTargetMin}). ${nps.detractors} detractors of ${nps.totalResponses}`);
    addTask(tasks, 'Hold 15-min stand-up with floor staff: share top 2 NPS complaint themes and agree on corrective actions', 'S1', 'Others', 'NPS Recovery', 'NPS Survey', `${nps.detractors} detractors — team needs to know complaint patterns`);
  }

  if (totalFootfall > 0 && conversionRate < T.conversionTargetMin)
    addTask(tasks, `Review CCTV walk-in-to-trial footage for last 2 peak hours — identify where customers leave (conversion ${conversionRate}%)`, 'S1', 'Others', 'Conversion Drop', 'Multi-Source', `${totalBillingServed} of ${totalFootfall} walk-ins reached billing (${conversionRate}%, target ${T.conversionTargetMin}%)`);

  for (const driver of nps.reasonBreakdown) {
    if (driver.driverScore < T.driverScoreNegativeThreshold && driver.selectedPercent >= T.driverSelectionMin)
      addTask(tasks, `Read all ${driver.selectedCount} verbatims citing "${driver.label}" — identify top 2 sub-complaints and assign an owner to each`, 'S1', 'Others', 'NPS Recovery', 'NPS Survey', `"${driver.label}" driver score: ${driver.driverScore}. Cited by ${driver.selectedPercent}% of respondents`);
  }

  // ── Verbatim-level tasks ─────────────────────────────────────────────

  const allFeedback = verbatims.filter((v) => v.feedback.trim().length > 10);
  const detractors = allFeedback.filter((v) => v.category === 'detractor');
  const passives = allFeedback.filter((v) => v.category === 'passive');
  const promoters = allFeedback.filter((v) => v.category === 'promoter');

  // Staff rudeness
  const rude = [...detractors, ...passives].filter((v) => matchesKeywords(v.feedback, VERBATIM_KEYWORDS.staffRudeness ?? []));
  if (rude.length > 0) {
    addTask(tasks, `Pull shift roster for dates of ${rude.length} rudeness complaint${rude.length > 1 ? 's' : ''} — identify which staff were on floor`, rude.length >= 3 ? 'S0' : 'S1', 'Walk-in', 'Staff Behaviour', 'Multi-Source', `${rude.length} customers report rudeness: "${rude[0]?.feedback.slice(0, 80)}..."`);
    addTask(tasks, 'Conduct 1-on-1 coaching with identified staff within 48 hours — share exact verbatim feedback', rude.length >= 3 ? 'S0' : 'S1', 'Walk-in', 'Staff Behaviour', 'Audio', `${rude.length} rudeness/unhelpful complaints`);
    if (rude.length >= 3)
      addTask(tasks, 'Assign floor supervisor to monitor staff-customer interactions during peak hours for next 3 days', 'S0', 'Walk-in', 'Staff Behaviour', 'Multi-Source', `Recurring staff issue: ${rude.length} complaints`);
  }

  // Environment / AC
  const env = [...detractors, ...passives].filter((v) => matchesKeywords(v.feedback, VERBATIM_KEYWORDS.environment ?? []));
  if (env.length > 0) {
    const acIssues = env.filter((v) => /ac|air condition|hot|suffocating|humid|fan/i.test(v.feedback));
    const cleanIssues = env.filter((v) => /dirty|smell|stinky|messy|horrible/i.test(v.feedback));

    if (acIssues.length > 0)
      addTask(tasks, `Check all AC units NOW — ${acIssues.length} customer${acIssues.length > 1 ? 's' : ''} reported heat/AC failure`, acIssues.length >= 5 ? 'S0' : 'S1', 'Walk-in', 'Store Environment', 'NPS Survey', `"${acIssues[0]?.feedback.slice(0, 80)}..."`);

    if (cleanIssues.length > 0)
      addTask(tasks, `Deep-clean areas mentioned in complaints before tomorrow's opening — ${cleanIssues.length} cleanliness complaint${cleanIssues.length > 1 ? 's' : ''}`, 'S2', 'Walk-in', 'Store Environment', 'NPS Survey', `"${cleanIssues[0]?.feedback.slice(0, 80)}..."`);

    addTask(tasks, `Walk full store noting cleanliness, temperature, and organization — ${env.length} environment complaints total`, 'S1', 'Walk-in', 'Store Environment', 'NPS Survey', `${env.length} environment complaints from detractors + passives`);
  }

  // Trial room
  const trial = [...detractors, ...passives].filter((v) => matchesKeywords(v.feedback, VERBATIM_KEYWORDS.trialRoom ?? []));
  if (trial.length > 0) {
    addTask(tasks, `Inspect all trial rooms: locks, mirrors, lighting, hooks, cleanliness, AC — ${trial.length} complaint${trial.length > 1 ? 's' : ''}`, trial.length >= 3 ? 'S1' : 'S2', 'Trial', 'Queue Management', avgTrialWait > T.trialWaitMaxSeconds ? 'Multi-Source' : 'NPS Survey', `"${trial[0]?.feedback.slice(0, 80)}..."`);
    addTask(tasks, 'Fix or report broken locks, faulty lights, missing mirrors to maintenance today', 'S2', 'Trial', 'Store Environment', 'NPS Survey', `${trial.length} trial room complaints need physical check`);
  }

  // Stock / size
  const stock = [...detractors, ...passives].filter((v) => matchesKeywords(v.feedback, VERBATIM_KEYWORDS.stockIssues ?? []));
  if (stock.length > 0) {
    addTask(tasks, `Run inventory check on top 5 selling SKUs per department — ${stock.length} customer${stock.length > 1 ? 's' : ''} report availability issues`, stock.length >= 3 ? 'S1' : 'S2', 'Trial', 'Stock Availability', 'NPS Survey', `"${stock[0]?.feedback.slice(0, 80)}..."`);
    addTask(tasks, 'Escalate critical size gaps (S/M/L in top categories) to buying team today', stock.length >= 5 ? 'S1' : 'S2', 'Trial', 'Stock Availability', 'NPS Survey', `${stock.length} stock/size complaints`);
    const lowDwell = deptDwellTime.filter((d) => d.totalVisits > 0 && d.avgDwellMinutes > 0 && d.avgDwellMinutes < T.dwellTimeMinMinutes);
    if (lowDwell.length > 0)
      addTask(tasks, `Check merchandise in ${lowDwell.map((d) => d.name).join(', ')} — CCTV shows low dwell + customers report stock gaps`, 'S1', 'Trial', 'Stock Availability', 'Multi-Source', `Stock complaints + low dwell in ${lowDwell.length} dept${lowDwell.length > 1 ? 's' : ''}`);
  }

  // Wait / queue from NPS
  const wait = [...detractors, ...passives].filter((v) => matchesKeywords(v.feedback, VERBATIM_KEYWORDS.waitQueue ?? []));
  if (wait.length > 0) {
    const cctvOk = avgBillingWait > T.billingWaitMaxSeconds || avgTrialWait > T.trialWaitMaxSeconds;
    addTask(tasks, `Identify which queue (trial or billing) is causing ${wait.length} wait complaint${wait.length > 1 ? 's' : ''} and prioritize that area`, wait.length >= 3 ? 'S1' : 'S2', 'Billing', 'Queue Management', cctvOk ? 'Multi-Source' : 'NPS Survey', `${wait.length} wait complaints.${cctvOk ? ` CCTV: billing ${formatSeconds(avgBillingWait)}, trial ${formatSeconds(avgTrialWait)}` : ''}`);
  }

  // Billing process
  const bill = [...detractors, ...passives].filter((v) => matchesKeywords(v.feedback, VERBATIM_KEYWORDS.billing ?? []));
  if (bill.length > 0) {
    addTask(tasks, `Audit last 10 exchange/return/credit-note transactions for SOP compliance — ${bill.length} billing complaint${bill.length > 1 ? 's' : ''}`, bill.length >= 3 ? 'S1' : 'S2', 'Billing', 'Queue Management', 'NPS Survey', `"${bill[0]?.feedback.slice(0, 80)}..."`);
    addTask(tasks, 'Retrain billing staff on credit note and exchange SOP if policy gaps found', 'S2', 'Billing', 'Operational', 'NPS Survey', `${bill.length} billing process complaints`);
  }

  // Pricing
  const price = [...detractors, ...passives].filter((v) => matchesKeywords(v.feedback, VERBATIM_KEYWORDS.pricing ?? []));
  if (price.length > 0) {
    addTask(tasks, `Audit all sale tags — ensure displayed discounts match POS prices. ${price.length} pricing complaint${price.length > 1 ? 's' : ''}`, price.length >= 3 ? 'S1' : 'S2', 'Others', 'NPS Recovery', 'NPS Survey', `"${price[0]?.feedback.slice(0, 80)}..."`);
    addTask(tasks, 'Remove or update expired/misleading offer signage immediately', 'S2', 'Others', 'NPS Recovery', 'NPS Survey', `${price.length} pricing complaints — signage mismatch likely`);
    addTask(tasks, 'Brief billing staff on current promotion rules so they can explain discounts accurately', 'S2', 'Billing', 'Operational', 'NPS Survey', 'Customers report staff denying valid discounts');
  }

  // Staff praise
  const praise = promoters.filter((v) => matchesKeywords(v.feedback, VERBATIM_KEYWORDS.staffPositive ?? []));
  if (praise.length > 0)
    addTask(tasks, `Share ${praise.length} positive verbatim${praise.length > 1 ? 's' : ''} in tomorrow's huddle — identify and publicly recognize praised staff`, 'S2', 'Walk-in', 'Staff Behaviour', 'NPS Survey', `"${praise[0]?.feedback.slice(0, 80)}..."`);

  // ── NPS sub-rating tasks ─────────────────────────────────────────────

  for (const sr of nps.subRatings) {
    if (sr.score > 0 && sr.score < T.npsSubRatingMin) {
      const stage: ActionJourneyStage = sr.label.includes('Trial') ? 'Trial' : sr.label.includes('Billing') ? 'Billing' : sr.label.includes('Staff') ? 'Walk-in' : 'Others';
      const cat: ActionCategory = sr.label.includes('Staff') ? 'Staff Behaviour' : sr.label.includes('Billing') ? 'Queue Management' : sr.label.includes('Product') || sr.label.includes('Availability') ? 'Stock Availability' : 'Store Environment';
      addTask(tasks, `Investigate ${sr.label} (rated ${sr.score}/5) — walk the area and note 3 concrete issues to fix this week`, 'S2', stage, cat, 'NPS Survey', `${sr.label}: ${sr.score}/5 (threshold ${T.npsSubRatingMin})`);
    }
  }

  // Sort: S0 → S1 → S2
  const severityOrder: Record<ActionSeverity, number> = { S0: 0, S1: 1, S2: 2 };
  tasks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return tasks;
}

export function generateActions(_: ActionGenerationInput): PulsePointAction[] {
  void _;
  return [];
}

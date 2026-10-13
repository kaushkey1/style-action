export type GateType =
  | "otb-approval"
  | "otb-lock"
  | "style-closure"
  | "buy-plan"
  | "space-plan"
  | "capacity-booking"
  | "range-review"
  | "sm-validation"
  | "phase-transition"
  | "liquidation-routing"
  | "chase-order"
  | "below-cost-markdown";

export type GateStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "escalated"
  | "auto-approved";

export interface HumanGateContext {
  summary: string;
  dataPoints: {
    label: string;
    value: string;
    status?: "on-track" | "warning" | "critical";
  }[];
  agentRecommendation: string;
  alternatives?: string[];
  financialImpact?: string;
  cascadeRisk?: string;
}

export interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
}

export interface HumanGate {
  id: string;
  type: GateType;
  title: string;
  nDayLabel: string;
  agentId: string;
  agentName: string;
  approverRole: string;
  dualSignOff?: string;
  slaHours: number;
  autoApproveAfterHours?: number;
  escalateTo: string;
  status: GateStatus;
  createdAt: string;
  slaDeadline: string;
  context: HumanGateContext;
  auditTrail?: AuditEntry[];
}

export const mockHumanGates: HumanGate[] = [
  // 1. OTB Approval
  {
    id: "a1b2c3d4-g001-4a5b-8c6d-7e8f9a0b1c2d",
    type: "otb-approval",
    title: "OTB Approval: Summer '26 Menswear Casual",
    nDayLabel: "N-90",
    agentId: "b5e6f7a8-9c0d-4e1f-2a3b-4c5d6e7f8a9b",
    agentName: "Planning Copilot",
    approverRole: "Category Head",
    slaHours: 24,
    escalateTo: "Category Director",
    status: "pending",
    createdAt: "2026-02-18T09:00:00Z",
    slaDeadline: "2026-02-19T09:00:00Z",
    context: {
      summary:
        "Planning Copilot has prepared the OTB proposal for Summer 2026 Menswear Casual. Budget of \u20B918.5 Cr represents a 12% increase over last season, driven by strong casual wear demand signals and expanded store count.",
      dataPoints: [
        { label: "Proposed OTB", value: "\u20B918.5 Cr", status: "on-track" },
        {
          label: "Last Season OTB",
          value: "\u20B916.5 Cr",
          status: "on-track",
        },
        { label: "YoY Growth", value: "+12%", status: "warning" },
        {
          label: "Category Sell-Through (LY)",
          value: "78%",
          status: "on-track",
        },
        {
          label: "New Store Additions",
          value: "14 stores",
          status: "on-track",
        },
        { label: "Avg Margin Target", value: "52%", status: "on-track" },
      ],
      agentRecommendation:
        "Approve at \u20B918.5 Cr. Demand signals from FTF indicate strong casual category growth. Like-for-like sell-through improvement of 4pp supports the uplift. New store pipeline adds incremental demand.",
      alternatives: [
        "Approve at \u20B916.5 Cr (flat vs LY) \u2014 conservative, risks stockouts in high-growth sub-categories",
        "Approve at \u20B917.5 Cr (+6%) \u2014 moderate uplift covering new stores only",
      ],
      financialImpact:
        "Approving enables \u20B918.5 Cr buy plan execution; delay risks 2-week sourcing window",
    },
  },

  // 2. OTB Lock
  {
    id: "a1b2c3d4-g002-4a5b-8c6d-7e8f9a0b1c2d",
    type: "otb-lock",
    title: "OTB Lock: Womenswear Western SS26",
    nDayLabel: "N-60",
    agentId: "b5e6f7a8-9c0d-4e1f-2a3b-4c5d6e7f8a9b",
    agentName: "Planning Copilot",
    approverRole: "Category Head",
    dualSignOff: "Finance Head",
    slaHours: 48,
    escalateTo: "Business Head",
    status: "pending",
    createdAt: "2026-02-17T14:30:00Z",
    slaDeadline: "2026-02-19T14:30:00Z",
    context: {
      summary:
        "Final OTB lock for Womenswear Western SS26 at \u20B915.2 Cr. This is 3.4% below the initial plan of \u20B915.73 Cr due to revised demand forecast after early-season signals. Dual sign-off required from Category Head and Finance Head.",
      dataPoints: [
        { label: "Final OTB", value: "\u20B915.2 Cr", status: "on-track" },
        { label: "Initial Plan", value: "\u20B915.73 Cr", status: "on-track" },
        { label: "Variance", value: "-3.4%", status: "warning" },
        {
          label: "Committed POs",
          value: "\u20B96.8 Cr (45%)",
          status: "on-track",
        },
        { label: "Open-to-Commit", value: "\u20B98.4 Cr", status: "on-track" },
        { label: "Vendor Readiness", value: "92%", status: "on-track" },
      ],
      agentRecommendation:
        "Lock at \u20B915.2 Cr. The 3.4% reduction reflects updated demand sensing \u2014 Western casualwear demand softened in Tier-2 markets. Committed PO pipeline is healthy at 45%.",
      alternatives: [
        "Lock at \u20B915.73 Cr (original plan) \u2014 carries \u20B953 L excess inventory risk",
        "Lock at \u20B914.5 Cr (-7.8%) \u2014 aggressive cut, risks under-serving Tier-1 stores",
      ],
      financialImpact:
        "Locking releases \u20B98.4 Cr open-to-commit for PO generation; 48h delay compresses vendor lead times by 1 week",
      cascadeRisk:
        "Late lock impacts downstream capacity booking with 3 key vendors",
    },
  },

  // 3. Buy Plan Approval
  {
    id: "a1b2c3d4-g003-4a5b-8c6d-7e8f9a0b1c2d",
    type: "buy-plan",
    title: "Buy Plan Approval: Footwear SS26",
    nDayLabel: "N-75",
    agentId: "f1c2d3e4-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
    agentName: "Range Architect",
    approverRole: "Head of Buying",
    slaHours: 24,
    escalateTo: "Category Director",
    status: "approved",
    createdAt: "2026-02-14T10:00:00Z",
    slaDeadline: "2026-02-15T10:00:00Z",
    context: {
      summary:
        "Buy plan for Footwear SS26 covering 320 SKUs across 5 sub-categories. Total buy value \u20B99.8 Cr with 58% margin target. Range Architect has optimized the assortment based on store-cluster demand mapping.",
      dataPoints: [
        { label: "Total SKUs", value: "320", status: "on-track" },
        { label: "Buy Value", value: "\u20B99.8 Cr", status: "on-track" },
        { label: "Target Margin", value: "58%", status: "on-track" },
        {
          label: "Carry-Forward Styles",
          value: "45 (14%)",
          status: "on-track",
        },
        { label: "New Introductions", value: "275 (86%)", status: "warning" },
        { label: "Store Coverage", value: "142 stores", status: "on-track" },
      ],
      agentRecommendation:
        "Approve. Assortment is well-balanced across price tiers. New introduction rate of 86% is high but justified by trend data showing shift in customer preferences toward athleisure and slides.",
      financialImpact:
        "Approved buy plan enables PO generation pipeline for 142 stores; vendor capacity windows open",
    },
    auditTrail: [
      {
        timestamp: "2026-02-14T10:00:00Z",
        actor: "Range Architect (RA1)",
        action: "Gate created",
        notes: "Buy plan prepared with store-cluster optimization",
      },
      {
        timestamp: "2026-02-14T16:45:00Z",
        actor: "Rajesh Menon (Head of Buying)",
        action: "Approved",
        notes:
          "Approved with condition: review athleisure allocation after Week 2 sales data",
      },
    ],
  },

  // 4. Range Review
  {
    id: "a1b2c3d4-g004-4a5b-8c6d-7e8f9a0b1c2d",
    type: "range-review",
    title: "Range Review Gate: Kidswear AW26",
    nDayLabel: "N-120",
    agentId: "f1c2d3e4-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
    agentName: "Range Architect",
    approverRole: "Design Head",
    slaHours: 48,
    escalateTo: "Category Director",
    status: "pending",
    createdAt: "2026-02-19T11:00:00Z",
    slaDeadline: "2026-02-21T11:00:00Z",
    context: {
      summary:
        "Range review for Kidswear AW26 season. 450 styles proposed by design team against a 380-style cap set by Planning Copilot. Range Architect recommends trimming 70 styles based on historical sell-through and trend lifecycle analysis.",
      dataPoints: [
        { label: "Proposed Styles", value: "450", status: "critical" },
        { label: "Style Cap", value: "380", status: "on-track" },
        { label: "Excess", value: "70 styles (18%)", status: "critical" },
        { label: "Avg Style Depth", value: "120 units", status: "on-track" },
        { label: "Trend-Aligned %", value: "72%", status: "on-track" },
        {
          label: "Carry-Forward Candidates",
          value: "35 styles",
          status: "warning",
        },
      ],
      agentRecommendation:
        "Trim to 380 styles. Recommend removing 40 low-confidence trend styles (FTF score <0.4) and 30 carry-forward styles with sell-through below 60% last season. This preserves OTB discipline while maintaining fresh assortment.",
      alternatives: [
        "Approve 420 styles with reduced depth (avg 100 units) \u2014 same OTB, wider but shallower range",
        "Approve 380 styles strict \u2014 trim all carry-forwards below 65% sell-through",
        "Request Design Head to re-prioritize and resubmit within 72h",
      ],
      cascadeRisk:
        "Exceeding style cap by 18% will breach OTB allocation and compress per-style investment",
    },
  },

  // 5. Style Closure
  {
    id: "a1b2c3d4-g005-4a5b-8c6d-7e8f9a0b1c2d",
    type: "style-closure",
    title: "Style Closure: Menswear Formal Q1",
    nDayLabel: "N-45",
    agentId: "d3a4b5c6-7e8f-4a9b-0c1d-2e3f4a5b6c7d",
    agentName: "Style Optimizer",
    approverRole: "Senior Merchandiser",
    slaHours: 12,
    escalateTo: "Category Head",
    status: "escalated",
    createdAt: "2026-02-18T06:00:00Z",
    slaDeadline: "2026-02-18T18:00:00Z",
    context: {
      summary:
        "Style Optimizer identified 28 underperforming styles in Menswear Formal for closure. Average sell-through is 34% at Week 8, well below the 55% benchmark. SLA breached \u2014 escalated to Category Head after Senior Merchandiser did not respond within 12h window.",
      dataPoints: [
        { label: "Styles for Closure", value: "28", status: "critical" },
        { label: "Avg Sell-Through", value: "34%", status: "critical" },
        { label: "Benchmark", value: "55%", status: "on-track" },
        {
          label: "Inventory at Risk",
          value: "\u20B92.1 Cr",
          status: "critical",
        },
        { label: "Weeks in Store", value: "8", status: "warning" },
        {
          label: "Recommended Action",
          value: "Markdown + Redistribute",
          status: "warning",
        },
      ],
      agentRecommendation:
        "Close 28 styles immediately. Initiate 20% markdown on 18 styles with some demand signal; route remaining 10 to outlet stores. Every week of delay adds \u20B98 L in carrying cost.",
      financialImpact:
        "Delayed closure costs \u20B98 L/week in carrying costs; early action recovers estimated \u20B91.4 Cr through markdown vs \u20B90.9 Cr if delayed 4 weeks",
      cascadeRisk:
        "Blocked closure delays space release needed for SS26 Casual intake at 42 stores",
    },
    auditTrail: [
      {
        timestamp: "2026-02-18T06:00:00Z",
        actor: "Style Optimizer (A8)",
        action: "Gate created",
        notes: "28 styles flagged for closure based on sell-through analysis",
      },
      {
        timestamp: "2026-02-18T18:05:00Z",
        actor: "System",
        action: "SLA breached \u2014 escalated",
        notes:
          "Senior Merchandiser did not respond within 12h SLA; escalated to Category Head",
      },
    ],
  },

  // 6. Space Plan
  {
    id: "a1b2c3d4-g006-4a5b-8c6d-7e8f9a0b1c2d",
    type: "space-plan",
    title: "Space Plan Approval: Store TRS-0142 Refit",
    nDayLabel: "N-30",
    agentId: "c6f7a8b9-0d1e-4f2a-3b4c-5d6e7f8a9b0c",
    agentName: "Space Optimizer",
    approverRole: "Ops Head",
    slaHours: 24,
    escalateTo: "Business Head",
    status: "pending",
    createdAt: "2026-02-19T08:00:00Z",
    slaDeadline: "2026-02-20T08:00:00Z",
    context: {
      summary:
        "Space Optimizer recommends 15% space reallocation at Store TRS-0142 (Inorbit Mall, Hyderabad). Shift from Formal (currently over-spaced at 30%) to Casual (under-spaced at 25%) based on 6-month sell-through data and footfall heatmaps.",
      dataPoints: [
        { label: "Formal Current Share", value: "30%", status: "warning" },
        { label: "Formal Sell-Through", value: "42%", status: "critical" },
        { label: "Casual Current Share", value: "25%", status: "warning" },
        { label: "Casual Sell-Through", value: "81%", status: "on-track" },
        { label: "Proposed Formal Share", value: "20%", status: "on-track" },
        { label: "Proposed Casual Share", value: "35%", status: "on-track" },
      ],
      agentRecommendation:
        "Approve refit plan. Casual sell-through at 81% vs Formal at 42% strongly supports reallocation. Projected revenue uplift of \u20B918 L/quarter from better space productivity. Refit can be completed in 3 days with minimal store downtime.",
      alternatives: [
        "Partial refit: 10% shift only \u2014 lower disruption, lower upside (\u20B911 L/quarter)",
        "Defer to post-SS26 launch \u2014 avoid disruption during season transition",
      ],
      financialImpact:
        "Projected \u20B918 L/quarter revenue uplift from improved space productivity; refit cost \u20B92.5 L",
    },
  },

  // 7. Capacity Booking
  {
    id: "a1b2c3d4-g007-4a5b-8c6d-7e8f9a0b1c2d",
    type: "capacity-booking",
    title: "Capacity Booking: Vendor V-2847",
    nDayLabel: "N-85",
    agentId: "f5c6d7e8-9a0b-4c1d-2e3f-4a5b6c7d8e9f",
    agentName: "Sourcing Co-pilot",
    approverRole: "Head of Sourcing",
    slaHours: 24,
    escalateTo: "Category Director",
    status: "approved",
    createdAt: "2026-02-15T07:30:00Z",
    slaDeadline: "2026-02-16T07:30:00Z",
    context: {
      summary:
        "Capacity booking request for Vendor V-2847 (Surat Textiles Ltd) for SS26 Womenswear Ethnic. 45,000 units across 3 production lines, delivery window March 15\u2013April 30. Vendor compliance score 94% and on-time delivery rate 91%.",
      dataPoints: [
        { label: "Units Booked", value: "45,000", status: "on-track" },
        { label: "Production Lines", value: "3", status: "on-track" },
        {
          label: "Delivery Window",
          value: "Mar 15 \u2013 Apr 30",
          status: "on-track",
        },
        { label: "Vendor Compliance", value: "94%", status: "on-track" },
        { label: "On-Time Delivery", value: "91%", status: "on-track" },
        { label: "Cost per Unit", value: "\u20B9485", status: "on-track" },
      ],
      agentRecommendation:
        "Approve capacity booking. Vendor V-2847 is a Tier-1 supplier with strong compliance history. Booking now secures preferred production slots; 1-week delay risks slot allocation to competitor brands.",
      financialImpact:
        "Booking value \u20B92.18 Cr; early booking secures 8% cost advantage vs spot capacity",
    },
    auditTrail: [
      {
        timestamp: "2026-02-15T07:30:00Z",
        actor: "Sourcing Co-pilot (A10)",
        action: "Gate created",
        notes:
          "Capacity booking prepared based on OTB allocation and vendor scorecard",
      },
      {
        timestamp: "2026-02-15T14:20:00Z",
        actor: "Priya Sharma (Head of Sourcing)",
        action: "Approved",
        notes: "Approved. Confirmed vendor slot availability via direct check.",
      },
    ],
  },

  // 8. SM Validation
  {
    id: "a1b2c3d4-g008-4a5b-8c6d-7e8f9a0b1c2d",
    type: "sm-validation",
    title: "SM Validation: Markdown Batch MW-2026-Q1",
    nDayLabel: "N+45",
    agentId: "a2d3e4f5-6b7c-4d8e-9f0a-1b2c3d4e5f6a",
    agentName: "Liquidation Trigger",
    approverRole: "Store Manager",
    slaHours: 48,
    autoApproveAfterHours: 48,
    escalateTo: "Area Manager",
    status: "pending",
    createdAt: "2026-02-19T10:00:00Z",
    slaDeadline: "2026-02-21T10:00:00Z",
    context: {
      summary:
        "Store Manager validation required for markdown batch MW-2026-Q1 at Store TRS-0087 (Phoenix Mall, Mumbai). 12 styles identified for 15% average markdown. Auto-approves after 48h if Store Manager does not respond \u2014 designed to prevent SM inaction from blocking liquidation flow.",
      dataPoints: [
        { label: "Styles in Batch", value: "12", status: "warning" },
        { label: "Avg Markdown%", value: "15%", status: "warning" },
        { label: "Current Sell-Through", value: "38%", status: "critical" },
        { label: "Weeks on Floor", value: "6", status: "warning" },
        { label: "Revenue at Risk", value: "\u20B94.2 L", status: "warning" },
        { label: "Auto-Approve In", value: "48h", status: "on-track" },
      ],
      agentRecommendation:
        "Apply 15% markdown on 12 styles. Sell-through at 38% after 6 weeks is below the 50% Week-6 benchmark. Markdown now maximizes recovery; further delay reduces recovery rate by ~2% per week.",
      alternatives: [
        "SM can override to 10% markdown \u2014 lower discount, slower clearance",
        "SM can exclude up to 3 styles with local demand justification",
      ],
      financialImpact:
        "Markdown recovers estimated \u20B93.6 L vs \u20B92.9 L if delayed 2 more weeks",
    },
  },

  // 9. Phase Transition
  {
    id: "a1b2c3d4-g009-4a5b-8c6d-7e8f9a0b1c2d",
    type: "phase-transition",
    title: "Phase Transition: Summer '26 Drop 3 PLAN\u2192BUY",
    nDayLabel: "N-60",
    agentId: "b5e6f7a8-9c0d-4e1f-2a3b-4c5d6e7f8a9b",
    agentName: "Planning Copilot",
    approverRole: "Category Director",
    slaHours: 24,
    escalateTo: "Business Head",
    status: "pending",
    createdAt: "2026-02-20T06:00:00Z",
    slaDeadline: "2026-02-21T06:00:00Z",
    context: {
      summary:
        "All plan-phase milestones for Summer '26 Drop 3 are complete. OTB approved, range finalized at 285 styles, vendor capacity confirmed. Planning Copilot recommends transitioning to BUY phase to initiate PO generation.",
      dataPoints: [
        { label: "OTB Status", value: "Approved", status: "on-track" },
        { label: "Range Finalized", value: "285 styles", status: "on-track" },
        { label: "Vendor Capacity", value: "Confirmed", status: "on-track" },
        { label: "Design Sign-Off", value: "Complete", status: "on-track" },
        { label: "Costing Validated", value: "98% styles", status: "on-track" },
        { label: "Time to N-Day", value: "60 days", status: "on-track" },
      ],
      agentRecommendation:
        "Approve phase transition. All 5 plan-phase gates are green. Moving to BUY phase enables PO generation for 285 styles across 18 vendors. Delaying transition compresses the buy cycle.",
      financialImpact:
        "Timely transition preserves full 60-day buy cycle; each day of delay reduces vendor negotiation leverage",
      cascadeRisk:
        "Late transition cascades into compressed QC timelines and potential dispatch delays",
    },
  },

  // 10. Liquidation Routing
  {
    id: "a1b2c3d4-g010-4a5b-8c6d-7e8f9a0b1c2d",
    type: "liquidation-routing",
    title: "Liquidation Routing: 180+ Day Stock Batch LQ-0089",
    nDayLabel: "N+180",
    agentId: "a2d3e4f5-6b7c-4d8e-9f0a-1b2c3d4e5f6a",
    agentName: "Liquidation Trigger",
    approverRole: "Category Head",
    dualSignOff: "Finance Head",
    slaHours: 12,
    escalateTo: "Business Head",
    status: "pending",
    createdAt: "2026-02-20T07:00:00Z",
    slaDeadline: "2026-02-20T19:00:00Z",
    context: {
      summary:
        "Liquidation routing decision for 2,400 units of 180+ day aged stock (Batch LQ-0089). Book value \u20B938 L, proposed B2B outlet channel sale at \u20B915 L. Stock is occupying 1,200 sq ft of warehouse space needed for AW26 intake.",
      dataPoints: [
        { label: "Units", value: "2,400", status: "critical" },
        { label: "Book Value", value: "\u20B938 L", status: "critical" },
        {
          label: "Proposed Sale Value",
          value: "\u20B915 L",
          status: "critical",
        },
        { label: "Recovery Rate", value: "39%", status: "critical" },
        { label: "Days in Stock", value: "180+", status: "critical" },
        {
          label: "Warehouse Space Blocked",
          value: "1,200 sq ft",
          status: "warning",
        },
      ],
      agentRecommendation:
        "Route to B2B outlet at \u20B915 L. Recovery rate of 39% is within acceptable range for 180+ day stock. Holding further depreciates value by ~5% per month and blocks warehouse capacity.",
      alternatives: [
        "Employee sale at \u20B918 L (47% recovery) \u2014 takes 3-4 weeks to clear",
        "Charity donation for tax benefit \u2014 \u20B90 recovery, \u20B97.6 L tax write-off value",
        "Hold for end-of-season sale \u2014 uncertain timeline, continued carrying cost",
      ],
      financialImpact:
        "Write-off of \u20B923 L on this batch; delaying adds \u20B91.9 L/month in carrying costs",
      cascadeRisk: "Delays warehouse clearance, impacts space for AW26 intake",
    },
  },

  // 11. Chase Order
  {
    id: "a1b2c3d4-g011-4a5b-8c6d-7e8f9a0b1c2d",
    type: "chase-order",
    title: "Chase Order: Style MWC-4521 High Performer",
    nDayLabel: "N+7",
    agentId: "b3e4f5a6-7c8d-4e9f-0a1b-2c3d4e5f6a7b",
    agentName: "Replenishment Engine",
    approverRole: "Senior Merchandiser",
    slaHours: 8,
    escalateTo: "Category Head",
    status: "auto-approved",
    createdAt: "2026-02-19T14:00:00Z",
    slaDeadline: "2026-02-19T22:00:00Z",
    context: {
      summary:
        "Replenishment Engine flagged Style MWC-4521 (Menswear Casual Shirt) as a high performer at Day 7. Sell-through at 92% with ROS 4.2x vs category average of 1.8x. Auto-approved by system based on pre-configured rules for styles exceeding 85% sell-through and 3x ROS threshold.",
      dataPoints: [
        { label: "Sell-Through", value: "92%", status: "on-track" },
        { label: "ROS", value: "4.2x", status: "on-track" },
        { label: "Category Avg ROS", value: "1.8x", status: "on-track" },
        { label: "Days Since Launch", value: "7", status: "on-track" },
        { label: "Chase Qty", value: "3,500 units", status: "on-track" },
        { label: "Vendor Lead Time", value: "14 days", status: "on-track" },
      ],
      agentRecommendation:
        "Chase 3,500 units. Style is a clear breakout performer \u2014 top 2% by sell-through velocity. Vendor V-2847 has confirmed 14-day lead time for repeat order. Chase captures estimated \u20B928 L additional revenue.",
      financialImpact:
        "Chase order value \u20B914 L; projected additional revenue \u20B928 L at current sell-through rate",
    },
    auditTrail: [
      {
        timestamp: "2026-02-19T14:00:00Z",
        actor: "Replenishment Engine (RE1)",
        action: "Gate created",
        notes:
          "Style MWC-4521 crossed auto-approve thresholds: ST 92% > 85%, ROS 4.2x > 3.0x",
      },
      {
        timestamp: "2026-02-19T14:00:05Z",
        actor: "System (Auto-Approve Rule)",
        action: "Auto-approved",
        notes:
          "Pre-configured rule: auto-approve chase orders where sell-through > 85% AND ROS > 3x within first 10 days",
      },
    ],
  },

  // 12. Below-Cost Markdown
  {
    id: "a1b2c3d4-g012-4a5b-8c6d-7e8f9a0b1c2d",
    type: "below-cost-markdown",
    title: "Below-Cost Markdown: Winter Outerwear Batch",
    nDayLabel: "N+120",
    agentId: "a2d3e4f5-6b7c-4d8e-9f0a-1b2c3d4e5f6a",
    agentName: "Liquidation Trigger",
    approverRole: "Finance Head",
    dualSignOff: "CEO",
    slaHours: 24,
    escalateTo: "Board Review",
    status: "pending",
    createdAt: "2026-02-19T09:00:00Z",
    slaDeadline: "2026-02-20T09:00:00Z",
    context: {
      summary:
        "Below-cost markdown approval required for Winter Outerwear batch \u2014 850 units with avg cost \u20B91,412 proposed to sell at avg \u20B9980 (31% below cost). Total write-off value \u20B912 L. Dual sign-off from Finance Head and CEO required per policy for any below-cost sale.",
      dataPoints: [
        { label: "Units", value: "850", status: "critical" },
        { label: "Avg Cost", value: "\u20B91,412", status: "on-track" },
        { label: "Proposed Avg Price", value: "\u20B9980", status: "critical" },
        { label: "Below-Cost %", value: "-31%", status: "critical" },
        { label: "Write-Off Value", value: "\u20B912 L", status: "critical" },
        { label: "Days in Stock", value: "120+", status: "warning" },
      ],
      agentRecommendation:
        "Approve below-cost markdown. Winter outerwear has zero demand in upcoming summer season. Holding inventory further erodes value and blocks \u20B9800 sq ft of prime store space. Current offer from B2B buyer at \u20B9980/unit is the best available.",
      alternatives: [
        "Hold for next winter season \u2014 9-month carry cost \u20B98.5 L, style obsolescence risk 40%",
        "Employee sale at \u20B91,100/unit \u2014 recovers more per unit but clearance takes 6-8 weeks",
        "Donate for tax write-off \u2014 \u20B90 recovery, estimated \u20B93.6 L tax benefit",
      ],
      financialImpact:
        "Write-off of \u20B912 L; recovery of \u20B98.3 L through below-cost sale vs \u20B90 if fully written off",
      cascadeRisk: "Delays warehouse clearance, impacts space for AW26 intake",
    },
  },

  // ── Inventory Workflow Gates ────────────────────────────────────────

  // 13. Stage 3 Markdown SM Validation (from WF-004)
  {
    id: "HG-INV-001",
    type: "sm-validation",
    title: "Stage 3 Markdown — AW25 Fleece Lined Jackets (35% off MRP)",
    nDayLabel: "N+75",
    agentId: "PS1",
    agentName: "Price Sentinel",
    approverRole: "Store Manager",
    slaHours: 48,
    autoApproveAfterHours: 36,
    escalateTo: "Category Head",
    status: "pending",
    createdAt: "2026-03-05T14:00:00+05:30",
    slaDeadline: "2026-03-07T14:00:00+05:30",
    context: {
      summary:
        "Stage 2 sell-through at 18% after 14 days. Stage 3 markdown to 35% off MRP recommended to prevent clearance routing.",
      dataPoints: [
        {
          label: "Current Stage",
          value: "Stage 2 (25% off)",
          status: "warning",
        },
        { label: "Stage 2 ST%", value: "18%", status: "critical" },
        { label: "Remaining Units", value: "1,900", status: "warning" },
        { label: "Margin at 35% off", value: "35%", status: "on-track" },
      ],
      agentRecommendation:
        "Apply 35% markdown. ROS lift expected 80-100% based on category history. If ST remains below 25% after 7 days, route to clearance channel.",
      alternatives: [
        "Hold at Stage 2 for 7 more days",
        "Direct route to in-store clearance counter",
      ],
      financialImpact:
        "14.2 L additional margin erosion if not marked down; 28.5 L value at risk of clearance routing",
      cascadeRisk: "Delay increases probability of B2B liquidation by 35%",
    },
    auditTrail: [],
  },

  // 14. Vendor Switch Approval (from WF-005)
  {
    id: "HG-INV-002",
    type: "chase-order",
    title:
      "Vendor Switch — Bombay Rayon Fashions to Orient Craft Ltd (30% allocation)",
    nDayLabel: "N+0",
    agentId: "VS5",
    agentName: "Vendor Sentinel",
    approverRole: "R&M Head",
    slaHours: 24,
    escalateTo: "Business Head",
    status: "pending",
    createdAt: "2026-03-06T08:00:00+05:30",
    slaDeadline: "2026-03-07T08:00:00+05:30",
    context: {
      summary:
        "Bombay Rayon Fashions OTIF at 62% for 3 consecutive weeks (threshold: 95%). FTR also degraded to 71%. Recommend 30% allocation shift to Orient Craft Ltd.",
      dataPoints: [
        { label: "Current OTIF", value: "62%", status: "critical" },
        { label: "Current FTR", value: "71%", status: "critical" },
        { label: "FG Adequacy", value: "51%", status: "critical" },
        { label: "Allocation Shift", value: "30%", status: "warning" },
      ],
      agentRecommendation:
        "Execute 30% allocation shift to Orient Craft Ltd (Tertiary). 14-day stability monitoring period. Reversal eligible after 2026-03-20.",
      alternatives: [
        "Issue performance improvement notice (7-day remediation)",
        "Partial shift (15% only)",
      ],
      financialImpact:
        "Current vendor causing 4.2 L weekly stockout losses across NOOS items",
      cascadeRisk:
        "Continued vendor underperformance projects 12 additional NOOS stockouts by month end",
    },
    auditTrail: [],
  },

  // 15. Hard Block Override — Cover Breach (from WF-007)
  {
    id: "HG-INV-003",
    type: "chase-order",
    title:
      "Hard Block Override — Re-cut PO Cover Breach for SS26 Mandarin Collar Shirts",
    nDayLabel: "N+14",
    agentId: "A11",
    agentName: "OTB Guardian",
    approverRole: "Category Owner",
    slaHours: 24,
    escalateTo: "R&M Head",
    status: "pending",
    createdAt: "2026-03-06T09:30:00+05:30",
    slaDeadline: "2026-03-07T09:30:00+05:30",
    context: {
      summary:
        "Day 14 Winner signal — ST 128% vs plan. Re-cut PO for 3,200 units blocked: creates 38-day cover (max 30 days for fashion). Override requires Category Owner approval.",
      dataPoints: [
        { label: "Sell-Through vs Plan", value: "128%", status: "on-track" },
        { label: "PO Quantity", value: "3,200 units" },
        { label: "Projected Cover", value: "38 days", status: "critical" },
        { label: "Max Allowed Cover", value: "30 days", status: "on-track" },
      ],
      agentRecommendation:
        "Approve override with reduced quantity (2,400 units = 28d cover) OR approve full PO if festive demand spike expected.",
      alternatives: [
        "Reduce PO to 2,400 units (within 30d cover)",
        "Approve full 3,200 units with festive justification",
        "Reject and wait for next reorder cycle",
      ],
      financialImpact:
        "Lost sales risk of 8.5 L if reorder is delayed; overstocking risk of 5.2 L if cover exceeds 30d",
    },
    auditTrail: [],
  },

  // 16. Below-Cost Markdown — CEO Gate (from inventoryApprovals IA-005)
  {
    id: "HG-INV-004",
    type: "below-cost-markdown",
    title:
      "Below-Cost Markdown — AW25 Suede Chelsea Boots (Day 166, 55% off MRP)",
    nDayLabel: "N+166",
    agentId: "PS1",
    agentName: "Price Sentinel",
    approverRole: "CEO",
    dualSignOff: "Finance Head",
    slaHours: 72,
    escalateTo: "Board Review",
    status: "pending",
    createdAt: "2026-03-05T10:00:00+05:30",
    slaDeadline: "2026-03-08T10:00:00+05:30",
    context: {
      summary:
        "Day 166 in network. All clearance channels exhausted (in-store 52% ST, Ajio 31% ST). 1,800 units remaining at 23.9 L value. Below-cost markdown at 55% off MRP recommended for final clearance attempt before write-off.",
      dataPoints: [
        { label: "Network Age", value: "166 days", status: "critical" },
        { label: "Remaining Units", value: "1,800" },
        { label: "Value at Risk", value: "23.9 L", status: "critical" },
        { label: "Recovery Rate", value: "45%", status: "critical" },
      ],
      agentRecommendation:
        "Apply 55% markdown for 14-day clearance attempt. If ST < 50% after 14 days, route to B2B at cost. Write-off at Day 180 if unsold.",
      alternatives: [
        "Route directly to B2B at cost (65% recovery)",
        "Export at 15% margin",
        "Hold for quarterly employee sale",
      ],
      financialImpact:
        "23.9 L write-off if not cleared by Day 180. Below-cost markdown recovers estimated 10.8 L (45%)",
      cascadeRisk:
        "Approaching Day 180 hard exit — CEO write-off approval required if not cleared",
    },
    auditTrail: [],
  },

  // ── OTB Module Gates ─────────────────────────────────────────────────

  // 17. Cross-POD OTB Reallocation
  {
    id: "HG-OTB-001",
    type: "otb-approval",
    title: "Cross-POD OTB Reallocation: ₹33 Cr from WWW Pod 1 → MW Pod 3",
    nDayLabel: "N+14",
    agentId: "A11",
    agentName: "OTB Guardian",
    approverRole: "Head of Planning",
    slaHours: 24,
    escalateTo: "Business Head",
    status: "pending",
    createdAt: "2026-02-20T09:00:00Z",
    slaDeadline: "2026-02-21T09:00:00Z",
    context: {
      summary:
        "Reallocate ₹33 Cr from WWW Pod 1 to MW Pod 3 — MW Pod 3 at 107% utilization, WWW Pod 1 at 52%. Cross-POD reallocation exceeds ₹10 Cr threshold requiring Head of Planning approval.",
      dataPoints: [
        { label: "MW Pod 3 Utilization", value: "107%", status: "critical" },
        { label: "WWW Pod 1 Utilization", value: "52%", status: "warning" },
        { label: "Reallocation Amount", value: "₹33 Cr", status: "warning" },
        { label: "MW Pod 3 Blocked POs", value: "23", status: "critical" },
        { label: "WWW Pod 1 Uncommitted", value: "₹48 Cr", status: "on-track" },
        { label: "Post-Realloc MW Util.", value: "89%", status: "on-track" },
      ],
      agentRecommendation:
        "Approve reallocation. MW Pod 3 demand is validated by sell-through data (T-Shirts at 78% ST). WWW Pod 1 has ₹48 Cr uncommitted — reallocation leaves sufficient headroom at 68% utilization.",
      alternatives: [
        "Partial reallocation of ₹20 Cr — unblocks top 14 POs, MW Pod 3 at 98%",
        "Reject and defer MW Pod 3 POs to next buy window — 3-week delay",
      ],
      financialImpact:
        "Approval unblocks 23 POs worth ₹33 Cr; delay costs ₹8 L/day in missed revenue opportunity",
      cascadeRisk:
        "Continued block on MW Pod 3 cascades to vendor capacity loss — 2 vendors have 7-day hold deadlines",
    },
  },

  // 18. Chase Release (Large)
  {
    id: "HG-OTB-002",
    type: "chase-order",
    title: "Chase Release: ₹7.2 Cr for Cotton Kurta Set (#WI3891)",
    nDayLabel: "N+14",
    agentId: "A11",
    agentName: "OTB Guardian",
    approverRole: "Category Owner",
    dualSignOff: "Head of Planning",
    slaHours: 12,
    escalateTo: "Business Head",
    status: "pending",
    createdAt: "2026-02-20T10:00:00Z",
    slaDeadline: "2026-02-20T22:00:00Z",
    context: {
      summary:
        "Chase release ₹7.2 Cr for Cotton Kurta Set (#WI3891) — Winner signal at 2.8× ROS, 22 stores. Exceeds ₹5 Cr threshold requiring dual approval from Category Owner and Head of Planning.",
      dataPoints: [
        {
          label: "Style",
          value: "#WI3891 Cotton Kurta Set",
          status: "on-track",
        },
        { label: "ROS", value: "2.8×", status: "on-track" },
        { label: "Sell-Through", value: "74%", status: "on-track" },
        { label: "Stores", value: "22", status: "on-track" },
        { label: "Chase Value", value: "₹7.2 Cr", status: "warning" },
        { label: "Vendor Lead Time", value: "18 days", status: "on-track" },
      ],
      agentRecommendation:
        "Approve chase release. Style is a validated winner at Day 14 with 2.8× ROS and 74% sell-through. Vendor capacity confirmed for 18-day delivery. Revenue capture estimated at ₹12 Cr.",
      alternatives: [
        "Partial chase of ₹4.8 Cr (within single-approval threshold) — covers top 15 stores only",
        "Defer to next chase window (7 days) — risks stockout in 8 high-velocity stores",
      ],
      financialImpact:
        "Chase captures estimated ₹12 Cr additional revenue; 7-day delay loses ₹3.2 Cr in peak demand window",
    },
  },

  // 19. Micro-Drop Release
  {
    id: "HG-OTB-003",
    type: "otb-approval",
    title: "Micro-Drop Release: ₹48 Cr for Summer Linen Capsule",
    nDayLabel: "N-30",
    agentId: "A11",
    agentName: "OTB Guardian",
    approverRole: "Head of Planning",
    slaHours: 24,
    escalateTo: "Business Head",
    status: "approved",
    createdAt: "2026-02-18T11:00:00Z",
    slaDeadline: "2026-02-19T11:00:00Z",
    context: {
      summary:
        "Release ₹48 Cr for Summer Linen Capsule — FTF trend signal, 85 A+A1 stores, 12 styles. Micro-drop reserve at 20% of total OTB, within planned allocation.",
      dataPoints: [
        { label: "Drop Value", value: "₹48 Cr", status: "on-track" },
        { label: "Styles", value: "12", status: "on-track" },
        { label: "Target Stores", value: "85 A+A1", status: "on-track" },
        { label: "FTF Signal", value: "Strong", status: "on-track" },
        { label: "Micro-Drop Reserve Used", value: "20%", status: "on-track" },
        { label: "Target Margin", value: "56%", status: "on-track" },
      ],
      agentRecommendation:
        "Approve micro-drop release. FTF trend signal validated by social listening and competitor analysis. Linen capsule aligns with seasonal demand curve. Vendor capacity confirmed.",
      financialImpact:
        "Micro-drop projected to generate ₹82 Cr revenue at 56% margin; timely release captures early-season demand premium",
    },
    auditTrail: [
      {
        timestamp: "2026-02-18T11:00:00Z",
        actor: "OTB Guardian (A11)",
        action: "Gate created",
        notes:
          "Micro-drop release prepared based on FTF signal and seasonal demand forecast",
      },
      {
        timestamp: "2026-02-18T16:30:00Z",
        actor: "Anita Desai (Head of Planning)",
        action: "Approved",
        notes:
          "Approved. Linen capsule aligns with category strategy. Monitor sell-through at Day 7.",
      },
    ],
  },

  // 20. OTB Increase Request
  {
    id: "HG-OTB-004",
    type: "otb-approval",
    title: "OTB Increase Request: ₹15 Cr for MW Pod 1",
    nDayLabel: "N+21",
    agentId: "A11",
    agentName: "OTB Guardian",
    approverRole: "Business Head",
    dualSignOff: "CFO",
    slaHours: 48,
    escalateTo: "CEO",
    status: "pending",
    createdAt: "2026-02-19T14:00:00Z",
    slaDeadline: "2026-02-21T14:00:00Z",
    context: {
      summary:
        "Request ₹15 Cr OTB increase for MW Pod 1 — demand exceeding plan by 18%, chase budget near exhaustion. Requires Business Head and CFO dual sign-off per policy for unplanned OTB increases.",
      dataPoints: [
        { label: "Current OTB", value: "₹85 Cr", status: "on-track" },
        {
          label: "Requested Increase",
          value: "₹15 Cr (+18%)",
          status: "warning",
        },
        { label: "Demand vs Plan", value: "+18%", status: "warning" },
        { label: "Chase Budget Remaining", value: "12%", status: "critical" },
        { label: "Current Sell-Through", value: "82%", status: "on-track" },
        {
          label: "Projected Season Revenue",
          value: "₹142 Cr",
          status: "on-track",
        },
      ],
      agentRecommendation:
        "Approve ₹15 Cr increase. MW Pod 1 demand validated by consistent 82% sell-through and rising ROS across 6 sub-categories. Chase budget at 12% cannot sustain remaining 8 weeks of season.",
      alternatives: [
        "Approve ₹10 Cr (partial) — covers top 4 sub-categories only",
        "Reallocate from underperforming pods instead of net increase",
        "Defer decision 1 week — risk of vendor capacity loss",
      ],
      financialImpact:
        "OTB increase enables ₹15 Cr additional procurement; projected to generate ₹26 Cr revenue at 54% margin",
      cascadeRisk:
        "Chase budget exhaustion in 2 weeks blocks all winner-signal responses for remainder of season",
    },
  },
];

export const humanGateSummary = {
  total: mockHumanGates.length,
  pending: mockHumanGates.filter((g) => g.status === "pending").length,
  approved: mockHumanGates.filter(
    (g) => g.status === "approved" || g.status === "auto-approved",
  ).length,
  escalated: mockHumanGates.filter((g) => g.status === "escalated").length,
  avgSlaHours: Math.round(
    mockHumanGates.reduce((s, g) => s + g.slaHours, 0) / mockHumanGates.length,
  ),
};

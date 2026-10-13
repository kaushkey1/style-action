/**
 * F&L SOP Master Index — Hardcoded workflow hierarchy.
 * Source: master-index-2.md (v0.2.0) + skills-registry.md (v0.2.0)
 *
 * Hierarchy: Domain → Value Stream → Workflow → SOP → Skills
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type SOPStatus = '\u25A1' | '\u25A3' | '\u25A4' | '\u25A5' | '\u25A6';

export interface SOP {
  id: string;
  name: string;
  skills: string[];
  status: SOPStatus;
}

export interface Workflow {
  code: string;
  name: string;
  purpose: string;
  sops: SOP[];
}

export interface ValueStream {
  code: string;
  name: string;
  workflows: Workflow[];
  skillsCoverage: 'fully-populated' | 'structure-ready';
}

// ─── Status helpers ─────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<SOPStatus, string> = {
  '\u25A1': 'Skeleton',
  '\u25A3': 'Drafted',
  '\u25A4': 'In Review',
  '\u25A5': 'Approved',
  '\u25A6': 'Deprecated',
};

export const STATUS_BADGE_VARIANT: Record<SOPStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  '\u25A1': 'default',
  '\u25A3': 'info',
  '\u25A4': 'warning',
  '\u25A5': 'success',
  '\u25A6': 'error',
};

// ─── VS 3 — Revenue & Merchandising (fully populated) ───────────────────────

const RM_WORKFLOWS: Workflow[] = [
  {
    code: 'RM-CAT',
    name: 'Category Strategy & Execution',
    purpose: 'Owns category-level strategic direction and retail pricing posture.',
    sops: [
      { id: 'FNL.RM.CAT.001', name: 'Category Strategy', skills: ['trend-brief-synthesize', 'cohort-segmentation-analyze', 'kpi-compute'], status: '\u25A3' },
      { id: 'FNL.RM.CAT.002', name: 'Retail Price Setting', skills: ['pricing-architecture-set', 'competitive-benchmark-lift'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-AP',
    name: 'Assortment Planning & Execution',
    purpose: 'Translates category strategy into the canonical Style × Option × Size × Vendor × Cluster matrix.',
    sops: [
      { id: 'FNL.RM.AP.001', name: 'Store Cluster Classification & Management', skills: ['cluster-classify', 'prior-season-performance-lift'], status: '\u25A3' },
      { id: 'FNL.RM.AP.002', name: 'Product Design & Trend Intelligence (R&M lens)', skills: ['trend-signal-sense', 'trend-brief-synthesize'], status: '\u25A3' },
      { id: 'FNL.RM.AP.003', name: 'Master Assortment & Range Planning', skills: ['range-architecture-design', 'otb-envelope-validate', 'prior-season-performance-lift'], status: '\u25A3' },
      { id: 'FNL.RM.AP.004', name: 'Store-Level Assortment Planning', skills: ['allocation-optimize', 'cluster-classify'], status: '\u25A3' },
      { id: 'FNL.RM.AP.005', name: 'Channel-Differentiated Assortment', skills: ['range-architecture-design', 'allocation-optimize'], status: '\u25A3' },
      { id: 'FNL.RM.AP.006', name: 'Assortment SKU Performance Monitoring', skills: ['inseason-sellthrough-monitor', 'performance-attribution-analyze'], status: '\u25A3' },
      { id: 'FNL.RM.AP.007', name: 'Purchase Requisition Creation & Approval', skills: ['otb-envelope-validate', 'demand-forecast-lift'], status: '\u25A3' },
      { id: 'FNL.RM.AP.008', name: 'Purchase Order Management', skills: ['otb-envelope-validate'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-DIR',
    name: 'Demand, Inventory & Replenishment',
    purpose: 'Forecasts demand, commits the OTB envelope, norms inventory, and runs allocation cycles.',
    sops: [
      { id: 'FNL.RM.DIR.001', name: 'Demand Forecasting', skills: ['demand-forecast-lift', 'prior-season-performance-lift'], status: '\u25A3' },
      { id: 'FNL.RM.DIR.002', name: 'Buy Planning & OTB Management', skills: ['otb-envelope-validate', 'demand-forecast-lift'], status: '\u25A3' },
      { id: 'FNL.RM.DIR.003', name: 'Inventory Norming', skills: ['allocation-optimize', 'cluster-classify'], status: '\u25A3' },
      { id: 'FNL.RM.DIR.004', name: 'Inventory Performance Tracking & RFID', skills: ['inseason-sellthrough-monitor', 'kpi-compute'], status: '\u25A3' },
      { id: 'FNL.RM.DIR.005', name: 'Allocation & Replenishment', skills: ['allocation-optimize', 'inseason-sellthrough-monitor'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-SCD',
    name: 'Season Calendar & Drop Management',
    purpose: 'Defines the SS/AW/Resort/Holiday calendar and manages drop cadence within seasons.',
    sops: [
      { id: 'FNL.RM.SCD.001', name: 'Season Calendar Definition', skills: ['trend-brief-synthesize', 'prior-season-performance-lift'], status: '\u25A3' },
      { id: 'FNL.RM.SCD.002', name: 'Drop Cadence Management', skills: ['inseason-sellthrough-monitor', 'demand-forecast-lift'], status: '\u25A3' },
      { id: 'FNL.RM.SCD.003', name: 'Pre-Season Buy Meet Orchestration', skills: ['range-architecture-design', 'trend-brief-synthesize'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-PRP',
    name: 'Pricing & Promotion',
    purpose: 'Sets pricing architecture and designs/executes promotions.',
    sops: [
      { id: 'FNL.RM.PRP.001', name: 'Pricing Architecture (MRP, Channel, Brand)', skills: ['pricing-architecture-set', 'competitive-benchmark-lift'], status: '\u25A3' },
      { id: 'FNL.RM.PRP.002', name: 'Brand-Led Promotions Design', skills: ['promotion-design'], status: '\u25A3' },
      { id: 'FNL.RM.PRP.003', name: 'Company/Category-Led Promotions Design', skills: ['promotion-design'], status: '\u25A3' },
      { id: 'FNL.RM.PRP.004', name: 'Special Events & Campaigns Design', skills: ['promotion-design', 'campaign-roi-measure'], status: '\u25A3' },
      { id: 'FNL.RM.PRP.005', name: 'Pricing & Promotion Execution', skills: ['pricing-architecture-set', 'promotion-design'], status: '\u25A3' },
      { id: 'FNL.RM.PRP.006', name: 'Quick Commerce Price Intelligence', skills: ['granary-collect'], status: '\u25A3' },
      { id: 'FNL.RM.PRP.007', name: 'Price & Promo Position Report', skills: ['fashion-price-benchmark'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-MKL',
    name: 'Markdown & EOSS',
    purpose: 'Plans and executes the markdown waterfall and end-of-season sale.',
    sops: [
      { id: 'FNL.RM.MKL.001', name: 'Markdown Cascade Planning (Waterfall)', skills: ['markdown-cascade-plan', 'inseason-sellthrough-monitor'], status: '\u25A3' },
      { id: 'FNL.RM.MKL.002', name: 'EOSS Planning & Execution', skills: ['markdown-cascade-plan', 'prior-season-performance-lift'], status: '\u25A3' },
      { id: 'FNL.RM.MKL.003', name: 'Inventory Liquidation Management', skills: ['markdown-cascade-plan'], status: '\u25A3' },
      { id: 'FNL.RM.MKL.004', name: 'Returns Planning', skills: ['inseason-sellthrough-monitor', 'demand-forecast-lift'], status: '\u25A3' },
      { id: 'FNL.RM.MKL.005', name: 'Inter-Store Transfer Planning', skills: ['allocation-optimize'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-SPP',
    name: 'Space Planning',
    purpose: 'Macro and micro space planning. Planograms, site merchandising, execution compliance.',
    sops: [
      { id: 'FNL.RM.SPP.001', name: 'Macro Space Planning', skills: ['prior-season-performance-lift', 'cluster-classify'], status: '\u25A3' },
      { id: 'FNL.RM.SPP.002', name: 'Micro Planogramming', skills: ['vm-story-generate', 'planogram-compliance-check'], status: '\u25A3' },
      { id: 'FNL.RM.SPP.003', name: 'Site Merchandising', skills: ['vm-story-generate'], status: '\u25A3' },
      { id: 'FNL.RM.SPP.004', name: 'Planogram Execution & Compliance Tracking', skills: ['planogram-compliance-check'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-MSL',
    name: 'Marketplace Seller Lifecycle',
    purpose: 'Marketplace partner experience and lifecycle management.',
    sops: [
      { id: 'FNL.RM.MSL.001', name: 'Marketplace Seller Experience Management', skills: ['kpi-compute'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-MON',
    name: 'Monetization',
    purpose: 'Endemic and non-endemic monetization — advertising surfaces, brand co-funded inventory.',
    sops: [
      { id: 'FNL.RM.MON.001', name: 'Monetization Strategy (Endemic, Non-Endemic)', skills: ['cohort-segmentation-analyze', 'kpi-compute'], status: '\u25A3' },
      { id: 'FNL.RM.MON.002', name: 'Monetization Execution', skills: ['campaign-roi-measure'], status: '\u25A3' },
      { id: 'FNL.RM.MON.003', name: 'Monetization Performance & Governance', skills: ['campaign-roi-measure', 'kpi-compute'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-SPM',
    name: 'Services Product Management',
    purpose: 'Services, insurance, recommerce, and exchange offers — non-merchandise revenue lines.',
    sops: [
      { id: 'FNL.RM.SPM.001', name: 'Services Catalogue & Offering Design', skills: ['pricing-architecture-set'], status: '\u25A3' },
      { id: 'FNL.RM.SPM.002', name: 'Service Pricing & Commercial Structuring', skills: ['pricing-architecture-set', 'competitive-benchmark-lift'], status: '\u25A3' },
      { id: 'FNL.RM.SPM.003', name: 'Insurance Offering Design', skills: ['pricing-architecture-set'], status: '\u25A3' },
      { id: 'FNL.RM.SPM.004', name: 'Insurance Pricing & Commercial Structuring', skills: ['pricing-architecture-set'], status: '\u25A3' },
      { id: 'FNL.RM.SPM.005', name: 'Insurance Risk & Loss Ratio Management', skills: ['kpi-compute'], status: '\u25A3' },
      { id: 'FNL.RM.SPM.006', name: 'Recommerce Device/Garment Grading & Pricing', skills: ['pricing-architecture-set'], status: '\u25A3' },
      { id: 'FNL.RM.SPM.007', name: 'Recommerce Inventory & Liquidation Planning', skills: ['markdown-cascade-plan'], status: '\u25A3' },
      { id: 'FNL.RM.SPM.008', name: 'Refurbished/Pre-loved Assortment Planning', skills: ['range-architecture-design'], status: '\u25A3' },
      { id: 'FNL.RM.SPM.009', name: 'Brand Exchange Bonus Offer Planning', skills: ['promotion-design'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-BGG',
    name: 'Brand Guidelines & Governance',
    purpose: 'Brand architecture, guidelines, health measurement, content design rules.',
    sops: [
      { id: 'FNL.RM.BGG.001', name: 'Brand Architecture Design', skills: ['trend-brief-synthesize'], status: '\u25A3' },
      { id: 'FNL.RM.BGG.002', name: 'Brand Guidelines & Governance', skills: ['creative-qa-evaluate'], status: '\u25A3' },
      { id: 'FNL.RM.BGG.003', name: 'Brand Health Measurement & Reporting', skills: ['kpi-compute', 'cohort-segmentation-analyze'], status: '\u25A3' },
      { id: 'FNL.RM.BGG.004', name: 'Content Design Guidelines & Governance', skills: ['creative-qa-evaluate'], status: '\u25A3' },
      { id: 'FNL.RM.BGG.005', name: 'Brand Strategic Partnerships & Alliances', skills: ['competitive-benchmark-lift'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-MBS',
    name: 'Marketing & Brand Strategy',
    purpose: 'Marketing planning, brand positioning, identity, customer insight, partnerships.',
    sops: [
      { id: 'FNL.RM.MBS.001', name: 'Marketing Planning & Spend Management', skills: ['marketing-budget-allocate', 'campaign-roi-measure'], status: '\u25A3' },
      { id: 'FNL.RM.MBS.002', name: 'Brand Positioning (TG) & CVP Definition', skills: ['cohort-segmentation-analyze', 'trend-brief-synthesize'], status: '\u25A3' },
      { id: 'FNL.RM.MBS.003', name: 'Brand Identity Management', skills: ['creative-qa-evaluate'], status: '\u25A3' },
      { id: 'FNL.RM.MBS.004', name: 'Customer Insights, Segmentation & Cohort Design', skills: ['cohort-segmentation-analyze'], status: '\u25A3' },
      { id: 'FNL.RM.MBS.005', name: 'Division Partnerships & Alliances Management', skills: ['competitive-benchmark-lift'], status: '\u25A3' },
      { id: 'FNL.RM.MBS.006', name: 'Marketing Ops', skills: ['marketing-budget-allocate', 'kpi-compute'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-UCX',
    name: 'Unified CX & Insights',
    purpose: 'Unified customer experience strategy, insights activation, competitive intelligence.',
    sops: [
      { id: 'FNL.RM.UCX.001', name: 'Unified CX Strategy & Guiding Principles', skills: ['cohort-segmentation-analyze', 'customer-style-profile'], status: '\u25A3' },
      { id: 'FNL.RM.UCX.002', name: 'Customer Insights Management & Activation', skills: ['cohort-segmentation-analyze', 'kpi-compute'], status: '\u25A3' },
      { id: 'FNL.RM.UCX.003', name: 'Cross-Category Competitive Intelligence', skills: ['competitive-benchmark-lift'], status: '\u25A3' },
      { id: 'FNL.RM.UCX.004', name: 'Customer Lifecycle Management & Churn Prevention', skills: ['cohort-segmentation-analyze', 'customer-style-profile'], status: '\u25A3' },
      { id: 'FNL.RM.UCX.005', name: 'Omnichannel Customer Journey Mapping', skills: ['customer-style-profile', 'cohort-segmentation-analyze'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-MEG',
    name: 'Marketing Effectiveness & Governance',
    purpose: 'Budget allocation, ROI measurement, mix optimization, MarTech governance.',
    sops: [
      { id: 'FNL.RM.MEG.001', name: 'Marketing Budget Allocation', skills: ['marketing-budget-allocate'], status: '\u25A3' },
      { id: 'FNL.RM.MEG.002', name: 'Marketing ROI Measurement & Reporting', skills: ['campaign-roi-measure'], status: '\u25A3' },
      { id: 'FNL.RM.MEG.003', name: 'Marketing Mix Optimization', skills: ['marketing-budget-allocate', 'campaign-roi-measure'], status: '\u25A3' },
      { id: 'FNL.RM.MEG.004', name: 'MarTech Stack & CDP Governance', skills: ['kpi-compute'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-CPM',
    name: 'Campaign Planning & Media',
    purpose: 'Campaign planning, media buying, execution, analytics, influencer management.',
    sops: [
      { id: 'FNL.RM.CPM.001', name: 'Campaign Planning & Media Buying', skills: ['marketing-budget-allocate', 'campaign-roi-measure'], status: '\u25A3' },
      { id: 'FNL.RM.CPM.002', name: 'Traditional (ATL/BTL) Marketing Execution', skills: ['campaign-roi-measure'], status: '\u25A3' },
      { id: 'FNL.RM.CPM.003', name: 'Digital & Performance Marketing Execution', skills: ['campaign-roi-measure', 'marketing-budget-allocate'], status: '\u25A3' },
      { id: 'FNL.RM.CPM.004', name: 'Campaign Analytics & Performance Reporting', skills: ['campaign-roi-measure', 'performance-attribution-analyze'], status: '\u25A3' },
      { id: 'FNL.RM.CPM.005', name: 'Influencer, Affiliate & Community Management', skills: ['influencer-affiliate-track', 'campaign-roi-measure'], status: '\u25A3' },
      { id: 'FNL.RM.CPM.006', name: 'Media Agency Performance Tracking', skills: ['campaign-roi-measure', 'kpi-compute'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-LOY',
    name: 'Loyalty',
    purpose: 'Loyalty program strategy, operations, platform governance, performance tracking.',
    sops: [
      { id: 'FNL.RM.LOY.001', name: 'Loyalty & Retention Strategy & Architecture', skills: ['cohort-segmentation-analyze', 'loyalty-eligibility-evaluate'], status: '\u25A3' },
      { id: 'FNL.RM.LOY.002', name: 'Loyalty Program Operations & Channel Delivery', skills: ['loyalty-eligibility-evaluate'], status: '\u25A3' },
      { id: 'FNL.RM.LOY.003', name: 'Loyalty Platform & Tech Governance', skills: ['kpi-compute'], status: '\u25A3' },
      { id: 'FNL.RM.LOY.004', name: 'Performance & Insights Tracking', skills: ['kpi-compute', 'cohort-segmentation-analyze'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-CRM',
    name: 'CRM Execution',
    purpose: 'CRM campaign execution and retention activation.',
    sops: [
      { id: 'FNL.RM.CRM.001', name: 'CRM Campaign Execution & Retention Activation', skills: ['campaign-roi-measure', 'customer-style-profile'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-CCM',
    name: 'Creative & Content Management',
    purpose: 'Content brief creation, creative QA, agency management, performance analytics.',
    sops: [
      { id: 'FNL.RM.CCM.001', name: 'Content Brief Creation and Production', skills: ['content-brief-draft', 'trend-brief-synthesize'], status: '\u25A3' },
      { id: 'FNL.RM.CCM.002', name: 'Creative QA & Compliance Review', skills: ['creative-qa-evaluate'], status: '\u25A3' },
      { id: 'FNL.RM.CCM.003', name: 'Creative Agency Management & Performance', skills: ['kpi-compute'], status: '\u25A3' },
      { id: 'FNL.RM.CCM.004', name: 'Content Performance Analytics & Optimisation', skills: ['campaign-roi-measure'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-VM',
    name: 'Product Story / Visual Merchandising',
    purpose: 'VM planning, story deck engine, in-store signage, effectiveness measurement.',
    sops: [
      { id: 'FNL.RM.VM.001', name: 'VM Planning', skills: ['vm-story-generate', 'prior-season-performance-lift'], status: '\u25A3' },
      { id: 'FNL.RM.VM.002', name: 'VM Story Deck Engine', skills: ['vm-story-generate'], status: '\u25A3' },
      { id: 'FNL.RM.VM.003', name: 'In-Store/Fa\u00E7ade Signage & POS Material Management', skills: ['content-brief-draft', 'creative-qa-evaluate'], status: '\u25A3' },
      { id: 'FNL.RM.VM.004', name: 'VM Effectiveness Measurement (Display-to-Sales Lift)', skills: ['performance-attribution-analyze', 'kpi-compute'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-BTL',
    name: 'BTL Execution',
    purpose: 'Below-the-line activation and measurement.',
    sops: [
      { id: 'FNL.RM.BTL.001', name: 'BTL Execution', skills: ['content-brief-draft'], status: '\u25A3' },
      { id: 'FNL.RM.BTL.002', name: 'BTL Performance Measurement', skills: ['campaign-roi-measure'], status: '\u25A3' },
    ],
  },
  {
    code: 'RM-CSP',
    name: 'Customer Styling & Personalization',
    purpose: 'Wardrobe-aware styling — customer style profile, outfit-level recommendation.',
    sops: [
      { id: 'FNL.RM.CSP.001', name: 'Customer Style Profile & Wardrobe Management', skills: ['customer-style-profile'], status: '\u25A3' },
      { id: 'FNL.RM.CSP.002', name: 'Outfit-Level Recommendation & Cross-Sell', skills: ['customer-style-profile', 'cohort-segmentation-analyze'], status: '\u25A3' },
      { id: 'FNL.RM.CSP.003', name: 'Stylist-Led Curation Engine', skills: ['customer-style-profile'], status: '\u25A3' },
    ],
  },
];

// ─── VS 1 — Business Owner ──────────────────────────────────────────────────

const BO_WORKFLOWS: Workflow[] = [
  { code: 'BO-AOP', name: 'Annual Operating Plan', purpose: 'The yearly target-setting and planning rhythm.', sops: [
    { id: 'FNL.BO.AOP.001', name: 'Annual Operating Plan Finalization', skills: ['aop-target-cascade', 'kpi-compute'], status: '\u25A3' },
  ]},
  { code: 'BO-BSD', name: 'Business Strategy Design & PMO', purpose: 'Customer insight, opportunity identification, portfolio governance, initiative PMO.', sops: [
    { id: 'FNL.BO.BSD.001', name: 'Customer Insight & Value Proposition Design', skills: ['cohort-segmentation-analyze', 'business-case-evaluate'], status: '\u25A3' },
    { id: 'FNL.BO.BSD.002', name: 'Opportunity Identification & Business Case Development', skills: ['business-case-evaluate', 'competitive-benchmark-lift'], status: '\u25A3' },
    { id: 'FNL.BO.BSD.003', name: 'Growth Portfolio Governance', skills: ['initiative-portfolio-track', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.BO.BSD.004', name: 'Initiative Planning, Execution & PMO Governance', skills: ['initiative-portfolio-track'], status: '\u25A3' },
  ]},
  { code: 'BO-COM', name: 'Corporate Communication', purpose: 'Communication strategy and messaging governance.', sops: [
    { id: 'FNL.BO.COM.001', name: 'Communication Strategy & Messaging', skills: ['content-brief-draft', 'creative-qa-evaluate'], status: '\u25A3' },
  ]},
  { code: 'BO-LEG', name: 'Legal & Public Policy Governance', purpose: 'Legal advisory, compliance, litigation and policy management.', sops: [
    { id: 'FNL.BO.LEG.001', name: 'Legal Advisory & Compliance Management', skills: ['compliance-case-manage'], status: '\u25A3' },
    { id: 'FNL.BO.LEG.002', name: 'Litigation & Policy Management', skills: ['compliance-case-manage'], status: '\u25A3' },
  ]},
  { code: 'BO-ETH', name: 'Ethics & Compliance', purpose: 'Ethics policy, vigilance, case management, compliance monitoring.', sops: [
    { id: 'FNL.BO.ETH.001', name: 'Ethics Policy & Compliance Framework', skills: ['compliance-case-manage'], status: '\u25A3' },
    { id: 'FNL.BO.ETH.002', name: 'Vigilance & Case Management', skills: ['compliance-case-manage'], status: '\u25A3' },
    { id: 'FNL.BO.ETH.003', name: 'Compliance Monitoring & Governance', skills: ['compliance-case-manage', 'kpi-compute'], status: '\u25A3' },
  ]},
];

// ─── VS 2 — Brand & Product Creation ────────────────────────────────────────

const BPC_WORKFLOWS: Workflow[] = [
  { code: 'BPC-TI', name: 'Trend Intelligence', purpose: 'Macro trend forecasting and brief publication.', sops: [
    { id: 'FNL.BPC.TI.001', name: 'Macro Trend Forecasting', skills: ['trend-signal-sense'], status: '\u25A3' },
    { id: 'FNL.BPC.TI.002', name: 'Trend Brief Publication', skills: ['trend-brief-synthesize'], status: '\u25A3' },
    { id: 'FNL.BPC.TI.003', name: 'Trend Validation & In-Season Pivots', skills: ['trend-signal-sense'], status: '\u25A3' },
  ]},
  { code: 'BPC-RA', name: 'Range Architecture', purpose: 'Pre-PLM architecture of the range — option plans, size curves.', sops: [
    { id: 'FNL.BPC.RA.001', name: 'Category Range Architecture', skills: ['range-architecture-design'], status: '\u25A3' },
    { id: 'FNL.BPC.RA.002', name: 'Option Plan Construction', skills: ['range-architecture-design', 'size-curve-plan'], status: '\u25A3' },
    { id: 'FNL.BPC.RA.003', name: 'Size Curve & Size Pack Planning', skills: ['size-curve-plan'], status: '\u25A3' },
  ]},
  { code: 'BPC-PLM', name: 'PLM Lifecycle', purpose: 'Tech pack lifecycle and style master initiation.', sops: [
    { id: 'FNL.BPC.PLM.001', name: 'Tech Pack Creation & Versioning', skills: ['design-spec-draft'], status: '\u25A3' },
    { id: 'FNL.BPC.PLM.002', name: 'Style Master Initiation', skills: ['design-spec-draft'], status: '\u25A3' },
    { id: 'FNL.BPC.PLM.003', name: 'Specification Approval & Lock', skills: ['design-spec-draft', 'fit-evaluate'], status: '\u25A3' },
  ]},
  { code: 'BPC-SAM', name: 'Sample Management', purpose: 'Proto \u2192 Salesman \u2192 Fit \u2192 PP \u2192 Photo lifecycle.', sops: [
    { id: 'FNL.BPC.SAM.001', name: 'Proto Sample Development & Review', skills: ['sample-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.BPC.SAM.002', name: 'Fit Sample Approval', skills: ['sample-lifecycle-track', 'fit-evaluate'], status: '\u25A3' },
    { id: 'FNL.BPC.SAM.003', name: 'Salesman Sample (SMS) Production', skills: ['sample-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.BPC.SAM.004', name: 'Pre-Production (PP) Sample Approval', skills: ['sample-lifecycle-track', 'qa-inspection-execute'], status: '\u25A3' },
    { id: 'FNL.BPC.SAM.005', name: 'Photo Sample Production & Handoff', skills: ['sample-lifecycle-track', 'content-brief-draft'], status: '\u25A3' },
  ]},
  { code: 'BPC-FIT', name: 'Fit & Sizing Standards', purpose: 'Fit block definition, fit approval cadence, size chart governance.', sops: [
    { id: 'FNL.BPC.FIT.001', name: 'Fit Block Definition & Maintenance', skills: ['fit-evaluate'], status: '\u25A3' },
    { id: 'FNL.BPC.FIT.002', name: 'Fit Approval Cadence', skills: ['fit-evaluate', 'sample-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.BPC.FIT.003', name: 'Size Chart Governance', skills: ['size-curve-plan', 'fit-evaluate'], status: '\u25A3' },
  ]},
  { code: 'BPC-CMA', name: 'Color & Material Approvals', purpose: 'Lab dip, dye lot, fabric/material, trim & accessory approvals.', sops: [
    { id: 'FNL.BPC.CMA.001', name: 'Color Standard Approval (Lab Dip)', skills: ['color-material-approve'], status: '\u25A3' },
    { id: 'FNL.BPC.CMA.002', name: 'Dye Lot Approval', skills: ['color-material-approve'], status: '\u25A3' },
    { id: 'FNL.BPC.CMA.003', name: 'Fabric/Material Approval', skills: ['color-material-approve', 'fabric-trim-source'], status: '\u25A3' },
    { id: 'FNL.BPC.CMA.004', name: 'Trim & Accessory Approval', skills: ['color-material-approve', 'fabric-trim-source'], status: '\u25A3' },
  ]},
  { code: 'BPC-LBK', name: 'Lookbook & Story Creation', purpose: 'Seasonal story definition, lookbook production, editorial direction.', sops: [
    { id: 'FNL.BPC.LBK.001', name: 'Seasonal Story Definition', skills: ['lookbook-compose', 'trend-brief-synthesize'], status: '\u25A3' },
    { id: 'FNL.BPC.LBK.002', name: 'Lookbook Production', skills: ['lookbook-compose', 'content-brief-draft'], status: '\u25A3' },
    { id: 'FNL.BPC.LBK.003', name: 'Editorial Direction & Styling Guidance', skills: ['lookbook-compose', 'creative-qa-evaluate'], status: '\u25A3' },
  ]},
  { code: 'BPC-DBC', name: 'Designer/Brand Collaboration', purpose: 'Collaboration opportunity, commercial structuring, capsule development.', sops: [
    { id: 'FNL.BPC.DBC.001', name: 'Collaboration Opportunity Identification', skills: ['collab-capsule-structure', 'trend-signal-sense'], status: '\u25A3' },
    { id: 'FNL.BPC.DBC.002', name: 'Commercial & IP Structuring', skills: ['collab-capsule-structure', 'business-case-evaluate'], status: '\u25A3' },
    { id: 'FNL.BPC.DBC.003', name: 'Capsule Development & Launch', skills: ['collab-capsule-structure', 'range-architecture-design'], status: '\u25A3' },
  ]},
  { code: 'BPC-SUS', name: 'Sustainability & Certification', purpose: 'Certification framework, material certification, sustainability audit.', sops: [
    { id: 'FNL.BPC.SUS.001', name: 'Certification Framework & Roadmap', skills: ['sustainability-cert-track'], status: '\u25A3' },
    { id: 'FNL.BPC.SUS.002', name: 'Material Certification (GOTS, BCI, Recycled)', skills: ['sustainability-cert-track', 'color-material-approve'], status: '\u25A3' },
    { id: 'FNL.BPC.SUS.003', name: 'Sustainability Audit & Renewal', skills: ['sustainability-cert-track'], status: '\u25A3' },
  ]},
];

// ─── VS 4 — Sourcing & Vendor ───────────────────────────────────────────────

const SV_WORKFLOWS: Workflow[] = [
  { code: 'SV-SLM', name: 'Supplier Lifecycle Management', purpose: 'Supplier identification, RFx, onboarding, procurement, performance.', sops: [
    { id: 'FNL.SV.SLM.001', name: 'Supplier Identification & Evaluation', skills: ['vendor-capability-match'], status: '\u25A3' },
    { id: 'FNL.SV.SLM.002', name: 'RFx Management (RFI/RFQ/RFP)', skills: ['rfx-manage'], status: '\u25A3' },
    { id: 'FNL.SV.SLM.003', name: 'Supplier Onboarding', skills: ['vendor-capability-match', 'supplier-performance-score'], status: '\u25A3' },
    { id: 'FNL.SV.SLM.004', name: 'Procurement Coordination', skills: ['vendor-capacity-check'], status: '\u25A3' },
    { id: 'FNL.SV.SLM.005', name: 'Supplier Issue & Escalation Handling', skills: ['supplier-performance-score'], status: '\u25A3' },
    { id: 'FNL.SV.SLM.006', name: 'Supplier Performance Management', skills: ['supplier-performance-score', 'kpi-compute'], status: '\u25A3' },
  ]},
  { code: 'SV-AVL', name: 'Approved Vendor List Management', purpose: 'AVL setup, vendor capability matrix, vendor capacity booking.', sops: [
    { id: 'FNL.SV.AVL.001', name: 'AVL Setup & Maintenance', skills: ['vendor-capability-match'], status: '\u25A3' },
    { id: 'FNL.SV.AVL.002', name: 'Vendor Capability Matrix Management', skills: ['vendor-capability-match'], status: '\u25A3' },
    { id: 'FNL.SV.AVL.003', name: 'Vendor Capacity Booking', skills: ['vendor-capacity-check'], status: '\u25A3' },
  ]},
  { code: 'SV-BSC', name: 'Brand Management (Source to Contract)', purpose: 'Contract negotiation, JBP, rebate management, product MDM.', sops: [
    { id: 'FNL.SV.BSC.001', name: 'Contract & TOT Negotiation & Finalization', skills: ['contract-tot-negotiate'], status: '\u25A3' },
    { id: 'FNL.SV.BSC.002', name: 'Joint Business Planning (JBP)', skills: ['contract-tot-negotiate', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.SV.BSC.003', name: 'Rebate Management (incl. Events/Campaigns)', skills: ['contract-tot-negotiate', 'grn-invoice-reconcile'], status: '\u25A3' },
    { id: 'FNL.SV.BSC.004', name: 'Product MDM (NPI & De-listing)', skills: ['design-spec-draft'], status: '\u25A3' },
  ]},
  { code: 'SV-FTS', name: 'Fabric & Trim Sourcing', purpose: 'Fabric identification, trim sourcing, material indenting.', sops: [
    { id: 'FNL.SV.FTS.001', name: 'Fabric Identification & Sourcing', skills: ['fabric-trim-source'], status: '\u25A3' },
    { id: 'FNL.SV.FTS.002', name: 'Trim & Accessory Sourcing', skills: ['fabric-trim-source'], status: '\u25A3' },
    { id: 'FNL.SV.FTS.003', name: 'Material Indenting & Allocation', skills: ['fabric-trim-source', 'vendor-capacity-check'], status: '\u25A3' },
  ]},
  { code: 'SV-OGP', name: 'Ordering, Goods Receipt & Pay', purpose: 'Goods receipt, invoice processing, vendor payment.', sops: [
    { id: 'FNL.SV.OGP.001', name: 'Goods Receipt & Service Confirmation', skills: ['grn-invoice-reconcile'], status: '\u25A3' },
    { id: 'FNL.SV.OGP.002', name: 'Invoice Processing & Reconciliation', skills: ['grn-invoice-reconcile'], status: '\u25A3' },
    { id: 'FNL.SV.OGP.003', name: 'Vendor Payment Execution', skills: ['grn-invoice-reconcile', 'ap-ar-reconcile'], status: '\u25A3' },
  ]},
  { code: 'SV-QA', name: 'Quality Assurance', purpose: 'Quality standards, audits, PPI, in-line inspection, FRI.', sops: [
    { id: 'FNL.SV.QA.001', name: 'Quality Standards & Norm Setting', skills: ['qa-inspection-execute'], status: '\u25A3' },
    { id: 'FNL.SV.QA.002', name: 'Quality Audits & Execution', skills: ['qa-inspection-execute'], status: '\u25A3' },
    { id: 'FNL.SV.QA.003', name: 'Pre-Production Inspection (PPI)', skills: ['qa-inspection-execute'], status: '\u25A3' },
    { id: 'FNL.SV.QA.004', name: 'In-Line Inspection', skills: ['qa-inspection-execute'], status: '\u25A3' },
    { id: 'FNL.SV.QA.005', name: 'Final Random Inspection (FRI)', skills: ['qa-inspection-execute'], status: '\u25A3' },
  ]},
  { code: 'SV-NPD', name: 'Innovation / NPD Collaboration', purpose: 'Private label concept design and development.', sops: [
    { id: 'FNL.SV.NPD.001', name: 'Private Label Concept Design & Development', skills: ['design-spec-draft', 'trend-brief-synthesize'], status: '\u25A3' },
  ]},
  { code: 'SV-SPM', name: 'Services Partner Management', purpose: 'Service partner lifecycle, security deposits, spare parts, OEM partnerships.', sops: [
    { id: 'FNL.SV.SPM.001', name: 'Service Partner Lifecycle & Performance', skills: ['partner-lifecycle-track', 'supplier-performance-score'], status: '\u25A3' },
    { id: 'FNL.SV.SPM.002', name: 'Security Deposit, Credit Limit & MSL Mgmt', skills: ['contract-tot-negotiate', 'ap-ar-reconcile'], status: '\u25A3' },
    { id: 'FNL.SV.SPM.003', name: 'Spare Parts Supplier & Performance Mgmt', skills: ['supplier-performance-score'], status: '\u25A3' },
    { id: 'FNL.SV.SPM.004', name: 'OEM/Brand Service Partnership Mgmt', skills: ['partner-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.SV.SPM.005', name: 'Insurance, Loss Ratio & Settlement Ops Mgmt', skills: ['kpi-compute', 'ap-ar-reconcile'], status: '\u25A3' },
    { id: 'FNL.SV.SPM.006', name: 'Recommerce Liquidation Partner Lifecycle Mgmt', skills: ['partner-lifecycle-track', 'markdown-cascade-plan'], status: '\u25A3' },
  ]},
];

// ─── VS 5 — Supply Chain ────────────────────────────────────────────────────

const SC_WORKFLOWS: Workflow[] = [
  { code: 'SC-ND', name: 'Network Design', purpose: 'Warehouse and transport network design and periodic review.', sops: [
    { id: 'FNL.SC.ND.001', name: 'Warehouse Network Design & Periodic Review', skills: ['network-design-evaluate'], status: '\u25A3' },
    { id: 'FNL.SC.ND.002', name: 'Transport Network Design & Periodic Review', skills: ['network-design-evaluate', 'transport-route-optimize'], status: '\u25A3' },
  ]},
  { code: 'SC-TP', name: 'Transport Planning', purpose: 'Truck capacity, route scheduling, rider planning for all mile types.', sops: [
    { id: 'FNL.SC.TP.001', name: 'Truck Capacity Planning (Store & Dark Store)', skills: ['transport-route-optimize', 'demand-forecast-lift'], status: '\u25A3' },
    { id: 'FNL.SC.TP.002', name: 'Route & Dispatch Scheduling (Store)', skills: ['transport-route-optimize'], status: '\u25A3' },
    { id: 'FNL.SC.TP.003', name: 'Truck Capacity Planning (First/Mid/Last Mile)', skills: ['transport-route-optimize', 'demand-forecast-lift'], status: '\u25A3' },
    { id: 'FNL.SC.TP.004', name: 'Rider Capacity Planning & Onboarding', skills: ['manpower-roster-plan'], status: '\u25A3' },
    { id: 'FNL.SC.TP.005', name: 'Route & Dispatch (First Mile)', skills: ['transport-route-optimize'], status: '\u25A3' },
    { id: 'FNL.SC.TP.006', name: 'Route & Dispatch (Mid Mile)', skills: ['transport-route-optimize'], status: '\u25A3' },
    { id: 'FNL.SC.TP.007', name: 'Route & Dispatch (Last Mile)', skills: ['transport-route-optimize'], status: '\u25A3' },
  ]},
  { code: 'SC-WP', name: 'Warehouse Planning', purpose: 'Manpower planning for warehouse and sort centre.', sops: [
    { id: 'FNL.SC.WP.001', name: 'Manpower Planning (Warehouse)', skills: ['manpower-roster-plan', 'warehouse-throughput-plan'], status: '\u25A3' },
    { id: 'FNL.SC.WP.002', name: 'Manpower Planning (Sort Centre)', skills: ['manpower-roster-plan', 'warehouse-throughput-plan'], status: '\u25A3' },
  ]},
  { code: 'SC-TO', name: 'Transport Operations', purpose: 'Delivery execution, OTD tracking, returns pickup, performance management.', sops: [
    { id: 'FNL.SC.TO.001', name: 'Store & Dark Store Delivery Execution', skills: ['otd-track'], status: '\u25A3' },
    { id: 'FNL.SC.TO.002', name: 'On-Time Delivery Tracking (Store)', skills: ['otd-track'], status: '\u25A3' },
    { id: 'FNL.SC.TO.003', name: 'Inter-Node Stock Transfer Execution', skills: ['allocation-optimize', 'otd-track'], status: '\u25A3' },
    { id: 'FNL.SC.TO.004', name: 'Transporter Performance Management', skills: ['otd-track', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.SC.TO.005', name: 'First Mile Pickup & Last Mile Delivery', skills: ['otd-track'], status: '\u25A3' },
    { id: 'FNL.SC.TO.006', name: 'OTD Tracking (First Mile)', skills: ['otd-track'], status: '\u25A3' },
    { id: 'FNL.SC.TO.007', name: 'OTD Tracking (Last Mile)', skills: ['otd-track'], status: '\u25A3' },
    { id: 'FNL.SC.TO.008', name: 'Customer Return Pickup & Processing', skills: ['returns-flow-route'], status: '\u25A3' },
    { id: 'FNL.SC.TO.009', name: 'Truck Performance Management', skills: ['otd-track', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.SC.TO.010', name: 'Rider Performance & Grievance Management', skills: ['kpi-compute'], status: '\u25A3' },
    { id: 'FNL.SC.TO.011', name: 'Sort Centre Operations Execution', skills: ['warehouse-throughput-plan'], status: '\u25A3' },
  ]},
  { code: 'SC-WO', name: 'Warehouse Operations', purpose: 'Warehouse execution, returns handling, drop-based fulfillment.', sops: [
    { id: 'FNL.SC.WO.001', name: 'Warehouse Operations Execution', skills: ['warehouse-throughput-plan'], status: '\u25A3' },
    { id: 'FNL.SC.WO.002', name: 'Returns Handling & Processing', skills: ['returns-flow-route'], status: '\u25A3' },
    { id: 'FNL.SC.WO.003', name: 'Drop-Based Fulfillment Operations', skills: ['warehouse-throughput-plan', 'demand-forecast-lift'], status: '\u25A3' },
  ]},
  { code: 'SC-SCM', name: 'Supply Chain Monitoring', purpose: 'Supply chain monitoring support.', sops: [
    { id: 'FNL.SC.SCM.001', name: 'Supply Chain Monitoring Support', skills: ['kpi-compute', 'otd-track'], status: '\u25A3' },
  ]},
  { code: 'SC-SOI', name: 'Supply Chain Ops Improvement', purpose: 'Supply chain operations improvement.', sops: [
    { id: 'FNL.SC.SOI.001', name: 'Supply Chain Operations Improvement', skills: ['performance-attribution-analyze', 'warehouse-throughput-plan'], status: '\u25A3' },
  ]},
  { code: 'SC-WA', name: 'Warehouse Automation', purpose: 'Warehouse automation planning and deployment.', sops: [
    { id: 'FNL.SC.WA.001', name: 'WH Automation Planning & Deployment', skills: ['warehouse-throughput-plan', 'business-case-evaluate'], status: '\u25A3' },
  ]},
  { code: 'SC-SPH', name: 'Size Pack & Hanger Operations', purpose: 'Hanger conversion (GOH) and size pack configuration.', sops: [
    { id: 'FNL.SC.SPH.001', name: 'Hanger Conversion (GOH)', skills: ['goh-sizepack-configure'], status: '\u25A3' },
    { id: 'FNL.SC.SPH.002', name: 'Size Pack Configuration & Pick-Pack', skills: ['goh-sizepack-configure', 'size-curve-plan'], status: '\u25A3' },
  ]},
];

// ─── VS 6 — Store & Channel Operations ──────────────────────────────────────

const OP_WORKFLOWS: Workflow[] = [
  { code: 'OP-STI', name: 'Store Intelligence', purpose: 'Neighbourhood analysis, catchment profiling, and location audit for store strategy.', sops: [
    { id: 'FNL.OP.STI.001', name: 'Neighbourhood Analysis', skills: ['location-intel'], status: '\u25A3' },
    { id: 'FNL.OP.STI.002', name: 'Neighbourhood Audit', skills: ['location-intel-audit'], status: '\u25A3' },
  ]},
  { code: 'OP-SRV', name: 'Store Review', purpose: 'Deep store health review, audit of review quality, and quality gate checks.', sops: [
    { id: 'FNL.OP.SRV.001', name: 'Store Health Check', skills: ['store-deep-review'], status: '\u25A3' },
    { id: 'FNL.OP.SRV.002', name: 'Review Audit', skills: ['store-deep-review-audit'], status: '\u25A3' },
    { id: 'FNL.OP.SRV.003', name: 'Quality Gate', skills: ['store-deep-review-check'], status: '\u25A3' },
  ]},
  { code: 'OP-ISJ', name: 'In-Store Customer Journey', purpose: 'In-store experience, inventory, cash handling, VM execution, workforce.', sops: [
    { id: 'FNL.OP.ISJ.001', name: 'In-Store Customer Experience Management', skills: ['store-performance-monitor', 'customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.002', name: 'In-Store Endless Aisle & Digital Ordering', skills: ['store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.003', name: 'In-Store Self-Checkout (Scan & Go)', skills: ['store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.004', name: 'Store Opening Operations', skills: ['workforce-schedule', 'store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.005', name: 'Store Closing Operations', skills: ['cash-reconcile', 'workforce-schedule'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.006', name: 'Inbound Inventory Management', skills: ['allocation-optimize'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.007', name: 'In-Store Inventory Management', skills: ['inseason-sellthrough-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.008', name: 'In-Store Inventory Control', skills: ['inseason-sellthrough-monitor', 'store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.009', name: 'Cash Handling & Reconciliation', skills: ['cash-reconcile'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.010', name: 'NHQ-to-Store Communications', skills: ['content-brief-draft'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.011', name: 'VM Execution & Compliance Tracking', skills: ['planogram-compliance-check', 'vm-story-generate'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.012', name: 'Store Escalation Management', skills: ['customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.013', name: 'Workforce Scheduling & Rostering', skills: ['workforce-schedule'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.014', name: 'Incentive Management', skills: ['workforce-schedule', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.015', name: 'Store Workforce Training & Capability', skills: ['workforce-schedule'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.016', name: 'Refund & Replacement Execution', skills: ['customer-issue-resolve', 'cash-reconcile'], status: '\u25A3' },
    { id: 'FNL.OP.ISJ.017', name: 'Returns Reconciliation', skills: ['returns-triage-classify', 'cash-reconcile'], status: '\u25A3' },
  ]},
  { code: 'OP-SMM', name: 'Store Maintenance & Monitoring', purpose: 'Maintenance ticketing, asset health, hygiene, audits, performance.', sops: [
    { id: 'FNL.OP.SMM.001', name: 'Maintenance & Facilities Ticketing', skills: ['store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.SMM.002', name: 'Asset Health Monitoring', skills: ['store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.SMM.003', name: 'Store Hygiene Management', skills: ['store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.SMM.004', name: 'Operational Audits & Compliance', skills: ['store-performance-monitor', 'compliance-case-manage'], status: '\u25A3' },
    { id: 'FNL.OP.SMM.005', name: 'Scrap Management', skills: ['returns-triage-classify'], status: '\u25A3' },
    { id: 'FNL.OP.SMM.006', name: 'Store Performance Monitoring', skills: ['store-performance-monitor', 'kpi-compute'], status: '\u25A3' },
  ]},
  { code: 'OP-PPE', name: 'Post-Purchase Experience', purpose: 'Issue resolution, escalation, service fulfillment, social sentiment.', sops: [
    { id: 'FNL.OP.PPE.001', name: 'Issue Resolution Management', skills: ['customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.PPE.002', name: 'Escalation Management', skills: ['customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.PPE.003', name: 'Post-Purchase Service Fulfillment', skills: ['customer-issue-resolve', 'partner-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.OP.PPE.004', name: 'Unified Device Lifecycle Mgmt', skills: ['customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.PPE.005', name: 'Customer Query Intake', skills: ['customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.PPE.006', name: 'Customer Query Resolution (Digital)', skills: ['customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.PPE.007', name: 'Social Sentiment & Online Reviews Management', skills: ['customer-issue-resolve', 'trend-signal-sense'], status: '\u25A3' },
  ]},
  { code: 'OP-OPJ', name: 'Online Platform Customer Journey', purpose: 'UX/UI design, user research, site ops, product listing, content.', sops: [
    { id: 'FNL.OP.OPJ.001', name: 'UX/UI Design & Experience Optimisation', skills: ['creative-qa-evaluate'], status: '\u25A3' },
    { id: 'FNL.OP.OPJ.002', name: 'User Research, Testing & QA', skills: ['cohort-segmentation-analyze', 'pdp-content-qa'], status: '\u25A3' },
    { id: 'FNL.OP.OPJ.003', name: 'Site Operations Management', skills: ['kpi-compute'], status: '\u25A3' },
    { id: 'FNL.OP.OPJ.004', name: 'Product Listing Creation & Activation', skills: ['pdp-content-qa'], status: '\u25A3' },
    { id: 'FNL.OP.OPJ.005', name: 'Content QA & PDP Approval', skills: ['pdp-content-qa', 'creative-qa-evaluate'], status: '\u25A3' },
    { id: 'FNL.OP.OPJ.006', name: 'Online Product Cataloging & Content Ops', skills: ['pdp-content-qa'], status: '\u25A3' },
    { id: 'FNL.OP.OPJ.007', name: 'Content Production (Studio, Static, Video, Copy)', skills: ['content-brief-draft', 'creative-qa-evaluate'], status: '\u25A3' },
  ]},
  { code: 'OP-SCJ', name: 'Services Customer Journey', purpose: 'In-store service cross-sell, recommerce, service fulfillment, insurance.', sops: [
    { id: 'FNL.OP.SCJ.001', name: 'In-Store Service/Insurance Cross-Sell', skills: ['kpi-compute', 'store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.SCJ.002', name: 'Recommerce (Trade-In) Customer Journey', skills: ['returns-triage-classify', 'customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.SCJ.003', name: 'Service Request Orchestration & Fulfilment', skills: ['customer-issue-resolve', 'partner-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.OP.SCJ.004', name: 'Recommerce Logistics Service Fulfilment', skills: ['returns-flow-route', 'partner-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.OP.SCJ.005', name: 'Post-Service Customer Experience & Advocacy', skills: ['customer-issue-resolve', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.OP.SCJ.006', name: 'Spare Parts Forecast, Inventory & Replenishment', skills: ['demand-forecast-lift', 'allocation-optimize'], status: '\u25A3' },
    { id: 'FNL.OP.SCJ.007', name: 'Insurance Claims & Fulfilment Management', skills: ['customer-issue-resolve', 'compliance-case-manage'], status: '\u25A3' },
  ]},
  { code: 'OP-B2B', name: 'B2B Sales Management', purpose: 'Sales beat planning, coverage, order recommendations, partner performance.', sops: [
    { id: 'FNL.OP.B2B.001', name: 'Sales Beat Planning & Optimization', skills: ['b2b-beat-plan'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.002', name: 'Sales Coverage & Productivity Tracking', skills: ['b2b-beat-plan', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.003', name: 'Order/Scheme Recommendation Engine Mgmt', skills: ['b2b-beat-plan', 'promotion-design'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.004', name: 'Partner Performance Management', skills: ['partner-lifecycle-track', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.005', name: 'Sales Order & Fulfillment', skills: ['b2b-beat-plan', 'otd-track'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.006', name: 'Sales Returns Management', skills: ['returns-triage-classify'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.007', name: 'Sales Capability Development', skills: ['b2b-beat-plan'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.008', name: 'Sales Incentive Management', skills: ['kpi-compute'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.009', name: 'Issue Resolution Management (B2B)', skills: ['customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.010', name: 'Escalation Management (B2B)', skills: ['customer-issue-resolve'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.011', name: 'NPS & Voice of Partner Capturing', skills: ['kpi-compute', 'cohort-segmentation-analyze'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.012', name: 'Promotion Budget & Trade ROI Governance', skills: ['promo-spend-validate', 'campaign-roi-measure'], status: '\u25A3' },
    { id: 'FNL.OP.B2B.013', name: 'Scheme Communication & Rollout', skills: ['content-brief-draft', 'b2b-beat-plan'], status: '\u25A3' },
  ]},
  { code: 'OP-BPL', name: 'B2B Partner Lifecycle', purpose: 'Partner identification, onboarding, commercial, activation, renewal, audit, exit.', sops: [
    { id: 'FNL.OP.BPL.001', name: 'Partner Identification & Due Diligence', skills: ['partner-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.OP.BPL.002', name: 'Onboarding & System Enablement', skills: ['partner-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.OP.BPL.003', name: 'Commercial & Contract Management', skills: ['partner-lifecycle-track', 'contract-tot-negotiate'], status: '\u25A3' },
    { id: 'FNL.OP.BPL.004', name: 'Activation & First Order Enablement', skills: ['partner-lifecycle-track', 'b2b-beat-plan'], status: '\u25A3' },
    { id: 'FNL.OP.BPL.005', name: 'Partner Capability Development', skills: ['partner-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.OP.BPL.006', name: 'Partner Renewal Management', skills: ['partner-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.OP.BPL.007', name: 'Partner Audit & Compliance Monitoring', skills: ['partner-lifecycle-track', 'compliance-case-manage'], status: '\u25A3' },
    { id: 'FNL.OP.BPL.008', name: 'Partner Deactivation / Exit Management', skills: ['partner-lifecycle-track'], status: '\u25A3' },
  ]},
  { code: 'OP-COM', name: 'Channel Operating Models', purpose: 'SIS, EBO, MBO, Online-Owned, Marketplace operating models.', sops: [
    { id: 'FNL.OP.COM.001', name: 'SIS Operating Model', skills: ['store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.COM.002', name: 'EBO Operating Model', skills: ['store-performance-monitor'], status: '\u25A3' },
    { id: 'FNL.OP.COM.003', name: 'MBO Operating Model', skills: ['store-performance-monitor', 'partner-lifecycle-track'], status: '\u25A3' },
    { id: 'FNL.OP.COM.004', name: 'Online-Owned Operating Model', skills: ['kpi-compute'], status: '\u25A3' },
    { id: 'FNL.OP.COM.005', name: 'Marketplace Operating Model', skills: ['kpi-compute', 'partner-lifecycle-track'], status: '\u25A3' },
  ]},
  { code: 'OP-TRR', name: 'Trial Room Operations', purpose: 'Trial room management, trial-to-conversion tracking, fit consultation.', sops: [
    { id: 'FNL.OP.TRR.001', name: 'Trial Room Management & Capacity', skills: ['trial-conversion-track'], status: '\u25A3' },
    { id: 'FNL.OP.TRR.002', name: 'Trial-to-Conversion Tracking', skills: ['trial-conversion-track', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.OP.TRR.003', name: 'Fit Consultation & Assisted Selling', skills: ['trial-conversion-track', 'stylist-recommend'], status: '\u25A3' },
  ]},
  { code: 'OP-STY', name: 'In-Store Stylist Program', purpose: 'Stylist booking, style consultation, wardrobe planning.', sops: [
    { id: 'FNL.OP.STY.001', name: 'Stylist Booking & Slot Management', skills: ['stylist-recommend'], status: '\u25A3' },
    { id: 'FNL.OP.STY.002', name: 'Style Consultation Execution', skills: ['stylist-recommend', 'customer-style-profile'], status: '\u25A3' },
    { id: 'FNL.OP.STY.003', name: 'Wardrobe Planning & Follow-Up', skills: ['stylist-recommend', 'customer-style-profile'], status: '\u25A3' },
  ]},
  { code: 'OP-RTR', name: 'Returns Triage & Resaleability', purpose: 'Returns triage, damage classification, resaleability decision, refurbishment.', sops: [
    { id: 'FNL.OP.RTR.001', name: 'Returns Triage Intake (Worn/Unworn/Damaged)', skills: ['returns-triage-classify'], status: '\u25A3' },
    { id: 'FNL.OP.RTR.002', name: 'Damage & Fit-Fail Classification', skills: ['returns-triage-classify', 'fit-evaluate'], status: '\u25A3' },
    { id: 'FNL.OP.RTR.003', name: 'Resaleability Decision & Routing', skills: ['returns-triage-classify', 'returns-flow-route'], status: '\u25A3' },
    { id: 'FNL.OP.RTR.004', name: 'Refurbishment / Alteration Routing', skills: ['returns-flow-route'], status: '\u25A3' },
  ]},
];

// ─── VS 7–10 (compact — fewer SOPs) ────────────────────────────────────────

const FN_WORKFLOWS: Workflow[] = [
  { code: 'FN-FPA', name: 'FP&A and MIS', purpose: 'Financial budgeting, forecasting, reporting, cashflow management.', sops: [
    { id: 'FNL.FN.FPA.001', name: 'Financial Budgeting & Forecasting', skills: ['budget-variance-analyze', 'cashflow-forecast'], status: '\u25A3' },
    { id: 'FNL.FN.FPA.002', name: 'Financial Reporting (MIS)', skills: ['budget-variance-analyze', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.FN.FPA.003', name: 'Cashflow Management & Variance Assessment', skills: ['cashflow-forecast', 'budget-variance-analyze'], status: '\u25A3' },
    { id: 'FNL.FN.FPA.004', name: 'Financial Consolidation', skills: ['books-closure-execute'], status: '\u25A3' },
  ]},
  { code: 'FN-PRM', name: 'Payables, Receivables & MOP', purpose: 'AP/AR transaction processing, exception management, MOP lifecycle.', sops: [
    { id: 'FNL.FN.PRM.001', name: 'Accounts Payable Transaction Processing', skills: ['ap-ar-reconcile'], status: '\u25A3' },
    { id: 'FNL.FN.PRM.002', name: 'Payable/Receivable Exception Management', skills: ['ap-ar-reconcile'], status: '\u25A3' },
    { id: 'FNL.FN.PRM.003', name: 'Accounts Receivable Processing & Reconciliation', skills: ['ap-ar-reconcile'], status: '\u25A3' },
    { id: 'FNL.FN.PRM.004', name: 'Mode of Payment (MOP) Lifecycle Management', skills: ['ap-ar-reconcile', 'cash-reconcile'], status: '\u25A3' },
  ]},
  { code: 'FN-FCG', name: 'Finance Control & Governance', purpose: 'Master data, tax, insurance, BOC, internal controls, CAPEX, lease, SLP finance.', sops: [
    { id: 'FNL.FN.FCG.001', name: 'Finance Master Data Management', skills: ['books-closure-execute'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.002', name: 'Local Tax Compliance & Utility Payments', skills: ['tax-compliance-check'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.003', name: 'Insurance Policy & Claims Management', skills: ['compliance-case-manage', 'ap-ar-reconcile'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.004', name: 'Finance BOC Ageing Monitoring', skills: ['ap-ar-reconcile', 'kpi-compute'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.005', name: 'Internal Controls & Testing', skills: ['compliance-case-manage', 'budget-variance-analyze'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.006', name: 'Project Finance & CAPEX Governance', skills: ['capex-governance-track'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.007', name: 'Lease Finance Management', skills: ['capex-governance-track', 'ap-ar-reconcile'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.008', name: 'SLP Finance Management', skills: ['budget-variance-analyze'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.009', name: 'Facility Cost Validation & Governance', skills: ['budget-variance-analyze', 'capex-governance-track'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.010', name: 'IT Spend Governance & Financial Control', skills: ['budget-variance-analyze', 'capex-governance-track'], status: '\u25A3' },
    { id: 'FNL.FN.FCG.011', name: 'Supply Chain Finance Management', skills: ['budget-variance-analyze', 'cashflow-forecast'], status: '\u25A3' },
  ]},
  { code: 'FN-AC', name: 'Accounts & Consolidation', purpose: 'Books closure, financial reporting, capex & asset accounting.', sops: [
    { id: 'FNL.FN.AC.001', name: 'Books Closure & Financial Reporting (Central)', skills: ['books-closure-execute'], status: '\u25A3' },
    { id: 'FNL.FN.AC.002', name: 'Books Closure & Financial Reporting (Division)', skills: ['books-closure-execute'], status: '\u25A3' },
    { id: 'FNL.FN.AC.003', name: 'Capex & Asset Accounting', skills: ['capex-governance-track', 'books-closure-execute'], status: '\u25A3' },
  ]},
  { code: 'FN-TRY', name: 'Treasury Management', purpose: 'Liquidity & risk, trade finance, banking & MOP partnerships.', sops: [
    { id: 'FNL.FN.TRY.001', name: 'Liquidity & Risk Management', skills: ['cashflow-forecast'], status: '\u25A3' },
    { id: 'FNL.FN.TRY.002', name: 'Trade Finance Management', skills: ['cashflow-forecast', 'contract-tot-negotiate'], status: '\u25A3' },
    { id: 'FNL.FN.TRY.003', name: 'Banking & MOP Partnerships', skills: ['partner-lifecycle-track', 'cashflow-forecast'], status: '\u25A3' },
  ]},
  { code: 'FN-TAX', name: 'Tax Management', purpose: 'Direct tax, GST & customs compliance, notices, litigation.', sops: [
    { id: 'FNL.FN.TAX.001', name: 'Direct Tax Compliance & Advisory', skills: ['tax-compliance-check'], status: '\u25A3' },
    { id: 'FNL.FN.TAX.002', name: 'Direct Tax Notice', skills: ['tax-compliance-check', 'compliance-case-manage'], status: '\u25A3' },
    { id: 'FNL.FN.TAX.003', name: 'GST & Customs Compliance & Advisory', skills: ['tax-compliance-check'], status: '\u25A3' },
    { id: 'FNL.FN.TAX.004', name: 'GST & Customs Notice & Litigation', skills: ['tax-compliance-check', 'compliance-case-manage'], status: '\u25A3' },
  ]},
  { code: 'FN-SEC', name: 'Secretarial', purpose: 'Statutory filings, ROC, board operations & governance.', sops: [
    { id: 'FNL.FN.SEC.001', name: 'Statutory Filings, ROC & Board Governance', skills: ['compliance-case-manage'], status: '\u25A3' },
  ]},
  { code: 'FN-OPF', name: 'Operations Finance', purpose: 'Store operations finance, refunds & commissions management.', sops: [
    { id: 'FNL.FN.OPF.001', name: 'Store Operations Finance & Reporting', skills: ['cash-reconcile', 'budget-variance-analyze'], status: '\u25A3' },
    { id: 'FNL.FN.OPF.002', name: 'Refunds & Commissions Management', skills: ['ap-ar-reconcile', 'cash-reconcile'], status: '\u25A3' },
  ]},
  { code: 'FN-SF', name: 'Sourcing Finance', purpose: 'TOT validation, intake margin, brand scheme, vendor imports finance.', sops: [
    { id: 'FNL.FN.SF.001', name: 'Terms of Trade (TOT) Validation', skills: ['contract-tot-negotiate', 'margin-assurance-track'], status: '\u25A3' },
    { id: 'FNL.FN.SF.002', name: 'In-take Margin Assurance & Tracking', skills: ['margin-assurance-track'], status: '\u25A3' },
    { id: 'FNL.FN.SF.003', name: 'Brand Scheme Management', skills: ['promo-spend-validate', 'margin-assurance-track'], status: '\u25A3' },
    { id: 'FNL.FN.SF.004', name: 'Vendor Imports Finance Management', skills: ['grn-invoice-reconcile', 'tax-compliance-check'], status: '\u25A3' },
  ]},
  { code: 'FN-MPF', name: 'Marketplace Finance', purpose: 'Marketplace seller trade terms and payout governance.', sops: [
    { id: 'FNL.FN.MPF.001', name: 'Marketplace Seller Trade Terms', skills: ['contract-tot-negotiate', 'margin-assurance-track'], status: '\u25A3' },
    { id: 'FNL.FN.MPF.002', name: 'Seller Payout Governance', skills: ['ap-ar-reconcile'], status: '\u25A3' },
  ]},
  { code: 'FN-RMF', name: 'R&M Finance', purpose: 'Promotion validation, campaign ROI tracking, category P&L.', sops: [
    { id: 'FNL.FN.RMF.001', name: 'Promotion & Event Offer Validation', skills: ['promo-spend-validate'], status: '\u25A3' },
    { id: 'FNL.FN.RMF.002', name: 'Campaign Analysis & ROI Tracking', skills: ['campaign-roi-measure', 'promo-spend-validate'], status: '\u25A3' },
    { id: 'FNL.FN.RMF.003', name: 'Category P&L Validation', skills: ['margin-assurance-track', 'kpi-compute'], status: '\u25A3' },
  ]},
  { code: 'FN-IRM', name: 'Investor Relations', purpose: 'Investor communication, performance reporting.', sops: [
    { id: 'FNL.FN.IRM.001', name: 'Investor Communication & Engagement', skills: ['content-brief-draft'], status: '\u25A3' },
    { id: 'FNL.FN.IRM.002', name: 'Performance Reporting & Insight Management', skills: ['kpi-compute', 'budget-variance-analyze'], status: '\u25A3' },
  ]},
];

// ─── All Value Streams ──────────────────────────────────────────────────────

export const VALUE_STREAMS: ValueStream[] = [
  { code: 'BO', name: 'Business Owner', workflows: BO_WORKFLOWS, skillsCoverage: 'fully-populated' },
  { code: 'BPC', name: 'Brand & Product Creation', workflows: BPC_WORKFLOWS, skillsCoverage: 'fully-populated' },
  { code: 'RM', name: 'Revenue & Merchandising', workflows: RM_WORKFLOWS, skillsCoverage: 'fully-populated' },
  { code: 'SV', name: 'Sourcing & Vendor', workflows: SV_WORKFLOWS, skillsCoverage: 'fully-populated' },
  { code: 'SC', name: 'Supply Chain', workflows: SC_WORKFLOWS, skillsCoverage: 'fully-populated' },
  { code: 'OP', name: 'Store & Channel Operations', workflows: OP_WORKFLOWS, skillsCoverage: 'fully-populated' },
  { code: 'FN', name: 'Finance', workflows: FN_WORKFLOWS, skillsCoverage: 'fully-populated' },
];

// ─── Summary stats (derived — never hand-maintain) ───────────────────────────

const VS_STATS: Record<string, { workflows: number; sops: number }> = Object.fromEntries(
  VALUE_STREAMS.map((vs) => [
    vs.code,
    {
      workflows: vs.workflows.length,
      sops: vs.workflows.reduce((total, wf) => total + wf.sops.length, 0),
    },
  ]),
);

export function getVSStats(code: string): { workflows: number; sops: number } {
  return VS_STATS[code] ?? { workflows: 0, sops: 0 };
}

export const UNIQUE_SKILL_COUNT = new Set(
  VALUE_STREAMS.flatMap((vs) => vs.workflows.flatMap((wf) => wf.sops.flatMap((sop) => sop.skills))),
).size;

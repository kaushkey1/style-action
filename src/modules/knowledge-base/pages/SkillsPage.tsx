import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Wand2, RefreshCw, XCircle, ArrowLeft, ExternalLink, Search, Plus, Upload,
  MessageSquare, Plug, Bot, Brain, BarChart3, Briefcase, AlertCircle, CheckCircle, FileText,
  Activity, Clock, TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  MetricGrid,
  PageHeader,
  SectionHeader,
  Spinner,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  Label,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  FilterMultiSelect,
  FilterSearch,
} from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import {
  fetchSkills,
  fetchSkill,
  fetchSkillManifest,
  sendGBrainChat,
  gbrainKeys,
} from '@/modules/agentic-brain/api/agenticBrainApi';
// SkillManifest type is inferred from fetchSkillManifest return
import type { Skill } from '@/modules/agentic-brain/data/agenticBrainTypes';

// ─── F&L Planned Skills (from Skills Registry v0.2.0) ───────────────────────

const FNL_SKILLS: Skill[] = [
  { name: 'fnl-trend-signal-sense', category: 'fnl-trend', path: '', source: 'planned', description: 'Scan external sources for emerging trend signals' },
  { name: 'fnl-trend-brief-synthesize', category: 'fnl-trend', path: '', source: 'planned', description: 'Synthesize curated trend brief from raw signals' },
  { name: 'fnl-competitive-benchmark-lift', category: 'fnl-trend', path: '', source: 'planned', description: 'Pull competitive intelligence for a category' },
  { name: 'fnl-prior-season-performance-lift', category: 'fnl-analytics', path: '', source: 'planned', description: 'Lift prior-season ROS, sell-through, GMROI' },
  { name: 'fnl-inseason-sellthrough-monitor', category: 'fnl-analytics', path: '', source: 'planned', description: 'Monitor live sell-through per option per cluster' },
  { name: 'fnl-performance-attribution-analyze', category: 'fnl-analytics', path: '', source: 'planned', description: 'Attribute outcomes to design attributes' },
  { name: 'fnl-kpi-compute', category: 'fnl-analytics', path: '', source: 'planned', description: 'Compute named KPIs against declared targets' },
  { name: 'fnl-cohort-segmentation-analyze', category: 'fnl-customer', path: '', source: 'planned', description: 'Define or refresh customer cohorts and segments' },
  { name: 'fnl-customer-style-profile', category: 'fnl-customer', path: '', source: 'planned', description: 'Maintain customer style profile and wardrobe state' },
  { name: 'fnl-loyalty-eligibility-evaluate', category: 'fnl-customer', path: '', source: 'planned', description: 'Evaluate customer eligibility for loyalty actions' },
  { name: 'fnl-demand-forecast-lift', category: 'fnl-planning', path: '', source: 'planned', description: 'Pull or recompute demand forecast for a category' },
  { name: 'fnl-otb-envelope-validate', category: 'fnl-planning', path: '', source: 'planned', description: 'Validate proposed buy against OTB envelope' },
  { name: 'fnl-range-architecture-design', category: 'fnl-planning', path: '', source: 'planned', description: 'Construct Style x Option x Size range plan' },
  { name: 'fnl-allocation-optimize', category: 'fnl-planning', path: '', source: 'planned', description: 'Compute store-level allocation from locked range' },
  { name: 'fnl-cluster-classify', category: 'fnl-planning', path: '', source: 'planned', description: 'Classify stores into operating clusters' },
  { name: 'fnl-pricing-architecture-set', category: 'fnl-pricing', path: '', source: 'planned', description: 'Set retail pricing across MRP, channel, brand' },
  { name: 'fnl-promotion-design', category: 'fnl-pricing', path: '', source: 'planned', description: 'Construct promotion mechanics against constraints' },
  { name: 'fnl-markdown-cascade-plan', category: 'fnl-pricing', path: '', source: 'planned', description: 'Plan markdown waterfall for at-risk options' },
  { name: 'fnl-content-brief-draft', category: 'fnl-content', path: '', source: 'planned', description: 'Draft content/campaign brief from upstream inputs' },
  { name: 'fnl-creative-qa-evaluate', category: 'fnl-content', path: '', source: 'planned', description: 'Evaluate creative against brand guidelines' },
  { name: 'fnl-vm-story-generate', category: 'fnl-content', path: '', source: 'planned', description: 'Generate VM story deck per cluster/zone' },
  { name: 'fnl-planogram-compliance-check', category: 'fnl-content', path: '', source: 'planned', description: 'Check planogram execution from store photos' },
  { name: 'fnl-campaign-roi-measure', category: 'fnl-marketing', path: '', source: 'planned', description: 'Compute campaign ROI and attribution' },
  { name: 'fnl-marketing-budget-allocate', category: 'fnl-marketing', path: '', source: 'planned', description: 'Allocate marketing budget across channels' },
  { name: 'fnl-influencer-affiliate-track', category: 'fnl-marketing', path: '', source: 'planned', description: 'Track influencer and affiliate performance' },
  { name: 'fnl-aop-target-cascade', category: 'fnl-business', path: '', source: 'planned', description: 'Cascade annual operating plan targets to category, channel, and store' },
  { name: 'fnl-business-case-evaluate', category: 'fnl-business', path: '', source: 'planned', description: 'Evaluate opportunity business cases — TAM, P&L impact, payback' },
  { name: 'fnl-initiative-portfolio-track', category: 'fnl-business', path: '', source: 'planned', description: 'Track initiative portfolio status, milestones, and RAG for PMO' },
  { name: 'fnl-compliance-case-manage', category: 'fnl-business', path: '', source: 'planned', description: 'Manage ethics, legal, and compliance case intake and resolution' },
  { name: 'fnl-design-spec-draft', category: 'fnl-design', path: '', source: 'planned', description: 'Draft and version tech packs and style master specifications' },
  { name: 'fnl-sample-lifecycle-track', category: 'fnl-design', path: '', source: 'planned', description: 'Track proto, fit, SMS, PP, and photo sample lifecycle' },
  { name: 'fnl-fit-evaluate', category: 'fnl-design', path: '', source: 'planned', description: 'Evaluate fit block conformance and fit approval decisions' },
  { name: 'fnl-color-material-approve', category: 'fnl-design', path: '', source: 'planned', description: 'Evaluate lab dip, dye lot, fabric, and trim approvals' },
  { name: 'fnl-lookbook-compose', category: 'fnl-design', path: '', source: 'planned', description: 'Compose seasonal stories and lookbooks with styling guidance' },
  { name: 'fnl-size-curve-plan', category: 'fnl-design', path: '', source: 'planned', description: 'Plan size curves and size packs from sales and returns data' },
  { name: 'fnl-collab-capsule-structure', category: 'fnl-design', path: '', source: 'planned', description: 'Structure designer collabs and capsule commercial terms' },
  { name: 'fnl-sustainability-cert-track', category: 'fnl-design', path: '', source: 'planned', description: 'Track GOTS, BCI, and recycled certifications and renewals' },
  { name: 'fnl-vendor-capability-match', category: 'fnl-sourcing', path: '', source: 'planned', description: 'Match style requirements to AVL vendor capability matrix' },
  { name: 'fnl-vendor-capacity-check', category: 'fnl-sourcing', path: '', source: 'planned', description: 'Check vendor capacity availability and booking feasibility' },
  { name: 'fnl-rfx-manage', category: 'fnl-sourcing', path: '', source: 'planned', description: 'Draft, compare, and score RFI, RFQ, and RFP responses' },
  { name: 'fnl-contract-tot-negotiate', category: 'fnl-sourcing', path: '', source: 'planned', description: 'Prepare contract and terms-of-trade negotiation positions' },
  { name: 'fnl-fabric-trim-source', category: 'fnl-sourcing', path: '', source: 'planned', description: 'Identify fabric and trim sourcing options and plan indents' },
  { name: 'fnl-qa-inspection-execute', category: 'fnl-sourcing', path: '', source: 'planned', description: 'Run PPI, in-line, and FRI inspection checklists with AQL sampling' },
  { name: 'fnl-grn-invoice-reconcile', category: 'fnl-sourcing', path: '', source: 'planned', description: 'Reconcile GRN, PO, and invoice three-way with exception flags' },
  { name: 'fnl-supplier-performance-score', category: 'fnl-sourcing', path: '', source: 'planned', description: 'Score suppliers on OTIF, quality, compliance, and cost' },
  { name: 'fnl-transport-route-optimize', category: 'fnl-supply-chain', path: '', source: 'planned', description: 'Optimize truck and rider routes across first, mid, and last mile' },
  { name: 'fnl-warehouse-throughput-plan', category: 'fnl-supply-chain', path: '', source: 'planned', description: 'Plan warehouse and sort centre throughput and capacity' },
  { name: 'fnl-otd-track', category: 'fnl-supply-chain', path: '', source: 'planned', description: 'Track on-time delivery and analyze breaches per lane' },
  { name: 'fnl-manpower-roster-plan', category: 'fnl-supply-chain', path: '', source: 'planned', description: 'Roster warehouse and rider manpower against volume forecast' },
  { name: 'fnl-returns-flow-route', category: 'fnl-supply-chain', path: '', source: 'planned', description: 'Route reverse logistics for customer and B2B returns' },
  { name: 'fnl-network-design-evaluate', category: 'fnl-supply-chain', path: '', source: 'planned', description: 'Evaluate warehouse and transport network design scenarios' },
  { name: 'fnl-goh-sizepack-configure', category: 'fnl-supply-chain', path: '', source: 'planned', description: 'Configure garment-on-hanger conversion and size packs' },
  { name: 'fnl-store-performance-monitor', category: 'fnl-store-ops', path: '', source: 'planned', description: 'Monitor store health KPIs — footfall, conversion, ATV, audits' },
  { name: 'fnl-returns-triage-classify', category: 'fnl-store-ops', path: '', source: 'planned', description: 'Classify returns as worn, unworn, or damaged for resaleability' },
  { name: 'fnl-stylist-recommend', category: 'fnl-store-ops', path: '', source: 'planned', description: 'Support stylist bookings and outfit recommendations' },
  { name: 'fnl-trial-conversion-track', category: 'fnl-store-ops', path: '', source: 'planned', description: 'Track trial room usage and trial-to-conversion funnel' },
  { name: 'fnl-cash-reconcile', category: 'fnl-store-ops', path: '', source: 'planned', description: 'Reconcile store cash, tenders, and banking' },
  { name: 'fnl-customer-issue-resolve', category: 'fnl-store-ops', path: '', source: 'planned', description: 'Triage customer issues with resolution playbooks and SLAs' },
  { name: 'fnl-pdp-content-qa', category: 'fnl-store-ops', path: '', source: 'planned', description: 'QA product listings and PDP content against standards' },
  { name: 'fnl-b2b-beat-plan', category: 'fnl-store-ops', path: '', source: 'planned', description: 'Plan B2B sales beats, coverage, and productivity' },
  { name: 'fnl-partner-lifecycle-track', category: 'fnl-store-ops', path: '', source: 'planned', description: 'Track channel partner lifecycle from onboarding to exit' },
  { name: 'fnl-workforce-schedule', category: 'fnl-store-ops', path: '', source: 'planned', description: 'Schedule store workforce against traffic forecast' },
  { name: 'fnl-budget-variance-analyze', category: 'fnl-finance', path: '', source: 'planned', description: 'Analyze budget versus actual variance with MIS commentary' },
  { name: 'fnl-books-closure-execute', category: 'fnl-finance', path: '', source: 'planned', description: 'Execute month and quarter books closure checklists' },
  { name: 'fnl-ap-ar-reconcile', category: 'fnl-finance', path: '', source: 'planned', description: 'Reconcile AP and AR with ageing and exception management' },
  { name: 'fnl-tax-compliance-check', category: 'fnl-finance', path: '', source: 'planned', description: 'Check direct tax, GST, and customs compliance and notices' },
  { name: 'fnl-margin-assurance-track', category: 'fnl-finance', path: '', source: 'planned', description: 'Track intake margin and category P&L margin assurance' },
  { name: 'fnl-promo-spend-validate', category: 'fnl-finance', path: '', source: 'planned', description: 'Validate promotion and event spend against approvals and TOT' },
  { name: 'fnl-cashflow-forecast', category: 'fnl-finance', path: '', source: 'planned', description: 'Forecast cashflow and assess liquidity variance' },
  { name: 'fnl-capex-governance-track', category: 'fnl-finance', path: '', source: 'planned', description: 'Track CAPEX governance — budget versus spend versus milestones' },
];

// ─── Anthropic Community Skills ─────────────────────────────────────────────

const ANTHROPIC_SKILLS: Skill[] = [
  { name: 'algorithmic-art', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/algorithmic-art', source: 'community', description: 'Create algorithmic art using p5.js with seeded randomness and interactive parameter exploration' },
  { name: 'brand-guidelines', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/brand-guidelines', source: 'community', description: 'Apply official brand colors and typography to artifacts with company look-and-feel' },
  { name: 'canvas-design', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/canvas-design', source: 'community', description: 'Create beautiful visual art in PNG and PDF using design philosophy' },
  { name: 'claude-api', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/claude-api', source: 'community', description: 'Build applications with the Claude API using proper SDK patterns' },
  { name: 'doc-coauthoring', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring', source: 'community', description: 'Co-author documentation through structured workflows — proposals, specs, decision docs' },
  { name: 'docx', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/docx', source: 'community', description: 'Generate and edit Word documents with formatting, tables of contents, and letterheads' },
  { name: 'frontend-design', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/frontend-design', source: 'community', description: 'Create distinctive, production-grade frontend interfaces with high design quality' },
  { name: 'internal-comms', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/internal-comms', source: 'community', description: 'Write internal communications — status reports, leadership updates, newsletters, FAQs' },
  { name: 'mcp-builder', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/mcp-builder', source: 'community', description: 'Build MCP servers to integrate external APIs and services (Python FastMCP or Node SDK)' },
  { name: 'pdf', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/pdf', source: 'community', description: 'Read, create, merge, split, watermark, encrypt, and OCR PDF documents' },
  { name: 'pptx', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/pptx', source: 'community', description: 'Create slide decks, pitch decks, and presentations with templates and layouts' },
  { name: 'skill-creator', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/skill-creator', source: 'community', description: 'Create, modify, test, and benchmark agent skills with performance analysis' },
  { name: 'slack-gif-creator', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator', source: 'community', description: 'Create animated GIFs optimized for Slack with validation tools' },
  { name: 'theme-factory', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/theme-factory', source: 'community', description: 'Style artifacts with 10 pre-set themes or generate new themes on-the-fly' },
  { name: 'web-artifacts-builder', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder', source: 'community', description: 'Build elaborate multi-component HTML artifacts with React, Tailwind, and shadcn/ui' },
  { name: 'webapp-testing', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/webapp-testing', source: 'community', description: 'Test local web apps using Playwright — screenshots, logs, UI verification' },
  { name: 'xlsx', category: 'anthropic', path: 'https://github.com/anthropics/skills/tree/main/skills/xlsx', source: 'community', description: 'Create, read, edit, clean, chart, and convert spreadsheet files (xlsx, csv, tsv)' },
];

// Backend categories to KEEP (Impetus-relevant only). Others are filtered out.
const ALLOWED_BACKEND_CATEGORIES = new Set([
  'general', 'ecommerce', 'devops', 'productivity', 'research',
  'creative', 'software-development', 'github',
]);

// Backend skill names to always keep even if category is filtered
const ALLOWED_BACKEND_SKILLS = new Set([
  'garment-costing', 'techpack-generator', 'wiki-search', 'design-browser',
  'doc-generator', 'orchestrator', 'cron-manager', 'kanban-orchestrator',
  'kanban-worker', 'google-workspace', 'notion', 'linear', 'powerpoint',
  'nano-pdf', 'ocr-and-documents', 'arxiv', 'blogwatcher',
  'research-paper-writing', 'claude-design', 'design-md',
  'location-intel', 'location-intel-audit', 'store-deep-review',
  'store-deep-review-audit', 'store-deep-review-check',
  'qcom-crawl', 'fashion-price-benchmark', 'granary-collect',
  'fnl-competitive-benchmark-lift', 'fnl-pricing-architecture-set',
]);

// All existing categories for the dropdown
const KNOWN_CATEGORIES = [
  'general', 'ecommerce', 'devops', 'productivity', 'research',
  'creative', 'software-development', 'github',
  'fnl-trend', 'fnl-analytics', 'fnl-customer', 'fnl-planning', 'fnl-pricing',
  'fnl-content', 'fnl-marketing', 'fnl-business', 'fnl-design', 'fnl-sourcing',
  'fnl-supply-chain', 'fnl-store-ops', 'fnl-finance', 'anthropic',
];

// ─── Category config ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; color: string; badgeVariant: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'purple' }> = {
  sourcing: { icon: Briefcase, color: 'text-blue-600', badgeVariant: 'info' },
  research: { icon: Brain, color: 'text-purple-600', badgeVariant: 'purple' },
  analytics: { icon: BarChart3, color: 'text-green-600', badgeVariant: 'success' },
  automation: { icon: Bot, color: 'text-amber-600', badgeVariant: 'warning' },
  default: { icon: Wand2, color: 'text-primary', badgeVariant: 'primary' },
};

const DEFAULT_CATEGORY = { icon: Wand2, color: 'text-primary', badgeVariant: 'primary' as const };

function getCategoryConfig(category: string): { icon: LucideIcon; color: string; badgeVariant: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'purple' } {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_CONFIG)) {
    if (key.includes(k)) return v;
  }
  return DEFAULT_CATEGORY;
}

// ─── Skill Detail View ──────────────────────────────────────────────────────

function SkillDetailView({
  skillName,
  skillCategory,
  skillSource,
  onBack,
}: {
  skillName: string;
  skillCategory: string;
  skillSource?: string;
  onBack: () => void;
}): React.ReactNode {
  const navigate = useNavigate();

  // For non-backend skills, look up from hardcoded data instead of fetching
  const isLocalSkill = skillSource === 'planned' || skillSource === 'community';
  const localSkill = isLocalSkill
    ? [...FNL_SKILLS, ...ANTHROPIC_SKILLS].find((s) => s.name === skillName)
    : null;

  const { data: skill, isLoading } = useQuery({
    queryKey: gbrainKeys.skill(skillName),
    queryFn: () => fetchSkill(skillName),
    enabled: !isLocalSkill,
  });

  // Fetch execution stats for backend skills
  const { data: manifest } = useQuery({
    queryKey: gbrainKeys.skillManifest(skillName),
    queryFn: () => fetchSkillManifest(skillName),
    enabled: !isLocalSkill,
  });

  if (!isLocalSkill && isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const effectiveSkill = localSkill ?? skill;
  if (!effectiveSkill) return null;

  const category = effectiveSkill.category ?? skillCategory ?? 'general';
  const catCfg = getCategoryConfig(category);
  const skillContent = isLocalSkill ? (localSkill?.description ?? '') : ((skill as { content?: string } | undefined)?.content ?? '');
  const skillPath = effectiveSkill.path;
  const hasStats = manifest != null && manifest.total_runs > 0;
  const hasLocalPath = Boolean(skillPath && !skillPath.startsWith('http'));
  const hasSourceLink = Boolean(skillPath?.startsWith('http'));

  return (
    <div className="space-y-4">
      {/* Title bar — back + skill name + badges inline, CTA right (h-9) */}
      <PageHeader
        onBack={onBack}
        title={effectiveSkill.name}
        badges={
          <>
            <Badge variant={catCfg.badgeVariant} size="sm">{category}</Badge>
            {skillSource === 'planned' && <Badge variant="warning" size="sm">Planned</Badge>}
            {skillSource === 'community' && <Badge variant="info" size="sm">Community</Badge>}
          </>
        }
        actions={
          <Button
            size="sm"
            className="h-9"
            onClick={() =>
              navigate('/agents-brain/chat', {
                state: { skill: { name: effectiveSkill.name, category } },
              })
            }
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1" /> Use in Chat
          </Button>
        }
      />

      {/* Meta — path, execution stats, source — on top, before the content */}
      {(hasLocalPath || hasStats || hasSourceLink) && (
        <Card className="space-y-4 p-4">
          {hasLocalPath && (
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Path</p>
              <p className="mt-1 truncate font-mono text-sm text-gray-700">{skillPath}</p>
            </div>
          )}
          {hasStats && manifest && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">Execution Stats</p>
            <MetricGrid columns={4}>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Total Runs</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{manifest.total_runs}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Success Rate</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {Math.round(manifest.success_rate * 100)}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Avg Duration</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {manifest.avg_duration_s < 60
                    ? `${Math.round(manifest.avg_duration_s)}s`
                    : `${Math.round(manifest.avg_duration_s / 60)}m`}
                </p>
              </div>
              {manifest.last_run_at && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Last Run</span>
                  </div>
                  <p className="text-xs font-medium text-gray-900">{formatDateTime(manifest.last_run_at)}</p>
                </div>
              )}
            </MetricGrid>
            </div>
          )}
          {hasSourceLink && (
            <a
              href={skillPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> View on GitHub
            </a>
          )}
        </Card>
      )}

      {/* Content */}
      <Card className="p-4">
        <p className="text-xs font-medium text-gray-500 uppercase mb-3">
          {isLocalSkill ? 'Description' : 'Skill Prompt'}
        </p>
        <div className="prose prose-sm max-w-none text-gray-700 overflow-x-auto">
          <Markdown remarkPlugins={[remarkGfm]}>{skillContent}</Markdown>
        </div>

        {/* Config (backend skills only) */}
        {!isLocalSkill && skill?.config && Object.keys(skill.config).length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">Configuration</p>
            <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(skill.config, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Skill Card (Accio-style) ───────────────────────────────────────────────

function SkillCard({
  skill,
  onClick,
}: {
  skill: Skill;
  onClick: () => void;
}): React.ReactNode {
  const catCfg = getCategoryConfig(skill.category);
  const CatIcon = catCfg.icon;

  const description = skill.description ?? skill.name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Card
      className="p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View skill: ${skill.name}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <CatIcon className={cn('w-5 h-5', catCfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{skill.name}</h4>
            {skill.source === 'planned' && <Badge variant="warning" size="sm">Planned</Badge>}
            {skill.source === 'community' && <Badge variant="info" size="sm">Community</Badge>}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={catCfg.badgeVariant} size="sm">{skill.category}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Create Skill Dialog ────────────────────────────────────────────────────

function CreateSkillDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactNode {
  const queryClient = useQueryClient();
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('general');
  const [content, setContent] = useState('');
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const validateMut = useMutation({
    mutationFn: async () => {
      setValidationStatus('validating');
      const prompt = `I want to create a new agent skill. Please validate this skill document and tell me:
1. Is the format correct for a SKILL.md file?
2. Are there any issues, missing sections, or problems?
3. Suggest improvements if needed.
4. If it looks good, say "VALID" at the end.

Skill Name: ${skillName}
Category: ${category}

Document content:
${content}`;
      const res = await sendGBrainChat(prompt);
      return res.response;
    },
    onSuccess: (response) => {
      setValidationResult(response);
      setValidationStatus(response.includes('VALID') ? 'valid' : 'invalid');
    },
    onError: () => {
      setValidationResult('Could not validate. Check connection.');
      setValidationStatus('invalid');
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const prompt = `Create a new agent skill.

Name: ${skillName}
Category: ${category}

Use this content as the SKILL.md:

${content}

Save it to ~/.hermes/skills/${category}/${skillName}/SKILL.md

Confirm when done.`;
      const res = await sendGBrainChat(prompt, 10);
      return res.response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.skills() });
      onOpenChange(false);
      setSkillName('');
      setCategory('general');
      setContent('');
      setValidationResult(null);
      setValidationStatus('idle');
    },
  });

  const handleFileRead = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') setContent(text);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Add Capability
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-500">
            Provide a skill document. It will be validated for correctness before creating.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="my-custom-skill"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="skill-content">Skill Document (SKILL.md format)</Label>
            <div className="flex items-center gap-2 mt-1 mb-2">
              {/* eslint-disable-next-line no-restricted-syntax -- file input is hidden */}
              <input
                ref={fileRef}
                type="file"
                accept=".md,.txt,.yaml,.yml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileRead(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 mr-1" /> Upload .md file
              </Button>
              <span className="text-xs text-gray-400">or paste content below</span>
            </div>
            <Textarea
              id="skill-content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setValidationResult(null);
                setValidationStatus('idle');
              }}
              placeholder={`---\nname: my-skill\ndescription: What this skill does\n---\n# My Skill\n\n## When To Use\nDescribe triggers...\n\n## Steps\n1. Step one...\n2. Step two...`}
              className="mt-1 font-mono text-xs min-h-[200px]"
              rows={10}
            />
          </div>

          {/* Validation result */}
          {validationResult && (
            <div className={cn(
              'rounded-lg p-3 border text-sm',
              validationStatus === 'valid'
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200',
            )}>
              <div className="flex items-start gap-2">
                {validationStatus === 'valid' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div className="text-xs whitespace-pre-wrap text-gray-700">
                  {validationResult}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {validationStatus !== 'valid' ? (
            <Button
              onClick={() => validateMut.mutate()}
              disabled={!skillName.trim() || !content.trim() || validateMut.isPending}
            >
              {validateMut.isPending ? <Spinner size="sm" className="mr-1" /> : <FileText className="w-3.5 h-3.5 mr-1" />}
              Validate
            </Button>
          ) : (
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? <Spinner size="sm" className="mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
              Create Skill
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Connectors Placeholder ─────────────────────────────────────────────────

function ConnectorsTab(): React.ReactNode {
  const toast = useToast();
  return (
    <EmptyState
      icon={Plug}
      title="No connectors yet"
      description="Connect external tools and services to enhance your agents."
      action={
        <Button size="sm" onClick={() => toast.info('Connectors are coming soon.')}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Connector
        </Button>
      }
    />
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function SkillsPage(): React.ReactNode {
  const navigate = useNavigate();
  const [selectedSkill, setSelectedSkill] = useState<{ name: string; category: string; source?: string } | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  // Read search param for pre-filtering (from Workflows page)
  const searchParams = new URLSearchParams(window.location.search);
  const initialQ = searchParams.get('q');
  if (initialQ && !search && search !== initialQ) {
    // Defer to avoid render loop
    setTimeout(() => setSearch(initialQ), 0);
  }

  // Return path when arriving from an SOP (Workflows page) — completes the
  // SOP → skill → back-to-SOP journey. Internal paths only.
  const fromParam = searchParams.get('from');
  const fromLabel = searchParams.get('fromLabel');
  const returnToSop = fromParam?.startsWith('/') ? fromParam : null;
  const backToSopPill = returnToSop ? (
    <div>
      <Button variant="outline" size="sm" onClick={() => navigate(returnToSop)}>
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to SOP{fromLabel ? `: ${fromLabel}` : ''}
      </Button>
    </div>
  ) : null;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: gbrainKeys.skills(),
    queryFn: fetchSkills,
  });

  // Merge backend skills (filtered) with F&L planned + Anthropic community
  const backendSkills: Skill[] = (data?.skills ?? [])
    .filter((s) => ALLOWED_BACKEND_CATEGORIES.has(s.category) || ALLOWED_BACKEND_SKILLS.has(s.name))
    .map((s) => ({ ...s, source: 'backend' as const }));
  const allSkills: Skill[] = [...backendSkills, ...FNL_SKILLS, ...ANTHROPIC_SKILLS];

  // Deduplicate by name (backend takes priority)
  const seen = new Set<string>();
  const skills = allSkills.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });

  // Get unique categories for filter
  const categories = [...new Set(skills.map((s) => s.category))].sort();

  // Filter by search + category (multi) + source (multi)
  const selectedCategories = categoryFilter && categoryFilter !== 'all' ? new Set(categoryFilter.split(',')) : null;
  const selectedSources = sourceFilter && sourceFilter !== 'all' ? new Set(sourceFilter.split(',')) : null;

  const filtered = skills.filter((s) => {
    if (selectedCategories && !selectedCategories.has(s.category)) return false;
    if (selectedSources) {
      const skillSource = s.source ?? 'backend';
      const mappedSource = skillSource === 'backend' ? 'populated' : skillSource;
      if (!selectedSources.has(mappedSource)) return false;
    }
    if (!search) return true;
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? '').toLowerCase().includes(search.toLowerCase())
    );
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  // Detail view
  if (selectedSkill) {
    return (
      <div className="space-y-3">
        {backToSopPill}
        <SkillDetailView
          skillName={selectedSkill.name}
          skillCategory={selectedSkill.category}
          skillSource={selectedSkill.source}
          onBack={() => setSelectedSkill(null)}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={XCircle}
        title="Failed to load skills"
        description="Could not connect to the Agentic Brain backend."
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      {backToSopPill}
      {/* Title bar — menu name + CTAs on the right */}
      <PageHeader
        title="Capabilities"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        }
      />
      <Tabs defaultValue="skills">
        {/* Tabs left, search + filters right */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <TabsList variant="underline">
            <TabsTrigger value="skills" variant="underline">
              <Wand2 className="w-3.5 h-3.5" />
              Capabilities
              <Badge variant="default" size="sm" className="ml-1">{skills.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="connectors" variant="underline">
              <Plug className="w-3.5 h-3.5" />
              Connectors
            </TabsTrigger>
          </TabsList>

          {/* Search leads the right-side cluster (app-wide pattern), filters follow.
              FilterSearch shares the FilterMultiSelect trigger height contract
              (min-h-11 mobile / h-8 desktop) so the whole row lines up. */}
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <FilterSearch
              value={search}
              onChange={setSearch}
              placeholder="Search capabilities..."
              className="w-full sm:w-48"
            />
            <FilterMultiSelect
              value={sourceFilter}
              onChange={setSourceFilter}
              placeholder="Status"
              options={[
                { value: 'populated', label: 'Populated' },
                { value: 'planned', label: 'Planned' },
                { value: 'community', label: 'Community' },
              ]}
            />
            <FilterMultiSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="Category"
              options={categories.map((c) => ({ value: c, label: c }))}
            />
          </div>
        </div>

        {/* Skills tab */}
        <TabsContent value="skills">
          {skills.length === 0 ? (
            <EmptyState
              icon={Wand2}
              title="No capabilities found"
              description="No capabilities are registered yet."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches"
              description={`No skills match "${search}".`}
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, categorySkills]) => {
                const catCfg = getCategoryConfig(category);
                const CatIcon = catCfg.icon;
                return (
                  <div key={category}>
                    <SectionHeader
                      title={
                        <span className="flex items-center gap-2">
                          <CatIcon className={cn('w-4 h-4', catCfg.color)} />
                          <span className="capitalize">{category}</span>
                          <Badge variant={catCfg.badgeVariant} size="sm">
                            {categorySkills.length}
                          </Badge>
                        </span>
                      }
                    />
                    <MetricGrid columns={2}>
                      {categorySkills.map((skill) => (
                        <SkillCard
                          key={skill.name}
                          skill={skill}
                          onClick={() => setSelectedSkill({ name: skill.name, category: skill.category, source: skill.source })}
                        />
                      ))}
                    </MetricGrid>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Connectors tab */}
        <TabsContent value="connectors">
          <ConnectorsTab />
        </TabsContent>
      </Tabs>

      <CreateSkillDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

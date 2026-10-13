import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GitBranch, ChevronDown, ChevronRight, Play, Clock,
  Layers, Wand2, Activity, AlertTriangle, FileText, Plus,
  Briefcase, Palette, TrendingUp, Handshake, Truck, Store, Landmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  MetricGrid,
  MetricCard,
  PageHeader,
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Label,
  Input,
  Checkbox,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { CronJobsPage } from './CronJobsPage';

// ─── Custom SOP Forms ───────────────────────────────────────────────────────

interface SOPFormField {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

interface SOPFormCheckbox {
  key: string;
  label: string;
  defaultChecked?: boolean;
}

interface SOPFormConfig {
  title: string;
  fields: SOPFormField[];
  checkboxes: SOPFormCheckbox[];
  buildPrompt: (values: Record<string, string>, checks: Record<string, boolean>) => string;
}

// SOPs that have linked specs in the Specs module
const SPEC_LINKED_SOPS = new Set([
  'FNL.RM.UCX.003', 'FNL.RM.CAT.002', 'FNL.OP.SRV.001',
  'FNL.RM.PRP.006', 'FNL.OP.STI.001',
]);

const CUSTOM_SOP_FORMS: Record<string, SOPFormConfig> = {
  'FNL.RM.UCX.003': {
    title: 'Competitive Benchmark Analysis',
    fields: [
      { key: 'category', label: 'Category', required: true, placeholder: "e.g., Men's T-Shirts, Women's Kurtas" },
      { key: 'brand', label: 'Your Brand', required: true, placeholder: 'e.g., Reliance Trends' },
      { key: 'competitors', label: 'Competitors', placeholder: 'e.g., Zara, H&M, Uniqlo (leave empty for auto-detect)' },
    ],
    checkboxes: [
      { key: 'pdf', label: 'Generate PDF report', defaultChecked: true },
      { key: 'pricing', label: 'Include pricing ladder comparison', defaultChecked: true },
      { key: 'assortment', label: 'Include assortment depth analysis', defaultChecked: true },
    ],
    buildPrompt: (v, c) => {
      const lines = [
        `Run competitive benchmark analysis.`,
        ``,
        `Category: ${v.category}`,
        `Brand: ${v.brand}`,
        `Competitors: ${v.competitors || 'Auto-detect top 3 competitors in this category'}`,
        ``,
        `Instructions:`,
        `1. Search the web for current pricing, assortment depth, and promotional activity for each competitor in the "${v.category}" category in India`,
        `2. Build a structured comparison table with columns: Price Range, Average Price, SKU Count, Current Promotions, Key Design Themes, Channel Presence, Customer Rating`,
        `3. Analyze price positioning (premium/mid/value) and assortment gaps`,
        `4. Write 3-5 strategic recommendations`,
      ];
      if (c.pdf) lines.push(`5. Generate a professional PDF report using reportlab — save as competitive_benchmark.pdf`);
      if (c.pricing) lines.push(`6. Include a pricing ladder visualization in the report`);
      if (c.assortment) lines.push(`7. Include assortment depth breakdown by sub-category`);
      lines.push(``, `Save all output files to the workspace. The PDF must be polished, boardroom-ready, with clear headers, tables, and branding.`);
      return lines.join('\n');
    },
  },
  'FNL.RM.CAT.002': {
    title: 'Retail Pricing Benchmark',
    fields: [
      { key: 'category', label: 'Category', required: true, placeholder: "e.g., Men's Casual Shirts" },
      { key: 'brand', label: 'Your Brand', required: true, placeholder: 'e.g., Reliance Trends' },
      { key: 'competitors', label: 'Competitors', placeholder: 'e.g., Zara, H&M, Marks & Spencer (leave empty for auto-detect)' },
      { key: 'targetMargin', label: 'Target Margin %', placeholder: 'e.g., 55%' },
    ],
    checkboxes: [
      { key: 'pdf', label: 'Generate PDF report', defaultChecked: true },
      { key: 'mrp', label: 'Include MRP ladder analysis', defaultChecked: true },
      { key: 'channel', label: 'Include channel pricing comparison', defaultChecked: true },
    ],
    buildPrompt: (v, c) => {
      const lines = [
        `Run retail pricing benchmark analysis.`,
        ``,
        `Category: ${v.category}`,
        `Brand: ${v.brand}`,
        `Competitors: ${v.competitors || 'Auto-detect top 3 competitors'}`,
        `Target Margin: ${v.targetMargin || 'Not specified'}`,
        ``,
        `Instructions:`,
        `1. Search the web for current retail pricing of "${v.category}" across competitors in India`,
        `2. Build pricing ladder: Entry / Mid / Premium price points per competitor`,
        `3. Compare MRP, discount depth, and effective selling price`,
        `4. Analyze margin implications and competitive positioning`,
        `5. Recommend optimal price architecture for ${v.brand}`,
      ];
      if (c.pdf) lines.push(`6. Generate a professional PDF report using reportlab — save as pricing_benchmark.pdf`);
      if (c.mrp) lines.push(`7. Include MRP ladder visualization with price bands`);
      if (c.channel) lines.push(`8. Include channel-wise pricing comparison (Store vs Online vs Marketplace)`);
      lines.push(``, `Save all output files to the workspace. PDF must be polished and boardroom-ready.`);
      return lines.join('\n');
    },
  },
  'FNL.RM.PRP.006': {
    title: 'Quick Commerce Price Intelligence',
    fields: [
      { key: 'category', label: 'Product Category', required: true, placeholder: 'e.g., detergents, cooking_oil, biscuits, ghee' },
      { key: 'pincode', label: 'Pincode', required: true, placeholder: 'e.g., 400059' },
      { key: 'platforms', label: 'Platforms', placeholder: 'e.g., blinkit,instamart,dmart (leave empty for all)' },
    ],
    checkboxes: [
      { key: 'crawl', label: 'Crawl fresh data (skip if data already exists)', defaultChecked: true },
      { key: 'pipeline', label: 'Run full analysis pipeline (competitive join + insights + PDF)', defaultChecked: true },
    ],
    buildPrompt: (v, c) => {
      const platforms = v.platforms || 'blinkit,instamart';
      const lines = [
        `Run quick commerce price intelligence using the granary-collect skill.`,
        ``,
        `Category: ${v.category}`,
        `Pincode: ${v.pincode}`,
        `Platforms: ${platforms}`,
        ``,
        `IMPORTANT: Use the deterministic pipeline at /disk101/Jitesh/granary-reports/. Do NOT try to build your own comparison — the pipeline handles brand-level overlap, price landscape, white space analysis, and pack architecture correctly.`,
        ``,
        `Steps:`,
      ];
      if (c.crawl) {
        lines.push(
          `1. Crawl fresh data:`,
          `   cd /disk101/Jitesh/granary-reports`,
          `   UV_CACHE_DIR=.uv-cache uv run python scripts/qcom_collect.py --pincode ${v.pincode} --category ${v.category} --platforms ${platforms} --connect 9222`,
          `   This creates data/qcom/<date>_${v.pincode}_${v.category}.csv`,
          ``,
        );
      }
      if (c.pipeline) {
        lines.push(
          `${c.crawl ? '2' : '1'}. Run the full deterministic pipeline:`,
          `   cd /disk101/Jitesh/granary-reports`,
          `   bash assortment-intelligence/build.sh`,
          ``,
          `   This runs 6 steps:`,
          `   - ETL (xlsx → data.ts)`,
          `   - Competitive join (brand overlap, price landscape, white space, pack architecture)`,
          `   - Insights analysis`,
          `   - Advanced analysis`,
          `   - PDF rendering (@react-pdf/renderer)`,
          `   - Post-build verification`,
          ``,
          `${c.crawl ? '3' : '2'}. Copy the output PDF to the workspace:`,
          `   cp assortment-intelligence/reports/reliance-grocery-2026-06/output/assortment-intelligence.pdf ./assortment-intelligence.pdf`,
          ``,
        );
      }
      if (!c.pipeline) {
        lines.push(
          `${c.crawl ? '2' : '1'}. Copy the output CSV to the workspace:`,
          `   cp data/qcom/*_${v.pincode}_${v.category}*.csv ./${v.category}_${v.pincode}.csv`,
          ``,
          `${c.crawl ? '3' : '2'}. Summarize the CSV: top brands by rank, price range per platform, discount depth.`,
        );
      }
      lines.push(
        `Available categories: detergents, cooking_oil, dals, ghee, dry_fruits, rice, biscuits, flours, spices, tea, snacks, breakfast_cereals, salt_sugar, chocolates, pasta_noodles`,
      );
      return lines.join('\n');
    },
  },
  'FNL.RM.PRP.007': {
    title: 'Price & Promo Position Report',
    fields: [
      { key: 'subcategory', label: 'Subcategory', required: true, placeholder: 'e.g., womens-dresses, mens-formal-shirts' },
      { key: 'retailers', label: 'Retailers', placeholder: 'e.g., myntra, zara, westside, uniqlo, tatacliq (leave empty for all)' },
      { key: 'market', label: 'Market', placeholder: 'e.g., India' },
    ],
    checkboxes: [
      { key: 'pdf', label: 'Generate magazine-quality PDF report', defaultChecked: true },
    ],
    buildPrompt: (v, c) => {
      const retailers = v.retailers || 'myntra, zara, westside, uniqlo, tatacliq';
      const market = v.market || 'India';
      const lines = [
        `Generate a competitive price & promo position report using the fashion-price-benchmark skill.`,
        ``,
        `Subcategory: ${v.subcategory}`,
        `Retailers: ${retailers}`,
        `Market: ${market}`,
        ``,
        `Crawl real prices, build the price landscape, and generate the magazine PDF report.`,
        `Build the price landscape — MRP ranges, discount depth, promo intensity per retailer.`,
        `Analyze competitive positioning — who is cheapest, who is premium, where are the gaps.`,
      ];
      if (c.pdf) {
        lines.push(
          `Generate a magazine-quality PDF report — polished, boardroom-ready, with:`,
          `- Price ladder visualization per retailer`,
          `- Discount landscape comparison`,
          `- Promo calendar heatmap`,
          `- Strategic recommendations`,
          `Save as price_promo_report.pdf in the workspace.`,
        );
      }
      return lines.join('\n');
    },
  },
  'FNL.OP.STI.001': {
    title: 'Neighbourhood Analysis',
    fields: [
      { key: 'storeCode', label: 'Store Code', required: true, placeholder: 'e.g., MUM-ANDHERI-001' },
      { key: 'vertical', label: 'Vertical', placeholder: 'e.g., grocery, fashion (leave empty for both)' },
    ],
    checkboxes: [
      { key: 'pdf', label: 'Generate PDF report', defaultChecked: true },
    ],
    buildPrompt: (v, c) => {
      const lines = [
        `Run neighbourhood analysis using the location-intel skill.`,
        ``,
        `Store Code: ${v.storeCode}`,
        `Vertical: ${v.vertical || 'all'}`,
        ``,
        `Analyze the neighbourhood around this store — demographics, competition, catchment, footfall patterns.`,
      ];
      if (c.pdf) lines.push(`Generate a PDF report and save to workspace.`);
      return lines.join('\n');
    },
  },
  'FNL.OP.STI.002': {
    title: 'Neighbourhood Audit',
    fields: [
      { key: 'storeCode', label: 'Store Code', required: true, placeholder: 'e.g., MUM-ANDHERI-001' },
    ],
    checkboxes: [
      { key: 'autoFind', label: 'Auto-find latest report', defaultChecked: true },
    ],
    buildPrompt: (v) => {
      return `Run neighbourhood audit using the location-intel-audit skill.\n\nStore Code: ${v.storeCode}\n\nAudit the latest neighbourhood analysis report for this store. Check data freshness, flag stale insights, and surface any changes since the last report.`;
    },
  },
  'FNL.OP.SRV.001': {
    title: 'Store Health Check',
    fields: [
      { key: 'storeCode', label: 'Store Code', required: true, placeholder: 'e.g., MUM-ANDHERI-001' },
      { key: 'dataSource', label: 'Data Source Path', placeholder: 'e.g., /path/to/data (leave empty for default)' },
    ],
    checkboxes: [
      { key: 'pdf', label: 'Generate PDF report', defaultChecked: true },
    ],
    buildPrompt: (v, c) => {
      const lines = [
        `Run store health check using the store-deep-review skill.`,
        ``,
        `Store Code: ${v.storeCode}`,
        `Data Source: ${v.dataSource || 'default'}`,
        ``,
        `Perform a deep review of store health — sales performance, inventory accuracy, staffing, customer metrics, VM compliance.`,
      ];
      if (c.pdf) lines.push(`Generate a comprehensive PDF report and save to workspace.`);
      return lines.join('\n');
    },
  },
  'FNL.OP.SRV.002': {
    title: 'Review Audit',
    fields: [
      { key: 'storeCode', label: 'Store Code', required: true, placeholder: 'e.g., MUM-ANDHERI-001' },
    ],
    checkboxes: [
      { key: 'autoFind', label: 'Auto-find latest report', defaultChecked: true },
    ],
    buildPrompt: (v) => {
      return `Run review audit using the store-deep-review-audit skill.\n\nStore Code: ${v.storeCode}\n\nAudit the latest store health check report. Verify data accuracy, check for missing sections, and flag any issues with the review quality.`;
    },
  },
  'FNL.OP.SRV.003': {
    title: 'Quality Gate',
    fields: [
      { key: 'reportPath', label: 'Report PDF Path', required: true, placeholder: 'Path to the report PDF to verify' },
    ],
    checkboxes: [
      { key: 'strict', label: 'Strict mode (fail on warnings)', defaultChecked: false },
    ],
    buildPrompt: (v, c) => {
      return `Run quality gate check using the store-deep-review-check skill.\n\nReport: ${v.reportPath}\nStrict Mode: ${c.strict ? 'yes' : 'no'}\n\nVerify the report passes all quality checks — data completeness, formatting, internal consistency, and readability.`;
    },
  },
};
import {
  VALUE_STREAMS,
  STATUS_LABELS,
  STATUS_BADGE_VARIANT,
  getVSStats,
  UNIQUE_SKILL_COUNT,
} from '../data/workflowsData';
import type { ValueStream, Workflow, SOP } from '../data/workflowsData';
import { launchKanbanTask, dispatchTask, gbrainKeys } from '../api/agenticBrainApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ─── SOP Detail View ────────────────────────────────────────────────────────

function SOPDetailView({
  sop,
  workflow,
  valueStream,
  onBack,
}: {
  sop: SOP;
  workflow: Workflow;
  valueStream: ValueStream;
  onBack: () => void;
}): React.ReactNode {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [executeOpen, setExecuteOpen] = useState(false);
  const isSkeleton = sop.status === '\u25A1';
  const customForm = CUSTOM_SOP_FORMS[sop.id];

  // Deep link back to this exact SOP, carried along when jumping to a skill
  // so the Capabilities page can offer a "Back to SOP" return path.
  const sopUrl = `/agents-brain/workflows?vs=${valueStream.code}&wf=${workflow.code}&sop=${sop.id}`;
  const skillLinkFor = (skill: string): string =>
    `/knowledge-base/skills?q=fnl-${skill}&from=${encodeURIComponent(sopUrl)}&fromLabel=${encodeURIComponent(sop.name)}`;

  // Form state for custom forms
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formChecks, setFormChecks] = useState<Record<string, boolean>>(() => {
    if (!customForm) return {};
    const defaults: Record<string, boolean> = {};
    customForm.checkboxes.forEach((cb) => { defaults[cb.key] = cb.defaultChecked ?? false; });
    return defaults;
  });

  const defaultPrompt = `Execute SOP: ${sop.id} — ${sop.name}\n\nWorkflow: ${workflow.code} · ${workflow.name}\nValue Stream: ${valueStream.code} · ${valueStream.name}\n\nPurpose: ${workflow.purpose}\n\nSkills to invoke:\n${sop.skills.map((s) => `- fnl-${s}`).join('\n')}`;
  const [editedPrompt, setEditedPrompt] = useState(defaultPrompt);

  // Build the final prompt from custom form or raw textarea
  const getFinalPrompt = (): string => {
    if (customForm) return customForm.buildPrompt(formValues, formChecks);
    return editedPrompt;
  };

  // Check if custom form has required fields filled
  const isFormValid = (): boolean => {
    if (!customForm) return editedPrompt.trim().length > 0;
    return customForm.fields
      .filter((f) => f.required)
      .every((f) => (formValues[f.key] ?? '').trim().length > 0);
  };

  const launchMut = useMutation({
    mutationFn: async () => {
      const result = await launchKanbanTask({
        title: customForm ? `${customForm.title}: ${formValues.category ?? sop.name}` : `Execute: ${sop.name}`,
        body: getFinalPrompt(),
        assignee: 'default',
        auto_dispatch: true,
      });
      try { await dispatchTask(result.id); } catch { /* next sweep */ }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.tasks() });
      setExecuteOpen(false);
      navigate('/agents-brain/virtual-team');
    },
  });

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Detail header — app-wide pattern: back button + title + status + CTA */}
      <PageHeader
        title={sop.name}
        onBack={onBack}
        badges={
          <Badge variant={STATUS_BADGE_VARIANT[sop.status]} size="sm">
            {STATUS_LABELS[sop.status]}
          </Badge>
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditedPrompt(defaultPrompt);
              setExecuteOpen(true);
            }}
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            Execute SOP
          </Button>
        }
      />

      {/* Skeleton warning */}
      {isSkeleton && (
        <Card className="p-3 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Skills not yet implemented</p>
              <p className="text-xs text-amber-600 mt-0.5">
                This SOP references skills that are planned but not yet available on the agent. Execution may fail or produce incomplete results. You can still launch it with a custom prompt.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4">
      {/* Execute confirmation dialog */}
      <Dialog open={executeOpen} onOpenChange={setExecuteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4 text-primary" /> Execute SOP
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{customForm ? customForm.title : `${sop.id} · ${sop.name}`}</p>
              <p className="text-xs text-gray-500 mt-0.5">{workflow.name}</p>
            </div>

            {isSkeleton && !customForm && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  This SOP&apos;s skills ({sop.skills.join(', ')}) are not yet implemented.
                </p>
              </div>
            )}

            {customForm ? (
              <>
                {/* Custom structured form */}
                {customForm.fields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={`sop-${field.key}`}>
                      {field.label}{field.required ? ' *' : ''}
                    </Label>
                    <Input
                      id={`sop-${field.key}`}
                      value={formValues[field.key] ?? ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="mt-1"
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  {customForm.checkboxes.map((cb) => (
                    <label key={cb.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer min-h-[36px]">
                      <Checkbox
                        checked={formChecks[cb.key] ?? false}
                        onCheckedChange={(checked) => setFormChecks((prev) => ({ ...prev, [cb.key]: checked === true }))}
                      />
                      {cb.label}
                    </label>
                  ))}
                </div>
              </>
            ) : (
              /* Generic textarea */
              <div>
                <Label htmlFor="sop-prompt">Task Prompt (editable)</Label>
                <Textarea
                  id="sop-prompt"
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="mt-1 font-mono text-xs min-h-[150px]"
                  rows={8}
                />
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Skills Used</p>
              <div className="flex flex-wrap gap-1">
                {sop.skills.map((s) => (
                  <Badge key={s} variant={customForm ? 'primary' : isSkeleton ? 'warning' : 'primary'} size="sm">
                    {!customForm && isSkeleton && <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />}
                    fnl-{s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExecuteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => launchMut.mutate()}
              disabled={!isFormValid() || launchMut.isPending}
            >
              {launchMut.isPending ? <Spinner size="sm" className="mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
              {customForm ? 'Run' : 'Run'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">SOP ID</p>
              <p className="text-sm text-gray-900 font-mono">{sop.id}</p>
            </div>
            {SPEC_LINKED_SOPS.has(sop.id) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/agents-brain/specs')}
                className="shrink-0"
              >
                <FileText className="w-3.5 h-3.5 mr-1" /> View Spec
              </Button>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Workflow</p>
            <p className="text-sm text-gray-900">{workflow.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{workflow.purpose}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Value Stream</p>
            <p className="text-sm text-gray-900">{valueStream.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Skills Used</p>
            <MetricGrid columns={3}>
              {sop.skills.map((skill) => (
                <Card
                  key={skill}
                  className="p-3 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(skillLinkFor(skill))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(skillLinkFor(skill));
                  }}
                  aria-label={`View skill fnl-${skill}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                      <Wand2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">fnl-{skill}</p>
                      <p className="text-[10px] text-primary">View in Skills</p>
                    </div>
                  </div>
                </Card>
              ))}
            </MetricGrid>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Workflow List View (inside a value stream) ─────────────────────────────

function WorkflowListView({
  vs,
  initialExpanded,
  onBack,
  onSelectSOP,
}: {
  vs: ValueStream;
  initialExpanded?: string | null;
  onBack: () => void;
  onSelectSOP: (sop: SOP, workflow: Workflow) => void;
}): React.ReactNode {
  const navigate = useNavigate();
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(initialExpanded ?? null);

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Detail header — app-wide pattern: back button + title + badge */}
      <PageHeader
        title={vs.name}
        onBack={onBack}
        badges={<Badge variant="default" size="sm">{vs.workflows.length} workflows</Badge>}
      />

      {vs.workflows.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="Structure ready"
          description={`${vs.name} has ${getVSStats(vs.code).workflows} workflows and ${getVSStats(vs.code).sops} SOPs planned. SOP details will be populated soon.`}
        />
      ) : (
        <div className="space-y-2">
          {vs.workflows.map((wf) => {
            const isExpanded = expandedWorkflow === wf.code;
            return (
              <Card key={wf.code} className="overflow-hidden">
                <button
                  onClick={() => setExpandedWorkflow(isExpanded ? null : wf.code)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors min-h-[44px]"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{wf.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{wf.purpose}</p>
                  </div>
                  <Badge variant="default" size="sm">{wf.sops.length} SOPs</Badge>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left py-2 px-4 text-xs font-medium text-gray-500">SOP ID</th>
                            <th className="text-left py-2 px-4 text-xs font-medium text-gray-500">Name</th>
                            <th className="text-left py-2 px-4 text-xs font-medium text-gray-500">Skills</th>
                            <th className="text-center py-2 px-4 text-xs font-medium text-gray-500">Spec</th>
                            <th className="text-center py-2 px-4 text-xs font-medium text-gray-500">Status</th>
                            <th className="text-right py-2 px-4 text-xs font-medium text-gray-500">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wf.sops.map((sop) => (
                            <tr
                              key={sop.id}
                              className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => onSelectSOP(sop, wf)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') onSelectSOP(sop, wf);
                              }}
                            >
                              <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{sop.id}</td>
                              <td className="py-2.5 px-4 text-sm text-gray-900">{sop.name}</td>
                              <td className="py-2.5 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {sop.skills.map((s) => (
                                    <Badge key={s} variant="primary" size="sm">{s}</Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {SPEC_LINKED_SOPS.has(sop.id) ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/agents-brain/specs`);
                                    }}
                                    className="inline-flex"
                                  >
                                    <Badge variant="info" size="sm" className="cursor-pointer hover:opacity-80">
                                      <FileText className="w-2.5 h-2.5 mr-0.5" /> Spec
                                    </Badge>
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <Badge variant={STATUS_BADGE_VARIANT[sop.status]} size="sm">
                                  {STATUS_LABELS[sop.status]}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); onSelectSOP(sop, wf); }}
                                >
                                  <Play className="w-3.5 h-3.5 mr-1" /> Execute
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Value stream visual identity ────────────────────────────────────────────
// Distinct icon + tinted tile per stream so the 7 cards are scannable at a
// glance (categorical hues; status stays semantic green via the Badge).

const VS_VISUALS: Record<string, { icon: LucideIcon; tile: string; ink: string }> = {
  BO: { icon: Briefcase, tile: 'bg-primary/5', ink: 'text-primary' },
  BPC: { icon: Palette, tile: 'bg-pink-50', ink: 'text-pink-600' },
  RM: { icon: TrendingUp, tile: 'bg-emerald-50', ink: 'text-emerald-600' },
  SV: { icon: Handshake, tile: 'bg-amber-50', ink: 'text-amber-600' },
  SC: { icon: Truck, tile: 'bg-sky-50', ink: 'text-sky-600' },
  OP: { icon: Store, tile: 'bg-violet-50', ink: 'text-violet-600' },
  FN: { icon: Landmark, tile: 'bg-teal-50', ink: 'text-teal-600' },
};

const VS_VISUAL_FALLBACK = { icon: Layers, tile: 'bg-primary/5', ink: 'text-primary' };

// ─── Main Page — Value Stream Overview ───────────────────────────────────────

export function WorkflowsPage(): React.ReactNode {
  // Selection lives in the URL (?vs=&wf=&sop=) so SOPs are deep-linkable and
  // browser back / cross-page round-trips (e.g. skill → back to SOP) work.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'schedule' ? 'schedule' : 'workflows';
  // Schedule-tab CTA lives in the page title bar; the dialog it opens renders
  // inside CronJobsPage, so the open state is lifted here.
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const selectedVS = VALUE_STREAMS.find((vs) => vs.code === searchParams.get('vs')) ?? null;
  const sopId = searchParams.get('sop');
  let selectedSOP: { sop: SOP; workflow: Workflow } | null = null;
  if (selectedVS && sopId) {
    for (const wf of selectedVS.workflows) {
      const sop = wf.sops.find((s) => s.id === sopId);
      if (sop) {
        selectedSOP = { sop, workflow: wf };
        break;
      }
    }
  }

  // SOP detail view (Workflows tab only)
  if (activeTab === 'workflows' && selectedSOP && selectedVS) {
    const { workflow } = selectedSOP;
    return (
      <SOPDetailView
        sop={selectedSOP.sop}
        workflow={workflow}
        valueStream={selectedVS}
        onBack={() => setSearchParams({ vs: selectedVS.code, wf: workflow.code })}
      />
    );
  }

  // Workflow list view (Workflows tab only)
  if (activeTab === 'workflows' && selectedVS) {
    return (
      <WorkflowListView
        vs={selectedVS}
        initialExpanded={searchParams.get('wf')}
        onBack={() => setSearchParams({})}
        onSelectSOP={(sop, workflow) =>
          setSearchParams({ vs: selectedVS.code, wf: workflow.code, sop: sop.id })
        }
      />
    );
  }

  // Value stream overview
  const totalWorkflows = VALUE_STREAMS.reduce((sum, vs) => sum + getVSStats(vs.code).workflows, 0);
  const totalSOPs = VALUE_STREAMS.reduce((sum, vs) => sum + getVSStats(vs.code).sops, 0);

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Title bar — menu name; tab-scoped CTA sits here per the app pattern */}
      <PageHeader
        title="Workflows"
        actions={
          activeTab === 'schedule' ? (
            <Button size="sm" onClick={() => setScheduleDialogOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Schedule New
            </Button>
          ) : undefined
        }
      />
      <Tabs
        value={activeTab}
        onValueChange={(v) => setSearchParams(v === 'schedule' ? { tab: 'schedule' } : {})}
      >
        <TabsList variant="underline">
          <TabsTrigger value="workflows">
            <GitBranch className="w-3.5 h-3.5" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="w-3.5 h-3.5" />
            Schedule
          </TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="space-y-4">
          {/* Summary KPIs */}
          <MetricGrid columns={4}>
            <MetricCard label="Value Streams" value={VALUE_STREAMS.length} icon={Layers} iconColor="info" />
            <MetricCard label="Workflows" value={totalWorkflows} icon={GitBranch} iconColor="info" />
            <MetricCard label="SOPs" value={totalSOPs} icon={Activity} iconColor="warning" />
            <MetricCard label="Skills" value={UNIQUE_SKILL_COUNT} icon={Wand2} iconColor="success" subtitle="70 registry + 7 live" />
          </MetricGrid>

          {/* Value stream cards */}
          <MetricGrid columns={3}>
            {VALUE_STREAMS.map((vs) => {
              const stats = getVSStats(vs.code);
              const isPopulated = vs.skillsCoverage === 'fully-populated';
              const visual = VS_VISUALS[vs.code] ?? VS_VISUAL_FALLBACK;
              return (
                <Card
                  key={vs.code}
                  className="p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-200"
                  onClick={() => setSearchParams({ vs: vs.code })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSearchParams({ vs: vs.code });
                    }
                  }}
                  aria-label={`View ${vs.name}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', visual.tile)}>
                      <visual.icon className={cn('w-4 h-4', visual.ink)} aria-hidden />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">{vs.name}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span>{stats.workflows} workflows</span>
                    <span>{stats.sops} SOPs</span>
                  </div>
                  <Badge
                    variant={isPopulated ? 'success' : 'default'}
                    size="sm"
                  >
                    {isPopulated ? 'Skills Populated' : 'Structure Ready'}
                  </Badge>
                </Card>
              );
            })}
          </MetricGrid>
        </TabsContent>
        <TabsContent value="schedule">
          <CronJobsPage
            createDialogOpen={scheduleDialogOpen}
            onCreateDialogOpenChange={setScheduleDialogOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

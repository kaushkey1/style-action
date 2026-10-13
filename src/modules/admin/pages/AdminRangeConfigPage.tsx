/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid */
import { useState } from "react";
import {
  Settings2,
  RotateCcw,
  Save,
  Layers,
  ShoppingBag,
  SlidersHorizontal,
  Calendar,
  MapPin,
  Target,
  TrendingUp,
  Users,
  Share2,
  CheckCircle,
  Edit2,
  Trash2,
  Plus,
  Clock,
  AlertCircle,
  Building2,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  Input,
  PageHeader,
  SectionHeader,
  Badge,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { mockRangeConfig } from "@/modules/range/data/mockRangeConfig";
import type { RangeConfig } from "@/modules/range/data/mockRangeConfig";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

// ── Helpers ──

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5 border-b border-gray-50 last:border-b-0">
      <div className="flex-1">
        <span className="text-sm text-gray-700">{label}</span>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TabActions({ onSave, onReset }: { onSave: () => void; onReset: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="outline" onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-1.5" />
        Reset to Defaults
      </Button>
      <Button onClick={onSave}>
        <Save className="w-4 h-4 mr-1.5" />
        Save Changes
      </Button>
    </div>
  );
}

// ── Tab 1: Range Params ──

function RangeParamsTab({
  config,
  onChange,
  onSave,
  onReset,
}: {
  config: RangeConfig;
  onChange: (params: Partial<RangeConfig["rangeParams"]>) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <SectionCard icon={Layers} title="Target Options per Store">
        <FormRow label="A0/A1 (Premium)">
          <Input
            type="number"
            value={config.rangeParams.targetOptionsA0A1}
            onChange={(e) => onChange({ targetOptionsA0A1: Number(e.target.value) })}
            className="w-24 text-center text-sm h-8 py-1.5"
          />
        </FormRow>
        <FormRow label="A2 (Standard)">
          <Input
            type="number"
            value={config.rangeParams.targetOptionsA2}
            onChange={(e) => onChange({ targetOptionsA2: Number(e.target.value) })}
            className="w-24 text-center text-sm h-8 py-1.5"
          />
        </FormRow>
        <FormRow label="A3 (Value)">
          <Input
            type="number"
            value={config.rangeParams.targetOptionsA3}
            onChange={(e) => onChange({ targetOptionsA3: Number(e.target.value) })}
            className="w-24 text-center text-sm h-8 py-1.5"
          />
        </FormRow>
      </SectionCard>

      <SectionCard icon={SlidersHorizontal} title="Depth">
        <FormRow label="Default Size Set">
          <Input
            type="number"
            value={config.rangeParams.defaultSizeSet}
            onChange={(e) => onChange({ defaultSizeSet: Number(e.target.value) })}
            className="w-24 text-center text-sm h-8 py-1.5"
          />
        </FormRow>
      </SectionCard>

      <SectionCard icon={SlidersHorizontal} title="Density">
        <FormRow label="Target pcs/SFT">
          <Input
            type="number"
            step="0.01"
            value={config.rangeParams.stockingDensityTarget}
            onChange={(e) => onChange({ stockingDensityTarget: Number(e.target.value) })}
            className="w-24 text-center text-sm h-8 py-1.5"
          />
        </FormRow>
      </SectionCard>

      <SectionCard icon={SlidersHorizontal} title="Option Reduction">
        <FormRow label="Network target" hint="currently at 2,024 avg — On track">
          <Input
            type="number"
            value={config.rangeParams.optionReductionTarget}
            onChange={(e) => onChange({ optionReductionTarget: Number(e.target.value) })}
            className="w-24 text-center text-sm h-8 py-1.5"
          />
        </FormRow>
      </SectionCard>

      <TabActions onSave={onSave} onReset={onReset} />
    </div>
  );
}

// ── Tab 2: Fashion Split ──

function FashionSplitTab({
  config,
  onChange,
  onSave,
  onReset,
}: {
  config: RangeConfig;
  onChange: (params: Partial<RangeConfig["fashionSplit"]>) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const grades = [
    {
      label: "A0/A1 (Premium)",
      coreKey: "a0a1Core" as const,
      fashionKey: "a0a1Fashion" as const,
    },
    {
      label: "A2 (Standard)",
      coreKey: "a2Core" as const,
      fashionKey: "a2Fashion" as const,
    },
    {
      label: "A3 (Value)",
      coreKey: "a3Core" as const,
      fashionKey: "a3Fashion" as const,
    },
  ];

  return (
    <div className="space-y-4">
      {}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {grades.map((grade) => {
          const coreVal = config.fashionSplit[grade.coreKey];
          const fashionVal = config.fashionSplit[grade.fashionKey];
          const total = coreVal + fashionVal;
          const isValid = total === 100;

          return (
            <div key={grade.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{grade.label}</h3>
              <div className="space-y-3">
                <div>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label className="text-xs text-gray-500 block mb-1">Core %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={coreVal}
                    onChange={(e) => onChange({ [grade.coreKey]: Number(e.target.value) })}
                    className="w-full text-center text-sm h-8 py-1.5"
                  />
                </div>
                <div>
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label className="text-xs text-gray-500 block mb-1">Fashion %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={fashionVal}
                    onChange={(e) => onChange({ [grade.fashionKey]: Number(e.target.value) })}
                    className="w-full text-center text-sm h-8 py-1.5"
                  />
                </div>
                {/* Sum indicator */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className={cn("text-xs font-semibold", isValid ? "text-green-700" : "text-red-600")}>
                    {total}% {isValid ? "" : "(must equal 100%)"}
                  </span>
                </div>
                {/* Visual bar */}
                <div className="flex h-2.5 rounded-lg overflow-hidden">
                  {}
                  <div
                    className="bg-primary-200 transition-all duration-200"
                    // eslint-disable-next-line no-restricted-syntax -- dynamic width
                    style={{ width: `${coreVal}%` }}
                    title={`Core: ${coreVal}%`}
                  />
                  {}
                  <div
                    className="bg-primary transition-all duration-200"
                    // eslint-disable-next-line no-restricted-syntax -- dynamic width
                    style={{ width: `${fashionVal}%` }}
                    title={`Fashion: ${fashionVal}%`}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Core {coreVal}%</span>
                  <span>Fashion {fashionVal}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TabActions onSave={onSave} onReset={onReset} />
    </div>
  );
}

// ── Tab 3: External Brands ──

function ExternalBrandsTab({
  config,
  onChange,
  onSave,
  onReset,
}: {
  config: RangeConfig;
  onChange: (params: Partial<RangeConfig["externalBrands"]>) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <SectionCard icon={ShoppingBag} title="External Brand Guardrails">
        <FormRow label="External Brand Floor" hint="Minimum percentage of external brands in the assortment">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={100}
              value={config.externalBrands.floor}
              onChange={(e) => onChange({ floor: Number(e.target.value) })}
              className="w-24 text-center text-sm h-8 py-1.5"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </FormRow>
        <FormRow label="External Brand Ceiling" hint="Maximum percentage of external brands in the assortment">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={100}
              value={config.externalBrands.ceiling}
              onChange={(e) => onChange({ ceiling: Number(e.target.value) })}
              className="w-24 text-center text-sm h-8 py-1.5"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </FormRow>
      </SectionCard>

      {/* Visual range indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Allowed Range" />
        <div className="relative h-6 rounded-lg bg-gray-100 overflow-hidden">
          {}
          <div
            className="absolute top-0 bottom-0 bg-primary/20 border-l-2 border-r-2 border-primary transition-all duration-200"
            // eslint-disable-next-line no-restricted-syntax -- dynamic value
            style={{
              left: `${config.externalBrands.floor}%`,
              width: `${config.externalBrands.ceiling - config.externalBrands.floor}%`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-500">
          <span>0%</span>
          <span className="text-primary font-medium">
            {config.externalBrands.floor}% — {config.externalBrands.ceiling}%
          </span>
          <span>100%</span>
        </div>
      </div>

      <TabActions onSave={onSave} onReset={onReset} />
    </div>
  );
}

// ── Tab 6: Buying Models ──

interface BuyingModel {
  id: string;
  name: string;
  ownership: "Own Label" | "External Brand" | "Consignment";
  marginTarget: number;
  leadTimeDays: number;
  minOrderQty: number;
  maxOrderValue: number;
  channels: string[];
  isActive: boolean;
}

function BuyingModelsTab() {
  const { success, info } = useToast();
  const [models, setModels] = useState<BuyingModel[]>([
    {
      id: "BM001",
      name: "Own Label Standard",
      ownership: "Own Label",
      marginTarget: 65,
      leadTimeDays: 90,
      minOrderQty: 500,
      maxOrderValue: 100000,
      channels: ["Store", "Online", "Marketplace"],
      isActive: true,
    },
    {
      id: "BM002",
      name: "External Brand Premium",
      ownership: "External Brand",
      marginTarget: 45,
      leadTimeDays: 60,
      minOrderQty: 200,
      maxOrderValue: 250000,
      channels: ["Store", "Online"],
      isActive: true,
    },
    {
      id: "BM003",
      name: "Consignment Fast Fashion",
      ownership: "Consignment",
      marginTarget: 35,
      leadTimeDays: 30,
      minOrderQty: 100,
      maxOrderValue: 50000,
      channels: ["Store"],
      isActive: false,
    },
  ]);

  const [editingModel, setEditingModel] = useState<BuyingModel | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggleActive = (id: string) => {
    setModels(models.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m)));
    info("Buying model status updated");
  };

  const handleDelete = (id: string) => {
    setModels(models.filter((m) => m.id !== id));
    success("Buying model deleted successfully");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionHeader title="Buying Model Registry" />
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Model
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead className="w-24">Model ID</DataTableHead>
                <DataTableHead className="w-48">Name</DataTableHead>
                <DataTableHead className="w-32">Ownership</DataTableHead>
                <DataTableHead className="text-right w-28">Margin Target</DataTableHead>
                <DataTableHead className="text-right w-28">Lead Time</DataTableHead>
                <DataTableHead className="w-64">Channels</DataTableHead>
                <DataTableHead className="text-center w-20">Status</DataTableHead>
                <DataTableHead className="text-right w-24">Actions</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {models.map((model) => (
                <DataTableRow key={model.id}>
                  <DataTableCell className="font-mono text-xs">{model.id}</DataTableCell>
                  <DataTableCell className="font-medium">{model.name}</DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={
                        model.ownership === "Own Label"
                          ? "primary"
                          : model.ownership === "External Brand"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {model.ownership}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-right font-medium">{model.marginTarget}%</DataTableCell>
                  <DataTableCell className="text-right">{model.leadTimeDays} days</DataTableCell>
                  <DataTableCell>
                    <div className="flex gap-1 flex-wrap">
                      {model.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <Switch checked={model.isActive} onCheckedChange={() => handleToggleActive(model.id)} />
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingModel(model)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-error hover:text-error hover:bg-error-50" onClick={() => handleDelete(model.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>

      {(showAddForm || editingModel) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{editingModel ? "Edit Buying Model" : "Add New Buying Model"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs text-gray-500 block mb-1">Model Name</label>
                <Input defaultValue={editingModel?.name} placeholder="Enter model name" className="h-8" />
              </div>
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs text-gray-500 block mb-1">Ownership Type</label>
                <Select defaultValue={editingModel?.ownership || "Own Label"}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Own Label">Own Label</SelectItem>
                    <SelectItem value="External Brand">External Brand</SelectItem>
                    <SelectItem value="Consignment">Consignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs text-gray-500 block mb-1">Margin Target (%)</label>
                <Input type="number" defaultValue={editingModel?.marginTarget} placeholder="65" className="h-8" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingModel(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  success("Buying model saved successfully");
                  setShowAddForm(false);
                  setEditingModel(null);
                }}
              >
                Save Model
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab 7: Planning Calendar ──

interface CalendarMilestone {
  id: string;
  name: string;
  type: "Season Start" | "Range Review" | "Order Cutoff" | "Launch Date" | "Critical Date";
  daysFromSeasonStart: number;
  notificationDays: number;
  assignedTeam: string;
  isActive: boolean;
}

function PlanningCalendarTab() {
  const { info } = useToast();
  const [milestones, setMilestones] = useState<CalendarMilestone[]>([
    {
      id: "ML001",
      name: "Range Planning Kickoff",
      type: "Season Start",
      daysFromSeasonStart: -180,
      notificationDays: 7,
      assignedTeam: "Merchandising",
      isActive: true,
    },
    {
      id: "ML002",
      name: "Initial Range Review",
      type: "Range Review",
      daysFromSeasonStart: -150,
      notificationDays: 3,
      assignedTeam: "Leadership",
      isActive: true,
    },
    {
      id: "ML003",
      name: "Vendor Order Cutoff",
      type: "Order Cutoff",
      daysFromSeasonStart: -120,
      notificationDays: 14,
      assignedTeam: "Buying",
      isActive: true,
    },
    {
      id: "ML004",
      name: "Season Launch",
      type: "Launch Date",
      daysFromSeasonStart: 0,
      notificationDays: 30,
      assignedTeam: "All Teams",
      isActive: true,
    },
  ]);

  const handleToggleMilestone = (id: string) => {
    setMilestones(milestones.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m)));
    info("Milestone status updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionHeader title="Planning Calendar Configuration" />
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Milestone
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Season Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Current Season" hint="Active season for planning">
              <Select defaultValue="SS26">
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SS26">Spring/Summer 2026</SelectItem>
                  <SelectItem value="AW26">Autumn/Winter 2026</SelectItem>
                  <SelectItem value="SS27">Spring/Summer 2027</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Planning Horizon" hint="Days ahead for planning">
              <Input type="number" defaultValue="365" className="w-24 text-center h-8" />
            </FormRow>
            <FormRow label="Review Cycle" hint="Days between reviews">
              <Input type="number" defaultValue="30" className="w-24 text-center h-8" />
            </FormRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Critical Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Early Warning Days" hint="Alert before critical dates">
              <Input type="number" defaultValue="14" className="w-24 text-center h-8" />
            </FormRow>
            <FormRow label="Auto-Escalate" hint="Escalate overdue items">
              <Switch defaultChecked />
            </FormRow>
            <FormRow label="Weekend Processing" hint="Process on weekends">
              <Switch />
            </FormRow>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>Milestone</DataTableHead>
                <DataTableHead>Type</DataTableHead>
                <DataTableHead className="text-right">Days from Season</DataTableHead>
                <DataTableHead className="text-right">Notification</DataTableHead>
                <DataTableHead>Team</DataTableHead>
                <DataTableHead className="text-center">Active</DataTableHead>
                <DataTableHead className="text-right">Actions</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {milestones.map((milestone) => (
                <DataTableRow key={milestone.id}>
                  <DataTableCell className="font-medium">{milestone.name}</DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={
                        milestone.type === "Critical Date"
                          ? "destructive"
                          : milestone.type === "Launch Date"
                            ? "primary"
                            : "outline"
                      }
                    >
                      {milestone.type}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-right font-mono text-sm">
                    {milestone.daysFromSeasonStart > 0 ? "+" : ""}
                    {milestone.daysFromSeasonStart}
                  </DataTableCell>
                  <DataTableCell className="text-right">{milestone.notificationDays} days</DataTableCell>
                  <DataTableCell>
                    <Badge variant="secondary">{milestone.assignedTeam}</Badge>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <Switch checked={milestone.isActive} onCheckedChange={() => handleToggleMilestone(milestone.id)} />
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 8: Store Network ──

interface StoreHierarchy {
  id: string;
  name: string;
  level: "Region" | "City" | "Store";
  parent?: string;
  pod: string;
  spaceAllocation: number;
  sisZone: string;
  grade: string;
}

function StoreNetworkTab() {
  // const { success } = useToast(); // For future use
  const [hierarchy] = useState<StoreHierarchy[]>([
    {
      id: "RG001",
      name: "North Region",
      level: "Region",
      pod: "Fashion Forward",
      spaceAllocation: 25000,
      sisZone: "Zone 1",
      grade: "A",
    },
    {
      id: "CT001",
      name: "Mumbai",
      level: "City",
      parent: "RG001",
      pod: "Fashion Forward",
      spaceAllocation: 12000,
      sisZone: "Zone 1",
      grade: "A+",
    },
    {
      id: "ST001",
      name: "Phoenix Palladium",
      level: "Store",
      parent: "CT001",
      pod: "Fashion Forward",
      spaceAllocation: 3500,
      sisZone: "Zone 1",
      grade: "A0",
    },
    {
      id: "ST002",
      name: "Linking Road",
      level: "Store",
      parent: "CT001",
      pod: "Fashion Forward",
      spaceAllocation: 2200,
      sisZone: "Zone 1",
      grade: "A1",
    },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionHeader title="Store Network Configuration" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Import CSV
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Store
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Network Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Stores</span>
              <span className="text-sm font-semibold">342</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cities</span>
              <span className="text-sm font-semibold">48</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Regions</span>
              <span className="text-sm font-semibold">6</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              POD Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fashion Forward</span>
              <Badge variant="primary">124 stores</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Value Conscious</span>
              <Badge variant="secondary">98 stores</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trend Seeker</span>
              <Badge variant="outline">120 stores</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              SIS Zones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Zone 1 (Premium)</span>
              <span className="text-sm font-semibold">28%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Zone 2 (Standard)</span>
              <span className="text-sm font-semibold">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Zone 3 (Value)</span>
              <span className="text-sm font-semibold">27%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>Name</DataTableHead>
                <DataTableHead>Level</DataTableHead>
                <DataTableHead>POD Assignment</DataTableHead>
                <DataTableHead className="text-right">Space (sqft)</DataTableHead>
                <DataTableHead>SIS Zone</DataTableHead>
                <DataTableHead>Grade</DataTableHead>
                <DataTableHead className="text-right">Actions</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {hierarchy.map((item) => (
                <DataTableRow key={item.id}>
                  <DataTableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {item.level === "Store" && <span className="text-gray-400 ml-4">└</span>}
                      {item.level === "City" && <span className="text-gray-400 ml-2">├</span>}
                      {item.name}
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={item.level === "Region" ? "primary" : item.level === "City" ? "secondary" : "outline"}
                    >
                      {item.level}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>{item.pod}</DataTableCell>
                  <DataTableCell className="text-right font-mono text-sm">
                    {item.spaceAllocation.toLocaleString()}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="outline">{item.sisZone}</Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={item.grade.startsWith("A") ? "primary" : "secondary"}>{item.grade}</Badge>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 9: KPI Thresholds ──

interface KPIThreshold {
  id: string;
  kpiName: string;
  category: string;
  greenMin: number;
  greenMax: number;
  amberMin: number;
  amberMax: number;
  redThreshold: number;
  alertEnabled: boolean;
  escalationHours: number;
}

function KPIThresholdsTab() {
  const { info } = useToast();
  const [thresholds, setThresholds] = useState<KPIThreshold[]>([
    {
      id: "KPI001",
      kpiName: "Sell-through Rate",
      category: "Performance",
      greenMin: 60,
      greenMax: 100,
      amberMin: 40,
      amberMax: 59,
      redThreshold: 39,
      alertEnabled: true,
      escalationHours: 24,
    },
    {
      id: "KPI002",
      kpiName: "Stock Cover Days",
      category: "Inventory",
      greenMin: 30,
      greenMax: 60,
      amberMin: 61,
      amberMax: 90,
      redThreshold: 91,
      alertEnabled: true,
      escalationHours: 48,
    },
    {
      id: "KPI003",
      kpiName: "GMROI",
      category: "Financial",
      greenMin: 2.5,
      greenMax: 10,
      amberMin: 1.5,
      amberMax: 2.49,
      redThreshold: 1.49,
      alertEnabled: false,
      escalationHours: 72,
    },
  ]);

  const handleToggleAlert = (id: string) => {
    setThresholds(thresholds.map((t) => (t.id === id ? { ...t, alertEnabled: !t.alertEnabled } : t)));
    info("Alert configuration updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionHeader title="KPI Threshold Configuration" />
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add KPI
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Alert Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Global Alerts" hint="Enable all KPI alerts">
              <Switch defaultChecked />
            </FormRow>
            <FormRow label="Alert Frequency" hint="Minimum hours between alerts">
              <Input type="number" defaultValue="6" className="w-24 text-center h-8" />
            </FormRow>
            <FormRow label="Batch Alerts" hint="Group alerts in digest">
              <Switch defaultChecked />
            </FormRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Escalation Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Auto-Escalate" hint="Escalate unresolved alerts">
              <Switch defaultChecked />
            </FormRow>
            <FormRow label="Escalation Levels" hint="Number of escalation tiers">
              <Select defaultValue="3">
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Levels</SelectItem>
                  <SelectItem value="3">3 Levels</SelectItem>
                  <SelectItem value="4">4 Levels</SelectItem>
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="Weekend Escalation" hint="Continue on weekends">
              <Switch />
            </FormRow>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>KPI Name</DataTableHead>
                <DataTableHead>Category</DataTableHead>
                <DataTableHead className="text-center">Green Range</DataTableHead>
                <DataTableHead className="text-center">Amber Range</DataTableHead>
                <DataTableHead className="text-center">Red Below</DataTableHead>
                <DataTableHead className="text-center">Alerts</DataTableHead>
                <DataTableHead className="text-right">Escalation</DataTableHead>
                <DataTableHead className="text-right">Actions</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {thresholds.map((kpi) => (
                <DataTableRow key={kpi.id}>
                  <DataTableCell className="font-medium">{kpi.kpiName}</DataTableCell>
                  <DataTableCell>
                    <Badge variant="outline">{kpi.category}</Badge>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <span className="text-xs font-mono text-green-700">
                      {kpi.greenMin}-{kpi.greenMax}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <span className="text-xs font-mono text-amber-600">
                      {kpi.amberMin}-{kpi.amberMax}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <span className="text-xs font-mono text-red-600">&lt;{kpi.redThreshold}</span>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <Switch checked={kpi.alertEnabled} onCheckedChange={() => handleToggleAlert(kpi.id)} />
                  </DataTableCell>
                  <DataTableCell className="text-right">{kpi.escalationHours}h</DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 10: FTF Integration ──

interface FTFCategory {
  id: string;
  name: string;
  signalWeight: number;
  autoAdjust: boolean;
  adjustmentRange: { min: number; max: number };
  lastSignal: "Strong Buy" | "Buy" | "Neutral" | "Reduce" | "Exit";
  confidence: number;
}

function FTFIntegrationTab() {
  const { info } = useToast();
  const [categories, setCategories] = useState<FTFCategory[]>([
    {
      id: "FTF001",
      name: "Athleisure",
      signalWeight: 85,
      autoAdjust: true,
      adjustmentRange: { min: -20, max: 30 },
      lastSignal: "Strong Buy",
      confidence: 92,
    },
    {
      id: "FTF002",
      name: "Sustainable Fashion",
      signalWeight: 70,
      autoAdjust: true,
      adjustmentRange: { min: -15, max: 25 },
      lastSignal: "Buy",
      confidence: 78,
    },
    {
      id: "FTF003",
      name: "Minimalist",
      signalWeight: 60,
      autoAdjust: false,
      adjustmentRange: { min: -10, max: 15 },
      lastSignal: "Neutral",
      confidence: 65,
    },
    {
      id: "FTF004",
      name: "Y2 K Revival",
      signalWeight: 45,
      autoAdjust: true,
      adjustmentRange: { min: -25, max: 20 },
      lastSignal: "Reduce",
      confidence: 52,
    },
  ]);

  const handleToggleAutoAdjust = (id: string) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, autoAdjust: !c.autoAdjust } : c)));
    info("Auto-adjustment configuration updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionHeader title="Fashion Trend Forecasting Integration" />
        <Button size="sm">
          <TrendingUp className="w-4 h-4 mr-1.5" />
          Sync Trends
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Integration Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="API Endpoint" hint="FTF service URL">
              <Input defaultValue="api.ftf.reliance.com" className="w-48 text-xs font-mono h-8" />
            </FormRow>
            <FormRow label="Sync Frequency" hint="Hours between syncs">
              <Input type="number" defaultValue="6" className="w-24 text-center h-8" />
            </FormRow>
            <FormRow label="Auto-Apply" hint="Apply recommendations">
              <Switch defaultChecked />
            </FormRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Signal Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Confidence Threshold" hint="Minimum confidence %">
              <Input type="number" defaultValue="70" className="w-24 text-center h-8" />
            </FormRow>
            <FormRow label="Signal Smoothing" hint="Average over days">
              <Input type="number" defaultValue="7" className="w-24 text-center h-8" />
            </FormRow>
            <FormRow label="Outlier Detection" hint="Remove anomalies">
              <Switch defaultChecked />
            </FormRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Safety Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Max Adjustment" hint="Maximum % change">
              <Input type="number" defaultValue="30" className="w-24 text-center h-8" />
            </FormRow>
            <FormRow label="Cooling Period" hint="Days between adjustments">
              <Input type="number" defaultValue="3" className="w-24 text-center h-8" />
            </FormRow>
            <FormRow label="Manual Override" hint="Allow manual control">
              <Switch defaultChecked />
            </FormRow>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>Trend Category</DataTableHead>
                <DataTableHead className="text-right">Signal Weight</DataTableHead>
                <DataTableHead className="text-center">Auto-Adjust</DataTableHead>
                <DataTableHead className="text-center">Adjustment Range</DataTableHead>
                <DataTableHead>Last Signal</DataTableHead>
                <DataTableHead className="text-right">Confidence</DataTableHead>
                <DataTableHead className="text-right">Actions</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {categories.map((category) => (
                <DataTableRow key={category.id}>
                  <DataTableCell className="font-medium">{category.name}</DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm font-medium">{category.signalWeight}%</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-200"
                          // eslint-disable-next-line no-restricted-syntax -- Dynamic signal weight percentage
                          style={{ width: `${category.signalWeight}%` }}
                        />
                      </div>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <Switch checked={category.autoAdjust} onCheckedChange={() => handleToggleAutoAdjust(category.id)} />
                  </DataTableCell>
                  <DataTableCell className="text-center">
                    <span className="text-xs font-mono">
                      {category.adjustmentRange.min}% to +{category.adjustmentRange.max}%
                    </span>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={
                        category.lastSignal === "Strong Buy"
                          ? "primary"
                          : category.lastSignal === "Buy"
                            ? "secondary"
                            : category.lastSignal === "Neutral"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {category.lastSignal}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        category.confidence >= 80
                          ? "text-green-700"
                          : category.confidence >= 60
                            ? "text-amber-600"
                            : "text-red-600",
                      )}
                    >
                      {category.confidence}%
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 11: Vendor Management ──

interface Vendor {
  id: string;
  name: string;
  type: "Manufacturer" | "Distributor" | "Brand Partner";
  capabilities: string[];
  performanceScore: number;
  leadTime: number;
  minOrder: number;
  paymentTerms: string;
  status: "Active" | "Probation" | "Blocked";
}

function VendorManagementTab() {
  // const { success, info } = useToast(); // For future use
  const [vendors] = useState<Vendor[]>([
    {
      id: "VND001",
      name: "Arvind Ltd",
      type: "Manufacturer",
      capabilities: ["Denim", "Casual", "Formal"],
      performanceScore: 92,
      leadTime: 45,
      minOrder: 5000,
      paymentTerms: "30 days",
      status: "Active",
    },
    {
      id: "VND002",
      name: "Raymond",
      type: "Brand Partner",
      capabilities: ["Formal", "Premium"],
      performanceScore: 88,
      leadTime: 60,
      minOrder: 3000,
      paymentTerms: "45 days",
      status: "Active",
    },
    {
      id: "VND003",
      name: "Gokaldas Exports",
      type: "Manufacturer",
      capabilities: ["Casual", "Athleisure"],
      performanceScore: 75,
      leadTime: 40,
      minOrder: 10000,
      paymentTerms: "15 days",
      status: "Probation",
    },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionHeader title="Vendor Management Configuration" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Performance Report
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Vendor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Vendor Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Vendors</span>
              <Badge variant="primary">142</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">On Probation</span>
              <Badge variant="secondary">8</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Blocked</span>
              <Badge variant="destructive">3</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Performance Scoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Quality Weight" hint="% of total score">
              <Input type="number" defaultValue="40" className="w-20 text-center h-8" />
            </FormRow>
            <FormRow label="Delivery Weight" hint="% of total score">
              <Input type="number" defaultValue="35" className="w-20 text-center h-8" />
            </FormRow>
            <FormRow label="Cost Weight" hint="% of total score">
              <Input type="number" defaultValue="25" className="w-20 text-center h-8" />
            </FormRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Min Score" hint="For active status">
              <Input type="number" defaultValue="70" className="w-20 text-center h-8" />
            </FormRow>
            <FormRow label="Probation Trigger" hint="Score threshold">
              <Input type="number" defaultValue="60" className="w-20 text-center h-8" />
            </FormRow>
            <FormRow label="Auto-Block" hint="Below threshold">
              <Switch defaultChecked />
            </FormRow>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>Vendor Name</DataTableHead>
                <DataTableHead>Type</DataTableHead>
                <DataTableHead>Capabilities</DataTableHead>
                <DataTableHead className="text-right">Score</DataTableHead>
                <DataTableHead className="text-right">Lead Time</DataTableHead>
                <DataTableHead className="text-right">Min Order</DataTableHead>
                <DataTableHead>Status</DataTableHead>
                <DataTableHead className="text-right">Actions</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {vendors.map((vendor) => (
                <DataTableRow key={vendor.id}>
                  <DataTableCell className="font-medium">{vendor.name}</DataTableCell>
                  <DataTableCell>
                    <Badge variant="outline">{vendor.type}</Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex gap-1 flex-wrap">
                      {vendor.capabilities.map((cap) => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        vendor.performanceScore >= 80
                          ? "text-green-700"
                          : vendor.performanceScore >= 60
                            ? "text-amber-600"
                            : "text-red-600",
                      )}
                    >
                      {vendor.performanceScore}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-right">{vendor.leadTime} days</DataTableCell>
                  <DataTableCell className="text-right font-mono text-sm">
                    {vendor.minOrder.toLocaleString()}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={
                        vendor.status === "Active"
                          ? "primary"
                          : vendor.status === "Probation"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {vendor.status}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 12: Channel Rules ──

interface ChannelRule {
  id: string;
  channel: string;
  type: "Primary" | "Secondary" | "Exclusive";
  distributionRules: string[];
  marginTarget: number;
  exclusivityPeriod?: number;
  minStockCover: number;
  maxDiscountAllowed: number;
}

function ChannelRulesTab() {
  // const { success } = useToast(); // For future use
  const [rules] = useState<ChannelRule[]>([
    {
      id: "CH001",
      channel: "Flagship Stores",
      type: "Primary",
      distributionRules: ["Full Range", "New Launches First", "Premium Lines"],
      marginTarget: 65,
      minStockCover: 45,
      maxDiscountAllowed: 30,
    },
    {
      id: "CH002",
      channel: "E-commerce",
      type: "Primary",
      distributionRules: ["Extended Range", "Online Exclusive", "Flash Sales"],
      marginTarget: 55,
      minStockCover: 30,
      maxDiscountAllowed: 50,
    },
    {
      id: "CH003",
      channel: "Marketplace",
      type: "Secondary",
      distributionRules: ["Curated Range", "Season End Stock"],
      marginTarget: 45,
      minStockCover: 20,
      maxDiscountAllowed: 60,
    },
    {
      id: "CH004",
      channel: "Airport Retail",
      type: "Exclusive",
      distributionRules: ["Travel Exclusive", "Premium Only"],
      marginTarget: 70,
      exclusivityPeriod: 90,
      minStockCover: 60,
      maxDiscountAllowed: 15,
    },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionHeader title="Channel Distribution Rules" />
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Channel
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              Channel Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Primary Channels" hint="Main distribution">
              <Badge variant="primary">2 active</Badge>
            </FormRow>
            <FormRow label="Secondary Channels" hint="Supporting channels">
              <Badge variant="secondary">3 active</Badge>
            </FormRow>
            <FormRow label="Exclusive Channels" hint="Special access">
              <Badge variant="outline">1 active</Badge>
            </FormRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Distribution Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Channel Conflicts" hint="Prevent overlaps">
              <Switch defaultChecked />
            </FormRow>
            <FormRow label="Auto-Allocation" hint="Smart distribution">
              <Switch defaultChecked />
            </FormRow>
            <FormRow label="Exclusivity Enforcement" hint="Honor agreements">
              <Switch defaultChecked />
            </FormRow>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>Channel</DataTableHead>
                <DataTableHead>Type</DataTableHead>
                <DataTableHead>Distribution Rules</DataTableHead>
                <DataTableHead className="text-right">Margin Target</DataTableHead>
                <DataTableHead className="text-right">Stock Cover</DataTableHead>
                <DataTableHead className="text-right">Max Discount</DataTableHead>
                <DataTableHead className="text-right">Actions</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {rules.map((rule) => (
                <DataTableRow key={rule.id}>
                  <DataTableCell className="font-medium">{rule.channel}</DataTableCell>
                  <DataTableCell>
                    <Badge
                      variant={
                        rule.type === "Primary" ? "primary" : rule.type === "Secondary" ? "secondary" : "outline"
                      }
                    >
                      {rule.type}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex gap-1 flex-wrap">
                      {rule.distributionRules.slice(0, 2).map((r) => (
                        <Badge key={r} variant="outline" className="text-xs">
                          {r}
                        </Badge>
                      ))}
                      {rule.distributionRules.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{rule.distributionRules.length - 2}
                        </Badge>
                      )}
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-right font-medium">{rule.marginTarget}%</DataTableCell>
                  <DataTableCell className="text-right">{rule.minStockCover} days</DataTableCell>
                  <DataTableCell className="text-right">{rule.maxDiscountAllowed}%</DataTableCell>
                  <DataTableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 13: Approval Workflows ──

interface ApprovalWorkflow {
  id: string;
  name: string;
  trigger: string;
  thresholdValue: number;
  approvalChain: { level: number; role: string; sla: number }[];
  escalationEnabled: boolean;
  delegationAllowed: boolean;
  status: "Active" | "Draft" | "Paused";
}

function ApprovalWorkflowsTab() {
  const { info } = useToast();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([
    {
      id: "WF001",
      name: "High Value Order Approval",
      trigger: "Order Value >",
      thresholdValue: 5000000,
      approvalChain: [
        { level: 1, role: "Category Manager", sla: 4 },
        { level: 2, role: "Business Head", sla: 8 },
        { level: 3, role: "CEO", sla: 24 },
      ],
      escalationEnabled: true,
      delegationAllowed: true,
      status: "Active",
    },
    {
      id: "WF002",
      name: "Markdown Approval",
      trigger: "Discount >",
      thresholdValue: 40,
      approvalChain: [
        { level: 1, role: "Store Manager", sla: 2 },
        { level: 2, role: "Regional Head", sla: 6 },
      ],
      escalationEnabled: true,
      delegationAllowed: false,
      status: "Active",
    },
    {
      id: "WF003",
      name: "New Vendor Onboarding",
      trigger: "Vendor Registration",
      thresholdValue: 0,
      approvalChain: [
        { level: 1, role: "Sourcing Manager", sla: 24 },
        { level: 2, role: "Finance Head", sla: 48 },
        { level: 3, role: "Legal Team", sla: 72 },
      ],
      escalationEnabled: false,
      delegationAllowed: true,
      status: "Draft",
    },
  ]);

  const handleToggleStatus = (id: string) => {
    setWorkflows(
      workflows.map((w) => {
        if (w.id === id) {
          const newStatus = w.status === "Active" ? "Paused" : "Active";
          return { ...w, status: newStatus };
        }
        return w;
      }),
    );
    info("Workflow status updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SectionHeader title="Approval Workflow Configuration" />
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Workflow Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Workflows</span>
              <Badge variant="primary">8</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Approvals</span>
              <Badge variant="secondary">24</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Resolution</span>
              <span className="text-sm font-semibold">6.5 hrs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              SLA Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Default SLA" hint="Hours per level">
              <Input type="number" defaultValue="24" className="w-20 text-center h-8" />
            </FormRow>
            <FormRow label="Urgent Flag" hint="Reduce SLA by 50%">
              <Switch defaultChecked />
            </FormRow>
            <FormRow label="Weekend Pause" hint="Pause SLA on weekends">
              <Switch />
            </FormRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Escalation Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormRow label="Auto-Escalate" hint="On SLA breach">
              <Switch defaultChecked />
            </FormRow>
            <FormRow label="Skip Levels" hint="If unavailable">
              <Switch defaultChecked />
            </FormRow>
            <FormRow label="Notify Original" hint="Keep requester informed">
              <Switch defaultChecked />
            </FormRow>
          </CardContent>
        </Card>
      </div>

      {workflows.map((workflow) => (
        <Card key={workflow.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm">{workflow.name}</CardTitle>
                <Badge
                  variant={
                    workflow.status === "Active" ? "primary" : workflow.status === "Draft" ? "secondary" : "outline"
                  }
                >
                  {workflow.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleToggleStatus(workflow.id)}>
                  {workflow.status === "Active" ? "Pause" : "Activate"}
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">Trigger:</span>
                <span className="font-medium">
                  {workflow.trigger} {workflow.thresholdValue > 0 && `${workflow.thresholdValue.toLocaleString()}`}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Approval Chain:</span>
                <div className="flex items-center gap-2 ml-4">
                  {workflow.approvalChain.map((step, idx) => (
                    <div key={step.level} className="flex items-center gap-2">
                      <div className="text-xs bg-gray-100 rounded-lg px-3 py-1.5">
                        <div className="font-medium">{step.role}</div>
                        <div className="text-gray-500">SLA: {step.sla}h</div>
                      </div>
                      {idx < workflow.approvalChain.length - 1 && <span className="text-gray-400">→</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Escalation:</span>
                  <Badge variant={workflow.escalationEnabled ? "primary" : "outline"}>
                    {workflow.escalationEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Delegation:</span>
                  <Badge variant={workflow.delegationAllowed ? "primary" : "outline"}>
                    {workflow.delegationAllowed ? "Allowed" : "Not Allowed"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Page ──

export function AdminRangeConfigPage() {
  const { success } = useToast();
  const [config, setConfig] = useState<RangeConfig>(() => structuredClone(mockRangeConfig));

  const handleReset = () => {
    setConfig(structuredClone(mockRangeConfig));
  };

  const handleSave = () => {
    success("Range configuration saved successfully");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Range Architecture Config"
        actions={
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Last saved: 2026-03-23 14:30</span>
          </div>
        }
      />

      <Tabs defaultValue="range-params">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="range-params">Range Params</TabsTrigger>
          <TabsTrigger value="fashion-split">Fashion Split</TabsTrigger>
          <TabsTrigger value="external-brands">External Brands</TabsTrigger>
          <TabsTrigger value="buying-models">Buying Models</TabsTrigger>
          <TabsTrigger value="planning-calendar">Planning Calendar</TabsTrigger>
          <TabsTrigger value="store-network">Store Network</TabsTrigger>
          <TabsTrigger value="kpi-thresholds">KPI Thresholds</TabsTrigger>
          <TabsTrigger value="ftf-integration">FTF Integration</TabsTrigger>
          <TabsTrigger value="vendor-management">Vendor Management</TabsTrigger>
          <TabsTrigger value="channel-rules">Channel Rules</TabsTrigger>
          <TabsTrigger value="approval-workflows">Approval Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="range-params">
          <RangeParamsTab
            config={config}
            onChange={(params) =>
              setConfig((prev) => ({
                ...prev,
                rangeParams: { ...prev.rangeParams, ...params },
              }))
            }
            onSave={handleSave}
            onReset={handleReset}
          />
        </TabsContent>

        <TabsContent value="fashion-split">
          <FashionSplitTab
            config={config}
            onChange={(params) =>
              setConfig((prev) => ({
                ...prev,
                fashionSplit: { ...prev.fashionSplit, ...params },
              }))
            }
            onSave={handleSave}
            onReset={handleReset}
          />
        </TabsContent>

        <TabsContent value="external-brands">
          <ExternalBrandsTab
            config={config}
            onChange={(params) =>
              setConfig((prev) => ({
                ...prev,
                externalBrands: { ...prev.externalBrands, ...params },
              }))
            }
            onSave={handleSave}
            onReset={handleReset}
          />
        </TabsContent>

        <TabsContent value="buying-models">
          <BuyingModelsTab />
        </TabsContent>

        <TabsContent value="planning-calendar">
          <PlanningCalendarTab />
        </TabsContent>

        <TabsContent value="store-network">
          <StoreNetworkTab />
        </TabsContent>

        <TabsContent value="kpi-thresholds">
          <KPIThresholdsTab />
        </TabsContent>

        <TabsContent value="ftf-integration">
          <FTFIntegrationTab />
        </TabsContent>

        <TabsContent value="vendor-management">
          <VendorManagementTab />
        </TabsContent>

        <TabsContent value="channel-rules">
          <ChannelRulesTab />
        </TabsContent>

        <TabsContent value="approval-workflows">
          <ApprovalWorkflowsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

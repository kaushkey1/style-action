import { useState } from 'react';
import {
  Badge,
  KpiLabel,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/ui';
import {
  fixtureTypesOM,
  spaceNormStandards,
  spsfTargets,
  fashionGradeRules,
  type FixtureTypeOM,
  type SpaceNormStandard,
  type SPSFTarget,
  type FashionGradeRule,
} from '@/data/mockSpacePlanning'; // mock-ok — config lookup
import {
  fixtureProportionRules,
  seasonalFixtureCalendar,
  type ProportionPeriod,
  type FixtureProportionRule,
  type SeasonalFixtureCalendar,
} from '@/data/mockFixtureProportions'; // mock-ok — config lookup

// ── Tab 1: Fixture Types ──

function FixtureTypesTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader
          title="Fixture Type Catalog"
          actions={<Badge variant="default" size="sm">Reference</Badge>}
          className="mb-4"
        />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Code</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Category</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Linear Feet</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Option Capacity</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Display Method</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Qty/Fixture</th>
            </tr>
          </thead>
          <tbody>
            {fixtureTypesOM.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState description="No fixture types configured" />
                </td>
              </tr>
            ) : (
              fixtureTypesOM.map((ft: FixtureTypeOM) => (
                <tr key={ft.id} className="border-b border-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-900">{ft.name}</td>
                  <td className="py-3 text-sm text-gray-700">{ft.code}</td>
                  <td className="py-3 text-sm text-gray-600">{ft.category}</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{ft.linearFeet}ft</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{ft.optionCapacity}</td>
                  <td className="py-3 text-sm text-gray-600">{ft.displayMethod}</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{ft.quantityPerFixture}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 2: Space Norms ──

function SpaceNormsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader
          title="Space Norm Standards"
          actions={<Badge variant="default" size="sm">Reference</Badge>}
          className="mb-4"
        />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Rule</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Value</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Unit</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {spaceNormStandards.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState description="No space norms configured" />
                </td>
              </tr>
            ) : (
              spaceNormStandards.map((norm: SpaceNormStandard) => (
                <tr key={norm.id} className="border-b border-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-900">{norm.rule}</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{norm.value}</td>
                  <td className="py-3 text-sm text-gray-600">{norm.unit}</td>
                  <td className="py-3 text-sm text-gray-600">{norm.purpose}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 3: SPSF Targets ──

function SPSFTargetsTab() {
  const [targets, setTargets] = useState<SPSFTarget[]>(spsfTargets);

  const handleChange = (grade: string, field: 'target' | 'stretch' | 'floor', value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return;
    setTargets((prev) =>
      prev.map((t) => (t.grade === grade ? { ...t, [field]: parsed } : t))
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader
          title={
            <>
              <KpiLabel abbr="SPSF" /> Targets by Store Grade
            </>
          }
          actions={<Badge variant="default" size="sm">Editable</Badge>}
          className="mb-4"
        />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Grade</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">
                Current <KpiLabel abbr="SPSF" />
              </th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Target</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Stretch</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Floor</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Uplift Goal</th>
            </tr>
          </thead>
          <tbody>
            {targets.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState description="No SPSF targets configured" />
                </td>
              </tr>
            ) : (
              targets.map((t) => {
                const upliftMin = t.current > 0 ? (((t.target - t.current) / t.current) * 100).toFixed(1) : '0';
                const upliftMax = t.current > 0 ? (((t.stretch - t.current) / t.current) * 100).toFixed(1) : '0';

                return (
                  <tr key={t.grade} className="border-b border-gray-50">
                    <td className="py-3 text-sm font-medium text-gray-900">{t.label}</td>
                    <td className="py-3 text-sm text-gray-500 text-right tabular-nums">₹{t.current}</td>
                    <td className="py-3 text-right">
                      <Input
                        type="number"
                        value={t.target}
                        onChange={(e) => handleChange(t.grade, 'target', e.target.value)}
                        className="w-24 h-8 text-right text-sm ml-auto"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <Input
                        type="number"
                        value={t.stretch}
                        onChange={(e) => handleChange(t.grade, 'stretch', e.target.value)}
                        className="w-24 h-8 text-right text-sm ml-auto"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <Input
                        type="number"
                        value={t.floor}
                        onChange={(e) => handleChange(t.grade, 'floor', e.target.value)}
                        className="w-24 h-8 text-right text-sm ml-auto"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-xs font-medium text-emerald-600 tabular-nums">
                        +{upliftMin}% to +{upliftMax}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 4: Fashion Grade Rules ──

function FashionGradeRulesTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader
          title="Fashion Grade Split Rules"
          actions={<Badge variant="default" size="sm">Reference</Badge>}
          className="mb-4"
        />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Fashion Grade</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Target %</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Stock Cover</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Replenishment</th>
            </tr>
          </thead>
          <tbody>
            {fashionGradeRules.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState description="No fashion grade rules configured" />
                </td>
              </tr>
            ) : (
              fashionGradeRules.map((r: FashionGradeRule) => (
                <tr key={r.grade} className="border-b border-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-900">{r.grade}</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{r.targetRange}</td>
                  <td className="py-3 text-sm text-gray-600">{r.stockCover}</td>
                  <td className="py-3">
                    <Badge
                      variant={r.replenishmentType === 'Auto-replenish' ? 'success' : 'default'}
                      size="sm"
                    >
                      {r.replenishmentType}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Hard constraint callout */}
        <div className="mt-4 bg-white border border-gray-200 border-l-3 border-l-amber-500 rounded-lg p-3 text-xs text-gray-700">
          <span className="font-semibold">Hard constraint:</span> Core + Ultimate ≥ 70%, Fashion + Fast Fashion ≤ 30%
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Fixture Proportions (NEW) ──

function FixtureProportionsTab() {
  const [selectedPeriod, setSelectedPeriod] = useState<ProportionPeriod>('regular');

  const filteredRules = fixtureProportionRules.filter((r) => r.period === selectedPeriod);

  const periodLabels: Record<ProportionPeriod, string> = {
    regular: 'Regular',
    markdown: 'Markdown',
    eoss: 'EOSS',
    festive: 'Festive',
  };

  return (
    <div className="space-y-4">
      {/* Proportion Rules Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader
          title="Markdown/Promotion Fixture Proportions"
          actions={<Badge variant="default" size="sm">Reference</Badge>}
          className="mb-4"
        />

        {/* Period Selector */}
        <div className="mb-4 flex items-center gap-2">
          {(['regular', 'markdown', 'eoss', 'festive'] as ProportionPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedPeriod === period
                  ? 'bg-indigo-50 text-gray-900 border border-indigo-200'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {periodLabels[period]}
            </button>
          ))}
        </div>

        {/* Rules Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Segment</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Regular %</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Markdown %</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Display Priority</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Max Depth</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState description="No proportion rules for this period" />
                </td>
              </tr>
            ) : (
              filteredRules.map((rule: FixtureProportionRule) => (
                <tr key={rule.id} className="border-b border-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-900">{rule.segmentName}</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{rule.regularFixturePct}%</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{rule.markdownFixturePct}%</td>
                  <td className="py-3">
                    <Badge
                      variant={rule.displayPriority === 'front' ? 'success' : rule.displayPriority === 'back' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {rule.displayPriority}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{rule.maxMarkdownDepth}</td>
                  <td className="py-3 text-sm text-gray-600">{rule.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Seasonal Calendar Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader
          title="Seasonal Calendar"
          actions={<Badge variant="default" size="sm">Reference</Badge>}
          className="mb-4"
        />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Period Label</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Period Type</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Dates</th>
              <th className="text-right text-xs font-medium text-gray-500 pb-3">Fixture Shift %</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Impacted Segments</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {seasonalFixtureCalendar.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState description="No seasonal calendar entries" />
                </td>
              </tr>
            ) : (
              seasonalFixtureCalendar.map((entry: SeasonalFixtureCalendar) => (
                <tr key={entry.id} className="border-b border-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-900">{entry.label}</td>
                  <td className="py-3">
                    <Badge variant="default" size="sm">
                      {periodLabels[entry.period]}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-700">
                    {new Date(entry.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(entry.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{entry.fixtureShiftPct}%</td>
                  <td className="py-3 text-sm text-gray-600">{entry.impactedSegments.join(', ')}</td>
                  <td className="py-3">
                    <Badge
                      variant={entry.status === 'active' ? 'success' : entry.status === 'completed' ? 'outline' : 'warning'}
                      size="sm"
                    >
                      {entry.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──

export function AdminSpaceMastersPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Space Masters Configuration" />

      <Tabs defaultValue="fixture-types">
        <TabsList>
          <TabsTrigger value="fixture-types">Fixture Types</TabsTrigger>
          <TabsTrigger value="space-norms">Space Norms</TabsTrigger>
          <TabsTrigger value="spsf">
            <KpiLabel abbr="SPSF" /> Targets
          </TabsTrigger>
          <TabsTrigger value="fashion-grades">Fashion Grades</TabsTrigger>
          <TabsTrigger value="fixture-proportions">Fixture Proportions</TabsTrigger>
        </TabsList>

        <TabsContent value="fixture-types">
          <FixtureTypesTab />
        </TabsContent>

        <TabsContent value="space-norms">
          <SpaceNormsTab />
        </TabsContent>

        <TabsContent value="spsf">
          <SPSFTargetsTab />
        </TabsContent>

        <TabsContent value="fashion-grades">
          <FashionGradeRulesTab />
        </TabsContent>

        <TabsContent value="fixture-proportions">
          <FixtureProportionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

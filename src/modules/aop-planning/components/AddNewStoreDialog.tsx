import { useState, useMemo } from 'react';
import {
  Modal,
  ModalFooter,
  Button,
  Input,
  Label,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  RadioGroup,
  RadioGroupItem,
  FilterSelect,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { CHANNELS, PLAN_MONTHS, CATEGORIES } from '../data/mockChannels';
import { SEASONALITY_WEIGHTS, getGuardrailBand } from '../data/mockGuardrails';
import type { ChannelId, ProjectionMethod } from '../types/aopPlanning.types';

interface AddNewStoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (store: NewStoreInput) => void;
  existingStores: Array<{ id: string; label: string; channelId: ChannelId; fyTotal: number; city?: string }>;
}

export interface NewStoreInput {
  name: string;
  city: string;
  channelId: ChannelId;
  category: string;
  openingMonthIndex: number;
  grade: string;
  waterfallAnnualTarget: number;
  referenceStoreId: string | null;
  referenceAdjustmentPct: number;
  selectedMethod: ProjectionMethod;
}

const GRADES = ['A', 'A1', 'A2', 'A3'];

function computePartialYearRevenue(
  annualTarget: number,
  openingMonthIndex: number,
): { months: number[]; partialTotal: number } {
  const activeWeights = SEASONALITY_WEIGHTS.slice(openingMonthIndex);
  const activeWeightSum = activeWeights.reduce((a, b) => a + b, 0);

  const months = PLAN_MONTHS.map((_, i) => {
    if (i < openingMonthIndex) return 0;
    const weight = SEASONALITY_WEIGHTS[i] ?? 1;
    return Math.round((annualTarget * weight) / activeWeightSum * 100) / 100;
  });

  const partialTotal = months.reduce((a, b) => a + b, 0);
  return { months, partialTotal: Math.round(partialTotal * 100) / 100 };
}

export function AddNewStoreDialog({
  isOpen,
  onClose,
  onAdd,
  existingStores,
}: AddNewStoreDialogProps): React.ReactNode {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [channelId, setChannelId] = useState<ChannelId>('EBO');
  const [category, setCategory] = useState('');
  const [openingMonthIndex, setOpeningMonthIndex] = useState(0);
  const [grade, setGrade] = useState('A1');

  const [waterfallTarget, setWaterfallTarget] = useState('');
  const [referenceStoreId, setReferenceStoreId] = useState<string>('');
  const [adjustmentPct, setAdjustmentPct] = useState('85');
  const [selectedMethod, setSelectedMethod] = useState<ProjectionMethod>('waterfall');

  const channelCategories = CATEGORIES[channelId] ?? [];
  const channelStores = existingStores.filter((s) => s.channelId === channelId);

  // Searchable city options derived from existing stores.
  const cityOptions = useMemo(() => {
    const set = new Set(existingStores.map((s) => (s.city ?? '').trim()).filter(Boolean));
    return [...set].sort().map((c) => ({ value: c, label: c }));
  }, [existingStores]);

  // Suggest reference stores in the same city first, then the rest (both by size desc).
  const cityKey = city.trim().toLowerCase();
  const sameCityStores = useMemo(
    () =>
      channelStores
        .filter((s) => cityKey && (s.city ?? '').trim().toLowerCase() === cityKey)
        .sort((a, b) => b.fyTotal - a.fyTotal),
    [channelStores, cityKey],
  );
  // When a city is selected, only stores in that city are eligible as reference.
  const referenceOptions = useMemo(() => {
    if (cityKey) return sameCityStores;
    return [...channelStores].sort((a, b) => b.fyTotal - a.fyTotal);
  }, [cityKey, sameCityStores, channelStores]);

  function goToProjection(): void {
    // Auto-suggest a same-city reference store + reference method when one exists.
    if (!referenceStoreId && sameCityStores[0]) {
      setReferenceStoreId(sameCityStores[0].id);
      setSelectedMethod('reference');
    }
    setStep(2);
  }

  const waterfallNum = parseFloat(waterfallTarget) || 0;
  const adjustmentNum = parseFloat(adjustmentPct) || 85;

  const referenceStore = channelStores.find((s) => s.id === referenceStoreId);
  const referenceAnnual = referenceStore ? referenceStore.fyTotal * (adjustmentNum / 100) : 0;

  const waterfallProjection = useMemo(
    () => computePartialYearRevenue(waterfallNum, openingMonthIndex),
    [waterfallNum, openingMonthIndex],
  );

  const referenceProjection = useMemo(
    () => computePartialYearRevenue(referenceAnnual, openingMonthIndex),
    [referenceAnnual, openingMonthIndex],
  );

  const variancePct = referenceProjection.partialTotal > 0
    ? Math.round(((waterfallProjection.partialTotal - referenceProjection.partialTotal) / referenceProjection.partialTotal) * 100)
    : 0;

  const band = getGuardrailBand(grade);
  const operatingMonths = 12 - openingMonthIndex;
  const openingMonth = PLAN_MONTHS[openingMonthIndex];

  const step1Valid = name.trim().length > 0 && city.trim().length > 0 && category.length > 0;
  const step2Valid = waterfallNum > 0;

  function handleReset(): void {
    setStep(1);
    setName('');
    setCity('');
    setChannelId('EBO');
    setCategory('');
    setOpeningMonthIndex(0);
    setGrade('A1');
    setWaterfallTarget('');
    setReferenceStoreId('');
    setAdjustmentPct('85');
    setSelectedMethod('waterfall');
  }

  function handleClose(): void {
    handleReset();
    onClose();
  }

  function handleAdd(): void {
    onAdd({
      name: name.trim(),
      city: city.trim(),
      channelId,
      category,
      openingMonthIndex,
      grade,
      waterfallAnnualTarget: waterfallNum,
      referenceStoreId: referenceStoreId || null,
      referenceAdjustmentPct: adjustmentNum,
      selectedMethod,
    });
    handleReset();
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Store"
      size="lg"
    >
      <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
        {/* Step indicators */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {[
            { n: 1, label: 'Store Details' },
            { n: 2, label: 'Projection' },
            { n: 3, label: 'Review' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-gray-200" />}
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                  step === s.n ? 'bg-gray-900 text-white' :
                  step > s.n ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-400',
                )}
              >
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={cn(step === s.n ? 'text-gray-900' : 'text-gray-400')}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Store Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  placeholder="e.g. Inorbit Mall"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="store-city">City</Label>
                <FilterSelect
                  placeholder="Select city"
                  value={city}
                  onChange={setCity}
                  options={cityOptions}
                  searchable
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="channel">Channel</Label>
                <Select value={channelId} onValueChange={(v) => { setChannelId(v as ChannelId); setCategory(''); }}>
                  <SelectTrigger id="channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        {ch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Department</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {channelCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="opening-month">Planned Opening Month</Label>
                <Select
                  value={String(openingMonthIndex)}
                  onValueChange={(v) => setOpeningMonthIndex(parseInt(v, 10))}
                >
                  <SelectTrigger id="opening-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_MONTHS.map((m) => (
                      <SelectItem key={m.id} value={String(m.index)}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {operatingMonths} months of contribution in FY
                </p>
              </div>
              <div>
                <Label htmlFor="grade">Store Grade</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="grade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g} — growth band +{band.minGrowth}% to +{band.maxGrowth}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Projection */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{name}</span> — {city} · {channelId} / {category} · Opens{' '}
                <span className="font-medium">{openingMonth?.label}</span> ({operatingMonths} months)
              </p>
            </div>

            {/* Waterfall projection */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              {/* eslint-disable-next-line design-system/prefer-section-header -- compact inline header inside modal step, not a page section */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Waterfall Projection</h4>
                <Badge className="bg-gray-100 text-gray-600">Board-approved Y1</Badge>
              </div>
              <p className="text-xs text-gray-500">
                Enter the full-year target from the board-approved store investment model. The system will phase it across {operatingMonths} operating months using seasonality weights.
              </p>
              <div>
                <Label htmlFor="waterfall-target">Annual Target (₹ Cr)</Label>
                <Input
                  id="waterfall-target"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 3.5"
                  value={waterfallTarget}
                  onChange={(e) => setWaterfallTarget(e.target.value)}
                />
              </div>
              {waterfallNum > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">
                    Phased contribution ({openingMonth?.shortLabel}–Mar): <span className="font-semibold text-gray-900">₹{waterfallProjection.partialTotal.toFixed(2)} Cr</span>
                  </p>
                  <div className="flex gap-0.5">
                    {waterfallProjection.months.map((v, i) => {
                      const m = PLAN_MONTHS[i];
                      const maxVal = Math.max(...waterfallProjection.months.filter((x) => x > 0));
                      const heightPct = maxVal > 0 ? (v / maxVal) * 100 : 0;
                      return (
                        <div key={m?.id ?? i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="w-full h-10 flex items-end">
                            <div
                              className={cn('w-full rounded-sm', v > 0 ? 'bg-gray-700' : 'bg-gray-100')}
                              // eslint-disable-next-line no-restricted-syntax -- dynamic bar height from computed data
                              style={{ height: `${Math.max(heightPct, v > 0 ? 8 : 2)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400">{m?.shortLabel?.slice(0, 1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Reference store projection */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              {/* eslint-disable-next-line design-system/prefer-section-header -- compact inline header inside modal step */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Reference Store</h4>
                <Badge className="bg-gray-100 text-gray-600">Comparable benchmark</Badge>
              </div>
              <p className="text-xs text-gray-500">
                Pick a similar existing store and apply an adjustment factor (e.g., 85% of reference in Y1 for ramp-up).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ref-store">Reference Store</Label>
                  <Select value={referenceStoreId} onValueChange={setReferenceStoreId}>
                    <SelectTrigger id="ref-store">
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label} (₹{s.fyTotal.toFixed(1)} Cr)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {cityKey && referenceOptions.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Showing stores in {city} only.</p>
                  )}
                  {cityKey && referenceOptions.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No reference stores in {city} for this channel — use the Waterfall method.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="adj-pct">Y1 Adjustment (%)</Label>
                  <Input
                    id="adj-pct"
                    type="number"
                    min="10"
                    max="150"
                    value={adjustmentPct}
                    onChange={(e) => setAdjustmentPct(e.target.value)}
                  />
                </div>
              </div>
              {referenceStore && (
                <p className="text-xs text-gray-500">
                  Reference annual: ₹{referenceStore.fyTotal.toFixed(2)} Cr × {adjustmentNum}% = <span className="font-semibold text-gray-900">₹{referenceAnnual.toFixed(2)} Cr</span> →
                  phased: <span className="font-semibold text-gray-900">₹{referenceProjection.partialTotal.toFixed(2)} Cr</span>
                </p>
              )}
            </div>

            {/* Variance */}
            {waterfallNum > 0 && referenceProjection.partialTotal > 0 && (
              <div className={cn(
                'rounded-lg p-3 text-sm',
                Math.abs(variancePct) > 20 ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-700',
              )}>
                Variance between methods: <span className="font-semibold">{variancePct >= 0 ? '+' : ''}{variancePct}%</span>
                {Math.abs(variancePct) > 20 && (
                  <span className="ml-1">— large variance will require finance acknowledgement</span>
                )}
              </div>
            )}

            {/* Primary method selection */}
            <div>
              <Label>Primary Method (rolls up to channel total)</Label>
              <RadioGroup
                value={selectedMethod}
                onValueChange={(v) => setSelectedMethod(v as ProjectionMethod)}
                className="mt-2 flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="waterfall" id="method-waterfall" />
                  <Label htmlFor="method-waterfall" className="text-sm font-normal cursor-pointer">
                    Waterfall
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="reference" id="method-reference" disabled={!referenceStoreId} />
                  <Label htmlFor="method-reference" className={cn('text-sm font-normal cursor-pointer', !referenceStoreId && 'text-gray-400')}>
                    Reference
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="grid grid-cols-2 gap-3 p-3">
                <div>
                  <p className="text-xs text-gray-500">Store</p>
                  <p className="text-sm font-medium text-gray-900">{name} — {city}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Channel / Department</p>
                  <p className="text-sm font-medium text-gray-900">{channelId} / {category}</p>
                </div>
              </div>
              {/* eslint-disable-next-line design-system/prefer-metric-grid -- review summary layout inside modal, not metric cards */}
              <div className="grid grid-cols-3 gap-3 p-3">
                <div>
                  <p className="text-xs text-gray-500">Opens</p>
                  <p className="text-sm font-medium text-gray-900">{openingMonth?.label}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Operating Months</p>
                  <p className="text-sm font-medium text-gray-900">{operatingMonths} of 12</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Grade</p>
                  <p className="text-sm font-medium text-gray-900">{grade}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3">
                <div>
                  <p className="text-xs text-gray-500">Waterfall (board Y1)</p>
                  <p className="text-sm font-semibold text-gray-900">₹{waterfallProjection.partialTotal.toFixed(2)} Cr</p>
                  <p className="text-[10px] text-gray-400">Annual ₹{waterfallNum.toFixed(2)} Cr, phased {operatingMonths} months</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reference ({referenceStore?.label ?? 'none'})</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {referenceStore ? `₹${referenceProjection.partialTotal.toFixed(2)} Cr` : '—'}
                  </p>
                  {referenceStore && (
                    <p className="text-[10px] text-gray-400">{adjustmentNum}% of ₹{referenceStore.fyTotal.toFixed(2)} Cr</p>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-500">Primary Method</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{selectedMethod}</p>
                {referenceStore && Math.abs(variancePct) > 20 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Variance {variancePct >= 0 ? '+' : ''}{variancePct}% — soft exception will be created
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                This store will contribute <span className="font-semibold">₹{
                  selectedMethod === 'waterfall'
                    ? waterfallProjection.partialTotal.toFixed(2)
                    : referenceProjection.partialTotal.toFixed(2)
                } Cr</span> from {openingMonth?.shortLabel} to Mar, adding to the <span className="font-semibold">{channelId}</span> channel total.
                {' '}Both projection numbers will be stored for audit trail.
              </p>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep((s) => (s > 1 ? (s - 1) as 1 | 2 : s))}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            {step < 3 ? (
              <Button
                onClick={() => (step === 1 ? goToProjection() : setStep(3))}
                disabled={step === 1 ? !step1Valid : !step2Valid}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleAdd}>
                Add Store to Plan
              </Button>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}

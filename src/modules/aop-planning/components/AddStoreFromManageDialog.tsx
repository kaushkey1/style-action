import { useState, useMemo } from 'react';
import {
  Modal,
  ModalFooter,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { CHANNELS, CATEGORIES, PRODUCT_CATEGORIES } from '../data/mockChannels';

import type { StoreListing, ChannelId } from '../types/aopPlanning.types';

export type StoreFormat = 'FULL_PRICE' | 'OUTLET';

export interface AddStoreFromManagePayload {
  name: string;
  code: string;
  state: string;
  city: string;
  type: string;
  storeFormat: StoreFormat;
  freshDiscountPct: number | null;
  eossDiscountPct: number | null;
  channelId: ChannelId;
  category: string;
  startDate: string;
  referenceStoreId: string;
}

interface AddStoreFromManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (store: AddStoreFromManagePayload) => void;
  existingStores: StoreListing[];
  /** Channels for the cycle (incl. custom-added). Falls back to the base channel set. */
  channelOptions?: { id: string; label: string }[];
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    code += chars[idx];
  }
  return code;
}

export function AddStoreFromManageDialog({
  isOpen,
  onClose,
  onAdd,
  existingStores,
  channelOptions,
}: AddStoreFromManageDialogProps): React.ReactNode {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [storeType, setStoreType] = useState('');
  const [storeFormat, setStoreFormat] = useState<StoreFormat>('FULL_PRICE');
  const [freshDiscount, setFreshDiscount] = useState('');
  const [eossDiscount, setEossDiscount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [channelId, setChannelId] = useState('');
  const [category, setCategory] = useState('');
  const [referenceStoreId, setReferenceStoreId] = useState('');

  const channelList = channelOptions ?? CHANNELS.map((c) => ({ id: c.id, label: c.label }));
  // Custom channels have no predefined category set — offer the full product list.
  const channelCategories = channelId
    ? (CATEGORIES[channelId as keyof typeof CATEGORIES] ?? [...PRODUCT_CATEGORIES])
    : [];

  // Real state/city/type options derived from existing stores.
  const stateOptions = useMemo(
    () => [...new Set(existingStores.map((s) => s.state).filter(Boolean))].sort()
      .map((s) => ({ value: s, label: s })),
    [existingStores],
  );
  const cityOptions = useMemo(
    () => [...new Set(
      existingStores.filter((s) => !state || s.state === state).map((s) => s.city).filter(Boolean),
    )].sort().map((c) => ({ value: c, label: c })),
    [existingStores, state],
  );
  const typeOptions = ['A+', 'A', 'A1', 'A2', 'A3'];

  // Reference store must be in the selected city + channel (strictly same city).
  const cityKey = city.trim().toLowerCase();
  const referenceStores = useMemo((): StoreListing[] => {
    if (!channelId || !cityKey) return [];
    return existingStores.filter(
      (s) =>
        s.channelId === channelId &&
        s.status === 'Active' &&
        (s.city ?? '').trim().toLowerCase() === cityKey,
    );
  }, [existingStores, channelId, cityKey]);

  const selectedReference = referenceStores.find((s) => s.id === referenceStoreId);

  // The store code must be unique — a duplicate is rejected by the backend and the store
  // would not be created, so block it here and surface a message.
  const trimmedCode = code.trim();
  const codeExists =
    trimmedCode.length > 0 &&
    existingStores.some((s) => (s.code ?? '').trim().toLowerCase() === trimmedCode.toLowerCase());

  const isValid =
    name.trim().length > 0 &&
    code.trim().length > 0 &&
    !codeExists &&
    state.length > 0 &&
    city.length > 0 &&
    storeType.length > 0 &&
    startDate.length > 0 &&
    channelId.length > 0 &&
    category.length > 0 &&
    referenceStoreId.length > 0;

  function handleReset(): void {
    setName('');
    setCode('');
    setState('');
    setCity('');
    setStoreType('');
    setStoreFormat('FULL_PRICE');
    setFreshDiscount('');
    setEossDiscount('');
    setStartDate('');
    setChannelId('');
    setCategory('');
    setReferenceStoreId('');
  }

  function handleClose(): void {
    handleReset();
    onClose();
  }

  function handleAdd(): void {
    if (!isValid) return;
    onAdd({
      name: name.trim(),
      code: code.trim(),
      state,
      city,
      type: storeType,
      storeFormat,
      freshDiscountPct: freshDiscount.trim() === '' ? null : (parseFloat(freshDiscount) || 0),
      eossDiscountPct: eossDiscount.trim() === '' ? null : (parseFloat(eossDiscount) || 0),
      channelId: channelId as ChannelId,
      category,
      startDate,
      referenceStoreId,
    });
    handleReset();
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Store"
      description="Enter a couple of details about the store to add it. All fields are mandatory."
      size="lg"
    >
      <div className="space-y-4">
        {/* Row 1: Store name + Store code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="add-store-name">Store name *</Label>
            <Input
              id="add-store-name"
              placeholder="e.g. Inorbit Mall"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="add-store-code">Store code *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="add-store-code"
                placeholder="e.g. FR06"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCode(generateCode())}
                className="shrink-0"
              >
                Generate
              </Button>
            </div>
            <p className={cn('mt-1 text-xs', codeExists ? 'text-red-700' : 'text-gray-500')}>
              {codeExists
                ? 'This store code already exists. Enter a code not used by any existing store, otherwise the store will not be created.'
                : 'Enter a store code not present in any existing store, otherwise the store will not be created.'}
            </p>
          </div>
        </div>

        {/* Row 2: State + City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="add-store-state">State *</Label>
            <Select
              value={state}
              onValueChange={(v) => {
                setState(v);
                setCity('');
                setReferenceStoreId('');
              }}
            >
              <SelectTrigger id="add-store-state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {stateOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="add-store-city">City *</Label>
            <Select
              value={city}
              onValueChange={(v) => {
                setCity(v);
                setReferenceStoreId('');
              }}
              disabled={cityOptions.length === 0}
            >
              <SelectTrigger id="add-store-city">
                <SelectValue placeholder={state ? 'Select city' : 'Select state first'} />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Grade + Start Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="add-store-type">Grade *</Label>
            <Select value={storeType} onValueChange={setStoreType}>
              <SelectTrigger id="add-store-type">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="add-store-start">Start Date *</Label>
            <Input
              id="add-store-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        {/* Row 3b: Store Type (Full Price / Outlet) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="add-store-format">Store Type *</Label>
            <Select value={storeFormat} onValueChange={(v) => setStoreFormat(v as StoreFormat)}>
              <SelectTrigger id="add-store-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_PRICE">Full Price</SelectItem>
                <SelectItem value="OUTLET">Outlet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3c: Seasonal discounts — Fresh season + EOSS as separate inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="add-store-fresh-discount">Fresh Season Discount %</Label>
            <Input
              id="add-store-fresh-discount"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="Optional"
              value={freshDiscount}
              onChange={(e) => setFreshDiscount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="add-store-eoss-discount">EOSS Discount %</Label>
            <Input
              id="add-store-eoss-discount"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="Optional"
              value={eossDiscount}
              onChange={(e) => setEossDiscount(e.target.value)}
            />
          </div>
        </div>

        {/* Row 4: Channel + Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="add-store-channel">Channel *</Label>
            <Select
              value={channelId}
              onValueChange={(v) => {
                setChannelId(v);
                setCategory('');
                setReferenceStoreId('');
              }}
            >
              <SelectTrigger id="add-store-channel">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {channelList.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>{ch.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="add-store-category">Category *</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={channelCategories.length === 0}
            >
              <SelectTrigger id="add-store-category">
                <SelectValue placeholder={channelCategories.length === 0 ? 'Select channel first' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {channelCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 5: Reference Store */}
        <div>
          <Label htmlFor="add-store-ref">Reference Store *</Label>
          <Select
            value={referenceStoreId}
            onValueChange={setReferenceStoreId}
            disabled={referenceStores.length === 0}
          >
            <SelectTrigger id="add-store-ref">
              <SelectValue
                placeholder={
                  !channelId ? 'Select channel first' : !city ? 'Select city first' : 'Select reference store'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {referenceStores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {city && (
            <p className="text-xs text-gray-500 mt-1">
              {referenceStores.length > 0
                ? `Showing stores in ${city} only.`
                : `No reference stores in ${city} for this channel.`}
            </p>
          )}
          {selectedReference && (
            <p className="text-xs text-gray-500 mt-1">
              Reference: {selectedReference.name} — {selectedReference.city}, {selectedReference.state}
            </p>
          )}
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          disabled={!isValid}
          onClick={handleAdd}
        >
          Add Store
        </Button>
      </ModalFooter>
    </Modal>
  );
}

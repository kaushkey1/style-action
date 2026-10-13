import { apiHeaders, apiUrl } from '@/lib/utils';

import type {
  CatalogExtension,
  InstalledExtension,
  ExtensionInstance,
  EventType,
  Subscription,
  DatasetConfig,
  PaginatedQueryLogs,
  RegisterExtensionInput,
  InstallExtensionInput,
  UpdateExtensionInput,
  CreateDatasetInput,
  UpdateDatasetInput,
  InstanceStatus,
} from '../data/extensionTypes';

// ─── Envelope & Helper ──────────────────────────────────────────────────────

interface ApiEnvelope<T> {
  data: T;
  message: string;
  status_code: number;
}

const EXT_BASE = '/extensions';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(`${EXT_BASE}${path}`), {
    ...init,
    headers: { ...apiHeaders(), ...init?.headers },
  });
  if (!res.ok) {
    const body: Record<string, unknown> = await res.json().catch(() => ({}));
    throw new Error((body.message as string) ?? `API error ${res.status}`);
  }
  const envelope: ApiEnvelope<T> = await res.json();
  return envelope.data;
}

// ─── Catalog ────────────────────────────────────────────────────────────────

export async function fetchCatalog(): Promise<CatalogExtension[]> {
  return request<CatalogExtension[]>('/catalog');
}

export async function registerExtension(body: RegisterExtensionInput): Promise<CatalogExtension> {
  return request<CatalogExtension>('/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Instances ──────────────────────────────────────────────────────────────

export async function fetchInstalled(): Promise<InstalledExtension[]> {
  return request<InstalledExtension[]>('/installed');
}

export async function installExtension(body: InstallExtensionInput): Promise<ExtensionInstance> {
  return request<ExtensionInstance>('/install', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchExtensionDetail(slug: string): Promise<ExtensionInstance> {
  return request<ExtensionInstance>(`/${encodeURIComponent(slug)}`);
}

export async function updateExtension(
  slug: string,
  body: UpdateExtensionInput,
): Promise<ExtensionInstance> {
  return request<ExtensionInstance>(`/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function uninstallExtension(slug: string): Promise<void> {
  await request<null>(`/${encodeURIComponent(slug)}`, { method: 'DELETE' });
}

export async function toggleExtension(slug: string): Promise<{ status: InstanceStatus }> {
  return request<{ status: InstanceStatus }>(`/${encodeURIComponent(slug)}/toggle`, {
    method: 'POST',
  });
}

// ─── Event Subscriptions ────────────────────────────────────────────────────

export async function fetchEventTypes(): Promise<EventType[]> {
  return request<EventType[]>('/event-types');
}

export async function fetchSubscriptions(slug: string): Promise<Subscription[]> {
  return request<Subscription[]>(`/${encodeURIComponent(slug)}/subscriptions`);
}

export async function createSubscriptions(
  slug: string,
  eventTypeIds: string[],
): Promise<Subscription[]> {
  return request<Subscription[]>(`/${encodeURIComponent(slug)}/subscriptions`, {
    method: 'POST',
    body: JSON.stringify({ event_type_ids: eventTypeIds }),
  });
}

export async function deleteSubscription(slug: string, eventTypeId: string): Promise<void> {
  await request<null>(
    `/${encodeURIComponent(slug)}/subscriptions/${encodeURIComponent(eventTypeId)}`,
    { method: 'DELETE' },
  );
}

// ─── Dataset Configs ────────────────────────────────────────────────────────

export async function fetchDatasets(slug: string): Promise<DatasetConfig[]> {
  return request<DatasetConfig[]>(`/${encodeURIComponent(slug)}/datasets`);
}

export async function createDataset(
  slug: string,
  body: CreateDatasetInput,
): Promise<DatasetConfig> {
  return request<DatasetConfig>(`/${encodeURIComponent(slug)}/datasets`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateDataset(
  slug: string,
  configId: string,
  body: UpdateDatasetInput,
): Promise<DatasetConfig> {
  return request<DatasetConfig>(
    `/${encodeURIComponent(slug)}/datasets/${encodeURIComponent(configId)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function deleteDataset(slug: string, configId: string): Promise<void> {
  await request<null>(
    `/${encodeURIComponent(slug)}/datasets/${encodeURIComponent(configId)}`,
    { method: 'DELETE' },
  );
}

// ─── Query Logs ─────────────────────────────────────────────────────────────

export async function fetchQueryLogs(
  slug: string,
  page: number,
  pageSize: number,
): Promise<PaginatedQueryLogs> {
  return request<PaginatedQueryLogs>(
    `/${encodeURIComponent(slug)}/queries?page=${page}&page_size=${pageSize}`,
  );
}

// ─── iframe ─────────────────────────────────────────────────────────────────

export async function fetchIframeUrl(slug: string): Promise<{ iframe_url: string }> {
  return request<{ iframe_url: string }>(`/${encodeURIComponent(slug)}/iframe-url`);
}

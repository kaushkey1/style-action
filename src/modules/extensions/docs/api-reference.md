# Extensions API Reference

Frontend integration guide for the Extensions module.


**Base URL**: `/v1.0/extensions`

---

## Authentication

All endpoints use one of two auth mechanisms:

| Auth Type | Required Headers | Used By |
|-----------|-----------------|---------|
| **Tenant auth** | `X-Org-ID`, `X-Tenant-ID` | All endpoints except Query API |
| **Token auth** | `Authorization: Bearer <callback_token>` | `POST /query` only |

The `callback_token` is returned once when an extension is installed (in the install response). Store it securely — it cannot be retrieved again.

---

## Response Envelope

All JSON endpoints return a standard envelope:

**Success** (`2xx`):
```json
{
  "data": { ... },
  "message": "Success",
  "status_code": 200
}
```

**Error** (`4xx` / `5xx`):
```json
{
  "data": null,
  "message": "Error description",
  "status_code": 422,
  "errors": [
    { "field": "body.slug", "message": "String should match pattern..." }
  ]
}
```

The `errors` array is only present on `422` validation errors. All other errors have `errors: null`.

---

## Status Enums

| Entity | Values |
|--------|--------|
| Extension (catalog) | `active`, `deprecated`, `disabled` |
| Instance (per-tenant) | `enabled`, `disabled`, `suspended` |
| Subscription | `active`, `paused` |
| Query log | `pending`, `running`, `completed`, `failed` |

---

## Endpoints

### 1. Extension Catalog

#### `GET /v1.0/extensions/catalog`

List all available extensions in the global catalog (only `active` extensions).

**Headers**: `X-Org-ID`, `X-Tenant-ID`

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "business-insights-agent",
      "name": "Business Insights Agent",
      "description": "AI-powered business insights",
      "provider": "Impetus",
      "version": "1.0.0",
      "icon_url": "https://cdn.example.com/icon.png",
      "iframe_base_url": "https://insights.example.com/embed",
      "status": "active",
      "metadata": {},
      "created_at": "2026-04-17T10:00:00Z",
      "updated_at": "2026-04-17T10:00:00Z"
    }
  ],
  "message": "Success",
  "status_code": 200
}
```

---

#### `POST /v1.0/extensions/register`

Register a new extension in the global catalog. Platform admin only.

**Headers**: `X-Org-ID`, `X-Tenant-ID`

**Request body**:
| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `slug` | string | yes | 1-128 chars, pattern: `^[a-z0-9][a-z0-9-]*[a-z0-9]$` | — |
| `name` | string | yes | 1-256 chars | — |
| `description` | string | no | — | `null` |
| `provider` | string | no | — | `null` |
| `version` | string | no | — | `"1.0.0"` |
| `icon_url` | string | no | — | `null` |
| `iframe_base_url` | string | no | — | `null` |
| `metadata` | object | no | — | `{}` |

**Request example**:
```json
{
  "slug": "business-insights-agent",
  "name": "Business Insights Agent",
  "description": "AI-powered business insights",
  "provider": "Impetus",
  "iframe_base_url": "https://insights.example.com/embed"
}
```

**Response** `201`: Same shape as a single item in `GET /catalog`.

**Errors**:
| Status | When |
|--------|------|
| `422` | Slug already exists, or validation fails |

---

### 2. Extension Instances (per-tenant)

#### `GET /v1.0/extensions/installed`

List extensions installed for the current tenant.

**Headers**: `X-Org-ID`, `X-Tenant-ID`

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "business-insights-agent",
      "name": "Business Insights Agent",
      "description": "AI-powered business insights",
      "icon_url": "https://cdn.example.com/icon.png",
      "iframe_base_url": "https://insights.example.com/embed",
      "status": "enabled",
      "installed_at": "2026-04-17T10:00:00Z"
    }
  ],
  "message": "Success",
  "status_code": 200
}
```

---

#### `POST /v1.0/extensions/install`

Install an extension for the current tenant. Generates `webhook_secret` and `callback_token` server-side.

**Headers**: `X-Org-ID`, `X-Tenant-ID`

**Request body**:
| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `slug` | string | yes | Must match an active extension in catalog | — |
| `webhook_url` | string | yes | 1-512 chars. URL where Core sends data TO the extension | — |
| `config` | object | no | Tenant-specific configuration | `{}` |

**Request example**:
```json
{
  "slug": "business-insights-agent",
  "webhook_url": "https://my-extension.example.com/webhook",
  "config": { "region": "US" }
}
```

**Response** `201`:
```json
{
  "data": {
    "id": "uuid",
    "extension": {
      "id": "uuid",
      "slug": "business-insights-agent",
      "name": "Business Insights Agent",
      "description": "...",
      "provider": "Impetus",
      "version": "1.0.0",
      "icon_url": "...",
      "iframe_base_url": "...",
      "status": "active",
      "metadata": {},
      "created_at": "2026-04-17T10:00:00Z",
      "updated_at": "2026-04-17T10:00:00Z"
    },
    "org_id": "org-123",
    "tenant_id": "tenant-456",
    "webhook_url": "https://my-extension.example.com/webhook",
    "callback_token": "a1b2c3d4e5f6...64_hex_chars",
    "status": "enabled",
    "config": { "region": "US" },
    "installed_at": "2026-04-17T10:00:00Z",
    "updated_at": "2026-04-17T10:00:00Z"
  },
  "message": "Success",
  "status_code": 201
}
```

> **Important**: The `callback_token` is only returned in this response. Store it securely for use with the Query API.

**Errors**:
| Status | When |
|--------|------|
| `404` | Extension slug not found in catalog |
| `422` | Extension is not `active`, or already installed for this tenant |

---

#### `GET /v1.0/extensions/{slug}`

Get full details of an installed extension instance.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug` — extension slug

**Response** `200`: Same shape as `POST /install` response data.

**Errors**: `404` if not installed for this tenant.

---

#### `PATCH /v1.0/extensions/{slug}`

Update an extension instance's webhook URL or config.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug` — extension slug

**Request body** (all fields optional — only provided fields are updated):
| Field | Type | Required |
|-------|------|----------|
| `webhook_url` | string | no |
| `config` | object | no |

**Request example**:
```json
{
  "webhook_url": "https://new-url.example.com/webhook"
}
```

**Response** `200`: Full instance detail (same shape as `GET /{slug}`).

**Errors**: `404` if not installed.

---

#### `DELETE /v1.0/extensions/{slug}`

Uninstall an extension for the current tenant. Cascades: deletes all subscriptions, dataset configs, and query logs.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug` — extension slug

**Response** `200`:
```json
{
  "data": null,
  "message": "Extension uninstalled",
  "status_code": 200
}
```

**Errors**: `404` if not installed.

---

#### `POST /v1.0/extensions/{slug}/toggle`

Toggle an extension instance between `enabled` and `disabled`.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug` — extension slug  
**Request body**: None

**Response** `200`:
```json
{
  "data": { "status": "disabled" },
  "message": "Success",
  "status_code": 200
}
```

**Errors**: `404` if not installed.

---

### 3. Event Types & Subscriptions

#### `GET /v1.0/extensions/event-types`

List all available event types that extensions can subscribe to.

**Headers**: `X-Org-ID`, `X-Tenant-ID`

**Response** `200`:
```json
{
  "data": [
    {
      "id": "sales_data_added",
      "name": "Sales Data Added",
      "description": "New sales data ingested",
      "category": "sales",
      "status": "active"
    },
    {
      "id": "vendor_onboarded",
      "name": "Vendor Onboarded",
      "description": "New vendor registered",
      "category": "vendor",
      "status": "active"
    }
  ],
  "message": "Success",
  "status_code": 200
}
```

**Available event types**:
| ID | Category |
|----|----------|
| `sales_data_added` | sales |
| `vendor_onboarded` | vendor |
| `buyplan_status_changed` | planning |
| `inventory_updated` | inventory |
| `insights_generated` | analytics |
| `store_data_updated` | store |

---

#### `GET /v1.0/extensions/{slug}/subscriptions`

List event subscriptions for an installed extension.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug`

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "event_type_id": "sales_data_added",
      "status": "active",
      "created_at": "2026-04-17T10:00:00Z"
    }
  ],
  "message": "Success",
  "status_code": 200
}
```

---

#### `POST /v1.0/extensions/{slug}/subscriptions`

Subscribe to one or more event types. Idempotent — existing subscriptions are preserved.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug`

**Request body**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `event_type_ids` | string[] | yes | At least 1 item. Each must match a valid, active event type ID |

**Request example**:
```json
{
  "event_type_ids": ["sales_data_added", "vendor_onboarded"]
}
```

**Response** `201`: Array of created subscription objects (same shape as `GET .../subscriptions` items).

**Errors**:
| Status | When |
|--------|------|
| `404` | Extension not installed |
| `422` | Event type ID not found or not `active` |

---

#### `DELETE /v1.0/extensions/{slug}/subscriptions/{event_type_id}`

Unsubscribe from a specific event type.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug`, `event_type_id` (e.g., `sales_data_added`)

**Response** `200`:
```json
{
  "data": null,
  "message": "Unsubscribed",
  "status_code": 200
}
```

**Errors**:
| Status | When |
|--------|------|
| `404` | Extension not installed, or subscription not found |

---

### 4. Dataset Configs

Dataset configs define which BigQuery tables/queries an extension can access. They serve as both configuration for cron data delivery (Phase 2) and access control for the Query API.

#### `GET /v1.0/extensions/{slug}/datasets`

List dataset configs for an installed extension.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug`

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "US Sales Data",
      "bq_project_id": "my-gcp-project",
      "bq_dataset": "retail_data",
      "bq_table": "sales_daily",
      "query_template": null,
      "filters": {},
      "created_at": "2026-04-17T10:00:00Z",
      "updated_at": "2026-04-17T10:00:00Z"
    }
  ],
  "message": "Success",
  "status_code": 200
}
```

---

#### `POST /v1.0/extensions/{slug}/datasets`

Create a dataset config. At least one of `bq_table` or `query_template` is required.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug`

**Request body**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | yes | 1-256 chars |
| `bq_project_id` | string | yes | Non-empty |
| `bq_dataset` | string | yes | Non-empty |
| `bq_table` | string | no | Table name. Required for structured-mode queries |
| `query_template` | string | no | SQL with `{{date_from}}`, `{{date_to}}` placeholders. Takes precedence over `bq_table` for cron delivery |
| `filters` | object | no | Column-level filters (default `{}`) |

**Request example**:
```json
{
  "name": "US Sales Data",
  "bq_project_id": "my-gcp-project",
  "bq_dataset": "retail_data",
  "bq_table": "sales_daily",
  "filters": { "region": "US" }
}
```

**Response** `201`: Single dataset config object.

**Errors**:
| Status | When |
|--------|------|
| `404` | Extension not installed |
| `422` | Neither `bq_table` nor `query_template` provided |

---

#### `PATCH /v1.0/extensions/{slug}/datasets/{config_id}`

Update a dataset config. Only provided fields are updated.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug`, `config_id` (UUID)

**Request body** (all optional):
| Field | Type |
|-------|------|
| `name` | string |
| `bq_table` | string |
| `query_template` | string |
| `filters` | object |

**Response** `200`: Updated dataset config object.

**Errors**: `404` if extension not installed or config not found.

---

#### `DELETE /v1.0/extensions/{slug}/datasets/{config_id}`

Delete a dataset config.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug`, `config_id` (UUID)

**Response** `200`:
```json
{
  "data": null,
  "message": "Dataset config deleted",
  "status_code": 200
}
```

**Errors**: `404` if extension not installed or config not found.

---

### 5. Query API

Extensions can query BigQuery data directly, scoped to their configured datasets.

#### `POST /v1.0/extensions/query`

Execute a query against an allowed dataset. Returns an NDJSON stream.

**Auth**: `Authorization: Bearer <callback_token>` (NOT tenant headers)

**Rate limit**: 10 requests/minute per extension instance (configurable).

**Request body**:
| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `dataset_config_id` | UUID | yes | Must belong to the authenticated extension instance | — |
| `mode` | string | no | `"structured"` or `"sql"` | `"structured"` |
| `columns` | string[] | no | Column names for structured mode. `*` if omitted | `null` |
| `filters` | object | no | Column filters (structured mode). See filter operators below | `null` |
| `order_by` | string | no | e.g., `"date DESC"` | `null` |
| `limit` | int | no | 1-10,000 | `1000` |
| `sql` | string | conditional | Required when `mode: "sql"`. Must contain `{{table}}` placeholder | `null` |
| `delivery` | string | no | `"stream"` or `"webhook"` | `"stream"` |

> `delivery: "webhook"` returns `501 Not Implemented` (Phase 2).

**Structured mode request example**:
```json
{
  "dataset_config_id": "uuid-of-allowed-dataset",
  "mode": "structured",
  "columns": ["region", "sales", "date"],
  "filters": {
    "region": "US",
    "date": { "$gte": "2026-01-01" }
  },
  "order_by": "date DESC",
  "limit": 1000,
  "delivery": "stream"
}
```

**SQL mode request example**:
```json
{
  "dataset_config_id": "uuid-of-allowed-dataset",
  "mode": "sql",
  "sql": "SELECT region, SUM(sales) FROM {{table}} WHERE date >= '2026-01-01' GROUP BY region",
  "delivery": "stream"
}
```

**Filter operators** (structured mode):
| Operator | SQL equivalent |
|----------|---------------|
| `$eq` | `=` |
| `$ne` | `!=` |
| `$gt` | `>` |
| `$gte` | `>=` |
| `$lt` | `<` |
| `$lte` | `<=` |
| `$like` | `LIKE` |

Plain value (no operator object) defaults to `=`:
```json
{ "region": "US" }           →  WHERE region = 'US'
{ "date": { "$gte": "2026-01-01" } }  →  WHERE date >= '2026-01-01'
```

**Response** — `Content-Type: application/x-ndjson`

The response is a newline-delimited JSON stream with three message types:

```
{"type": "metadata", "query_id": "uuid", "dataset_config_id": "uuid", "dataset": "project.dataset.table"}
{"type": "row", "data": {"region": "US", "sales": 42000}}
{"type": "row", "data": {"region": "EU", "sales": 38000}}
...
{"type": "done", "row_count": 2, "bytes_processed": 1048576, "duration_ms": 3200}
```

On error mid-stream:
```
{"type": "error", "message": "BigQuery timeout after 300s"}
```

**Frontend parsing example** (TypeScript):
```typescript
const response = await fetch('/v1.0/extensions/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${callbackToken}`,
  },
  body: JSON.stringify({
    dataset_config_id: datasetId,
    mode: 'structured',
    columns: ['region', 'sales'],
    limit: 100,
  }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop()!; // keep incomplete line in buffer
  for (const line of lines) {
    if (!line) continue;
    const msg = JSON.parse(line);
    switch (msg.type) {
      case 'metadata': console.log('Query started:', msg.query_id); break;
      case 'row':      handleRow(msg.data); break;
      case 'done':     console.log(`Completed: ${msg.row_count} rows`); break;
      case 'error':    console.error('Query error:', msg.message); break;
    }
  }
}
```

**Errors**:
| Status | When |
|--------|------|
| `401` | Missing/invalid `Authorization` header, or extension instance disabled |
| `403` | `dataset_config_id` doesn't belong to the authenticated extension |
| `422` | Structured mode but no `bq_table` in dataset config; SQL parse error; SQL references unauthorized tables; SQL mode disabled |
| `429` | Rate limit exceeded (10 req/min) |
| `501` | `delivery: "webhook"` (not yet implemented) |

---

### 6. Query Audit Log

#### `GET /v1.0/extensions/{slug}/queries`

Paginated audit log of queries executed by this extension.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug`

**Query params**:
| Param | Type | Default | Constraints |
|-------|------|---------|-------------|
| `page` | int | `1` | >= 1 |
| `page_size` | int | `20` | 1-100 |

**Response** `200`:
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "dataset_config_id": "uuid",
        "query_mode": "structured",
        "delivery_mode": "stream",
        "query_text": "SELECT region, sales FROM `project.dataset.table` LIMIT 1000",
        "status": "completed",
        "row_count": 42,
        "bytes_processed": 1048576,
        "error_message": null,
        "duration_ms": 3200,
        "created_at": "2026-04-17T10:00:00Z"
      }
    ],
    "total": 156,
    "page": 1,
    "page_size": 20
  },
  "message": "Success",
  "status_code": 200
}
```

**Query log statuses**: `pending`, `running`, `completed`, `failed`

---

### 7. iframe Embedding

#### `GET /v1.0/extensions/{slug}/iframe-url`

Get a signed iframe URL for embedding the extension's UI.

**Headers**: `X-Org-ID`, `X-Tenant-ID`  
**Path params**: `slug`

**Response** `200`:
```json
{
  "data": {
    "iframe_url": "https://insights.example.com/embed?tenant_id=tenant-456&org_id=org-123&token=callback_token_here"
  },
  "message": "Success",
  "status_code": 200
}
```

**Errors**:
| Status | When |
|--------|------|
| `404` | Extension not installed, or extension has no `iframe_base_url` |

**iframe sandbox attributes** (for frontend component):
```html
<iframe
  src="{iframe_url}"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  referrerPolicy="no-referrer"
/>
```

**postMessage protocol** (for bidirectional communication):

| Direction | Type | Payload | Purpose |
|-----------|------|---------|---------|
| Host -> Extension | `CORE_CONTEXT` | `{ tenantId, orgId, theme, locale }` | Send on iframe load |
| Extension -> Host | `EXT_NAVIGATE` | `{ route }` | Request Core navigation |
| Extension -> Host | `EXT_RESIZE` | `{ height }` | Request iframe height change |
| Extension -> Host | `EXT_NOTIFICATION` | `{ level, message }` | Show toast in Core UI |

Validate messages by checking `event.origin` against the registered `iframe_base_url` domain.

---

## Error Reference

All errors use the standard response envelope.

| Status | Type | When |
|--------|------|------|
| `401` | `AuthError` | Missing or invalid auth (tenant headers or callback token) |
| `403` | `ForbiddenError` | Dataset not authorized, SQL references unauthorized table |
| `404` | `NotFoundError` | Extension/instance/subscription/config not found |
| `422` | `ValidationError` | Invalid request body, business rule violations |
| `429` | Rate limit | Query API rate limit exceeded |
| `500` | Internal | Unhandled server error |
| `501` | Not implemented | Webhook delivery mode (Phase 2) |

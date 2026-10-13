# Extension System — Architecture & Implementation Plan

## Context

Impetus Agentic Central needs an extensible system to support AI agent extensions. Extensions register with Core, subscribe to platform events (via Kafka), receive periodic data (via cron + BigQuery), communicate bidirectionally via webhooks, and can embed their UI as iframes in the Core frontend.

### Key Requirements
1. Extensions register on Core with a global catalog
2. Users grant extensions permissions to subscribe to specific event types (sales_data_added, vendor_onboarded, etc.)
3. Users can add cron schedules for periodic data delivery to extensions
4. Each extension config includes BigQuery dataset references
5. Extensions provide webhook URLs where Core sends data
6. Extensions can be embedded as iframes in the Core UI
7. Event delivery log maintained with status tracking (sent, failed, success, response_received)
8. Extensions send updates back via Core's callback webhook, keyed by delivery_id

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web framework** | FastAPI |
| **ORM / DB layer** | SQLAlchemy 2.x (async with `asyncpg` driver) |
| **Migrations** | Alembic |
| **Validation** | Pydantic v2 |
| **Package manager** | uv |
| **Scheduled workflows** | Temporal (Python SDK — `temporalio`) |
| **HTTP client** | httpx (async, for webhook delivery) |
| **BigQuery** | google-cloud-bigquery |
| **Event streaming** | aiokafka (Kafka / Redpanda) — Phase 2+ |

---

## 1. Database Schema

All tables reside in the **config database** (same PostgreSQL instance as `organizations`, `tenants`, `module_configs`, `feature_flags`).

### 1.1 `extensions` — Global catalog of available extensions

```sql
CREATE TABLE extensions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(128) UNIQUE NOT NULL,     -- "business-insights-agent"
    name            VARCHAR(256) NOT NULL,
    description     TEXT,
    provider        VARCHAR(256),                     -- who authored it
    version         VARCHAR(32) DEFAULT '1.0.0',
    icon_url        VARCHAR(512),
    iframe_base_url VARCHAR(512),                     -- nullable; not all extensions have UI
    status          VARCHAR(32) DEFAULT 'active',     -- active | deprecated | disabled
    metadata        JSONB DEFAULT '{}',               -- capabilities, docs links, etc.
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

**Design notes**: `slug` is the human-readable unique identifier used in URLs and API calls. `iframe_base_url` is nullable because not all extensions provide a UI. `metadata` JSONB allows extensions to declare capabilities without schema migration.

### 1.2 `extension_instances` — Per-tenant installation

```sql
CREATE TABLE extension_instances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extension_id    UUID NOT NULL REFERENCES extensions(id),
    org_id          VARCHAR(128) NOT NULL,
    tenant_id       VARCHAR(128) NOT NULL,
    webhook_url     VARCHAR(512) NOT NULL,            -- Core POSTs data TO the extension
    webhook_secret  VARCHAR(256) NOT NULL,            -- HMAC signing secret (generated server-side)
    callback_token  VARCHAR(256) NOT NULL,            -- token extension sends back with updates
    config          JSONB DEFAULT '{}',               -- tenant-specific settings
    status          VARCHAR(32) DEFAULT 'enabled',    -- enabled | disabled | suspended
    installed_at    TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (extension_id, org_id, tenant_id)
);
CREATE INDEX idx_ext_inst_tenant ON extension_instances(org_id, tenant_id);
```

**Design notes**: One instance per extension per tenant (unique constraint). `webhook_secret` for HMAC-SHA256 signing of outbound payloads. `callback_token` is a shared secret the extension uses to authenticate when calling back to Core.

### 1.3 `event_types` — Fixed registry of subscribable events

```sql
CREATE TABLE event_types (
    id              VARCHAR(128) PRIMARY KEY,         -- "sales_data_added"
    name            VARCHAR(256) NOT NULL,
    description     TEXT,
    category        VARCHAR(64),                      -- "sales", "vendor", "inventory"
    payload_schema  JSONB,                            -- JSON Schema for documentation/validation
    status          VARCHAR(32) DEFAULT 'active',     -- active | deprecated
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Design notes**: `id` is a descriptive string (not UUID) because event types are a fixed, human-readable enumeration referenced in Kafka messages and API calls.

**Initial event types**:
| ID | Category | Description |
|----|----------|-------------|
| `sales_data_added` | sales | New sales data ingested |
| `vendor_onboarded` | vendor | New vendor registered |
| `buyplan_status_changed` | planning | Buy plan status transitioned |
| `inventory_updated` | inventory | Inventory levels changed |
| `insights_generated` | analytics | AI insights generation completed |
| `store_data_updated` | store | Store intelligence data refreshed |

### 1.4 `event_subscriptions` — Extension-to-event mapping

```sql
CREATE TABLE event_subscriptions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extension_instance_id UUID NOT NULL REFERENCES extension_instances(id) ON DELETE CASCADE,
    event_type_id         VARCHAR(128) NOT NULL REFERENCES event_types(id),
    status                VARCHAR(32) DEFAULT 'active',  -- active | paused
    created_at            TIMESTAMPTZ DEFAULT now(),
    UNIQUE (extension_instance_id, event_type_id)
);
CREATE INDEX idx_evt_sub_type ON event_subscriptions(event_type_id, status);
```

**Design notes**: The index on `(event_type_id, status)` is the critical read path — when an event fires, the consumer queries "all active subscriptions for event_type X".

### 1.5 `dataset_configs` — BigQuery dataset references

```sql
CREATE TABLE dataset_configs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extension_instance_id UUID NOT NULL REFERENCES extension_instances(id) ON DELETE CASCADE,
    name                  VARCHAR(256) NOT NULL,         -- human-readable label
    bq_project_id         VARCHAR(256) NOT NULL,
    bq_dataset            VARCHAR(256) NOT NULL,
    bq_table              VARCHAR(256),                  -- nullable; query_template takes precedence
    query_template        TEXT,                           -- SQL with {{date_from}}, {{date_to}} placeholders
    filters               JSONB DEFAULT '{}',            -- column-level filtering without SQL
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
```

**Design notes**: `query_template` allows custom SQL with placeholder tokens (`{{date_from}}`, `{{date_to}}`). If set, it takes precedence over `bq_table`. `filters` JSONB allows simple column-level filtering without writing SQL.

### 1.6 `cron_schedules` — Periodic data delivery configs

```sql
CREATE TABLE cron_schedules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extension_instance_id   UUID NOT NULL REFERENCES extension_instances(id) ON DELETE CASCADE,
    cron_expression         VARCHAR(128) NOT NULL,         -- "0 9 * * *" (standard 5-field)
    dataset_config_id       UUID NOT NULL REFERENCES dataset_configs(id),
    label                   VARCHAR(256),                  -- human-readable description
    status                  VARCHAR(32) DEFAULT 'active',  -- active | paused
    temporal_schedule_id    VARCHAR(256),                   -- Temporal schedule handle ID
    temporal_workflow_id    VARCHAR(256),                   -- latest workflow run ID
    last_run_at             TIMESTAMPTZ,
    next_run_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cron_schedule_instance ON cron_schedules(extension_instance_id, status);
```

**Design notes**: Each row maps 1:1 to a Temporal scheduled workflow. `temporal_schedule_id` is the handle used to pause/unpause/delete the schedule on the Temporal server. `temporal_workflow_id` tracks the latest workflow execution. Temporal owns the cron timing — the DB stores the cron expression for display and audit, but Temporal is the source of truth for execution. Each schedule points to one dataset config.

### 1.7 `event_delivery_log` — Delivery tracking + extension responses

```sql
CREATE TABLE event_delivery_log (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extension_instance_id UUID NOT NULL REFERENCES extension_instances(id),
    event_type_id         VARCHAR(128),                  -- NULL for cron deliveries
    source_type           VARCHAR(32) NOT NULL,          -- 'event' | 'cron' | 'query'
    payload_summary       TEXT,                          -- truncated payload for debugging
    status                VARCHAR(32) DEFAULT 'pending',
        -- pending -> sent -> delivered | failed -> response_received
    http_status_code      INT,
    error_message         TEXT,
    attempt_count         INT DEFAULT 0,
    max_attempts          INT DEFAULT 3,
    next_retry_at         TIMESTAMPTZ,
    response_data         JSONB,                         -- data the extension sent back
    delivered_at          TIMESTAMPTZ,
    response_received_at  TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_delivery_instance ON event_delivery_log(extension_instance_id, created_at DESC);
CREATE INDEX idx_delivery_retry ON event_delivery_log(next_retry_at, status)
    WHERE status = 'failed' AND attempt_count < max_attempts;
```

**Status progression**: `pending` -> `sent` -> `delivered` (2xx) or `failed` (non-2xx/timeout). When extension calls back: -> `response_received` with `response_data` populated. Partial index on retry candidates avoids scanning completed rows.

### 1.8 `extension_query_log` — Audit log for extension-initiated queries

```sql
CREATE TABLE extension_query_log (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extension_instance_id UUID NOT NULL REFERENCES extension_instances(id),
    dataset_config_id     UUID NOT NULL REFERENCES dataset_configs(id),
    query_mode            VARCHAR(32) NOT NULL,          -- 'structured' | 'sql'
    delivery_mode         VARCHAR(32) NOT NULL,          -- 'stream' | 'webhook'
    query_text            TEXT,                           -- actual BQ SQL executed
    status                VARCHAR(32) DEFAULT 'pending', -- pending | running | completed | failed
    row_count             INT,
    bytes_processed       BIGINT,
    error_message         TEXT,
    duration_ms           INT,
    created_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_query_log_instance ON extension_query_log(extension_instance_id, created_at DESC);
```

**Design notes**: Separate from `event_delivery_log` because the direction is reversed — extension pulling data from Core, not Core pushing to extension. Tracks query mode, delivery mode, execution stats, and errors for full audit trail.

---

## 2. Backend Module Structure

Self-contained module at `apps/api/src/app/extensions/`. Designed as a **self-sufficient module** that can be extracted into a standalone microservice with minimal changes — all infrastructure clients (DB, Temporal, Kafka, BigQuery) are owned by the module, not imported from `core/`.

```
extensions/
    __init__.py
    CLAUDE.md             -- module documentation
    constants.py          -- EventType enum, status enums, retry config
    config.py             -- Module-local settings (DB, Temporal, Kafka, webhook config)
    database.py           -- Module-local SQLAlchemy async engine + session factory
    models.py             -- SQLAlchemy ORM models (mapped to config DB tables)
    serializer.py         -- Pydantic request/response models
    dao.py                -- Data access via SQLAlchemy async sessions
    helpers.py            -- Business logic (lifecycle, subscriptions, schedules)
    views.py              -- FastAPI endpoint handlers
    router.py             -- Route definitions (/v1.0/extensions/*)
    dispatcher.py         -- Webhook dispatcher (httpx + HMAC signing + retries)
    query_handler.py      -- Query validation, BQ execution, NDJSON streaming, webhook query delivery
    temporal/
        __init__.py
        client.py         -- Temporal client factory (module-local, connects to Temporal server)
        worker.py         -- Temporal worker entry point (separate MODE=temporal-worker process)
        workflows.py      -- Scheduled workflow: CronDataSyncWorkflow
        activities.py     -- Activity implementations: fetch_bq_data, deliver_webhook, update_delivery_log
    kafka/
        __init__.py
        producer.py       -- Kafka event producer (aiokafka) — Phase 2+
        consumer.py       -- Kafka consumer (separate MODE=consumer process) — Phase 2+
    connectors/
        __init__.py
        bigquery.py       -- Self-contained BQ client for data extraction
    migrations/
        alembic.ini       -- Module-local Alembic config
        env.py            -- Migration environment
        versions/         -- Migration scripts
```

### Self-sufficiency principle

The module owns all its infrastructure connections. When running inside the monolith, these share the same physical infra (Postgres, Temporal server) but use module-local clients. When extracted to a microservice, only `config.py` environment variables change — no code rewiring needed.

| Concern | Owned by module (not `core/`) |
|---------|-------------------------------|
| DB engine + sessions | `extensions/database.py` |
| Temporal client | `extensions/temporal/client.py` |
| Kafka producer/consumer | `extensions/kafka/producer.py`, `consumer.py` |
| BigQuery client | `extensions/connectors/bigquery.py` |
| Config/settings | `extensions/config.py` |

### External dependencies (minimal — for monolith integration only)
- `app.core.response` — `ok()` / `err()` envelope
- `app.tenancy.models` — `TenantContext` from request state
- No other cross-module dependencies

When extracted as a microservice, these two thin interfaces are replaced with local equivalents.

### New pip dependencies (managed via `uv`)
- `sqlalchemy[asyncio]` — async ORM with `asyncpg` driver
- `alembic` — database migrations
- `temporalio` — Temporal Python SDK (scheduled workflows, activities, worker)
- `httpx` — async HTTP client for webhook delivery
- `sqlglot` — SQL parsing for query validation (SQL mode table reference checks)
- `aiokafka` — async Kafka producer/consumer (Phase 2+)

### Module-local settings (`extensions/config.py`)

```python
from pydantic_settings import BaseSettings

class ExtensionsDatabaseSettings(BaseSettings):
    url: str = "postgresql+asyncpg://localhost:5432/config_db"
    pool_size: int = 5

    class Config:
        env_prefix = "EXTENSIONS_DB_"

class TemporalSettings(BaseSettings):
    server_url: str = "localhost:7233"
    namespace: str = "default"
    task_queue: str = "extensions-cron"

    class Config:
        env_prefix = "TEMPORAL_"

class KafkaSettings(BaseSettings):
    bootstrap_servers: str = "localhost:9092"
    events_topic: str = "platform.events"
    consumer_group: str = "extensions-consumer"

    class Config:
        env_prefix = "KAFKA_"

class WebhookSettings(BaseSettings):
    timeout_seconds: int = 30
    max_delivery_retries: int = 3
    retry_backoff_base_seconds: int = 60

    class Config:
        env_prefix = "EXTENSIONS_WEBHOOK_"

class QuerySettings(BaseSettings):
    max_rows_per_query: int = 10000
    rate_limit_per_minute: int = 10
    bq_timeout_seconds: int = 300
    allowed_sql_mode: bool = True          # disable to restrict to structured-only

    class Config:
        env_prefix = "EXTENSIONS_QUERY_"
```

---

## 3. Event System Architecture

### 3.1 Event Production

Thin `EventProducer` class wrapping `aiokafka.AIOKafkaProducer`. Provides a single method:

```python
async def emit(event_type: str, payload: dict, org_id: str, tenant_id: str) -> None
```

Kafka message envelope:
```json
{
    "event_id": "uuid-v4",
    "event_type": "sales_data_added",
    "org_id": "org-123",
    "tenant_id": "tenant-456",
    "payload": { "...business data..." },
    "emitted_at": "2026-04-17T10:00:00Z"
}
```

Initialized in `main.py` lifespan as `app.state.event_producer`. Business modules call `await producer.emit(...)` after their mutation operations.

**Integration points** (where events get emitted):
| Module | After | Event Type |
|--------|-------|------------|
| `buyplan/service.py` | `update_option_status()` | `buyplan_status_changed` |
| `insights/service.py` | persona insights generated | `insights_generated` |
| `store/helpers.py` | intelligence data refresh | `store_data_updated` |
| Additional modules added incrementally | | |

### 3.2 Kafka Topic Design

**Single topic**: `platform.events`
- **Partitioning**: By `tenant_id` hash (guarantees per-tenant ordering)
- **Partitions**: 6 initially (scalable without consumer changes)
- **Why single topic**: Event type set is small and fixed. Multiple topics add consumer group complexity without benefit. Fan-out to subscribed extensions happens in the consumer.

### 3.3 Consumer Design

Runs as a separate process (`MODE=consumer` in `entrypoint.py`). Uses `aiokafka.AIOKafkaConsumer`.

**Processing flow per Kafka message**:
1. Deserialize the event envelope
2. Query `event_subscriptions JOIN extension_instances` for active subscriptions matching `(event_type_id, org_id, tenant_id)` — **cached in Redis for 60 seconds** (key: `ext:subs:{event_type}:{org_id}:{tenant_id}`)
3. For each matching extension instance, create an `event_delivery_log` row (status=`pending`)
4. Dispatch the event to each webhook via `dispatcher.py` (fire-and-forget `asyncio.create_task`, concurrency-limited by `asyncio.Semaphore(20)`)
5. Commit Kafka offset after all dispatch tasks are created (delivery tracking is in the database, not Kafka)

**Redis cache invalidation**: Subscription create/update/delete operations in `dao.py` invalidate the cached subscription lookups (write-through pattern).

### 3.4 Webhook Delivery (dispatcher.py)

Long-lived `httpx.AsyncClient` with connection pooling (not per-request like buyplan's pattern — this component may make hundreds of calls per minute).

**Outbound payload** (POST to extension's `webhook_url`):
```json
{
    "delivery_id": "uuid-of-delivery-log-row",
    "event_type": "sales_data_added",
    "source_type": "event",
    "org_id": "org-123",
    "tenant_id": "tenant-456",
    "payload": { "...business data..." },
    "callback_url": "https://core.example.com/v1.0/extensions/callback",
    "timestamp": "2026-04-17T10:00:00Z"
}
```

**HMAC signing** — every outbound request includes:
- `X-Extension-Signature: sha256=<HMAC-SHA256(webhook_secret, body_bytes)>`
- `X-Extension-Timestamp: <unix_epoch>` (for replay protection; extensions should reject >5min old)

**Retry logic** — exponential backoff on failure (non-2xx or timeout):
- Update `event_delivery_log.status = 'failed'`, increment `attempt_count`
- If `attempt_count < max_attempts`: compute `next_retry_at = now() + (60s * 2^attempt_count)`
- Background retry loop (in consumer process) polls for rows where `next_retry_at <= now() AND status = 'failed' AND attempt_count < max_attempts`

### 3.5 Extension Callback (Response Handling)

**Endpoint**: `POST /v1.0/extensions/callback`

Extension authenticates using `Authorization: Bearer <callback_token>`.

**Callback payload from extension**:
```json
{
    "delivery_id": "uuid-of-delivery-log-row",
    "status": "completed",
    "data": {
        "insights": [ "..." ],
        "recommendations": [ "..." ]
    }
}
```

Core validates the token, verifies `delivery_id` belongs to the authenticated extension instance, stores `response_data` in the delivery log row, and updates status to `response_received`.

---

## 4. Cron/Scheduler Architecture (Temporal)

Cron schedules are implemented as **Temporal scheduled workflows**, not a custom tick-loop. Temporal handles cron parsing, deduplication, retries, and execution history natively.

### 4.1 Temporal Setup (module-local)

**Client** (`extensions/temporal/client.py`): Module-local Temporal client factory. Reads `TemporalSettings` from `extensions/config.py`. No dependency on `core/`.

```python
from temporalio.client import Client
from app.extensions.config import TemporalSettings

_client: Client | None = None

async def get_temporal_client() -> Client:
    global _client
    if _client is None:
        settings = TemporalSettings()
        _client = await Client.connect(settings.server_url, namespace=settings.namespace)
    return _client
```

**Worker** (`extensions/temporal/worker.py`): Runs as `MODE=temporal-worker` process. Registers workflows and activities on the `extensions-cron` task queue.

```python
from temporalio.worker import Worker
from app.extensions.temporal.client import get_temporal_client
from app.extensions.temporal.workflows import CronDataSyncWorkflow
from app.extensions.temporal.activities import fetch_bq_data, deliver_webhook, update_delivery_log
from app.extensions.config import TemporalSettings

async def run_worker():
    settings = TemporalSettings()
    client = await get_temporal_client()
    worker = Worker(
        client,
        task_queue=settings.task_queue,
        workflows=[CronDataSyncWorkflow],
        activities=[fetch_bq_data, deliver_webhook, update_delivery_log],
    )
    await worker.run()
```

### 4.2 Workflow & Activities

**Workflow** (`extensions/temporal/workflows.py`): `CronDataSyncWorkflow` — orchestrates the data sync pipeline. Temporal's schedule feature handles the cron timing; the workflow runs once per trigger.

```python
from temporalio import workflow
from datetime import timedelta

@workflow.defn
class CronDataSyncWorkflow:
    @workflow.run
    async def run(self, schedule_id: str) -> dict:
        # Step 1: Fetch data from BigQuery
        bq_result = await workflow.execute_activity(
            fetch_bq_data,
            args=[schedule_id],
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )

        # Step 2: Deliver data to extension webhook
        delivery_result = await workflow.execute_activity(
            deliver_webhook,
            args=[schedule_id, bq_result],
            start_to_close_timeout=timedelta(seconds=60),
            retry_policy=RetryPolicy(maximum_attempts=3, backoff_coefficient=2.0),
        )

        # Step 3: Update delivery log with result
        await workflow.execute_activity(
            update_delivery_log,
            args=[delivery_result],
            start_to_close_timeout=timedelta(seconds=10),
        )

        return delivery_result
```

**Activities** (`extensions/temporal/activities.py`):

| Activity | Responsibility |
|----------|---------------|
| `fetch_bq_data` | Read `dataset_config` + `cron_schedule` from DB, query BigQuery, return JSON rows |
| `deliver_webhook` | POST data to extension `webhook_url` with HMAC signing, create `event_delivery_log` row |
| `update_delivery_log` | Update delivery status (delivered/failed), update `cron_schedules.last_run_at` |

Each activity has its own retry policy. Temporal handles retries transparently — no custom retry loop needed.

### 4.3 Schedule Lifecycle (API ↔ Temporal)

When a cron schedule is created/updated/deleted via the CRUD API, `helpers.py` manages the corresponding Temporal schedule:

| API Action | Temporal Action |
|-----------|-----------------|
| `POST /schedules` | `client.create_schedule(schedule_id, CronDataSyncWorkflow, cron=cron_expression)` |
| `PATCH /schedules/{id}` (cron change) | `schedule_handle.update(cron=new_expression)` |
| `PATCH /schedules/{id}` (pause) | `schedule_handle.pause()` |
| `PATCH /schedules/{id}` (resume) | `schedule_handle.unpause()` |
| `DELETE /schedules/{id}` | `schedule_handle.delete()` |

The `temporal_schedule_id` stored in the DB row is the Temporal schedule handle ID. This ensures the API can always reference and manage the schedule on the Temporal server.

### 4.4 Data Extraction from BigQuery

Self-contained BQ client at `extensions/connectors/bigquery.py` (same pattern as `store/connectors/bigquery.py`):

1. Read `dataset_configs` row for the schedule's `dataset_config_id`
2. If `query_template` is set: render with template variables (`{{date_from}}` = `last_run_at`, `{{date_to}}` = `now`)
3. If only `bq_table` is set: build `SELECT * FROM project.dataset.table` with optional filters from `filters` JSONB
4. Execute via `asyncio.to_thread()` (BQ client is synchronous)
5. Serialize results as JSON
6. Return to workflow for webhook delivery

### 4.5 Why Temporal over custom tick-loop / Celery

| Concern | Custom tick-loop | Temporal |
|---------|-----------------|----------|
| Cron parsing | Manual (`croniter`) | Native schedule support |
| Deduplication | Advisory locks | Built-in (schedule ID uniqueness) |
| Retries | Custom backoff loop | Per-activity retry policies |
| Execution history | Manual `event_delivery_log` only | Full workflow history + delivery log |
| Pause/resume | DB flag + scheduler check | `schedule.pause()` / `unpause()` |
| Observability | Custom logging | Temporal UI + workflow history |
| Multi-replica safety | Advisory locks per schedule | Temporal server handles assignment |
| Microservice extraction | Rewire scheduler process | Just point worker at new task queue |

---

## 5. Extension Query API (Pull-Based Data Access)

Extensions can directly query data on Core's BigQuery — scoped to datasets explicitly configured for that extension instance. This complements the push-based model (webhooks via events/cron) with a pull-based model where extensions initiate queries on demand.

### 5.1 Access Control

The `dataset_configs` table IS the access control list. An extension can only query datasets where a `dataset_config` row exists for their extension instance. No separate ACL table is needed.

**Validation flow**:
1. Resolve extension instance from `callback_token` (same token used for callbacks)
2. Verify `dataset_config_id` belongs to that extension instance: `WHERE id = :config_id AND extension_instance_id = :instance_id`
3. Build or validate the query against the allowed `bq_project.bq_dataset.bq_table`
4. Execute and deliver results

### 5.2 Query Modes

**Structured mode** (safe, covers ~80% of use cases):
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
Core builds a safe parameterized query from the dataset_config's table reference + caller's columns/filters. No SQL injection possible.

**SQL mode** (flexible, validated):
```json
{
    "dataset_config_id": "uuid-of-allowed-dataset",
    "mode": "sql",
    "sql": "SELECT region, SUM(sales) FROM {{table}} WHERE date >= '2026-01-01' GROUP BY region",
    "delivery": "stream"
}
```
Core substitutes `{{table}}` with the actual `bq_project.bq_dataset.bq_table` from the dataset_config. The query is parsed via `sqlglot` to validate that no other tables are referenced (rejects queries with JOINs/subqueries referencing unauthorized tables).

### 5.3 Delivery Modes

**`delivery: "stream"` (default)** — NDJSON streaming response. Core streams rows as BQ fetches them page-by-page. No timeout, low memory, immediate results.

**`delivery: "webhook"`** — For very long queries (10+ min) or extensions that prefer fire-and-forget. Core returns `202 Accepted` with a `query_id`, executes the query in the background, and POSTs results to the extension's `webhook_url` via the existing dispatcher.

### 5.4 Streaming Response (NDJSON)

**Endpoint**: `POST /v1.0/extensions/query`
**Auth**: `Authorization: Bearer <callback_token>`
**Content-Type**: `application/x-ndjson`

Three message types streamed as newline-delimited JSON:

```
{"type": "metadata", "query_id": "uuid", "dataset_config_id": "uuid", "dataset": "project.dataset.table"}
{"type": "row", "data": {"region": "US", "sales": 42000}}
{"type": "row", "data": {"region": "EU", "sales": 38000}}
...
{"type": "done", "row_count": 15000, "bytes_processed": 1048576, "duration_ms": 3200}
```

On failure mid-stream: `{"type": "error", "message": "BigQuery timeout after 300s"}` terminates the stream.

**Implementation sketch**:
```python
from fastapi.responses import StreamingResponse

@router.post("/query")
async def query_dataset(req: QueryRequest, ...):
    instance = await validate_extension_auth(req.callback_token)
    config = await validate_dataset_access(instance.id, req.dataset_config_id)

    if req.delivery == "webhook":
        query_id = await enqueue_query(instance, config, req)
        return JSONResponse(status_code=202, content={"query_id": str(query_id)})

    return StreamingResponse(
        stream_bq_results(config, req),
        media_type="application/x-ndjson",
    )

async def stream_bq_results(config, req):
    query_id = uuid4()
    yield json.dumps({"type": "metadata", "query_id": str(query_id)}) + "\n"

    # BQ client is sync — run in thread, iterate pages
    result = await asyncio.to_thread(execute_bq_query, config, req)

    row_count = 0
    for page in result.pages:
        for row in page:
            yield json.dumps({"type": "row", "data": dict(row)}) + "\n"
            row_count += 1

    yield json.dumps({"type": "done", "row_count": row_count}) + "\n"
```

### 5.5 Webhook Delivery of Query Results

When `delivery: "webhook"`:

1. Core returns `202 Accepted` with `{ "query_id": "uuid" }`
2. Background task executes the BQ query
3. Results POSTed to extension's `webhook_url` via the existing dispatcher with HMAC signing:
```json
{
    "delivery_id": "uuid",
    "source_type": "query",
    "query_id": "uuid",
    "dataset_config_id": "uuid",
    "payload": {
        "rows": [ {"region": "US", "sales": 42000}, ... ],
        "row_count": 15000,
        "bytes_processed": 1048576
    },
    "callback_url": "https://core.example.com/v1.0/extensions/callback",
    "timestamp": "2026-04-21T10:00:00Z"
}
```
4. Delivery tracked in `event_delivery_log` with `source_type = 'query'`

### 5.6 Query Audit Log

Separate from `event_delivery_log` (which tracks Core→Extension pushes). This table audits extension-initiated queries.

```sql
CREATE TABLE extension_query_log (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extension_instance_id UUID NOT NULL REFERENCES extension_instances(id),
    dataset_config_id     UUID NOT NULL REFERENCES dataset_configs(id),
    query_mode            VARCHAR(32) NOT NULL,          -- 'structured' | 'sql'
    delivery_mode         VARCHAR(32) NOT NULL,          -- 'stream' | 'webhook'
    query_text            TEXT,                           -- actual BQ SQL executed
    status                VARCHAR(32) DEFAULT 'pending', -- pending | running | completed | failed
    row_count             INT,
    bytes_processed       BIGINT,
    error_message         TEXT,
    duration_ms           INT,
    created_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_query_log_instance ON extension_query_log(extension_instance_id, created_at DESC);
```

### 5.7 Rate Limiting

- Per extension instance: 10 queries/min, max 10,000 rows per query (configurable via `QuerySettings`)
- Redis sliding window: `ext:query_ratelimit:{instance_id}:minute`

### 5.8 Query Flow Diagram

```
Extension: POST /v1.0/extensions/query
    |
    | Authorization: Bearer <callback_token>
    v
Core API
    |
    | 1. Validate callback_token → resolve extension instance
    | 2. Validate dataset_config_id belongs to instance (access control)
    | 3. Build query (structured) or validate query (sql mode via sqlglot)
    | 4. Create extension_query_log row (status=pending)
    |
    |--- delivery=stream ----→ StreamingResponse (NDJSON)
    |                              | metadata line
    |                              | row lines (page by page from BQ)
    |                              | done line
    |                              v
    |                          Extension processes rows as they arrive
    |
    |--- delivery=webhook ---→ 202 Accepted { query_id }
                                   |
                                   | Background: execute BQ query
                                   | POST results to webhook_url (HMAC signed)
                                   v
                               Extension receives results via webhook
```

---

## 6. API Endpoints

All endpoints prefixed with `/v1.0/extensions/`, requiring `X-Tenant-ID` + `X-Org-ID` headers.

### 6.1 Extension Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1.0/extensions/catalog` | List all available extensions (global catalog) |
| `POST` | `/v1.0/extensions/register` | Register a new extension (platform admin only) |
| `GET` | `/v1.0/extensions/installed` | List extensions installed for current tenant |
| `POST` | `/v1.0/extensions/install` | Install an extension for current tenant |
| `GET` | `/v1.0/extensions/{slug}` | Get extension instance details |
| `PATCH` | `/v1.0/extensions/{slug}` | Update extension config / webhook URL |
| `DELETE` | `/v1.0/extensions/{slug}` | Uninstall extension for current tenant |
| `POST` | `/v1.0/extensions/{slug}/toggle` | Enable/disable extension |

### 6.2 Event Subscriptions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1.0/extensions/event-types` | List all available event types |
| `GET` | `/v1.0/extensions/{slug}/subscriptions` | List event subscriptions |
| `POST` | `/v1.0/extensions/{slug}/subscriptions` | Subscribe to events (`{"event_type_ids": [...]}`) |
| `DELETE` | `/v1.0/extensions/{slug}/subscriptions/{event_type_id}` | Unsubscribe |

### 6.3 Cron Schedules

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1.0/extensions/{slug}/schedules` | List cron schedules |
| `POST` | `/v1.0/extensions/{slug}/schedules` | Create schedule |
| `PATCH` | `/v1.0/extensions/{slug}/schedules/{id}` | Update schedule |
| `DELETE` | `/v1.0/extensions/{slug}/schedules/{id}` | Delete schedule |

### 6.4 Dataset Configuration

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1.0/extensions/{slug}/datasets` | List dataset configs |
| `POST` | `/v1.0/extensions/{slug}/datasets` | Create dataset config |
| `PATCH` | `/v1.0/extensions/{slug}/datasets/{id}` | Update dataset config |
| `DELETE` | `/v1.0/extensions/{slug}/datasets/{id}` | Delete dataset config |

### 6.5 Delivery & Callback

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1.0/extensions/callback` | Receive updates from extensions (extension-facing) |
| `GET` | `/v1.0/extensions/{slug}/deliveries` | Delivery log (paginated, filterable by status/source_type) |
| `GET` | `/v1.0/extensions/{slug}/deliveries/{id}` | Delivery detail + response data |

### 6.6 Query API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1.0/extensions/query` | Execute a query against an allowed dataset (streaming or webhook delivery) |
| `GET` | `/v1.0/extensions/{slug}/queries` | Query audit log (paginated, filterable by status/mode) |
| `GET` | `/v1.0/extensions/{slug}/queries/{id}` | Query detail + execution stats |

### 6.7 iframe

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1.0/extensions/{slug}/iframe-url` | Get signed iframe URL with auth token |

---

## 7. Frontend Integration

### 7.1 iframe Embedding

**Component**: `apps/web/src/components/extensions/ExtensionIframe.tsx`

- Sandboxed: `<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups">`
- Source: `{iframe_base_url}?tenant_id={tenantId}&org_id={orgId}&token={sessionToken}`
- `referrerPolicy="no-referrer"`

**postMessage protocol**:
| Direction | Type | Payload | Purpose |
|-----------|------|---------|---------|
| Host -> Extension | `CORE_CONTEXT` | `{ tenantId, orgId, theme, locale }` | Send on iframe load |
| Extension -> Host | `EXT_NAVIGATE` | `{ route }` | Request Core navigation |
| Extension -> Host | `EXT_RESIZE` | `{ height }` | Request iframe height change |
| Extension -> Host | `EXT_NOTIFICATION` | `{ level, message }` | Show toast in Core UI |

Messages validated by checking `event.origin` against registered `iframe_base_url` domain.

### 7.2 Admin Pages

| Page | Path | Purpose |
|------|------|---------|
| `AdminExtensionsPage.tsx` | `/admin/extensions` | List installed extensions, install new ones |
| `AdminExtensionDetailPage.tsx` | `/admin/extensions/:extensionSlug` | Configure subscriptions, schedules, datasets, webhook, view delivery logs |
| `ExtensionEmbedPage.tsx` | `/extensions/:extensionSlug/embed` | Full-page iframe view |

### 7.3 State Management

**Zustand store**: `apps/web/src/hooks/useExtensionStore.ts` — manages installed extensions list for current tenant, fetched from `/v1.0/extensions/installed`.

### 7.4 Navigation

Add "Extensions" to admin sidebar (lucide `Puzzle` icon). Extensions with `iframe_base_url` also appear in main sidebar under a collapsible "Extensions" product group.

---

## 8. Security

### 8.1 Webhook HMAC Signing
- `X-Extension-Signature: sha256=<HMAC-SHA256(webhook_secret, body_bytes)>` on every outbound POST
- `X-Extension-Timestamp: <unix_epoch>` for replay protection (reject >5min old)
- Computed via `hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()`

### 8.2 iframe Sandboxing
- `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` (no `allow-top-navigation`, no `allow-modals`)
- CSP `frame-src` restricted to registered extension domains only

### 8.3 Secret Management
- `webhook_secret` generated server-side (32-byte random hex) on install, returned once, stored encrypted
- `callback_token` generated similarly, extension uses as Bearer token
- Both rotatable via `PATCH /v1.0/extensions/{slug}`
- Never logged (AuditMiddleware already sanitizes `secret` and `token` fields)

### 8.4 Query API Security
- **Dataset-scoped access**: Extensions can only query `dataset_configs` linked to their instance — `dataset_configs` table is the ACL
- **Structured mode**: Core builds parameterized queries — no SQL injection possible
- **SQL mode**: `{{table}}` placeholder substituted server-side; query parsed via `sqlglot` to reject references to unauthorized tables (JOINs, subqueries, CTEs referencing other datasets)
- **SQL mode can be disabled** globally via `EXTENSIONS_QUERY_ALLOWED_SQL_MODE=false` for maximum safety
- **Row limits**: Max 10,000 rows per query (configurable) to prevent resource exhaustion
- **BQ timeout**: 300s default, prevents runaway queries

### 8.5 Rate Limiting
- Callback endpoint: 60 req/min per extension instance (Redis sliding window: `ext:ratelimit:{instance_id}:minute`)
- Query endpoint: 10 req/min per extension instance (Redis sliding window: `ext:query_ratelimit:{instance_id}:minute`)
- Outbound delivery: `asyncio.Semaphore(20)` per consumer instance

### 8.6 Tenant Isolation
- All DAO queries include `org_id` and `tenant_id` in WHERE clauses
- Callback validates `callback_token` matches instance, `delivery_id` belongs to that instance
- BQ queries use platform service account but only access explicitly configured datasets

---

## 9. Infrastructure Changes

### 9.1 docker-compose.yml — Add Redpanda (Kafka-compatible)

```yaml
redpanda:
  image: docker.redpanda.com/redpandadata/redpanda:v24.1.1
  command:
    - redpanda start
    - --smp 1
    - --memory 256M
    - --overprovisioned
    - --kafka-addr 0.0.0.0:9092
    - --advertise-kafka-addr redpanda:9092
  ports:
    - "9092:9092"
  healthcheck:
    test: ["CMD", "rpk", "cluster", "health"]
    interval: 5s
    timeout: 3s
    retries: 5
```

### 9.2 docker-compose.yml — Temporal server (dev)

```yaml
temporal:
  image: temporalio/auto-setup:latest
  ports:
    - "7233:7233"      # gRPC frontend
  environment:
    - DB=postgresql
    - DB_PORT=5432
    - POSTGRES_USER=postgres
    - POSTGRES_PWD=postgres
    - POSTGRES_SEEDS=postgres
  depends_on: [postgres]

temporal-ui:
  image: temporalio/ui:latest
  ports:
    - "8088:8080"
  environment:
    - TEMPORAL_ADDRESS=temporal:7233
  depends_on: [temporal]
```

### 9.3 entrypoint.py — New process modes

```python
elif loaded_config.MODE == "temporal-worker":
    import asyncio
    from app.extensions.temporal.worker import run_worker
    asyncio.run(run_worker())

elif loaded_config.MODE == "consumer":
    import asyncio
    from app.extensions.kafka.consumer import run_consumer
    asyncio.run(run_consumer())
```

### 9.4 docker-compose.yml — Temporal worker + Kafka consumer services

```yaml
extensions-temporal-worker:
  build: { context: ., dockerfile: Dockerfile.local }
  volumes: [same as api]
  environment:
    - MODE=temporal-worker
    - TEMPORAL_SERVER_URL=temporal:7233
    - EXTENSIONS_DB_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/config_db
  depends_on: [api, temporal]

extensions-consumer:
  build: { context: ., dockerfile: Dockerfile.local }
  volumes: [same as api]
  environment:
    - MODE=consumer
    - KAFKA_BOOTSTRAP_SERVERS=redpanda:9092
  depends_on: [api, redpanda]
```

---

## 10. Implementation Phases

### Phase 1: Extension Registration + Query API + iframe (Week 1-3)
Extension CRUD, pull-based BQ data access, and iframe embedding. No external infrastructure dependencies (no Kafka, no Temporal) — just FastAPI + Postgres + BigQuery.

**Tech stack**: SQLAlchemy 2.x (async), FastAPI, uv, Alembic, sqlglot, httpx.

#### 1a. Module skeleton & DB schema
- Add `sqlalchemy[asyncio]`, `alembic`, `sqlglot`, `httpx` to `pyproject.toml` (via `uv add`)
- Create `extensions/` module with full directory structure (including `temporal/`, `kafka/`, `connectors/`, `migrations/` — scaffolded for later phases)
- Implement `config.py` — module-local settings (DB, query config)
- Implement `database.py` — module-local SQLAlchemy async engine + session factory
- Implement `models.py` — SQLAlchemy ORM models for Phase 1 tables: `extensions`, `extension_instances`, `event_types`, `event_subscriptions`, `dataset_configs`, `extension_query_log`
- Module-local Alembic setup (`extensions/migrations/`) + seed initial event types
- Tables for later phases (`cron_schedules`, `event_delivery_log`) can be included in the migration but are unused until Phase 2

#### 1b. Extension CRUD API
- Implement `constants.py`, `serializer.py`, `dao.py`, `helpers.py`, `views.py`, `router.py`
- CRUD endpoints: extension catalog, register, install/uninstall, toggle, update
- CRUD endpoints: event subscriptions, dataset configs
- Register router in `main.py`
- All DAO operations via SQLAlchemy async sessions (not raw SQL)

#### 1c. Extension Query API (pull-based data access)
- Implement `query_handler.py` — query validation, BQ execution, NDJSON streaming
- Implement `extensions/connectors/bigquery.py` — self-contained BQ client (ADC auth, same pattern as `store/connectors/bigquery.py`)
- `POST /v1.0/extensions/query` with `callback_token` auth
- Structured mode: build parameterized queries from dataset_config + filters/columns
- SQL mode: `{{table}}` substitution + `sqlglot` validation against unauthorized table references
- Streaming delivery: `StreamingResponse` with NDJSON (metadata → rows → done/error)
- `extension_query_log` table for audit trail (query mode, delivery mode, execution stats)
- Rate limiting: 10 queries/min per extension instance (Redis sliding window)
- `GET /v1.0/extensions/{slug}/queries` — query audit log

#### 1d. Frontend — iframe embedding + admin UI
- Create `useExtensionStore.ts` Zustand store
- Create `AdminExtensionsPage.tsx` — list installed extensions, install new ones from catalog
- Create `AdminExtensionDetailPage.tsx` — configure subscriptions, datasets, view query logs
- Create `ExtensionIframe.tsx` component + `ExtensionEmbedPage.tsx` — sandboxed iframe with postMessage protocol
- `GET /v1.0/extensions/{slug}/iframe-url` — signed iframe URL with auth token
- Add routes to `App.tsx`, navigation entries (admin sidebar + main sidebar for iframe extensions)
- CSP `frame-src` restricted to registered extension domains

- **Deliverable**: Extensions can register, install per-tenant, query Core's BQ with access validation + NDJSON streaming, and embed their UI as iframes. No Kafka/Temporal infrastructure needed.

### Phase 2: Webhook Delivery + Temporal Cron (Week 4-5)
Push-based data delivery: cron-scheduled BQ data sync and webhook dispatcher.

**New dependencies**: `temporalio`

#### 2a. Webhook dispatcher
- Implement `dispatcher.py` — httpx async client with HMAC-SHA256 signing + retries
- HMAC signing: `X-Extension-Signature`, `X-Extension-Timestamp` on every outbound POST
- Retry logic: exponential backoff on failure (non-2xx or timeout)
- `event_delivery_log` tracking with status progression (pending → sent → delivered/failed)

#### 2b. Extension callback endpoint
- `POST /v1.0/extensions/callback` — receive responses from extensions
- Validate `callback_token`, match `delivery_id` to extension instance
- Store `response_data` in delivery log, update status to `response_received`

#### 2c. Temporal scheduled workflows + BigQuery cron sync
- Add Temporal server + UI to `docker-compose.yml`
- Implement `extensions/temporal/client.py` — module-local Temporal client factory
- Implement `extensions/temporal/workflows.py` — `CronDataSyncWorkflow`
- Implement `extensions/temporal/activities.py` — `fetch_bq_data`, `deliver_webhook`, `update_delivery_log`
- Implement `extensions/temporal/worker.py` — worker process (`MODE=temporal-worker`)
- Add `MODE=temporal-worker` to `entrypoint.py`
- CRUD endpoints for cron schedules (create/update/delete sync to Temporal)
- Full flow: Temporal schedule → BQ query → webhook POST → delivery log

#### 2d. Query API webhook delivery mode
- Extend query API to support `"delivery": "webhook"` — `202 Accepted` + background BQ execution + webhook POST of results
- Delivery tracked in `event_delivery_log` with `source_type = 'query'`

- **Deliverable**: Cron-scheduled BQ data delivery to extension webhooks, webhook dispatcher with HMAC signing + retries, callback handling, query API webhook delivery mode

### Phase 3: Kafka Event System (Week 6)
Kafka infrastructure, event production, consumer-driven delivery.

**New dependencies**: `aiokafka`

- Add Redpanda to `docker-compose.yml`
- Add `KafkaSettings` to `extensions/config.py` (module-local, not `core/config.py`)
- Implement `extensions/kafka/producer.py` — module-local Kafka producer, initialized in `main.py` lifespan
- Implement `extensions/kafka/consumer.py` — module-local Kafka consumer (`MODE=consumer`)
- Add `MODE=consumer` to `entrypoint.py`
- Add `emit()` calls to 2-3 business modules (buyplan, insights) — thin integration points
- Redis subscription cache with invalidation
- Consumer dispatches events to subscribed extensions via `dispatcher.py` (reuses Phase 2 webhook infra)
- **Deliverable**: End-to-end: action → Kafka → consumer → webhook → callback

### Phase 4: Hardening (Week 7)
Security, observability, tests.
- Rate limiting on callback endpoint (Redis sliding window)
- Delivery retry background task in consumer
- Metrics/logging: delivery success rate, webhook latency, Kafka consumer lag, query execution stats
- Unit + integration tests
- Module `CLAUDE.md` documentation
- **Deliverable**: Production-ready extension system

---

## 11. Key Files to Modify

### Phase 1
| File | Change |
|------|--------|
| `apps/api/src/app/main.py` | Add `extensions_router` |
| `apps/api/pyproject.toml` | Add `sqlalchemy[asyncio]`, `alembic`, `sqlglot`, `httpx` dependencies (via `uv add`) |
| `apps/web/src/App.tsx` | Add extension routes |

### Phase 2
| File | Change |
|------|--------|
| `apps/api/src/app/main.py` | Init Temporal client in lifespan |
| `apps/api/src/app/entrypoint.py` | Add `MODE=temporal-worker` branch |
| `apps/api/pyproject.toml` | Add `temporalio` dependency (via `uv add`) |
| `docker-compose.yml` | Add `temporal`, `temporal-ui`, `extensions-temporal-worker` services |

### Phase 3
| File | Change |
|------|--------|
| `apps/api/src/app/entrypoint.py` | Add `MODE=consumer` branch |
| `apps/api/pyproject.toml` | Add `aiokafka` dependency (via `uv add`) |
| `docker-compose.yml` | Add `redpanda`, `extensions-consumer` services |

**Note**: `core/config.py` is NOT modified. All extension settings live in `extensions/config.py` to maintain module self-sufficiency.

---

## 12. Key Architectural Decisions

1. **SQLAlchemy 2.x (async) over raw asyncpg**: ORM models provide schema-as-code, migration support via Alembic, and cleaner DAO layer. Async sessions via `asyncpg` driver preserve performance. All DAO operations use SQLAlchemy async sessions, not raw SQL.

2. **Temporal for cron scheduling**: Temporal scheduled workflows replace custom tick-loops. Native cron support, deduplication, retry policies, pause/resume, and full execution history out of the box. No advisory locks or `croniter` needed — Temporal owns the timing.

3. **Module-local infrastructure clients**: DB engine, Temporal client, Kafka producer/consumer, and BigQuery client all live inside `extensions/`. The module can be extracted to a standalone microservice by changing environment variables — no code rewiring.

4. **Config DB, not tenant DB**: Extension metadata is cross-tenant configuration, not business data — same location as `organizations`, `tenants`, `module_configs`.

5. **Single Kafka topic**: `platform.events` with tenant-based partitioning. Fan-out to extensions happens in the consumer, not in Kafka.

6. **Separate processes**: Temporal worker and Kafka consumer run as `MODE=temporal-worker` and `MODE=consumer` processes via `entrypoint.py`. Keeps the API server fast.

7. **Long-lived httpx.AsyncClient**: Connection pooling for high-throughput webhook delivery (unlike buyplan's per-request pattern).

8. **Self-sufficient module**: All infrastructure owned by the module. Only external deps are `core.response` and `tenancy.models` — thin interfaces that are trivially replaceable when extracting to a microservice.

9. **uv for dependency management**: All Python dependencies managed via `uv add` / `uv sync` — faster and more reliable than pip.

10. **Pull-based query API with NDJSON streaming**: Extensions can query BQ directly (scoped to allowed datasets) instead of waiting for cron/event pushes. NDJSON streaming avoids HTTP timeouts and memory pressure for large result sets. Webhook delivery offered as a fallback for very long queries. `dataset_configs` serves as both cron config and query ACL — single source of truth for data access.

11. **`sqlglot` for SQL mode validation**: When extensions submit raw SQL (with `{{table}}` placeholder), `sqlglot` parses the AST to ensure no unauthorized table references. Structured mode (parameterized queries built server-side) is the safe default; SQL mode is opt-in and can be disabled globally.

---

## 13. System Flow Diagrams

### Event-Driven Flow
```
Business Module (e.g., buyplan)
    |
    | await producer.emit("buyplan_status_changed", payload, org_id, tenant_id)
    v
Kafka Topic: platform.events
    |
    | consumer reads message
    v
Consumer Process (MODE=consumer)
    |
    | 1. Lookup subscriptions (Redis-cached)
    | 2. Create delivery_log rows
    | 3. For each subscriber:
    v
WebhookDispatcher
    |
    | POST webhook_url with HMAC-signed payload
    v
Extension Webhook (external)
    |
    | Extension processes event
    | Extension calls back:
    v
POST /v1.0/extensions/callback
    |
    | Validate callback_token
    | Store response_data in delivery_log
    v
Done (status = response_received)
```

### Cron Flow (Temporal)
```
Temporal Server
    |
    | Schedule triggers at cron_expression time
    | Starts CronDataSyncWorkflow on task queue "extensions-cron"
    v
Temporal Worker (MODE=temporal-worker)
    |
    | Activity 1: fetch_bq_data(schedule_id)
    |   - Read dataset_config from DB
    |   - Query BigQuery
    |   - Return rows as JSON
    v
BigQuery
    |
    | Execute query_template or SELECT from bq_table
    | Return rows as JSON
    v
    | Activity 2: deliver_webhook(schedule_id, bq_data)
    |   - Create event_delivery_log row (source_type='cron')
    |   - POST to extension webhook_url with HMAC-signed payload
    v
Extension Webhook (external)
    |
    | Activity 3: update_delivery_log(delivery_result)
    |   - Update delivery status (delivered/failed)
    |   - Update cron_schedules.last_run_at
    v
Done (Temporal records full workflow history)
```

### Schedule CRUD ↔ Temporal Sync
```
API: POST /schedules
    |
    | helpers.py: create DB row + Temporal schedule
    v
Temporal: client.create_schedule(id, CronDataSyncWorkflow, cron="0 9 * * *")
    |
    | Store temporal_schedule_id in cron_schedules row
    v
Done

API: DELETE /schedules/{id}
    |
    | helpers.py: delete Temporal schedule + DB row
    v
Temporal: schedule_handle.delete()
    v
Done
```

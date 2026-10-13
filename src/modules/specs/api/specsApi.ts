/**
 * Specs API — wired to /api/gbrain/specs endpoints (same backend prod uses).
 * No mock fallbacks: failures propagate so pages render honest error states.
 */

import { ApiService } from '@/lib/api';
import { gbrainUrl } from '@/modules/agentic-brain/api/agenticBrainApi';
import type { Spec, SpecDiff, SpecListResponse, SpecSection, SpecVersion } from '../data/specsTypes';

// ─── Live-payload normalizers ────────────────────────────────────────────────
// The gbrain backend returns shapes that differ from the flat types the UI
// renders (unified diff lines, {changes:[...]} versions, string[] sections).
// Everything is normalized here at the API boundary so components can trust
// the declared types.

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Backend sections arrive as plain heading titles; the UI needs {id, title, level}. */
function normalizeSections(raw: unknown): SpecSection[] {
  if (!Array.isArray(raw)) return [];
  const sections: SpecSection[] = [];
  raw.forEach((entry, index) => {
    if (typeof entry === 'string') {
      const slug = entry.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      sections.push({ id: slug !== '' ? slug : `section-${index + 1}`, title: entry, level: 1 });
      return;
    }
    if (entry !== null && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      const title = asString(obj.title);
      if (title === undefined) return;
      sections.push({
        id: asString(obj.id) ?? `section-${index + 1}`,
        title,
        level: typeof obj.level === 'number' ? obj.level : 1,
      });
    }
  });
  return sections;
}

const REVIEW_STATUS_MAP: Record<string, SpecVersion['review_status']> = {
  approved: 'approved',
  pending: 'pending',
  changes_requested: 'changes_requested',
};

/** Backend versions use {date, reviewed_by, review_comment, REVIEW_STATUS};
    the UI type uses {created_at, reviewer, review_note, review_status}. */
function normalizeVersion(raw: unknown): SpecVersion | null {
  if (raw === null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.version !== 'number') return null;
  const status = asString(obj.review_status)?.toLowerCase() ?? '';
  return {
    version: obj.version,
    author: asString(obj.author) ?? '',
    summary: asString(obj.summary) ?? '',
    created_at: asString(obj.created_at) ?? asString(obj.date) ?? '',
    review_status: REVIEW_STATUS_MAP[status] ?? 'pending',
    reviewer: asString(obj.reviewer) ?? asString(obj.reviewed_by),
    review_note: asString(obj.review_note) ?? asString(obj.review_comment),
  };
}

function extractVersionList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw !== null && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.versions)) return obj.versions;
    if (Array.isArray(obj.changes)) return obj.changes;
  }
  return [];
}

/** Backend diffs are unified line lists ({type, line, lineNum}); the UI renders
    flat added/removed/unchanged buckets. */
function normalizeSpecDiff(raw: unknown): SpecDiff {
  const empty: SpecDiff = { added: [], removed: [], unchanged: [] };
  if (raw === null || typeof raw !== 'object') return empty;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.diff)) {
    const result: SpecDiff = { added: [], removed: [], unchanged: [] };
    for (const entry of obj.diff) {
      if (entry === null || typeof entry !== 'object') continue;
      const { type, line } = entry as Record<string, unknown>;
      const text = asString(line) ?? '';
      if (type === 'added') result.added.push(text);
      else if (type === 'removed') result.removed.push(text);
      else result.unchanged.push(text);
    }
    return result;
  }
  return {
    added: toStringArray(obj.added),
    removed: toStringArray(obj.removed),
    unchanged: toStringArray(obj.unchanged),
  };
}

export async function fetchSpecs(params?: {
  domain?: string;
  status?: string;
}): Promise<SpecListResponse> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/specs'), { params: params ?? {} });
  const raw = res.data;
  if (Array.isArray(raw)) return { specs: raw as Spec[] };
  return raw as SpecListResponse;
}

export async function fetchSpec(id: string): Promise<Spec | null> {
  const res = await ApiService.get(gbrainUrl(`/api/gbrain/specs/${id}`));
  const raw = res.data as Record<string, unknown>;

  // API returns { spec: { id, title, ... }, content: "# markdown..." }
  // Merge into flat Spec shape the UI expects
  if ('spec' in raw && typeof raw.spec === 'object' && raw.spec !== null) {
    const specData = raw.spec as Record<string, unknown>;
    const merged: Spec = {
      id: (specData.id as string) ?? '',
      title: (specData.title as string) ?? '',
      domain: (specData.domain as string) ?? 'default',
      status: (specData.status as Spec['status']) ?? 'DRAFT',
      current_version: (specData.current_version as number) ?? 1,
      author: (specData.author as string) ?? '',
      reviewers: toStringArray(specData.reviewers),
      linked_skills: toStringArray(specData.linked_skills),
      sections: normalizeSections(specData.sections),
      content: (raw.content as string) ?? (specData.content as string) ?? '',
      created_at: (specData.created_at as string) ?? '',
      updated_at: (specData.updated_at as string) ?? '',
      benchmarks: (specData.benchmarks as Record<string, string>) ?? undefined,
    };
    return merged;
  }

  // Direct flat Spec (already normalized)
  const spec = raw as unknown as Spec;
  return {
    ...spec,
    sections: normalizeSections(raw.sections),
    reviewers: toStringArray(raw.reviewers),
    linked_skills: toStringArray(raw.linked_skills),
  };
}

export async function fetchSpecVersions(id: string): Promise<SpecVersion[]> {
  const res = await ApiService.get(gbrainUrl(`/api/gbrain/specs/${id}/versions`));
  return extractVersionList(res.data)
    .map(normalizeVersion)
    .filter((v): v is SpecVersion => v !== null);
}

export async function updateSpec(id: string, content: string, summary: string): Promise<void> {
  await ApiService.patch(gbrainUrl(`/api/gbrain/specs/${id}`), {
    data: { content, summary },
  });
}

export async function submitReview(
  id: string,
  action: 'approve' | 'request_changes',
  note: string,
): Promise<void> {
  await ApiService.post(gbrainUrl(`/api/gbrain/specs/${id}/review`), {
    data: { action, note },
  });
}

export async function fetchSpecDiff(id: string, v1: number, v2: number): Promise<SpecDiff> {
  const res = await ApiService.get(gbrainUrl(`/api/gbrain/specs/${id}/diff/${v1}/${v2}`));
  return normalizeSpecDiff(res.data);
}

export const specsKeys = {
  all: ['specs'] as const,
  list: (params?: Record<string, string>) => [...specsKeys.all, 'list', params] as const,
  detail: (id: string) => [...specsKeys.all, 'detail', id] as const,
  versions: (id: string) => [...specsKeys.all, 'versions', id] as const,
  diff: (id: string, v1: number, v2: number) => [...specsKeys.all, 'diff', id, v1, v2] as const,
};

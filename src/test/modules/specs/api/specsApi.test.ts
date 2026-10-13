import { describe, it, expect, vi, beforeEach } from 'vitest';

const getMock = vi.fn();
const postMock = vi.fn();
const patchMock = vi.fn();

vi.mock('@/lib/api', () => ({
  ApiService: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    patch: (...args: unknown[]) => patchMock(...args),
  },
}));

vi.mock('@/modules/agentic-brain/api/agenticBrainApi', () => ({
  gbrainUrl: (path: string) => path,
}));

// Import AFTER the mocks so the api module wires up to the stubs.
import { fetchSpec, fetchSpecVersions, fetchSpecDiff } from '@/modules/specs/api/specsApi';
import type { SpecVersion } from '@/modules/specs/data/specsTypes';

// Inline fixture in the UI's SpecVersion shape (passes through normalizeVersion unchanged).
const SAMPLE_VERSIONS: SpecVersion[] = [
  {
    version: 2,
    author: 'kushanshah@gofynd.com',
    summary: 'Added Section 5',
    created_at: '2026-06-12T20:58:03.692Z',
    review_status: 'approved',
    reviewer: 'farooq@gofynd.com',
    review_note: 'Looks good.',
  },
  {
    version: 1,
    author: 'kushanshah@gofynd.com',
    summary: 'Initial version',
    created_at: '2026-06-12T20:58:03.601Z',
    review_status: 'pending',
    reviewer: undefined,
    review_note: undefined,
  },
];

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  patchMock.mockReset();
});

describe('specsApi.fetchSpecDiff', () => {
  it('normalizes the live gbrain unified diff shape into added/removed/unchanged buckets', async () => {
    // Real backend payload shape observed on /api/gbrain/specs/{id}/diff/1/2
    getMock.mockResolvedValueOnce({
      data: {
        v1: 1,
        v2: 2,
        diff: [
          { type: 'unchanged', line: '# Store Intelligence', lineNum: 1 },
          { type: 'removed', line: 'Track: format, pricing tier, footfall.', lineNum: 9 },
          { type: 'added', line: 'Track: format, pricing tier, footfall, promotions.', lineNum: 9 },
          { type: 'added', line: '## 5. Format-Aware Benchmarks (NEW)', lineNum: 19 },
        ],
      },
    });

    const diff = await fetchSpecDiff('FNL.SC.SI.001', 1, 2);

    expect(diff.added).toEqual([
      'Track: format, pricing tier, footfall, promotions.',
      '## 5. Format-Aware Benchmarks (NEW)',
    ]);
    expect(diff.removed).toEqual(['Track: format, pricing tier, footfall.']);
    expect(diff.unchanged).toEqual(['# Store Intelligence']);
  });

  it('passes through the flat added/removed/unchanged shape', async () => {
    getMock.mockResolvedValueOnce({
      data: { added: ['new line'], removed: ['old line'], unchanged: [] },
    });

    const diff = await fetchSpecDiff('FNL.SC.SI.001', 1, 2);

    expect(diff).toEqual({ added: ['new line'], removed: ['old line'], unchanged: [] });
  });

  it('returns empty buckets for a malformed 2xx payload instead of crashing consumers', async () => {
    getMock.mockResolvedValueOnce({ data: { message: 'unexpected' } });

    const diff = await fetchSpecDiff('FNL.SC.SI.001', 1, 2);

    expect(diff).toEqual({ added: [], removed: [], unchanged: [] });
  });

  it('propagates API errors — no mock fallback (data is API-driven only)', async () => {
    getMock.mockRejectedValueOnce(new Error('network down'));

    await expect(fetchSpecDiff('FNL.SC.SI.001', 1, 2)).rejects.toThrow('network down');
  });
});

describe('specsApi.fetchSpecVersions', () => {
  it('normalizes the live gbrain {changes: [...]} shape into SpecVersion[]', async () => {
    // Real backend payload shape observed on /api/gbrain/specs/{id}/versions
    getMock.mockResolvedValueOnce({
      data: {
        changes: [
          {
            version: 2,
            date: '2026-06-12T20:58:03.692Z',
            author: 'kushanshah@gofynd.com',
            summary: 'Added Section 5: Format-Aware Benchmarks',
            sections_changed: ['Format-Aware Benchmarks'],
            review_status: 'APPROVED',
            reviewed_by: 'farooq@gofynd.com',
            reviewed_at: '2026-06-12T20:58:03.840Z',
            review_comment: 'Looks good.',
          },
          {
            version: 1,
            date: '2026-06-12T20:58:03.601Z',
            author: 'kushanshah@gofynd.com',
            summary: 'Initial version',
            review_status: 'PENDING',
          },
        ],
      },
    });

    const versions = await fetchSpecVersions('FNL.SC.SI.001');

    expect(versions).toHaveLength(2);
    expect(versions[0]).toEqual({
      version: 2,
      author: 'kushanshah@gofynd.com',
      summary: 'Added Section 5: Format-Aware Benchmarks',
      created_at: '2026-06-12T20:58:03.692Z',
      review_status: 'approved',
      reviewer: 'farooq@gofynd.com',
      review_note: 'Looks good.',
    });
    expect(versions[1]).toEqual({
      version: 1,
      author: 'kushanshah@gofynd.com',
      summary: 'Initial version',
      created_at: '2026-06-12T20:58:03.601Z',
      review_status: 'pending',
      reviewer: undefined,
      review_note: undefined,
    });
  });

  it('accepts a bare SpecVersion array', async () => {
    getMock.mockResolvedValueOnce({ data: SAMPLE_VERSIONS });

    const versions = await fetchSpecVersions('FNL.SC.SI.001');

    expect(versions).toEqual(SAMPLE_VERSIONS);
  });

  it('accepts the {versions: [...]} wrapper shape', async () => {
    getMock.mockResolvedValueOnce({ data: { versions: SAMPLE_VERSIONS } });

    const versions = await fetchSpecVersions('FNL.SC.SI.001');

    expect(versions).toEqual(SAMPLE_VERSIONS);
  });

  it('propagates API errors — no mock fallback (data is API-driven only)', async () => {
    getMock.mockRejectedValueOnce(new Error('network down'));

    await expect(fetchSpecVersions('FNL.SC.SI.001')).rejects.toThrow('network down');
  });
});

describe('specsApi.fetchSpec', () => {
  it('normalizes string[] sections from the wrapped {spec, content} payload', async () => {
    // Real backend payload shape observed on /api/gbrain/specs/{id}
    getMock.mockResolvedValueOnce({
      data: {
        spec: {
          id: 'FNL.SC.SI.001',
          title: 'Store Intelligence & Location Analysis',
          domain: 'Store & Channel Operations',
          sections: ['Catchment Profiling', 'Competition Mapping'],
          current_version: 2,
          status: 'DRAFT',
          author: 'kushanshah@gofynd.com',
          reviewers: ['farooq@gofynd.com'],
          linked_skills: ['location-intel'],
          created_at: '2026-06-12T20:58:03.601Z',
          updated_at: '2026-06-12T20:58:03.839Z',
          benchmarks: { catchment_radius_km: '3-5km' },
        },
        content: '# Store Intelligence',
      },
    });

    const spec = await fetchSpec('FNL.SC.SI.001');

    expect(spec).not.toBeNull();
    expect(spec?.sections).toEqual([
      { id: 'catchment-profiling', title: 'Catchment Profiling', level: 1 },
      { id: 'competition-mapping', title: 'Competition Mapping', level: 1 },
    ]);
    expect(spec?.content).toBe('# Store Intelligence');
    expect(spec?.status).toBe('DRAFT');
  });

  it('keeps already-structured {id, title, level} sections as-is', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        spec: {
          id: 'FNL.RM.UCX.003',
          title: 'Cross-Category Competitive Intelligence',
          sections: [{ id: 'overview', title: 'Overview', level: 1 }],
        },
        content: '# Overview',
      },
    });

    const spec = await fetchSpec('FNL.RM.UCX.003');

    expect(spec?.sections).toEqual([{ id: 'overview', title: 'Overview', level: 1 }]);
  });
});

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen, RefreshCw, XCircle, Download, Code, Eye,
  Edit3, Save, X, Plus, Upload, Search, FolderOpen, AlertCircle, FileText,
  Loader2, ChevronDown, Check,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  Card,
  Badge,
  Button,
  MetricGrid,
  PageHeader,
  SectionHeader,
  Spinner,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ToggleGroup,
  ToggleGroupItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  Label,
  FilterSearch,
  FilterMultiSelect,
  BottomSheet,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  fetchWikiPages,
  fetchWikiPage,
  updateWikiPage,
  ingestWikiContent,
  uploadWikiFile,
  fetchSources,
  searchKnowledge,
  gbrainKeys,
  gbrainUrl,
} from '@/modules/agentic-brain/api/agenticBrainApi';
import type { WikiPage as WikiPageType, SearchMode, SearchResult } from '@/modules/agentic-brain/data/agenticBrainTypes';
import { SearchResultCard } from '../components/SearchResultCard';
import { DocumentReader } from '../components/DocumentReader';

type ViewMode = 'rendered' | 'raw';

const SEARCH_MODES: { value: SearchMode; label: string }[] = [
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'vector', label: 'Vector' },
  { value: 'keyword', label: 'Keyword' },
];

/** Router-state payload for "View" handoffs from the Ask AI Knowledge Search results. */
function readDocHandoff(state: unknown): SearchResult | null {
  if (typeof state !== 'object' || state === null || !('doc' in state)) return null;
  const doc = (state as { doc: unknown }).doc;
  if (typeof doc !== 'object' || doc === null) return null;
  const { title, content } = doc as { title?: unknown; content?: unknown };
  return typeof title === 'string' && typeof content === 'string' ? (doc as SearchResult) : null;
}

/* Wiki docs end with a metadata footer the meta row surfaces up top instead:
   ---
   *Source: <file>*
   *Last Updated: <date>*                                                    */
const DOC_FOOTER_RE = /\n---\s*\n\*Source:\s*(.+?)\*\s*\n\*Last Updated:\s*(.+?)\*\s*$/;

function extractDocMeta(content: string): { source?: string; lastUpdated?: string; body: string } {
  const match = content.match(DOC_FOOTER_RE);
  if (!match?.[1] || !match[2] || match.index === undefined) return { body: content };
  return { source: match[1].trim(), lastUpdated: match[2].trim(), body: content.slice(0, match.index) };
}

// ─── Wiki Page Detail View ──────────────────────────────────────────────────

function WikiPageDetail({
  pagePath,
  onBack,
}: {
  pagePath: string;
  onBack: () => void;
}): React.ReactNode {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const { data: pageContent, isLoading } = useQuery({
    queryKey: gbrainKeys.wikiPage(pagePath),
    queryFn: () => fetchWikiPage(pagePath),
  });

  const saveMut = useMutation({
    mutationFn: () => updateWikiPage(pagePath, editContent),
    onSuccess: () => {
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.wikiPage(pagePath) });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!pageContent) return null;

  const docName =
    pageContent.path.split('/').pop()?.replace('.md', '').replace(/-/g, ' ') ?? pageContent.path;
  const meta = extractDocMeta(pageContent.content);
  // The doc's own "Last Updated" (plain YYYY-MM-DD) wins; file mtime is the
  // fallback — and both can be absent (RAG-store index entries).
  const lastUpdated = meta.lastUpdated
    ? /^\d{4}-\d{2}-\d{2}$/.test(meta.lastUpdated)
      ? formatDate(meta.lastUpdated)
      : meta.lastUpdated
    : pageContent.modified
      ? formatDate(pageContent.modified)
      : null;

  return (
    <div className="space-y-4">
      {/* Title bar — back + doc name left, view toggle + CTAs right.
          Whole control cluster is normalized to 36px (h-9): the ToggleGroup's
          default is 42px (border + p-1 + h-8 items), so it is compacted here. */}
      <PageHeader
        onBack={onBack}
        title={docName}
        actions={
          editing ? (
            <>
              <Button size="sm" className="h-9" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={() => setEditing(false)}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            </>
          ) : (
            <>
              <ToggleGroup
                value={viewMode}
                onValueChange={(v) => setViewMode(v as ViewMode)}
                aria-label="View mode"
                className="h-9 p-0.5"
              >
                <ToggleGroupItem value="rendered" aria-label="Rendered view" className="h-[30px]">
                  <Eye className="w-3.5 h-3.5 mr-1" /> Rendered
                </ToggleGroupItem>
                <ToggleGroupItem value="raw" aria-label="Raw markdown" className="h-[30px]">
                  <Code className="w-3.5 h-3.5 mr-1" /> Raw
                </ToggleGroupItem>
              </ToggleGroup>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setEditContent(pageContent.content);
                  setEditing(true);
                }}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
              <Button asChild variant="primary" size="sm" className="h-9">
                <a
                  href={gbrainUrl(`/api/gbrain/wiki/${encodeURIComponent(pagePath)}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                </a>
              </Button>
            </>
          )
        }
      />

      <Card className="p-4">
        {/* Doc metadata — surfaced from the markdown footer, shown up top.
            category is empty on the page-content endpoint for some docs —
            never render an empty pill. */}
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          {pageContent.category && <Badge variant="primary" size="sm">{pageContent.category}</Badge>}
          {meta.source && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <FileText className="w-3.5 h-3.5 text-gray-400" aria-hidden /> Source: {meta.source}
            </span>
          )}
          {lastUpdated && <span className="text-xs text-gray-500">Last updated: {lastUpdated}</span>}
        </div>

        {editing ? (
          <Textarea
            className="w-full min-h-[60vh] font-mono text-xs"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        ) : viewMode === 'rendered' ? (
          <div className="prose prose-sm max-w-none text-gray-700 overflow-x-auto">
            <Markdown remarkPlugins={[remarkGfm]}>
              {meta.body}
            </Markdown>
          </div>
        ) : (
          /* Raw view keeps the full file, footer included — it is the source of truth */
          <pre className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap overflow-x-auto">
            {pageContent.content}
          </pre>
        )}
      </Card>
    </div>
  );
}

// ─── Wiki Page Card ─────────────────────────────────────────────────────────

function WikiCard({
  page,
  onClick,
}: {
  page: WikiPageType;
  onClick: () => void;
}): React.ReactNode {
  // Generate a readable title from the filename
  const title = page.name.replace(/-/g, ' ');

  return (
    <Card
      className="p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group overflow-hidden"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View page: ${page.name}`}
    >
      {/* Magazine-style header bar */}
      <div className="h-1.5 bg-primary/10 rounded-full mb-3 w-16 group-hover:w-24 transition-all" />
      <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{title}</h4>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="info" size="sm">{page.category}</Badge>
        <span className="text-xs text-gray-400">{page.modified}</span>
      </div>
    </Card>
  );
}

// ─── Ingest Dialog ──────────────────────────────────────────────────────────

function IngestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactNode {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [ingestError, setIngestError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const ingestMut = useMutation({
    mutationFn: async () => {
      setIngestError('');
      const res = await ingestWikiContent(title, url || undefined, content || undefined);
      if (!res.success) throw new Error(res.message ?? 'Ingestion failed');
      return res;
    },
    onSuccess: () => {
      onOpenChange(false);
      setTitle('');
      setUrl('');
      setContent('');
      setIngestError('');
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.wiki() });
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.sources() });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Failed to ingest';
      setIngestError(msg);
    },
  });

  const handleFileUpload = async (file: File): Promise<void> => {
    setIngestError('');
    try {
      await uploadWikiFile(file, title || file.name);
      onOpenChange(false);
      setTitle('');
      setUrl('');
      setContent('');
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.wiki() });
      void queryClient.invalidateQueries({ queryKey: gbrainKeys.sources() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setIngestError(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ingest New Source</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500">
          The agent will read, extract entities and concepts, and add them to the wiki.
        </p>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="ingest-title">Title</Label>
            <Input id="ingest-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article about AI in retail" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="ingest-url">URL (optional)</Label>
            <Input id="ingest-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="mt-1" />
          </div>
          <div>
            <Label htmlFor="ingest-content">Or paste content directly</Label>
            <Textarea id="ingest-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste article text here..." className="mt-1" rows={4} />
          </div>
          <div>
            <Label>Or upload a file</Label>
            {/* eslint-disable-next-line no-restricted-syntax -- file input is hidden */}
            <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.doc,.docx,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f); }} />
            <button onClick={() => fileRef.current?.click()} className="mt-1 w-full border-2 border-dashed border-gray-200 rounded-lg px-3 py-3 text-sm text-gray-500 hover:border-primary/30 hover:text-primary transition flex items-center justify-center gap-2 min-h-[44px]" type="button">
              <Upload className="w-4 h-4" /> Choose file (.txt, .md, .pdf, .doc)
            </button>
          </div>
          {ingestError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600">{ingestError}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => ingestMut.mutate()} disabled={!title.trim() || (!url.trim() && !content.trim()) || ingestMut.isPending}>
            {ingestMut.isPending ? <Spinner size="sm" className="mr-1" /> : null}
            Ingest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function WikiPage(): React.ReactNode {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  // ?q= deep-links straight into a deep content search (used by the old
  // /knowledge-base/search redirect).
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(() => searchParams.get('q')?.trim() ?? '');
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid');
  const [modeSheetOpen, setModeSheetOpen] = useState(false);
  // A search result opened as a full document (non-wiki results: uploads, web ingests).
  const [readerDoc, setReaderDoc] = useState<SearchResult | null>(null);
  // "View" handoff from the Ask AI Knowledge Search results message.
  const [pendingDoc, setPendingDoc] = useState<SearchResult | null>(() => readDocHandoff(location.state));
  // Multi-select CSV, 'all' = no category filter (FilterMultiSelect contract).
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ingestOpen, setIngestOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: gbrainKeys.wiki(),
    queryFn: () => fetchWikiPages(),
  });

  const { data: sourcesData } = useQuery({
    queryKey: gbrainKeys.sources(),
    queryFn: fetchSources,
  });

  // Deep content search — the same engine the dissolved Search page used.
  const { data: searchData, isLoading: searchLoading, isFetching: searchFetching } = useQuery({
    queryKey: gbrainKeys.search(submittedQuery, searchMode),
    queryFn: () => searchKnowledge(submittedQuery, 20, searchMode),
    enabled: submittedQuery.length > 0,
  });

  const pages = data?.pages ?? [];
  const sources = sourcesData ?? [];

  // Chat handoff, resolved at render time once the wiki list is available:
  // results that map to a REAL wiki page (source "wiki" — markdown exists) open
  // the wiki detail (edit intact); everything else — uploads, web ingests, and
  // RAG-store index entries whose page fetch returns empty content — opens the
  // document reader with the search result itself. Back clears the handoff.
  const findWikiMatch = (title: string): WikiPageType | null =>
    (data?.pages ?? []).find((p) => p.name === title && p.source === 'wiki') ?? null;

  const handoffMatch = pendingDoc ? findWikiMatch(pendingDoc.title) : null;

  const openResult = (result: SearchResult): void => {
    const match = findWikiMatch(result.title);
    if (match) setSelectedPath(match.path);
    else setReaderDoc(result);
  };

  const submitDeepSearch = (): void => {
    const q = search.trim();
    if (q) setSubmittedQuery(q);
  };

  const clearDeepSearch = (): void => {
    setSubmittedQuery('');
    setSearch('');
  };

  const searchModeLabel = SEARCH_MODES.find((m) => m.value === searchMode)?.label ?? 'Hybrid';

  // Get unique categories for filter
  const wikiCategories = [...new Set(pages.map((p) => p.category))].sort();

  // Filter by search + category
  const selectedCategories =
    categoryFilter && categoryFilter !== 'all' ? new Set(categoryFilter.split(',')) : null;
  const filtered = pages.filter((p) => {
    if (selectedCategories && !selectedCategories.has(p.category)) return false;
    if (!search) return true;
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, WikiPageType[]>>((acc, p) => {
    const cat = p.category || 'root';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  // Detail view
  if (selectedPath) {
    return <WikiPageDetail pagePath={selectedPath} onBack={() => setSelectedPath(null)} />;
  }

  // Non-wiki search result (upload/web ingest) opened as a full document.
  if (readerDoc) {
    return <DocumentReader result={readerDoc} onBack={() => setReaderDoc(null)} />;
  }

  // Chat handoff — wiki matches get the full wiki detail (chat stores trimmed
  // content, the wiki detail re-fetches the whole page); the rest get the reader.
  if (pendingDoc && data) {
    return handoffMatch ? (
      <WikiPageDetail pagePath={handoffMatch.path} onBack={() => setPendingDoc(null)} />
    ) : (
      <DocumentReader result={pendingDoc} onBack={() => setPendingDoc(null)} />
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>;
  }

  if (error) {
    return (
      <EmptyState icon={XCircle} title="Failed to load wiki" description="Could not connect to the Agentic Brain backend."
        action={<Button variant="outline" size="sm" onClick={() => void refetch()}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry</Button>}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Title bar — menu name + CTAs on the right */}
      <PageHeader
        title="Knowledge Base"
        actions={
          <Button size="sm" onClick={() => setIngestOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Ingest
          </Button>
        }
      />
      {submittedQuery ? (
        /* Deep-search results — the browse grid swaps out until Clear */
        <div className="space-y-4">
          {/* Same bar, results context — Enter re-runs; magnifier swaps to a spinner while fetching */}
          <div className="relative w-full sm:max-w-md">
            {searchFetching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" aria-hidden />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden />
            )}
            {/* eslint-disable-next-line no-restricted-syntax -- search input requires icon positioning */}
            <input
              className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-base lg:text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary transition min-h-[44px]"
              placeholder="Search the knowledge base..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitDeepSearch();
              }}
              aria-label="Search the knowledge base"
            />
          </div>

          {searchLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (searchData?.results ?? []).length === 0 ? (
            <EmptyState
              icon={Search}
              title="No results found"
              description={`No matches for "${submittedQuery}". Try a different query or search mode.`}
              action={
                <Button variant="outline" size="sm" onClick={clearDeepSearch}>
                  <X className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              }
            />
          ) : (
            <>
              <SectionHeader
                title={`${searchData?.count ?? searchData?.results.length ?? 0} results`}
                actions={
                  <div className="flex items-center gap-2">
                    {isMobile ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setModeSheetOpen(true)}
                        aria-label={`Search mode: ${searchModeLabel}`}
                      >
                        {searchModeLabel}
                        <ChevronDown className="ml-1 h-3.5 w-3.5 text-gray-400" aria-hidden />
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" aria-label={`Search mode: ${searchModeLabel}`}>
                            {searchModeLabel}
                            <ChevronDown className="ml-1 h-3.5 w-3.5 text-gray-400" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          {SEARCH_MODES.map((m) => (
                            <DropdownMenuItem key={m.value} onSelect={() => setSearchMode(m.value)}>
                              {m.label}
                              {searchMode === m.value && <Check className="ml-auto h-4 w-4 text-primary" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button variant="outline" size="sm" onClick={clearDeepSearch}>
                      <X className="w-3.5 h-3.5 mr-1" /> Clear
                    </Button>
                  </div>
                }
              />
              <div className="space-y-3" aria-live="polite">
                {(searchData?.results ?? []).map((result, i) => (
                  <SearchResultCard
                    key={`${result.title}-${i}`}
                    result={result}
                    onView={() => openResult(result)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Mobile mode picker */}
          <BottomSheet isOpen={modeSheetOpen} onClose={() => setModeSheetOpen(false)} title="Search mode">
            {SEARCH_MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  setSearchMode(m.value);
                  setModeSheetOpen(false);
                }}
                className="flex min-h-12 w-full items-center gap-2 rounded-lg px-3 py-3 text-left hover:bg-gray-50"
              >
                <span className="flex-1 text-sm font-medium text-gray-900">{m.label}</span>
                {searchMode === m.value && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
          </BottomSheet>
        </div>
      ) : (
      <Tabs defaultValue="pages">
        {/* Tabs left, search + filters right */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <TabsList variant="underline">
            <TabsTrigger value="pages" variant="underline">
              <BookOpen className="w-3.5 h-3.5" />
              Pages
              <Badge variant="default" size="sm" className="ml-1">{pages.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sources" variant="underline">
              <Upload className="w-3.5 h-3.5" />
              Sources
              <Badge variant="default" size="sm" className="ml-1">{sources.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Search leads the right-side cluster (app-wide pattern), filters follow */}
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <FilterSearch
              value={search}
              onChange={setSearch}
              onSubmit={submitDeepSearch}
              placeholder="Search the knowledge base..."
              className="w-full sm:w-64"
            />
            <FilterMultiSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="Category"
              options={wikiCategories.map((c) => ({ value: c, label: c }))}
            />
          </div>
        </div>

        {/* Pages tab */}
        <TabsContent value="pages">
          {pages.length === 0 ? (
            <EmptyState icon={BookOpen} title="No wiki pages" description="Ingest a source to start building your knowledge base."
              action={<Button size="sm" onClick={() => setIngestOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Ingest Source</Button>}
            />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matches" description={`No pages match "${search}".`} />
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, catPages]) => (
                <div key={category}>
                  <SectionHeader
                    title={
                      <span className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        <span className="capitalize">{category}</span>
                        <Badge variant="info" size="sm">{catPages.length}</Badge>
                      </span>
                    }
                  />
                  <MetricGrid columns={3}>
                    {catPages.map((page) => (
                      <WikiCard key={page.path} page={page} onClick={() => setSelectedPath(page.path)} />
                    ))}
                  </MetricGrid>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sources tab */}
        <TabsContent value="sources">
          {sources.length === 0 ? (
            <EmptyState icon={Upload} title="No sources ingested" description="Upload documents to build the knowledge base."
              action={<Button size="sm" onClick={() => setIngestOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Ingest Source</Button>}
            />
          ) : (
            <div className="space-y-2">
              {sources.map((s) => {
                const ext = s.name.split('.').pop()?.toUpperCase() ?? '';
                const sizeKB = Math.round(s.size / 1024);
                return (
                  <Card key={s.name} className="p-3">
                    {/* eslint-disable-next-line design-system/prefer-section-header -- card row layout */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={ext === 'PDF' ? 'error' : 'info'} size="sm" className="font-mono">{ext}</Badge>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate">{s.name}</p>
                          <p className="text-xs text-gray-400">{sizeKB} KB &middot; {new Date(s.modified).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}

      <IngestDialog open={ingestOpen} onOpenChange={setIngestOpen} />
    </div>
  );
}

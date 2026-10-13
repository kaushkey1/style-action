import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText, RefreshCw, XCircle, Search, Clock,
  CheckCircle, AlertCircle, User, GitBranch, Wand2,
  Pencil, ThumbsUp, ThumbsDown, Save, X,
} from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  DetailPanel,
  MetricGrid,
  PageHeader,
  SectionHeader,
  Spinner,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Label,
  Input,
} from '@/components/ui';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { fetchSpecs, fetchSpec, fetchSpecVersions, fetchSpecDiff, updateSpec, submitReview, specsKeys } from '../api/specsApi';
import type { Spec, SpecVersion } from '../data/specsTypes';
import { SPEC_STATUS_CONFIG, DOMAIN_CONFIG } from '../data/specsTypes';

// ─── Spec Card ──────────────────────────────────────────────────────────────

function SpecCard({
  spec,
  onClick,
}: {
  spec: Spec;
  onClick: () => void;
}): React.ReactNode {
  const statusCfg = SPEC_STATUS_CONFIG[spec.status] ?? SPEC_STATUS_CONFIG.DRAFT;
  const domainCfg = DOMAIN_CONFIG[spec.domain] ?? DOMAIN_CONFIG.default;

  return (
    <Card
      className="p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      aria-label={`View spec: ${spec.title}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400 font-mono">{spec.id}</span>
            <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
          </div>
          <h4 className="text-sm font-semibold text-gray-900">{spec.title}</h4>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-xs text-gray-400">
          <GitBranch className="w-3 h-3" />
          v{spec.current_version}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Badge variant={domainCfg?.variant ?? 'default'} size="sm">{domainCfg?.label ?? spec.domain}</Badge>
        {(spec.linked_skills ?? []).map((s) => (
          <Badge key={s} variant="default" size="sm">
            <Wand2 className="w-2.5 h-2.5 mr-0.5" />
            {s}
          </Badge>
        ))}
      </div>

      { }
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {spec.author}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(new Date(spec.updated_at))}
        </div>
      </div>
    </Card>
  );
}

// ─── Spec Detail View ───────────────────────────────────────────────────────

// ─── Review Dialog ──────────────────────────────────────────────────────────

function ReviewDialog({
  open,
  onOpenChange,
  specId,
  action,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specId: string;
  action: 'approve' | 'request_changes';
}): React.ReactNode {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const reviewMut = useMutation({
    mutationFn: () => submitReview(specId, action, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: specsKeys.detail(specId) });
      void queryClient.invalidateQueries({ queryKey: specsKeys.versions(specId) });
      onOpenChange(false);
      setNote('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              {action === 'approve' ? (
                <><ThumbsUp className="w-4 h-4 text-green-600" /> Approve Spec</>
              ) : (
                <><ThumbsDown className="w-4 h-4 text-amber-600" /> Request Changes</>
              )}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="review-note">
              {action === 'approve' ? 'Approval note (optional)' : 'What needs to change?'}
            </Label>
            <Textarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={action === 'approve' ? 'Looks good...' : 'Please update section...'}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant={action === 'approve' ? undefined : 'outline'}
            onClick={() => reviewMut.mutate()}
            disabled={reviewMut.isPending || (action === 'request_changes' && !note.trim())}
          >
            {reviewMut.isPending ? <Spinner size="sm" className="mr-1" /> : null}
            {action === 'approve' ? 'Approve' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Meta Field ──────────────────────────────────────────────────────────────

function MetaField({ label, children }: { label: string; children: React.ReactNode }): React.ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-1 flex min-w-0 items-center gap-1.5">{children}</div>
    </div>
  );
}

// ─── Version History ─────────────────────────────────────────────────────────

function ReviewStatusBadge({ version }: { version: SpecVersion }): React.ReactNode {
  if (version.review_status === 'approved') {
    return (
      <Badge variant="success" size="sm">
        <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Approved{version.reviewer ? ` by ${version.reviewer}` : ''}
      </Badge>
    );
  }
  if (version.review_status === 'pending') {
    return (
      <Badge variant="warning" size="sm">
        <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Pending Review
      </Badge>
    );
  }
  return <Badge variant="error" size="sm">Changes Requested</Badge>;
}

/** Quip-style history panel content: version timeline on top; below it, the
    selected version's delta against its predecessor — additions green,
    removals red, like a conflict-resolution view. Lives inside a DetailPanel
    slide-over so the doc stays in view while browsing versions. */
function HistoryPanel({ spec, versions }: { spec: Spec; versions: SpecVersion[] }): React.ReactNode {
  const [selected, setSelected] = useState<number>(versions[0]?.version ?? spec.current_version);
  const selectedVersion = versions.find((v) => v.version === selected);
  const prevVersion = selected - 1;

  const { data: diff, isLoading: diffLoading, error: diffError } = useQuery({
    queryKey: specsKeys.diff(spec.id, prevVersion, selected),
    queryFn: () => fetchSpecDiff(spec.id, prevVersion, selected),
    enabled: selected > 1,
  });

  const hasChanges = (diff?.added.length ?? 0) + (diff?.removed.length ?? 0) > 0;

  if (versions.length === 0) {
    return <p className="text-sm text-gray-500">No version history.</p>;
  }

  return (
    <div>
      {/* Version timeline — full-bleed rows inside the panel's p-4 */}
      <div className="-mx-4 -mt-4 border-b border-gray-100 pb-1">
        {versions.map((v) => {
          const isSelected = v.version === selected;
          const isCurrent = v.version === spec.current_version;
          return (
            <button
              key={v.version}
              type="button"
              onClick={() => setSelected(v.version)}
              aria-current={isSelected ? 'true' : undefined}
              className={cn(
                'flex min-h-12 w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors',
                'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-inset focus-kb:ring-primary',
                isSelected ? 'bg-primary-50' : 'hover:bg-gray-50',
              )}
            >
              <span className={cn('flex items-center gap-2 text-sm font-medium', isSelected ? 'text-primary' : 'text-gray-900')}>
                v{v.version}
                {isCurrent && <Badge variant="info" size="sm">Current</Badge>}
              </span>
              <span className="line-clamp-1 text-xs text-gray-500">{v.summary}</span>
              <span className="text-xs text-gray-400">{v.author} &middot; {formatDate(v.created_at)}</span>
            </button>
          );
        })}
      </div>

      {/* Delta of the selected version vs its predecessor */}
      <div className="pt-3">
        {selectedVersion && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {selected > 1 ? `v${selected} vs v${prevVersion}` : `v${selected}`}
            </span>
            <ReviewStatusBadge version={selectedVersion} />
          </div>
        )}

        {selected <= 1 ? (
          <p className="text-sm text-gray-500">Initial version — no earlier version to compare.</p>
        ) : diffError ? (
          <p className="text-sm text-error">Couldn&apos;t load changes for this version.</p>
        ) : diffLoading ? (
          <div className="animate-pulse space-y-2" aria-label="Loading changes">
            <div className="h-5 w-3/4 rounded bg-gray-100" />
            <div className="h-5 w-2/3 rounded bg-gray-100" />
            <div className="h-5 w-4/5 rounded bg-gray-100" />
          </div>
        ) : hasChanges ? (
          <div
            className="overflow-hidden rounded-lg border border-gray-200 font-mono text-xs"
            aria-label={`Changes in version ${selected}`}
          >
            {diff?.removed.map((line, i) => (
              <div key={`removed-${i}`} className="flex bg-red-50">
                <span className="w-6 shrink-0 select-none border-r border-red-100 text-center leading-6 text-red-400" aria-hidden>
                  −
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap px-2 leading-6 text-red-700">{line}</span>
              </div>
            ))}
            {diff?.added.map((line, i) => (
              <div key={`added-${i}`} className="flex bg-green-50">
                <span className="w-6 shrink-0 select-none border-r border-green-100 text-center leading-6 text-green-500" aria-hidden>
                  +
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap px-2 leading-6 text-green-800">{line}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recorded changes between v{prevVersion} and v{selected}.</p>
        )}
      </div>
    </div>
  );
}

// ─── Spec Detail View ───────────────────────────────────────────────────────

function SpecDetailView({
  specId,
  onBack,
}: {
  specId: string;
  onBack: () => void;
}): React.ReactNode {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'request_changes' | null>(null);

  const { data: spec, isLoading, error: specError, refetch: refetchSpec } = useQuery({
    queryKey: specsKeys.detail(specId),
    queryFn: () => fetchSpec(specId),
  });

  const { data: versions, error: versionsError } = useQuery({
    queryKey: specsKeys.versions(specId),
    queryFn: () => fetchSpecVersions(specId),
  });

  const saveMut = useMutation({
    mutationFn: () => updateSpec(specId, editContent, editSummary),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: specsKeys.detail(specId) });
      void queryClient.invalidateQueries({ queryKey: specsKeys.versions(specId) });
      setIsEditing(false);
      setEditSummary('');
    },
  });

  const handleStartEditing = (): void => {
    if (spec) {
      setEditContent(spec.content);
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>;
  }

  if (specError) {
    return (
      <EmptyState
        icon={XCircle}
        title="Failed to load spec"
        description="Could not connect to the specs backend."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBack}>Back to specs</Button>
            <Button variant="outline" size="sm" onClick={() => void refetchSpec()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          </div>
        }
      />
    );
  }

  if (!spec) {
    return (
      <EmptyState
        icon={FileText}
        title="Spec not found"
        description="This spec does not exist on the backend."
        action={<Button variant="outline" size="sm" onClick={onBack}>Back to specs</Button>}
      />
    );
  }

  const statusCfg = SPEC_STATUS_CONFIG[spec.status] ?? SPEC_STATUS_CONFIG.DRAFT;
  const domainCfg = DOMAIN_CONFIG[spec.domain] ?? DOMAIN_CONFIG.default;
  const sections = spec.sections ?? [];
  const reviewers = spec.reviewers ?? [];
  const linkedSkills = spec.linked_skills ?? [];
  const benchmarks = spec.benchmarks ?? {};
  const isUnderReview = spec.status === 'UNDER_REVIEW';

  return (
    /* History opens as a right sidebar OVERLAY: fixed to the viewport edge
       below the top bar, floating above the content — the page does not
       reflow. NOTE: animate-fadeInUp lives on the content column, NOT this
       root — its (identity) transform would turn the sidebar's
       position:fixed into absolute. On mobile it overlays with a backdrop. */
    <div>
    <div className="animate-fadeInUp min-w-0 space-y-4">
      {/* Title bar — back + spec title + status/version inline, CTAs right.
          All CTAs normalized to 36px (h-9) to match the detail-page pattern. */}
      <PageHeader
        onBack={onBack}
        title={spec.title}
        badges={
          <>
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            <Badge variant="default">
              <GitBranch className="w-3 h-3 mr-0.5" /> v{spec.current_version}
            </Badge>
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setShowHistory(!showHistory)}
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              {showHistory ? 'Hide History' : 'History'}
            </Button>
            {!isEditing && (
              <Button variant="outline" size="sm" className="h-9" onClick={handleStartEditing}>
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            )}
            {isUnderReview && !isEditing && (
              <>
                <Button
                  size="sm"
                  onClick={() => setReviewAction('approve')}
                  className="h-9 bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-amber-600 border-amber-200"
                  onClick={() => setReviewAction('request_changes')}
                >
                  <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Changes
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Meta — one structured definition grid on top, before the spec content */}
      <Card className="p-4">
        <MetricGrid columns={4}>
          <MetaField label="Domain">
            <Badge variant={domainCfg?.variant ?? 'default'} size="sm">{domainCfg?.label ?? spec.domain}</Badge>
          </MetaField>
          <MetaField label="Spec ID">
            <span className="truncate font-mono text-sm text-gray-700">{spec.id}</span>
          </MetaField>
          <MetaField label="Author">
            <span className="truncate text-sm text-gray-700">{spec.author}</span>
          </MetaField>
          <MetaField label="Reviewers">
            <span className="truncate text-sm text-gray-700">{reviewers.length > 0 ? reviewers.join(', ') : '—'}</span>
          </MetaField>
        </MetricGrid>

        {(linkedSkills.length > 0 || Object.keys(benchmarks).length > 0) && (
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            {linkedSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">Skills</span>
                {linkedSkills.map((s) => (
                  <button key={s} onClick={() => navigate(`/knowledge-base/skills?q=${s}`)}>
                    <Badge variant="primary" size="sm" className="cursor-pointer hover:opacity-80">
                      <Wand2 className="w-2.5 h-2.5 mr-0.5" /> {s}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
            {Object.keys(benchmarks).length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">Benchmarks</span>
                {Object.entries(benchmarks).map(([key, val]) => (
                  <div key={key} className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs">
                    <span className="text-gray-500">{key}:</span>{' '}
                    <span className="font-medium text-gray-900">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>


      {/* Spec Content — Edit or View mode */}
      <Card className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            <SectionHeader
              title={
                <span className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary" /> Editing Spec
                </span>
              }
              actions={
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveMut.mutate()}
                    disabled={!editContent.trim() || !editSummary.trim() || saveMut.isPending}
                  >
                    {saveMut.isPending ? <Spinner size="sm" className="mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Save
                  </Button>
                </div>
              }
            />
            <div>
              <Label htmlFor="edit-summary">Change Summary</Label>
              <Input
                id="edit-summary"
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder="Brief description of changes..."
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Editor */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Markdown</p>
                {/* eslint-disable-next-line no-restricted-syntax -- editor textarea needs monospace styling */}
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 font-mono placeholder-gray-500 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary transition min-h-[400px] resize-y"
                  aria-label="Spec content editor"
                />
              </div>
              {/* Preview */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Preview</p>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 min-h-[400px] prose prose-sm max-w-none text-gray-700 overflow-auto">
                  <Markdown remarkPlugins={[remarkGfm]}>{editContent}</Markdown>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            {/* Sections sidebar */}
            {sections.length > 0 && (
              <nav className="hidden lg:block w-48 shrink-0 sticky top-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Sections</p>
                <div className="space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={cn(
                        'block text-xs text-gray-600 hover:text-primary transition-colors py-1',
                        s.level === 1 ? 'font-medium' : 'pl-3',
                      )}
                    >
                      {s.title}
                    </a>
                  ))}
                </div>
              </nav>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 prose prose-sm max-w-none text-gray-700 overflow-x-auto">
              <Markdown remarkPlugins={[remarkGfm]}>{spec.content}</Markdown>
            </div>
          </div>
        )}
      </Card>

      {/* Review Dialog */}
      {reviewAction && (
        <ReviewDialog
          open={reviewAction !== null}
          onOpenChange={(open) => { if (!open) setReviewAction(null); }}
          specId={specId}
          action={reviewAction}
        />
      )}
    </div>

    {/* Version history — fixed right sidebar below the top bar (h-14) */}
    <DetailPanel
      isOpen={showHistory}
      onClose={() => setShowHistory(false)}
      title="Version history"
      width="lg"
      className="lg:fixed lg:top-14 lg:bottom-0 lg:z-30 lg:h-auto lg:shadow-lg"
    >
      {versionsError ? (
        <p className="text-sm text-error">Couldn&apos;t load version history.</p>
      ) : (
        <HistoryPanel spec={spec} versions={versions ?? []} />
      )}
    </DetailPanel>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '__all__', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'DRAFT', label: 'Draft' },
];

export function SpecsListPage(): React.ReactNode {
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [search, setSearch] = useState('');
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: specsKeys.list(statusFilter !== '__all__' ? { status: statusFilter } : undefined),
    queryFn: () => fetchSpecs(statusFilter !== '__all__' ? { status: statusFilter } : undefined),
  });

  const specs = data?.specs ?? [];

  const filtered = specs.filter((s) => {
    if (!search) return true;
    return (
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.domain.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Detail view
  if (selectedSpecId) {
    return <SpecDetailView specId={selectedSpecId} onBack={() => setSelectedSpecId(null)} />;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>;
  }

  if (error) {
    return (
      <EmptyState icon={XCircle} title="Failed to load specs" description="Could not connect to the specs backend."
        action={<Button variant="outline" size="sm" onClick={() => void refetch()}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry</Button>}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Title bar — menu name; tabs + search on the row below */}
      <PageHeader title="Specs" />

      {/* Status tabs left, search right */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <TabsList variant="underline">
            {STATUS_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value} variant="underline">
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="relative sm:ml-auto sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {/* eslint-disable-next-line no-restricted-syntax -- search input with icon */}
            <input
              className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:border-primary transition min-h-[44px]"
              placeholder="Search specs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search specs"
            />
          </div>
        </div>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No specs found" description={search ? `No specs match "${search}".` : 'No specs available.'} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((spec) => (
            <SpecCard key={spec.id} spec={spec} onClick={() => setSelectedSpecId(spec.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

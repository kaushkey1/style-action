import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { History, RefreshCw, XCircle, ChevronDown, ChevronRight, User, Bot, Wrench } from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  SectionHeader,
  Spinner,
  EmptyState,
} from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';
import {
  fetchHermesSessions,
  fetchSessionMessages,
  fetchHermesStatus,
  gbrainKeys,
} from '../api/agenticBrainApi';
import { SessionDownloadMenu } from '../components/SessionDownloadMenu';
import type { HermesSession } from '../data/agenticBrainTypes';

/** Session timestamps are unix seconds — convert and render in the app-standard format. */
function formatTimestamp(ts?: number): string {
  if (!ts) return '-';
  return formatDateTime(new Date(ts * 1000));
}

function SessionRow({ session }: { session: HermesSession }): React.ReactNode {
  const [expanded, setExpanded] = useState(false);

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: gbrainKeys.sessionMessages(session.id),
    queryFn: () => fetchSessionMessages(session.id),
    enabled: expanded,
  });

  const messages = messagesData?.messages ?? [];
  const exportMeta = {
    title: `Session ${session.id}`,
    fileId: session.id,
    model: session.model,
    source: session.source,
    startedAt: session.started_at,
    endedAt: session.ended_at,
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center transition-colors hover:bg-gray-50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 min-w-0 flex items-center gap-3 p-4 text-left min-h-[44px]"
          aria-expanded={expanded}
          aria-label={`Session ${session.id}`}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {session.id.slice(0, 12)}...
              </span>
              {session.source && (
                <Badge variant="default" size="sm">
                  {session.source}
                </Badge>
              )}
              {session.model && (
                <Badge variant="primary" size="sm">
                  {session.model}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Started: {formatTimestamp(session.started_at)}
              {session.ended_at && ` | Ended: ${formatTimestamp(session.ended_at)}`}
            </p>
          </div>
        </button>
        {expanded && messages.length > 0 && (
          <SessionDownloadMenu
            meta={exportMeta}
            messages={messages}
            ariaLabel="Download session"
            className="mr-2 shrink-0"
          />
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              No messages in this session
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, i) => {
                const RoleIcon = msg.role === 'user' ? User : msg.role === 'tool' ? Wrench : Bot;
                const roleColor = msg.role === 'user' ? 'text-primary' : msg.role === 'tool' ? 'text-amber-500' : 'text-green-600';
                const roleLabel = msg.role === 'user' ? 'You' : msg.role === 'tool' ? 'Tool' : 'Agent';
                return (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary/5 border border-primary/10'
                      : msg.role === 'tool'
                        ? 'bg-amber-50 border border-amber-100'
                        : 'bg-white border border-gray-200',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <RoleIcon className={cn('w-3.5 h-3.5', roleColor)} />
                    <span className={cn('text-xs font-medium', roleColor)}>
                      {roleLabel}
                    </span>
                    {msg.timestamp && (
                      <span className="text-xs text-gray-400">
                        {new Date(msg.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pl-5">
                    {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function SessionsPage(): React.ReactNode {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: gbrainKeys.sessions(),
    queryFn: () => fetchHermesSessions(),
    refetchInterval: 15_000,
  });

  const { data: hermesStatus } = useQuery({
    queryKey: gbrainKeys.hermes(),
    queryFn: fetchHermesStatus,
    refetchInterval: 15_000,
  });

  const sessions = data?.sessions ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={XCircle}
        title="Failed to load sessions"
        description="Could not connect to the Agentic Brain backend."
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Agent status bar */}
      {hermesStatus && (
        <Card className="p-3">
          <div className="flex items-center gap-4 text-sm">
            <Badge
              variant={(hermesStatus.gateway_running || sessions.length > 0) ? 'success' : 'default'}
              dot
              size="sm"
            >
              {hermesStatus.gateway_running ? 'Agent Active' : sessions.length > 0 ? 'Sessions Available' : 'Agent Idle'}
            </Badge>
            {/* Model info hidden — internal detail */}
            <span className="text-gray-500">
              {hermesStatus.active_sessions} active session
              {hermesStatus.active_sessions !== 1 ? 's' : ''}
            </span>
          </div>
        </Card>
      )}

      <SectionHeader
        title={`Activity Log (${sessions.length})`}
        subtitle="Recent activity"
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Start a conversation or run a task to see activity here."
        />
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

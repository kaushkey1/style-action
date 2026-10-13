import { useState, useMemo } from 'react';
import {
  Building2,
  Store,
  MapPin,
  ChevronRight,
  ChevronDown,
  Layers,
  Network,
  Clock,
  Calendar,
  Ruler,
} from 'lucide-react';
import { Badge, MetricGrid, PageHeader, SectionHeader } from '@/components/ui';
import { orgNodes, orgSummary, type OrgNode } from '../data/mockAdminData';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  OrgNode['status'],
  { label: string; dotColor: string; variant: 'success' | 'warning' | 'default' | 'error' }
> = {
  active: { label: 'Active', dotColor: 'bg-green-500', variant: 'success' },
  ramping_up: { label: 'Ramping Up', dotColor: 'bg-amber-500', variant: 'warning' },
  temporarily_closed: { label: 'Temp. Closed', dotColor: 'bg-gray-400', variant: 'default' },
  decommissioned: { label: 'Decommissioned', dotColor: 'bg-red-500', variant: 'error' },
};

const typeLabels: Record<OrgNode['type'], string> = {
  company: 'Company',
  business_unit: 'Business Unit',
  region: 'Region',
  channel: 'Channel',
  function: 'Function',
  product_pod: 'Product Pod',
  operations_pod: 'Ops Pod',
  store: 'Store',
};

function StatusDot({ status }: { status: OrgNode['status'] }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full', config.dotColor)}
      title={config.label}
    />
  );
}

function TreeNode({
  node,
  childrenMap,
  expandedNodes,
  selectedNodeId,
  onToggle,
  onSelect,
  depth = 0,
}: {
  node: OrgNode;
  childrenMap: Map<string | null, OrgNode[]>;
  expandedNodes: Set<string>;
  selectedNodeId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: OrgNode) => void;
  depth?: number;
}) {
  const children = childrenMap.get(node.id) || [];
  const hasChildren = children.length > 0 || (node.childCount && node.childCount > 0);
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodeId === node.id;

  return (
    <div>
      { }
      <button
        onClick={() => onSelect(node)}
        className={cn(
          'w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-left transition-all duration-200 hover:bg-gray-50',
          isSelected && 'bg-primary/5 border border-primary/20'
        )}
        // eslint-disable-next-line no-restricted-syntax -- dynamic value
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 rounded hover:bg-gray-200 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <StatusDot status={node.status} />

        <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>

        <span className="text-xs text-gray-500 shrink-0">{node.code}</span>

        <Badge variant="outline" size="sm" className="ml-auto shrink-0">
          {typeLabels[node.type]}
        </Badge>
      </button>

      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              childrenMap={childrenMap}
              expandedNodes={expandedNodes}
              selectedNodeId={selectedNodeId}
              onToggle={onToggle}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NodeDetailPanel({ node }: { node: OrgNode }) {
  const config = statusConfig[node.status];
  const parentNode = orgNodes.find((n) => n.id === node.parentId);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{node.name}</h3>
        <p className="text-xs text-gray-500">{node.code}</p>
      </div>

      <div className="space-y-3">
        <DetailRow icon={Layers} label="Type" value={typeLabels[node.type]} />
        <DetailRow
          icon={Network}
          label="Parent"
          value={parentNode ? parentNode.name : 'None (Root)'}
        />
        <DetailRow icon={Layers} label="Level" value={String(node.level)} />
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 flex items-center justify-center mt-0.5">
            <StatusDot status={node.status} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <Badge variant={config.variant} size="sm" dot dotColor={config.dotColor}>
              {config.label}
            </Badge>
          </div>
        </div>
        {node.childCount !== undefined && (
          <DetailRow icon={Building2} label="Direct Children" value={String(node.childCount)} />
        )}
      </div>

      {node.type === 'store' && node.metadata && (
        <div className="border-t border-gray-200 pt-3 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Store Details</p>
          {node.metadata.city && node.metadata.state && (
            <DetailRow
              icon={MapPin}
              label="Location"
              value={`${node.metadata.city}, ${node.metadata.state}`}
            />
          )}
          {node.metadata.sqFt && (
            <DetailRow
              icon={Ruler}
              label="Area"
              value={`${node.metadata.sqFt.toLocaleString()} sq ft`}
            />
          )}
          {node.metadata.format && (
            <DetailRow icon={Store} label="Format" value={node.metadata.format} />
          )}
          {node.metadata.openingDate && (
            <DetailRow icon={Calendar} label="Opening Date" value={node.metadata.openingDate} />
          )}
          {node.metadata.closureReason && (
            <DetailRow
              icon={Clock}
              label="Closure Reason"
              value={node.metadata.closureReason}
            />
          )}
          {node.metadata.expectedReopenDate && (
            <DetailRow
              icon={Calendar}
              label="Expected Reopen"
              value={node.metadata.expectedReopenDate}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function AdminOrganizationPage() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['org-root']));
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  const childrenMap = useMemo(() => {
    const map = new Map<string | null, OrgNode[]>();
    for (const node of orgNodes) {
      const parentId = node.parentId;
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId)!.push(node);
    }
    return map;
  }, []);

  const rootNodes = useMemo(() => childrenMap.get(null) || [], [childrenMap]);

  const handleToggle = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (node: OrgNode) => {
    setSelectedNode(node);
  };

  const summaryCards = [
    {
      label: 'Total Stores',
      value: orgSummary.totalStores.toLocaleString(),
      dotColor: 'bg-primary',
      icon: Store,
    },
    {
      label: 'Active',
      value: orgSummary.activeStores.toLocaleString(),
      dotColor: 'bg-green-500',
      icon: Building2,
    },
    {
      label: 'Ramping Up',
      value: String(orgSummary.rampingUp),
      dotColor: 'bg-amber-500',
      icon: Clock,
    },
    {
      label: 'Temp. Closed',
      value: String(orgSummary.temporarilyClosed),
      dotColor: 'bg-gray-400',
      icon: MapPin,
    },
  ];

  return (
    <div className="relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">User Management is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <PageHeader title="Organization" />

      {/* Summary Cards */}
      <MetricGrid columns={4}>
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-lg border border-gray-200 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{card.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', card.dotColor)} />
                <span className="text-xl font-bold text-gray-900">{card.value}</span>
              </div>
            </div>
          );
        })}
      </MetricGrid>

      {/* Two-column layout: Tree + Detail */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- page layout, not metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Org Tree */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader
            title="Org Hierarchy"
            actions={
              <div className="flex items-center gap-2">
                <Badge variant="default" size="sm">
                  {orgSummary.totalNodes} nodes
                </Badge>
                <Badge variant="default" size="sm">
                  {orgSummary.levels} levels
                </Badge>
              </div>
            }
          />

          <div className="space-y-0.5 max-h-[600px] overflow-y-auto">
            {rootNodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                childrenMap={childrenMap}
                expandedNodes={expandedNodes}
                selectedNodeId={selectedNode?.id ?? null}
                onToggle={handleToggle}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {rootNodes.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              No organization nodes configured.
            </p>
          )}
        </div>

        {/* Detail Panel */}
        <div className="col-span-1 bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Node Details</h2>

          {selectedNode ? (
            <NodeDetailPanel node={selectedNode} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Network className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                Select a node from the tree to view its details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

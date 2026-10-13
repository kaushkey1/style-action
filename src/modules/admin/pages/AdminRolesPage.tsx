import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge, Button, PageHeader, EmptyState } from '@/components/ui';
import { roles } from '../data/mockAdminData';
import {
  Plus,
  Shield,
  Users,
  CheckSquare,
  Square,
  ArrowUpRight,
  X,
} from 'lucide-react';

function getLevelBadgeVariant(level: number): 'error' | 'primary' | 'default' | 'outline' {
  if (level === 0) return 'error';
  if (level === 1) return 'primary';
  if (level === 2) return 'default';
  return 'outline';
}

function getPlatformBadgeVariant(platform: string): 'primary' | 'outline' {
  return platform === 'web' ? 'primary' : 'outline';
}

function getEscalationTargetName(escalationTarget: string | null): string {
  if (!escalationTarget) return 'None';
  const target = roles.find((r) => r.id === escalationTarget);
  return target ? target.name : 'Unknown';
}

const actionLabels: Record<string, string> = {
  view: 'View',
  approve: 'Approve',
  configure: 'Configure',
  admin: 'Admin',
};

const allActions = ['view', 'approve', 'configure', 'admin'] as const;

export function AdminRolesPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const selectedRole = selectedRoleId
    ? roles.find((r) => r.id === selectedRoleId) ?? null
    : null;

  return (
    <div className="relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">User Management is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <PageHeader
        title="Role Configuration"
        actions={
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Role
          </Button>
        }
      />

      <div className="flex gap-4">
        {/* Role Table */}
        <div
          className={cn(
            'bg-white rounded-lg border border-gray-200 p-3 overflow-hidden',
            selectedRole ? 'flex-1' : 'w-full'
          )}
        >
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role Name
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Scope
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Users
                </th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr><td colSpan={5}><EmptyState description="No roles configured" /></td></tr>
              ) : roles.map((role) => (
                <tr
                  key={role.id}
                  onClick={() =>
                    setSelectedRoleId(
                      selectedRoleId === role.id ? null : role.id
                    )
                  }
                  className={cn(
                    'border-b border-gray-50 cursor-pointer transition-colors duration-150',
                    selectedRoleId === role.id
                      ? 'bg-primary/5'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {role.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant={getLevelBadgeVariant(role.level)}
                      size="sm"
                    >
                      L{role.level}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-gray-700 capitalize">
                    {role.scopeType.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1.5">
                      {role.platforms.map((platform) => (
                        <Badge
                          key={platform}
                          variant={getPlatformBadgeVariant(platform)}
                          size="sm"
                        >
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-gray-700">
                      <Users className="w-3 h-3 text-gray-400" />
                      {role.userCount.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedRole && (
          <div className="w-[380px] shrink-0 bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {selectedRole.name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Level {selectedRole.level} &middot;{' '}
                  <span className="capitalize">
                    {selectedRole.scopeType.replace('_', ' ')}
                  </span>{' '}
                  scope
                </p>
              </div>
              <button
                onClick={() => setSelectedRoleId(null)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                aria-label="Close detail panel"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Platforms
              </h3>
              <div className="space-y-1.5">
                {(['web', 'mobile'] as const).map((platform) => {
                  const enabled = selectedRole.platforms.includes(platform);
                  return (
                    <label
                      key={platform}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-default"
                    >
                      {enabled ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="capitalize">{platform}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Actions
              </h3>
              <div className="space-y-1.5">
                {allActions.map((action) => {
                  const enabled =
                    selectedRole.permissions.actions.includes(action);
                  return (
                    <label
                      key={action}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-default"
                    >
                      {enabled ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                      {actionLabels[action]}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Agent & Guardrail Overrides
              </h3>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-700">Override Agents</span>
                <Badge
                  variant={
                    selectedRole.permissions.canOverrideAgents
                      ? 'success'
                      : 'default'
                  }
                  size="sm"
                >
                  {selectedRole.permissions.canOverrideAgents ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-700">Manage Guardrails</span>
                <Badge
                  variant={
                    selectedRole.permissions.canManageGuardrails
                      ? 'success'
                      : 'default'
                  }
                  size="sm"
                >
                  {selectedRole.permissions.canManageGuardrails ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Escalation Target
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                {selectedRole.escalationTarget ? (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-gray-400" />
                    {getEscalationTargetName(selectedRole.escalationTarget)}
                  </>
                ) : (
                  <span className="text-gray-500">None</span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-500">Assigned Users</span>
                <span className="font-medium text-gray-900">
                  {selectedRole.userCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { cn } from '@/lib/utils';

const ROLES = [
  { slug: 'buyer', label: 'Buyer / Planner' },
  { slug: 'pm', label: 'Product Manager' },
  { slug: 'format-head', label: 'Category Head' },
  { slug: 'financial-commercial-admin', label: 'Commercial' },
  { slug: 'ceo', label: 'CFO / CEO' },
  { slug: 'super-admin', label: 'Super Admin' },
]

export function DevRoleSwitcher() {
  const { activeRoleSlug, switchRole } = useAuthStore()
  const [open, setOpen] = useState(false)

  if (!import.meta.env.DEV) return null

  const activeLabel = ROLES.find(r => r.slug === activeRoleSlug)?.label ?? activeRoleSlug ?? 'No role'

  return (
    <div className="fixed bottom-4 right-4 z-50 text-xs">
      {open && (
        <div className="mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[160px]">
          <div className="text-gray-400 mb-2 font-medium uppercase tracking-wider text-[10px]">Switch Role</div>
          <div className="flex flex-col gap-0.5">
            {ROLES.map((r) => (
              <button
                key={r.slug}
                onClick={() => { void switchRole(r.slug); setOpen(false) }}
                className={cn(
                  'text-left px-2 py-1.5 rounded transition-colors text-xs w-full',
                  activeRoleSlug === r.slug
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {activeRoleSlug === r.slug && <span className="mr-1">›</span>}
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full shadow px-3 py-1.5 hover:bg-gray-50 transition-colors"
        title="Switch dev role"
      >
        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
        <span className="text-gray-600 font-medium">{activeLabel}</span>
      </button>
    </div>
  )
}

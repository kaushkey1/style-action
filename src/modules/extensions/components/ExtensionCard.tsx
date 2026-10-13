import { Puzzle } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ExtensionStatusBadge } from './ExtensionStatusBadge';

import type { CatalogExtension, InstalledExtension } from '../data/extensionTypes';

interface CatalogCardProps {
  extension: CatalogExtension;
  isInstalled: boolean;
  onInstall: (slug: string) => void;
}

interface InstalledCardProps {
  extension: InstalledExtension;
  onClick: (slug: string) => void;
}

export function CatalogCard({ extension, isInstalled, onInstall }: CatalogCardProps): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          {extension.icon_url ? (
            <img
              src={extension.icon_url}
              alt={`${extension.name} icon`}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <Puzzle className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{extension.name}</h3>
            <ExtensionStatusBadge status={extension.status} variant="catalog" />
          </div>
          {extension.provider && (
            <p className="text-xs text-gray-500 mt-0.5">by {extension.provider}</p>
          )}
        </div>
      </div>
      {extension.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{extension.description}</p>
      )}
      {/* eslint-disable-next-line design-system/prefer-section-header -- card footer with version + action, not a section header */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs text-gray-400">v{extension.version}</span>
        {isInstalled ? (
          <span className="text-xs text-gray-500 font-medium">Installed</span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInstall(extension.slug)}
          >
            Install
          </Button>
        )}
      </div>
    </div>
  );
}

export function InstalledCard({ extension, onClick }: InstalledCardProps): React.ReactNode {
  return (
    <button
      onClick={() => onClick(extension.slug)}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 text-left w-full',
        'hover:border-indigo-200 hover:shadow-sm transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
      )}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          {extension.icon_url ? (
            <img
              src={extension.icon_url}
              alt={`${extension.name} icon`}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <Puzzle className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{extension.name}</h3>
            <ExtensionStatusBadge status={extension.status} />
          </div>
          {extension.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{extension.description}</p>
          )}
        </div>
      </div>
    </button>
  );
}

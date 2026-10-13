import { ChevronRight } from 'lucide-react';
import type { Collection } from '../types/types';
import type { CollectionProgress } from '../types/showroom-types';
import { cn, formatDate } from '@/lib/utils';

interface CollectionGridProps {
  collections: Collection[];
  onCollectionClick: (collection: Collection) => void;
  collectionProgress?: CollectionProgress[];
}

export function CollectionGrid({ collections, onCollectionClick, collectionProgress }: CollectionGridProps) {
  return (
    // eslint-disable-next-line design-system/prefer-metric-grid -- collection card grid, not metric cards
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onClick={() => onCollectionClick(collection)}
          progress={collectionProgress?.[0]}
        />
      ))}
    </div>
  );
}

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
  progress?: CollectionProgress;
}

function CollectionCard({ collection, onClick, progress }: CollectionCardProps) {
  return (
    <div
      className="group cursor-pointer bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={collection.heroImage}
          alt={collection.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white text-lg font-bold">{collection.name}</h3>
          <p className="text-white/80 text-sm">{collection.theme}</p>
        </div>
      </div>

      <div className="p-4">
        {/* POD assignment */}
        {progress && (
          // eslint-disable-next-line design-system/prefer-section-header -- collection card POD assignment row
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
              POD: {progress.podId}
            </span>
            {/* Team initials */}
            <div className="flex -space-x-1">
              {[progress.designer, progress.buyer, progress.categoryHead].map((name, idx) => {
                const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2);
                const colors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700'];
                return (
                  <div
                    key={idx}
                    className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border border-white', colors[idx])}
                    title={name}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* eslint-disable-next-line design-system/prefer-section-header -- collection card metadata row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">{collection.season}</span>
          <span className="text-xs text-gray-500">{collection.productCount} products</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {collection.categories.map((category, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">Color Story:</span>
          <div className="flex gap-1">
            {collection.colorStory.slice(0, 6).map((color, idx) => (
               
              <div
                key={idx}
                className="w-4 h-4 rounded-full border border-gray-200"
                // eslint-disable-next-line no-restricted-syntax -- dynamic color
                style={{ backgroundColor: color }}
              />
            ))}
            {collection.colorStory.length > 6 && (
              <span className="text-xs text-gray-500">+{collection.colorStory.length - 6}</span>
            )}
          </div>
        </div>

        {/* eslint-disable-next-line design-system/prefer-section-header -- collection card footer with launch date */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Launch: {formatDate(collection.launchDate)}
          </span>
          <div className="flex items-center gap-1 text-primary text-sm font-medium">
            View Collection
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

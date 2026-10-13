import { useCallback } from 'react';
import { Checkbox, SectionHeader, Spinner } from '@/components/ui';
import { useExtensionStore } from '../stores/useExtensionStore';

import type { EventType, Subscription } from '../data/extensionTypes';

interface SubscriptionManagerProps {
  slug: string;
}

function groupByCategory(eventTypes: EventType[]): Record<string, EventType[]> {
  const groups: Record<string, EventType[]> = {};
  for (const et of eventTypes) {
    const category = et.category || 'other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(et);
  }
  return groups;
}

function isSubscribed(eventTypeId: string, subscriptions: Subscription[]): boolean {
  return subscriptions.some((s) => s.event_type_id === eventTypeId);
}

export function SubscriptionManager({ slug }: SubscriptionManagerProps): React.ReactNode {
  const eventTypes = useExtensionStore((s) => s.eventTypes);
  const subscriptions = useExtensionStore((s) => s.subscriptions);
  const saving = useExtensionStore((s) => s.saving);
  const subscribe = useExtensionStore((s) => s.subscribe);
  const unsubscribe = useExtensionStore((s) => s.unsubscribe);

  const handleToggle = useCallback(
    async (eventTypeId: string, checked: boolean) => {
      try {
        if (checked) {
          await subscribe(slug, [eventTypeId]);
        } else {
          await unsubscribe(slug, eventTypeId);
        }
      } catch {
        // error is already in store
      }
    },
    [slug, subscribe, unsubscribe],
  );

  if (eventTypes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-5 h-5" />
      </div>
    );
  }

  const grouped = groupByCategory(eventTypes);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, types]) => (
        <div key={category}>
          <SectionHeader title={category.charAt(0).toUpperCase() + category.slice(1)} />
          <div className="space-y-2">
            {types.map((et) => {
              const subscribed = isSubscribed(et.id, subscriptions);
              return (
                <div
                  key={et.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={subscribed}
                    onChange={(e) => void handleToggle(et.id, e.target.checked)}
                    disabled={saving}
                    aria-label={`Subscribe to ${et.name}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{et.name}</p>
                    <p className="text-xs text-gray-500">{et.description}</p>
                    <code className="text-xs text-gray-400 font-mono">{et.id}</code>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

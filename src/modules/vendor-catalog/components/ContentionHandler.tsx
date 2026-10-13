import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Badge,
  Card,
  Label,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui';
import { AlertTriangle, Users, Clock, Lock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentionItem } from '../hooks/useContentionDetection';

interface ContentionHandlerProps {
  contentions: ContentionItem[];
  onResolve: (styleId: string, action: 'wait' | 'override' | 'cancel') => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ContentionHandler({
  contentions,
  onResolve,
  isOpen,
  onClose,
}: ContentionHandlerProps) {
  const [selectedAction, setSelectedAction] = useState<'wait' | 'override' | 'cancel'>('wait');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  useEffect(() => {
    if (!isOpen || !autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          // Refresh contentions
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, autoRefreshEnabled]);

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!contentions.length) return null;

  const activeContention = contentions[0];
  if (!activeContention) return null; // Guard against undefined

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <DialogTitle>Style Allocation Conflict</DialogTitle>
          </div>
          <DialogDescription>
            Another curator is working with this style. Choose how to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conflict Details */}
          <Card className="p-3 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {activeContention.styleName}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">
                      Locked by <strong>{activeContention.lockedBy}</strong>
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {formatTimeSince(activeContention.lockedAt)}
                    </Badge>
                  </div>
                  <div className="text-gray-600">
                    Allocating to: <strong>{activeContention.conflictingSlot}</strong>
                  </div>
                  <div className="text-gray-600">
                    You requested: <strong>{activeContention.requestedSlot}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Resolution Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Resolution Options</h3>

            <RadioGroup value={selectedAction} onValueChange={(val) => setSelectedAction(val as 'wait' | 'override' | 'cancel')} className="space-y-2">
            <Card
              className={cn(
                "p-3 cursor-pointer transition-all",
                selectedAction === 'wait' && "border-indigo-600 bg-indigo-50"
              )}
              onClick={() => setSelectedAction('wait')}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="wait" id="wait" className="mt-1" />
                <Label htmlFor="wait" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-sm text-gray-900">Wait for Release</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Wait for the other curator to complete their allocation. The style will become available once they're done.
                  </div>
                  {selectedAction === 'wait' && (
                    <div className="mt-2 flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Auto-refresh in {refreshCountdown}s
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                      >
                        {autoRefreshEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  )}
                </Label>
              </div>
            </Card>

            <Card
              className={cn(
                "p-3 cursor-pointer transition-all",
                selectedAction === 'override' && "border-indigo-600 bg-indigo-50"
              )}
              onClick={() => setSelectedAction('override')}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="override" id="override" className="mt-1" />
                <Label htmlFor="override" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-sm text-gray-900">Request Override</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Send a notification to {activeContention.lockedBy} requesting priority access. Requires their approval or timeout after 5 minutes.
                  </div>
                  <Badge variant="warning" className="text-xs mt-2">
                    Requires approval
                  </Badge>
                </Label>
              </div>
            </Card>

            <Card
              className={cn(
                "p-3 cursor-pointer transition-all",
                selectedAction === 'cancel' && "border-indigo-600 bg-indigo-50"
              )}
              onClick={() => setSelectedAction('cancel')}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="cancel" id="cancel" className="mt-1" />
                <Label htmlFor="cancel" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-sm text-gray-900">Cancel Allocation</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Cancel your allocation request and continue with other styles. You can try again later.
                  </div>
                </Label>
              </div>
            </Card>
            </RadioGroup>
          </div>

          {/* Lock Duration Info */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-blue-900 mb-1">Lock Duration Policy</div>
                <ul className="space-y-0.5 text-blue-800">
                  <li>• Styles are automatically locked for 15 minutes when being edited</li>
                  <li>• Locks are released when allocation is confirmed or cancelled</li>
                  <li>• Stale locks (&gt;30 min) can be force-released by supervisors</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Multiple Contentions Queue */}
          {contentions.length > 1 && (
            <Card className="p-3">
              <div className="text-xs text-gray-600 mb-2">
                {contentions.length - 1} more conflicts pending
              </div>
              <div className="space-y-1">
                {contentions.slice(1, 4).map(contention => (
                  <div key={contention.styleId} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{contention.styleName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {contention.lockedBy}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="secondary"
              onClick={() => onClose()}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onResolve(activeContention.styleId, selectedAction);
                onClose();
              }}
              variant={selectedAction === 'cancel' ? 'secondary' : 'primary'}
            >
              {selectedAction === 'wait' && 'Wait & Notify Me'}
              {selectedAction === 'override' && 'Request Override'}
              {selectedAction === 'cancel' && 'Cancel Allocation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
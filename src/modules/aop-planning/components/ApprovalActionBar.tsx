import React, { useState } from 'react';
import { Lock, CheckCircle, Send, MessageSquare } from 'lucide-react';
import { Badge, Button, Textarea, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { CycleStatus } from '../types/aopPlanning.types';

interface ApprovalActionBarProps {
  cycleStatus: CycleStatus;
  hardExceptionCount: number;
  onSubmit: () => void;
  onApprove: () => void;
  onRequestRevision: (comment: string) => void;
  onLock: () => void;
}

export function ApprovalActionBar({
  cycleStatus,
  hardExceptionCount,
  onSubmit,
  onApprove,
  onRequestRevision,
  onLock,
}: ApprovalActionBarProps): React.ReactNode {
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');

  function handleRevisionSubmit(): void {
    if (revisionComment.trim().length === 0) return;
    onRequestRevision(revisionComment.trim());
    setRevisionComment('');
    setShowRevisionInput(false);
  }

  function handleCancelRevision(): void {
    setRevisionComment('');
    setShowRevisionInput(false);
  }

  const hasHardExceptions = hardExceptionCount > 0;

  return (
    <div
      className={cn(
        'sticky bottom-0 left-0 right-0 z-40',
        'bg-white border-t border-gray-200 p-4',
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Status info */}
        <div className="text-sm text-gray-500">
          {cycleStatus === 'DRAFT' && (
            <>
              Status: <span className="font-medium text-gray-700">Draft</span>
              {hasHardExceptions && (
                <span className="text-red-600 ml-2">
                  {hardExceptionCount} hard exception{hardExceptionCount > 1 ? 's' : ''} remaining
                </span>
              )}
            </>
          )}
          {(cycleStatus === 'SUBMITTED' || cycleStatus === 'IN_REVIEW') && (
            <>
              Status:{' '}
              <span className="font-medium text-gray-700">
                {cycleStatus === 'SUBMITTED' ? 'Submitted' : 'In Review'}
              </span>
            </>
          )}
          {cycleStatus === 'APPROVED' && (
            <>
              Status:{' '}
              <span className="font-medium text-green-700">Approved</span>
            </>
          )}
          {cycleStatus === 'LOCKED' && (
            <>
              Status:{' '}
              <span className="font-medium text-gray-700">Locked</span>
            </>
          )}
          {cycleStatus === 'PROMOTED' && (
            <span className="font-medium text-gray-700">
              Plan promoted
            </span>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {cycleStatus === 'DRAFT' && (
            <>
              {hasHardExceptions ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button disabled className="min-h-[44px] md:min-h-0">
                        <Send className="w-4 h-4" />
                        Submit for Review
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Resolve all {hardExceptionCount} hard exception{hardExceptionCount > 1 ? 's' : ''} before submitting
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  onClick={onSubmit}
                  className="min-h-[44px] md:min-h-0"
                >
                  <Send className="w-4 h-4" />
                  Submit for Review
                </Button>
              )}
            </>
          )}

          {(cycleStatus === 'SUBMITTED' || cycleStatus === 'IN_REVIEW') && (
            <>
              {!showRevisionInput ? (
                <>
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 min-h-[44px] md:min-h-0"
                    onClick={() => setShowRevisionInput(true)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Request Revision
                  </Button>
                  <Button
                    onClick={onApprove}
                    className="bg-green-600 hover:bg-green-700 min-h-[44px] md:min-h-0"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-end">
                  <Textarea
                    placeholder="Enter revision feedback..."
                    value={revisionComment}
                    onChange={(e) => setRevisionComment(e.target.value)}
                    className="w-full sm:w-64"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelRevision}
                      className="min-h-[44px] md:min-h-0"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 min-h-[44px] md:min-h-0"
                      onClick={handleRevisionSubmit}
                      disabled={revisionComment.trim().length === 0}
                    >
                      Send Revision
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {cycleStatus === 'APPROVED' && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <p className="text-xs text-gray-500">
                Locking prevents further edits
              </p>
              <Button
                onClick={onLock}
                className="min-h-[44px] md:min-h-0"
              >
                <Lock className="w-4 h-4" />
                Lock Plan
              </Button>
            </div>
          )}

          {cycleStatus === 'LOCKED' && (
            <Badge variant="success">
              <CheckCircle className="w-3 h-3" />
              Promoted
            </Badge>
          )}

          {cycleStatus === 'PROMOTED' && null}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';

export interface ContentionItem {
  styleId: string;
  styleName: string;
  lockedBy: string;
  lockedAt: Date;
  requestedSlot: string;
  conflictingSlot?: string;
  conflictingUser?: string;
}

// Hook to simulate contention detection
export function useContentionDetection() {
  const [contentions, setContentions] = useState<ContentionItem[]>([]);
  const [showContentionDialog, setShowContentionDialog] = useState(false);

  // Simulate detecting a contention
  const simulateContention = () => {
    const mockContention: ContentionItem = {
      styleId: 'levi-001',
      styleName: "Levi's 501 Original Jeans",
      lockedBy: 'Sarah Johnson',
      lockedAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      requestedSlot: 'Denim - Core',
      conflictingSlot: 'Denim - Premium',
      conflictingUser: 'Sarah Johnson',
    };

    setContentions([mockContention]);
    setShowContentionDialog(true);
  };

  const handleResolve = (styleId: string, action: 'wait' | 'override' | 'cancel') => {
    // Handle resolution
    if (action === 'wait') {
      console.log(`Waiting for style ${styleId} to be released`);
      // Set up polling or websocket listener
    } else if (action === 'override') {
      console.log(`Requesting override for style ${styleId}`);
      // Send override request
    } else {
      console.log(`Cancelling allocation for style ${styleId}`);
      // Cancel the allocation
    }

    // Remove resolved contention
    setContentions(prev => prev.filter(c => c.styleId !== styleId));
  };

  return {
    contentions,
    showContentionDialog,
    setShowContentionDialog,
    simulateContention,
    handleResolve,
  };
}
import { useRef, useCallback } from 'react';

const SWIPE_THRESHOLD_PX = 100;
const HIGH_VALUE_THRESHOLD_INR = 2500000;

interface SwipeActionConfig {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  impactInr: number;
  disabled?: boolean;
}

interface SwipeState {
  startX: number;
  currentX: number;
  isDragging: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: () => void;
  getTranslateX: () => number;
  getSwipeDirection: () => 'left' | 'right' | null;
  getSwipeProgress: () => number;
  isHighValue: boolean;
  isSwipeDisabled: boolean;
}

export function useSwipeAction({
  onSwipeRight,
  onSwipeLeft,
  impactInr,
  disabled = false,
}: SwipeActionConfig): SwipeHandlers {
  const stateRef = useRef<SwipeState>({ startX: 0, currentX: 0, isDragging: false });
  const elementRef = useRef<{ translateX: number; direction: 'left' | 'right' | null; progress: number }>({
    translateX: 0,
    direction: null,
    progress: 0,
  });

  const isHighValue = impactInr >= HIGH_VALUE_THRESHOLD_INR;
  const isSwipeDisabled = disabled || (isHighValue && !!onSwipeRight);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isSwipeDisabled) return;
    const touch = e.touches[0];
    if (!touch) return;
    stateRef.current = { startX: touch.clientX, currentX: touch.clientX, isDragging: true };
  }, [isSwipeDisabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!stateRef.current.isDragging || isSwipeDisabled) return;
    const touch = e.touches[0];
    if (!touch) return;

    stateRef.current.currentX = touch.clientX;
    const deltaX = stateRef.current.currentX - stateRef.current.startX;
    const progress = Math.min(1, Math.abs(deltaX) / SWIPE_THRESHOLD_PX);

    elementRef.current = {
      translateX: deltaX,
      direction: deltaX > 20 ? 'right' : deltaX < -20 ? 'left' : null,
      progress,
    };
  }, [isSwipeDisabled]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!stateRef.current.isDragging || isSwipeDisabled) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - stateRef.current.startX;
    stateRef.current.isDragging = false;

    if (deltaX > SWIPE_THRESHOLD_PX && onSwipeRight) {
      onSwipeRight();
    } else if (deltaX < -SWIPE_THRESHOLD_PX && onSwipeLeft) {
      onSwipeLeft();
    }

    elementRef.current = { translateX: 0, direction: null, progress: 0 };
  }, [isSwipeDisabled, onSwipeRight, onSwipeLeft]);

  const handleTouchCancel = useCallback(() => {
    stateRef.current.isDragging = false;
    elementRef.current = { translateX: 0, direction: null, progress: 0 };
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    getTranslateX: () => elementRef.current.translateX,
    getSwipeDirection: () => elementRef.current.direction,
    getSwipeProgress: () => elementRef.current.progress,
    isHighValue,
    isSwipeDisabled,
  };
}

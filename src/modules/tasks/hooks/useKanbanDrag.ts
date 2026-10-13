import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task } from '../types/task.types';
import { LANES, type LaneId } from '../lib/lanes';

/**
 * Unified pointer-based drag for the Kanban board — works for both mouse and
 * touch (HTML5 drag-and-drop never fires on touch). On touch a card is picked
 * up with a long-press (so a quick swipe still scrolls the lanes); on mouse it
 * lifts after a small move. A floating ghost follows the pointer, the lane under
 * the pointer is resolved via `elementFromPoint`, and dropping on a different
 * lane calls `onMove`.
 *
 * Window pointer listeners are attached once and no-op until a press is active,
 * so there's no per-drag add/remove churn (and no stale-listener bugs).
 */
const LONG_PRESS_MS = 250;
const TOUCH_SCROLL_TOLERANCE = 10; // finger movement (px) before the long-press that means "scroll, not drag"
const MOUSE_DRAG_THRESHOLD = 6; // pointer movement (px) that starts a mouse drag
const EDGE_ZONE = 44; // distance from a board edge (px) that triggers auto-scroll
const EDGE_SPEED = 14; // auto-scroll speed (px per frame)

export interface DragGhost {
  x: number;
  y: number;
  width: number;
  task: Task;
}

interface PressState {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  task: Task;
  sourceLane: LaneId;
  cardEl: HTMLElement;
  started: boolean;
  longPressTimer: number | null;
}

export interface UseKanbanDragResult {
  boardRef: React.RefObject<HTMLDivElement | null>;
  dragId: string | null;
  overLane: LaneId | null;
  ghost: DragGhost | null;
  onCardPointerDown: (task: Task, sourceLane: LaneId, cardEl: HTMLElement, e: React.PointerEvent) => void;
  /** Returns true (once) right after a drag ended — call from the card click handler to suppress navigation. */
  consumeJustDragged: () => boolean;
}

const LANE_IDS = new Set<string>(LANES.map((l) => l.id));
function toLaneId(value: string | null | undefined): LaneId | null {
  return value && LANE_IDS.has(value) ? (value as LaneId) : null;
}

export function useKanbanDrag({
  onMove,
}: {
  onMove: (taskId: string, targetLane: LaneId) => void;
}): UseKanbanDragResult {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const pressRef = useRef<PressState | null>(null);
  const justDraggedRef = useRef(false);
  const overLaneRef = useRef<LaneId | null>(null);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  // Assigned inside the mount effect so `onCardPointerDown`'s long-press timer can trigger it.
  const beginDragRef = useRef<() => void>(() => {});
  // Keep the latest onMove without re-running the listener effect.
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overLane, setOverLane] = useState<LaneId | null>(null);
  const [ghost, setGhost] = useState<DragGhost | null>(null);

  useEffect(() => {
    let autoScrollDir = 0;
    let autoScrollRaf: number | null = null;

    const setOver = (lane: LaneId | null): void => {
      if (overLaneRef.current !== lane) {
        overLaneRef.current = lane;
        setOverLane(lane);
      }
    };

    const resolveLaneAt = (x: number, y: number): void => {
      const el = document.elementFromPoint(x, y);
      const laneEl = el?.closest('[data-lane-id]') ?? null;
      setOver(toLaneId(laneEl?.getAttribute('data-lane-id')));
    };

    const stopAutoScroll = (): void => {
      autoScrollDir = 0;
      if (autoScrollRaf !== null) {
        cancelAnimationFrame(autoScrollRaf);
        autoScrollRaf = null;
      }
    };

    const step = (): void => {
      const board = boardRef.current;
      if (!board || autoScrollDir === 0) {
        autoScrollRaf = null;
        return;
      }
      board.scrollLeft += autoScrollDir * EDGE_SPEED;
      // Lanes moved under a stationary finger — re-resolve the lane below it.
      resolveLaneAt(lastXRef.current, lastYRef.current);
      autoScrollRaf = requestAnimationFrame(step);
    };

    const setAutoScroll = (dir: number): void => {
      if (autoScrollDir === dir) return;
      autoScrollDir = dir;
      if (dir !== 0 && autoScrollRaf === null) autoScrollRaf = requestAnimationFrame(step);
    };

    const clearTimer = (press: PressState): void => {
      if (press.longPressTimer !== null) {
        window.clearTimeout(press.longPressTimer);
        press.longPressTimer = null;
      }
    };

    const beginDrag = (): void => {
      const press = pressRef.current;
      if (!press || press.started) return;
      press.started = true;
      clearTimer(press);
      try {
        press.cardEl.setPointerCapture(press.pointerId);
      } catch {
        // pointer may already be released — safe to ignore
      }
      press.cardEl.style.touchAction = 'none';
      const rect = press.cardEl.getBoundingClientRect();
      justDraggedRef.current = false;
      setDragId(press.task.id);
      setGhost({ x: lastXRef.current, y: lastYRef.current, width: rect.width, task: press.task });
      resolveLaneAt(lastXRef.current, lastYRef.current);
    };
    beginDragRef.current = beginDrag;

    const finishPress = (): void => {
      const press = pressRef.current;
      if (press) clearTimer(press);
      pressRef.current = null;
    };

    const onPointerMove = (e: PointerEvent): void => {
      const press = pressRef.current;
      if (!press) return;
      lastXRef.current = e.clientX;
      lastYRef.current = e.clientY;

      if (!press.started) {
        const dx = Math.abs(e.clientX - press.startX);
        const dy = Math.abs(e.clientY - press.startY);
        if (press.pointerType === 'mouse' || press.pointerType === 'pen') {
          if (dx > MOUSE_DRAG_THRESHOLD || dy > MOUSE_DRAG_THRESHOLD) beginDrag();
        } else if (dx > TOUCH_SCROLL_TOLERANCE || dy > TOUCH_SCROLL_TOLERANCE) {
          // Moved before the long-press fired → treat as a scroll, abort the press.
          finishPress();
        }
        return;
      }

      setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
      resolveLaneAt(e.clientX, e.clientY);

      const board = boardRef.current;
      if (board) {
        const rect = board.getBoundingClientRect();
        if (e.clientX < rect.left + EDGE_ZONE) setAutoScroll(-1);
        else if (e.clientX > rect.right - EDGE_ZONE) setAutoScroll(1);
        else setAutoScroll(0);
      }
    };

    const onPointerUp = (): void => {
      const press = pressRef.current;
      if (!press) return;
      if (press.started) {
        const target = overLaneRef.current;
        if (target && target !== press.sourceLane) onMoveRef.current(press.task.id, target);
        justDraggedRef.current = true;
        press.cardEl.style.touchAction = '';
        try {
          press.cardEl.releasePointerCapture(press.pointerId);
        } catch {
          // already released
        }
        setDragId(null);
        setGhost(null);
        setOver(null);
        stopAutoScroll();
      }
      finishPress();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      stopAutoScroll();
    };
  }, []);

  const onCardPointerDown = useCallback(
    (task: Task, sourceLane: LaneId, cardEl: HTMLElement, e: React.PointerEvent): void => {
      if (e.button !== 0) return; // primary pointer only
      if (pressRef.current) return; // a press is already active
      // Clear any leaked suppression flag from a prior drag whose click never fired.
      justDraggedRef.current = false;
      lastXRef.current = e.clientX;
      lastYRef.current = e.clientY;
      const press: PressState = {
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startX: e.clientX,
        startY: e.clientY,
        task,
        sourceLane,
        cardEl,
        started: false,
        longPressTimer: null,
      };
      pressRef.current = press;
      if (e.pointerType === 'touch') {
        press.longPressTimer = window.setTimeout(() => beginDragRef.current(), LONG_PRESS_MS);
      }
      // Mouse/pen: drag begins once the pointer moves past the threshold.
    },
    [],
  );

  const consumeJustDragged = useCallback((): boolean => {
    const v = justDraggedRef.current;
    justDraggedRef.current = false;
    return v;
  }, []);

  return { boardRef, dragId, overLane, ghost, onCardPointerDown, consumeJustDragged };
}

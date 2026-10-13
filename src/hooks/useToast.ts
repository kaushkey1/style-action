import type React from 'react';
import { useCallback } from 'react';
import { create } from 'zustand';
import type { ToastVariant } from '@/components/ui';

export interface ToastData {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode;
}

interface ToastState {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

/**
 * Toast hook for easy toast management
 */
export function useToast() {
  const { toasts, addToast, removeToast, clearToasts } = useToastStore();

  const success = useCallback(
    (description: string, title?: string) => {
      const toastData: Omit<ToastData, 'id'> = { description, variant: 'success' };
      if (title !== undefined) {
        toastData.title = title;
      }
      return addToast(toastData);
    },
    [addToast]
  );

  const error = useCallback(
    (description: string, title?: string) => {
      const toastData: Omit<ToastData, 'id'> = { description, variant: 'error' };
      if (title !== undefined) {
        toastData.title = title;
      }
      return addToast(toastData);
    },
    [addToast]
  );

  const warning = useCallback(
    (description: string, title?: string) => {
      const toastData: Omit<ToastData, 'id'> = { description, variant: 'warning' };
      if (title !== undefined) {
        toastData.title = title;
      }
      return addToast(toastData);
    },
    [addToast]
  );

  const info = useCallback(
    (description: string, title?: string) => {
      const toastData: Omit<ToastData, 'id'> = { description, variant: 'info' };
      if (title !== undefined) {
        toastData.title = title;
      }
      return addToast(toastData);
    },
    [addToast]
  );

  const toast = useCallback(
    (options: Omit<ToastData, 'id'>) => {
      return addToast(options);
    },
    [addToast]
  );

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearToasts,
  };
}

export default useToast;

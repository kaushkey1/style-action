import React from 'react';
import { Toast, ToastProvider, ToastViewport } from './Toast';
import { useToast } from '@/hooks/useToast';

/**
 * Toast container component
 * Renders all active toasts in the viewport
 */
export function ToastContainer(): React.JSX.Element {
  const { toasts, removeToast } = useToast();

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((toast) => {
        const props: {
          id: string;
          description: string;
          onClose: (id: string) => void;
          title?: string;
          variant?: 'success' | 'error' | 'warning' | 'info';
          duration?: number;
          action?: React.ReactNode;
        } = {
          id: toast.id,
          description: toast.description,
          onClose: removeToast,
        };

        if (toast.title !== undefined) {
          props.title = toast.title;
        }
        if (toast.variant !== undefined) {
          props.variant = toast.variant;
        }
        if (toast.duration !== undefined) {
          props.duration = toast.duration;
        }
        if (toast.action !== undefined) {
          props.action = toast.action;
        }

        return <Toast key={toast.id} {...props} />;
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

export default ToastContainer;

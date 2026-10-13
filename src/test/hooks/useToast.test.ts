import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '@/hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    // Clear all toasts before each test via the hook
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.clearToasts();
    });
  });

  describe('toast', () => {
    it('starts with an empty toasts array', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toHaveLength(0);
    });

    it('adds a toast and returns an id', () => {
      const { result } = renderHook(() => useToast());
      let toastId: string;

      act(() => {
        toastId = result.current.toast({ description: 'Test toast' });
      });

      expect(toastId!).toBeDefined();
      expect(typeof toastId!).toBe('string');
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]!.description).toBe('Test toast');
    });

    it('adds a toast with all options', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Title',
          description: 'Description',
          variant: 'info',
          duration: 5000,
        });
      });

      const toast = result.current.toasts[0]!;
      expect(toast.title).toBe('Title');
      expect(toast.description).toBe('Description');
      expect(toast.variant).toBe('info');
      expect(toast.duration).toBe(5000);
    });

    it('adds multiple toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ description: 'Toast 1' });
        result.current.toast({ description: 'Toast 2' });
        result.current.toast({ description: 'Toast 3' });
      });

      expect(result.current.toasts).toHaveLength(3);
    });
  });

  describe('removeToast', () => {
    it('removes a toast by id', () => {
      const { result } = renderHook(() => useToast());
      let toastId: string;

      act(() => {
        toastId = result.current.toast({ description: 'To remove' });
      });
      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast(toastId!);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('only removes the targeted toast', () => {
      const { result } = renderHook(() => useToast());
      let toastId: string;

      act(() => {
        toastId = result.current.toast({ description: 'Remove me' });
        result.current.toast({ description: 'Keep me' });
      });
      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        result.current.removeToast(toastId!);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]!.description).toBe('Keep me');
    });
  });

  describe('clearToasts', () => {
    it('removes all toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ description: 'Toast 1' });
        result.current.toast({ description: 'Toast 2' });
      });
      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        result.current.clearToasts();
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('convenience methods', () => {
    it('adds a success toast with correct variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Operation completed');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]!.variant).toBe('success');
      expect(result.current.toasts[0]!.description).toBe('Operation completed');
      expect(result.current.toasts[0]!.title).toBeUndefined();
    });

    it('adds a success toast with title', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('It worked', 'Success');
      });

      expect(result.current.toasts[0]!.variant).toBe('success');
      expect(result.current.toasts[0]!.description).toBe('It worked');
      expect(result.current.toasts[0]!.title).toBe('Success');
    });

    it('adds an error toast with correct variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Something went wrong');
      });

      expect(result.current.toasts[0]!.variant).toBe('error');
      expect(result.current.toasts[0]!.description).toBe(
        'Something went wrong'
      );
    });

    it('adds an error toast with title', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Details here', 'Error');
      });

      expect(result.current.toasts[0]!.title).toBe('Error');
    });

    it('adds a warning toast with correct variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Be careful');
      });

      expect(result.current.toasts[0]!.variant).toBe('warning');
      expect(result.current.toasts[0]!.description).toBe('Be careful');
    });

    it('adds a warning toast with title', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Watch out', 'Warning');
      });

      expect(result.current.toasts[0]!.title).toBe('Warning');
    });

    it('adds an info toast with correct variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('For your information');
      });

      expect(result.current.toasts[0]!.variant).toBe('info');
      expect(result.current.toasts[0]!.description).toBe(
        'For your information'
      );
    });

    it('adds an info toast with title', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('FYI message', 'Info');
      });

      expect(result.current.toasts[0]!.title).toBe('Info');
    });

    it('returns a unique id from each convenience method', () => {
      const { result } = renderHook(() => useToast());
      const ids: string[] = [];

      act(() => {
        ids.push(result.current.success('s'));
        ids.push(result.current.error('e'));
        ids.push(result.current.warning('w'));
        ids.push(result.current.info('i'));
      });

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(4);
    });
  });
});

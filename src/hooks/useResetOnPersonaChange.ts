import { useEffect, useRef } from 'react';
import { usePersonaStore } from '@/hooks/usePersonaStore';

export function useResetOnPersonaChange(callback: () => void) {
  const persona = usePersonaStore((s) => s.personaId);
  const prevRef = useRef(persona);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (prevRef.current !== persona) {
      prevRef.current = persona;
      callbackRef.current();
    }
  }, [persona]);
}

import { useMemo } from "react";
import { usePersonaStore } from "@/hooks/usePersonaStore";
import type { PersonaId } from "@/data/personaConfig";

export function usePersonaConfig<T>(configs: Partial<Record<PersonaId, T>>): T {
  const personaId = usePersonaStore((s) => s.personaId);

  return useMemo(() => {
    const config = configs[personaId];
    if (config === undefined) {
      // Fall back to first available config if current persona not configured
      const firstKey = Object.keys(configs)[0] as PersonaId | undefined;
      if (firstKey && configs[firstKey] !== undefined) {
        return configs[firstKey] as T;
      }
      throw new Error(
        `usePersonaConfig: no config for persona "${personaId}" and no fallback available`,
      );
    }
    return config;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId]);
}

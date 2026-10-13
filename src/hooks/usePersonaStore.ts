import { create } from "zustand";
import type { PersonaId } from "@/data/personaConfig";

interface PersonaState {
  personaId: PersonaId;
  setPersona: (id: PersonaId) => void;
}

export const usePersonaStore = create<PersonaState>((set) => ({
  personaId: "ceo",
  setPersona: (id) => set({ personaId: id }),
}));

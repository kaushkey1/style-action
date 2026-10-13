import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface NudgeData {
  id: string;
  text: string;
  metric: string;
  engaged: boolean;
  dismissed: boolean;
}

interface AskImpetusState {
  isOpen: boolean;
  open: (preloadedPrompt?: string) => void;
  close: () => void;

  messages: ChatMessage[];
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  clearMessages: () => void;

  preloadedPrompt: string | null;
  clearPreloadedPrompt: () => void;

  nudges: NudgeData[];
  engageNudge: (id: string) => void;
  dismissNudge: (id: string) => void;

  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const mockNudges: NudgeData[] = [
  {
    id: 'nudge-1',
    text: 'Aged inventory in Women Indian has worsened 3 days in a row. Want me to explain what is driving it?',
    metric: 'Aged Inv % — Women Indian',
    engaged: false,
    dismissed: false,
  },
];

export const useAskImpetusStore = create<AskImpetusState>((set) => ({
  isOpen: false,
  open: (preloadedPrompt) =>
    set({ isOpen: true, preloadedPrompt: preloadedPrompt ?? null }),
  close: () => set({ isOpen: false }),

  messages: [],
  addMessage: (role, content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role,
          content,
          timestamp: Date.now(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),

  preloadedPrompt: null,
  clearPreloadedPrompt: () => set({ preloadedPrompt: null }),

  nudges: mockNudges,
  engageNudge: (id) =>
    set((s) => ({
      nudges: s.nudges.map((n) => (n.id === id ? { ...n, engaged: true } : n)),
    })),
  dismissNudge: (id) =>
    set((s) => ({
      nudges: s.nudges.map((n) => (n.id === id ? { ...n, dismissed: true } : n)),
    })),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));

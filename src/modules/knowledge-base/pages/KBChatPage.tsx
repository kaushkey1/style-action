import { AgenticBrainChatPage } from '@/modules/agentic-brain/pages/AgenticBrainChatPage';

/**
 * Knowledge Base Chat — reuses the Agentic Brain chat component.
 * Both interfaces talk to the same backend (AI Assistant / AI Analyst).
 */
export function KBChatPage(): React.ReactNode {
  return <AgenticBrainChatPage />;
}

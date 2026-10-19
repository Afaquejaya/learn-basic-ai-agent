/**
 * Memory contracts (component 9). Implemented in Phase 8.
 *
 * Three separate kinds of memory:
 *   - conversation history  (ConversationMessage rows)
 *   - task memory           (Task + TraceEvent rows)
 *   - long-term facts       (MemoryFact rows, user-approved only)
 *
 * The ContextBuilder decides which of these are actually sent to the model.
 */
import type { MemoryFact } from '@lab/shared';
import type { ChatMessage } from '../llm/types.js';

export interface ContextBuildInput {
  conversationId: string;
  goal: string;
  /** Messages produced inside the current task (assistant tool calls + tool results). */
  taskMessages: ChatMessage[];
}

export interface ContextBuilder {
  build(input: ContextBuildInput): ChatMessage[];
}

export interface LongTermMemory {
  list(): MemoryFact[];
  /** Only callable from the user-facing API. */
  add(content: string, source: MemoryFact['source']): MemoryFact;
  delete(id: string): boolean;
}

/**
 * LLM adapter contract (component 4).
 *
 * The orchestrator talks to *this interface*, never to Ollama directly, so the
 * model/back-end can be swapped (or mocked in tests) without touching the loop.
 * Phase 2 implements OllamaAdapter; tests use a scripted MockLlmAdapter.
 */
import type { JsonSchema, ModelHealth } from '@lab/shared';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

/** A tool call exactly as the model emitted it: unvalidated and untrusted. */
export interface LlmToolCall {
  name: string;
  arguments: unknown;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Present on assistant messages that requested tools. */
  toolCalls?: LlmToolCall[];
  /** Present on role:'tool' messages: which tool produced this content. */
  toolName?: string;
}

/** Tool definition in the shape Ollama's /api/chat `tools` field expects. */
export interface LlmToolSpec {
  type: 'function';
  function: { name: string; description: string; parameters: JsonSchema };
}

export interface LlmChatRequest {
  messages: ChatMessage[];
  tools?: LlmToolSpec[];
  /** Aborts the HTTP request (used for cancellation and timeouts). */
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface LlmChatResponse {
  message: ChatMessage;
  /** Optional reasoning text some models return separately; logged, never trusted. */
  thinking?: string;
  durationMs: number;
  model: string;
}

export interface LlmAdapter {
  readonly name: string;
  health(): Promise<ModelHealth>;
  chat(request: LlmChatRequest): Promise<LlmChatResponse>;
}

export type LlmErrorCode = 'unavailable' | 'timeout' | 'cancelled' | 'malformed_response' | 'model_error';

export class LlmError extends Error {
  constructor(
    readonly code: LlmErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

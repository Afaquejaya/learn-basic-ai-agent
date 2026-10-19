/**
 * Planner and verifier contracts (components 5 and 8). Implemented in Phases 4-5.
 *
 * The planner turns an LLM response into a structured AgentDecision. The
 * verifier decides whether a claimed completion is backed by real evidence.
 * The LLM *suggests*; these deterministic components *decide*.
 */
import type { AgentDecision, Task } from '@lab/shared';
import type { LlmChatResponse } from '../llm/types.js';

export type ParseResult =
  | { ok: true; decision: AgentDecision }
  | { ok: false; error: string };

export interface DecisionParser {
  parse(response: LlmChatResponse): ParseResult;
}

export interface VerificationResult {
  verified: boolean;
  evidence: string[];
  /** Why verification failed, e.g. "answer cites a file that was never read". */
  gaps: string[];
}

export interface Verifier {
  verify(task: Task, proposedAnswer: string): VerificationResult;
}

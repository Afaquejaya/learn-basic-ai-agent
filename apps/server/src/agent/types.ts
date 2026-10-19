/**
 * Agent orchestrator contract (component 3). Implemented in Phase 4.
 *
 * The orchestrator owns the deterministic control flow:
 *   build context -> ask LLM -> parse -> validate -> policy -> execute
 *   -> observe -> (loop | verify -> finish)
 * with hard limits on iterations, wall-clock time and retries.
 */
import type { Task } from '@lab/shared';

export interface AgentLimits {
  maxIterations: number;
  taskTimeoutMs: number;
  maxRetriesPerStep: number;
}

export interface StartTaskInput {
  conversationId: string;
  goal: string;
}

export interface Orchestrator {
  /** Creates the task and starts running it in the background; returns immediately. */
  start(input: StartTaskInput): Promise<Task>;
  cancel(taskId: string): Promise<void>;
  /** Resumes tasks left 'running' / 'awaiting_approval' after a crash or restart. */
  recoverInterrupted(): Promise<Task[]>;
  get(taskId: string): Task | undefined;
}

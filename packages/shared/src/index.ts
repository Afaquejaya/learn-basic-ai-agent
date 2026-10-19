/**
 * Shared domain vocabulary for the Local AI Agent Lab.
 *
 * These types describe *data* that crosses boundaries (server <-> dashboard,
 * server <-> SQLite). They contain no behaviour, so the dashboard can import
 * them without pulling in any server code.
 *
 * Phase 1: definitions only. Nothing produces or consumes these yet.
 */

// ---------------------------------------------------------------------------
// Tools and risk
// ---------------------------------------------------------------------------

/**
 * How dangerous a tool is. The policy engine (Phase 6) maps each level to
 * allow / require-approval / deny. The *tool author* declares the level; the
 * model never gets to choose it.
 */
export type RiskLevel = 'read_only' | 'reversible_write' | 'destructive';

/** JSON Schema object, as sent to Ollama in the `tools` array. */
export type JsonSchema = Record<string, unknown>;

/** Public description of a registered tool (safe to show in the UI / send to the model). */
export interface ToolDescriptor {
  name: string;
  description: string;
  risk: RiskLevel;
  inputSchema: JsonSchema;
}

// ---------------------------------------------------------------------------
// Tasks and plans
// ---------------------------------------------------------------------------

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type StepStatus =
  | 'pending' // planned, not started
  | 'proposed' // model proposed it; not yet validated/authorised
  | 'awaiting_approval' // blocked on a human decision
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'denied' // blocked by policy or by the user
  | 'skipped';

/** One step in a task's plan. "Proposed" vs "executed" is visible via `status`. */
export interface PlanStep {
  id: string;
  index: number;
  description: string;
  status: StepStatus;
  toolName: string | null;
  /** Arguments *after* schema validation. Null until validated. */
  validatedArgs: Record<string, unknown> | null;
  /** What actually happened when the tool ran (never the model's guess). */
  observation: ToolObservation | null;
  error: string | null;
  retryCount: number;
}

export interface Task {
  id: string;
  conversationId: string;
  goal: string;
  status: TaskStatus;
  steps: PlanStep[];
  currentStepIndex: number | null;
  /** Evidence collected by the verifier; required before status may be 'completed'. */
  completionEvidence: string[];
  finalAnswer: string | null;
  iterations: number;
  createdAt: string; // ISO-8601
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Decisions and observations
// ---------------------------------------------------------------------------

/**
 * The application's interpretation of one model response.
 * The model *proposes*; the application decides what actually happens.
 */
export type AgentDecision =
  | {
      type: 'tool_call';
      toolName: string;
      /** Raw, unvalidated arguments exactly as the model produced them. */
      rawArgs: unknown;
      summary: string;
    }
  | { type: 'final_answer'; answer: string; summary: string }
  | { type: 'clarify'; question: string; summary: string };

/** The real outcome of a tool execution, captured by application code. */
export interface ToolObservation {
  ok: boolean;
  output: unknown;
  error: string | null;
  durationMs: number;
  /** Human-readable list of side effects, e.g. "created file notes/todo.md". */
  sideEffects: string[];
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalRequest {
  id: string;
  taskId: string;
  stepId: string;
  toolName: string;
  args: Record<string, unknown>;
  risk: RiskLevel;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt: string | null;
  /** Always 'user' when resolved: the agent has no code path to approve itself. */
  resolvedBy: 'user' | null;
}

// ---------------------------------------------------------------------------
// Execution trace (the "flight recorder")
// ---------------------------------------------------------------------------

export type TraceEventKind =
  | 'goal_received'
  | 'context_built'
  | 'llm_request'
  | 'llm_response'
  | 'decision'
  | 'validation'
  | 'policy'
  | 'approval_requested'
  | 'approval_resolved'
  | 'tool_started'
  | 'tool_finished'
  | 'observation'
  | 'verification'
  | 'retry'
  | 'final_answer'
  | 'error'
  | 'cancelled';

/** Beginner-friendly explanation attached to a trace event (Learning Mode). */
export interface LearningExplanation {
  decision?: string;
  reasonSummary?: string;
  policy?: string;
  execution?: string;
  observation?: string;
  nextAction?: string;
}

export interface TraceEvent {
  id: string;
  taskId: string;
  /** Monotonic per-task sequence number, so the timeline order is unambiguous. */
  seq: number;
  kind: TraceEventKind;
  timestamp: string;
  summary: string;
  data: Record<string, unknown>;
  durationMs: number | null;
  explanation: LearningExplanation | null;
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/** Long-term memory: only ever created/approved by the user, never auto-promoted. */
export interface MemoryFact {
  id: string;
  content: string;
  source: 'user_entered' | 'user_approved_suggestion';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Model health
// ---------------------------------------------------------------------------

export interface ModelHealth {
  ollamaReachable: boolean;
  ollamaVersion: string | null;
  model: string;
  modelInstalled: boolean;
  supportsTools: boolean | null;
  problems: string[];
}

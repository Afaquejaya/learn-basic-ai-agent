/**
 * Tool registry and executor contracts (component 6).
 *
 * A tool is ordinary application code. The model can only *name* a registered
 * tool and *propose* arguments; the executor validates those arguments against
 * the tool's Zod schema before calling `execute`. Phase 3 implements these.
 */
import type { z } from 'zod';
import type { RiskLevel, ToolDescriptor, ToolObservation } from '@lab/shared';

export interface ToolContext {
  taskId: string;
  /** Absolute path of the sandbox; file tools must never escape it. */
  workspaceDir: string;
  signal: AbortSignal;
}

/** What a tool returns from `execute`. Timing is measured by the executor, not the tool. */
export interface ToolOutput<O = unknown> {
  output: O;
  sideEffects?: string[];
}

export interface ToolDefinition<S extends z.ZodType = z.ZodType, O = unknown> {
  name: string;
  description: string;
  risk: RiskLevel;
  input: S;
  execute(args: z.infer<S>, ctx: ToolContext): Promise<ToolOutput<O>>;
}

export interface ToolRegistry {
  register(tool: ToolDefinition): void;
  get(name: string): ToolDefinition | undefined;
  list(): ToolDefinition[];
  /** Descriptors (with JSON Schema) for the UI and for the model's `tools` list. */
  describe(): ToolDescriptor[];
}

export type ArgValidation =
  | { ok: true; args: Record<string, unknown> }
  | { ok: false; errors: string[] };

export interface ToolExecutor {
  validate(toolName: string, rawArgs: unknown): ArgValidation;
  /** Runs an already-validated and already-authorised call. Never throws: failures become observations. */
  execute(toolName: string, args: Record<string, unknown>, ctx: ToolContext): Promise<ToolObservation>;
}

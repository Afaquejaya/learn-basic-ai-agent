/**
 * Persistence contracts (component 9, SQLite). Implemented in Phase 5 using
 * Node's built-in `node:sqlite` module (no native add-on to compile on Windows).
 */
import type { ApprovalRequest, ConversationMessage, MemoryFact, Task, TaskStatus, TraceEvent } from '@lab/shared';

export interface TaskRepository {
  save(task: Task): void;
  get(id: string): Task | undefined;
  listByStatus(statuses: TaskStatus[]): Task[];
  listRecent(limit: number): Task[];
}

export interface TraceRepository {
  append(event: TraceEvent): void;
  listForTask(taskId: string): TraceEvent[];
}

export interface ConversationRepository {
  append(message: ConversationMessage): void;
  list(conversationId: string, limit: number): ConversationMessage[];
  clear(conversationId: string): void;
}

export interface MemoryRepository {
  list(): MemoryFact[];
  insert(fact: MemoryFact): void;
  delete(id: string): boolean;
}

export interface ApprovalRepository {
  save(request: ApprovalRequest): void;
  get(id: string): ApprovalRequest | undefined;
  listPending(): ApprovalRequest[];
}

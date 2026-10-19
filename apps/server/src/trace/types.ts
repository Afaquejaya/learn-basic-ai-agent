/**
 * Execution trace contract (component 10). Implemented in Phases 4-7.
 *
 * Every step of the loop emits a TraceEvent. A sink persists it (SQLite) and/or
 * streams it to the dashboard. The trace is the source of truth for "what
 * actually happened"; it records decision summaries, never hidden reasoning.
 */
import type { TraceEvent } from '@lab/shared';

export type NewTraceEvent = Omit<TraceEvent, 'id' | 'seq' | 'timestamp'>;

export interface TraceSink {
  emit(event: NewTraceEvent): TraceEvent;
  subscribe(listener: (event: TraceEvent) => void): () => void;
}

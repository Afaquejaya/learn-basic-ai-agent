/**
 * Permission and approval contracts (component 7). Implemented in Phase 6.
 *
 * Key rule: `ApprovalManager.resolve` is only reachable from the HTTP API that
 * the human uses. No tool and no orchestrator code path calls it.
 */
import type { ApprovalRequest, RiskLevel } from '@lab/shared';

export type PolicyVerdict = 'allow' | 'require_approval' | 'deny';

export interface PolicyDecision {
  verdict: PolicyVerdict;
  reason: string;
}

export interface PolicySettings {
  /** If true, reversible writes run without asking (off by default). */
  autoApproveReversibleWrites: boolean;
}

export interface PolicyCheckInput {
  toolName: string;
  risk: RiskLevel;
  args: Record<string, unknown>;
}

export interface PolicyEngine {
  evaluate(input: PolicyCheckInput, settings: PolicySettings): PolicyDecision;
}

export interface ApprovalManager {
  create(request: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt' | 'resolvedAt' | 'resolvedBy'>): ApprovalRequest;
  /** Resolves when a human approves/rejects, or rejects on cancellation. */
  waitForDecision(approvalId: string, signal: AbortSignal): Promise<'approved' | 'rejected'>;
  resolve(approvalId: string, decision: 'approved' | 'rejected', resolvedBy: 'user'): ApprovalRequest;
  listPending(): ApprovalRequest[];
}

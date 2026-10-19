# Phase Checklist

Legend: [x] done and tested · [ ] not started

## Phase 1: Environment, architecture, scaffold ✅
- [x] Inspect environment (Node 24.21, npm 11.19, Ollama 0.40.5 running, 15.7 GB RAM, MX570 2 GB)
- [x] Verify `node:sqlite` works (SQLite 3.53.4)
- [x] Recommend model: `qwen3:4b` (tools + thinking capable); pulled and verified by `npm run doctor`
- [x] npm workspaces: `packages/shared`, `apps/server`, `apps/web`
- [x] Shared domain types
- [x] Component interfaces (LLM, tools, policy, planning, agent, memory, persistence, trace)
- [x] Validated config (loopback-only, local-only Ollama, no cloud models)
- [x] `npm run doctor` environment check
- [x] Tests: config (7) + doctor (8), all passing
- [x] README, ARCHITECTURE, LEARNING_GUIDE, PHASES

## Phase 2: Ollama integration
- [ ] OllamaAdapter (raw HTTP `/api/chat`, timeout, cancellation, error mapping)
- [ ] Health endpoint
- [ ] Basic chat endpoint (no tools)
- [ ] Tests: mocked adapter errors + real-model integration test

## Phase 3: Tool registry and initial tools
- [ ] Registry + executor with Zod validation
- [ ] Sandbox path guard
- [ ] calculator, get_current_time, list/read/search workspace, create_note, append_task_log, get_task_status

## Phase 4: Agent loop
- [ ] Orchestrator loop, decision parser, iteration/time/retry limits, cancellation

## Phase 5: Plans, task states, SQLite, recovery
## Phase 6: Permissions, approvals, security checks
## Phase 7: Dashboard and live trace
## Phase 8: Memory, replay, evaluation
## Phase 9: End-to-end tests and final docs

# Architecture

## The big picture

```
 User
  │
  ▼
 React Dashboard (apps/web)                           Phase 7
  │  HTTP + live event stream, 127.0.0.1 only
  ▼
 Local API server (apps/server)                       Phase 2
  │
  ▼
 ┌─────────────────────── Agent Orchestrator ───────────────────────┐ Phase 4
 │                                                                   │
 │  1 ContextBuilder ──► 2 LlmAdapter ──► 3 DecisionParser           │
 │     (memory)            (Ollama)          (model output → typed)  │
 │                                              │                    │
 │       ┌──────────────────────────────────────┘                    │
 │       ▼                                                           │
 │  4 ToolExecutor.validate ──► 5 PolicyEngine ──► (ApprovalManager) │
 │     (Zod schema)              (risk rules)        waits for human │
 │       │                                                           │
 │       ▼                                                           │
 │  6 ToolExecutor.execute ──► 7 Observation ──► back to step 1      │
 │     (real app code)           (real result)                       │
 │                                                                   │
 │  on final_answer: 8 Verifier ──► completed | keep working         │
 └───────────────────────────────────────────────────────────────────┘
        │ every step emits a TraceEvent
        ▼
 TraceSink ──► SQLite (node:sqlite)  +  dashboard stream
```

## Components and interfaces

Each component is a TypeScript interface in `apps/server/src/*/types.ts`. Implementations can be swapped. For example, tests replace `LlmAdapter` with a scripted mock.

| # | Component | Interface | File | Phase |
|---|---|---|---|---|
| 1 | Dashboard | n/a | `apps/web` | 7 |
| 2 | API server | n/a | `apps/server/src/api` | 2 |
| 3 | Orchestrator | `Orchestrator`, `AgentLimits` | `agent/types.ts` | 4 |
| 4 | LLM adapter | `LlmAdapter`, `LlmError` | `llm/types.ts` | 2 |
| 5 | Planner | `DecisionParser` | `planning/types.ts` | 4–5 |
| 6 | Tools | `ToolDefinition`, `ToolRegistry`, `ToolExecutor` | `tools/types.ts` | 3 |
| 7 | Permissions | `PolicyEngine`, `ApprovalManager` | `policy/types.ts` | 6 |
| 8 | Verification | `Verifier` | `planning/types.ts` | 4–5 |
| 9 | Memory + DB | `ContextBuilder`, `LongTermMemory`, `*Repository` | `memory/`, `persistence/` | 5, 8 |
| 10 | Trace | `TraceSink` | `trace/types.ts` | 4–7 |
| 11 | Tests/eval | Vitest + fixtures | `apps/server/test` | all |

Shared data shapes (`Task`, `PlanStep`, `AgentDecision`, `ToolObservation`, `ApprovalRequest`, `TraceEvent`, `MemoryFact`, `ModelHealth`) live in `packages/shared/src/index.ts`, so the server and the dashboard use the same vocabulary.

## Design decisions

1. **The model proposes; the application decides.** The LLM returns a *tool call proposal*. Application code validates it with Zod, checks policy, and only then runs it. The model cannot run code; it can only name a registered tool.
2. **Raw vs validated arguments are different types.** `AgentDecision.rawArgs` is `unknown`. `PlanStep.validatedArgs` is set only after schema validation. The dashboard shows both.
3. **Risk is declared by the tool author, not the model.** `ToolDefinition.risk` is fixed in code.
4. **Only humans approve.** `ApprovalManager.resolve(…, 'user')` is called only from the user-facing API route.
5. **Completion requires evidence.** A task becomes `completed` only after the `Verifier` accepts evidence from real observations.
6. **Tool failures are observations, not crashes.** `ToolExecutor.execute` never throws. Errors return to the model so it can recover, within bounded retries.
7. **Hard limits live in code.** These are the iteration cap, the task timeout, per-step retries and an `AbortSignal` for cancellation.
8. **Local-only by construction.** Config rejects non-loopback bind addresses, non-local Ollama URLs and Ollama `*-cloud` models.
9. **Built-in SQLite.** `node:sqlite` (Node ≥ 22.13) avoids compiling `better-sqlite3` on Windows.
10. **Raw HTTP to Ollama, not the `ollama` npm SDK.** You see the exact JSON request and response for `/api/chat`, which is the point of the lab.

## Ollama tool calling (reference for Phase 2)

Source: https://docs.ollama.com/capabilities/tool-calling

- Request: `POST /api/chat` with `model`, `messages`, `tools: [{type:"function", function:{name, description, parameters}}]`, `stream`.
- Response: `message.tool_calls: [{function:{name, arguments}}]`, where `arguments` is a JSON **object**.
- Tool results are returned as `{role:"tool", tool_name, content}`.
- `/api/show` returns `capabilities`; the doctor checks it for `"tools"`.

## Hardware notes (this machine)

- CPU: i7-1255U (10 cores / 12 threads); RAM: 15.7 GB.
- GPU: NVIDIA MX570 with 2 GB VRAM, which is too small to hold a 4B model fully, so inference is mostly CPU. Expect roughly 5–15 tokens/s with `qwen3:4b`.
- Model choice: `qwen3:4b` (2.5 GB) is the default. Use `qwen3:1.7b` (1.4 GB) if it is too slow. Use `qwen3:8b` (5.2 GB) for better tool selection if you can free about 7 GB of RAM.

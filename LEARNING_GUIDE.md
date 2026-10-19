# Learning Guide

This guide grows with each phase. Each section explains a concept and points at the code that implements it.

---

## 1. What is an "AI agent", really?

An LLM by itself is a **text-in, text-out function**. It cannot read files, check the time or do anything else.

An **agent** is ordinary software that calls the LLM in a loop and gives it a menu of *tools*:

```
goal ──► [ask model: "what next?"] ──► model says "call list_workspace_files"
              ▲                                   │
              │                         app validates + checks permission
              │                                   │
              │                         app RUNS the tool (real code)
              │                                   │
              └──── app sends the real result back to the model
                    ... until the model says "done" and the app verifies it
```

The intelligence (choosing what to do) comes from the model. The **authority** (what is allowed to happen) comes from your code. Keeping those two separate is the most important idea in this project.

## 2. LLM plan vs. deterministic control flow

| The LLM decides (probabilistic) | The application enforces (deterministic) |
|---|---|
| Which tool to try next | Whether that tool exists |
| What arguments to propose | Whether the arguments match the schema |
| When it thinks it is finished | Whether the risk level allows the action |
| How to phrase the final answer | Whether a human must approve |
| | How many iterations / retries / seconds are allowed |
| | Whether "finished" is backed by evidence |

If a model's output is malformed, our code catches it. If the model tries a forbidden action, our code blocks it. If it loops forever, the iteration cap stops it.

## 3. What we can and cannot see inside the model

We **cannot** inspect a model's internal computation. We **can** record:

- what we sent it (the context),
- what it returned (a tool call or text, plus an optional "thinking" string),
- what we decided to do with that,
- what actually happened when the tool ran.

The execution trace records exactly these. When the dashboard says "reason summary", it means a short summary the model *wrote*, not a window into its mind.

## 4. Why this project uses interfaces everywhere

Each box in [ARCHITECTURE.md](ARCHITECTURE.md) is an interface (`LlmAdapter`, `ToolRegistry`, `PolicyEngine`, …). That lets us:

- run the whole agent loop in tests with a **fake LLM** that returns scripted responses, which are deterministic and instant;
- swap `qwen3:4b` for another model without touching the loop;
- add a tool by registering one object.

## 5. Phase 1 exercise: read the contracts

Open these files in order. Each is short.

1. `packages/shared/src/index.ts`: find `AgentDecision`. Notice `rawArgs: unknown`. Why `unknown` and not a typed object?
2. `apps/server/src/tools/types.ts`: `ToolExecutor.execute` "never throws". Why would we want tool errors returned to the model instead of thrown?
3. `apps/server/src/policy/types.ts`: who is allowed to call `resolve()`?
4. `apps/server/src/config.ts`: what happens if you run `$env:LAB_HOST="0.0.0.0"; npm run doctor`? Try it. Afterwards run `Remove-Item Env:LAB_HOST`.

*(Answers: 1, the model can produce anything, so it must be validated first. 2, so the agent can observe the failure and recover. 3, only the human-facing API route. 4, config validation refuses to start.)*

---

*Next sections are added in later phases: the Ollama request/response format (Phase 2), tool schemas (Phase 3), the agent loop step by step (Phase 4), and more.*

# Local AI Agent Lab

A local-first lab for learning how AI agents work **by building one**. The agent loop, tool registry, permission system, memory and trace are written by hand in TypeScript (no LangChain or agent framework). A local model runs through [Ollama](https://ollama.com).

> **Status: Phase 1 complete (scaffold, interfaces, environment check).**
> There is no agent, chat, tool or dashboard functionality yet. See [PHASES.md](PHASES.md).

## Stack

| Concern | Choice | Why |
|---|---|---|
| Inference | Ollama, `qwen3:4b` by default | Local, free, supports tool calling |
| Language | TypeScript (TS 7) | Typed interfaces between components |
| Backend | Node.js 24 | `node:sqlite` built in |
| Database | SQLite via `node:sqlite` | No native add-on to compile on Windows |
| Schemas | Zod 4 | Validates tool args; generates JSON Schema for the model |
| Frontend | React 19 + Vite 8 | Dashboard (Phase 7) |
| Tests | Vitest | Fast, TS-native |

There are no API keys, cloud models or hosted services. Config validation rejects Ollama `*-cloud` models and non-loopback addresses.

## Prerequisites

1. **Node.js ≥ 22.13** (tested on 24.21).
2. **Ollama for Windows**: install it from https://ollama.com/download/windows.
3. **A tool-capable model:**
   ```powershell
   ollama pull qwen3:4b
   ```
4. Check everything:
   ```powershell
   npm run doctor
   ```

## Commands

```powershell
npm install          # install all workspaces
npm run doctor       # environment check (Node, SQLite, RAM, Ollama, model, tool support)
npm run typecheck    # type-check shared, server and web
npm test             # unit tests (mocked; no Ollama needed)
npm run dev:web      # Phase 1 placeholder page at http://127.0.0.1:5173
```

## Configuration (environment variables)

| Variable | Default | Notes |
|---|---|---|
| `LAB_HOST` | `127.0.0.1` | Must be loopback |
| `LAB_PORT` | `8787` | API port (Phase 2+) |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Must be local |
| `LAB_MODEL` | `qwen3:4b` | Cloud models rejected |
| `LAB_LLM_TIMEOUT_MS` | `120000` | Per model call |
| `LAB_MAX_ITERATIONS` | `8` | Agent loop bound |
| `LAB_TASK_TIMEOUT_MS` | `300000` | Whole-task bound |
| `LAB_MAX_RETRIES` | `2` | Per-step retries |
| `LAB_WORKSPACE_DIR` | `./workspace` | Sandbox for file tools |
| `LAB_DB_FILE` | `./data/agent-lab.sqlite` | SQLite file |

## Layout

```
packages/shared/     domain types shared by server + web (Task, PlanStep, TraceEvent, ...)
apps/server/
  src/config.ts      validated configuration
  src/env/           environment doctor
  src/llm/           LLM adapter interface          (impl: Phase 2)
  src/tools/         tool registry/executor iface   (impl: Phase 3)
  src/agent/         orchestrator interface         (impl: Phase 4)
  src/planning/      decision parser + verifier     (impl: Phase 4-5)
  src/persistence/   SQLite repositories            (impl: Phase 5)
  src/policy/        permissions + approvals        (impl: Phase 6)
  src/trace/         execution trace sink           (impl: Phase 4-7)
  src/memory/        context + long-term memory     (impl: Phase 8)
  scripts/doctor.ts  `npm run doctor`
  test/              Vitest tests
apps/web/            React + Vite dashboard         (impl: Phase 7)
workspace/           the agent's sandbox: the ONLY folder file tools may touch
data/                SQLite database (git-ignored)
```

Docs: [ARCHITECTURE.md](ARCHITECTURE.md) · [LEARNING_GUIDE.md](LEARNING_GUIDE.md) · [PHASES.md](PHASES.md)

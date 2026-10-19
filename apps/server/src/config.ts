/**
 * Application configuration.
 *
 * Every value has a safe local default and can be overridden with an
 * environment variable. The schema enforces two safety rules up front:
 *   1. The API server binds to a loopback address only.
 *   2. Only local Ollama models are allowed (no "*-cloud" / ":cloud" models,
 *      which Ollama can transparently proxy to a hosted service).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host.trim().toLowerCase());
}

export function isCloudModel(model: string): boolean {
  const m = model.trim().toLowerCase();
  return m.endsWith(':cloud') || m.endsWith('-cloud');
}

function isLoopbackUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, '');
    return isLoopbackHost(host);
  } catch {
    return false;
  }
}

const intFromEnv = (fallback: number, min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).default(fallback);

export const ConfigSchema = z.object({
  server: z.object({
    host: z
      .string()
      .default('127.0.0.1')
      .refine(isLoopbackHost, 'server.host must be a loopback address (127.0.0.1, ::1, localhost)'),
    port: intFromEnv(8787, 1, 65535),
  }),
  ollama: z.object({
    baseUrl: z
      .string()
      .default('http://127.0.0.1:11434')
      .refine(isLoopbackUrl, 'ollama.baseUrl must point at a local Ollama instance'),
    model: z
      .string()
      .min(1)
      .default('qwen3:4b')
      .refine((m) => !isCloudModel(m), 'cloud-hosted Ollama models are not allowed in this lab'),
    requestTimeoutMs: intFromEnv(120_000, 1_000, 600_000),
  }),
  agent: z.object({
    maxIterations: intFromEnv(8, 1, 50),
    taskTimeoutMs: intFromEnv(300_000, 5_000, 3_600_000),
    maxRetriesPerStep: intFromEnv(2, 0, 5),
  }),
  paths: z.object({
    workspaceDir: z.string().default(path.join(projectRoot, 'workspace')),
    databaseFile: z.string().default(path.join(projectRoot, 'data', 'agent-lab.sqlite')),
  }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

/** Build config from environment variables (undefined values fall back to defaults). */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return ConfigSchema.parse({
    server: { host: env.LAB_HOST, port: env.LAB_PORT },
    ollama: {
      baseUrl: env.OLLAMA_URL,
      model: env.LAB_MODEL,
      requestTimeoutMs: env.LAB_LLM_TIMEOUT_MS,
    },
    agent: {
      maxIterations: env.LAB_MAX_ITERATIONS,
      taskTimeoutMs: env.LAB_TASK_TIMEOUT_MS,
      maxRetriesPerStep: env.LAB_MAX_RETRIES,
    },
    paths: { workspaceDir: env.LAB_WORKSPACE_DIR, databaseFile: env.LAB_DB_FILE },
  });
}

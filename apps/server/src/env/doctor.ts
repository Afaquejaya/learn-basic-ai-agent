/**
 * Environment checks ("doctor").
 *
 * Verifies the prerequisites for the lab and explains how to fix anything
 * missing. It never installs or downloads anything by itself, and it never
 * falls back to a remote model.
 *
 * `fetch` is injected so the logic can be unit-tested without Ollama running.
 */
import os from 'node:os';

export type CheckStatus = 'ok' | 'warn' | 'fail';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
  fix?: string;
}

export interface DoctorOptions {
  ollamaBaseUrl: string;
  model: string;
  fetchFn?: typeof fetch;
  nodeVersion?: string;
  timeoutMs?: number;
}

const MIN_NODE: [number, number, number] = [22, 13, 0]; // first release with unflagged node:sqlite

export function compareVersions(a: string, b: [number, number, number]): number {
  const parts = a.replace(/^v/, '').split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const diff = (parts[i] ?? 0) - b[i]!;
    if (diff !== 0) return diff;
  }
  return 0;
}

export function checkNode(version: string): CheckResult {
  const ok = compareVersions(version, MIN_NODE) >= 0;
  return {
    name: 'Node.js',
    status: ok ? 'ok' : 'fail',
    detail: `found ${version}, need >= ${MIN_NODE.join('.')}`,
    fix: ok ? undefined : 'Install the current Node.js LTS from https://nodejs.org/',
  };
}

export async function checkSqlite(): Promise<CheckResult> {
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(':memory:');
    const row = db.prepare('select sqlite_version() as v').get() as { v: string };
    db.close();
    return { name: 'SQLite (node:sqlite)', status: 'ok', detail: `SQLite ${row.v} built into Node` };
  } catch (err) {
    return {
      name: 'SQLite (node:sqlite)',
      status: 'fail',
      detail: `node:sqlite unavailable: ${(err as Error).message}`,
      fix: 'Upgrade Node.js to >= 22.13.',
    };
  }
}

export function checkMemory(totalBytes = os.totalmem(), freeBytes = os.freemem()): CheckResult {
  const gb = (n: number) => (n / 1024 ** 3).toFixed(1);
  const lowFree = freeBytes < 4 * 1024 ** 3;
  return {
    name: 'System memory',
    status: lowFree ? 'warn' : 'ok',
    detail: `${gb(totalBytes)} GB total, ${gb(freeBytes)} GB free`,
    fix: lowFree
      ? 'A 4B model needs roughly 3-4 GB free while running. Close memory-heavy apps (browsers, IDE windows) before chatting.'
      : undefined,
  };
}

async function getJson(fetchFn: typeof fetch, url: string, timeoutMs: number, init?: RequestInit): Promise<unknown> {
  const res = await fetchFn(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

/** Ollama tags match if equal, or if the user omitted the tag and the installed one is ":latest". */
export function modelMatches(installed: string, wanted: string): boolean {
  if (installed === wanted) return true;
  return !wanted.includes(':') && installed === `${wanted}:latest`;
}

export async function checkOllama(opts: DoctorOptions): Promise<CheckResult[]> {
  const fetchFn = opts.fetchFn ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 3000;
  const base = opts.ollamaBaseUrl.replace(/\/+$/, '');
  const results: CheckResult[] = [];

  // 1. Is the Ollama server reachable?
  let version: string;
  try {
    const body = (await getJson(fetchFn, `${base}/api/version`, timeoutMs)) as { version?: string };
    version = body.version ?? 'unknown';
    results.push({ name: 'Ollama server', status: 'ok', detail: `reachable at ${base}, version ${version}` });
  } catch (err) {
    results.push({
      name: 'Ollama server',
      status: 'fail',
      detail: `not reachable at ${base} (${(err as Error).message})`,
      fix:
        'Install Ollama for Windows from https://ollama.com/download/windows (OllamaSetup.exe), ' +
        'then start it from the Start menu or run `ollama serve`.',
    });
    return results; // later checks need the server
  }

  // 2. Is the configured model pulled locally?
  try {
    const body = (await getJson(fetchFn, `${base}/api/tags`, timeoutMs)) as { models?: { name: string }[] };
    const names = (body.models ?? []).map((m) => m.name);
    const installed = names.some((n) => modelMatches(n, opts.model));
    results.push({
      name: `Model ${opts.model}`,
      status: installed ? 'ok' : 'fail',
      detail: installed
        ? 'installed locally'
        : `not installed (local models: ${names.length ? names.join(', ') : 'none'})`,
      fix: installed ? undefined : `Run: ollama pull ${opts.model}`,
    });
    if (!installed) return results;
  } catch (err) {
    results.push({ name: `Model ${opts.model}`, status: 'fail', detail: (err as Error).message });
    return results;
  }

  // 3. Does the model advertise tool-calling support?
  try {
    const body = (await getJson(fetchFn, `${base}/api/show`, timeoutMs, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: opts.model }),
    })) as { capabilities?: string[] };
    const caps = body.capabilities;
    if (!caps) {
      results.push({
        name: 'Tool calling',
        status: 'warn',
        detail: 'this Ollama version does not report model capabilities',
        fix: 'Update Ollama to a recent version.',
      });
    } else {
      const tools = caps.includes('tools');
      results.push({
        name: 'Tool calling',
        status: tools ? 'ok' : 'fail',
        detail: `capabilities: ${caps.join(', ')}`,
        fix: tools ? undefined : 'Choose a model that lists "tools", e.g. qwen3:4b (set LAB_MODEL).',
      });
    }
  } catch (err) {
    results.push({ name: 'Tool calling', status: 'warn', detail: (err as Error).message });
  }

  return results;
}

export async function runDoctor(opts: DoctorOptions): Promise<CheckResult[]> {
  return [
    checkNode(opts.nodeVersion ?? process.version),
    await checkSqlite(),
    checkMemory(),
    ...(await checkOllama(opts)),
  ];
}

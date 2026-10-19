import { describe, expect, it } from 'vitest';
import { checkNode, checkOllama, checkSqlite, compareVersions, modelMatches } from '../src/env/doctor.js';

/** Builds a fake fetch that answers Ollama endpoints from a lookup table. */
function fakeFetch(routes: Record<string, unknown | Error>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.endsWith(k));
    const value = key ? routes[key] : new Error('ECONNREFUSED');
    if (value instanceof Error) throw value;
    return new Response(JSON.stringify(value), { status: 200 });
  }) as typeof fetch;
}

const base = { ollamaBaseUrl: 'http://127.0.0.1:11434', model: 'qwen3:4b' };

describe('doctor: node and sqlite', () => {
  it('compares versions', () => {
    expect(compareVersions('v24.21.0', [22, 13, 0])).toBeGreaterThan(0);
    expect(compareVersions('v22.12.9', [22, 13, 0])).toBeLessThan(0);
    expect(compareVersions('22.13.0', [22, 13, 0])).toBe(0);
  });

  it('flags old Node versions', () => {
    expect(checkNode('v20.11.0').status).toBe('fail');
    expect(checkNode('v24.21.0').status).toBe('ok');
  });

  it('confirms built-in SQLite works on this machine', async () => {
    const r = await checkSqlite();
    expect(r.status).toBe('ok');
  });
});

describe('doctor: ollama', () => {
  it('reports Ollama missing with install instructions', async () => {
    const results = await checkOllama({ ...base, fetchFn: fakeFetch({}) });
    expect(results).toHaveLength(1);
    expect(results[0]!.status).toBe('fail');
    expect(results[0]!.fix).toMatch(/ollama\.com\/download/);
  });

  it('reports a missing model with the pull command', async () => {
    const fetchFn = fakeFetch({ '/api/version': { version: '0.12.0' }, '/api/tags': { models: [{ name: 'llama3.2:3b' }] } });
    const results = await checkOllama({ ...base, fetchFn });
    expect(results.map((r) => r.status)).toEqual(['ok', 'fail']);
    expect(results[1]!.fix).toBe('Run: ollama pull qwen3:4b');
  });

  it('fails when the model lacks tool calling', async () => {
    const fetchFn = fakeFetch({
      '/api/version': { version: '0.12.0' },
      '/api/tags': { models: [{ name: 'qwen3:4b' }] },
      '/api/show': { capabilities: ['completion'] },
    });
    const results = await checkOllama({ ...base, fetchFn });
    expect(results[2]).toMatchObject({ name: 'Tool calling', status: 'fail' });
  });

  it('passes when server, model and tools capability are present', async () => {
    const fetchFn = fakeFetch({
      '/api/version': { version: '0.12.0' },
      '/api/tags': { models: [{ name: 'qwen3:4b' }] },
      '/api/show': { capabilities: ['completion', 'tools', 'thinking'] },
    });
    const results = await checkOllama({ ...base, fetchFn });
    expect(results.every((r) => r.status === 'ok')).toBe(true);
  });

  it('matches untagged model names to :latest', () => {
    expect(modelMatches('qwen3:latest', 'qwen3')).toBe(true);
    expect(modelMatches('qwen3:8b', 'qwen3')).toBe(false);
  });
});

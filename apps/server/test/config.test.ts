import { describe, expect, it } from 'vitest';
import { isCloudModel, isLoopbackHost, loadConfig } from '../src/config.js';

describe('config', () => {
  it('uses safe local defaults', () => {
    const c = loadConfig({});
    expect(c.server.host).toBe('127.0.0.1');
    expect(c.server.port).toBe(8787);
    expect(c.ollama.baseUrl).toBe('http://127.0.0.1:11434');
    expect(c.ollama.model).toBe('qwen3:4b');
    expect(c.agent.maxIterations).toBeGreaterThan(0);
  });

  it('reads overrides from environment variables', () => {
    const c = loadConfig({ LAB_PORT: '9000', LAB_MODEL: 'qwen3:8b', LAB_MAX_ITERATIONS: '3' });
    expect(c.server.port).toBe(9000);
    expect(c.ollama.model).toBe('qwen3:8b');
    expect(c.agent.maxIterations).toBe(3);
  });

  it('refuses to bind the API to a non-loopback address', () => {
    expect(() => loadConfig({ LAB_HOST: '0.0.0.0' })).toThrow(/loopback/);
    expect(() => loadConfig({ LAB_HOST: '192.168.1.20' })).toThrow(/loopback/);
  });

  it('refuses a non-local Ollama URL', () => {
    expect(() => loadConfig({ OLLAMA_URL: 'https://ollama.com' })).toThrow(/local Ollama/);
  });

  it('refuses cloud-hosted models', () => {
    expect(() => loadConfig({ LAB_MODEL: 'gpt-oss:120b-cloud' })).toThrow(/cloud/);
    expect(() => loadConfig({ LAB_MODEL: 'some-model:cloud' })).toThrow(/cloud/);
  });

  it('rejects out-of-range limits', () => {
    expect(() => loadConfig({ LAB_MAX_ITERATIONS: '0' })).toThrow();
    expect(() => loadConfig({ LAB_PORT: 'abc' })).toThrow();
  });

  it('helpers classify hosts and models', () => {
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isLoopbackHost('::1')).toBe(true);
    expect(isLoopbackHost('10.0.0.1')).toBe(false);
    expect(isCloudModel('qwen3:4b')).toBe(false);
  });
});

/**
 * CLI entry: `npm run doctor`
 * Prints a checklist of prerequisites and exits non-zero if any check fails.
 */
import { loadConfig } from '../src/config.js';
import { runDoctor, type CheckStatus } from '../src/env/doctor.js';

const icon: Record<CheckStatus, string> = { ok: '[ OK ]', warn: '[WARN]', fail: '[FAIL]' };

const config = loadConfig();
console.log('Local AI Agent Lab - environment check\n');
console.log(`Ollama URL : ${config.ollama.baseUrl}`);
console.log(`Model      : ${config.ollama.model}`);
console.log(`Workspace  : ${config.paths.workspaceDir}`);
console.log(`Database   : ${config.paths.databaseFile}\n`);

const results = await runDoctor({ ollamaBaseUrl: config.ollama.baseUrl, model: config.ollama.model });

for (const r of results) {
  console.log(`${icon[r.status]} ${r.name}: ${r.detail}`);
  if (r.fix) console.log(`       -> ${r.fix}`);
}

const failed = results.filter((r) => r.status === 'fail').length;
console.log(failed ? `\n${failed} check(s) failed.` : '\nAll required checks passed.');
process.exitCode = failed ? 1 : 0;

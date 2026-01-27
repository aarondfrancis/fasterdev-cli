import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsxPath = path.join(repoRoot, 'node_modules/.bin/tsx');
const cliPath = path.join(repoRoot, 'src/cli.ts');

const hasEnv = Boolean(process.env.FASTER_API_URL && process.env.FASTER_TEST_TOKEN);

async function runCli(args, options = {}) {
  const env = {
    ...process.env,
    NODE_TLS_REJECT_UNAUTHORIZED: '0',
    FASTER_API_URL: process.env.FASTER_API_URL,
    FASTER_API_KEY: process.env.FASTER_TEST_TOKEN,
  };

  return execFileAsync(tsxPath, [cliPath, ...args], {
    env,
    ...options,
  });
}

test('publishes and installs a package via local API', { skip: !hasEnv }, async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-cli-'));
  const packageName = `integration-${Date.now()}`;

  const manifest = {
    name: packageName,
    version: '1.0.0',
    type: 'rule',
    description: 'Integration test package',
    compatibility: {
      rules: ['claude-code', 'cursor'],
    },
  };

  await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await fs.writeFile(path.join(tempDir, 'rule.md'), '# Integration test');

  await runCli(['publish'], { cwd: tempDir });

  const info = await runCli(['info', packageName]);
  assert.match(info.stdout, new RegExp(packageName));

  const install = await runCli(['install', packageName, '--dry-run']);
  assert.match(install.stdout, new RegExp(packageName));
});

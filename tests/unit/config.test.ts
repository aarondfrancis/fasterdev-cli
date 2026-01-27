import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

let configModule: typeof import('../../src/config.js');

async function initConfig() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-config-'));
  process.env.XDG_CONFIG_HOME = temp;
  process.env.HOME = temp;
  configModule = await import(`../../src/config.js?cacheBust=${Date.now()}`);
}

await initConfig();

test('getConfig returns defaults', () => {
  const config = configModule.getConfig();
  assert.equal(config.apiUrl, 'https://faster.dev/api/v1');
  assert.equal(config.analytics, true);
});

test('setAuthToken and clearAuthToken', () => {
  configModule.setAuthToken('test-token');
  assert.equal(configModule.getAuthToken(), 'test-token');
  configModule.clearAuthToken();
  assert.equal(configModule.getAuthToken(), undefined);
});

test('setApiUrl updates value', () => {
  configModule.setApiUrl('http://example.test/v1');
  assert.equal(configModule.getApiUrl(), 'http://example.test/v1');
});

test('default tools roundtrip', () => {
  configModule.setDefaultTools(['claude-code', 'cursor']);
  assert.deepEqual(configModule.getDefaultTools(), ['claude-code', 'cursor']);
  configModule.clearDefaultTools();
  assert.equal(configModule.getDefaultTools(), undefined);
});

test('env overrides take precedence', () => {
  process.env.FASTER_API_URL = 'http://override.test/v1';
  process.env.FASTER_API_KEY = 'env-token';
  const config = configModule.getConfig();
  assert.equal(config.apiUrl, 'http://override.test/v1');
  assert.equal(config.authToken, 'env-token');
  delete process.env.FASTER_API_URL;
  delete process.env.FASTER_API_KEY;
});

test('getConfigPath returns config file location', () => {
  const configPath = configModule.getConfigPath();
  assert.equal(path.basename(configPath), 'config.json');
  assert.ok(configPath.includes('faster'));
});

test('resetConfig clears stored values', () => {
  configModule.setAuthToken('stored-token');
  configModule.setApiUrl('http://example.test/v1');
  configModule.setDefaultTools(['codex']);

  configModule.resetConfig();

  const config = configModule.getConfig();
  assert.equal(config.apiUrl, 'https://faster.dev/api/v1');
  assert.equal(config.authToken, undefined);
  assert.equal(configModule.getDefaultTools(), undefined);
});

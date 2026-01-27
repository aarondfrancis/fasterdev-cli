import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  readRegistry,
  writeRegistry,
  upsertInstalledPackage,
  removeInstalledPackage,
  listInstalledPackages,
  registryKey,
  getRegistryPath,
} from '../../src/registry.js';

async function tempProject() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'faster-registry-'));
}

test('registry read/write roundtrip', async () => {
  const root = await tempProject();
  const registry = await readRegistry(root, false);
  assert.equal(registry.schemaVersion, 1);
  assert.equal(Object.keys(registry.packages).length, 0);

  upsertInstalledPackage(registry, {
    name: 'api-conventions',
    version: '1.0.0',
    installType: 'rule',
    tools: ['claude-code'],
    installedAt: new Date().toISOString(),
    source: 'registry',
  });

  await writeRegistry(root, false, registry);

  const loaded = await readRegistry(root, false);
  assert.ok(loaded.packages[registryKey('api-conventions', 'rule')]);
});

test('registry remove deletes entries', async () => {
  const root = await tempProject();
  const registry = await readRegistry(root, false);
  upsertInstalledPackage(registry, {
    name: 'api-conventions',
    version: '1.0.0',
    installType: 'rule',
    tools: ['claude-code'],
    installedAt: new Date().toISOString(),
    source: 'registry',
  });
  removeInstalledPackage(registry, 'api-conventions');
  await writeRegistry(root, false, registry);

  const loaded = await readRegistry(root, false);
  assert.equal(listInstalledPackages(loaded).length, 0);
});

test('registry ignores invalid schema or content', async () => {
  const root = await tempProject();
  const registryPath = getRegistryPath(root, false);
  await fs.mkdir(path.dirname(registryPath), { recursive: true });
  await fs.writeFile(registryPath, JSON.stringify({ schemaVersion: 999, packages: [] }), 'utf-8');

  const loaded = await readRegistry(root, false);
  assert.equal(loaded.schemaVersion, 1);
  assert.equal(Object.keys(loaded.packages).length, 0);
});

test('removeInstalledPackage can remove a single install type', async () => {
  const root = await tempProject();
  const registry = await readRegistry(root, false);
  upsertInstalledPackage(registry, {
    name: 'multi',
    version: '1.0.0',
    installType: 'rule',
    tools: ['claude-code'],
    installedAt: new Date().toISOString(),
    source: 'registry',
  });
  upsertInstalledPackage(registry, {
    name: 'multi',
    version: '1.0.0',
    installType: 'skill',
    tools: ['codex'],
    installedAt: new Date().toISOString(),
    source: 'registry',
  });

  removeInstalledPackage(registry, 'multi', 'rule');

  assert.ok(registry.packages[registryKey('multi', 'skill')]);
  assert.equal(registry.packages[registryKey('multi', 'rule')], undefined);
});

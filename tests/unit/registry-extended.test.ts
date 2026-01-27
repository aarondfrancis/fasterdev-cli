import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  readRegistry,
  writeRegistry,
  upsertInstalledPackage,
  removeInstalledPackage,
  listInstalledPackages,
  registryKey,
  getRegistryPath,
} from '../../src/registry.js';
import type { InstalledPackageRecord, InstallRegistry } from '../../src/types.js';

async function withTempDir(fn: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-registry-'));
  try {
    await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

function makeRecord(name: string, overrides?: Partial<InstalledPackageRecord>): InstalledPackageRecord {
  return {
    name,
    version: '1.0.0',
    installType: 'rule',
    tools: ['claude-code'],
    installedAt: new Date().toISOString(),
    source: 'registry',
    ...overrides,
  };
}

test('registryKey creates correct key format', () => {
  assert.equal(registryKey('my-pkg', 'rule'), 'my-pkg::rule');
  assert.equal(registryKey('my-pkg', 'skill'), 'my-pkg::skill');
  assert.equal(registryKey('@scope/pkg', 'rule'), '@scope/pkg::rule');
});

test('getRegistryPath returns correct local path', () => {
  const localPath = getRegistryPath('/project', false);
  assert.ok(localPath.includes('/project'));
  assert.ok(localPath.includes('.faster'));
  assert.ok(localPath.includes('installed.json'));
});

test('getRegistryPath returns correct global path', () => {
  const globalPath = getRegistryPath('/project', true);
  assert.ok(globalPath.includes(os.homedir()));
  assert.ok(globalPath.includes('.faster'));
  assert.ok(globalPath.includes('installed.json'));
});

test('readRegistry returns empty registry for new project', async () => {
  await withTempDir(async (dir) => {
    const registry = await readRegistry(dir, false);
    assert.equal(registry.schemaVersion, 1);
    assert.deepEqual(registry.packages, {});
  });
});

test('writeRegistry creates registry file in .faster directory', async () => {
  await withTempDir(async (dir) => {
    const record = makeRecord('test-pkg');
    const registry: InstallRegistry = {
      schemaVersion: 1,
      packages: {
        [registryKey('test-pkg', 'rule')]: record,
      },
    };

    await writeRegistry(dir, false, registry);

    const filePath = path.join(dir, '.faster', 'installed.json');
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    assert.ok(exists, 'Registry file should exist in .faster directory');

    const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    assert.equal(content.schemaVersion, 1);
    assert.ok(content.packages['test-pkg::rule']);
  });
});

test('readRegistry and writeRegistry roundtrip', async () => {
  await withTempDir(async (dir) => {
    const original: InstallRegistry = {
      schemaVersion: 1,
      packages: {
        [registryKey('pkg-a', 'rule')]: makeRecord('pkg-a', { version: '1.0.0' }),
        [registryKey('pkg-b', 'skill')]: makeRecord('pkg-b', { version: '2.0.0', installType: 'skill' }),
      },
    };

    await writeRegistry(dir, false, original);
    const loaded = await readRegistry(dir, false);

    assert.equal(loaded.packages['pkg-a::rule'].version, '1.0.0');
    assert.equal(loaded.packages['pkg-b::skill'].installType, 'skill');
  });
});

test('upsertInstalledPackage adds new package with correct key', async () => {
  const registry: InstallRegistry = { schemaVersion: 1, packages: {} };
  const record = makeRecord('new-pkg');

  upsertInstalledPackage(registry, record);

  const key = registryKey('new-pkg', 'rule');
  assert.ok(registry.packages[key]);
  assert.equal(registry.packages[key].version, '1.0.0');
});

test('upsertInstalledPackage updates existing package', async () => {
  const key = registryKey('existing-pkg', 'rule');
  const registry: InstallRegistry = {
    schemaVersion: 1,
    packages: {
      [key]: makeRecord('existing-pkg', { version: '1.0.0' }),
    },
  };

  const updated = makeRecord('existing-pkg', { version: '2.0.0' });
  upsertInstalledPackage(registry, updated);

  assert.equal(registry.packages[key].version, '2.0.0');
});

test('removeInstalledPackage removes package by name', async () => {
  const toRemoveKey = registryKey('to-remove', 'rule');
  const toKeepKey = registryKey('to-keep', 'rule');
  const registry: InstallRegistry = {
    schemaVersion: 1,
    packages: {
      [toRemoveKey]: makeRecord('to-remove'),
      [toKeepKey]: makeRecord('to-keep'),
    },
  };

  removeInstalledPackage(registry, 'to-remove');

  assert.equal(registry.packages[toRemoveKey], undefined);
  assert.ok(registry.packages[toKeepKey]);
});

test('removeInstalledPackage with installType removes specific type', async () => {
  const ruleKey = registryKey('pkg', 'rule');
  const skillKey = registryKey('pkg', 'skill');
  const registry: InstallRegistry = {
    schemaVersion: 1,
    packages: {
      [ruleKey]: makeRecord('pkg', { installType: 'rule' }),
      [skillKey]: makeRecord('pkg', { installType: 'skill' }),
    },
  };

  removeInstalledPackage(registry, 'pkg', 'rule');

  assert.equal(registry.packages[ruleKey], undefined);
  assert.ok(registry.packages[skillKey]);
});

test('removeInstalledPackage handles non-existent package', async () => {
  const key = registryKey('existing', 'rule');
  const registry: InstallRegistry = {
    schemaVersion: 1,
    packages: {
      [key]: makeRecord('existing'),
    },
  };

  // Should not throw
  removeInstalledPackage(registry, 'non-existent');
  assert.ok(registry.packages[key]);
});

test('listInstalledPackages returns all packages', async () => {
  const registry: InstallRegistry = {
    schemaVersion: 1,
    packages: {
      [registryKey('pkg-1', 'rule')]: makeRecord('pkg-1'),
      [registryKey('pkg-2', 'rule')]: makeRecord('pkg-2'),
      [registryKey('pkg-3', 'skill')]: makeRecord('pkg-3', { installType: 'skill' }),
    },
  };

  const list = listInstalledPackages(registry);

  assert.equal(list.length, 3);
  const names = list.map(p => p.name);
  assert.ok(names.includes('pkg-1'));
  assert.ok(names.includes('pkg-2'));
  assert.ok(names.includes('pkg-3'));
});

test('listInstalledPackages returns empty array for empty registry', async () => {
  const registry: InstallRegistry = { schemaVersion: 1, packages: {} };
  const list = listInstalledPackages(registry);
  assert.deepEqual(list, []);
});

test('registry handles local source packages', async () => {
  await withTempDir(async (dir) => {
    const registry: InstallRegistry = { schemaVersion: 1, packages: {} };
    const record = makeRecord('local-pkg', {
      source: 'local',
      localPath: '/path/to/local/package',
    });

    upsertInstalledPackage(registry, record);
    await writeRegistry(dir, false, registry);

    const loaded = await readRegistry(dir, false);
    const key = registryKey('local-pkg', 'rule');
    assert.equal(loaded.packages[key].source, 'local');
    assert.equal(loaded.packages[key].localPath, '/path/to/local/package');
  });
});

test('registry handles multiple tools per package', async () => {
  const registry: InstallRegistry = { schemaVersion: 1, packages: {} };
  const record = makeRecord('multi-tool-pkg', {
    tools: ['claude-code', 'cursor', 'codex'],
  });

  upsertInstalledPackage(registry, record);

  const key = registryKey('multi-tool-pkg', 'rule');
  assert.deepEqual(
    registry.packages[key].tools,
    ['claude-code', 'cursor', 'codex']
  );
});

test('global and local registries are separate', async () => {
  await withTempDir(async (dir) => {
    const localRecord = makeRecord('local-pkg');
    const globalRecord = makeRecord('global-pkg');

    const localRegistry: InstallRegistry = {
      schemaVersion: 1,
      packages: { [registryKey('local-pkg', 'rule')]: localRecord },
    };

    const globalRegistry: InstallRegistry = {
      schemaVersion: 1,
      packages: { [registryKey('global-pkg', 'rule')]: globalRecord },
    };

    await writeRegistry(dir, false, localRegistry);
    // Note: global registry writes to home dir, so we just test path separation
    const localPath = getRegistryPath(dir, false);
    const globalPath = getRegistryPath(dir, true);

    assert.notEqual(localPath, globalPath);
  });
});

test('readRegistry handles corrupted JSON gracefully', async () => {
  await withTempDir(async (dir) => {
    const fasterDir = path.join(dir, '.faster');
    await fs.mkdir(fasterDir, { recursive: true });
    await fs.writeFile(path.join(fasterDir, 'installed.json'), 'not valid json {{{');

    const registry = await readRegistry(dir, false);

    // Should return empty registry instead of throwing
    assert.equal(registry.schemaVersion, 1);
    assert.deepEqual(registry.packages, {});
  });
});

test('readRegistry handles wrong schema version', async () => {
  await withTempDir(async (dir) => {
    const fasterDir = path.join(dir, '.faster');
    await fs.mkdir(fasterDir, { recursive: true });
    await fs.writeFile(
      path.join(fasterDir, 'installed.json'),
      JSON.stringify({
        schemaVersion: 999,
        packages: { 'old-pkg': {} },
      })
    );

    const registry = await readRegistry(dir, false);

    // Should return empty registry for incompatible schema
    assert.equal(registry.schemaVersion, 1);
    assert.deepEqual(registry.packages, {});
  });
});

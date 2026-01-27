import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePackageSpec, resolveInstallType, stringifyError, sleep, getScopeFromInput } from '../../src/utils.js';


test('parsePackageSpec handles unscoped names', () => {
  const simple = parsePackageSpec('api-conventions');
  assert.equal(simple.name, 'api-conventions');
  assert.equal(simple.version, undefined);
  assert.deepEqual(parsePackageSpec('api-conventions@1.2.3'), {
    name: 'api-conventions',
    version: '1.2.3',
  });
});

test('parsePackageSpec handles scoped names', () => {
  const scoped = parsePackageSpec('@audits/dead');
  assert.equal(scoped.name, '@audits/dead');
  assert.equal(scoped.version, undefined);
  assert.deepEqual(parsePackageSpec('@audits/dead@2.0.0'), {
    name: '@audits/dead',
    version: '2.0.0',
  });
});

test('parsePackageSpec falls back safely on invalid specs', () => {
  assert.deepEqual(parsePackageSpec('weird@'), { name: 'weird@' });
});

test('resolveInstallType defaults to rule', () => {
  assert.equal(resolveInstallType(), 'rule');
  assert.equal(resolveInstallType(false), 'rule');
  assert.equal(resolveInstallType(true), 'skill');
});

test('stringifyError formats errors and values', () => {
  const error = new Error('Boom');
  assert.equal(stringifyError(error), 'Boom');
  const verbose = stringifyError(error, true);
  assert.ok(verbose.includes('Boom'));
  assert.equal(stringifyError('plain'), 'plain');
});

test('sleep waits at least the requested duration', async () => {
  const start = Date.now();
  await sleep(10);
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 8);
});

test('getScopeFromInput returns scope for scope-only input', () => {
  assert.equal(getScopeFromInput('@audit'), 'audit');
  assert.equal(getScopeFromInput('@my-scope'), 'my-scope');
});

test('getScopeFromInput returns null for scoped package names', () => {
  assert.equal(getScopeFromInput('@audit/dead'), null);
  assert.equal(getScopeFromInput('@scope/pkg@1.0.0'), null);
});

test('getScopeFromInput returns null for unscoped names', () => {
  assert.equal(getScopeFromInput('api-conventions'), null);
  assert.equal(getScopeFromInput('pkg@1.0.0'), null);
});

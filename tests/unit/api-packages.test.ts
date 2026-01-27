import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FasterAPI, APIError } from '../../src/api.js';
import type { Package, PackageManifest } from '../../src/types.js';

type FetchCall = {
  url: string;
  options: Record<string, unknown>;
};

type MockResponse = {
  status?: number;
  json?: unknown;
  body?: string;
  statusText?: string;
};

function makeResponse(def: MockResponse) {
  const status = def.status ?? 200;
  const body = def.body ?? (def.json !== undefined ? JSON.stringify(def.json) : '');
  return {
    status,
    ok: status >= 200 && status < 300,
    statusText: def.statusText ?? '',
    async json() {
      if (def.json !== undefined) return def.json;
      return body ? JSON.parse(body) : {};
    },
    async text() {
      return body;
    },
  };
}

function createFetchStub(
  responses: MockResponse[] | ((call: FetchCall, index: number) => MockResponse)
) {
  const requests: FetchCall[] = [];
  const fetcher = (async (url: string | URL, options?: Record<string, unknown>) => {
    const call = { url: String(url), options: options ?? {} };
    const index = requests.length;
    requests.push(call);
    const response = typeof responses === 'function'
      ? responses(call, index)
      : (responses[index] ?? {});
    return makeResponse(response);
  }) as unknown as typeof fetch;

  return { fetcher, requests };
}

function makePackage(name = 'demo', type: 'rule' | 'skill' | 'both' = 'rule'): Package {
  return {
    manifest: {
      name,
      version: '1.0.0',
      type,
      description: `${name} package`,
      compatibility: { rules: ['claude-code', 'cursor'] },
    },
    files: [
      { path: 'manifest.json', content: '{}' },
      { path: 'rule.md', content: '# Rule content' },
    ],
  };
}

test('getPackageInfo fetches package details', async () => {
  const packageInfo = {
    name: 'my-package',
    description: 'A test package',
    type: 'rule',
    latestVersion: '2.0.0',
    versions: ['1.0.0', '1.5.0', '2.0.0'],
    downloads: 1234,
  };

  const { fetcher, requests } = createFetchStub([{ json: packageInfo }]);
  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  const result = await api.getPackageInfo('my-package');

  assert.equal(requests[0].url, 'https://api.test/packages/my-package');
  assert.equal(result.name, 'my-package');
  assert.equal(result.latestVersion, '2.0.0');
  assert.deepEqual(result.versions, ['1.0.0', '1.5.0', '2.0.0']);
});

test('getPackageInfo handles scoped package names', async () => {
  const { fetcher, requests } = createFetchStub([{ json: { name: '@scope/pkg' } }]);
  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  await api.getPackageInfo('@scope/pkg');

  // Scoped names should be URL encoded
  assert.ok(requests[0].url.includes('%40scope%2Fpkg') || requests[0].url.includes('@scope/pkg'));
});

test('search with no options', async () => {
  const results = [
    { name: 'pkg1', version: '1.0.0', type: 'rule', description: 'First' },
    { name: 'pkg2', version: '2.0.0', type: 'skill', description: 'Second' },
  ];

  const { fetcher, requests } = createFetchStub([{ json: results }]);
  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  const result = await api.search('test');

  const url = new URL(requests[0].url);
  assert.equal(url.searchParams.get('q'), 'test');
  assert.equal(result.length, 2);
});

test('search with type filter', async () => {
  const { fetcher, requests } = createFetchStub([{ json: [] }]);
  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  await api.search('query', { type: 'skill' });

  const url = new URL(requests[0].url);
  assert.equal(url.searchParams.get('type'), 'skill');
});

test('getPackagesByScope fetches packages in a scope', async () => {
  const scopePackages = [
    { name: '@audit/dead', version: '1.0.0', type: 'skill', description: 'Dead code' },
    { name: '@audit/todos', version: '1.0.0', type: 'skill', description: 'TODOs' },
  ];

  const { fetcher, requests } = createFetchStub([{ json: scopePackages }]);
  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  const result = await api.getPackagesByScope('audit');

  const url = new URL(requests[0].url);
  assert.equal(url.searchParams.get('scope'), 'audit');
  assert.equal(result.length, 2);
  assert.equal(result[0].name, '@audit/dead');
});

test('search with tool filter', async () => {
  const { fetcher, requests } = createFetchStub([{ json: [] }]);
  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  await api.search('query', { tool: 'claude-code' });

  const url = new URL(requests[0].url);
  assert.equal(url.searchParams.get('tool'), 'claude-code');
});

test('downloadPackage fetches latest version', async () => {
  const pkg = makePackage('download-test');
  const { fetcher, requests } = createFetchStub([{ json: pkg }]);
  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  const result = await api.downloadPackage('download-test');

  assert.equal(requests[0].url, 'https://api.test/packages/download-test/download');
  assert.equal(result.manifest.name, 'download-test');
});

test('downloadPackage fetches specific version', async () => {
  const pkg = makePackage('versioned');
  const { fetcher, requests } = createFetchStub([{ json: pkg }]);
  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  await api.downloadPackage('versioned', '1.2.3');

  assert.equal(requests[0].url, 'https://api.test/packages/versioned/versions/1.2.3/download');
});

test('publishPackage sends package data', async () => {
  const pkg = makePackage('publish-test');
  const { fetcher, requests } = createFetchStub([
    { json: { name: 'publish-test', version: '1.0.0' } },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://api.test', authToken: 'token' }, fetcher as any);
  const result = await api.publishPackage(pkg);

  assert.equal(requests[0].url, 'https://api.test/packages');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(result.name, 'publish-test');

  const body = JSON.parse(requests[0].options.body as string);
  assert.equal(body.manifest.name, 'publish-test');
  assert.ok(Array.isArray(body.files));
});

test('publishPackage throws without auth token', async () => {
  const pkg = makePackage('no-auth');
  const { fetcher } = createFetchStub([]);

  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  await assert.rejects(
    () => api.publishPackage(pkg),
    /Authentication required/
  );
});

test('API handles 400 bad request', async () => {
  const { fetcher } = createFetchStub([
    { status: 400, body: 'Invalid request body' },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  await assert.rejects(
    () => api.search('test'),
    (error) => {
      assert.ok(error instanceof APIError);
      assert.equal(error.status, 400);
      return true;
    }
  );
});

test('API handles 500 server error', async () => {
  const { fetcher } = createFetchStub([
    { status: 500, body: 'Internal server error' },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  await assert.rejects(
    () => api.getPackageInfo('any'),
    (error) => {
      assert.ok(error instanceof APIError);
      assert.equal(error.status, 500);
      return true;
    }
  );
});

test('API handles network errors gracefully', async () => {
  const fetcher = (async () => {
    throw new Error('Network failure');
  }) as unknown as typeof fetch;

  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  await assert.rejects(
    () => api.search('test'),
    /Network failure/
  );
});

test('API handles empty search results', async () => {
  const { fetcher } = createFetchStub([{ json: [] }]);
  const api = new FasterAPI({ apiUrl: 'https://api.test' }, fetcher as any);

  const result = await api.search('nonexistent');

  assert.deepEqual(result, []);
});

test('API preserves auth token across requests', async () => {
  const { fetcher, requests } = createFetchStub([
    { json: { id: 1 } },
    { json: [] },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://api.test', authToken: 'persistent-token' }, fetcher as any);

  await api.me();
  await api.search('test');

  const headers1 = requests[0].options.headers as Record<string, string>;
  const headers2 = requests[1].options.headers as Record<string, string>;

  assert.equal(headers1.Authorization, 'Bearer persistent-token');
  assert.equal(headers2.Authorization, 'Bearer persistent-token');
});

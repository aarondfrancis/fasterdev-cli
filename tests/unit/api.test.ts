import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APIError, FasterAPI, createLocalPackage, validateManifest } from '../../src/api.js';
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

function makePackage(name = 'demo'): Package {
  return {
    manifest: {
      name,
      version: '1.0.0',
      type: 'rule',
      description: 'Demo package',
      compatibility: { rules: ['claude-code'] },
    },
    files: [],
  };
}

test('login posts credentials and returns token', async () => {
  const { fetcher, requests } = createFetchStub([
    { json: { token: 'test-token', user: { id: 1, email: 'a@b.test' } } },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://example.test' }, fetcher as any);
  const response = await api.login('a@b.test', 'secret');

  assert.equal(response.token, 'test-token');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://example.test/auth/login');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(
    requests[0].options.body,
    JSON.stringify({ email: 'a@b.test', password: 'secret' })
  );
  const headers = requests[0].options.headers as Record<string, string>;
  assert.match(String(headers['Content-Type'] ?? headers['content-type']), /application\/json/);
});

test('me sends authorization header when configured', async () => {
  const { fetcher, requests } = createFetchStub([
    { json: { id: 123, email: 'me@faster.dev' } },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://example.test', authToken: 'auth-token' }, fetcher as any);
  await api.me();

  const headers = requests[0].options.headers as Record<string, string>;
  assert.equal(headers.Authorization ?? headers.authorization, 'Bearer auth-token');
});

test('search builds query parameters', async () => {
  const { fetcher, requests } = createFetchStub([{ json: [] }]);

  const api = new FasterAPI({ apiUrl: 'https://example.test' }, fetcher as any);
  await api.search('audit', { type: 'rule', tool: 'codex' });

  const requestUrl = new URL(requests[0].url);
  assert.equal(requestUrl.pathname, '/packages/search');
  assert.equal(requestUrl.searchParams.get('q'), 'audit');
  assert.equal(requestUrl.searchParams.get('type'), 'rule');
  assert.equal(requestUrl.searchParams.get('tool'), 'codex');
});

test('downloadPackage uses correct endpoints', async () => {
  const { fetcher, requests } = createFetchStub([
    { json: makePackage('demo') },
    { json: makePackage('demo') },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://example.test' }, fetcher as any);
  await api.downloadPackage('demo');
  await api.downloadPackage('demo', '2.0.0');

  assert.equal(requests[0].url, 'https://example.test/packages/demo/download');
  assert.equal(requests[1].url, 'https://example.test/packages/demo/versions/2.0.0/download');
});

test('APIError surfaces status and body', async () => {
  const { fetcher } = createFetchStub([
    { status: 404, body: 'Not found', statusText: 'Not Found' },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://example.test' }, fetcher as any);

  await assert.rejects(
    () => api.getPackageInfo('missing'),
    (error) => {
      assert.ok(error instanceof APIError);
      assert.equal(error.status, 404);
      assert.ok(error.body?.includes('Not found'));
      return true;
    }
  );
});

test('publishPackage requires auth token', async () => {
  const api = new FasterAPI({ apiUrl: 'https://example.test' }, (async () => makeResponse({})) as any);
  const pkg = makePackage('private');

  await assert.rejects(
    () => api.publishPackage(pkg),
    /Authentication required to publish packages/
  );
});

test('setAuthToken updates Authorization header', async () => {
  const { fetcher, requests } = createFetchStub([
    { json: { id: 555, email: 'me@faster.dev' } },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://example.test' }, fetcher as any);
  api.setAuthToken('new-token');
  await api.me();

  const headers = requests[0].options.headers as Record<string, string>;
  assert.equal(headers.Authorization ?? headers.authorization, 'Bearer new-token');
});

test('createLocalPackage reads manifest from files', () => {
  const manifest: PackageManifest = {
    name: 'local-pack',
    version: '0.0.1',
    type: 'rule',
    description: 'Local package',
    compatibility: { rules: ['claude-code'] },
  };

  const pkg = createLocalPackage('manifest.json', [
    { path: 'manifest.json', content: JSON.stringify(manifest) },
    { path: 'rule.md', content: '# Rule' },
  ]);

  assert.equal(pkg.manifest.name, 'local-pack');
});

test('createLocalPackage throws when manifest is missing', () => {
  assert.throws(() => createLocalPackage('manifest.json', [
    { path: 'rule.md', content: '# Rule' },
  ]));
});

test('validateManifest accepts valid manifests and rejects invalid ones', () => {
  const valid: PackageManifest = {
    name: 'valid',
    version: '1.0.0',
    type: 'rule',
    description: 'Valid',
    compatibility: { rules: ['codex'] },
  };

  assert.equal(validateManifest(valid), true);
  assert.equal(validateManifest({}), false);
  assert.equal(validateManifest({ name: 'x', version: '1.0.0' }), false);
});

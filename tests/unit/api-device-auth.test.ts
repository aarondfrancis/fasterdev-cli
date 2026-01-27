import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FasterAPI } from '../../src/api.js';

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

test('requestDeviceAuth posts to /auth/device', async () => {
  const deviceResponse = {
    device_code: 'abc123',
    user_code: 'WXYZ-1234',
    verification_url: 'https://faster.dev/device?code=WXYZ-1234',
    expires_in: 600,
    interval: 3,
  };

  const { fetcher, requests } = createFetchStub([{ json: deviceResponse }]);
  const api = new FasterAPI({ apiUrl: 'https://faster.dev/api/v1' }, fetcher as any);

  const result = await api.requestDeviceAuth();

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://faster.dev/api/v1/auth/device');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(result.device_code, 'abc123');
  assert.equal(result.user_code, 'WXYZ-1234');
  assert.equal(result.expires_in, 600);
  assert.equal(result.interval, 3);
});

test('checkDeviceAuth returns pending status', async () => {
  const { fetcher, requests } = createFetchStub([
    { json: { status: 'pending', interval: 3 } },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://faster.dev/api/v1' }, fetcher as any);
  const result = await api.checkDeviceAuth('device-code-123');

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://faster.dev/api/v1/auth/device/device-code-123');
  assert.equal(result.status, 'pending');
});

test('checkDeviceAuth returns approved status with token', async () => {
  const { fetcher } = createFetchStub([
    {
      json: {
        status: 'approved',
        token: 'auth-token-xyz',
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
      },
    },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://faster.dev/api/v1' }, fetcher as any);
  const result = await api.checkDeviceAuth('device-code-123');

  assert.equal(result.status, 'approved');
  if (result.status === 'approved') {
    assert.equal(result.token, 'auth-token-xyz');
    assert.equal(result.user.email, 'test@example.com');
  }
});

test('checkDeviceAuth URL-encodes device code', async () => {
  const { fetcher, requests } = createFetchStub([
    { json: { status: 'pending' } },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://faster.dev/api/v1' }, fetcher as any);
  await api.checkDeviceAuth('code/with/slashes');

  assert.equal(
    requests[0].url,
    'https://faster.dev/api/v1/auth/device/code%2Fwith%2Fslashes'
  );
});

test('checkDeviceAuth throws on 404', async () => {
  const { fetcher } = createFetchStub([
    { status: 404, json: { error: { code: 'NOT_FOUND', message: 'Device code not found' } } },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://faster.dev/api/v1' }, fetcher as any);

  await assert.rejects(
    () => api.checkDeviceAuth('invalid-code'),
    (error: Error) => {
      assert.ok(error.message.includes('404'));
      return true;
    }
  );
});

test('checkDeviceAuth throws on 410 expired', async () => {
  const { fetcher } = createFetchStub([
    { status: 410, json: { error: { code: 'EXPIRED', message: 'Device code expired' } } },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://faster.dev/api/v1' }, fetcher as any);

  await assert.rejects(
    () => api.checkDeviceAuth('expired-code'),
    (error: Error) => {
      assert.ok(error.message.includes('410'));
      return true;
    }
  );
});

test('checkDeviceAuth throws on 410 consumed', async () => {
  const { fetcher } = createFetchStub([
    { status: 410, json: { error: { code: 'CONSUMED', message: 'Device code already used' } } },
  ]);

  const api = new FasterAPI({ apiUrl: 'https://faster.dev/api/v1' }, fetcher as any);

  await assert.rejects(
    () => api.checkDeviceAuth('consumed-code'),
    (error: Error) => {
      assert.ok(error.message.includes('410'));
      return true;
    }
  );
});

test('device auth flow can be polled multiple times', async () => {
  let callCount = 0;
  const { fetcher, requests } = createFetchStub((call, index) => {
    callCount++;
    if (index < 2) {
      return { json: { status: 'pending', interval: 1 } };
    }
    return {
      json: {
        status: 'approved',
        token: 'final-token',
        user: { id: 1, email: 'user@test.com' },
      },
    };
  });

  const api = new FasterAPI({ apiUrl: 'https://faster.dev/api/v1' }, fetcher as any);

  // Poll three times
  const result1 = await api.checkDeviceAuth('poll-code');
  assert.equal(result1.status, 'pending');

  const result2 = await api.checkDeviceAuth('poll-code');
  assert.equal(result2.status, 'pending');

  const result3 = await api.checkDeviceAuth('poll-code');
  assert.equal(result3.status, 'approved');

  assert.equal(requests.length, 3);
});

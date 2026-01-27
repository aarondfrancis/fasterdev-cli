import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXIT_CODES, mapApiErrorToExitCode } from '../../src/lib/exit-codes.js';
import { APIError } from '../../src/api.js';

test('EXIT_CODES has expected values', () => {
  assert.equal(EXIT_CODES.SUCCESS, 0);
  assert.equal(EXIT_CODES.ERROR, 1);
  assert.equal(EXIT_CODES.INVALID_ARGS, 2);
  assert.equal(EXIT_CODES.AUTH_REQUIRED, 3);
  assert.equal(EXIT_CODES.NOT_FOUND, 4);
  assert.equal(EXIT_CODES.NETWORK, 5);
  assert.equal(EXIT_CODES.PERMISSION, 6);
});

test('mapApiErrorToExitCode returns AUTH_REQUIRED for 401', () => {
  const error = new APIError(401, 'Unauthorized');
  assert.equal(mapApiErrorToExitCode(error), EXIT_CODES.AUTH_REQUIRED);
});

test('mapApiErrorToExitCode returns PERMISSION for 403', () => {
  const error = new APIError(403, 'Forbidden');
  assert.equal(mapApiErrorToExitCode(error), EXIT_CODES.PERMISSION);
});

test('mapApiErrorToExitCode returns NOT_FOUND for 404', () => {
  const error = new APIError(404, 'Not found');
  assert.equal(mapApiErrorToExitCode(error), EXIT_CODES.NOT_FOUND);
});

test('mapApiErrorToExitCode returns NETWORK for 5xx errors', () => {
  assert.equal(mapApiErrorToExitCode(new APIError(500, 'Internal')), EXIT_CODES.NETWORK);
  assert.equal(mapApiErrorToExitCode(new APIError(502, 'Bad Gateway')), EXIT_CODES.NETWORK);
  assert.equal(mapApiErrorToExitCode(new APIError(503, 'Unavailable')), EXIT_CODES.NETWORK);
});

test('mapApiErrorToExitCode returns ERROR for other APIError statuses', () => {
  assert.equal(mapApiErrorToExitCode(new APIError(400, 'Bad request')), EXIT_CODES.ERROR);
  assert.equal(mapApiErrorToExitCode(new APIError(422, 'Unprocessable')), EXIT_CODES.ERROR);
});

test('mapApiErrorToExitCode returns ERROR for non-APIError', () => {
  assert.equal(mapApiErrorToExitCode(new Error('Generic error')), EXIT_CODES.ERROR);
  assert.equal(mapApiErrorToExitCode('string error'), EXIT_CODES.ERROR);
  assert.equal(mapApiErrorToExitCode(null), EXIT_CODES.ERROR);
  assert.equal(mapApiErrorToExitCode(undefined), EXIT_CODES.ERROR);
});

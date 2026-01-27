import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  EXIT_CODES,
} from '../../src/lib/command-utils.js';

test('SpinnerManager in JSON mode is a no-op', () => {
  const spinner = new SpinnerManager('Loading...', true);

  // These should not throw
  spinner.text('New text');
  spinner.stop();
  spinner.succeed('Done');
  spinner.fail('Failed');
  spinner.info('Info');
});

test('SpinnerManager in interactive mode creates spinner', () => {
  const spinner = new SpinnerManager('Loading...', false);

  // Should not throw
  spinner.text('New text');
  spinner.stop();
});

test('SpinnerManager succeed stops spinner with success', () => {
  const spinner = new SpinnerManager('Loading...', false);
  spinner.succeed('Completed successfully');
  // Spinner should be stopped after succeed
});

test('SpinnerManager fail stops spinner with failure', () => {
  const spinner = new SpinnerManager('Loading...', false);
  spinner.fail('Something went wrong');
  // Spinner should be stopped after fail
});

test('SpinnerManager info shows info message', () => {
  const spinner = new SpinnerManager('Loading...', false);
  spinner.info('Information message');
  // Spinner should show info
});

test('outputJson writes JSON to stdout', () => {
  const originalWrite = process.stdout.write;
  let output = '';
  process.stdout.write = ((chunk: string) => {
    output += chunk;
    return true;
  }) as typeof process.stdout.write;

  try {
    outputJson({ ok: true, data: [1, 2, 3] });
    const parsed = JSON.parse(output.trim());
    assert.deepEqual(parsed, { ok: true, data: [1, 2, 3] });
  } finally {
    process.stdout.write = originalWrite;
  }
});

test('outputJson handles nested objects', () => {
  const originalWrite = process.stdout.write;
  let output = '';
  process.stdout.write = ((chunk: string) => {
    output += chunk;
    return true;
  }) as typeof process.stdout.write;

  try {
    outputJson({
      package: { name: 'test', version: '1.0.0' },
      results: [{ tool: 'claude-code', success: true }],
    });
    const parsed = JSON.parse(output.trim());
    assert.equal(parsed.package.name, 'test');
    assert.equal(parsed.results[0].tool, 'claude-code');
  } finally {
    process.stdout.write = originalWrite;
  }
});

test('setExitCode sets process.exitCode', () => {
  const original = process.exitCode;
  try {
    setExitCode(EXIT_CODES.NOT_FOUND);
    assert.equal(process.exitCode, 4);

    setExitCode(EXIT_CODES.SUCCESS);
    assert.equal(process.exitCode, 0);
  } finally {
    process.exitCode = original;
  }
});

test('EXIT_CODES re-exported from command-utils', () => {
  assert.equal(EXIT_CODES.SUCCESS, 0);
  assert.equal(EXIT_CODES.ERROR, 1);
});

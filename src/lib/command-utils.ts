import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { EXIT_CODES, mapApiErrorToExitCode } from './exit-codes.js';
import { stringifyError } from '../utils.js';

export type GlobalOptions = {
  json?: boolean;
  verbose?: boolean;
};

/**
 * Manages spinner state, eliminating null checks throughout commands.
 * In JSON mode, all operations are no-ops.
 */
export class SpinnerManager {
  private spinner: Ora | null;
  private isJson: boolean;

  constructor(message: string, isJson: boolean) {
    this.isJson = isJson;
    this.spinner = isJson ? null : ora(message).start();
  }

  text(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
    }
  }

  succeed(message: string): void {
    if (this.spinner) {
      this.spinner.succeed(chalk.green(message));
    }
  }

  fail(message: string): void {
    if (this.spinner) {
      this.spinner.fail(chalk.red(message));
    }
  }

  info(message: string): void {
    if (this.spinner) {
      this.spinner.info(message);
    }
  }
}

export interface CommandContext {
  spinner: SpinnerManager;
  json: boolean;
  verbose: boolean;
}

/**
 * Output JSON to stdout with consistent formatting.
 */
export function outputJson(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

/**
 * Set the process exit code without terminating.
 */
export function setExitCode(code: number): void {
  process.exitCode = code;
}

/**
 * Wraps a command handler with consistent error handling and spinner management.
 *
 * Usage:
 * ```ts
 * export const handler = withCommandContext(
 *   'Initial spinner message...',
 *   async (ctx, arg1, arg2, opts) => {
 *     ctx.spinner.text('Doing something...');
 *     // Command logic here - errors are auto-caught
 *   }
 * );
 * ```
 */
export function withCommandContext<TArgs extends unknown[]>(
  spinnerMessage: string,
  handler: (ctx: CommandContext, ...args: TArgs) => Promise<void>
): (...args: TArgs) => Promise<void> {
  return async (...args: TArgs) => {
    // Extract global options from the last argument if it's an object with parent
    // Commander passes options as the last argument
    const lastArg = args[args.length - 1];
    let globalOpts: GlobalOptions = {};

    if (lastArg && typeof lastArg === 'object' && 'parent' in lastArg) {
      const parent = (lastArg as { parent?: { opts?: () => GlobalOptions } }).parent;
      if (parent?.opts) {
        globalOpts = parent.opts();
      }
    }

    const json = globalOpts.json ?? false;
    const verbose = globalOpts.verbose ?? false;
    const spinner = new SpinnerManager(spinnerMessage, json);

    const ctx: CommandContext = { spinner, json, verbose };

    try {
      await handler(ctx, ...args);
    } catch (error) {
      spinner.fail(`Failed: ${stringifyError(error, verbose)}`);
      if (json) {
        outputJson({ ok: false, error: stringifyError(error, verbose) });
      }
      setExitCode(mapApiErrorToExitCode(error));
    }
  };
}

export { EXIT_CODES, mapApiErrorToExitCode };

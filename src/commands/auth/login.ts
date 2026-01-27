import chalk from 'chalk';
import type { Command } from 'commander';
import { FasterAPI } from '../../api.js';
import { getConfig, setAuthToken } from '../../config.js';
import { openBrowser, sleep, stringifyError } from '../../utils.js';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  EXIT_CODES,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

interface LoginOptions {
  browser: boolean;
}

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with faster.dev')
    .option('--no-browser', 'Do not open a browser automatically')
    .action(async (opts: LoginOptions) => {
      const globalOpts = program.opts<GlobalOptions>();
      const { json, verbose } = globalOpts;
      const spinner = new SpinnerManager('Starting device login...', json ?? false);

      try {
        const api = new FasterAPI(getConfig());
        const device = await api.requestDeviceAuth();

        spinner.stop();

        if (!json) {
          console.log();
          console.log(chalk.bold('Open the following URL in your browser:'));
          console.log(chalk.cyan(device.verification_url));
          console.log();
          console.log(chalk.bold('Enter this code:'));
          console.log(chalk.green(device.user_code));
          console.log();
        }

        if (!opts.browser) {
          if (!json) console.log(chalk.dim('Browser auto-open disabled.'));
        } else {
          const opened = openBrowser(device.verification_url);
          if (!opened && !json) {
            console.log(chalk.dim('Unable to open browser automatically.'));
          }
        }

        const pollIntervalMs = Math.max(1, device.interval) * 1000;
        const deadline = Date.now() + device.expires_in * 1000;

        const waitSpinner = new SpinnerManager('Waiting for approval...', json ?? false);

        while (Date.now() < deadline) {
          await sleep(pollIntervalMs);

          try {
            const status = await api.checkDeviceAuth(device.device_code);
            if (status.status === 'approved') {
              setAuthToken(status.token);
              waitSpinner.succeed('Logged in successfully');
              if (json) outputJson({ ok: true, user: status.user });
              return;
            }
          } catch (error) {
            waitSpinner.fail(`Login failed: ${stringifyError(error, verbose)}`);
            if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
            setExitCode(mapApiErrorToExitCode(error));
            return;
          }
        }

        waitSpinner.fail('Login timed out');
        if (json) outputJson({ ok: false, error: 'Login timed out' });
        setExitCode(EXIT_CODES.ERROR);
      } catch (error) {
        spinner.fail(`Login failed: ${stringifyError(error, verbose)}`);
        if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

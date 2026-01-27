import chalk from 'chalk';
import type { Command } from 'commander';
import { FasterAPI } from '../../api.js';
import { getConfig, getAuthToken, getConfigPath } from '../../config.js';
import { stringifyError } from '../../utils.js';
import {
  outputJson,
  setExitCode,
  EXIT_CODES,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

export function registerWhoamiCommand(program: Command): void {
  program
    .command('whoami')
    .description('Show current authentication status')
    .action(async () => {
      const { json, verbose } = program.opts<GlobalOptions>();
      const token = getAuthToken();

      if (!token) {
        if (json) {
          outputJson({ authenticated: false });
        } else {
          console.log(chalk.yellow('Not logged in'));
          console.log(chalk.dim('Run `faster login` to authenticate'));
        }
        setExitCode(EXIT_CODES.AUTH_REQUIRED);
        return;
      }

      try {
        const api = new FasterAPI(getConfig());
        const user = await api.me();
        if (json) {
          outputJson({ authenticated: true, user });
        } else {
          console.log(chalk.green('Authenticated with faster.dev'));
          console.log(chalk.dim(`Email: ${user.email}`));
          console.log(chalk.dim(`Config: ${getConfigPath()}`));
        }
      } catch (error) {
        if (json) {
          outputJson({ authenticated: false, error: stringifyError(error, verbose) });
        } else {
          console.log(chalk.red(`Auth check failed: ${stringifyError(error, verbose)}`));
        }
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

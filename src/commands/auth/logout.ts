import chalk from 'chalk';
import type { Command } from 'commander';
import { clearAuthToken } from '../../config.js';
import { outputJson, type GlobalOptions } from '../../lib/command-utils.js';

export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Log out from faster.dev')
    .action(() => {
      const { json } = program.opts<GlobalOptions>();
      clearAuthToken();
      if (json) {
        outputJson({ ok: true });
      } else {
        console.log(chalk.green('Logged out successfully'));
      }
    });
}

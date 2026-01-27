import chalk from 'chalk';
import type { Command } from 'commander';
import { FasterAPI } from '../../api.js';
import { getConfig } from '../../config.js';
import { stringifyError } from '../../utils.js';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

interface SearchOptions {
  type?: 'rule' | 'skill' | 'both';
}

export function registerSearchCommand(program: Command): void {
  program
    .command('search <query>')
    .description('Search for packages on faster.dev')
    .option('--type <type>', 'Filter by type: rule, skill, or both')
    .action(async (query: string, opts: SearchOptions) => {
      const { json, verbose } = program.opts<GlobalOptions>();
      const spinner = new SpinnerManager('Searching...', json ?? false);

      try {
        const api = new FasterAPI(getConfig());
        const results = await api.search(query, { type: opts.type });

        spinner.stop();

        if (results.length === 0) {
          if (json) {
            outputJson({ ok: true, results: [] });
          } else {
            console.log(chalk.yellow('No packages found'));
          }
          return;
        }

        if (json) {
          outputJson({ ok: true, results });
          return;
        }

        console.log();
        for (const pkg of results) {
          const typeColor = pkg.type === 'skill' ? chalk.blue : chalk.green;
          console.log(
            chalk.bold(pkg.name),
            typeColor(`[${pkg.type}]`),
            chalk.dim(`v${pkg.version}`)
          );
          console.log(chalk.dim(`  ${pkg.description}`));
          console.log();
        }
      } catch (error) {
        spinner.fail(`Search failed: ${stringifyError(error, verbose)}`);
        if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

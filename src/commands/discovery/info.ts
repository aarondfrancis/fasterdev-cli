import chalk from 'chalk';
import type { Command } from 'commander';
import { FasterAPI } from '../../api.js';
import { getConfig } from '../../config.js';
import { parsePackageSpec, stringifyError } from '../../utils.js';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

export function registerInfoCommand(program: Command): void {
  program
    .command('info <package>')
    .description('Show package details')
    .action(async (packageInput: string) => {
      const { json, verbose } = program.opts<GlobalOptions>();
      const { name: packageName } = parsePackageSpec(packageInput);

      const spinner = new SpinnerManager('Fetching package info...', json ?? false);

      try {
        const api = new FasterAPI(getConfig());
        const info = await api.getPackageInfo(packageName);

        spinner.stop();

        if (json) {
          outputJson({ ok: true, info });
          return;
        }

        console.log();
        console.log(chalk.bold(info.name));
        console.log(chalk.dim(info.description));
        console.log();
        console.log(`Type: ${info.type}`);
        console.log(`Latest: ${info.latestVersion}`);
        if (info.versions?.length) {
          console.log(`Versions: ${info.versions.join(', ')}`);
        }
        if (info.repository) console.log(`Repository: ${info.repository}`);
        if (info.homepage) console.log(`Homepage: ${info.homepage}`);
        if (info.keywords?.length) console.log(`Keywords: ${info.keywords.join(', ')}`);
        if (info.downloads !== undefined) console.log(`Downloads: ${info.downloads}`);
      } catch (error) {
        spinner.fail(`Info failed: ${stringifyError(error, verbose)}`);
        if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

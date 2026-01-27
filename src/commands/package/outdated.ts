import chalk from 'chalk';
import semver from 'semver';
import type { Command } from 'commander';
import { FasterAPI } from '../../api.js';
import { getConfig } from '../../config.js';
import { readRegistry, listInstalledPackages } from '../../registry.js';
import type { InstallType } from '../../types.js';
import { stringifyError } from '../../utils.js';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

interface OutdatedOptions {
  global?: boolean;
}

export function registerOutdatedCommand(program: Command): void {
  program
    .command('outdated')
    .description('List installed packages that have updates available')
    .option('-g, --global', 'Check global installations')
    .action(async (opts: OutdatedOptions) => {
      const { json, verbose } = program.opts<GlobalOptions>();
      const projectRoot = process.cwd();

      const spinner = new SpinnerManager('Checking for updates...', json ?? false);

      try {
        const registry = await readRegistry(projectRoot, opts.global ?? false);
        const installed = listInstalledPackages(registry).filter((p) => p.source === 'registry');

        if (installed.length === 0) {
          spinner.stop();
          if (json) {
            outputJson({ ok: true, updates: [] });
          } else {
            console.log(chalk.green('All packages are up to date'));
          }
          return;
        }

        const api = new FasterAPI(getConfig());
        const updates: Array<{
          name: string;
          current: string;
          latest: string;
          installType: InstallType;
        }> = [];

        for (const pkg of installed) {
          const info = await api.getPackageInfo(pkg.name);
          const latest = info.latestVersion;
          if (semver.valid(pkg.version) && semver.valid(latest) && semver.lt(pkg.version, latest)) {
            updates.push({
              name: pkg.name,
              current: pkg.version,
              latest,
              installType: pkg.installType,
            });
          }
        }

        spinner.stop();

        if (json) {
          outputJson({ ok: true, updates });
          return;
        }

        if (updates.length === 0) {
          console.log(chalk.green('All packages are up to date'));
          return;
        }

        console.log();
        for (const update of updates) {
          console.log(
            `  - ${chalk.bold(update.name)} (${update.installType}) ${chalk.dim(update.current)} → ${chalk.green(update.latest)}`
          );
        }
      } catch (error) {
        spinner.fail(`Outdated check failed: ${stringifyError(error, verbose)}`);
        if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

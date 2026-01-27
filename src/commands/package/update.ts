import chalk from 'chalk';
import semver from 'semver';
import type { Command } from 'commander';
import { FasterAPI } from '../../api.js';
import { getConfig } from '../../config.js';
import { installPackage } from '../../installer.js';
import {
  readRegistry,
  writeRegistry,
  listInstalledPackages,
  upsertInstalledPackage,
} from '../../registry.js';
import type { InstallOptions, InstallType, ToolId } from '../../types.js';
import { parsePackageSpec, resolveInstallType, stringifyError } from '../../utils.js';
import { resolveDetectedTools } from '../shared/package-helpers.js';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

interface UpdateOptions {
  global?: boolean;
  tools?: string;
  asSkill?: boolean;
  force?: boolean;
  dryRun?: boolean;
}

export function registerUpdateCommand(program: Command): void {
  program
    .command('update [package]')
    .description('Update installed packages to the latest version')
    .option('-g, --global', 'Update global installations')
    .option('-t, --tools <tools>', 'Comma-separated list of tools to install to')
    .option('--as-skill', 'Update as a skill (where supported)')
    .option('-f, --force', 'Overwrite existing installations')
    .option('--dry-run', 'Show what would be updated without making changes')
    .action(async (packageInput: string | undefined, opts: UpdateOptions) => {
      const { json, verbose } = program.opts<GlobalOptions>();
      const projectRoot = process.cwd();

      const spinner = new SpinnerManager('Resolving updates...', json ?? false);

      try {
        const registry = await readRegistry(projectRoot, opts.global ?? false);
        let installed = listInstalledPackages(registry).filter((p) => p.source === 'registry');

        if (packageInput) {
          const parsed = parsePackageSpec(packageInput);
          installed = installed.filter((p) => p.name === parsed.name);
        }

        if (installed.length === 0) {
          spinner.stop();
          if (json) {
            outputJson({ ok: true, updated: [] });
          } else {
            console.log(chalk.yellow('No matching installed packages to update'));
          }
          return;
        }

        const api = new FasterAPI(getConfig());
        const updated: Array<{ name: string; from: string; to: string; installType: InstallType }> =
          [];

        for (const pkg of installed) {
          const info = await api.getPackageInfo(pkg.name);
          const latest = info.latestVersion;
          const targetVersion = latest;

          if (!semver.valid(pkg.version) || !semver.valid(targetVersion)) {
            continue;
          }

          if (!semver.lt(pkg.version, targetVersion)) {
            continue;
          }

          const options: InstallOptions = {
            global: opts.global ?? false,
            tools: opts.tools ? (opts.tools.split(',') as ToolId[]) : pkg.tools,
            asSkill: opts.asSkill ?? pkg.installType === 'skill',
            force: opts.force ?? false,
            dryRun: opts.dryRun ?? false,
          };

          const detectedTools = await resolveDetectedTools(projectRoot, options);
          const downloaded = await api.downloadPackage(pkg.name, targetVersion);

          const results = await installPackage(downloaded, detectedTools, projectRoot, options);
          const successTools = results.filter((r) => r.success && !r.skipped).map((r) => r.tool);

          if (!options.dryRun && successTools.length > 0) {
            upsertInstalledPackage(registry, {
              name: downloaded.manifest.name,
              version: downloaded.manifest.version,
              installType: resolveInstallType(options.asSkill),
              tools: successTools,
              installedAt: new Date().toISOString(),
              source: 'registry',
            });
          }

          updated.push({
            name: pkg.name,
            from: pkg.version,
            to: targetVersion,
            installType: pkg.installType,
          });
        }

        if (!opts.dryRun) {
          await writeRegistry(projectRoot, opts.global ?? false, registry);
        }

        spinner.stop();

        if (json) {
          outputJson({ ok: true, updated });
          return;
        }

        if (updated.length === 0) {
          console.log(chalk.green('All packages are up to date'));
          return;
        }

        console.log();
        for (const update of updated) {
          console.log(
            `  ✓ ${chalk.bold(update.name)} (${update.installType}) ${chalk.dim(update.from)} → ${chalk.green(update.to)}`
          );
        }
      } catch (error) {
        spinner.fail(`Update failed: ${stringifyError(error, verbose)}`);
        if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

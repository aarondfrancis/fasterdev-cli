import chalk from 'chalk';
import type { Command } from 'commander';
import { detectTools } from '../../detector.js';
import { uninstallPackage } from '../../installer.js';
import {
  readRegistry,
  writeRegistry,
  removeInstalledPackage,
} from '../../registry.js';
import { parsePackageSpec, stringifyError } from '../../utils.js';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  EXIT_CODES,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

interface RemoveOptions {
  global?: boolean;
  dryRun?: boolean;
}

export function registerRemoveCommand(program: Command): void {
  program
    .command('remove <package>')
    .alias('uninstall')
    .description('Remove an installed skill or rule')
    .option('-g, --global', 'Remove from global installation')
    .option('--dry-run', 'Show what would be removed without making changes')
    .action(async (packageInput: string, opts: RemoveOptions) => {
      const { json, verbose } = program.opts<GlobalOptions>();
      const projectRoot = process.cwd();
      const { name: packageName } = parsePackageSpec(packageInput);

      const spinner = new SpinnerManager('Detecting tools...', json ?? false);

      try {
        const detectedTools = await detectTools(projectRoot);

        if (detectedTools.length === 0) {
          spinner.fail('No AI coding tools detected');
          if (json) outputJson({ ok: false, error: 'No AI coding tools detected' });
          setExitCode(EXIT_CODES.ERROR);
          return;
        }

        spinner.text(`Removing ${packageName}...`);

        const results = await uninstallPackage(packageName, detectedTools, projectRoot, {
          global: opts.global ?? false,
          dryRun: opts.dryRun ?? false,
        });

        spinner.stop();

        if (!opts.dryRun && results.length > 0) {
          const registry = await readRegistry(projectRoot, opts.global ?? false);
          removeInstalledPackage(registry, packageName);
          await writeRegistry(projectRoot, opts.global ?? false, registry);
        }

        if (results.length === 0) {
          if (json) {
            outputJson({ ok: false, error: `Package ${packageName} not found in any tool` });
          } else {
            console.log(chalk.yellow(`Package ${packageName} not found in any tool`));
          }
          setExitCode(EXIT_CODES.NOT_FOUND);
          return;
        }

        if (json) {
          outputJson({ ok: true, results });
          return;
        }

        console.log();
        for (const result of results) {
          if (result.success) {
            console.log(
              chalk.green('  ✓'),
              `Removed from ${result.toolName}:`,
              chalk.dim(result.path)
            );
          }
        }
      } catch (error) {
        spinner.fail(`Failed: ${stringifyError(error, verbose)}`);
        if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

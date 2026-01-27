import chalk from 'chalk';
import type { Command } from 'commander';
import { detectTools } from '../../detector.js';
import { listInstalled } from '../../installer.js';
import { readRegistry, listInstalledPackages } from '../../registry.js';
import { TOOL_CONFIGS } from '../../tools.js';
import { stringifyError } from '../../utils.js';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

interface ListOptions {
  global?: boolean;
}

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('List installed skills and rules')
    .option('-g, --global', 'List global installations')
    .action(async (opts: ListOptions) => {
      const { json, verbose } = program.opts<GlobalOptions>();
      const projectRoot = process.cwd();

      const spinner = new SpinnerManager('Detecting tools...', json ?? false);

      try {
        const detectedTools = await detectTools(projectRoot);

        if (detectedTools.length === 0) {
          spinner.info('No AI coding tools detected');
          if (json) outputJson({ ok: true, tools: {} });
          return;
        }

        const installed = await listInstalled(detectedTools, projectRoot, {
          global: opts.global ?? false,
        });

        spinner.stop();

        const registry = await readRegistry(projectRoot, opts.global ?? false);
        const registryPackages = listInstalledPackages(registry);

        if (installed.size === 0) {
          if (json) {
            outputJson({ ok: true, tools: {}, registry: registryPackages });
          } else {
            console.log(chalk.yellow('No packages installed'));
          }
          return;
        }

        if (json) {
          const tools: Record<string, { rules: string[]; skills: string[] }> = {};
          for (const [toolId, packages] of installed) {
            tools[toolId] = packages;
          }
          outputJson({ ok: true, tools, registry: registryPackages });
          return;
        }

        console.log();
        for (const [toolId, packages] of installed) {
          const config = TOOL_CONFIGS[toolId];
          console.log(chalk.bold(config.name));

          if (packages.rules.length > 0) {
            console.log(chalk.dim('  Rules:'));
            for (const rule of packages.rules) {
              console.log(`    - ${rule}`);
            }
          }

          if (packages.skills.length > 0) {
            console.log(chalk.dim('  Skills:'));
            for (const skill of packages.skills) {
              console.log(`    - ${skill}`);
            }
          }
          console.log();
        }
      } catch (error) {
        spinner.fail(`Failed: ${stringifyError(error, verbose)}`);
        if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

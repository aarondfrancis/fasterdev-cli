import chalk from 'chalk';
import type { Command } from 'commander';
import { detectTools, formatDetectedTools, getSkillTools } from '../../detector.js';
import { stringifyError } from '../../utils.js';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

export function registerDetectCommand(program: Command): void {
  program
    .command('detect')
    .description('Show detected AI coding tools')
    .action(async () => {
      const { json, verbose } = program.opts<GlobalOptions>();
      const projectRoot = process.cwd();

      const spinner = new SpinnerManager('Detecting tools...', json ?? false);

      try {
        const detectedTools = await detectTools(projectRoot);
        spinner.stop();

        if (json) {
          outputJson({ ok: true, detected: detectedTools.map((t) => t.config.id) });
          return;
        }

        console.log();
        console.log(formatDetectedTools(detectedTools));
        console.log();

        if (detectedTools.length > 0) {
          const skillTools = getSkillTools(detectedTools);
          if (skillTools.length > 0) {
            console.log(chalk.dim('Tools supporting skills:'));
            for (const tool of skillTools) {
              console.log(chalk.dim(`  - ${tool.config.name}`));
            }
          }
        }
      } catch (error) {
        spinner.fail(`Detection failed: ${stringifyError(error, verbose)}`);
        if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

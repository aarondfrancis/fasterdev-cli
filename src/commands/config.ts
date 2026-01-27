import chalk from 'chalk';
import type { Command } from 'commander';
import {
  getConfig,
  getConfigPath,
  setDefaultTools,
  setApiUrl,
} from '../config.js';
import { TOOL_CONFIGS } from '../tools.js';
import type { ToolId } from '../types.js';
import {
  outputJson,
  setExitCode,
  EXIT_CODES,
  type GlobalOptions,
} from '../lib/command-utils.js';

interface ConfigOptions {
  setTools?: string;
  clearTools?: boolean;
  setApiUrl?: string;
  path?: boolean;
}

export function registerConfigCommand(program: Command): void {
  program
    .command('config')
    .description('Manage CLI configuration')
    .option('--set-tools <tools>', 'Set default tools (comma-separated)')
    .option('--clear-tools', 'Clear default tools')
    .option('--set-api-url <url>', 'Set API base URL')
    .option('--path', 'Show config file path')
    .action((opts: ConfigOptions) => {
      const { json } = program.opts<GlobalOptions>();

      if (opts.path) {
        if (json) outputJson({ path: getConfigPath() });
        else console.log(getConfigPath());
        return;
      }

      if (opts.setApiUrl) {
        setApiUrl(opts.setApiUrl);
        if (json) outputJson({ ok: true, apiUrl: opts.setApiUrl });
        else console.log(chalk.green(`API URL set: ${opts.setApiUrl}`));
        return;
      }

      if (opts.setTools) {
        const tools = opts.setTools.split(',') as ToolId[];
        // Validate tools
        for (const tool of tools) {
          if (!TOOL_CONFIGS[tool]) {
            if (json) {
              outputJson({ ok: false, error: `Unknown tool: ${tool}` });
            } else {
              console.log(chalk.red(`Unknown tool: ${tool}`));
              console.log(chalk.dim(`Available: ${Object.keys(TOOL_CONFIGS).join(', ')}`));
            }
            setExitCode(EXIT_CODES.INVALID_ARGS);
            return;
          }
        }
        setDefaultTools(tools);
        if (json) outputJson({ ok: true, defaultTools: tools });
        else console.log(chalk.green(`Default tools set: ${tools.join(', ')}`));
        return;
      }

      if (opts.clearTools) {
        setDefaultTools([]);
        if (json) outputJson({ ok: true, defaultTools: [] });
        else console.log(chalk.green('Default tools cleared'));
        return;
      }

      // Show current config
      const config = getConfig();
      if (json) {
        outputJson({
          apiUrl: config.apiUrl,
          authenticated: Boolean(config.authToken),
          defaultTools: config.defaultTools ?? null,
          configPath: getConfigPath(),
        });
        return;
      }

      console.log();
      console.log(chalk.bold('Configuration:'));
      console.log(`  API URL: ${config.apiUrl}`);
      console.log(`  Authenticated: ${config.authToken ? chalk.green('Yes') : chalk.yellow('No')}`);
      console.log(`  Default tools: ${config.defaultTools?.join(', ') || chalk.dim('(all detected)')}`);
      console.log(`  Config path: ${chalk.dim(getConfigPath())}`);
    });
}

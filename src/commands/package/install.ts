import chalk from 'chalk';
import type { Command } from 'commander';
import { FasterAPI } from '../../api.js';
import { getConfig, getDefaultTools } from '../../config.js';
import { installPackage, type InstallResult } from '../../installer.js';
import {
  readRegistry,
  writeRegistry,
  upsertInstalledPackage,
} from '../../registry.js';
import type { InstallOptions, Package, ToolId } from '../../types.js';
import { parsePackageSpec, resolveInstallType, stringifyError } from '../../utils.js';
import { resolveDetectedTools } from '../shared/package-helpers.js';
import {
  SpinnerManager,
  outputJson,
  setExitCode,
  EXIT_CODES,
  mapApiErrorToExitCode,
  type GlobalOptions,
} from '../../lib/command-utils.js';

interface InstallCommandOptions {
  global?: boolean;
  tools?: string;
  asSkill?: boolean;
  force?: boolean;
  dryRun?: boolean;
  fromFile?: string;
}

export function registerInstallCommand(program: Command): void {
  program
    .command('install <package>')
    .alias('add')
    .description('Install a skill or rule from faster.dev')
    .option('-g, --global', 'Install globally instead of to project')
    .option('-t, --tools <tools>', 'Comma-separated list of tools to install to')
    .option('--as-skill', 'Install as a skill (where supported)')
    .option('-f, --force', 'Overwrite existing installations')
    .option('--dry-run', 'Show what would be installed without making changes')
    .option('--from-file <path>', 'Install from a local package directory')
    .action(async (packageInput: string, opts: InstallCommandOptions) => {
      const { json, verbose } = program.opts<GlobalOptions>();
      const projectRoot = process.cwd();
      const { name: packageName, version } = parsePackageSpec(packageInput);

      const options: InstallOptions = {
        global: opts.global ?? false,
        tools: opts.tools ? (opts.tools.split(',') as ToolId[]) : undefined,
        asSkill: opts.asSkill ?? false,
        force: opts.force ?? false,
        dryRun: opts.dryRun ?? false,
      };

      const defaultTools = getDefaultTools();
      const spinner = new SpinnerManager('Detecting tools...', json ?? false);

      try {
        const detectedTools = await resolveDetectedTools(projectRoot, options, defaultTools);

        spinner.text(`Fetching package: ${packageName}...`);

        let pkg: Package;
        const isLocal = Boolean(opts.fromFile);

        if (opts.fromFile) {
          pkg = await loadLocalPackage(opts.fromFile);
        } else {
          const api = new FasterAPI(getConfig());
          pkg = await api.downloadPackage(packageName, version);
        }

        spinner.text(`Installing ${pkg.manifest.name}...`);

        const results = await installPackage(pkg, detectedTools, projectRoot, options);

        spinner.stop();

        const installType = resolveInstallType(options.asSkill);
        const successTools = results
          .filter((r) => r.success && !r.skipped)
          .map((r) => r.tool);

        if (!options.dryRun && successTools.length > 0) {
          const registry = await readRegistry(projectRoot, options.global);
          upsertInstalledPackage(registry, {
            name: pkg.manifest.name,
            version: pkg.manifest.version,
            installType,
            tools: successTools,
            installedAt: new Date().toISOString(),
            source: isLocal ? 'local' : 'registry',
            localPath: isLocal ? opts.fromFile : undefined,
          });
          await writeRegistry(projectRoot, options.global, registry);
        }

        if (json) {
          outputJson({
            package: pkg.manifest,
            results,
          });
          return;
        }

        printInstallResults(pkg, results);
      } catch (error) {
        spinner.fail(`Failed: ${stringifyError(error, verbose)}`);
        if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
        setExitCode(mapApiErrorToExitCode(error));
      }
    });
}

function printInstallResults(pkg: Package, results: InstallResult[]): void {
  console.log();
  console.log(chalk.bold(`📦 ${pkg.manifest.name} v${pkg.manifest.version}`));
  console.log(chalk.dim(pkg.manifest.description));
  console.log();

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const result of results) {
    if (result.success && !result.skipped) {
      successCount++;
      console.log(
        chalk.green('  ✓'),
        chalk.bold(result.toolName),
        chalk.dim(`→ ${result.path}`)
      );
    } else if (result.skipped) {
      skipCount++;
      console.log(
        chalk.yellow('  ⊘'),
        chalk.bold(result.toolName),
        chalk.dim(`(${result.skipReason})`)
      );
    } else {
      errorCount++;
      console.log(
        chalk.red('  ✗'),
        chalk.bold(result.toolName),
        chalk.dim(`(${result.error})`)
      );
    }
  }

  console.log();
  if (successCount > 0) {
    console.log(chalk.green(`Installed to ${successCount} tool(s)`));
  }
  if (skipCount > 0) {
    console.log(chalk.yellow(`Skipped ${skipCount} tool(s)`));
  }
  if (errorCount > 0) {
    console.log(chalk.red(`Failed for ${errorCount} tool(s)`));
    setExitCode(EXIT_CODES.ERROR);
  }
}

import fs from 'fs/promises';
import path from 'path';
import type { PackageManifest } from '../../types.js';

async function loadLocalPackage(dir: string): Promise<Package> {
  const files: Array<{ path: string; content: string }> = [];

  // Read manifest
  const manifestPath = path.join(dir, 'manifest.json');
  const manifestContent = await fs.readFile(manifestPath, 'utf-8');
  files.push({ path: 'manifest.json', content: manifestContent });

  const manifest: PackageManifest = JSON.parse(manifestContent);

  // Read other files
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name !== 'manifest.json') {
      if (
        entry.name.endsWith('.md') ||
        entry.name.endsWith('.mdc') ||
        entry.name.endsWith('.txt')
      ) {
        const content = await fs.readFile(path.join(dir, entry.name), 'utf-8');
        files.push({ path: entry.name, content });
      }
    }
  }

  // Check for assets directory
  const assetsDir = path.join(dir, 'assets');
  try {
    const assetEntries = await fs.readdir(assetsDir, { withFileTypes: true });
    for (const entry of assetEntries) {
      if (entry.isFile()) {
        const content = await fs.readFile(path.join(assetsDir, entry.name), 'utf-8');
        files.push({ path: `assets/${entry.name}`, content });
      }
    }
  } catch {
    // No assets directory
  }

  return { manifest, files };
}

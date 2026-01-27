#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import path from 'path';
import fs from 'fs/promises';

import { detectTools, formatDetectedTools, filterTools, getSkillTools } from './detector.js';
import { installPackage, uninstallPackage, listInstalled } from './installer.js';
import { FasterAPI, validateManifest } from './api.js';
import {
  getConfig,
  setApiKey,
  clearApiKey,
  getApiKey,
  getConfigPath,
  setDefaultTools,
  getDefaultTools,
} from './config.js';
import type { ToolId, Package, PackageManifest, InstallOptions } from './types.js';
import { TOOL_CONFIGS, SKILL_TOOLS } from './tools.js';

const program = new Command();

program
  .name('faster')
  .description('Install AI coding assistant skills and rules from faster.dev')
  .version('0.1.0');

// ============================================================================
// AUTH COMMANDS
// ============================================================================

program
  .command('login')
  .description('Authenticate with faster.dev')
  .action(async () => {
    const response = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Email:',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
      },
    ]);

    if (!response.email || !response.password) {
      console.log(chalk.red('Login cancelled'));
      return;
    }

    const spinner = ora('Authenticating...').start();

    try {
      const api = new FasterAPI(getConfig());
      const auth = await api.login(response.email, response.password);
      setApiKey(auth.apiKey);
      spinner.succeed(chalk.green('Logged in successfully'));
    } catch (error) {
      spinner.fail(chalk.red(`Login failed: ${error instanceof Error ? error.message : error}`));
    }
  });

program
  .command('logout')
  .description('Log out from faster.dev')
  .action(() => {
    clearApiKey();
    console.log(chalk.green('Logged out successfully'));
  });

program
  .command('whoami')
  .description('Show current authentication status')
  .action(() => {
    const apiKey = getApiKey();
    if (apiKey) {
      console.log(chalk.green('Authenticated with faster.dev'));
      console.log(chalk.dim(`Config: ${getConfigPath()}`));
    } else {
      console.log(chalk.yellow('Not logged in'));
      console.log(chalk.dim('Run `faster login` to authenticate'));
    }
  });

// ============================================================================
// INSTALL COMMAND
// ============================================================================

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
  .action(async (packageName: string, opts) => {
    const projectRoot = process.cwd();

    // Parse options
    const options: InstallOptions = {
      global: opts.global ?? false,
      tools: opts.tools ? (opts.tools.split(',') as ToolId[]) : undefined,
      asSkill: opts.asSkill ?? false,
      force: opts.force ?? false,
      dryRun: opts.dryRun ?? false,
    };

    const spinner = ora('Detecting tools...').start();

    try {
      // Detect available tools
      let detectedTools = await detectTools(projectRoot);

      if (detectedTools.length === 0) {
        spinner.info('No AI coding tools detected. Creating directories for common tools...');
        // Even without detection, we can still install to default locations
        detectedTools = Object.values(TOOL_CONFIGS).map((config) => ({
          config,
          projectPath: path.join(projectRoot, config.rules.projectPath),
          globalPath: config.rules.globalPath,
        }));
      }

      // Filter to specified tools if provided
      if (options.tools) {
        detectedTools = filterTools(detectedTools, options.tools);
        if (detectedTools.length === 0) {
          spinner.fail(chalk.red(`None of the specified tools were found: ${options.tools.join(', ')}`));
          return;
        }
      }

      // If installing as skill, filter to tools that support skills
      if (options.asSkill) {
        detectedTools = getSkillTools(detectedTools);
        if (detectedTools.length === 0) {
          spinner.fail(chalk.red('No detected tools support skills'));
          return;
        }
      }

      spinner.text = `Fetching package: ${packageName}...`;

      // Get package
      let pkg: Package;

      if (opts.fromFile) {
        // Load from local directory
        pkg = await loadLocalPackage(opts.fromFile);
      } else {
        // Download from faster.dev
        const api = new FasterAPI(getConfig());
        pkg = await api.downloadPackage(packageName);
      }

      spinner.text = `Installing ${pkg.manifest.name}...`;

      // Install
      const results = await installPackage(pkg, detectedTools, projectRoot, options);

      spinner.stop();

      // Report results
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
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${error instanceof Error ? error.message : error}`));
    }
  });

// ============================================================================
// REMOVE COMMAND
// ============================================================================

program
  .command('remove <package>')
  .alias('uninstall')
  .description('Remove an installed skill or rule')
  .option('-g, --global', 'Remove from global installation')
  .option('--dry-run', 'Show what would be removed without making changes')
  .action(async (packageName: string, opts) => {
    const projectRoot = process.cwd();

    const spinner = ora('Detecting tools...').start();

    try {
      const detectedTools = await detectTools(projectRoot);

      if (detectedTools.length === 0) {
        spinner.fail(chalk.red('No AI coding tools detected'));
        return;
      }

      spinner.text = `Removing ${packageName}...`;

      const results = await uninstallPackage(packageName, detectedTools, projectRoot, {
        global: opts.global ?? false,
        dryRun: opts.dryRun ?? false,
      });

      spinner.stop();

      if (results.length === 0) {
        console.log(chalk.yellow(`Package ${packageName} not found in any tool`));
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
      spinner.fail(chalk.red(`Failed: ${error instanceof Error ? error.message : error}`));
    }
  });

// ============================================================================
// LIST COMMAND
// ============================================================================

program
  .command('list')
  .alias('ls')
  .description('List installed skills and rules')
  .option('-g, --global', 'List global installations')
  .action(async (opts) => {
    const projectRoot = process.cwd();

    const spinner = ora('Detecting tools...').start();

    try {
      const detectedTools = await detectTools(projectRoot);

      if (detectedTools.length === 0) {
        spinner.info('No AI coding tools detected');
        return;
      }

      const installed = await listInstalled(detectedTools, projectRoot, {
        global: opts.global ?? false,
      });

      spinner.stop();

      if (installed.size === 0) {
        console.log(chalk.yellow('No packages installed'));
        return;
      }

      console.log();
      for (const [toolId, packages] of installed) {
        const config = TOOL_CONFIGS[toolId];
        console.log(chalk.bold(config.name));

        if (packages.rules.length > 0) {
          console.log(chalk.dim('  Rules:'));
          for (const rule of packages.rules) {
            console.log(`    • ${rule}`);
          }
        }

        if (packages.skills.length > 0) {
          console.log(chalk.dim('  Skills:'));
          for (const skill of packages.skills) {
            console.log(`    • ${skill}`);
          }
        }
        console.log();
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${error instanceof Error ? error.message : error}`));
    }
  });

// ============================================================================
// SEARCH COMMAND
// ============================================================================

program
  .command('search <query>')
  .description('Search for packages on faster.dev')
  .option('--type <type>', 'Filter by type: rule, skill, or both')
  .action(async (query: string, opts) => {
    const spinner = ora('Searching...').start();

    try {
      const api = new FasterAPI(getConfig());
      const results = await api.search(query);

      spinner.stop();

      if (results.length === 0) {
        console.log(chalk.yellow('No packages found'));
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
      spinner.fail(chalk.red(`Search failed: ${error instanceof Error ? error.message : error}`));
    }
  });

// ============================================================================
// DETECT COMMAND
// ============================================================================

program
  .command('detect')
  .description('Show detected AI coding tools')
  .action(async () => {
    const projectRoot = process.cwd();

    const spinner = ora('Detecting tools...').start();

    try {
      const detectedTools = await detectTools(projectRoot);
      spinner.stop();

      console.log();
      console.log(formatDetectedTools(detectedTools));
      console.log();

      if (detectedTools.length > 0) {
        const skillTools = getSkillTools(detectedTools);
        if (skillTools.length > 0) {
          console.log(chalk.dim('Tools supporting skills:'));
          for (const tool of skillTools) {
            console.log(chalk.dim(`  • ${tool.config.name}`));
          }
        }
      }
    } catch (error) {
      spinner.fail(chalk.red(`Detection failed: ${error instanceof Error ? error.message : error}`));
    }
  });

// ============================================================================
// CONFIG COMMAND
// ============================================================================

program
  .command('config')
  .description('Manage CLI configuration')
  .option('--set-tools <tools>', 'Set default tools (comma-separated)')
  .option('--clear-tools', 'Clear default tools')
  .option('--path', 'Show config file path')
  .action((opts) => {
    if (opts.path) {
      console.log(getConfigPath());
      return;
    }

    if (opts.setTools) {
      const tools = opts.setTools.split(',') as ToolId[];
      // Validate tools
      for (const tool of tools) {
        if (!TOOL_CONFIGS[tool]) {
          console.log(chalk.red(`Unknown tool: ${tool}`));
          console.log(chalk.dim(`Available: ${Object.keys(TOOL_CONFIGS).join(', ')}`));
          return;
        }
      }
      setDefaultTools(tools);
      console.log(chalk.green(`Default tools set: ${tools.join(', ')}`));
      return;
    }

    if (opts.clearTools) {
      setDefaultTools([]);
      console.log(chalk.green('Default tools cleared'));
      return;
    }

    // Show current config
    const config = getConfig();
    console.log();
    console.log(chalk.bold('Configuration:'));
    console.log(`  API URL: ${config.apiUrl}`);
    console.log(`  Authenticated: ${config.apiKey ? chalk.green('Yes') : chalk.yellow('No')}`);
    console.log(`  Default tools: ${config.defaultTools?.join(', ') || chalk.dim('(all detected)')}`);
    console.log(`  Config path: ${chalk.dim(getConfigPath())}`);
  });

// ============================================================================
// INIT COMMAND
// ============================================================================

program
  .command('init')
  .description('Initialize faster.dev package in current directory')
  .action(async () => {
    const cwd = process.cwd();
    const manifestPath = path.join(cwd, 'manifest.json');

    // Check if manifest already exists
    try {
      await fs.access(manifestPath);
      console.log(chalk.yellow('manifest.json already exists'));
      return;
    } catch {
      // File doesn't exist, continue
    }

    const response = await prompts([
      {
        type: 'text',
        name: 'name',
        message: 'Package name:',
        initial: path.basename(cwd),
      },
      {
        type: 'text',
        name: 'description',
        message: 'Description:',
      },
      {
        type: 'select',
        name: 'type',
        message: 'Package type:',
        choices: [
          { title: 'Rule', value: 'rule' },
          { title: 'Skill', value: 'skill' },
          { title: 'Both', value: 'both' },
        ],
      },
    ]);

    if (!response.name) {
      console.log(chalk.red('Cancelled'));
      return;
    }

    const allTools = Object.keys(TOOL_CONFIGS) as ToolId[];
    const skillTools = SKILL_TOOLS;

    const manifest: PackageManifest = {
      name: response.name,
      version: '1.0.0',
      type: response.type,
      description: response.description || '',
      compatibility: {
        rules: allTools,
        ...(response.type !== 'rule' && { skills: skillTools }),
      },
    };

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(chalk.green('Created manifest.json'));

    // Create template files
    if (response.type === 'rule' || response.type === 'both') {
      const rulePath = path.join(cwd, 'rule.md');
      try {
        await fs.access(rulePath);
      } catch {
        await fs.writeFile(
          rulePath,
          `---
name: ${response.name}
description: ${response.description || 'Add description'}
---

# ${response.name}

Add your rule content here.
`
        );
        console.log(chalk.green('Created rule.md'));
      }
    }

    if (response.type === 'skill' || response.type === 'both') {
      const skillPath = path.join(cwd, 'SKILL.md');
      try {
        await fs.access(skillPath);
      } catch {
        await fs.writeFile(
          skillPath,
          `---
name: ${response.name}
description: ${response.description || 'Add description'}
---

# ${response.name}

Add your skill instructions here.
`
        );
        console.log(chalk.green('Created SKILL.md'));
      }
    }

    console.log();
    console.log(chalk.dim('Next steps:'));
    console.log(chalk.dim('  1. Edit rule.md and/or SKILL.md with your content'));
    console.log(chalk.dim('  2. Run `faster install . --from-file` to test locally'));
    console.log(chalk.dim('  3. Run `faster publish` to publish to faster.dev'));
  });

// ============================================================================
// PUBLISH COMMAND
// ============================================================================

program
  .command('publish')
  .description('Publish package to faster.dev')
  .option('--dry-run', 'Validate package without publishing')
  .action(async (opts) => {
    const cwd = process.cwd();

    const spinner = ora('Loading package...').start();

    try {
      const pkg = await loadLocalPackage(cwd);

      if (!validateManifest(pkg.manifest)) {
        spinner.fail(chalk.red('Invalid manifest.json'));
        return;
      }

      spinner.text = 'Validating package...';

      // Check for required files
      const hasRule = pkg.files.some((f) => f.path === 'rule.md');
      const hasSkill = pkg.files.some((f) => f.path === 'SKILL.md');

      if (pkg.manifest.type === 'rule' && !hasRule) {
        spinner.fail(chalk.red('Package type is "rule" but rule.md is missing'));
        return;
      }

      if (pkg.manifest.type === 'skill' && !hasSkill) {
        spinner.fail(chalk.red('Package type is "skill" but SKILL.md is missing'));
        return;
      }

      if (pkg.manifest.type === 'both' && (!hasRule || !hasSkill)) {
        spinner.fail(chalk.red('Package type is "both" but missing rule.md or SKILL.md'));
        return;
      }

      if (opts.dryRun) {
        spinner.succeed(chalk.green('Package is valid'));
        console.log();
        console.log(chalk.bold('Package contents:'));
        for (const file of pkg.files) {
          console.log(`  • ${file.path}`);
        }
        return;
      }

      // Check auth
      if (!getApiKey()) {
        spinner.fail(chalk.red('Not authenticated. Run `faster login` first.'));
        return;
      }

      spinner.text = 'Publishing...';

      const api = new FasterAPI(getConfig());
      const result = await api.publishPackage(pkg);

      spinner.succeed(chalk.green(`Published ${result.name}@${result.version}`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${error instanceof Error ? error.message : error}`));
    }
  });

// ============================================================================
// HELPERS
// ============================================================================

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
      // Only include relevant files
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

// Parse and run
program.parse();

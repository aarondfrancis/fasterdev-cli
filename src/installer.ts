import fs from 'fs/promises';
import path from 'path';
import type { DetectedTool, Package, InstallOptions, ToolId } from './types.js';
import { convertToToolFormat, toAiderConfigEntry, parseFrontmatter } from './converter.js';
import YAML from 'yaml';

export interface InstallResult {
  tool: ToolId;
  toolName: string;
  type: 'rule' | 'skill';
  path: string;
  success: boolean;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Ensure a directory exists
 */
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Check if a file exists
 */
async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read file contents or return null
 */
async function readFile(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Install a package to all detected tools
 */
export async function installPackage(
  pkg: Package,
  detectedTools: DetectedTool[],
  projectRoot: string,
  options: InstallOptions
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];

  // Find the main content file (rule.md or SKILL.md)
  const ruleFile = pkg.files.find(
    (f) => f.path === 'rule.md' || f.path.endsWith('/rule.md')
  );
  const skillFile = pkg.files.find(
    (f) => f.path === 'SKILL.md' || f.path.endsWith('/SKILL.md')
  );

  // Determine what to install
  const installAsSkill = options.asSkill && skillFile;
  const mainContent = installAsSkill ? skillFile?.content : ruleFile?.content;

  if (!mainContent) {
    throw new Error(`Package ${pkg.manifest.name} has no installable content`);
  }

  for (const tool of detectedTools) {
    const toolId = tool.config.id;
    const manifest = pkg.manifest;

    // Check if tool is compatible
    if (installAsSkill) {
      if (!manifest.compatibility.skills?.includes(toolId)) {
        results.push({
          tool: toolId,
          toolName: tool.config.name,
          type: 'skill',
          path: '',
          success: false,
          skipped: true,
          skipReason: 'Skills not supported by this tool',
        });
        continue;
      }
      if (!tool.config.skills) {
        results.push({
          tool: toolId,
          toolName: tool.config.name,
          type: 'skill',
          path: '',
          success: false,
          skipped: true,
          skipReason: 'Tool does not support skills',
        });
        continue;
      }
    } else {
      if (!manifest.compatibility.rules?.includes(toolId)) {
        results.push({
          tool: toolId,
          toolName: tool.config.name,
          type: 'rule',
          path: '',
          success: false,
          skipped: true,
          skipReason: 'Tool not in compatibility list',
        });
        continue;
      }
    }

    // Check for tool-specific override file
    const override = manifest.install?.[toolId];
    if (override?.disabled) {
      results.push({
        tool: toolId,
        toolName: tool.config.name,
        type: installAsSkill ? 'skill' : 'rule',
        path: '',
        success: false,
        skipped: true,
        skipReason: 'Disabled for this tool',
      });
      continue;
    }

    // Get the content to install (check for tool-specific override file)
    let content = mainContent;
    if (override?.file) {
      const overrideFile = pkg.files.find((f) => f.path === override.file);
      if (overrideFile) {
        content = overrideFile.content;
      }
    }

    try {
      let result: InstallResult;

      if (installAsSkill) {
        result = await installSkill(
          pkg,
          tool,
          content,
          projectRoot,
          options
        );
      } else {
        result = await installRule(
          pkg,
          tool,
          content,
          projectRoot,
          options
        );
      }

      results.push(result);
    } catch (error) {
      results.push({
        tool: toolId,
        toolName: tool.config.name,
        type: installAsSkill ? 'skill' : 'rule',
        path: '',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

/**
 * Install a rule to a specific tool
 */
async function installRule(
  pkg: Package,
  tool: DetectedTool,
  content: string,
  projectRoot: string,
  options: InstallOptions
): Promise<InstallResult> {
  const toolId = tool.config.id;
  const rulesConfig = tool.config.rules;

  // Determine target path
  const basePath = options.global
    ? rulesConfig.globalPath
    : path.join(projectRoot, rulesConfig.projectPath);

  // Handle special install actions
  const override = pkg.manifest.install?.[toolId];
  if (override?.action) {
    return handleSpecialAction(pkg, tool, content, projectRoot, options, override.action);
  }

  // Convert content to tool's format
  const convertedContent = convertToToolFormat(content, tool.config, pkg.manifest.name);

  // Determine filename
  const filename = `${pkg.manifest.name}${rulesConfig.fileExtension}`;
  const targetPath = path.join(basePath, filename);

  // Check if file exists
  if (!options.force && await fileExists(targetPath)) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: 'rule',
      path: targetPath,
      success: false,
      skipped: true,
      skipReason: 'File already exists (use --force to overwrite)',
    };
  }

  if (options.dryRun) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: 'rule',
      path: targetPath,
      success: true,
      skipped: true,
      skipReason: 'Dry run',
    };
  }

  // Write file
  await ensureDir(basePath);
  await fs.writeFile(targetPath, convertedContent, 'utf-8');

  return {
    tool: toolId,
    toolName: tool.config.name,
    type: 'rule',
    path: targetPath,
    success: true,
  };
}

/**
 * Install a skill to a specific tool
 */
async function installSkill(
  pkg: Package,
  tool: DetectedTool,
  content: string,
  projectRoot: string,
  options: InstallOptions
): Promise<InstallResult> {
  const toolId = tool.config.id;
  const skillsConfig = tool.config.skills;

  if (!skillsConfig) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: 'skill',
      path: '',
      success: false,
      skipped: true,
      skipReason: 'Tool does not support skills',
    };
  }

  // Determine target path
  const basePath = options.global
    ? skillsConfig.globalPath
    : path.join(projectRoot, skillsConfig.projectPath);

  const skillDir = path.join(basePath, pkg.manifest.name);
  const skillPath = path.join(skillDir, 'SKILL.md');

  // Check if skill exists
  if (!options.force && await fileExists(skillPath)) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: 'skill',
      path: skillPath,
      success: false,
      skipped: true,
      skipReason: 'Skill already exists (use --force to overwrite)',
    };
  }

  if (options.dryRun) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: 'skill',
      path: skillPath,
      success: true,
      skipped: true,
      skipReason: 'Dry run',
    };
  }

  // Create skill directory and write SKILL.md
  await ensureDir(skillDir);
  await fs.writeFile(skillPath, content, 'utf-8');

  // Copy any additional files from the package
  for (const file of pkg.files) {
    if (file.path !== 'SKILL.md' && file.path !== 'rule.md' && file.path !== 'manifest.json') {
      const targetFile = path.join(skillDir, file.path);
      await ensureDir(path.dirname(targetFile));
      await fs.writeFile(targetFile, file.content, 'utf-8');
    }
  }

  return {
    tool: toolId,
    toolName: tool.config.name,
    type: 'skill',
    path: skillPath,
    success: true,
  };
}

/**
 * Handle special installation actions (append to files, modify configs)
 */
async function handleSpecialAction(
  pkg: Package,
  tool: DetectedTool,
  content: string,
  projectRoot: string,
  options: InstallOptions,
  action: string
): Promise<InstallResult> {
  const toolId = tool.config.id;
  const { body } = parseFrontmatter(content);

  switch (action) {
    case 'append-to-agents-md': {
      const agentsPath = options.global
        ? path.join(tool.config.rules.globalPath, 'AGENTS.md')
        : path.join(projectRoot, 'AGENTS.md');

      if (options.dryRun) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: 'rule',
          path: agentsPath,
          success: true,
          skipped: true,
          skipReason: 'Dry run - would append to AGENTS.md',
        };
      }

      const existing = await readFile(agentsPath) || '';
      const section = `\n## ${pkg.manifest.name}\n\n${body}\n`;

      // Check if section already exists
      if (existing.includes(`## ${pkg.manifest.name}`)) {
        if (!options.force) {
          return {
            tool: toolId,
            toolName: tool.config.name,
            type: 'rule',
            path: agentsPath,
            success: false,
            skipped: true,
            skipReason: 'Section already exists in AGENTS.md',
          };
        }
        // Remove existing section and re-add
        const regex = new RegExp(`\n## ${pkg.manifest.name}\n[\\s\\S]*?(?=\n## |$)`, 'g');
        const updated = existing.replace(regex, '') + section;
        await fs.writeFile(agentsPath, updated, 'utf-8');
      } else {
        await fs.writeFile(agentsPath, existing + section, 'utf-8');
      }

      return {
        tool: toolId,
        toolName: tool.config.name,
        type: 'rule',
        path: agentsPath,
        success: true,
      };
    }

    case 'append-to-gemini-md': {
      const geminiPath = options.global
        ? path.join(tool.config.rules.globalPath, 'GEMINI.md')
        : path.join(projectRoot, 'GEMINI.md');

      if (options.dryRun) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: 'rule',
          path: geminiPath,
          success: true,
          skipped: true,
          skipReason: 'Dry run - would append to GEMINI.md',
        };
      }

      const existing = await readFile(geminiPath) || '';
      const section = `\n## ${pkg.manifest.name}\n\n${body}\n`;

      if (existing.includes(`## ${pkg.manifest.name}`) && !options.force) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: 'rule',
          path: geminiPath,
          success: false,
          skipped: true,
          skipReason: 'Section already exists in GEMINI.md',
        };
      }

      await fs.writeFile(geminiPath, existing + section, 'utf-8');

      return {
        tool: toolId,
        toolName: tool.config.name,
        type: 'rule',
        path: geminiPath,
        success: true,
      };
    }

    case 'add-to-read-config': {
      // Aider: add file to .aider.conf.yml read list
      const rulePath = path.join(projectRoot, `${pkg.manifest.name}.md`);
      const configPath = path.join(projectRoot, '.aider.conf.yml');

      if (options.dryRun) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: 'rule',
          path: rulePath,
          success: true,
          skipped: true,
          skipReason: 'Dry run - would create file and update .aider.conf.yml',
        };
      }

      // Write the rule file
      await fs.writeFile(rulePath, body, 'utf-8');

      // Update .aider.conf.yml
      const existingConfig = await readFile(configPath);
      let config: Record<string, unknown> = {};

      if (existingConfig) {
        try {
          config = YAML.parse(existingConfig) || {};
        } catch {
          // Invalid YAML, start fresh
        }
      }

      // Add to read list
      const readList = config.read;
      const fileName = `${pkg.manifest.name}.md`;

      if (Array.isArray(readList)) {
        if (!readList.includes(fileName)) {
          readList.push(fileName);
        }
      } else if (typeof readList === 'string') {
        if (readList !== fileName) {
          config.read = [readList, fileName];
        }
      } else {
        config.read = fileName;
      }

      await fs.writeFile(configPath, YAML.stringify(config), 'utf-8');

      return {
        tool: toolId,
        toolName: tool.config.name,
        type: 'rule',
        path: rulePath,
        success: true,
      };
    }

    case 'add-with-gemini-import': {
      // Gemini CLI: write rule to .gemini/rules/ and add @import to GEMINI.md
      const rulesDir = options.global
        ? tool.config.rules.globalPath
        : path.join(projectRoot, '.gemini', 'rules');
      const rulePath = path.join(rulesDir, `${pkg.manifest.name}.md`);

      const geminiMdPath = options.global
        ? path.join(path.dirname(tool.config.rules.globalPath), 'GEMINI.md')
        : path.join(projectRoot, 'GEMINI.md');

      if (options.dryRun) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: 'rule',
          path: rulePath,
          success: true,
          skipped: true,
          skipReason: 'Dry run - would create rule file and add @import to GEMINI.md',
        };
      }

      // Check if rule file exists
      if (!options.force && await fileExists(rulePath)) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: 'rule',
          path: rulePath,
          success: false,
          skipped: true,
          skipReason: 'File already exists (use --force to overwrite)',
        };
      }

      // Write the rule file
      await ensureDir(rulesDir);
      await fs.writeFile(rulePath, body, 'utf-8');

      // Add @import to GEMINI.md
      const existingGemini = await readFile(geminiMdPath) || '';
      const importLine = `@rules/${pkg.manifest.name}.md`;

      if (!existingGemini.includes(importLine)) {
        const newContent = existingGemini.trim()
          ? existingGemini.trimEnd() + '\n' + importLine + '\n'
          : importLine + '\n';
        await fs.writeFile(geminiMdPath, newContent, 'utf-8');
      }

      return {
        tool: toolId,
        toolName: tool.config.name,
        type: 'rule',
        path: rulePath,
        success: true,
      };
    }

    default:
      return {
        tool: toolId,
        toolName: tool.config.name,
        type: 'rule',
        path: '',
        success: false,
        error: `Unknown action: ${action}`,
      };
  }
}

/**
 * Uninstall a package from all detected tools
 */
export async function uninstallPackage(
  packageName: string,
  detectedTools: DetectedTool[],
  projectRoot: string,
  options: { global: boolean; dryRun?: boolean }
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];

  for (const tool of detectedTools) {
    const toolId = tool.config.id;

    // Try to remove rule
    const rulesConfig = tool.config.rules;
    const ruleBasePath = options.global
      ? rulesConfig.globalPath
      : path.join(projectRoot, rulesConfig.projectPath);
    const ruleFilename = `${packageName}${rulesConfig.fileExtension}`;
    const rulePath = path.join(ruleBasePath, ruleFilename);

    if (await fileExists(rulePath)) {
      if (!options.dryRun) {
        await fs.unlink(rulePath);
      }
      results.push({
        tool: toolId,
        toolName: tool.config.name,
        type: 'rule',
        path: rulePath,
        success: true,
        skipped: options.dryRun,
        skipReason: options.dryRun ? 'Dry run' : undefined,
      });
    }

    // Try to remove skill
    if (tool.config.skills) {
      const skillBasePath = options.global
        ? tool.config.skills.globalPath
        : path.join(projectRoot, tool.config.skills.projectPath);
      const skillDir = path.join(skillBasePath, packageName);

      if (await fileExists(skillDir)) {
        if (!options.dryRun) {
          await fs.rm(skillDir, { recursive: true });
        }
        results.push({
          tool: toolId,
          toolName: tool.config.name,
          type: 'skill',
          path: skillDir,
          success: true,
          skipped: options.dryRun,
          skipReason: options.dryRun ? 'Dry run' : undefined,
        });
      }
    }
  }

  return results;
}

/**
 * List installed packages for all detected tools
 */
export async function listInstalled(
  detectedTools: DetectedTool[],
  projectRoot: string,
  options: { global: boolean }
): Promise<Map<ToolId, { rules: string[]; skills: string[] }>> {
  const installed = new Map<ToolId, { rules: string[]; skills: string[] }>();

  for (const tool of detectedTools) {
    const toolId = tool.config.id;
    const rulesConfig = tool.config.rules;

    const rules: string[] = [];
    const skills: string[] = [];

    // List rules
    const ruleBasePath = options.global
      ? rulesConfig.globalPath
      : path.join(projectRoot, rulesConfig.projectPath);

    try {
      const files = await fs.readdir(ruleBasePath);
      for (const file of files) {
        if (file.endsWith(rulesConfig.fileExtension)) {
          rules.push(file.replace(rulesConfig.fileExtension, ''));
        }
      }
    } catch {
      // Directory doesn't exist
    }

    // List skills
    if (tool.config.skills) {
      const skillBasePath = options.global
        ? tool.config.skills.globalPath
        : path.join(projectRoot, tool.config.skills.projectPath);

      try {
        const dirs = await fs.readdir(skillBasePath);
        for (const dir of dirs) {
          const skillPath = path.join(skillBasePath, dir, 'SKILL.md');
          if (await fileExists(skillPath)) {
            skills.push(dir);
          }
        }
      } catch {
        // Directory doesn't exist
      }
    }

    if (rules.length > 0 || skills.length > 0) {
      installed.set(toolId, { rules, skills });
    }
  }

  return installed;
}

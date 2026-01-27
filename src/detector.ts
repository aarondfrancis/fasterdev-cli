import fs from 'fs/promises';
import path from 'path';
import type { DetectedTool, ToolId } from './types.js';
import { TOOL_CONFIGS, DEFAULT_TOOL_PRIORITY } from './tools.js';

/**
 * Check if a path exists
 */
async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect which tools are available in the current project and globally
 */
export async function detectTools(projectRoot: string): Promise<DetectedTool[]> {
  const detected: DetectedTool[] = [];

  for (const toolId of DEFAULT_TOOL_PRIORITY) {
    const config = TOOL_CONFIGS[toolId];
    let projectPath: string | null = null;
    let globalPath: string | null = null;

    // Check project directories
    for (const dir of config.detect.projectDirs) {
      const fullPath = path.join(projectRoot, dir);
      if (await exists(fullPath)) {
        projectPath = fullPath;
        break;
      }
    }

    // Check project config files (indicates tool is in use even without dir)
    if (!projectPath) {
      for (const file of config.detect.configFiles) {
        const fullPath = path.join(projectRoot, file);
        if (await exists(fullPath)) {
          projectPath = path.dirname(fullPath);
          if (projectPath === projectRoot) {
            // For root-level files, create the config dir path
            projectPath = path.join(projectRoot, config.rules.projectPath);
          }
          break;
        }
      }
    }

    // Check global directories
    for (const dir of config.detect.globalDirs) {
      if (await exists(dir)) {
        globalPath = dir;
        break;
      }
    }

    // Only include if we found evidence of the tool
    if (projectPath || globalPath) {
      detected.push({ config, projectPath, globalPath });
    }
  }

  return detected;
}

/**
 * Detect a specific tool
 */
export async function detectTool(
  toolId: ToolId,
  projectRoot: string
): Promise<DetectedTool | null> {
  const config = TOOL_CONFIGS[toolId];
  if (!config) return null;

  let projectPath: string | null = null;
  let globalPath: string | null = null;

  // Check project
  for (const dir of config.detect.projectDirs) {
    const fullPath = path.join(projectRoot, dir);
    if (await exists(fullPath)) {
      projectPath = fullPath;
      break;
    }
  }

  // Check global
  for (const dir of config.detect.globalDirs) {
    if (await exists(dir)) {
      globalPath = dir;
      break;
    }
  }

  return { config, projectPath, globalPath };
}

/**
 * Get all tools (whether detected or not) for explicit installation
 */
export function getAllTools(): ToolId[] {
  return Object.keys(TOOL_CONFIGS) as ToolId[];
}

/**
 * Filter detected tools by specific tool IDs
 */
export function filterTools(
  detected: DetectedTool[],
  toolIds: ToolId[]
): DetectedTool[] {
  const idSet = new Set(toolIds);
  return detected.filter((t) => idSet.has(t.config.id));
}

/**
 * Get tools that support skills
 */
export function getSkillTools(detected: DetectedTool[]): DetectedTool[] {
  return detected.filter((t) => t.config.skills !== null);
}

/**
 * Pretty print detected tools
 */
export function formatDetectedTools(detected: DetectedTool[]): string {
  if (detected.length === 0) {
    return 'No AI coding tools detected in this project.';
  }

  const lines = ['Detected tools:'];
  for (const tool of detected) {
    const locations: string[] = [];
    if (tool.projectPath) locations.push('project');
    if (tool.globalPath) locations.push('global');
    lines.push(`  • ${tool.config.name} (${locations.join(', ')})`);
  }
  return lines.join('\n');
}

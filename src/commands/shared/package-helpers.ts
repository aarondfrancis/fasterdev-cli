import path from 'path';
import { detectTools, filterTools, getSkillTools } from '../../detector.js';
import { TOOL_CONFIGS } from '../../tools.js';
import type { DetectedTool, InstallOptions, ToolId } from '../../types.js';

/**
 * Resolves which tools to install to based on detection, options, and defaults.
 */
export async function resolveDetectedTools(
  projectRoot: string,
  options: InstallOptions,
  defaultTools?: ToolId[]
): Promise<DetectedTool[]> {
  let detectedTools = await detectTools(projectRoot);

  if (detectedTools.length === 0) {
    // Even without detection, we can still install to default locations
    detectedTools = Object.values(TOOL_CONFIGS).map((config) => ({
      config,
      projectPath: path.join(projectRoot, config.rules.projectPath),
      globalPath: config.rules.globalPath,
    }));
  }

  const toolFilter =
    options.tools && options.tools.length > 0
      ? options.tools
      : defaultTools && defaultTools.length > 0
        ? defaultTools
        : undefined;

  if (toolFilter) {
    detectedTools = filterTools(detectedTools, toolFilter);
    if (detectedTools.length === 0) {
      throw new Error(`None of the specified tools were found: ${toolFilter.join(', ')}`);
    }
  }

  if (options.asSkill) {
    detectedTools = getSkillTools(detectedTools);
    if (detectedTools.length === 0) {
      throw new Error('No detected tools support skills');
    }
  }

  return detectedTools;
}

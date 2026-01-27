import YAML from 'yaml';
import type { RuleFrontmatter, SkillFrontmatter, ToolConfig } from './types.js';

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  try {
    const frontmatter = YAML.parse(match[1]) || {};
    return { frontmatter, body: match[2].trim() };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

/**
 * Serialize frontmatter to YAML
 */
export function serializeFrontmatter(
  frontmatter: Record<string, unknown>,
  body: string
): string {
  if (Object.keys(frontmatter).length === 0) {
    return body;
  }
  const yaml = YAML.stringify(frontmatter).trim();
  return `---\n${yaml}\n---\n\n${body}`;
}

/**
 * Convert a rule to Cursor's MDC format
 * 
 * MDC uses:
 * - description (instead of name)
 * - globs (same)
 * - alwaysApply (boolean)
 */
export function toMDCFormat(content: string): string {
  const { frontmatter, body } = parseFrontmatter(content);

  const mdcFrontmatter: Record<string, unknown> = {};

  // Convert name -> description
  if (frontmatter.name) {
    mdcFrontmatter.description = frontmatter.name;
  }
  if (frontmatter.description) {
    mdcFrontmatter.description = frontmatter.description;
  }

  // Keep globs as-is
  if (frontmatter.globs) {
    mdcFrontmatter.globs = frontmatter.globs;
  }

  // Convert paths to globs (Claude Code -> Cursor)
  if (frontmatter.paths && !frontmatter.globs) {
    const paths = Array.isArray(frontmatter.paths)
      ? frontmatter.paths
      : [frontmatter.paths];
    mdcFrontmatter.globs = paths.join(',');
  }

  // Default alwaysApply to false unless specified
  mdcFrontmatter.alwaysApply = frontmatter.alwaysApply ?? false;

  return serializeFrontmatter(mdcFrontmatter, body);
}

/**
 * Convert a rule to Claude Code format
 * 
 * Claude Code uses:
 * - paths (array of glob patterns)
 * - No alwaysApply (rules without paths always apply)
 */
export function toClaudeCodeFormat(content: string): string {
  const { frontmatter, body } = parseFrontmatter(content);

  const ccFrontmatter: Record<string, unknown> = {};

  // Convert globs -> paths
  if (frontmatter.globs) {
    const globs = typeof frontmatter.globs === 'string'
      ? frontmatter.globs.split(',').map((g: string) => g.trim())
      : frontmatter.globs;
    ccFrontmatter.paths = globs;
  }

  // Keep paths if already present
  if (frontmatter.paths) {
    ccFrontmatter.paths = frontmatter.paths;
  }

  // Only include frontmatter if we have paths
  if (Object.keys(ccFrontmatter).length === 0) {
    return body;
  }

  return serializeFrontmatter(ccFrontmatter, body);
}

/**
 * Convert a rule to Continue.dev format
 * 
 * Continue uses:
 * - name
 * - description
 * - globs
 * - regex (optional)
 */
export function toContinueFormat(content: string): string {
  const { frontmatter, body } = parseFrontmatter(content);

  const continueFrontmatter: Record<string, unknown> = {};

  if (frontmatter.name) {
    continueFrontmatter.name = frontmatter.name;
  }
  if (frontmatter.description) {
    continueFrontmatter.description = frontmatter.description;
  }

  // Convert paths -> globs
  if (frontmatter.paths && !frontmatter.globs) {
    const paths = Array.isArray(frontmatter.paths)
      ? frontmatter.paths
      : [frontmatter.paths];
    continueFrontmatter.globs = paths.length === 1 ? paths[0] : paths;
  } else if (frontmatter.globs) {
    continueFrontmatter.globs = frontmatter.globs;
  }

  return serializeFrontmatter(continueFrontmatter, body);
}

/**
 * Convert a rule to plain markdown (strip frontmatter for tools that don't use it)
 */
export function toPlainMarkdown(content: string): string {
  const { body } = parseFrontmatter(content);
  return body;
}

/**
 * Format content for appending to AGENTS.md
 * Wraps the rule in a section header
 */
export function toAgentsMdSection(content: string, ruleName: string): string {
  const { body } = parseFrontmatter(content);
  return `\n## ${ruleName}\n\n${body}\n`;
}

/**
 * Format content for appending to GEMINI.md
 */
export function toGeminiMdSection(content: string, ruleName: string): string {
  const { body } = parseFrontmatter(content);
  return `\n## ${ruleName}\n\n${body}\n`;
}

/**
 * Generate Aider config entry for a conventions file
 */
export function toAiderConfigEntry(filePath: string): string {
  return `read: ${filePath}`;
}

/**
 * Convert content to the appropriate format for a tool
 */
export function convertToToolFormat(
  content: string,
  toolConfig: ToolConfig,
  packageName: string
): string {
  switch (toolConfig.rules.format) {
    case 'mdc':
      return toMDCFormat(content);
    case 'markdown':
      // Most tools accept standard markdown with optional frontmatter
      if (toolConfig.id === 'claude-code') {
        return toClaudeCodeFormat(content);
      }
      if (toolConfig.id === 'continue') {
        return toContinueFormat(content);
      }
      // Cline, Roo Code, OpenCode, Codex, Amp, Gemini - strip frontmatter
      return toPlainMarkdown(content);
    case 'aider-config':
      // For Aider, we return the plain markdown
      // The installer will handle adding to .aider.conf.yml
      return toPlainMarkdown(content);
    default:
      return content;
  }
}

/**
 * Create a SKILL.md file with proper frontmatter
 */
export function createSkillMd(
  name: string,
  description: string,
  body: string,
  license?: string
): string {
  const frontmatter: SkillFrontmatter = {
    name,
    description,
  };
  if (license) {
    frontmatter.license = license;
  }
  return serializeFrontmatter(frontmatter, body);
}

/**
 * Extract skill frontmatter
 */
export function parseSkillFrontmatter(content: string): {
  frontmatter: SkillFrontmatter;
  body: string;
} {
  const { frontmatter, body } = parseFrontmatter(content);
  return {
    frontmatter: {
      name: (frontmatter.name as string) || 'unnamed',
      description: (frontmatter.description as string) || '',
      license: frontmatter.license as string | undefined,
    },
    body,
  };
}

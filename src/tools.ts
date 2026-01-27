import type { ToolConfig, ToolId } from './types.js';
import os from 'os';
import path from 'path';

const home = os.homedir();

export const TOOL_CONFIGS: Record<ToolId, ToolConfig> = {
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code',
    detect: {
      projectDirs: ['.claude'],
      globalDirs: [path.join(home, '.claude')],
      configFiles: ['CLAUDE.md', '.claude/CLAUDE.md'],
    },
    rules: {
      projectPath: '.claude/rules',
      globalPath: path.join(home, '.claude', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.claude/skills',
      globalPath: path.join(home, '.claude', 'skills'),
    },
  },

  codex: {
    id: 'codex',
    name: 'OpenAI Codex CLI',
    detect: {
      projectDirs: ['.codex'],
      globalDirs: [path.join(home, '.codex')],
      configFiles: ['AGENTS.md', '.codex/config.toml'],
    },
    rules: {
      projectPath: '.codex/rules',
      globalPath: path.join(home, '.codex', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.codex/skills',
      globalPath: path.join(home, '.codex', 'skills'),
    },
  },

  cursor: {
    id: 'cursor',
    name: 'Cursor',
    detect: {
      projectDirs: ['.cursor'],
      globalDirs: [path.join(home, '.cursor')],
      configFiles: ['.cursorrules', '.cursor/rules'],
    },
    rules: {
      projectPath: '.cursor/rules',
      globalPath: path.join(home, '.cursor', 'rules'),
      format: 'mdc',
      fileExtension: '.mdc',
    },
    skills: {
      projectPath: '.cursor/skills',
      globalPath: path.join(home, '.cursor', 'skills'),
    },
  },

  cline: {
    id: 'cline',
    name: 'Cline',
    detect: {
      projectDirs: ['.clinerules'],
      globalDirs: [path.join(home, 'Documents', 'Cline', 'Rules')],
      configFiles: ['.clinerules', 'AGENTS.md'],
    },
    rules: {
      projectPath: '.clinerules',
      globalPath: path.join(home, 'Documents', 'Cline', 'Rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: null,
  },

  'roo-code': {
    id: 'roo-code',
    name: 'Roo Code',
    detect: {
      projectDirs: ['.roo'],
      globalDirs: [path.join(home, '.roo')],
      configFiles: ['.roorules', '.roomodes', 'AGENTS.md'],
    },
    rules: {
      projectPath: '.roo/rules',
      globalPath: path.join(home, '.roo', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: null,
  },

  continue: {
    id: 'continue',
    name: 'Continue.dev',
    detect: {
      projectDirs: ['.continue'],
      globalDirs: [path.join(home, '.continue')],
      configFiles: ['.continue/config.yaml', '.continue/config.json'],
    },
    rules: {
      projectPath: '.continue/rules',
      globalPath: path.join(home, '.continue', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: null,
  },

  aider: {
    id: 'aider',
    name: 'Aider',
    detect: {
      projectDirs: [],
      globalDirs: [],
      configFiles: ['.aider.conf.yml', 'CONVENTIONS.md'],
    },
    rules: {
      projectPath: '.aider',
      globalPath: path.join(home, '.aider'),
      format: 'aider-config',
      fileExtension: '.md',
    },
    skills: null,
  },

  gemini: {
    id: 'gemini',
    name: 'Gemini CLI',
    detect: {
      projectDirs: ['.gemini'],
      globalDirs: [path.join(home, '.gemini')],
      configFiles: ['GEMINI.md', '.gemini/settings.json'],
    },
    rules: {
      projectPath: '.gemini/rules',
      globalPath: path.join(home, '.gemini', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: null,
  },

  amp: {
    id: 'amp',
    name: 'Amp (Sourcegraph)',
    detect: {
      projectDirs: ['.agents', '.amp', '.claude'],
      globalDirs: [path.join(home, '.config', 'amp'), path.join(home, '.config', 'agents')],
      configFiles: ['AGENTS.md', 'AGENT.md'],
    },
    rules: {
      projectPath: '.amp/rules',
      globalPath: path.join(home, '.config', 'amp', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.agents/skills',
      globalPath: path.join(home, '.config', 'agents', 'skills'),
    },
  },

  opencode: {
    id: 'opencode',
    name: 'OpenCode',
    detect: {
      projectDirs: ['.opencode'],
      globalDirs: [path.join(home, '.config', 'opencode')],
      configFiles: ['opencode.json', 'AGENTS.md'],
    },
    rules: {
      projectPath: '.opencode/rules',
      globalPath: path.join(home, '.config', 'opencode', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.opencode/skill',
      globalPath: path.join(home, '.config', 'opencode', 'skill'),
    },
  },

  antigravity: {
    id: 'antigravity',
    name: 'Antigravity',
    detect: {
      projectDirs: ['.agent'],
      globalDirs: [path.join(home, '.gemini', 'antigravity')],
      configFiles: [],
    },
    rules: {
      projectPath: '.agent/rules',
      globalPath: path.join(home, '.gemini', 'antigravity', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.agent/skills',
      globalPath: path.join(home, '.gemini', 'antigravity', 'skills'),
    },
  },
};

// Tools that support skills (Agent Skills standard)
export const SKILL_TOOLS: ToolId[] = ['claude-code', 'codex', 'cursor', 'amp', 'opencode', 'antigravity'];

// Tools that support rules (all of them)
export const RULE_TOOLS: ToolId[] = Object.keys(TOOL_CONFIGS) as ToolId[];

// Default tool priority for installation (most common first)
export const DEFAULT_TOOL_PRIORITY: ToolId[] = [
  'claude-code',
  'cursor',
  'codex',
  'cline',
  'roo-code',
  'continue',
  'aider',
  'gemini',
  'amp',
  'opencode',
  'antigravity',
];

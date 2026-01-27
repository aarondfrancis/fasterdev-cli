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

  // New agents from Vercel Skills
  windsurf: {
    id: 'windsurf',
    name: 'Windsurf',
    detect: {
      projectDirs: ['.windsurf'],
      globalDirs: [path.join(home, '.codeium', 'windsurf')],
      configFiles: [],
    },
    rules: {
      projectPath: '.windsurf/rules',
      globalPath: path.join(home, '.codeium', 'windsurf', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.windsurf/skills',
      globalPath: path.join(home, '.codeium', 'windsurf', 'skills'),
    },
  },

  'github-copilot': {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    detect: {
      projectDirs: ['.github'],
      globalDirs: [path.join(home, '.copilot')],
      configFiles: ['.github/copilot-instructions.md'],
    },
    rules: {
      projectPath: '.github/rules',
      globalPath: path.join(home, '.copilot', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.github/skills',
      globalPath: path.join(home, '.copilot', 'skills'),
    },
  },

  goose: {
    id: 'goose',
    name: 'Goose',
    detect: {
      projectDirs: ['.goose'],
      globalDirs: [path.join(home, '.config', 'goose')],
      configFiles: [],
    },
    rules: {
      projectPath: '.goose/rules',
      globalPath: path.join(home, '.config', 'goose', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.goose/skills',
      globalPath: path.join(home, '.config', 'goose', 'skills'),
    },
  },

  kilo: {
    id: 'kilo',
    name: 'Kilo Code',
    detect: {
      projectDirs: ['.kilocode'],
      globalDirs: [path.join(home, '.kilocode')],
      configFiles: [],
    },
    rules: {
      projectPath: '.kilocode/rules',
      globalPath: path.join(home, '.kilocode', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.kilocode/skills',
      globalPath: path.join(home, '.kilocode', 'skills'),
    },
  },

  kiro: {
    id: 'kiro',
    name: 'Kiro CLI',
    detect: {
      projectDirs: ['.kiro'],
      globalDirs: [path.join(home, '.kiro')],
      configFiles: [],
    },
    rules: {
      projectPath: '.kiro/rules',
      globalPath: path.join(home, '.kiro', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.kiro/skills',
      globalPath: path.join(home, '.kiro', 'skills'),
    },
  },

  qwen: {
    id: 'qwen',
    name: 'Qwen Code',
    detect: {
      projectDirs: ['.qwen'],
      globalDirs: [path.join(home, '.qwen')],
      configFiles: [],
    },
    rules: {
      projectPath: '.qwen/rules',
      globalPath: path.join(home, '.qwen', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.qwen/skills',
      globalPath: path.join(home, '.qwen', 'skills'),
    },
  },

  trae: {
    id: 'trae',
    name: 'Trae',
    detect: {
      projectDirs: ['.trae'],
      globalDirs: [path.join(home, '.trae')],
      configFiles: [],
    },
    rules: {
      projectPath: '.trae/rules',
      globalPath: path.join(home, '.trae', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.trae/skills',
      globalPath: path.join(home, '.trae', 'skills'),
    },
  },

  crush: {
    id: 'crush',
    name: 'Crush',
    detect: {
      projectDirs: ['.crush'],
      globalDirs: [path.join(home, '.config', 'crush')],
      configFiles: [],
    },
    rules: {
      projectPath: '.crush/rules',
      globalPath: path.join(home, '.config', 'crush', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.crush/skills',
      globalPath: path.join(home, '.config', 'crush', 'skills'),
    },
  },

  droid: {
    id: 'droid',
    name: 'Droid',
    detect: {
      projectDirs: ['.factory'],
      globalDirs: [path.join(home, '.factory')],
      configFiles: [],
    },
    rules: {
      projectPath: '.factory/rules',
      globalPath: path.join(home, '.factory', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.factory/skills',
      globalPath: path.join(home, '.factory', 'skills'),
    },
  },

  mcpjam: {
    id: 'mcpjam',
    name: 'MCPJam',
    detect: {
      projectDirs: ['.mcpjam'],
      globalDirs: [path.join(home, '.mcpjam')],
      configFiles: [],
    },
    rules: {
      projectPath: '.mcpjam/rules',
      globalPath: path.join(home, '.mcpjam', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.mcpjam/skills',
      globalPath: path.join(home, '.mcpjam', 'skills'),
    },
  },

  mux: {
    id: 'mux',
    name: 'Mux',
    detect: {
      projectDirs: ['.mux'],
      globalDirs: [path.join(home, '.mux')],
      configFiles: [],
    },
    rules: {
      projectPath: '.mux/rules',
      globalPath: path.join(home, '.mux', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.mux/skills',
      globalPath: path.join(home, '.mux', 'skills'),
    },
  },

  openhands: {
    id: 'openhands',
    name: 'OpenHands',
    detect: {
      projectDirs: ['.openhands'],
      globalDirs: [path.join(home, '.openhands')],
      configFiles: [],
    },
    rules: {
      projectPath: '.openhands/rules',
      globalPath: path.join(home, '.openhands', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.openhands/skills',
      globalPath: path.join(home, '.openhands', 'skills'),
    },
  },

  pi: {
    id: 'pi',
    name: 'Pi',
    detect: {
      projectDirs: ['.pi'],
      globalDirs: [path.join(home, '.pi', 'agent')],
      configFiles: [],
    },
    rules: {
      projectPath: '.pi/rules',
      globalPath: path.join(home, '.pi', 'agent', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.pi/skills',
      globalPath: path.join(home, '.pi', 'agent', 'skills'),
    },
  },

  qoder: {
    id: 'qoder',
    name: 'Qoder',
    detect: {
      projectDirs: ['.qoder'],
      globalDirs: [path.join(home, '.qoder')],
      configFiles: [],
    },
    rules: {
      projectPath: '.qoder/rules',
      globalPath: path.join(home, '.qoder', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.qoder/skills',
      globalPath: path.join(home, '.qoder', 'skills'),
    },
  },

  clawdbot: {
    id: 'clawdbot',
    name: 'Clawdbot',
    detect: {
      projectDirs: ['skills'],
      globalDirs: [path.join(home, '.clawdbot')],
      configFiles: [],
    },
    rules: {
      projectPath: 'skills',
      globalPath: path.join(home, '.clawdbot', 'skills'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: 'skills',
      globalPath: path.join(home, '.clawdbot', 'skills'),
    },
  },

  codebuddy: {
    id: 'codebuddy',
    name: 'CodeBuddy',
    detect: {
      projectDirs: ['.codebuddy'],
      globalDirs: [path.join(home, '.codebuddy')],
      configFiles: [],
    },
    rules: {
      projectPath: '.codebuddy/rules',
      globalPath: path.join(home, '.codebuddy', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.codebuddy/skills',
      globalPath: path.join(home, '.codebuddy', 'skills'),
    },
  },

  'command-code': {
    id: 'command-code',
    name: 'Command Code',
    detect: {
      projectDirs: ['.commandcode'],
      globalDirs: [path.join(home, '.commandcode')],
      configFiles: [],
    },
    rules: {
      projectPath: '.commandcode/rules',
      globalPath: path.join(home, '.commandcode', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.commandcode/skills',
      globalPath: path.join(home, '.commandcode', 'skills'),
    },
  },

  zencoder: {
    id: 'zencoder',
    name: 'Zencoder',
    detect: {
      projectDirs: ['.zencoder'],
      globalDirs: [path.join(home, '.zencoder')],
      configFiles: [],
    },
    rules: {
      projectPath: '.zencoder/rules',
      globalPath: path.join(home, '.zencoder', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.zencoder/skills',
      globalPath: path.join(home, '.zencoder', 'skills'),
    },
  },

  neovate: {
    id: 'neovate',
    name: 'Neovate',
    detect: {
      projectDirs: ['.neovate'],
      globalDirs: [path.join(home, '.neovate')],
      configFiles: [],
    },
    rules: {
      projectPath: '.neovate/rules',
      globalPath: path.join(home, '.neovate', 'rules'),
      format: 'markdown',
      fileExtension: '.md',
    },
    skills: {
      projectPath: '.neovate/skills',
      globalPath: path.join(home, '.neovate', 'skills'),
    },
  },
};

// Tools that support skills (Agent Skills standard)
export const SKILL_TOOLS: ToolId[] = [
  'claude-code',
  'codex',
  'cursor',
  'amp',
  'opencode',
  'antigravity',
  // New skill-supporting agents
  'windsurf',
  'github-copilot',
  'goose',
  'kilo',
  'kiro',
  'qwen',
  'trae',
  'crush',
  'droid',
  'mcpjam',
  'mux',
  'openhands',
  'pi',
  'qoder',
  'clawdbot',
  'codebuddy',
  'command-code',
  'zencoder',
  'neovate',
];

// Tools that support rules (all of them)
export const RULE_TOOLS: ToolId[] = Object.keys(TOOL_CONFIGS) as ToolId[];

// Default tool priority for installation (most common first)
export const DEFAULT_TOOL_PRIORITY: ToolId[] = [
  'claude-code',
  'cursor',
  'codex',
  'windsurf',
  'github-copilot',
  'cline',
  'roo-code',
  'continue',
  'aider',
  'gemini',
  'amp',
  'opencode',
  'antigravity',
  'goose',
  'kilo',
  'kiro',
  'qwen',
  'trae',
  'crush',
  'droid',
  'mcpjam',
  'mux',
  'openhands',
  'pi',
  'qoder',
  'clawdbot',
  'codebuddy',
  'command-code',
  'zencoder',
  'neovate',
];

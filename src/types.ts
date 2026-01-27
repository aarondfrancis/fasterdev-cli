// Tool identifiers
export type ToolId =
  | 'claude-code'
  | 'codex'
  | 'cursor'
  | 'cline'
  | 'roo-code'
  | 'continue'
  | 'aider'
  | 'gemini'
  | 'amp'
  | 'opencode';

// Package types
export type PackageType = 'rule' | 'skill' | 'both';

// Install types (what we actually install)
export type InstallType = 'rule' | 'skill';

// Package manifest (what faster.dev serves)
export interface PackageManifest {
  name: string;
  version: string;
  type: PackageType;
  description: string;
  author?: string;
  license?: string;
  compatibility: {
    rules?: ToolId[];
    skills?: ToolId[];
  };
  // Tool-specific installation overrides
  install?: Partial<Record<ToolId, InstallOverride>>;
}

export interface InstallOverride {
  file?: string; // Use a different file for this tool
  action?: 'append-to-agents-md' | 'append-to-gemini-md' | 'add-to-read-config';
  disabled?: boolean; // Skip this tool
}

// Package contents after download
export interface Package {
  manifest: PackageManifest;
  files: PackageFile[];
}

export interface PackageFile {
  path: string;
  content: string;
}

// Tool detection and configuration
export interface ToolConfig {
  id: ToolId;
  name: string;
  // How to detect if the tool is in use
  detect: {
    projectDirs: string[]; // Check for these dirs in project root
    globalDirs: string[]; // Check for these dirs globally
    configFiles: string[]; // Check for these config files
  };
  // Where to install rules
  rules: {
    projectPath: string; // e.g., ".claude/rules"
    globalPath: string; // e.g., "~/.claude/rules"
    format: 'markdown' | 'mdc' | 'aider-config';
    fileExtension: string;
  };
  // Where to install skills (null if not supported)
  skills: {
    projectPath: string;
    globalPath: string;
  } | null;
}

// Detected tool info
export interface DetectedTool {
  config: ToolConfig;
  projectPath: string | null; // Project config dir if exists
  globalPath: string | null; // Global config dir if exists
}

// Installation options
export interface InstallOptions {
  global: boolean;
  tools?: ToolId[]; // Specific tools, or all detected
  asSkill?: boolean; // Install as skill instead of rule
  force?: boolean; // Overwrite existing
  dryRun?: boolean; // Just show what would happen
}

// CLI config stored in ~/.faster/config.json
export interface CLIConfig {
  authToken?: string;
  apiUrl: string;
  defaultTools?: ToolId[];
  analytics?: boolean;
}

// API response types
export interface PackageSearchResult {
  name: string;
  version: string;
  type: PackageType;
  description: string;
  downloads: number;
  author?: string;
  updatedAt?: string;
}

export interface PackageInfo {
  name: string;
  description: string;
  type: PackageType;
  latestVersion: string;
  versions: string[];
  author?: {
    name: string;
    username?: string;
  };
  repository?: string;
  homepage?: string;
  keywords?: string[];
  downloads?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageVersion {
  version: string;
  manifest: PackageManifest;
  readme?: string;
  publishedAt?: string;
  downloads?: number;
}

export interface UserInfo {
  id: string | number;
  email: string;
  name?: string;
  username?: string;
}

export interface AuthResponse {
  user: UserInfo;
  token: string;
}

export interface DeviceAuthResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

export type DeviceAuthStatus =
  | { status: 'pending'; interval?: number }
  | { status: 'approved'; token: string; user: UserInfo };

// YAML frontmatter for rules/skills
export interface RuleFrontmatter {
  name?: string;
  description?: string;
  globs?: string | string[];
  paths?: string[]; // Claude Code specific
  alwaysApply?: boolean; // Cursor specific
  regex?: string | string[]; // Continue specific
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  // Claude Code invocation control
  'disable-model-invocation'?: boolean; // Only user can invoke (not auto-invoked by Claude)
  'user-invocable'?: boolean; // Set to false if only Claude should invoke (not user)
  [key: string]: unknown;
}

// Local install registry
export interface InstalledPackageRecord {
  name: string;
  version: string;
  installType: InstallType;
  tools: ToolId[];
  installedAt: string;
  source: 'registry' | 'local';
  localPath?: string;
}

export interface InstallRegistry {
  schemaVersion: 1;
  packages: Record<string, InstalledPackageRecord>;
}

#!/usr/bin/env node

// src/cli.ts
import { Command } from "commander";

// src/commands/auth/login.ts
import chalk2 from "chalk";

// src/api.ts
import fetch from "node-fetch";
var DEFAULT_API_URL = "https://faster.dev/api/v1";
var APIError = class extends Error {
  status;
  body;
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
};
var FasterAPI = class {
  apiUrl;
  authToken;
  fetcher;
  constructor(config, fetcher = fetch) {
    this.apiUrl = config.apiUrl || DEFAULT_API_URL;
    this.authToken = config.authToken;
    this.fetcher = fetcher;
  }
  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    const response = await this.fetcher(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new APIError(
        response.status,
        `API error (${response.status}): ${errorBody || response.statusText}`,
        errorBody
      );
    }
    if (response.status === 204) {
      return {};
    }
    return response.json();
  }
  /**
   * Authenticate with faster.dev
   */
  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  }
  /**
   * Start device authentication flow
   */
  async requestDeviceAuth() {
    return this.request("/auth/device", {
      method: "POST",
      body: JSON.stringify({})
    });
  }
  /**
   * Check device authentication status
   */
  async checkDeviceAuth(deviceCode) {
    return this.request(`/auth/device/${encodeURIComponent(deviceCode)}`);
  }
  /**
   * Get current user
   */
  async me() {
    return this.request("/auth/me");
  }
  /**
   * Search for packages
   */
  async search(query, options) {
    const params = new URLSearchParams({ q: query });
    if (options?.type) params.set("type", options.type);
    if (options?.tool) params.set("tool", options.tool);
    return this.request(`/packages/search?${params}`);
  }
  /**
   * Get package info
   */
  async getPackageInfo(name) {
    return this.request(`/packages/${encodeURIComponent(name)}`);
  }
  /**
   * Get package version info
   */
  async getPackageVersion(name, version) {
    return this.request(
      `/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`
    );
  }
  /**
   * Download a package
   */
  async downloadPackage(name, version) {
    const endpoint = version ? `/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}/download` : `/packages/${encodeURIComponent(name)}/download`;
    return this.request(endpoint);
  }
  /**
   * Publish a package (for package authors)
   */
  async publishPackage(pkg) {
    if (!this.authToken) {
      throw new Error("Authentication required to publish packages");
    }
    return this.request("/packages", {
      method: "POST",
      body: JSON.stringify(pkg)
    });
  }
  /**
   * Set auth token
   */
  setAuthToken(token) {
    this.authToken = token;
  }
};

// src/config.ts
import Conf from "conf";
import { homedir } from "os";
import { join } from "path";
var DEFAULT_CONFIG = {
  apiUrl: "https://faster.dev/api/v1",
  analytics: true
};
var store = new Conf({
  projectName: "faster-dev",
  cwd: join(homedir(), ".faster-dev"),
  defaults: DEFAULT_CONFIG
});
function getConfig() {
  const apiUrl = process.env.FASTER_API_URL || store.get("apiUrl", DEFAULT_CONFIG.apiUrl);
  const authToken = process.env.FASTER_API_KEY || store.get("authToken");
  const analyticsEnv = process.env.FASTER_NO_ANALYTICS;
  return {
    apiUrl,
    authToken,
    defaultTools: store.get("defaultTools"),
    analytics: analyticsEnv ? false : store.get("analytics", DEFAULT_CONFIG.analytics ?? true)
  };
}
function getAuthToken() {
  return process.env.FASTER_API_KEY || store.get("authToken");
}
function setAuthToken(token) {
  store.set("authToken", token);
}
function clearAuthToken() {
  store.delete("authToken");
}
function setApiUrl(url) {
  store.set("apiUrl", url);
}
function getDefaultTools() {
  return store.get("defaultTools");
}
function setDefaultTools(tools) {
  store.set("defaultTools", tools);
}
function getConfigPath() {
  return store.path;
}

// src/utils.ts
import { spawn } from "child_process";
function parsePackageSpec(input) {
  if (input.startsWith("@")) {
    const match2 = input.match(/^(@[^/]+\/[^@]+)(?:@(.+))?$/);
    if (match2) {
      return { name: match2[1], version: match2[2] };
    }
    return { name: input };
  }
  const match = input.match(/^([^@]+)(?:@(.+))?$/);
  if (match) {
    return { name: match[1], version: match[2] };
  }
  return { name: input };
}
function resolveInstallType(asSkill) {
  return asSkill ? "skill" : "rule";
}
function stringifyError(error, verbose) {
  if (error instanceof Error) {
    if (verbose && error.stack) return error.stack;
    return error.message;
  }
  return String(error);
}
async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
function openBrowser(url) {
  try {
    const platform = process.platform;
    if (platform === "darwin") {
      spawn("open", [url], { stdio: "ignore", detached: true }).unref();
      return true;
    }
    if (platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true }).unref();
      return true;
    }
    spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
    return true;
  } catch {
    return false;
  }
}

// src/lib/command-utils.ts
import chalk from "chalk";
import ora from "ora";

// src/lib/exit-codes.ts
var EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  INVALID_ARGS: 2,
  AUTH_REQUIRED: 3,
  NOT_FOUND: 4,
  NETWORK: 5,
  PERMISSION: 6
};
function mapApiErrorToExitCode(error) {
  if (error instanceof APIError) {
    if (error.status === 401) return EXIT_CODES.AUTH_REQUIRED;
    if (error.status === 403) return EXIT_CODES.PERMISSION;
    if (error.status === 404) return EXIT_CODES.NOT_FOUND;
    if (error.status >= 500) return EXIT_CODES.NETWORK;
  }
  return EXIT_CODES.ERROR;
}

// src/lib/command-utils.ts
var SpinnerManager = class {
  spinner;
  isJson;
  constructor(message, isJson) {
    this.isJson = isJson;
    this.spinner = isJson ? null : ora(message).start();
  }
  text(message) {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }
  stop() {
    if (this.spinner) {
      this.spinner.stop();
    }
  }
  succeed(message) {
    if (this.spinner) {
      this.spinner.succeed(chalk.green(message));
    }
  }
  fail(message) {
    if (this.spinner) {
      this.spinner.fail(chalk.red(message));
    }
  }
  info(message) {
    if (this.spinner) {
      this.spinner.info(message);
    }
  }
};
function outputJson(data) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}
`);
}
function setExitCode(code) {
  process.exitCode = code;
}

// src/commands/auth/login.ts
function registerLoginCommand(program2) {
  program2.command("login").description("Authenticate with faster.dev").option("--no-browser", "Do not open a browser automatically").action(async (opts) => {
    const globalOpts = program2.opts();
    const { json, verbose } = globalOpts;
    const spinner = new SpinnerManager("Starting device login...", json ?? false);
    try {
      const api = new FasterAPI(getConfig());
      const device = await api.requestDeviceAuth();
      spinner.stop();
      if (!json) {
        console.log();
        console.log(chalk2.bold("Open the following URL in your browser:"));
        console.log(chalk2.cyan(device.verification_url));
        console.log();
        console.log(chalk2.bold("Enter this code:"));
        console.log(chalk2.green(device.user_code));
        console.log();
      }
      if (!opts.browser) {
        if (!json) console.log(chalk2.dim("Browser auto-open disabled."));
      } else {
        const opened = openBrowser(device.verification_url);
        if (!opened && !json) {
          console.log(chalk2.dim("Unable to open browser automatically."));
        }
      }
      const pollIntervalMs = Math.max(1, device.interval) * 1e3;
      const deadline = Date.now() + device.expires_in * 1e3;
      const waitSpinner = new SpinnerManager("Waiting for approval...", json ?? false);
      while (Date.now() < deadline) {
        await sleep(pollIntervalMs);
        try {
          const status = await api.checkDeviceAuth(device.device_code);
          if (status.status === "approved") {
            setAuthToken(status.token);
            waitSpinner.succeed("Logged in successfully");
            if (json) outputJson({ ok: true, user: status.user });
            return;
          }
        } catch (error) {
          waitSpinner.fail(`Login failed: ${stringifyError(error, verbose)}`);
          if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
          setExitCode(mapApiErrorToExitCode(error));
          return;
        }
      }
      waitSpinner.fail("Login timed out");
      if (json) outputJson({ ok: false, error: "Login timed out" });
      setExitCode(EXIT_CODES.ERROR);
    } catch (error) {
      spinner.fail(`Login failed: ${stringifyError(error, verbose)}`);
      if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
      setExitCode(mapApiErrorToExitCode(error));
    }
  });
}

// src/commands/auth/logout.ts
import chalk3 from "chalk";
function registerLogoutCommand(program2) {
  program2.command("logout").description("Log out from faster.dev").action(() => {
    const { json } = program2.opts();
    clearAuthToken();
    if (json) {
      outputJson({ ok: true });
    } else {
      console.log(chalk3.green("Logged out successfully"));
    }
  });
}

// src/commands/auth/whoami.ts
import chalk4 from "chalk";
function registerWhoamiCommand(program2) {
  program2.command("whoami").description("Show current authentication status").action(async () => {
    const { json, verbose } = program2.opts();
    const token = getAuthToken();
    if (!token) {
      if (json) {
        outputJson({ authenticated: false });
      } else {
        console.log(chalk4.yellow("Not logged in"));
        console.log(chalk4.dim("Run `fasterdev login` to authenticate"));
      }
      setExitCode(EXIT_CODES.AUTH_REQUIRED);
      return;
    }
    try {
      const api = new FasterAPI(getConfig());
      const user = await api.me();
      if (json) {
        outputJson({ authenticated: true, user });
      } else {
        console.log(chalk4.green("Authenticated with faster.dev"));
        console.log(chalk4.dim(`Email: ${user.email}`));
        console.log(chalk4.dim(`Config: ${getConfigPath()}`));
      }
    } catch (error) {
      if (json) {
        outputJson({ authenticated: false, error: stringifyError(error, verbose) });
      } else {
        console.log(chalk4.red(`Auth check failed: ${stringifyError(error, verbose)}`));
      }
      setExitCode(mapApiErrorToExitCode(error));
    }
  });
}

// src/commands/auth/index.ts
function registerAuthCommands(program2) {
  registerLoginCommand(program2);
  registerLogoutCommand(program2);
  registerWhoamiCommand(program2);
}

// src/commands/discovery/search.ts
import chalk5 from "chalk";
function registerSearchCommand(program2) {
  program2.command("search <query>").description("Search for packages on faster.dev").option("--type <type>", "Filter by type: rule, skill, or both").action(async (query, opts) => {
    const { json, verbose } = program2.opts();
    const spinner = new SpinnerManager("Searching...", json ?? false);
    try {
      const api = new FasterAPI(getConfig());
      const results = await api.search(query, { type: opts.type });
      spinner.stop();
      if (results.length === 0) {
        if (json) {
          outputJson({ ok: true, results: [] });
        } else {
          console.log(chalk5.yellow("No packages found"));
        }
        return;
      }
      if (json) {
        outputJson({ ok: true, results });
        return;
      }
      console.log();
      for (const pkg of results) {
        const typeColor = pkg.type === "skill" ? chalk5.blue : chalk5.green;
        console.log(
          chalk5.bold(pkg.name),
          typeColor(`[${pkg.type}]`),
          chalk5.dim(`v${pkg.version}`)
        );
        console.log(chalk5.dim(`  ${pkg.description}`));
        console.log();
      }
    } catch (error) {
      spinner.fail(`Search failed: ${stringifyError(error, verbose)}`);
      if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
      setExitCode(mapApiErrorToExitCode(error));
    }
  });
}

// src/commands/discovery/info.ts
import chalk6 from "chalk";
function registerInfoCommand(program2) {
  program2.command("info <package>").description("Show package details").action(async (packageInput) => {
    const { json, verbose } = program2.opts();
    const { name: packageName } = parsePackageSpec(packageInput);
    const spinner = new SpinnerManager("Fetching package info...", json ?? false);
    try {
      const api = new FasterAPI(getConfig());
      const info = await api.getPackageInfo(packageName);
      spinner.stop();
      if (json) {
        outputJson({ ok: true, info });
        return;
      }
      console.log();
      console.log(chalk6.bold(info.name));
      console.log(chalk6.dim(info.description));
      console.log();
      console.log(`Type: ${info.type}`);
      console.log(`Latest: ${info.latestVersion}`);
      if (info.versions?.length) {
        console.log(`Versions: ${info.versions.join(", ")}`);
      }
      if (info.repository) console.log(`Repository: ${info.repository}`);
      if (info.homepage) console.log(`Homepage: ${info.homepage}`);
      if (info.keywords?.length) console.log(`Keywords: ${info.keywords.join(", ")}`);
      if (info.downloads !== void 0) console.log(`Downloads: ${info.downloads}`);
    } catch (error) {
      spinner.fail(`Info failed: ${stringifyError(error, verbose)}`);
      if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
      setExitCode(mapApiErrorToExitCode(error));
    }
  });
}

// src/commands/discovery/detect.ts
import chalk7 from "chalk";

// src/detector.ts
import fs from "fs/promises";
import path2 from "path";

// src/tools.ts
import os from "os";
import path from "path";
var home = os.homedir();
var TOOL_CONFIGS = {
  "claude-code": {
    id: "claude-code",
    name: "Claude Code",
    detect: {
      projectDirs: [".claude"],
      globalDirs: [path.join(home, ".claude")],
      configFiles: ["CLAUDE.md", ".claude/CLAUDE.md"]
    },
    rules: {
      projectPath: ".claude/rules",
      globalPath: path.join(home, ".claude", "rules"),
      format: "markdown",
      fileExtension: ".md"
    },
    skills: {
      projectPath: ".claude/skills",
      globalPath: path.join(home, ".claude", "skills")
    }
  },
  codex: {
    id: "codex",
    name: "OpenAI Codex CLI",
    detect: {
      projectDirs: [".codex"],
      globalDirs: [path.join(home, ".codex")],
      configFiles: ["AGENTS.md", ".codex/config.toml"]
    },
    rules: {
      projectPath: ".codex/rules",
      globalPath: path.join(home, ".codex", "rules"),
      format: "markdown",
      fileExtension: ".md"
    },
    skills: {
      projectPath: ".codex/skills",
      globalPath: path.join(home, ".codex", "skills")
    }
  },
  cursor: {
    id: "cursor",
    name: "Cursor",
    detect: {
      projectDirs: [".cursor"],
      globalDirs: [path.join(home, ".cursor")],
      configFiles: [".cursorrules", ".cursor/rules"]
    },
    rules: {
      projectPath: ".cursor/rules",
      globalPath: path.join(home, ".cursor", "rules"),
      format: "mdc",
      fileExtension: ".mdc"
    },
    skills: {
      projectPath: ".cursor/skills",
      globalPath: path.join(home, ".cursor", "skills")
    }
  },
  cline: {
    id: "cline",
    name: "Cline",
    detect: {
      projectDirs: [".clinerules"],
      globalDirs: [path.join(home, "Documents", "Cline", "Rules")],
      configFiles: [".clinerules", "AGENTS.md"]
    },
    rules: {
      projectPath: ".clinerules",
      globalPath: path.join(home, "Documents", "Cline", "Rules"),
      format: "markdown",
      fileExtension: ".md"
    },
    skills: null
  },
  "roo-code": {
    id: "roo-code",
    name: "Roo Code",
    detect: {
      projectDirs: [".roo"],
      globalDirs: [path.join(home, ".roo")],
      configFiles: [".roorules", ".roomodes", "AGENTS.md"]
    },
    rules: {
      projectPath: ".roo/rules",
      globalPath: path.join(home, ".roo", "rules"),
      format: "markdown",
      fileExtension: ".md"
    },
    skills: null
  },
  continue: {
    id: "continue",
    name: "Continue.dev",
    detect: {
      projectDirs: [".continue"],
      globalDirs: [path.join(home, ".continue")],
      configFiles: [".continue/config.yaml", ".continue/config.json"]
    },
    rules: {
      projectPath: ".continue/rules",
      globalPath: path.join(home, ".continue", "rules"),
      format: "markdown",
      fileExtension: ".md"
    },
    skills: null
  },
  aider: {
    id: "aider",
    name: "Aider",
    detect: {
      projectDirs: [],
      globalDirs: [],
      configFiles: [".aider.conf.yml", "CONVENTIONS.md"]
    },
    rules: {
      projectPath: ".aider",
      globalPath: path.join(home, ".aider"),
      format: "aider-config",
      fileExtension: ".md"
    },
    skills: null
  },
  gemini: {
    id: "gemini",
    name: "Gemini CLI",
    detect: {
      projectDirs: [".gemini"],
      globalDirs: [path.join(home, ".gemini")],
      configFiles: ["GEMINI.md", ".gemini/settings.json"]
    },
    rules: {
      projectPath: ".gemini/rules",
      globalPath: path.join(home, ".gemini", "rules"),
      format: "markdown",
      fileExtension: ".md"
    },
    skills: null
  },
  amp: {
    id: "amp",
    name: "Amp (Sourcegraph)",
    detect: {
      projectDirs: [".agents", ".amp", ".claude"],
      globalDirs: [path.join(home, ".config", "amp"), path.join(home, ".config", "agents")],
      configFiles: ["AGENTS.md", "AGENT.md"]
    },
    rules: {
      projectPath: ".amp/rules",
      globalPath: path.join(home, ".config", "amp", "rules"),
      format: "markdown",
      fileExtension: ".md"
    },
    skills: {
      projectPath: ".agents/skills",
      globalPath: path.join(home, ".config", "agents", "skills")
    }
  },
  opencode: {
    id: "opencode",
    name: "OpenCode",
    detect: {
      projectDirs: [".opencode"],
      globalDirs: [path.join(home, ".config", "opencode")],
      configFiles: ["opencode.json", "AGENTS.md"]
    },
    rules: {
      projectPath: ".opencode/rules",
      globalPath: path.join(home, ".config", "opencode", "rules"),
      format: "markdown",
      fileExtension: ".md"
    },
    skills: {
      projectPath: ".opencode/skill",
      globalPath: path.join(home, ".config", "opencode", "skill")
    }
  },
  antigravity: {
    id: "antigravity",
    name: "Antigravity",
    detect: {
      projectDirs: [".agent"],
      globalDirs: [path.join(home, ".gemini", "antigravity")],
      configFiles: []
    },
    rules: {
      projectPath: ".agent/rules",
      globalPath: path.join(home, ".gemini", "antigravity", "rules"),
      format: "markdown",
      fileExtension: ".md"
    },
    skills: {
      projectPath: ".agent/skills",
      globalPath: path.join(home, ".gemini", "antigravity", "skills")
    }
  }
};
var RULE_TOOLS = Object.keys(TOOL_CONFIGS);
var DEFAULT_TOOL_PRIORITY = [
  "claude-code",
  "cursor",
  "codex",
  "cline",
  "roo-code",
  "continue",
  "aider",
  "gemini",
  "amp",
  "opencode",
  "antigravity"
];

// src/detector.ts
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
async function detectTools(projectRoot) {
  const detected = [];
  for (const toolId of DEFAULT_TOOL_PRIORITY) {
    const config = TOOL_CONFIGS[toolId];
    let projectPath = null;
    let globalPath = null;
    for (const dir of config.detect.projectDirs) {
      const fullPath = path2.join(projectRoot, dir);
      if (await exists(fullPath)) {
        projectPath = fullPath;
        break;
      }
    }
    if (!projectPath) {
      for (const file of config.detect.configFiles) {
        const fullPath = path2.join(projectRoot, file);
        if (await exists(fullPath)) {
          projectPath = path2.dirname(fullPath);
          if (projectPath === projectRoot) {
            projectPath = path2.join(projectRoot, config.rules.projectPath);
          }
          break;
        }
      }
    }
    for (const dir of config.detect.globalDirs) {
      if (await exists(dir)) {
        globalPath = dir;
        break;
      }
    }
    if (projectPath || globalPath) {
      detected.push({ config, projectPath, globalPath });
    }
  }
  return detected;
}
function filterTools(detected, toolIds) {
  const idSet = new Set(toolIds);
  return detected.filter((t) => idSet.has(t.config.id));
}
function getSkillTools(detected) {
  return detected.filter((t) => t.config.skills !== null);
}
function formatDetectedTools(detected) {
  if (detected.length === 0) {
    return "No AI coding tools detected in this project.";
  }
  const lines = ["Detected tools:"];
  for (const tool of detected) {
    const locations = [];
    if (tool.projectPath) locations.push("project");
    if (tool.globalPath) locations.push("global");
    lines.push(`  \u2022 ${tool.config.name} (${locations.join(", ")})`);
  }
  return lines.join("\n");
}

// src/commands/discovery/detect.ts
function registerDetectCommand(program2) {
  program2.command("detect").description("Show detected AI coding tools").action(async () => {
    const { json, verbose } = program2.opts();
    const projectRoot = process.cwd();
    const spinner = new SpinnerManager("Detecting tools...", json ?? false);
    try {
      const detectedTools = await detectTools(projectRoot);
      spinner.stop();
      if (json) {
        outputJson({ ok: true, detected: detectedTools.map((t) => t.config.id) });
        return;
      }
      console.log();
      console.log(formatDetectedTools(detectedTools));
      console.log();
      if (detectedTools.length > 0) {
        const skillTools = getSkillTools(detectedTools);
        if (skillTools.length > 0) {
          console.log(chalk7.dim("Tools supporting skills:"));
          for (const tool of skillTools) {
            console.log(chalk7.dim(`  - ${tool.config.name}`));
          }
        }
      }
    } catch (error) {
      spinner.fail(`Detection failed: ${stringifyError(error, verbose)}`);
      if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
      setExitCode(mapApiErrorToExitCode(error));
    }
  });
}

// src/commands/discovery/index.ts
function registerDiscoveryCommands(program2) {
  registerSearchCommand(program2);
  registerInfoCommand(program2);
  registerDetectCommand(program2);
}

// src/commands/package/install.ts
import chalk8 from "chalk";

// src/installer.ts
import fs2 from "fs/promises";
import path3 from "path";

// src/converter.ts
import YAML from "yaml";
function parseFrontmatter(content) {
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
function serializeFrontmatter(frontmatter, body) {
  if (Object.keys(frontmatter).length === 0) {
    return body;
  }
  const yaml = YAML.stringify(frontmatter).trim();
  return `---
${yaml}
---

${body}`;
}
function toMDCFormat(content) {
  const { frontmatter, body } = parseFrontmatter(content);
  const mdcFrontmatter = {};
  if (frontmatter.name) {
    mdcFrontmatter.description = frontmatter.name;
  }
  if (frontmatter.description) {
    mdcFrontmatter.description = frontmatter.description;
  }
  if (frontmatter.globs) {
    mdcFrontmatter.globs = frontmatter.globs;
  }
  if (frontmatter.paths && !frontmatter.globs) {
    const paths = Array.isArray(frontmatter.paths) ? frontmatter.paths : [frontmatter.paths];
    mdcFrontmatter.globs = paths.join(",");
  }
  mdcFrontmatter.alwaysApply = frontmatter.alwaysApply ?? false;
  return serializeFrontmatter(mdcFrontmatter, body);
}
function toClaudeCodeFormat(content) {
  const { frontmatter, body } = parseFrontmatter(content);
  const ccFrontmatter = {};
  if (frontmatter.globs) {
    const globs = typeof frontmatter.globs === "string" ? frontmatter.globs.split(",").map((g) => g.trim()) : frontmatter.globs;
    ccFrontmatter.paths = globs;
  }
  if (frontmatter.paths) {
    ccFrontmatter.paths = frontmatter.paths;
  }
  if (Object.keys(ccFrontmatter).length === 0) {
    return body;
  }
  return serializeFrontmatter(ccFrontmatter, body);
}
function toContinueFormat(content) {
  const { frontmatter, body } = parseFrontmatter(content);
  const continueFrontmatter = {};
  if (frontmatter.name) {
    continueFrontmatter.name = frontmatter.name;
  }
  if (frontmatter.description) {
    continueFrontmatter.description = frontmatter.description;
  }
  if (frontmatter.paths && !frontmatter.globs) {
    const paths = Array.isArray(frontmatter.paths) ? frontmatter.paths : [frontmatter.paths];
    continueFrontmatter.globs = paths.length === 1 ? paths[0] : paths;
  } else if (frontmatter.globs) {
    continueFrontmatter.globs = frontmatter.globs;
  }
  return serializeFrontmatter(continueFrontmatter, body);
}
function toPlainMarkdown(content) {
  const { body } = parseFrontmatter(content);
  return body;
}
function convertToToolFormat(content, toolConfig, packageName) {
  switch (toolConfig.rules.format) {
    case "mdc":
      return toMDCFormat(content);
    case "markdown":
      if (toolConfig.id === "claude-code") {
        return toClaudeCodeFormat(content);
      }
      if (toolConfig.id === "continue") {
        return toContinueFormat(content);
      }
      return toPlainMarkdown(content);
    case "aider-config":
      return toPlainMarkdown(content);
    default:
      return content;
  }
}

// src/installer.ts
import YAML2 from "yaml";
async function ensureDir(dir) {
  await fs2.mkdir(dir, { recursive: true });
}
async function fileExists(p) {
  try {
    await fs2.access(p);
    return true;
  } catch {
    return false;
  }
}
async function readFile(p) {
  try {
    return await fs2.readFile(p, "utf-8");
  } catch {
    return null;
  }
}
async function installPackage(pkg, detectedTools, projectRoot, options) {
  const results = [];
  const ruleFile = pkg.files.find(
    (f) => f.path === "rule.md" || f.path.endsWith("/rule.md")
  );
  const skillFile = pkg.files.find(
    (f) => f.path === "SKILL.md" || f.path.endsWith("/SKILL.md")
  );
  const installAsSkill = options.asSkill && skillFile;
  const mainContent = installAsSkill ? skillFile?.content : ruleFile?.content;
  if (!mainContent) {
    throw new Error(`Package ${pkg.manifest.name} has no installable content`);
  }
  for (const tool of detectedTools) {
    const toolId = tool.config.id;
    const manifest = pkg.manifest;
    if (installAsSkill) {
      if (!manifest.compatibility.skills?.includes(toolId)) {
        results.push({
          tool: toolId,
          toolName: tool.config.name,
          type: "skill",
          path: "",
          success: false,
          skipped: true,
          skipReason: "Skills not supported by this tool"
        });
        continue;
      }
      if (!tool.config.skills) {
        results.push({
          tool: toolId,
          toolName: tool.config.name,
          type: "skill",
          path: "",
          success: false,
          skipped: true,
          skipReason: "Tool does not support skills"
        });
        continue;
      }
    } else {
      if (!manifest.compatibility.rules?.includes(toolId)) {
        results.push({
          tool: toolId,
          toolName: tool.config.name,
          type: "rule",
          path: "",
          success: false,
          skipped: true,
          skipReason: "Tool not in compatibility list"
        });
        continue;
      }
    }
    const override = manifest.install?.[toolId];
    if (override?.disabled) {
      results.push({
        tool: toolId,
        toolName: tool.config.name,
        type: installAsSkill ? "skill" : "rule",
        path: "",
        success: false,
        skipped: true,
        skipReason: "Disabled for this tool"
      });
      continue;
    }
    let content = mainContent;
    if (override?.file) {
      const overrideFile = pkg.files.find((f) => f.path === override.file);
      if (overrideFile) {
        content = overrideFile.content;
      }
    }
    try {
      let result;
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
        type: installAsSkill ? "skill" : "rule",
        path: "",
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return results;
}
async function installRule(pkg, tool, content, projectRoot, options) {
  const toolId = tool.config.id;
  const rulesConfig = tool.config.rules;
  const basePath = options.global ? rulesConfig.globalPath : path3.join(projectRoot, rulesConfig.projectPath);
  const override = pkg.manifest.install?.[toolId];
  if (override?.action) {
    return handleSpecialAction(pkg, tool, content, projectRoot, options, override.action);
  }
  const convertedContent = convertToToolFormat(content, tool.config, pkg.manifest.name);
  const filename = `${pkg.manifest.name}${rulesConfig.fileExtension}`;
  const targetPath = path3.join(basePath, filename);
  if (!options.force && await fileExists(targetPath)) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: "rule",
      path: targetPath,
      success: false,
      skipped: true,
      skipReason: "File already exists (use --force to overwrite)"
    };
  }
  if (options.dryRun) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: "rule",
      path: targetPath,
      success: true,
      skipped: true,
      skipReason: "Dry run"
    };
  }
  await ensureDir(basePath);
  await fs2.writeFile(targetPath, convertedContent, "utf-8");
  return {
    tool: toolId,
    toolName: tool.config.name,
    type: "rule",
    path: targetPath,
    success: true
  };
}
async function installSkill(pkg, tool, content, projectRoot, options) {
  const toolId = tool.config.id;
  const skillsConfig = tool.config.skills;
  if (!skillsConfig) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: "skill",
      path: "",
      success: false,
      skipped: true,
      skipReason: "Tool does not support skills"
    };
  }
  const basePath = options.global ? skillsConfig.globalPath : path3.join(projectRoot, skillsConfig.projectPath);
  const skillDir = path3.join(basePath, pkg.manifest.name);
  const skillPath = path3.join(skillDir, "SKILL.md");
  if (!options.force && await fileExists(skillPath)) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: "skill",
      path: skillPath,
      success: false,
      skipped: true,
      skipReason: "Skill already exists (use --force to overwrite)"
    };
  }
  if (options.dryRun) {
    return {
      tool: toolId,
      toolName: tool.config.name,
      type: "skill",
      path: skillPath,
      success: true,
      skipped: true,
      skipReason: "Dry run"
    };
  }
  await ensureDir(skillDir);
  await fs2.writeFile(skillPath, content, "utf-8");
  for (const file of pkg.files) {
    if (file.path !== "SKILL.md" && file.path !== "rule.md" && file.path !== "manifest.json") {
      const targetFile = path3.join(skillDir, file.path);
      await ensureDir(path3.dirname(targetFile));
      await fs2.writeFile(targetFile, file.content, "utf-8");
    }
  }
  return {
    tool: toolId,
    toolName: tool.config.name,
    type: "skill",
    path: skillPath,
    success: true
  };
}
async function handleSpecialAction(pkg, tool, content, projectRoot, options, action) {
  const toolId = tool.config.id;
  const { body } = parseFrontmatter(content);
  switch (action) {
    case "append-to-agents-md": {
      const agentsPath = options.global ? path3.join(tool.config.rules.globalPath, "AGENTS.md") : path3.join(projectRoot, "AGENTS.md");
      if (options.dryRun) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: "rule",
          path: agentsPath,
          success: true,
          skipped: true,
          skipReason: "Dry run - would append to AGENTS.md"
        };
      }
      const existing = await readFile(agentsPath) || "";
      const section = `
## ${pkg.manifest.name}

${body}
`;
      if (existing.includes(`## ${pkg.manifest.name}`)) {
        if (!options.force) {
          return {
            tool: toolId,
            toolName: tool.config.name,
            type: "rule",
            path: agentsPath,
            success: false,
            skipped: true,
            skipReason: "Section already exists in AGENTS.md"
          };
        }
        const regex = new RegExp(`
## ${pkg.manifest.name}
[\\s\\S]*?(?=
## |$)`, "g");
        const updated = existing.replace(regex, "") + section;
        await fs2.writeFile(agentsPath, updated, "utf-8");
      } else {
        await fs2.writeFile(agentsPath, existing + section, "utf-8");
      }
      return {
        tool: toolId,
        toolName: tool.config.name,
        type: "rule",
        path: agentsPath,
        success: true
      };
    }
    case "append-to-gemini-md": {
      const geminiPath = options.global ? path3.join(tool.config.rules.globalPath, "GEMINI.md") : path3.join(projectRoot, "GEMINI.md");
      if (options.dryRun) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: "rule",
          path: geminiPath,
          success: true,
          skipped: true,
          skipReason: "Dry run - would append to GEMINI.md"
        };
      }
      const existing = await readFile(geminiPath) || "";
      const section = `
## ${pkg.manifest.name}

${body}
`;
      if (existing.includes(`## ${pkg.manifest.name}`) && !options.force) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: "rule",
          path: geminiPath,
          success: false,
          skipped: true,
          skipReason: "Section already exists in GEMINI.md"
        };
      }
      await fs2.writeFile(geminiPath, existing + section, "utf-8");
      return {
        tool: toolId,
        toolName: tool.config.name,
        type: "rule",
        path: geminiPath,
        success: true
      };
    }
    case "add-to-read-config": {
      const rulePath = path3.join(projectRoot, `${pkg.manifest.name}.md`);
      const configPath = path3.join(projectRoot, ".aider.conf.yml");
      if (options.dryRun) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: "rule",
          path: rulePath,
          success: true,
          skipped: true,
          skipReason: "Dry run - would create file and update .aider.conf.yml"
        };
      }
      await fs2.writeFile(rulePath, body, "utf-8");
      const existingConfig = await readFile(configPath);
      let config = {};
      if (existingConfig) {
        try {
          config = YAML2.parse(existingConfig) || {};
        } catch {
        }
      }
      const readList = config.read;
      const fileName = `${pkg.manifest.name}.md`;
      if (Array.isArray(readList)) {
        if (!readList.includes(fileName)) {
          readList.push(fileName);
        }
      } else if (typeof readList === "string") {
        if (readList !== fileName) {
          config.read = [readList, fileName];
        }
      } else {
        config.read = fileName;
      }
      await fs2.writeFile(configPath, YAML2.stringify(config), "utf-8");
      return {
        tool: toolId,
        toolName: tool.config.name,
        type: "rule",
        path: rulePath,
        success: true
      };
    }
    case "add-with-gemini-import": {
      const rulesDir = options.global ? tool.config.rules.globalPath : path3.join(projectRoot, ".gemini", "rules");
      const rulePath = path3.join(rulesDir, `${pkg.manifest.name}.md`);
      const geminiMdPath = options.global ? path3.join(path3.dirname(tool.config.rules.globalPath), "GEMINI.md") : path3.join(projectRoot, "GEMINI.md");
      if (options.dryRun) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: "rule",
          path: rulePath,
          success: true,
          skipped: true,
          skipReason: "Dry run - would create rule file and add @import to GEMINI.md"
        };
      }
      if (!options.force && await fileExists(rulePath)) {
        return {
          tool: toolId,
          toolName: tool.config.name,
          type: "rule",
          path: rulePath,
          success: false,
          skipped: true,
          skipReason: "File already exists (use --force to overwrite)"
        };
      }
      await ensureDir(rulesDir);
      await fs2.writeFile(rulePath, body, "utf-8");
      const existingGemini = await readFile(geminiMdPath) || "";
      const importLine = `@rules/${pkg.manifest.name}.md`;
      if (!existingGemini.includes(importLine)) {
        const newContent = existingGemini.trim() ? existingGemini.trimEnd() + "\n" + importLine + "\n" : importLine + "\n";
        await fs2.writeFile(geminiMdPath, newContent, "utf-8");
      }
      return {
        tool: toolId,
        toolName: tool.config.name,
        type: "rule",
        path: rulePath,
        success: true
      };
    }
    default:
      return {
        tool: toolId,
        toolName: tool.config.name,
        type: "rule",
        path: "",
        success: false,
        error: `Unknown action: ${action}`
      };
  }
}
async function uninstallPackage(packageName, detectedTools, projectRoot, options) {
  const results = [];
  for (const tool of detectedTools) {
    const toolId = tool.config.id;
    const rulesConfig = tool.config.rules;
    const ruleBasePath = options.global ? rulesConfig.globalPath : path3.join(projectRoot, rulesConfig.projectPath);
    const ruleFilename = `${packageName}${rulesConfig.fileExtension}`;
    const rulePath = path3.join(ruleBasePath, ruleFilename);
    if (await fileExists(rulePath)) {
      if (!options.dryRun) {
        await fs2.unlink(rulePath);
      }
      results.push({
        tool: toolId,
        toolName: tool.config.name,
        type: "rule",
        path: rulePath,
        success: true,
        skipped: options.dryRun,
        skipReason: options.dryRun ? "Dry run" : void 0
      });
    }
    if (tool.config.skills) {
      const skillBasePath = options.global ? tool.config.skills.globalPath : path3.join(projectRoot, tool.config.skills.projectPath);
      const skillDir = path3.join(skillBasePath, packageName);
      if (await fileExists(skillDir)) {
        if (!options.dryRun) {
          await fs2.rm(skillDir, { recursive: true });
        }
        results.push({
          tool: toolId,
          toolName: tool.config.name,
          type: "skill",
          path: skillDir,
          success: true,
          skipped: options.dryRun,
          skipReason: options.dryRun ? "Dry run" : void 0
        });
      }
    }
  }
  return results;
}
async function listInstalled(detectedTools, projectRoot, options) {
  const installed = /* @__PURE__ */ new Map();
  for (const tool of detectedTools) {
    const toolId = tool.config.id;
    const rulesConfig = tool.config.rules;
    const rules = [];
    const skills = [];
    const ruleBasePath = options.global ? rulesConfig.globalPath : path3.join(projectRoot, rulesConfig.projectPath);
    try {
      const files = await fs2.readdir(ruleBasePath);
      for (const file of files) {
        if (file.endsWith(rulesConfig.fileExtension)) {
          rules.push(file.replace(rulesConfig.fileExtension, ""));
        }
      }
    } catch {
    }
    if (tool.config.skills) {
      const skillBasePath = options.global ? tool.config.skills.globalPath : path3.join(projectRoot, tool.config.skills.projectPath);
      try {
        const dirs = await fs2.readdir(skillBasePath);
        for (const dir of dirs) {
          const skillPath = path3.join(skillBasePath, dir, "SKILL.md");
          if (await fileExists(skillPath)) {
            skills.push(dir);
          }
        }
      } catch {
      }
    }
    if (rules.length > 0 || skills.length > 0) {
      installed.set(toolId, { rules, skills });
    }
  }
  return installed;
}

// src/registry.ts
import fs3 from "fs/promises";
import path4 from "path";
import os2 from "os";
var SCHEMA_VERSION = 1;
function emptyRegistry() {
  return { schemaVersion: SCHEMA_VERSION, packages: {} };
}
function registryKey(name, installType) {
  return `${name}::${installType}`;
}
function getRegistryPath(projectRoot, global) {
  if (global) {
    return path4.join(os2.homedir(), ".faster", "installed.json");
  }
  return path4.join(projectRoot, ".faster", "installed.json");
}
async function ensureDir2(dir) {
  await fs3.mkdir(dir, { recursive: true });
}
async function readRegistry(projectRoot, global) {
  const registryPath = getRegistryPath(projectRoot, global);
  try {
    const raw = await fs3.readFile(registryPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION || typeof parsed.packages !== "object") {
      return emptyRegistry();
    }
    return parsed;
  } catch {
    return emptyRegistry();
  }
}
async function writeRegistry(projectRoot, global, registry) {
  const registryPath = getRegistryPath(projectRoot, global);
  await ensureDir2(path4.dirname(registryPath));
  await fs3.writeFile(registryPath, JSON.stringify(registry, null, 2), "utf-8");
}
function upsertInstalledPackage(registry, record) {
  registry.packages[registryKey(record.name, record.installType)] = record;
}
function removeInstalledPackage(registry, name, installType) {
  if (installType) {
    delete registry.packages[registryKey(name, installType)];
    return;
  }
  delete registry.packages[registryKey(name, "rule")];
  delete registry.packages[registryKey(name, "skill")];
}
function listInstalledPackages(registry) {
  return Object.values(registry.packages);
}

// src/commands/shared/package-helpers.ts
import path5 from "path";
async function resolveDetectedTools(projectRoot, options, defaultTools) {
  let detectedTools = await detectTools(projectRoot);
  if (detectedTools.length === 0) {
    detectedTools = Object.values(TOOL_CONFIGS).map((config) => ({
      config,
      projectPath: path5.join(projectRoot, config.rules.projectPath),
      globalPath: config.rules.globalPath
    }));
  }
  const toolFilter = options.tools && options.tools.length > 0 ? options.tools : defaultTools && defaultTools.length > 0 ? defaultTools : void 0;
  if (toolFilter) {
    detectedTools = filterTools(detectedTools, toolFilter);
    if (detectedTools.length === 0) {
      throw new Error(`None of the specified tools were found: ${toolFilter.join(", ")}`);
    }
  }
  if (options.asSkill) {
    detectedTools = getSkillTools(detectedTools);
    if (detectedTools.length === 0) {
      throw new Error("No detected tools support skills");
    }
  }
  return detectedTools;
}

// src/commands/package/install.ts
import fs4 from "fs/promises";
import path6 from "path";
function registerInstallCommand(program2) {
  program2.command("install <package>").alias("add").description("Install a skill or rule from faster.dev").option("-g, --global", "Install globally instead of to project").option("-t, --tools <tools>", "Comma-separated list of tools to install to").option("--as-skill", "Install as a skill (where supported)").option("-f, --force", "Overwrite existing installations").option("--dry-run", "Show what would be installed without making changes").option("--from-file <path>", "Install from a local package directory").action(async (packageInput, opts) => {
    const { json, verbose } = program2.opts();
    const projectRoot = process.cwd();
    const { name: packageName, version } = parsePackageSpec(packageInput);
    const options = {
      global: opts.global ?? false,
      tools: opts.tools ? opts.tools.split(",") : void 0,
      asSkill: opts.asSkill ?? false,
      force: opts.force ?? false,
      dryRun: opts.dryRun ?? false
    };
    const defaultTools = getDefaultTools();
    const spinner = new SpinnerManager("Detecting tools...", json ?? false);
    try {
      const detectedTools = await resolveDetectedTools(projectRoot, options, defaultTools);
      spinner.text(`Fetching package: ${packageName}...`);
      let pkg;
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
      const successTools = results.filter((r) => r.success && !r.skipped).map((r) => r.tool);
      if (!options.dryRun && successTools.length > 0) {
        const registry = await readRegistry(projectRoot, options.global);
        upsertInstalledPackage(registry, {
          name: pkg.manifest.name,
          version: pkg.manifest.version,
          installType,
          tools: successTools,
          installedAt: (/* @__PURE__ */ new Date()).toISOString(),
          source: isLocal ? "local" : "registry",
          localPath: isLocal ? opts.fromFile : void 0
        });
        await writeRegistry(projectRoot, options.global, registry);
      }
      if (json) {
        outputJson({
          package: pkg.manifest,
          results
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
function printInstallResults(pkg, results) {
  console.log();
  console.log(chalk8.bold(`\u{1F4E6} ${pkg.manifest.name} v${pkg.manifest.version}`));
  console.log(chalk8.dim(pkg.manifest.description));
  console.log();
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  for (const result of results) {
    if (result.success && !result.skipped) {
      successCount++;
      console.log(
        chalk8.green("  \u2713"),
        chalk8.bold(result.toolName),
        chalk8.dim(`\u2192 ${result.path}`)
      );
    } else if (result.skipped) {
      skipCount++;
      console.log(
        chalk8.yellow("  \u2298"),
        chalk8.bold(result.toolName),
        chalk8.dim(`(${result.skipReason})`)
      );
    } else {
      errorCount++;
      console.log(
        chalk8.red("  \u2717"),
        chalk8.bold(result.toolName),
        chalk8.dim(`(${result.error})`)
      );
    }
  }
  console.log();
  if (successCount > 0) {
    console.log(chalk8.green(`Installed to ${successCount} tool(s)`));
  }
  if (skipCount > 0) {
    console.log(chalk8.yellow(`Skipped ${skipCount} tool(s)`));
  }
  if (errorCount > 0) {
    console.log(chalk8.red(`Failed for ${errorCount} tool(s)`));
    setExitCode(EXIT_CODES.ERROR);
  }
}
async function loadLocalPackage(dir) {
  const files = [];
  const manifestPath = path6.join(dir, "manifest.json");
  const manifestContent = await fs4.readFile(manifestPath, "utf-8");
  files.push({ path: "manifest.json", content: manifestContent });
  const manifest = JSON.parse(manifestContent);
  const entries = await fs4.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name !== "manifest.json") {
      if (entry.name.endsWith(".md") || entry.name.endsWith(".mdc") || entry.name.endsWith(".txt")) {
        const content = await fs4.readFile(path6.join(dir, entry.name), "utf-8");
        files.push({ path: entry.name, content });
      }
    }
  }
  const assetsDir = path6.join(dir, "assets");
  try {
    const assetEntries = await fs4.readdir(assetsDir, { withFileTypes: true });
    for (const entry of assetEntries) {
      if (entry.isFile()) {
        const content = await fs4.readFile(path6.join(assetsDir, entry.name), "utf-8");
        files.push({ path: `assets/${entry.name}`, content });
      }
    }
  } catch {
  }
  return { manifest, files };
}

// src/commands/package/remove.ts
import chalk9 from "chalk";
function registerRemoveCommand(program2) {
  program2.command("remove <package>").alias("uninstall").description("Remove an installed skill or rule").option("-g, --global", "Remove from global installation").option("--dry-run", "Show what would be removed without making changes").action(async (packageInput, opts) => {
    const { json, verbose } = program2.opts();
    const projectRoot = process.cwd();
    const { name: packageName } = parsePackageSpec(packageInput);
    const spinner = new SpinnerManager("Detecting tools...", json ?? false);
    try {
      const detectedTools = await detectTools(projectRoot);
      if (detectedTools.length === 0) {
        spinner.fail("No AI coding tools detected");
        if (json) outputJson({ ok: false, error: "No AI coding tools detected" });
        setExitCode(EXIT_CODES.ERROR);
        return;
      }
      spinner.text(`Removing ${packageName}...`);
      const results = await uninstallPackage(packageName, detectedTools, projectRoot, {
        global: opts.global ?? false,
        dryRun: opts.dryRun ?? false
      });
      spinner.stop();
      if (!opts.dryRun && results.length > 0) {
        const registry = await readRegistry(projectRoot, opts.global ?? false);
        removeInstalledPackage(registry, packageName);
        await writeRegistry(projectRoot, opts.global ?? false, registry);
      }
      if (results.length === 0) {
        if (json) {
          outputJson({ ok: false, error: `Package ${packageName} not found in any tool` });
        } else {
          console.log(chalk9.yellow(`Package ${packageName} not found in any tool`));
        }
        setExitCode(EXIT_CODES.NOT_FOUND);
        return;
      }
      if (json) {
        outputJson({ ok: true, results });
        return;
      }
      console.log();
      for (const result of results) {
        if (result.success) {
          console.log(
            chalk9.green("  \u2713"),
            `Removed from ${result.toolName}:`,
            chalk9.dim(result.path)
          );
        }
      }
    } catch (error) {
      spinner.fail(`Failed: ${stringifyError(error, verbose)}`);
      if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
      setExitCode(mapApiErrorToExitCode(error));
    }
  });
}

// src/commands/package/list.ts
import chalk10 from "chalk";
function registerListCommand(program2) {
  program2.command("list").alias("ls").description("List installed skills and rules").option("-g, --global", "List global installations").action(async (opts) => {
    const { json, verbose } = program2.opts();
    const projectRoot = process.cwd();
    const spinner = new SpinnerManager("Detecting tools...", json ?? false);
    try {
      const detectedTools = await detectTools(projectRoot);
      if (detectedTools.length === 0) {
        spinner.info("No AI coding tools detected");
        if (json) outputJson({ ok: true, tools: {} });
        return;
      }
      const installed = await listInstalled(detectedTools, projectRoot, {
        global: opts.global ?? false
      });
      spinner.stop();
      const registry = await readRegistry(projectRoot, opts.global ?? false);
      const registryPackages = listInstalledPackages(registry);
      if (installed.size === 0) {
        if (json) {
          outputJson({ ok: true, tools: {}, registry: registryPackages });
        } else {
          console.log(chalk10.yellow("No packages installed"));
        }
        return;
      }
      if (json) {
        const tools = {};
        for (const [toolId, packages] of installed) {
          tools[toolId] = packages;
        }
        outputJson({ ok: true, tools, registry: registryPackages });
        return;
      }
      console.log();
      for (const [toolId, packages] of installed) {
        const config = TOOL_CONFIGS[toolId];
        console.log(chalk10.bold(config.name));
        if (packages.rules.length > 0) {
          console.log(chalk10.dim("  Rules:"));
          for (const rule of packages.rules) {
            console.log(`    - ${rule}`);
          }
        }
        if (packages.skills.length > 0) {
          console.log(chalk10.dim("  Skills:"));
          for (const skill of packages.skills) {
            console.log(`    - ${skill}`);
          }
        }
        console.log();
      }
    } catch (error) {
      spinner.fail(`Failed: ${stringifyError(error, verbose)}`);
      if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
      setExitCode(mapApiErrorToExitCode(error));
    }
  });
}

// src/commands/package/update.ts
import chalk11 from "chalk";
import semver from "semver";
function registerUpdateCommand(program2) {
  program2.command("update [package]").description("Update installed packages to the latest version").option("-g, --global", "Update global installations").option("-t, --tools <tools>", "Comma-separated list of tools to install to").option("--as-skill", "Update as a skill (where supported)").option("-f, --force", "Overwrite existing installations").option("--dry-run", "Show what would be updated without making changes").action(async (packageInput, opts) => {
    const { json, verbose } = program2.opts();
    const projectRoot = process.cwd();
    const spinner = new SpinnerManager("Resolving updates...", json ?? false);
    try {
      const registry = await readRegistry(projectRoot, opts.global ?? false);
      let installed = listInstalledPackages(registry).filter((p) => p.source === "registry");
      if (packageInput) {
        const parsed = parsePackageSpec(packageInput);
        installed = installed.filter((p) => p.name === parsed.name);
      }
      if (installed.length === 0) {
        spinner.stop();
        if (json) {
          outputJson({ ok: true, updated: [] });
        } else {
          console.log(chalk11.yellow("No matching installed packages to update"));
        }
        return;
      }
      const api = new FasterAPI(getConfig());
      const updated = [];
      for (const pkg of installed) {
        const info = await api.getPackageInfo(pkg.name);
        const latest = info.latestVersion;
        const targetVersion = latest;
        if (!semver.valid(pkg.version) || !semver.valid(targetVersion)) {
          continue;
        }
        if (!semver.lt(pkg.version, targetVersion)) {
          continue;
        }
        const options = {
          global: opts.global ?? false,
          tools: opts.tools ? opts.tools.split(",") : pkg.tools,
          asSkill: opts.asSkill ?? pkg.installType === "skill",
          force: opts.force ?? false,
          dryRun: opts.dryRun ?? false
        };
        const detectedTools = await resolveDetectedTools(projectRoot, options);
        const downloaded = await api.downloadPackage(pkg.name, targetVersion);
        const results = await installPackage(downloaded, detectedTools, projectRoot, options);
        const successTools = results.filter((r) => r.success && !r.skipped).map((r) => r.tool);
        if (!options.dryRun && successTools.length > 0) {
          upsertInstalledPackage(registry, {
            name: downloaded.manifest.name,
            version: downloaded.manifest.version,
            installType: resolveInstallType(options.asSkill),
            tools: successTools,
            installedAt: (/* @__PURE__ */ new Date()).toISOString(),
            source: "registry"
          });
        }
        updated.push({
          name: pkg.name,
          from: pkg.version,
          to: targetVersion,
          installType: pkg.installType
        });
      }
      if (!opts.dryRun) {
        await writeRegistry(projectRoot, opts.global ?? false, registry);
      }
      spinner.stop();
      if (json) {
        outputJson({ ok: true, updated });
        return;
      }
      if (updated.length === 0) {
        console.log(chalk11.green("All packages are up to date"));
        return;
      }
      console.log();
      for (const update of updated) {
        console.log(
          `  \u2713 ${chalk11.bold(update.name)} (${update.installType}) ${chalk11.dim(update.from)} \u2192 ${chalk11.green(update.to)}`
        );
      }
    } catch (error) {
      spinner.fail(`Update failed: ${stringifyError(error, verbose)}`);
      if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
      setExitCode(mapApiErrorToExitCode(error));
    }
  });
}

// src/commands/package/outdated.ts
import chalk12 from "chalk";
import semver2 from "semver";
function registerOutdatedCommand(program2) {
  program2.command("outdated").description("List installed packages that have updates available").option("-g, --global", "Check global installations").action(async (opts) => {
    const { json, verbose } = program2.opts();
    const projectRoot = process.cwd();
    const spinner = new SpinnerManager("Checking for updates...", json ?? false);
    try {
      const registry = await readRegistry(projectRoot, opts.global ?? false);
      const installed = listInstalledPackages(registry).filter((p) => p.source === "registry");
      if (installed.length === 0) {
        spinner.stop();
        if (json) {
          outputJson({ ok: true, updates: [] });
        } else {
          console.log(chalk12.green("All packages are up to date"));
        }
        return;
      }
      const api = new FasterAPI(getConfig());
      const updates = [];
      for (const pkg of installed) {
        const info = await api.getPackageInfo(pkg.name);
        const latest = info.latestVersion;
        if (semver2.valid(pkg.version) && semver2.valid(latest) && semver2.lt(pkg.version, latest)) {
          updates.push({
            name: pkg.name,
            current: pkg.version,
            latest,
            installType: pkg.installType
          });
        }
      }
      spinner.stop();
      if (json) {
        outputJson({ ok: true, updates });
        return;
      }
      if (updates.length === 0) {
        console.log(chalk12.green("All packages are up to date"));
        return;
      }
      console.log();
      for (const update of updates) {
        console.log(
          `  - ${chalk12.bold(update.name)} (${update.installType}) ${chalk12.dim(update.current)} \u2192 ${chalk12.green(update.latest)}`
        );
      }
    } catch (error) {
      spinner.fail(`Outdated check failed: ${stringifyError(error, verbose)}`);
      if (json) outputJson({ ok: false, error: stringifyError(error, verbose) });
      setExitCode(mapApiErrorToExitCode(error));
    }
  });
}

// src/commands/package/index.ts
function registerPackageCommands(program2) {
  registerInstallCommand(program2);
  registerRemoveCommand(program2);
  registerListCommand(program2);
  registerUpdateCommand(program2);
  registerOutdatedCommand(program2);
}

// src/commands/config.ts
import chalk13 from "chalk";
function registerConfigCommand(program2) {
  program2.command("config").description("Manage CLI configuration").option("--set-tools <tools>", "Set default tools (comma-separated)").option("--clear-tools", "Clear default tools").option("--set-api-url <url>", "Set API base URL").option("--path", "Show config file path").action((opts) => {
    const { json } = program2.opts();
    if (opts.path) {
      if (json) outputJson({ path: getConfigPath() });
      else console.log(getConfigPath());
      return;
    }
    if (opts.setApiUrl) {
      setApiUrl(opts.setApiUrl);
      if (json) outputJson({ ok: true, apiUrl: opts.setApiUrl });
      else console.log(chalk13.green(`API URL set: ${opts.setApiUrl}`));
      return;
    }
    if (opts.setTools) {
      const tools = opts.setTools.split(",");
      for (const tool of tools) {
        if (!TOOL_CONFIGS[tool]) {
          if (json) {
            outputJson({ ok: false, error: `Unknown tool: ${tool}` });
          } else {
            console.log(chalk13.red(`Unknown tool: ${tool}`));
            console.log(chalk13.dim(`Available: ${Object.keys(TOOL_CONFIGS).join(", ")}`));
          }
          setExitCode(EXIT_CODES.INVALID_ARGS);
          return;
        }
      }
      setDefaultTools(tools);
      if (json) outputJson({ ok: true, defaultTools: tools });
      else console.log(chalk13.green(`Default tools set: ${tools.join(", ")}`));
      return;
    }
    if (opts.clearTools) {
      setDefaultTools([]);
      if (json) outputJson({ ok: true, defaultTools: [] });
      else console.log(chalk13.green("Default tools cleared"));
      return;
    }
    const config = getConfig();
    if (json) {
      outputJson({
        apiUrl: config.apiUrl,
        authenticated: Boolean(config.authToken),
        defaultTools: config.defaultTools ?? null,
        configPath: getConfigPath()
      });
      return;
    }
    console.log();
    console.log(chalk13.bold("Configuration:"));
    console.log(`  API URL: ${config.apiUrl}`);
    console.log(`  Authenticated: ${config.authToken ? chalk13.green("Yes") : chalk13.yellow("No")}`);
    console.log(`  Default tools: ${config.defaultTools?.join(", ") || chalk13.dim("(all detected)")}`);
    console.log(`  Config path: ${chalk13.dim(getConfigPath())}`);
  });
}

// src/commands/index.ts
function registerAllCommands(program2) {
  registerAuthCommands(program2);
  registerDiscoveryCommands(program2);
  registerPackageCommands(program2);
  registerConfigCommand(program2);
}

// src/cli.ts
var program = new Command();
program.name("fasterdev").description("Install AI coding assistant skills and rules from faster.dev").version("0.1.0").option("--json", "Output JSON").option("--verbose", "Verbose output");
registerAllCommands(program);
program.parse();

# @faster.dev/cli

Install AI coding assistant skills and rules from faster.dev to Claude Code, Cursor, Codex, Cline, Roo Code, Continue, Aider, Gemini CLI, Amp, and OpenCode — all with a single command.

## Installation

```bash
npm install -g @faster.dev/cli
```

## Quick Start

```bash
# Authenticate with faster.dev
faster login

# Install a rule to all detected tools
faster install api-conventions

# Install to specific tools only
faster install api-conventions --tools claude-code,cursor

# Install as a skill (for tools that support skills)
faster install docx-generator --as-skill

# Install globally
faster install api-conventions --global
```

## Supported Tools

| Tool | Rules | Skills | Format |
|------|-------|--------|--------|
| Claude Code | ✅ | ✅ | `.claude/rules/*.md`, `.claude/skills/*/SKILL.md` |
| OpenAI Codex | ✅ | ✅ | `AGENTS.md`, `.codex/skills/*/SKILL.md` |
| Cursor | ✅ | ❌ | `.cursor/rules/*.mdc` |
| Cline | ✅ | ❌ | `.clinerules/*.md` |
| Roo Code | ✅ | ❌ | `.roo/rules/*.md` |
| Continue.dev | ✅ | ❌ | `.continue/rules/*.md` |
| Aider | ✅ | ❌ | `CONVENTIONS.md` + `.aider.conf.yml` |
| Gemini CLI | ✅ | ❌ | `GEMINI.md` |
| Amp | ✅ | ✅ | `AGENTS.md`, `.agents/skills/*/SKILL.md` |
| OpenCode | ✅ | ✅ | `.opencode/rules/*.md`, `.opencode/skill/*/SKILL.md` |

## Commands

### Authentication

```bash
# Log in to faster.dev
faster login

# Check authentication status
faster whoami

# Log out
faster logout
```

### Installing Packages

```bash
# Install a package
faster install <package-name>

# Install from local directory
faster install . --from-file ./my-package

# Options:
#   -g, --global     Install globally instead of to project
#   -t, --tools      Comma-separated list of tools to install to
#   --as-skill       Install as a skill (where supported)
#   -f, --force      Overwrite existing installations
#   --dry-run        Show what would be installed without making changes
```

### Removing Packages

```bash
# Remove a package from all tools
faster remove <package-name>

# Remove from global installation
faster remove <package-name> --global
```

### Listing & Searching

```bash
# List installed packages
faster list

# List global installations
faster list --global

# Search faster.dev
faster search "api conventions"
```

### Tool Detection

```bash
# Show detected AI coding tools in current directory
faster detect
```

### Configuration

```bash
# Show current configuration
faster config

# Set default tools (only install to these)
faster config --set-tools claude-code,cursor

# Clear default tools
faster config --clear-tools

# Show config file path
faster config --path
```

### Creating Packages

```bash
# Initialize a new package in current directory
faster init

# Publish to faster.dev
faster publish

# Validate without publishing
faster publish --dry-run
```

## Package Format

A faster.dev package consists of:

```
my-package/
├── manifest.json          # Package metadata
├── rule.md                # Rule content (for type: rule or both)
├── SKILL.md               # Skill content (for type: skill or both)
├── cursor.mdc             # Optional tool-specific override
└── assets/                # Optional supporting files
```

### manifest.json

```json
{
  "name": "api-conventions",
  "version": "1.0.0",
  "type": "rule",
  "description": "REST API design conventions for consistent API development",
  "compatibility": {
    "rules": ["claude-code", "cursor", "cline", "roo-code", "continue", "aider", "gemini", "codex", "amp", "opencode"],
    "skills": ["claude-code", "codex", "amp", "opencode"]
  },
  "install": {
    "cursor": { "file": "cursor.mdc" },
    "aider": { "action": "add-to-read-config" }
  }
}
```

### rule.md

```markdown
---
name: api-conventions
description: REST API design conventions
globs: "**/*.ts"
paths:
  - "src/api/**/*"
---

# API Conventions

- Use kebab-case for URL paths
- Use camelCase for JSON properties
- Return consistent error formats
```

### SKILL.md

```markdown
---
name: api-conventions
description: REST API design conventions skill
---

# API Conventions

When working with REST APIs, follow these guidelines:

## Naming
- Use kebab-case for URL paths
- Use camelCase for JSON properties

## Error Handling
- Return consistent error formats with request IDs
```

## Format Conversions

The CLI automatically converts between formats:

| Source | Target | Conversion |
|--------|--------|------------|
| Markdown + frontmatter | Cursor (.mdc) | `name` → `description`, `paths` → `globs` |
| Markdown + frontmatter | Claude Code | Keep `paths`, strip unsupported fields |
| Markdown + frontmatter | Cline/Roo | Strip frontmatter to plain markdown |
| Markdown + frontmatter | Continue | Keep `name`, `description`, `globs` |
| Any | Codex/Amp | Append as section to AGENTS.md |
| Any | Gemini | Append as section to GEMINI.md |
| Any | Aider | Create file + add to `.aider.conf.yml` read list |

## Environment Variables

- `FASTER_API_URL` - Override the API URL (for self-hosted)
- `FASTER_API_KEY` - Provide API key without login

## Configuration File

Config is stored at `~/.faster/config.json`:

```json
{
  "apiUrl": "https://api.faster.dev",
  "apiKey": "your-api-key",
  "defaultTools": ["claude-code", "cursor"]
}
```

## Local Development

```bash
# Clone and install
git clone https://github.com/faster-dev/cli
cd cli
npm install

# Run in development mode
npm run dev -- install some-package

# Build
npm run build
```

## License

MIT

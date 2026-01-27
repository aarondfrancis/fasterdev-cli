# fasterdev

Install AI coding assistant skills and rules from faster.dev to Claude Code, Cursor, Codex, Cline, Roo Code, Continue, Aider, Gemini CLI, Amp, and OpenCode — all with a single command.

## Installation

```bash
npm install -g fasterdev
```

## Quick Start

```bash
# Authenticate with faster.dev
fasterdev login

# Install a rule to all detected tools
fasterdev install api-conventions

# Install to specific tools only
fasterdev install api-conventions --tools claude-code,cursor

# Install as a skill (for tools that support skills)
fasterdev install docx-generator --as-skill

# Install globally
fasterdev install api-conventions --global
```

## Supported Tools

| Tool | Rules | Skills | Format |
|------|-------|--------|--------|
| Claude Code | Yes | Yes | `.claude/rules/*.md`, `.claude/skills/*/SKILL.md` |
| OpenAI Codex | Yes | Yes | `AGENTS.md`, `.codex/skills/*/SKILL.md` |
| Cursor | Yes | No | `.cursor/rules/*.mdc` |
| Cline | Yes | No | `.clinerules/*.md` |
| Roo Code | Yes | No | `.roo/rules/*.md` |
| Continue.dev | Yes | No | `.continue/rules/*.md` |
| Aider | Yes | No | `CONVENTIONS.md` + `.aider.conf.yml` |
| Gemini CLI | Yes | No | `GEMINI.md` |
| Amp | Yes | Yes | `AGENTS.md`, `.agents/skills/*/SKILL.md` |
| OpenCode | Yes | Yes | `.opencode/rules/*.md`, `.opencode/skill/*/SKILL.md` |

## Commands

### Authentication

```bash
# Log in to faster.dev
fasterdev login

# Check authentication status
fasterdev whoami

# Log out
fasterdev logout
```

`fasterdev login` opens your browser and uses a device code flow.
Use `--no-browser` if you want to copy the URL manually.

### Installing Packages

```bash
# Install a package
fasterdev install <package-name>

# Install from local directory
fasterdev install . --from-file ./my-package

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
fasterdev remove <package-name>

# Remove from global installation
fasterdev remove <package-name> --global
```

### Listing & Searching

```bash
# List installed packages
fasterdev list

# List global installations
fasterdev list --global

# Search faster.dev
fasterdev search "api conventions"

# Show package info
fasterdev info api-conventions

# Show outdated packages
fasterdev outdated

# Update packages
fasterdev update
```

### Tool Detection

```bash
# Show detected AI coding tools in current directory
fasterdev detect
```

### Configuration

```bash
# Show current configuration
fasterdev config

# Set default tools (only install to these)
fasterdev config --set-tools claude-code,cursor

# Clear default tools
fasterdev config --clear-tools

# Show config file path
fasterdev config --path
```

### Creating Packages

```bash
# Initialize a new package in current directory
fasterdev init

# Publish to faster.dev
fasterdev publish

# Validate without publishing
fasterdev publish --dry-run
```

## Documentation

See the [docs](./docs) folder for detailed documentation:

- [Introduction](./docs/index.md)
- [Installation](./docs/installation.md)
- [Usage](./docs/usage.md)
- [CLI Reference](./docs/cli.md)
- [Configuration](./docs/configuration.md)
- [Supported Tools](./docs/supported-tools.md)
- [Package Format](./docs/package-format.md)

## Environment Variables

- `FASTER_API_URL` - Override the API URL (for self-hosted)
- `FASTER_API_KEY` - Provide auth token without login

## Local Development

```bash
# Clone and install
git clone https://github.com/aarondfrancis/fasterdev-cli
cd fasterdev-cli
npm install

# Run in development mode
npm run dev -- install some-package

# Build
npm run build
```

## License

MIT

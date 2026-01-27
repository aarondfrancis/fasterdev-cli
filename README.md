# fasterdev

Install AI coding assistant skills and rules from faster.dev to 30 AI coding tools — including Claude Code, Cursor, Codex, Windsurf, GitHub Copilot, Cline, and more — all with a single command.

## Installation

```bash
npm install -g fasterdev
```

Or run directly with npx:

```bash
npx fasterdev install api-conventions
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

fasterdev supports **30 AI coding assistants**. Here are the most popular:

| Tool | Rules | Skills | Format |
|------|-------|--------|--------|
| Claude Code | Yes | Yes | `.claude/rules/*.md` |
| Cursor | Yes | Yes | `.cursor/rules/*.mdc` |
| OpenAI Codex | Yes | Yes | `.codex/rules/*.md` |
| Windsurf | Yes | Yes | `.windsurf/rules/*.md` |
| GitHub Copilot | Yes | Yes | `.github/rules/*.md` |
| Cline | Yes | No | `.clinerules/*.md` |
| Roo Code | Yes | No | `.roo/rules/*.md` |
| Continue.dev | Yes | No | `.continue/rules/*.md` |
| Aider | Yes | No | `.aider/*.md` |
| Gemini CLI | Yes | No | `.gemini/rules/*.md` |

Plus 20 more: Amp, OpenCode, Antigravity, Goose, Kilo Code, Kiro, Qwen Code, Trae, Crush, Droid, MCPJam, Mux, OpenHands, Pi, Qoder, Clawdbot, CodeBuddy, Command Code, Zencoder, and Neovate.

See [Supported Tools](./docs/supported-tools.md) for the full list.

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
#   --copy           Install as copies instead of symlinks
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

# Supported Tools

fasterdev supports **30 AI coding assistants**:

## Primary Tools

| Tool | Rules | Skills | File Locations |
|------|:-----:|:------:|----------------|
| Claude Code | Yes | Yes | `.claude/rules/*.md`, `.claude/skills/*/SKILL.md` |
| Cursor | Yes | Yes | `.cursor/rules/*.mdc`, `.cursor/skills/*/SKILL.md` |
| OpenAI Codex | Yes | Yes | `.codex/rules/*.md`, `.codex/skills/*/SKILL.md` |
| Windsurf | Yes | Yes | `.windsurf/rules/*.md`, `.windsurf/skills/*/SKILL.md` |
| GitHub Copilot | Yes | Yes | `.github/rules/*.md`, `.github/skills/*/SKILL.md` |
| Cline | Yes | No | `.clinerules/*.md` |
| Roo Code | Yes | No | `.roo/rules/*.md` |
| Continue.dev | Yes | No | `.continue/rules/*.md` |
| Aider | Yes | No | `.aider/*.md` + `.aider.conf.yml` |
| Gemini CLI | Yes | No | `.gemini/rules/*.md` |
| Amp | Yes | Yes | `.amp/rules/*.md`, `.agents/skills/*/SKILL.md` |
| OpenCode | Yes | Yes | `.opencode/rules/*.md`, `.opencode/skill/*/SKILL.md` |
| Antigravity | Yes | Yes | `.agent/rules/*.md`, `.agent/skills/*/SKILL.md` |

## Additional Tools

| Tool | Rules | Skills | File Locations |
|------|:-----:|:------:|----------------|
| Goose | Yes | Yes | `.goose/rules/*.md`, `.goose/skills/*/SKILL.md` |
| Kilo Code | Yes | Yes | `.kilocode/rules/*.md`, `.kilocode/skills/*/SKILL.md` |
| Kiro CLI | Yes | Yes | `.kiro/rules/*.md`, `.kiro/skills/*/SKILL.md` |
| Qwen Code | Yes | Yes | `.qwen/rules/*.md`, `.qwen/skills/*/SKILL.md` |
| Trae | Yes | Yes | `.trae/rules/*.md`, `.trae/skills/*/SKILL.md` |
| Crush | Yes | Yes | `.crush/rules/*.md`, `.crush/skills/*/SKILL.md` |
| Droid | Yes | Yes | `.factory/rules/*.md`, `.factory/skills/*/SKILL.md` |
| MCPJam | Yes | Yes | `.mcpjam/rules/*.md`, `.mcpjam/skills/*/SKILL.md` |
| Mux | Yes | Yes | `.mux/rules/*.md`, `.mux/skills/*/SKILL.md` |
| OpenHands | Yes | Yes | `.openhands/rules/*.md`, `.openhands/skills/*/SKILL.md` |
| Pi | Yes | Yes | `.pi/rules/*.md`, `.pi/skills/*/SKILL.md` |
| Qoder | Yes | Yes | `.qoder/rules/*.md`, `.qoder/skills/*/SKILL.md` |
| Clawdbot | Yes | Yes | `skills/*.md`, `skills/*/SKILL.md` |
| CodeBuddy | Yes | Yes | `.codebuddy/rules/*.md`, `.codebuddy/skills/*/SKILL.md` |
| Command Code | Yes | Yes | `.commandcode/rules/*.md`, `.commandcode/skills/*/SKILL.md` |
| Zencoder | Yes | Yes | `.zencoder/rules/*.md`, `.zencoder/skills/*/SKILL.md` |
| Neovate | Yes | Yes | `.neovate/rules/*.md`, `.neovate/skills/*/SKILL.md` |

## Format Conversions

fasterdev automatically converts between formats when installing:

| Source | Target | Conversion |
|--------|--------|------------|
| Markdown + frontmatter | Cursor (.mdc) | `name` becomes `description`, `paths` becomes `globs` |
| Markdown + frontmatter | Claude Code | Keeps `paths`, strips unsupported fields |
| Markdown + frontmatter | Cline/Roo | Strips frontmatter to plain markdown |
| Markdown + frontmatter | Continue | Keeps `name`, `description`, `globs` |
| Any | Codex/Amp | Appends as section to `AGENTS.md` |
| Any | Gemini | Creates `.gemini/rules/` file and adds `@import` to `GEMINI.md` |
| Any | Aider | Creates file + adds to `.aider.conf.yml` read list |

## Tool Detection

fasterdev detects which tools are present by looking for their configuration files:

```bash
fasterdev detect
```

This checks for configuration directories and files including:
- `.claude/`, `.cursor/`, `.codex/`, `.windsurf/`, `.github/`
- `.clinerules/`, `.roo/`, `.continue/`, `.gemini/`
- `.goose/`, `.kilocode/`, `.kiro/`, `.qwen/`, `.trae/`
- `.crush/`, `.factory/`, `.mcpjam/`, `.mux/`, `.openhands/`
- `.pi/`, `.qoder/`, `.codebuddy/`, `.commandcode/`, `.zencoder/`, `.neovate/`
- `AGENTS.md`, `GEMINI.md`, `.aider.conf.yml`

## Installing to Specific Tools

Override detection and install to specific tools:

```bash
fasterdev install api-conventions --tools claude-code,cursor
```

Or set default tools in config:

```bash
fasterdev config --set-tools claude-code,cursor
```

## Symlink Installation

By default, fasterdev installs packages using symlinks for efficient storage:

```
~/.faster-dev/packages/my-package/    # Canonical copy
~/.claude/rules/my-package.md         # Symlink → canonical
~/.cursor/rules/my-package.mdc        # Symlink → canonical
```

Benefits:
- Updates to packages propagate automatically to all tools
- Efficient storage (no duplicate files)
- Easy to see what's installed vs. manually created

Use `--copy` flag if you need regular files instead:

```bash
fasterdev install api-conventions --copy
```

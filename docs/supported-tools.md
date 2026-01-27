# Supported Tools

fasterdev supports the following AI coding assistants:

| Tool | Rules | Skills | File Locations |
|------|:-----:|:------:|----------------|
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

## Format Conversions

fasterdev automatically converts between formats when installing:

| Source | Target | Conversion |
|--------|--------|------------|
| Markdown + frontmatter | Cursor (.mdc) | `name` becomes `description`, `paths` becomes `globs` |
| Markdown + frontmatter | Claude Code | Keeps `paths`, strips unsupported fields |
| Markdown + frontmatter | Cline/Roo | Strips frontmatter to plain markdown |
| Markdown + frontmatter | Continue | Keeps `name`, `description`, `globs` |
| Any | Codex/Amp | Appends as section to `AGENTS.md` |
| Any | Gemini | Appends as section to `GEMINI.md` |
| Any | Aider | Creates file + adds to `.aider.conf.yml` read list |

## Tool Detection

fasterdev detects which tools are present by looking for their configuration files:

```bash
fasterdev detect
```

This checks for:
- `.claude/` directory
- `.cursor/` directory
- `.clinerules/` directory
- `.roo/` directory
- `.continue/` directory
- `.aider.conf.yml` file
- `AGENTS.md` file
- `GEMINI.md` file
- `.opencode/` directory

## Installing to Specific Tools

Override detection and install to specific tools:

```bash
fasterdev install api-conventions --tools claude-code,cursor
```

Or set default tools in config:

```bash
fasterdev config --set-tools claude-code,cursor
```

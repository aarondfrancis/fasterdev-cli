# AI Coding Tool Reference

> Last updated: January 2026

Quick reference for all supported AI coding tools - paths, formats, and documentation links.

---

## Summary Table

| Tool | Rules Path | Skills Path | Format | Docs |
|------|------------|-------------|--------|------|
| Claude Code | `.claude/rules/*.md` | `.claude/skills/*/SKILL.md` | Markdown | [docs](https://code.claude.com/docs/en/skills) |
| Cursor | `.cursor/rules/*.mdc` | `.cursor/skills/*/SKILL.md` | MDC | [docs](https://cursor.com/docs/context/rules) |
| OpenAI Codex | `.codex/rules/*.md` | `.codex/skills/*/SKILL.md` | Markdown | [docs](https://developers.openai.com/codex/skills/) |
| Cline | `.clinerules/*.md` | — | Markdown | [docs](https://docs.cline.bot/features/cline-rules) |
| Roo Code | `.roo/rules/*.md` | — | Markdown | [docs](https://docs.roocode.com/features/custom-instructions) |
| Continue.dev | `.continue/rules/*.md` | — | Markdown | [docs](https://docs.continue.dev/customize/deep-dives/rules) |
| Aider | `CONVENTIONS.md` | — | Markdown | [docs](https://aider.chat/docs/usage/conventions.html) |
| Gemini CLI | `.gemini/rules/*.md` | — | Markdown | [docs](https://geminicli.com/docs/cli/gemini-md/) |
| Amp | `.amp/rules/*.md` | `.agents/skills/*/SKILL.md` | Markdown | [docs](https://ampcode.com/manual) |
| OpenCode | `.opencode/rules/*.md` | `.opencode/skill/*/SKILL.md` | Markdown | [docs](https://opencode.ai/docs/) |
| Antigravity | `.agent/rules/*.md` | `.agent/skills/*/SKILL.md` | Markdown | [docs](https://codelabs.developers.google.com/getting-started-with-antigravity-skills) |

---

## Tool Details

### Claude Code
- **Rules**: `.claude/rules/*.md` (project), `~/.claude/rules/` (global)
- **Skills**: `.claude/skills/{name}/SKILL.md` (project), `~/.claude/skills/` (global)
- **Format**: Markdown with optional YAML frontmatter
- **Detection**: `.claude/` dir, `CLAUDE.md` file
- **Docs**: https://code.claude.com/docs/en/skills

### Cursor
- **Rules**: `.cursor/rules/*.mdc` (project), `~/.cursor/rules/` (global)
- **Skills**: `.cursor/skills/{name}/SKILL.md` (project), `~/.cursor/skills/` (global)
- **Format**: MDC (Markdown with YAML frontmatter, special format)
- **Detection**: `.cursor/` dir, `.cursorrules` (deprecated)
- **Docs**: https://cursor.com/docs/context/rules, https://cursor.com/docs/context/skills

### OpenAI Codex CLI
- **Rules**: `.codex/rules/*.md` (project), `~/.codex/rules/` (global)
- **Skills**: `.codex/skills/{name}/SKILL.md` (project), `~/.codex/skills/` (global)
- **Format**: Markdown
- **Detection**: `.codex/` dir, `AGENTS.md` file
- **Notes**: Also uses hierarchical `AGENTS.md` (walks directory tree)
- **Docs**: https://developers.openai.com/codex/skills/, https://developers.openai.com/codex/guides/agents-md

### Cline
- **Rules**: `.clinerules/*.md` (project), `~/Documents/Cline/Rules/` (global)
- **Skills**: Not supported
- **Format**: Markdown
- **Detection**: `.clinerules/` dir or `.clinerules` file (legacy), `AGENTS.md` fallback
- **Docs**: https://docs.cline.bot/features/cline-rules

### Roo Code
- **Rules**: `.roo/rules/*.md` (project), `~/.roo/rules/` (global)
- **Skills**: Not supported (uses custom "modes" instead)
- **Format**: Markdown
- **Detection**: `.roo/` dir, `.roorules` (deprecated), `.roomodes`, `AGENTS.md` fallback
- **Notes**: Supports mode-specific rules in `.roo/rules-{mode}/`
- **Docs**: https://docs.roocode.com/features/custom-instructions

### Continue.dev
- **Rules**: `.continue/rules/*.md` (project), `~/.continue/rules/` (global)
- **Skills**: Not supported
- **Format**: Markdown with optional YAML frontmatter (`name`, `globs`, `regex`, `alwaysApply`, `description`)
- **Detection**: `.continue/` dir, `.continue/config.yaml`
- **Docs**: https://docs.continue.dev/customize/deep-dives/rules

### Aider
- **Rules**: `CONVENTIONS.md` loaded via `--read` flag or `.aider.conf.yml`
- **Skills**: Not supported
- **Format**: Markdown
- **Config**: `.aider.conf.yml` with `read: [CONVENTIONS.md]`
- **Detection**: `.aider.conf.yml`, `CONVENTIONS.md`
- **Docs**: https://aider.chat/docs/usage/conventions.html

### Gemini CLI
- **Rules**: `.gemini/rules/*.md` (project), `~/.gemini/rules/` (global)
- **Skills**: Not supported
- **Format**: Markdown, supports `@file.md` imports in GEMINI.md
- **Detection**: `.gemini/` dir, `GEMINI.md` file
- **Notes**: Uses hierarchical `GEMINI.md` (walks directory tree). Rules installed via `@rules/name.md` import in GEMINI.md.
- **Docs**: https://geminicli.com/docs/cli/gemini-md/

### Amp (Sourcegraph)
- **Rules**: `.amp/rules/*.md` (project), `~/.config/amp/rules/` (global)
- **Skills**: `.agents/skills/{name}/SKILL.md` (project), `~/.config/agents/skills/` (global)
- **Format**: Markdown
- **Detection**: `.agents/` dir, `.amp/` dir, `.claude/` dir, `AGENTS.md` file
- **Notes**: Uses hierarchical `AGENTS.md`. Also reads `.claude/skills/` for compatibility.
- **Docs**: https://ampcode.com/manual, https://ampcode.com/news/agent-skills

### OpenCode
- **Rules**: `.opencode/rules/*.md` (project), `~/.config/opencode/rules/` (global)
- **Skills**: `.opencode/skill/{name}/SKILL.md` (project), `~/.config/opencode/skill/` (global)
- **Format**: Markdown
- **Detection**: `.opencode/` dir, `opencode.json`, `AGENTS.md` fallback
- **Docs**: https://opencode.ai/docs/, https://opencode.ai/docs/skills

### Antigravity
- **Rules**: `.agent/rules/*.md` (project), `~/.gemini/antigravity/rules/` (global)
- **Skills**: `.agent/skills/{name}/SKILL.md` (project), `~/.gemini/antigravity/skills/` (global)
- **Format**: Markdown
- **Detection**: `.agent/` dir
- **Docs**: https://codelabs.developers.google.com/getting-started-with-antigravity-skills

---

## Agent Skills Standard

The [Agent Skills](https://agentskills.io) standard is an open format adopted by multiple tools:

- **Structure**: `{skill-name}/SKILL.md` with optional assets
- **Location**: `.{tool}/skills/{skill-name}/SKILL.md`
- **Supported by**: Claude Code, Cursor, Codex CLI, Amp, OpenCode, Antigravity

---

## Install Actions

Special installation actions for tools with unique requirements:

| Action | Tool | Behavior |
|--------|------|----------|
| `append-to-agents-md` | Codex, Amp | Appends rule as section to `AGENTS.md` |
| `append-to-gemini-md` | Gemini | Appends rule as section to `GEMINI.md` |
| `add-to-read-config` | Aider | Creates file + adds to `.aider.conf.yml` read list |
| `add-with-gemini-import` | Gemini | Creates `.gemini/rules/` file + adds `@import` to `GEMINI.md` |

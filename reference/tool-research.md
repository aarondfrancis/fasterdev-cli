# AI Coding Tool Directory Structure Research

> Last updated: January 2026

## Summary

Each tool has its own approach to rules and skills. Key insight: tools using `AGENTS.md` or `GEMINI.md` use **hierarchical discovery** (each directory can have its own file), NOT appending to a single file.

---

## Tool Details

### Claude Code
- **Rules**: `.claude/rules/*.md` (project), `~/.claude/rules/` (global)
- **Skills**: `.claude/skills/{skill-name}/SKILL.md` (project), `~/.claude/skills/` (global)
- **Format**: Markdown with optional YAML frontmatter
- **Detection**: `.claude/` dir, `CLAUDE.md` file
- **Source**: https://www.anthropic.com/engineering/claude-code-best-practices

### Cursor
- **Rules**: `.cursor/rules/*.mdc` (project), `~/.cursor/rules/` (global)
- **Skills**: `.cursor/skills/{skill-name}/SKILL.md` - NOW SUPPORTED via Agent Skills standard
- **Format**: MDC (Markdown with special frontmatter)
- **Detection**: `.cursor/` dir, `.cursorrules` file
- **Source**: https://cursor.com/docs/context/skills

### Codex CLI (OpenAI)
- **Rules**: `AGENTS.md` - HIERARCHICAL (each directory can have one, walks up to project root)
- **Skills**: `.codex/skills/{skill-name}/SKILL.md`
- **Format**: Plain Markdown
- **Detection**: `.codex/` dir, `AGENTS.md` file
- **Global**: `~/.codex/AGENTS.md`
- **Note**: Also supports `AGENTS.override.md` for overrides
- **Source**: https://developers.openai.com/codex/guides/agents-md

### Cline
- **Rules**: `.clinerules/` folder with `*.md` files (NOT a single file)
- **Skills**: None (no native skill support)
- **Format**: Plain Markdown
- **Detection**: `.clinerules/` dir or `.clinerules` file (legacy single-file)
- **Global**: `~/Documents/Cline/Rules/` (macOS/Linux), `Documents\Cline\Rules\` (Windows)
- **Note**: Also supports `AGENTS.md` as fallback
- **Source**: https://docs.cline.bot/features/cline-rules

### Roo Code
- **Rules**: `.roo/rules/` folder with `*.md` files
- **Mode-specific rules**: `.roo/rules-{modeSlug}/` (e.g., `.roo/rules-code/`, `.roo/rules-architect/`)
- **Skills**: None (uses custom "modes" instead)
- **Format**: Plain Markdown
- **Detection**: `.roo/` dir, `.roorules` file, `.roomodes` file
- **Global**: `~/.roo/rules/` and `~/.roo/rules-{modeSlug}/`
- **Legacy**: `.roorules` single file (fallback)
- **Note**: Also supports `AGENTS.md` standard
- **Source**: https://docs.roocode.com/features/custom-instructions

### Continue.dev
- **Rules**: `.continue/rules/*.md` (project), `~/.continue/rules/` (global)
- **Skills**: None (no native skill support)
- **Format**: Markdown with optional YAML frontmatter (name, globs, regex, alwaysApply, description)
- **Detection**: `.continue/` dir, `.continue/config.yaml`
- **Source**: https://docs.continue.dev/customize/deep-dives/rules

### Aider
- **Rules**: `CONVENTIONS.md` loaded via `--read` flag or `.aider.conf.yml` config
- **Skills**: None
- **Format**: Plain Markdown
- **Config**: `.aider.conf.yml` with `read: [CONVENTIONS.md]`
- **Global**: `~/.aider.conf.yml`
- **Detection**: `.aider.conf.yml`, `CONVENTIONS.md`
- **Source**: https://aider.chat/docs/usage/conventions.html

### Gemini CLI
- **Rules**: `GEMINI.md` - HIERARCHICAL (like AGENTS.md, walks directory tree)
- **Skills**: None (uses "extensions" which are different)
- **Format**: Plain Markdown, supports `@file.md` imports
- **Detection**: `.gemini/` dir, `GEMINI.md` file
- **Global**: `~/.gemini/GEMINI.md`
- **Config**: `.gemini/settings.json` can customize filename to include `AGENTS.md`, etc.
- **Source**: https://geminicli.com/docs/cli/gemini-md/

### Amp (Sourcegraph)
- **Rules**: `AGENTS.md` - HIERARCHICAL (walks directory tree)
- **Skills**: User skills in `~/.claude/skills/` or plugins
- **Format**: Plain Markdown
- **Detection**: `AGENTS.md`, `AGENT.md`
- **Global**: `~/.config/amp/`
- **Source**: Direct observation (this tool)

### OpenCode
- **Rules**: `.opencode/rules/*.md`
- **Skills**: `.opencode/skill/{skill-name}/SKILL.md`
- **Format**: Plain Markdown
- **Detection**: `.opencode/` dir, `opencode.json`, `AGENTS.md`
- **Global**: `~/.config/opencode/rules/`, `~/.config/opencode/skill/`

---

## Agent Skills Standard

The **Agent Skills** standard (https://agentskills.io) is an open format for skills adopted by multiple tools:

- **Structure**: `{skill-name}/SKILL.md` with optional assets
- **Location**: `.{tool}/skills/{skill-name}/SKILL.md`
- **Supported by**: Claude Code, Cursor, Codex CLI, potentially others

---

## Key Corrections Needed in tools.ts

1. **Remove `append-agents` format** - Codex/Amp use hierarchical AGENTS.md, not appending
2. **Remove `append-gemini` format** - Gemini uses hierarchical GEMINI.md, not appending
3. **Add Cursor skills support** - `skills: { projectPath: '.cursor/skills', globalPath: '~/.cursor/skills' }`
4. **Fix Cline paths** - Global is `~/Documents/Cline/Rules/`, project is `.clinerules/` folder
5. **Add Roo Code mode-specific rules** - Need to handle `.roo/rules-{mode}/` pattern
6. **Fix Amp skills path** - Currently shows `.agents/skills` but Amp uses the standard skill locations

---

## Changes Made (January 2026)

### src/types.ts
- Removed `append-agents` and `append-gemini` from the `format` union type

### src/tools.ts
- **Codex**: Changed from `append-agents` format to `markdown`, added proper rules path `.codex/rules`
- **Cursor**: Added skills support (`.cursor/skills`)
- **Cline**: Updated detection to include `AGENTS.md` fallback
- **Roo Code**: Updated detection to include `AGENTS.md` and `.roomodes`
- **Gemini**: Changed from `append-gemini` format to `markdown`, added rules path `.gemini/rules`
- **Amp**: Changed from `append-agents` format to `markdown`, added proper rules path `.amp/rules`, updated skills path
- **SKILL_TOOLS**: Added `cursor` to the list of tools that support Agent Skills

### src/converter.ts
- Removed `append-agents` and `append-gemini` cases from `convertToToolFormat()`
- These formats are still available as manifest override actions for backwards compatibility

### Tests Updated
- `tests/unit/detector.test.ts`: Updated `getSkillTools` test for Cursor skills support
- `tests/unit/installer.test.ts`: Changed "tool lacks skills" test to use Cline instead of Cursor

# Introduction

fasterdev is a CLI tool for installing AI coding assistant skills and rules from [faster.dev](https://faster.dev).

It supports all major AI coding assistants with a single unified interface:

- **Claude Code** - Anthropic's CLI coding assistant
- **Cursor** - AI-powered code editor
- **OpenAI Codex** - OpenAI's coding agent
- **Cline** - VS Code AI assistant
- **Roo Code** - AI coding assistant
- **Continue.dev** - Open-source AI code assistant
- **Aider** - AI pair programming in your terminal
- **Gemini CLI** - Google's AI coding assistant
- **Amp** - AI coding assistant
- **OpenCode** - Open-source AI coding tool

## What are Skills and Rules?

**Rules** are guidelines that shape how AI assistants write code. They define conventions, patterns, and constraints for your project - things like API design patterns, naming conventions, or framework-specific best practices.

**Skills** are reusable capabilities that AI assistants can invoke. They might generate specific types of code, perform transformations, or follow complex multi-step procedures.

## Why fasterdev?

Each AI coding tool has its own format and location for rules and skills:
- Claude Code uses `.claude/rules/*.md`
- Cursor uses `.cursor/rules/*.mdc`
- Codex uses `AGENTS.md`
- And so on...

fasterdev lets you install once and deploy everywhere. It automatically converts formats and places files in the right locations for each tool.

## Quick Example

```bash
# Install the CLI
npm install -g fasterdev

# Log in to faster.dev
fasterdev login

# Install a rule to all detected tools
fasterdev install api-conventions
```

## Next Steps

- [Installation](./installation.md) - Get fasterdev installed
- [Usage](./usage.md) - Learn the basics
- [CLI Reference](./cli.md) - Complete command documentation

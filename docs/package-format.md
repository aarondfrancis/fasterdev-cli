# Package Format

A faster.dev package is a directory containing rules and/or skills that can be installed to AI coding assistants.

## Directory Structure

```
my-package/
├── manifest.json          # Required: Package metadata
├── rule.md                # Rule content (for type: rule or both)
├── SKILL.md               # Skill content (for type: skill or both)
├── cursor.mdc             # Optional: Tool-specific override
└── assets/                # Optional: Supporting files
```

## manifest.json

The manifest defines package metadata and installation behavior:

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

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Package identifier (lowercase, hyphens allowed) |
| `version` | Yes | Semantic version (e.g., `1.0.0`) |
| `type` | Yes | One of: `rule`, `skill`, or `both` |
| `description` | Yes | Brief description of the package |
| `compatibility.rules` | No | Tools that support this as a rule |
| `compatibility.skills` | No | Tools that support this as a skill |
| `install` | No | Tool-specific installation overrides |

## rule.md

Rules use markdown with YAML frontmatter:

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

### Frontmatter Fields

| Field | Description |
|-------|-------------|
| `name` | Rule identifier |
| `description` | Brief description |
| `globs` | File patterns this rule applies to |
| `paths` | Directory paths this rule applies to |

## SKILL.md

Skills also use markdown with YAML frontmatter:

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

## Tool-Specific Overrides

You can provide tool-specific versions of your content:

```
my-package/
├── manifest.json
├── rule.md           # Default rule content
├── cursor.mdc        # Cursor-specific version
└── SKILL.md
```

In `manifest.json`:

```json
{
  "install": {
    "cursor": { "file": "cursor.mdc" }
  }
}
```

## Creating a Package

Initialize a new package:

```bash
mkdir my-package
cd my-package
fasterdev init
```

This creates a basic structure you can customize.

## Publishing

Validate your package:

```bash
fasterdev publish --dry-run
```

Publish to faster.dev:

```bash
fasterdev publish
```

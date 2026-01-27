# Product Requirements Document: faster.dev Skill Distribution Platform

**Version:** 1.0  
**Last Updated:** January 2025  
**Author:** Aaron Francis  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [User Stories](#5-user-stories)
6. [Product Overview](#6-product-overview)
7. [Functional Requirements](#7-functional-requirements)
8. [Technical Architecture](#8-technical-architecture)
9. [CLI Specification](#9-cli-specification)
10. [Package Format Specification](#10-package-format-specification)
11. [API Specification](#11-api-specification)
12. [Web Interface](#12-web-interface)
13. [Security & Access Control](#13-security--access-control)
14. [Monetization](#14-monetization)
15. [Launch Plan](#15-launch-plan)
16. [Open Questions](#16-open-questions)
17. [Appendix](#appendix)

---

## 1. Executive Summary

**faster.dev** is a distribution platform for AI coding assistant configurations—specifically "skills" (reusable capabilities) and "rules" (project instructions). The platform enables developers to share, discover, and install configurations across 10+ AI coding tools (Claude Code, Cursor, Codex, Cline, Roo Code, Continue, Aider, Gemini CLI, Amp, OpenCode) with a single command.

Think of it as **npm for AI coding assistant configurations**.

### Core Value Proposition

1. **For consumers:** Install battle-tested skills and rules with `faster install <package>` instead of manually copying markdown files between tools
2. **For authors:** Publish once, distribute to all major AI coding assistants automatically
3. **For faster.dev:** Build a community and distribution channel for the faster.dev educational platform

### Key Differentiator

Unlike tool-specific rule repositories (awesome-cursorrules, etc.), faster.dev:
- Supports **all major AI coding tools** from a single source
- Handles **format conversion automatically** (MDC, AGENTS.md, SKILL.md, etc.)
- Provides **private distribution** for teams and enterprises
- Integrates with the **faster.dev educational ecosystem**

---

## 2. Problem Statement

### The Fragmentation Problem

The AI coding assistant market is fragmented across 10+ tools, each with different configuration formats:

| Tool | Rules Location | Skills Location | Format |
|------|---------------|-----------------|--------|
| Claude Code | `.claude/rules/` | `.claude/skills/` | Markdown + YAML frontmatter |
| Cursor | `.cursor/rules/` | N/A | MDC (Markdown + special frontmatter) |
| Codex CLI | `AGENTS.md` | `.codex/skills/` | Markdown, TOML config |
| Cline | `.clinerules/` | N/A | Plain Markdown |
| Roo Code | `.roo/rules/` | N/A | Markdown |
| Continue | `.continue/rules/` | N/A | Markdown + YAML |
| Aider | `CONVENTIONS.md` | N/A | Markdown + YAML config |
| Gemini CLI | `GEMINI.md` | N/A | Markdown |
| Amp | `AGENTS.md` | `.agents/skills/` | Markdown |
| OpenCode | `.opencode/rules/` | `.opencode/skill/` | Markdown |

### Pain Points

**For Rule/Skill Consumers:**
- Must manually find, copy, and adapt rules for each tool
- No centralized discovery mechanism
- No versioning or update mechanism
- No way to share team-specific rules privately

**For Rule/Skill Authors:**
- Must maintain separate versions for each tool
- No distribution mechanism beyond GitHub gists/repos
- No analytics on usage or feedback
- No monetization path for premium content

**For Teams/Enterprises:**
- No way to distribute internal coding standards across tools
- No access control for proprietary rules
- No audit trail of what's installed where

---

## 3. Goals & Success Metrics

### Primary Goals

| Goal | Metric | Target (6 months) |
|------|--------|-------------------|
| Adoption | Monthly Active CLI Users | 5,000 |
| Engagement | Packages Installed/Month | 25,000 |
| Content | Published Packages | 500 |
| Retention | 30-day CLI Retention | 40% |

### Secondary Goals

| Goal | Metric | Target |
|------|--------|--------|
| Tool Coverage | % of tools with 10+ packages | 80% |
| Author Satisfaction | NPS from publishers | 50+ |
| Platform Revenue | MRR from Pro/Team plans | $5,000 |

### Non-Goals (v1)

- IDE plugins (CLI-first approach)
- Real-time sync/collaboration
- AI-generated rules (future feature)
- Marketplace payments/transactions

---

## 4. User Personas

### Persona 1: Individual Developer ("Dev Dana")

**Demographics:**
- Senior developer, 5+ years experience
- Uses 2-3 AI coding tools regularly
- Works on multiple projects

**Goals:**
- Find rules that match their coding style
- Keep configurations in sync across tools
- Save time on repetitive setup

**Pain Points:**
- Manually copying rules between projects
- Different formats for different tools
- No good way to discover quality rules

**Behavior:**
- Will try free tools before paying
- Values CLI over GUI
- Shares good finds with colleagues

### Persona 2: Team Lead ("Lead Logan")

**Demographics:**
- Engineering manager or tech lead
- Responsible for team standards
- Manages 5-15 developers

**Goals:**
- Enforce consistent coding standards
- Onboard new developers quickly
- Keep team aligned on AI tool usage

**Pain Points:**
- Developers using different rules
- No visibility into what's installed
- Hard to update rules across team

**Behavior:**
- Will pay for team features
- Needs admin controls
- Values documentation and support

### Persona 3: Content Creator ("Creator Casey")

**Demographics:**
- Developer educator or consultant
- Creates content (courses, tutorials)
- Has existing audience

**Goals:**
- Distribute rules alongside courses
- Build reputation in AI tooling space
- Potentially monetize premium rules

**Pain Points:**
- No good distribution mechanism
- Can't track who's using their rules
- Hard to maintain for multiple tools

**Behavior:**
- Active on social media
- Values analytics and feedback
- May want revenue sharing

### Persona 4: Enterprise Admin ("Admin Alex")

**Demographics:**
- DevOps or Platform Engineering
- Responsible for developer tools
- Works at company with 50+ developers

**Goals:**
- Standardize AI tool configurations
- Control what rules are allowed
- Audit and compliance

**Pain Points:**
- Shadow IT with AI tools
- No central management
- Security concerns with external rules

**Behavior:**
- Requires SSO/SAML
- Needs audit logs
- Will pay enterprise pricing

---

## 5. User Stories

### Epic 1: Package Discovery & Installation

```
US-1.1: As a developer, I want to search for rules by keyword so I can find 
        relevant configurations for my tech stack.

US-1.2: As a developer, I want to install a package with one command so I 
        don't have to manually configure each tool.

US-1.3: As a developer, I want the CLI to auto-detect my installed tools so 
        I don't have to specify them manually.

US-1.4: As a developer, I want to install packages globally so they apply 
        to all my projects.

US-1.5: As a developer, I want to see what packages are installed so I can 
        manage my configurations.

US-1.6: As a developer, I want to update packages to get the latest versions 
        of rules I'm using.

US-1.7: As a developer, I want to remove packages cleanly from all tools.
```

### Epic 2: Package Publishing

```
US-2.1: As an author, I want to create a package with a simple manifest so 
        I can publish my rules.

US-2.2: As an author, I want to specify which tools my package supports so 
        users know compatibility.

US-2.3: As an author, I want to publish updates with semantic versioning so 
        users can track changes.

US-2.4: As an author, I want to see download statistics so I know how my 
        packages are being used.

US-2.5: As an author, I want to provide tool-specific overrides so I can 
        optimize for each tool's format.

US-2.6: As an author, I want to deprecate old packages so users migrate to 
        newer versions.
```

### Epic 3: Authentication & Access Control

```
US-3.1: As a user, I want to authenticate via CLI so I can access my account.

US-3.2: As a user, I want to stay logged in across sessions so I don't have 
        to re-authenticate.

US-3.3: As a team admin, I want to create private packages visible only to 
        my team.

US-3.4: As a team admin, I want to invite team members so they can access 
        private packages.

US-3.5: As an enterprise admin, I want to use SSO so users authenticate with 
        corporate credentials.
```

### Epic 4: Team Features

```
US-4.1: As a team lead, I want to create a team namespace so our packages 
        are grouped together.

US-4.2: As a team lead, I want to see which packages team members have 
        installed.

US-4.3: As a team member, I want to install all team-recommended packages 
        with one command.

US-4.4: As a team admin, I want to set required packages that auto-install 
        for team members.
```

### Epic 5: Web Interface

```
US-5.1: As a user, I want to browse packages on a website so I can discover 
        new rules without the CLI.

US-5.2: As a user, I want to read package documentation online so I can 
        evaluate before installing.

US-5.3: As an author, I want to manage my packages via web UI so I don't 
        need CLI for everything.

US-5.4: As a team admin, I want to manage team settings via web UI.
```

---

## 6. Product Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         faster.dev Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Web App    │    │   REST API   │    │   Package    │          │
│  │  (Next.js)   │◄──►│   (Server)   │◄──►│   Storage    │          │
│  └──────────────┘    └──────────────┘    │   (S3/R2)    │          │
│         │                   ▲            └──────────────┘          │
│         │                   │                                       │
│         ▼                   │                                       │
│  ┌──────────────┐          │                                       │
│  │   Database   │          │                                       │
│  │  (Postgres)  │          │                                       │
│  └──────────────┘          │                                       │
│                            │                                       │
└────────────────────────────┼───────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       ┌─────────────┐              ┌─────────────┐
       │  faster CLI │              │  faster CLI │
       │  (Dev 1)    │              │  (Dev 2)    │
       └─────────────┘              └─────────────┘
              │                             │
              ▼                             ▼
       ┌─────────────┐              ┌─────────────┐
       │ Local Tools │              │ Local Tools │
       │ .claude/    │              │ .cursor/    │
       │ .cursor/    │              │ .roo/       │
       │ etc.        │              │ etc.        │
       └─────────────┘              └─────────────┘
```

### Package Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Author    │     │  faster.dev │     │  Consumer   │
│             │     │   Platform  │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ faster init       │                   │
       │──────────────────►│                   │
       │                   │                   │
       │ faster publish    │                   │
       │──────────────────►│                   │
       │                   │ Store package     │
       │                   │──────────────────►│
       │                   │                   │
       │                   │      faster search│
       │                   │◄──────────────────│
       │                   │                   │
       │                   │     faster install│
       │                   │◄──────────────────│
       │                   │                   │
       │                   │  Download package │
       │                   │──────────────────►│
       │                   │                   │
       │                   │   Convert & Write │
       │                   │   to local tools  │
       │                   │                   ├───►.claude/
       │                   │                   ├───►.cursor/
       │                   │                   └───►.roo/
       │                   │                   │
```

---

## 7. Functional Requirements

### 7.1 CLI Requirements

#### FR-CLI-1: Authentication
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CLI-1.1 | CLI must support email/password login | P0 |
| FR-CLI-1.2 | CLI must persist auth token securely | P0 |
| FR-CLI-1.3 | CLI must support logout | P0 |
| FR-CLI-1.4 | CLI must show current auth status | P1 |
| FR-CLI-1.5 | CLI must support API key auth (env var) | P1 |
| FR-CLI-1.6 | CLI must support OAuth flow (browser) | P2 |

#### FR-CLI-2: Package Installation
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CLI-2.1 | CLI must install packages by name | P0 |
| FR-CLI-2.2 | CLI must auto-detect installed tools | P0 |
| FR-CLI-2.3 | CLI must convert formats per tool | P0 |
| FR-CLI-2.4 | CLI must support `--global` flag | P0 |
| FR-CLI-2.5 | CLI must support `--tools` filter | P0 |
| FR-CLI-2.6 | CLI must support `--force` overwrite | P0 |
| FR-CLI-2.7 | CLI must support `--dry-run` | P1 |
| FR-CLI-2.8 | CLI must support `--as-skill` | P1 |
| FR-CLI-2.9 | CLI must support version specifiers | P1 |
| FR-CLI-2.10 | CLI must support local file install | P1 |

#### FR-CLI-3: Package Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CLI-3.1 | CLI must list installed packages | P0 |
| FR-CLI-3.2 | CLI must remove packages | P0 |
| FR-CLI-3.3 | CLI must update packages | P1 |
| FR-CLI-3.4 | CLI must show package info | P1 |
| FR-CLI-3.5 | CLI must check for outdated packages | P2 |

#### FR-CLI-4: Package Publishing
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CLI-4.1 | CLI must initialize new packages | P0 |
| FR-CLI-4.2 | CLI must validate packages locally | P0 |
| FR-CLI-4.3 | CLI must publish packages | P0 |
| FR-CLI-4.4 | CLI must support version bumping | P1 |
| FR-CLI-4.5 | CLI must support unpublishing | P2 |

#### FR-CLI-5: Discovery
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CLI-5.1 | CLI must search packages | P0 |
| FR-CLI-5.2 | CLI must filter by type (rule/skill) | P1 |
| FR-CLI-5.3 | CLI must filter by tool compatibility | P1 |
| FR-CLI-5.4 | CLI must show trending packages | P2 |

### 7.2 API Requirements

#### FR-API-1: Package Operations
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-API-1.1 | API must serve package metadata | P0 |
| FR-API-1.2 | API must serve package contents | P0 |
| FR-API-1.3 | API must accept package uploads | P0 |
| FR-API-1.4 | API must validate package format | P0 |
| FR-API-1.5 | API must enforce semantic versioning | P0 |
| FR-API-1.6 | API must support package search | P0 |
| FR-API-1.7 | API must track download counts | P1 |

#### FR-API-2: Authentication
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-API-2.1 | API must support token auth | P0 |
| FR-API-2.2 | API must support API key auth | P0 |
| FR-API-2.3 | API must enforce rate limits | P0 |
| FR-API-2.4 | API must support token refresh | P1 |

#### FR-API-3: Teams (Pro Feature)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-API-3.1 | API must support team namespaces | P1 |
| FR-API-3.2 | API must support private packages | P1 |
| FR-API-3.3 | API must support team invitations | P1 |
| FR-API-3.4 | API must support role-based access | P2 |

### 7.3 Web Requirements

#### FR-WEB-1: Public Pages
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WEB-1.1 | Web must show package listing | P0 |
| FR-WEB-1.2 | Web must show package details | P0 |
| FR-WEB-1.3 | Web must support search | P0 |
| FR-WEB-1.4 | Web must show installation instructions | P0 |
| FR-WEB-1.5 | Web must show package readme | P1 |

#### FR-WEB-2: Authenticated Pages
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WEB-2.1 | Web must support user registration | P0 |
| FR-WEB-2.2 | Web must support login/logout | P0 |
| FR-WEB-2.3 | Web must show user's packages | P1 |
| FR-WEB-2.4 | Web must allow package management | P1 |
| FR-WEB-2.5 | Web must show download analytics | P2 |

---

## 8. Technical Architecture

### 8.1 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| CLI | Node.js + TypeScript | Cross-platform, familiar to target audience |
| API | Node.js + Hono/Express | Fast, lightweight, same language as CLI |
| Database | PostgreSQL | Reliable, good for relational data |
| Cache | Redis | Session storage, rate limiting |
| Storage | Cloudflare R2 / AWS S3 | Package file storage |
| Web | Next.js | SSR for SEO, React ecosystem |
| Auth | Lucia / Auth.js | Modern, secure auth library |
| Hosting | Cloudflare Workers / Vercel | Global edge deployment |

### 8.2 Database Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team Members
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Packages
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  owner_type VARCHAR(20) NOT NULL, -- 'user' or 'team'
  owner_id UUID NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL, -- 'rule', 'skill', 'both'
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, owner_type, owner_id)
);

-- Package Versions
CREATE TABLE package_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id),
  version VARCHAR(50) NOT NULL,
  manifest JSONB NOT NULL,
  storage_key VARCHAR(500) NOT NULL, -- S3/R2 key
  readme TEXT,
  published_at TIMESTAMP DEFAULT NOW(),
  downloads INTEGER DEFAULT 0,
  UNIQUE(package_id, version)
);

-- Package Downloads (for analytics)
CREATE TABLE package_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id),
  version_id UUID REFERENCES package_versions(id),
  user_id UUID REFERENCES users(id), -- nullable for anonymous
  tool VARCHAR(50), -- which tool it was installed to
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  key_hash VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.3 Package Storage Structure

```
packages/
├── @faster/
│   └── api-conventions/
│       ├── 1.0.0/
│       │   ├── manifest.json
│       │   ├── rule.md
│       │   ├── SKILL.md
│       │   └── cursor.mdc
│       └── 1.0.1/
│           └── ...
├── @acme-corp/          # Team namespace
│   └── internal-rules/
│       └── 1.0.0/
│           └── ...
└── aaron/               # User namespace
    └── my-rules/
        └── 1.0.0/
            └── ...
```

### 8.4 API Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│                    (Rate Limiting, Auth)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Package     │    │     User      │    │     Team      │
│   Service     │    │   Service     │    │   Service     │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ - search      │    │ - register    │    │ - create      │
│ - get         │    │ - login       │    │ - invite      │
│ - publish     │    │ - profile     │    │ - members     │
│ - download    │    │ - api_keys    │    │ - settings    │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
             ┌───────────┐     ┌───────────┐
             │ PostgreSQL│     │  S3 / R2  │
             └───────────┘     └───────────┘
```

---

## 9. CLI Specification

### 9.1 Command Reference

```
faster <command> [options]

Commands:
  faster install <package>   Install a package
  faster remove <package>    Remove a package
  faster list                List installed packages
  faster search <query>      Search for packages
  faster info <package>      Show package details
  faster update [package]    Update packages
  
  faster init                Initialize a new package
  faster publish             Publish package to faster.dev
  faster unpublish           Remove package from registry
  
  faster login               Authenticate with faster.dev
  faster logout              Clear authentication
  faster whoami              Show current user
  
  faster config              Manage CLI configuration
  faster detect              Show detected tools

Options:
  -v, --version              Show version
  -h, --help                 Show help
  --verbose                  Verbose output
  --json                     Output as JSON
```

### 9.2 Command Details

#### `faster install <package>`

```
Install a package from faster.dev

Arguments:
  package                    Package name (e.g., "api-conventions" or "@team/rules")

Options:
  -g, --global               Install globally (~/.{tool}/)
  -t, --tools <tools>        Comma-separated list of tools
  --as-skill                 Install as skill (where supported)
  -f, --force                Overwrite existing files
  --dry-run                  Show what would be installed
  --from-file <path>         Install from local directory

Examples:
  faster install api-conventions
  faster install @acme/internal-rules --tools claude-code,cursor
  faster install my-rules --global
  faster install . --from-file ./my-package
```

#### `faster publish`

```
Publish package to faster.dev

Options:
  --dry-run                  Validate without publishing
  --access <level>           Set access level: public, private, restricted
  --tag <tag>                Add a dist-tag (e.g., "beta")

Requirements:
  - Must be authenticated
  - Must have valid manifest.json
  - Must have rule.md and/or SKILL.md
  - Version must not already exist

Examples:
  faster publish
  faster publish --access private
  faster publish --tag beta
```

### 9.3 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Authentication required |
| 4 | Package not found |
| 5 | Network error |
| 6 | Permission denied |

### 9.4 Configuration

Config stored at `~/.faster/config.json`:

```json
{
  "apiUrl": "https://api.faster.dev",
  "apiKey": "fst_xxxxxxxxxxxx",
  "defaultTools": ["claude-code", "cursor"],
  "analytics": true
}
```

Environment variables:
- `FASTER_API_URL` - Override API URL
- `FASTER_API_KEY` - Provide API key
- `FASTER_NO_ANALYTICS` - Disable anonymous analytics

---

## 10. Package Format Specification

### 10.1 Directory Structure

```
my-package/
├── manifest.json          # Required: Package metadata
├── rule.md                # Required for type: rule/both
├── SKILL.md               # Required for type: skill/both
├── README.md              # Optional: Displayed on web
├── CHANGELOG.md           # Optional: Version history
├── LICENSE                # Optional: License file
├── cursor.mdc             # Optional: Tool-specific override
├── gemini.md              # Optional: Tool-specific override
└── assets/                # Optional: Supporting files
    ├── templates/
    └── examples/
```

### 10.2 manifest.json Schema

```typescript
interface PackageManifest {
  // Required fields
  name: string;                    // Package name (lowercase, hyphens)
  version: string;                 // Semver version
  type: 'rule' | 'skill' | 'both'; // Package type
  description: string;             // Short description (max 200 chars)
  
  // Optional metadata
  author?: string | {
    name: string;
    email?: string;
    url?: string;
  };
  license?: string;                // SPDX identifier
  repository?: string;             // Git URL
  homepage?: string;               // Project URL
  keywords?: string[];             // Search keywords
  
  // Compatibility
  compatibility: {
    rules?: ToolId[];              // Tools that support this as a rule
    skills?: ToolId[];             // Tools that support this as a skill
  };
  
  // Tool-specific installation
  install?: {
    [tool: string]: {
      file?: string;               // Use different file for this tool
      action?: string;             // Special action (append-to-agents-md, etc.)
      disabled?: boolean;          // Skip this tool
    };
  };
  
  // Dependencies (future)
  dependencies?: {
    [name: string]: string;        // name: version range
  };
}

type ToolId = 
  | 'claude-code'
  | 'codex'
  | 'cursor'
  | 'cline'
  | 'roo-code'
  | 'continue'
  | 'aider'
  | 'gemini'
  | 'amp'
  | 'opencode';
```

### 10.3 rule.md Format

```markdown
---
# Optional YAML frontmatter
name: human-readable-name
description: Brief description of what this rule does
globs: "**/*.{ts,tsx}"           # File patterns (Cursor, Continue)
paths:                            # Path patterns (Claude Code)
  - "src/api/**/*"
  - "src/routes/**/*"
alwaysApply: false               # Cursor-specific
---

# Rule Title

Rule content in Markdown format.

## Section 1

Guidelines and instructions...

## Section 2

More guidelines...
```

### 10.4 SKILL.md Format

```markdown
---
name: skill-name
description: Description shown to AI when selecting skills
license: MIT
---

# Skill Name

Instructions for the AI when this skill is activated.

## When to Use

- Condition 1
- Condition 2

## Guidelines

Detailed instructions...

## Examples

Example code or usage...
```

### 10.5 Format Conversion Rules

| Source Field | Cursor (.mdc) | Claude Code | Continue | Cline/Roo |
|--------------|---------------|-------------|----------|-----------|
| `name` | `description` | (removed) | `name` | (removed) |
| `description` | `description` | (removed) | `description` | (removed) |
| `globs` | `globs` | (removed) | `globs` | (removed) |
| `paths` | `globs` (joined) | `paths` | `globs` | (removed) |
| `alwaysApply` | `alwaysApply` | (removed) | (removed) | (removed) |

---

## 11. API Specification

### 11.1 Base URL

```
Production: https://api.faster.dev/v1
Staging:    https://api.staging.faster.dev/v1
```

### 11.2 Authentication

**Bearer Token:**
```
Authorization: Bearer <token>
```

**API Key:**
```
X-API-Key: fst_xxxxxxxxxxxx
```

### 11.3 Endpoints

#### Packages

```yaml
# Search packages
GET /packages/search
  Query:
    q: string              # Search query
    type?: rule|skill|both # Filter by type
    tool?: string          # Filter by tool compatibility
    limit?: number         # Results per page (default: 20, max: 100)
    offset?: number        # Pagination offset
  Response: PackageSearchResult[]

# Get package info
GET /packages/{name}
  Response: Package

# Get package version
GET /packages/{name}/versions/{version}
  Response: PackageVersion

# Download package
GET /packages/{name}/download
GET /packages/{name}/versions/{version}/download
  Response: PackageContents (tarball or JSON)

# Publish package
POST /packages
  Auth: Required
  Body: PackageContents
  Response: { name, version }

# Update package metadata
PATCH /packages/{name}
  Auth: Required (owner)
  Body: { description?, keywords?, repository? }
  Response: Package

# Delete package version
DELETE /packages/{name}/versions/{version}
  Auth: Required (owner)
  Response: { success: true }
```

#### Users

```yaml
# Register
POST /auth/register
  Body: { email, password, username }
  Response: { user, token }

# Login
POST /auth/login
  Body: { email, password }
  Response: { user, token }

# Get current user
GET /auth/me
  Auth: Required
  Response: User

# Create API key
POST /auth/api-keys
  Auth: Required
  Body: { name, expiresAt? }
  Response: { key, id }

# List API keys
GET /auth/api-keys
  Auth: Required
  Response: ApiKey[]

# Revoke API key
DELETE /auth/api-keys/{id}
  Auth: Required
  Response: { success: true }
```

#### Teams (Pro)

```yaml
# Create team
POST /teams
  Auth: Required
  Body: { name, slug }
  Response: Team

# Get team
GET /teams/{slug}
  Auth: Required (member)
  Response: Team

# Invite member
POST /teams/{slug}/invites
  Auth: Required (admin)
  Body: { email, role }
  Response: Invite

# List members
GET /teams/{slug}/members
  Auth: Required (member)
  Response: TeamMember[]

# Remove member
DELETE /teams/{slug}/members/{userId}
  Auth: Required (admin)
  Response: { success: true }
```

### 11.4 Response Types

```typescript
interface PackageSearchResult {
  name: string;
  version: string;
  type: 'rule' | 'skill' | 'both';
  description: string;
  downloads: number;
  author: string;
  updatedAt: string;
}

interface Package {
  name: string;
  description: string;
  type: 'rule' | 'skill' | 'both';
  latestVersion: string;
  versions: string[];
  author: {
    name: string;
    username: string;
  };
  repository?: string;
  homepage?: string;
  keywords: string[];
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

interface PackageVersion {
  version: string;
  manifest: PackageManifest;
  readme?: string;
  publishedAt: string;
  downloads: number;
}

interface PackageContents {
  manifest: PackageManifest;
  files: Array<{
    path: string;
    content: string;
  }>;
}

interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  memberCount: number;
  createdAt: string;
}
```

### 11.5 Error Responses

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

Error codes:
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Permission denied
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `CONFLICT` - Resource already exists
- `RATE_LIMITED` - Too many requests

### 11.6 Rate Limits

| Endpoint | Anonymous | Authenticated | Pro |
|----------|-----------|---------------|-----|
| Search | 30/min | 100/min | 500/min |
| Download | 60/min | 200/min | 1000/min |
| Publish | N/A | 10/min | 50/min |
| Other | 30/min | 100/min | 500/min |

---

## 12. Web Interface

### 12.1 Information Architecture

```
faster.dev/
├── / (Home)
│   ├── Hero + Search
│   ├── Featured Packages
│   └── Getting Started
│
├── /packages (Browse)
│   ├── Search + Filters
│   └── Package Grid
│
├── /packages/{name} (Package Detail)
│   ├── Overview Tab
│   ├── Versions Tab
│   ├── Dependencies Tab
│   └── Install Instructions
│
├── /docs (Documentation)
│   ├── Getting Started
│   ├── CLI Reference
│   ├── Package Format
│   ├── API Reference
│   └── Team Features
│
├── /login
├── /register
├── /forgot-password
│
├── /dashboard (Authenticated)
│   ├── My Packages
│   ├── Analytics
│   └── Settings
│
├── /teams/{slug} (Team)
│   ├── Packages
│   ├── Members
│   └── Settings
│
└── /settings
    ├── Profile
    ├── API Keys
    ├── Teams
    └── Billing
```

### 12.2 Key Pages

#### Home Page
- Hero section with value proposition
- Search bar (prominent)
- Featured/trending packages
- Getting started section (CLI install command)
- Tool logos showing compatibility

#### Package Listing
- Search with filters (type, tool, keyword)
- Sort by: downloads, updated, name
- Package cards showing: name, description, type badge, download count

#### Package Detail
- Package name, badges, description
- Install command (copy button)
- Tabs: README, Versions, Compatibility
- Sidebar: Author, License, Links, Stats
- Tool compatibility matrix

### 12.3 Design Principles

- **CLI-first messaging**: Web supplements CLI, not replaces it
- **Copy-friendly**: Easy to copy install commands
- **Developer-focused**: Clean, fast, no clutter
- **Tool-agnostic**: Don't favor any particular AI tool
- **Dark mode**: Default to dark, with light option

---

## 13. Security & Access Control

### 13.1 Authentication

**Password Requirements:**
- Minimum 8 characters
- No maximum (bcrypt handles long passwords)
- Check against breached password list (HaveIBeenPwned API)

**Session Management:**
- JWT tokens with 7-day expiry
- Refresh token rotation
- Secure, httpOnly cookies for web
- API keys never expire (but can be revoked)

**API Key Format:**
```
fst_[32 random alphanumeric characters]
Example: fst_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 13.2 Authorization

**Package Permissions:**

| Action | Owner | Team Admin | Team Member | Public |
|--------|-------|------------|-------------|--------|
| View public package | ✅ | ✅ | ✅ | ✅ |
| View private package | ✅ | ✅ | ✅ | ❌ |
| Publish new version | ✅ | ✅ | ❌ | ❌ |
| Edit metadata | ✅ | ✅ | ❌ | ❌ |
| Delete version | ✅ | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |

**Team Permissions:**

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View team | ✅ | ✅ | ✅ |
| Create package | ✅ | ✅ | ✅ |
| Manage packages | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Delete team | ✅ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ |

### 13.3 Content Security

**Package Validation:**
- Scan for malicious content patterns
- Validate JSON/YAML syntax
- Check file sizes (max 1MB per file, 10MB total)
- Reject executable files
- Rate limit publishes

**Content Policy:**
- No malicious code or instructions
- No harassment or hate speech
- No copyright violations
- No impersonation of other authors

### 13.4 Privacy

**Data Collection:**
- Email (required for account)
- Username (public)
- Package content (public or team-only)
- Download counts (aggregated, anonymous)
- IP addresses (for rate limiting, not stored long-term)

**CLI Analytics (Opt-out):**
- Command usage (which commands are run)
- Tool detection results (which tools are popular)
- Error rates (for debugging)
- NO: Package names, file contents, user identification

---

## 14. Monetization

### 14.1 Pricing Tiers

| Feature | Free | Pro ($10/mo) | Team ($25/user/mo) | Enterprise |
|---------|------|--------------|--------------------| -----------|
| Public packages | ✅ | ✅ | ✅ | ✅ |
| Private packages | 1 | 10 | Unlimited | Unlimited |
| Team members | - | - | Up to 25 | Unlimited |
| API rate limit | 100/min | 500/min | 1000/min | Custom |
| Download analytics | Basic | Full | Full | Full |
| Support | Community | Email | Priority | Dedicated |
| SSO/SAML | - | - | - | ✅ |
| Audit logs | - | - | - | ✅ |
| SLA | - | - | - | 99.9% |

### 14.2 Revenue Projections

**Assumptions (Year 1):**
- 5,000 MAU by month 6
- 10,000 MAU by month 12
- 2% Free → Pro conversion
- 0.5% Free → Team conversion
- 5 users per team average

| Month | MAU | Pro Subs | Team Subs | MRR |
|-------|-----|----------|-----------|-----|
| 6 | 5,000 | 100 | 25 | $4,125 |
| 12 | 10,000 | 200 | 50 | $8,250 |

### 14.3 Future Monetization

- **Marketplace fees**: 15% cut on premium package sales
- **Sponsored packages**: Promoted placement in search
- **Enterprise features**: Advanced security, compliance, support

---

## 15. Launch Plan

### 15.1 Milestones

#### Phase 1: Foundation (Weeks 1-4)
- [ ] CLI core functionality (install, remove, list)
- [ ] Package format specification finalized
- [ ] API: packages, auth (basic)
- [ ] Database schema and migrations
- [ ] Package storage (S3/R2)
- [ ] 10 seed packages created

**Exit Criteria:** Can install public packages via CLI

#### Phase 2: Publishing (Weeks 5-8)
- [ ] CLI: init, publish, validate
- [ ] API: publish endpoint, validation
- [ ] Web: Basic package browsing
- [ ] Web: User registration/login
- [ ] Documentation site
- [ ] 50 packages available

**Exit Criteria:** Authors can publish packages

#### Phase 3: Polish (Weeks 9-12)
- [ ] CLI: update, search, info
- [ ] Web: Package detail pages
- [ ] Web: User dashboard
- [ ] Analytics (download counts)
- [ ] Rate limiting
- [ ] Error handling & edge cases
- [ ] 100 packages available

**Exit Criteria:** Ready for public beta

#### Phase 4: Teams (Weeks 13-16)
- [ ] Team creation and management
- [ ] Private packages
- [ ] Team namespaces
- [ ] Billing integration (Stripe)
- [ ] Pro tier launch

**Exit Criteria:** Paying customers

### 15.2 Beta Program

**Closed Beta (50 users):**
- Invite-only via faster.dev audience
- Focus on CLI power users
- Weekly feedback calls
- Bug bounty ($50 per critical bug)

**Open Beta (500 users):**
- Public registration
- ProductHunt launch
- Integration with faster.dev courses
- Feedback via Discord

### 15.3 Launch Marketing

**Channels:**
- faster.dev existing audience (newsletter, YouTube)
- Twitter/X developer community
- Hacker News "Show HN"
- Reddit r/programming, r/vscode
- Dev.to article
- ProductHunt launch

**Messaging:**
> "npm for AI coding assistant rules. Install once, works everywhere."

**Key differentiators to highlight:**
1. Works with 10+ tools (not just one)
2. Private distribution for teams
3. From trusted source (faster.dev/Aaron Francis)

---

## 16. Open Questions

### 16.1 Product Decisions Needed

| Question | Options | Recommendation |
|----------|---------|----------------|
| Package naming | Flat vs scoped (@user/pkg) | Scoped (prevents squatting) |
| Free private packages | 0, 1, or 3 | 1 (enough to try) |
| Package size limit | 1MB, 5MB, 10MB | 5MB (most rules are tiny) |
| Version immutability | Allow updates or not | Immutable (like npm) |
| Unpublish policy | 24hr, 72hr, never | 72hr (compromise) |
| Default visibility | Public or private | Public (encourage sharing) |

### 16.2 Technical Decisions Needed

| Question | Options | Recommendation |
|----------|---------|----------------|
| Hosting | Cloudflare, Vercel, Railway | Cloudflare (global, cheap) |
| Database | Postgres, PlanetScale, Turso | Postgres on Neon/Supabase |
| Storage | S3, R2, B2 | R2 (no egress fees) |
| Auth | Lucia, Auth.js, Clerk | Lucia (lightweight) |
| Payments | Stripe, Paddle, LemonSqueezy | Stripe (standard) |

### 16.3 Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tool format changes | High | Medium | Abstract formats, quick updates |
| Low adoption | Medium | High | Leverage faster.dev audience |
| Package abuse | Medium | Medium | Content policy, rate limits |
| Tool vendor competition | Low | High | Multi-tool support as moat |
| Security breach | Low | High | SOC2 prep, security audits |

---

## Appendix

### A. Tool Configuration Reference

Full documentation of each tool's configuration format is available in the CLI source code at `src/tools.ts`. Key differences:

| Tool | Rules Dir | Skills Dir | Format | Global Path |
|------|-----------|------------|--------|-------------|
| Claude Code | `.claude/rules/` | `.claude/skills/` | MD + YAML | `~/.claude/` |
| Cursor | `.cursor/rules/` | N/A | MDC | `~/.cursor/` |
| Codex | `AGENTS.md` | `.codex/skills/` | MD | `~/.codex/` |
| Cline | `.clinerules/` | N/A | Plain MD | `~/Documents/Cline/Rules/` |
| Roo Code | `.roo/rules/` | N/A | MD | `~/.roo/` |
| Continue | `.continue/rules/` | N/A | MD + YAML | `~/.continue/` |
| Aider | `CONVENTIONS.md` | N/A | MD + Config | `~/.aider.conf.yml` |
| Gemini | `GEMINI.md` | N/A | MD | `~/.gemini/` |
| Amp | `AGENTS.md` | `.agents/skills/` | MD | `~/.config/amp/` |
| OpenCode | `.opencode/rules/` | `.opencode/skill/` | MD | `~/.config/opencode/` |

### B. Competitive Analysis

| Platform | Focus | Multi-tool | Private | Teams |
|----------|-------|------------|---------|-------|
| cursor.directory | Cursor only | ❌ | ❌ | ❌ |
| awesome-cursorrules | Cursor only | ❌ | ❌ | ❌ |
| Continue Hub | Continue only | ❌ | ❌ | ✅ |
| Amp skill installer | Amp only | ❌ | ❌ | ❌ |
| **faster.dev** | All tools | ✅ | ✅ | ✅ |

### C. Glossary

- **Rule**: Project-level instructions that guide AI behavior (coding standards, conventions)
- **Skill**: Reusable capability with instructions and optional assets (SKILL.md format)
- **Package**: A distributable unit containing rules and/or skills
- **Manifest**: Package metadata file (manifest.json)
- **Tool**: An AI coding assistant (Claude Code, Cursor, etc.)
- **Namespace**: Package scope (@user, @team)

### D. References

- AGENTS.md Standard: https://agents.md/
- Claude Code Docs: https://code.claude.com/docs/
- Cursor Rules: https://docs.cursor.com/context/rules
- OpenAI Codex Skills: https://developers.openai.com/codex/skills/
- Continue Rules: https://docs.continue.dev/customize/deep-dives/rules

---

*Document ends*

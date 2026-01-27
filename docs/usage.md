# Usage

## Basic Workflow

1. **Authenticate** with faster.dev
2. **Search** for packages you need
3. **Install** packages to your project

```bash
# Log in
fasterdev login

# Search for packages
fasterdev search "api conventions"

# Install a package
fasterdev install api-conventions
```

## Installing Packages

### Install to Current Project

```bash
fasterdev install <package-name>
```

This detects which AI tools are configured in your project and installs to all of them.

### Install to Specific Tools

```bash
fasterdev install api-conventions --tools claude-code,cursor
```

### Install Globally

Global installations apply to all projects:

```bash
fasterdev install api-conventions --global
```

### Install as Skill

Some packages can be installed as skills (where the tool supports it):

```bash
fasterdev install docx-generator --as-skill
```

### Preview Changes

See what would be installed without making changes:

```bash
fasterdev install api-conventions --dry-run
```

## Managing Packages

### List Installed Packages

```bash
# Project packages
fasterdev list

# Global packages
fasterdev list --global
```

### Check for Updates

```bash
fasterdev outdated
```

### Update Packages

```bash
fasterdev update
```

### Remove Packages

```bash
fasterdev remove api-conventions
```

## Tool Detection

See which AI tools are detected in your project:

```bash
fasterdev detect
```

## Getting Package Info

```bash
fasterdev info api-conventions
```

# CLI Reference

## Global Options

| Option | Description |
|--------|-------------|
| `--version` | Show version number |
| `--help` | Show help |

## Authentication Commands

### `fasterdev login`

Authenticate with faster.dev using device code flow.

```bash
fasterdev login [options]
```

| Option | Description |
|--------|-------------|
| `--no-browser` | Don't open browser automatically |

### `fasterdev logout`

Log out and clear stored credentials.

```bash
fasterdev logout
```

### `fasterdev whoami`

Show current authentication status.

```bash
fasterdev whoami
```

## Package Commands

### `fasterdev install`

Install a package from faster.dev.

```bash
fasterdev install <package> [options]
```

| Option | Description |
|--------|-------------|
| `-g, --global` | Install globally instead of to project |
| `-t, --tools <tools>` | Comma-separated list of tools to install to |
| `--as-skill` | Install as a skill (where supported) |
| `-f, --force` | Overwrite existing installations |
| `--dry-run` | Show what would be installed |
| `--from-file <path>` | Install from local directory |

**Examples:**

```bash
# Basic install
fasterdev install api-conventions

# Install to specific tools
fasterdev install api-conventions --tools claude-code,cursor

# Global install
fasterdev install api-conventions --global

# Install as skill
fasterdev install docx-generator --as-skill

# Preview changes
fasterdev install api-conventions --dry-run
```

### `fasterdev remove`

Remove an installed package.

```bash
fasterdev remove <package> [options]
```

| Option | Description |
|--------|-------------|
| `-g, --global` | Remove from global installation |

### `fasterdev list`

List installed packages.

```bash
fasterdev list [options]
```

| Option | Description |
|--------|-------------|
| `-g, --global` | List global installations |

### `fasterdev outdated`

Show packages that have updates available.

```bash
fasterdev outdated
```

### `fasterdev update`

Update installed packages to latest versions.

```bash
fasterdev update
```

## Discovery Commands

### `fasterdev search`

Search for packages on faster.dev.

```bash
fasterdev search <query>
```

### `fasterdev info`

Show detailed information about a package.

```bash
fasterdev info <package>
```

### `fasterdev detect`

Detect AI coding tools in the current directory.

```bash
fasterdev detect
```

## Configuration Commands

### `fasterdev config`

View or modify configuration.

```bash
fasterdev config [options]
```

| Option | Description |
|--------|-------------|
| `--set-tools <tools>` | Set default tools (comma-separated) |
| `--clear-tools` | Clear default tools |
| `--path` | Show config file path |

**Examples:**

```bash
# Show current config
fasterdev config

# Set default tools
fasterdev config --set-tools claude-code,cursor

# Clear default tools
fasterdev config --clear-tools

# Show config file location
fasterdev config --path
```

## Publishing Commands

### `fasterdev init`

Initialize a new package in the current directory.

```bash
fasterdev init
```

### `fasterdev publish`

Publish a package to faster.dev.

```bash
fasterdev publish [options]
```

| Option | Description |
|--------|-------------|
| `--dry-run` | Validate without publishing |

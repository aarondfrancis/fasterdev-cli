# Configuration

## Config File Location

Configuration is stored at `~/.faster/config.json`.

View the path:

```bash
fasterdev config --path
```

## Config File Format

```json
{
  "apiUrl": "https://faster.dev/api/v1",
  "authToken": "your-auth-token",
  "defaultTools": ["claude-code", "cursor"]
}
```

| Field | Description |
|-------|-------------|
| `apiUrl` | API endpoint URL |
| `authToken` | Authentication token (set via `fasterdev login`) |
| `defaultTools` | Tools to install to by default |

## Setting Default Tools

If you only use certain AI tools, set them as defaults:

```bash
fasterdev config --set-tools claude-code,cursor
```

Now `fasterdev install` will only install to those tools, even if others are detected.

Clear defaults to install to all detected tools:

```bash
fasterdev config --clear-tools
```

## Environment Variables

Environment variables override config file settings:

| Variable | Description |
|----------|-------------|
| `FASTER_API_URL` | Override API URL |
| `FASTER_API_KEY` | Override auth token |

**Example: Self-hosted instance**

```bash
export FASTER_API_URL=https://faster.mycompany.com/api/v1
fasterdev login
```

**Example: CI/CD with token**

```bash
export FASTER_API_KEY=your-token
fasterdev install api-conventions
```

## Precedence

1. Environment variables (highest)
2. Config file
3. Defaults (lowest)

# Installation

## Requirements

- Node.js 18 or later
- npm, yarn, or pnpm

## Install via npm

```bash
npm install -g fasterdev
```

## Install via yarn

```bash
yarn global add fasterdev
```

## Install via pnpm

```bash
pnpm add -g fasterdev
```

## Verify Installation

```bash
fasterdev --version
```

## Authentication

Most commands require authentication with faster.dev:

```bash
fasterdev login
```

This opens your browser for a device code authentication flow. If you're in an environment without a browser, use:

```bash
fasterdev login --no-browser
```

Then manually copy the URL and complete authentication.

## Environment Variables

You can configure fasterdev using environment variables:

| Variable | Description |
|----------|-------------|
| `FASTER_API_URL` | Override the API URL (for self-hosted instances) |
| `FASTER_API_KEY` | Provide auth token without interactive login |

Example for local development:

```bash
export FASTER_API_URL=https://faster.test/api/v1
```

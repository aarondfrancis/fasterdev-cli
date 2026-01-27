import { spawn } from 'child_process';
import type { InstallType } from './types.js';

export function parsePackageSpec(input: string): { name: string; version?: string } {
  if (input.startsWith('@')) {
    const match = input.match(/^(@[^/]+\/[^@]+)(?:@(.+))?$/);
    if (match) {
      return { name: match[1], version: match[2] };
    }
    return { name: input };
  }

  const match = input.match(/^([^@]+)(?:@(.+))?$/);
  if (match) {
    return { name: match[1], version: match[2] };
  }

  return { name: input };
}

/**
 * Check if input is a scope-only reference (e.g., "@audit" without a package name)
 * Returns the scope name if it's scope-only, null otherwise
 */
export function getScopeFromInput(input: string): string | null {
  const match = input.match(/^@([^/@]+)$/);
  return match ? match[1] : null;
}

export function resolveInstallType(asSkill?: boolean): InstallType {
  return asSkill ? 'skill' : 'rule';
}

export function stringifyError(error: unknown, verbose?: boolean): string {
  if (error instanceof Error) {
    if (verbose && error.stack) return error.stack;
    return error.message;
  }
  return String(error);
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function openBrowser(url: string): boolean {
  try {
    const platform = process.platform;
    if (platform === 'darwin') {
      spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
      return true;
    }
    if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true }).unref();
      return true;
    }
    spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
    return true;
  } catch {
    return false;
  }
}

import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';
import type { CLIConfig, ToolId } from './types.js';

const DEFAULT_CONFIG: CLIConfig = {
  apiUrl: 'https://faster.dev/api/v1',
  analytics: true,
};

// Store config in ~/.faster-dev/config.json
const store = new Conf<CLIConfig>({
  projectName: 'faster-dev',
  cwd: join(homedir(), '.faster-dev'),
  defaults: DEFAULT_CONFIG,
});

/**
 * Get the full config with env overrides
 */
export function getConfig(): CLIConfig {
  const apiUrl = process.env.FASTER_API_URL || store.get('apiUrl', DEFAULT_CONFIG.apiUrl);
  const authToken = process.env.FASTER_API_KEY || store.get('authToken');
  const analyticsEnv = process.env.FASTER_NO_ANALYTICS;

  return {
    apiUrl,
    authToken,
    defaultTools: store.get('defaultTools'),
    analytics: analyticsEnv ? false : store.get('analytics', DEFAULT_CONFIG.analytics ?? true),
  };
}

/**
 * Get auth token
 */
export function getAuthToken(): string | undefined {
  return process.env.FASTER_API_KEY || store.get('authToken');
}

/**
 * Set auth token
 */
export function setAuthToken(token: string): void {
  store.set('authToken', token);
}

/**
 * Clear auth token (logout)
 */
export function clearAuthToken(): void {
  store.delete('authToken');
}

/**
 * Get API URL
 */
export function getApiUrl(): string {
  return process.env.FASTER_API_URL || store.get('apiUrl', DEFAULT_CONFIG.apiUrl);
}

/**
 * Set API URL (for testing/self-hosted)
 */
export function setApiUrl(url: string): void {
  store.set('apiUrl', url);
}

/**
 * Get default tools
 */
export function getDefaultTools(): ToolId[] | undefined {
  return store.get('defaultTools');
}

/**
 * Set default tools
 */
export function setDefaultTools(tools: ToolId[]): void {
  store.set('defaultTools', tools);
}

/**
 * Clear default tools
 */
export function clearDefaultTools(): void {
  store.delete('defaultTools');
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return store.path;
}

/**
 * Reset config to defaults
 */
export function resetConfig(): void {
  store.clear();
}

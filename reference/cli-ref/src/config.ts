import Conf from 'conf';
import type { CLIConfig, ToolId } from './types.js';

const DEFAULT_CONFIG: CLIConfig = {
  apiUrl: 'https://api.faster.dev',
};

// Store config in ~/.faster/config.json
const store = new Conf<CLIConfig>({
  projectName: 'faster',
  defaults: DEFAULT_CONFIG,
});

/**
 * Get the full config
 */
export function getConfig(): CLIConfig {
  return {
    apiUrl: store.get('apiUrl', DEFAULT_CONFIG.apiUrl),
    apiKey: store.get('apiKey'),
    defaultTools: store.get('defaultTools'),
  };
}

/**
 * Get API key
 */
export function getApiKey(): string | undefined {
  return store.get('apiKey');
}

/**
 * Set API key
 */
export function setApiKey(key: string): void {
  store.set('apiKey', key);
}

/**
 * Clear API key (logout)
 */
export function clearApiKey(): void {
  store.delete('apiKey');
}

/**
 * Get API URL
 */
export function getApiUrl(): string {
  return store.get('apiUrl', DEFAULT_CONFIG.apiUrl);
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

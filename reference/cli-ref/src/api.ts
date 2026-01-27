import fetch from 'node-fetch';
import type { Package, PackageManifest, PackageSearchResult, AuthResponse, CLIConfig } from './types.js';

const DEFAULT_API_URL = 'https://api.faster.dev';

export class FasterAPI {
  private apiUrl: string;
  private apiKey: string | undefined;

  constructor(config: CLIConfig) {
    this.apiUrl = config.apiUrl || DEFAULT_API_URL;
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Authenticate with faster.dev
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Search for packages
   */
  async search(query: string): Promise<PackageSearchResult[]> {
    const params = new URLSearchParams({ q: query });
    return this.request<PackageSearchResult[]>(`/packages/search?${params}`);
  }

  /**
   * Get package info
   */
  async getPackageInfo(name: string): Promise<PackageManifest> {
    return this.request<PackageManifest>(`/packages/${encodeURIComponent(name)}`);
  }

  /**
   * Download a package
   */
  async downloadPackage(name: string, version?: string): Promise<Package> {
    const endpoint = version
      ? `/packages/${encodeURIComponent(name)}/versions/${version}`
      : `/packages/${encodeURIComponent(name)}/latest`;

    return this.request<Package>(endpoint);
  }

  /**
   * List available packages
   */
  async listPackages(options?: {
    type?: 'rule' | 'skill' | 'both';
    limit?: number;
    offset?: number;
  }): Promise<PackageSearchResult[]> {
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));

    return this.request<PackageSearchResult[]>(`/packages?${params}`);
  }

  /**
   * Publish a package (for package authors)
   */
  async publishPackage(pkg: Package): Promise<{ name: string; version: string }> {
    if (!this.apiKey) {
      throw new Error('Authentication required to publish packages');
    }

    return this.request<{ name: string; version: string }>('/packages', {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.apiKey;
  }

  /**
   * Set API key
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }
}

/**
 * Create a mock/offline package from local files
 * Used when packages are installed from local directories
 */
export function createLocalPackage(
  manifestPath: string,
  files: Array<{ path: string; content: string }>
): Package {
  const manifestFile = files.find((f) => f.path === 'manifest.json');
  if (!manifestFile) {
    throw new Error('No manifest.json found in package');
  }

  const manifest: PackageManifest = JSON.parse(manifestFile.content);
  return { manifest, files };
}

/**
 * Validate a package manifest
 */
export function validateManifest(manifest: unknown): manifest is PackageManifest {
  if (!manifest || typeof manifest !== 'object') return false;

  const m = manifest as Record<string, unknown>;

  if (typeof m.name !== 'string') return false;
  if (typeof m.version !== 'string') return false;
  if (!['rule', 'skill', 'both'].includes(m.type as string)) return false;
  if (typeof m.description !== 'string') return false;

  const compat = m.compatibility as Record<string, unknown> | undefined;
  if (!compat || typeof compat !== 'object') return false;

  return true;
}

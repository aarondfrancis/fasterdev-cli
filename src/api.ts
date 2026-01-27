import fetch from 'node-fetch';
import type {
  Package,
  PackageManifest,
  PackageSearchResult,
  AuthResponse,
  CLIConfig,
  PackageInfo,
  PackageVersion,
  UserInfo,
  DeviceAuthResponse,
  DeviceAuthStatus,
} from './types.js';

const DEFAULT_API_URL = 'https://faster.dev/api/v1';

export class APIError extends Error {
  status: number;
  body?: string;

  constructor(status: number, message: string, body?: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export class FasterAPI {
  private apiUrl: string;
  private authToken: string | undefined;
  private fetcher: typeof fetch;

  constructor(config: CLIConfig, fetcher: typeof fetch = fetch) {
    this.apiUrl = config.apiUrl || DEFAULT_API_URL;
    this.authToken = config.authToken;
    this.fetcher = fetcher;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await this.fetcher(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new APIError(
        response.status,
        `API error (${response.status}): ${errorBody || response.statusText}`,
        errorBody
      );
    }

    if (response.status === 204) {
      return {} as T;
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
   * Start device authentication flow
   */
  async requestDeviceAuth(): Promise<DeviceAuthResponse> {
    return this.request<DeviceAuthResponse>('/auth/device', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Check device authentication status
   */
  async checkDeviceAuth(deviceCode: string): Promise<DeviceAuthStatus> {
    return this.request<DeviceAuthStatus>(`/auth/device/${encodeURIComponent(deviceCode)}`);
  }

  /**
   * Get current user
   */
  async me(): Promise<UserInfo> {
    return this.request<UserInfo>('/auth/me');
  }

  /**
   * Search for packages
   */
  async search(query: string, options?: { type?: 'rule' | 'skill' | 'both'; tool?: string }): Promise<PackageSearchResult[]> {
    const params = new URLSearchParams({ q: query });
    if (options?.type) params.set('type', options.type);
    if (options?.tool) params.set('tool', options.tool);
    return this.request<PackageSearchResult[]>(`/packages/search?${params}`);
  }

  /**
   * Get package info
   */
  async getPackageInfo(name: string): Promise<PackageInfo> {
    return this.request<PackageInfo>(`/packages/${encodeURIComponent(name)}`);
  }

  /**
   * Get package version info
   */
  async getPackageVersion(name: string, version: string): Promise<PackageVersion> {
    return this.request<PackageVersion>(
      `/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`
    );
  }

  /**
   * Download a package
   */
  async downloadPackage(name: string, version?: string): Promise<Package> {
    const endpoint = version
      ? `/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}/download`
      : `/packages/${encodeURIComponent(name)}/download`;

    return this.request<Package>(endpoint);
  }

  /**
   * Publish a package (for package authors)
   */
  async publishPackage(pkg: Package): Promise<{ name: string; version: string }> {
    if (!this.authToken) {
      throw new Error('Authentication required to publish packages');
    }

    return this.request<{ name: string; version: string }>('/packages', {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  }

  /**
   * Set auth token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
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

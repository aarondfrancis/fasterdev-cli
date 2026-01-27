import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { InstallRegistry, InstalledPackageRecord, InstallType } from './types.js';

const SCHEMA_VERSION: InstallRegistry['schemaVersion'] = 1;

function emptyRegistry(): InstallRegistry {
  return { schemaVersion: SCHEMA_VERSION, packages: {} };
}

export function registryKey(name: string, installType: InstallType): string {
  return `${name}::${installType}`;
}

export function getRegistryPath(projectRoot: string, global: boolean): string {
  if (global) {
    return path.join(os.homedir(), '.faster', 'installed.json');
  }
  return path.join(projectRoot, '.faster', 'installed.json');
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function readRegistry(projectRoot: string, global: boolean): Promise<InstallRegistry> {
  const registryPath = getRegistryPath(projectRoot, global);
  try {
    const raw = await fs.readFile(registryPath, 'utf-8');
    const parsed = JSON.parse(raw) as InstallRegistry;
    if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION || typeof parsed.packages !== 'object') {
      return emptyRegistry();
    }
    return parsed;
  } catch {
    return emptyRegistry();
  }
}

export async function writeRegistry(
  projectRoot: string,
  global: boolean,
  registry: InstallRegistry
): Promise<void> {
  const registryPath = getRegistryPath(projectRoot, global);
  await ensureDir(path.dirname(registryPath));
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
}

export function upsertInstalledPackage(
  registry: InstallRegistry,
  record: InstalledPackageRecord
): void {
  registry.packages[registryKey(record.name, record.installType)] = record;
}

export function removeInstalledPackage(
  registry: InstallRegistry,
  name: string,
  installType?: InstallType
): void {
  if (installType) {
    delete registry.packages[registryKey(name, installType)];
    return;
  }

  delete registry.packages[registryKey(name, 'rule')];
  delete registry.packages[registryKey(name, 'skill')];
}

export function listInstalledPackages(registry: InstallRegistry): InstalledPackageRecord[] {
  return Object.values(registry.packages);
}

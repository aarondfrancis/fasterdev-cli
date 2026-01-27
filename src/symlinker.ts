import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { ToolConfig } from './types.js';
import { convertToToolFormat } from './converter.js';

export const CANONICAL_DIR = path.join(os.homedir(), '.faster-dev', 'packages');

export interface CanonicalPackage {
  packageDir: string;
  files: Map<string, string>; // filename -> path
}

/**
 * Check if a path is a symlink
 */
export async function isSymlink(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(filePath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists
 */
async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists
 */
async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Write the canonical package to ~/.faster-dev/packages/<name>/
 * Stores tool-specific converted content for symlink targets.
 * Each tool gets its own file because conversion differs per tool.
 */
export async function writeCanonicalPackage(
  packageName: string,
  originalContent: string,
  toolConfigs: ToolConfig[]
): Promise<CanonicalPackage> {
  const packageDir = path.join(CANONICAL_DIR, packageName);
  await ensureDir(packageDir);

  const files = new Map<string, string>();

  // Write original markdown (for reference/backup)
  const originalPath = path.join(packageDir, 'original.md');
  await fs.writeFile(originalPath, originalContent, 'utf-8');
  files.set('original.md', originalPath);

  // Write tool-specific converted versions
  // Each tool may need different conversion even with same extension
  for (const config of toolConfigs) {
    const ext = config.rules.fileExtension;
    const filename = `rule-${config.id}${ext}`;

    const converted = convertToToolFormat(originalContent, config, packageName);
    const filePath = path.join(packageDir, filename);
    await fs.writeFile(filePath, converted, 'utf-8');
    files.set(filename, filePath);
  }

  return { packageDir, files };
}

/**
 * Get the canonical file path for a specific tool
 */
export function getCanonicalFilePath(
  packageName: string,
  toolConfig: ToolConfig
): string {
  const ext = toolConfig.rules.fileExtension;
  return path.join(CANONICAL_DIR, packageName, `rule-${toolConfig.id}${ext}`);
}

/**
 * Create a symlink from target to canonical source
 */
export async function createSymlink(
  canonicalPath: string,
  targetPath: string,
  options: { force?: boolean } = {}
): Promise<void> {
  // Check if target already exists
  if (await fileExists(targetPath)) {
    if (await isSymlink(targetPath)) {
      // Already a symlink - check if it points to same location
      const existingTarget = await fs.readlink(targetPath);
      if (existingTarget === canonicalPath) {
        // Same symlink, nothing to do
        return;
      }
    }

    if (!options.force) {
      throw new Error(`File already exists at ${targetPath}`);
    }

    // Remove existing file/symlink
    await fs.unlink(targetPath);
  }

  // Ensure parent directory exists
  await ensureDir(path.dirname(targetPath));

  // Create symlink
  await fs.symlink(canonicalPath, targetPath);
}

/**
 * Install a package using symlinks
 * Returns the target path where the symlink was created
 */
export async function installWithSymlink(
  packageName: string,
  content: string,
  toolConfig: ToolConfig,
  targetDir: string,
  options: { force?: boolean } = {}
): Promise<string> {
  // Ensure canonical package exists with all format variants
  await writeCanonicalPackage(packageName, content, [toolConfig]);

  // Get the canonical file for this tool's format
  const canonicalPath = getCanonicalFilePath(packageName, toolConfig);

  // Determine target path
  const filename = `${packageName}${toolConfig.rules.fileExtension}`;
  const targetPath = path.join(targetDir, filename);

  // Create symlink
  await createSymlink(canonicalPath, targetPath, options);

  return targetPath;
}

/**
 * Install a package using copy (fallback mode)
 */
export async function installWithCopy(
  packageName: string,
  content: string,
  toolConfig: ToolConfig,
  targetDir: string,
  options: { force?: boolean } = {}
): Promise<string> {
  const filename = `${packageName}${toolConfig.rules.fileExtension}`;
  const targetPath = path.join(targetDir, filename);

  // Check if file exists
  if (await fileExists(targetPath) && !options.force) {
    throw new Error(`File already exists at ${targetPath}`);
  }

  // Convert content for this tool
  const converted = convertToToolFormat(content, toolConfig, packageName);

  // Ensure directory exists and write file
  await ensureDir(targetDir);
  await fs.writeFile(targetPath, converted, 'utf-8');

  return targetPath;
}

/**
 * Check if symlinks are supported on this system
 */
export async function symlinkSupported(): Promise<boolean> {
  const testDir = path.join(CANONICAL_DIR, '.symlink-test');
  const testSource = path.join(testDir, 'source.txt');
  const testLink = path.join(testDir, 'link.txt');

  try {
    await ensureDir(testDir);
    await fs.writeFile(testSource, 'test', 'utf-8');
    await fs.symlink(testSource, testLink);
    await fs.unlink(testLink);
    await fs.unlink(testSource);
    await fs.rmdir(testDir);
    return true;
  } catch (error: unknown) {
    // Clean up on failure
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    const err = error as NodeJS.ErrnoException;
    // EPERM: Windows without admin privileges
    // ENOTSUP: Filesystem doesn't support symlinks
    if (err.code === 'EPERM' || err.code === 'ENOTSUP') {
      return false;
    }
    // Other errors - assume symlinks work but something else failed
    return true;
  }
}

/**
 * Remove a symlink or file
 */
export async function removeInstallation(targetPath: string): Promise<boolean> {
  try {
    await fs.unlink(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get info about an installed package
 */
export async function getInstallationInfo(targetPath: string): Promise<{
  exists: boolean;
  isSymlink: boolean;
  canonicalPath?: string;
}> {
  if (!(await fileExists(targetPath))) {
    return { exists: false, isSymlink: false };
  }

  const symlink = await isSymlink(targetPath);
  if (symlink) {
    try {
      const canonicalPath = await fs.readlink(targetPath);
      return { exists: true, isSymlink: true, canonicalPath };
    } catch {
      return { exists: true, isSymlink: true };
    }
  }

  return { exists: true, isSymlink: false };
}

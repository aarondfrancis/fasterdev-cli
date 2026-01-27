import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  writeCanonicalPackage,
  getCanonicalFilePath,
  createSymlink,
  installWithSymlink,
  installWithCopy,
  isSymlink,
  symlinkSupported,
  getInstallationInfo,
  removeInstallation,
  CANONICAL_DIR,
} from '../../src/symlinker.js';
import { TOOL_CONFIGS } from '../../src/tools.js';

async function tempDir(prefix = 'faster-symlink-') {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function cleanup(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

const testContent = `---
name: test-rule
description: A test rule
paths:
  - "src/**/*"
---

# Test Rule

This is test content.`;

// --- writeCanonicalPackage tests ---

test('writeCanonicalPackage creates tool-specific files', async () => {
  const packageName = `test-pkg-${Date.now()}`;
  const packageDir = path.join(CANONICAL_DIR, packageName);

  try {
    const result = await writeCanonicalPackage(
      packageName,
      testContent,
      [TOOL_CONFIGS['claude-code'], TOOL_CONFIGS['cursor']]
    );

    assert.equal(result.packageDir, packageDir);
    assert.ok(result.files.has('original.md'));
    assert.ok(result.files.has('rule-claude-code.md'));
    assert.ok(result.files.has('rule-cursor.mdc'));

    // Verify files exist
    await fs.access(path.join(packageDir, 'original.md'));
    await fs.access(path.join(packageDir, 'rule-claude-code.md'));
    await fs.access(path.join(packageDir, 'rule-cursor.mdc'));

    // Verify content is converted appropriately
    const claudeContent = await fs.readFile(path.join(packageDir, 'rule-claude-code.md'), 'utf-8');
    assert.ok(claudeContent.includes('paths:'));

    const cursorContent = await fs.readFile(path.join(packageDir, 'rule-cursor.mdc'), 'utf-8');
    assert.ok(cursorContent.includes('description:'));
    assert.ok(cursorContent.includes('alwaysApply:'));
  } finally {
    await cleanup(packageDir);
  }
});

test('writeCanonicalPackage preserves original content', async () => {
  const packageName = `test-pkg-original-${Date.now()}`;
  const packageDir = path.join(CANONICAL_DIR, packageName);

  try {
    await writeCanonicalPackage(packageName, testContent, [TOOL_CONFIGS['cline']]);

    const originalContent = await fs.readFile(path.join(packageDir, 'original.md'), 'utf-8');
    assert.equal(originalContent, testContent);
  } finally {
    await cleanup(packageDir);
  }
});

test('writeCanonicalPackage strips frontmatter for cline', async () => {
  const packageName = `test-pkg-cline-${Date.now()}`;
  const packageDir = path.join(CANONICAL_DIR, packageName);

  try {
    await writeCanonicalPackage(packageName, testContent, [TOOL_CONFIGS['cline']]);

    const clineContent = await fs.readFile(path.join(packageDir, 'rule-cline.md'), 'utf-8');
    assert.ok(!clineContent.includes('---'));
    assert.ok(clineContent.includes('# Test Rule'));
  } finally {
    await cleanup(packageDir);
  }
});

// --- getCanonicalFilePath tests ---

test('getCanonicalFilePath returns correct path for claude-code', () => {
  const result = getCanonicalFilePath('my-package', TOOL_CONFIGS['claude-code']);
  assert.equal(result, path.join(CANONICAL_DIR, 'my-package', 'rule-claude-code.md'));
});

test('getCanonicalFilePath returns correct path for cursor', () => {
  const result = getCanonicalFilePath('my-package', TOOL_CONFIGS['cursor']);
  assert.equal(result, path.join(CANONICAL_DIR, 'my-package', 'rule-cursor.mdc'));
});

test('getCanonicalFilePath uses tool id in filename', () => {
  const result = getCanonicalFilePath('test-pkg', TOOL_CONFIGS['cline']);
  assert.ok(result.includes('rule-cline.md'));
});

// --- createSymlink tests ---

test('createSymlink creates a symlink', async () => {
  const tempRoot = await tempDir();
  const source = path.join(tempRoot, 'source.txt');
  const target = path.join(tempRoot, 'link.txt');

  try {
    await fs.writeFile(source, 'content', 'utf-8');
    await createSymlink(source, target);

    assert.equal(await isSymlink(target), true);
    const content = await fs.readFile(target, 'utf-8');
    assert.equal(content, 'content');
  } finally {
    await cleanup(tempRoot);
  }
});

test('createSymlink fails on existing file without force', async () => {
  const tempRoot = await tempDir();
  const source = path.join(tempRoot, 'source.txt');
  const target = path.join(tempRoot, 'existing.txt');

  try {
    await fs.writeFile(source, 'source', 'utf-8');
    await fs.writeFile(target, 'existing', 'utf-8');

    await assert.rejects(
      createSymlink(source, target),
      /File already exists/
    );
  } finally {
    await cleanup(tempRoot);
  }
});

test('createSymlink overwrites with force option', async () => {
  const tempRoot = await tempDir();
  const source = path.join(tempRoot, 'source.txt');
  const target = path.join(tempRoot, 'existing.txt');

  try {
    await fs.writeFile(source, 'new content', 'utf-8');
    await fs.writeFile(target, 'old content', 'utf-8');

    await createSymlink(source, target, { force: true });

    assert.equal(await isSymlink(target), true);
    const content = await fs.readFile(target, 'utf-8');
    assert.equal(content, 'new content');
  } finally {
    await cleanup(tempRoot);
  }
});

test('createSymlink replaces existing symlink with force', async () => {
  const tempRoot = await tempDir();
  const source1 = path.join(tempRoot, 'source1.txt');
  const source2 = path.join(tempRoot, 'source2.txt');
  const target = path.join(tempRoot, 'link.txt');

  try {
    await fs.writeFile(source1, 'content1', 'utf-8');
    await fs.writeFile(source2, 'content2', 'utf-8');
    await createSymlink(source1, target);

    await createSymlink(source2, target, { force: true });

    const content = await fs.readFile(target, 'utf-8');
    assert.equal(content, 'content2');
  } finally {
    await cleanup(tempRoot);
  }
});

test('createSymlink creates parent directories', async () => {
  const tempRoot = await tempDir();
  const source = path.join(tempRoot, 'source.txt');
  const target = path.join(tempRoot, 'nested', 'deep', 'link.txt');

  try {
    await fs.writeFile(source, 'content', 'utf-8');
    await createSymlink(source, target);

    assert.equal(await isSymlink(target), true);
  } finally {
    await cleanup(tempRoot);
  }
});

test('createSymlink is idempotent for same target', async () => {
  const tempRoot = await tempDir();
  const source = path.join(tempRoot, 'source.txt');
  const target = path.join(tempRoot, 'link.txt');

  try {
    await fs.writeFile(source, 'content', 'utf-8');
    await createSymlink(source, target);
    // Should not throw when creating same symlink again
    await createSymlink(source, target);

    assert.equal(await isSymlink(target), true);
  } finally {
    await cleanup(tempRoot);
  }
});

// --- isSymlink tests ---

test('isSymlink returns true for symlinks', async () => {
  const tempRoot = await tempDir();
  const source = path.join(tempRoot, 'source.txt');
  const link = path.join(tempRoot, 'link.txt');

  try {
    await fs.writeFile(source, 'content', 'utf-8');
    await fs.symlink(source, link);

    assert.equal(await isSymlink(link), true);
  } finally {
    await cleanup(tempRoot);
  }
});

test('isSymlink returns false for regular files', async () => {
  const tempRoot = await tempDir();
  const file = path.join(tempRoot, 'file.txt');

  try {
    await fs.writeFile(file, 'content', 'utf-8');
    assert.equal(await isSymlink(file), false);
  } finally {
    await cleanup(tempRoot);
  }
});

test('isSymlink returns false for non-existent paths', async () => {
  assert.equal(await isSymlink('/non/existent/path'), false);
});

// --- installWithSymlink tests ---

test('installWithSymlink creates canonical package and symlink', async () => {
  const packageName = `symlink-install-${Date.now()}`;
  const tempRoot = await tempDir();
  const targetDir = path.join(tempRoot, 'rules');
  const packageDir = path.join(CANONICAL_DIR, packageName);

  try {
    const targetPath = await installWithSymlink(
      packageName,
      testContent,
      TOOL_CONFIGS['claude-code'],
      targetDir
    );

    // Verify symlink was created
    assert.ok(await isSymlink(targetPath));
    assert.equal(targetPath, path.join(targetDir, `${packageName}.md`));

    // Verify canonical files exist
    await fs.access(path.join(packageDir, 'rule-claude-code.md'));

    // Verify content through symlink
    const content = await fs.readFile(targetPath, 'utf-8');
    assert.ok(content.includes('paths:'));
  } finally {
    await cleanup(tempRoot);
    await cleanup(packageDir);
  }
});

test('installWithSymlink respects force option', async () => {
  const packageName = `symlink-force-${Date.now()}`;
  const tempRoot = await tempDir();
  const targetDir = path.join(tempRoot, 'rules');
  const targetPath = path.join(targetDir, `${packageName}.md`);
  const packageDir = path.join(CANONICAL_DIR, packageName);

  try {
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, 'old content', 'utf-8');

    await installWithSymlink(
      packageName,
      testContent,
      TOOL_CONFIGS['claude-code'],
      targetDir,
      { force: true }
    );

    assert.ok(await isSymlink(targetPath));
    const content = await fs.readFile(targetPath, 'utf-8');
    assert.ok(content.includes('# Test Rule'));
  } finally {
    await cleanup(tempRoot);
    await cleanup(packageDir);
  }
});

// --- installWithCopy tests ---

test('installWithCopy creates a regular file', async () => {
  const packageName = `copy-install-${Date.now()}`;
  const tempRoot = await tempDir();
  const targetDir = path.join(tempRoot, 'rules');

  try {
    const targetPath = await installWithCopy(
      packageName,
      testContent,
      TOOL_CONFIGS['claude-code'],
      targetDir
    );

    // Verify it's not a symlink
    assert.equal(await isSymlink(targetPath), false);
    assert.equal(targetPath, path.join(targetDir, `${packageName}.md`));

    // Verify content
    const content = await fs.readFile(targetPath, 'utf-8');
    assert.ok(content.includes('paths:'));
  } finally {
    await cleanup(tempRoot);
  }
});

test('installWithCopy fails on existing file without force', async () => {
  const packageName = `copy-existing-${Date.now()}`;
  const tempRoot = await tempDir();
  const targetDir = path.join(tempRoot, 'rules');
  const targetPath = path.join(targetDir, `${packageName}.md`);

  try {
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, 'existing', 'utf-8');

    await assert.rejects(
      installWithCopy(packageName, testContent, TOOL_CONFIGS['claude-code'], targetDir),
      /File already exists/
    );
  } finally {
    await cleanup(tempRoot);
  }
});

test('installWithCopy overwrites with force', async () => {
  const packageName = `copy-force-${Date.now()}`;
  const tempRoot = await tempDir();
  const targetDir = path.join(tempRoot, 'rules');
  const targetPath = path.join(targetDir, `${packageName}.md`);

  try {
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, 'old content', 'utf-8');

    await installWithCopy(
      packageName,
      testContent,
      TOOL_CONFIGS['claude-code'],
      targetDir,
      { force: true }
    );

    const content = await fs.readFile(targetPath, 'utf-8');
    assert.ok(content.includes('# Test Rule'));
  } finally {
    await cleanup(tempRoot);
  }
});

// --- symlinkSupported tests ---

test('symlinkSupported returns boolean', async () => {
  const result = await symlinkSupported();
  assert.equal(typeof result, 'boolean');
});

// --- getInstallationInfo tests ---

test('getInstallationInfo returns correct info for symlink', async () => {
  const tempRoot = await tempDir();
  const source = path.join(tempRoot, 'source.txt');
  const link = path.join(tempRoot, 'link.txt');

  try {
    await fs.writeFile(source, 'content', 'utf-8');
    await fs.symlink(source, link);

    const info = await getInstallationInfo(link);
    assert.equal(info.exists, true);
    assert.equal(info.isSymlink, true);
    assert.equal(info.canonicalPath, source);
  } finally {
    await cleanup(tempRoot);
  }
});

test('getInstallationInfo returns correct info for regular file', async () => {
  const tempRoot = await tempDir();
  const file = path.join(tempRoot, 'file.txt');

  try {
    await fs.writeFile(file, 'content', 'utf-8');

    const info = await getInstallationInfo(file);
    assert.equal(info.exists, true);
    assert.equal(info.isSymlink, false);
    assert.equal(info.canonicalPath, undefined);
  } finally {
    await cleanup(tempRoot);
  }
});

test('getInstallationInfo returns not exists for missing file', async () => {
  const info = await getInstallationInfo('/non/existent/path');
  assert.equal(info.exists, false);
  assert.equal(info.isSymlink, false);
});

// --- removeInstallation tests ---

test('removeInstallation removes symlink', async () => {
  const tempRoot = await tempDir();
  const source = path.join(tempRoot, 'source.txt');
  const link = path.join(tempRoot, 'link.txt');

  try {
    await fs.writeFile(source, 'content', 'utf-8');
    await fs.symlink(source, link);

    const result = await removeInstallation(link);
    assert.equal(result, true);

    // Symlink should be gone, but source remains
    await assert.rejects(fs.access(link));
    await fs.access(source); // Source still exists
  } finally {
    await cleanup(tempRoot);
  }
});

test('removeInstallation removes regular file', async () => {
  const tempRoot = await tempDir();
  const file = path.join(tempRoot, 'file.txt');

  try {
    await fs.writeFile(file, 'content', 'utf-8');

    const result = await removeInstallation(file);
    assert.equal(result, true);

    await assert.rejects(fs.access(file));
  } finally {
    await cleanup(tempRoot);
  }
});

test('removeInstallation returns false for non-existent file', async () => {
  const result = await removeInstallation('/non/existent/path');
  assert.equal(result, false);
});

// --- Integration: symlink vs copy comparison ---

test('symlink and copy produce same readable content', async () => {
  const packageName = `compare-${Date.now()}`;
  const tempRoot = await tempDir();
  const symlinkDir = path.join(tempRoot, 'symlink-rules');
  const copyDir = path.join(tempRoot, 'copy-rules');
  const packageDir = path.join(CANONICAL_DIR, packageName);

  try {
    const symlinkPath = await installWithSymlink(
      packageName,
      testContent,
      TOOL_CONFIGS['claude-code'],
      symlinkDir
    );

    const copyPath = await installWithCopy(
      packageName,
      testContent,
      TOOL_CONFIGS['claude-code'],
      copyDir
    );

    const symlinkContent = await fs.readFile(symlinkPath, 'utf-8');
    const copyContent = await fs.readFile(copyPath, 'utf-8');

    assert.equal(symlinkContent, copyContent);
  } finally {
    await cleanup(tempRoot);
    await cleanup(packageDir);
  }
});

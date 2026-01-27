import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { resolveDetectedTools } from '../../src/commands/shared/package-helpers.js';
import type { InstallOptions, ToolId } from '../../src/types.js';

async function withTempDir(fn: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-test-'));
  try {
    await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('resolveDetectedTools returns all tools when none detected', async () => {
  await withTempDir(async (dir) => {
    const options: InstallOptions = { global: false };
    const tools = await resolveDetectedTools(dir, options);

    // Should return default tools (all available)
    assert.ok(tools.length > 0);
  });
});

test('resolveDetectedTools filters by options.tools', async () => {
  await withTempDir(async (dir) => {
    const options: InstallOptions = {
      global: false,
      tools: ['claude-code'] as ToolId[],
    };
    const tools = await resolveDetectedTools(dir, options);

    assert.equal(tools.length, 1);
    assert.equal(tools[0].config.id, 'claude-code');
  });
});

test('resolveDetectedTools uses defaultTools when options.tools is empty', async () => {
  await withTempDir(async (dir) => {
    const options: InstallOptions = { global: false };
    const defaultTools: ToolId[] = ['cursor', 'codex'];
    const tools = await resolveDetectedTools(dir, options, defaultTools);

    assert.equal(tools.length, 2);
    const ids = tools.map(t => t.config.id);
    assert.ok(ids.includes('cursor'));
    assert.ok(ids.includes('codex'));
  });
});

test('resolveDetectedTools options.tools takes precedence over defaultTools', async () => {
  await withTempDir(async (dir) => {
    // Create directories so tools are detected (use actual detection paths)
    await fs.mkdir(path.join(dir, '.clinerules'), { recursive: true });
    await fs.mkdir(path.join(dir, '.cursor'), { recursive: true });
    await fs.mkdir(path.join(dir, '.codex'), { recursive: true });

    const options: InstallOptions = {
      global: false,
      tools: ['cline'] as ToolId[],
    };
    const defaultTools: ToolId[] = ['cursor', 'codex'];
    const tools = await resolveDetectedTools(dir, options, defaultTools);

    assert.equal(tools.length, 1);
    assert.equal(tools[0].config.id, 'cline');
  });
});

test('resolveDetectedTools throws when specified tools not found', async () => {
  await withTempDir(async (dir) => {
    // Create a .claude directory so only claude-code is detected
    await fs.mkdir(path.join(dir, '.claude'));

    const options: InstallOptions = {
      global: false,
      tools: ['nonexistent-tool'] as ToolId[],
    };

    await assert.rejects(
      () => resolveDetectedTools(dir, options),
      /None of the specified tools were found/
    );
  });
});

test('resolveDetectedTools filters to skill tools when asSkill is true', async () => {
  await withTempDir(async (dir) => {
    const options: InstallOptions = {
      global: false,
      asSkill: true,
    };
    const tools = await resolveDetectedTools(dir, options);

    // All returned tools should support skills
    for (const tool of tools) {
      assert.ok(tool.config.skills, `${tool.config.id} should support skills`);
    }
  });
});

test('resolveDetectedTools throws when no skill tools available', async () => {
  await withTempDir(async (dir) => {
    // Create aider config file so it's detected
    await fs.writeFile(path.join(dir, '.aider.conf.yml'), '# aider config');

    // Aider doesn't support skills, so requesting asSkill should fail
    const options: InstallOptions = {
      global: false,
      tools: ['aider'] as ToolId[],
      asSkill: true,
    };

    await assert.rejects(
      () => resolveDetectedTools(dir, options),
      /No detected tools support skills/
    );
  });
});

test('resolveDetectedTools detects tools from project directories', async () => {
  await withTempDir(async (dir) => {
    // Create Claude Code project directory
    await fs.mkdir(path.join(dir, '.claude'), { recursive: true });

    const options: InstallOptions = { global: false };
    const tools = await resolveDetectedTools(dir, options);

    const claudeTool = tools.find(t => t.config.id === 'claude-code');
    assert.ok(claudeTool, 'Should detect claude-code');
    assert.ok(claudeTool.projectPath, 'Should have project path');
  });
});

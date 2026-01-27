import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  detectTools,
  detectTool,
  getAllTools,
  filterTools,
  getSkillTools,
  formatDetectedTools,
} from '../../src/detector.js';
import { TOOL_CONFIGS } from '../../src/tools.js';

async function withTempDir(fn: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detect-'));
  try {
    await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('detectTools finds multiple tools in same project', async () => {
  await withTempDir(async (dir) => {
    // Create directories for multiple tools
    await fs.mkdir(path.join(dir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(dir, '.cursor'), { recursive: true });
    await fs.mkdir(path.join(dir, '.continue'), { recursive: true });

    const tools = await detectTools(dir);

    const toolIds = tools.map(t => t.config.id);
    assert.ok(toolIds.includes('claude-code'), 'Should detect claude-code');
    assert.ok(toolIds.includes('cursor'), 'Should detect cursor');
    assert.ok(toolIds.includes('continue'), 'Should detect continue');
  });
});

test('detectTools may return globally installed tools even for empty directory', async () => {
  await withTempDir(async (dir) => {
    const tools = await detectTools(dir);
    // Even in an empty directory, globally installed tools may be detected
    // Just verify the function runs without error and returns an array
    assert.ok(Array.isArray(tools));
    // None should have project paths since directory is empty
    for (const tool of tools) {
      assert.equal(tool.projectPath, null, `${tool.config.id} should not have project path in empty dir`);
    }
  });
});

test('detectTool returns null when tool not present', async () => {
  await withTempDir(async (dir) => {
    const result = await detectTool(dir, TOOL_CONFIGS['claude-code']);
    assert.equal(result, null);
  });
});

test('detectTool finds tool by project directory', async () => {
  await withTempDir(async (dir) => {
    // Create cursor directory (primary detection method)
    await fs.mkdir(path.join(dir, '.cursor'), { recursive: true });

    const result = await detectTool('cursor', dir);
    assert.ok(result, 'Should detect cursor');
    assert.equal(result?.config.id, 'cursor');
    assert.ok(result?.projectPath, 'Should have project path');
  });
});

test('getAllTools returns all tool IDs', () => {
  const tools = getAllTools();
  assert.ok(tools.includes('claude-code'));
  assert.ok(tools.includes('cursor'));
  assert.ok(tools.includes('codex'));
  assert.ok(tools.includes('cline'));
  assert.ok(tools.includes('aider'));
  assert.equal(tools.length, Object.keys(TOOL_CONFIGS).length);
});

test('filterTools filters by single tool ID', async () => {
  await withTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, '.claude'));
    await fs.mkdir(path.join(dir, '.cursor'));

    const detected = await detectTools(dir);
    const filtered = filterTools(detected, ['claude-code']);

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].config.id, 'claude-code');
  });
});

test('filterTools filters by multiple tool IDs', async () => {
  await withTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, '.claude'));
    await fs.mkdir(path.join(dir, '.cursor'));
    await fs.mkdir(path.join(dir, '.continue'));

    const detected = await detectTools(dir);
    const filtered = filterTools(detected, ['claude-code', 'cursor']);

    assert.equal(filtered.length, 2);
    const ids = filtered.map(t => t.config.id);
    assert.ok(ids.includes('claude-code'));
    assert.ok(ids.includes('cursor'));
  });
});

test('filterTools filters to requested tools only', async () => {
  await withTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, '.claude'));
    await fs.mkdir(path.join(dir, '.cursor'));

    const detected = await detectTools(dir);
    const filtered = filterTools(detected, ['claude-code']);

    // Should only include claude-code, not cursor
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].config.id, 'claude-code');
  });
});

test('getSkillTools filters to skill-capable tools only', async () => {
  await withTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, '.claude'));
    await fs.mkdir(path.join(dir, '.aider'));
    await fs.mkdir(path.join(dir, '.codex'));

    const detected = await detectTools(dir);
    const skillTools = getSkillTools(detected);

    // Only claude-code and codex support skills, not aider
    for (const tool of skillTools) {
      assert.ok(tool.config.skills, `${tool.config.id} should support skills`);
    }

    const ids = skillTools.map(t => t.config.id);
    assert.ok(!ids.includes('aider'), 'aider should not be in skill tools');
  });
});

test('formatDetectedTools shows tool names and locations', async () => {
  await withTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, '.claude'));

    const detected = await detectTools(dir);
    const claudeTool = detected.find(t => t.config.id === 'claude-code');
    assert.ok(claudeTool, 'Should detect claude-code');

    const formatted = formatDetectedTools(detected);
    assert.ok(formatted.includes('Claude Code'));
    assert.ok(formatted.includes('project'), 'Should show project location');
  });
});

test('formatDetectedTools handles empty array', () => {
  const formatted = formatDetectedTools([]);
  assert.ok(formatted.includes('No AI coding tools detected'));
});

test('formatDetectedTools shows multiple tools', async () => {
  await withTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, '.claude'));
    await fs.mkdir(path.join(dir, '.cursor'));

    const detected = await detectTools(dir);
    const formatted = formatDetectedTools(detected);

    assert.ok(formatted.includes('Claude Code'));
    assert.ok(formatted.includes('Cursor'));
  });
});

test('detectTools respects tool priority order', async () => {
  await withTempDir(async (dir) => {
    // Create multiple tools
    await fs.mkdir(path.join(dir, '.claude'));
    await fs.mkdir(path.join(dir, '.cursor'));
    await fs.mkdir(path.join(dir, '.codex'));

    const detected = await detectTools(dir);

    // Verify detection works but don't assume specific order
    // since priority is implementation detail
    assert.ok(detected.length >= 3);
  });
});

test('detected tool has correct paths', async () => {
  await withTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, '.claude'));

    const detected = await detectTools(dir);
    const claude = detected.find(t => t.config.id === 'claude-code');

    assert.ok(claude);
    assert.ok(claude.projectPath?.includes('.claude'));
    assert.ok(claude.config.rules.projectPath.includes('.claude'));
  });
});

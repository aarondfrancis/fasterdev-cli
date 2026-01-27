import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  detectTools,
  detectTool,
  getAllTools,
  filterTools,
  getSkillTools,
  formatDetectedTools,
} from '../../src/detector.js';
import { TOOL_CONFIGS } from '../../src/tools.js';

async function makeTempProject() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.mkdir(path.join(root, '.claude'), { recursive: true });
  await fs.mkdir(path.join(root, '.cursor'), { recursive: true });
  return root;
}

test('detectTools finds project tool dirs', async () => {
  const root = await makeTempProject();
  const detected = await detectTools(root);
  const ids = detected.map((d) => d.config.id);
  assert.ok(ids.includes('claude-code'));
  assert.ok(ids.includes('cursor'));
});

test('detectTool returns null when tool is absent', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  const result = await detectTool('codex', root);
  assert.ok(result);
  assert.equal(result?.projectPath, null);
});

test('getAllTools returns tool ids', () => {
  const tools = getAllTools();
  assert.ok(tools.includes('claude-code'));
  assert.ok(tools.includes('opencode'));
});

test('filterTools filters detected tools', () => {
  const detected = [
    { config: TOOL_CONFIGS.cursor, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS['claude-code'], projectPath: '.', globalPath: null },
  ];
  const filtered = filterTools(detected, ['cursor']);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].config.id, 'cursor');
});

test('getSkillTools returns only skill-capable tools', () => {
  const detected = [
    { config: TOOL_CONFIGS.cursor, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS['claude-code'], projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.cline, projectPath: '.', globalPath: null },
  ];
  const skills = getSkillTools(detected);
  // Cursor and Claude Code both support skills, Cline does not
  assert.equal(skills.length, 2);
  const ids = skills.map((s) => s.config.id);
  assert.ok(ids.includes('claude-code'));
  assert.ok(ids.includes('cursor'));
});

test('formatDetectedTools handles empty list', () => {
  const message = formatDetectedTools([]);
  assert.equal(message, 'No AI coding tools detected in this project.');
});

test('formatDetectedTools lists detected tool locations', () => {
  const message = formatDetectedTools([
    { config: TOOL_CONFIGS.codex, projectPath: '/tmp/project', globalPath: null },
  ]);
  assert.ok(message.includes('Detected tools:'));
  assert.ok(message.includes('Codex'));
  assert.ok(message.includes('project'));
});

// ============================================================================
// Comprehensive per-tool detection tests
// ============================================================================

test('detects Claude Code via .claude directory', async () => {
  const root = await makeTempProject();
  await fs.mkdir(path.join(root, '.claude'), { recursive: true });
  const result = await detectTool('claude-code', root);
  assert.ok(result?.projectPath);
});

test('detects Cursor via .cursor directory', async () => {
  const root = await makeTempProject();
  await fs.mkdir(path.join(root, '.cursor'), { recursive: true });
  const result = await detectTool('cursor', root);
  assert.ok(result?.projectPath);
});

test('detects Codex via AGENTS.md file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.writeFile(path.join(root, 'AGENTS.md'), '# Agents');
  const result = await detectTool('codex', root);
  assert.ok(result);
});

test('detects Codex via .codex directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.mkdir(path.join(root, '.codex'), { recursive: true });
  const result = await detectTool('codex', root);
  assert.ok(result?.projectPath);
});

test('detects Cline via .clinerules directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.mkdir(path.join(root, '.clinerules'), { recursive: true });
  const result = await detectTool('cline', root);
  assert.ok(result?.projectPath);
});

test('detects Cline via AGENTS.md fallback', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.writeFile(path.join(root, 'AGENTS.md'), '# Agents');
  const result = await detectTool('cline', root);
  assert.ok(result);
});

test('detects Roo Code via .roo directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.mkdir(path.join(root, '.roo'), { recursive: true });
  const result = await detectTool('roo-code', root);
  assert.ok(result?.projectPath);
});

test('detects Roo Code via .roomodes file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.writeFile(path.join(root, '.roomodes'), '{}');
  const result = await detectTool('roo-code', root);
  assert.ok(result);
});

test('detects Continue via .continue directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.mkdir(path.join(root, '.continue'), { recursive: true });
  const result = await detectTool('continue', root);
  assert.ok(result?.projectPath);
});

test('detects Aider via .aider.conf.yml file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.writeFile(path.join(root, '.aider.conf.yml'), 'model: gpt-4');
  const result = await detectTool('aider', root);
  assert.ok(result);
});

test('detects Aider via CONVENTIONS.md file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.writeFile(path.join(root, 'CONVENTIONS.md'), '# Conventions');
  const result = await detectTool('aider', root);
  assert.ok(result);
});

test('detects Gemini via .gemini directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.mkdir(path.join(root, '.gemini'), { recursive: true });
  const result = await detectTool('gemini', root);
  assert.ok(result?.projectPath);
});

test('detects Gemini via GEMINI.md file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.writeFile(path.join(root, 'GEMINI.md'), '# Gemini instructions');
  const result = await detectTool('gemini', root);
  assert.ok(result);
});

test('detects Amp via AGENTS.md file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.writeFile(path.join(root, 'AGENTS.md'), '# Agents');
  const result = await detectTool('amp', root);
  assert.ok(result);
});

test('detects OpenCode via .opencode directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.mkdir(path.join(root, '.opencode'), { recursive: true });
  const result = await detectTool('opencode', root);
  assert.ok(result?.projectPath);
});

test('detects OpenCode via opencode.json file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'faster-detector-'));
  await fs.writeFile(path.join(root, 'opencode.json'), '{}');
  const result = await detectTool('opencode', root);
  assert.ok(result);
});

// --- Skills support detection ---
test('getSkillTools filters to only skill-capable tools', () => {
  const allTools = [
    { config: TOOL_CONFIGS['claude-code'], projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.cursor, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.codex, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.cline, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS['roo-code'], projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.continue, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.aider, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.gemini, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.amp, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.opencode, projectPath: '.', globalPath: null },
  ];
  
  const skillTools = getSkillTools(allTools);
  const skillIds = skillTools.map(t => t.config.id);
  
  // Should include skill-capable tools
  assert.ok(skillIds.includes('claude-code'));
  assert.ok(skillIds.includes('cursor'));
  assert.ok(skillIds.includes('codex'));
  assert.ok(skillIds.includes('amp'));
  assert.ok(skillIds.includes('opencode'));
  
  // Should exclude non-skill tools
  assert.ok(!skillIds.includes('cline'));
  assert.ok(!skillIds.includes('roo-code'));
  assert.ok(!skillIds.includes('continue'));
  assert.ok(!skillIds.includes('aider'));
  assert.ok(!skillIds.includes('gemini'));
  
  assert.equal(skillTools.length, 5);
});

test('filterTools returns subset matching tool ids', () => {
  const allTools = [
    { config: TOOL_CONFIGS['claude-code'], projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.cursor, projectPath: '.', globalPath: null },
    { config: TOOL_CONFIGS.cline, projectPath: '.', globalPath: null },
  ];
  
  const filtered = filterTools(allTools, ['cursor', 'cline']);
  assert.equal(filtered.length, 2);
  assert.ok(filtered.some(t => t.config.id === 'cursor'));
  assert.ok(filtered.some(t => t.config.id === 'cline'));
});

test('filterTools returns empty for no matches', () => {
  const allTools = [
    { config: TOOL_CONFIGS['claude-code'], projectPath: '.', globalPath: null },
  ];
  
  const filtered = filterTools(allTools, ['codex']);
  assert.equal(filtered.length, 0);
});

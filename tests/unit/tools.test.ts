import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_CONFIGS, SKILL_TOOLS, RULE_TOOLS, DEFAULT_TOOL_PRIORITY } from '../../src/tools.js';

test('tool configs ids match keys', () => {
  for (const [key, config] of Object.entries(TOOL_CONFIGS)) {
    assert.equal(config.id, key);
    assert.equal(config.rules.fileExtension.startsWith('.'), true);
  }
});

test('skill tools are a subset and declare skills config', () => {
  for (const toolId of SKILL_TOOLS) {
    const config = TOOL_CONFIGS[toolId];
    assert.ok(config);
    assert.ok(config.skills);
  }
});

test('rule tools match tool configs', () => {
  const toolKeys = Object.keys(TOOL_CONFIGS).sort();
  const ruleTools = [...RULE_TOOLS].sort();
  assert.deepEqual(ruleTools, toolKeys);
});

test('default tool priority covers each tool once', () => {
  const unique = new Set(DEFAULT_TOOL_PRIORITY);
  assert.equal(unique.size, DEFAULT_TOOL_PRIORITY.length);
  for (const toolId of Object.keys(TOOL_CONFIGS)) {
    assert.ok(unique.has(toolId));
  }
});

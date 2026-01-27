import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFrontmatter,
  serializeFrontmatter,
  toMDCFormat,
  toClaudeCodeFormat,
  toContinueFormat,
  toPlainMarkdown,
  convertToToolFormat,
} from '../../src/converter.js';
import { TOOL_CONFIGS } from '../../src/tools.js';

test('parseFrontmatter handles content without frontmatter', () => {
  const content = '# Just a heading\n\nSome body text.';
  const { frontmatter, body } = parseFrontmatter(content);
  assert.deepEqual(frontmatter, {});
  assert.equal(body, content);
});

test('parseFrontmatter handles empty content', () => {
  const { frontmatter, body } = parseFrontmatter('');
  assert.deepEqual(frontmatter, {});
  assert.equal(body, '');
});

test('parseFrontmatter handles only frontmatter', () => {
  // Note: parseFrontmatter requires a trailing newline after closing ---
  const content = '---\nname: test\n---\n';
  const { frontmatter, body } = parseFrontmatter(content);
  assert.equal(frontmatter.name, 'test');
  assert.equal(body, '');
});

test('parseFrontmatter handles malformed YAML gracefully', () => {
  const content = '---\ninvalid: yaml: content:\n---\n\nBody';
  // Should not throw, returns empty frontmatter
  const { body } = parseFrontmatter(content);
  assert.ok(body.includes('Body'));
});

test('parseFrontmatter preserves array values', () => {
  const content = `---
paths:
  - src/**/*
  - lib/**/*
  - test/**/*
---

Body`;
  const { frontmatter } = parseFrontmatter(content);
  assert.deepEqual(frontmatter.paths, ['src/**/*', 'lib/**/*', 'test/**/*']);
});

test('serializeFrontmatter creates valid YAML', () => {
  const frontmatter = {
    name: 'test-rule',
    description: 'A test rule',
    paths: ['src/**/*'],
  };
  const body = '# Content';
  const result = serializeFrontmatter(frontmatter, body);

  assert.ok(result.startsWith('---\n'));
  assert.ok(result.includes('name: test-rule'));
  assert.ok(result.includes('description: A test rule'));
  assert.ok(result.endsWith('# Content'));
});

test('toMDCFormat handles multiple paths', () => {
  const content = `---
paths:
  - src/**/*
  - lib/**/*
---

Body`;
  const converted = toMDCFormat(content);
  const { frontmatter } = parseFrontmatter(converted);
  // Multiple paths should become comma-separated globs
  assert.ok(frontmatter.globs.includes('src/**/*'));
});

test('toMDCFormat handles alwaysApply: true', () => {
  const content = `---
name: always-apply-rule
alwaysApply: true
---

Body`;
  const converted = toMDCFormat(content);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.alwaysApply, true);
});

test('toClaudeCodeFormat handles string globs', () => {
  const content = `---
globs: "**/*.ts"
---

Body`;
  const converted = toClaudeCodeFormat(content);
  const { frontmatter } = parseFrontmatter(converted);
  assert.deepEqual(frontmatter.paths, ['**/*.ts']);
});

test('toClaudeCodeFormat handles array globs', () => {
  const content = `---
globs:
  - "**/*.ts"
  - "**/*.tsx"
---

Body`;
  const converted = toClaudeCodeFormat(content);
  const { frontmatter } = parseFrontmatter(converted);
  assert.deepEqual(frontmatter.paths, ['**/*.ts', '**/*.tsx']);
});

test('toContinueFormat preserves name and description', () => {
  const content = `---
name: my-rule
description: A rule for testing
---

Body`;
  const converted = toContinueFormat(content);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.name, 'my-rule');
  assert.equal(frontmatter.description, 'A rule for testing');
});

test('toPlainMarkdown handles content without frontmatter', () => {
  const content = '# Just content\n\nNo frontmatter here.';
  const result = toPlainMarkdown(content);
  assert.equal(result, content);
});

test('convertToToolFormat works for all tool types', () => {
  const content = `---
name: universal-rule
description: Works everywhere
paths:
  - "**/*"
---

# Universal Rule

This rule applies everywhere.`;

  // Test each tool format
  for (const [toolId, config] of Object.entries(TOOL_CONFIGS)) {
    const converted = convertToToolFormat(content, config, 'universal-rule');
    assert.ok(converted.length > 0, `${toolId} should produce output`);
    assert.ok(converted.includes('Universal Rule'), `${toolId} should preserve content`);
  }
});

test('convertToToolFormat handles special characters in name', () => {
  const content = `---
name: "@scope/my-rule"
description: Scoped package
---

Body`;

  const converted = convertToToolFormat(content, TOOL_CONFIGS.cursor, '@scope/my-rule');
  assert.ok(converted.includes('Scoped package'));
});

test('convertToToolFormat preserves code blocks', () => {
  const content = `---
name: code-rule
---

Example:

\`\`\`typescript
function example() {
  return true;
}
\`\`\`
`;

  const converted = convertToToolFormat(content, TOOL_CONFIGS.cline, 'code-rule');
  assert.ok(converted.includes('```typescript'));
  assert.ok(converted.includes('function example()'));
});

test('convertToToolFormat preserves lists', () => {
  const content = `---
name: list-rule
---

Requirements:

- First item
- Second item
- Third item

1. Numbered one
2. Numbered two
`;

  const converted = toPlainMarkdown(content);
  assert.ok(converted.includes('- First item'));
  assert.ok(converted.includes('1. Numbered one'));
});

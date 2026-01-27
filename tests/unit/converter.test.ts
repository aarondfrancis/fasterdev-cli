import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFrontmatter,
  serializeFrontmatter,
  toMDCFormat,
  toClaudeCodeFormat,
  toContinueFormat,
  toPlainMarkdown,
  toAgentsMdSection,
  toGeminiMdSection,
  convertToToolFormat,
  toAiderConfigEntry,
  createSkillMd,
  parseSkillFrontmatter,
} from '../../src/converter.js';
import { TOOL_CONFIGS } from '../../src/tools.js';

const ruleContent = `---
name: api-conventions
description: REST API rules
paths:
  - "src/api/**/*"
---

# API Conventions

Always use kebab-case.
`;

test('parseFrontmatter splits frontmatter and body', () => {
  const { frontmatter, body } = parseFrontmatter(ruleContent);
  assert.equal(frontmatter.name, 'api-conventions');
  assert.equal(frontmatter.description, 'REST API rules');
  assert.deepEqual(frontmatter.paths, ['src/api/**/*']);
  assert.equal(body, '# API Conventions\n\nAlways use kebab-case.');
});

test('serializeFrontmatter returns body when empty', () => {
  const body = '# Title';
  assert.equal(serializeFrontmatter({}, body), body);
});

test('toMDCFormat converts name/paths', () => {
  const converted = toMDCFormat(ruleContent);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.description, 'REST API rules');
  assert.equal(frontmatter.globs, 'src/api/**/*');
  assert.equal(frontmatter.alwaysApply, false);
});

test('toClaudeCodeFormat converts globs to paths', () => {
  const content = `---\nglobs: \"**/*.ts\"\n---\n\nBody`;
  const converted = toClaudeCodeFormat(content);
  const { frontmatter, body } = parseFrontmatter(converted);
  assert.deepEqual(frontmatter.paths, ['**/*.ts']);
  assert.equal(body, 'Body');
});

test('toContinueFormat preserves name/description and globs', () => {
  const converted = toContinueFormat(ruleContent);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.name, 'api-conventions');
  assert.equal(frontmatter.description, 'REST API rules');
  assert.equal(frontmatter.globs, 'src/api/**/*');
});

test('toPlainMarkdown strips frontmatter', () => {
  const converted = toPlainMarkdown(ruleContent);
  assert.equal(converted, '# API Conventions\n\nAlways use kebab-case.');
});

test('toAgentsMdSection wraps content', () => {
  const section = toAgentsMdSection(ruleContent, 'api-conventions');
  assert.ok(section.includes('## api-conventions'));
  assert.ok(section.includes('Always use kebab-case.'));
});

test('toGeminiMdSection wraps content', () => {
  const section = toGeminiMdSection(ruleContent, 'api-conventions');
  assert.ok(section.includes('## api-conventions'));
  assert.ok(section.includes('Always use kebab-case.'));
});

test('convertToToolFormat delegates to tool format', () => {
  const cursor = convertToToolFormat(ruleContent, TOOL_CONFIGS.cursor, 'api-conventions');
  const { frontmatter } = parseFrontmatter(cursor);
  assert.equal(frontmatter.description, 'REST API rules');
  assert.equal(frontmatter.globs, 'src/api/**/*');

  const cline = convertToToolFormat(ruleContent, TOOL_CONFIGS.cline, 'api-conventions');
  assert.equal(cline, '# API Conventions\n\nAlways use kebab-case.');
});

test('toAiderConfigEntry formats read entry', () => {
  assert.equal(toAiderConfigEntry('rules/api.md'), 'read: rules/api.md');
});

test('createSkillMd and parseSkillFrontmatter roundtrip', () => {
  const content = createSkillMd('Deploy Helper', 'Deployment tips', 'Body', 'MIT');
  const parsed = parseSkillFrontmatter(content);
  assert.equal(parsed.frontmatter.name, 'Deploy Helper');
  assert.equal(parsed.frontmatter.description, 'Deployment tips');
  assert.equal(parsed.frontmatter.license, 'MIT');
  assert.equal(parsed.body, 'Body');
});

test('parseSkillFrontmatter defaults missing values', () => {
  const parsed = parseSkillFrontmatter('No frontmatter');
  assert.equal(parsed.frontmatter.name, 'unnamed');
  assert.equal(parsed.frontmatter.description, '');
  assert.equal(parsed.frontmatter.license, undefined);
});

// ============================================================================
// Comprehensive per-tool converter tests
// ============================================================================

const testRule = `---
name: test-rule
description: A test rule
globs: "**/*.ts"
paths:
  - "src/**/*"
alwaysApply: true
regex: "import.*from"
---

# Test Rule

This is the rule body.
`;

// --- Claude Code format ---
test('Claude Code: converts globs to paths array', () => {
  const input = `---\nglobs: "src/**/*.ts,lib/**/*.js"\n---\n\nBody`;
  const converted = toClaudeCodeFormat(input);
  const { frontmatter, body } = parseFrontmatter(converted);
  assert.deepEqual(frontmatter.paths, ['src/**/*.ts', 'lib/**/*.js']);
  assert.equal(body, 'Body');
});

test('Claude Code: preserves existing paths', () => {
  const input = `---\npaths:\n  - "api/**/*"\n---\n\nBody`;
  const converted = toClaudeCodeFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.deepEqual(frontmatter.paths, ['api/**/*']);
});

test('Claude Code: returns body only when no paths/globs', () => {
  const input = `---\nname: simple\n---\n\nBody only`;
  const converted = toClaudeCodeFormat(input);
  assert.equal(converted, 'Body only');
});

// --- Cursor MDC format ---
test('Cursor MDC: converts name to description', () => {
  const input = `---\nname: My Rule\n---\n\nBody`;
  const converted = toMDCFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.description, 'My Rule');
});

test('Cursor MDC: description overrides name', () => {
  const input = `---\nname: Name\ndescription: Description\n---\n\nBody`;
  const converted = toMDCFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.description, 'Description');
});

test('Cursor MDC: converts paths to globs string', () => {
  const input = `---\npaths:\n  - "src/**/*"\n  - "lib/**/*"\n---\n\nBody`;
  const converted = toMDCFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.globs, 'src/**/*,lib/**/*');
});

test('Cursor MDC: preserves globs over paths', () => {
  const input = `---\nglobs: "**/*.ts"\npaths:\n  - "src/**/*"\n---\n\nBody`;
  const converted = toMDCFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.globs, '**/*.ts');
});

test('Cursor MDC: defaults alwaysApply to false', () => {
  const input = `---\nname: Test\n---\n\nBody`;
  const converted = toMDCFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.alwaysApply, false);
});

test('Cursor MDC: preserves alwaysApply when true', () => {
  const input = `---\nname: Test\nalwaysApply: true\n---\n\nBody`;
  const converted = toMDCFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.alwaysApply, true);
});

// --- Continue format ---
test('Continue: preserves name and description', () => {
  const input = `---\nname: My Rule\ndescription: Does stuff\n---\n\nBody`;
  const converted = toContinueFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.name, 'My Rule');
  assert.equal(frontmatter.description, 'Does stuff');
});

test('Continue: converts paths to globs', () => {
  const input = `---\npaths:\n  - "src/**/*"\n---\n\nBody`;
  const converted = toContinueFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.globs, 'src/**/*');
});

test('Continue: keeps array globs as array', () => {
  const input = `---\npaths:\n  - "src/**/*"\n  - "lib/**/*"\n---\n\nBody`;
  const converted = toContinueFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.deepEqual(frontmatter.globs, ['src/**/*', 'lib/**/*']);
});

test('Continue: preserves globs over paths', () => {
  const input = `---\nglobs: "**/*.ts"\npaths:\n  - "src/**/*"\n---\n\nBody`;
  const converted = toContinueFormat(input);
  const { frontmatter } = parseFrontmatter(converted);
  assert.equal(frontmatter.globs, '**/*.ts');
});

// --- Plain markdown (Cline, Roo Code, Codex, Amp, Gemini, OpenCode) ---
test('toPlainMarkdown: strips all frontmatter', () => {
  const converted = toPlainMarkdown(testRule);
  assert.ok(!converted.includes('---'));
  assert.ok(!converted.includes('name:'));
  assert.ok(converted.includes('# Test Rule'));
  assert.ok(converted.includes('This is the rule body.'));
});

test('toPlainMarkdown: handles content without frontmatter', () => {
  const input = '# Just a heading\n\nSome content.';
  const converted = toPlainMarkdown(input);
  assert.equal(converted, input);
});

// --- AGENTS.md section format ---
test('toAgentsMdSection: wraps with heading', () => {
  const section = toAgentsMdSection(testRule, 'my-package');
  assert.ok(section.includes('\n## my-package\n'));
  assert.ok(section.includes('This is the rule body.'));
  assert.ok(!section.includes('name: test-rule')); // frontmatter stripped
});

// --- GEMINI.md section format ---
test('toGeminiMdSection: wraps with heading', () => {
  const section = toGeminiMdSection(testRule, 'my-package');
  assert.ok(section.includes('\n## my-package\n'));
  assert.ok(section.includes('This is the rule body.'));
});

// --- Aider config entry ---
test('toAiderConfigEntry: formats path correctly', () => {
  assert.equal(toAiderConfigEntry('conventions/api.md'), 'read: conventions/api.md');
  assert.equal(toAiderConfigEntry('CONVENTIONS.md'), 'read: CONVENTIONS.md');
});

// --- convertToToolFormat dispatch ---
test('convertToToolFormat: routes to correct converter for each tool', () => {
  const input = `---\nname: Test\ndescription: Desc\npaths:\n  - "src/**/*"\n---\n\nBody`;

  // Claude Code -> paths frontmatter
  const claude = convertToToolFormat(input, TOOL_CONFIGS['claude-code'], 'test');
  const claudeParsed = parseFrontmatter(claude);
  assert.deepEqual(claudeParsed.frontmatter.paths, ['src/**/*']);

  // Cursor -> MDC with globs
  const cursor = convertToToolFormat(input, TOOL_CONFIGS.cursor, 'test');
  const cursorParsed = parseFrontmatter(cursor);
  assert.equal(cursorParsed.frontmatter.description, 'Desc');
  assert.equal(cursorParsed.frontmatter.globs, 'src/**/*');

  // Continue -> name/description/globs
  const cont = convertToToolFormat(input, TOOL_CONFIGS.continue, 'test');
  const contParsed = parseFrontmatter(cont);
  assert.equal(contParsed.frontmatter.name, 'Test');
  assert.equal(contParsed.frontmatter.globs, 'src/**/*');

  // Cline -> plain markdown
  const cline = convertToToolFormat(input, TOOL_CONFIGS.cline, 'test');
  assert.equal(cline, 'Body');

  // Roo Code -> plain markdown
  const roo = convertToToolFormat(input, TOOL_CONFIGS['roo-code'], 'test');
  assert.equal(roo, 'Body');

  // Codex -> plain markdown
  const codex = convertToToolFormat(input, TOOL_CONFIGS.codex, 'test');
  assert.equal(codex, 'Body');

  // Gemini -> plain markdown
  const gemini = convertToToolFormat(input, TOOL_CONFIGS.gemini, 'test');
  assert.equal(gemini, 'Body');

  // Amp -> plain markdown
  const amp = convertToToolFormat(input, TOOL_CONFIGS.amp, 'test');
  assert.equal(amp, 'Body');

  // OpenCode -> plain markdown
  const opencode = convertToToolFormat(input, TOOL_CONFIGS.opencode, 'test');
  assert.equal(opencode, 'Body');

  // Aider -> plain markdown (config handled separately)
  const aider = convertToToolFormat(input, TOOL_CONFIGS.aider, 'test');
  assert.equal(aider, 'Body');
});

// --- Edge cases ---
test('parseFrontmatter: handles malformed YAML gracefully', () => {
  const input = `---\ninvalid: yaml: here:\n---\n\nBody`;
  const { frontmatter, body } = parseFrontmatter(input);
  assert.deepEqual(frontmatter, {});
  assert.equal(body, input);
});

test('parseFrontmatter: handles missing closing delimiter', () => {
  const input = `---\nname: test\n\nBody without closing`;
  const { frontmatter, body } = parseFrontmatter(input);
  assert.deepEqual(frontmatter, {});
  assert.equal(body, input);
});

test('serializeFrontmatter: creates valid YAML frontmatter', () => {
  const frontmatter = { name: 'Test', globs: ['a', 'b'] };
  const result = serializeFrontmatter(frontmatter, 'Body');
  assert.ok(result.startsWith('---\n'));
  assert.ok(result.includes('name: Test'));
  assert.ok(result.includes('Body'));
});

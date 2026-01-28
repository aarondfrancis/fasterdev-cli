import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  installPackage,
  uninstallPackage,
  listInstalled,
} from '../../src/installer.js';
import { parseFrontmatter } from '../../src/converter.js';
import { TOOL_CONFIGS } from '../../src/tools.js';
import type { DetectedTool, Package } from '../../src/types.js';

async function tempProject() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'faster-installer-'));
}

function tool(toolId: keyof typeof TOOL_CONFIGS, projectRoot: string): DetectedTool {
  const config = TOOL_CONFIGS[toolId];
  return {
    config,
    projectPath: path.join(projectRoot, config.rules.projectPath),
    globalPath: config.rules.globalPath,
  };
}

const ruleContent = `---\nname: api-conventions\ndescription: REST API rules\npaths:\n  - \"src/api/**/*\"\n---\n\n# API Conventions\n\nAlways use kebab-case.`;

const simpleRule = `---\nname: simple\ndescription: Simple\n---\n\nBody only`;

function makeRulePackage(name = 'api-conventions'): Package {
  return {
    manifest: {
      name,
      version: '1.0.0',
      type: 'rule',
      description: 'Rules',
      compatibility: {
        rules: ['cline', 'cursor', 'claude-code', 'codex', 'gemini', 'aider'],
      },
      install: {
        codex: { action: 'append-to-agents-md' },
        gemini: { action: 'append-to-gemini-md' },
        aider: { action: 'add-to-read-config' },
      },
    },
    files: [
      { path: 'manifest.json', content: '{}' },
      { path: 'rule.md', content: ruleContent },
      { path: 'cursor.mdc', content: '---\ndescription: override\n---\nOverride' },
    ],
  };
}

function makeSkillPackage(name = 'skill-pack'): Package {
  return {
    manifest: {
      name,
      version: '1.0.0',
      type: 'skill',
      description: 'Skill package',
      compatibility: {
        skills: ['codex'],
      },
    },
    files: [
      { path: 'manifest.json', content: '{}' },
      { path: 'SKILL.md', content: '# Skill content' },
      { path: 'assets/template.txt', content: 'template' },
    ],
  };
}

test('installs markdown rule and strips frontmatter for Cline', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage();
  const results = await installPackage(pkg, [tool('cline', root)], root, {
    global: false,
  });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.clinerules', `${pkg.manifest.name}.md`);
  const content = await fs.readFile(target, 'utf-8');
  assert.equal(content, '# API Conventions\n\nAlways use kebab-case.');
});

test('installs Cursor rule as MDC with globs', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage();
  const results = await installPackage(pkg, [tool('cursor', root)], root, {
    global: false,
  });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.cursor', 'rules', `${pkg.manifest.name}.mdc`);
  const content = await fs.readFile(target, 'utf-8');
  const parsed = parseFrontmatter(content);
  assert.equal(parsed.frontmatter.description, 'REST API rules');
  assert.equal(parsed.frontmatter.globs, 'src/api/**/*');
});

test('installs Claude rule with paths frontmatter', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage();
  const results = await installPackage(pkg, [tool('claude-code', root)], root, {
    global: false,
  });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.claude', 'rules', `${pkg.manifest.name}.md`);
  const content = await fs.readFile(target, 'utf-8');
  const parsed = parseFrontmatter(content);
  assert.deepEqual(parsed.frontmatter.paths, ['src/api/**/*']);
});

test('appends to AGENTS.md for Codex', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('agents-rule');
  const results = await installPackage(pkg, [tool('codex', root)], root, {
    global: false,
  });

  assert.equal(results[0].success, true);
  const agentsPath = path.join(root, 'AGENTS.md');
  const content = await fs.readFile(agentsPath, 'utf-8');
  assert.ok(content.includes('## agents-rule'));
  assert.ok(content.includes('Always use kebab-case.'));
});

test('append to AGENTS.md skips without force', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('agents-rule');

  await installPackage(pkg, [tool('codex', root)], root, { global: false });
  const results = await installPackage(pkg, [tool('codex', root)], root, {
    global: false,
    force: false,
  });

  assert.equal(results[0].skipped, true);
});

test('appends to GEMINI.md for Gemini', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('gemini-rule');
  const results = await installPackage(pkg, [tool('gemini', root)], root, {
    global: false,
  });

  assert.equal(results[0].success, true);
  const geminiPath = path.join(root, 'GEMINI.md');
  const content = await fs.readFile(geminiPath, 'utf-8');
  assert.ok(content.includes('## gemini-rule'));
});

test('aider special action updates .aider.conf.yml', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('aider-rule');
  const results = await installPackage(pkg, [tool('aider', root)], root, {
    global: false,
  });

  assert.equal(results[0].success, true);
  const rulePath = path.join(root, 'aider-rule.md');
  const configPath = path.join(root, '.aider.conf.yml');
  const ruleContent = await fs.readFile(rulePath, 'utf-8');
  const configContent = await fs.readFile(configPath, 'utf-8');
  assert.equal(ruleContent, '# API Conventions\n\nAlways use kebab-case.');
  assert.ok(configContent.includes('aider-rule.md'));
});

test('installs skill package with assets for Codex', async () => {
  const root = await tempProject();
  const pkg = makeSkillPackage('skill-pack');
  const results = await installPackage(pkg, [tool('codex', root)], root, {
    global: false,
    asSkill: true,
  });

  assert.equal(results[0].success, true);
  const skillDir = path.join(root, '.codex', 'skills', 'skill-pack');
  const skillPath = path.join(skillDir, 'SKILL.md');
  const assetPath = path.join(skillDir, 'assets', 'template.txt');
  const skillContent = await fs.readFile(skillPath, 'utf-8');
  const assetContent = await fs.readFile(assetPath, 'utf-8');
  assert.equal(skillContent, '# Skill content');
  assert.equal(assetContent, 'template');
});

test('dry-run does not write files', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('dry-run');
  const results = await installPackage(pkg, [tool('cline', root)], root, {
    global: false,
    dryRun: true,
  });

  assert.equal(results[0].skipped, true);
  const target = path.join(root, '.clinerules', 'dry-run.md');
  await assert.rejects(fs.readFile(target));
});

test('force overwrites existing file', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('force-rule');
  const target = path.join(root, '.clinerules', 'force-rule.md');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, 'old');

  const results = await installPackage(pkg, [tool('cline', root)], root, {
    global: false,
    force: true,
  });

  assert.equal(results[0].success, true);
  const content = await fs.readFile(target, 'utf-8');
  assert.equal(content, '# API Conventions\n\nAlways use kebab-case.');
});

test('uninstall removes rule and skill', async () => {
  const root = await tempProject();
  const rulePkg = makeRulePackage('remove-rule');
  const skillPkg = makeSkillPackage('remove-skill');

  await installPackage(rulePkg, [tool('cline', root)], root, { global: false });
  await installPackage(skillPkg, [tool('codex', root)], root, { global: false, asSkill: true });

  await uninstallPackage('remove-rule', [tool('cline', root)], root, { global: false });
  await uninstallPackage('remove-skill', [tool('codex', root)], root, { global: false });

  const rulePath = path.join(root, '.clinerules', 'remove-rule.md');
  const skillDir = path.join(root, '.codex', 'skills', 'remove-skill');
  await assert.rejects(fs.readFile(rulePath));
  await assert.rejects(fs.readdir(skillDir));
});

test('listInstalled returns rules and skills', async () => {
  const root = await tempProject();
  const rulePkg = makeRulePackage('list-rule');
  const skillPkg = makeSkillPackage('list-skill');

  await installPackage(rulePkg, [tool('cline', root)], root, { global: false });
  await installPackage(skillPkg, [tool('codex', root)], root, { global: false, asSkill: true });

  const installed = await listInstalled([tool('cline', root), tool('codex', root)], root, { global: false });
  const cline = installed.get('cline');
  const codex = installed.get('codex');

  assert.ok(cline?.rules.includes('list-rule'));
  assert.ok(codex?.skills.includes('list-skill'));
});

test('installPackage throws when no content files exist', async () => {
  const root = await tempProject();
  const pkg: Package = {
    manifest: {
      name: 'empty',
      version: '1.0.0',
      type: 'rule',
      description: 'Empty package',
      compatibility: { rules: ['cline'] },
    },
    files: [{ path: 'manifest.json', content: '{}' }],
  };

  await assert.rejects(() => installPackage(pkg, [tool('cline', root)], root, { global: false }));
});

test('skips tools not in compatibility list', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('compat-skip');
  pkg.manifest.compatibility = { rules: ['codex'] };

  const results = await installPackage(pkg, [tool('cline', root)], root, { global: false });
  assert.equal(results[0].skipped, true);
  assert.equal(results[0].skipReason, 'Tool not in compatibility list');
});

test('skips skills when tool not in compatibility list', async () => {
  const root = await tempProject();
  const pkg = makeSkillPackage('skill-compat-skip');

  const results = await installPackage(pkg, [tool('cline', root)], root, { global: false, asSkill: true });
  assert.equal(results[0].skipped, true);
  assert.equal(results[0].skipReason, 'Skills not supported by this tool');
});

test('skips skills when tool lacks skills support', async () => {
  const root = await tempProject();
  const pkg = makeSkillPackage('skill-no-support');
  pkg.manifest.compatibility = { skills: ['cline'] };

  const results = await installPackage(pkg, [tool('cline', root)], root, { global: false, asSkill: true });
  assert.equal(results[0].skipped, true);
  assert.equal(results[0].skipReason, 'Tool does not support skills');
});

test('skips installation when override is disabled', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('disabled-rule');
  pkg.manifest.install = { cursor: { disabled: true } };

  const results = await installPackage(pkg, [tool('cursor', root)], root, { global: false });
  assert.equal(results[0].skipped, true);
  assert.equal(results[0].skipReason, 'Disabled for this tool');
});

test('uses override file content when provided', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('override-file');
  pkg.files.push({ path: 'cursor-override.mdc', content: '# Cursor override' });
  pkg.manifest.install = { cursor: { file: 'cursor-override.mdc' } };

  const results = await installPackage(pkg, [tool('cursor', root)], root, { global: false });
  assert.equal(results[0].success, true);

  const target = path.join(root, '.cursor', 'rules', 'override-file.mdc');
  const content = await fs.readFile(target, 'utf-8');
  assert.ok(content.includes('Cursor override'));
  assert.ok(!content.includes('Always use kebab-case.'));
});

test('returns error for unknown install action', async () => {
  const root = await tempProject();
  const pkg = makeRulePackage('unknown-action');
  pkg.manifest.install = { codex: { action: 'unknown-action' as 'append-to-agents-md' } };

  const results = await installPackage(pkg, [tool('codex', root)], root, { global: false });
  assert.equal(results[0].success, false);
  assert.ok(results[0].error?.includes('Unknown action'));
});

test('dry-run skips writing skill files', async () => {
  const root = await tempProject();
  const pkg = makeSkillPackage('dry-skill');

  const results = await installPackage(pkg, [tool('codex', root)], root, { global: false, asSkill: true, dryRun: true });
  assert.equal(results[0].skipped, true);

  const skillPath = path.join(root, '.codex', 'skills', 'dry-skill', 'SKILL.md');
  await assert.rejects(fs.readFile(skillPath));
});

// ============================================================================
// Comprehensive per-tool tests
// ============================================================================

function makeSimpleRulePackage(name: string, tools: string[]): Package {
  return {
    manifest: {
      name,
      version: '1.0.0',
      type: 'rule',
      description: 'Test rule',
      compatibility: {
        rules: tools as any[],
      },
    },
    files: [
      { path: 'manifest.json', content: '{}' },
      { path: 'rule.md', content: `---\nname: ${name}\ndescription: Test description\n---\n\n# ${name}\n\nRule content here.` },
    ],
  };
}

function makeSimpleSkillPackage(name: string, tools: string[]): Package {
  return {
    manifest: {
      name,
      version: '1.0.0',
      type: 'skill',
      description: 'Test skill',
      compatibility: {
        skills: tools as any[],
      },
    },
    files: [
      { path: 'manifest.json', content: '{}' },
      { path: 'SKILL.md', content: `---\nname: ${name}\ndescription: A test skill\n---\n\n# ${name}\n\nSkill instructions.` },
    ],
  };
}

// --- Claude Code ---
test('Claude Code: installs rule with paths frontmatter', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('claude-test', ['claude-code']);
  const results = await installPackage(pkg, [tool('claude-code', root)], root, { global: false });

  assert.equal(results[0].success, true);
  assert.equal(results[0].tool, 'claude-code');
  const target = path.join(root, '.claude', 'rules', 'claude-test.md');
  const content = await fs.readFile(target, 'utf-8');
  assert.ok(content.includes('# claude-test'));
});

test('Claude Code: installs skill with SKILL.md', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('claude-skill', ['claude-code']);
  const results = await installPackage(pkg, [tool('claude-code', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].success, true);
  const skillDir = path.join(root, '.claude', 'skills', 'claude-skill');
  const skillPath = path.join(skillDir, 'SKILL.md');
  await fs.access(skillPath);
});

test('Claude Code: uninstalls rule and skill', async () => {
  const root = await tempProject();
  const rulePkg = makeSimpleRulePackage('claude-remove-rule', ['claude-code']);
  const skillPkg = makeSimpleSkillPackage('claude-remove-skill', ['claude-code']);

  await installPackage(rulePkg, [tool('claude-code', root)], root, { global: false });
  await installPackage(skillPkg, [tool('claude-code', root)], root, { global: false, asSkill: true });

  await uninstallPackage('claude-remove-rule', [tool('claude-code', root)], root, { global: false });
  await uninstallPackage('claude-remove-skill', [tool('claude-code', root)], root, { global: false });

  const rulePath = path.join(root, '.claude', 'rules', 'claude-remove-rule.md');
  const skillDir = path.join(root, '.claude', 'skills', 'claude-remove-skill');
  await assert.rejects(fs.access(rulePath));
  await assert.rejects(fs.access(skillDir));
});

// --- Cursor ---
test('Cursor: installs rule as .mdc file', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('cursor-test', ['cursor']);
  const results = await installPackage(pkg, [tool('cursor', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.cursor', 'rules', 'cursor-test.mdc');
  const content = await fs.readFile(target, 'utf-8');
  const parsed = parseFrontmatter(content);
  assert.equal(parsed.frontmatter.description, 'Test description');
  assert.equal(parsed.frontmatter.alwaysApply, false);
});

test('Cursor: installs skill', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('cursor-skill', ['cursor']);
  const results = await installPackage(pkg, [tool('cursor', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].success, true);
  const skillPath = path.join(root, '.cursor', 'skills', 'cursor-skill', 'SKILL.md');
  await fs.access(skillPath);
});

// --- Codex CLI ---
test('Codex: installs rule to .codex/rules/', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('codex-rule-test', ['codex']);
  const results = await installPackage(pkg, [tool('codex', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.codex', 'rules', 'codex-rule-test.md');
  const content = await fs.readFile(target, 'utf-8');
  assert.ok(content.includes('# codex-rule-test'));
  assert.ok(!content.includes('---')); // frontmatter stripped
});

test('Codex: installs skill to .codex/skills/', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('codex-skill-test', ['codex']);
  const results = await installPackage(pkg, [tool('codex', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].success, true);
  const skillPath = path.join(root, '.codex', 'skills', 'codex-skill-test', 'SKILL.md');
  await fs.access(skillPath);
});

// --- Cline ---
test('Cline: installs rule to .clinerules/', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('cline-test', ['cline']);
  const results = await installPackage(pkg, [tool('cline', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.clinerules', 'cline-test.md');
  const content = await fs.readFile(target, 'utf-8');
  assert.ok(content.includes('# cline-test'));
  assert.ok(!content.includes('---')); // frontmatter stripped
});

test('Cline: rejects skill installation', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('cline-skill', ['cline']);
  const results = await installPackage(pkg, [tool('cline', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].skipped, true);
  assert.equal(results[0].skipReason, 'Tool does not support skills');
});

// --- Roo Code ---
test('Roo Code: installs rule to .roo/rules/', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('roo-test', ['roo-code']);
  const results = await installPackage(pkg, [tool('roo-code', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.roo', 'rules', 'roo-test.md');
  const content = await fs.readFile(target, 'utf-8');
  assert.ok(content.includes('# roo-test'));
});

test('Roo Code: rejects skill installation', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('roo-skill', ['roo-code']);
  const results = await installPackage(pkg, [tool('roo-code', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].skipped, true);
  assert.equal(results[0].skipReason, 'Tool does not support skills');
});

// --- Continue ---
test('Continue: installs rule with name/description/globs frontmatter', async () => {
  const root = await tempProject();
  const pkg: Package = {
    manifest: {
      name: 'continue-test',
      version: '1.0.0',
      type: 'rule',
      description: 'Continue rule',
      compatibility: { rules: ['continue'] },
    },
    files: [
      { path: 'manifest.json', content: '{}' },
      { path: 'rule.md', content: `---\nname: continue-test\ndescription: Test\nglobs: "**/*.ts"\n---\n\n# Continue Rule` },
    ],
  };
  const results = await installPackage(pkg, [tool('continue', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.continue', 'rules', 'continue-test.md');
  const content = await fs.readFile(target, 'utf-8');
  const parsed = parseFrontmatter(content);
  assert.equal(parsed.frontmatter.name, 'continue-test');
  assert.equal(parsed.frontmatter.globs, '**/*.ts');
});

test('Continue: rejects skill installation', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('continue-skill', ['continue']);
  const results = await installPackage(pkg, [tool('continue', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].skipped, true);
  assert.equal(results[0].skipReason, 'Tool does not support skills');
});

// --- Aider ---
test('Aider: installs rule to .aider/ directory', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('aider-dir-test', ['aider']);
  const results = await installPackage(pkg, [tool('aider', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.aider', 'aider-dir-test.md');
  const content = await fs.readFile(target, 'utf-8');
  assert.ok(content.includes('# aider-dir-test'));
  assert.ok(!content.includes('---')); // frontmatter stripped
});

test('Aider: rejects skill installation', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('aider-skill', ['aider']);
  const results = await installPackage(pkg, [tool('aider', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].skipped, true);
  assert.equal(results[0].skipReason, 'Tool does not support skills');
});

// --- Gemini CLI ---
test('Gemini: installs rule to .gemini/rules/', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('gemini-dir-test', ['gemini']);
  const results = await installPackage(pkg, [tool('gemini', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.gemini', 'rules', 'gemini-dir-test.md');
  const content = await fs.readFile(target, 'utf-8');
  assert.ok(content.includes('# gemini-dir-test'));
});

test('Gemini: rejects skill installation', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('gemini-skill', ['gemini']);
  const results = await installPackage(pkg, [tool('gemini', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].skipped, true);
  assert.equal(results[0].skipReason, 'Tool does not support skills');
});

// --- Amp ---
test('Amp: installs rule to .amp/rules/', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('amp-test', ['amp']);
  const results = await installPackage(pkg, [tool('amp', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.amp', 'rules', 'amp-test.md');
  const content = await fs.readFile(target, 'utf-8');
  assert.ok(content.includes('# amp-test'));
});

test('Amp: installs skill to .agents/skills/', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('amp-skill', ['amp']);
  const results = await installPackage(pkg, [tool('amp', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].success, true);
  const skillPath = path.join(root, '.agents', 'skills', 'amp-skill', 'SKILL.md');
  await fs.access(skillPath);
});

// --- OpenCode ---
test('OpenCode: installs rule to .opencode/rules/', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('opencode-test', ['opencode']);
  const results = await installPackage(pkg, [tool('opencode', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.opencode', 'rules', 'opencode-test.md');
  const content = await fs.readFile(target, 'utf-8');
  assert.ok(content.includes('# opencode-test'));
});

test('OpenCode: installs skill to .opencode/skill/', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('opencode-skill', ['opencode']);
  const results = await installPackage(pkg, [tool('opencode', root)], root, { global: false, asSkill: true });

  assert.equal(results[0].success, true);
  const skillPath = path.join(root, '.opencode', 'skill', 'opencode-skill', 'SKILL.md');
  await fs.access(skillPath);
});

// --- Multi-tool installation ---
test('installs to multiple tools simultaneously', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('multi-tool', ['claude-code', 'cursor', 'cline']);
  const tools = [tool('claude-code', root), tool('cursor', root), tool('cline', root)];
  const results = await installPackage(pkg, tools, root, { global: false });

  assert.equal(results.length, 3);
  assert.ok(results.every(r => r.success));

  await fs.access(path.join(root, '.claude', 'rules', 'multi-tool.md'));
  await fs.access(path.join(root, '.cursor', 'rules', 'multi-tool.mdc'));
  await fs.access(path.join(root, '.clinerules', 'multi-tool.md'));
});

test('listInstalled works for all tools with content', async () => {
  const root = await tempProject();

  // Install rules to multiple tools
  const pkg1 = makeSimpleRulePackage('list-test-1', ['claude-code', 'cursor', 'cline']);
  const pkg2 = makeSimpleRulePackage('list-test-2', ['claude-code', 'roo-code']);
  
  const tools1 = [tool('claude-code', root), tool('cursor', root), tool('cline', root)];
  const tools2 = [tool('claude-code', root), tool('roo-code', root)];
  
  await installPackage(pkg1, tools1, root, { global: false });
  await installPackage(pkg2, tools2, root, { global: false });

  const allTools = [
    tool('claude-code', root),
    tool('cursor', root),
    tool('cline', root),
    tool('roo-code', root),
  ];
  const installed = await listInstalled(allTools, root, { global: false });

  const claude = installed.get('claude-code');
  assert.ok(claude?.rules.includes('list-test-1'));
  assert.ok(claude?.rules.includes('list-test-2'));

  const cursor = installed.get('cursor');
  assert.ok(cursor?.rules.includes('list-test-1'));

  const cline = installed.get('cline');
  assert.ok(cline?.rules.includes('list-test-1'));

  const roo = installed.get('roo-code');
  assert.ok(roo?.rules.includes('list-test-2'));
});

// --- Install method tests (symlink vs copy) ---

test('default install uses symlinks', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('symlink-default', ['claude-code']);
  const results = await installPackage(pkg, [tool('claude-code', root)], root, { global: false });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.claude', 'rules', 'symlink-default.md');
  const stats = await fs.lstat(target);
  assert.equal(stats.isSymbolicLink(), true);
});

test('installMethod copy creates regular files', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('copy-explicit', ['claude-code']);
  const results = await installPackage(pkg, [tool('claude-code', root)], root, {
    global: false,
    installMethod: 'copy',
  });

  assert.equal(results[0].success, true);
  const target = path.join(root, '.claude', 'rules', 'copy-explicit.md');
  const stats = await fs.lstat(target);
  assert.equal(stats.isSymbolicLink(), false);
});

test('symlink and copy produce identical content', async () => {
  const root1 = await tempProject();
  const root2 = await tempProject();
  const pkg1 = makeSimpleRulePackage('content-compare', ['claude-code']);
  const pkg2 = makeSimpleRulePackage('content-compare', ['claude-code']);

  await installPackage(pkg1, [tool('claude-code', root1)], root1, {
    global: false,
    installMethod: 'symlink',
  });

  await installPackage(pkg2, [tool('claude-code', root2)], root2, {
    global: false,
    installMethod: 'copy',
  });

  const symlinkContent = await fs.readFile(
    path.join(root1, '.claude', 'rules', 'content-compare.md'),
    'utf-8'
  );
  const copyContent = await fs.readFile(
    path.join(root2, '.claude', 'rules', 'content-compare.md'),
    'utf-8'
  );

  assert.equal(symlinkContent, copyContent);
});

test('dry-run shows install method', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('dry-method', ['claude-code']);

  const symlinkResults = await installPackage(pkg, [tool('claude-code', root)], root, {
    global: false,
    dryRun: true,
    installMethod: 'symlink',
  });

  const copyResults = await installPackage(pkg, [tool('claude-code', root)], root, {
    global: false,
    dryRun: true,
    installMethod: 'copy',
  });

  assert.ok(symlinkResults[0].skipReason?.includes('symlink'));
  assert.ok(copyResults[0].skipReason?.includes('copy'));
});

test('uninstall removes symlink but canonical file persists', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('symlink-uninstall', ['claude-code']);

  // Install with symlink
  await installPackage(pkg, [tool('claude-code', root)], root, {
    global: false,
    installMethod: 'symlink',
  });

  const symlinkPath = path.join(root, '.claude', 'rules', 'symlink-uninstall.md');

  // Verify symlink exists and get canonical path
  const stats = await fs.lstat(symlinkPath);
  assert.equal(stats.isSymbolicLink(), true);
  const canonicalPath = await fs.readlink(symlinkPath);

  // Uninstall
  await uninstallPackage('symlink-uninstall', [tool('claude-code', root)], root, { global: false });

  // Symlink should be removed
  await assert.rejects(fs.access(symlinkPath));

  // Canonical file should still exist (for other potential users)
  await fs.access(canonicalPath);
});

test('multi-tool install shares canonical package', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('shared-canonical', ['claude-code', 'cline']);

  await installPackage(pkg, [tool('claude-code', root), tool('cline', root)], root, {
    global: false,
    installMethod: 'symlink',
  });

  const claudePath = path.join(root, '.claude', 'rules', 'shared-canonical.md');
  const clinePath = path.join(root, '.clinerules', 'shared-canonical.md');

  // Both should be symlinks
  const claudeStats = await fs.lstat(claudePath);
  const clineStats = await fs.lstat(clinePath);
  assert.equal(claudeStats.isSymbolicLink(), true);
  assert.equal(clineStats.isSymbolicLink(), true);

  // Both should point to the same canonical package directory
  const claudeTarget = await fs.readlink(claudePath);
  const clineTarget = await fs.readlink(clinePath);

  // Same package directory, different tool-specific files
  const claudeDir = path.dirname(claudeTarget);
  const clineDir = path.dirname(clineTarget);
  assert.equal(claudeDir, clineDir);
});

test('listInstalled works with symlinked files', async () => {
  const root = await tempProject();
  const pkg = makeSimpleRulePackage('list-symlink', ['claude-code']);

  await installPackage(pkg, [tool('claude-code', root)], root, {
    global: false,
    installMethod: 'symlink',
  });

  const installed = await listInstalled([tool('claude-code', root)], root, { global: false });
  const claude = installed.get('claude-code');

  assert.ok(claude?.rules.includes('list-symlink'));
});

// --- Skill name prefixing tests ---

test('skill name is prefixed with fd- on install', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('my-skill', ['claude-code']);

  await installPackage(pkg, [tool('claude-code', root)], root, {
    global: false,
    asSkill: true,
  });

  const skillPath = path.join(root, '.claude', 'skills', 'my-skill', 'SKILL.md');
  const content = await fs.readFile(skillPath, 'utf-8');
  const { frontmatter } = parseFrontmatter(content);

  assert.equal(frontmatter.name, 'fd-my-skill');
});

test('skill name is not double-prefixed if already has fd-', async () => {
  const root = await tempProject();
  const pkg: Package = {
    manifest: {
      name: 'prefixed-skill',
      version: '1.0.0',
      type: 'skill',
      description: 'Already prefixed skill',
      compatibility: { skills: ['claude-code'] },
    },
    files: [
      { path: 'manifest.json', content: '{}' },
      { path: 'SKILL.md', content: '---\nname: fd-already-prefixed\ndescription: Test\n---\n\n# Content' },
    ],
  };

  await installPackage(pkg, [tool('claude-code', root)], root, {
    global: false,
    asSkill: true,
  });

  const skillPath = path.join(root, '.claude', 'skills', 'prefixed-skill', 'SKILL.md');
  const content = await fs.readFile(skillPath, 'utf-8');
  const { frontmatter } = parseFrontmatter(content);

  assert.equal(frontmatter.name, 'fd-already-prefixed');
});

test('skill without name field is installed unchanged', async () => {
  const root = await tempProject();
  const pkg: Package = {
    manifest: {
      name: 'nameless-skill',
      version: '1.0.0',
      type: 'skill',
      description: 'Skill without name in frontmatter',
      compatibility: { skills: ['claude-code'] },
    },
    files: [
      { path: 'manifest.json', content: '{}' },
      { path: 'SKILL.md', content: '---\ndescription: No name field\n---\n\n# Content' },
    ],
  };

  await installPackage(pkg, [tool('claude-code', root)], root, {
    global: false,
    asSkill: true,
  });

  const skillPath = path.join(root, '.claude', 'skills', 'nameless-skill', 'SKILL.md');
  const content = await fs.readFile(skillPath, 'utf-8');
  const { frontmatter } = parseFrontmatter(content);

  // Should not have a name field added
  assert.equal(frontmatter.name, undefined);
});

test('skill name prefix works across multiple tools', async () => {
  const root = await tempProject();
  const pkg = makeSimpleSkillPackage('multi-tool-skill', ['claude-code', 'cursor']);

  await installPackage(pkg, [tool('claude-code', root), tool('cursor', root)], root, {
    global: false,
    asSkill: true,
  });

  // Check Claude Code
  const claudePath = path.join(root, '.claude', 'skills', 'multi-tool-skill', 'SKILL.md');
  const claudeContent = await fs.readFile(claudePath, 'utf-8');
  const claudeFm = parseFrontmatter(claudeContent).frontmatter;
  assert.equal(claudeFm.name, 'fd-multi-tool-skill');

  // Check Cursor
  const cursorPath = path.join(root, '.cursor', 'skills', 'multi-tool-skill', 'SKILL.md');
  const cursorContent = await fs.readFile(cursorPath, 'utf-8');
  const cursorFm = parseFrontmatter(cursorContent).frontmatter;
  assert.equal(cursorFm.name, 'fd-multi-tool-skill');
});

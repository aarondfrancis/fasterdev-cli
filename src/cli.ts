#!/usr/bin/env node

import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';

const program = new Command();

program
  .name('fasterdev')
  .description('Install AI coding assistant skills and rules from faster.dev')
  .version('0.1.0')
  .option('--json', 'Output JSON')
  .option('--verbose', 'Verbose output');

registerAllCommands(program);

program.parse();

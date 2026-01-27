import type { Command } from 'commander';
import { registerSearchCommand } from './search.js';
import { registerInfoCommand } from './info.js';
import { registerDetectCommand } from './detect.js';

export function registerDiscoveryCommands(program: Command): void {
  registerSearchCommand(program);
  registerInfoCommand(program);
  registerDetectCommand(program);
}

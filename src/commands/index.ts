import type { Command } from 'commander';
import { registerAuthCommands } from './auth/index.js';
import { registerDiscoveryCommands } from './discovery/index.js';
import { registerPackageCommands } from './package/index.js';
import { registerConfigCommand } from './config.js';

export function registerAllCommands(program: Command): void {
  registerAuthCommands(program);
  registerDiscoveryCommands(program);
  registerPackageCommands(program);
  registerConfigCommand(program);
}

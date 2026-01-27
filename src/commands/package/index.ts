import type { Command } from 'commander';
import { registerInstallCommand } from './install.js';
import { registerRemoveCommand } from './remove.js';
import { registerListCommand } from './list.js';
import { registerUpdateCommand } from './update.js';
import { registerOutdatedCommand } from './outdated.js';

export function registerPackageCommands(program: Command): void {
  registerInstallCommand(program);
  registerRemoveCommand(program);
  registerListCommand(program);
  registerUpdateCommand(program);
  registerOutdatedCommand(program);
}

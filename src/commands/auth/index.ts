import type { Command } from 'commander';
import { registerLoginCommand } from './login.js';
import { registerLogoutCommand } from './logout.js';
import { registerWhoamiCommand } from './whoami.js';

export function registerAuthCommands(program: Command): void {
  registerLoginCommand(program);
  registerLogoutCommand(program);
  registerWhoamiCommand(program);
}

import { APIError } from '../api.js';

export const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  INVALID_ARGS: 2,
  AUTH_REQUIRED: 3,
  NOT_FOUND: 4,
  NETWORK: 5,
  PERMISSION: 6,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

export function mapApiErrorToExitCode(error: unknown): ExitCode {
  if (error instanceof APIError) {
    if (error.status === 401) return EXIT_CODES.AUTH_REQUIRED;
    if (error.status === 403) return EXIT_CODES.PERMISSION;
    if (error.status === 404) return EXIT_CODES.NOT_FOUND;
    if (error.status >= 500) return EXIT_CODES.NETWORK;
  }
  return EXIT_CODES.ERROR;
}

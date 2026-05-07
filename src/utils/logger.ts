/**
 * Tiny logger that gates informational logs behind dev/test mode.
 * Errors and warnings always pass through so production diagnostics still work.
 */

const isDev = process.env.NODE_ENV !== 'production';

export const log = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export const info = (...args: unknown[]): void => {
  if (isDev) console.info(...args);
};

export const warn = (...args: unknown[]): void => {
  console.warn(...args);
};

export const error = (...args: unknown[]): void => {
  console.error(...args);
};

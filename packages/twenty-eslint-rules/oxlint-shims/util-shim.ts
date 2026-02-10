// Lightweight shim for Node.js `util` module.
// micromatch uses util.inspect() only in error-path type validation.
export function inspect(val: unknown): string {
  return JSON.stringify(val);
}

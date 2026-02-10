// Lightweight shim for Node.js `path` module.
// picomatch (via micromatch) uses path.sep and path.basename.

export const sep = '/';

export function basename(p: string): string {
  const idx = p.lastIndexOf('/');
  return idx === -1 ? p : p.slice(idx + 1);
}

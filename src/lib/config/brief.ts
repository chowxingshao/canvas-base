// Build-time only. Never import this module into browser code.
import { readFile } from 'node:fs/promises';

export async function readBrief(root: URL): Promise<string | null> {
  try {
    return await readFile(new URL('brief.md', root), 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return null;
    throw error;
  }
}

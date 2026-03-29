import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const srcDir = path.dirname(currentFile);

export const repoRoot = path.resolve(srcDir, "..");

export function resolveRepoPath(...segments: string[]): string {
  return path.join(repoRoot, ...segments);
}

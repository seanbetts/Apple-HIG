import path from "node:path";

function canonicalDir(canonicalPath: string): string {
  const trimmed = canonicalPath.replace(/^\/+|\/+$/g, "");
  return trimmed || ".";
}

export function rewriteInternalHigLink(
  href: string,
  currentPagePath: string
): string {
  if (!href.startsWith("/")) {
    return href;
  }

  const [targetPath, fragment] = href.split("#", 2);
  const relativePath = path.posix.relative(
    canonicalDir(currentPagePath),
    canonicalDir(targetPath)
  );

  const rewrittenBase = `${relativePath || "."}/`;
  return fragment ? `${rewrittenBase}#${fragment}` : rewrittenBase;
}

import path from "node:path";

import { classifyAppleUrl } from "../discovery/urlRules.js";

function canonicalDir(canonicalPath: string): string {
  const trimmed = canonicalPath.replace(/^\/+|\/+$/g, "");
  return trimmed || ".";
}

export function rewriteInternalHigLink(
  href: string,
  currentPagePath: string
): string {
  let targetHref = href;

  if (href.startsWith("http://") || href.startsWith("https://")) {
    if (classifyAppleUrl(href) !== "hig") {
      return href;
    }

    const url = new URL(href);
    const canonicalPath =
      url.pathname.replace(/^\/design\/human-interface-guidelines/, "") || "/";
    targetHref = `${canonicalPath}${url.hash}`;
  }

  if (!targetHref.startsWith("/")) {
    return targetHref;
  }

  const [targetPath, fragment] = targetHref.split("#", 2);
  const relativePath = path.posix.relative(
    canonicalDir(currentPagePath),
    canonicalDir(targetPath)
  );

  const rewrittenBase = `${relativePath || "."}/`;
  return fragment ? `${rewrittenBase}#${fragment}` : rewrittenBase;
}

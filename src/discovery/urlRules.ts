const HIG_PREFIX = "/design/human-interface-guidelines";
const APPLE_HOST = "developer.apple.com";

export type AppleUrlClassification = "hig" | "externalApple" | "outOfScope";

export function normalizeHigUrl(input: string): string {
  const url = new URL(input);

  url.hash = "";

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

export function classifyAppleUrl(input: string): AppleUrlClassification {
  const url = new URL(input);
  const normalizedPath = url.pathname.replace(/\/+$/, "");

  if (
    normalizedPath === HIG_PREFIX ||
    normalizedPath.startsWith(`${HIG_PREFIX}/`)
  ) {
    return "hig";
  }

  if (url.hostname !== APPLE_HOST) {
    return "outOfScope";
  }

  return "externalApple";
}

import fs from "node:fs/promises";
import path from "node:path";

function titleCase(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type NavigationEntry =
  | string
  | {
      group: string;
      pages: NavigationEntry[];
    };

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildEntriesForDirectory(
  contentRoot: string,
  relativeDirectory = ""
): Promise<NavigationEntry[]> {
  const absoluteDirectory = path.join(contentRoot, relativeDirectory);
  const directoryEntries = await fs.readdir(absoluteDirectory, {
    withFileTypes: true
  });
  const childDirectories = directoryEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const navigationEntries: NavigationEntry[] = [];

  for (const childDirectory of childDirectories) {
    const childRelativeDirectory = relativeDirectory
      ? path.join(relativeDirectory, childDirectory)
      : childDirectory;
    const childIndexPath = path.join(contentRoot, childRelativeDirectory, "index.md");
    const nestedEntries = await buildEntriesForDirectory(contentRoot, childRelativeDirectory);
    const hasIndexPage = await pathExists(childIndexPath);

    if (!hasIndexPage && nestedEntries.length === 0) {
      continue;
    }

    const pagePath = path.posix.join(
      ...childRelativeDirectory.split(path.sep),
      "index"
    );

    if (hasIndexPage && nestedEntries.length === 0) {
      navigationEntries.push(pagePath);
      continue;
    }

    navigationEntries.push({
      group: titleCase(childDirectory),
      pages: hasIndexPage ? [pagePath, ...nestedEntries] : nestedEntries
    });
  }

  return navigationEntries;
}

export async function syncMintlifyPreview(contentRoot: string): Promise<string> {
  const navigationEntries = await buildEntriesForDirectory(contentRoot);
  const docsConfig = {
    $schema: "https://mintlify.com/docs.json",
    theme: "mint",
    name: "Apple HIG Mirror",
    colors: {
      primary: "#111111"
    },
    navigation: {
      groups: [
        {
          group: "Overview",
          pages: ["index"]
        },
        {
          group: "Mirror",
          pages: navigationEntries
        }
      ]
    }
  };
  const outputPath = path.join(contentRoot, "docs.json");

  await fs.writeFile(outputPath, `${JSON.stringify(docsConfig, null, 2)}\n`, "utf8");

  return outputPath;
}

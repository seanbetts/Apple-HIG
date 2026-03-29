import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

interface VerifyResult {
  ok: boolean;
  errors: string[];
}

async function listMarkdownFiles(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, {
    withFileTypes: true
  });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(rootDir, entry.name);

      if (entry.isDirectory()) {
        return listMarkdownFiles(fullPath);
      }

      if (entry.isFile() && fullPath.endsWith(".md")) {
        return [fullPath];
      }

      return [];
    })
  );

  return files.flat();
}

function hasRequiredFrontmatter(data: Record<string, unknown>): boolean {
  return (
    typeof data.title === "string" &&
    typeof data.source_url === "string" &&
    typeof data.canonical_path === "string" &&
    Array.isArray(data.breadcrumbs) &&
    Array.isArray(data.apple_changes) &&
    Array.isArray(data.internal_links) &&
    Array.isArray(data.external_links)
  );
}

async function checkInternalLinks(
  contentRoot: string,
  pagePath: string,
  internalLinks: string[]
): Promise<string[]> {
  const errors: string[] = [];

  for (const link of internalLinks) {
    const [canonicalPath] = link.split("#", 1);
    const cleanedPath = canonicalPath.replace(/^\/+|\/+$/g, "");
    const targetPath = path.join(contentRoot, cleanedPath, "index.md");

    try {
      await fs.access(targetPath);
    } catch {
      errors.push(`${pagePath}: broken internal link ${link}`);
    }
  }

  return errors;
}

export async function verifyGeneratedContent(options: {
  contentRoot: string;
}): Promise<VerifyResult> {
  const files = await listMarkdownFiles(options.contentRoot);
  const errors: string[] = [];

  for (const file of files) {
    const source = await fs.readFile(file, "utf8");

    if (!source.startsWith("---\n")) {
      errors.push(`${file}: missing frontmatter`);
      continue;
    }

    const parsed = matter(source);
    if (!hasRequiredFrontmatter(parsed.data)) {
      errors.push(`${file}: malformed frontmatter`);
      continue;
    }

    const linkErrors = await checkInternalLinks(
      options.contentRoot,
      file,
      parsed.data.internal_links as string[]
    );
    errors.push(...linkErrors);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

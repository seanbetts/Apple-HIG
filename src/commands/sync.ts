import { chromium } from "playwright";

import { discoverHigUrls } from "../discovery/discoverHigUrls.js";
import { extractPage } from "../extraction/extractPage.js";
import { writeManifest } from "../io/writeManifest.js";
import { writePage } from "../io/writePage.js";
import { normalizePage } from "../normalization/normalizePage.js";
import { renderMarkdown } from "../render/renderMarkdown.js";
import type { Manifest } from "../types/manifest.js";

interface SyncOptions {
  rootUrl: string;
  contentRoot: string;
  manifestsRoot: string;
}

interface SyncDependencies {
  discoverHigUrls: typeof discoverHigUrls;
  extractPageFromUrl: (url: string) => Promise<Awaited<ReturnType<typeof extractPage>>>;
  normalizePage: typeof normalizePage;
  renderMarkdown: typeof renderMarkdown;
  writePage: typeof writePage;
  writeManifest: typeof writeManifest;
}

async function extractPageFromUrl(url: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded"
    });

    return await extractPage(page, url);
  } finally {
    await page.close();
    await browser.close();
  }
}

const defaultDependencies: SyncDependencies = {
  discoverHigUrls,
  extractPageFromUrl,
  normalizePage,
  renderMarkdown,
  writePage,
  writeManifest
};

export async function runSync(
  options: SyncOptions,
  dependencies: SyncDependencies = defaultDependencies
): Promise<Manifest> {
  const discoveredUrls = await dependencies.discoverHigUrls(options.rootUrl);
  const processedUrls: string[] = [];
  const failedUrls: string[] = [];

  for (const url of discoveredUrls) {
    try {
      const extractedPage = await dependencies.extractPageFromUrl(url);
      const normalizedPage = dependencies.normalizePage(extractedPage);
      const markdown = dependencies.renderMarkdown(normalizedPage);

      await dependencies.writePage({
        contentRoot: options.contentRoot,
        canonicalPath: normalizedPage.canonicalPath,
        markdown
      });

      processedUrls.push(url);
    } catch {
      failedUrls.push(url);
    }
  }

  const manifest: Manifest = {
    discoveredUrls,
    processedUrls,
    failedUrls,
    removedUrls: []
  };

  await dependencies.writeManifest({
    manifestsRoot: options.manifestsRoot,
    fileName: "sync.json",
    manifest
  });

  return manifest;
}

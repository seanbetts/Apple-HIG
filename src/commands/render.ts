import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import { extractPage } from "../extraction/extractPage.js";
import { writeManifest } from "../io/writeManifest.js";
import { logger, type Logger } from "../logging.js";
import { syncMintlifyPreview } from "../mintlify/syncMintlifyPreview.js";
import { writePage } from "../io/writePage.js";
import { normalizePage } from "../normalization/normalizePage.js";
import { renderMarkdown } from "../render/renderMarkdown.js";
import type { Manifest } from "../types/manifest.js";
import { planManifestSchema, type PlanManifest } from "../types/plan.js";

interface RenderOptions {
  contentRoot: string;
  manifestsRoot: string;
}

interface RenderDependencies {
  readPlanManifest: (manifestsRoot: string) => Promise<PlanManifest>;
  extractPageFromUrl: (url: string) => Promise<Awaited<ReturnType<typeof extractPage>>>;
  normalizePage: typeof normalizePage;
  renderMarkdown: typeof renderMarkdown;
  writePage: typeof writePage;
  deletePage: (options: {
    contentRoot: string;
    canonicalPath: string;
  }) => Promise<void>;
  syncMintlifyPreview?: (contentRoot: string) => Promise<string>;
  writeManifest: typeof writeManifest;
  logger?: Logger;
}

function canonicalPathFromUrl(url: string): string {
  const parsedUrl = new URL(url);
  const pathName = parsedUrl.pathname.replace(
    /^\/design\/human-interface-guidelines/,
    ""
  );

  return pathName || "/";
}

async function readPlanManifest(manifestsRoot: string): Promise<PlanManifest> {
  return planManifestSchema.parse(
    JSON.parse(
      await fs.readFile(path.join(manifestsRoot, "plan.json"), "utf8")
    ) as unknown
  );
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

async function deletePage(options: {
  contentRoot: string;
  canonicalPath: string;
}): Promise<void> {
  const cleanedPath = options.canonicalPath.replace(/^\/+|\/+$/g, "");
  const segments = cleanedPath ? cleanedPath.split("/") : [];
  const outputPath = path.join(options.contentRoot, ...segments, "index.md");

  await fs.rm(outputPath, {
    force: true
  });
}

const defaultDependencies: RenderDependencies = {
  readPlanManifest,
  extractPageFromUrl,
  normalizePage,
  renderMarkdown,
  writePage,
  deletePage,
  syncMintlifyPreview,
  writeManifest,
  logger
};

async function withSharedBrowserExtractor<T>(
  run: (extractFromUrl: RenderDependencies["extractPageFromUrl"]) => Promise<T>
): Promise<T> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    return await run(async (url: string) => {
      await page.goto(url, {
        waitUntil: "domcontentloaded"
      });

      return extractPage(page, url);
    });
  } finally {
    await page.close();
    await browser.close();
  }
}

export async function runRender(
  options: RenderOptions,
  dependencies: RenderDependencies = defaultDependencies
): Promise<Manifest> {
  const resolvedDependencies = {
    ...defaultDependencies,
    ...dependencies
  };
  const renderLogger = resolvedDependencies.logger ?? logger;
  const planManifest = await resolvedDependencies.readPlanManifest(options.manifestsRoot);
  const processedUrls: string[] = [];
  const failedUrls: string[] = [];
  const writeProgressManifest = async () => {
    await resolvedDependencies.writeManifest({
      manifestsRoot: options.manifestsRoot,
      fileName: "render.checkpoint.json",
      manifest: {
        discoveredUrls: planManifest.discoveredUrls,
        processedUrls: [...processedUrls],
        failedUrls: [...failedUrls],
        removedUrls: []
      }
    });
  };

  const processUrls = async (
    extractFromUrl: RenderDependencies["extractPageFromUrl"]
  ) => {
    for (const url of planManifest.renderUrls) {
      try {
        const extractedPage = await extractFromUrl(url);
        const normalizedPage = resolvedDependencies.normalizePage(extractedPage);
        const markdown = resolvedDependencies.renderMarkdown(normalizedPage);

        await resolvedDependencies.writePage({
          contentRoot: options.contentRoot,
          canonicalPath: normalizedPage.canonicalPath,
          markdown
        });

        processedUrls.push(url);
      } catch {
        failedUrls.push(url);
      }

      renderLogger.info(
        `Render progress: processed ${processedUrls.length}/${planManifest.renderUrls.length}, failed ${failedUrls.length}, current ${url}`
      );
      await writeProgressManifest();
    }
  };

  if (dependencies === defaultDependencies) {
    await withSharedBrowserExtractor(processUrls);
  } else {
    await processUrls(resolvedDependencies.extractPageFromUrl);
  }

  for (const removedUrl of planManifest.removedUrls) {
    await resolvedDependencies.deletePage({
      contentRoot: options.contentRoot,
      canonicalPath: canonicalPathFromUrl(removedUrl)
    });
  }

  await resolvedDependencies.syncMintlifyPreview?.(options.contentRoot);

  const manifest: Manifest = {
    discoveredUrls: planManifest.discoveredUrls,
    processedUrls,
    failedUrls,
    removedUrls: planManifest.removedUrls
  };

  await resolvedDependencies.writeManifest({
    manifestsRoot: options.manifestsRoot,
    fileName: "render.json",
    manifest
  });

  return manifest;
}

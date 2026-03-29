import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import { extractPage } from "../extraction/extractPage.js";
import { writeManifest } from "../io/writeManifest.js";
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
  writeManifest: typeof writeManifest;
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
  writeManifest
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
  const planManifest = await dependencies.readPlanManifest(options.manifestsRoot);
  const processedUrls: string[] = [];
  const failedUrls: string[] = [];

  const processUrls = async (
    extractFromUrl: RenderDependencies["extractPageFromUrl"]
  ) => {
    for (const url of planManifest.renderUrls) {
      try {
        const extractedPage = await extractFromUrl(url);
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
  };

  if (dependencies === defaultDependencies) {
    await withSharedBrowserExtractor(processUrls);
  } else {
    await processUrls(dependencies.extractPageFromUrl);
  }

  for (const removedUrl of planManifest.removedUrls) {
    await dependencies.deletePage({
      contentRoot: options.contentRoot,
      canonicalPath: canonicalPathFromUrl(removedUrl)
    });
  }

  const manifest: Manifest = {
    discoveredUrls: planManifest.discoveredUrls,
    processedUrls,
    failedUrls,
    removedUrls: planManifest.removedUrls
  };

  await dependencies.writeManifest({
    manifestsRoot: options.manifestsRoot,
    fileName: "render.json",
    manifest
  });

  return manifest;
}

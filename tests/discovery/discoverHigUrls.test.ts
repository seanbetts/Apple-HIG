import fs from "node:fs/promises";
import http from "node:http";

import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  discoverHigUrls,
  discoverHigUrlsFromPage
} from "../../src/discovery/discoverHigUrls.js";

const fixturePath = new URL("../fixtures/pages/hig-home.html", import.meta.url);

describe("discoverHigUrlsFromPage", () => {
  let browser: Awaited<ReturnType<typeof chromium.launch>>;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("collects canonical HIG links, deduplicates them, and excludes external Apple docs", async () => {
    const page = await browser.newPage();
    const html = await fs.readFile(fixturePath, "utf8");

    await page.setContent(html, {
      waitUntil: "domcontentloaded"
    });

    const urls = await discoverHigUrlsFromPage(page);

    expect(urls).toEqual([
      "https://developer.apple.com/design/human-interface-guidelines/components",
      "https://developer.apple.com/design/human-interface-guidelines/components/buttons",
      "https://developer.apple.com/design/human-interface-guidelines/foundations",
      "https://developer.apple.com/design/human-interface-guidelines/getting-started",
      "https://developer.apple.com/design/human-interface-guidelines/inputs",
      "https://developer.apple.com/design/human-interface-guidelines/patterns",
      "https://developer.apple.com/design/human-interface-guidelines/technologies"
    ]);

    await page.close();
  });

  it("waits for hydrated main-content links before collecting discovery URLs", async () => {
    const page = await browser.newPage();

    await page.setContent(
      `<!doctype html>
      <html>
        <body>
          <main>
            <a href="https://developer.apple.com/design/human-interface-guidelines/">Root</a>
          </main>
          <script>
            setTimeout(() => {
              const link = document.createElement("a");
              link.href = "https://developer.apple.com/design/human-interface-guidelines/foundations";
              link.textContent = "Foundations";
              document.querySelector("main").appendChild(link);
            }, 50);
          </script>
        </body>
      </html>`,
      { waitUntil: "domcontentloaded" }
    );

    const urls = await discoverHigUrlsFromPage(page);

    expect(urls).toContain(
      "https://developer.apple.com/design/human-interface-guidelines/foundations"
    );

    await page.close();
  });

  it("recursively discovers nested HIG pages from linked HIG pages", async () => {
    const server = http.createServer((request, response) => {
      response.setHeader("Content-Type", "text/html; charset=utf-8");

      if (request.url === "/design/human-interface-guidelines") {
        response.end(`<!doctype html>
          <html>
            <body>
              <main>
                <a href="/design/human-interface-guidelines/foundations">Foundations</a>
                <a href="/design/human-interface-guidelines/components">Components</a>
              </main>
            </body>
          </html>`);
        return;
      }

      if (request.url === "/design/human-interface-guidelines/foundations") {
        response.end(`<!doctype html>
          <html>
            <body>
              <main>
                <article>
                  <a href="/design/human-interface-guidelines/foundations/accessibility">Accessibility</a>
                </article>
              </main>
            </body>
          </html>`);
        return;
      }

      if (request.url === "/design/human-interface-guidelines/components") {
        response.end(`<!doctype html>
          <html>
            <body>
              <main>
                <article>
                  <a href="/design/human-interface-guidelines/components/buttons">Buttons</a>
                </article>
              </main>
            </body>
          </html>`);
        return;
      }

      response.end(`<!doctype html>
        <html>
          <body>
            <main>
              <article>
                <p>Leaf page</p>
              </article>
            </main>
          </body>
        </html>`);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Failed to start discovery test server");
    }

    try {
      const urls = await discoverHigUrls(
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines`,
        browser
      );

      expect(urls).toEqual([
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines`,
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines/components`,
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines/components/buttons`,
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines/foundations`,
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines/foundations/accessibility`
      ]);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  });

  it("does not enqueue the same canonical URL more than once during recursive discovery", async () => {
    const server = http.createServer((request, response) => {
      response.setHeader("Content-Type", "text/html; charset=utf-8");

      if (request.url === "/design/human-interface-guidelines") {
        response.end(`<!doctype html>
          <html>
            <body>
              <main>
                <a href="/design/human-interface-guidelines/foundations">Foundations</a>
                <a href="/design/human-interface-guidelines/components">Components</a>
              </main>
            </body>
          </html>`);
        return;
      }

      if (request.url === "/design/human-interface-guidelines/foundations") {
        response.end(`<!doctype html>
          <html>
            <body>
              <main>
                <article>
                  <a href="/design/human-interface-guidelines/inclusion">Inclusion A</a>
                </article>
              </main>
            </body>
          </html>`);
        return;
      }

      if (request.url === "/design/human-interface-guidelines/components") {
        response.end(`<!doctype html>
          <html>
            <body>
              <main>
                <article>
                  <a href="/design/human-interface-guidelines/inclusion/">Inclusion B</a>
                </article>
              </main>
            </body>
          </html>`);
        return;
      }

      if (
        request.url === "/design/human-interface-guidelines/inclusion" ||
        request.url === "/design/human-interface-guidelines/inclusion/"
      ) {
        response.end(`<!doctype html>
          <html>
            <body>
              <main>
                <article>
                  <p>Inclusion</p>
                </article>
              </main>
            </body>
          </html>`);
        return;
      }

      response.end(`<!doctype html><html><body><main></main></body></html>`);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Failed to start discovery test server");
    }

    try {
      const progressStates: Array<{
        visitedCount: number;
        queuedCount: number;
        discoveredCount: number;
        currentUrl: string;
        discoveredUrls: string[];
      }> = [];

      const urls = await discoverHigUrls(
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines`,
        {
          browser,
          onProgress: (state) => {
            progressStates.push(state);
          }
        }
      );

      expect(urls).toEqual([
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines`,
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines/components`,
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines/foundations`,
        `http://127.0.0.1:${address.port}/design/human-interface-guidelines/inclusion`
      ]);
      expect(progressStates[0]).toMatchObject({
        visitedCount: 1,
        queuedCount: 2,
        discoveredCount: 3,
        currentUrl: `http://127.0.0.1:${address.port}/design/human-interface-guidelines`
      });
      expect(
        progressStates.find(
          (state) =>
            state.currentUrl ===
            `http://127.0.0.1:${address.port}/design/human-interface-guidelines/foundations`
        )
      ).toMatchObject({
        currentUrl: `http://127.0.0.1:${address.port}/design/human-interface-guidelines/foundations`,
        queuedCount: 1,
        discoveredCount: 4
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  });
});

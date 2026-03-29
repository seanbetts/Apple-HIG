import { chromium } from "playwright";

import { extractPage } from "../../../src/extraction/extractPage.js";

void (async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.setContent(
      `<!doctype html>
      <html>
        <head>
          <meta name="description" content="Accessible user interfaces empower everyone." />
        </head>
        <body>
          <main>
            <div class="documentation-hero documentation-hero--disabled">
              <div class="documentation-hero__content short-hero">
                <div class="topictitle">
                  <h1 class="title"><span>Accessibility</span></h1>
                </div>
                <div class="abstract content">Accessible user interfaces empower everyone.</div>
              </div>
            </div>
            <div class="doc-content-wrapper">
              <div class="doc-content">
                <div class="container">
                  <div class="primary-content with-border">
                    <div class="content">
                      <p>As you design interfaces for Apple platforms, keep these principles in mind.</p>
                      <h2 id="overview">Overview</h2>
                      <p>Accessible experiences help everyone use your app.</p>
                      <ul>
                        <li>Support VoiceOver.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </body>
      </html>`,
      { waitUntil: "domcontentloaded" }
    );

    const result = await extractPage(
      page,
      "https://developer.apple.com/design/human-interface-guidelines/accessibility"
    );

    console.log(JSON.stringify(result));
  } finally {
    await page.close();
    await browser.close();
  }
})();

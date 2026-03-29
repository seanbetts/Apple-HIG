# HIG Mirror Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-backed CLI that mirrors Apple HIG pages into deterministic Markdown, verifies the output, and supports weekly GitHub Actions refreshes.

**Architecture:** The implementation uses a TypeScript CLI with four layers: discovery, extraction, normalization, and rendering. Playwright handles rendered-page discovery and extraction, normalized page objects isolate scraping from output generation, and deterministic rendering plus manifests make weekly automated updates safe and reviewable.

**Tech Stack:** Node.js, TypeScript, Playwright, Vitest, Zod, Gray Matter, GitHub Actions

---

## File Structure

Create the project with focused files and explicit boundaries.

- `package.json`: scripts, runtime dependencies, dev tooling
- `tsconfig.json`: TypeScript compiler configuration
- `.github/workflows/weekly-sync.yml`: scheduled and manual sync workflow
- `src/cli.ts`: command-line entrypoint
- `src/config.ts`: runtime configuration and path helpers
- `src/logging.ts`: structured console logging helpers
- `src/types/content.ts`: normalized page/content model types and schemas
- `src/types/manifest.ts`: manifest types and schemas
- `src/discovery/discoverHigUrls.ts`: HIG URL inventory builder
- `src/discovery/urlRules.ts`: URL normalization and scope rules
- `src/extraction/extractPage.ts`: single-page DOM extraction
- `src/extraction/selectors.ts`: selectors and helper routines for HIG structure
- `src/normalization/normalizePage.ts`: canonical page normalization
- `src/render/renderFrontmatter.ts`: deterministic frontmatter generation
- `src/render/renderMarkdown.ts`: normalized content to markdown
- `src/render/rewriteLinks.ts`: internal link rewriting
- `src/commands/sync.ts`: full sync orchestration
- `src/commands/discover.ts`: discovery-only command
- `src/commands/verify.ts`: integrity and determinism verification
- `src/io/writePage.ts`: write generated markdown files
- `src/io/writeManifest.ts`: write crawl manifests
- `src/io/loadSnapshot.ts`: optional fixture/snapshot loader for tests
- `tests/fixtures/`: captured sample HTML/normalized records for tests
- `tests/discovery/discoverHigUrls.test.ts`: discovery tests
- `tests/extraction/extractPage.test.ts`: extraction tests
- `tests/normalization/normalizePage.test.ts`: normalization tests
- `tests/render/renderMarkdown.test.ts`: renderer tests
- `tests/render/rewriteLinks.test.ts`: link rewrite tests
- `tests/commands/verify.test.ts`: verification tests
- `tests/fixtures/pages/`: representative HIG page fixtures
- `content/.gitkeep`: keeps content directory present before first sync
- `data/manifests/.gitkeep`: keeps manifests directory present before first sync

## Chunk 1: Bootstrap The CLI Project

### Task 1: Scaffold the Node/TypeScript project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/cli.ts`
- Create: `src/config.ts`
- Create: `src/logging.ts`

- [ ] **Step 1: Write the failing bootstrap test**

Create `tests/commands/cli-bootstrap.test.ts` with a test that imports the CLI module and asserts the command registry exposes `sync`, `discover`, and `verify`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/commands/cli-bootstrap.test.ts`
Expected: FAIL because the project files and CLI exports do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create a minimal `package.json` with scripts for `build`, `test`, `sync`, `discover`, and `verify`. Add a minimal `src/cli.ts` that registers the command names and exports the command table. Add `src/config.ts` for repo paths and `src/logging.ts` for a thin logger.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/commands/cli-bootstrap.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json .gitignore src/cli.ts src/config.ts src/logging.ts tests/commands/cli-bootstrap.test.ts
git commit -m "chore: scaffold HIG mirror CLI"
```

### Task 2: Add normalized content and manifest schemas

**Files:**
- Create: `src/types/content.ts`
- Create: `src/types/manifest.ts`
- Create: `tests/normalization/content-schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create tests that validate:
- page records require `sourceUrl`, `canonicalPath`, `title`, `breadcrumbs`, `appleChanges`, `internalLinks`, `externalLinks`, and `contentBlocks`
- manifest records require discovered, processed, failed, and removed URL sets

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/normalization/content-schema.test.ts`
Expected: FAIL because the schema modules do not exist.

- [ ] **Step 3: Write minimal implementation**

Define TypeScript types plus Zod schemas for:
- normalized content blocks
- normalized page records
- manifest records

Use explicit discriminated unions for content block types to keep rendering predictable.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/normalization/content-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/content.ts src/types/manifest.ts tests/normalization/content-schema.test.ts
git commit -m "feat: add normalized HIG content schemas"
```

## Chunk 2: Implement Discovery

### Task 3: Implement URL normalization and scope rules

**Files:**
- Create: `src/discovery/urlRules.ts`
- Create: `tests/discovery/urlRules.test.ts`

- [ ] **Step 1: Write the failing test**

Create tests covering:
- accept paths under `/design/human-interface-guidelines/**`
- reject fragments as unique page identifiers
- reject non-HIG Apple docs as crawl targets
- normalize trailing slash variants to a single canonical URL

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/discovery/urlRules.test.ts`
Expected: FAIL because the URL rules module does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement URL normalization helpers that:
- normalize host and pathname
- remove fragments
- preserve query params only if they prove necessary
- classify URLs as `hig`, `externalApple`, or `outOfScope`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/discovery/urlRules.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/discovery/urlRules.ts tests/discovery/urlRules.test.ts
git commit -m "feat: add HIG URL scope rules"
```

### Task 4: Implement browser-backed HIG discovery

**Files:**
- Create: `src/discovery/discoverHigUrls.ts`
- Create: `tests/discovery/discoverHigUrls.test.ts`
- Create: `tests/fixtures/pages/hig-home.html`

- [ ] **Step 1: Write the failing test**

Create a discovery test using a saved HIG home-page fixture. Assert that the discovered inventory:
- includes top-level HIG sections
- deduplicates URLs
- excludes non-HIG Apple docs from crawl targets

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/discovery/discoverHigUrls.test.ts`
Expected: FAIL because discovery is not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement discovery to:
- launch Playwright
- load the HIG root page
- gather visible navigation and in-scope internal links
- normalize and deduplicate URLs
- return a sorted canonical inventory

Keep browser lifecycle management inside the discovery module or a small shared helper, not the CLI entrypoint.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/discovery/discoverHigUrls.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/discovery/discoverHigUrls.ts tests/discovery/discoverHigUrls.test.ts tests/fixtures/pages/hig-home.html
git commit -m "feat: add browser-backed HIG discovery"
```

## Chunk 3: Implement Extraction And Normalization

### Task 5: Extract a single HIG page into raw structured data

**Files:**
- Create: `src/extraction/selectors.ts`
- Create: `src/extraction/extractPage.ts`
- Create: `tests/extraction/extractPage.test.ts`
- Create: `tests/fixtures/pages/accessibility.html`

- [ ] **Step 1: Write the failing test**

Create a fixture-based extraction test asserting that extraction can pull:
- title
- breadcrumbs
- headings
- paragraphs
- lists
- tables
- related-resource links
- Apple update/changelog text when present

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/extraction/extractPage.test.ts`
Expected: FAIL because extraction is not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement a single-page extractor that:
- loads a page
- locates the primary content region
- walks the DOM in source order
- emits raw structured blocks
- collects internal and external links separately
- collects changelog/update metadata without rendering decisions

Do not rewrite links or emit Markdown here.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/extraction/extractPage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/extraction/selectors.ts src/extraction/extractPage.ts tests/extraction/extractPage.test.ts tests/fixtures/pages/accessibility.html
git commit -m "feat: extract raw HIG page content"
```

### Task 6: Normalize extracted data into canonical page records

**Files:**
- Create: `src/normalization/normalizePage.ts`
- Create: `tests/normalization/normalizePage.test.ts`
- Create: `tests/fixtures/pages/accessibility.raw.json`

- [ ] **Step 1: Write the failing test**

Create a test that feeds raw extracted content into normalization and asserts:
- canonical frontmatter fields are populated
- content blocks are converted into the discriminated union schema
- internal and external links are deduplicated and sorted where required
- changelog entries are normalized into `appleChanges`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/normalization/normalizePage.test.ts`
Expected: FAIL because normalization is not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement the normalizer to:
- validate raw extraction output
- populate canonical fields
- normalize links and breadcrumbs
- normalize Apple change entries into structured frontmatter data
- retain source-order content blocks for rendering

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/normalization/normalizePage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/normalization/normalizePage.ts tests/normalization/normalizePage.test.ts tests/fixtures/pages/accessibility.raw.json
git commit -m "feat: normalize HIG page records"
```

## Chunk 4: Implement Rendering

### Task 7: Render deterministic frontmatter and markdown

**Files:**
- Create: `src/render/renderFrontmatter.ts`
- Create: `src/render/renderMarkdown.ts`
- Create: `tests/render/renderMarkdown.test.ts`
- Create: `tests/fixtures/pages/accessibility.normalized.json`

- [ ] **Step 1: Write the failing test**

Create a renderer test asserting that output:
- emits stable frontmatter key order
- includes `apple_changes` in frontmatter
- preserves heading and block order
- renders tables and lists consistently
- renders notes/callouts conservatively for Mintlify readability

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/render/renderMarkdown.test.ts`
Expected: FAIL because rendering is not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement:
- `renderFrontmatter.ts` for ordered YAML serialization
- `renderMarkdown.ts` for body block rendering

Keep rendering deterministic. Do not introduce timestamp noise into the body. If `last_synced_at` is included, keep it explicit and expected so weekly diffs are understandable.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/render/renderMarkdown.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/render/renderFrontmatter.ts src/render/renderMarkdown.ts tests/render/renderMarkdown.test.ts tests/fixtures/pages/accessibility.normalized.json
git commit -m "feat: render deterministic HIG markdown"
```

### Task 8: Rewrite internal HIG links to local markdown paths

**Files:**
- Create: `src/render/rewriteLinks.ts`
- Create: `tests/render/rewriteLinks.test.ts`

- [ ] **Step 1: Write the failing test**

Create tests covering:
- root-relative HIG links rewritten to local relative file paths
- same-section and nested-section links
- external Apple docs preserved unchanged
- fragment handling inside local markdown links

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/render/rewriteLinks.test.ts`
Expected: FAIL because link rewriting is not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement link rewriting based on canonical HIG paths and the content output layout. Keep this logic isolated so future changes to folder layout do not touch extraction.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/render/rewriteLinks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/render/rewriteLinks.ts tests/render/rewriteLinks.test.ts
git commit -m "feat: rewrite internal HIG links"
```

## Chunk 5: Implement Sync IO And Verification

### Task 9: Write page and manifest output helpers

**Files:**
- Create: `src/io/writePage.ts`
- Create: `src/io/writeManifest.ts`
- Create: `content/.gitkeep`
- Create: `data/manifests/.gitkeep`
- Create: `tests/io/writeOutputs.test.ts`

- [ ] **Step 1: Write the failing test**

Create tests asserting that:
- markdown files are written to `content/` using URL-mirrored folder structure
- manifests are written to `data/manifests/`
- output writes are stable when content is unchanged

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/io/writeOutputs.test.ts`
Expected: FAIL because IO helpers do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement path builders and file writers for:
- page markdown files
- manifest JSON files
- directory creation

Keep file-path logic centralized here.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/io/writeOutputs.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/io/writePage.ts src/io/writeManifest.ts content/.gitkeep data/manifests/.gitkeep tests/io/writeOutputs.test.ts
git commit -m "feat: write mirrored pages and manifests"
```

### Task 10: Implement `hig verify`

**Files:**
- Create: `src/commands/verify.ts`
- Create: `tests/commands/verify.test.ts`

- [ ] **Step 1: Write the failing test**

Create tests asserting that verification fails when:
- frontmatter is malformed
- internal links point to missing local files
- deterministic rendering changes on a second pass

Also create one passing test for a valid generated page set.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/commands/verify.test.ts`
Expected: FAIL because the command is not implemented.

- [ ] **Step 3: Write minimal implementation**

Implement `hig verify` to:
- validate frontmatter structure
- confirm internal relative links resolve
- optionally rerender fixture data and compare output for determinism

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/commands/verify.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/commands/verify.ts tests/commands/verify.test.ts
git commit -m "feat: verify generated HIG content"
```

## Chunk 6: Orchestrate Sync And CI

### Task 11: Implement `hig discover` and `hig sync`

**Files:**
- Create: `src/commands/discover.ts`
- Create: `src/commands/sync.ts`
- Modify: `src/cli.ts`
- Create: `tests/commands/sync.test.ts`

- [ ] **Step 1: Write the failing test**

Create orchestration tests that assert:
- `discover` writes a canonical URL inventory manifest
- `sync` runs discovery, extraction, normalization, rendering, and output writing in order
- failures are collected into the manifest

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/commands/sync.test.ts`
Expected: FAIL because the orchestration commands do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement the commands so they:
- create a Playwright browser context
- process discovered pages
- write page output and manifests
- exit nonzero on suspicious failure counts

Keep orchestration in the command layer. Keep page logic in the lower modules.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/commands/sync.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/commands/discover.ts src/commands/sync.ts src/cli.ts tests/commands/sync.test.ts
git commit -m "feat: orchestrate HIG sync commands"
```

### Task 12: Add GitHub Actions weekly sync workflow

**Files:**
- Create: `.github/workflows/weekly-sync.yml`
- Create: `tests/fixtures/workflows/weekly-sync.expected.yml`

- [ ] **Step 1: Write the failing test**

Create a test or snapshot assertion that the workflow file includes:
- `schedule`
- `workflow_dispatch`
- runtime setup
- Playwright browser install
- `hig sync`
- `hig verify`
- commit-and-push only when diffs exist

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/github/workflow.test.ts`
Expected: FAIL because the workflow file or test does not exist.

- [ ] **Step 3: Write minimal implementation**

Create the workflow using the same local CLI commands the repo uses during development. Keep the auto-commit logic explicit and no-op when no diff exists.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/github/workflow.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/weekly-sync.yml tests/fixtures/workflows/weekly-sync.expected.yml tests/github/workflow.test.ts
git commit -m "ci: add weekly HIG sync workflow"
```

## Chunk 7: End-To-End Verification And Documentation

### Task 13: Capture sample pages and verify end-to-end generation

**Files:**
- Modify: `tests/fixtures/pages/`
- Create: `tests/e2e/sample-sync.test.ts`

- [ ] **Step 1: Write the failing test**

Create an end-to-end test that runs the pipeline against a small fixed set of fixture pages and asserts:
- markdown files are generated in the expected mirrored paths
- frontmatter includes normalized `apple_changes`
- local link rewriting works
- repeated runs produce identical output

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/e2e/sample-sync.test.ts`
Expected: FAIL because the full pipeline is not yet wired for the sample corpus.

- [ ] **Step 3: Write minimal implementation**

Wire any remaining gaps needed for the sample pipeline to pass without broadening scope beyond the approved design.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/e2e/sample-sync.test.ts`
Expected: PASS

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS with zero failing tests

- [ ] **Step 6: Commit**

```bash
git add tests/fixtures/pages tests/e2e/sample-sync.test.ts
git commit -m "test: verify end-to-end HIG mirroring"
```

### Task 14: Document local usage

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the failing docs check**

Create a lightweight test or manual checklist that confirms the README covers:
- install
- Playwright setup
- `hig sync`
- `hig discover`
- `hig verify`
- weekly workflow behavior

- [ ] **Step 2: Run check to verify it fails**

Run: `test -f README.md`
Expected: FAIL because `README.md` does not exist.

- [ ] **Step 3: Write minimal implementation**

Write a concise README with:
- project purpose
- setup steps
- commands
- output layout
- CI workflow summary

- [ ] **Step 4: Run check to verify it passes**

Run: `test -f README.md`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document HIG mirror usage"
```

## Execution Notes

- Use fixture-driven tests first for discovery, extraction, normalization, and rendering.
- Use live-network Playwright runs sparingly during implementation, mainly to refresh fixtures and validate selectors.
- Do not couple extraction logic to Mintlify formatting decisions.
- Keep timestamps and manifests explicit so weekly diffs are explainable.
- Prefer small, focused commits after each task rather than batching large changes.

## Verification Checklist

Before claiming implementation complete, run:

```bash
npm test
```

Then run:

```bash
npm run sync -- --url https://developer.apple.com/design/human-interface-guidelines/accessibility
```

Then run:

```bash
npm run verify
```

Expected:
- tests pass
- a sample page renders into the mirrored path under `content/`
- verification reports no broken local HIG links and no malformed frontmatter

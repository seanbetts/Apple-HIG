# Apple HIG Mirror

Browser-backed tooling for mirroring Apple's Human Interface Guidelines into deterministic Markdown.

## What This Repository Does

The sync pipeline:

- discovers in-scope HIG pages under `https://developer.apple.com/design/human-interface-guidelines/`
- extracts rendered page content with Playwright
- normalizes it into a stable intermediate structure
- renders mirrored Markdown into `content/`
- writes crawl manifests into `data/manifests/`

The generated output is designed to be readable in Git and suitable for serving with Mintlify later.

## Requirements

- Node.js 22+
- npm
- Playwright Chromium browser

## Setup

Install dependencies:

```bash
npm install
```

Install the browser runtime:

```bash
npx playwright install chromium
```

## Commands

Run a full sync:

```bash
npm run sync
```

Run discovery only:

```bash
npm run discover
```

Build a render plan from the latest discovery manifest:

```bash
npm run plan
```

Render only the pages selected by the current plan:

```bash
npm run render
```

Regenerate the local Mintlify preview config:

```bash
npm run mintlify
```

Preview the mirrored docs locally with Mintlify:

```bash
npm run docs:preview
```

Verify generated output:

```bash
npm run verify
```

Run tests:

```bash
npm test
```

## Output Layout

- `content/`: generated Markdown mirror of HIG pages
- `content/docs.json`: generated Mintlify config for local preview
- `data/manifests/`: discovery, planning, and render manifests
- `src/`: CLI, discovery, extraction, normalization, rendering, and IO code
- `tests/`: unit, fixture, and end-to-end tests

## Weekly GitHub Action

The repository includes `.github/workflows/weekly-sync.yml`.

That workflow:

- runs on a weekly schedule and via manual dispatch
- installs dependencies and the Playwright Chromium browser
- runs `npm run discover` and `npm run plan`
- skips `render` and `verify` when `plan.json` contains no pages to render or remove
- runs `npm run render` only when content work is needed
- runs `npm run verify` after render
- commits and pushes changes only when generated content or manifests changed

## Current Status

The project currently has:

- URL scope rules and browser-backed discovery
- raw page extraction and page normalization
- deterministic frontmatter and markdown rendering
- internal HIG link rewriting for mirrored content
- output writers and generated-content verification
- a scheduled GitHub Actions workflow

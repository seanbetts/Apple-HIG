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
- `data/manifests/`: discovery and sync manifests
- `src/`: CLI, discovery, extraction, normalization, rendering, and IO code
- `tests/`: unit, fixture, and end-to-end tests

## Weekly GitHub Action

The repository includes `.github/workflows/weekly-sync.yml`.

That workflow:

- runs on a weekly schedule and via manual dispatch
- installs dependencies and the Playwright Chromium browser
- runs `npm run sync`
- runs `npm run verify`
- commits and pushes changes only when generated content or manifests changed

## Current Status

The project currently has:

- URL scope rules and browser-backed discovery
- raw page extraction and page normalization
- deterministic frontmatter and markdown rendering
- internal HIG link rewriting for mirrored content
- output writers and generated-content verification
- a scheduled GitHub Actions workflow

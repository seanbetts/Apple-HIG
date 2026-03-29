# HIG Mirror Design

## Goal

Build a tool that mirrors Apple's Human Interface Guidelines into a public GitHub repository as structured Markdown.

The mirror must:

- Discover all in-scope HIG pages starting from `https://developer.apple.com/design/human-interface-guidelines/`
- Preserve page structure and internal cross-linking
- Store Apple change history in frontmatter
- Render Markdown that is both archive-faithful and readable in Mintlify
- Support local runs and a weekly GitHub Actions refresh using the same CLI entrypoint

## Scope

### In Scope

- Pages under `/design/human-interface-guidelines/**`
- Internal link rewriting between mirrored HIG pages
- External Apple documentation links preserved as absolute outbound links
- Weekly automated refreshes that commit only when content changes
- Crawl manifests and verification to keep the pipeline auditable

### Out of Scope

- Mirroring all Apple Developer Documentation
- Downloading image assets in v1
- Aggressively redesigning page structure for a custom docs experience
- CI-only logic separate from the local runner

## Product Requirements

### Output Requirements

The repository should contain a folder tree of Markdown files mirroring the HIG URL structure.

Examples:

- `/design/human-interface-guidelines/accessibility` -> `content/accessibility/index.md`
- `/design/human-interface-guidelines/components/buttons` -> `content/components/buttons/index.md`

Each generated page should include frontmatter and a Markdown body.

The output should preserve:

- Titles
- Breadcrumbs
- Heading hierarchy
- Paragraphs
- Lists
- Tables where feasible
- Notes and callouts
- Related-resource sections
- Internal HIG links
- External Apple links
- Apple change/update metadata

### Change Tracking

Apple changelog/update metadata should be normalized into frontmatter so that repository diffs are machine-friendly and easy to review.

The weekly refresh should create a new commit only when generated content or manifests actually change.

## Architecture

The pipeline should have four explicit stages.

### 1. Discovery

Use Playwright to load the rendered HIG root page and traverse the visible navigation and in-scope internal links.

Discovery rules:

- Start from the HIG root URL
- Accept only canonical HIG URLs under `/design/human-interface-guidelines/**`
- Normalize URLs before enqueueing
- Ignore fragments when determining page identity
- Preserve external Apple documentation links as references, not crawl targets

The output of discovery should be a canonical URL inventory.

### 2. Extraction

For each discovered HIG page, use Playwright to load the fully rendered page and extract a normalized page record.

This stage should not emit Markdown directly. It should emit a stable internal content model.

Extracted page data should include:

- `source_url`
- `canonical_path`
- `title`
- `description`
- `breadcrumbs`
- `section`
- `apple_changes`
- `internal_links`
- `external_links`
- `content_blocks`
- `last_seen_at`

`content_blocks` should represent the semantic structure of the page rather than raw HTML. Example block types:

- heading
- paragraph
- list
- table
- callout
- related-resources
- code
- image-reference

### 3. Rendering

Render the normalized page record into deterministic Markdown.

Renderer rules:

- Always emit stable frontmatter key ordering
- Preserve section order from the source page
- Rewrite internal HIG links to local relative Markdown links
- Preserve external Apple links as absolute URLs
- Use moderate Mintlify-friendly formatting only when semantics are clear
- Avoid structural re-authoring that diverges from Apple's page organization

### 4. Refresh and Diff

The sync command reruns discovery, extraction, and rendering, then updates generated files in place.

Determinism requirements:

- Stable frontmatter ordering
- Stable list ordering where source order is unchanged
- Stable whitespace and line-break rules
- Stable link formatting

These rules are necessary so weekly commits reflect real site changes instead of renderer noise.

## Content Model

Each page should be rendered from a normalized intermediate representation.

Suggested frontmatter:

```yaml
---
title: Accessibility
source_url: https://developer.apple.com/design/human-interface-guidelines/accessibility
canonical_path: /accessibility
section: Foundations
breadcrumbs:
  - Human Interface Guidelines
  - Foundations
  - Accessibility
apple_changes:
  - label: Updated
    date: 2026-02-14
    raw: Updated for latest platform guidance
last_synced_at: 2026-03-29T18:00:00Z
internal_links:
  - /components/buttons
  - /patterns/navigation
external_links:
  - https://developer.apple.com/documentation/uikit
---
```

`apple_changes` should be an array of normalized entries rather than a single string so future tooling can compare updates across the corpus.

## Repository Layout

Suggested structure:

```text
src/
  cli/
  discovery/
  extraction/
  normalization/
  rendering/
content/
data/
  manifests/
output/
.github/workflows/
docs/superpowers/specs/
```

Directory intent:

- `src/`: implementation code
- `content/`: generated Markdown mirror
- `data/manifests/`: crawl inventories, failure reports, and sync summaries
- `output/`: local debug artifacts such as Playwright screenshots or snapshots
- `.github/workflows/`: scheduled and manual CI entrypoints

## CLI Design

The tool should be packaged as a local runner first, with CI calling the same commands.

Core commands:

- `hig sync`
- `hig sync --url <page-url>`
- `hig discover`
- `hig verify`

Command responsibilities:

- `hig sync`: full discovery, extraction, render, and manifest update
- `hig sync --url`: rebuild one page while developing selectors and rendering logic
- `hig discover`: refresh only the URL inventory
- `hig verify`: validate frontmatter, local links, and deterministic-render invariants

## GitHub Actions Design

The repository should be public and run a weekly scheduled sync.

The workflow should:

- Run on `schedule`
- Support `workflow_dispatch`
- Check out the repository
- Install the project runtime
- Install the Playwright browser runtime
- Run `hig sync`
- Run `hig verify`
- Commit and push only when generated output changed

The CI job should wrap the same local runner used for local development. There should be no CI-only scraping path.

## Failure Handling

The pipeline should produce an explicit manifest for every sync.

The manifest should record:

- discovered URLs
- processed URLs
- skipped URLs
- failed URLs
- removed URLs
- run timestamp
- tool version or renderer version

Operational rules:

- A small number of page failures should be surfaced clearly
- A large or suspicious number of failures should fail the run
- A disappearing page should appear in the manifest before any deletion decision
- Generated files should include a marker indicating they are machine-generated

## Link Strategy

### Internal Links

Internal HIG links should be rewritten to local relative Markdown targets so the mirrored docs remain navigable both in-repo and under Mintlify.

### External Links

Links from HIG pages to non-HIG Apple documentation should remain absolute external links and should not trigger additional mirroring.

## Mintlify Strategy

Mintlify should be treated as a presentation layer over the mirrored Markdown, not as the source-format definition.

Guidelines:

- Preserve the original source ordering
- Use Mintlify-friendly callouts only for clearly semantic notes and warnings
- Keep the rendered output trustworthy to the source page
- Avoid aggressive page redesign in v1

## Rationale for Browser-First Extraction

The HIG site is JavaScript-rendered, so a simple HTTP scraper would be brittle.

A browser-first extractor is the safest v1 choice because it:

- Sees the actual rendered document structure
- Supports reliable discovery from visible navigation
- Handles JS-rendered content without reverse-engineering private APIs
- Preserves a path to future optimizations if stable structured data is discovered later

## Open Decisions for Implementation Planning

These items should be resolved during implementation planning rather than design approval:

- Runtime choice for the CLI
- Exact normalized block schema
- Exact Mintlify formatting rules for callouts and related resources
- Whether to persist normalized page JSON snapshots in-repo or only as run artifacts
- Whether scheduled updates should push directly to the default branch or open a PR

## Recommended v1 Success Criteria

v1 is successful when:

- The tool discovers all reachable HIG pages under the in-scope path
- Each in-scope page produces stable Markdown with correct frontmatter
- Internal HIG links resolve locally
- External Apple documentation links remain intact
- Apple update metadata is captured in frontmatter
- A weekly GitHub Actions run can refresh the mirror and commit only when real changes occur

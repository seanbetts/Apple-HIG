import type { ContentBlock, NormalizedPage } from "../types/content.js";

import { renderFrontmatter } from "./renderFrontmatter.js";

function renderBlock(block: ContentBlock): string {
  switch (block.type) {
    case "heading":
      return `${"#".repeat(block.level)} ${block.text}`;
    case "paragraph":
      return block.text;
    case "list":
      return block.items
        .map((item, index) => {
          if (block.ordered) {
            return `${index + 1}. ${item}`;
          }

          return `- ${item}`;
        })
        .join("\n");
    case "table": {
      const header = `| ${block.headers.join(" | ")} |`;
      const divider = `| ${block.headers.map(() => "---").join(" | ")} |`;
      const rows = block.rows.map((row) => `| ${row.join(" | ")} |`);

      return [header, divider, ...rows].join("\n");
    }
    case "related-resources":
      return [
        "## Related resources",
        "",
        ...block.links.map((link) => `- [${link.title}](${link.href})`)
      ].join("\n");
    case "callout":
      return [
        block.title ? `> ${block.title}` : null,
        ...block.body.map((line) => `> ${line}`)
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n");
    case "code":
      return ["```" + (block.language ?? ""), block.code, "```"].join("\n");
    case "image-reference":
      return `![${block.alt ?? ""}](${block.src})`;
  }
}

export function renderMarkdown(page: NormalizedPage): string {
  const parts = [
    renderFrontmatter(page),
    "",
    ...page.contentBlocks.flatMap((block) => [renderBlock(block), ""])
  ];

  return `${parts.join("\n").trimEnd()}\n`;
}

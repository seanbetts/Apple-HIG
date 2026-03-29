import { z } from "zod";

export const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paragraph"),
    text: z.string()
  }),
  z.object({
    type: z.literal("heading"),
    level: z.number().int().min(1).max(6),
    text: z.string()
  }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean(),
    items: z.array(z.string())
  }),
  z.object({
    type: z.literal("table"),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string()))
  }),
  z.object({
    type: z.literal("callout"),
    tone: z.enum(["info", "important", "warning"]),
    title: z.string().optional(),
    body: z.array(z.string())
  }),
  z.object({
    type: z.literal("related-resources"),
    links: z.array(
      z.object({
        title: z.string(),
        href: z.string().min(1)
      })
    )
  }),
  z.object({
    type: z.literal("code"),
    language: z.string().optional(),
    code: z.string()
  }),
  z.object({
    type: z.literal("image-reference"),
    alt: z.string().optional(),
    src: z.string().min(1)
  })
]);

export const appleChangeSchema = z.object({
  label: z.string(),
  date: z.string().optional(),
  raw: z.string()
});

export const normalizedPageSchema = z.object({
  sourceUrl: z.string().url(),
  canonicalPath: z.string().startsWith("/"),
  title: z.string().min(1),
  description: z.string().optional(),
  breadcrumbs: z.array(z.string().min(1)),
  section: z.string().optional(),
  appleChanges: z.array(appleChangeSchema),
  internalLinks: z.array(z.string().startsWith("/")),
  externalLinks: z.array(z.string().url()),
  contentBlocks: z.array(contentBlockSchema),
  lastSeenAt: z.string().optional()
});

export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type AppleChange = z.infer<typeof appleChangeSchema>;
export type NormalizedPage = z.infer<typeof normalizedPageSchema>;

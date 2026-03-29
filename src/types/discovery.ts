import { z } from "zod";

import { manifestSchema } from "./manifest.js";

export const discoveryAppleChangeSchema = z.object({
  raw: z.string().min(1)
});

export const discoveryPageRecordSchema = z.object({
  url: z.string().url(),
  canonicalPath: z.string().regex(/^\/.*$/),
  title: z.string(),
  description: z.string().optional(),
  breadcrumbs: z.array(z.string()),
  appleChanges: z.array(discoveryAppleChangeSchema),
  internalLinks: z.array(z.string().regex(/^\/.*$/)),
  discoveryHash: z.string().min(1)
});

export const discoverManifestSchema = manifestSchema.extend({
  pages: z.record(z.string().url(), discoveryPageRecordSchema)
});

export type DiscoveryPageRecord = z.infer<typeof discoveryPageRecordSchema>;
export type DiscoverManifest = z.infer<typeof discoverManifestSchema>;

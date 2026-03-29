import { z } from "zod";

export const planManifestSchema = z.object({
  discoveredUrls: z.array(z.string().url()),
  newUrls: z.array(z.string().url()),
  changedUrls: z.array(z.string().url()),
  unchangedUrls: z.array(z.string().url()),
  removedUrls: z.array(z.string().url()),
  renderUrls: z.array(z.string().url())
});

export type PlanManifest = z.infer<typeof planManifestSchema>;

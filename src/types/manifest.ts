import { z } from "zod";

export const manifestSchema = z.object({
  discoveredUrls: z.array(z.string().url()),
  processedUrls: z.array(z.string().url()),
  failedUrls: z.array(z.string().url()),
  removedUrls: z.array(z.string().url())
});

export type Manifest = z.infer<typeof manifestSchema>;

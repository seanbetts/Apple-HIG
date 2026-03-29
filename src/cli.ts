import { runDiscover } from "./commands/discover.js";
import { runPlan } from "./commands/plan.js";
import { runRender } from "./commands/render.js";
import { runSync } from "./commands/sync.js";
import { verifyGeneratedContent } from "./commands/verify.js";
import { resolveRepoPath } from "./config.js";
import { logger } from "./logging.js";

export type CommandHandler = () => Promise<void>;

export const commands: Record<string, CommandHandler> = {
  discover: async () => {
    await runDiscover({
      rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
      manifestsRoot: resolveRepoPath("data", "manifests")
    });
    logger.info("Discovery manifest written.");
  },
  plan: async () => {
    await runPlan({
      manifestsRoot: resolveRepoPath("data", "manifests")
    });
    logger.info("Plan manifest written.");
  },
  render: async () => {
    await runRender({
      contentRoot: resolveRepoPath("content"),
      manifestsRoot: resolveRepoPath("data", "manifests")
    });
    logger.info("Render manifest written.");
  },
  sync: async () => {
    await runSync({
      rootUrl: "https://developer.apple.com/design/human-interface-guidelines/",
      contentRoot: resolveRepoPath("content"),
      manifestsRoot: resolveRepoPath("data", "manifests")
    });
    logger.info("Sync manifest written.");
  },
  verify: async () => {
    const result = await verifyGeneratedContent({
      contentRoot: resolveRepoPath("content")
    });

    if (!result.ok) {
      result.errors.forEach((error) => logger.error(error));
      throw new Error("Generated content verification failed.");
    }

    logger.info("Generated content verified.");
  }
};

export async function run(argv: string[]): Promise<number> {
  const commandName = argv[0];

  if (!commandName || !(commandName in commands)) {
    logger.error("Unknown or missing command.");
    return 1;
  }

  try {
    await commands[commandName]();
    return 0;
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await run(process.argv.slice(2));
  process.exit(exitCode);
}

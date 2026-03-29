import { logger } from "./logging.js";

export type CommandHandler = () => Promise<void>;

async function unimplementedCommand(): Promise<void> {
  logger.info("Command not implemented yet.");
}

export const commands: Record<string, CommandHandler> = {
  discover: unimplementedCommand,
  sync: unimplementedCommand,
  verify: unimplementedCommand
};

export async function run(argv: string[]): Promise<number> {
  const commandName = argv[0];

  if (!commandName || !(commandName in commands)) {
    logger.error("Unknown or missing command.");
    return 1;
  }

  await commands[commandName]();
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await run(process.argv.slice(2));
  process.exit(exitCode);
}

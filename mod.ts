import { RedisClient } from "./client.ts";
import { DatabaseHandler } from "./database.ts";
export * from "./parser.ts";
export * from "./protocol.ts";
export * from "./handler.ts";
export * from "./client.ts";
import { parse as argParse } from "https://deno.land/std/flags/mod.ts";

export const main = async () => {
  const { args } = Deno;
  const config = argParse(args);
  const opts = {
    port: config.p || 6636,
    hostname: config.h || "0.0.0.0"
  };
  const listener = Deno.listen(opts);
  const handler = new DatabaseHandler();
  console.log("Tiny Redis 0.0.1");
  console.log(`listening on: ${opts.hostname}:${opts.port}`);
  for await (const conn of listener) {
    (new RedisClient(conn, handler)).loop();
  }
};

if (import.meta.main) {
  await main();
}

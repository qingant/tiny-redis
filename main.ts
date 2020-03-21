import { RedisClient } from "./client.ts";
import { DatabaseHandler } from "./database.ts";

const main = async () => {
  const listener = Deno.listen({ port: 8080 });
  const handler = new DatabaseHandler();
  console.log("listening on 0.0.0.0:8080");
  for await (const conn of listener) {
    (new RedisClient(conn, handler)).loop();
  }
};

if (import.meta.main) {
  await main();
}

import {
  RedisArray,
  RedisValue,
  RedisClient,
  RedisValueOf,
  BaseHandler
} from "../mod.ts";
import { parse as argParse } from "https://deno.land/std/flags/mod.ts";

const { args } = Deno;
const config = argParse(args);
const opts = {
  port: config.p || 6666,
  hostname: config.h || "0.0.0.0"
};

class MyHandler extends BaseHandler {
  commands = {
    "TINY": this.command_TINY
  };
  private async command_TINY(request: RedisArray): Promise<RedisValue> {
    return RedisValueOf.string("REDIS");
  }
}

const main = async () => {
  const listener = Deno.listen(opts);
  const handler = new MyHandler();
  console.log("Tiny Redis 0.0.1");
  console.log(`listening on: ${opts.hostname}:${opts.port}`);
  for await (const conn of listener) {
    (new RedisClient(conn, handler)).loop();
  }
};

main();

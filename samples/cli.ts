import { encode, RedisValueOf, RedisParser, show } from "../mod.ts";
import { parse as argParse } from "https://deno.land/std/flags/mod.ts";

const main = async () => {
  const { args } = Deno;
  const config = argParse(args);
  const opts = {
    port: config.p || 6636,
    hostname: config.h || "127.0.0.1"
  };
  // connect to redis server
  const conn = await Deno.connect(opts);

  // create a redis command and encode it to [Uint8Array]
  const cmdEncoded = encode(RedisValueOf.array([
    "INFO",
    "MEMORY"
  ]));

  // send the command to redis server
  for (let i in cmdEncoded) {
    await conn.write(cmdEncoded[i]);
  }

  // create a parser and get the result
  const p = new RedisParser(conn);
  const req = await p.parse();
  console.log(show(req));
};

await main();

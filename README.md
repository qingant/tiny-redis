# Tiny Redis

TinyRedis is a **redis server** and **redis protocol facilities** developed with [TypeScript](https://www.typescriptlang.org) and platformed on [Deno](https://deno.land/). 

## Guide
[Get Deno](https://deno.land/) if you do not have one.

One line command to get a running Redis ([Get Deno](https://deno.land/) if you do not have one:):

```shell
deno -A https://raw.githubusercontent.com/qingant/tiny-redis/master/mod.ts -h 127.0.0.1 -p 6666
```

Client Sample:
```typescript
// also you can run this by `deno -A https://raw.githubusercontent.com/qingant/tiny-redis/master/samples/cli.ts`

import { encode, RedisValueOf, RedisParser, show } from 'https://raw.githubusercontent.com/qingant/tiny-redis/master/mod.ts';

const main = async () => {
  const opts = {
    port: 6379,
    hostname: "127.0.0.1"
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
```

Server Side (if you want to implement something that talks redis protocol , Look at this):

```typescript
import {RedisArray, RedisValue, RedisClient, RedisValueOf, BaseHandler} from 'https://raw.githubusercontent.com/qingant/tiny-redis/master/mod.ts';


class MyHandler extends BaseHandler {
    commands = {
        'TINY': this.command_TINY
    }
    private async command_TINY(request: RedisArray): Promise<RedisValue> {
        return RedisValueOf.string('REDIS');
    }
}

const main = async () => {

    const opts = {
      port: 6666,
      hostname: "0.0.0.0"
    };
    const listener = Deno.listen(opts);
    const handler = new MyHandler();
    console.log("Tiny Redis 0.0.1");
    console.log(`listening on: ${opts.hostname}:${opts.port}`);
    for await (const conn of listener) {
      (new RedisClient(conn, handler)).loop();
    }
}

main()
```

Then you can request your `TINY` command by:

```
redis-cli -p 6666 'tiny'
```
And you will get "REDIS" as response.

It's not that amazing. But if you want your service talk redis protocol so that it can be accessed anywhere with any language, this may be a quick start in TypeScript/Deno world.

Enjoy ~


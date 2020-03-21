# Tiny Redis

TinyRedis is a **redis server** and **redis protocol facilities** developed with [TypeScript](https://www.typescriptlang.org) and platformed on [Deno](https://deno.land/). 

TinyRedis can be used to implement lightwight Redis like applications for some reason, for example:

1. Create a Redis like app in browser (it’s totally compatable to web).
2. Create Redis Client cli or library.
3. Create Redis proxy to inject some logic or scripting (it’s easy to add JavaScript scripting support).

## Guide

One line command to get a running Redis:

```shell
deno -A https://raw.githubusercontent.com/qingant/tiny-redis/master/mod.ts
```

Surely you can also clone the repo `https://github.com/qingant/tiny-redis.git` and then run `deno -A mod.ts` in the project directory.

Get Deno if you do not have one:

```shell
// Using Shell:
curl -fsSL https://deno.land/x/install/install.sh | sh

//Or using PowerShell:
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

Write the content below into `test.ts` wherever you like and run `deno -A test.ts`,

( Remeber to modify the connection options to connect to a REAL redis instance, surely you can also connect to the TinyRedis instance you just started. )

```typescript
import { encode, RedisValueOf, RedisParser, show } from 'https://raw.githubusercontent.com/qingant/tiny-redis/master/mod.ts';
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
```

It's a little low-level. But with these facilities , you can easily write a REAL redis client library within several hours (Certainly it won’t be a product level one) .

BTW: if you did not want to do this copy/paste work, just run with:

```shell
deno -A https://raw.githubusercontent.com/qingant/tiny-redis/master/samples/cli.ts -p 6379
```

For the server side, if you want to implement something that talks redis protocol , Look at this:

```typescript
import {RedisArray, RedisValue, RedisClient, RedisValueOf, BaseHandler} from 'https://raw.githubusercontent.com/qingant/tiny-redis/master/mod.ts';
import { parse as argParse } from "https://deno.land/std/flags/mod.ts";

class MyHandler extends BaseHandler {
    commands = {
        'TINY': this.command_TINY
    }
    private async command_TINY(request: RedisArray): Promise<RedisValue> {
        return RedisValueOf.string('REDIS');
    }
}

const main = async () => {
    const { args } = Deno;
    const config = argParse(args);
    const opts = {
      port: config.p || 6636,
      hostname: config.h || "0.0.0.0"
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

And then you can see something like this in your terminal:

```
(base) ➜  ~ redis-cli -p 6666 'tiny'
"REDIS"
```

It's not that amazing. But if you want your service talk redis protocol so that it can be accessed anywhere with any language, this may be a quick start in TypeScript/Deno world.

Enjoy ~


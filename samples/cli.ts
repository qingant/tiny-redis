import { redis } from 'https://raw.githubusercontent.com/qingant/tiny-redis/master/mod.ts';

const main = async () => {
    // connect to redis server
    const conn = await Deno.connect({
        hostname: '127.0.0.1',
        port: 6636
    })

    // create a redis command and encode it to [Uint8Array]
    const cmdEncoded = redis.encode(redis.Redis.array([
        'COMMAND',
    ]));

    // send the command to redis server
    for (let i in cmdEncoded){
        await conn.write(cmdEncoded[i]);
    }

    // create a parser and get the result
    const p = new redis.RedisParser(conn);
    const req = await p.parse()
    console.log(redis.show(req));
}

await main();
import { BaseHandler } from "./handler.ts";
import {
  RedisArray,
  RedisValue,
  RedisString,
  Redis,
  RedisBulkString,
  RedisNumber,
  bufferToString
} from "./resp.ts";

type Database = { [index: string]: RedisBulkString | RedisNumber };

export class DatabaseHandler extends BaseHandler {
  database: { [index: number]: Database } = {
    0: {}
  };
  db = 0;
  commands = {
    ...super.commands,
    "SET": this.command_SET,
    "GET": this.command_GET
  };
  private async command_SET(request: RedisArray): Promise<RedisValue> {
    const kvs = request.value.slice(1);
    let i = 0;
    for (; (i + 1) * 2 <= kvs.length; i++) {
      // TODO: check type by tag
      const key = kvs[i * 2].value as Uint8Array;
      const v = kvs[i * 2 + 1] as RedisBulkString;
      this.database[this.db][bufferToString(key)] = v;
    }
    return Redis.number(i);
  }
  private async command_GET(request: RedisArray): Promise<RedisValue> {
    const key = request.value[1] as RedisBulkString | RedisString;
    if (!key) {
      return Redis.nil;
    } else {
      return this.database[this.db][bufferToString(key.value)];
    }
  }
}

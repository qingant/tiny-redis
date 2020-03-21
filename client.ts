import { StreamType, RedisParser } from "./protocol.ts";
import { RedisArray, encode } from "./resp.ts";
import { RedisHandler } from "./handler.ts";

export class RedisClient {
  conn: StreamType;
  parser: RedisParser;
  handler: RedisHandler;

  constructor(conn: StreamType, handler: RedisHandler) {
    this.conn = conn;
    this.parser = new RedisParser(conn);
    this.handler = handler;
    this.handler.onConnCreated(this);
  }

  public async loop(): Promise<void> {
    try {
      await this._loop();
    } catch (e) {
      console.log(`Connection Exit: ${JSON.stringify(e)}`);
    } finally {
      this.handler.onConnExit(this);
    }
  }

  public async _loop(): Promise<void> {
    while (true) {
      const request = await this.parser.getRequest() as RedisArray;
      const resp = await this.handler.onRequest(request);
      let r = encode(resp);
      for (let i in r) {
        this.conn.write(r[i]);
      }
    }
  }
}

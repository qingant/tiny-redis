// https://redis.io/topics/protocol

import {
  RedisValue,
  FatalError,
  RedisArray,
  bufferToString,
  encode,
  stringToBuffer,
  show
} from "./resp.ts";

const returnChar = "\r".charCodeAt(0);
const newlineChar = "\n".charCodeAt(0);

export type StreamType = Deno.Conn | Deno.Buffer;

export class RedisParser {
  // should be a generic stream type
  conn: StreamType;
  buffer = new Uint8Array(128);
  start = 0;
  contentTail = 0;

  constructor(conn: StreamType) {
    this.conn = conn;
  }
  private async readMore(): Promise<void> {
    if (this.start === this.contentTail) {
      this.start = this.contentTail = 0;
    }
    if (this.contentTail === this.buffer.length) {
      const buffer = new Uint8Array(this.buffer.length * 2);
      buffer.set(this.buffer, 0);
      this.buffer = buffer;
    }
    let n = await this.conn.read(this.buffer.subarray(this.contentTail));
    if (typeof n === "number") {
      this.contentTail += n;
    } else {
      throw n;
    }
  }

  private async readLine(): Promise<Uint8Array> {
    for (let i = this.start;; i++) {
      if (i + 1 >= this.contentTail) {
        await this.readMore();
      }
      if (this.buffer[i] === returnChar &&
        this.buffer[i + 1] === newlineChar)
      {
        const buffer = this.buffer.slice(this.start, i);
        this.start = i + 2;
        return buffer;
      }
    }
  }
  private async parseArray(): Promise<RedisValue> {
    const head = bufferToString(await this.readLine());
    const count = parseInt(head);
    if (count < 0) {
      return { tag: "RedisNil" };
    }
    let ret: RedisArray = {
      tag: "RedisArray",
      value: []
    };
    for (let i = 0; i < count; i++) {
      ret.value.push(await this.parse() as typeof ret.value[0]);
    }
    return ret;
  }
  private async parseBulkString(): Promise<RedisValue> {
    const head = bufferToString(await this.readLine());
    const count = parseInt(head);
    if (count < 0) {
      throw new FatalError("Protocol Error");
    }
    while (this.contentTail < this.start + count + 2) {
      await this.readMore();
    }
    const buffer = this.buffer.slice(this.start, this.start + count);
    this.start += (count + 2);
    return {
      tag: "RedisBulkString",
      value: buffer
    };
  }
  private async parse(): Promise<RedisValue> {
    let c = String.fromCharCode(this.buffer[this.start]);
    // console.log(this.buffer, bufferToString(this.buffer), c);
    // console.log(this.start, this.contentTail);
    this.start += 1;
    switch (c) {
      case "*":
        return this.parseArray();
      case "$":
        return this.parseBulkString();
      case "+":
        return {
          tag: "RedisString",
          value: await this.readLine()
        };
      // case '$':
      case "-":
        return {
          tag: "RedisError",
          value: await this.readLine()
        };
      case ":":
        return {
          tag: "RedisNumber",
          value: parseFloat(bufferToString(await this.readLine()))
        };
      default:
        throw new FatalError("Protocol Error");
    }
  }
  public async getRequest(): Promise<RedisValue> {
    if (this.contentTail - this.start === 0) {
      await this.readMore();
    }
    if (this.contentTail === this.start) {
      throw new FatalError("No content to parse");
    }
    return await this.parse();
  }
}

if (import.meta.main) {
  const buffers = encode({
    tag: "RedisArray",
    value: [
      {
        tag: "RedisBulkString",
        value: stringToBuffer("BulkString")
      },
      {
        tag: "RedisError",
        value: stringToBuffer("Error")
      },
      {
        tag: "RedisNumber",
        value: 3.1415926
      }
    ]
  }) as Uint8Array[];
  const stream = new Deno.Buffer();
  for (let i in buffers) {
    // console.log(i, buffers[i]);
    stream.writeSync(buffers[i]);
  }
  const p = new RedisParser(stream);
  const resp = show(await p.getRequest());
  console.log(resp);
}

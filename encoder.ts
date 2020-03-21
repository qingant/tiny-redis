import { RedisValue } from "./protocol.ts";

export const bufferToString = (buf: Uint8Array): string => {
  return new TextDecoder("utf-8").decode(buf);
};

export const stringToBuffer = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};
const packRedisString = (buf: Uint8Array, head = "+"): Uint8Array => {
  const dst = new Uint8Array(3 + buf.length);
  dst.set(buf, 1);
  dst[0] = head.charCodeAt(0);
  dst[dst.length - 2] = "\r".charCodeAt(0);
  dst[dst.length - 1] = "\n".charCodeAt(0);
  return dst;
};

const redisNil = stringToBuffer("*-1\r\n");

export class FatalError extends Error {}

const _encode = (value: RedisValue): Uint8Array | Uint8Array[] => {
  switch (value.tag) {
    case "RedisNumber":
      const v = `:${value.value}\r\n`;
      return stringToBuffer(v);
    case "RedisError":
      return packRedisString(value.value, "-");
    case "RedisString":
      return packRedisString(value.value, "+");
    case "RedisBulkString":
      return Uint8Array.from(
        [
          ...stringToBuffer(`\$${value.value.length}\r\n`),
          ...packRedisString(value.value, "$").slice(1)
        ]
      );
    case "RedisNil":
      return redisNil;
    case "RedisArray":
      return [
        stringToBuffer(`*${value.value.length}\r\n`),
        ...value.value.map(v => _encode(v) as Uint8Array)
      ];
    default:
      throw new FatalError(`Encode error: ${value}`);
  }
};
export const encode = (value: RedisValue): Uint8Array[] => {
  const r = _encode(value);
  if (r instanceof Uint8Array) {
    return [r];
  }
  return r;
};

export const show = (value: RedisValue): string => {
  let encoded = encode(value);
  return encoded.map(v => JSON.stringify(bufferToString(v))).join("\n");
};

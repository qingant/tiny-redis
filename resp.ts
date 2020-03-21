export interface RedisString {
  tag: "RedisString";
  value: Uint8Array;
} // binary safe byte string

export interface RedisBulkString {
  tag: "RedisBulkString";
  value: Uint8Array;
}

export interface RedisNumber {
  tag: "RedisNumber";
  value: number;
}
export interface RedisError {
  tag: "RedisError";
  value: Uint8Array;
}
export interface RedisNil {
  tag: "RedisNil";
}

export interface RedisArray {
  tag: "RedisArray";
  value: (RedisString | RedisNumber | RedisError | RedisBulkString)[];
}

export type RedisValue = RedisString | RedisNumber | RedisError | RedisNil
  | RedisArray | RedisBulkString;

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

const RedisNilValue: RedisValue = {
  tag: "RedisNil"
};

const RedisOk: RedisValue = {
  tag: "RedisString",
  value: stringToBuffer("Ok")
};

export const Redis = {
  number: (n: number): RedisValue => {
    return { tag: "RedisNumber", value: n };
  },
  string: (s: string): RedisBulkString => {
    return { tag: "RedisBulkString", value: stringToBuffer(s) };
  },
  array: (ss: string[]): RedisArray => {
    return { tag: "RedisArray", value: ss.map(v => Redis.string(v)) };
  },
  error: (error: string): RedisError => {
    return { tag: "RedisError", value: stringToBuffer(error) };
  },
  nil: RedisNilValue,
  ok: RedisOk
};

if (import.meta.main) {
  const err: RedisValue = {
    tag: "RedisError",
    value: stringToBuffer("这是一个错误, this is an error")
  };
  const num: RedisValue = {
    tag: "RedisNumber",
    value: 1024
  };
  const arr: RedisArray = {
    tag: "RedisArray",
    value: [
      RedisOk,
      {
        tag: "RedisString",
        value: stringToBuffer("a string is a string")
      } as RedisString
    ]
  };
  const bulkStr: RedisBulkString = {
    tag: "RedisBulkString",
    value: stringToBuffer("This is a bulk string")
  };

  [RedisOk, bulkStr, RedisNilValue, err, num, arr].forEach(v => {
    console.log(v);
    console.log(show(v));
  });
}

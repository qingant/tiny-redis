import { stringToBuffer, show } from "./encoder.ts";

export * from "./encoder.ts";

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
export type ArrayItem = RedisString | RedisNumber | RedisError | RedisBulkString;
export interface RedisArray {
  tag: "RedisArray";
  value: ArrayItem[];
}

export type RedisValue = RedisString | RedisNumber | RedisError | RedisNil
  | RedisArray | RedisBulkString;

const RedisNilValue: RedisValue = {
  tag: "RedisNil"
};

const RedisOk: RedisValue = {
  tag: "RedisString",
  value: stringToBuffer("Ok")
};

export const RedisValueOf = {
  number: (n: number): RedisValue => {
    return { tag: "RedisNumber", value: n };
  },
  string: (s: string): RedisBulkString => {
    return { tag: "RedisBulkString", value: stringToBuffer(s) };
  },
  array: (ss: string[]): RedisArray => {
    return { tag: "RedisArray", value: ss.map(v => RedisValueOf.string(v)) };
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

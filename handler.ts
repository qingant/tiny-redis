import {
  RedisArray,
  RedisValue,
  stringToBuffer,
  bufferToString,
  Redis
} from "./resp.ts";
import { RedisClient } from "./client.ts";

export interface RedisHandler {
  onRequest(request: RedisArray): Promise<RedisValue>;
  onConnCreated(client: RedisClient): void;
  onConnExit(client: RedisClient): void;
}

export class BaseHandler implements RedisHandler {
  clients: RedisClient[] = [];

  public onConnCreated(client: RedisClient) {
    this.clients = [client, ...this.clients];
  }

  public onConnExit(client: RedisClient) {
    this.clients = this.clients.filter(c => c !== client);
  }

  private async command_INFO(request: RedisArray): Promise<RedisValue> {
    return Redis.array([
      `# Tiny Redis`,
      `Deno v${JSON.stringify(Deno.version)}`,
      "",
      `# Clients`,
      `Connected: ${this.clients.length}`,
      ""
    ]);
  }

  private async command_COMMAND(request: RedisArray): Promise<RedisValue> {
    const cmds = Object.keys(this.commands);
    return Redis.array([...cmds, ...Object.keys(this._commands)]);
  }

  _commands: { [index: string]: any } = {
    "COMMAND": this.command_COMMAND,
    "INFO": this.command_INFO
  };
  commands: { [index: string]: any } = {};

  public async onRequest(request: RedisArray): Promise<RedisValue> {
    const command = request.value[0];
    if (command.tag !== "RedisString" && command.tag !== "RedisBulkString") {
      return {
        tag: "RedisError",
        value: stringToBuffer(`Command Invlid: ${JSON.stringify(request)}`)
      };
    }
    const cmd = bufferToString(command.value).toUpperCase();
    const h = this.commands[cmd] || this._commands[cmd];
    if (h) {
      return h.bind(this)(request) as RedisValue;
    } else {
      return {
        tag: "RedisError",
        value: stringToBuffer(`Command unimplemented: ${cmd}`)
      };
    }
  }
}

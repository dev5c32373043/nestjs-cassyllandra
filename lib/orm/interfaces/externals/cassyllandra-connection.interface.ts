import { types } from 'cassandra-driver';

import * as Cassandra from 'express-cassandra';

import { ConnectionOptions } from './cassyllandra-client-options.interface';
import { BaseModel } from './cassyllandra.interface';

export interface Connection extends FunctionConstructor {
  uuid(): types.Uuid;
  uuidFromString(str: string): types.Uuid;
  uuidFromBuffer(buffer: Buffer): types.Uuid;

  timeuuid(): types.TimeUuid;
  timeuuidFromDate(date: Date): types.TimeUuid;
  timeuuidFromString(str: string): types.TimeUuid;
  timeuuidFromBuffer(buffer: Buffer): types.TimeUuid;
  maxTimeuuid(date: Date): types.TimeUuid;
  minTimeuuid(date: Date): types.TimeUuid;

  doBatchAsync(queries: string[]): Promise<any>;

  loadSchema<T = any>(schema: any, name?: string): BaseModel<T>;

  instance: { [index: string]: BaseModel };

  orm: any;

  closeAsync(): Promise<any>;

  initAsync(): Promise<any>;

  [index: string]: any;
}

export interface CassyllandraStatic {
  new (options: Partial<ConnectionOptions>): Connection;

  createClient(options: ConnectionOptions): Connection;

  [index: string]: any;
}

export const Connection: CassyllandraStatic = Cassandra;

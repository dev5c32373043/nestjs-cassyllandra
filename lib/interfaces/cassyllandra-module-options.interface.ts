import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';

import { ConnectionOptions } from '../orm';

export type CassyllandraModuleOptions = {
  keepConnectionAlive?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  isGlobal?: boolean;
  skipQueryTypeCheck?: boolean;
} & Partial<ConnectionOptions>;

export type CassyllandraFeaturesModuleOptions = any[];

export interface CassyllandraOptionsFactory {
  createCassyllandraOptions(): Promise<CassyllandraModuleOptions> | CassyllandraModuleOptions;
}

export interface CassyllandraModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  isGlobal?: boolean;
  useClass?: Type<CassyllandraOptionsFactory>;
  useExisting?: Type<CassyllandraOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<CassyllandraModuleOptions> | CassyllandraModuleOptions;
}

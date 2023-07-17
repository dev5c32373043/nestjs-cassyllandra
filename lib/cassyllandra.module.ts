import { DynamicModule, Module } from '@nestjs/common';

import {
  CassyllandraModuleOptions,
  CassyllandraModuleAsyncOptions,
  CassyllandraFeaturesModuleOptions,
} from './interfaces';
import { createCassyllandraProviders } from './cassyllandra.providers';
import { CassyllandraCoreModule } from './cassyllandra-core.module';

@Module({})
export class CassyllandraModule {
  static forRoot(options: CassyllandraModuleOptions): DynamicModule {
    return {
      module: CassyllandraModule,
      imports: [CassyllandraCoreModule.forRoot(options)],
      global: options.isGlobal,
    };
  }

  static forFeature(entities: CassyllandraFeaturesModuleOptions = []): DynamicModule {
    const providers = createCassyllandraProviders(entities);
    return {
      providers,
      module: CassyllandraModule,
      exports: providers,
    };
  }

  static forRootAsync(options: CassyllandraModuleAsyncOptions): DynamicModule {
    return {
      module: CassyllandraModule,
      global: options.isGlobal,
      imports: [CassyllandraCoreModule.forRootAsync(options)],
    };
  }
}

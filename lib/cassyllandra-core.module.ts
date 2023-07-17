import { map } from 'rxjs/operators';
import { defer, lastValueFrom } from 'rxjs';
import { DynamicModule, Module, Global, Provider, OnModuleDestroy, Inject, Logger } from '@nestjs/common';

import { CassyllandraModuleOptions, CassyllandraModuleAsyncOptions, CassyllandraOptionsFactory } from './interfaces';
import { handleRetry, generateString } from './utils/orm.utils';
import { Connection } from './orm';

import { MODULE_ID, MODULE_OPTIONS, CONNECTION_TOKEN } from './constants';

@Global()
@Module({})
export class CassyllandraCoreModule implements OnModuleDestroy {
  constructor(
    @Inject(MODULE_OPTIONS)
    private readonly options: CassyllandraModuleOptions,
    @Inject(CONNECTION_TOKEN)
    private readonly cassyllandraConnection: Connection,
  ) {}

  static forRoot(options: CassyllandraModuleOptions = {}): DynamicModule {
    const moduleOptions = {
      provide: MODULE_OPTIONS,
      useValue: options,
    };

    const connectionProvider = {
      provide: CONNECTION_TOKEN,
      useFactory: async () => await this.createConnectionFactory(options),
    };

    return {
      providers: [moduleOptions, connectionProvider],
      exports: [moduleOptions, connectionProvider],
      module: CassyllandraCoreModule,
    };
  }

  static forRootAsync(options: CassyllandraModuleAsyncOptions): DynamicModule {
    const connectionProvider = {
      provide: CONNECTION_TOKEN,
      useFactory: async (typeormOptions: CassyllandraModuleOptions) => {
        return await this.createConnectionFactory(typeormOptions);
      },
      inject: [MODULE_OPTIONS],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: CassyllandraCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        connectionProvider,
        {
          provide: MODULE_ID,
          useValue: generateString(),
        },
      ],
      exports: [...asyncProviders, connectionProvider],
    };
  }

  async onModuleDestroy() {
    if (this.options.keepConnectionAlive) return;

    Logger.log('Closing connection...', 'CassyllandraModule');

    if (!this.cassyllandraConnection) return;

    await this.cassyllandraConnection.closeAsync();
  }

  private static createAsyncProviders(options: CassyllandraModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: CassyllandraModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        useFactory: options.useFactory,
        provide: MODULE_OPTIONS,
        inject: options.inject || [],
      };
    }

    return {
      provide: MODULE_OPTIONS,
      useFactory: async (optionsFactory: CassyllandraOptionsFactory) =>
        await optionsFactory.createCassyllandraOptions(),
      inject: [options.useClass || options.useExisting],
    };
  }

  private static async createConnectionFactory({
    retryDelay,
    retryAttempts,
    ...cassandraOptions
  }: CassyllandraModuleOptions): Promise<Connection> {
    const connection = new Connection(cassandraOptions);
    return await lastValueFrom(
      defer(() => connection.initAsync()).pipe(
        handleRetry(retryAttempts, retryDelay),
        map(() => connection),
      ),
    );
  }
}

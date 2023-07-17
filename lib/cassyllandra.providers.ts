import { Provider } from '@nestjs/common';
import { defer, lastValueFrom } from 'rxjs';

import { getEntity } from './orm/utils/decorator.utils';
import { RepositoryFactory } from './orm/repositories/repository.factory';
import { loadModel, Repository, Connection } from './orm';
import { getModelToken, getRepositoryToken } from './utils/orm.utils';

import { CassyllandraModuleOptions } from './interfaces';

import { CONNECTION_TOKEN, MODULE_OPTIONS } from './constants';

export function createCassyllandraProviders(entities: any[]) {
  const providers: Provider[] = [];
  const providerModel = entity => ({
    inject: [CONNECTION_TOKEN, MODULE_OPTIONS],
    provide: getModelToken(entity),
    useFactory: (connection: Connection, moduleOptions: CassyllandraModuleOptions) => {
      return lastValueFrom(defer(() => loadModel(connection, moduleOptions, entity)));
    },
  });

  const provideRepository = entity => ({
    inject: [getModelToken(entity)],
    provide: getRepositoryToken(entity),
    useFactory: async model => RepositoryFactory.create(entity, model),
  });

  const provideCustomRepository = EntityRepository => {
    const entity = getEntity(EntityRepository);
    return {
      provide: getRepositoryToken(EntityRepository),
      useFactory: async model => RepositoryFactory.create(entity, model, EntityRepository),
      inject: [getModelToken(entity)],
    };
  };

  for (const entity of entities) {
    if (entity.prototype instanceof Repository) {
      providers.push(provideCustomRepository(entity));
      continue;
    }

    providers.push(providerModel(entity), provideRepository(entity));
  }

  return [...providers];
}

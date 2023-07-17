import { randomUUID } from 'crypto';
import { Observable, timer } from 'rxjs';
import { Logger } from '@nestjs/common';
import { retry } from 'rxjs/operators';

import { Repository } from '../orm';

export function handleRetry(
  retryAttempts: number = 5,
  retryDelay: number = 5000,
): <T>(source: Observable<T>) => Observable<T> {
  return <T>(source: Observable<T>) =>
    source.pipe(
      retry({
        count: retryAttempts,
        delay: (error: any, retryCount: number) => {
          Logger.error(
            `Unable to connect to the database. Retrying (${retryCount})...`,
            error.stack,
            'CassyllandraModule',
          );

          return timer(retryDelay);
        },
        resetOnSuccess: true,
      }),
    );
}

/**
 * This function returns a Cassandra model token for given entity.
 * @param {Function} entity This parameter is an Entity class.
 * @returns {string} The Cassandra model injection token.
 */
export function getModelToken(entity: any): string {
  return `${entity.name}Model`;
}

/**
 * This function returns a Repository injection token for given entity.
 * @param {Function} entity This options is either an Entity class or Repository.
 * @returns {string} The Repository injection token.
 */
export function getRepositoryToken(entity: any): string {
  if (entity.prototype instanceof Repository) return entity.name;

  return `${entity.name}Repository`;
}

export const generateString = () => randomUUID();

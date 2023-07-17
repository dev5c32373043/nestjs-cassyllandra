import { Type } from '@nestjs/common';

import { FindQuery } from '../interfaces';
import { getColumnsMapper } from './decorator.utils';

export function transformKey<T>(target: Type<T>, key?: string | keyof T): any {
  if (!target || !(target && typeof target === 'function') || !key) return key;

  const mapper = getColumnsMapper(new target());
  if (!mapper) return key;

  return mapper[key] || key;
}

export function transformQuerySelect<T>(target: Type<T>, select?: Array<string | keyof T>): any {
  if (!target || !(target && typeof target === 'function') || !select) return select;

  const mapper = getColumnsMapper(new target());
  if (!mapper) return select;

  return select.map(key => mapper[key] || key);
}

export function transformQuery<T>(target: Type<T>, query?: FindQuery<T>): any {
  if (!target || !(target && typeof target === 'function') || !query) return query;

  const mapper = getColumnsMapper(new target());

  if (!mapper) return query;

  for (const key of Object.keys(query)) {
    const column = mapper[key] || key;
    if (column === key) {
      continue;
    }

    query[column] = query[key];
    delete query[key];
  }

  return query;
}

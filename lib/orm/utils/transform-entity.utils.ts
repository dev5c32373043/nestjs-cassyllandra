import { Type } from '@nestjs/common';

import { getColumnsMapper, getPropertiesMapper } from './decorator.utils';

function assignWithMapper(dst: any, src: any, mapper: Record<string, string>) {
  if (!mapper) return Object.assign(dst, src);

  for (const key of Object.keys(src)) {
    const dstKey = mapper[key] || key;
    dst[dstKey] = src[key];
  }

  return dst;
}

export function transformTo<T>(target: Type<T>, entity: any[]): T[];

export function transformTo<T>(target: Type<T>, entity: any): T;

export function transformTo<T>(target: Type<T>, entity: any): T | T[] {
  if (!target || !(target && typeof target === 'function') || !entity) {
    return entity;
  }
  const mapper = getColumnsMapper(new target());

  if (Array.isArray(entity)) {
    return entity.map(entity => assignWithMapper(new target(), entity, mapper));
  }

  return assignWithMapper(new target(), entity, mapper);
}

export function transformFrom<T>(target: Type<T>, entity: any[]): T[];

export function transformFrom<T>(target: Type<T>, entity: any): T;

export function transformFrom<T>(target: Type<T>, entity: any): T | T[] {
  if (!target || !(target && typeof target === 'function') || !entity) return entity;

  const mapper = getPropertiesMapper(new target());

  if (!Array.isArray(entity)) {
    return assignWithMapper(new target(), entity, mapper);
  }

  return entity.map(entity => assignWithMapper(new target(), entity, mapper));
}

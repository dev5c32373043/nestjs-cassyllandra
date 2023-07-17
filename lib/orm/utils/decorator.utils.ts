import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { mergeDeep } from './deep-merge.utils';
import {
  OPTIONS_KEY,
  ATTRIBUTE_KEY,
  ENTITY_NAME_KEY,
  ENTITY_METADATA,
  COLUMNS_MAPPER_KEY,
  PROPERTIES_MAPPER_KEY,
} from '../orm.constants';

export function setEntity(target: any, entity: any): void {
  Reflect.defineMetadata(ENTITY_METADATA, entity, target);
}

export function getEntity(target: any): any {
  return Reflect.getMetadata(ENTITY_METADATA, target);
}

export function setEntityName(target: any, modelName: string): void {
  Reflect.defineMetadata(ENTITY_NAME_KEY, modelName, target);
}

export function getEntityName(target: any): string {
  return Reflect.getMetadata(ENTITY_NAME_KEY, target);
}

export function getAttributes(target: any): any {
  const rawAttributes = Reflect.getMetadata(ATTRIBUTE_KEY, target);
  if (!rawAttributes) return;

  const attributes = Object.keys(rawAttributes).reduce((copy, key) => {
    copy[key] = { ...rawAttributes[key] };
    return copy;
  }, {});

  return attributes;
}

export function setAttributes(target: any, attributes: any) {
  Reflect.defineMetadata(ATTRIBUTE_KEY, { ...attributes }, target);
}

export function getColumnsMapper(target: any) {
  return Reflect.getMetadata(COLUMNS_MAPPER_KEY, target) || {};
}

export function getPropertiesMapper(target: any) {
  return Reflect.getMetadata(PROPERTIES_MAPPER_KEY, target) || {};
}

export function getColumnName(target: any, propertyName: string, def?: string) {
  const mapper = getColumnsMapper(target);
  if (propertyName in mapper) return mapper[propertyName];

  return def || propertyName;
}

export function getPropertyName(target: any, columnName: string, def?: string) {
  const mapper = getPropertiesMapper(target);
  if (columnName in mapper) return mapper[columnName];

  return def || columnName;
}

export function setColumnMapping(target: any, propertyName: string, columnName: string) {
  if (!propertyName || !columnName || propertyName === columnName) return;

  const mapper = getColumnsMapper(target);
  if (propertyName in mapper && mapper[propertyName]) {
    Logger.warn(`Columns mapper already constrain propertyName "${propertyName}"`, undefined, 'CassyllandraModule');
  }
  Reflect.defineMetadata(
    COLUMNS_MAPPER_KEY,
    {
      ...mapper,
      [propertyName]: columnName,
    },
    target,
  );
}

export function setPropertyMapping(target: any, propertyName: string, columnName: string) {
  if (!propertyName || !columnName || propertyName === columnName) return;

  const mapper = getPropertiesMapper(target);
  if (columnName in mapper && mapper[propertyName]) {
    Logger.warn(`Columns mapper already constrain columnName "${columnName}"`, undefined, 'CassyllandraModule');
  }

  Reflect.defineMetadata(
    PROPERTIES_MAPPER_KEY,
    {
      ...mapper,
      [columnName]: propertyName,
    },
    target,
  );
}

export function setTransformMapping(target: any, propertyName: string, columnName: string) {
  setPropertyMapping(target, propertyName, columnName);
  setColumnMapping(target, propertyName, columnName);
}

export function hasAttribute(target: any, propertyName: string): boolean {
  const attributes = getAttributes(target);
  const columnName = getColumnName(target, propertyName);
  return attributes && columnName in attributes && attributes[columnName];
}

export function addAttribute(target: any, propertyName: string, { name, ...options }: any): void {
  const attributes = getAttributes(target) || {};
  if (name) {
    setTransformMapping(target, propertyName, name);
  }

  setAttributes(target, { ...attributes, [name || propertyName]: { ...(options || {}) } });
}

export function addAttributeOptions(target: any, propertyName: string, { name, ...options }: any): void {
  const attributes = getAttributes(target) || {};
  const columnName = getColumnName(target, propertyName, name);
  if (columnName in attributes) {
    attributes[columnName] = mergeDeep(attributes[columnName], options);
  } else {
    attributes[columnName] = options;
  }

  setAttributes(target, attributes);
}

export function getOptions(target: any): any | undefined {
  return { ...(Reflect.getMetadata(OPTIONS_KEY, target) || {}) };
}

export function setOptions(target: any, options: any): void {
  Reflect.defineMetadata(OPTIONS_KEY, { ...options }, target);
}

export function addOptions(target: any, options: any): void {
  setOptions(target, mergeDeep(getOptions(target) || {}, options));
}

export const addHookFunction = (target: object, metadataKey: string) => {
  const funcLikeArray: any[] = Reflect.getMetadata(metadataKey, target) || [];
  return (...args: any[]) => funcLikeArray.map(funcLike => funcLike(...args));
};

import { types } from 'cassandra-driver';

export const uuid = (id?: any): types.Uuid => {
  if (!id) return types.Uuid.random();
  if (typeof id === 'string') return types.Uuid.fromString(id);

  return id;
};

export const timeuuid = (id?: string | Date): types.TimeUuid => {
  if (!id) return types.TimeUuid.now();
  if (typeof id === 'string') return types.TimeUuid.fromString(id);
  if (id instanceof Date) return types.TimeUuid.fromDate(id);

  return id;
};

export const isUuid = (id: any): boolean => id && id instanceof types.Uuid;

export const isTimeUuid = (id: any): boolean => id && id instanceof types.TimeUuid;

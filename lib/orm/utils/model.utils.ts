import { promisify } from 'util';
import { to } from './async.utils';
import { Logger } from '@nestjs/common';

import { Connection } from '../';
import { CassyllandraModuleOptions } from '../../interfaces';

import { getAttributes, getOptions } from './decorator.utils';

export async function loadModel(
  connection: Connection,
  moduleOptions: CassyllandraModuleOptions,
  entity: any,
): Promise<any> {
  const { skipQueryTypeCheck } = moduleOptions;

  // Wrapping model in proxy because external lib depends on this context
  const model = new Proxy(
    connection.loadSchema(entity.name || entity.table_name, getSchema(entity, skipQueryTypeCheck)),
    {
      get(target, prop) {
        const value = Reflect.get(target, prop);

        if (typeof value === 'function') {
          return (...args) => value.bind(target)(...args);
        }

        return value;
      },
    },
  );

  const [err] = await to(promisify(model.syncDB)());
  if (err) {
    Logger.error(err.message, err.stack, 'CassyllandraModule');
  }

  return model;
}

export function getSchema(entity: any, skipQueryTypeCheck: boolean) {
  const attributes = getAttributes(entity.prototype) || {};

  if (skipQueryTypeCheck) {
    for (const k in attributes) {
      attributes[k].rule ||= {};

      if (typeof attributes[k].rule === 'function') {
        attributes[k].rule = { validator: attributes[k].rule };
      }

      attributes[k].rule.type_validation = false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { instanceMethods, classMethods, ...options } = getOptions(entity.prototype) || {};
  return { ...options, fields: { ...attributes } };
}

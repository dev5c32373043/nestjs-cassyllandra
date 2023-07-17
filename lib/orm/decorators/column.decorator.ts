import { Logger } from '@nestjs/common';
import { BeforeSave } from './hooks.decorator';
import { ColumnOptions } from '../interfaces';
import { uuid, timeuuid } from '../utils/db.utils';
import {
  addOptions,
  getOptions,
  hasAttribute,
  addAttribute,
  getColumnName,
  setTransformMapping,
} from '../utils/decorator.utils';

export function Column(options: ColumnOptions): PropertyDecorator {
  return (target: object, propertyName: string) => {
    addAttribute(target, propertyName, options);
  };
}

export function GeneratedUUidColumn(type: 'uuid' | 'timeuuid' = 'uuid', name?: string): PropertyDecorator {
  return (target: object, propertyName: string) => {
    if (hasAttribute(target, propertyName)) {
      Logger.warn(`Already exist attribute for property`, undefined, 'CassyllandraModule');
    }

    Column({
      name,
      type,
      default: { $db_function: type === 'timeuuid' ? 'now()' : 'uuid()' },
    })(target, propertyName);

    BeforeSave()(target, propertyName, {
      value(...args: any[]) {
        const [instance] = args;

        if (instance !== null && !instance[propertyName]) {
          instance[propertyName] = type === 'timeuuid' ? timeuuid() : uuid();
        }
      },
    });
  };
}

export function VersionColumn(columnName?: string): PropertyDecorator {
  return (target: object, propertyName: string) => {
    if (hasAttribute(target, propertyName)) {
      Logger.warn(`Attribute already exists for property (version column)`, undefined, 'CassyllandraModule');
    }

    if (columnName) {
      setTransformMapping(target, propertyName, columnName);
    }

    addOptions(target, { options: { versions: { key: columnName || propertyName } } });
  };
}

export function CreateDateColumn(columnName?: string): PropertyDecorator {
  return (target: object, propertyName: string) => {
    if (hasAttribute(target, propertyName)) {
      Logger.warn(`Attribute already attribute for property (create date column)`, undefined, 'CassyllandraModule');
    }

    if (columnName) {
      setTransformMapping(target, propertyName, columnName);
    }

    addOptions(target, {
      options: { timestamps: { createdAt: columnName || propertyName } },
    });
  };
}

export function UpdateDateColumn(columnName?: string): PropertyDecorator {
  return (target: object, propertyName: string) => {
    if (hasAttribute(target, propertyName)) {
      Logger.warn(`Already exist attribute for property (update date column)`, undefined, 'CassyllandraModule');
    }

    if (columnName) {
      setTransformMapping(target, propertyName, columnName);
    }

    addOptions(target, {
      options: { timestamps: { updatedAt: columnName || propertyName } },
    });
  };
}

export function IndexColumn(): PropertyDecorator {
  return (target: object, propertyName: string) => {
    const columnName = getColumnName(target, propertyName);
    const { indexes = [] } = getOptions(target) || { indexes: [] };

    if ((indexes as string[]).some(value => value === columnName)) return;

    addOptions(target, { indexes: [...indexes, columnName] });
  };
}

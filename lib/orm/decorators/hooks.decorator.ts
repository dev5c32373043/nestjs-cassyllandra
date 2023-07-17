import { BEFORE_SAVE, AFTER_SAVE, BEFORE_UPDATE, AFTER_UPDATE, BEFORE_DELETE, AFTER_DELETE } from '../orm.constants';
import { getOptions, addOptions, addHookFunction } from '../utils/decorator.utils';

const genericListener =
  (hookName: string, hookKey: string) =>
  (target: object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    const hookFuncLikeArray = Reflect.getMetadata(hookName, target) || [];
    hookFuncLikeArray.push(descriptor.value);

    Reflect.defineMetadata(hookName, hookFuncLikeArray, target);

    if (!getOptions(target)[hookKey]) {
      addOptions(target, {
        [hookKey]: addHookFunction(target, hookName),
      });
    }

    return descriptor;
  };

export const BeforeSave = (): MethodDecorator => genericListener(BEFORE_SAVE, 'before_save');

export const AfterSave = (): MethodDecorator => genericListener(AFTER_SAVE, 'after_save');

export const BeforeUpdate = (): MethodDecorator => genericListener(BEFORE_UPDATE, 'before_update');

export const AfterUpdate = (): MethodDecorator => genericListener(AFTER_UPDATE, 'after_update');

export const BeforeDelete = (): MethodDecorator => genericListener(BEFORE_DELETE, 'before_delete');

export const AfterDelete = (): MethodDecorator => genericListener(AFTER_DELETE, 'after_delete');

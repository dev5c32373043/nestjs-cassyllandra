import { getOptions, addOptions } from '../utils/decorator.utils';

export function EntityMethod(): MethodDecorator {
  return (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
    const { methods } = getOptions(target);
    addOptions(target, {
      methods: {
        ...(methods || {}),
        [propertyKey]: descriptor.value,
      },
    });

    return descriptor;
  };
}

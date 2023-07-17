import {
  BaseModel,
  FindQuery,
  SaveOptionsStatic,
  DeleteOptionsStatic,
  UpdateOptionsStatic,
} from '../../interfaces/externals/cassyllandra.interface';

import { transformQuery } from '../../utils/transform-query.utils';

export class ReturnQueryBuilder<T = any> {
  constructor(
    private readonly model: BaseModel<T>,
    private readonly target: any,
  ) {}

  save(model: Partial<T>, options: SaveOptionsStatic = {}): string {
    return new this.model(model).save({ ...options, return_query: true });
  }

  update(query: FindQuery<T> = {}, updateValue: Partial<T>, options: UpdateOptionsStatic<T> = {}): string {
    return this.model.update(transformQuery(this.target, query), transformQuery(this.target, updateValue), {
      ...options,
      return_query: true,
    });
  }

  delete(query: FindQuery<T> = {}, options: DeleteOptionsStatic = {}): string {
    return this.model.delete(transformQuery(this.target, query), { ...options, return_query: true });
  }
}

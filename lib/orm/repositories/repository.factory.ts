import { BaseModel } from '../interfaces/externals/cassyllandra.interface';
import { Repository } from './repository';
import { ReturnQueryBuilder } from './builder/return-query.builder';

export class RepositoryFactory {
  static create<T>(entity: any, model: BaseModel, EntityRepository = Repository): Repository<T> {
    return new EntityRepository<T>(model, entity, new ReturnQueryBuilder<T>(model, entity));
  }
}

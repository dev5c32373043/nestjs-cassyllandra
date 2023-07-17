import { Type } from '@nestjs/common';
import { types } from 'cassandra-driver';

export type ResultSet = types.ResultSet;

import {
  BaseModel,
  FindQuery,
  SaveOptionsStatic,
  UpdateOptionsStatic,
  DeleteOptionsStatic,
  FindQueryOptionsStatic,
  BatchQuery,
} from '../interfaces';

import { transformQuery, transformQuerySelect } from '../utils/transform-query.utils';
import { transformFrom, transformTo } from '../utils/transform-entity.utils';
import { EntityNotFound } from '../errors';
import { ReturnQueryBuilder } from './builder/return-query.builder';
import { Batch } from './batch';

const defaultOptions = {
  findOptions: { raw: true },
  updateOptions: { if_exists: true },
  deleteOptions: { if_exists: true },
};

export class Repository<Entity = any> {
  readonly modelRef: BaseModel<Entity>;
  readonly target: Type<Entity>;
  readonly returnQueryBuilder: ReturnQueryBuilder<Entity>;
  readonly source: string;

  constructor(model: BaseModel<Entity>, target: Type<Entity>, returnQueryBuilder: ReturnQueryBuilder<Entity>) {
    this.modelRef = model;
    this.target = target;
    this.returnQueryBuilder = returnQueryBuilder;
    this.source = this.modelRef._properties.qualified_table_name;
  }

  async findOne(query: FindQuery<Entity>, options?: FindQueryOptionsStatic<Entity>): Promise<Entity>;

  async findOne(query: FindQuery<Entity>, options: FindQueryOptionsStatic<Entity> = {}): Promise<Entity> {
    const queryResult = await this.modelRef.findOneAsync(transformQuery(this.target, query), {
      ...options,
      ...defaultOptions.findOptions,
      select: transformQuerySelect(this.target, options?.select),
    });

    return transformFrom(this.target, queryResult);
  }

  async findOneOrFail(query: FindQuery<Entity>, extraOptions: FindQueryOptionsStatic<Entity> = {}): Promise<Entity> {
    const queryResult = await this.findOne(transformQuery(this.target, query), extraOptions);
    if (queryResult == null) {
      throw new EntityNotFound(this.target, query);
    }

    return queryResult;
  }

  async find(query: FindQuery<Entity>, options?: FindQueryOptionsStatic<Entity>): Promise<Entity[]>;

  async find(query: FindQuery<Entity>, options: FindQueryOptionsStatic<Entity> = {}): Promise<Entity[]> {
    const queryResult = await this.modelRef.findAsync(transformQuery(this.target, query), {
      ...options,
      ...defaultOptions.findOptions,
      select: transformQuerySelect(this.target, options?.select),
    });

    return queryResult.map(en => transformFrom(this.target, en));
  }

  async create(entity: Partial<Entity>, options: SaveOptionsStatic = {}): Promise<Entity> {
    const model = new this.modelRef(transformTo(this.target, entity));
    await model.saveAsync(options);
    return transformFrom(this.target, model.toJSON());
  }

  async insertMany(entities: Partial<Entity>[], options: SaveOptionsStatic = {}): Promise<Entity[]> {
    const instances = [];

    const queries: BatchQuery[] = await Promise.all(
      entities.map(entity => {
        const instance = new this.modelRef(transformTo(this.target, entity));
        instances.push(instance);
        return instance.save({ ...options, return_query: true });
      }),
    );

    await this.initBatch(queries).execute();

    return instances.map(i => transformFrom(this.target, i.toJSON()));
  }

  async update(
    query: FindQuery<Entity>,
    updateValue: Partial<Entity>,
    options: UpdateOptionsStatic<Entity> = {},
  ): Promise<any> {
    const q = transformQuery(this.target, query);
    const update = transformQuery(this.target, updateValue);
    const opts = {
      ...defaultOptions.updateOptions,
      ...options,
    };

    return this.modelRef.updateAsync(q, update, opts);
  }

  async removeOne(entity: Entity, options: DeleteOptionsStatic = {}): Promise<Entity> {
    return new this.modelRef(transformTo(this.target, entity)).deleteAsync({
      ...defaultOptions.deleteOptions,
      ...options,
    });
  }

  async removeMany(entities: Entity[], options: DeleteOptionsStatic = {}): Promise<void> {
    const queries: BatchQuery[] = await Promise.all(
      entities.map(entity =>
        new this.modelRef(transformTo(this.target, entity)).delete({
          ...defaultOptions.deleteOptions,
          ...options,
          return_query: true,
        }),
      ),
    );

    await this.initBatch(queries).execute();
  }

  async delete(query: FindQuery<Entity>, options: DeleteOptionsStatic = {}): Promise<void> {
    return this.modelRef.deleteAsync(transformQuery(this.target, query), {
      ...defaultOptions.deleteOptions,
      ...options,
    });
  }

  async truncate(): Promise<any> {
    await this.modelRef.truncateAsync();
  }

  async stream(
    query: FindQuery<Entity>,
    options: FindQueryOptionsStatic<Entity> = {},
    readFn: (en: Entity) => void,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const onRead = (reader): void => {
        while (true) {
          const row = reader.readRow();
          if (row == null) {
            break;
          }

          readFn(transformFrom(this.target, row));
        }
      };

      const onDone = (err): void => {
        err ? reject(err) : resolve(null);
      };

      this.modelRef.stream(
        transformQuery(this.target, query),
        {
          ...options,
          ...defaultOptions.findOptions,
          prepare: true,
          select: transformQuerySelect(this.target, options?.select),
        },
        onRead,
        onDone,
      );
    });
  }

  async eachRow(
    query: FindQuery<Entity>,
    options: FindQueryOptionsStatic<Entity> = {},
    readFn: (en: Entity) => void,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const onRow = (n, row): void => readFn(transformFrom(this.target, row));
      const onDone = (err: Error, result: any): void => {
        if (err) {
          return reject(err);
        }

        resolve(result);
      };

      this.modelRef.eachRow(
        transformQuery(this.target, query),
        {
          ...options,
          ...defaultOptions.findOptions,
          select: transformQuerySelect(this.target, options?.select),
        },
        onRow,
        onDone,
      );
    });
  }

  async executeQuery(query: string, params: any[] = []): Promise<ResultSet> {
    return this.modelRef.execute_queryAsync(query, params);
  }

  initBatch(ops: BatchQuery[] = []): InstanceType<typeof Batch> {
    return new Batch(this.modelRef, this.target, ops);
  }
}

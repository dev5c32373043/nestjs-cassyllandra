# Cassyllandra 🦠‍

Set of utilities for NestJS based on [express-cassandra](https://www.npmjs.com/package/express-cassandra) package.
[express-cassandra](https://www.npmjs.com/package/express-cassandra) is a Cassandra ORM/ODM/OGM for NodeJS with support for Apache Cassandra, ScyllaDB, Datastax Enterprise, Elassandra & JanusGraph.

Based on https://www.npmjs.com/package/@ouato/nestjs-express-cassandra with bug fixes, new features, dependency updates and more.

## Installation

```bash
$ npm i @dev5c32373043/nestjs-cassyllandra
```

## Usage

```typescript
import { CassyllandraModule } from '@dev5c32373043/nestjs-cassyllandra';

@Module({
  imports: [
    CassyllandraModule.forRoot({
      clientOptions: {
        contactPoints: ['127.0.0.1'],
        keyspace: 'dev',
        localDataCenter: 'datacenter1',
        queryOptions: {
          consistency: 1,
        },
      },
      ormOptions: {
        createKeyspace: true,
        defaultReplicationStrategy: {
          class: 'SimpleStrategy',
          replication_factor: 1,
        },
        migration: 'alter',
      },
      skipQueryTypeCheck: true,
    }),
  ],
  providers: [],
})
export class AppModule {}
```

`skipQueryTypeCheck: boolean` - globally skip field type check in queries instead of [per field basis](https://github.com/masumsoft/express-cassandra/blob/master/docs/validators.md#disabling-built-in-type-validation), default: false

For more client options look [here](https://docs.datastax.com/en/developer/nodejs-driver/4.6/api/type.ClientOptions/)

For more details about orm options look [here](https://express-cassandra.readthedocs.io/en/stable/usage/)

## Async options

Quite often you might want to asynchronously pass your module options instead of passing them beforehand. In such case, use forRootAsync() method, that provides a couple of various ways to deal with async data.

**1. Use factory**

```typescript
CassyllandraModule.forRootAsync({
  useFactory: () => ({...}),
})
```

Obviously, our factory behaves like every other one (might be `async` and is able to inject dependencies through `inject`).

```typescript
CassyllandraModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => configService.get('db'),
  inject: [ConfigService],
});
```

**2. Use class**

```typescript
CassyllandraModule.forRootAsync({
  useClass: ConfigService,
});
```

Above construction will instantiate `ConfigService` inside `CassyllandraModule` and will leverage it to create options object.

```typescript
class ConfigService implements CassyllandraOptionsFactory {
  createCassyllandraOptions(): CassyllandraModuleOptions {
    return {...};
  }
}
```

**3. Use existing**

```typescript
CassyllandraModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

It works the same as `useClass` with one critical difference - `CassyllandraModule` will look up imported modules to reuse already created ConfigService, instead of instantiating it on its own.

## ORM Options

Defining our entity.

```typescript
import {
  Entity,
  Column,
  GeneratedUUidColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from '@dev5c32373043/nestjs-cassyllandra';

@Entity({
  table_name: 'activities',
  key: ['id'],
})
export class ActivityEntity {
  @GeneratedUUidColumn()
  id: any;

  @Column({
    name: 'action',
    type: 'text',
    rule: {
      required: true,
    },
  })
  action: string;

  @Column({
    name: 'time',
    type: 'timestamp',
    default: { $db_function: 'toTimestamp(now())' },
  })
  time: Date;

  @Column({
    name: 'username',
    type: 'text',
    rule: {
      required: true,
    },
  })
  username: string;

  @Column({
    name: 'value',
    type: 'float',
    default: '1',
  })
  value: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  __v: string;
}
```

Let's have a look at the `ActivityModule`

```typescript
import { Module } from '@nestjs/common';
import { CassyllandraModule } from '@dev5c32373043/nestjs-cassyllandra';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityEntity } from './activity.entity';

@Module({
  imports: [CassyllandraModule.forFeature([ActivityEntity])],
  providers: [ActivityService],
  controllers: [ActivityController],
})
export class ActivityModule {}
```

This module uses `forFeature()` method to define which entities shall be registered in the current scope. Thanks to that we can inject the `ActivityEntity` to the `ActivityService` using the `@InjectModel()` decorator:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel, BaseModel } from '@dev5c32373043/nestjs-cassyllandra';
import { ActivityEntity } from './activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(ActivityEntity)
    private readonly activityEntity: BaseModel<ActivityEntity>,
  ) {}

  getByAction(action: string): Promise<ActivityEntity> {
    return this.activityEntity.findOneAsync({ action }, { raw: true, allow_filtering: true });
  }
}
```

**Using Column Decorators:**
To auto-generate uuid/timeuuid column, you need to decorate an entity's properties you want to make into an auto-generated
uuid/timeuuid column with a `@GeneratedUUidColumn` decorator.

```typescript
import { Entity, Column, GeneratedUUidColumn } from '@dev5c32373043/nestjs-cassyllandra';

@Entity({
  table_name: 'activities',
  key: ['id'],
})
export class ActivityEntity {
  @GeneratedUUidColumn()
  id: any;

  @GeneratedUUidColumn('timeuuid')
  time_id: any;
}
```

To auto-generate createdDate/updatedDate column, you need to decorate an entity's properties you want to make into an auto-generated
createdDate/updatedDate column with a `@CreateDateColumn` or `@UpdateDateColumn` decorator (not combine with `@Column` decorator).

To index a column, you need to decorate an entity's properties you want to index with a `@IndexColumn` decorator.

To auto-generate version column, you need to decorate an entity's properties you want to make into an auto-generated
version column with a `@VersionColumn` decorator (not combine with `@Column` decorator).

```typescript
import {
  Column,
  Entity,
  IndexColumn,
  VersionColumn,
  UpdateDateColumn,
  CreateDateColumn,
  GeneratedUUidColumn,
} from '@dev5c32373043/nestjs-cassyllandra';

@Entity({
  table_name: 'activities',
  key: ['id'],
})
export class ActivityEntity {
  @GeneratedUUidColumn()
  id: any;

  @Column({
    type: 'text',
  })
  @IndexColumn()
  action: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  __v: any;
}
```

**Using Hook Function Decorators:**
An entity of express-cassandra support multiple hook function. For more details [see](https://express-cassandra.readthedocs.io/en/stable/management/#hook-functions).

To create hook function in an entity use `@BeforeSave`, `@AfterSave`, `@BeforeUpdate`, `@AfterUpdate`, `@BeforeDelete`, `@AfterDelete` decorators.

```typescript
import {
  Entity,
  Column,
  AfterSave,
  BeforeSave,
  AfterUpdate,
  AfterDelete,
  BeforeDelete,
  BeforeUpdate,
  GeneratedUUidColumn,
} from '@dev5c32373043/nestjs-cassyllandra';

@Entity({
  table_name: 'activities',
  key: ['id'],
})
export class ActivityEntity {
  @GeneratedUUidColumn()
  id: any;

  @BeforeSave()
  beforeSave(instance) {
    // your code here
  }

  @AfterSave()
  afterSave(instance) {
    // your code here
  }

  @BeforeUpdate()
  beforeUpdate(query, updateValues, options) {
    // your code here
  }

  @AfterUpdate()
  afterUpdate(query, updateValues, options) {
    // your code here
  }

  @BeforeDelete()
  beforeDelete(query, options) {
    // your code here
  }

  @AfterDelete()
  afterDelete(query, options) {
    // your code here
  }
}
```

## Using Model

### Important Note: `BaseModel<T>` is a wrapper for [express-cassandra](https://www.npmjs.com/package/express-cassandra) model. If column names in the model differ (e.g., `@Column({ name: 'my_field', type: 'text' }) myField: string`), you must handle the mapping yourself. Alternatively, consider using the `Repository` for a cleaner approach. Choose based on your needs.

```typescript
import { Injectable } from '@nestjs/common';
import { BaseModel, InjectModel, ResultSet } from '@dev5c32373043/nestjs-cassyllandra';

import { ActivityEntity } from './activity.model';

@Injectable()
export class ActivityService {
  readonly entitySource: string;

  constructor(
    @InjectModel(ActivityEntity)
    readonly activityModel: BaseModel<ActivityEntity>,
  ) {
    this.entitySource = `${this.activityModel.get_keyspace_name()}"."${this.activityModel.get_table_name()}`;
  }

  async save(payload) {
    const activity = new this.activityModel(payload);
    await activity.saveAsync();
    return activity.toJSON();
  }

  async update(query, payload) {
    return this.activityModel.updateAsync(query, payload);
  }

  async delete(query, opts) {
    return this.activityModel.deleteAsync(query, opts);
  }

  async find(query, opts) {
    return this.activityModel.findAsync(query, opts);
  }

  async findOne(q, opts) {
    return this.activityModel.findOneAsync(q, opts);
  }

  async stream(query, opts, onRead) {
    return new Promise((resolve, reject) => {
      this.activityModel.stream(query, opts, onRead, err => {
        if (err) return reject(err);
        resolve(null);
      });
    });
  }

  eachRow(query, opts, onRead): Promise<any> {
    return new Promise((resolve, reject) =>
      this.activityModel.eachRow(query, opts, onRead, err => {
        if (err) return reject(err);
        resolve(null);
      }),
    );
  }

  async rawQuery(query, params = []): Promise<ResultSet> {
    return this.activityModel.execute_queryAsync(query, params);
  }

  async doBatch(queries: { query: string; params: any[] }[]): Promise<void> {
    await activityModel.execute_batchAsync(queries);
  }

  async truncate(): Promise<void> {
    await this.activityModel.truncateAsync();
  }
}
```

For more details look [here](https://express-cassandra.readthedocs.io/en/stable/)

## Using Repository

```typescript
import { Module } from '@nestjs/common';
import { CassyllandraModule } from '@dev5c32373043/nestjs-cassyllandra';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityEntity } from './activity.entity';

@Module({
  imports: [CassyllandraModule.forFeature([ActivityEntity])],
  providers: [ActivityService],
  controllers: [ActivityController],
})
export class ActivityModule {}
```

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '@dev5c32373043/nestjs-cassyllandra';
import { ActivityEntity } from './activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
  ) {}

  async create(payload): Promise<ActivityEntity> {
    return this.activityRepository.create(payload);
  }

  async insertMany(payload): Promise<ActivityEntity[]> {
    return this.activityRepository.insertMany(payload);
  }

  async update(query, payload, opts = {}): Promise<any> {
    return this.activityRepository.update(query, payload, opts);
  }

  async removeOne(entity, opts = {}): Promise<void> {
    await this.activityRepository.removeOne(entity, opts);
  }

  async removeMany(entities, opts = {}): Promise<void> {
    await this.activityRepository.removeMany(entities, opts);
  }

  async delete(query, opts = {}): Promise<void> {
    await this.activityRepository.delete(query, opts);
  }

  async find(q?: object, opts?: object): Promise<ActivityEntity[]> {
    return this.activityRepository.find(q, opts);
  }

  async findOne(q?: object, opts?: object): Promise<ActivityEntity> {
    return this.activityRepository.findOne(q, opts);
  }

  async findOneOrFail(q?: object, opts?: object): Promise<ActivityEntity> {
    return this.activityRepository.findOneOrFail(q, opts);
  }

  async stream(query, opts, onRead): Promise<any> {
    return this.activityRepository.stream(query, opts, onRead);
  }

  async eachRow(query, opts, onRead): Promise<any> {
    return this.activityRepository.eachRow(query, opts, onRead);
  }

  async rawQuery(query): Promise<ResultSet> {
    return this.activityRepository.executeQuery(query);
  }

  async truncate(): Promise<void> {
    await this.activityRepository.truncate();
  }
}
```

**Using Batch operations:**

```typescript
@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
  ) {}

  async performBatchOps(): Promise<void> {
    const activity1 = { id: 'c4a07d0f-51f1-4a7d-9dcb-b3166265931d', action: 'action', username: 'user', value: 0 };
    const activity2 = {
      id: 'c7579abc-e22f-411d-a7c7-a445952701d8',
      action: 'action',
      username: 'inactive user',
      value: 0,
    };

    const batch = this.activityRepository.initBatch();
    batch.insert({ action: 'new action', username: 'user', value: 1 });
    batch.update({ id: activity1.id }, { value: 1 });
    batch.remove({ id: activity2.id });

    await batch.execute();
  }
}
```

## Using Custom Repository

Let's create a repository:

```typescript
import { Repository, EntityRepository } from '@dev5c32373043/nestjs-cassyllandra';
import { ActivityEntity } from './activity.entity';

@EntityRepository(ActivityEntity)
export class ActivityRepository extends Repository<ActivityEntity> {
  async findById(id: any): Promise<ActivityEntity> {
    return this.findOne({ id: id });
  }
}
```

Let's have a look at the `ActivityModule`:

```typescript
import { Module } from '@nestjs/common';
import { CassyllandraModule } from '@dev5c32373043/nestjs-cassyllandra';

import { ActivitiesController } from './activities.controller';
import { ActivityRepository } from './activity.repository';
import { ActivityService } from './activity.service';
import { ActivityEntity } from './activity.entity';

@Module({
  imports: [CassyllandraModule.forFeature([ActivityEntity, ActivityRepository])],
  providers: [ActivityService],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
```

Now let's use `ActivityRepository` in `ActivityService`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@dev5c32373043/nestjs-cassyllandra';

import { ActivityRepository } from './activity.repository';
import { ActivityEntity } from './activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityRepository)
    private readonly activityRepository: ActivityRepository,
  ) {}

  async getById(id: any): Promise<ActivityEntity> {
    return this.activityRepository.findById(id);
  }
}
```

Injecting connection:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectConnection } from '@dev5c32373043/nestjs-cassyllandra';

import { ActivityRepository } from './activity.repository';
import { ActivityEntity } from './activity.entity';

@Injectable()
export class PersonService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectRepository(ActivityRepository)
    private readonly activityRepository: ActivityRepository,
  ) {}

  async getById(id: any): Promise<ActivityEntity> {
    return this.activityRepository.findById(id);
  }
}
```

## Using Elassandra

Express cassandra support `Elassandra`. For more details [see](https://express-cassandra.readthedocs.io/en/stable/elassandra/).

```typescript
@Module({
  imports: [
    ScyllaModule.forRoot({
      clientOptions: {
        // omitted other options for clarity
      },
      ormOptions: {
        // omitted other options for clarity
        migration: 'alter',
        manageESIndex: true,
      },
    }),
  ],
  providers: [], // [...]
})
export class AppModule {}
```

```typescript
import { Entity, Column } from '@dev5c32373043/nestjs-cassyllandra';

@Entity({
  table_name: 'activities',
  key: ['id'],
  es_index_mapping: {
    discover: '.*',
    properties: {
      action: {
        type: 'string',
        index: 'analyzed',
      },
    },
  },
})
export class ActivityEntity {
  @Column({
    type: 'uuid',
    default: { $db_function: 'uuid()' },
  })
  id: any;

  @Column({
    type: 'text',
  })
  action: string;
}
```

```typescript
import { Module } from '@nestjs/common';
import { CassyllandraModule } from '@dev5c32373043/nestjs-cassyllandra';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityEntity } from './activity.entity';

@Module({
  imports: [CassyllandraModule.forFeature([ActivityEntity])],
  providers: [ActivitiesService],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
```

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel, BaseModel } from '@dev5c32373043/nestjs-cassyllandra';
import { promisify } from 'util';

import { ActivityEntity } from './activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(ActivityEntity)
    private readonly activityEntity: BaseModel<ActivityEntity>,
  ) {}

  searchName(action: string): Promise<any> {
    return promisify(this.activityEntity.search)({ q: `action:${action}` });
  }
}
```

## Requirements

- [Node.js][node] 14.17.0+
- [Nest.js][nestjs] 8.0.0+

[node]: https://nodejs.org/
[nestjs]: https://nestjs.com/

## Contributing

Any contribution is highly appreciated.

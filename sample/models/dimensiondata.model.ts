import {
  Entity,
  Column,
  GeneratedUUidColumn,
  BeforeSave,
  AfterSave,
  BeforeUpdate,
  AfterUpdate,
  BeforeDelete,
  AfterDelete,
} from '../../lib';

import { EventBus } from '../services/eventbus.service';

@Entity({
  table_name: 'dimensiondata',
  key: ['id'],
})
export class DimensionDataEntity {
  @GeneratedUUidColumn()
  id: any;

  @Column({
    name: 'user',
    type: 'text',
    rule: {
      required: true,
    },
  })
  user: string;

  @Column({
    name: 'activeUser',
    type: 'boolean',
    default: 'false',
  })
  activeUser: boolean;

  @Column({
    name: 'date',
    type: 'timestamp',
    default: { $db_function: 'toTimestamp(now())' },
  })
  date: Date;

  @Column({
    name: 'location',
    type: 'text',
  })
  location: string;

  @Column({
    name: 'ip',
    type: 'text',
    rule: {
      required: true,
    },
  })
  ip: string;

  @Column({
    name: 'value',
    type: 'float',
    rule: {
      required: true,
    },
  })
  value: number;

  @Column({
    name: 'subscription',
    type: 'text',
    rule: {
      required: true,
    },
  })
  subscription: string;

  @Column({
    name: 'comment',
    type: 'text',
  })
  comment: string;

  @BeforeSave()
  beforeSave(instance) {
    if (instance.date.toDateString() === new Date().toDateString()) {
      instance.activeUser = true;
    }

    if (instance.subscription) {
      instance.comment = `${instance.subscription} subscription`;
    }
  }

  @AfterSave()
  afterSave(instance) {
    EventBus.getInstance().emit('dimdata.created', instance.toJSON());
  }

  @BeforeUpdate()
  beforeUpdate(query, updateValues) {
    if (!updateValues.subscription) return true;
    updateValues.comment = `${updateValues.subscription} subscription`;
  }

  @AfterUpdate()
  afterUpdate(query, updateValues) {
    EventBus.getInstance().emit('dimdata.updated', { query, updateValues });
  }

  @BeforeDelete()
  beforeDelete(query) {
    if (query.user !== 'admin') return true;
    throw new Error('admin user cannot be deleted');
  }

  @AfterDelete()
  afterDelete(query) {
    EventBus.getInstance().emit('dimdata.removed', { query });
  }
}

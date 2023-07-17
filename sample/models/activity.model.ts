import { Entity, Column, GeneratedUUidColumn, CreateDateColumn, UpdateDateColumn, VersionColumn } from '../../lib';

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

import { Module } from '@nestjs/common';
import { CassyllandraModule } from '../../lib';

import { ActivityModelService } from '../services/model.service';
import { ActivityRepositoryService } from '../services/repository.service';

import { ActivityEntity } from '../models/activity.model';

@Module({
  imports: [
    CassyllandraModule.forRoot({
      clientOptions: {
        contactPoints: ['127.0.0.1'],
        keyspace: '4test',
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
        migration: 'drop',
      },
      skipQueryTypeCheck: true,
    }),
    CassyllandraModule.forFeature([ActivityEntity]),
  ],
  providers: [ActivityModelService, ActivityRepositoryService],
})
export class ActivityModule {}

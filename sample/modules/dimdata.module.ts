import { Module } from '@nestjs/common';
import { CassyllandraModule } from '../../lib';

import { DimDataService } from '../services/dimdata.service';

import { DimensionDataEntity } from '../models/dimensiondata.model';

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
    CassyllandraModule.forFeature([DimensionDataEntity]),
  ],
  providers: [DimDataService],
})
export class DimDataModule {}

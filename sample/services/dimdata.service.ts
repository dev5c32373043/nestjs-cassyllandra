import { Injectable } from '@nestjs/common';
import { BaseModel, InjectModel } from '../../lib';

import { DimensionDataEntity } from '../models/dimensiondata.model';

@Injectable()
export class DimDataService {
  readonly entitySource: string;

  constructor(
    @InjectModel(DimensionDataEntity)
    private dimDataModel: BaseModel<DimensionDataEntity>,
  ) {
    this.entitySource = `${this.dimDataModel.get_keyspace_name()}"."${this.dimDataModel.get_table_name()}`;
  }

  async save(payload) {
    const dimdata = new this.dimDataModel(payload);
    await dimdata.saveAsync();
    return dimdata;
  }

  async update(query, payload) {
    return this.dimDataModel.updateAsync(query, payload);
  }

  async delete(query = {}, opts = {}) {
    const result = await this.dimDataModel.deleteAsync(query, opts);
    return result;
  }

  async find(query = {}, opts = {}) {
    const result = await this.dimDataModel.findAsync(query, opts);
    return result;
  }

  async findOne(q = {}, opts = {}) {
    const result = await this.dimDataModel.findOneAsync(q, opts);
    return result;
  }

  async truncate(): Promise<void> {
    await this.dimDataModel.truncateAsync();
  }
}

import { Injectable } from '@nestjs/common';
import { BaseModel, InjectModel, ResultSet } from '../../lib';

import { ActivityEntity } from '../models/activity.model';

@Injectable()
export class ActivityModelService {
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
    return activity;
  }

  async update(query, payload) {
    return this.activityModel.updateAsync(query, payload);
  }

  async delete(query, opts = {}) {
    return this.activityModel.deleteAsync(query, opts);
  }

  async find(query = {}, opts = {}) {
    return this.activityModel.findAsync(query, opts);
  }

  async findOne(q = {}, opts = {}) {
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

  async truncate(): Promise<void> {
    await this.activityModel.truncateAsync();
  }
}

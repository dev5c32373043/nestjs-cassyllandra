import { Injectable } from '@nestjs/common';
import { Repository, InjectRepository, ResultSet } from '../../lib';

import { ActivityEntity } from '../models/activity.model';

@Injectable()
export class ActivityRepositoryService {
  readonly entitySource: string;

  constructor(
    @InjectRepository(ActivityEntity)
    readonly activityRepository: Repository<ActivityEntity>,
  ) {
    this.entitySource = activityRepository.source;
  }

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

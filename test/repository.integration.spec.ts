import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { ActivityModule } from '../sample/modules/activity.module';
import { ActivityRepositoryService } from '../sample/services/repository.service';
import { EntityNotFound } from '../lib';

import generateActivity from './helpers/generateActivity';
import { randUuid } from '@ngneat/falso';

describe('Repository', () => {
  let app: INestApplication;
  let service: ActivityRepositoryService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ActivityModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    service = app.get<ActivityRepositoryService>(ActivityRepositoryService);
  });

  afterEach(async () => {
    await service.truncate();
  });

  afterAll(async () => {
    await app.close();
  });

  it('findOne should return empty array', async () => {
    const result = await service.findOne({}, { raw: true });
    expect(result).toBeUndefined();
  });

  it('findOne should return requested record', async () => {
    const data = generateActivity();
    const createdRecord = await service.create(data);

    const result = await service.findOne({ id: createdRecord.id }, { raw: true });
    expect({ ...result, id: result.id.toString() }).toMatchObject(data);
  });

  it("findOne shouldn't return record with fake id", async () => {
    await service.create(generateActivity());

    const result = await service.findOne({ id: randUuid() }, { raw: true });
    expect(result).toBeUndefined();
  });

  it('findOneOrFail should return requested record', async () => {
    const data = generateActivity();
    const createdRecord = await service.create(data);

    const result = await service.findOneOrFail({ id: createdRecord.id }, { raw: true });
    expect({ ...result, id: result.id.toString() }).toMatchObject(data);
  });

  it('findOneOrFail should throw an error when record is not found', async () => {
    await service.create(generateActivity());

    await expect(service.findOneOrFail({ id: randUuid() }, { raw: true })).rejects.toThrowError(EntityNotFound);
  });

  it('create should return record with proper data', async () => {
    const data = generateActivity();
    const createdRecord = await service.create(data);
    expect(createdRecord).toMatchObject(data);

    const findResult = await service.find({}, { raw: true });
    expect(findResult).toHaveLength(1);
  });

  it('create should throw validation error when required field is absent', async () => {
    const data = generateActivity({ action: undefined });

    await expect(service.create(data)).rejects.toThrowError();

    const findResult = await service.find({}, { raw: true });
    expect(findResult).toHaveLength(0);
  });

  it('insertMany should return proper records', async () => {
    const dataset = [generateActivity(), generateActivity(), generateActivity()];

    const createdRecords = await service.insertMany(dataset);
    expect(createdRecords).toEqual(expect.arrayContaining(dataset));

    const findResult = await service.find({}, { raw: true });
    expect(findResult).toHaveLength(3);
  });

  it('update should change only requested data', async () => {
    const data = generateActivity();
    const record = await service.create(data);

    const { action, time } = generateActivity();
    await service.update({ id: record.id }, { action, time });

    const updatedRecord = await service.findOne({ id: record.id });
    expect({ ...updatedRecord, id: updatedRecord.id.toString() }).toMatchObject({ ...data, action, time });
  });

  it('update should throw error when incorrect data provided', async () => {
    const record = await service.create(generateActivity());

    await expect(service.update({ id: record.id }, { action: null })).rejects.toThrowError();

    const storedRecord = await service.findOne({ id: record.id });
    expect(storedRecord.action).toBe(record.action);
  });

  it('removeOne should remove proper record', async () => {
    const [record, record2] = await service.insertMany([generateActivity(), generateActivity()]);

    await service.removeOne(record);

    const records = await service.find({}, { raw: true });
    expect(records).toHaveLength(1);
    expect(records.at(0).id.toString()).toBe(record2.id);
  });

  it('removeMany should remove only requested records', async () => {
    const [record, record2, record3] = await service.insertMany([
      generateActivity(),
      generateActivity(),
      generateActivity(),
    ]);

    await service.removeMany([record, record2]);

    const records = await service.find({}, { raw: true });
    expect(records).toHaveLength(1);
    expect(records.at(0).id.toString()).toBe(record3.id);
  });

  it('delete should remove proper record', async () => {
    const [record, record2] = await service.insertMany([generateActivity(), generateActivity()]);

    await service.delete({ id: record.id });

    const records = await service.find({}, { raw: true });
    expect(records).toHaveLength(1);
    expect(records.at(0).id.toString()).toBe(record2.id);
  });

  it("delete shouldn't remove any record without proper id", async () => {
    await service.insertMany([generateActivity(), generateActivity()]);

    await service.delete({ id: randUuid() });

    const records = await service.find({}, { raw: true });
    expect(records).toHaveLength(2);
  });

  it('stream should iterate each record', async () => {
    const record = await service.create(generateActivity());
    const rec2Data = { ...generateActivity(), id: undefined };
    await service.insertMany([rec2Data, rec2Data]);

    const expectedResult = { [record.action]: 1, [rec2Data.action]: 2 };
    const result = {};

    const onRead = rec => {
      result[rec.action] ||= 0;
      result[rec.action] += 1;
    };

    await service.stream({ value: { $gte: 0 } }, { raw: true, allow_filtering: true }, onRead);

    expect(result).toMatchObject(expectedResult);
  });

  it('eachRow should iterate each record', async () => {
    const record = await service.create(generateActivity());
    const rec2Data = { ...generateActivity(), id: undefined };
    await service.insertMany([rec2Data, rec2Data]);

    const expectedResult = { [record.action]: 1, [rec2Data.action]: 2 };
    const result = {};

    const onRead = rec => {
      result[rec.action] ||= 0;
      result[rec.action] += 1;
    };

    await service.eachRow({ value: { $gte: 0 } }, { raw: true, allow_filtering: true }, onRead);

    expect(result).toMatchObject(expectedResult);
  });

  it('rawQuery should return proper result', async () => {
    await service.insertMany([generateActivity(), generateActivity(), generateActivity()]);

    const expectedResult = [{ total: 3 }];

    const query = `SELECT CAST(COUNT(*) as int) AS total FROM ${service.entitySource};`;

    const result = await service.rawQuery(query);
    expect(result.rows).toMatchObject(expectedResult);
  });

  it('batch should execute all queries', async () => {
    const [record, record2, record3] = await service.insertMany([
      generateActivity(),
      generateActivity(),
      generateActivity(),
    ]);

    const batch = service.activityRepository.initBatch();

    batch.insert(generateActivity());
    batch.delete({ id: record.id });
    batch.delete({ id: record2.id });

    const update = { action: 'test' };
    batch.update({ id: record3.id }, update);

    await batch.execute();

    const records = await service.find({}, { raw: true });
    expect(records).toHaveLength(2);

    const updatedRecord = records.find(r => r.id.toString() === record3.id);
    expect(updatedRecord).toBeDefined();
    expect(updatedRecord.action).toBe(update.action);
  });

  it('batch should return proper size of ops', async () => {
    const [record, record2] = await service.insertMany([generateActivity(), generateActivity()]);

    const batch = service.activityRepository.initBatch();

    batch.delete({ id: record.id });
    batch.delete({ id: record2.id });

    expect(batch.size).toBe(2);

    await batch.execute();

    expect(batch.size).toBe(0);
  });

  it('truncate should remove all rows', async () => {
    await service.insertMany([generateActivity(), generateActivity()]);

    await service.truncate();

    const records = await service.find({}, { raw: true });
    expect(records).toHaveLength(0);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { ActivityModule } from '../sample/modules/activity.module';
import { ActivityModelService } from '../sample/services/model.service';

import generateActivity from './helpers/generateActivity';
import { randUuid } from '@ngneat/falso';

describe('Model', () => {
  let app: INestApplication;
  let service: ActivityModelService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ActivityModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    service = app.get<ActivityModelService>(ActivityModelService);
  });

  afterEach(async () => {
    await service.truncate();
  });

  afterAll(async () => {
    await app.close();
  });

  it('findOne should return requested record', async () => {
    const data = generateActivity();
    const createdRecord = await service.save(data);

    const result = await service.findOne({ id: createdRecord.id });
    expect({ ...result, id: result.id.toString() }).toMatchObject(data);
  });

  it("findOne shouldn't return record with fake id", async () => {
    await service.save(generateActivity());

    const result = await service.findOne({ id: randUuid() });
    expect(result).toBeUndefined();
  });

  it('save should return record with proper data', async () => {
    const data = generateActivity();
    const createdRecord = await service.save(data);
    expect(createdRecord).toMatchObject(data);

    const findResult = await service.find();
    expect(findResult).toHaveLength(1);
  });

  it('save should throw validation error when required field is absent', async () => {
    const data = generateActivity({ action: undefined });
    await expect(service.save(data)).rejects.toThrowError();

    const findResult = await service.find();
    expect(findResult).toHaveLength(0);
  });

  it('update should change only requested data', async () => {
    const data = generateActivity();
    const record = await service.save(data);

    const { action, time } = generateActivity();
    await service.update({ id: record.id }, { action, time });

    const updatedRecord = await service.findOne({ id: record.id });
    expect({ ...updatedRecord, id: updatedRecord.id.toString() }).toMatchObject({ ...data, action, time });
  });

  it('update should throw error when incorrect data provided', async () => {
    const data = generateActivity();
    const record = await service.save(data);

    await expect(service.update({ id: record.id }, { action: null })).rejects.toThrowError();

    const storedRecord = await service.findOne({ id: record.id });
    expect(storedRecord.action).toBe(record.action);
  });

  it('delete should remove proper record', async () => {
    const record = await service.save(generateActivity());
    const record2 = await service.save(generateActivity());

    await service.delete({ id: record.id });

    const records = await service.find();
    expect(records).toHaveLength(1);
    expect(records.at(0).id.toString()).toBe(record2.id);
  });

  it("delete shouldn't remove any record without proper id", async () => {
    await service.save(generateActivity());
    await service.save(generateActivity());

    await service.delete({ id: randUuid() });

    const records = await service.find();
    expect(records).toHaveLength(2);
  });

  it('stream should iterate each record', async () => {
    const record = await service.save(generateActivity());
    const rec2Data = { ...generateActivity(), id: undefined };
    await service.save(rec2Data);
    await service.save(rec2Data);

    const expectedResult = { [record.action]: 1, [rec2Data.action]: 2 };
    const result = {};

    const onRead = reader => {
      let record;

      while ((record = reader.readRow())) {
        result[record.action] ||= 0;
        result[record.action] += 1;
      }
    };

    await service.stream({ value: { $gte: 0 } }, { raw: true, allow_filtering: true }, onRead);

    expect(result).toMatchObject(expectedResult);
  });

  it('eachRow should iterate each record', async () => {
    const record = await service.save(generateActivity());
    const rec2Data = { ...generateActivity(), id: undefined };
    await service.save(rec2Data);
    await service.save(rec2Data);

    const expectedResult = { [record.action]: 1, [rec2Data.action]: 2 };
    const result = {};

    const onRead = (n, rec) => {
      result[rec.action] ||= 0;
      result[rec.action] += 1;
    };

    await service.eachRow({ value: { $gte: 0 } }, { raw: true, allow_filtering: true }, onRead);

    expect(result).toMatchObject(expectedResult);
  });

  it('rawQuery should return proper result', async () => {
    await service.save(generateActivity());
    await service.save(generateActivity());
    await service.save(generateActivity());

    const expectedResult = [{ total: 3 }];

    const query = `SELECT CAST(COUNT(*) as int) AS total FROM "${service.entitySource}";`;
    const result = await service.rawQuery(query);

    expect(result.rows).toMatchObject(expectedResult);
  });

  it('execute_batchAsync should execute all queries', async () => {
    const record = await service.save(generateActivity());
    const record2 = await service.save(generateActivity());
    const record3 = await service.save(generateActivity());

    const { activityModel } = service;

    const update = { action: 'test' };
    const queries = await Promise.all([
      activityModel.delete({ id: record.id }, { return_query: true }),
      activityModel.delete({ id: record2.id }, { return_query: true }),
      activityModel.update({ id: record3.id }, update, { return_query: true }),
    ]);

    await activityModel.execute_batchAsync(queries);

    const records = await service.find({}, { raw: true });
    expect(records).toHaveLength(1);

    const storedRecord = records.at(0);
    expect(storedRecord.id.toString()).toBe(record3.id);
    expect(storedRecord.action).toBe(update.action);
  });

  it('truncate should remove all rows', async () => {
    await service.save(generateActivity());
    await service.save(generateActivity());

    await service.truncate();

    const records = await service.find();
    expect(records).toHaveLength(0);
  });
});

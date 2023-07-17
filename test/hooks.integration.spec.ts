import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { randFullAddress } from '@ngneat/falso';

import { DimDataModule } from '../sample/modules/dimdata.module';
import { DimDataService } from '../sample/services/dimdata.service';

import generateDimData from './helpers/generateDimData';

import { EventBus } from '../sample/services/eventbus.service';

describe('Hooks', () => {
  let app: INestApplication;
  let service: DimDataService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [DimDataModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    service = app.get<DimDataService>(DimDataService);

    jest.spyOn(EventBus.prototype, 'emit');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await service.truncate();
  });

  afterAll(async () => {
    await app.close();
  });

  it('BeforeSave should work as expected', async () => {
    const record = await service.save(generateDimData({ activeUser: false, date: new Date() }));

    const storedRecord = await service.findOne({ id: record.id }, { raw: true });
    expect(storedRecord.activeUser).toBe(true);
  });

  it('AfterSave should work as expected', async () => {
    const record = await service.save(generateDimData());

    expect(EventBus.prototype.emit).toHaveBeenCalledTimes(1);
    expect(EventBus.prototype.emit).toHaveBeenCalledWith('dimdata.created', record.toJSON());
  });

  it('BeforeUpdate should work as expected', async () => {
    const record = await service.save(generateDimData({ subscription: 'trial' }));

    await service.update({ id: record.id }, { subscription: 'pro' });

    const storedRecord = await service.findOne({ id: record.id }, { raw: true });
    expect(storedRecord.comment).toBe('pro subscription');
  });

  it('AfterUpdate should work as expected', async () => {
    const record = await service.save(generateDimData({ location: null }));

    jest.clearAllMocks();

    const query = { id: record.id };
    const updateValues = { location: randFullAddress() };
    await service.update(query, updateValues);

    expect(EventBus.prototype.emit).toHaveBeenCalledTimes(1);
    expect(EventBus.prototype.emit).toHaveBeenCalledWith('dimdata.updated', { query, updateValues });
  });

  it('BeforeDelete should work as expected', async () => {
    const record = await service.save(generateDimData({ user: 'admin' }));
    await expect(service.delete({ user: 'admin' })).rejects.toThrowError();

    const storedRecord = await service.findOne({ id: record.id }, { raw: true });
    expect(storedRecord).toBeTruthy();
  });

  it('AfterDelete should work as expected', async () => {
    const record = await service.save(generateDimData());

    jest.clearAllMocks();

    const query = { id: record.id };
    await service.delete(query);

    expect(EventBus.prototype.emit).toHaveBeenCalledTimes(1);
    expect(EventBus.prototype.emit).toHaveBeenCalledWith('dimdata.removed', { query });
  });
});

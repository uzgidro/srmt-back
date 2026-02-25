import { DailyValueAutoUpdateService } from './daily-value-auto-update.service';
import { Repository } from 'typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';
import { ConfigService } from '@nestjs/config';
import { ReservoirEntity } from '../reservoir/reservoir.entity';
import { StaticDto, StaticResponse } from '../interfaces/static.response';

describe('DailyValueAutoUpdateService', () => {
  let service: DailyValueAutoUpdateService;
  let repo: jest.Mocked<Repository<DailyValueEntity>>;
  let requestService: jest.Mocked<RequestService>;
  let reservoirService: jest.Mocked<ReservoirService>;
  let configService: Partial<ConfigService>;

  const reservoir = Object.assign(new ReservoirEntity(1, 'Test'), {
    position: 1, lat: '', lon: '', dailyValue: [],
  });

  const makeStaticDto = (time: number, income = 100, release = 50, level = 245, volume = 1500) => {
    const resp: StaticResponse = {
      id: 1, id_wather: 1, id_user: 1, date: '2025-06-14', time,
      weather: '', level, size: volume, to_come: String(income), to_out: release, gentle: 0,
    };
    return new StaticDto(resp, reservoir);
  };

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue([]),
    } as any;

    requestService = {
      fetchLastData: jest.fn().mockResolvedValue([makeStaticDto(6)]),
    } as any;

    reservoirService = {
      findAll: jest.fn().mockResolvedValue([reservoir]),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'timing.dataStartHour') return 6;
        return undefined;
      }),
    };

    service = new DailyValueAutoUpdateService(
      repo, requestService, reservoirService, configService as ConfigService,
    );
  });

  describe('updateData', () => {
    it('should return early if no records exist', async () => {
      repo.find.mockResolvedValue([]);
      await service.updateData();
      expect(requestService.fetchLastData).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should fetch data for dates between last record and today', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const formatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

      const lastEntity = new DailyValueEntity('income', formatter.format(yesterday), 100, reservoir);
      lastEntity.id = 1;
      repo.find.mockResolvedValue([lastEntity]);

      await service.updateData();
      expect(reservoirService.findAll).toHaveBeenCalled();
      expect(requestService.fetchLastData).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('should create 4 entities per date per reservoir (income, release, level, volume)', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const formatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

      const lastEntity = new DailyValueEntity('income', formatter.format(twoDaysAgo), 100, reservoir);
      lastEntity.id = 1;
      repo.find.mockResolvedValue([lastEntity]);

      await service.updateData();

      const savedData = repo.save.mock.calls[0][0] as DailyValueEntity[];
      // 1 date gap × 1 reservoir × 4 categories = 4 entities
      expect(savedData.length).toBe(4);
      const categories = savedData.map(e => e.category);
      expect(categories).toContain('income');
      expect(categories).toContain('release');
      expect(categories).toContain('level');
      expect(categories).toContain('volume');
    });

    it('should use 0 values when API returns empty', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const formatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

      const lastEntity = new DailyValueEntity('income', formatter.format(twoDaysAgo), 100, reservoir);
      lastEntity.id = 1;
      repo.find.mockResolvedValue([lastEntity]);
      requestService.fetchLastData.mockResolvedValue([]);

      await service.updateData();

      const savedData = repo.save.mock.calls[0][0] as DailyValueEntity[];
      savedData.forEach(e => expect(e.value).toBe(0));
    });

    it('should use dataStartHour data when available', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const formatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

      const lastEntity = new DailyValueEntity('income', formatter.format(twoDaysAgo), 0, reservoir);
      lastEntity.id = 1;
      repo.find.mockResolvedValue([lastEntity]);

      const dto6 = makeStaticDto(6, 200, 80, 250, 2000);
      const dto8 = makeStaticDto(8, 150, 60, 248, 1800);
      requestService.fetchLastData.mockResolvedValue([dto6, dto8]);

      await service.updateData();

      const savedData = repo.save.mock.calls[0][0] as DailyValueEntity[];
      const incomeEntity = savedData.find(e => e.category === 'income');
      expect(incomeEntity?.value).toBe(200);
    });

    it('should average values when no dataStartHour data exists', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const formatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

      const lastEntity = new DailyValueEntity('income', formatter.format(twoDaysAgo), 0, reservoir);
      lastEntity.id = 1;
      repo.find.mockResolvedValue([lastEntity]);

      const dto8 = makeStaticDto(8, 100, 60, 248, 1800);
      const dto10 = makeStaticDto(10, 200, 80, 250, 2000);
      requestService.fetchLastData.mockResolvedValue([dto8, dto10]);

      await service.updateData();

      const savedData = repo.save.mock.calls[0][0] as DailyValueEntity[];
      const incomeEntity = savedData.find(e => e.category === 'income');
      // average of 100 and 200 = 150
      expect(incomeEntity?.value).toBe(150);
    });
  });
});

import { DailyValueService } from './daily-value.service';
import { DailyValueRepository } from './daily-value.repository';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { StaticDto, StaticResponse } from '../interfaces/static.response';
import { ReservoirEntity } from '../reservoir/reservoir.entity';
import { DailyValueEntity } from './daily-value.entity';

describe('DailyValueService', () => {
  let service: DailyValueService;
  let repo: jest.Mocked<DailyValueRepository>;
  let requestService: jest.Mocked<RequestService>;
  let reservoirService: jest.Mocked<ReservoirService>;
  let redisService: jest.Mocked<RedisService>;
  let configService: Partial<ConfigService>;

  const reservoir = Object.assign(new ReservoirEntity(1, 'Test'), {
    position: 1, lat: '', lon: '', dailyValue: [],
  });

  const makeStaticResponse = (overrides: Partial<StaticResponse> = {}): StaticResponse => ({
    id: 1, id_wather: 1, id_user: 1, date: '2025-06-15', time: 6,
    weather: '', level: 245.5, size: 1500, to_come: '120.5', to_out: 80, gentle: 0,
    ...overrides,
  });

  const makeStaticDto = (time = 6) =>
    new StaticDto(makeStaticResponse({ time }), reservoir);

  const makeDailyEntity = (category: string, date: string, value: number) => {
    const e = new DailyValueEntity(category, date, value, reservoir);
    e.id = 1;
    return e;
  };

  beforeEach(() => {
    repo = {
      getDataBetween: jest.fn().mockResolvedValue([]),
      getDataInDates: jest.fn().mockResolvedValue([]),
      getYearsDecadeData: jest.fn().mockResolvedValue([]),
      getSelectedYearData: jest.fn().mockResolvedValue({ reservoir_id: 1, reservoir: 'Test', data: [] }),
      getExtremisYear: jest.fn().mockResolvedValue(2023),
      getAvgValues: jest.fn().mockResolvedValue({ reservoir_id: 1, reservoir: 'Test', data: [] }),
      getTenYearsAvgValues: jest.fn().mockResolvedValue({ reservoir_id: 1, reservoir: 'Test', data: [] }),
      getTotalValuesByYears: jest.fn().mockResolvedValue({ reservoir_id: 1, reservoir: 'Test', data: [] }),
      getSumUntilCurrentDecade: jest.fn().mockResolvedValue([]),
    } as any;

    requestService = {
      fetchCurrentData: jest.fn().mockResolvedValue([makeStaticDto(6), makeStaticDto(8)]),
      fetchLastData: jest.fn().mockResolvedValue([]),
    } as any;

    reservoirService = {
      findAll: jest.fn().mockResolvedValue([reservoir]),
    } as any;

    redisService = {
      getDataFromStatic: jest.fn().mockImplementation(async (fn) => fn()),
      getOperativeData: jest.fn().mockImplementation(async (fn) => fn()),
      getDecadeData: jest.fn().mockImplementation(async (_id, fn) => fn()),
      getMonthData: jest.fn().mockImplementation(async (_id, fn) => fn()),
      getYearDecadeData: jest.fn().mockImplementation(async (_id, fn) => fn()),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'timing.dataStartHour') return 6;
        return undefined;
      }),
    };

    service = new DailyValueService(
      repo, requestService, reservoirService, redisService, configService as ConfigService,
    );
  });

  describe('getCurrentDataByCategory', () => {
    it('should return categorised response with income, release, level, volume', async () => {
      const result = await service.getCurrentDataByCategory();
      expect(result).toHaveProperty('income');
      expect(result).toHaveProperty('release');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('volume');
      expect(result.income).toHaveLength(1);
    });

    it('should use redis caching for static data', async () => {
      await service.getCurrentDataByCategory();
      expect(redisService.getDataFromStatic).toHaveBeenCalled();
    });

    it('should map reservoir name correctly', async () => {
      const result = await service.getCurrentDataByCategory();
      expect(result.income[0].reservoir).toBe('Test');
      expect(result.income[0].reservoir_id).toBe(1);
    });
  });

  describe('getCurrentDataByReservoir', () => {
    it('should return array grouped by reservoir', async () => {
      const result = await service.getCurrentDataByReservoir();
      expect(result).toHaveLength(1);
      expect(result[0].reservoir).toBe(reservoir);
      expect(result[0]).toHaveProperty('income');
      expect(result[0]).toHaveProperty('release');
      expect(result[0]).toHaveProperty('level');
      expect(result[0]).toHaveProperty('volume');
    });
  });

  describe('getDecadeData', () => {
    it('should call repo.getDataBetween with date range', async () => {
      const entities = [
        makeDailyEntity('income', '2025-06-15', 100),
        makeDailyEntity('release', '2025-06-15', 50),
        makeDailyEntity('level', '2025-06-15', 245),
        makeDailyEntity('volume', '2025-06-15', 1500),
      ];
      repo.getDataBetween.mockResolvedValue(entities);

      const result = await service.getDecadeData(1);
      expect(repo.getDataBetween).toHaveBeenCalledWith(1, expect.anything(), expect.anything());
      expect(result).toHaveProperty('income');
    });
  });

  describe('getMonthData', () => {
    it('should call repo.getDataBetween starting from Jan 1', async () => {
      const entities = [makeDailyEntity('income', '2025-01-15', 100)];
      repo.getDataBetween.mockResolvedValue(entities);
      await service.getMonthData(1);
      expect(repo.getDataBetween).toHaveBeenCalled();
      const startDate = repo.getDataBetween.mock.calls[0][1];
      expect(startDate.month()).toBe(0);
      expect(startDate.date()).toBe(1);
    });
  });

  describe('getSelectedYearData', () => {
    it('should delegate to repo', async () => {
      await service.getSelectedYearData(1, 2024);
      expect(repo.getSelectedYearData).toHaveBeenCalledWith(1, 2024, 'income');
    });

    it('should pass custom category', async () => {
      await service.getSelectedYearData(1, 2024, 'volume');
      expect(repo.getSelectedYearData).toHaveBeenCalledWith(1, 2024, 'volume');
    });
  });

  describe('getMinYearData', () => {
    it('should get extremis year then fetch data', async () => {
      repo.getExtremisYear.mockResolvedValue(2020);
      await service.getMinYearData(1);
      expect(repo.getExtremisYear).toHaveBeenCalledWith(1, 'min');
      expect(repo.getSelectedYearData).toHaveBeenCalledWith(1, 2020, 'income');
    });
  });

  describe('getMaxYearData', () => {
    it('should get extremis year then fetch data', async () => {
      repo.getExtremisYear.mockResolvedValue(2022);
      await service.getMaxYearData(1);
      expect(repo.getExtremisYear).toHaveBeenCalledWith(1, 'max');
      expect(repo.getSelectedYearData).toHaveBeenCalledWith(1, 2022, 'income');
    });
  });

  describe('getAvgData', () => {
    it('should delegate to repo.getAvgValues', async () => {
      await service.getAvgData(1);
      expect(repo.getAvgValues).toHaveBeenCalledWith(1, 'income');
    });
  });

  describe('getTenYearsAvgData', () => {
    it('should delegate to repo.getTenYearsAvgValues', async () => {
      await service.getTenYearsAvgData(1);
      expect(repo.getTenYearsAvgValues).toHaveBeenCalledWith(1, 'income');
    });
  });

  describe('getTotalDataByYears', () => {
    it('should delegate to repo.getTotalValuesByYears', async () => {
      await service.getTotalDataByYears(1);
      expect(repo.getTotalValuesByYears).toHaveBeenCalledWith(1, 'income');
    });
  });

  describe('getSumUntilCurrentDecade', () => {
    it('should fetch avg and yearly totals for all reservoirs', async () => {
      const result = await service.getSumUntilCurrentDecade();
      expect(result).toHaveProperty('avg');
      expect(result).toHaveProperty('year');
      expect(repo.getSumUntilCurrentDecade).toHaveBeenCalledWith('income');
      expect(repo.getTotalValuesByYears).toHaveBeenCalledWith(1);
    });
  });
});

import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import { Cache } from '@nestjs/cache-manager';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

describe('RedisService', () => {
  let service: RedisService;
  let cacheManager: jest.Mocked<Cache>;
  let configService: Partial<ConfigService>;

  beforeEach(() => {
    cacheManager = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const map: Record<string, any> = {
          'timing.dataStartHour': 6,
          'timing.cacheRefreshHour': 8,
          'timing.decadeDates': [11, 21],
        };
        return map[key];
      }),
    };

    service = new RedisService(cacheManager, configService as ConfigService);
  });

  describe('getReservoirList', () => {
    const mockData = [new ReservoirEntity(1, 'A')];

    it('should return cached data on cache hit', async () => {
      cacheManager.get.mockResolvedValue(mockData);
      const resource = jest.fn();

      const result = await service.getReservoirList(resource);
      expect(result).toEqual(mockData);
      expect(resource).not.toHaveBeenCalled();
    });

    it('should call resource and cache on miss', async () => {
      const resource = jest.fn().mockResolvedValue(mockData);

      const result = await service.getReservoirList(resource);
      expect(resource).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith('reservoirs', mockData);
      expect(result).toEqual(mockData);
    });
  });

  describe('getReservoir', () => {
    const mockReservoir = new ReservoirEntity(5, 'Test');

    it('should use key reservoirs/{id}', async () => {
      cacheManager.get.mockResolvedValue(mockReservoir);
      await service.getReservoir(5, jest.fn());
      expect(cacheManager.get).toHaveBeenCalledWith('reservoirs/5');
    });

    it('should fetch and cache on miss', async () => {
      const resource = jest.fn().mockResolvedValue(mockReservoir);
      const result = await service.getReservoir(5, resource);
      expect(resource).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalledWith('reservoirs/5', mockReservoir);
      expect(result).toEqual(mockReservoir);
    });
  });

  describe('getDataFromStatic', () => {
    it('should return cached data on hit', async () => {
      const cached = [[{ id: 1 }]];
      cacheManager.get.mockResolvedValue(cached);
      const result = await service.getDataFromStatic(jest.fn());
      expect(result).toEqual(cached);
    });

    it('should set cache with TTL on miss', async () => {
      const data = [[{ id: 1 }]];
      const resource = jest.fn().mockResolvedValue(data);
      await service.getDataFromStatic(resource);
      expect(cacheManager.set).toHaveBeenCalledWith('static', data, expect.any(Number));
    });

    it('should calculate positive TTL for next even hour', async () => {
      const resource = jest.fn().mockResolvedValue([]);
      await service.getDataFromStatic(resource);
      const ttl = (cacheManager.set as jest.Mock).mock.calls[0][2];
      expect(ttl).toBeGreaterThan(0);
    });
  });

  describe('getOperativeData', () => {
    it('should cache with day-begin TTL', async () => {
      const resource = jest.fn().mockResolvedValue([]);
      await service.getOperativeData(resource);
      expect(cacheManager.set).toHaveBeenCalledWith('operative', [], expect.any(Number));
    });
  });

  describe('getDecadeData', () => {
    it('should use decade/{id} key', async () => {
      await service.getDecadeData(3, jest.fn().mockResolvedValue({}));
      expect(cacheManager.get).toHaveBeenCalledWith('decade/3');
    });
  });

  describe('getMonthData', () => {
    it('should use month/{id} key', async () => {
      await service.getMonthData(7, jest.fn().mockResolvedValue({}));
      expect(cacheManager.get).toHaveBeenCalledWith('month/7');
    });
  });

  describe('getYearDecadeData', () => {
    it('should use year-decade/{id} key', async () => {
      await service.getYearDecadeData(2, jest.fn().mockResolvedValue({}));
      expect(cacheManager.get).toHaveBeenCalledWith('year-decade/2');
    });

    it('should set TTL until next decade date', async () => {
      const resource = jest.fn().mockResolvedValue({});
      await service.getYearDecadeData(2, resource);
      const ttl = (cacheManager.set as jest.Mock).mock.calls[0][2];
      expect(ttl).toBeGreaterThan(0);
    });
  });
});

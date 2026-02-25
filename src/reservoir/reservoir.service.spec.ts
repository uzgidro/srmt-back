import { ReservoirService } from './reservoir.service';
import { ReservoirEntity } from './reservoir.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';

describe('ReservoirService', () => {
  let service: ReservoirService;
  let repo: jest.Mocked<Repository<ReservoirEntity>>;
  let redisService: jest.Mocked<RedisService>;

  const mockReservoirs: ReservoirEntity[] = [
    Object.assign(new ReservoirEntity(2, 'B'), { position: 2, lat: '', lon: '', dailyValue: [] }),
    Object.assign(new ReservoirEntity(1, 'A'), { position: 1, lat: '', lon: '', dailyValue: [] }),
  ];

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([...mockReservoirs]),
      findOneByOrFail: jest.fn().mockResolvedValue(mockReservoirs[0]),
    } as any;

    redisService = {
      getReservoirList: jest.fn().mockImplementation(async (fn) => fn()),
      getReservoir: jest.fn().mockImplementation(async (_id, fn) => fn()),
    } as any;

    service = new ReservoirService(repo, redisService);
  });

  describe('findAll', () => {
    it('should return reservoirs sorted by position', async () => {
      const result = await service.findAll();
      expect(result[0].position).toBe(1);
      expect(result[1].position).toBe(2);
    });

    it('should use redis caching', async () => {
      await service.findAll();
      expect(redisService.getReservoirList).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should delegate to repo.findOneByOrFail through redis', async () => {
      const result = await service.findOne(2);
      expect(redisService.getReservoir).toHaveBeenCalledWith(2, expect.any(Function));
      expect(result).toEqual(mockReservoirs[0]);
    });

    it('should propagate error when not found', async () => {
      repo.findOneByOrFail.mockRejectedValue(new Error('not found'));
      await expect(service.findOne(999)).rejects.toThrow('not found');
    });
  });
});

import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ReservoirEntity } from '../reservoir/reservoir.entity';
import { StaticDto } from '../interfaces/static.response';

const RESERVOIRS_KEY = 'reservoirs';
const STATIC_KEY = 'static';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
  }

  async getReservoirList(resource: Promise<ReservoirEntity[]>) {
    let reservoirsFromCache = await this.cacheManager.get<ReservoirEntity[]>(RESERVOIRS_KEY);
    if (reservoirsFromCache) {
      return reservoirsFromCache;
    } else {
      const data = await resource;
      await this.cacheManager.set<ReservoirEntity[]>(RESERVOIRS_KEY, data);
      return data;
    }
  }

  async getReservoir(id: number, resource: Promise<ReservoirEntity>) {
    let reservoirFromCache = await this.cacheManager.get<ReservoirEntity>(RESERVOIRS_KEY + '/' + id);
    if (reservoirFromCache) {
      return reservoirFromCache;
    } else {
      const data = await resource;
      await this.cacheManager.set<ReservoirEntity>(RESERVOIRS_KEY + '/' + id, data);
      return data;
    }
  }

  async getDataFromStatic(resource: Promise<StaticDto[][]>) {
    let staticFromCache = await this.cacheManager.get<StaticDto[][]>(STATIC_KEY);
    if (staticFromCache) {
      return staticFromCache;
    } else {

      const now = new Date();
      const nextEvenHour = new Date();
      nextEvenHour.setHours(now.getHours() + (now.getHours() % 2 === 0 ? 2 : 1), 15, 0, 0);
      const timeUntilNextEvenHour = nextEvenHour.getTime() - now.getTime();

      const data = await resource;
      await this.cacheManager.set<StaticDto[][]>(STATIC_KEY, data, timeUntilNextEvenHour);
      return data;
    }
  }
}
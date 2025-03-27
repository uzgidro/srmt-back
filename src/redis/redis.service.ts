import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { StaticDto } from '../interfaces/static.response';
import { ReservoirEntity } from '../reservoir/reservoir.entity';
import { OperativeValueResponse } from '../interfaces/data.response';

const RESERVOIRS_KEY = 'reservoirs';
const STATIC_KEY = 'static';
const OPERATIVE_KEY = 'operative';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
  }

  async getReservoirList(resource: () => Promise<ReservoirEntity[]>) {
    let reservoirsFromCache = await this.cacheManager.get<ReservoirEntity[]>(RESERVOIRS_KEY);
    if (reservoirsFromCache) {
      return reservoirsFromCache;
    } else {
      const data = await resource();
      await this.cacheManager.set<ReservoirEntity[]>(RESERVOIRS_KEY, data);
      return data;
    }
  }

  async getReservoir(id: number, resource: () => Promise<ReservoirEntity>) {
    let reservoirFromCache = await this.cacheManager.get<ReservoirEntity>(RESERVOIRS_KEY + '/' + id);
    if (reservoirFromCache) {
      return reservoirFromCache;
    } else {
      const data = await resource();
      await this.cacheManager.set<ReservoirEntity>(RESERVOIRS_KEY + '/' + id, data);
      return data;
    }
  }

  async getDataFromStatic(resource: () => Promise<StaticDto[][]>) {
    let staticFromCache = await this.cacheManager.get<StaticDto[][]>(STATIC_KEY);
    if (staticFromCache) {
      return staticFromCache;
    } else {

      const now = new Date();
      const nextEvenHour = new Date();
      nextEvenHour.setHours(now.getHours() + (now.getHours() % 2 === 0 ? 2 : 1), 15, 0, 0);
      const timeUntilNextEvenHour = nextEvenHour.getTime() - now.getTime();

      const data = await resource();
      await this.cacheManager.set<StaticDto[][]>(STATIC_KEY, data, timeUntilNextEvenHour);
      return data;
    }
  }

  async getOperativeData(resource: () => Promise<OperativeValueResponse[]>) {
    let dataFromCache = await this.cacheManager.get<OperativeValueResponse[]>(OPERATIVE_KEY);
    if (dataFromCache) {
      return dataFromCache;
    } else {

      const now = new Date();
      const nextDayBegin = new Date();
      nextDayBegin.setDate(now.getDate() +1);
      nextDayBegin.setHours(8,0,0,0)
      const timeUntilNextDayBegin = nextDayBegin.getTime() - now.getTime();

      const data = await resource();
      await this.cacheManager.set<OperativeValueResponse[]>(OPERATIVE_KEY, data, timeUntilNextDayBegin);
      return data;
    }
  }
}
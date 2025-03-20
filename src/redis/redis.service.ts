import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

const RESERVOIRS_KEY = 'reservoirs';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
  }

  async getReservoirs(resource: Promise<ReservoirEntity[]>) {
    let reservoirsFromCache = await this.cacheManager.get<ReservoirEntity[]>(RESERVOIRS_KEY);
    if (reservoirsFromCache) {
      return reservoirsFromCache;
    } else {
      await this.cacheManager.set<ReservoirEntity[]>(RESERVOIRS_KEY, await resource);
      return resource;
    }
  }

  async getReservoir(id: number, resource: Promise<ReservoirEntity>) {
    let reservoirFromCache = await this.cacheManager.get<ReservoirEntity>(RESERVOIRS_KEY+'/'+id);
    if (reservoirFromCache) {
      return reservoirFromCache;
    } else {
      await this.cacheManager.set<ReservoirEntity>(RESERVOIRS_KEY+'/'+id, await resource);
      return resource;
    }
  }
}
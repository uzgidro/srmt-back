import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { StaticDto } from '../interfaces/static.response';
import { ReservoirEntity } from '../reservoir/reservoir.entity';
import { CategorisedValueResponse, OperativeValueResponse } from '../interfaces/data.response';
import * as dayjs from 'dayjs';

const RESERVOIRS_KEY = 'reservoirs';
const STATIC_KEY = 'static';
const OPERATIVE_KEY = 'operative';
const DECADE_KEY = 'decade';
const MONTH_KEY = 'month';
const YEAR_DECADE_KEY = 'year-decade';

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

      // timer to next even hour
      const timeUntilNextEvenHour = this.getTimeToNextEvenHour();

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
      const data = await resource();
      await this.cacheManager.set<OperativeValueResponse[]>(OPERATIVE_KEY, data, this.getTimeToNextDayBegin());
      return data;
    }
  }

  async getDecadeData(id: number, resource: () => Promise<CategorisedValueResponse>) {
    let dataFromCache = await this.cacheManager.get<CategorisedValueResponse>(DECADE_KEY + '/' + id);
    if (dataFromCache) {
      return dataFromCache;
    } else {
      const data = await resource();
      await this.cacheManager.set<CategorisedValueResponse>(DECADE_KEY + '/' + id, data, this.getTimeToNextDayBegin());
      return data;
    }
  }

  async getMonthData(id: number, resource: () => Promise<CategorisedValueResponse>) {
    let dataFromCache = await this.cacheManager.get<CategorisedValueResponse>(MONTH_KEY + '/' + id);
    if (dataFromCache) {
      return dataFromCache;
    } else {
      const data = await resource();
      await this.cacheManager.set<CategorisedValueResponse>(MONTH_KEY + '/' + id, data, this.getTimeToNextDayBegin());
      return data;
    }
  }

  async getYearDecadeData(id: number, resource: () => Promise<CategorisedValueResponse>) {
    let dataFromCache = await this.cacheManager.get<CategorisedValueResponse>(YEAR_DECADE_KEY + '/' + id);
    if (dataFromCache) {
      return dataFromCache;
    } else {
      const data = await resource();
      await this.cacheManager.set<CategorisedValueResponse>(YEAR_DECADE_KEY + '/' + id, data, this.getTimeToNextDecade());
      return data;
    }
  }


  // Private methods

  private getTimeToNextEvenHour(): number {
    const now = dayjs();
    const nextEvenHour = now.hour() % 2 === 0 ? now.add(2, 'hour') : now.add(1, 'hour');
    return nextEvenHour.minute(15).second(0).millisecond(0).diff(now);
  }

  private getTimeToNextDayBegin(): number {
    const now = dayjs();
    let nextDayBegin = now.hour() >= 8 ? now.add(1, 'day') : now;
    return nextDayBegin.hour(8).minute(0).second(0).millisecond(0).diff(now);
  }

  private getTimeToNextDecade(): number {
    const now = dayjs();
    let nextDecade: dayjs.Dayjs;
    if (now.date() < 11) {
      nextDecade = now.date(11);
    } else if (now.date() < 21) {
      nextDecade = now.date(21);
    } else {
      nextDecade = now.add(1, 'month').date(1);
    }
    return nextDecade.hour(6).minute(0).second(0).millisecond(0).diff(now);
  }

}
import { Injectable } from '@nestjs/common';
import { DailyValueEntity } from './daily-value.entity';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';
import { StaticDto } from '../interfaces/static.response';
import * as dayjs from 'dayjs';
import {
  CategorisedArrayResponse,
  CategorisedValueResponse,
  ComplexValueResponse,
  OperativeValueResponse,
  ReservoiredArrayResponse,
  ValueResponse,
} from '../interfaces/data.response';
import { RedisService } from '../redis/redis.service';
import { ReservoirEntity } from '../reservoir/reservoir.entity';
import { DailyValueRepository } from './daily-value.repository';

@Injectable()
export class DailyValueService {

  constructor(
    private repo: DailyValueRepository,
    private requestService: RequestService,
    private reservoirService: ReservoirService,
    private redisService: RedisService,
  ) {
  }

  async getCurrentDataByCategory(): Promise<CategorisedArrayResponse> {
    let rawData = await this.getDataFromStatic();
    let response: CategorisedArrayResponse = { income: [], release: [], level: [], volume: [] };
    rawData.forEach((data) => {
      response.income.push(this.setupComplexIncome(data));
      response.release.push(this.setupComplexRelease(data));
      response.level.push(this.setupComplexLevel(data));
      response.volume.push(this.setupComplexVolume(data));
    });
    return response;
  }

  async getCurrentDataByReservoir(): Promise<ReservoiredArrayResponse[]> {
    let rawData = await this.getDataFromStatic();

    return rawData.map((data) => ({
      reservoir: data[0].reservoir,
      income: this.setupComplexIncome(data),
      release: this.setupComplexRelease(data),
      level: this.setupComplexLevel(data),
      volume: this.setupComplexVolume(data),
    }));
  }

  async getOperativeData() {
    return this.redisService.getOperativeData(async () => {
      const today = dayjs();
      const dates = [
        today.subtract(1, 'day').format('YYYY-MM-DD'),
        today.subtract(2, 'day').format('YYYY-MM-DD'),
        today.subtract(1, 'year').format('YYYY-MM-DD'),
        today.subtract(2, 'year').format('YYYY-MM-DD'),
        today.subtract(3, 'year').format('YYYY-MM-DD'),
      ];

      const rawData = await this.getDataFromStatic();
      const currentData = rawData.map((data) => {
        return data.filter(value => value.time == 6).reverse()[0];
      });


      const reservoirs = await this.reservoirService.findAll();
      const promises: Promise<OperativeValueResponse>[] = [];

      for (let i = 0; i < reservoirs.length; i++) {
        promises.push(this.getDataForOperative(reservoirs[i], currentData[i], dates));
      }
      return Promise.all(promises);
    });
  }

  async getDecadeData(id: number) {
    return await this.redisService.getDecadeData(id, async () => {
      const now = dayjs();
      let startDate: dayjs.Dayjs;
      if (now.date() == 1) {
        startDate = now.subtract(1, 'month').date(21);
      } else if (now.date() < 12) {
        startDate = now.date(1);
      } else if (now.date() < 22) {
        startDate = now.date(11);
      } else {
        startDate = now.date(21);
      }

      const dailyValueEntities = await this.repo.getDataBetween(id, startDate, now);

      return this.getCategorisedValueResponse(this.formatDate(dailyValueEntities));
    });
  }

  async getMonthData(id: number) {
    return await this.redisService.getMonthData(id, async () => {
      const now = dayjs();
      const startDate = dayjs().set('date', 1).set('month', 0);

      const dailyValueEntities = await this.repo.getDataBetween(id, startDate, now);

      return this.getCategorisedValueResponse(this.formatDate(dailyValueEntities));
    });
  }

  async getYearsDecadeData(id: number): Promise<CategorisedValueResponse> {
    return await this.redisService.getYearDecadeData(id, async () => {
      const result = await this.repo.getYearsDecadeData(id);

      return this.getCategorisedValueResponse(result.map(item => {
        return {
          id: 0,
          reservoir: { id: item.reservoir_id, name: item.reservoir, dailyValue: [], lat: '', lon: '' },
          category: item.category,
          date: dayjs()
            .year(item.year)
            .month(item.month - 1)
            .date(item.decade * 10 + 1)
            .format('YYYY-MM-DD'),
          value: item.value,
        } satisfies DailyValueEntity;
      }));
    });
  }

  async getLastYearData(id: number) {
    return this.getSelectedYearData(id, dayjs().subtract(1, 'year').year());
  }

  async getSelectedYearData(id: number, year: number, category: string = 'income') {
    const monthlyData = await this.repo.getSelectedYearData(id, year, category);
    return {
      reservoir_id: id,
      reservoir: monthlyData[0].reservoir,
      data: monthlyData.map(item => {
          return {
            date: dayjs().year(year).month(item.month - 1).date(1).format('YYYY-MM-DD'),
            value: item.value,
          } satisfies ValueResponse;
        },
      ),
    } satisfies ComplexValueResponse;
  }

  //  Private methods //

  private async getDataFromStatic() {
    return this.redisService.getDataFromStatic(async () => {
      let reservoirs = await this.reservoirService.findAll();
      const promises: Promise<StaticDto[]>[] = [];

      for (let reservoir of reservoirs) {
        promises.push(this.requestService.fetchCurrentData(reservoir));
      }
      return Promise.all(promises);
    });
  }

  private getCategorisedValueResponse(data: DailyValueEntity[]) {
    const categories = this.separateByCategory(data);

    const response: CategorisedValueResponse = {
      income: {
        reservoir_id: data[0].reservoir.id,
        reservoir: data[0].reservoir.name,
        data: categories['income'],
      },
      release: {
        reservoir: data[0].reservoir.name,
        reservoir_id: data[0].reservoir.id,
        data: categories['release'],
      },
      level: {
        reservoir: data[0].reservoir.name,
        reservoir_id: data[0].reservoir.id,
        data: categories['level'],
      },
      volume: {
        reservoir: data[0].reservoir.name,
        reservoir_id: data[0].reservoir.id,
        data: categories['volume'],
      },

    };

    return response;
  }

  private async getDataForOperative(reservoir: ReservoirEntity, currentData: StaticDto, dates: string[]) {
    const operative: OperativeValueResponse = {
      name: reservoir.name,
      income: [{
        date: currentData.date,
        value: currentData.income,
      }],
      release: [{
        date: currentData.date,
        value: currentData.release,
      }],
      level: [{
        date: currentData.date,
        value: currentData.level,
      }],
      volume: [{
        date: currentData.date,
        value: currentData.volume,
      }],
    };
    const data = await this.repo.getDataInDates(reservoir, dates);

    const pastData = this.formatDate(data);
    const separatedData = this.separateByCategory(pastData);


    operative.income.push(...separatedData['income']);
    operative.release.push(...separatedData['release']);
    operative.level.push(...separatedData['level']);
    operative.volume.push(...separatedData['volume']);
    return operative;
  }

  private formatDate(data: DailyValueEntity[]): DailyValueEntity[] {
    return data.map((item) => ({
      ...item,
      date: dayjs(item.date).format('YYYY-MM-DD'),
    }));
  }

  private separateByCategory(data: DailyValueEntity[]): Record<string, ValueResponse[]> {
    return data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push({ date: item.date, value: item.value } satisfies ValueResponse);
      return acc;
    }, {} as Record<string, ValueResponse[]>);
  }

  private setupComplexIncome(data: StaticDto[]): ComplexValueResponse {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      data: data.reverse().map(value => {
        let date = new Date(value.date);
        date.setHours(value.time);
        return {
          value: value.income,
          date: dayjs(date).format('YYYY-MM-DD HH:00:00'),
        } satisfies ValueResponse;
      }),
    };
  }

  private setupComplexRelease(data: StaticDto[]): ComplexValueResponse {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      data: data.reverse().map(value => {
        let date = new Date(value.date);
        date.setHours(value.time);
        return {
          value: value.release,
          date: dayjs(date).format('YYYY-MM-DD HH:00:00'),
        } satisfies ValueResponse;
      }),
    };
  }

  private setupComplexLevel(data: StaticDto[]): ComplexValueResponse {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      data: data.reverse().map(value => {
        let date = new Date(value.date);
        date.setHours(value.time);
        return {
          value: value.level,
          date: dayjs(date).format('YYYY-MM-DD HH:00:00'),
        } satisfies ValueResponse;
      }),
    };
  }

  private setupComplexVolume(data: StaticDto[]): ComplexValueResponse {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      data: data.reverse().map(value => {
        let date = new Date(value.date);
        date.setHours(value.time);
        return {
          value: value.volume,
          date: dayjs(date).format('YYYY-MM-DD HH:00:00'),
        } satisfies ValueResponse;
      }),
    };
  }

}
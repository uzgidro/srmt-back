import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';
import { StaticDto } from '../interfaces/static.response';
import * as dayjs from 'dayjs';
import {
  CategorisedArrayResponse, CategorisedValueResponse,
  ComplexValueResponse,
  OperativeValueResponse,
  ReservoiredArrayResponse,
  ValueResponse,
} from '../interfaces/data.response';
import { RedisService } from '../redis/redis.service';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

@Injectable()
export class DailyValueService {

  constructor(
    @InjectRepository(DailyValueEntity)
    private repo: Repository<DailyValueEntity>,
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
      let date: number;
      if (now.date() < 12) {
        date = 1;
      } else if (now.date() < 22) {
        date = 11;
      } else {
        date = 21;
      }
      const startDate = dayjs().set('date', date);

      const dailyValueEntities = await this.repo.find({
        where: {
          reservoir: {
            id: id,
          },
          date: Between(startDate.format('YYYY-MM-DD'), now.format('YYYY-MM-DD'))
        },
        relations: {
          reservoir: true
        },
      });

      const data = this.separateByCategory(this.formatDate(dailyValueEntities))

      const response: CategorisedValueResponse = {
        income: {
          reservoir_id: dailyValueEntities[0].reservoir.id,
          reservoir: dailyValueEntities[0].reservoir.name,
          data: data['income']
        },
        release: {
          reservoir: dailyValueEntities[0].reservoir.name,
          reservoir_id: dailyValueEntities[0].reservoir.id,
          data: data['release']
        },
        level: {
          reservoir: dailyValueEntities[0].reservoir.name,
          reservoir_id: dailyValueEntities[0].reservoir.id,
          data: data['level']
        },
        volume: {
          reservoir: dailyValueEntities[0].reservoir.name,
          reservoir_id: dailyValueEntities[0].reservoir.id,
          data: data['volume']
        },

      }

      return response;
    })
  }

  async getMonthData(id: number) {
    const now = dayjs();
    const startDate = dayjs().set('date', 1).set('month', 0);

    const dailyValueEntities = await this.repo.find({
      where: {
        reservoir: {
          id: id,
        },
        date: Between(startDate.format('YYYY-MM-DD'), now.format('YYYY-MM-DD'))
      },
      relations: {
        reservoir: true
      },
    });

    const data = this.separateByCategory(this.formatDate(dailyValueEntities))

    const response: CategorisedValueResponse = {
      income: {
        reservoir_id: dailyValueEntities[0].reservoir.id,
        reservoir: dailyValueEntities[0].reservoir.name,
        data: data['income']
      },
      release: {
        reservoir: dailyValueEntities[0].reservoir.name,
        reservoir_id: dailyValueEntities[0].reservoir.id,
        data: data['release']
      },
      level: {
        reservoir: dailyValueEntities[0].reservoir.name,
        reservoir_id: dailyValueEntities[0].reservoir.id,
        data: data['level']
      },
      volume: {
        reservoir: dailyValueEntities[0].reservoir.name,
        reservoir_id: dailyValueEntities[0].reservoir.id,
        data: data['volume']
      },

    }

    return response;
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

  private async getDataForOperative(reservoirs: ReservoirEntity, currentData: StaticDto, dates: string[]) {
    const reservoir = reservoirs;
    const fetched = currentData;
    const operative: OperativeValueResponse = {
      name: reservoir.name,
      income: [{
        date: fetched.date,
        value: fetched.income,
      }],
      release: [{
        date: fetched.date,
        value: fetched.release,
      }],
      level: [{
        date: fetched.date,
        value: fetched.level,
      }],
      volume: [{
        date: fetched.date,
        value: fetched.volume,
      }],
    };
    const data = await this.repo.find({
      where: [
        {
          reservoir: reservoir,
          date: In(dates),
        },
      ],
      select: {
        category: true,
        value: true,
        date: true,
      },
      order: { date: 'DESC' },
    });

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
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';
import { StaticDto } from '../interfaces/static.response';
import * as dayjs from 'dayjs';
import {
  CategorisedArrayResponse,
  ComplexValueResponse,
  OperativeValueResponse,
  ReservoiredArrayResponse,
  ValueResponse,
} from '../interfaces/data.response';
import { RedisService } from '../redis/redis.service';

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
    const response: OperativeValueResponse[] = [];

    for (let i = 0; i < reservoirs.length; i++) {
      const reservoir = reservoirs[i];
      const fetched = currentData[i];
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

      response.push(operative);
    }

    return response;
  }

  //  Private methods //

  private async getDataFromStatic() {
    let reservoirs = await this.reservoirService.findAll();
    const promises: Promise<StaticDto[]>[] = [];

    for (let reservoir of reservoirs) {
      promises.push(this.requestService.fetchCurrentData(reservoir));
    }
    return this.redisService.getDataFromStatic(Promise.all(promises));
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
      data: data.map(value => {
        let date = new Date(value.date);
        date.setHours(value.time);
        return {
          value: value.income,
          date: date.toISOString(),
        } satisfies ValueResponse;
      }),
    };
  }

  private setupComplexRelease(data: StaticDto[]): ComplexValueResponse {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      data: data.map(value => {
        let date = new Date(value.date);
        date.setHours(value.time);
        return {
          value: value.release,
          date: date.toISOString(),
        } satisfies ValueResponse;
      }),
    };
  }

  private setupComplexLevel(data: StaticDto[]): ComplexValueResponse {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      data: data.map(value => {
        let date = new Date(value.date);
        date.setHours(value.time);
        return {
          value: value.level,
          date: date.toISOString(),
        } satisfies ValueResponse;
      }),
    };
  }

  private setupComplexVolume(data: StaticDto[]): ComplexValueResponse {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      data: data.map(value => {
        let date = new Date(value.date);
        date.setHours(value.time);
        return {
          value: value.volume,
          date: date.toISOString(),
        } satisfies ValueResponse;
      }),
    };
  }

}
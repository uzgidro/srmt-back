import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';
import { StaticDto } from '../interfaces/static.response';
import { CategorisedArrayResponse, ReservoiredArrayResponse, ValueResponse } from '../interfaces/data.response';

@Injectable()
export class DailyValueService {

  constructor(
    @InjectRepository(DailyValueEntity)
    private repo: Repository<DailyValueEntity>,
    private requestService: RequestService,
    private reservoirService: ReservoirService,
  ) {
  }

  async getCurrentDataByCategory() {
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

  async getCurrentDataByReservoir() {
    let rawData = await this.getDataFromStatic();

    return rawData.map((data) => ({
      reservoir: data[0].reservoir,
      income: this.setupComplexIncome(data),
      release: this.setupComplexRelease(data),
      level: this.setupComplexLevel(data),
      volume: this.setupComplexVolume(data),
    } satisfies ReservoiredArrayResponse));
  }

  private async getDataFromStatic() {
    let reservoirs = await this.reservoirService.findAll();
    const promises: Promise<StaticDto[]>[] = [];

    for (let reservoir of reservoirs) {
      promises.push(this.requestService.fetchCurrentData(reservoir));
    }
    return Promise.all(promises);
  }

  private setupComplexIncome(data: StaticDto[]) {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      category: 'income',
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

  private setupComplexRelease(data: StaticDto[]) {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      category: 'release',
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

  private setupComplexLevel(data: StaticDto[]) {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      category: 'level',
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

  private setupComplexVolume(data: StaticDto[]) {
    return {
      reservoir: data[0].reservoir.name,
      reservoir_id: data[0].reservoir.id,
      category: 'volume',
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
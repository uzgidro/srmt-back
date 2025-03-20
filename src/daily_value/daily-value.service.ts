import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';
import { StaticDto } from '../interfaces/static.response';
import { CategorisedArrayResponse, ValueResponse } from '../interfaces/data.response';

@Injectable()
export class DailyValueService {

  constructor(
    @InjectRepository(DailyValueEntity)
    private repo: Repository<DailyValueEntity>,
    private requestService: RequestService,
    private reservoirService: ReservoirService,
  ) {
  }

  async getCurrentData() {
    let reservoirs = await this.reservoirService.findAll();
    const promises: Promise<StaticDto[]>[] = [];
    let response: CategorisedArrayResponse = {income: [], release: [], level: [], volume: []}

    for (let reservoir of reservoirs) {
      promises.push(this.requestService.fetchCurrentData(reservoir))
    }
    let rawData = await Promise.all(promises);
    rawData.forEach((data) => {
      response.income.push({
        reservoir: data[0].reservoir,
        reservoir_id: data[0].reservoirId,
        category: 'income',
        data: data.map(value => this.setupValueResponse(value))
      })
      response.release.push({
        reservoir: data[0].reservoir,
        reservoir_id: data[0].reservoirId,
        category: 'release',
        data: data.map(value => this.setupValueResponse(value))
      })
      response.level.push({
        reservoir: data[0].reservoir,
        reservoir_id: data[0].reservoirId,
        category: 'level',
        data: data.map(value => this.setupValueResponse(value))
      })
      response.volume.push({
        reservoir: data[0].reservoir,
        reservoir_id: data[0].reservoirId,
        category: 'volume',
        data: data.map(value => this.setupValueResponse(value))
      })
    })

    return response;
  }

  private setupValueResponse(dto: StaticDto) {
    let date = new Date(dto.date)
    date.setHours(dto.time)
    return {
      value: dto.income,
      date: date.toISOString(),
    } satisfies ValueResponse
  }
}
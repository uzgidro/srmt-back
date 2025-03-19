import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';

@Injectable()
export class DailyValueService {

  constructor(
    @InjectRepository(DailyValueEntity)
    private repo: Repository<DailyValueEntity>,
    private requestService: RequestService,
    private reservoirService: ReservoirService,
  ) {
  }


  async updateData() {
    let reservoirs = await this.reservoirService.findAll();
    const lastDate = await this.repo.find({
      order: { date: 'DESC' },
      take: 1,
    }).then(value => value[0].date);

  }

  private async getDataForDb(id: number, date: string) {
    let staticDtos = await this.requestService.fetchLastData(id, date);
    const dataAtDayBegin = staticDtos.find(item => item.time == 6);
    let income: number;
    let release: number;
    let level: number;
    let volume: number;
    if (staticDtos.length == 0) {
      income = 0;
      release = 0;
      level = 0;
      volume = 0;
    } else if (dataAtDayBegin) {
      income = dataAtDayBegin.income;
      release = dataAtDayBegin.release;
      level = dataAtDayBegin.level;
      volume = dataAtDayBegin.volume;
    } else {
      const total = staticDtos.reduce(
        (acc, item) => {
          acc.income += item.income;
          acc.release += item.release;
          acc.level += item.level;
          acc.volume += item.volume;
          return acc;
        },
        { income: 0, release: 0, level: 0, volume: 0 },
      );

      const count = staticDtos.length;
      income = parseFloat((total.income / count).toFixed(2));
      release = parseFloat((total.release / count).toFixed(2));
      level = parseFloat((total.level / count).toFixed(2));
      volume = parseFloat((total.volume / count).toFixed(2));
    }

    return [
      new DailyValueEntity('income', date, income),
      new DailyValueEntity('release', date, release),
      new DailyValueEntity('level', date, level),
      new DailyValueEntity('volume', date, volume),
    ];
  }

  // async findAll() {
  //   return this.repo.find();
  // }
  //
  // async findOne(id: number) {
  //   return this.repo.findOneByOrFail({ id });
  // }
}
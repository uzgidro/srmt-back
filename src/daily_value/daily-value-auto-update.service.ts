import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { Repository } from 'typeorm';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

@Injectable()
export class DailyValueAutoUpdateService {

  constructor(
    @InjectRepository(DailyValueEntity)
    private repo: Repository<DailyValueEntity>,
    private requestService: RequestService,
    private reservoirService: ReservoirService,
  ) {
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateData() {
    let reservoirs = await this.reservoirService.findAll();
    const lastDate = await this.repo.find({
      order: { date: 'DESC' },
      take: 1,
    }).then(value => value[0].date);

    const dates = this.getDatesFromStartToToday(lastDate);

    const fetchPromises: Promise<DailyValueEntity[]>[] = [];

    for (const reservoir of reservoirs) {
      for (const date of dates) {
        fetchPromises.push(this.getDataForDb(reservoir, date));
      }
    }

    let fetchedData = await Promise.all(fetchPromises).then(value => value.flat(1));

    await this.repo.save(fetchedData);
  }

  private async getDataForDb(reservoir: ReservoirEntity, date: string) {
    let staticDtos = await this.requestService.fetchLastData(reservoir, date);
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
      new DailyValueEntity('income', date, income, reservoir),
      new DailyValueEntity('release', date, release, reservoir),
      new DailyValueEntity('level', date, level, reservoir),
      new DailyValueEntity('volume', date, volume, reservoir),
    ];
  }

  private getDatesFromStartToToday(startDateStr: string): string[] {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: string[] = [];

    if (startDate > today) {
      throw new Error('Something went wrong with date');
    }

    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    while (currentDate < today) {
      dates.push(formatter.format(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }
}
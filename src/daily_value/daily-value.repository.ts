import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { Between, In, Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

@Injectable()
export class DailyValueRepository {
  constructor(
    @InjectRepository(DailyValueEntity)
    private repo: Repository<DailyValueEntity>,
  ) {
  }

  async getDataBetween(id: number, start: dayjs.Dayjs, end: dayjs.Dayjs) {
    return this.repo.find({
      where: {
        reservoir: {
          id: id,
        },
        date: Between(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')),
      },
      relations: {
        reservoir: true,
      },
    });
  }

  async getDataInDates(reservoir: ReservoirEntity, dates: string[]) {
    return this.repo.find({
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
  }

  async getYearsDecadeData(id: number) {
    return this.repo
      .createQueryBuilder('dv')
      .select([
        'YEAR(dv.date) AS year',
        'MONTH(dv.date) AS month',
        `CASE 
        WHEN DAY(dv.date) = 31 THEN FLOOR((DAY(dv.date) - 2) / 10) 
        ELSE FLOOR((DAY(dv.date) - 1) / 10) 
       END AS decade`,
        'ROUND(AVG(dv.value)) AS value',
        'r.id as reservoir_id',
        'r.name AS reservoir',
        'dv.category as category',
        'dv.reservoir_id',
      ])
      .innerJoin('reservoirs', 'r', 'dv.reservoir_id = r.id')
      .where('dv.reservoir_id = :id', { id })
      .groupBy('year, month, decade, dv.category, dv.reservoir_id, reservoir')
      .orderBy('year', 'ASC')
      .getRawMany();
  }

  async getSelectedYearData(id: number, year: number, category: string = 'income') {
    return this.repo
      .createQueryBuilder('dv')
      .select([
        'MONTH(dv.date) AS month',
        'ROUND(SUM(dv.value)) AS value',
        'r.id as reservoir_id',
        'r.name AS reservoir',
        'dv.category as category',
        'dv.reservoir_id',
      ])
      .innerJoin('reservoirs', 'r', 'dv.reservoir_id = r.id')
      .where('dv.reservoir_id = :id', { id })
      .andWhere('YEAR(dv.date) = :year', { year })
      .andWhere('dv.category = :category', { category })
      .groupBy('month, dv.reservoir_id, reservoir, dv.category')
      .getRawMany();
  }
}
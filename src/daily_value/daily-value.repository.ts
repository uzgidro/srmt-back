import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { Between, DataSource, In, Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

@Injectable()
export class DailyValueRepository {
  constructor(
    @InjectRepository(DailyValueEntity)
    private repo: Repository<DailyValueEntity>,
    private dataSource: DataSource,
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

  async getExtremisYear(id: number, type: string, category: string = 'income') {
    const sortType = type === 'max' ? 'DESC' : 'ASC';

    const year = await this.repo
      .createQueryBuilder('dv')
      .select('YEAR(dv.date)', 'year')
      .addSelect('SUM(dv.value)', 'total')
      .where('dv.reservoir_id = :id', { id })
      .andWhere('YEAR(dv.date) != :currentYear', { currentYear: dayjs().year() })
      .andWhere('dv.category = :category', { category })
      .groupBy('YEAR(dv.date)')
      .orderBy('total', sortType)
      .getRawOne();

    if (!year) return {};

    return year.year;
  }

  async getAvgValues(id: number, category: string = 'income') {
    const subquery = this.repo
      .createQueryBuilder('dv')
      .select([
        'MONTH(dv.date) AS month',
        'YEAR(dv.date) AS year',
        'SUM(dv.value) AS total',
        'r.name AS reservoir',
        'dv.reservoir_id AS reservoir_id',
        'dv.category AS category',
      ])
      .innerJoin('reservoirs', 'r', 'dv.reservoir_id = r.id')
      .where('dv.reservoir_id = :id', { id })
      .andWhere('dv.category = :category', { category })
      .groupBy('year, month, reservoir, reservoir_id, category');

    return this.dataSource
      .createQueryBuilder()
      .select([
        'month',
        'ROUND(AVG(total)) AS value',
        'reservoir',
        'reservoir_id',
        'category',
      ])
      .from(`(${subquery.getQuery()})`, 'subquery')
      .setParameters(subquery.getParameters())
      .groupBy('month, reservoir, reservoir_id, category')
      .orderBy('month', 'ASC')
      .getRawMany();
  }
}
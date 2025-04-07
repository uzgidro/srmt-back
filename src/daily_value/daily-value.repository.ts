import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { Between, Brackets, DataSource, In, Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import { ReservoirEntity } from '../reservoir/reservoir.entity';
import { ComplexValueResponse, ValueResponse } from '../interfaces/data.response';

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
    const data = await this.repo
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

    return data.map(item => {
      return new DailyValueEntity(
        item.category, dayjs()
          .year(item.year)
          .month(item.month - 1)
          .date(item.decade * 10 + 1)
          .format('YYYY-MM-DD'), item.value, {
          id: item.reservoir_id,
          name: item.reservoir,
          dailyValue: [],
          lat: '',
          lon: '',
        },
      );
    });
  }

  async getSelectedYearData(id: number, year: number, category: string = 'income'): Promise<ComplexValueResponse> {
    const data = await this.repo
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

    return {
      reservoir_id: id,
      reservoir: data[0].reservoir,
      data: data.map(item => {
          return {
            date: dayjs().year(year).month(item.month - 1).date(1).format('YYYY-MM-DD'),
            value: item.value,
          } satisfies ValueResponse;
        },
      ),
    } satisfies ComplexValueResponse;
  }

  async getExtremisYear(id: number, type: string, category: string = 'income'): Promise<number> {
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

    if (!year) return -1;

    return year.year;
  }

  async getAvgValues(id: number, category: string = 'income'): Promise<ComplexValueResponse> {
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

    const data = await this.dataSource
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

    return {
      reservoir_id: id,
      reservoir: data[0].reservoir,
      data: data.map(item => {
        return {
          date: dayjs().year(2020).month(item.month - 1).date(1).format('YYYY-MM-DD'),
          value: item.value,
        } satisfies ValueResponse;
      }),
    } satisfies ComplexValueResponse;
  }

  async getTenYearsAvgValues(id: number, category: string = 'income'): Promise<ComplexValueResponse> {
    const upperYear = dayjs().subtract(1, 'year').year();
    const lowerYear = upperYear - 10;

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
      .andWhere('dv.date BETWEEN :lowerYearStart AND :upperYearEnd', {
        lowerYearStart: `${lowerYear}-01-01`,
        upperYearEnd: `${upperYear}-12-31`,
      })
      .andWhere('dv.category = :category', { category })
      .groupBy('year, month, reservoir, reservoir_id, category');

    const data = await this.dataSource
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

    return {
      reservoir_id: id,
      reservoir: data[0].reservoir,
      data: data.map(item => {
        return {
          date: dayjs().year(2020).month(item.month - 1).date(1).format('YYYY-MM-DD'),
          value: item.value,
        } satisfies ValueResponse;
      }),
    } satisfies ComplexValueResponse;
  }

  async getTotalValuesByYears(id: number, category: string = 'income'): Promise<ComplexValueResponse> {
    const data = await this.repo
      .createQueryBuilder('dv')
      .select([
        'YEAR(dv.date) AS year',
        'ROUND(SUM(dv.value)) AS value',
        'r.name AS reservoir',
        'dv.reservoir_id AS reservoir_id',
        'dv.category AS category',
      ])
      .innerJoin('reservoirs', 'r', 'dv.reservoir_id = r.id')
      .where('dv.reservoir_id = :id', { id })
      .andWhere('dv.category = :category', { category })
      .groupBy('year, reservoir, reservoir_id, category')
      .orderBy('year', 'ASC')
      .getRawMany();

    return {
      reservoir_id: id,
      reservoir: data[0].reservoir,
      data: data.map(item => {
        return {
          date: dayjs().year(item.year).month(0).date(1).format('YYYY-MM-DD'),
          value: item.value,
        } satisfies ValueResponse;
      }),
    } satisfies ComplexValueResponse;
  }

  async getSumUntilCurrentDecade(category: string = 'income'): Promise<ComplexValueResponse[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const currentDecade =
      currentDay <= 10 ? 1 : currentDay <= 20 ? 2 : 3;

    const qb = this.repo
      .createQueryBuilder('dv')
      .select('YEAR(dv.date)', 'year')
      .addSelect('SUM(dv.value)', 'total')
      .addSelect('dv.reservoir_id', 'reservoir_id')
      .addSelect('r.name', 'name')
      .andWhere('dv.category = :category', { category })
      .innerJoin('reservoirs', 'r', 'dv.reservoir_id = r.id');

    qb.andWhere(
      new Brackets((qb) => {
        qb.where('MONTH(dv.date) < :currentMonth', { currentMonth }).orWhere(
          new Brackets((qb2) => {
            qb2
              .where('MONTH(dv.date) = :currentMonth', { currentMonth })
              .andWhere(
                new Brackets((qb3) => {
                  if (currentDecade === 1) {
                    qb3.where('DAY(dv.date) <= 10');
                  } else if (currentDecade === 2) {
                    qb3.where('DAY(dv.date) <= 20');
                  } else {
                    qb3.where('1 = 1'); // all days of current month
                  }
                }),
              );
          }),
        );
      }),
    );

    qb.groupBy('YEAR(dv.date), reservoir_id, name').orderBy('year', 'ASC');

    let data = await qb.getRawMany();

    let reduce: Record<number, any> = data.reduce((acc, item) => {
      if (!acc[item.reservoir_id]) {
        acc[item.reservoir_id] = [];
      }
      acc[item.reservoir_id].push(item);
      return acc;
    }, {} as Record<number, any>);

    return Object.entries(reduce).map(([reservoir_id, items]) => ({
        reservoir_id: Number(reservoir_id),
        reservoir: items[0].name,
        data: items.map((item: { year: number; total: number; }) => ({
          date: dayjs().year(item.year).month(0).date(1).format('YYYY-MM-DD'),
          value: item.total,
        })),
      }
    ));
  }
}
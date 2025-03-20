import { ReservoirEntity } from '../reservoir/reservoir.entity';

export interface StaticResponse {
  id: number;
  id_wather: number;
  id_user: number;
  date: string;
  time: number;
  weather: string;
  level: number;
  size: number;
  to_come: string;
  to_out: number;
  gentle: number;
}

export class StaticDto {
  id: number;
  reservoir: ReservoirEntity;
  date: string;
  time: number;
  level: number;
  volume: number;
  income: number;
  release: number;

  constructor(data: StaticResponse, reservoir: ReservoirEntity) {
    this.id = data.id;
    this.reservoir = reservoir;
    this.date = data.date;
    this.time = data.time;
    this.level = data.level;
    this.volume = data.size > 30000 ? data.size / 1000 : data.size;
    this.income = parseFloat(data.to_come);
    this.release = data.to_out;
  }
}
import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DailyValueEntity } from '../daily_value/daily-value.entity';


@Entity({ name: 'reservoirs' })
export class ReservoirEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lat: string;

  @Column()
  lon: string;

  @OneToMany(type => DailyValueEntity, (dailyValue) => dailyValue.reservoir)
  dailyValue: DailyValueEntity[];
}

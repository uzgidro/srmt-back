import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DailyValueEntity } from '../daily_value/daily-value.entity';


@Entity({ name: 'reservoirs' })
export class ReservoirEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10 })
  lat: string;

  @Column({ type: 'decimal', precision: 10 })
  lon: string;

  @OneToMany(() => DailyValueEntity, (dailyValue) => dailyValue.reservoir)
  dailyValue: DailyValueEntity[];
}

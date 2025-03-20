import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReservoirEntity } from '../reservoir/reservoir.entity';


@Entity({ name: 'daily_values' })
export class DailyValueEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  category: string;

  @Column()
  date: string;

  @Column()
  value: number;

  @ManyToOne(() => ReservoirEntity, (reservoir) => reservoir.id)
  @JoinColumn({name: 'reservoir_id', referencedColumnName: 'id'})
  reservoir: ReservoirEntity;


  constructor(category: string, date: string, value: number, reservoir: ReservoirEntity) {
    this.category = category;
    this.date = date;
    this.value = value;
    this.reservoir = reservoir;
  }
}

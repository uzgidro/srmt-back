import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReservoirEntity } from '../reservoir/reservoir.entity';


@Entity({ name: 'daily-values' })
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
}

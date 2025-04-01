import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

@Entity({ name: 'level_volume'})
export class LevelVolumeEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  level: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  volume: number;

  @ManyToOne(() => ReservoirEntity, (reservoir) => reservoir.id)
  @JoinColumn({name: 'reservoir_id', referencedColumnName: 'id'})
  reservoir: ReservoirEntity;
}
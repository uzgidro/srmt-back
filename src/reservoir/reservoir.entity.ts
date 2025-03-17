import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


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
}

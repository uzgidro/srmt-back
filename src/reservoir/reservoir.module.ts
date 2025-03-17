import { Module } from '@nestjs/common';
import { ReservoirController } from './reservoir.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservoirService } from './reservoir.service';
import { ReservoirEntity } from './reservoir.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReservoirEntity])],
  controllers: [ReservoirController],
  providers: [ReservoirService],
  // exports: [TypeOrmModule]
})
export class ReservoirModule {
}
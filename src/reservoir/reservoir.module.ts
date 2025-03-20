import { Module } from '@nestjs/common';
import { ReservoirController } from './reservoir.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservoirService } from './reservoir.service';
import { ReservoirEntity } from './reservoir.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReservoirEntity]), RedisModule],
  controllers: [ReservoirController],
  providers: [ReservoirService],
  exports: [ReservoirService],
})
export class ReservoirModule {
}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { DailyValueService } from './daily-value.service';
import { DailyValueController } from './daily-value.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DailyValueEntity])],
  controllers: [DailyValueController],
  providers: [DailyValueService],
  // exports: [TypeOrmModule]
})
export class DailyValueModule {
}
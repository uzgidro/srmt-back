import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { DailyValueService } from './daily-value.service';
import { DailyValueController } from './daily-value.controller';
import { RequestModule } from '../request/request.module';
import { ReservoirModule } from '../reservoir/reservoir.module';
import { DailyValueAutoUpdateService } from './daily-value-auto-update.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyValueEntity]), RequestModule, ReservoirModule],
  controllers: [DailyValueController],
  providers: [DailyValueService, DailyValueAutoUpdateService],
  // exports: [TypeOrmModule]
})
export class DailyValueModule {
}
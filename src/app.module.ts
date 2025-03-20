import { Module } from '@nestjs/common';
import envModuleConfig from './config/env-module-config';
import mysqlModuleConfig from './config/mysql-module-config';
import redisModuleConfig from './config/redis-module-config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReservoirModule } from './reservoir/reservoir.module';
import { DailyValueModule } from './daily_value/daily-value.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    envModuleConfig,
    mysqlModuleConfig,
    redisModuleConfig,
    ScheduleModule.forRoot(),
    ReservoirModule,
    DailyValueModule,
    ReservoirModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    // cacheInterceptor,
    AppService,
  ],
})
export class AppModule {
}

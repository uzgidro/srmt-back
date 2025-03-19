import { Module } from '@nestjs/common';
import envModule from './config/env-module';
import mysqlModule from './config/mysql-module';
import cacheInterceptor from './config/cache-interceptor';
import redisModule from './config/redis-module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReservoirModule } from './reservoir/reservoir.module';
import { DailyValueModule } from './daily_value/daily-value.module';

@Module({
  imports: [
    envModule,
    mysqlModule,
    redisModule,
    ReservoirModule,
    DailyValueModule,
    ReservoirModule,
  ],
  controllers: [AppController],
  providers: [
    cacheInterceptor,
    AppService,
  ],
})
export class AppModule {
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as process from 'node:process';
import { ReservoirModule } from './reservoir/reservoir.module';

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: ['.env.development', '.env.production'],
    isGlobal: true,
  }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT!, 10) || 3306,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
    }),
    ReservoirModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    if (!process.env.DATABASE_HOST || !process.env.DATABASE_USERNAME || !process.env.DATABASE_PASSWORD || !process.env.DATABASE) {
      throw new Error('Необходимые переменные окружения не заданы!');
    }
  }
}

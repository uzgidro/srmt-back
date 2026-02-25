import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import { StaticDto, StaticResponse } from '../interfaces/static.response';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

const REQUEST_TIMEOUT = 30_000;

@Injectable()
export class RequestService {
  private readonly staticDateUrl: string;
  private readonly staticDailyUrl: string;
  private readonly requestLimit: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.staticDateUrl = this.configService.get<string>('api.staticDateUrl')!;
    this.staticDailyUrl = this.configService.get<string>('api.staticDailyUrl')!;
    this.requestLimit = this.configService.get<number>('api.requestLimit') || 13;
  }

  async fetchLastData(reservoir: ReservoirEntity, date: string) {
    return firstValueFrom(
      this.httpService.get<{ items: StaticResponse[] }>(this.staticDateUrl, {
        params: { id: reservoir.id, date: date },
        timeout: REQUEST_TIMEOUT,
      }).pipe(
        map(response => {
          return response.data.items.map(item => new StaticDto(item, reservoir));
        }),
        catchError((error: AxiosError) => {
          throw new HttpException(
            `Failed to fetch data for reservoir ${reservoir.id}: ${error.message}`,
            HttpStatus.BAD_GATEWAY,
          );
        }),
      ),
    );
  }

  async fetchCurrentData(reservoir: ReservoirEntity) {
    return firstValueFrom(
      this.httpService.get<{ items: StaticResponse[] }>(this.staticDailyUrl, {
        params: { id: reservoir.id, limit: this.requestLimit },
        timeout: REQUEST_TIMEOUT,
      }).pipe(
        map(response => {
          return response.data.items.map(item => new StaticDto(item, reservoir));
        }),
        catchError((error: AxiosError) => {
          throw new HttpException(
            `Failed to fetch current data for reservoir ${reservoir.id}: ${error.message}`,
            HttpStatus.BAD_GATEWAY,
          );
        }),
      ),
    );
  }
}

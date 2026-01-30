import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import { StaticDto, StaticResponse } from '../interfaces/static.response';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

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
        params: {
          id: reservoir.id, date: date
        }
      }).pipe(
        // transform to StaticDTO
        map(response => {
          return response.data.items.map(item => new StaticDto(item, reservoir));
        }),
        catchError((error: AxiosError) => {
          throw 'An error happened!';
        }),
      ),
    );
  }

  async fetchCurrentData(reservoir: ReservoirEntity) {
    return firstValueFrom(
      this.httpService.get<{ items: StaticResponse[] }>(this.staticDailyUrl, {
        params: {
          id: reservoir.id, limit: this.requestLimit
        }
      }).pipe(
        // transform to StaticDTO
        map(response => {
          return response.data.items.map(item => new StaticDto(item, reservoir));
        }),
        catchError((error: AxiosError) => {
          throw 'An error happened!';
        }),
      ),
    );
  }
}

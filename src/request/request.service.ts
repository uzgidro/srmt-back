import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import * as process from 'node:process';
import { StaticDto, StaticResponse } from '../interfaces/static.response';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

@Injectable()
export class RequestService {

  constructor(
    private readonly httpService: HttpService,
  ) {}

  async fetchLastData(reservoir: ReservoirEntity, date: string) {
    return firstValueFrom(
      this.httpService.get<{ items: StaticResponse[] }>(process.env.STATIC_DATE!, {
        params: {
          id: reservoir.id, date: date
        }
      }).pipe(
        // transform to StaticDTO
        map(response => {
          return response.data.items.map(item => new StaticDto(item, reservoir.name));
        }),
        catchError((error: AxiosError) => {
          throw 'An error happened!';
        }),
      ),
    );
  }

  async fetchCurrentData(reservoir: ReservoirEntity) {
    return firstValueFrom(
      this.httpService.get<{ items: StaticResponse[] }>(process.env.STATIC_DAILY!, {
        params: {
          id: reservoir.id, limit: 13
        }
      }).pipe(
        // transform to StaticDTO
        map(response => {
          return response.data.items.reverse().map(item => new StaticDto(item, reservoir.name));
        }),
        catchError((error: AxiosError) => {
          throw 'An error happened!';
        }),
      ),
    );
  }
}
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import * as process from 'node:process';
import { StaticDto, StaticResponse } from '../interfaces/static.response';

@Injectable()
export class RequestService {

  constructor(
    private readonly httpService: HttpService,
  ) {}

  async fetchLastData(id: number, date: string) {
    return firstValueFrom(
      this.httpService.get<{ items: StaticResponse[] }>(process.env.STATIC_DATE!, {
        params: {
          id: id, date: date
        }
      }).pipe(
        // transform to StaticDTO
        map(response => {
          return response.data.items.map(item => new StaticDto(item));
        }),
        catchError((error: AxiosError) => {
          throw 'An error happened!';
        }),
      ),
    );
  }

  // async getOhangaron() {
  //   const { data } = await firstValueFrom(
  //     this.httpService
  //       .get<string>(process.env, this.options)
  //       .pipe(
  //         catchError((error: AxiosError) => {
  //           throw 'An error happened!';
  //         }),
  //       ),
  //   );
  //   return data;
  // }
}
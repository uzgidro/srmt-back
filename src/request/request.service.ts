import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import * as process from 'node:process';

@Injectable()
export class RequestService {

  constructor(
    private readonly httpService: HttpService,
  ) {}

  async fetchLastData() {
    const { data } = await firstValueFrom(
      this.httpService.get<string>(process.env.STATIC_DATE!, {params: {
          id: 1, date: '2025-03-01'
        }}).pipe(
        catchError((error: AxiosError) => {
          throw 'An error happened!';
        }),
      ),
    );
    return data;
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
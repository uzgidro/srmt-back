import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {

  constructor(private readonly configService: ConfigService) {
  }

  getHello() {
    return this.configService.get<string>('HELLO');
  }
}

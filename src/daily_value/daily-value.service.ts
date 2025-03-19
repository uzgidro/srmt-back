import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { RequestService } from '../request/request.service';

@Injectable()
export class DailyValueService {

  constructor(
    @InjectRepository(DailyValueEntity)
    private repo: Repository<DailyValueEntity>,
    private requestService: RequestService
  ) {
  }

  async lol() {
    return this.requestService.fetchLastData()
  }

  // async findAll() {
  //   return this.repo.find();
  // }
  //
  // async findOne(id: number) {
  //   return this.repo.findOneByOrFail({ id });
  // }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyValueEntity } from './daily-value.entity';
import { RequestService } from '../request/request.service';
import { ReservoirService } from '../reservoir/reservoir.service';

@Injectable()
export class DailyValueService {

  constructor(
    @InjectRepository(DailyValueEntity)
    private repo: Repository<DailyValueEntity>,
    private requestService: RequestService,
    private reservoirService: ReservoirService,
  ) {
  }
}
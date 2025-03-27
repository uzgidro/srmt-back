import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservoirEntity } from './reservoir.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ReservoirService {

  constructor(
    @InjectRepository(ReservoirEntity)
    private repo: Repository<ReservoirEntity>,
    private redisService: RedisService,
  ) {
  }

  async findAll() {
    return this.redisService.getReservoirList(() => this.repo.find());
  }

  async findOne(id: number) {
    return this.redisService.getReservoir(id, () => this.repo.findOneByOrFail({ id }));
  }
}
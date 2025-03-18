import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservoirEntity } from './reservoir.entity';

@Injectable()
export class ReservoirService {

  constructor(
    @InjectRepository(ReservoirEntity)
    private reservoirRepository: Repository<ReservoirEntity>,
  ) {
  }

  async findAll() {
    return this.reservoirRepository.find();
  }

  async findOne(id: number) {
    return this.reservoirRepository.findOneByOrFail({ id });
  }
}
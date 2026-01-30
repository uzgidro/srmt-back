import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LevelVolumeEntity } from './level-volume.entity';

@Injectable()
export class LevelVolumeService {
  constructor(
    @InjectRepository(LevelVolumeEntity)
    private repo: Repository<LevelVolumeEntity>,
  ) {
  }

  async getLv(id: number) {
    return this.repo.find({
      select: {
        level: true,
        volume: true
      },
      where: {
        reservoir: {
          id: id,
        },
      },
      order: {
        level: 'ASC'
      },
    })
  }
}
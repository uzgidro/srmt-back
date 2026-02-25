import { Controller, Get, Param } from '@nestjs/common';
import { LevelVolumeService } from './level-volume.service';
import { IdParamDto } from '../interfaces/query.dto';

@Controller('lv')
export class LevelVolumeController {

  constructor(private readonly lvService: LevelVolumeService) {
  }
  @Get(':id')
  async getLv(@Param() params: IdParamDto) {
    return await this.lvService.getLv(params.id)
  }
}
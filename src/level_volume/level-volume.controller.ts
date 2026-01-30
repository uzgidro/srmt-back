import { Controller, Get, Param } from '@nestjs/common';
import { LevelVolumeService } from './level-volume.service';

@Controller('lv')
export class LevelVolumeController {

  constructor(private readonly lvService: LevelVolumeService) {
  }
  @Get(':id')
  async getLv(@Param('id') id: number) {
    return await this.lvService.getLv(id)
  }
}
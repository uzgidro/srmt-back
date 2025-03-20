import { Controller, Get } from '@nestjs/common';
import { DailyValueService } from './daily-value.service';

@Controller('value')
export class DailyValueController {

  constructor(private dailyValueService: DailyValueService) {
  }

  @Get()
  async getCurrentData() {
    return await this.dailyValueService.getCurrentData()
  }


  //
  // @CacheTTL(0)
  // @Get('list')
  // async getAll() {
  //   return await this.reservoirService.findAll();
  // }
  //
  // @CacheTTL(0)
  // @Get(':id')
  // async getOne(@Param('id') id: number) {
  //   try {
  //     return await this.reservoirService.findOne(id);
  //   } catch (e) {
  //     return new HttpException('Not found', HttpStatus.NOT_FOUND, { description: 'Cannot find reservoir with specified id' });
  //   }
  // }
}
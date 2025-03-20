import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { DailyValueService } from './daily-value.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('value')
@UseInterceptors(CacheInterceptor)
export class DailyValueController {

  constructor(private dailyValueService: DailyValueService) {
  }

  @CacheTTL(3600000)
  @Get('current')
  async getCurrentDataByCategory() {
    return await this.dailyValueService.getCurrentDataByCategory();
  }

  @CacheTTL(3600000)
  @Get('reservoir')
  async getCurrentDataByReservoir() {
    return await this.dailyValueService.getCurrentDataByReservoir();
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
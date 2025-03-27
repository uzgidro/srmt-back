import { Controller, Get, Param } from '@nestjs/common';
import { DailyValueService } from './daily-value.service';
import { DailyValueAutoUpdateService } from './daily-value-auto-update.service';

@Controller('value')
export class DailyValueController {

  constructor(private dailyValueService: DailyValueService, private auto: DailyValueAutoUpdateService) {
  }

  @Get('current')
  async getCurrentDataByCategory() {
    return await this.dailyValueService.getCurrentDataByCategory();
  }

  @Get('reservoir')
  async getCurrentDataByReservoir() {
    return await this.dailyValueService.getCurrentDataByReservoir();
  }

  @Get('operative')
  async getOperativeData() {
    return await this.dailyValueService.getOperativeData();
  }


  @Get(':id/decade')
  async getDecadeData(@Param('id') id: number) {
    return await this.dailyValueService.getDecadeData(id);
  }

  @Get('auto')
  async update() {
    return await this.auto.updateData();
  }
}
import { Controller, Get, Query } from '@nestjs/common';
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


  @Get('decade')
  async getDecadeData(@Query('id') id: number) {
    return await this.dailyValueService.getDecadeData(id);
  }

  @Get('year/decade')
  async getYearsDecadeData(@Query('id') id: number) {
    return await this.dailyValueService.getYearsDecadeData(id);
  }

  @Get('month')
  async getMonthData(@Query('id') id: number) {
    return await this.dailyValueService.getMonthData(id);
  }

  @Get('last-year')
  async getLastYearData(@Query('id') id: number) {
    return await this.dailyValueService.getLastYearData(id);
  }

  @Get('year')
  async getSelectedYearData(@Query('id') id: number, @Query('year') year: number) {
    return await this.dailyValueService.getSelectedYearData(id, year);
  }

  @Get('min')
  async getMinYearData(@Query('id') id: number) {
    return await this.dailyValueService.getMinYearData(id);
  }

  @Get('max')
  async getMaxYearData(@Query('id') id: number) {
    return await this.dailyValueService.getMaxYearData(id);
  }

  @Get('avg')
  async getAvgYearData(@Query('id') id: number) {
    return await this.dailyValueService.getAvgData(id);
  }

  @Get('auto')
  async update() {
    return await this.auto.updateData();
  }
}
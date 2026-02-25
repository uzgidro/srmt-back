import { Controller, Get, Query } from '@nestjs/common';
import { DailyValueService } from './daily-value.service';
import { DailyValueAutoUpdateService } from './daily-value-auto-update.service';
import { IdQueryDto, IdYearQueryDto } from '../interfaces/query.dto';

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
  async getDecadeData(@Query() query: IdQueryDto) {
    return await this.dailyValueService.getDecadeData(query.id);
  }

  @Get('decade/sum')
  async getSumUntilCurrentDecade() {
    return await this.dailyValueService.getSumUntilCurrentDecade();
  }

  @Get('year/decade')
  async getYearsDecadeData(@Query() query: IdQueryDto) {
    return await this.dailyValueService.getYearsDecadeData(query.id);
  }

  @Get('month')
  async getMonthData(@Query() query: IdQueryDto) {
    return await this.dailyValueService.getMonthData(query.id);
  }

  @Get('year')
  async getSelectedYearData(@Query() query: IdYearQueryDto) {
    return await this.dailyValueService.getSelectedYearData(query.id, query.year);
  }

  @Get('min')
  async getMinYearData(@Query() query: IdQueryDto) {
    return await this.dailyValueService.getMinYearData(query.id);
  }

  @Get('max')
  async getMaxYearData(@Query() query: IdQueryDto) {
    return await this.dailyValueService.getMaxYearData(query.id);
  }

  @Get('avg')
  async getAvgYearData(@Query() query: IdQueryDto) {
    return await this.dailyValueService.getAvgData(query.id);
  }

  @Get('ten-avg')
  async getTenYearsAvgData(@Query() query: IdQueryDto) {
    return await this.dailyValueService.getTenYearsAvgData(query.id);
  }

  @Get('years')
  async getTotalDataByTears(@Query() query: IdQueryDto) {
    return await this.dailyValueService.getTotalDataByYears(query.id)
  }

  @Get('auto')
  async update() {
    return await this.auto.updateData();
  }
}
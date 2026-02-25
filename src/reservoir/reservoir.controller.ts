import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ReservoirService } from './reservoir.service';
import { IdParamDto } from '../interfaces/query.dto';

@Controller('reservoir')
export class ReservoirController {

  constructor(private reservoirService: ReservoirService) {
  }

  @Get('list')
  async getAll() {
    return await this.reservoirService.findAll();
  }

  @Get(':id')
  async getOne(@Param() params: IdParamDto) {
    try {
      return await this.reservoirService.findOne(params.id);
    } catch (e) {
      throw new HttpException('Cannot find reservoir with specified id', HttpStatus.NOT_FOUND);
    }
  }
}
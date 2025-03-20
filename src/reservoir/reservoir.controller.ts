import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ReservoirService } from './reservoir.service';

@Controller('reservoir')
export class ReservoirController {

  constructor(private reservoirService: ReservoirService) {
  }

  @Get('list')
  async getAll() {
    return await this.reservoirService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number) {
    try {
      return await this.reservoirService.findOne(id);
    } catch (e) {
      return new HttpException('Not found', HttpStatus.NOT_FOUND, { description: 'Cannot find reservoir with specified id' });
    }
  }
}
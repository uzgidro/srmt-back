import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ReservoirService } from './reservoir.service';
import { CacheTTL } from '@nestjs/cache-manager';

@Controller('reservoir')
export class ReservoirController {

  constructor(private reservoirService: ReservoirService) {
  }

  @CacheTTL(0)
  @Get('list')
  async getAll() {
    return await this.reservoirService.findAll();
  }

  @CacheTTL(0)
  @Get(':id')
  async getOne(@Param('id') id: number) {
    try {
      return await this.reservoirService.findOne(id);
    } catch (e) {
      return new HttpException('Not found', HttpStatus.NOT_FOUND, { description: 'Cannot find reservoir with specified id' });
    }
  }
}
import { Controller, Get } from '@nestjs/common';
import { ReservoirService } from './reservoir.service';

@Controller('reservoir')
export class ReservoirController {

  constructor(private reservoirService: ReservoirService) {
  }

  @Get('/list')
  async getAll() {
    return await this.reservoirService.findAll();
  }
}
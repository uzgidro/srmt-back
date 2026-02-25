import { HttpException, HttpStatus } from '@nestjs/common';
import { ReservoirController } from './reservoir.controller';
import { ReservoirService } from './reservoir.service';
import { ReservoirEntity } from './reservoir.entity';

describe('ReservoirController', () => {
  let controller: ReservoirController;
  let service: jest.Mocked<ReservoirService>;

  const mockReservoirs: ReservoirEntity[] = [
    Object.assign(new ReservoirEntity(1, 'Res A'), { position: 1, lat: '41.0', lon: '69.0', dailyValue: [] }),
    Object.assign(new ReservoirEntity(2, 'Res B'), { position: 2, lat: '42.0', lon: '70.0', dailyValue: [] }),
  ];

  beforeEach(() => {
    service = {
      findAll: jest.fn().mockResolvedValue(mockReservoirs),
      findOne: jest.fn().mockResolvedValue(mockReservoirs[0]),
    } as any;
    controller = new ReservoirController(service);
  });

  describe('getAll', () => {
    it('should return all reservoirs', async () => {
      const result = await controller.getAll();
      expect(result).toEqual(mockReservoirs);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    it('should return a single reservoir', async () => {
      const result = await controller.getOne({ id: 1 });
      expect(result).toEqual(mockReservoirs[0]);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NOT_FOUND when reservoir does not exist', async () => {
      service.findOne.mockRejectedValue(new Error('not found'));
      await expect(controller.getOne({ id: 999 })).rejects.toThrow(HttpException);
      await expect(controller.getOne({ id: 999 })).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });
});

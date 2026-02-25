import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IdQueryDto, IdYearQueryDto, IdParamDto } from './query.dto';

describe('Query DTOs', () => {
  describe('IdQueryDto', () => {
    it('should pass with valid positive integer', async () => {
      const dto = plainToInstance(IdQueryDto, { id: '5' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.id).toBe(5);
    });

    it('should fail with negative id', async () => {
      const dto = plainToInstance(IdQueryDto, { id: '-1' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with zero id', async () => {
      const dto = plainToInstance(IdQueryDto, { id: '0' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with non-numeric id', async () => {
      const dto = plainToInstance(IdQueryDto, { id: 'abc' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with float id', async () => {
      const dto = plainToInstance(IdQueryDto, { id: '1.5' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IdYearQueryDto', () => {
    it('should pass with valid id and year', async () => {
      const dto = plainToInstance(IdYearQueryDto, { id: '1', year: '2024' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.id).toBe(1);
      expect(dto.year).toBe(2024);
    });

    it('should fail when year is missing', async () => {
      const dto = plainToInstance(IdYearQueryDto, { id: '1' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with negative year', async () => {
      const dto = plainToInstance(IdYearQueryDto, { id: '1', year: '-2024' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IdParamDto', () => {
    it('should pass with valid positive integer', async () => {
      const dto = plainToInstance(IdParamDto, { id: '10' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.id).toBe(10);
    });

    it('should fail with missing id', async () => {
      const dto = plainToInstance(IdParamDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

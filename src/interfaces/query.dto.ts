import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class IdQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id: number;
}

export class IdYearQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  year: number;
}

export class IdParamDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id: number;
}

import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { RequestService } from './request.service';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

describe('RequestService', () => {
  let service: RequestService;
  let httpService: jest.Mocked<HttpService>;
  let configService: Partial<ConfigService>;

  const reservoir = new ReservoirEntity(1, 'Test');

  const mockAxiosResponse = (items: any[]): AxiosResponse => ({
    data: { items },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

  beforeEach(() => {
    httpService = {
      get: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        const map: Record<string, any> = {
          'api.staticDateUrl': 'https://api.test/date',
          'api.staticDailyUrl': 'https://api.test/daily',
          'api.requestLimit': 10,
        };
        return map[key];
      }),
    };

    service = new RequestService(httpService, configService as ConfigService);
  });

  describe('fetchLastData', () => {
    it('should call staticDateUrl with correct params', async () => {
      const items = [{ id: 1, date: '2025-01-01', time: 6, level: 100, size: 500, to_come: '10', to_out: 5, id_wather: 1, id_user: 1, weather: '', gentle: 0 }];
      httpService.get.mockReturnValue(of(mockAxiosResponse(items)));

      const result = await service.fetchLastData(reservoir, '2025-01-01');
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.test/date',
        expect.objectContaining({
          params: { id: 1, date: '2025-01-01' },
          timeout: 30_000,
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].reservoir).toBe(reservoir);
    });

    it('should throw BAD_GATEWAY on HTTP error', async () => {
      const axiosError = new AxiosError('Network error');
      httpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.fetchLastData(reservoir, '2025-01-01'))
        .rejects
        .toThrow(HttpException);

      await expect(service.fetchLastData(reservoir, '2025-01-01'))
        .rejects
        .toMatchObject({ status: HttpStatus.BAD_GATEWAY });
    });
  });

  describe('fetchCurrentData', () => {
    it('should call staticDailyUrl with id and limit', async () => {
      httpService.get.mockReturnValue(of(mockAxiosResponse([])));

      await service.fetchCurrentData(reservoir);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.test/daily',
        expect.objectContaining({
          params: { id: 1, limit: 10 },
          timeout: 30_000,
        }),
      );
    });

    it('should return empty array when API returns no items', async () => {
      httpService.get.mockReturnValue(of(mockAxiosResponse([])));
      const result = await service.fetchCurrentData(reservoir);
      expect(result).toEqual([]);
    });

    it('should throw BAD_GATEWAY on error', async () => {
      httpService.get.mockReturnValue(throwError(() => new AxiosError('timeout')));
      await expect(service.fetchCurrentData(reservoir)).rejects.toThrow(HttpException);
    });
  });
});

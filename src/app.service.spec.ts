import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

describe('AppService', () => {
  let service: AppService;
  let configService: Partial<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('test-value'),
    };
    service = new AppService(configService as ConfigService);
  });

  it('should return HELLO config value', () => {
    const result = service.getHello();
    expect(result).toBe('test-value');
    expect(configService.get).toHaveBeenCalledWith('HELLO');
  });

  it('should return undefined when HELLO not set', () => {
    (configService.get as jest.Mock).mockReturnValue(undefined);
    expect(service.getHello()).toBeUndefined();
  });
});

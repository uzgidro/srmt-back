import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let appService: AppService;

  beforeEach(() => {
    appService = { getHello: jest.fn().mockReturnValue('hello') } as any;
    controller = new AppController(appService);
  });

  it('should delegate to appService.getHello', () => {
    const result = controller.getHello();
    expect(result).toBe('hello');
    expect(appService.getHello).toHaveBeenCalled();
  });
});

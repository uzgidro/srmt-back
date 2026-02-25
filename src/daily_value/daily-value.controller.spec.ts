import { DailyValueController } from './daily-value.controller';
import { DailyValueService } from './daily-value.service';
import { DailyValueAutoUpdateService } from './daily-value-auto-update.service';

describe('DailyValueController', () => {
  let controller: DailyValueController;
  let service: jest.Mocked<DailyValueService>;
  let autoService: jest.Mocked<DailyValueAutoUpdateService>;

  beforeEach(() => {
    service = {
      getCurrentDataByCategory: jest.fn().mockResolvedValue({ income: [], release: [], level: [], volume: [] }),
      getCurrentDataByReservoir: jest.fn().mockResolvedValue([]),
      getOperativeData: jest.fn().mockResolvedValue([]),
      getDecadeData: jest.fn().mockResolvedValue({}),
      getSumUntilCurrentDecade: jest.fn().mockResolvedValue({ avg: [], year: [] }),
      getYearsDecadeData: jest.fn().mockResolvedValue({}),
      getMonthData: jest.fn().mockResolvedValue({}),
      getSelectedYearData: jest.fn().mockResolvedValue({}),
      getMinYearData: jest.fn().mockResolvedValue({}),
      getMaxYearData: jest.fn().mockResolvedValue({}),
      getAvgData: jest.fn().mockResolvedValue({}),
      getTenYearsAvgData: jest.fn().mockResolvedValue({}),
      getTotalDataByYears: jest.fn().mockResolvedValue({}),
    } as any;
    autoService = { updateData: jest.fn().mockResolvedValue(undefined) } as any;
    controller = new DailyValueController(service, autoService);
  });

  it('getCurrentDataByCategory should delegate to service', async () => {
    await controller.getCurrentDataByCategory();
    expect(service.getCurrentDataByCategory).toHaveBeenCalled();
  });

  it('getCurrentDataByReservoir should delegate to service', async () => {
    await controller.getCurrentDataByReservoir();
    expect(service.getCurrentDataByReservoir).toHaveBeenCalled();
  });

  it('getOperativeData should delegate to service', async () => {
    await controller.getOperativeData();
    expect(service.getOperativeData).toHaveBeenCalled();
  });

  it('getDecadeData should pass id from query', async () => {
    await controller.getDecadeData({ id: 3 });
    expect(service.getDecadeData).toHaveBeenCalledWith(3);
  });

  it('getSumUntilCurrentDecade should delegate to service', async () => {
    await controller.getSumUntilCurrentDecade();
    expect(service.getSumUntilCurrentDecade).toHaveBeenCalled();
  });

  it('getYearsDecadeData should pass id from query', async () => {
    await controller.getYearsDecadeData({ id: 5 });
    expect(service.getYearsDecadeData).toHaveBeenCalledWith(5);
  });

  it('getMonthData should pass id from query', async () => {
    await controller.getMonthData({ id: 2 });
    expect(service.getMonthData).toHaveBeenCalledWith(2);
  });

  it('getSelectedYearData should pass id and year from query', async () => {
    await controller.getSelectedYearData({ id: 1, year: 2024 });
    expect(service.getSelectedYearData).toHaveBeenCalledWith(1, 2024);
  });

  it('getMinYearData should pass id from query', async () => {
    await controller.getMinYearData({ id: 4 });
    expect(service.getMinYearData).toHaveBeenCalledWith(4);
  });

  it('getMaxYearData should pass id from query', async () => {
    await controller.getMaxYearData({ id: 4 });
    expect(service.getMaxYearData).toHaveBeenCalledWith(4);
  });

  it('getAvgYearData should pass id from query', async () => {
    await controller.getAvgYearData({ id: 1 });
    expect(service.getAvgData).toHaveBeenCalledWith(1);
  });

  it('getTenYearsAvgData should pass id from query', async () => {
    await controller.getTenYearsAvgData({ id: 1 });
    expect(service.getTenYearsAvgData).toHaveBeenCalledWith(1);
  });

  it('getTotalDataByTears should pass id from query', async () => {
    await controller.getTotalDataByTears({ id: 1 });
    expect(service.getTotalDataByYears).toHaveBeenCalledWith(1);
  });

  it('update should trigger auto update', async () => {
    await controller.update();
    expect(autoService.updateData).toHaveBeenCalled();
  });
});

import { LevelVolumeController } from './level-volume.controller';
import { LevelVolumeService } from './level-volume.service';

describe('LevelVolumeController', () => {
  let controller: LevelVolumeController;
  let service: jest.Mocked<LevelVolumeService>;

  const mockData = [
    { level: 240.0, volume: 1000 },
    { level: 245.5, volume: 1500 },
  ];

  beforeEach(() => {
    service = { getLv: jest.fn().mockResolvedValue(mockData) } as any;
    controller = new LevelVolumeController(service);
  });

  it('should return level-volume data for reservoir', async () => {
    const result = await controller.getLv({ id: 1 });
    expect(result).toEqual(mockData);
    expect(service.getLv).toHaveBeenCalledWith(1);
  });
});

import { LevelVolumeService } from './level-volume.service';
import { Repository } from 'typeorm';
import { LevelVolumeEntity } from './level-volume.entity';

describe('LevelVolumeService', () => {
  let service: LevelVolumeService;
  let repo: jest.Mocked<Repository<LevelVolumeEntity>>;

  const mockData = [
    { level: 240.0, volume: 1000 },
    { level: 245.5, volume: 1500 },
  ];

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue(mockData),
    } as any;
    service = new LevelVolumeService(repo);
  });

  it('should query with correct where, select, and order', async () => {
    await service.getLv(5);
    expect(repo.find).toHaveBeenCalledWith({
      select: { level: true, volume: true },
      where: { reservoir: { id: 5 } },
      order: { level: 'ASC' },
    });
  });

  it('should return level-volume records', async () => {
    const result = await service.getLv(5);
    expect(result).toEqual(mockData);
  });

  it('should return empty array when no data', async () => {
    repo.find.mockResolvedValue([]);
    const result = await service.getLv(999);
    expect(result).toEqual([]);
  });
});

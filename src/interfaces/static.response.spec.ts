import { StaticDto, StaticResponse } from './static.response';
import { ReservoirEntity } from '../reservoir/reservoir.entity';

describe('StaticDto', () => {
  const reservoir = new ReservoirEntity(1, 'Test Reservoir');

  const makeResponse = (overrides: Partial<StaticResponse> = {}): StaticResponse => ({
    id: 100,
    id_wather: 1,
    id_user: 1,
    date: '2025-06-15',
    time: 6,
    weather: 'clear',
    level: 245.5,
    size: 1500,
    to_come: '120.5',
    to_out: 80,
    gentle: 0,
    ...overrides,
  });

  it('should map basic fields from StaticResponse', () => {
    const dto = new StaticDto(makeResponse(), reservoir);
    expect(dto.id).toBe(100);
    expect(dto.reservoir).toBe(reservoir);
    expect(dto.date).toBe('2025-06-15');
    expect(dto.time).toBe(6);
    expect(dto.level).toBe(245.5);
    expect(dto.release).toBe(80);
  });

  it('should keep volume as-is when size <= 30000', () => {
    const dto = new StaticDto(makeResponse({ size: 30000 }), reservoir);
    expect(dto.volume).toBe(30000);
  });

  it('should divide volume by 1000 when size > 30000', () => {
    const dto = new StaticDto(makeResponse({ size: 50000 }), reservoir);
    expect(dto.volume).toBe(50);
  });

  it('should parse to_come string to float for income', () => {
    const dto = new StaticDto(makeResponse({ to_come: '123.45' }), reservoir);
    expect(dto.income).toBe(123.45);
  });

  it('should handle NaN income gracefully', () => {
    const dto = new StaticDto(makeResponse({ to_come: 'invalid' }), reservoir);
    expect(dto.income).toBeNaN();
  });

  describe('response helpers', () => {
    let dto: StaticDto;

    beforeEach(() => {
      dto = new StaticDto(makeResponse({ time: 8 }), reservoir);
    });

    it('getIncomeResponse should format date with padded time', () => {
      const res = dto.getIncomeResponse();
      expect(res.value).toBe(dto.income);
      expect(res.date).toBe('2025-06-15 08:00:00');
    });

    it('getReleaseResponse should return release value', () => {
      const res = dto.getReleaseResponse();
      expect(res.value).toBe(dto.release);
      expect(res.date).toBe('2025-06-15 08:00:00');
    });

    it('getLevelResponse should return level value', () => {
      const res = dto.getLevelResponse();
      expect(res.value).toBe(dto.level);
    });

    it('getVolumeResponse should return volume value', () => {
      const res = dto.getVolumeResponse();
      expect(res.value).toBe(dto.volume);
    });

    it('should pad single-digit time with leading zero', () => {
      const dto2 = new StaticDto(makeResponse({ time: 6 }), reservoir);
      expect(dto2.getIncomeResponse().date).toBe('2025-06-15 06:00:00');
    });
  });
});

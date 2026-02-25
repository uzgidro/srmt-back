import { join } from 'path';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load config from default path', () => {
    process.env.CONFIG_PATH = join(__dirname, '..', '..', 'config', 'config.example.yaml');
    const configuration = require('./configuration').default;
    const config = configuration();
    expect(config).toHaveProperty('server');
    expect(config).toHaveProperty('database');
    expect(config).toHaveProperty('redis');
    expect(config).toHaveProperty('cache');
    expect(config).toHaveProperty('timing');
    expect(config).toHaveProperty('api');
    expect(config).toHaveProperty('business');
  });

  it('should throw when config file does not exist', () => {
    process.env.CONFIG_PATH = '/nonexistent/path/config.yaml';
    const configuration = require('./configuration').default;
    expect(() => configuration()).toThrow('Configuration file not found');
  });

  it('should validate required fields', () => {
    process.env.CONFIG_PATH = join(__dirname, '..', '..', 'config', 'config.example.yaml');
    const configuration = require('./configuration').default;
    const config = configuration();
    expect(config.server.port).toBeDefined();
    expect(config.database.host).toBeDefined();
    expect(config.database.username).toBeDefined();
    expect(config.database.password).toBeDefined();
    expect(config.database.database).toBeDefined();
    expect(config.redis.host).toBeDefined();
    expect(config.redis.port).toBeDefined();
    expect(config.api.staticDateUrl).toBeDefined();
    expect(config.api.staticDailyUrl).toBeDefined();
  });

  it('should use CONFIG_PATH env variable', () => {
    process.env.CONFIG_PATH = join(__dirname, '..', '..', 'config', 'config.example.yaml');
    const configuration = require('./configuration').default;
    const config = configuration();
    expect(config.server.port).toBe(3100);
  });
});

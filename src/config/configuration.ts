import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { AppConfig } from './config.interface';

export default (): AppConfig => {
  const configPath = process.env.CONFIG_PATH || join(process.cwd(), 'config', 'config.yaml');

  let fileContents: string;
  try {
    fileContents = readFileSync(configPath, 'utf8');
  } catch (error) {
    throw new Error(
      `Configuration file not found at ${configPath}. ` +
      `Set CONFIG_PATH environment variable or create config/config.yaml`,
    );
  }

  const config = yaml.load(fileContents) as AppConfig;

  // Validate required fields
  const requiredFields = [
    'server.port',
    'database.host',
    'database.username',
    'database.password',
    'database.database',
    'redis.host',
    'redis.port',
    'api.staticDateUrl',
    'api.staticDailyUrl',
  ];

  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config as any);
    if (value === undefined || value === null) {
      throw new Error(`Missing required configuration field: ${field}`);
    }
  }

  return config;
};

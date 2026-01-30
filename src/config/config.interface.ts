export interface ServerConfig {
  port: number;
  cors: {
    origins: string[];
    methods: string;
    credentials: boolean;
  };
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  logging: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface CacheConfig {
  ttl: number;
  lruSize: number;
}

export interface TimingConfig {
  dataStartHour: number;
  cacheRefreshHour: number;
  decadeDates: number[];
}

export interface ApiConfig {
  staticDateUrl: string;
  staticDailyUrl: string;
  requestLimit: number;
}

export interface BusinessConfig {
  volumeConversionThreshold: number;
}

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  cache: CacheConfig;
  timing: TimingConfig;
  api: ApiConfig;
  business: BusinessConfig;
}

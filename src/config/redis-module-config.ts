import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import { CacheableMemory } from 'cacheable';
import { createKeyv } from '@keyv/redis';

export default CacheModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  isGlobal: true,
  useFactory: async (configService: ConfigService) => {
    const redisHost = configService.get<string>('redis.host');
    const redisPort = configService.get<number>('redis.port');
    const redisPassword = configService.get<string>('redis.password');
    const redisDb = configService.get<number>('redis.db') ?? 0;
    const ttl = configService.get<number>('cache.ttl') || 120000;
    const lruSize = configService.get<number>('cache.lruSize') || 5000;

    // Build Redis URL with optional password
    let redisUrl = 'redis://';
    if (redisPassword) {
      redisUrl += `:${redisPassword}@`;
    }
    redisUrl += `${redisHost}:${redisPort}/${redisDb}`;

    return {
      stores: [
        new Keyv({
          deserialize: JSON.parse,
          serialize: JSON.stringify,
          store: new CacheableMemory({ ttl, lruSize }),
        }),
        createKeyv(redisUrl),
      ],
    };
  },
});

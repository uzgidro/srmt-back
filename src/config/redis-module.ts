import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import { CacheableMemory } from 'cacheable';
import { createKeyv } from '@keyv/redis';
import * as process from 'node:process';

export default CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async () => {
    return {
      stores: [
        new Keyv({
          deserialize: JSON.parse,
          serialize: JSON.stringify,
          store: new CacheableMemory({ ttl: 120000, lruSize: 5000 }),
        }),
        createKeyv(`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`),
      ],
    };
  },
})
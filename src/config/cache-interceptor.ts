import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor } from '@nestjs/cache-manager';

export default { provide: APP_INTERCEPTOR, useClass: CacheInterceptor }
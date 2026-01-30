import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('server.port') || 3100;
  const corsConfig = configService.get('server.cors');

  app.enableCors({
    origin: corsConfig?.origins || ['http://localhost:4200'],
    methods: corsConfig?.methods || 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: corsConfig?.credentials ?? true,
  });

  app.enableShutdownHooks();

  await app.listen(port);
}

bootstrap();

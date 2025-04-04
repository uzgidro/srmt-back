import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,});
  app.enableCors(
    {
      origin: 'https://srmt.speedwagon.uz',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },)
  await app.listen(process.env.PORT ?? 3100);
}

bootstrap();

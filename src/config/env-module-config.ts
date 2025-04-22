import { ConfigModule } from '@nestjs/config';

export default ConfigModule.forRoot({
  envFilePath: ['.env.development', '.env.production', '.env.docker'],
  isGlobal: true,
})
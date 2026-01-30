# Plan: Kubernetes-Ready Config + CI/CD

## Overview
Переход с .env файлов на единый YAML конфиг для Kubernetes deployment.

## Файлы для изменения

### Новые файлы
- `src/config/configuration.ts` - загрузчик YAML конфига
- `src/config/config.interface.ts` - TypeScript интерфейс конфига
- `src/health/health.controller.ts` - health endpoint для K8s probes
- `src/health/health.module.ts` - модуль health
- `config/config.example.yaml` - пример конфига для разработчиков

### Изменяемые файлы
- `src/main.ts` - CORS из конфига, порт из конфига, graceful shutdown
- `src/app.module.ts` - новый ConfigModule, HealthModule
- `src/config/env-module-config.ts` - заменить на YAML loader
- `src/config/mysql-module-config.ts` - читать из ConfigService
- `src/config/redis-module-config.ts` - TTL/LRU из конфига
- `src/redis/redis.service.ts` - timing параметры из конфига
- `src/daily_value/daily-value.service.ts` - DATA_START_HOUR из конфига
- `src/daily_value/daily-value-auto-update.service.ts` - час начала из конфига
- `src/request/request.service.ts` - API limit из конфига
- `Dockerfile` - убрать .env.docker, добавить config volume
- `srmt-back/base/deployment.yaml` - порт 3100, проверить config mount
- `.github/workflows/build.yaml` - адаптировать пути GitOps репо
- `package.json` - добавить js-yaml, @types/js-yaml
- `.gitignore` - добавить config/config.yaml

---

## Структура config.yaml

```yaml
server:
  port: 3100
  cors:
    origins:
      - http://localhost:4200
      - https://srmt.speedwagon.uz
    methods: GET,HEAD,PUT,PATCH,POST,DELETE
    credentials: true

database:
  host: localhost
  port: 3306
  username: root
  password: secret
  database: srmt
  logging: false

redis:
  host: localhost
  port: 6379

cache:
  ttl: 120000          # 2 minutes in ms
  lruSize: 5000

timing:
  dataStartHour: 6       # час начала данных
  cacheRefreshHour: 8    # час обновления кеша
  decadeDates: [11, 21]  # дни декад

api:
  staticDateUrl: https://...
  staticDailyUrl: https://...
  requestLimit: 13

business:
  volumeConversionThreshold: 30000
```

---

## Шаги реализации

### 1. Добавить зависимости
```bash
npm install js-yaml
npm install -D @types/js-yaml
```

### 2. Создать config.interface.ts
TypeScript интерфейс для типизации конфига с вложенной структурой.

### 3. Создать configuration.ts
YAML loader для @nestjs/config:
- Читает `CONFIG_PATH` env var или `./config/config.yaml`
- Парсит YAML через js-yaml
- Валидирует обязательные поля
- Бросает понятную ошибку если файл не найден

### 4. Обновить env-module-config.ts
Заменить на:
```typescript
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';

export default ConfigModule.forRoot({
  isGlobal: true,
  load: [configuration],
});
```

### 5. Обновить mysql-module-config.ts
Использовать `ConfigService.get('database.host')` и т.д.
Сделать async factory для инъекции ConfigService.

### 6. Обновить redis-module-config.ts
TTL и LRU size из `ConfigService.get('cache.ttl')`.

### 7. Обновить main.ts
```typescript
const configService = app.get(ConfigService);
const port = configService.get<number>('server.port');
const corsConfig = configService.get('server.cors');

app.enableCors({
  origin: corsConfig.origins,
  methods: corsConfig.methods,
  credentials: corsConfig.credentials,
});

// Graceful shutdown
app.enableShutdownHooks();

await app.listen(port);
```

### 8. Создать HealthModule
```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

### 9. Обновить redis.service.ts
Инъекция ConfigService, чтение timing параметров:
- `timing.dataStartHour`
- `timing.cacheRefreshHour`
- `timing.decadeDates`

### 10. Обновить Dockerfile
```dockerfile
FROM node:22.13.1-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.13.1-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev

# Config mount point
RUN mkdir -p /app/config

ENV NODE_ENV=production
EXPOSE 3100

CMD ["node", "dist/main.js"]
```

### 11. Обновить K8s манифесты

**srmt-back/base/deployment.yaml**:
```yaml
containers:
  - name: ac-integration
    ports:
      - name: http
        containerPort: 3100  # <-- исправить с 8080
    env:
      - name: CONFIG_PATH
        value: /app/config/config.yaml
    livenessProbe:
      httpGet:
        path: /health
        port: http          # <-- использовать named port
    readinessProbe:
      httpGet:
        path: /health
        port: http
```

**srmt-back/base/service.yaml** - без изменений:
- ClusterIP, port 80 -> targetPort http (3100)

**srmt-back/overlays/dev/service-nodeport.yaml** - без изменений:
- NodePort 30481 для внешнего доступа в dev

**srmt-back/overlays/prod/ingress.yaml** - без изменений:
- Ingress ac-integration.speedwagon.uz -> service:80

### 12. Обновить CI/CD
В `.github/workflows/build.yaml`:
- Проверить путь `apps/ac-integration/overlays/dev/kustomization.yaml`
- Возможно нужно `apps/srmt-back/...` в зависимости от структуры GitOps репо
- Убедиться что image name соответствует `ac-integration`

### 13. Создать config.example.yaml
Пример конфига с placeholder значениями для документации.

### 14. Обновить .gitignore
```
config/config.yaml
```

---

## Порядок выполнения

1. `npm install js-yaml && npm install -D @types/js-yaml`
2. Создать `src/config/config.interface.ts`
3. Создать `src/config/configuration.ts`
4. Создать `src/health/health.module.ts` и `health.controller.ts`
5. Обновить `src/config/env-module-config.ts`
6. Обновить `src/config/mysql-module-config.ts`
7. Обновить `src/config/redis-module-config.ts`
8. Обновить `src/app.module.ts`
9. Обновить `src/main.ts`
10. Обновить `src/redis/redis.service.ts`
11. Обновить `src/daily_value/daily-value.service.ts`
12. Обновить `src/daily_value/daily-value-auto-update.service.ts`
13. Обновить `src/request/request.service.ts`
14. Создать `config/config.example.yaml`
15. Обновить `.gitignore`
16. Обновить `Dockerfile`
17. Обновить `srmt-back/base/deployment.yaml`
18. Обновить `.github/workflows/build.yaml`

---

## Верификация

1. **Локально**:
   - Создать `config/config.yaml` из example
   - `npm run start:dev`
   - Проверить `http://localhost:3100/health`
   - Проверить основные эндпоинты

2. **Docker**:
   - `docker build -t test .`
   - `docker run -v $(pwd)/config:/app/config -p 3100:3100 test`
   - Проверить health endpoint

3. **K8s манифесты**:
   - `kubectl kustomize srmt-back/overlays/dev`
   - Проверить что deployment корректен

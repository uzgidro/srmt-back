# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm run build          # Build (nest build)
npm run start:dev      # Dev with hot-reload (--watch --env-file .env.development)
npm run start:prod     # Production (node dist/main --env-file .env.production)
npm run lint           # ESLint with auto-fix
npm run format         # Prettier
npm test               # Jest
npm run test:watch     # Jest watch mode
npm run test:cov       # Jest with coverage
npm run test:e2e       # E2E tests (jest --config ./test/jest-e2e.json)
```

App requires `config/config.yaml` at runtime (see `config/config.example.yaml` for template). Override path via `CONFIG_PATH` env variable.

## Architecture

NestJS 11 backend for water reservoir data management. MySQL + Redis + external API (`static.uz`).

### Module Dependency Graph

```
AppModule
├── ReservoirModule      → RedisModule, TypeORM
├── DailyValueModule     → RequestModule, ReservoirModule, RedisModule, TypeORM
├── LevelVolumeModule    → TypeORM
├── HealthModule
├── RedisModule          → @nestjs/cache-manager, @keyv/redis
└── RequestModule        → @nestjs/axios (external HTTP calls)
```

### API Routes

| Prefix       | Endpoints                                                       |
|--------------|-----------------------------------------------------------------|
| `/reservoir` | `GET /list`, `GET /:id`                                         |
| `/value`     | `GET /current`, `/reservoir`, `/operative`, `/decade`, `/decade/sum`, `/year/decade`, `/month`, `/year`, `/min`, `/max`, `/avg`, `/ten-avg`, `/years`, `/auto` |
| `/lv`        | `GET /:id`                                                      |
| `/health`    | `GET /`                                                         |

Query params `id` and `year` are validated via `IdQueryDto` / `IdYearQueryDto` (`src/interfaces/query.dto.ts`). Path param `id` uses `IdParamDto`.

### Key Patterns

- **Config**: YAML-based (`config/config.yaml`), loaded in `src/config/configuration.ts`, typed via `AppConfig` interface. All modules read config through NestJS `ConfigService`.
- **Caching**: Multi-tier (in-memory LRU + Redis) in `RedisService`. Smart TTL: cache expires at business-logic boundaries (even hours, decade dates, refresh hour).
- **Repository**: `DailyValueRepository` encapsulates complex TypeORM QueryBuilder aggregations (decade, yearly, average calculations). Other modules use standard TypeORM repos.
- **Auto-update**: `DailyValueAutoUpdateService` runs `@Cron(EVERY_DAY_AT_MIDNIGHT)`, fetches missing days from external API and persists to DB.
- **External API**: `RequestService` calls `static.uz` API with 30s timeout, returns `StaticDto[]`. Volume conversion threshold: values > 30000 are divided by 1000.
- **Validation**: Global `ValidationPipe` with `transform: true` and `whitelist: true` in `main.ts`.

### Database Entities

- **ReservoirEntity** — `reservoirs` table: id, name, lat, lon, position (sort order)
- **DailyValueEntity** — `daily_values` table: category (income/release/level/volume), date, value, reservoir_id (FK)
- **LevelVolumeEntity** — `level_volumes` table: level, volume, reservoir_id (FK)

### Decade Logic

Days 1–10 → decade 0, days 11–20 → decade 1, days 21+ → decade 2. Decade boundaries in config: `timing.decadeDates: [11, 21]`.

## CI/CD

- **deploy.yaml** — on push to main/master: build Docker image → Trivy scan (CRITICAL+HIGH block) → Watchtower trigger → GitOps k8s manifest update
- **promote.yaml** — manual workflow_dispatch: promote dev image to prod overlay in GitOps repo
- Docker image: `DOCKERHUB_USERNAME/srmt-back`, tagged with `github.sha`
- GitOps repo: `GitOps-Repo.git`, path `apps/srmt-back/overlays/{dev,prod}/kustomization.yaml`

## Docker

Multi-stage build. Runtime image runs as `USER node`, npm removed from production image. Config mounted at `/app/config`. Port 3100.

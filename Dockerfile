# Stage 1: build Nest app
FROM node:22.13.1-alpine AS builder

WORKDIR /app
COPY package*.json ./

RUN npm ci

COPY . .
RUN npm run build

# Stage 2: run app
FROM node:22.13.1-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package*.json ./

# 👇 Берём только продакшен-зависимости
RUN npm ci --omit=dev

# 👇 Указываем нужный env-файл
COPY .env.docker .env.docker

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]

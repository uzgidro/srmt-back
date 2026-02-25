# Stage 1: build Nest app
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./

RUN npm ci

COPY . .
RUN npm run build

# Stage 2: run app
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN npm ci --omit=dev

# Config mount point
RUN mkdir -p /app/config && chown node:node /app/config

ENV NODE_ENV=production
EXPOSE 3100

USER node

CMD ["node", "dist/main.js"]

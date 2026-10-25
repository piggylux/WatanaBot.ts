FROM node:26

# Dependencies are installed with bun to respect the lockfile, the bot runs on Node
COPY --from=oven/bun:1.4.3 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

COPY package.json bun.lockb prisma.config.ts ./
COPY src/prisma ./src/prisma

RUN bun install --frozen-lockfile --production

COPY . .

USER node

# exec makes Node the main process so it receives the stop signals
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node --import tsx src/index.ts"]

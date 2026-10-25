FROM node:26

WORKDIR /app

COPY package.json prisma.config.ts ./
COPY src/prisma ./src/prisma

RUN npm install

COPY . .

EXPOSE 8000
CMD npm start

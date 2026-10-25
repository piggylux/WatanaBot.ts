import * as fs from 'node:fs';

import { PrismaPg } from '@prisma/adapter-pg';
import { Client, GatewayIntentBits, HexColorString, REST } from 'discord.js';
import dotenv from 'dotenv';

import { PrismaClient } from '../prisma/generated/client';
import { Config } from '../types/config';

dotenv.config({ quiet: true });

function getConfig(): Config {
  if (fs.existsSync('config.json')) {
    return JSON.parse(fs.readFileSync('config.json', 'utf-8'));
  } else {
    return {
      token: process.env.TOKEN ?? '',
      clientId: process.env.CLIENT_ID ?? '',
      postgresDb: process.env.POSTGRES_DB ?? '',
      postgresPassword: process.env.POSTGRES_PASSWORD ?? '',
      postgresUser: process.env.POSTGRES_USER ?? '',
    };
  }
}

export const config: Config = getConfig();
export const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
});
export const rest = new REST().setToken(config.token);
export const prismaClient = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
export const PRIMARY_COLOR: HexColorString = '#5594D7';

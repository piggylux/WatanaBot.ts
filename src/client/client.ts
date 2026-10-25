import * as fs from 'node:fs';

import { PrismaPg } from '@prisma/adapter-pg';
import { Client, GatewayIntentBits, HexColorString, Partials, REST } from 'discord.js';
import dotenv from 'dotenv';

import { PrismaClient } from '../prisma/generated/client';
import { Config } from '../types/config';

dotenv.config({ quiet: true });

function getConfig(): Config {
  const config: Partial<Config> = fs.existsSync('config.json')
    ? JSON.parse(fs.readFileSync('config.json', 'utf-8'))
    : { token: process.env.TOKEN, clientId: process.env.CLIENT_ID };

  if (!config.token || !config.clientId) {
    throw new Error(
      'Missing token or clientId: set them in config.json or in the TOKEN and CLIENT_ID environment variables',
    );
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  return { token: config.token, clientId: config.clientId };
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
  // Receive uncached DMs and member removals for members missing from the cache
  partials: [Partials.Channel, Partials.GuildMember],
});
export const rest = new REST().setToken(config.token);
export const prismaClient = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
export const PRIMARY_COLOR: HexColorString = '#5594D7';

export async function shutdown() {
  await client.destroy();
  await prismaClient.$disconnect();
  process.exit(0);
}

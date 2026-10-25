import { CronJob } from 'cron';
import { Events } from 'discord.js';

import { client, config, shutdown } from './client/client';
import { handleClientReady } from './client/events/client-ready';
import { handleGuildMemberRemove } from './client/events/guild-member-remove';
import { handleInteractionCreate } from './client/events/interaction-create';
import { handleMessageCreate } from './client/events/message-create';
import { handlePresenceUpdate } from './client/events/presence-update';
import { checkBirthday } from './cronjobs/check-birthday';

// Logs event handler errors instead of crashing the process
function catchErrors<T extends unknown[]>(handler: (...args: T) => Promise<void>) {
  return (...args: T) => {
    handler(...args).catch(error => console.error(error));
  };
}

client.once(Events.ClientReady, catchErrors(handleClientReady));
client.on(Events.InteractionCreate, catchErrors(handleInteractionCreate));
client.on(Events.GuildMemberRemove, catchErrors(handleGuildMemberRemove));
client.on(Events.MessageCreate, catchErrors(handleMessageCreate));
client.on(Events.PresenceUpdate, catchErrors(handlePresenceUpdate));
// Unhandled client errors crash the process
client.on(Events.Error, error => console.error(error));

process.on('unhandledRejection', error => console.error(error));
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

client.login(config.token).catch(error => {
  console.error(error);
  process.exit(1);
});

// CronJobs
CronJob.from({
  cronTime: '0 0 * * *',
  onTick: async () => checkBirthday(),
  start: true,
  timeZone: 'Europe/Paris',
});

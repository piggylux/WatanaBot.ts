import { ActivityType, Presence } from 'discord.js';

import { retryableFetch } from '../utils';

export async function handlePresenceUpdate(_: Presence | null, newPresence: Presence) {
  if (!newPresence.guild || !newPresence.member) {
    return;
  }
  const isStreaming = newPresence.activities.some(
    activity => activity.type === ActivityType.Streaming,
  );
  const role = newPresence.guild.roles.cache.find(({ name }) => name === 'On Live');

  try {
    if (role) {
      if (isStreaming) {
        await retryableFetch(() => newPresence.member!.roles.add(role));
      } else {
        await retryableFetch(() => newPresence.member!.roles.remove(role));
      }
    }
  } catch (error: any) {
    console.error(error);
  }
}

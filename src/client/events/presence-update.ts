import { ActivityType, Presence } from 'discord.js';

import { retryableFetch } from '../utils';

export async function handlePresenceUpdate(_: Presence | null, newPresence: Presence) {
  const member = newPresence.member;
  if (!newPresence.guild || !member) {
    return;
  }
  const role = newPresence.guild.roles.cache.find(({ name }) => name === 'On Live');
  if (!role?.editable) {
    return;
  }

  const isStreaming = newPresence.activities.some(
    activity => activity.type === ActivityType.Streaming,
  );
  // Most presence updates (status, games, music...) do not change the streaming state
  if (isStreaming === member.roles.cache.has(role.id)) {
    return;
  }

  try {
    if (isStreaming) {
      await retryableFetch(() => member.roles.add(role));
    } else {
      await retryableFetch(() => member.roles.remove(role));
    }
  } catch (error: any) {
    console.error(error);
  }
}

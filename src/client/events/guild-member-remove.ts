import { GuildMember, PartialGuildMember } from 'discord.js';

import { prismaClient } from '../client';
import { createBotEmbed } from '../utils';

export async function handleGuildMemberRemove(member: GuildMember | PartialGuildMember) {
  const guild = await prismaClient.guilds.findUnique({
    where: { guildId: member.guild.id },
  });

  if (guild && guild.logsChannelId) {
    const channel = member.guild.channels.cache.get(guild.logsChannelId);
    if (channel?.isSendable()) {
      await channel.send({
        embeds: [createBotEmbed({ description: `${member.displayName} has left` })],
      });
    }
  }
}

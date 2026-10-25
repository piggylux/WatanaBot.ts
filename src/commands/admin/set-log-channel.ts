import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { prismaClient } from '../../client/client';

export async function setLogsChannel(interaction: ChatInputCommandInteraction<'cached'>) {
  if (interaction.options.getBoolean('clear')) {
    // updateMany does not throw when the guild has never been registered
    await prismaClient.guilds.updateMany({
      where: { guildId: interaction.guildId },
      data: { logsChannelId: null },
    });

    await interaction.reply({
      content: 'Logs channel has been cleared',
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  await prismaClient.guilds.upsert({
    create: { guildId: interaction.guildId, logsChannelId: interaction.channelId },
    update: { logsChannelId: interaction.channelId },
    where: { guildId: interaction.guildId },
  });

  await interaction.reply({
    content: 'Logs will be printed in this channel',
    flags: MessageFlags.Ephemeral,
  });
}

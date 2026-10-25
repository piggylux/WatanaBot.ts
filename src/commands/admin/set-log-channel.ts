import { ChatInputCommandInteraction } from 'discord.js';

import { prismaClient } from '../../client/client';

export async function setLogsChannel(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: 'This command cannot be run here',
      ephemeral: true,
    });
    return;
  }

  if (interaction.options.getBoolean('clear')) {
    await prismaClient.guilds.update({
      where: { guildId: interaction.guildId },
      data: { logsChannelId: null },
    });

    await interaction.reply({
      content: 'Logs channel has been cleared',
      ephemeral: true,
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
    ephemeral: true,
  });
}

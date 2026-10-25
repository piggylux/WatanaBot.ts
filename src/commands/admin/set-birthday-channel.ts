import { ChatInputCommandInteraction } from 'discord.js';

import { prismaClient } from '../../client/client';

export async function setBirthdayChannel(interaction: ChatInputCommandInteraction) {
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
      data: { birthdayChannelId: null },
    });

    await interaction.reply({
      content: 'Birthday wishes channel has been cleared',
      ephemeral: true,
    });

    return;
  }

  await prismaClient.guilds.upsert({
    create: { guildId: interaction.guildId, birthdayChannelId: interaction.channelId },
    update: { birthdayChannelId: interaction.channelId },
    where: { guildId: interaction.guildId },
  });

  await interaction.reply({
    content: 'Birthday wishes will be announced in this channel',
    ephemeral: true,
  });
}

import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { prismaClient } from '../../client/client';

export async function setBirthdayChannel(interaction: ChatInputCommandInteraction<'cached'>) {
  if (interaction.options.getBoolean('clear')) {
    // updateMany does not throw when the guild has never been registered
    await prismaClient.guilds.updateMany({
      where: { guildId: interaction.guildId },
      data: { birthdayChannelId: null },
    });

    await interaction.reply({
      content: 'Birthday wishes channel has been cleared',
      flags: MessageFlags.Ephemeral,
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
    flags: MessageFlags.Ephemeral,
  });
}

import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';

import { createBotEmbed } from '../../client/utils';
import { checkBirthday } from '../../cronjobs/check-birthday';
import { ReplyType } from '../../types/reply-type';

export async function check(interaction: ChatInputCommandInteraction<'cached'>) {
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      embeds: [
        createBotEmbed({
          description: "You don't have enough permissions to run the birthday check",
          replyType: ReplyType.ERROR,
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  await checkBirthday(interaction.guildId);
  await interaction.editReply({ embeds: [createBotEmbed({ description: 'Birthday check done' })] });
}

import { format, isValid } from 'date-fns';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { prismaClient } from '../../client/client';
import {
  createBotEmbed,
  getDefaultInteractionOptionMember,
  isBotOwner,
  parseBirthday,
} from '../../client/utils';
import { ReplyType } from '../../types/reply-type';

export async function set(interaction: ChatInputCommandInteraction<'cached'>) {
  const birthdayDay = interaction.options.getInteger('day', true);
  const birthdayMonth = interaction.options.getInteger('month', true);
  const birthday = parseBirthday(birthdayDay, birthdayMonth);

  // Date validation
  if (!isValid(birthday)) {
    await interaction.reply({
      embeds: [
        createBotEmbed({
          description: 'Invalid date',
          replyType: ReplyType.ERROR,
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member = getDefaultInteractionOptionMember(interaction, 'member');
  if (!member) {
    await interaction.reply({
      embeds: [
        createBotEmbed({
          description: 'This user is not a member of this server',
          replyType: ReplyType.ERROR,
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Permissions validation
  if (
    member.id !== interaction.user.id &&
    interaction.user.id !== interaction.guild.ownerId &&
    !(await isBotOwner(interaction))
  ) {
    await interaction.reply({
      embeds: [
        createBotEmbed({
          description: "You don't have enough permissions to set a birthday for another member",
          replyType: ReplyType.ERROR,
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await prismaClient.users.upsert({
    create: { userId: member.id, birthdayDay, birthdayMonth },
    update: { birthdayDay, birthdayMonth },
    where: { userId: member.id },
  });

  await interaction.reply({
    embeds: [
      createBotEmbed({
        description: `${member} birthday is set to the ${format(birthday, 'do')} of ${format(
          birthday,
          'LLLL',
        )}`,
      }),
    ],
    flags: MessageFlags.Ephemeral,
  });
}

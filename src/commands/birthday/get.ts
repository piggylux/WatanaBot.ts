import { format } from 'date-fns';
import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

import { PRIMARY_COLOR, prismaClient } from '../../client/client';
import {
  createBotEmbed,
  getDefaultInteractionOptionMember,
  parseBirthday,
} from '../../client/utils';
import { ReplyType } from '../../types/reply-type';

export async function get(interaction: ChatInputCommandInteraction<'cached'>) {
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

  const user = await prismaClient.users.findUnique({
    where: { userId: member.id },
  });
  if (user && user.birthdayMonth && user.birthdayDay) {
    const birthday = parseBirthday(user.birthdayDay, user.birthdayMonth);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: member.displayName,
            iconURL: member.user.displayAvatarURL({ size: 32 }),
          })
          .setDescription(`🎂 ${format(birthday, 'do')} of ${format(birthday, 'LLLL')}`)
          .setColor(PRIMARY_COLOR),
      ],
    });
  } else {
    await interaction.reply({
      content: `${member.displayName} has not set their birthday`,
    });
  }
}

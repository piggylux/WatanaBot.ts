import { format } from 'date-fns';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { chunk, groupBy } from 'lodash';

import { PRIMARY_COLOR, prismaClient } from '../../client/client';
import { fetchGuildMembers, parseBirthday } from '../../client/utils';

export async function month(interaction: ChatInputCommandInteraction<'cached'>) {
  const birthdayMonth = interaction.options.getInteger('month') ?? new Date().getUTCMonth() + 1;

  // Fetching guild members can take longer than the 3 seconds allowed to reply
  await interaction.deferReply();

  const users = await prismaClient.users.findMany({
    where: { birthdayMonth, birthdayDay: { not: null } },
    select: { userId: true, birthdayDay: true },
    orderBy: { birthdayDay: 'asc' },
  });

  // Guild members among the selected users in database
  const members = await fetchGuildMembers(
    interaction.guild,
    users.map(({ userId }) => userId),
  );

  const fields = Object.entries(
    groupBy(
      users.filter(({ userId }) => members.has(userId)),
      ({ birthdayDay }) => birthdayDay,
    ),
  ).map(([day, birthdayUsers]) => ({
    name: `🎂 ${format(parseBirthday(Number(day), birthdayMonth), 'dd/MM')}`,
    value: birthdayUsers.map(({ userId }) => `${members.get(userId)}`).join('\n'),
  }));

  // An embed holds at most 25 fields
  const [firstFields = [], ...otherFields] = chunk(fields, 25);
  const embeds = [
    new EmbedBuilder()
      .setColor(PRIMARY_COLOR)
      .setTitle(`Birthdays in ${format(parseBirthday(1, birthdayMonth), 'LLLL')}`)
      .addFields(firstFields),
    ...otherFields.map(dayFields =>
      new EmbedBuilder().setColor(PRIMARY_COLOR).addFields(dayFields),
    ),
  ];

  await interaction.editReply({ embeds });
}

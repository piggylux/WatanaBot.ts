import { format } from 'date-fns';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { groupBy } from 'lodash';

import { PRIMARY_COLOR, prismaClient } from '../../client/client';
import { chunkLines } from '../../client/message-utils';
import { replyWithEmbedPages } from '../../client/paginated-reply';
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
  ).flatMap(([day, birthdayUsers]) =>
    chunkLines(
      birthdayUsers.map(({ userId }) => `${members.get(userId)}`),
      1024,
    ).map(value => ({
      name: `🎂 ${format(parseBirthday(Number(day), birthdayMonth), 'dd/MM')}`,
      value,
    })),
  );

  const createEmbed = () =>
    new EmbedBuilder()
      .setColor(PRIMARY_COLOR)
      .setTitle(`Birthdays in ${format(parseBirthday(1, birthdayMonth), 'LLLL')}`);
  let embed = createEmbed();
  const embeds = [embed];

  // Each page must respect the 25-field and 6000-character embed limits.
  for (const field of fields) {
    if (
      embed.data.fields?.length === 25 ||
      embed.length + field.name.length + field.value.length > 6000
    ) {
      embed = createEmbed();
      embeds.push(embed);
    }
    embed.addFields(field);
  }

  await replyWithEmbedPages(interaction, embeds);
}

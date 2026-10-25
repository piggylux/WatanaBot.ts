import { isLeapYear } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { EmbedBuilder } from 'discord.js';

import { client, PRIMARY_COLOR, prismaClient } from '../client/client';
import { fetchGuildMembers, getYousoro } from '../client/utils';
import { guilds } from '../prisma/generated/client';

/**
 * Announces today's birthdays in every registered guild, or only in the given guild
 */
export async function checkBirthday(guildId?: string) {
  const start = new Date();
  const today = toZonedTime(new Date(), 'Europe/Paris');
  const birthdayMonth = today.getMonth() + 1;
  const birthdayDays = [today.getDate()];
  // February 29 birthdays are celebrated on February 28 in non-leap years
  if (birthdayMonth === 2 && today.getDate() === 28 && !isLeapYear(today)) {
    birthdayDays.push(29);
  }

  const users = await prismaClient.users.findMany({
    where: { birthdayMonth, birthdayDay: { in: birthdayDays } },
  });

  const guildsInDb = await prismaClient.guilds.findMany({
    where: { guildId, NOT: { birthdayChannelId: null } },
  });
  const getUsersTime = new Date().getTime() - start.getTime();

  for (const guildInDb of guildsInDb) {
    // A failing guild must not prevent the announcements in the next ones
    try {
      await announceBirthdays(
        guildInDb,
        users.map(({ userId }) => userId),
        getUsersTime,
      );
    } catch (error) {
      console.error(`Birthday check failed for guild ${guildInDb.guildId}`, error);
    }
  }
}

async function announceBirthdays(guildInDb: guilds, userIds: string[], getUsersTime: number) {
  const start = new Date();
  const guild = client.guilds.cache.get(guildInDb.guildId);

  if (!guild) {
    return;
  }

  // Members are not all cached, offline ones would be missed
  const members = userIds.length > 0 ? await fetchGuildMembers(guild, userIds) : null;
  if (members?.size) {
    const channel = guild.channels.cache.get(guildInDb.birthdayChannelId!);
    if (channel?.isSendable()) {
      await channel.send({
        content: `Happy Birthday ${getYousoro(guild)} 🎂\n${members.map(String).join('\n')}`,
      });
    }
  }

  if (guildInDb.logsChannelId) {
    const logChannel = guild.channels.cache.get(guildInDb.logsChannelId);
    if (logChannel?.isSendable()) {
      const embed = new EmbedBuilder().setColor(PRIMARY_COLOR).addFields({
        name: "Check members' birthday",
        value: `${new Date().getTime() - start.getTime() + getUsersTime}ms`,
      });
      await logChannel.send({ embeds: [embed] });
    }
  }
}

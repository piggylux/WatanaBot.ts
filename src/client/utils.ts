import { parse } from 'date-fns';
import {
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Guild,
  GuildMember,
  Team,
} from 'discord.js';
import { chunk } from 'lodash';

import { ReplyType } from '../types/reply-type';
import { PRIMARY_COLOR } from './client';

export function getYousoro(guild: Guild | null): string {
  const emoji = guild ? guild.emojis.cache.find(({ name }) => name === 'yousoro') : null;
  return `${emoji ?? '(> ᴗ •)ゞ'}`;
}

/**
 * Returns the member given in the option, or the interaction member when the option is not set.
 * Returns null when the given user is not a member of the guild.
 */
export function getDefaultInteractionOptionMember(
  interaction: ChatInputCommandInteraction<'cached'>,
  field: string,
): GuildMember | null {
  return interaction.options.getUser(field)
    ? interaction.options.getMember(field)
    : interaction.member;
}

export async function isBotOwner(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const { owner } = await interaction.client.application.fetch();
  if (owner instanceof Team) {
    return owner.members.has(interaction.user.id);
  }
  return owner?.id === interaction.user.id;
}

// Leap year reference so that February 29 is always a valid birthday
export function parseBirthday(day: number, month: number): Date {
  return parse(`${day} ${month}`, 'd M', new Date(2000, 0, 1));
}

export async function fetchGuildMembers(
  guild: Guild,
  userIds: string[],
): Promise<Collection<string, GuildMember>> {
  let members = new Collection<string, GuildMember>();
  // Discord accepts at most 100 user IDs per guild members request
  for (const user of chunk(userIds, 100)) {
    members = members.concat(await guild.members.fetch({ user }));
  }
  return members;
}

export function createBotEmbed(params: {
  description: string;
  replyType?: ReplyType;
}): EmbedBuilder {
  const embed = new EmbedBuilder().setDescription(params.description);

  switch (params.replyType) {
    case ReplyType.ERROR:
      embed.setAuthor({ name: '! Error' });
      embed.setColor(Colors.Red);
      embed.setFooter({ text: 'report issue at https://github.com/Sylux6/WatanaBot.ts/issues' });
      break;
    case ReplyType.WARNING:
      embed.setAuthor({ name: '! Warning' });
      embed.setColor(Colors.Yellow);
      break;
    default:
      embed.setColor(PRIMARY_COLOR);
  }

  return embed;
}

export async function retryableFetch<T>(fetchFunction: () => Promise<T>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchFunction();
    } catch (error: any) {
      if (error.code === 'UND_ERR_CONNECT_TIMEOUT' && i < retries - 1) {
        console.warn(`Timeout error encountered. Retrying (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
}

import { PermissionFlagsBits } from 'discord-api-types/v10';
import { ChatInputCommandInteraction } from 'discord.js';

import { checkBirthday } from '../../cronjobs/check-birthday';

export async function check(interaction: ChatInputCommandInteraction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await checkBirthday();
  }
}

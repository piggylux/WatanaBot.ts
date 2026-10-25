import { ChatInputCommandInteraction } from 'discord.js';

import { createBotEmbed } from '../../client/utils';
import { SlashCommand } from '../../types/slash-command';

export class RollCommand extends SlashCommand {
  name = 'roll';
  description = 'Roll a random number between 1 and 100';

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({
      embeds: [createBotEmbed({ description: `${Math.floor(Math.random() * 100) + 1}` })],
    });
  }
}

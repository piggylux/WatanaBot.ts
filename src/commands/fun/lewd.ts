import * as path from 'node:path';

import { ChatInputCommandInteraction } from 'discord.js';

import { SlashCommand } from '../../types/slash-command';

export class LewdCommand extends SlashCommand {
  name = 'lewd';
  description = "I'm not LEWD!";

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({ files: [path.join(__dirname, '../../assets/notlewd.jpg')] });
  }
}

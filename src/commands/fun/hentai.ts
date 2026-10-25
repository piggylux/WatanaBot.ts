import * as path from 'node:path';

import { ChatInputCommandInteraction } from 'discord.js';

import { SlashCommand } from '../../types/slash-command';

export class HentaiCommand extends SlashCommand {
  name = 'hentai';
  description = "I'm not HENTAI!";

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({
      files: [path.join(__dirname, '../../assets/nothentai.jpg')],
    });
  }
}

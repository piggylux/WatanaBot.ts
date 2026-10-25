import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

import { getDefaultInteractionOptionMember } from '../../client/utils';
import { SlashCommand } from '../../types/slash-command';

export class AvatarCommand extends SlashCommand {
  name = 'avatar';
  description = 'Get avatar from a member';

  constructor() {
    super();
    this.addUserOption(option =>
      option.setName('member').setDescription('The member to get the avatar'),
    );
    this.addBooleanOption(option =>
      option.setName('original').setDescription('Get the original profile avatar'),
    );
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('member') ?? interaction.user;
    // Null outside of guilds or when the user is not a member, the user avatar is used instead
    const member = interaction.inCachedGuild()
      ? getDefaultInteractionOptionMember(interaction, 'member')
      : null;
    const original = interaction.options.getBoolean('original');

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`${member ?? user}`)
          .setImage((original || !member ? user : member).displayAvatarURL({ size: 4096 })),
      ],
    });
  }
}

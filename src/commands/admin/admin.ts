import { MessageFlags, PermissionFlagsBits } from 'discord.js';

import { shutdown } from '../../client/client';
import { createBotEmbed, isBotOwner } from '../../client/utils';
import { ReplyType } from '../../types/reply-type';
import { SlashCommandGroup } from '../../types/slash-command-group';
import { setBirthdayChannel } from './set-birthday-channel';
import { setLogsChannel } from './set-log-channel';

export class AdminCommand extends SlashCommandGroup {
  name = 'admin';
  description = 'Admin commands';

  constructor() {
    super();

    this.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    this.addSlashSubcommand(
      subCommand => subCommand.setName('shutdown').setDescription('Shutdown Watanabot'),
      async interaction => {
        // Shutting down affects every guild, so only the bot owner is allowed to
        if (!(await isBotOwner(interaction))) {
          await interaction.reply({
            embeds: [
              createBotEmbed({
                description: 'Only the bot owner can shut me down',
                replyType: ReplyType.ERROR,
              }),
            ],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await interaction.reply({ content: 'Shutting down...', flags: MessageFlags.Ephemeral });
        await shutdown();
      },
    );

    this.addSlashSubcommand(
      subCommand =>
        subCommand
          .setName('setbirthdaychannel')
          .setDescription('Set the current channel as channel announcement for birthday wishes')
          .addBooleanOption(option =>
            option.setName('clear').setDescription('Clear the registered channel'),
          ),
      interaction => setBirthdayChannel(interaction),
    );

    this.addSlashSubcommand(
      subCommand =>
        subCommand
          .setName('setlogschannel')
          .setDescription('Set the current channel as logs channel')
          .addBooleanOption(option =>
            option.setName('clear').setDescription('Clear the registered channel'),
          ),
      interaction => setLogsChannel(interaction),
    );
  }
}

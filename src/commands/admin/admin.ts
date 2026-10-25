import { PermissionFlagsBits } from 'discord-api-types/v10';

import { client } from '../../client/client';
import { SlashCommandGroup } from '../../types/slash-command-group';
import { setBirthdayChannel } from './set-birthday-channel';
import { setLogsChannel } from './set-log-channel';

export class AdminCommand extends SlashCommandGroup {
  name = 'admin';
  description = 'Admin commands';

  constructor() {
    super();

    this.addSlashSubcommand(
      subCommand => subCommand.setName('shutdown').setDescription('Shutdown Watanabot'),
      async interaction =>
        interaction
          .reply({ content: 'Shutting down...', ephemeral: true })
          .then(() => client.destroy()),
    ).setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    this.addSlashSubcommand(
      subCommand =>
        subCommand
          .setName('setbirthdaychannel')
          .setDescription('Set the current channel as channel announcement for birthday wishes')
          .addBooleanOption(option =>
            option.setName('clear').setDescription('Clear the registered channel'),
          ),
      interaction => setBirthdayChannel(interaction),
    ).setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    this.addSlashSubcommand(
      subCommand =>
        subCommand
          .setName('setlogschannel')
          .setDescription('Set the current channel as logs channel')
          .addBooleanOption(option =>
            option.setName('clear').setDescription('Clear the registered channel'),
          ),
      interaction => setLogsChannel(interaction),
    ).setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
  }
}

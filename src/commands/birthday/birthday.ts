import { PermissionFlagsBits } from 'discord-api-types/v10';
import { APIApplicationCommandOptionChoice } from 'discord.js';

import { SlashCommandGroup } from '../../types/slash-command-group';
import { check } from './check';
import { get } from './get';
import { month } from './month';
import { set } from './set';

export class BirthdayCommand extends SlashCommandGroup {
  name = 'birthday';
  description = 'Birthday commands';

  monthChoices: APIApplicationCommandOptionChoice<number>[] = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 },
  ];

  constructor() {
    super();

    this.addSlashSubcommand(
      subCommand =>
        subCommand
          .setName('get')
          .setDescription('Get birthday of a member')
          .addUserOption(option =>
            option.setName('member').setDescription('The member to get the birthday'),
          ),
      interaction => get(interaction),
    );

    this.addSlashSubcommand(
      subCommand =>
        subCommand
          .setName('set')
          .setDescription('Set birthday of a member')
          .addIntegerOption(option =>
            option
              .setName('day')
              .setDescription('Day of birthday')
              .setMinValue(1)
              .setMaxValue(31)
              .setRequired(true),
          )
          .addIntegerOption(option =>
            option
              .setName('month')
              .setDescription('Month of birthday')
              .addChoices(...this.monthChoices)
              .setRequired(true),
          )
          .addUserOption(option =>
            option.setName('member').setDescription('The member to get the birthday'),
          ),
      interaction => set(interaction),
    );

    this.addSlashSubcommand(
      subCommand =>
        subCommand
          .setName('month')
          .setDescription('Get birthdays in a given month')
          .addIntegerOption(option =>
            option
              .setName('month')
              .setDescription('Month to retrieve birthdays')
              .addChoices(...this.monthChoices),
          ),
      interaction => month(interaction),
    );

    this.addSlashSubcommand(
      subCommand => subCommand.setName('check').setDescription('Manually run birthday check'),
      interaction => check(interaction),
    ).setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
  }
}

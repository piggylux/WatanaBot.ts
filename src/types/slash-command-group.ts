import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

import { SlashCommand } from './slash-command';

type SubcommandHandler = (interaction: ChatInputCommandInteraction<'cached'>) => Promise<void>;

/**
 * Command made of subcommands, only available in guilds
 */
export class SlashCommandGroup extends SlashCommand {
  subcommands: Record<string, SubcommandHandler> = {};

  constructor() {
    super();
    this.setContexts(InteractionContextType.Guild);
  }

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: `Command ${interaction.commandName} can only be used in a server`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommand in this.subcommands) {
      await this.subcommands[subcommand](interaction);
    } else {
      await interaction.reply({
        content: `Command ${interaction.commandName} ${subcommand} doesn't exist`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  addSlashSubcommand(
    input: (subcommandGroup: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder,
    execute: SubcommandHandler,
  ): SlashCommandSubcommandsOnlyBuilder {
    const subcommand = input(new SlashCommandSubcommandBuilder());
    this.subcommands[subcommand.name] = execute;
    return super.addSubcommand(subcommand);
  }
}

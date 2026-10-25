import { Interaction } from 'discord.js';

import { ALL_COMMANDS } from '../../commands/commands';
import { ReplyType } from '../../types/reply-type';
import { NotImplementedError } from '../../types/slash-command';
import { createBotEmbed } from '../utils';

export async function handleInteractionCreate(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    if (interaction.commandName in ALL_COMMANDS) {
      try {
        await ALL_COMMANDS[interaction.commandName].execute(interaction);
      } catch (error) {
        if (error instanceof NotImplementedError) {
          await interaction.reply({
            embeds: [
              createBotEmbed({
                description: `Command ${interaction.commandName} is not implemented`,
                replyType: ReplyType.ERROR,
              }),
            ],
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            embeds: [
              createBotEmbed({
                description: `I couldn't execute your command:\n${error}`,
                replyType: ReplyType.ERROR,
              }),
            ],
            ephemeral: true,
          });
        }
      }
    } else {
      await interaction.reply({
        embeds: [
          createBotEmbed({
            description: `Command ${interaction.commandName} doesn't exist`,
            replyType: ReplyType.ERROR,
          }).setFooter({
            text: 'request feature at https://github.com/Sylux6/WatanaBot.ts/issues',
          }),
        ],
        ephemeral: true,
      });
    }
  } catch (e) {
    console.error(e);
  }
}

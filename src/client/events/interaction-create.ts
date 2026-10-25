import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  Interaction,
  InteractionReplyOptions,
  MessageFlags,
} from 'discord.js';

import { ALL_COMMANDS } from '../../commands/commands';
import { ReplyType } from '../../types/reply-type';
import { NotImplementedError } from '../../types/slash-command';
import { handleExpiredPageButton } from '../paginated-reply';
import { createBotEmbed } from '../utils';

async function replyError(interaction: ChatInputCommandInteraction, embed: EmbedBuilder) {
  const options: InteractionReplyOptions = { embeds: [embed], flags: MessageFlags.Ephemeral };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(options);
  } else {
    await interaction.reply(options);
  }
}

export async function handleInteractionCreate(interaction: Interaction) {
  // Active page buttons are handled by their collector
  if (interaction.isButton()) {
    await handleExpiredPageButton(interaction);
    return;
  }
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    if (interaction.commandName in ALL_COMMANDS) {
      try {
        await ALL_COMMANDS[interaction.commandName].execute(interaction);
      } catch (error) {
        console.error(error);
        await replyError(
          interaction,
          createBotEmbed({
            description:
              error instanceof NotImplementedError
                ? `Command ${interaction.commandName} is not implemented`
                : "I couldn't execute your command",
            replyType: ReplyType.ERROR,
          }),
        );
      }
    } else {
      await replyError(
        interaction,
        createBotEmbed({
          description: `Command ${interaction.commandName} doesn't exist`,
          replyType: ReplyType.ERROR,
        }).setFooter({
          text: 'request feature at https://github.com/Sylux6/WatanaBot.ts/issues',
        }),
      );
    }
  } catch (e) {
    console.error(e);
  }
}

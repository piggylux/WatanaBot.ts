import { Message } from 'discord.js';

import { client } from '../client';
import { getYousoro } from '../utils';

export async function handleMessageCreate(message: Message<boolean>) {
  const content = message.content.toLowerCase();

  if (message.author.bot) {
    return;
  }

  if (message.inGuild()) {
    if ((content.includes('yousoro') || content.includes('sylux6yo')) && !message.author.bot) {
      const reaction = message.guild?.emojis?.cache?.find(({ name }) => name === 'yousoro');
      if (reaction) {
        await message.react(reaction);
      }
    }
  }

  if (message.channel.isSendable()) {
    if (content.includes('zensoku zenshin')) {
      await message.channel.send('YOUSORO!~ (> ᴗ •)ゞ');
    }

    if (message.mentions.has(client.user!)) {
      if (content.includes('lewd')) {
        await message.channel.send({
          content: "I'm not lewd!",
          reply: { messageReference: message },
        });
      } else if (!message.mentions.everyone) {
        await message.channel.send({
          content: getYousoro(message.guild),
          reply: { messageReference: message },
        });
      }
    }
  }
}

import { Message } from 'discord.js';

import { getYousoro } from '../utils';

export async function handleMessageCreate(message: Message<boolean>) {
  if (message.author.bot) {
    return;
  }

  const content = message.content.toLowerCase();

  if (message.inGuild()) {
    if (content.includes('yousoro') || content.includes('sylux6yo')) {
      const reaction = message.guild.emojis.cache.find(({ name }) => name === 'yousoro');
      if (reaction) {
        await message.react(reaction);
      }
    }
  }

  if (message.channel.isSendable()) {
    if (content.includes('zensoku zenshin')) {
      await message.channel.send('YOUSORO!~ (> ᴗ •)ゞ');
    }

    if (
      !message.mentions.everyone &&
      message.mentions.has(message.client.user, { ignoreRoles: true })
    ) {
      await message.channel.send({
        content: content.includes('lewd') ? "I'm not lewd!" : getYousoro(message.guild),
        reply: { messageReference: message },
      });
    }
  }
}

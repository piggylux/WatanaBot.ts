import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';

const PAGE_BUTTON_PREFIX = 'pages:';
export const PageButton = {
  Previous: `${PAGE_BUTTON_PREFIX}previous`,
  Indicator: `${PAGE_BUTTON_PREFIX}indicator`,
  Next: `${PAGE_BUTTON_PREFIX}next`,
} as const;

// Messages whose page buttons are still handled by a collector
const activeMessageIds = new Set<string>();

/**
 * Displays embed pages in one reply, with controls available for five minutes.
 * Pages are edited through the interaction, which works even where the bot cannot see the channel.
 */
export async function replyWithEmbedPages(
  interaction: ChatInputCommandInteraction,
  embeds: EmbedBuilder[],
) {
  if (embeds.length === 0) {
    throw new RangeError('At least one embed page is required');
  }
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply();
  }

  if (embeds.length === 1) {
    await interaction.editReply({ embeds, components: [] });
    return;
  }

  let page = 0;
  const controls = (expired = false) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(PageButton.Previous)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(expired || page === 0),
      new ButtonBuilder()
        .setCustomId(PageButton.Indicator)
        .setLabel(`Page ${page + 1}/${embeds.length}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(PageButton.Next)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(expired || page === embeds.length - 1),
    );

  const message = await interaction.editReply({ embeds: [embeds[page]], components: [controls()] });
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: button =>
      button.customId === PageButton.Previous || button.customId === PageButton.Next,
    time: 5 * 60 * 1000,
  });
  activeMessageIds.add(message.id);
  let updates = Promise.resolve();

  collector.on('collect', button => {
    if (button.user.id !== interaction.user.id) {
      void button
        .reply({
          content: 'Only the person who ran this command can change pages.',
          flags: MessageFlags.Ephemeral,
        })
        .catch(error => console.error(error));
      return;
    }

    // Acknowledge immediately, then serialize edits so rapid clicks stay in order.
    const acknowledged = button.deferUpdate().then(
      () => true,
      error => {
        console.error(error);
        return false;
      },
    );
    updates = updates
      .then(async () => {
        if (!(await acknowledged) || collector.ended) {
          return;
        }
        const previousPage = page;
        page = Math.max(
          0,
          Math.min(embeds.length - 1, page + (button.customId === PageButton.Next ? 1 : -1)),
        );
        try {
          await interaction.editReply({ embeds: [embeds[page]], components: [controls()] });
        } catch (error) {
          page = previousPage;
          throw error;
        }
      })
      .catch(error => console.error(error));
  });

  collector.on('end', (_, reason) => {
    activeMessageIds.delete(message.id);
    if (reason === 'time') {
      void updates
        .then(() => interaction.editReply({ components: [controls(true)] }))
        .catch(error => console.error(error));
    }
  });
}

/**
 * Removes the controls of page buttons that no collector handles anymore, e.g. after a restart,
 * and tells the user why.
 */
export async function handleExpiredPageButton(interaction: ButtonInteraction) {
  if (
    interaction.customId.startsWith(PAGE_BUTTON_PREFIX) &&
    !activeMessageIds.has(interaction.message.id)
  ) {
    await interaction.update({ components: [] });
    await interaction.followUp({
      content: 'These pages have expired, run the command again.',
      flags: MessageFlags.Ephemeral,
    });
  }
}

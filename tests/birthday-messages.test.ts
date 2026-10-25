import { beforeEach, mock, test } from 'bun:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

import {
  APIActionRowComponent,
  APIButtonComponentWithCustomId,
  APIEmbed,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';

import type * as ClientModule from '../src/client/client';

type BirthdayUser = { userId: string; birthdayDay: number };
type RegisteredGuild = {
  guildId: string;
  birthdayChannelId: string | null;
  logsChannelId: string | null;
};

let users: BirthdayUser[] = [];
let registeredGuilds: RegisteredGuild[] = [];
const guildCache = new Collection<string, unknown>();

// Export names are checked against the real module so that the mock cannot silently drift
await mock.module(
  '../src/client/client',
  () =>
    ({
      PRIMARY_COLOR: '#5594D7',
      prismaClient: {
        users: { findMany: async () => users },
        guilds: { findMany: async () => registeredGuilds },
      },
      client: { guilds: { cache: guildCache } },
      shutdown: async () => {},
    }) satisfies Partial<Record<keyof typeof ClientModule, unknown>>,
);

const { month } = await import('../src/commands/birthday/month');
const { checkBirthday } = await import('../src/cronjobs/check-birthday');
const { handleInteractionCreate } = await import('../src/client/events/interaction-create');
const { PageButton, handleExpiredPageButton, replyWithEmbedPages } =
  await import('../src/client/paginated-reply');

beforeEach(() => {
  users = [];
  registeredGuilds = [];
  guildCache.clear();
});

function createUsers(count: number, sameDay: boolean): BirthdayUser[] {
  return Array.from({ length: count }, (_, index) => ({
    userId: String(1000000000000000000n + BigInt(index)),
    birthdayDay: sameDay ? 1 : (index % 31) + 1,
  }));
}

function createGuild() {
  return {
    emojis: { cache: new Collection() },
    members: {
      fetch: async ({ user }: { user: string[] }) =>
        new Collection(user.map(id => [id, { toString: () => `<@${id}>` }] as const)),
    },
  };
}

function assertAllMentioned(text: string) {
  const mentions = text.match(/<@\d+>/g) ?? [];
  assert.deepEqual(mentions.sort(), users.map(({ userId }) => `<@${userId}>`).sort());
}

type ButtonRow = APIActionRowComponent<APIButtonComponentWithCustomId>;
type Snapshot = { embeds: APIEmbed[]; components: ButtonRow[] };
type ReplyPayload = { embeds?: EmbedBuilder[]; components?: { toJSON(): unknown }[] };
type EphemeralReply = { content: string; flags: MessageFlags };
type FakeButton = {
  customId: string;
  user: { id: string };
  deferUpdate(): Promise<void>;
  reply(payload: EphemeralReply): Promise<void>;
};
type CollectorOptions = {
  componentType: ComponentType;
  filter(button: FakeButton): boolean;
  time: number;
};

let nextMessageId = 0;

function createPaginationHarness({ deferred = true } = {}) {
  const collector = Object.assign(new EventEmitter(), {
    ended: false,
    stop(reason: string) {
      collector.ended = true;
      collector.emit('end', new Collection(), reason);
    },
  });
  let collectorOptions: CollectorOptions | undefined;
  let current: Snapshot = { embeds: [], components: [] };
  const history: Snapshot[] = [];
  const rejectedClicks: EphemeralReply[] = [];
  let acknowledgements = 0;
  let deferReplies = 0;
  let editReplies = 0;
  let channelEdits = 0;

  const record = (payload: ReplyPayload) => {
    current = {
      embeds: payload.embeds?.map(embed => embed.toJSON()) ?? current.embeds,
      components: payload.components?.map(row => row.toJSON() as ButtonRow) ?? current.components,
    };
    history.push(current);
  };
  const message = {
    id: `message-${nextMessageId++}`,
    createMessageComponentCollector: (options: CollectorOptions) => {
      collectorOptions = options;
      return collector;
    },
    // Channel edits fail where the bot cannot see the channel, pages must be edited through the interaction
    edit: async () => {
      channelEdits++;
      throw new Error('Missing Access');
    },
  };
  const interaction = {
    user: { id: 'command-user' },
    options: { getInteger: () => 1 },
    guild: createGuild(),
    deferred,
    replied: false,
    deferReply: async () => {
      deferReplies++;
      interaction.deferred = true;
    },
    editReply: async (payload: ReplyPayload) => {
      editReplies++;
      record(payload);
      return message;
    },
  };
  const click = async (customId: string, userId = 'command-user') => {
    const button: FakeButton = {
      customId,
      user: { id: userId },
      deferUpdate: async () => {
        acknowledgements++;
      },
      reply: async payload => {
        rejectedClicks.push(payload);
      },
    };
    if (!collector.ended && collectorOptions?.filter(button)) {
      collector.emit('collect', button);
    }
    await new Promise(resolve => setImmediate(resolve));
  };

  return {
    collector,
    history,
    rejectedClicks,
    messageId: message.id,
    interaction: interaction as unknown as ChatInputCommandInteraction<'cached'>,
    click,
    get collectorOptions() {
      return collectorOptions;
    },
    get current() {
      return current;
    },
    get acknowledgements() {
      return acknowledgements;
    },
    get deferReplies() {
      return deferReplies;
    },
    get editReplies() {
      return editReplies;
    },
    get channelEdits() {
      return channelEdits;
    },
  };
}

type ButtonResponse =
  | { method: 'update'; payload: { components: unknown[] } }
  | { method: 'followUp'; payload: EphemeralReply };

function createPageButtonClick(customId: string, messageId: string) {
  const responses: ButtonResponse[] = [];
  const interaction = {
    customId,
    message: { id: messageId },
    isButton: () => true,
    isChatInputCommand: () => false,
    update: async (payload: { components: unknown[] }) => {
      responses.push({ method: 'update', payload });
    },
    followUp: async (payload: EphemeralReply) => {
      responses.push({ method: 'followUp', payload });
    },
  };
  return { responses, interaction: interaction as unknown as ButtonInteraction };
}

function assertExpired({ responses }: ReturnType<typeof createPageButtonClick>) {
  assert.deepEqual(responses, [
    { method: 'update', payload: { components: [] } },
    {
      method: 'followUp',
      payload: {
        content: 'These pages have expired, run the command again.',
        flags: MessageFlags.Ephemeral,
      },
    },
  ]);
}

const twoPages = () => [
  new EmbedBuilder().setTitle('First'),
  new EmbedBuilder().setTitle('Second'),
];

test.each([
  [0, false],
  [31, false],
  [50, true],
  [300, false],
  [1600, true],
])('monthly birthdays preserve %i members within Discord limits', async (count, sameDay) => {
  users = createUsers(count, sameDay);
  const harness = createPaginationHarness({ deferred: false });

  await month(harness.interaction);

  assert.equal(harness.deferReplies, 1);
  assert.equal(harness.editReplies, 1);
  while (
    harness.current.components.length &&
    !harness.current.components[0].components[2].disabled
  ) {
    await harness.click(PageButton.Next);
  }
  const fields = [];
  for (const message of harness.history) {
    assert.equal(message.embeds.length, 1);
    let totalLength = 0;
    for (const data of message.embeds) {
      assert((data.fields?.length ?? 0) <= 25);
      totalLength += new EmbedBuilder(data).length;
      for (const field of data.fields ?? []) {
        assert(field.value.length <= 1024);
        fields.push(field);
      }
    }
    assert(totalLength <= 6000);
  }
  assertAllMentioned(fields.map(({ value }) => value).join('\n'));
  if (harness.history.length === 1) {
    assert.deepEqual(harness.current.components, []);
    assert.equal(harness.collectorOptions, undefined);
  }
});

test('pagination navigates in both directions and disables boundary buttons', async () => {
  const harness = createPaginationHarness();
  await replyWithEmbedPages(harness.interaction, twoPages());

  assert.equal(harness.collectorOptions?.componentType, ComponentType.Button);
  assert.equal(harness.current.components[0].components[0].disabled, true);
  assert.equal(harness.current.components[0].components[1].label, 'Page 1/2');
  assert.equal(harness.current.components[0].components[2].disabled, false);

  await harness.click(PageButton.Next);
  assert.equal(harness.current.embeds[0].title, 'Second');
  assert.equal(harness.current.components[0].components[0].disabled, false);
  assert.equal(harness.current.components[0].components[1].label, 'Page 2/2');
  assert.equal(harness.current.components[0].components[2].disabled, true);

  await harness.click(PageButton.Next);
  assert.equal(harness.current.embeds[0].title, 'Second');
  await harness.click(PageButton.Previous);
  assert.equal(harness.current.embeds[0].title, 'First');
  await harness.click(PageButton.Previous);
  assert.equal(harness.current.embeds[0].title, 'First');
  assert.equal(harness.deferReplies, 0);
  assert.equal(harness.channelEdits, 0);
});

test('only the command user can change pages', async () => {
  const harness = createPaginationHarness();
  await replyWithEmbedPages(harness.interaction, twoPages());

  await harness.click(PageButton.Next, 'another-user');

  assert.equal(harness.history.length, 1);
  assert.equal(harness.acknowledgements, 0);
  assert.equal(harness.rejectedClicks.length, 1);
  assert.equal(harness.rejectedClicks[0].flags, MessageFlags.Ephemeral);
});

test('rapid clicks are acknowledged and applied in order', async () => {
  const harness = createPaginationHarness();
  await replyWithEmbedPages(
    harness.interaction,
    ['First', 'Second', 'Third'].map(title => new EmbedBuilder().setTitle(title)),
  );

  await Promise.all([
    harness.click(PageButton.Next),
    harness.click(PageButton.Next),
    harness.click(PageButton.Previous),
  ]);

  assert.equal(harness.acknowledgements, 3);
  assert.deepEqual(
    harness.history.map(message => message.embeds[0].title),
    ['First', 'Second', 'Third', 'Second'],
  );
});

test('pagination disables all controls after five minutes', async () => {
  const harness = createPaginationHarness();
  await replyWithEmbedPages(harness.interaction, twoPages());
  await harness.click(PageButton.Next);
  assert.equal(harness.collectorOptions?.time, 5 * 60 * 1000);

  harness.collector.stop('time');
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(harness.current.embeds[0].title, 'Second');
  assert(harness.current.components[0].components.every(button => button.disabled));
  const editCount = harness.history.length;
  await harness.click(PageButton.Previous);
  assert.equal(harness.history.length, editCount);
  assert.equal(harness.channelEdits, 0);
});

test('page buttons without a collector lose their controls', async () => {
  const harness = createPaginationHarness();
  await replyWithEmbedPages(harness.interaction, twoPages());

  const activeClick = createPageButtonClick(PageButton.Next, harness.messageId);
  await handleExpiredPageButton(activeClick.interaction);
  assert.deepEqual(activeClick.responses, []);

  harness.collector.stop('time');
  const expiredClick = createPageButtonClick(PageButton.Next, harness.messageId);
  await handleExpiredPageButton(expiredClick.interaction);
  assertExpired(expiredClick);

  // Collectors do not survive a restart
  const restartClick = createPageButtonClick(PageButton.Previous, 'message-before-restart');
  await handleExpiredPageButton(restartClick.interaction);
  assertExpired(restartClick);

  const otherButton = createPageButtonClick('other:button', 'message-before-restart');
  await handleExpiredPageButton(otherButton.interaction);
  assert.deepEqual(otherButton.responses, []);
});

test('button clicks are routed to the expired page handler', async () => {
  const harness = createPaginationHarness();
  await replyWithEmbedPages(harness.interaction, twoPages());

  // Active pages are left to their collector
  const activeClick = createPageButtonClick(PageButton.Next, harness.messageId);
  await handleInteractionCreate(activeClick.interaction);
  assert.deepEqual(activeClick.responses, []);

  harness.collector.stop('time');
  const expiredClick = createPageButtonClick(PageButton.Next, harness.messageId);
  await handleInteractionCreate(expiredClick.interaction);
  assertExpired(expiredClick);
});

test('pagination defers the reply when the command has not', async () => {
  const harness = createPaginationHarness({ deferred: false });
  await replyWithEmbedPages(harness.interaction, [new EmbedBuilder().setTitle('Only')]);

  assert.equal(harness.deferReplies, 1);
  assert.equal(harness.current.embeds[0].title, 'Only');
});

test('pagination requires at least one page', async () => {
  const harness = createPaginationHarness();

  await assert.rejects(replyWithEmbedPages(harness.interaction, []), RangeError);
  assert.equal(harness.history.length, 0);
});

test.each([0, 1, 90, 300])(
  'birthday announcements preserve %i members within the message limit',
  async count => {
    users = createUsers(count, true);
    const messages: string[] = [];
    const guild = {
      ...createGuild(),
      channels: {
        cache: new Collection([
          [
            'birthdays',
            {
              isSendable: () => true,
              send: async (message: { content: string }) => {
                assert(message.content.length <= 2000);
                messages.push(message.content);
              },
            },
          ],
        ]),
      },
    };
    guildCache.set('guild', guild);
    registeredGuilds = [{ guildId: 'guild', birthdayChannelId: 'birthdays', logsChannelId: null }];

    await checkBirthday();

    assert.equal(messages.length > 0, count > 0);
    for (const message of messages) {
      assert(message.startsWith('Happy Birthday '));
    }
    assertAllMentioned(messages.join('\n'));
  },
);

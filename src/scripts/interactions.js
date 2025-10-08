import { getText } from './texts.js';

export const interactions = [
  {
    verb: 'shake',
    target: 'palm tree',
    conditions: [],
    dialogues: {
      noEffect: { speaker: 'me', textKey: 'interactions.shake.palmTree.noEffect', duration: 2500 },
    },
    action: ({ worldEvents }) => {
      worldEvents.shakePalmTree();
      return 'noEffect';
    },
  },
  {
    verb: 'pickup',
    target: 'bucket',
    conditions: [
      {
        check: ({ inventory }) => !inventory.has('bucket'),
        failDialogueKey: 'already',
      },
      {
        check: ({ elements }) => elements.bucket && elements.game.contains(elements.bucket),
        failDialogueKey: 'missing',
      },
    ],
    dialogues: {
      success: { speaker: 'me', textKey: 'interactions.pickup.bucket.success' },
      missing: { speaker: 'me', textKey: 'interactions.pickup.bucket.missing' },
      already: { speaker: 'me', textKey: 'interactions.pickup.bucket.already' },
    },
    action: ({ elements, inventory }) => {
      if (elements.bucket && elements.game.contains(elements.bucket)) {
        elements.game.removeChild(elements.bucket);
      }
      inventory.add('bucket');
      inventory.clearSelection();
      return 'success';
    },
  },
  {
    verb: 'pickup',
    target: 'dates',
    conditions: [
      {
        check: ({ worldEvents }) => worldEvents.hasDatesOnGround(),
        failDialogueKey: 'missing',
      },
    ],
    dialogues: {
      success: { speaker: 'me', textKey: 'interactions.pickup.dates.success' },
      missing: { speaker: 'me', textKey: 'interactions.pickup.dates.missing' },
    },
    action: ({ worldEvents, inventory }) => {
      if (worldEvents.collectDates()) {
        inventory.add('dates');
        inventory.clearSelection();
        return 'success';
      }
      return null;
    },
  },
  {
    verb: 'use',
    target: 'pond',
    conditions: [
      {
        check: ({ inventory }) => !inventory.has('bucket of water'),
        failDialogueKey: 'alreadyFull',
      },
      {
        check: ({ inventory }) => inventory.has('bucket'),
        failDialogueKey: 'missingBucket',
      },
    ],
    dialogues: {
      success: { speaker: 'me', textKey: 'interactions.use.pond.success' },
      missingBucket: { speaker: 'me', textKey: 'interactions.use.pond.missingBucket' },
      alreadyFull: { speaker: 'me', textKey: 'interactions.use.pond.alreadyFull' },
    },
    action: ({ inventory }) => {
      inventory.remove('bucket');
      inventory.add('bucket of water');
      inventory.clearSelection();
      return 'success';
    },
  },
  {
    verb: 'give',
    target: 'bedouins',
    conditions: [
      {
        check: ({ inventory }) => Boolean(inventory.getSelectedItem()),
        failDialogueKey: 'nothingSelected',
      },
    ],
    dialogues: {
      nothingSelected: { speaker: 'me', textKey: 'interactions.give.bedouins.nothingSelected' },
      wrongItem: { speaker: 'bedouins', textKey: 'interactions.give.bedouins.wrongItem' },
      datesBeforeWater: { speaker: 'bedouins', textKey: 'interactions.give.bedouins.datesBeforeWater' },
      datesAfterWater: { speaker: 'bedouins', textKey: 'interactions.give.bedouins.datesAfterWater', duration: 12000 },
      water: { speaker: 'bedouins', textKey: 'interactions.give.bedouins.water' },
    },
    action: ({ inventory, worldEvents }) => {
      const selectedItem = inventory.getSelectedItem();
      if (!selectedItem) {
        return 'nothingSelected';
      }

      if (selectedItem === 'dates') {
        inventory.remove('dates');
        inventory.clearSelection();
        if (worldEvents.hasGivenWater()) {
          return 'datesAfterWater';
        }
        return 'datesBeforeWater';
      }

      if (selectedItem === 'bucket of water') {
        inventory.remove('bucket of water');
        inventory.clearSelection();
        worldEvents.markWaterDelivered();
        return 'water';
      }

      inventory.clearSelection();
      return 'wrongItem';
    },
  },
];

function playDialogue(context, config, overrides = {}) {
  if (!context.ui || !config) {
    return;
  }

  const resolveText = context.getText || getText;
  const text = overrides.text || resolveText(config.textKey);
  const duration = overrides.duration || config.duration || 3500;
  const isThought = overrides.isThought != null ? overrides.isThought : config.isThought || false;

  context.ui.show({
    speaker: config.speaker,
    text,
    isThought,
    duration,
  });
}

export function runInteraction({ verb, target, context }) {
  const interaction = interactions.find((entry) => entry.verb === verb && entry.target === target);
  if (!interaction) {
    return false;
  }

  const conditions = interaction.conditions || [];
  for (const condition of conditions) {
    const passed = condition.check ? condition.check(context) : true;
    if (!passed) {
      if (condition.failDialogueKey && interaction.dialogues?.[condition.failDialogueKey]) {
        playDialogue(context, interaction.dialogues[condition.failDialogueKey]);
      }
      return false;
    }
  }

  const result = interaction.action(context);
  if (!result) {
    return true;
  }

  const outcome = typeof result === 'string' ? { dialogueKey: result } : result;
  if (outcome.dialogueKey && interaction.dialogues?.[outcome.dialogueKey]) {
    playDialogue(context, interaction.dialogues[outcome.dialogueKey], outcome);
  }

  return true;
}

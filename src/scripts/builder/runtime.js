import { loadBuilderState } from './storage.js';

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch (error) {
      // Fallback to JSON approach
    }
  }

  return JSON.parse(JSON.stringify(value));
}

function setNestedValue(target, path, value) {
  if (!path.length) {
    return;
  }

  let current = target;
  for (let index = 0; index < path.length; index += 1) {
    const key = path[index];
    if (index === path.length - 1) {
      current[key] = value;
      return;
    }

    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
}

function sanitizeId(value, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  return value.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase() || fallback;
}

function buildRuntimeDataFromState(state) {
  if (!state || !Array.isArray(state.scenes)) {
    return { scenes: [], interactions: [], texts: {}, order: [] };
  }

  const scenes = [];
  const interactions = [];
  const texts = {};
  const order = [];
  const dialogueLookup = new Map();

  state.scenes.forEach((entry, sceneIndex) => {
    if (!entry || !entry.data) {
      return;
    }

    const sceneName = entry.name || entry.data?.name;
    if (!sceneName) {
      return;
    }

    const sceneData = deepClone(entry.data);
    sceneData.name = sceneName;
    scenes.push({ name: sceneName, data: sceneData });
    order.push(sceneName);

    const dialogues = Array.isArray(entry.dialogues) ? entry.dialogues : [];
    dialogues.forEach((dialogue, dialogueIndex) => {
      if (!dialogue || typeof dialogue !== 'object') {
        return;
      }

      const fallbackId = `dialogue-${sceneIndex + 1}-${dialogueIndex + 1}`;
      const dialogueId = sanitizeId(dialogue.id, fallbackId);
      const text = typeof dialogue.text === 'string' ? dialogue.text : '';
      const textKeyPath = ['builder', 'dialogues', sceneName, dialogueId];

      setNestedValue(texts, textKeyPath, text);

      dialogueLookup.set(`${sceneName}:${dialogueId}`, {
        textKey: textKeyPath.join('.'),
        speaker: dialogue.speaker || 'me',
        duration: dialogue.duration,
        isThought: Boolean(dialogue.isThought),
        anchor: dialogue.anchor || null,
      });
    });

    const interactionEntries = Array.isArray(entry.interactions) ? entry.interactions : [];
    interactionEntries.forEach((interaction, interactionIndex) => {
      if (!interaction || typeof interaction !== 'object') {
        return;
      }

      const { verb, target, dialogueId } = interaction;
      if (!verb || !target || !dialogueId) {
        return;
      }

      const lookupKey = `${sceneName}:${sanitizeId(dialogueId, dialogueId)}`;
      const dialogueConfig = dialogueLookup.get(lookupKey);
      if (!dialogueConfig) {
        return;
      }

      const outcomeKey = `builder_${sceneName}_${interactionIndex}`;

      interactions.push({
        id: interaction.id || outcomeKey,
        scene: sceneName,
        verb,
        target,
        dialogues: {
          response: {
            speaker: dialogueConfig.speaker,
            textKey: dialogueConfig.textKey,
            duration: dialogueConfig.duration,
            isThought: dialogueConfig.isThought,
          },
        },
        action: () => 'response',
        conditions: [],
      });
    });
  });

  return { scenes, interactions, texts, order };
}

export function getBuilderRuntimeData() {
  try {
    const state = loadBuilderState();
    return buildRuntimeDataFromState(state);
  } catch (error) {
    console.warn('Failed to load builder runtime data:', error);
    return { scenes: [], interactions: [], texts: {}, order: [] };
  }
}

export function getDialogueAnchor({ sceneName, dialogueId }) {
  const state = loadBuilderState();
  if (!state || !Array.isArray(state.scenes)) {
    return null;
  }

  const sceneEntry = state.scenes.find((entry) => entry.name === sceneName);
  if (!sceneEntry) {
    return null;
  }

  const dialogue = (sceneEntry.dialogues || []).find((item) => item.id === dialogueId);
  if (!dialogue) {
    return null;
  }

  return dialogue.anchor || null;
}

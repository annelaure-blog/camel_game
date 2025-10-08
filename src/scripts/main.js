import { Inventory } from './inventory.js';
import { DialogueUI } from './ui.js';
import { runInteraction } from './interactions.js';
import { WorldEvents } from './world-events.js';
import { renderSceneLayout } from './layout.js';
import { getText } from './texts.js';

const dialogueElements = {
  me: document.getElementById('dialogue-me'),
  bedouins: document.getElementById('dialogue-bedouins'),
  camel: document.getElementById('dialogue-camel'),
};

const actorElements = {
  me: document.querySelector('[data-name="me"]'),
  bedouins: document.querySelector('[data-name="bedouins"]'),
  camel: document.querySelector('[data-name="camel"]'),
};

const bucket = document.querySelector('[data-name="bucket"]');
const palmTree = document.querySelector('[data-name="palm tree"]');
const pond = document.querySelector('[data-name="pond"]');
const gameElement = document.getElementById('game');

renderSceneLayout(gameElement);

const dialogueUI = new DialogueUI({
  dialogueElements,
  actorElements,
  gameElement,
});

const inventoryDisplay = document.getElementById('inventory-items');
const inventory = new Inventory({ displayElement: inventoryDisplay });

let selectedVerb = null;
const verbs = document.querySelectorAll('.verb');
const labels = document.querySelectorAll('.label');

const clearSelectedVerb = () => {
  selectedVerb = null;
  verbs.forEach((item) => item.classList.remove('active'));
};

const context = {
  inventory,
  ui: dialogueUI,
  getText,
  worldEvents: null,
  elements: {
    game: gameElement,
    bucket,
    pond,
    palmTree,
    me: actorElements.me,
    bedouins: actorElements.bedouins,
    camel: actorElements.camel,
  },
};

const handleInteraction = (verb, target) => {
  if (!verb) {
    return;
  }
  const wasHandled = runInteraction({ verb, target, context });
  if (wasHandled) {
    clearSelectedVerb();
  }
};

const worldEvents = new WorldEvents({
  gameElement,
  palmTreeElement: palmTree,
  getSelectedVerb: () => selectedVerb,
  onInteraction: ({ verb, target }) => handleInteraction(verb, target),
});

context.worldEvents = worldEvents;

verbs.forEach((verbElement) => {
  verbElement.addEventListener('click', () => {
    verbs.forEach((item) => item.classList.remove('active'));
    verbElement.classList.add('active');
    selectedVerb = verbElement.dataset.verb;
  });
});

labels.forEach((label) => {
  label.addEventListener('click', () => {
    if (!selectedVerb) {
      return;
    }
    const name = label.dataset.name;
    handleInteraction(selectedVerb, name);
  });
});

function initializeGame() {
  inventory.render();
  dialogueUI.show({
    speaker: 'camel',
    text: getText('camel.initialThought'),
    isThought: true,
    duration: 3000,
  });
  setupInitialGreeting();
}

function setupInitialGreeting() {
  const meElement = actorElements.me;
  if (!meElement) {
    return;
  }

  let greetingShown = false;

  const showGreeting = () => {
    if (greetingShown) {
      return;
    }
    greetingShown = true;

    dialogueUI.show({
      speaker: 'me',
      text: 'Hello !',
      duration: 3000,
    });

    setTimeout(() => {
      dialogueUI.show({
        speaker: 'bedouins',
        text: 'Hello stranger !',
        duration: 3000,
      });
    }, 3000);
  };

  meElement.addEventListener('animationend', showGreeting, { once: true });

  setTimeout(() => {
    showGreeting();
  }, 6500);
}

initializeGame();

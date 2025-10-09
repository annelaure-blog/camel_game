import { Inventory } from './inventory.js';
import { DialogueUI } from './ui.js';
import { runInteraction } from './interactions.js';
import { WorldEvents } from './world-events.js';
import { renderSceneLayout } from './layout.js';
import { getText } from './texts.js';
import { playPauseableTextSequence, skipActiveSequence } from './sequences.js';

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
const menuElement = document.getElementById('menu');

const introSequenceElement = document.getElementById('intro-sequence');
const introTextElement = document.getElementById('intro-text');
const introInstructionsElement = document.getElementById('intro-instructions');
let postDesertSequenceScheduled = false;
let postDesertSequenceTimeoutId = null;
let postDesertSequenceStarted = false;

renderSceneLayout(gameElement);

const dialogueUI = new DialogueUI({
  dialogueElements,
  actorElements,
  gameElement,
});

function hideAllDialogues() {
  Object.keys(dialogueElements).forEach((speaker) => {
    dialogueUI.hide(speaker);
  });
}

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
  transitions: {
    schedulePostDesertSequence,
  },
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
  setupInitialGreeting();
}

function setupInitialGreeting() {
  const meElement = actorElements.me;
  if (!meElement) {
    return;
  }

  let greetingShown = false;

  const playInitialSequence = () => {
    if (greetingShown) {
      return;
    }
    greetingShown = true;

    const sequence = [
      { speaker: 'me', text: 'Hello!' },
      { speaker: 'bedouins', text: 'Hello stranger!' },
      { speaker: 'camel', text: 'Hello!' },
      { duration: 3000 },
      { speaker: 'me', text: 'Did the camel just say hello?' },
      { speaker: 'bedouins', text: 'What are you doing here?' },
      { speaker: 'me', text: 'I am a little lost.' },
      { speaker: 'bedouins', text: 'A little or completely lost.' },
      { speaker: 'me', text: 'OK I am completely lost.' },
      { speaker: 'bedouins', text: 'Like all the people we come across around here.' },
      { speaker: 'me', text: 'Maybe you can help me?' },
      { speaker: 'bedouins', text: 'Maybe we can.' },
      {
        speaker: 'bedouins',
        text: 'But first we need to make some tea. Can you get us water and something to eat?',
      },
      { speaker: 'me', text: 'Emm... here?' },
      {
        speaker: 'bedouins',
        text: 'Yes. The closest supermarket is unfortunately three camel-riding days away.',
      },
      { speaker: 'me', text: 'Obviously.' },
    ];

    let accumulatedDelay = 0;

    sequence.forEach((step) => {
      const duration = step.duration ?? 3000;

      setTimeout(() => {
        hideAllDialogues();

        if (step.speaker) {
          dialogueUI.show({
            speaker: step.speaker,
            text: step.text,
            duration,
          });
        }
      }, accumulatedDelay);

      accumulatedDelay += duration;
    });

    setTimeout(() => {
      hideAllDialogues();
    }, accumulatedDelay);
  };

  meElement.addEventListener('animationend', playInitialSequence, { once: true });

  setTimeout(() => {
    playInitialSequence();
  }, 6500);
}

function runIntroSequence(onComplete) {
  hideAllDialogues();
  playPauseableTextSequence({
    sentences: ['Once upon a time,...', 'Placeholder text to be continued.'],
    onComplete,
    hideGameOnStart: true,
    hideMenuOnStart: true,
    showGameOnComplete: true,
    showMenuOnComplete: true,
    hideContainerOnComplete: true,
    elements: {
      container: introSequenceElement,
      text: introTextElement,
      instructions: introInstructionsElement,
      game: gameElement,
      menu: menuElement,
    },
  });
}

function runSceneTransitionSequence({ onComplete } = {}) {
  hideAllDialogues();
  playPauseableTextSequence({
    sentences: ['A moment later'],
    onComplete,
    hideGameOnStart: true,
    hideMenuOnStart: true,
    showGameOnComplete: false,
    showMenuOnComplete: false,
    hideContainerOnComplete: true,
    sentenceDuration: 4000,
    elements: {
      container: introSequenceElement,
      text: introTextElement,
      instructions: introInstructionsElement,
      game: gameElement,
      menu: menuElement,
    },
  });
}

function startPostDesertSequence() {
  if (postDesertSequenceStarted) {
    return;
  }

  postDesertSequenceStarted = true;
  hideAllDialogues();

  runSceneTransitionSequence({
    onComplete: () => {
      document.dispatchEvent(
        new CustomEvent('scene:transitioned', {
          detail: { name: 'post-desert' },
        }),
      );
    },
  });
}

function schedulePostDesertSequence(delay = 0) {
  if (postDesertSequenceStarted) {
    return;
  }

  postDesertSequenceScheduled = true;

  if (postDesertSequenceTimeoutId) {
    window.clearTimeout(postDesertSequenceTimeoutId);
    postDesertSequenceTimeoutId = null;
  }

  const safeDelay = Math.max(0, Number(delay) || 0);

  if (safeDelay === 0) {
    startPostDesertSequence();
    return;
  }

  postDesertSequenceTimeoutId = window.setTimeout(() => {
    postDesertSequenceTimeoutId = null;
    startPostDesertSequence();
  }, safeDelay);
}

function forcePostDesertSequence() {
  if (postDesertSequenceStarted) {
    return;
  }

  if (postDesertSequenceTimeoutId) {
    window.clearTimeout(postDesertSequenceTimeoutId);
    postDesertSequenceTimeoutId = null;
  }

  postDesertSequenceScheduled = true;
  startPostDesertSequence();
}

function isSkipKey(event) {
  if (!event) {
    return false;
  }

  if (event.code === 'Space') {
    return true;
  }

  if (event.key === ' ' || event.key === 'Spacebar') {
    return true;
  }

  return false;
}

function handleSkipKey(event) {
  if (!isSkipKey(event) || event.repeat) {
    return;
  }

  if (skipActiveSequence()) {
    event.preventDefault();
    return;
  }

  const gameIsVisible = !gameElement.classList.contains('is-hidden');

  if (!gameIsVisible) {
    return;
  }

  event.preventDefault();

  if (!postDesertSequenceScheduled) {
    schedulePostDesertSequence();
  }

  forcePostDesertSequence();
}

runIntroSequence(() => {
  initializeGame();
});

document.addEventListener('keydown', handleSkipKey);

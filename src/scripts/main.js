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
const menuElement = document.getElementById('menu');

const introSequenceElement = document.getElementById('intro-sequence');
const introTextElement = document.getElementById('intro-text');
const introInstructionsElement = document.getElementById('intro-instructions');

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
  if (!introSequenceElement || !introTextElement || !introInstructionsElement) {
    if (typeof onComplete === 'function') {
      onComplete();
    }
    return;
  }

  const sentences = [
    'Once upon a time,...',
    'Placeholder text to be continued.',
  ];

  const sentenceDuration = 3000;
  let currentIndex = 0;
  let timerId = null;
  let isPaused = false;
  let remainingTime = sentenceDuration;
  let lastTick = 0;

  const updateInstructions = () => {
    introInstructionsElement.textContent = isPaused
      ? 'Press space to resume'
      : 'Press space to pause';
  };

  const cleanup = () => {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
    document.removeEventListener('keydown', handleSpaceToggle);
  };

  const endSequence = () => {
    cleanup();
    introSequenceElement.classList.add('is-hidden');
    introTextElement.textContent = '';
    introInstructionsElement.textContent = '';
    if (gameElement) {
      gameElement.classList.remove('is-hidden');
    }
    if (menuElement) {
      menuElement.classList.remove('is-hidden');
    }
    if (typeof onComplete === 'function') {
      onComplete();
    }
  };

  const showSentence = () => {
    if (currentIndex >= sentences.length) {
      endSequence();
      return;
    }

    introTextElement.textContent = sentences[currentIndex];
    isPaused = false;
    remainingTime = sentenceDuration;
    lastTick = Date.now();
    updateInstructions();

    timerId = window.setTimeout(() => {
      currentIndex += 1;
      showSentence();
    }, sentenceDuration);
  };

  const pauseSequence = () => {
    if (isPaused) {
      return;
    }

    const now = Date.now();
    remainingTime = Math.max(0, remainingTime - (now - lastTick));
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }

    isPaused = true;
    updateInstructions();
  };

  const resumeSequence = () => {
    if (!isPaused) {
      return;
    }

    isPaused = false;
    updateInstructions();

    if (remainingTime <= 0) {
      currentIndex += 1;
      showSentence();
      return;
    }

    lastTick = Date.now();
    timerId = window.setTimeout(() => {
      currentIndex += 1;
      showSentence();
    }, remainingTime);
  };

  function handleSpaceToggle(event) {
    if (event.code !== 'Space') {
      return;
    }

    event.preventDefault();

    if (isPaused) {
      resumeSequence();
    } else {
      pauseSequence();
    }
  }

  document.addEventListener('keydown', handleSpaceToggle);

  showSentence();
}

runIntroSequence(() => {
  initializeGame();
});

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

let activeSequenceController = null;
let postDesertSequenceScheduled = false;
let postDesertSequenceTimeoutId = null;

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

function playPauseableTextSequence({
  sentences,
  onComplete,
  hideGameOnStart = false,
  hideMenuOnStart = false,
  showGameOnComplete = false,
  showMenuOnComplete = false,
  hideContainerOnComplete = true,
  sentenceDuration = 3000,
} = {}) {
  if (!introSequenceElement || !introTextElement || !introInstructionsElement) {
    if (typeof onComplete === 'function') {
      onComplete();
    }
    return;
  }

  const normalizedSentences = Array.isArray(sentences)
    ? sentences.filter((sentence) => Boolean(sentence))
    : [sentences].filter((sentence) => Boolean(sentence));

  if (normalizedSentences.length === 0) {
    if (typeof onComplete === 'function') {
      onComplete();
    }
    return;
  }

  if (activeSequenceController?.teardown) {
    activeSequenceController.teardown({ skipCallbacks: true });
  }

  if (hideGameOnStart && gameElement) {
    gameElement.classList.add('is-hidden');
  }

  if (hideMenuOnStart && menuElement) {
    menuElement.classList.add('is-hidden');
  }

  hideAllDialogues();

  const defaultDuration = Math.max(0, Number(sentenceDuration) || 0);
  const lastSentence = normalizedSentences[normalizedSentences.length - 1];

  const state = {
    currentIndex: 0,
    timerId: null,
    isPaused: false,
    remainingTime: defaultDuration,
    lastTick: 0,
  };

  const updateInstructions = () => {
    introInstructionsElement.textContent = state.isPaused
      ? 'Press space to resume'
      : 'Press space to pause';
  };

  const clearTimer = () => {
    if (state.timerId !== null) {
      window.clearTimeout(state.timerId);
      state.timerId = null;
    }
  };

  function handleSpaceToggle(event) {
    if (event.code !== 'Space') {
      return;
    }

    event.preventDefault();

    if (state.isPaused) {
      resumeSequence();
    } else {
      pauseSequence();
    }
  }

  let controller = null;

  const finalize = ({ skipCallbacks = false } = {}) => {
    clearTimer();
    document.removeEventListener('keydown', handleSpaceToggle);

    introTextElement.textContent = hideContainerOnComplete ? '' : lastSentence;

    if (hideContainerOnComplete) {
      introSequenceElement.classList.add('is-hidden');
      introInstructionsElement.textContent = '';
    }

    if (!hideContainerOnComplete) {
      updateInstructions();
    }

    if (showGameOnComplete && gameElement) {
      gameElement.classList.remove('is-hidden');
    }

    if (showMenuOnComplete && menuElement) {
      menuElement.classList.remove('is-hidden');
    }

    if (activeSequenceController === controller) {
      activeSequenceController = null;
    }

    if (!skipCallbacks && typeof onComplete === 'function') {
      onComplete();
    }
  };

  const showSentence = ({
    nextDelay = defaultDuration,
    advanceIndex = false,
  } = {}) => {
    if (advanceIndex) {
      state.currentIndex += 1;
    }

    if (state.currentIndex >= normalizedSentences.length) {
      finalize();
      return;
    }

    introSequenceElement.classList.remove('is-hidden');
    introTextElement.textContent = normalizedSentences[state.currentIndex];
    state.isPaused = false;
    state.remainingTime = Math.max(0, Number(nextDelay) || 0);
    state.lastTick = Date.now();
    updateInstructions();

    const delay = state.remainingTime;

    if (delay <= 0) {
      showSentence({ advanceIndex: true });
      return;
    }

    state.timerId = window.setTimeout(() => {
      showSentence({ advanceIndex: true, nextDelay: defaultDuration });
    }, delay);
  };

  const pauseSequence = () => {
    if (state.isPaused) {
      return;
    }

    const now = Date.now();
    state.remainingTime = Math.max(0, state.remainingTime - (now - state.lastTick));
    clearTimer();
    state.isPaused = true;
    updateInstructions();
  };

  const resumeSequence = () => {
    if (!state.isPaused) {
      return;
    }

    state.isPaused = false;
    updateInstructions();

    if (state.remainingTime <= 0) {
      showSentence({ advanceIndex: true, nextDelay: defaultDuration });
      return;
    }

    state.lastTick = Date.now();
    state.timerId = window.setTimeout(() => {
      showSentence({ advanceIndex: true, nextDelay: defaultDuration });
    }, state.remainingTime);
  };

  controller = {
    teardown: ({ skipCallbacks = false } = {}) => {
      finalize({ skipCallbacks });
    },
  };

  activeSequenceController = controller;

  document.addEventListener('keydown', handleSpaceToggle);

  introSequenceElement.classList.remove('is-hidden');
  updateInstructions();
  showSentence();
}

function runIntroSequence(onComplete) {
  playPauseableTextSequence({
    sentences: ['Once upon a time,...', 'Placeholder text to be continued.'],
    onComplete,
    hideGameOnStart: true,
    hideMenuOnStart: true,
    showGameOnComplete: true,
    showMenuOnComplete: true,
    hideContainerOnComplete: true,
  });
}

function runSceneTransitionSequence({ onComplete } = {}) {
  playPauseableTextSequence({
    sentences: ['A moment later'],
    onComplete,
    hideGameOnStart: true,
    hideMenuOnStart: true,
    showGameOnComplete: false,
    showMenuOnComplete: false,
    hideContainerOnComplete: false,
  });
}

function schedulePostDesertSequence(delay = 0) {
  if (postDesertSequenceScheduled) {
    return;
  }

  postDesertSequenceScheduled = true;

  if (postDesertSequenceTimeoutId) {
    window.clearTimeout(postDesertSequenceTimeoutId);
  }

  const safeDelay = Math.max(0, Number(delay) || 0);

  postDesertSequenceTimeoutId = window.setTimeout(() => {
    postDesertSequenceTimeoutId = null;
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
  }, safeDelay);
}

runIntroSequence(() => {
  initializeGame();
});

let activeSequenceController = null;

function normalizeSentences(sentences) {
  if (!Array.isArray(sentences)) {
    return [sentences].filter(Boolean);
  }
  return sentences.filter(Boolean);
}

function toggleVisibility(element, shouldHide) {
  if (!element) {
    return;
  }
  element.classList.toggle('is-hidden', Boolean(shouldHide));
}

export function playPauseableTextSequence({
  sentences,
  onComplete,
  hideGameOnStart = false,
  hideMenuOnStart = false,
  showGameOnComplete = false,
  showMenuOnComplete = false,
  hideContainerOnComplete = true,
  sentenceDuration = 3000,
  elements = {},
} = {}) {
  const containerElement = elements.container ?? document.getElementById('intro-sequence');
  const textElement = elements.text ?? document.getElementById('intro-text');
  const instructionsElement = elements.instructions ?? document.getElementById('intro-instructions');
  const gameElement = elements.game ?? document.getElementById('game');
  const menuElement = elements.menu ?? document.getElementById('menu');

  const normalizedSentences = normalizeSentences(sentences);

  if (!containerElement || !textElement || !instructionsElement || normalizedSentences.length === 0) {
    if (typeof onComplete === 'function') {
      onComplete();
    }
    return null;
  }

  if (activeSequenceController?.teardown) {
    activeSequenceController.teardown({ skipCallbacks: true });
  }

  if (hideGameOnStart) {
    toggleVisibility(gameElement, true);
  }

  if (hideMenuOnStart) {
    toggleVisibility(menuElement, true);
  }

  const state = {
    currentIndex: 0,
    timerId: null,
    isPaused: false,
    remainingTime: Math.max(0, Number(sentenceDuration) || 0),
    lastTick: 0,
  };

  const updateInstructions = () => {
    if (!instructionsElement) {
      return;
    }
    instructionsElement.textContent = state.isPaused ? 'Press space to resume' : 'Press space to pause';
  };

  const clearTimer = () => {
    if (state.timerId !== null) {
      window.clearTimeout(state.timerId);
      state.timerId = null;
    }
  };

  const finalize = ({ skipCallbacks = false } = {}) => {
    clearTimer();
    document.removeEventListener('keydown', handleSpaceToggle);

    if (hideContainerOnComplete) {
      textElement.textContent = '';
      toggleVisibility(containerElement, true);
      if (instructionsElement) {
        instructionsElement.textContent = '';
      }
    } else {
      textElement.textContent = normalizedSentences[normalizedSentences.length - 1];
      updateInstructions();
    }

    if (showGameOnComplete) {
      toggleVisibility(gameElement, false);
    }

    if (showMenuOnComplete) {
      toggleVisibility(menuElement, false);
    }

    if (activeSequenceController === controller) {
      activeSequenceController = null;
    }

    if (!skipCallbacks && typeof onComplete === 'function') {
      onComplete();
    }
  };

  const advanceSentence = () => {
    state.currentIndex += 1;
    if (state.currentIndex >= normalizedSentences.length) {
      finalize();
      return;
    }

    renderCurrentSentence();
    scheduleNextTick(sentenceDuration);
  };

  const scheduleNextTick = (delay) => {
    clearTimer();

    const safeDelay = Math.max(0, Number(delay) || 0);
    state.remainingTime = safeDelay;

    if (safeDelay === 0) {
      advanceSentence();
      return;
    }

    state.lastTick = Date.now();
    state.timerId = window.setTimeout(() => {
      advanceSentence();
    }, safeDelay);
  };

  const renderCurrentSentence = () => {
    toggleVisibility(containerElement, false);
    textElement.textContent = normalizedSentences[state.currentIndex];
    state.isPaused = false;
    updateInstructions();
  };

  const pauseSequence = () => {
    if (state.isPaused || state.timerId === null) {
      return;
    }

    const elapsed = Date.now() - state.lastTick;
    state.remainingTime = Math.max(0, state.remainingTime - elapsed);
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
    scheduleNextTick(state.remainingTime);
  };

  const handleSpaceToggle = (event) => {
    if (event.code !== 'Space' && event.key !== ' ' && event.key !== 'Spacebar') {
      return;
    }

    event.preventDefault();

    if (state.isPaused) {
      resumeSequence();
    } else {
      pauseSequence();
    }
  };

  const controller = {
    teardown: ({ skipCallbacks = false } = {}) => {
      finalize({ skipCallbacks });
    },
  };

  activeSequenceController = controller;

  document.addEventListener('keydown', handleSpaceToggle);

  renderCurrentSentence();
  scheduleNextTick(sentenceDuration);

  return controller;
}

const params = new URLSearchParams(window.location.search);
const currentMode = params.get('mode') === 'builder' ? 'builder' : 'game';

function navigateToMode(targetMode) {
  if (targetMode === currentMode) {
    return;
  }

  const nextParams = new URLSearchParams(window.location.search);
  if (targetMode === 'builder') {
    nextParams.set('mode', 'builder');
  } else {
    nextParams.delete('mode');
  }

  const query = nextParams.toString();
  const hash = window.location.hash;
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${hash}`;

  window.location.assign(nextUrl);
}

const switcherElement = document.getElementById('mode-switcher');

if (switcherElement) {
  const buttons = switcherElement.querySelectorAll('[data-mode-target]');
  buttons.forEach((button) => {
    const targetMode = button.dataset.modeTarget;
    if (!targetMode) {
      return;
    }
    button.disabled = targetMode === currentMode;
    button.addEventListener('click', () => navigateToMode(targetMode));
  });
}

if (currentMode === 'builder') {
  import('./builder/main.js');
  document.body.dataset.mode = 'builder';
} else {
  import('./main.js');
  document.body.dataset.mode = 'game';
}

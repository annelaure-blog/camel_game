const layoutModes = [];

const mediaQueries = layoutModes.map((mode) => ({
  ...mode,
  matcher: typeof window !== 'undefined' ? window.matchMedia(mode.query) : null,
}));

const styleElementId = 'scene-layout-styles';
let listenersBound = false;
let currentScene = null;
let currentGameElement = null;

function getActiveMode() {
  const active = mediaQueries.find((mode) => mode.matcher && mode.matcher.matches);
  return active ? active.name : 'default';
}

function resolveResponsiveValue(value, mode) {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  if (value[mode] != null) {
    return value[mode];
  }

  if (value.default != null) {
    return value.default;
  }

  if (value.base != null) {
    return value.base;
  }

  const firstKey = Object.keys(value)[0];
  return value[firstKey];
}

function resolvePosition(position, mode) {
  const resolved = resolveResponsiveValue(position, mode);
  if (!resolved) {
    return { x: 0, y: 0 };
  }
  return resolved;
}

function formatDimension(value, mode) {
  const resolved = resolveResponsiveValue(value, mode);
  if (resolved == null) {
    return null;
  }
  if (typeof resolved === 'number') {
    return `calc(${resolved} * 100%)`;
  }
  return resolved;
}

function renderSceneLayout(gameElement, scene) {
  if (typeof document === 'undefined' || !gameElement || !scene) {
    return;
  }

  currentScene = scene;
  currentGameElement = gameElement;

  const mode = getActiveMode();
  let styleElement = document.getElementById(styleElementId);

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleElementId;
    document.head.appendChild(styleElement);
  }

  const rules = [];

  if (Array.isArray(scene.ambients)) {
    scene.ambients.forEach((ambient) => {
      const position = resolvePosition(ambient.position, mode);
      const fontScale = resolveResponsiveValue(ambient.fontScale, mode);
      const declarations = [
        `--pos-x: ${position.x}`,
        `--pos-y: ${position.y}`,
      ];
      if (fontScale) {
        declarations.push(`--font-scale: ${fontScale}`);
      }
      rules.push(`#game [data-ambient="${ambient.id}"] { ${declarations.join('; ')}; }`);
    });
  }

  if (scene.labels && typeof scene.labels === 'object') {
    Object.entries(scene.labels).forEach(([name, config]) => {
      const position = resolvePosition(config.position, mode);
      const declarations = [
        `--pos-x: ${position.x}`,
        `--pos-y: ${position.y}`,
      ];

      if (config.size) {
        const width = formatDimension(config.size.width, mode);
        const height = formatDimension(config.size.height, mode);
        if (width) {
          declarations.push(`--size-width: ${width}`);
        }
        if (height) {
          declarations.push(`--size-height: ${height}`);
        }
      }

      const fontScale = resolveResponsiveValue(config.fontScale, mode);
      if (fontScale) {
        declarations.push(`--font-scale: ${fontScale}`);
      }

      if (config.layer) {
        declarations.push(`--layer: ${config.layer}`);
      }

      rules.push(`#game .label[data-name="${name}"] { ${declarations.join('; ')}; }`);
    });
  }

  styleElement.textContent = rules.join('\n');

  if (!listenersBound) {
    const rerender = () => {
      if (currentScene && currentGameElement) {
        renderSceneLayout(currentGameElement, currentScene);
      }
    };

    mediaQueries.forEach((mode) => {
      if (mode.matcher) {
        mode.matcher.addEventListener('change', rerender);
      }
    });
    window.addEventListener('resize', rerender);
    listenersBound = true;
  }
}

export { renderSceneLayout };

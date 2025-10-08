const layoutModes = [];

const sceneLayout = {
  ambients: [
    { id: 'dunes-west-1', position: { default: { x: 0.03, y: 0.05 } }, fontScale: 1 },
    { id: 'dunes-west-2', position: { default: { x: 0.15, y: 0.06 } } },
    { id: 'dunes-mid-1', position: { default: { x: 0.35, y: 0.07 } } },
    { id: 'dunes-mid-2', position: { default: { x: 0.55, y: 0.05 } } },
    { id: 'dunes-east-1', position: { default: { x: 0.75, y: 0.06 } } },
    { id: 'dunes-east-2', position: { default: { x: 0.9, y: 0.07 } } },
    { id: 'dunes-south-1', position: { default: { x: 0.1, y: 0.09 } } },
    { id: 'dunes-south-2', position: { default: { x: 0.4, y: 0.1 } } },
    { id: 'dunes-south-3', position: { default: { x: 0.7, y: 0.09 } } },
  ],
  labels: {
    'palm tree': {
      position: {
        default: { x: 0.08, y: 0.32 },
      },
      size: {
        width: '150px',
        height: '450px',
      },
      fontScale: { default: 2.2 },
      layer: 4,
    },
    carpet: {
      position: { default: { x: 0.25, y: 0.45 } },
      size: {
        width: '350px',
        height: '250px',
      },
      fontScale: { default: 1.6 },
      layer: 1,
    },
    bedouins: {
      position: { default: { x: 0.32, y: 0.54 }, mobile: { x: 0.35, y: 0.44 } },
      size: {
        width: '250px',
        height: '130px',
      },
      fontScale: { default: 1.5, mobile: 1.35 },
      layer: 2,
    },
    camel: {
      position: { default: { x: 0.60, y: 0.42 } },
      size: {
        width: '150px',
        height: '100px',
      },
      fontScale: { default: 1.5 },
      layer: 3,
    },
    pond: {
      position: { default: { x: 0.75, y: 0.42 } },
      size: {
        width: '250px',
        height: '100px',
      },
      fontScale: { default: 1.4 },
      layer: 2,
    },
    bucket: {
      position: { default: { x: 0.84, y: 0.32 } },
      size: {
        width: '80px',
        height: '50px',
      },
      fontScale: { default: 0.55 },
      layer: 2,
    },
    me: {
      size: {
        width: '80px',
        height: '100px',
      },
    },
  },
};

const mediaQueries = layoutModes.map((mode) => ({
  ...mode,
  matcher: typeof window !== 'undefined' ? window.matchMedia(mode.query) : null,
}));

const styleElementId = 'scene-layout-styles';
let listenersBound = false;

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

function renderSceneLayout(gameElement) {
  if (typeof document === 'undefined') {
    return;
  }

  const mode = getActiveMode();
  let styleElement = document.getElementById(styleElementId);

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleElementId;
    document.head.appendChild(styleElement);
  }

  const rules = [];

  sceneLayout.ambients.forEach((ambient) => {
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

  Object.entries(sceneLayout.labels).forEach(([name, config]) => {
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

  styleElement.textContent = rules.join('\n');

  if (!listenersBound) {
    const rerender = () => renderSceneLayout(gameElement);
    mediaQueries.forEach((mode) => {
      if (mode.matcher) {
        mode.matcher.addEventListener('change', rerender);
      }
    });
    window.addEventListener('resize', rerender);
    listenersBound = true;
  }
}

export { renderSceneLayout, sceneLayout };

const layoutModes = [
  { name: 'mobile', query: '(max-width: 768px)' },
];

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
        default: { x: 0.08, y: 0.24 },
        mobile: { x: 0.12, y: 0.3 },
      },
      size: {
        width: { default: 0.12, mobile: 0.16 },
        height: { default: 0.6, mobile: 0.58 },
      },
      fontScale: { default: 2.2, mobile: 1.9 },
      layer: 4,
    },
    carpet: {
      position: { default: { x: 0.33, y: 0.76 }, mobile: { x: 0.35, y: 0.78 } },
      size: {
        width: { default: 0.32, mobile: 0.4 },
        height: { default: 0.16, mobile: 0.18 },
      },
      fontScale: { default: 1.6, mobile: 1.4 },
      layer: 1,
    },
    bedouins: {
      position: { default: { x: 0.32, y: 0.6 }, mobile: { x: 0.35, y: 0.62 } },
      size: {
        width: { default: 0.32, mobile: 0.44 },
        height: { default: 0.12, mobile: 0.14 },
      },
      fontScale: { default: 1.5, mobile: 1.35 },
      layer: 2,
    },
    camel: {
      position: { default: { x: 0.65, y: 0.34 }, mobile: { x: 0.6, y: 0.32 } },
      fontScale: { default: 1.5, mobile: 1.4 },
      layer: 3,
    },
    pond: {
      position: { default: { x: 0.75, y: 0.42 }, mobile: { x: 0.7, y: 0.46 } },
      size: {
        width: { default: 0.22, mobile: 0.28 },
        height: { default: 0.1, mobile: 0.12 },
      },
      fontScale: { default: 1.4, mobile: 1.3 },
      layer: 2,
    },
    bucket: {
      position: { default: { x: 0.84, y: 0.36 }, mobile: { x: 0.8, y: 0.38 } },
      size: {
        width: {
          default: 'clamp(16px, 3vw, 28px)',
          mobile: 'clamp(18px, 6vw, 28px)',
        },
        height: {
          default: 'clamp(32px, 6vw, 56px)',
          mobile: 'clamp(36px, 10vw, 64px)',
        },
      },
      fontScale: { default: 0.55, mobile: 0.6 },
      layer: 2,
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

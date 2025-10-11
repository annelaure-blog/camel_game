const STORAGE_KEY = 'camel-game-builder-state';
const STATE_VERSION = 1;

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch (error) {
      // Fall through to JSON method
    }
  }

  return JSON.parse(JSON.stringify(value));
}

function normalizeScene(scene) {
  if (!scene || typeof scene !== 'object') {
    return null;
  }

  const name = scene.name || scene.id || null;
  if (!name) {
    return null;
  }

  const data = deepClone(scene);
  data.name = name;

  return {
    id: name,
    name,
    data,
    dialogues: [],
    interactions: [],
  };
}

export function loadBuilderState() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (parsed.version && parsed.version !== STATE_VERSION) {
      return parsed;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to parse builder state from localStorage:', error);
    return null;
  }
}

export function saveBuilderState(state) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const payload = {
      version: STATE_VERSION,
      updatedAt: Date.now(),
      ...deepClone(state),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.warn('Failed to save builder state to localStorage:', error);
    return false;
  }
}

export function createInitialStateFromScenes(scenes) {
  const entries = [];

  if (Array.isArray(scenes)) {
    scenes.forEach((scene) => {
      const entry = normalizeScene(scene);
      if (entry) {
        entries.push(entry);
      }
    });
  } else if (scenes && typeof scenes === 'object') {
    Object.values(scenes).forEach((scene) => {
      const entry = normalizeScene(scene);
      if (entry) {
        entries.push(entry);
      }
    });
  }

  return {
    version: STATE_VERSION,
    updatedAt: Date.now(),
    scenes: entries,
  };
}

export function upsertSceneEntry({ state, scene }) {
  if (!state || !scene) {
    return state;
  }

  const existingIndex = state.scenes.findIndex((entry) => entry.id === scene.id);
  if (existingIndex >= 0) {
    state.scenes[existingIndex] = deepClone(scene);
  } else {
    state.scenes.push(deepClone(scene));
  }

  return state;
}

export function deleteSceneEntry({ state, id }) {
  if (!state || !id) {
    return state;
  }

  state.scenes = state.scenes.filter((entry) => entry.id !== id);
  return state;
}

export function reorderSceneEntries({ state, fromIndex, toIndex }) {
  if (!state || !Array.isArray(state.scenes)) {
    return state;
  }

  const scenes = state.scenes;
  if (
    fromIndex < 0 ||
    fromIndex >= scenes.length ||
    toIndex < 0 ||
    toIndex >= scenes.length ||
    fromIndex === toIndex
  ) {
    return state;
  }

  const [moved] = scenes.splice(fromIndex, 1);
  scenes.splice(toIndex, 0, moved);
  state.scenes = scenes;
  return state;
}

export function cloneBuilderState(state) {
  return deepClone(state);
}

export { STORAGE_KEY as BUILDER_STORAGE_KEY, STATE_VERSION as BUILDER_STATE_VERSION };

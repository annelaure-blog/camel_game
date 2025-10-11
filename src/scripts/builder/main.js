import { DialogueUI } from '../ui.js';
import { scenes as runtimeScenes } from '../scenes/index.js';
import {
  cloneBuilderState,
  createInitialStateFromScenes,
  loadBuilderState,
  saveBuilderState,
} from './storage.js';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const MIN_LABEL_SIZE = 24;

const gameElement = document.getElementById('game');
const menuElement = document.getElementById('menu');
const introElement = document.getElementById('intro-sequence');
const builderRoot = document.getElementById('builder-root');

if (gameElement) {
  gameElement.classList.add('is-hidden');
}
if (menuElement) {
  menuElement.classList.add('is-hidden');
}
if (introElement) {
  introElement.classList.add('is-hidden');
}

if (!builderRoot) {
  throw new Error('Builder root element is missing');
}

builderRoot.classList.remove('is-hidden');

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch (error) {
      // ignore and fallback
    }
  }
  return JSON.parse(JSON.stringify(value));
}

function sanitizeSceneName(value, fallback) {
  if (!value) {
    return fallback;
  }
  return value.toString().trim();
}

function sanitizeId(value, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
  return normalized || fallback;
}

function ensureSceneStructure(scene) {
  if (!scene.data) {
    scene.data = { name: scene.name, ambients: [], labels: {} };
  }
  if (!scene.data.ambients) {
    scene.data.ambients = [];
  }
  if (!scene.data.labels) {
    scene.data.labels = {};
  }
  if (!Array.isArray(scene.dialogues)) {
    scene.dialogues = [];
  }
  if (!Array.isArray(scene.interactions)) {
    scene.interactions = [];
  }
  return scene;
}

const storedState = loadBuilderState();
const initialState = storedState && Array.isArray(storedState.scenes) && storedState.scenes.length
  ? storedState
  : createInitialStateFromScenes(runtimeScenes);

initialState.scenes = (initialState.scenes || []).map((scene, index) => {
  const ensured = ensureSceneStructure(scene);
  if (!ensured.id) {
    ensured.id = sanitizeId(ensured.name, `scene-${index + 1}`);
  }
  ensured.name = sanitizeSceneName(ensured.name, `scene-${index + 1}`);
  ensured.data.name = ensured.name;
  return ensured;
});

if (!initialState.scenes.length) {
  initialState.scenes.push(
    ensureSceneStructure({
      id: 'scene-1',
      name: 'scene-1',
      data: { name: 'scene-1', ambients: [], labels: {} },
      dialogues: [],
      interactions: [],
    }),
  );
}

const builderState = initialState;
let selectedSceneId = builderState.scenes[0]?.id || null;
let selectedLabelName = null;
let selectedDialogueId = null;
let isDrawing = false;
let drawStart = null;
let dragState = null;
let hasUnsavedChanges = false;

const template = `
  <div class="builder-app">
    <aside class="builder-app__sidebar">
      <header class="builder-sidebar__header">
        <h1>Scene Builder</h1>
        <button type="button" class="builder-button builder-button--primary" data-action="save">Save</button>
        <div class="builder-status" data-status-message>Saved</div>
      </header>
      <div class="builder-section">
        <div class="builder-section__header">
          <h2>Scenes</h2>
          <button type="button" class="builder-button" data-action="add-scene">Add Scene</button>
        </div>
        <ul class="builder-scene-list" data-scene-list></ul>
      </div>
    </aside>
    <main class="builder-app__main">
      <section class="builder-canvas-section">
        <div class="builder-toolbar">
          <div class="builder-toolbar__group">
            <button type="button" class="builder-button" data-action="draw-label">Draw rectangle</button>
            <button type="button" class="builder-button" data-action="add-label">Add component</button>
          </div>
          <div class="builder-toolbar__group">
            <label class="builder-field">
              <span class="builder-field__label">Scene title</span>
              <input type="text" class="builder-input" data-scene-name />
            </label>
          </div>
        </div>
        <div class="builder-canvas-wrapper">
          <div class="builder-canvas" data-canvas></div>
        </div>
      </section>
      <section class="builder-panels">
        <div class="builder-panel" data-panel="component">
          <header class="builder-panel__header">
            <h3>Component</h3>
            <button type="button" class="builder-button builder-button--danger" data-action="delete-label">Delete</button>
          </header>
          <div class="builder-panel__body">
            <form data-component-form class="builder-form">
              <div class="builder-field">
                <label class="builder-field__label">Name</label>
                <input type="text" class="builder-input" name="name" />
              </div>
              <div class="builder-field">
                <label class="builder-field__label">Label text</label>
                <input type="text" class="builder-input" name="text" />
              </div>
              <div class="builder-field-group">
                <div class="builder-field">
                  <label class="builder-field__label">Position X</label>
                  <input type="number" step="0.01" min="0" max="1" class="builder-input" name="posX" />
                </div>
                <div class="builder-field">
                  <label class="builder-field__label">Position Y</label>
                  <input type="number" step="0.01" min="0" max="1" class="builder-input" name="posY" />
                </div>
              </div>
              <div class="builder-field-group">
                <div class="builder-field">
                  <label class="builder-field__label">Width (px)</label>
                  <input type="number" min="${MIN_LABEL_SIZE}" class="builder-input" name="width" />
                </div>
                <div class="builder-field">
                  <label class="builder-field__label">Height (px)</label>
                  <input type="number" min="${MIN_LABEL_SIZE}" class="builder-input" name="height" />
                </div>
              </div>
              <div class="builder-field-group">
                <div class="builder-field">
                  <label class="builder-field__label">Layer</label>
                  <input type="number" class="builder-input" name="layer" />
                </div>
                <div class="builder-field">
                  <label class="builder-field__label">Font scale</label>
                  <input type="number" step="0.1" class="builder-input" name="fontScale" />
                </div>
              </div>
              <div class="builder-field">
                <label class="builder-field__label">Classes</label>
                <input type="text" class="builder-input" name="classes" placeholder="comma separated" />
              </div>
            </form>
          </div>
        </div>
        <div class="builder-panel" data-panel="dialogue">
          <header class="builder-panel__header">
            <h3>Dialogues</h3>
            <button type="button" class="builder-button" data-action="add-dialogue">Add dialogue</button>
          </header>
          <div class="builder-panel__body">
            <div class="builder-dialogue-layout">
              <aside class="builder-dialogue-list" data-dialogue-list></aside>
              <form class="builder-form builder-dialogue-form" data-dialogue-form>
                <div class="builder-field-group">
                  <div class="builder-field">
                    <label class="builder-field__label">Identifier</label>
                    <input type="text" class="builder-input" name="dialogueId" />
                  </div>
                  <div class="builder-field">
                    <label class="builder-field__label">Speaker</label>
                    <input type="text" class="builder-input" name="dialogueSpeaker" />
                  </div>
                </div>
                <div class="builder-field-group">
                  <div class="builder-field">
                    <label class="builder-field__label">Anchor</label>
                    <select class="builder-input" name="dialogueAnchor"></select>
                  </div>
                  <div class="builder-field">
                    <label class="builder-field__label">Duration (ms)</label>
                    <input type="number" min="0" class="builder-input" name="dialogueDuration" />
                  </div>
                </div>
                <div class="builder-field builder-field--checkbox">
                  <label>
                    <input type="checkbox" name="dialogueThought" /> Thought bubble
                  </label>
                </div>
                <div class="builder-field">
                  <label class="builder-field__label">Dialogue text</label>
                  <textarea class="builder-input builder-textarea" name="dialogueText"></textarea>
                </div>
                <div class="builder-dialogue-actions">
                  <button type="button" class="builder-button" data-action="play-dialogue">Play</button>
                  <button type="button" class="builder-button builder-button--danger" data-action="delete-dialogue">Delete</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="builder-panel" data-panel="interactions">
          <header class="builder-panel__header">
            <h3>Interactions</h3>
            <button type="button" class="builder-button" data-action="add-interaction">Add interaction</button>
          </header>
          <div class="builder-panel__body" data-interaction-list></div>
        </div>
      </section>
    </main>
  </div>
`;

builderRoot.innerHTML = template;
builderRoot.innerHTML = template;

const sceneListElement = builderRoot.querySelector('[data-scene-list]');
const saveButton = builderRoot.querySelector('[data-action="save"]');
const addSceneButton = builderRoot.querySelector('[data-action="add-scene"]');
const sceneNameInput = builderRoot.querySelector('[data-scene-name]');
const statusElement = builderRoot.querySelector('[data-status-message]');
const canvasElement = builderRoot.querySelector('[data-canvas]');
const drawButton = builderRoot.querySelector('[data-action="draw-label"]');
const addLabelButton = builderRoot.querySelector('[data-action="add-label"]');
const deleteLabelButton = builderRoot.querySelector('[data-action="delete-label"]');
const componentForm = builderRoot.querySelector('[data-component-form]');
const dialogueListElement = builderRoot.querySelector('[data-dialogue-list]');
const dialogueForm = builderRoot.querySelector('[data-dialogue-form]');
const addDialogueButton = builderRoot.querySelector('[data-action="add-dialogue"]');
const playDialogueButton = builderRoot.querySelector('[data-action="play-dialogue"]');
const deleteDialogueButton = builderRoot.querySelector('[data-action="delete-dialogue"]');
const interactionListElement = builderRoot.querySelector('[data-interaction-list]');
const addInteractionButton = builderRoot.querySelector('[data-action="add-interaction"]');

canvasElement.style.width = `${CANVAS_WIDTH}px`;
canvasElement.style.height = `${CANVAS_HEIGHT}px`;

const previewLayer = document.createElement('div');
previewLayer.className = 'builder-preview-layer';
canvasElement.appendChild(previewLayer);

const fallbackAnchor = document.createElement('div');
fallbackAnchor.className = 'builder-preview-anchor';
canvasElement.appendChild(fallbackAnchor);

const dialogueElements = {};
const actorElements = {};
const dialogueUI = new DialogueUI({
  dialogueElements,
  actorElements,
  gameElement: canvasElement,
});

const labelElementMap = new Map();

function markDirty() {
  hasUnsavedChanges = true;
  if (statusElement) {
    statusElement.textContent = 'Unsaved changes';
  }
}

function markSaved() {
  hasUnsavedChanges = false;
  if (statusElement) {
    const timestamp = new Date().toLocaleTimeString();
    statusElement.textContent = `Saved ${timestamp}`;
  }
}

function getSelectedScene() {
  return builderState.scenes.find((scene) => scene.id === selectedSceneId) || null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function ensurePosition(config) {
  if (!config.position) {
    config.position = { default: { x: 0.5, y: 0.5 } };
  }
  if (!config.position.default) {
    config.position.default = { x: 0.5, y: 0.5 };
  }
  return config.position.default;
}

function ensureSize(config) {
  if (!config.size) {
    config.size = { width: `${MIN_LABEL_SIZE * 4}px`, height: `${MIN_LABEL_SIZE * 3}px` };
  }
  if (!config.size.width) {
    config.size.width = `${MIN_LABEL_SIZE * 4}px`;
  }
  if (!config.size.height) {
    config.size.height = `${MIN_LABEL_SIZE * 3}px`;
  }
  return config.size;
}

function getLabelConfig(name) {
  const scene = getSelectedScene();
  if (!scene) {
    return null;
  }
  scene.data.labels = scene.data.labels || {};
  return scene.data.labels[name] || null;
}

function updateLabelElementPosition(element, config) {
  const position = ensurePosition(config);
  const size = ensureSize(config);
  const width = parseFloat(size.width) || MIN_LABEL_SIZE * 4;
  const height = parseFloat(size.height) || MIN_LABEL_SIZE * 3;
  element.style.width = `${Math.max(width, MIN_LABEL_SIZE)}px`;
  element.style.height = `${Math.max(height, MIN_LABEL_SIZE)}px`;
  element.style.left = `${clamp(position.x, 0, 1) * 100}%`;
  element.style.top = `${clamp(position.y, 0, 1) * 100}%`;
}

function getAllLabelNames(scene) {
  const labels = scene?.data?.labels || {};
  return Object.keys(labels);
}

function generateUniqueLabelName(baseName = 'component') {
  const scene = getSelectedScene();
  if (!scene) {
    return baseName;
  }
  const labels = getAllLabelNames(scene);
  let counter = labels.length + 1;
  let candidate = `${baseName}-${counter}`;
  while (labels.includes(candidate)) {
    counter += 1;
    candidate = `${baseName}-${counter}`;
  }
  return candidate;
}

function renderSceneList() {
  if (!sceneListElement) {
    return;
  }

  sceneListElement.innerHTML = '';

  builderState.scenes.forEach((scene, index) => {
    const item = document.createElement('li');
    item.className = 'builder-scene-list__item';
    item.dataset.id = scene.id;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `builder-scene-list__button${scene.id === selectedSceneId ? ' is-active' : ''}`;
    button.textContent = scene.name;
    button.addEventListener('click', () => {
      selectedSceneId = scene.id;
      selectedLabelName = null;
      selectedDialogueId = null;
      renderAll();
    });
    item.appendChild(button);

    const controls = document.createElement('div');
    controls.className = 'builder-scene-list__controls';

    const upButton = document.createElement('button');
    upButton.type = 'button';
    upButton.className = 'builder-icon-button';
    upButton.textContent = '▲';
    upButton.title = 'Move up';
    upButton.disabled = index === 0;
    upButton.addEventListener('click', () => {
      if (index === 0) {
        return;
      }
      const [removed] = builderState.scenes.splice(index, 1);
      builderState.scenes.splice(index - 1, 0, removed);
      markDirty();
      renderSceneList();
    });
    controls.appendChild(upButton);

    const downButton = document.createElement('button');
    downButton.type = 'button';
    downButton.className = 'builder-icon-button';
    downButton.textContent = '▼';
    downButton.title = 'Move down';
    downButton.disabled = index === builderState.scenes.length - 1;
    downButton.addEventListener('click', () => {
      if (index === builderState.scenes.length - 1) {
        return;
      }
      const [removed] = builderState.scenes.splice(index, 1);
      builderState.scenes.splice(index + 1, 0, removed);
      markDirty();
      renderSceneList();
    });
    controls.appendChild(downButton);

    const duplicateButton = document.createElement('button');
    duplicateButton.type = 'button';
    duplicateButton.className = 'builder-icon-button';
    duplicateButton.textContent = '⧉';
    duplicateButton.title = 'Duplicate scene';
    duplicateButton.addEventListener('click', () => {
      const duplicate = deepClone(scene);
      duplicate.id = `${scene.id}-copy-${Date.now()}`;
      duplicate.name = `${scene.name} copy`;
      duplicate.data.name = duplicate.name;
      builderState.scenes.splice(index + 1, 0, ensureSceneStructure(duplicate));
      selectedSceneId = duplicate.id;
      selectedLabelName = null;
      selectedDialogueId = null;
      markDirty();
      renderAll();
    });
    controls.appendChild(duplicateButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'builder-icon-button builder-icon-button--danger';
    deleteButton.textContent = '✕';
    deleteButton.title = 'Delete scene';
    deleteButton.disabled = builderState.scenes.length <= 1;
    deleteButton.addEventListener('click', () => {
      if (builderState.scenes.length <= 1) {
        return;
      }
      builderState.scenes.splice(index, 1);
      if (selectedSceneId === scene.id) {
        selectedSceneId = builderState.scenes[0]?.id || null;
        selectedLabelName = null;
        selectedDialogueId = null;
      }
      markDirty();
      renderAll();
    });
    controls.appendChild(deleteButton);

    item.appendChild(controls);
    sceneListElement.appendChild(item);
  });
}

function selectLabel(name) {
  selectedLabelName = name;
  updateComponentPanel();
  renderSceneCanvas();
}

function handleLabelPointerDown(event, name) {
  event.stopPropagation();
  selectLabel(name);

  const labelConfig = getLabelConfig(name);
  if (!labelConfig) {
    return;
  }

  const position = ensurePosition(labelConfig);
  const canvasRect = canvasElement.getBoundingClientRect();
  const pointerX = (event.clientX - canvasRect.left) / canvasRect.width;
  const pointerY = (event.clientY - canvasRect.top) / canvasRect.height;

  dragState = {
    mode: 'move',
    name,
    offsetX: pointerX - position.x,
    offsetY: pointerY - position.y,
  };

  canvasElement.setPointerCapture(event.pointerId);
}

function handleResizePointerDown(event, name) {
  event.stopPropagation();
  selectLabel(name);

  const labelConfig = getLabelConfig(name);
  if (!labelConfig) {
    return;
  }

  const size = ensureSize(labelConfig);
  const startWidth = parseFloat(size.width) || MIN_LABEL_SIZE * 4;
  const startHeight = parseFloat(size.height) || MIN_LABEL_SIZE * 3;

  dragState = {
    mode: 'resize',
    name,
    startWidth,
    startHeight,
    startX: event.clientX,
    startY: event.clientY,
  };

  canvasElement.setPointerCapture(event.pointerId);
}
function updateComponentPanel() {
  if (!componentForm) {
    return;
  }

  const inputs = componentForm.querySelectorAll('.builder-input');
  inputs.forEach((input) => {
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.value = '';
    }
  });

  const scene = getSelectedScene();
  if (!scene || !selectedLabelName) {
    componentForm.setAttribute('data-empty', 'true');
    if (deleteLabelButton) {
      deleteLabelButton.disabled = true;
    }
    return;
  }

  componentForm.removeAttribute('data-empty');
  if (deleteLabelButton) {
    deleteLabelButton.disabled = false;
  }

  const config = getLabelConfig(selectedLabelName);
  if (!config) {
    return;
  }

  const position = ensurePosition(config);
  const size = ensureSize(config);

  const nameField = componentForm.elements.namedItem('name');
  if (nameField) {
    nameField.value = selectedLabelName;
  }

  const textField = componentForm.elements.namedItem('text');
  if (textField) {
    textField.value = config.text || selectedLabelName;
  }

  const posXField = componentForm.elements.namedItem('posX');
  if (posXField) {
    posXField.value = Number(position.x || 0).toFixed(2);
  }

  const posYField = componentForm.elements.namedItem('posY');
  if (posYField) {
    posYField.value = Number(position.y || 0).toFixed(2);
  }

  const widthField = componentForm.elements.namedItem('width');
  if (widthField) {
    widthField.value = Math.round(parseFloat(size.width) || MIN_LABEL_SIZE * 4);
  }

  const heightField = componentForm.elements.namedItem('height');
  if (heightField) {
    heightField.value = Math.round(parseFloat(size.height) || MIN_LABEL_SIZE * 3);
  }

  const layerField = componentForm.elements.namedItem('layer');
  if (layerField) {
    layerField.value = config.layer != null ? Number(config.layer) : '';
  }

  const fontScaleField = componentForm.elements.namedItem('fontScale');
  if (fontScaleField) {
    const defaultScale = config.fontScale?.default ?? config.fontScale;
    fontScaleField.value = defaultScale != null ? Number(defaultScale) : '';
  }

  const classesField = componentForm.elements.namedItem('classes');
  if (classesField) {
    classesField.value = Array.isArray(config.classes) ? config.classes.join(', ') : '';
  }
}

function renderSceneCanvas() {
  labelElementMap.clear();
  const scene = getSelectedScene();
  const hasLabels = scene && Object.keys(scene.data?.labels || {}).length > 0;
  canvasElement.classList.toggle('is-empty', !hasLabels);

  const existingLabels = canvasElement.querySelectorAll('.builder-label');
  existingLabels.forEach((element) => {
    if (element.parentElement === canvasElement) {
      element.remove();
    }
  });

  if (!scene) {
    return;
  }

  const labels = scene.data.labels || {};
  Object.keys(labels).forEach((name) => {
    const config = labels[name];
    const element = document.createElement('div');
    element.className = `builder-label${selectedLabelName === name ? ' is-selected' : ''}`;
    element.dataset.labelName = name;
    element.textContent = config.text || name;
    element.style.transform = 'translate(-50%, -50%)';
    element.style.zIndex = config.layer != null ? `${config.layer}` : '2';

    updateLabelElementPosition(element, config);

    element.addEventListener('pointerdown', (event) => handleLabelPointerDown(event, name));

    const handle = document.createElement('div');
    handle.className = 'builder-label__handle';
    handle.title = 'Resize';
    handle.addEventListener('pointerdown', (event) => handleResizePointerDown(event, name));
    element.appendChild(handle);

    canvasElement.appendChild(element);
    labelElementMap.set(name, element);
  });
}

function updateSceneNameInput() {
  if (!sceneNameInput) {
    return;
  }
  const scene = getSelectedScene();
  sceneNameInput.value = scene ? scene.name : '';
}

function updateDialogueList() {
  if (!dialogueListElement) {
    return;
  }

  dialogueListElement.innerHTML = '';

  const scene = getSelectedScene();
  const dialogues = scene ? scene.dialogues : [];

  if (!dialogues || !dialogues.length) {
    const empty = document.createElement('div');
    empty.className = 'builder-empty-state';
    empty.textContent = 'No dialogues yet';
    dialogueListElement.appendChild(empty);
    return;
  }

  dialogues.forEach((dialogue) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `builder-dialogue-list__item${dialogue.id === selectedDialogueId ? ' is-active' : ''}`;
    button.textContent = dialogue.id || '(unnamed)';
    button.addEventListener('click', () => {
      selectedDialogueId = dialogue.id;
      updateDialogueForm();
      updateDialogueList();
    });
    dialogueListElement.appendChild(button);
  });
}

function updateDialogueForm() {
  if (!dialogueForm) {
    return;
  }

  const scene = getSelectedScene();
  const dialogue = scene?.dialogues?.find((entry) => entry.id === selectedDialogueId) || null;

  const formElements = {
    id: dialogueForm.elements.namedItem('dialogueId'),
    speaker: dialogueForm.elements.namedItem('dialogueSpeaker'),
    anchor: dialogueForm.elements.namedItem('dialogueAnchor'),
    duration: dialogueForm.elements.namedItem('dialogueDuration'),
    text: dialogueForm.elements.namedItem('dialogueText'),
    thought: dialogueForm.elements.namedItem('dialogueThought'),
  };

  const labelNames = getAllLabelNames(scene);

  if (formElements.anchor) {
    formElements.anchor.innerHTML = '';
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'None';
    formElements.anchor.appendChild(noneOption);

    labelNames.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      formElements.anchor.appendChild(option);
    });
  }

  if (!dialogue) {
    dialogueForm.setAttribute('data-empty', 'true');
    if (formElements.id) formElements.id.value = '';
    if (formElements.speaker) formElements.speaker.value = '';
    if (formElements.anchor) formElements.anchor.value = '';
    if (formElements.duration) formElements.duration.value = '';
    if (formElements.text) formElements.text.value = '';
    if (formElements.thought) formElements.thought.checked = false;
    if (playDialogueButton) playDialogueButton.disabled = true;
    if (deleteDialogueButton) deleteDialogueButton.disabled = true;
    return;
  }

  dialogueForm.removeAttribute('data-empty');
  if (formElements.id) formElements.id.value = dialogue.id || '';
  if (formElements.speaker) formElements.speaker.value = dialogue.speaker || '';
  if (formElements.anchor) formElements.anchor.value = dialogue.anchor || '';
  if (formElements.duration) {
    formElements.duration.value = dialogue.duration != null ? Number(dialogue.duration) : '';
  }
  if (formElements.text) formElements.text.value = dialogue.text || '';
  if (formElements.thought) formElements.thought.checked = Boolean(dialogue.isThought);
  if (playDialogueButton) playDialogueButton.disabled = false;
  if (deleteDialogueButton) deleteDialogueButton.disabled = false;
}

function renderInteractionList() {
  if (!interactionListElement) {
    return;
  }

  interactionListElement.innerHTML = '';

  const scene = getSelectedScene();
  const interactions = scene ? scene.interactions : [];

  if (!interactions || !interactions.length) {
    const empty = document.createElement('div');
    empty.className = 'builder-empty-state';
    empty.textContent = 'No interactions configured';
    interactionListElement.appendChild(empty);
    return;
  }

  const labelNames = getAllLabelNames(scene);
  const dialogues = scene.dialogues || [];

  interactions.forEach((interaction, index) => {
    const row = document.createElement('div');
    row.className = 'builder-interaction-row';

    const verbField = document.createElement('input');
    verbField.type = 'text';
    verbField.className = 'builder-input builder-input--compact';
    verbField.value = interaction.verb || '';
    verbField.placeholder = 'Verb';
    verbField.addEventListener('input', () => {
      interaction.verb = verbField.value.trim();
      markDirty();
    });
    row.appendChild(verbField);

    const targetSelect = document.createElement('select');
    targetSelect.className = 'builder-input builder-input--compact';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Target';
    targetSelect.appendChild(defaultOption);
    labelNames.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      targetSelect.appendChild(option);
    });
    targetSelect.value = interaction.target || '';
    targetSelect.addEventListener('change', () => {
      interaction.target = targetSelect.value;
      markDirty();
    });
    row.appendChild(targetSelect);

    const dialogueSelect = document.createElement('select');
    dialogueSelect.className = 'builder-input builder-input--compact';
    const noDialogueOption = document.createElement('option');
    noDialogueOption.value = '';
    noDialogueOption.textContent = 'Dialogue';
    dialogueSelect.appendChild(noDialogueOption);
    dialogues.forEach((dialogue) => {
      const option = document.createElement('option');
      option.value = dialogue.id || '';
      option.textContent = dialogue.id || '(unnamed)';
      dialogueSelect.appendChild(option);
    });
    dialogueSelect.value = interaction.dialogueId || '';
    dialogueSelect.addEventListener('change', () => {
      interaction.dialogueId = dialogueSelect.value;
      markDirty();
    });
    row.appendChild(dialogueSelect);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'builder-icon-button builder-icon-button--danger';
    deleteButton.textContent = '✕';
    deleteButton.title = 'Delete interaction';
    deleteButton.addEventListener('click', () => {
      interactions.splice(index, 1);
      markDirty();
      renderInteractionList();
    });
    row.appendChild(deleteButton);

    interactionListElement.appendChild(row);
  });
}

function renderAll() {
  renderSceneList();
  renderSceneCanvas();
  updateComponentPanel();
  updateSceneNameInput();
  updateDialogueList();
  updateDialogueForm();
  renderInteractionList();
}
function handleCanvasPointerMove(event) {
  if (!dragState && !isDrawing) {
    return;
  }

  const canvasRect = canvasElement.getBoundingClientRect();
  const pointerX = clamp((event.clientX - canvasRect.left) / canvasRect.width, 0, 1);
  const pointerY = clamp((event.clientY - canvasRect.top) / canvasRect.height, 0, 1);

  if (dragState && dragState.mode === 'move') {
    const labelConfig = getLabelConfig(dragState.name);
    if (!labelConfig) {
      return;
    }
    const position = ensurePosition(labelConfig);
    position.x = clamp(pointerX - dragState.offsetX, 0, 1);
    position.y = clamp(pointerY - dragState.offsetY, 0, 1);
    const element = labelElementMap.get(dragState.name);
    if (element) {
      updateLabelElementPosition(element, labelConfig);
    }
    updateComponentPanel();
    markDirty();
    return;
  }

  if (dragState && dragState.mode === 'resize') {
    const labelConfig = getLabelConfig(dragState.name);
    if (!labelConfig) {
      return;
    }
    const size = ensureSize(labelConfig);
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    size.width = `${Math.max(MIN_LABEL_SIZE, dragState.startWidth + deltaX)}px`;
    size.height = `${Math.max(MIN_LABEL_SIZE, dragState.startHeight + deltaY)}px`;
    const element = labelElementMap.get(dragState.name);
    if (element) {
      updateLabelElementPosition(element, labelConfig);
    }
    updateComponentPanel();
    markDirty();
    return;
  }

  if (isDrawing && drawStart && selectedLabelName) {
    const labelConfig = getLabelConfig(selectedLabelName);
    if (!labelConfig) {
      return;
    }
    const position = ensurePosition(labelConfig);
    const size = ensureSize(labelConfig);

    const minX = Math.min(drawStart.x, pointerX);
    const maxX = Math.max(drawStart.x, pointerX);
    const minY = Math.min(drawStart.y, pointerY);
    const maxY = Math.max(drawStart.y, pointerY);

    position.x = clamp((minX + maxX) / 2, 0, 1);
    position.y = clamp((minY + maxY) / 2, 0, 1);

    const widthPx = Math.max((maxX - minX) * CANVAS_WIDTH, MIN_LABEL_SIZE);
    const heightPx = Math.max((maxY - minY) * CANVAS_HEIGHT, MIN_LABEL_SIZE);
    size.width = `${Math.round(widthPx)}px`;
    size.height = `${Math.round(heightPx)}px`;

    const element = labelElementMap.get(selectedLabelName);
    if (element) {
      updateLabelElementPosition(element, labelConfig);
    }
    updateComponentPanel();
  }
}

function handleCanvasPointerUp(event) {
  if (dragState) {
    canvasElement.releasePointerCapture(event.pointerId);
    dragState = null;
    return;
  }

  if (isDrawing) {
    canvasElement.releasePointerCapture(event.pointerId);
    isDrawing = false;
    drawStart = null;
    if (drawButton) {
      drawButton.classList.remove('is-active');
    }
    markDirty();
    renderSceneCanvas();
    updateComponentPanel();
  }
}

function startDrawingLabel(pointerX, pointerY) {
  const scene = getSelectedScene();
  if (!scene) {
    return;
  }
  const name = generateUniqueLabelName('component');
  const config = {
    text: name,
    position: { default: { x: pointerX, y: pointerY } },
    size: { width: `${MIN_LABEL_SIZE * 4}px`, height: `${MIN_LABEL_SIZE * 3}px` },
    layer: 2,
  };
  scene.data.labels[name] = config;
  selectedLabelName = name;
  isDrawing = true;
  drawStart = { x: pointerX, y: pointerY };
  renderSceneCanvas();
  updateComponentPanel();
}

canvasElement.addEventListener('pointermove', handleCanvasPointerMove);
canvasElement.addEventListener('pointerup', handleCanvasPointerUp);
canvasElement.addEventListener('pointerleave', () => {
  dragState = null;
  if (isDrawing) {
    isDrawing = false;
    drawStart = null;
    if (drawButton) {
      drawButton.classList.remove('is-active');
    }
    renderSceneCanvas();
  }
});

canvasElement.addEventListener('pointerdown', (event) => {
  const labelElement = event.target.closest('.builder-label');
  if (labelElement) {
    return;
  }

  const canvasRect = canvasElement.getBoundingClientRect();
  const pointerX = clamp((event.clientX - canvasRect.left) / canvasRect.width, 0, 1);
  const pointerY = clamp((event.clientY - canvasRect.top) / canvasRect.height, 0, 1);

  if (isDrawing) {
    startDrawingLabel(pointerX, pointerY);
    canvasElement.setPointerCapture(event.pointerId);
    return;
  }

  selectLabel(null);
});

if (drawButton) {
  drawButton.addEventListener('click', () => {
    if (isDrawing) {
      isDrawing = false;
      drawStart = null;
      drawButton.classList.remove('is-active');
      return;
    }
    isDrawing = true;
    drawStart = null;
    drawButton.classList.add('is-active');
  });
}

if (addLabelButton) {
  addLabelButton.addEventListener('click', () => {
    const centerX = 0.5;
    const centerY = 0.5;
    startDrawingLabel(centerX, centerY);
    isDrawing = false;
    drawStart = null;
    if (drawButton) {
      drawButton.classList.remove('is-active');
    }
    markDirty();
    renderSceneCanvas();
    updateComponentPanel();
  });
}

if (deleteLabelButton) {
  deleteLabelButton.addEventListener('click', () => {
    const scene = getSelectedScene();
    if (!scene || !selectedLabelName) {
      return;
    }
    if (scene.data.labels && scene.data.labels[selectedLabelName]) {
      delete scene.data.labels[selectedLabelName];
      scene.interactions = (scene.interactions || []).filter(
        (interaction) => interaction.target !== selectedLabelName,
      );
      if (scene.dialogues) {
        scene.dialogues.forEach((dialogue) => {
          if (dialogue.anchor === selectedLabelName) {
            dialogue.anchor = '';
          }
        });
      }
      selectedLabelName = null;
      markDirty();
      renderAll();
    }
  });
}
if (addSceneButton) {
  addSceneButton.addEventListener('click', () => {
    const baseName = `scene-${builderState.scenes.length + 1}`;
    const id = `${sanitizeId(baseName, baseName)}-${Date.now()}`;
    const newScene = ensureSceneStructure({
      id,
      name: baseName,
      data: { name: baseName, ambients: [], labels: {} },
      dialogues: [],
      interactions: [],
    });
    builderState.scenes.push(newScene);
    selectedSceneId = newScene.id;
    selectedLabelName = null;
    selectedDialogueId = null;
    markDirty();
    renderAll();
  });
}

if (sceneNameInput) {
  sceneNameInput.addEventListener('change', () => {
    const scene = getSelectedScene();
    if (!scene) {
      return;
    }
    const nextName = sanitizeSceneName(sceneNameInput.value, scene.name);
    if (!nextName || nextName === scene.name) {
      sceneNameInput.value = scene.name;
      return;
    }
    const duplicate = builderState.scenes.find((item) => item !== scene && item.name === nextName);
    if (duplicate) {
      sceneNameInput.value = scene.name;
      return;
    }
    scene.name = nextName;
    scene.data.name = nextName;
    markDirty();
    renderSceneList();
  });
}

if (componentForm) {
  componentForm.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }
    const scene = getSelectedScene();
    if (!scene || !selectedLabelName) {
      return;
    }
    const config = getLabelConfig(selectedLabelName);
    if (!config) {
      return;
    }

    const field = target.name;
    const value = target.value;

    if (field === 'name') {
      const nextName = sanitizeSceneName(value, selectedLabelName);
      if (!nextName || nextName === selectedLabelName) {
        target.value = selectedLabelName;
        return;
      }
      if (scene.data.labels[nextName]) {
        target.value = selectedLabelName;
        return;
      }
      scene.data.labels[nextName] = config;
      delete scene.data.labels[selectedLabelName];
      scene.interactions.forEach((interaction) => {
        if (interaction.target === selectedLabelName) {
          interaction.target = nextName;
        }
      });
      if (scene.dialogues) {
        scene.dialogues.forEach((dialogue) => {
          if (dialogue.anchor === selectedLabelName) {
            dialogue.anchor = nextName;
          }
        });
      }
      selectedLabelName = nextName;
      markDirty();
      renderAll();
      return;
    }

    if (field === 'text') {
      config.text = value;
      const element = labelElementMap.get(selectedLabelName);
      if (element) {
        element.textContent = value || selectedLabelName;
      }
      markDirty();
      return;
    }

    if (field === 'posX' || field === 'posY') {
      const numberValue = Number.parseFloat(value);
      if (Number.isNaN(numberValue)) {
        return;
      }
      const position = ensurePosition(config);
      if (field === 'posX') {
        position.x = clamp(numberValue, 0, 1);
      } else {
        position.y = clamp(numberValue, 0, 1);
      }
      const element = labelElementMap.get(selectedLabelName);
      if (element) {
        updateLabelElementPosition(element, config);
      }
      markDirty();
      return;
    }

    if (field === 'width' || field === 'height') {
      const numericValue = Number.parseFloat(value);
      if (Number.isNaN(numericValue)) {
        return;
      }
      const size = ensureSize(config);
      const px = `${Math.max(MIN_LABEL_SIZE, Math.round(numericValue))}px`;
      if (field === 'width') {
        size.width = px;
      } else {
        size.height = px;
      }
      const element = labelElementMap.get(selectedLabelName);
      if (element) {
        updateLabelElementPosition(element, config);
      }
      markDirty();
      return;
    }

    if (field === 'layer') {
      const layerValue = value.trim() === '' ? null : Number.parseInt(value, 10);
      config.layer = Number.isNaN(layerValue) ? null : layerValue;
      renderSceneCanvas();
      markDirty();
      return;
    }

    if (field === 'fontScale') {
      const scaleValue = value.trim() === '' ? null : Number.parseFloat(value);
      if (scaleValue == null || Number.isNaN(scaleValue)) {
        delete config.fontScale;
      } else {
        config.fontScale = { default: scaleValue };
      }
      markDirty();
      return;
    }

    if (field === 'classes') {
      const classes = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      config.classes = classes.length ? classes : undefined;
      markDirty();
    }
  });
}

function generateDialogueId(scene, base = 'dialogue') {
  const ids = new Set((scene.dialogues || []).map((dialogue) => dialogue.id));
  let index = ids.size + 1;
  let candidate = sanitizeId(`${base}-${index}`, `${base}-${index}`);
  while (ids.has(candidate)) {
    index += 1;
    candidate = sanitizeId(`${base}-${index}`, `${base}-${index}`);
  }
  return candidate;
}

if (addDialogueButton) {
  addDialogueButton.addEventListener('click', () => {
    const scene = getSelectedScene();
    if (!scene) {
      return;
    }
    const dialogueId = generateDialogueId(scene);
    const dialogue = {
      id: dialogueId,
      speaker: 'me',
      text: '',
      duration: 3000,
      anchor: '',
      isThought: false,
    };
    scene.dialogues = scene.dialogues || [];
    scene.dialogues.push(dialogue);
    selectedDialogueId = dialogueId;
    markDirty();
    updateDialogueList();
    updateDialogueForm();
    renderInteractionList();
  });
}

if (dialogueForm) {
  dialogueForm.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const scene = getSelectedScene();
    if (!scene || !selectedDialogueId) {
      return;
    }

    const dialogue = scene.dialogues?.find((item) => item.id === selectedDialogueId);
    if (!dialogue) {
      return;
    }

    const field = target.name;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    if (field === 'dialogueId') {
      const nextIdRaw = String(value || '').trim();
      if (!nextIdRaw) {
        target.value = dialogue.id;
        return;
      }
      const nextId = sanitizeId(nextIdRaw, dialogue.id);
      if (nextId === dialogue.id) {
        return;
      }
      if (scene.dialogues.some((item) => item !== dialogue && item.id === nextId)) {
        target.value = dialogue.id;
        return;
      }
      const previousId = dialogue.id;
      dialogue.id = nextId;
      scene.interactions.forEach((interaction) => {
        if (interaction.dialogueId === previousId) {
          interaction.dialogueId = nextId;
        }
      });
      selectedDialogueId = nextId;
      markDirty();
      updateDialogueList();
      renderInteractionList();
      return;
    }

    if (field === 'dialogueSpeaker') {
      dialogue.speaker = String(value || '').trim();
      markDirty();
      return;
    }

    if (field === 'dialogueAnchor') {
      dialogue.anchor = value || '';
      markDirty();
      return;
    }

    if (field === 'dialogueDuration') {
      const durationValue = value === '' ? null : Number.parseInt(value, 10);
      dialogue.duration = Number.isNaN(durationValue) ? undefined : durationValue;
      markDirty();
      return;
    }

    if (field === 'dialogueText') {
      dialogue.text = String(value || '');
      markDirty();
      return;
    }

    if (field === 'dialogueThought') {
      dialogue.isThought = Boolean(value);
      markDirty();
    }
  });
}

function ensureDialogueElementForSpeaker(speaker) {
  if (!speaker) {
    return null;
  }
  if (dialogueElements[speaker]) {
    return dialogueElements[speaker];
  }
  const element = document.createElement('div');
  element.className = 'dialogue-box dialogue-box--builder';
  element.dataset.speaker = speaker;
  element.style.display = 'none';
  previewLayer.appendChild(element);
  dialogueElements[speaker] = element;
  return element;
}

function resolveAnchorElement(anchorName) {
  if (anchorName && labelElementMap.has(anchorName)) {
    return labelElementMap.get(anchorName);
  }
  return fallbackAnchor;
}

function playDialoguePreview(dialogue) {
  if (!dialogue) {
    return;
  }
  const speaker = dialogue.speaker || 'narrator';
  const anchor = resolveAnchorElement(dialogue.anchor);
  ensureDialogueElementForSpeaker(speaker);
  actorElements[speaker] = anchor;
  dialogueUI.show({
    speaker,
    text: dialogue.text || '',
    duration: dialogue.duration != null ? dialogue.duration : 3000,
    isThought: Boolean(dialogue.isThought),
  });
}

if (playDialogueButton) {
  playDialogueButton.addEventListener('click', () => {
    const scene = getSelectedScene();
    const dialogue = scene?.dialogues?.find((item) => item.id === selectedDialogueId);
    playDialoguePreview(dialogue);
  });
}

if (deleteDialogueButton) {
  deleteDialogueButton.addEventListener('click', () => {
    const scene = getSelectedScene();
    if (!scene || !selectedDialogueId) {
      return;
    }
    scene.dialogues = (scene.dialogues || []).filter((dialogue) => dialogue.id !== selectedDialogueId);
    scene.interactions.forEach((interaction) => {
      if (interaction.dialogueId === selectedDialogueId) {
        interaction.dialogueId = '';
      }
    });
    selectedDialogueId = scene.dialogues[0]?.id || null;
    markDirty();
    updateDialogueList();
    updateDialogueForm();
    renderInteractionList();
  });
}

if (addInteractionButton) {
  addInteractionButton.addEventListener('click', () => {
    const scene = getSelectedScene();
    if (!scene) {
      return;
    }
    scene.interactions = scene.interactions || [];
    scene.interactions.push({
      id: `interaction-${Date.now()}`,
      verb: 'talk',
      target: '',
      dialogueId: selectedDialogueId || '',
    });
    markDirty();
    renderInteractionList();
  });
}

if (saveButton) {
  saveButton.addEventListener('click', () => {
    const snapshot = cloneBuilderState(builderState);
    const success = saveBuilderState(snapshot);
    if (success) {
      markSaved();
    } else if (statusElement) {
      statusElement.textContent = 'Failed to save';
    }
  });
}

window.addEventListener('beforeunload', (event) => {
  if (!hasUnsavedChanges) {
    return;
  }
  event.preventDefault();
  // eslint-disable-next-line no-param-reassign
  event.returnValue = '';
});

renderAll();
markSaved();

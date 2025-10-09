function applyClasses(element, classes = []) {
  if (!element || !Array.isArray(classes)) {
    return;
  }
  classes.forEach((className) => {
    if (className) {
      element.classList.add(className);
    }
  });
}

function createAmbientElement({ ambient, container }) {
  if (!ambient || !container) {
    return null;
  }
  const element = document.createElement('div');
  element.classList.add('ambient');
  applyClasses(element, ambient.classes);
  element.dataset.ambient = ambient.id;
  element.textContent = ambient.text ?? ambient.id ?? '';
  container.appendChild(element);
  return element;
}

function createLabelElement({ name, config, container }) {
  if (!name || !config || !container) {
    return null;
  }
  const element = document.createElement('div');
  element.classList.add('label');
  applyClasses(element, config.classes);
  element.dataset.name = name;
  element.textContent = config.text ?? name;
  container.appendChild(element);
  return element;
}

function createSceneElements({ scene, container }) {
  if (!scene || !container) {
    return {
      ambientElements: {},
      labelElements: {},
    };
  }

  container.innerHTML = '';

  const ambientElements = {};
  const labelElements = {};

  if (Array.isArray(scene.ambients)) {
    scene.ambients.forEach((ambient) => {
      const element = createAmbientElement({ ambient, container });
      if (element) {
        ambientElements[ambient.id] = element;
      }
    });
  }

  if (scene.labels && typeof scene.labels === 'object') {
    Object.entries(scene.labels).forEach(([name, config]) => {
      const element = createLabelElement({ name, config, container });
      if (element) {
        labelElements[name] = element;
      }
    });
  }

  return {
    ambientElements,
    labelElements,
  };
}

export { createSceneElements };

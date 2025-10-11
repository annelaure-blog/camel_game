import { getBuilderRuntimeData } from '../builder/runtime.js';
import { desertScene } from './desert.js';
import { teaScene } from './tea.js';

const defaultScenes = [desertScene, teaScene];

function buildSceneMap(entries) {
  const map = {};
  entries.forEach((entry) => {
    if (!entry || !entry.name || !entry.data) {
      return;
    }
    map[entry.name] = entry.data;
  });
  return map;
}

const builderData = getBuilderRuntimeData();
const builderScenes = buildSceneMap(builderData.scenes || []);

const scenes = {
  ...defaultScenes.reduce((accumulator, scene) => {
    if (scene?.name) {
      accumulator[scene.name] = scene;
    }
    return accumulator;
  }, {}),
  ...builderScenes,
};

const sceneOrder = builderData.order && builderData.order.length
  ? builderData.order
  : defaultScenes.map((scene) => scene.name).filter(Boolean);

const initialSceneName = sceneOrder.length ? sceneOrder[0] : desertScene.name;

export { desertScene, teaScene, scenes, sceneOrder, initialSceneName };

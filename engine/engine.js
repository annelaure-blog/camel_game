import { loadSceneData, loadDialogueData } from "./loader.js";
import { renderScene } from "./renderer.js";
import { playDialogue } from "./dialogue.js";
import { transition } from "./transitions.js";

export async function startScene(sceneId) {
  const sceneData = await loadSceneData(sceneId);
  const dialogue = await loadDialogueData(sceneData.dialogue);
  renderScene(sceneData);
  playDialogue(dialogue, () => {
    if (sceneData.transitions?.onComplete) {
      transition(sceneData.transitions.onComplete);
    }
  });
}

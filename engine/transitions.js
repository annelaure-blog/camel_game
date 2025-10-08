import { startScene } from "./engine.js";

export async function transition(nextSceneId) {
  const box = document.getElementById("dialogue");
  box.style.display = "block";
  box.textContent = "Crossing the dunes...";
  box.style.background = "rgba(0,0,0,0.9)";
  setTimeout(() => {
    startScene(nextSceneId);
  }, 2000);
}

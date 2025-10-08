import { getObjectDef } from "./loader.js";
import { handleInteraction } from "./interactions.js";

export function renderScene(sceneData) {
  const scene = document.getElementById("scene");
  scene.innerHTML = "";
  sceneData.layout.forEach(obj => {
    const def = getObjectDef(obj.id);
    if (!def) return;
    const div = document.createElement("div");
    div.className = "label";
    div.textContent = def.label;
    Object.assign(div.style, {
      left: obj.x,
      top: obj.y,
      width: def.width + "px",
      height: def.height + "px",
      background: def.color,
      color: def.textColor || "black",
      border: def.border || "2px solid black"
    });
    div.onclick = () => handleInteraction(obj.id);
    scene.appendChild(div);
  });
}

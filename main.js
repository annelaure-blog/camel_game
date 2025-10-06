import { loadDesertScene } from "./scenes/desertScene.js";
import dialogues from "./data/dialogues.json" assert { type: "json" };

export const gameState = {
  inventory: [],
  selectedVerb: null,
  selectedItem: null
};

export function updateInventoryDisplay() {
  const container = document.getElementById("inventory-items");
  container.innerHTML = "";
  gameState.inventory.forEach(item => {
    const span = document.createElement("span");
    span.textContent = `[${item}]`;
    span.onclick = () => {
      document.querySelectorAll("#inventory-items span").forEach(s => s.classList.remove("active"));
      span.classList.add("active");
      gameState.selectedItem = item;
    };
    container.appendChild(span);
  });
}

function setupVerbs() {
  const verbs = ["TALK TO", "SHAKE", "USE", "PICK UP", "GIVE", "OPEN"];
  const verbsDiv = document.getElementById("verbs");

  verbs.forEach(v => {
    const btn = document.createElement("button");
    btn.textContent = v;
    btn.classList.add("verb");
    btn.onclick = () => {
      document.querySelectorAll(".verb").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      gameState.selectedVerb = v.toLowerCase();
    };
    verbsDiv.appendChild(btn);
  });
}

window.onload = () => {
  setupVerbs();
  loadDesertScene(dialogues.desert);
};

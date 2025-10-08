export const gameState = {
  selectedVerb: null,
  selectedItem: null,
  inventory: []
};

export function setupVerbs() {
  const verbs = ["TALK TO", "SHAKE", "USE", "PICK UP", "GIVE", "OPEN"];
  const bar = document.getElementById("verbs");
  verbs.forEach(v => {
    const b = document.createElement("button");
    b.textContent = v;
    b.classList.add("verb");
    b.onclick = () => {
      document.querySelectorAll(".verb").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      gameState.selectedVerb = v.toLowerCase();
    };
    bar.appendChild(b);
  });
}

export function handleInteraction(target) {
  const v = gameState.selectedVerb;
  console.log(`Interaction: ${v} ${target}`);
  // Placeholder for actual scene-specific reactions
}

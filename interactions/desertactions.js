import { gameState, updateInventoryDisplay } from "../main.js";

export function handleInteraction(target) {
  const verb = gameState.selectedVerb;

  if (verb === "shake" && target === "palm tree") {
    dropDates();
  } else if (verb === "pickup" && target === "bucket") {
    pickUp("bucket");
  } else if (verb === "use" && target === "pond") {
    useBucketOnPond();
  } else {
    console.log(`Nothing happens when you ${verb} the ${target}.`);
  }
}

function dropDates() {
  const scene = document.getElementById("scene");
  const dates = document.createElement("div");
  dates.className = "label";
  dates.textContent = "dates";
  dates.style = "left:10%;top:70%;width:60px;height:30px;background:#8b4513;color:white;";
  scene.appendChild(dates);

  dates.onclick = () => {
    if (gameState.selectedVerb === "pickup") {
      dates.remove();
      gameState.inventory.push("dates");
      updateInventoryDisplay();
    }
  };
}

function pickUp(item) {
  if (!gameState.inventory.includes(item)) {
    gameState.inventory.push(item);
    updateInventoryDisplay();
  }
}

function useBucketOnPond() {
  if (gameState.inventory.includes("bucket")) {
    gameState.inventory.splice(gameState.inventory.indexOf("bucket"), 1);
    gameState.inventory.push("bucket of water");
    updateInventoryDisplay();
  }
}

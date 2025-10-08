import { gameState, updateInventoryDisplay } from "../main.js";

const responses = {
  camel: {
    "talk to": "The camel blinks slowly, clearly unimpressed by your small talk.",
    "pick up": "You consider lifting the camel, then wisely reconsider.",
    "use": () => {
      if (gameState.selectedItem === "bucket") {
        return "You offer the bucket to the camel. It snorts but seems grateful for the shade.";
      }
      return "Use what, exactly? Your hands? The camel shakes its head.";
    }
  },
  bucket: {
    "pick up": () => {
      if (!gameState.inventory.includes("bucket")) {
        gameState.inventory.push("bucket");
        gameState.selectedItem = "bucket";
        updateInventoryDisplay();
        return "You pick up the bucket. Handy!";
      }
      return "You already have the bucket.";
    },
    "open": "The bucket has no hinges to open, sadly.",
    "talk to": "The bucket remains stoically silent."
  },
  pond: {
    "use": () => {
      if (gameState.selectedItem === "bucket") {
        return "You fill the bucket with cool pond water.";
      }
      return "You splash some water around, accomplishing little.";
    }
  }
};

function resolveResponse(target, verb) {
  const targetResponses = responses[target.toLowerCase()];
  if (!targetResponses) {
    return `Nothing interesting happens with the ${target}.`;
  }

  const action = targetResponses[verb];
  if (!action) {
    return `That doesn't seem to work on the ${target}.`;
  }

  return typeof action === "function" ? action() : action;
}

export function handleInteraction(target) {
  const { selectedVerb } = gameState;
  const dialogueBox = document.getElementById("dialogue");

  if (!selectedVerb) {
    dialogueBox.style.display = "block";
    dialogueBox.textContent = "Maybe choose a verb first?";
    return;
  }

  const message = resolveResponse(target, selectedVerb);
  dialogueBox.style.display = "block";
  dialogueBox.textContent = message;
}

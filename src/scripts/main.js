import { updateInventory } from './inventory.js';
import {
  positionDialogue,
  showDialogue,
  pickUpBucket,
  useBucketOnPond,
  giveItemToBedouins,
} from './interactions.js';
import { shakePalmTree } from './scene.js';
import { renderSceneLayout } from './layout.js';

const dialogueMe = document.getElementById('dialogue-me');
const dialogueBedouins = document.getElementById('dialogue-bedouins');
const dialogueCamel = document.getElementById('dialogue-camel');
const bedouins = document.querySelector('[data-name="bedouins"]');
const me = document.querySelector('[data-name="me"]');
const camel = document.querySelector('[data-name="camel"]');
const bucket = document.querySelector('[data-name="bucket"]');
const palmTree = document.querySelector('[data-name="palm tree"]');
const gameElement = document.getElementById('game');

renderSceneLayout(gameElement);

let selectedVerb = null;
const verbs = document.querySelectorAll('.verb');
const labels = document.querySelectorAll('.label');
const inventoryDisplay = document.getElementById('inventory-items');
const gaveWaterState = { value: false };

verbs.forEach((verbElement) => {
  verbElement.addEventListener('click', () => {
    verbs.forEach((item) => item.classList.remove('active'));
    verbElement.classList.add('active');
    selectedVerb = verbElement.dataset.verb;
  });
});

labels.forEach((label) => {
  label.addEventListener('click', () => {
    if (!selectedVerb) {
      return;
    }
    const name = label.dataset.name;

    if (selectedVerb === 'shake' && name === 'palm tree') {
      shakePalmTree({
        palmTreeElement: palmTree,
        gameElement,
        inventoryDisplay,
        getSelectedVerb: () => selectedVerb,
      });
    }

    if (selectedVerb === 'pickup' && name === 'bucket') {
      pickUpBucket({
        gameElement,
        bucketElement: bucket,
        inventoryDisplay,
        meElement: me,
        dialogueElement: dialogueMe,
      });
    }

    if (selectedVerb === 'use' && name === 'pond') {
      useBucketOnPond({
        inventoryDisplay,
        meElement: me,
        dialogueElement: dialogueMe,
      });
    }

    if (selectedVerb === 'give' && name === 'bedouins') {
      giveItemToBedouins({
        inventoryDisplay,
        bedouinsElement: bedouins,
        dialogueElement: dialogueBedouins,
        gaveWaterState,
      });
    }
  });
});

function showCamelThought(text) {
  positionDialogue(dialogueCamel, camel);
  showDialogue(dialogueCamel, text, true, 3000);
}

function showMeDialogue(text) {
  positionDialogue(dialogueMe, me);
  showDialogue(dialogueMe, text);
}

function initializeGame() {
  updateInventory(inventoryDisplay);
  showCamelThought('hmm... water?');
  showMeDialogue('The desert is quiet.');
}

initializeGame();

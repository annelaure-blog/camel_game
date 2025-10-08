import {
  addItem,
  removeItem,
  hasItem,
  updateInventory,
  getSelectedItem,
  clearSelectedItem,
} from './inventory.js';

function positionDialogue(box, element) {
  const rect = element.getBoundingClientRect();
  const gameRect = document.getElementById('game').getBoundingClientRect();
  box.style.left = `${rect.left - gameRect.left + rect.width / 2}px`;
  box.style.top = `${rect.top - gameRect.top - 40}px`;
  box.style.transform = 'translateX(-50%)';
}

function showDialogue(box, text, isThought = false, duration = 3500) {
  box.innerHTML = isThought ? `<span class='thought'>{{${text}}}</span>` : text;
  box.style.display = 'block';
  setTimeout(() => hideDialogue(box), duration);
}

function hideDialogue(box) {
  box.style.display = 'none';
}

function pickUpBucket({
  gameElement,
  bucketElement,
  inventoryDisplay,
  meElement,
  dialogueElement,
}) {
  if (!bucketElement || !gameElement.contains(bucketElement)) {
    return;
  }

  if (!hasItem('bucket')) {
    gameElement.removeChild(bucketElement);
    addItem('bucket');
    updateInventory(inventoryDisplay);
    positionDialogue(dialogueElement, meElement);
    showDialogue(dialogueElement, 'Got the bucket.');
  }
}

function useBucketOnPond({ inventoryDisplay, meElement, dialogueElement }) {
  if (hasItem('bucket') && !hasItem('bucket of water')) {
    removeItem('bucket');
    addItem('bucket of water');
    updateInventory(inventoryDisplay);
    positionDialogue(dialogueElement, meElement);
    showDialogue(dialogueElement, 'Filled the bucket with water.');
  } else if (!hasItem('bucket')) {
    positionDialogue(dialogueElement, meElement);
    showDialogue(dialogueElement, 'I need a bucket first.');
  }
}

function giveItemToBedouins({
  inventoryDisplay,
  bedouinsElement,
  dialogueElement,
  gaveWaterState,
}) {
  const selectedItem = getSelectedItem();

  if (selectedItem === 'dates') {
    removeItem('dates');
    clearSelectedItem();
    updateInventory(inventoryDisplay);
    positionDialogue(dialogueElement, bedouinsElement);

    if (gaveWaterState.value) {
      showDialogue(
        dialogueElement,
        'Wonderful, we can start making the tea now.',
        false,
        12000,
      );
    } else {
      showDialogue(dialogueElement, 'Nice.', false, 3000);
    }
  } else if (selectedItem === 'bucket of water') {
    removeItem('bucket of water');
    clearSelectedItem();
    updateInventory(inventoryDisplay);
    positionDialogue(dialogueElement, bedouinsElement);

    if (hasItem('dates')) {
      showDialogue(dialogueElement, 'Nice.', false, 3000);
      gaveWaterState.value = true;
    } else {
      showDialogue(dialogueElement, 'Nice.', false, 3000);
      gaveWaterState.value = true;
    }
  } else if (selectedItem) {
    clearSelectedItem();
    positionDialogue(dialogueElement, bedouinsElement);
    showDialogue(dialogueElement, "We don't need that right now.", false, 3000);
    updateInventory(inventoryDisplay);
  } else {
    positionDialogue(dialogueElement, bedouinsElement);
    showDialogue(dialogueElement, 'We don't need that right now.', false, 3000);
  }
}

export {
  positionDialogue,
  showDialogue,
  hideDialogue,
  pickUpBucket,
  useBucketOnPond,
  giveItemToBedouins,
};

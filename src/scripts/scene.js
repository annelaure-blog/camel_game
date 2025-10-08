import { addItem, hasItem, updateInventory } from './inventory.js';

function shakePalmTree({
  palmTreeElement,
  gameElement,
  inventoryDisplay,
  getSelectedVerb,
}) {
  if (!palmTreeElement) {
    return;
  }

  palmTreeElement.style.transform = 'rotate(-5deg)';
  setTimeout(() => {
    palmTreeElement.style.transform = 'rotate(5deg)';
    setTimeout(() => {
      palmTreeElement.style.transform = 'rotate(0deg)';
      dropDates({ palmTreeElement, gameElement, inventoryDisplay, getSelectedVerb });
    }, 200);
  }, 200);
}

function dropDates({ palmTreeElement, gameElement, inventoryDisplay, getSelectedVerb }) {
  if (!palmTreeElement || !gameElement) {
    return;
  }

  const treeRect = palmTreeElement.getBoundingClientRect();
  const gameRect = gameElement.getBoundingClientRect();
  const dates = document.createElement('div');
  dates.classList.add('dates');
  dates.textContent = 'dates';
  const leftPos = `${(treeRect.left - gameRect.left) + treeRect.width / 2 - 30}px`;
  const topStart = treeRect.top - gameRect.top + 20;
  const topEnd = treeRect.bottom - gameRect.top - 25;
  dates.style.left = leftPos;
  dates.style.top = `${topStart}px`;
  gameElement.appendChild(dates);

  dates.animate(
    [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: `translateY(${topEnd - topStart}px)`, opacity: 1 },
    ],
    { duration: 2000, fill: 'forwards' },
  );

  dates.addEventListener('click', () => {
    if (getSelectedVerb() === 'pickup') {
      if (gameElement.contains(dates)) {
        gameElement.removeChild(dates);
      }
      if (!hasItem('dates')) {
        addItem('dates');
      }
      updateInventory(inventoryDisplay);
    }
  });
}

export { shakePalmTree, dropDates };

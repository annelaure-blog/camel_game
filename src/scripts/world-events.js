import { getText } from './texts.js';

export class WorldEvents {
  constructor({
    gameElement,
    palmTreeElement,
    onInteraction,
    getSelectedVerb,
  }) {
    this.gameElement = gameElement;
    this.palmTreeElement = palmTreeElement;
    this.onInteraction = onInteraction;
    this.getSelectedVerb = getSelectedVerb;
    this.gaveWaterFirst = false;
    this.datesElement = null;
  }

  hasGivenWater() {
    return this.gaveWaterFirst;
  }

  hasDatesOnGround() {
    return Boolean(this.datesElement && this.gameElement.contains(this.datesElement));
  }

  markWaterDelivered() {
    this.gaveWaterFirst = true;
  }

  shakePalmTree() {
    if (!this.palmTreeElement) {
      return;
    }

    this.palmTreeElement.style.transform = 'rotate(-5deg)';
    setTimeout(() => {
      this.palmTreeElement.style.transform = 'rotate(5deg)';
      setTimeout(() => {
        this.palmTreeElement.style.transform = 'rotate(0deg)';
        this.dropDates();
      }, 200);
    }, 200);
  }

  dropDates() {
    if (!this.gameElement || this.datesElement) {
      return;
    }

    const treeRect = this.palmTreeElement.getBoundingClientRect();
    const gameRect = this.gameElement.getBoundingClientRect();

    const dates = document.createElement('div');
    dates.classList.add('dates');
    dates.dataset.target = 'dates';
    dates.textContent = getText('objects.dates.label');

    const leftPos = `${treeRect.left - gameRect.left + treeRect.width / 2 - 30}px`;
    const topStart = treeRect.top - gameRect.top + 20;
    const topEnd = treeRect.bottom - gameRect.top - 25;
    dates.style.left = leftPos;
    dates.style.top = `${topStart}px`;
    this.gameElement.appendChild(dates);

    dates.animate(
      [
        { transform: 'translateY(0)', opacity: 1 },
        { transform: `translateY(${topEnd - topStart}px)`, opacity: 1 },
      ],
      { duration: 2000, fill: 'forwards' },
    );

    dates.addEventListener('click', () => {
      const verb = this.getSelectedVerb();
      if (!verb) {
        return;
      }
      this.onInteraction({ verb, target: 'dates' });
    });

    this.datesElement = dates;
  }

  collectDates() {
    if (!this.hasDatesOnGround()) {
      return false;
    }

    this.gameElement.removeChild(this.datesElement);
    this.datesElement = null;
    return true;
  }
}

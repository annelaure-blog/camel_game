export class DialogueUI {
  constructor({
    dialogueElements,
    actorElements,
    gameElement,
  }) {
    this.dialogueElements = dialogueElements;
    this.actorElements = actorElements;
    this.hideTimers = new Map();
    this.gameElement = gameElement || document.getElementById('game');
  }

  positionDialogue(speaker) {
    const dialogueElement = this.dialogueElements[speaker];
    const actorElement = this.actorElements[speaker];

    if (!dialogueElement || !actorElement) {
      return;
    }

    const rect = actorElement.getBoundingClientRect();
    const gameRect = (this.gameElement || document.getElementById('game')).getBoundingClientRect();
    const left = rect.left - gameRect.left + rect.width / 2;

    let top = rect.top - gameRect.top - 40;
    const visibleHeight = dialogueElement.offsetHeight;
    const maxTop = gameRect.height - visibleHeight - 8;

    if (!Number.isNaN(maxTop) && Number.isFinite(maxTop)) {
      top = Math.min(Math.max(0, top), Math.max(0, maxTop));
    } else {
      top = Math.max(0, top);
    }

    dialogueElement.style.left = `${left}px`;
    dialogueElement.style.top = `${top}px`;
    dialogueElement.style.transform = 'translateX(-50%)';
  }

  show({ speaker, text, isThought = false, duration = 3500 }) {
    const dialogueElement = this.dialogueElements[speaker];
    if (!dialogueElement) {
      return;
    }

    dialogueElement.innerHTML = isThought ? `<span class="thought">{{${text}}}</span>` : text;
    dialogueElement.style.display = 'block';
    dialogueElement.style.visibility = 'hidden';
    this.positionDialogue(speaker);
    dialogueElement.style.visibility = '';

    if (this.hideTimers.has(speaker)) {
      clearTimeout(this.hideTimers.get(speaker));
    }

    const timer = setTimeout(() => {
      this.hide(speaker);
    }, duration);

    this.hideTimers.set(speaker, timer);
  }

  hide(speaker) {
    const dialogueElement = this.dialogueElements[speaker];
    if (!dialogueElement) {
      return;
    }
    dialogueElement.style.display = 'none';

    if (this.hideTimers.has(speaker)) {
      clearTimeout(this.hideTimers.get(speaker));
      this.hideTimers.delete(speaker);
    }
  }
}

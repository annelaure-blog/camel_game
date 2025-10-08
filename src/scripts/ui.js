export class DialogueUI {
  constructor({
    dialogueElements,
    actorElements,
  }) {
    this.dialogueElements = dialogueElements;
    this.actorElements = actorElements;
    this.hideTimers = new Map();
  }

  positionDialogue(speaker) {
    const dialogueElement = this.dialogueElements[speaker];
    const actorElement = this.actorElements[speaker];

    if (!dialogueElement || !actorElement) {
      return;
    }

    const rect = actorElement.getBoundingClientRect();
    const gameRect = document.getElementById('game').getBoundingClientRect();
    dialogueElement.style.left = `${rect.left - gameRect.left + rect.width / 2}px`;
    dialogueElement.style.top = `${rect.top - gameRect.top - 40}px`;
    dialogueElement.style.transform = 'translateX(-50%)';
  }

  show({ speaker, text, isThought = false, duration = 3500 }) {
    const dialogueElement = this.dialogueElements[speaker];
    if (!dialogueElement) {
      return;
    }

    this.positionDialogue(speaker);
    dialogueElement.innerHTML = isThought ? `<span class="thought">{{${text}}}</span>` : text;
    dialogueElement.style.display = 'block';

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

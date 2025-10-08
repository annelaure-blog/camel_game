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

  show({ speaker, text, isThought = false, duration = 3000 }) {
    const dialogueElement = this.dialogueElements[speaker];
    if (!dialogueElement) {
      return;
    }

    this.applySpeakerStyles({ speaker, dialogueElement });

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

  applySpeakerStyles({ speaker, dialogueElement }) {
    const actorElement = this.actorElements[speaker];
    if (!actorElement) {
      return;
    }

    const computedStyles = window.getComputedStyle(actorElement);
    const backgroundColor = computedStyles.backgroundColor;
    const textColor = computedStyles.color;

    const adjustedBackground = this.getColorWithOpacity(backgroundColor, 0.7);
    if (adjustedBackground) {
      dialogueElement.style.backgroundColor = adjustedBackground;
    }

    if (textColor) {
      dialogueElement.style.color = textColor;
    }
  }

  getColorWithOpacity(colorString, alpha) {
    if (!colorString) {
      return null;
    }

    if (colorString === 'transparent') {
      return null;
    }

    const rgbaMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
    if (rgbaMatch) {
      const [, r, g, b, existingAlpha] = rgbaMatch;
      if (existingAlpha !== undefined && Number.parseFloat(existingAlpha) === 0) {
        return null;
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    if (colorString.startsWith('#')) {
      let hex = colorString.slice(1);
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((char) => char + char)
          .join('');
      }

      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }

    return null;
  }
}

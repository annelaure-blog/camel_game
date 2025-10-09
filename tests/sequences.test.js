import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { playPauseableTextSequence } from '../src/scripts/sequences.js';

function createElements() {
  const container = document.createElement('div');
  container.id = 'intro-sequence';
  container.classList.add('is-hidden');

  const text = document.createElement('div');
  text.id = 'intro-text';

  const instructions = document.createElement('div');
  instructions.id = 'intro-instructions';

  const game = document.createElement('div');
  game.id = 'game';

  const menu = document.createElement('div');
  menu.id = 'menu';

  container.appendChild(text);
  container.appendChild(instructions);

  document.body.appendChild(container);
  document.body.appendChild(game);
  document.body.appendChild(menu);

  return { container, text, instructions, game, menu };
}

describe('playPauseableTextSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('displays sentences sequentially and calls onComplete', () => {
    const { container, text, instructions, game, menu } = createElements();
    const onComplete = vi.fn();

    playPauseableTextSequence({
      sentences: ['First', 'Second'],
      sentenceDuration: 1000,
      onComplete,
      hideGameOnStart: true,
      showGameOnComplete: true,
      hideMenuOnStart: true,
      showMenuOnComplete: true,
      elements: { container, text, instructions, game, menu },
    });

    expect(container.classList.contains('is-hidden')).toBe(false);
    expect(text.textContent).toBe('First');
    expect(instructions.textContent).toBe('Press space to pause');
    expect(game.classList.contains('is-hidden')).toBe(true);
    expect(menu.classList.contains('is-hidden')).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(text.textContent).toBe('Second');

    vi.advanceTimersByTime(1000);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(container.classList.contains('is-hidden')).toBe(true);
    expect(game.classList.contains('is-hidden')).toBe(false);
    expect(menu.classList.contains('is-hidden')).toBe(false);
  });

  it('pauses and resumes when pressing space', () => {
    const { container, text, instructions, game, menu } = createElements();

    playPauseableTextSequence({
      sentences: ['First', 'Second'],
      sentenceDuration: 1000,
      elements: { container, text, instructions, game, menu },
    });

    vi.advanceTimersByTime(400);

    const spaceEvent = new KeyboardEvent('keydown', { code: 'Space' });
    document.dispatchEvent(spaceEvent);

    expect(instructions.textContent).toBe('Press space to resume');

    vi.advanceTimersByTime(1000);
    expect(text.textContent).toBe('First');

    document.dispatchEvent(spaceEvent);
    expect(instructions.textContent).toBe('Press space to pause');

    vi.advanceTimersByTime(600);
    expect(text.textContent).toBe('Second');
  });

  it('immediately finalizes when no sentences provided', () => {
    const onComplete = vi.fn();
    playPauseableTextSequence({ sentences: [], onComplete });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

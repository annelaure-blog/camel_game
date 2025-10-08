import { describe, expect, it, beforeEach, vi } from 'vitest';
import { runInteraction } from '../src/scripts/interactions.js';
import { Inventory } from '../src/scripts/inventory.js';
import { getText } from '../src/scripts/texts.js';

function createBaseContext(overrides = {}) {
  const inventory = overrides.inventory || new Inventory();
  const ui = overrides.ui || { show: vi.fn() };
  const context = {
    inventory,
    ui,
    getText,
    elements: {
      game: document.createElement('div'),
      bucket: document.createElement('div'),
      pond: document.createElement('div'),
      palmTree: document.createElement('div'),
      me: document.createElement('div'),
      bedouins: document.createElement('div'),
      camel: document.createElement('div'),
    },
    worldEvents: overrides.worldEvents || {},
  };

  context.elements.game.appendChild(context.elements.bucket);

  return context;
}

describe('interactions table', () => {
  let ui;

  beforeEach(() => {
    ui = { show: vi.fn() };
  });

  it('runs the palm tree shake interaction and shows feedback', () => {
    const worldEvents = { shakePalmTree: vi.fn() };
    const context = createBaseContext({ ui, worldEvents });

    const result = runInteraction({ verb: 'shake', target: 'palm tree', context });

    expect(result).toBe(true);
    expect(worldEvents.shakePalmTree).toHaveBeenCalled();
    expect(ui.show).toHaveBeenCalledWith(
      expect.objectContaining({
        speaker: 'me',
        text: getText('interactions.shake.palmTree.noEffect'),
      }),
    );
  });

  it('picks up the bucket and updates inventory', () => {
    const worldEvents = {};
    const context = createBaseContext({ ui, worldEvents });

    const result = runInteraction({ verb: 'pickup', target: 'bucket', context });

    expect(result).toBe(true);
    expect(context.elements.game.contains(context.elements.bucket)).toBe(false);
    expect(context.inventory.has('bucket')).toBe(true);
    expect(ui.show).toHaveBeenCalledWith(
      expect.objectContaining({
        speaker: 'me',
        text: getText('interactions.pickup.bucket.success'),
      }),
    );
  });

  it('collects dates dropped on the ground', () => {
    const worldEvents = {
      hasDatesOnGround: vi.fn(() => true),
      collectDates: vi.fn(() => true),
    };
    const context = createBaseContext({ ui, worldEvents });

    const result = runInteraction({ verb: 'pickup', target: 'dates', context });

    expect(result).toBe(true);
    expect(worldEvents.collectDates).toHaveBeenCalled();
    expect(context.inventory.has('dates')).toBe(true);
    expect(ui.show).toHaveBeenCalledWith(
      expect.objectContaining({
        speaker: 'me',
        text: getText('interactions.pickup.dates.success'),
      }),
    );
  });

  it('fills the bucket at the pond', () => {
    const inventory = new Inventory();
    inventory.add('bucket');
    const context = createBaseContext({ ui, inventory });

    const result = runInteraction({ verb: 'use', target: 'pond', context });

    expect(result).toBe(true);
    expect(inventory.has('bucket')).toBe(false);
    expect(inventory.has('bucket of water')).toBe(true);
    expect(ui.show).toHaveBeenCalledWith(
      expect.objectContaining({
        speaker: 'me',
        text: getText('interactions.use.pond.success'),
      }),
    );
  });

  it('gives dates to the bedouins before water', () => {
    const inventory = new Inventory();
    inventory.add('dates');
    inventory.select('dates');
    const worldEvents = {
      hasGivenWater: vi.fn(() => false),
      markWaterDelivered: vi.fn(),
    };
    const context = createBaseContext({ ui, inventory, worldEvents });

    const result = runInteraction({ verb: 'give', target: 'bedouins', context });

    expect(result).toBe(true);
    expect(inventory.has('dates')).toBe(false);
    expect(ui.show).toHaveBeenCalledWith(
      expect.objectContaining({
        speaker: 'bedouins',
        text: getText('interactions.give.bedouins.datesBeforeWater'),
      }),
    );
  });

  it('gives water to the bedouins and marks the world event', () => {
    const inventory = new Inventory();
    inventory.add('bucket of water');
    inventory.select('bucket of water');
    const worldEvents = {
      hasGivenWater: vi.fn(() => false),
      markWaterDelivered: vi.fn(),
    };
    const context = createBaseContext({ ui, inventory, worldEvents });

    const result = runInteraction({ verb: 'give', target: 'bedouins', context });

    expect(result).toBe(true);
    expect(inventory.has('bucket of water')).toBe(false);
    expect(worldEvents.markWaterDelivered).toHaveBeenCalled();
    expect(ui.show).toHaveBeenCalledWith(
      expect.objectContaining({
        speaker: 'bedouins',
        text: getText('interactions.give.bedouins.water'),
      }),
    );
  });
});

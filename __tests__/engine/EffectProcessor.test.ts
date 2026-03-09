import { applyEffect, applyEffects } from '../../src/engine/EffectProcessor';
import { GameState, Effect } from '../../src/models';

const baseState: GameState = {
  health: 70,
  gold: 20,
  inventory: ['sword'],
  flags: { brave: true },
  currentSceneId: 'scene_1',
  visitedScenes: ['scene_1'],
};

describe('EffectProcessor', () => {
  test('set_flag — sets flag to true', () => {
    const result = applyEffect({ type: 'set_flag', key: 'coward', value: true }, baseState);
    expect(result.flags.coward).toBe(true);
  });

  test('set_flag — sets flag to false', () => {
    const result = applyEffect({ type: 'set_flag', key: 'brave', value: false }, baseState);
    expect(result.flags.brave).toBe(false);
  });

  test('modify_stat — modifies health by delta', () => {
    const result = applyEffect({ type: 'modify_stat', key: 'health', value: -20 }, baseState);
    expect(result.health).toBe(50);
  });

  test('modify_stat — clamps health to 0 minimum', () => {
    const result = applyEffect({ type: 'modify_stat', key: 'health', value: -200 }, baseState);
    expect(result.health).toBe(0);
  });

  test('modify_stat — clamps health to 100 maximum', () => {
    const result = applyEffect({ type: 'modify_stat', key: 'health', value: 200 }, baseState);
    expect(result.health).toBe(100);
  });

  test('modify_stat — modifies gold', () => {
    const result = applyEffect({ type: 'modify_stat', key: 'gold', value: 10 }, baseState);
    expect(result.gold).toBe(30);
  });

  test('set_stat — sets health to exact value', () => {
    const result = applyEffect({ type: 'set_stat', key: 'health', value: 50 }, baseState);
    expect(result.health).toBe(50);
  });

  test('set_stat — clamps health when value out of range', () => {
    const over = applyEffect({ type: 'set_stat', key: 'health', value: 150 }, baseState);
    expect(over.health).toBe(100);
    const under = applyEffect({ type: 'set_stat', key: 'health', value: -10 }, baseState);
    expect(under.health).toBe(0);
  });

  test('set_stat — sets gold', () => {
    const result = applyEffect({ type: 'set_stat', key: 'gold', value: 5 }, baseState);
    expect(result.gold).toBe(5);
  });

  test('add_item — adds item to inventory', () => {
    const result = applyEffect({ type: 'add_item', key: 'shield' }, baseState);
    expect(result.inventory).toContain('shield');
    expect(result.inventory).toContain('sword');
  });

  test('add_item — does not duplicate existing item', () => {
    const result = applyEffect({ type: 'add_item', key: 'sword' }, baseState);
    expect(result.inventory.filter(i => i === 'sword').length).toBe(1);
  });

  test('remove_item — removes item from inventory', () => {
    const result = applyEffect({ type: 'remove_item', key: 'sword' }, baseState);
    expect(result.inventory).not.toContain('sword');
  });

  test('remove_item — no-op when item absent', () => {
    const result = applyEffect({ type: 'remove_item', key: 'bow' }, baseState);
    expect(result.inventory).toEqual(baseState.inventory);
  });

  test('state immutability — original state not mutated', () => {
    const original = { ...baseState, inventory: [...baseState.inventory], flags: { ...baseState.flags } };
    applyEffect({ type: 'add_item', key: 'shield' }, baseState);
    applyEffect({ type: 'set_flag', key: 'brave', value: false }, baseState);
    applyEffect({ type: 'modify_stat', key: 'health', value: -50 }, baseState);
    expect(baseState).toEqual(original);
  });

  test('applyEffects — chains multiple effects', () => {
    const effects: Effect[] = [
      { type: 'modify_stat', key: 'health', value: -10 },
      { type: 'add_item', key: 'shield' },
      { type: 'set_flag', key: 'brave', value: false },
    ];
    const result = applyEffects(effects, baseState);
    expect(result.health).toBe(60);
    expect(result.inventory).toContain('shield');
    expect(result.flags.brave).toBe(false);
  });
});

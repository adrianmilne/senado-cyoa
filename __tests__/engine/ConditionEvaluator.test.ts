import { evaluateCondition, evaluateConditions } from '../../src/engine/ConditionEvaluator';
import { GameState, Condition } from '../../src/models';

const baseState: GameState = {
  health: 70,
  gold: 20,
  inventory: ['sword', 'shield'],
  flags: { brave: true, coward: false },
  currentSceneId: 'scene_1',
  visitedScenes: ['scene_0', 'scene_1'],
};

describe('ConditionEvaluator', () => {
  test('flag_is_true — true when flag is true', () => {
    expect(evaluateCondition({ type: 'flag_is_true', key: 'brave' }, baseState)).toBe(true);
  });

  test('flag_is_true — false when flag is false', () => {
    expect(evaluateCondition({ type: 'flag_is_true', key: 'coward' }, baseState)).toBe(false);
  });

  test('flag_is_true — false when flag is absent', () => {
    expect(evaluateCondition({ type: 'flag_is_true', key: 'unknown' }, baseState)).toBe(false);
  });

  test('flag_is_false — true when flag is false', () => {
    expect(evaluateCondition({ type: 'flag_is_false', key: 'coward' }, baseState)).toBe(true);
  });

  test('flag_is_false — true when flag is absent', () => {
    expect(evaluateCondition({ type: 'flag_is_false', key: 'unknown' }, baseState)).toBe(true);
  });

  test('flag_is_false — false when flag is true', () => {
    expect(evaluateCondition({ type: 'flag_is_false', key: 'brave' }, baseState)).toBe(false);
  });

  test('has_item — true when item in inventory', () => {
    expect(evaluateCondition({ type: 'has_item', key: 'sword' }, baseState)).toBe(true);
  });

  test('has_item — false when item not in inventory', () => {
    expect(evaluateCondition({ type: 'has_item', key: 'bow' }, baseState)).toBe(false);
  });

  test('not_has_item — true when item absent', () => {
    expect(evaluateCondition({ type: 'not_has_item', key: 'bow' }, baseState)).toBe(true);
  });

  test('not_has_item — false when item present', () => {
    expect(evaluateCondition({ type: 'not_has_item', key: 'sword' }, baseState)).toBe(false);
  });

  test('stat_greater_than — true when health > threshold', () => {
    expect(evaluateCondition({ type: 'stat_greater_than', key: 'health', value: 50 }, baseState)).toBe(true);
  });

  test('stat_greater_than — false when health <= threshold', () => {
    expect(evaluateCondition({ type: 'stat_greater_than', key: 'health', value: 70 }, baseState)).toBe(false);
  });

  test('stat_less_than — true when health < threshold', () => {
    expect(evaluateCondition({ type: 'stat_less_than', key: 'health', value: 100 }, baseState)).toBe(true);
  });

  test('stat_less_than — false when health >= threshold', () => {
    expect(evaluateCondition({ type: 'stat_less_than', key: 'health', value: 70 }, baseState)).toBe(false);
  });

  test('stat_greater_than — works for gold', () => {
    expect(evaluateCondition({ type: 'stat_greater_than', key: 'gold', value: 10 }, baseState)).toBe(true);
  });

  test('scene_visited — true when scene was visited', () => {
    expect(evaluateCondition({ type: 'scene_visited', key: 'scene_0' }, baseState)).toBe(true);
  });

  test('scene_visited — false when scene not visited', () => {
    expect(evaluateCondition({ type: 'scene_visited', key: 'scene_99' }, baseState)).toBe(false);
  });

  test('scene_not_visited — true when scene not visited', () => {
    expect(evaluateCondition({ type: 'scene_not_visited', key: 'scene_99' }, baseState)).toBe(true);
  });

  test('scene_not_visited — false when scene was visited', () => {
    expect(evaluateCondition({ type: 'scene_not_visited', key: 'scene_0' }, baseState)).toBe(false);
  });

  test('evaluateConditions — all must pass', () => {
    const conditions: Condition[] = [
      { type: 'flag_is_true', key: 'brave' },
      { type: 'has_item', key: 'sword' },
    ];
    expect(evaluateConditions(conditions, baseState)).toBe(true);
  });

  test('evaluateConditions — fails if any condition fails', () => {
    const conditions: Condition[] = [
      { type: 'flag_is_true', key: 'brave' },
      { type: 'has_item', key: 'bow' },
    ];
    expect(evaluateConditions(conditions, baseState)).toBe(false);
  });

  test('evaluateConditions — empty conditions always pass', () => {
    expect(evaluateConditions([], baseState)).toBe(true);
  });
});

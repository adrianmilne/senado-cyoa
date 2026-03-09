import { Condition, GameState } from '../models';

export function evaluateCondition(condition: Condition, state: GameState): boolean {
  switch (condition.type) {
    case 'flag_is_true':
      return state.flags[condition.key] === true;

    case 'flag_is_false':
      return state.flags[condition.key] !== true;

    case 'has_item':
      return state.inventory.includes(condition.key);

    case 'not_has_item':
      return !state.inventory.includes(condition.key);

    case 'stat_greater_than': {
      const statValue = getStat(state, condition.key);
      return statValue !== undefined && statValue > (condition.value as number);
    }

    case 'stat_less_than': {
      const statValue = getStat(state, condition.key);
      return statValue !== undefined && statValue < (condition.value as number);
    }

    case 'scene_visited':
      return state.visitedScenes.includes(condition.key);

    case 'scene_not_visited':
      return !state.visitedScenes.includes(condition.key);

    default:
      return false;
  }
}

export function evaluateConditions(conditions: Condition[], state: GameState): boolean {
  return conditions.every(c => evaluateCondition(c, state));
}

function getStat(state: GameState, key: string): number | undefined {
  if (key === 'health') return state.health;
  if (key === 'gold') return state.gold;
  return undefined;
}

import { Effect, GameState } from '../models';

const HEALTH_MIN = 0;
const HEALTH_MAX = 100;

export function applyEffect(effect: Effect, state: GameState): GameState {
  switch (effect.type) {
    case 'set_flag':
      return {
        ...state,
        flags: { ...state.flags, [effect.key]: effect.value as boolean },
      };

    case 'modify_stat': {
      const delta = effect.value as number;
      if (effect.key === 'health') {
        return { ...state, health: clampHealth(state.health + delta) };
      }
      if (effect.key === 'gold') {
        return { ...state, gold: state.gold + delta };
      }
      return state;
    }

    case 'set_stat': {
      const val = effect.value as number;
      if (effect.key === 'health') {
        return { ...state, health: clampHealth(val) };
      }
      if (effect.key === 'gold') {
        return { ...state, gold: val };
      }
      return state;
    }

    case 'add_item':
      if (state.inventory.includes(effect.key)) return state;
      return { ...state, inventory: [...state.inventory, effect.key] };

    case 'remove_item':
      return {
        ...state,
        inventory: state.inventory.filter(item => item !== effect.key),
      };

    default:
      return state;
  }
}

export function applyEffects(effects: Effect[], state: GameState): GameState {
  return effects.reduce((s, effect) => applyEffect(effect, s), state);
}

function clampHealth(value: number): number {
  return Math.min(HEALTH_MAX, Math.max(HEALTH_MIN, value));
}

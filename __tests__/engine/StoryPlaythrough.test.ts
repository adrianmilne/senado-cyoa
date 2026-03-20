import { applyEffects } from '../../src/engine/EffectProcessor';
import { evaluateConditions } from '../../src/engine/ConditionEvaluator';
import { Story, GameState, Scene } from '../../src/models';
import { store, startStory, makeChoice as makeChoiceAction, retryFromScene } from '../../src/engine/StateManager';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const testStory: Story = require('../../assets/stories/test_story/story.json') as Story;

function buildInitialState(story: Story): GameState {
  return {
    health: story.stateSchema.health.initial,
    gold: story.stateSchema.gold.initial,
    inventory: [],
    flags: { ...story.stateSchema.flags },
    currentSceneId: story.startScene,
    visitedScenes: [story.startScene],
  };
}

function applyEntryAndHealthCheck(
  scene: Scene,
  state: GameState,
  story: Story,
): { state: GameState; redirected: string | null } {
  let s = applyEffects(scene.effectsOnEntry, state);
  if (scene.type === 'combat' && scene.healthCheck) {
    const { stat, threshold, failScene } = scene.healthCheck;
    const val = stat === 'health' ? s.health : s.gold;
    if (val <= threshold) {
      const fail = story.scenes[failScene];
      s = applyEffects(fail.effectsOnEntry, s);
      s = { ...s, currentSceneId: failScene, visitedScenes: [...s.visitedScenes, failScene] };
      return { state: s, redirected: failScene };
    }
  }
  return { state: s, redirected: null };
}

function deathTransition(gs: GameState, story: Story): GameState | null {
  const deathSceneId = story.defaultDeathSceneId;
  if (!deathSceneId || !story.scenes[deathSceneId]) return null;
  if (story.scenes[gs.currentSceneId]?.type === 'ending') return null;
  const deathScene = story.scenes[deathSceneId];
  const next = applyEffects(deathScene.effectsOnEntry, gs);
  return {
    ...next,
    currentSceneId: deathSceneId,
    visitedScenes: next.visitedScenes.includes(deathSceneId)
      ? next.visitedScenes
      : [...next.visitedScenes, deathSceneId],
  };
}

function makeChoice(story: Story, gs: GameState, choiceId: string): GameState {
  const scene = story.scenes[gs.currentSceneId];
  const choice = scene.choices.find(c => c.id === choiceId)!;

  expect(evaluateConditions(choice.conditions, gs)).toBe(true);

  let next = applyEffects(choice.effects, gs);

  // Global death check after choice effects
  if (next.health <= 0) {
    return deathTransition(next, story) ?? next;
  }

  const nextScene = story.scenes[choice.nextScene];
  next = {
    ...next,
    currentSceneId: choice.nextScene,
    visitedScenes: [...next.visitedScenes, choice.nextScene],
  };
  const { state, redirected } = applyEntryAndHealthCheck(nextScene, next, story);

  // Global death check after entry effects (if healthCheck didn't already redirect)
  if (!redirected && state.health <= 0) {
    return deathTransition(state, story) ?? state;
  }
  return state;
}

describe('test_story — knife path to good ending', () => {
  let gs: GameState;

  beforeEach(() => {
    gs = buildInitialState(testStory);
  });

  test('full knife path reaches good_ending', () => {
    // start → item_scene
    gs = makeChoice(testStory, gs, 'to_item_scene');
    expect(gs.currentSceneId).toBe('item_scene');
    expect(gs.flags.flag_a).toBe(true);
    expect(gs.inventory).toContain('hunting_knife');

    // item_scene → conditional_scene
    gs = makeChoice(testStory, gs, 'to_conditional_scene');
    expect(gs.currentSceneId).toBe('conditional_scene');

    // hidden_choice should be available (has knife)
    const condScene = testStory.scenes.conditional_scene;
    const hiddenChoice = condScene.choices.find(c => c.id === 'hidden_choice')!;
    expect(evaluateConditions(hiddenChoice.conditions, gs)).toBe(true);

    // conditional_scene → good_ending via knife
    gs = makeChoice(testStory, gs, 'hidden_choice');
    expect(gs.currentSceneId).toBe('good_ending');
    expect(testStory.scenes.good_ending.endingType).toBe('good');
  });
});

describe('test_story — combat path to death ending', () => {
  let gs: GameState;

  beforeEach(() => {
    gs = buildInitialState(testStory);
  });

  test('combat path from start (no knife) redirects to death_ending', () => {
    // start → item_scene (to get to conditional with knife still available)
    gs = makeChoice(testStory, gs, 'to_item_scene');
    gs = makeChoice(testStory, gs, 'to_conditional_scene');

    // Force the door (always_visible) — health drops by 30 first
    gs = makeChoice(testStory, gs, 'always_visible');
    // health was 100 - 30 = 70 after choice effect, then combat entry: -80 = -10 → clamped 0
    // healthCheck threshold is 0: health(0) <= 0 → redirects to death_ending
    expect(gs.currentSceneId).toBe('death_ending');
    expect(testStory.scenes.death_ending.endingType).toBe('death');
    expect(gs.health).toBe(0);
  });

  test('death_ending has retry option pointing to start', () => {
    const deathScene = testStory.scenes.death_ending;
    expect(deathScene.retryOptions?.allowRetry).toBe(true);
    expect(deathScene.retryOptions?.retryFromScene).toBe('start');
  });
});

describe('global death redirect — defaultDeathSceneId', () => {
  const miniStory: Story = {
    id: 'mini',
    title: 'Mini',
    author: 'Test',
    version: '1.0.0',
    description: '',
    coverImage: '',
    startScene: 'start',
    defaultDeathSceneId: 'dead',
    stateSchema: { health: { initial: 20, min: 0, max: 100 }, gold: { initial: 0 }, flags: {} },
    scenes: {
      start: {
        id: 'start', type: 'normal', title: 'Start', text: '',
        effectsOnEntry: [], choices: [
          { id: 'to_trap', text: 'Go', nextScene: 'trap', conditions: [], effects: [] },
          { id: 'to_lethal', text: 'Lethal', nextScene: 'normal_scene', conditions: [],
            effects: [{ type: 'modify_stat', key: 'health', value: -100 }] },
        ],
      },
      trap: {
        id: 'trap', type: 'normal', title: 'Trap', text: '',
        effectsOnEntry: [{ type: 'modify_stat', key: 'health', value: -100 }],
        choices: [],
      },
      normal_scene: {
        id: 'normal_scene', type: 'normal', title: 'Normal', text: '',
        effectsOnEntry: [], choices: [],
      },
      dead: {
        id: 'dead', type: 'ending', endingType: 'death', title: 'Dead', text: '',
        effectsOnEntry: [], choices: [],
      },
    },
    itemsRegistry: {},
    imageConfig: { basePath: '', format: 'png', fallbackImage: '' },
  };

  test('entry effects on a normal scene that drain health to 0 redirect to defaultDeathSceneId', () => {
    const gs = buildInitialState(miniStory);
    const result = makeChoice(miniStory, gs, 'to_trap');
    expect(result.currentSceneId).toBe('dead');
    expect(result.health).toBe(0);
  });

  test('choice effects that drain health to 0 redirect before navigating', () => {
    const gs = buildInitialState(miniStory);
    const result = makeChoice(miniStory, gs, 'to_lethal');
    // Should redirect to dead, not normal_scene
    expect(result.currentSceneId).toBe('dead');
    expect(result.health).toBe(0);
  });

  test('death redirect does not fire when already on an ending scene', () => {
    // Simulate being on the dead scene already — deathTransition should return null
    const gs = { ...buildInitialState(miniStory), currentSceneId: 'dead', health: 0 };
    expect(deathTransition(gs, miniStory)).toBeNull();
  });
});

describe('retryFromScene — full state reset', () => {
  test('retryFromScene resets health, gold, flags and inventory to initial values', () => {
    // Play through to death: start → item_scene → conditional_scene → force door (health -30) → combat (-80 entry) → dead
    store.dispatch(startStory(testStory));
    store.dispatch(makeChoiceAction({ choiceId: 'to_item_scene' }));
    store.dispatch(makeChoiceAction({ choiceId: 'to_conditional_scene' }));
    store.dispatch(makeChoiceAction({ choiceId: 'always_visible' })); // triggers death_ending

    const afterDeath = store.getState().game.gameState!;
    expect(afterDeath.currentSceneId).toBe('death_ending');
    expect(afterDeath.health).toBe(0);
    expect(afterDeath.inventory).toContain('hunting_knife');

    // Retry from start
    store.dispatch(retryFromScene({ sceneId: 'start' }));

    const afterRetry = store.getState().game.gameState!;
    expect(afterRetry.currentSceneId).toBe('start');
    expect(afterRetry.health).toBe(testStory.stateSchema.health.initial);
    expect(afterRetry.gold).toBe(testStory.stateSchema.gold.initial);
    expect(afterRetry.inventory).toEqual([]);
    expect(afterRetry.flags).toEqual({});
  });

  test('retryFromScene resets visitedScenes to only the retry scene', () => {
    store.dispatch(startStory(testStory));
    store.dispatch(makeChoiceAction({ choiceId: 'to_item_scene' }));
    store.dispatch(makeChoiceAction({ choiceId: 'to_conditional_scene' }));
    store.dispatch(makeChoiceAction({ choiceId: 'always_visible' }));

    store.dispatch(retryFromScene({ sceneId: 'start' }));

    const gs = store.getState().game.gameState!;
    expect(gs.visitedScenes).toEqual(['start']);
  });
});

describe('state immutability', () => {
  test('original state is never mutated through a playthrough', () => {
    const gs = buildInitialState(testStory);
    const snapshot = JSON.parse(JSON.stringify(gs)) as GameState;

    let current = gs;
    current = makeChoice(testStory, current, 'to_item_scene');
    current = makeChoice(testStory, current, 'to_conditional_scene');
    current = makeChoice(testStory, current, 'hidden_choice');

    expect(gs).toEqual(snapshot);
    expect(current.currentSceneId).toBe('good_ending');
  });
});

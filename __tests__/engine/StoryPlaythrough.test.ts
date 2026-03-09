import { applyEffects } from '../../src/engine/EffectProcessor';
import { evaluateConditions } from '../../src/engine/ConditionEvaluator';
import { Story, GameState, Scene } from '../../src/models';

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

function makeChoice(story: Story, gs: GameState, choiceId: string): GameState {
  const scene = story.scenes[gs.currentSceneId];
  const choice = scene.choices.find(c => c.id === choiceId)!;

  expect(evaluateConditions(choice.conditions, gs)).toBe(true);

  let next = applyEffects(choice.effects, gs);
  const nextScene = story.scenes[choice.nextScene];
  next = {
    ...next,
    currentSceneId: choice.nextScene,
    visitedScenes: [...next.visitedScenes, choice.nextScene],
  };
  const { state } = applyEntryAndHealthCheck(nextScene, next, story);
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

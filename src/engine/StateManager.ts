import { createSlice, PayloadAction, configureStore, current } from '@reduxjs/toolkit';
import { GameState, Story, Scene } from '../models';
import { applyEffects } from './EffectProcessor';
import { SaveService } from '../services/SaveService';

interface GameSliceState {
  story: Story | null;
  gameState: GameState | null;
  isLoading: boolean;
}

const initialSliceState: GameSliceState = {
  story: null,
  gameState: null,
  isLoading: false,
};

function freshGameState(story: Story): GameState {
  return {
    health: story.stateSchema.health.initial,
    gold: story.stateSchema.gold.initial,
    inventory: [],
    flags: {},
    currentSceneId: story.startScene,
    visitedScenes: [],
  };
}

function transitionToDeath(gs: GameState, story: Story): GameState | null {
  const deathSceneId = story.defaultDeathSceneId;
  if (!deathSceneId || !story.scenes[deathSceneId]) return null;
  // Don't redirect if already on an ending scene (covers the death scene itself)
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

function applyEntryEffectsAndHealthCheck(
  scene: Scene,
  state: GameState,
  story: Story,
): { gameState: GameState; redirectSceneId: string | null } {
  let next = applyEffects(scene.effectsOnEntry, state);

  if (scene.type === 'combat' && scene.healthCheck) {
    const { stat, threshold, failScene } = scene.healthCheck;
    const statValue = stat === 'health' ? next.health : stat === 'gold' ? next.gold : 0;
    if (statValue <= threshold) {
      const failSceneObj = story.scenes[failScene];
      if (failSceneObj) {
        next = applyEffects(failSceneObj.effectsOnEntry, next);
        next = {
          ...next,
          currentSceneId: failScene,
          visitedScenes: next.visitedScenes.includes(failScene)
            ? next.visitedScenes
            : [...next.visitedScenes, failScene],
        };
        return { gameState: next, redirectSceneId: failScene };
      }
    }
  }

  return { gameState: next, redirectSceneId: null };
}

const gameSlice = createSlice({
  name: 'game',
  initialState: initialSliceState,
  reducers: {
    startStory(state, action: PayloadAction<Story>) {
      const story = action.payload;
      const gs = freshGameState(story);
      const startScene = story.scenes[story.startScene];
      let gameState = applyEffects(startScene?.effectsOnEntry ?? [], gs);
      gameState = {
        ...gameState,
        currentSceneId: story.startScene,
        visitedScenes: [story.startScene],
      };
      state.story = story;
      state.gameState = gameState;
    },

    makeChoice(state, action: PayloadAction<{ choiceId: string }>) {
      if (!state.story || !state.gameState) return;

      const currentScene = state.story.scenes[state.gameState.currentSceneId];
      if (!currentScene) return;

      const choice = currentScene.choices.find(c => c.id === action.payload.choiceId);
      if (!choice) return;

      // Apply choice effects
      let gs = applyEffects(choice.effects, state.gameState);

      // Death check: choice effect drained health on any scene type
      if (gs.health <= 0) {
        const dead = transitionToDeath(gs, state.story);
        if (dead) {
          state.gameState = dead;
          if (state.story) SaveService.save(state.story.id, dead).catch(() => {});
          return;
        }
      }

      // Navigate to next scene
      const nextScene = state.story.scenes[choice.nextScene];
      if (!nextScene) return;

      gs = {
        ...gs,
        currentSceneId: choice.nextScene,
        visitedScenes: gs.visitedScenes.includes(choice.nextScene)
          ? gs.visitedScenes
          : [...gs.visitedScenes, choice.nextScene],
      };

      // Apply entry effects and combat healthCheck
      const { gameState: finalGs, redirectSceneId } = applyEntryEffectsAndHealthCheck(
        nextScene,
        gs,
        state.story,
      );

      // Death check: entry effects drained health (only if healthCheck didn't already redirect)
      if (!redirectSceneId && finalGs.health <= 0) {
        state.gameState = transitionToDeath(finalGs, state.story) ?? finalGs;
      } else {
        state.gameState = finalGs;
      }

      // Auto-save (fire and forget)
      if (state.story) {
        SaveService.save(state.story.id, state.gameState as GameState).catch(() => {});
      }
    },

    restartStory(state) {
      if (!state.story) return;
      const story = current(state.story);
      const gs = freshGameState(story);
      const startScene = story.scenes[story.startScene];
      let gameState = applyEffects(startScene?.effectsOnEntry ?? [], gs);
      gameState = {
        ...gameState,
        currentSceneId: story.startScene,
        visitedScenes: [story.startScene],
      };
      state.gameState = gameState;
      SaveService.deleteSave(story.id).catch(() => {});
    },

    resumeSave(state, action: PayloadAction<{ story: Story; savedState: GameState }>) {
      state.story = action.payload.story;
      state.gameState = action.payload.savedState;
    },

    retryFromScene(state, action: PayloadAction<{ sceneId: string }>) {
      if (!state.story) return;
      const story = current(state.story);
      const sceneId = action.payload.sceneId;
      const scene = story.scenes[sceneId];
      if (!scene) return;
      // Full reset — never carry stale health/inventory/flags from a previous run
      const gs = freshGameState(story);
      let gameState = applyEffects(scene.effectsOnEntry, gs);
      gameState = {
        ...gameState,
        currentSceneId: sceneId,
        visitedScenes: [sceneId],
      };
      state.gameState = gameState;
      SaveService.deleteSave(story.id).catch(() => {});
    },
  },
});

export const { startStory, makeChoice, restartStory, resumeSave, retryFromScene } =
  gameSlice.actions;

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

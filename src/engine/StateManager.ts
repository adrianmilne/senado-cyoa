import { createSlice, PayloadAction, configureStore } from '@reduxjs/toolkit';
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

function buildInitialGameState(story: Story): GameState {
  return {
    health: story.stateSchema.health.initial,
    gold: story.stateSchema.gold.initial,
    inventory: [],
    flags: { ...story.stateSchema.flags },
    currentSceneId: story.startScene,
    visitedScenes: [],
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
      const gs = buildInitialGameState(story);
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

      // Apply entry effects and health check
      const { gameState: finalGs } = applyEntryEffectsAndHealthCheck(
        nextScene,
        gs,
        state.story,
      );

      state.gameState = finalGs;

      // Auto-save (fire and forget)
      if (state.story) {
        SaveService.save(state.story.id, finalGs).catch(() => {});
      }
    },

    restartStory(state) {
      if (!state.story) return;
      const story = state.story;
      const gs = buildInitialGameState(story);
      const startScene = story.scenes[story.startScene];
      let gameState = applyEffects(startScene?.effectsOnEntry ?? [], gs);
      gameState = {
        ...gameState,
        currentSceneId: story.startScene,
        visitedScenes: [story.startScene],
      };
      state.gameState = gameState;
    },

    resumeSave(state, action: PayloadAction<{ story: Story; savedState: GameState }>) {
      state.story = action.payload.story;
      state.gameState = action.payload.savedState;
    },

    retryFromScene(state, action: PayloadAction<{ sceneId: string }>) {
      if (!state.story || !state.gameState) return;
      const scene = state.story.scenes[action.payload.sceneId];
      if (!scene) return;
      let gs = applyEffects(scene.effectsOnEntry, state.gameState);
      gs = {
        ...gs,
        currentSceneId: action.payload.sceneId,
        visitedScenes: gs.visitedScenes.includes(action.payload.sceneId)
          ? gs.visitedScenes
          : [...gs.visitedScenes, action.payload.sceneId],
      };
      state.gameState = gs;
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

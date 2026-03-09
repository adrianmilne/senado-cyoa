# CYOA Engine — Initial Build Prompt

## Project Overview
Build a Choose Your Own Adventure mobile app in React Native with 
TypeScript. The app reads stories from bundled JSON files and renders 
them through a reusable engine. No server required — everything is local.

## Folder Structure to Create
Create the following structure exactly:

src/
  models/
    Story.ts
    Scene.ts  
    Choice.ts
    GameState.ts
    Effect.ts
    Condition.ts
    index.ts (barrel exports)

  engine/
    ConditionEvaluator.ts
    EffectProcessor.ts
    StateManager.ts (Redux gameSlice + store)

  screens/
    HomeScreen.tsx
    StorySelectScreen.tsx
    SceneScreen.tsx

  widgets/
    SceneImage.tsx
    ChoiceButton.tsx
    StatsBar.tsx
    EndingPanel.tsx

  services/
    SaveService.ts
    SchemaValidator.ts

  navigation/
    AppNavigator.tsx

assets/
  stories/
    test_story/
      story.json
      images/ (empty folder with .gitkeep)
    forest_of_shadows/
      story.json  
      images/ (empty folder with .gitkeep)

__tests__/
  engine/
    ConditionEvaluator.test.ts
    EffectProcessor.test.ts
    StoryPlaythrough.test.ts
    SchemaValidator.test.ts

## Data Models
Use exactly these TypeScript interfaces:

// models/Condition.ts
export type ConditionType =
  | 'flag_is_true'
  | 'flag_is_false'
  | 'has_item'
  | 'not_has_item'
  | 'stat_greater_than'
  | 'stat_less_than'
  | 'scene_visited'
  | 'scene_not_visited';

export interface Condition {
  type: ConditionType;
  key: string;
  value?: unknown;
}

// models/Effect.ts
export type EffectType =
  | 'set_flag'
  | 'modify_stat'
  | 'set_stat'
  | 'add_item'
  | 'remove_item';

export interface Effect {
  type: EffectType;
  key: string;
  value?: unknown;
  displayName?: string;
}

// models/Scene.ts
import { Condition } from './Condition';
import { Effect } from './Effect';

export type SceneType = 'normal' | 'combat' | 'discovery' | 'ending';
export type EndingType = 'good' | 'neutral' | 'death';
export type ImagePosition = 'top' | 'bottom' | 'full_screen';

export interface SceneImage {
  file: string;
  altText: string;
  position: ImagePosition;
}

export interface HealthCheck {
  stat: string;
  threshold: number;
  failScene: string;
}

export interface RetryOptions {
  allowRetry: boolean;
  retryFromScene: string;
  retryLabel: string;
}

export interface Choice {
  id: string;
  text: string;
  nextScene: string;
  conditions: Condition[];
  effects: Effect[];
  hiddenIfConditionFails?: boolean;
  conditionFailMessage?: string;
}

export interface Scene {
  id: string;
  type: SceneType;
  title: string;
  text: string;
  image?: SceneImage;
  effectsOnEntry: Effect[];
  choices: Choice[];
  healthCheck?: HealthCheck;
  endingType?: EndingType;
  retryOptions?: RetryOptions;
}

// models/GameState.ts
export interface GameState {
  health: number;
  gold: number;
  inventory: string[];
  flags: Record<string, boolean>;
  currentSceneId: string;
  visitedScenes: string[];
}

// models/Item.ts
export interface ItemDefinition {
  id: string;
  displayName: string;
  description: string;
  image: string;
  stackable: boolean;
}

// models/Story.ts
import { Scene } from './Scene';
import { ItemDefinition } from './Item';

export interface StateSchema {
  health: { initial: number; min: number; max: number };
  gold: { initial: number };
  flags: Record<string, boolean>;
}

export interface ImageConfig {
  basePath: string;
  format: string;
  fallbackImage: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  version: string;
  description: string;
  coverImage: string;
  startScene: string;
  metadata?: {
    estimatedPlaytimeMinutes: number;
    difficulty: string;
    tags: string[];
  };
  stateSchema: StateSchema;
  scenes: Record<string, Scene>;
  itemsRegistry: Record<string, ItemDefinition>;
  imageConfig: ImageConfig;
}

// models/index.ts — barrel exports
export * from './Condition';
export * from './Effect';
export * from './Scene';
export * from './GameState';
export * from './Item';
export * from './Story';


## JSON Schema
Stories follow exactly this schema:

// assets/stories/test_story/story.json
{
  "story": {
    "id": "test_story",
    "title": "Engine Test Story",
    "startScene": "start"
  },
  "stateSchema": {
    "health": { "initial": 100, "min": 0, "max": 100 },
    "gold": { "initial": 10 },
    "flags": {
      "flag_a": false,
      "flag_b": false
    }
  },
  "scenes": {
    "start": {
      "id": "start",
      "type": "normal",
      "title": "Start",
      "text": "Beginning of test story",
      "effectsOnEntry": [],
      "choices": [
        {
          "id": "to_item_scene",
          "text": "Go to item scene",
          "nextScene": "item_scene",
          "conditions": [],
          "effects": [
            { "type": "set_flag", "key": "flag_a", "value": true }
          ]
        }
      ]
    },
    "item_scene": {
      "id": "item_scene",
      "type": "discovery",
      "title": "Item Scene",
      "text": "You find a knife",
      "effectsOnEntry": [
        { "type": "add_item", "key": "hunting_knife" }
      ],
      "choices": [
        {
          "id": "to_conditional_scene",
          "text": "Continue",
          "nextScene": "conditional_scene",
          "conditions": [],
          "effects": []
        }
      ]
    },
    "conditional_scene": {
      "id": "conditional_scene",
      "type": "normal",
      "title": "Conditional Scene",
      "text": "A locked door",
      "effectsOnEntry": [],
      "choices": [
        {
          "id": "hidden_choice",
          "text": "Use the knife",
          "nextScene": "good_ending",
          "conditions": [
            { "type": "has_item", "key": "hunting_knife" }
          ],
          "effects": [],
          "hiddenIfConditionFails": true
        },
        {
          "id": "always_visible",
          "text": "Force the door",
          "nextScene": "combat_scene",
          "conditions": [],
          "effects": [
            { "type": "modify_stat", "key": "health", "value": -30 }
          ]
        }
      ]
    },
    "combat_scene": {
      "id": "combat_scene",
      "type": "combat",
      "title": "Combat",
      "text": "You are attacked",
      "effectsOnEntry": [
        { "type": "modify_stat", "key": "health", "value": -80 }
      ],
      "healthCheck": {
        "stat": "health",
        "threshold": 0,
        "failScene": "death_ending"
      },
      "choices": [
        {
          "id": "survive",
          "text": "Survive",
          "nextScene": "good_ending",
          "conditions": [],
          "effects": []
        }
      ]
    },
    "good_ending": {
      "id": "good_ending",
      "type": "ending",
      "endingType": "good",
      "title": "Victory",
      "text": "You win",
      "effectsOnEntry": [],
      "choices": []
    },
    "death_ending": {
      "id": "death_ending",
      "type": "ending",
      "endingType": "death",
      "title": "Death",
      "text": "You die",
      "effectsOnEntry": [],
      "choices": [],
      "retryOptions": {
        "allowRetry": true,
        "retryFromScene": "start",
        "retryLabel": "Try Again"
      }
    }
  }
}

## Reference Test Story
The test_story/story.json should contain the reference story we defined,
which exercises:
- Normal scenes
- Discovery scenes with entry effects
- Combat scenes with health checks
- Conditional choices (hidden when condition fails)
- Flag setting and reading
- Item pickup and inventory conditions
- Good ending
- Death ending with retry option

## Engine Requirements
- ConditionEvaluator: evaluates all condition types against GameState
- EffectProcessor: processes all effect types, clamps health 0-100, 
  never mutates state
- Redux gameSlice: startStory, makeChoice, restartStory, resumeSave
  actions. makeChoice applies effects, navigates to next scene, applies 
  entry effects, checks health for combat scenes, auto-saves
- SaveService: AsyncStorage with save/load/delete/hasSave methods

## UI Requirements
- Dark fantasy theme throughout
- Background: #1A1A2E
- Accent/titles: #FFC107 (amber)
- Body text: rgba(255,255,255,0.75)
- Choice buttons: #2D2D44 background, amber border when enabled
- Disabled choices: dark background, grey text, show conditionFailMessage
- StatsBar: shows health bar, gold, inventory item count at top of screen
- SceneImage: renders above or below text based on position field,
  full screen for endings
- Smooth fade transition between scenes

## Navigation
Use React Navigation with a stack navigator:
- HomeScreen → StorySelectScreen → SceneScreen
- HomeScreen shows app title and "Begin Adventure" button
- StorySelectScreen lists available stories loaded from assets
- SceneScreen is the main game screen

## Tests
Write Jest tests for:
- All ConditionEvaluator condition types
- All EffectProcessor effect types including edge cases
- Full playthrough of test_story via knife path to good ending
- Full playthrough of test_story via combat path to death ending  
- State immutability — original state never mutated
- SchemaValidator catching broken scene references

## The forest_of_shadows story.json
Populate this with the first 8 scenes of the Forest of Shadows story,
covering the opening scene through to the first major branch point.
Use the test_story as a structural reference.

## Important
- Use React Navigation for navigation
- Use Redux Toolkit for state management
- Use AsyncStorage for save persistence
- TypeScript strict mode throughout
- No inline styles — StyleSheet.create for everything
- Barrel exports from models/index.ts
- Load stories from assets — no network calls

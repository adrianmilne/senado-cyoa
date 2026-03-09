# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React Native + TypeScript Choose Your Own Adventure app. Stories are bundled JSON files; no server required. See `PROMPT.md` for the full original specification.

## Commands

```bash
# Install dependencies
npm install

# Run on iOS / Android
npx expo start          # or: npx react-native run-ios / run-android

# Run all tests
npx jest

# Run a single test file
npx jest __tests__/engine/ConditionEvaluator.test.ts

# Type-check (npx tsc resolves incorrectly — use node directly)
node node_modules/typescript/bin/tsc --noEmit

# Lint
npx eslint src --ext .ts,.tsx
```

## Architecture

### Data flow
`assets/stories/<id>/story.json` → loaded at runtime → Redux `gameSlice` → screens render from store state.

### Key layers

| Layer | Path | Responsibility |
|---|---|---|
| Models | `src/models/` | TypeScript interfaces (barrel-exported from `index.ts`) |
| Engine | `src/engine/` | Pure logic: `ConditionEvaluator`, `EffectProcessor`, `StateManager` (Redux slice + store) |
| Screens | `src/screens/` | `HomeScreen` → `StorySelectScreen` → `SceneScreen` |
| Widgets | `src/widgets/` | `SceneImage`, `ChoiceButton`, `StatsBar`, `EndingPanel` |
| Services | `src/services/` | `SaveService` (AsyncStorage), `SchemaValidator` |
| Navigation | `src/navigation/AppNavigator.tsx` | Stack navigator wiring the three screens |

### Engine rules
- `EffectProcessor` must never mutate state — always return new objects.
- Health is clamped to `[stateSchema.health.min, stateSchema.health.max]`.
- `makeChoice` (Redux action) sequence: apply choice effects → navigate → apply `effectsOnEntry` → run `healthCheck` (combat scenes) → auto-save.
- `ConditionEvaluator` handles: `flag_is_true/false`, `has_item/not_has_item`, `stat_greater_than/less_than`, `scene_visited/not_visited`.

### Story JSON shape
Top-level keys: `story`, `stateSchema`, `scenes`, `itemsRegistry`, `imageConfig`. Scenes are a `Record<string, Scene>` keyed by scene id. `test_story` is the canonical reference — it exercises every engine feature.

### UI constants
- Background `#1A1A2E`, accent/titles `#FFC107`, body text `rgba(255,255,255,0.75)`, choice buttons `#2D2D44`.
- No inline styles — use `StyleSheet.create` everywhere.

### State management
Redux Toolkit `gameSlice` exposes: `startStory`, `makeChoice`, `restartStory`, `resumeSave`.

### Save persistence
`SaveService` wraps `@react-native-async-storage/async-storage` with `save / load / delete / hasSave`.

## Tests
Tests live in `__tests__/engine/`. Cover all condition/effect types, full knife-path and combat-path playthroughs of `test_story`, state immutability, and `SchemaValidator` catching broken scene references.

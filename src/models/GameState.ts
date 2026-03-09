export interface GameState {
  health: number;
  gold: number;
  inventory: string[];
  flags: Record<string, boolean>;
  currentSceneId: string;
  visitedScenes: string[];
}

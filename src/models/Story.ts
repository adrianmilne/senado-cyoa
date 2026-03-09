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

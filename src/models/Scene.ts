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

export interface SceneImagePrompt {
  subject?: string;
  mood?: string;
  shot?: string;
  exclude?: string;
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
  imagePrompt?: SceneImagePrompt;
  effectsOnEntry: Effect[];
  choices: Choice[];
  healthCheck?: HealthCheck;
  endingType?: EndingType;
  retryOptions?: RetryOptions;
}

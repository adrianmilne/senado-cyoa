import { Story } from '../models';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateStory(story: Story): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!story.id) errors.push({ field: 'id', message: 'Story must have an id' });
  if (!story.title) errors.push({ field: 'title', message: 'Story must have a title' });
  if (!story.startScene) {
    errors.push({ field: 'startScene', message: 'Story must have a startScene' });
  }
  if (!story.scenes || Object.keys(story.scenes).length === 0) {
    errors.push({ field: 'scenes', message: 'Story must have at least one scene' });
    return errors;
  }

  // Validate startScene exists
  if (story.startScene && !story.scenes[story.startScene]) {
    errors.push({
      field: 'startScene',
      message: `startScene "${story.startScene}" does not exist in scenes`,
    });
  }

  // Validate defaultDeathSceneId exists if set
  if (story.defaultDeathSceneId && !story.scenes[story.defaultDeathSceneId]) {
    errors.push({
      field: 'defaultDeathSceneId',
      message: `defaultDeathSceneId "${story.defaultDeathSceneId}" does not exist in scenes`,
    });
  }

  // Validate all scene references
  for (const [sceneId, scene] of Object.entries(story.scenes)) {
    for (const choice of scene.choices) {
      if (!story.scenes[choice.nextScene]) {
        errors.push({
          field: `scenes.${sceneId}.choices.${choice.id}.nextScene`,
          message: `nextScene "${choice.nextScene}" does not exist`,
        });
      }
    }

    if (scene.healthCheck && !story.scenes[scene.healthCheck.failScene]) {
      errors.push({
        field: `scenes.${sceneId}.healthCheck.failScene`,
        message: `failScene "${scene.healthCheck.failScene}" does not exist`,
      });
    }

    if (
      scene.retryOptions?.allowRetry &&
      !story.scenes[scene.retryOptions.retryFromScene]
    ) {
      errors.push({
        field: `scenes.${sceneId}.retryOptions.retryFromScene`,
        message: `retryFromScene "${scene.retryOptions.retryFromScene}" does not exist`,
      });
    }
  }

  return errors;
}

export function isValidStory(story: Story): boolean {
  return validateStory(story).length === 0;
}

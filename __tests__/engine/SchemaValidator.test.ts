import { validateStory, isValidStory } from '../../src/services/SchemaValidator';
import { Story } from '../../src/models';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const testStory: Story = require('../../assets/stories/test_story/story.json') as Story;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const forestStory: Story = require('../../assets/stories/forest_of_shadows/story.json') as Story;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mistStory: Story = require('../../assets/stories/the_mists_of_bravora/story.json') as Story;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const beastStory: Story = require('../../assets/stories/the_beast_of_blackridge/story.json') as Story;

function cloneStory(s: Story): Story {
  return JSON.parse(JSON.stringify(s)) as Story;
}

describe('SchemaValidator', () => {
  test('test_story passes validation', () => {
    expect(isValidStory(testStory)).toBe(true);
  });

  test('forest_of_shadows passes validation', () => {
    expect(isValidStory(forestStory)).toBe(true);
  });

  test('mist_of_bravora passes validation', () => {
    expect(isValidStory(mistStory)).toBe(true);
  });

  test('beast_of_blackridge passes validation', () => {
    expect(isValidStory(beastStory)).toBe(true);
  });

  test('missing id is caught', () => {
    const bad = cloneStory(testStory);
    bad.id = '';
    const errors = validateStory(bad);
    expect(errors.some(e => e.field === 'id')).toBe(true);
  });

  test('missing title is caught', () => {
    const bad = cloneStory(testStory);
    bad.title = '';
    const errors = validateStory(bad);
    expect(errors.some(e => e.field === 'title')).toBe(true);
  });

  test('startScene pointing to nonexistent scene is caught', () => {
    const bad = cloneStory(testStory);
    bad.startScene = 'nonexistent_scene';
    const errors = validateStory(bad);
    expect(errors.some(e => e.field === 'startScene')).toBe(true);
  });

  test('broken nextScene reference in choice is caught', () => {
    const bad = cloneStory(testStory);
    bad.scenes.start.choices[0].nextScene = 'ghost_scene';
    const errors = validateStory(bad);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.message.includes('ghost_scene'))).toBe(true);
  });

  test('broken healthCheck failScene is caught', () => {
    const bad = cloneStory(testStory);
    bad.scenes.combat_scene.healthCheck!.failScene = 'ghost_scene';
    const errors = validateStory(bad);
    expect(errors.some(e => e.message.includes('ghost_scene'))).toBe(true);
  });

  test('broken retryFromScene is caught', () => {
    const bad = cloneStory(testStory);
    bad.scenes.death_ending.retryOptions!.retryFromScene = 'ghost_scene';
    const errors = validateStory(bad);
    expect(errors.some(e => e.message.includes('ghost_scene'))).toBe(true);
  });

  test('empty scenes object is caught', () => {
    const bad = cloneStory(testStory);
    bad.scenes = {};
    const errors = validateStory(bad);
    expect(errors.some(e => e.field === 'scenes')).toBe(true);
  });
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../models';

const KEY_PREFIX = 'cyoa_save_';

export const SaveService = {
  async save(storyId: string, state: GameState): Promise<void> {
    await AsyncStorage.setItem(KEY_PREFIX + storyId, JSON.stringify(state));
  },

  async load(storyId: string): Promise<GameState | null> {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + storyId);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  },

  async deleteSave(storyId: string): Promise<void> {
    await AsyncStorage.removeItem(KEY_PREFIX + storyId);
  },

  async hasSave(storyId: string): Promise<boolean> {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + storyId);
    return raw !== null;
  },
};
